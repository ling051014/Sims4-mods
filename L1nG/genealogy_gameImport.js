/*
 * L1nG Genealogy Game Bundle Importer v0.2
 * 對應 L1nG Genealogy Exporter schemaVersion 1。
 *
 * 第一版 exporter 使用 ZIP_STORED，因此這裡不需要第三方 ZIP 函式庫。
 * 未來若改用 DEFLATE，請升級 parser，不要靜默接受未知壓縮方式。
 */
(function (global) {
  'use strict';

  const FORMAT = 'l1ng-genealogy';
  const SUPPORTED_SCHEMA = 1;

  function u16(view, offset) { return view.getUint16(offset, true); }
  function u32(view, offset) { return view.getUint32(offset, true); }

  function decodeUtf8(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  function readStoredZip(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const files = new Map();
    let offset = 0;

    while (offset + 4 <= bytes.length) {
      const signature = u32(view, offset);
      if (signature === 0x04034b50) {
        if (offset + 30 > bytes.length) throw new Error('ZIP local header 不完整。');
        const flags = u16(view, offset + 6);
        const method = u16(view, offset + 8);
        const compressedSize = u32(view, offset + 18);
        const uncompressedSize = u32(view, offset + 22);
        const nameLength = u16(view, offset + 26);
        const extraLength = u16(view, offset + 28);
        if (flags & 0x0008) throw new Error('目前不支援使用 data descriptor 的 ZIP。');
        if (method !== 0) throw new Error(`此遊戲匯出 ZIP 使用了尚未支援的壓縮方式：${method}`);

        const nameStart = offset + 30;
        const nameEnd = nameStart + nameLength;
        const dataStart = nameEnd + extraLength;
        const dataEnd = dataStart + compressedSize;
        if (dataEnd > bytes.length) throw new Error('ZIP 檔案資料不完整。');

        const name = decodeUtf8(bytes.slice(nameStart, nameEnd));
        const content = bytes.slice(dataStart, dataEnd);
        if (content.length !== uncompressedSize) throw new Error(`ZIP 項目大小不一致：${name}`);
        files.set(name, content);
        offset = dataEnd;
        continue;
      }
      // Central directory / EOCD：local entries 已讀完即可停止。
      if (signature === 0x02014b50 || signature === 0x06054b50) break;
      throw new Error(`無法識別 ZIP 結構（offset ${offset}）。`);
    }

    return files;
  }

  function parseJsonFile(files, name) {
    const bytes = files.get(name);
    if (!bytes) throw new Error(`遊戲匯出缺少 ${name}`);
    return JSON.parse(decodeUtf8(bytes));
  }

  function parseBundle(arrayBuffer) {
    const files = readStoredZip(arrayBuffer);
    const manifest = parseJsonFile(files, 'manifest.json');
    const genealogy = parseJsonFile(files, 'genealogy.json');

    if (manifest.format !== FORMAT) throw new Error('這不是 L1nG Genealogy 遊戲匯出檔。');
    if (Number(manifest.schemaVersion) !== SUPPORTED_SCHEMA) {
      throw new Error(`目前網站不支援 schemaVersion ${manifest.schemaVersion}。`);
    }

    return { manifest, genealogy, files };
  }

  // ========【遊戲頭像讀取】 設定 - 從遊戲匯出 ZIP 依 Sim ID 配對人物圖片 ========
  function imageMimeType(path, bytes) {
    const lower = String(path || '').toLowerCase();

    if (bytes && bytes.length >= 8 &&
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
        bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
      return 'image/png';
    }

    if (bytes && bytes.length >= 3 &&
        bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }

    if (bytes && bytes.length >= 2 &&
        bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return 'image/bmp';
    }

    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.bmp')) return 'image/bmp';

    return '';
  }

  function bytesToDataUrl(bytes, mimeType) {
    if (!bytes || !bytes.length || !mimeType) return null;

    const chunkSize = 0x8000;
    let binary = '';

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, chunk);
    }

    return `data:${mimeType};base64,${btoa(binary)}`;
  }

  function explicitAvatarPaths(sim) {
    if (!sim || typeof sim !== 'object') return [];

    const values = [
      sim.avatarPath,
      sim.portraitPath,
      sim.avatar && sim.avatar.path,
      sim.portrait && sim.portrait.path
    ];

    return values
      .filter(value => typeof value === 'string' && value.trim())
      .map(value => value.replace(/^\.\//, '').replace(/\\/g, '/'));
  }

  function findSimAvatarPath(files, simId, sim) {
    if (!files || !simId) return null;

    const id = String(simId);
    const candidates = [
      ...explicitAvatarPaths(sim),
      `avatars/${id}.png`,
      `avatars/${id}.jpg`,
      `avatars/${id}.jpeg`,
      `avatars/${id}.bmp`
    ];

    for (const candidate of candidates) {
      if (files.has(candidate)) return candidate;
    }

    return null;
  }

  function getSimAvatarAsset(bundle, simId, sim) {
    if (!bundle || !bundle.files) return null;

    const path = findSimAvatarPath(bundle.files, simId, sim);
    if (!path) return null;

    const bytes = bundle.files.get(path);
    const mimeType = imageMimeType(path, bytes);

    // DDS / 未知格式保留在 ZIP，但瀏覽器不直接當作人物頭像載入。
    if (!mimeType) {
      return {
        path,
        mimeType: null,
        dataUrl: null,
        byteLength: bytes ? bytes.length : 0,
        supported: false
      };
    }

    return {
      path,
      mimeType,
      dataUrl: bytesToDataUrl(bytes, mimeType),
      byteLength: bytes.length,
      supported: true
    };
  }

  function enumKey(value) {
    if (!value) return '';
    return String(value.key || value.label || value.value || '');
  }

  function mapGender(value) {
    const key = enumKey(value).toLowerCase();
    if (key.includes('female')) return '女';
    if (key.includes('male')) return '男';
    return '其他';
  }

  function mapLifeStage(value) {
    const key = enumKey(value).toLowerCase();
    const table = [
      ['baby', '新生兒'], ['infant', '嬰兒'], ['toddler', '幼兒'],
      ['child', '兒童'], ['teen', '青少年'], ['youngadult', '青年'],
      ['young_adult', '青年'], ['adult', '成年'], ['elder', '老年']
    ];
    for (const [needle, label] of table) if (key.includes(needle)) return label;
    return key || '';
  }

  function mapSpecies(value) {
    const key = enumKey(value).toLowerCase();
    if (key.includes('human')) return '人類';
    if (key.includes('dog')) return '狗';
    if (key.includes('cat')) return '貓';
    if (key.includes('horse')) return '馬';
    if (key.includes('fox')) return '狐狸';
    return key || '';
  }

  function mapStatus(sim) {
    if (sim && sim.death && sim.death.isGhost) return '幽靈';
    if (sim && sim.death && sim.death.isDead) return '已故';
    return '在世';
  }

  function internalLabel(item) {
    if (!item) return '';
    return item.localizedName || item.displayName || item.internalName || item.tuningId || '';
  }

  function relationshipArrays(sim) {
    const rel = (sim && sim.relations) || {};
    return {
      parentIds: Array.isArray(rel.parentIds) ? rel.parentIds.map(String) : [],
      spouseIds: Array.isArray(rel.spouseIds) ? rel.spouseIds.map(String) : [],
      exSpouseIds: Array.isArray(rel.exSpouseIds) ? rel.exSpouseIds.map(String) : [],
      adoptedParentIds: Array.isArray(rel.adoptedParentIds) ? rel.adoptedParentIds.map(String) : []
    };
  }

  function connectedComponents(sims) {
    const ids = Object.keys(sims);
    const adjacency = new Map(ids.map(id => [id, new Set()]));

    // 只用父母/子女（含領養）作為核心家族連通依據。
    for (const [id, sim] of Object.entries(sims)) {
      const rel = (sim && sim.relations) || {};
      const related = []
        .concat(rel.parentIds || [])
        .concat(rel.childIds || []);
      for (const raw of related) {
        const other = String(raw);
        if (!adjacency.has(other)) continue;
        adjacency.get(id).add(other);
        adjacency.get(other).add(id);
      }
    }

    const seen = new Set();
    const components = [];
    for (const start of ids) {
      if (seen.has(start)) continue;
      const stack = [start];
      const component = [];
      seen.add(start);
      while (stack.length) {
        const id = stack.pop();
        component.push(id);
        for (const other of adjacency.get(id) || []) {
          if (!seen.has(other)) {
            seen.add(other);
            stack.push(other);
          }
        }
      }
      components.push(component);
    }
    return components;
  }

  function addDirectPartners(component, sims) {
    const result = new Set(component);
    for (const id of component) {
      const rel = (sims[id] && sims[id].relations) || {};
      for (const other of [].concat(rel.spouseIds || [], rel.fianceIds || [], rel.steadyPartnerIds || [])) {
        if (sims[String(other)]) result.add(String(other));
      }
    }
    return [...result];
  }

  function familyName(memberIds, sims, index) {
    const counts = new Map();
    for (const id of memberIds) {
      const last = sims[id] && sims[id].name && String(sims[id].name.last || '').trim();
      if (!last) continue;
      counts.set(last, (counts.get(last) || 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return sorted.length ? `${sorted[0][0]}家族` : `遊戲家族 ${index + 1}`;
  }

  function stableFamilyId(memberIds) {
    const input = [...memberIds].sort().join('|');
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `game_${(hash >>> 0).toString(16)}`;
  }

  function convertBundle(bundle) {
    const source = bundle.genealogy || {};
    const sourceSims = source.sims || {};
    const households = source.households || {};
    const sims = {};

    for (const [idRaw, sim] of Object.entries(sourceSims)) {
      const id = String(idRaw);
      const rel = relationshipArrays(sim);
      const household = sim.householdId ? households[String(sim.householdId)] : null;
      const traits = Array.isArray(sim.traits) ? sim.traits.map(internalLabel).filter(Boolean) : [];
      const careers = Array.isArray(sim.careers) ? sim.careers.map(internalLabel).filter(Boolean) : [];
      const aspiration = internalLabel(sim.aspiration);
      const deathType = sim.death && sim.death.deathType ? enumKey(sim.death.deathType) : '';

      sims[id] = {
        id,
        name: (sim.name && (sim.name.display || `${sim.name.first || ''} ${sim.name.last || ''}`.trim())) || id,
        gender: mapGender(sim.gender),
        lifeStage: mapLifeStage(sim.age),
        status: mapStatus(sim),
        race: mapSpecies(sim.species),
        residence: household ? (household.name || '') : '',
        aspiration,
        causeOfDeath: deathType,
        pets: [],
        gallery: [],
        parentIds: rel.parentIds,
        spouseIds: rel.spouseIds,
        exSpouseIds: rel.exSpouseIds,
        adoptive: rel.adoptedParentIds.length > 0,
        traits,
        career: careers.join(' / '),
        bio: '',
        order: 0,
        avatar: null,
        gameData: {
          simId: id,
          avatarPath: findSimAvatarPath(bundle.files, id, sim),
          householdId: sim.householdId || null,
          recordState: sim.recordState || 'full',
          adoptedParentIds: rel.adoptedParentIds,
          lod: sim.lod || null,
          dataAvailability: sim.dataAvailability || null
        }
      };
    }

    const core = connectedComponents(sourceSims);
    const families = core
      .map(component => addDirectPartners(component, sourceSims))
      .filter(memberIds => memberIds.length > 0)
      .map((memberIds, index) => ({
        id: stableFamilyId(memberIds),
        name: familyName(memberIds, sourceSims, index),
        memberIds,
        bio: '',
        coverImage: null,
        freeLayout: { view: false, edit: false },
        manualPos: { view: {}, edit: {} },
        locked: false,
        gameImport: true
      }));

    // 僅配偶、沒有父母子女關係的兩位人物會各自成 singleton；將完全相同的延伸 family 去重。
    const dedup = new Map();
    for (const family of families) {
      const key = [...family.memberIds].sort().join('|');
      if (!dedup.has(key)) dedup.set(key, family);
    }

    const finalFamilies = [...dedup.values()];
    return {
      version: 3,
      meta: {
        gameImport: true,
        sourceFormat: bundle.manifest.format,
        sourceSchemaVersion: bundle.manifest.schemaVersion,
        exporterVersion: bundle.manifest.exporterVersion,
        gameLocale: bundle.manifest.gameLocale,
        exportedAt: bundle.manifest.exportedAt
      },
      sims,
      families: finalFamilies,
      links: [],
      relMap: {},
      labelPos: {},
      currentId: finalFamilies.length ? finalFamilies[0].id : null
    };
  }

  async function parseFile(file) {
    const buffer = await file.arrayBuffer();
    return parseBundle(buffer);
  }

  global.L1nGGameImport = {
    parseBundle,
    parseFile,
    convertBundle,
    readStoredZip,
    connectedComponents,
    findSimAvatarPath,
    getSimAvatarAsset
  };
})(window);
