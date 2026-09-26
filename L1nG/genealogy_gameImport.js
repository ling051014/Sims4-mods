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
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return String(value.key || value.label || value.value || value.raw || '');
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

  // ========【遊戲資料正規化】 設定 - species 負責人物 / 寵物分類；occult 才是人物種族 ========
  function speciesKey(value) {
    return enumKey(value).toLowerCase();
  }

  function mapPetSpecies(value) {
    const key = speciesKey(value);
    if (key.includes('dog')) return 'dog';
    if (key.includes('cat')) return 'cat';
    if (key.includes('horse')) return 'horse';
    return 'other';
  }

  function isPetSim(sim) {
    const key = speciesKey(sim && sim.species);
    return (
      key.includes('dog') ||
      key.includes('cat') ||
      key.includes('horse') ||
      key.includes('fox')
    );
  }

  function mapOccultRace(value) {
    const raw = enumKey(value).toLowerCase();

    if (raw.includes('mermaid')) return 'mermaid';
    if (raw.includes('alien')) return 'alien';
    if (raw.includes('vampire')) return 'vampire';
    if (raw.includes('werewolf')) return 'werewolf';
    if (raw.includes('spellcaster')) return 'spellcaster';
    if (raw.includes('fairy')) return 'fairy';
    if (raw.includes('plant')) return 'plant';
    if (raw.includes('robot')) return 'robot';
    if (!raw || raw.includes('human')) return 'human';

    return 'other';
  }

  function displaySimName(sim) {
    const name = sim && sim.name;
    if (!name || typeof name !== 'object') return '未知市民';

    const display = String(name.display || '').trim();
    if (display) return display;

    const joined = `${name.first || ''} ${name.last || ''}`.trim();
    return joined || '未知市民';
  }

  function optionalDisplayValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.localizedName || value.displayName || value.label || value.name || '';
  }

  function formatResidence(household) {
    if (!household || typeof household !== 'object') return '';

    const parts = [
      optionalDisplayValue(household.worldName),
      optionalDisplayValue(household.neighborhoodName),
      optionalDisplayValue(household.lotName)
    ].filter(Boolean);

    if (parts.length) return parts.join(' / ');
    return optionalDisplayValue(household.name);
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

  function stringIds(value) {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  }

  function relationshipArrays(sim) {
    const rel = (sim && sim.relations) || {};

    return {
      parentIds:stringIds(rel.parentIds),
      childIds:stringIds(rel.childIds),
      spouseIds:stringIds(rel.spouseIds),
      deceasedSpouseIds:stringIds(rel.deceasedSpouseIds),
      exSpouseIds:stringIds(rel.exSpouseIds),
      fianceIds:stringIds(rel.fianceIds),
      steadyPartnerIds:stringIds(rel.steadyPartnerIds),
      adoptedParentIds:stringIds(rel.adoptedParentIds),
      adoptedChildIds:stringIds(rel.adoptedChildIds),
      ownerIds:stringIds(rel.ownerIds || rel.petOwnerIds || sim.ownerIds)
    };
  }

  // ========【遊戲人物分類】 設定 - 分類只影響 UI 歸屬，不刪除任何匯入人物 ========
  function classifyGamePerson(sim, household) {
    const recordState = String((sim && sim.recordState) || '').toLowerCase();

    if (recordState === 'family_tree_only') return 'family_tree_only';
    if (household && household.hidden) return 'hidden_household';
    if (household) return 'household';

    const serviceHint =
      sim && (
        sim.serviceNpc ||
        sim.serviceRole ||
        sim.serviceRoleId ||
        sim.serviceNpcType
      );

    if (serviceHint) return 'service_npc';
    if (sim && sim.isCulled) return 'family_tree_only';

    return 'unassigned_npc';
  }

  function householdShouldCreateFamily(household) {
    if (!household || typeof household !== 'object') return false;

    return (
      !household.hidden ||
      !!household.isActiveHousehold ||
      !!household.isPlayedHousehold ||
      !!household.isPlayerHousehold
    );
  }

  // ========【遊戲家族建立】 設定 - 每個 EA Household 保留為一個家族，沿正式 genealogy 展開 ========
  function genealogyNeighbors(sim) {
    const rel = relationshipArrays(sim);
    return [
      ...rel.parentIds,
      ...rel.childIds,
      ...rel.adoptedParentIds,
      ...rel.adoptedChildIds,
      ...rel.spouseIds,
      ...rel.deceasedSpouseIds
    ];
  }

  function expandHouseholdGenealogy(seedIds, sourceSims, humanIds) {
    const result = new Set(
      seedIds.map(String).filter(id => humanIds.has(id))
    );
    const stack = [...result];

    while (stack.length) {
      const id = stack.pop();
      const sim = sourceSims[id];
      if (!sim) continue;

      genealogyNeighbors(sim).forEach(rawId => {
        const relatedId = String(rawId);
        if (!humanIds.has(relatedId) || result.has(relatedId)) return;
        result.add(relatedId);
        stack.push(relatedId);
      });
    }

    return [...result];
  }

  function explicitPetOwnerIds(pet, humanIds) {
    return relationshipArrays(pet).ownerIds.filter(id => humanIds.has(id));
  }

  function resolvePetOwnerIds(pet, household, humanIds) {
    const explicit = explicitPetOwnerIds(pet, humanIds);
    if (explicit.length) return explicit;

    const householdHumans = stringIds(household && household.memberIds)
      .filter(id => humanIds.has(id));

    return householdHumans.length === 1 ? householdHumans : [];
  }

  function familyNameFromHousehold(household, memberIds, sourceSims, index) {
    const householdName = optionalDisplayValue(household && household.name).trim();
    if (householdName) return householdName;

    const counts = new Map();

    memberIds.forEach(id => {
      const last =
        sourceSims[id] &&
        sourceSims[id].name &&
        String(sourceSims[id].name.last || '').trim();

      if (!last) return;
      counts.set(last, (counts.get(last) || 0) + 1);
    });

    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    return sorted.length ? `${sorted[0][0]}家族` : `遊戲家族 ${index + 1}`;
  }

  function stableHouseholdFamilyId(householdId, memberIds) {
    const source =
      householdId != null && householdId !== ''
        ? `household:${householdId}`
        : `members:${[...memberIds].sort().join('|')}`;

    let hash = 2166136261;
    for (let i = 0; i < source.length; i++) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `game_${(hash >>> 0).toString(16)}`;
  }

  function fallbackFamilies(sourceSims, humanIds) {
    const adjacency = new Map([...humanIds].map(id => [id, new Set()]));

    humanIds.forEach(id => {
      genealogyNeighbors(sourceSims[id]).forEach(rawId => {
        const relatedId = String(rawId);
        if (!humanIds.has(relatedId)) return;
        adjacency.get(id).add(relatedId);
        adjacency.get(relatedId).add(id);
      });
    });

    const seen = new Set();
    const families = [];

    humanIds.forEach(start => {
      if (seen.has(start)) return;

      const stack = [start];
      const memberIds = [];
      seen.add(start);

      while (stack.length) {
        const id = stack.pop();
        memberIds.push(id);

        adjacency.get(id).forEach(other => {
          if (seen.has(other)) return;
          seen.add(other);
          stack.push(other);
        });
      }

      families.push(memberIds);
    });

    return families;
  }

  function convertBundle(bundle) {
    const source = bundle.genealogy || {};
    const sourceSims = source.sims || {};
    const households = source.households || {};

    const humanIds = new Set();
    const petIds = new Set();

    Object.entries(sourceSims).forEach(([idRaw, sim]) => {
      const id = String(idRaw);
      if (isPetSim(sim)) petIds.add(id);
      else humanIds.add(id);
    });

    const sims = {};

    humanIds.forEach(id => {
      const sim = sourceSims[id];
      const rel = relationshipArrays(sim);
      const household =
        sim.householdId != null
          ? households[String(sim.householdId)]
          : null;

      const traits = Array.isArray(sim.traits)
        ? sim.traits.map(internalLabel).filter(Boolean)
        : [];

      const careers = Array.isArray(sim.careers)
        ? sim.careers.map(internalLabel).filter(Boolean)
        : [];

      const aspiration = internalLabel(sim.aspiration);
      const deathType =
        sim.death && sim.death.deathType
          ? enumKey(sim.death.deathType)
          : '';

      sims[id] = {
        id,
        name:displaySimName(sim),
        gender:mapGender(sim.gender),
        lifeStage:mapLifeStage(sim.age),
        status:mapStatus(sim),
        race:mapOccultRace(sim.occult),
        residence:formatResidence(household),
        aspiration,
        causeOfDeath:deathType,
        pets:[],
        gallery:[],
        parentIds:rel.parentIds,
        spouseIds:[...new Set([...rel.spouseIds, ...rel.deceasedSpouseIds])],
        exSpouseIds:rel.exSpouseIds,
        adoptive:rel.adoptedParentIds.length > 0,
        traits,
        career:careers.join(' / '),
        bio:'',
        order:0,
        avatar:null,
        gameData:{
          simId:id,
          avatarPath:findSimAvatarPath(bundle.files, id, sim),
          householdId:sim.householdId || null,
          recordState:sim.recordState || 'full',
          adoptedParentIds:rel.adoptedParentIds,
          adoptedChildIds:rel.adoptedChildIds,
          fianceIds:rel.fianceIds,
          steadyPartnerIds:rel.steadyPartnerIds,
          deceasedSpouseIds:rel.deceasedSpouseIds,
          lod:sim.lod || null,
          isCulled:!!sim.isCulled,
          isSelectable:!!sim.isSelectable,
          dataAvailability:sim.dataAvailability || null,
          entityClass:classifyGamePerson(sim, household),
          localizedNameRef:
            sim.name && sim.name.localizedRef
              ? sim.name.localizedRef
              : null,
          portrait:sim.portrait || null
        }
      };
    });

    const unassignedPets = [];

    petIds.forEach(id => {
      const pet = sourceSims[id];
      const household =
        pet.householdId != null
          ? households[String(pet.householdId)]
          : null;

      const ownerIds = resolvePetOwnerIds(pet, household, humanIds);
      const petRelations = relationshipArrays(pet);

      const lineageNames = ids =>
        ids
          .map(parentId => sourceSims[String(parentId)])
          .filter(Boolean)
          .map(displaySimName)
          .filter(Boolean);

      const petData = {
        id,
        name:displaySimName(pet),
        species:mapPetSpecies(pet.species),
        breed:internalLabel(pet.breed) || optionalDisplayValue(pet.breedName) || '',
        gender:mapGender(pet.gender),
        ageStage:mapLifeStage(pet.age),
        status:mapStatus(pet),
        avatar:null,
        gameData:{
          simId:id,
          avatarPath:findSimAvatarPath(bundle.files, id, pet),
          householdId:pet.householdId || null,
          ownerIds,
          recordState:pet.recordState || 'full',
          portrait:pet.portrait || null,
          lineage:{
            parentIds:petRelations.parentIds,
            childIds:petRelations.childIds,
            adoptedParentIds:petRelations.adoptedParentIds,
            adoptedChildIds:petRelations.adoptedChildIds,
            parentNames:lineageNames(petRelations.parentIds),
            childNames:lineageNames(petRelations.childIds)
          }
        }
      };

      if (!ownerIds.length) {
        unassignedPets.push(petData);
        return;
      }

      ownerIds.forEach(ownerId => {
        const owner = sims[ownerId];
        if (!owner) return;
        owner.pets.push(JSON.parse(JSON.stringify(petData)));
      });
    });

    const householdEntries = Object.entries(households);
    const visibleHouseholdEntries = householdEntries.filter(([, household]) =>
      householdShouldCreateFamily(household)
    );
    const familySourceEntries =
      visibleHouseholdEntries.length
        ? visibleHouseholdEntries
        : householdEntries;

    let families = [];

    if (familySourceEntries.length) {
      families = familySourceEntries
        .map(([householdIdRaw, household], index) => {
          const householdId = String(householdIdRaw);
          const seedIds = stringIds(household.memberIds).filter(id => humanIds.has(id));
          const memberIds = expandHouseholdGenealogy(seedIds, sourceSims, humanIds);

          // 純寵物 Household 不建立空白人物家族。
          // 寵物本身仍保留在 pet pool / unassignedPets，不以空 memberIds 污染家族選單。
          if (!memberIds.length) return null;

          return {
            id:stableHouseholdFamilyId(householdId, memberIds),
            name:familyNameFromHousehold(household, memberIds, sourceSims, index),
            memberIds,
            bio:optionalDisplayValue(household.bio) || optionalDisplayValue(household.description) || '',
            coverImage:null,
            freeLayout:{ view:false, edit:false },
            manualPos:{ view:{}, edit:{} },
            locked:false,
            gameImport:true,
            gameData:{
              householdId,
              homeZoneId:household.homeZoneId || household.zoneId || null,
              worldId:household.worldId || null,
              neighborhoodId:household.neighborhoodId || null,
              regionId:household.regionId || null,
              lotName:optionalDisplayValue(household.lotName),
              worldName:optionalDisplayValue(household.worldName),
              neighborhoodName:optionalDisplayValue(household.neighborhoodName),
              hidden:!!household.hidden,
              isActiveHousehold:!!household.isActiveHousehold,
              isPlayedHousehold:!!household.isPlayedHousehold,
              isPlayerHousehold:!!household.isPlayerHousehold,
              householdMemberIds:stringIds(household.memberIds),
              petIds:stringIds(household.memberIds).filter(id => petIds.has(id))
            }
          };
        })
        .filter(Boolean);
    } else {
      families = fallbackFamilies(sourceSims, humanIds).map((memberIds, index) => ({
        id:stableHouseholdFamilyId('', memberIds),
        name:familyNameFromHousehold(null, memberIds, sourceSims, index),
        memberIds,
        bio:'',
        coverImage:null,
        freeLayout:{ view:false, edit:false },
        manualPos:{ view:{}, edit:{} },
        locked:false,
        gameImport:true,
        gameData:{ householdId:null, householdMemberIds:[] }
      }));
    }

    return {
      version:3,
      meta:{
        gameImport:true,
        sourceFormat:bundle.manifest.format,
        sourceSchemaVersion:bundle.manifest.schemaVersion,
        exporterVersion:bundle.manifest.exporterVersion,
        gameLocale:bundle.manifest.gameLocale,
        exportedAt:bundle.manifest.exportedAt,
        gameImportStats:{
          sourceSimCount:Object.keys(sourceSims).length,
          peopleCount:humanIds.size,
          petCount:petIds.size,
          householdCount:householdEntries.length,
          visibleHouseholdCount:visibleHouseholdEntries.length,
          hiddenHouseholdCount:householdEntries.filter(([, household]) => !!household.hidden).length,
          familyCount:families.length,
          familyTreeOnlyCount:[...humanIds].filter(id => classifyGamePerson(sourceSims[id], sourceSims[id] && sourceSims[id].householdId != null ? households[String(sourceSims[id].householdId)] : null) === 'family_tree_only').length,
          unassignedNpcCount:[...humanIds].filter(id => classifyGamePerson(sourceSims[id], sourceSims[id] && sourceSims[id].householdId != null ? households[String(sourceSims[id].householdId)] : null) === 'unassigned_npc').length,
          serviceNpcCount:[...humanIds].filter(id => classifyGamePerson(sourceSims[id], sourceSims[id] && sourceSims[id].householdId != null ? households[String(sourceSims[id].householdId)] : null) === 'service_npc').length,
          unassignedPetCount:unassignedPets.length
        },
        unassignedPets
      },
      sims,
      families,
      links:[],
      relMap:{},
      labelPos:{},
      currentId:families.length ? families[0].id : null
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
    isPetSim,
    mapOccultRace,
    classifyGamePerson,
    householdShouldCreateFamily,
    expandHouseholdGenealogy,
    findSimAvatarPath,
    getSimAvatarAsset
  };
})(window);
