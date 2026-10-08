/*
 * L1nG Genealogy Game Bundle Importer v0.3
 * 對應 L1nG Genealogy Exporter schemaVersion 1。
 *
 * 第一版 exporter 使用 ZIP_STORED，因此這裡不需要第三方 ZIP 函式庫。
 * 未來若改用 DEFLATE，請升級 parser，不要靜默接受未知壓縮方式。
 */
(function (global) {
  'use strict';

  const FORMAT = 'l1ng-genealogy';
  const SUPPORTED_SCHEMA = 1;

  // ========【網站資料版本】 設定 - 遊戲 ZIP schema 與網站 L1nG v1 資料版本分開管理 ========
  const WEBSITE_DATA_VERSION = 1;

  // ========【遊戲資料同步欄位】 設定 - 新增遊戲來源欄位時統一登記於此 ========
  const GAME_MANAGED_SIM_FIELDS = Object.freeze([
    'name',
    'gender',
    'lifeStage',
    'status',
    'race',
    'birthdayYear',
    'birthdayMonth',
    'birthdayDay',
    'age',
    'residence',
    'aspiration',
    'causeOfDeath',
    'traits',
    'career'
  ]);

  const GAME_MANAGED_PET_FIELDS = Object.freeze([
    'name',
    'species',
    'breed',
    'gender',
    'ageStage',
    'status',
    'traits',
    'avatar',
    'avatarFrame'
  ]);

  function cloneData(value) {
    if (value == null || typeof value !== 'object') return value;
    return JSON.parse(JSON.stringify(value));
  }

  function sameData(left, right) {
    if (left === right) return true;
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch (_) {
      return false;
    }
  }

  function uniqueStrings(values) {
    return [...new Set(
      (values || [])
        .map(value => String(value || ''))
        .filter(Boolean)
    )];
  }

  function recordGameId(record) {
    const value =
      record &&
      record.gameData &&
      record.gameData.simId;

    return value == null || value === ''
      ? ''
      : String(value);
  }


  // ========【遊戲存檔來源識別】 設定 - 保存 Slot 資訊，GUID 目前只記錄、不單獨作為自動合併依據 ========
  function finiteInteger(value) {
    if (value == null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.trunc(number)
      : null;
  }

  function slotFileFromId(slotId) {
    const value = finiteInteger(slotId);
    if (value == null || value < 0) return '';
    return 'Slot_' + value
      .toString(16)
      .toUpperCase()
      .padStart(8, '0');
  }

  function normalizeSaveSlot(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const slotId = finiteInteger(value.slotId);
    const preferredManualSlotId =
      finiteInteger(value.preferredManualSlotId);

    const slotFile =
      String(value.slotFile || '').trim() ||
      slotFileFromId(slotId);

    const guid =
      value.guid == null
        ? ''
        : String(value.guid).trim();

    const name =
      value.name == null
        ? ''
        : String(value.name).trim();

    if (
      slotId == null &&
      !slotFile &&
      !guid &&
      !name
    ) {
      return null;
    }

    return {
      slotId,
      preferredManualSlotId,
      slotFile,
      guid,
      name
    };
  }

  function saveSlotIdentityKey(value) {
    const slot = normalizeSaveSlot(value);
    if (!slot) return '';

    if (slot.slotId != null) {
      return 'slot:' + slot.slotId;
    }

    if (slot.slotFile) {
      return 'file:' + slot.slotFile.toLowerCase();
    }

    return '';
  }

  function sameSaveSlot(left, right) {
    const a = normalizeSaveSlot(left);
    const b = normalizeSaveSlot(right);

    if (!a || !b) return false;

    if (
      a.slotId != null &&
      b.slotId != null
    ) {
      return a.slotId === b.slotId;
    }

    if (a.slotFile && b.slotFile) {
      return (
        a.slotFile.toLowerCase() ===
        b.slotFile.toLowerCase()
      );
    }

    return false;
  }

  function saveSlotPayloadConflict(left, right) {
    const a = normalizeSaveSlot(left);
    const b = normalizeSaveSlot(right);

    if (!a || !b) return false;

    const comparable = [
      'slotId',
      'preferredManualSlotId',
      'slotFile',
      'guid'
    ];

    return comparable.some(key => {
      const av = a[key];
      const bv = b[key];

      if (
        av == null || av === '' ||
        bv == null || bv === ''
      ) {
        return false;
      }

      return String(av) !== String(bv);
    });
  }

  function resolveBundleSaveSource(bundle) {
    const manifestSave =
      normalizeSaveSlot(
        bundle?.manifest?.saveSlot
      );

    const genealogySave =
      normalizeSaveSlot(
        bundle?.genealogy?.saveSlot
      );

    const conflict =
      !!(
        manifestSave &&
        genealogySave &&
        saveSlotPayloadConflict(
          manifestSave,
          genealogySave
        )
      );

    return {
      currentSave:
        manifestSave ||
        genealogySave ||
        null,
      saveSlotConsistency:
        conflict
          ? 'conflict'
          : (
              manifestSave || genealogySave
                ? 'consistent'
                : 'missing'
            )
    };
  }

  function normalizeKnownSaveEntry(value) {
    const slot = normalizeSaveSlot(value);
    if (!slot) return null;

    return {
      ...slot,
      firstImportedAt:
        value?.firstImportedAt || null,
      lastImportedAt:
        value?.lastImportedAt || null,
      acceptedAsContinuation:
        value?.acceptedAsContinuation === true
    };
  }

  function mergeKnownSaves(
    currentValues,
    incomingSlot,
    importedAt,
    {
      acceptedAsContinuation = false
    } = {}
  ) {
    const result = [];
    const indexByKey = new Map();

    const add = (value, options = {}) => {
      const normalized =
        normalizeKnownSaveEntry(value);

      if (!normalized) return;

      const key =
        saveSlotIdentityKey(normalized);

      if (!key) return;

      const existingIndex =
        indexByKey.get(key);

      const next = {
        ...normalized,
        firstImportedAt:
          normalized.firstImportedAt ||
          options.importedAt ||
          null,
        lastImportedAt:
          options.importedAt ||
          normalized.lastImportedAt ||
          null,
        acceptedAsContinuation:
          normalized.acceptedAsContinuation === true ||
          options.acceptedAsContinuation === true
      };

      if (existingIndex == null) {
        indexByKey.set(key, result.length);
        result.push(next);
        return;
      }

      const existing =
        result[existingIndex];

      result[existingIndex] = {
        ...existing,
        ...next,
        firstImportedAt:
          existing.firstImportedAt ||
          next.firstImportedAt ||
          null,
        lastImportedAt:
          next.lastImportedAt ||
          existing.lastImportedAt ||
          null,
        acceptedAsContinuation:
          existing.acceptedAsContinuation === true ||
          next.acceptedAsContinuation === true
      };
    };

    (Array.isArray(currentValues)
      ? currentValues
      : []
    ).forEach(value => add(value));

    add(
      incomingSlot,
      {
        importedAt,
        acceptedAsContinuation
      }
    );

    return result;
  }

  function gameImportSource(database) {
    const source =
      database?.meta?.gameImportSource;

    if (
      source &&
      typeof source === 'object' &&
      !Array.isArray(source)
    ) {
      return source;
    }

    return {};
  }

  function sourceCurrentSave(database) {
    const source =
      gameImportSource(database);

    return (
      normalizeSaveSlot(
        source.currentSave
      ) ||
      normalizeSaveSlot(
        (
          Array.isArray(source.knownSaves)
            ? source.knownSaves
            : []
        ).slice(-1)[0]
      ) ||
      null
    );
  }

  function sourceLastImportedAt(database) {
    return (
      gameImportSource(database)
        .lastImportedAt ||
      database?.meta?.gameImportUpdate
        ?.lastImportedAt ||
      database?.meta?.exportedAt ||
      null
    );
  }

  function isOlderImport(
    currentDatabase,
    incomingDatabase
  ) {
    const currentValue =
      sourceLastImportedAt(
        currentDatabase
      );

    const incomingValue =
      sourceLastImportedAt(
        incomingDatabase
      );

    const currentTime =
      Date.parse(currentValue || '');

    const incomingTime =
      Date.parse(incomingValue || '');

    return (
      Number.isFinite(currentTime) &&
      Number.isFinite(incomingTime) &&
      incomingTime < currentTime
    );
  }

  function compareSaveSource(
    currentDatabase,
    incomingDatabase
  ) {
    const currentSource =
      gameImportSource(
        currentDatabase
      );

    const incomingSource =
      gameImportSource(
        incomingDatabase
      );

    const currentSave =
      sourceCurrentSave(
        currentDatabase
      );

    const incomingSave =
      sourceCurrentSave(
        incomingDatabase
      );

    const knownSaves =
      (Array.isArray(currentSource.knownSaves)
        ? currentSource.knownSaves
        : []
      )
        .map(normalizeKnownSaveEntry)
        .filter(Boolean);

    let verification =
      'unverified';

    if (
      incomingSource.saveSlotConsistency ===
      'conflict'
    ) {
      verification =
        'conflict';
    } else if (
      currentSave &&
      incomingSave &&
      sameSaveSlot(
        currentSave,
        incomingSave
      )
    ) {
      verification =
        'same_slot';
    } else if (
      incomingSave &&
      knownSaves.some(save =>
        sameSaveSlot(
          save,
          incomingSave
        )
      )
    ) {
      verification =
        'known_save';
    } else if (
      currentSave &&
      incomingSave &&
      saveSlotIdentityKey(currentSave) &&
      saveSlotIdentityKey(incomingSave)
    ) {
      verification =
        'different_slot';
    }

    return {
      verification,
      currentSave,
      incomingSave,
      guidMatch:
        !!(
          currentSave?.guid &&
          incomingSave?.guid &&
          currentSave.guid ===
            incomingSave.guid
        ),
      olderImport:
        isOlderImport(
          currentDatabase,
          incomingDatabase
        ),
      currentLastImportedAt:
        sourceLastImportedAt(
          currentDatabase
        ),
      incomingImportedAt:
        sourceLastImportedAt(
          incomingDatabase
        )
    };
  }

  function mergeGameImportSource(
    currentDatabase,
    incomingDatabase,
    sourceVerification,
    importedAt
  ) {
    const currentSource =
      gameImportSource(
        currentDatabase
      );

    const incomingSource =
      gameImportSource(
        incomingDatabase
      );

    const incomingSave =
      sourceCurrentSave(
        incomingDatabase
      );

    let knownSaves =
      mergeKnownSaves(
        currentSource.knownSaves,
        sourceCurrentSave(
          currentDatabase
        ),
        sourceLastImportedAt(
          currentDatabase
        )
      );

    knownSaves =
      mergeKnownSaves(
        knownSaves,
        incomingSave,
        importedAt,
        {
          acceptedAsContinuation:
            sourceVerification ===
            'confirmed_continuation'
        }
      );

    return {
      currentSave:
        incomingSave ||
        sourceCurrentSave(
          currentDatabase
        ),
      knownSaves,
      saveSlotConsistency:
        incomingSource.saveSlotConsistency ||
        'missing',
      lastImportedAt:
        importedAt ||
        sourceLastImportedAt(
          currentDatabase
        ) ||
        null
    };
  }


  function manualOverrideSet(record) {
    return new Set(
      Array.isArray(record?.gameData?.manualOverrides)
        ? record.gameData.manualOverrides.map(String).filter(Boolean)
        : []
    );
  }

  function isGameRelationshipLink(link) {
    if (!link || typeof link !== 'object') return false;
    return (
      link.source === 'game' ||
      /^game_rel_/.test(String(link.id || ''))
    );
  }

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
        mimeType:null,
        bytes:null,
        byteLength:bytes ? bytes.length : 0,
        supported:false
      };
    }

    return {
      path,
      mimeType,
      bytes,
      byteLength:bytes.length,
      supported:true
    };
  }

  async function prepareGameAvatarAsset(asset, kind = 'sim') {
    const original = new Blob([asset.bytes], { type:asset.mimeType });
    // EA codec 僅在遊戲 ZIP 人物頭像這個 owner 使用；寵物及所有其他圖片保持原流程。
    if (kind !== 'sim' || asset.mimeType !== 'image/jpeg') return { blob:original, converted:false, metadata:{} };
    const result = await global.L1nGThumDecoder.decode(asset.bytes);
    return result
      ? { ...result, converted:true, metadata:{ width:result.width, height:result.height } }
      : { blob:original, converted:false, metadata:{} };
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

    if (key.includes('fox')) return 'fox';
    if (key.includes('raccoon')) return 'raccoon';
    if (key.includes('dog')) return 'dog';
    if (key.includes('cat')) return 'cat';
    if (key.includes('horse')) return 'horse';
    if (key.includes('cow')) return 'cow';
    if (key.includes('crow')) return 'crow';
    if (key.includes('parrot')) return 'parrot';
    if (key.includes('leopard')) return 'leopard';

    return 'other';
  }

  function isPetSim(sim) {
    const key = speciesKey(sim && sim.species);

    return [
      'dog',
      'fox',
      'cat',
      'raccoon',
      'horse',
      'cow',
      'crow',
      'parrot',
      'leopard'
    ].some(species =>
      key.includes(species)
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

  // ========【Trait 顯示文字】 設定 - 人物與寵物共用 EA / 第三方模組富文字清理 ========
  // 僅處理 traits；職業、抱負、品種與其他遊戲文字仍維持各自原有流程。
  function decodeImportedTextEntities(value) {
    const source =
      String(value ?? '');

    if (
      !source.includes('&') ||
      typeof document === 'undefined'
    ) {
      return source;
    }

    const decoder =
      document.createElement(
        'textarea'
      );

    decoder.innerHTML =
      source;

    return decoder.value;
  }

  function cleanImportedTraitText(value) {
    const decoded =
      decodeImportedTextEntities(
        value
      );

    return String(decoded)
      .replace(
        /<\s*br\s*\/?>/gi,
        ' '
      )
      .replace(
        /<\/?[a-z][^>]*>/gi,
        ''
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }

  function cleanImportedTraitLabel(item) {
    return cleanImportedTraitText(
      internalLabel(item)
    );
  }

  // ========【遊戲偏好正規化】 設定 - 保留 EA metadata，網站僅建立唯讀顯示資料 ========
  function importedPreferenceKind(item) {
    const raw = String(
      (item && item.preference) ||
      enumKey(item && item.traitType) ||
      ''
    ).trim().toLowerCase();

    if (raw.includes('dislike')) return 'dislike';
    if (raw.includes('like')) return 'like';
    return '';
  }

  function cleanImportedPreferenceDisplayName(item, kind) {
    let label = cleanImportedTraitText(
      internalLabel(item)
    );

    if (!label) return '';

    const patterns =
      kind === 'dislike'
        ? [
            /^(?:不喜歡|不喜欢|討厭|讨厌)\s*[:：]?\s*/u,
            /^dislikes?\s*[:：-]?\s*/i,
            /^turn[- ]?offs?\s*[:：-]?\s*/i
          ]
        : [
            /^(?:喜歡|喜欢)\s*[:：]?\s*/u,
            /^likes?\s*[:：-]?\s*/i,
            /^turn[- ]?ons?\s*[:：-]?\s*/i
          ];

    patterns.some(pattern => {
      const next = label.replace(pattern, '').trim();
      if (next !== label) {
        label = next;
        return true;
      }
      return false;
    });

    return label;
  }

  function normalizePreferenceReference(value) {
    if (!value || typeof value !== 'object') return null;

    return {
      tuningId:
        value.tuningId != null
          ? String(value.tuningId)
          : '',
      internalName:String(value.internalName || ''),
      localizedName:cleanImportedTraitText(
        value.localizedName ||
        value.displayName ||
        ''
      ),
      localizedNameRef:
        value.localizedNameRef || null
    };
  }

  function normalizeImportedPreference(item) {
    if (!item || typeof item !== 'object') return null;

    const preference = importedPreferenceKind(item);
    if (!preference) return null;

    return {
      preference,
      tuningId:
        item.tuningId != null
          ? String(item.tuningId)
          : '',
      internalName:String(item.internalName || ''),
      localizedName:cleanImportedTraitText(
        item.localizedName ||
        item.displayName ||
        ''
      ),
      displayName:cleanImportedPreferenceDisplayName(
        item,
        preference
      ),
      localizedNameRef:item.localizedNameRef || null,
      traitType:item.traitType || null,
      subject:item.subject || null,
      isAttractionPreference:
        item.isAttractionPreference === true,
      item:normalizePreferenceReference(item.item),
      category:normalizePreferenceReference(item.category),
      group:normalizePreferenceReference(item.group)
    };
  }

  function normalizeImportedPreferences(sim) {
    const all = Array.isArray(sim && sim.preferences)
      ? sim.preferences
          .map(normalizeImportedPreference)
          .filter(Boolean)
      : [];

    const availability =
      sim &&
      sim.dataAvailability &&
      sim.dataAvailability.preferences
        ? String(sim.dataAvailability.preferences)
        : (all.length ? 'available' : 'unavailable');

    return {
      availability,
      likesDislikes:
        all.filter(item =>
          !item.isAttractionPreference
        ),
      attraction:
        all.filter(item =>
          item.isAttractionPreference
        )
    };
  }

  function stringIds(value) {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  }

  // ========【RealDate 資料正規化】 設定 - 保留生日、遊戲日期與年齡快照，供族譜網站直接讀取 ========
  function finiteInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.trunc(number) : null;
  }

  function normalizeDateTriple(value) {
    if (!value || typeof value !== 'object') return null;

    const year = finiteInteger(value.year);
    const month = finiteInteger(value.month);
    const day = finiteInteger(value.day);

    if (year === null || month === null || day === null) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return { year, month, day };
  }

  function cloneRealDate(sim) {
    const realDate = sim && sim.realDate;
    if (!realDate || typeof realDate !== 'object') return null;

    try {
      return JSON.parse(JSON.stringify(realDate));
    } catch (_) {
      return null;
    }
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

  // ========【EA Household 室友推導】 設定 - 同住但沒有親屬／伴侶關係時建立「室友」遊戲關係 ========
  function familyComponentMap(
    sourceSims
  ) {
    const adjacency =
      new Map();

    const ensureNode =
      rawId => {
        const id =
          String(rawId || '');

        if (!id) return '';

        if (!adjacency.has(id)) {
          adjacency.set(
            id,
            new Set()
          );
        }

        return id;
      };

    const connect =
      (firstId, secondId) => {
        const a =
          ensureNode(firstId);

        const b =
          ensureNode(secondId);

        if (
          !a ||
          !b ||
          a === b
        ) {
          return;
        }

        adjacency.get(a).add(b);
        adjacency.get(b).add(a);
      };

    Object.entries(
      sourceSims || {}
    ).forEach(([idRaw, sim]) => {
      const id =
        ensureNode(idRaw);

      if (!id) return;

      const rel =
        relationshipArrays(sim);

      [
        ...rel.parentIds,
        ...rel.childIds,
        ...rel.adoptedParentIds,
        ...rel.adoptedChildIds
      ].forEach(relatedId =>
        connect(
          id,
          relatedId
        )
      );
    });

    const componentById =
      new Map();

    let componentIndex = 0;

    adjacency.forEach(
      (_, startId) => {
        if (
          componentById.has(startId)
        ) {
          return;
        }

        componentIndex++;

        const stack =
          [startId];

        componentById.set(
          startId,
          componentIndex
        );

        while (stack.length) {
          const id =
            stack.pop();

          adjacency.get(id)
            ?.forEach(nextId => {
              if (
                componentById.has(nextId)
              ) {
                return;
              }

              componentById.set(
                nextId,
                componentIndex
              );

              stack.push(nextId);
            });
        }
      }
    );

    return componentById;
  }

  function sameFamilyComponent(
    firstId,
    secondId,
    componentById
  ) {
    const a =
      componentById.get(
        String(firstId || '')
      );

    const b =
      componentById.get(
        String(secondId || '')
      );

    return (
      a != null &&
      b != null &&
      a === b
    );
  }

  function hasDirectPartnerRelationship(
    firstId,
    secondId,
    sourceSims
  ) {
    const a =
      String(firstId || '');

    const b =
      String(secondId || '');

    if (
      !a ||
      !b ||
      a === b
    ) {
      return false;
    }

    const pointsTo =
      (sim, targetId) => {
        const rel =
          relationshipArrays(sim);

        return [
          ...rel.spouseIds,
          ...rel.deceasedSpouseIds,
          ...rel.exSpouseIds,
          ...rel.fianceIds,
          ...rel.steadyPartnerIds
        ]
          .map(String)
          .includes(targetId);
      };

    return (
      pointsTo(
        sourceSims?.[a],
        b
      ) ||
      pointsTo(
        sourceSims?.[b],
        a
      )
    );
  }

  function roommatePairs(
    sourceSims,
    humanIds,
    households
  ) {
    const components =
      familyComponentMap(
        sourceSims
      );

    const pairs = [];

    Object.values(
      households || {}
    ).forEach(household => {
      if (
        !householdShouldCreateFamily(
          household
        )
      ) {
        return;
      }

      const memberIds =
        uniqueStrings(
          household?.memberIds
        )
          .filter(id =>
            humanIds.has(id)
          );

      for (
        let firstIndex = 0;
        firstIndex < memberIds.length;
        firstIndex++
      ) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < memberIds.length;
          secondIndex++
        ) {
          const firstId =
            memberIds[firstIndex];

          const secondId =
            memberIds[secondIndex];

          if (
            sameFamilyComponent(
              firstId,
              secondId,
              components
            )
          ) {
            continue;
          }

          if (
            hasDirectPartnerRelationship(
              firstId,
              secondId,
              sourceSims
            )
          ) {
            continue;
          }

          pairs.push([
            firstId,
            secondId
          ]);
        }
      }
    });

    return pairs;
  }

  function importedRelationshipLinks(
    sourceSims,
    humanIds,
    households
  ) {
    const pairMap =
      new Map();

    const add = (
      firstId,
      secondId,
      type,
      priority
    ) => {
      const a =
        String(firstId || '');

      const b =
        String(secondId || '');

      if (
        !a ||
        !b ||
        a === b ||
        !humanIds.has(a) ||
        !humanIds.has(b)
      ) {
        return;
      }

      const ids =
        [a, b].sort();

      const key =
        ids.join('|');

      const current =
        pairMap.get(key);

      if (
        current &&
        current.priority >= priority
      ) {
        return;
      }

      pairMap.set(key, {
        id:
          'game_rel_' +
          ids.join('_'),
        from:ids[0],
        to:ids[1],
        type,
        label:type,
        source:'game',
        priority
      });
    };

    humanIds.forEach(id => {
      const sim =
        sourceSims[id];

      if (!sim) return;

      const rel =
        relationshipArrays(sim);

      const spouseSet =
        new Set(
          [
            ...rel.spouseIds,
            ...rel.deceasedSpouseIds
          ].map(String)
        );

      rel.fianceIds
        .forEach(targetId => {
          if (
            spouseSet.has(
              String(targetId)
            )
          ) {
            return;
          }

          add(
            id,
            targetId,
            '訂婚',
            2
          );
        });

      rel.steadyPartnerIds
        .forEach(targetId => {
          if (
            spouseSet.has(
              String(targetId)
            )
          ) {
            return;
          }

          add(
            id,
            targetId,
            '伴侶',
            1
          );
        });
    });

    roommatePairs(
      sourceSims,
      humanIds,
      households
    )
      .forEach(([
        firstId,
        secondId
      ]) => {
        // 室友是 Household 推導關係，優先級最低；
        // 若同一人物組已有訂婚／伴侶等明確遊戲關係，會保留明確關係。
        add(
          firstId,
          secondId,
          '室友',
          0
        );
      });

    return [...pairMap.values()]
      .map(({
        priority,
        ...link
      }) => link);
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

  // ========【遊戲家庭建立】 設定 - family.memberIds 僅保存 EA Household 真正成員；genealogy 另行計算 ========
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
    const importedAt =
      bundle.manifest?.exportedAt ||
      null;

    const saveSource =
      resolveBundleSaveSource(
        bundle
      );

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
        ? sim.traits
            .map(cleanImportedTraitLabel)
            .filter(Boolean)
        : [];

      const preferences =
        normalizeImportedPreferences(sim);

      const careers = Array.isArray(sim.careers)
        ? sim.careers.map(internalLabel).filter(Boolean)
        : [];

      const aspiration = internalLabel(sim.aspiration);
      const deathType =
        sim.death && sim.death.deathType
          ? enumKey(sim.death.deathType)
          : '';
      const realDate = cloneRealDate(sim);
      const birthday = normalizeDateTriple(realDate && realDate.birthday);
      const realDateAge =
        realDate && realDate.age && typeof realDate.age === 'object'
          ? realDate.age
          : null;
      const ageYears =
        realDateAge && finiteInteger(realDateAge.years) !== null
          ? finiteInteger(realDateAge.years)
          : null;

      sims[id] = {
        id,
        name:displaySimName(sim),
        gender:mapGender(sim.gender),
        lifeStage:mapLifeStage(sim.age),
        status:mapStatus(sim),
        race:mapOccultRace(sim.occult),
        birthdayYear:birthday ? birthday.year : null,
        birthdayMonth:birthday ? birthday.month : null,
        birthdayDay:birthday ? birthday.day : null,
        age:ageYears,
        residence:formatResidence(household),
        aspiration,
        causeOfDeath:deathType,
        pets:[],
        gallery:[],
        parentIds:rel.parentIds,
        spouseIds:rel.spouseIds,
        exSpouseIds:rel.exSpouseIds,
        traits,
        career:careers.join(' / '),
        notes:'',
        order:0,
        avatar:null,
        avatarFrame:null,
        gameAvatar:null,
        gameAvatarFrame:null,
        customAvatar:null,
        customAvatarFrame:null,
        avatarSource:'game',
        gameData:{
          simId:id,
          source:'game',
          presentInLatestImport:true,
          lastSeenAt:importedAt,
          manualOverrides:[],
          avatarPath:findSimAvatarPath(bundle.files, id, sim),
          householdId:sim.householdId || null,
          householdName:optionalDisplayValue(household && household.name),
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
          preferences,
          entityClass:classifyGamePerson(sim, household),
          localizedNameRef:
            sim.name && sim.name.localizedRef
              ? sim.name.localizedRef
              : null,
          portrait:sim.portrait || null,
          realDate
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

      const traits = Array.isArray(pet.traits)
        ? pet.traits
            .map(cleanImportedTraitLabel)
            .filter(Boolean)
        : [];

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
        traits,
        avatar:null,
        gameData:{
          simId:id,
          source:'game',
          presentInLatestImport:true,
          lastSeenAt:importedAt,
          manualOverrides:[],
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
          const memberIds = stringIds(household.memberIds)
            .filter(id => humanIds.has(id));

          // family.memberIds 只保存 EA Household 的真正人物成員。
          // genealogy 顯示範圍由網站的 EA 族譜 / 大家族模式另外計算，
          // 不再把遞迴展開的親族網污染成 Household 成員。
          // 純寵物 Household 不建立空白人物家族。
          if (!memberIds.length) return null;

          return {
            id:stableHouseholdFamilyId(householdId, memberIds),
            name:familyNameFromHousehold(household, memberIds, sourceSims, index),
            memberIds,
            bio:optionalDisplayValue(household.bio) || optionalDisplayValue(household.description) || '',
            coverImage:null,
            freeLayout:{ view:false, edit:false },
            manualPositions:{ view:{}, edit:{} },
            locked:false,
            gameImport:true,
            gameData:{
              householdId,
              source:'game',
              presentInLatestImport:true,
              lastSeenAt:importedAt,
              manualOverrides:[],
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
        manualPositions:{ view:{}, edit:{} },
        locked:false,
        gameImport:true,
        gameData:{
          householdId:null,
          source:'game',
          presentInLatestImport:true,
          lastSeenAt:importedAt,
          manualOverrides:[],
          householdMemberIds:[]
        }
      }));
    }

    const realDateCurrentDate =
      Object.values(sourceSims)
        .map(sim => normalizeDateTriple(sim && sim.realDate && sim.realDate.currentDate))
        .find(Boolean) ||
      null;

    return {
      version:WEBSITE_DATA_VERSION,
      meta:{
        gameImport:true,
        sourceFormat:bundle.manifest.format,
        sourceSchemaVersion:bundle.manifest.schemaVersion,
        exporterVersion:bundle.manifest.exporterVersion,
        gameLocale:bundle.manifest.gameLocale,
        exportedAt:bundle.manifest.exportedAt,
        realDateCurrentDate,
        gameImportSource:{
          currentSave:
            saveSource.currentSave,
          knownSaves:
            saveSource.currentSave
              ? mergeKnownSaves(
                  [],
                  saveSource.currentSave,
                  importedAt
                )
              : [],
          saveSlotConsistency:
            saveSource.saveSlotConsistency,
          lastImportedAt:
            importedAt
        },
        gameImportUpdate:{
          sourceVerification:
            saveSource.currentSave
              ? 'initial_import'
              : 'unverified',
          lastMode:'replace',
          lastImportedAt:importedAt
        },
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
      links:
        importedRelationshipLinks(
          sourceSims,
          humanIds,
          households
        ),
      relationshipMap:{},
      labelPositions:{},
      currentFamilyId:families.length ? families[0].id : null
    };
  }



  // ========【遊戲族譜增量更新】 設定 - 依穩定遊戲 ID 更新遊戲資料，保留網站資料 ========
  function gameSimIdSet(database) {
    const ids = new Set();

    Object.values(database?.sims || {})
      .forEach(sim => {
        const id = recordGameId(sim);
        if (id) ids.add(id);
      });

    return ids;
  }

  function householdIdSet(database) {
    const ids = new Set();

    (database?.families || [])
      .forEach(family => {
        const id =
          family?.gameImport &&
          family?.gameData?.householdId != null
            ? String(family.gameData.householdId)
            : '';

        if (id) ids.add(id);
      });

    return ids;
  }

  function analyzeUpdateCandidate(currentDatabase, incomingDatabase) {
    const currentIds =
      gameSimIdSet(currentDatabase);

    const incomingIds =
      gameSimIdSet(incomingDatabase);

    const matchedSimIds =
      [...incomingIds]
        .filter(id => currentIds.has(id));

    const newSimIds =
      [...incomingIds]
        .filter(id => !currentIds.has(id));

    const missingSimIds =
      [...currentIds]
        .filter(id => !incomingIds.has(id));

    const currentHouseholds =
      householdIdSet(currentDatabase);

    const incomingHouseholds =
      householdIdSet(incomingDatabase);

    const source =
      compareSaveSource(
        currentDatabase,
        incomingDatabase
      );

    return {
      sourceVerification:
        source.verification,
      source,
      currentGameSimCount:currentIds.size,
      incomingGameSimCount:incomingIds.size,
      matchedSimCount:matchedSimIds.length,
      newSimCount:newSimIds.length,
      missingSimCount:missingSimIds.length,
      matchedSimIds,
      newSimIds,
      missingSimIds,
      currentHouseholdCount:currentHouseholds.size,
      incomingHouseholdCount:incomingHouseholds.size,
      matchedHouseholdCount:
        [...incomingHouseholds]
          .filter(id => currentHouseholds.has(id))
          .length
    };
  }

  function latestImportTracking(
    gameData,
    importedAt,
    present = true
  ) {
    return {
      ...(gameData &&
      typeof gameData === 'object' &&
      !Array.isArray(gameData)
        ? gameData
        : {}),
      source:'game',
      presentInLatestImport:!!present,
      ...(present
        ? { lastSeenAt:importedAt || null }
        : {})
    };
  }

  function incomingPetIdSet(database) {
    const ids = new Set();

    Object.values(database?.sims || {})
      .forEach(sim => {
        (sim?.pets || [])
          .forEach(pet => {
            const id = recordGameId(pet);
            if (id) ids.add(id);
          });
      });

    (database?.meta?.unassignedPets || [])
      .forEach(pet => {
        const id = recordGameId(pet);
        if (id) ids.add(id);
      });

    return ids;
  }

  function incomingAssignedPetIdSet(database) {
    const ids = new Set();

    Object.values(database?.sims || {})
      .forEach(sim => {
        (sim?.pets || [])
          .forEach(pet => {
            const id = recordGameId(pet);
            if (id) ids.add(id);
          });
      });

    return ids;
  }

  function trackPet(stats, kind, petId) {
    if (!petId) return;
    stats._petSets[kind].add(String(petId));
  }

  function mergeGamePet(
    existingPet,
    incomingPet,
    context
  ) {
    const importedAt =
      context.importedAt;

    const petId =
      recordGameId(incomingPet) ||
      recordGameId(existingPet);

    if (!existingPet) {
      const created =
        cloneData(incomingPet);

      created.gameData =
        latestImportTracking(
          created.gameData,
          importedAt,
          true
        );

      created.gameData.manualOverrides =
        uniqueStrings(
          created.gameData.manualOverrides
        );

      trackPet(
        context.stats,
        'added',
        petId
      );

      return created;
    }

    const result =
      cloneData(existingPet);

    const overrides =
      manualOverrideSet(existingPet);

    GAME_MANAGED_PET_FIELDS
      .filter(field =>
        field !== 'avatar' &&
        field !== 'avatarFrame'
      )
      .forEach(field => {
        if (overrides.has(field)) return;

        if (
          Object.prototype.hasOwnProperty.call(
            incomingPet,
            field
          )
        ) {
          result[field] =
            cloneData(
              incomingPet[field]
            );
        }
      });

    if (!overrides.has('avatar')) {
      if (incomingPet.avatar) {
        result.avatar =
          incomingPet.avatar;

        result.avatarFrame =
          cloneData(
            incomingPet.avatarFrame
          );
      }
    }

    const existingGameData =
      existingPet.gameData || {};

    const incomingGameData =
      incomingPet.gameData || {};

    result.gameData =
      latestImportTracking(
        {
          ...cloneData(existingGameData),
          ...cloneData(incomingGameData),
          manualOverrides:[
            ...overrides
          ]
        },
        importedAt,
        true
      );

    trackPet(
      context.stats,
      'matched',
      petId
    );

    return result;
  }

  function markPetNotSeen(
    pet,
    context
  ) {
    const copy =
      cloneData(pet);

    const petId =
      recordGameId(copy);

    copy.gameData =
      latestImportTracking(
        copy.gameData,
        context.importedAt,
        false
      );

    trackPet(
      context.stats,
      'notSeen',
      petId
    );

    return copy;
  }

  function mergeOwnerPets(
    currentPets,
    incomingPets,
    context
  ) {
    const currentList =
      Array.isArray(currentPets)
        ? currentPets
        : [];

    const incomingList =
      Array.isArray(incomingPets)
        ? incomingPets
        : [];

    const currentGamePets =
      new Map();

    const manualPets = [];

    currentList.forEach(pet => {
      const id = recordGameId(pet);

      if (id) {
        currentGamePets.set(
          id,
          pet
        );
      } else {
        manualPets.push(
          cloneData(pet)
        );
      }
    });

    const mergedGamePets = [];
    const incomingOwnerIds =
      new Set();

    incomingList.forEach(pet => {
      const id =
        recordGameId(pet);

      if (!id) return;

      incomingOwnerIds.add(id);

      mergedGamePets.push(
        mergeGamePet(
          currentGamePets.get(id) || null,
          pet,
          context
        )
      );
    });

    currentGamePets.forEach(
      (pet, id) => {
        if (
          incomingOwnerIds.has(id)
        ) {
          return;
        }

        // 寵物仍存在於這次 ZIP、但已不屬於這位主人：視為搬家，不在舊主人底下保留複本。
        if (
          context.incomingPetIds.has(id)
        ) {
          return;
        }

        mergedGamePets.push(
          markPetNotSeen(
            pet,
            context
          )
        );
      }
    );

    return [
      ...manualPets,
      ...mergedGamePets
    ];
  }

  function mergeGameSim(
    existingSim,
    incomingSim,
    context
  ) {
    const importedAt =
      context.importedAt;

    const incomingId =
      recordGameId(incomingSim) ||
      String(incomingSim?.id || '');

    if (!existingSim) {
      const created =
        cloneData(incomingSim);

      created.gameData =
        latestImportTracking(
          created.gameData,
          importedAt,
          true
        );

      created.gameData.manualOverrides =
        uniqueStrings(
          created.gameData.manualOverrides
        );

      created.pets =
        mergeOwnerPets(
          [],
          created.pets,
          context
        );

      return created;
    }

    const result =
      cloneData(existingSim);

    const overrides =
      manualOverrideSet(existingSim);

    GAME_MANAGED_SIM_FIELDS
      .forEach(field => {
        if (overrides.has(field)) return;

        if (
          Object.prototype.hasOwnProperty.call(
            incomingSim,
            field
          )
        ) {
          result[field] =
            cloneData(
              incomingSim[field]
            );
        }
      });

    if (!overrides.has('parents')) {
      result.parentIds =
        cloneData(
          incomingSim.parentIds || []
        );
    }

    if (!overrides.has('partners')) {
      result.spouseIds =
        cloneData(
          incomingSim.spouseIds || []
        );

      result.exSpouseIds =
        cloneData(
          incomingSim.exSpouseIds || []
        );
    }

    // 遊戲頭像只更新 gameAvatar；玩家自訂頭像與目前顯示來源由網站保留。
    if (incomingSim.gameAvatar) {
      const hadGameAvatar =
        !!existingSim.gameAvatar;

      result.gameAvatar =
        incomingSim.gameAvatar;

      if (!hadGameAvatar) {
        result.gameAvatarFrame =
          cloneData(
            incomingSim.gameAvatarFrame
          );
      }
    }

    // 人生照片、簡介與網站手動內容由 existingSim 保留。
    result.pets =
      mergeOwnerPets(
        existingSim.pets,
        incomingSim.pets,
        context
      );

    const existingGameData =
      existingSim.gameData || {};

    const incomingGameData =
      incomingSim.gameData || {};

    result.gameData =
      latestImportTracking(
        {
          ...cloneData(existingGameData),
          ...cloneData(incomingGameData),
          manualOverrides:[
            ...overrides
          ]
        },
        importedAt,
        true
      );

    if (overrides.has('parents')) {
      result.gameData.adoptedParentIds =
        cloneData(
          existingGameData.adoptedParentIds || []
        );
    }

    if (overrides.has('partners')) {
      result.gameData.deceasedSpouseIds =
        cloneData(
          existingGameData.deceasedSpouseIds || []
        );
    }

    if (!result.id) {
      result.id =
        incomingId;
    }

    return result;
  }

  function markSimNotSeen(
    sim,
    context
  ) {
    const copy =
      cloneData(sim);

    copy.gameData =
      latestImportTracking(
        copy.gameData,
        context.importedAt,
        false
      );

    (copy.pets || [])
      .forEach(pet => {
        if (!recordGameId(pet)) return;
        pet.gameData =
          latestImportTracking(
            pet.gameData,
            context.importedAt,
            false
          );
      });

    return copy;
  }

  function familyLookupKey(family) {
    const householdId =
      family?.gameData?.householdId;

    if (
      householdId != null &&
      String(householdId)
    ) {
      return (
        'household:' +
        String(householdId)
      );
    }

    return (
      'family:' +
      String(family?.id || '')
    );
  }

  function mergeImportedFamily(
    existingFamily,
    incomingFamily,
    context
  ) {
    if (!existingFamily) {
      const created =
        cloneData(incomingFamily);

      created.gameData =
        latestImportTracking(
          created.gameData,
          context.importedAt,
          true
        );

      created.gameData.manualOverrides =
        uniqueStrings(
          created.gameData.manualOverrides
        );

      return created;
    }

    const result =
      cloneData(existingFamily);

    const overrides =
      manualOverrideSet(existingFamily);

    if (!overrides.has('name')) {
      result.name =
        incomingFamily.name;
    }

    if (!overrides.has('bio')) {
      result.bio =
        incomingFamily.bio;
    }

    result.memberIds =
      cloneData(
        incomingFamily.memberIds || []
      );

    // coverImage / freeLayout / manualPositions / locked 都屬網站工作區資料，保留 existing。
    result.gameImport = true;

    result.gameData =
      latestImportTracking(
        {
          ...cloneData(existingFamily.gameData || {}),
          ...cloneData(incomingFamily.gameData || {}),
          manualOverrides:[
            ...overrides
          ]
        },
        context.importedAt,
        true
      );

    return result;
  }

  function markFamilyNotSeen(
    family,
    context
  ) {
    const copy =
      cloneData(family);

    copy.gameData =
      latestImportTracking(
        copy.gameData,
        context.importedAt,
        false
      );

    return copy;
  }

  function mergeUnassignedPets(
    currentDatabase,
    incomingDatabase,
    context
  ) {
    const currentList =
      Array.isArray(
        currentDatabase?.meta?.unassignedPets
      )
        ? currentDatabase.meta.unassignedPets
        : [];

    const incomingList =
      Array.isArray(
        incomingDatabase?.meta?.unassignedPets
      )
        ? incomingDatabase.meta.unassignedPets
        : [];

    const manualPets = [];
    const currentGamePets =
      new Map();

    currentList.forEach(pet => {
      const id = recordGameId(pet);

      if (id) {
        currentGamePets.set(id, pet);
      } else {
        manualPets.push(cloneData(pet));
      }
    });

    const merged = [];
    const incomingUnassignedIds =
      new Set();

    incomingList.forEach(pet => {
      const id = recordGameId(pet);
      if (!id) return;

      incomingUnassignedIds.add(id);

      merged.push(
        mergeGamePet(
          currentGamePets.get(id) || null,
          pet,
          context
        )
      );
    });

    currentGamePets.forEach(
      (pet, id) => {
        if (
          incomingUnassignedIds.has(id)
        ) {
          return;
        }

        // 本次已被分配給人物，不再保留在「未分配寵物」。
        if (
          context.incomingAssignedPetIds.has(id)
        ) {
          return;
        }

        if (
          !context.incomingPetIds.has(id)
        ) {
          merged.push(
            markPetNotSeen(
              pet,
              context
            )
          );
        }
      }
    );

    return [
      ...manualPets,
      ...merged
    ];
  }

  function rebuildAdoptedChildIds(database) {
    const sims =
      database?.sims || {};

    Object.values(sims)
      .forEach(sim => {
        if (
          !sim ||
          typeof sim !== 'object'
        ) {
          return;
        }

        if (
          !sim.gameData ||
          typeof sim.gameData !== 'object' ||
          Array.isArray(sim.gameData)
        ) {
          sim.gameData = {};
        }

        sim.gameData.adoptedChildIds = [];
      });

    Object.values(sims)
      .forEach(child => {
        if (!child) return;

        uniqueStrings(
          child.gameData?.adoptedParentIds
        )
          .forEach(parentId => {
            const parent =
              sims[parentId];

            if (!parent) return;

            parent.gameData.adoptedChildIds =
              uniqueStrings([
                ...(parent.gameData.adoptedChildIds || []),
                String(child.id)
              ]);
          });
      });
  }

  function mergeGameRelationships(
    currentDatabase,
    incomingDatabase,
    mergedDatabase,
    stats
  ) {
    const currentLinks =
      Array.isArray(currentDatabase?.links)
        ? currentDatabase.links
        : [];

    const incomingLinks =
      Array.isArray(incomingDatabase?.links)
        ? incomingDatabase.links
        : [];

    const suppressed =
      new Set(
        uniqueStrings(
          currentDatabase?.meta
            ?.suppressedGameRelationshipIds
        )
      );

    const manualLinks =
      currentLinks
        .filter(link =>
          !isGameRelationshipLink(link)
        )
        .map(cloneData);

    const currentGameLinks =
      new Map(
        currentLinks
          .filter(isGameRelationshipLink)
          .map(link => [
            String(link.id || ''),
            link
          ])
          .filter(([id]) => id)
      );

    const nextGameLinks = [];
    const incomingIds =
      new Set();

    incomingLinks
      .filter(isGameRelationshipLink)
      .forEach(link => {
        const id =
          String(link.id || '');

        if (
          !id ||
          suppressed.has(id)
        ) {
          return;
        }

        incomingIds.add(id);

        const existing =
          currentGameLinks.get(id);

        if (!existing) {
          nextGameLinks.push({
            ...cloneData(link),
            source:'game'
          });

          stats.relationships.added++;
          return;
        }

        const overrides =
          new Set(
            Array.isArray(existing.manualOverrides)
              ? existing.manualOverrides.map(String)
              : []
          );

        const next =
          cloneData(existing);

        ['from','to','type','label']
          .forEach(field => {
            if (overrides.has(field)) return;
            next[field] =
              cloneData(link[field]);
          });

        next.source = 'game';
        next.manualOverrides =
          [...overrides];

        nextGameLinks.push(next);
        stats.relationships.matched++;
      });

    currentGameLinks.forEach(
      (link, id) => {
        if (
          !incomingIds.has(id) &&
          !suppressed.has(id)
        ) {
          stats.relationships.removed++;
        }
      }
    );

    const nextIds =
      new Set(
        nextGameLinks
          .map(link =>
            String(link.id || '')
          )
          .filter(Boolean)
      );

    const removedIds =
      new Set(
        [...currentGameLinks.keys()]
          .filter(id =>
            !nextIds.has(id)
          )
      );

    mergedDatabase.links = [
      ...manualLinks,
      ...nextGameLinks
    ];

    const pruneAnnotations =
      source => {
        const next = {
          ...(source || {})
        };

        removedIds.forEach(id => {
          delete next['link:' + id];
        });

        return next;
      };

    mergedDatabase.relationshipMap =
      pruneAnnotations(
        currentDatabase.relationshipMap
      );

    mergedDatabase.labelPositions =
      pruneAnnotations(
        currentDatabase.labelPositions
      );
  }

  function mergeConvertedDatabase(
    currentDatabase,
    incomingDatabase,
    options = {}
  ) {
    if (
      !currentDatabase ||
      typeof currentDatabase !== 'object' ||
      !incomingDatabase ||
      typeof incomingDatabase !== 'object'
    ) {
      throw new Error(
        '遊戲族譜更新需要目前資料與新的遊戲匯入資料。'
      );
    }

    const analysis =
      analyzeUpdateCandidate(
        currentDatabase,
        incomingDatabase
      );

    const importedAt =
      incomingDatabase?.meta?.exportedAt ||
      null;

    const sourceVerification =
      String(
        options.sourceVerification ||
        analysis.sourceVerification ||
        'unverified'
      );

    const stats = {
      people:{
        matched:analysis.matchedSimCount,
        added:analysis.newSimCount,
        notSeen:analysis.missingSimCount
      },
      pets:{
        matched:0,
        added:0,
        notSeen:0
      },
      families:{
        matched:0,
        added:0,
        notSeen:0
      },
      relationships:{
        matched:0,
        added:0,
        removed:0
      },
      _petSets:{
        matched:new Set(),
        added:new Set(),
        notSeen:new Set()
      }
    };

    const context = {
      importedAt,
      stats,
      incomingPetIds:
        incomingPetIdSet(
          incomingDatabase
        ),
      incomingAssignedPetIds:
        incomingAssignedPetIdSet(
          incomingDatabase
        )
    };

    const merged =
      cloneData(currentDatabase);

    if (
      !merged.meta ||
      typeof merged.meta !== 'object' ||
      Array.isArray(merged.meta)
    ) {
      merged.meta = {};
    }

    const currentCardView =
      cloneData(
        currentDatabase?.meta?.cardView
      );

    const currentCardEdit =
      cloneData(
        currentDatabase?.meta?.cardEdit
      );

    merged.meta = {
      ...cloneData(currentDatabase.meta || {}),
      ...cloneData(incomingDatabase.meta || {}),
      ...(currentCardView
        ? { cardView:currentCardView }
        : {}),
      ...(currentCardEdit
        ? { cardEdit:currentCardEdit }
        : {}),
      gameImport:true,
      gameImportSource:
        mergeGameImportSource(
          currentDatabase,
          incomingDatabase,
          sourceVerification,
          importedAt
        ),
      gameImportUpdate:{
        sourceVerification,
        lastMode:'update',
        lastImportedAt:importedAt
      }
    };

    const currentSims =
      currentDatabase.sims || {};

    const incomingSims =
      incomingDatabase.sims || {};

    const mergedSims = {};
    let nextOrder =
      Math.max(
        -1,
        ...Object.values(currentSims)
          .map(sim =>
            Number.isFinite(
              Number(sim?.order)
            )
              ? Number(sim.order)
              : -1
          )
      ) + 1;

    Object.entries(currentSims)
      .forEach(([id, sim]) => {
        if (!recordGameId(sim)) {
          mergedSims[id] =
            cloneData(sim);
        }
      });

    const matchedCurrentKeys =
      new Set();

    const currentGameBySimId =
      new Map();

    Object.entries(currentSims)
      .forEach(([key, sim]) => {
        const gameId =
          recordGameId(sim);

        if (gameId) {
          currentGameBySimId.set(
            gameId,
            { key, sim }
          );
        }
      });

    Object.entries(incomingSims)
      .forEach(([incomingKey, incomingSim]) => {
        const gameId =
          recordGameId(incomingSim) ||
          String(incomingKey);

        const currentEntry =
          currentGameBySimId.get(gameId);

        if (
          !currentEntry &&
          mergedSims[incomingKey]
        ) {
          throw new Error(
            '遊戲人物 ID 與網站手動人物發生衝突：' +
            incomingKey
          );
        }

        const mergedSim =
          mergeGameSim(
            currentEntry?.sim || null,
            incomingSim,
            context
          );

        const targetKey =
          currentEntry?.key ||
          String(incomingKey);

        if (!currentEntry) {
          mergedSim.order =
            nextOrder++;
        }

        mergedSims[targetKey] =
          mergedSim;

        if (currentEntry) {
          matchedCurrentKeys.add(
            currentEntry.key
          );
        }
      });

    currentGameBySimId.forEach(
      ({ key, sim }) => {
        if (
          matchedCurrentKeys.has(key)
        ) {
          return;
        }

        mergedSims[key] =
          markSimNotSeen(
            sim,
            context
          );
      }
    );

    merged.sims =
      mergedSims;

    const currentFamilies =
      Array.isArray(currentDatabase.families)
        ? currentDatabase.families
        : [];

    const incomingFamilies =
      Array.isArray(incomingDatabase.families)
        ? incomingDatabase.families
        : [];

    const manualFamilies =
      currentFamilies
        .filter(family =>
          !family?.gameImport
        )
        .map(cloneData);

    const currentImportedByKey =
      new Map(
        currentFamilies
          .filter(family =>
            !!family?.gameImport
          )
          .map(family => [
            familyLookupKey(family),
            family
          ])
      );

    const seenFamilyKeys =
      new Set();

    const nextImportedFamilies = [];

    incomingFamilies
      .filter(family =>
        !!family?.gameImport
      )
      .forEach(family => {
        const key =
          familyLookupKey(family);

        const existing =
          currentImportedByKey.get(key);

        nextImportedFamilies.push(
          mergeImportedFamily(
            existing || null,
            family,
            context
          )
        );

        seenFamilyKeys.add(key);

        if (existing) {
          stats.families.matched++;
        } else {
          stats.families.added++;
        }
      });

    currentImportedByKey.forEach(
      (family, key) => {
        if (seenFamilyKeys.has(key)) {
          return;
        }

        nextImportedFamilies.push(
          markFamilyNotSeen(
            family,
            context
          )
        );

        stats.families.notSeen++;
      }
    );

    merged.families = [
      ...manualFamilies,
      ...nextImportedFamilies
    ];

    merged.meta.unassignedPets =
      mergeUnassignedPets(
        currentDatabase,
        incomingDatabase,
        context
      );

    mergeGameRelationships(
      currentDatabase,
      incomingDatabase,
      merged,
      stats
    );

    merged.relationshipTypeLibrary =
      uniqueStrings([
        ...(currentDatabase.relationshipTypeLibrary || []),
        ...(incomingDatabase.relationshipTypeLibrary || [])
      ]);

    const currentFamilyId =
      currentDatabase.currentFamilyId;

    merged.currentFamilyId =
      merged.families.some(
        family =>
          String(family?.id || '') ===
          String(currentFamilyId || '')
      )
        ? currentFamilyId
        : (
            incomingDatabase.currentFamilyId ||
            merged.families[0]?.id ||
            null
          );

    rebuildAdoptedChildIds(
      merged
    );

    stats.pets = {
      matched:
        stats._petSets.matched.size,
      added:
        stats._petSets.added.size,
      notSeen:
        stats._petSets.notSeen.size
    };

    delete stats._petSets;

    return {
      database:merged,
      stats,
      analysis
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
    analyzeUpdateCandidate,
    compareSaveSource,
    normalizeSaveSlot,
    mergeConvertedDatabase,
    GAME_MANAGED_SIM_FIELDS,
    GAME_MANAGED_PET_FIELDS,
    readStoredZip,
    isPetSim,
    mapOccultRace,
    classifyGamePerson,
    householdShouldCreateFamily,
    expandHouseholdGenealogy,
    findSimAvatarPath,
    prepareGameAvatarAsset,
    getSimAvatarAsset
  };
})(window);
