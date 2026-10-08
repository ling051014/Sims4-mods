/* ========【L1nG Genealogy Store】 設定 - canonical genealogy data 的唯一持有者與修改入口 ======== */
(function (global) {
  'use strict';

  const FLAGS = [
    'dataChanged',
    'relationshipGraphChanged',
    'childrenIndexChanged',
    'familyMembershipChanged',
    'familiesChanged',
    'layoutChanged',
    'nodesChanged',
    'edgesChanged',
    'chromeChanged',
    'listsChanged',
    'familyUiChanged',
    'saveDirty',
    'assetsChanged',
    'relationshipTypeLibraryChanged'
  ];

  const BLOCKED_SIM_PATCH_KEYS = new Set([
    'id','order','parentIds','spouseIds','exSpouseIds','gameData'
  ]);

  const SIM_LAYOUT_FIELDS = new Set([
    'lifeStage','gender','status','race','age',
    'birthdayYear','birthdayMonth','birthdayDay',
    'career','residence','aspiration','causeOfDeath',
    'traits','pets','gallery'
  ]);

  const SIM_ASSET_FIELDS = new Set(['avatar','gameAvatar','customAvatar','pets','gallery']);

  function cloneValue(value) {
    if (value == null || typeof value !== 'object') return value;
    return JSON.parse(JSON.stringify(value));
  }

  function sameValue(left, right) {
    if (left === right) return true;
    if (left == null || right == null) return false;
    if (typeof left !== 'object' || typeof right !== 'object') return false;
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch (_) {
      return false;
    }
  }

  function uniqueIds(values, data, selfId) {
    const selfKey = selfId == null ? '' : String(selfId);
    return [...new Set(
      (values || [])
        .map(String)
        .filter(id => id && id !== selfKey && data.sims[id])
    )];
  }

  function rawResult() {
    const result = {
      affectedSimIds:new Set(),
      affectedFamilyIds:new Set()
    };
    FLAGS.forEach(flag => {
      result[flag] = false;
    });
    return result;
  }

  function addAffected(result, kind, values) {
    const target = kind === 'family'
      ? result.affectedFamilyIds
      : result.affectedSimIds;
    (values || []).forEach(value => {
      if (value != null && String(value)) target.add(String(value));
    });
  }

  function mark(result, flags) {
    Object.entries(flags || {}).forEach(([key, value]) => {
      if (FLAGS.includes(key) && value) result[key] = true;
    });
    return result;
  }

  function finalized(result) {
    const output = {};
    FLAGS.forEach(flag => {
      output[flag] = !!result?.[flag];
    });
    output.affectedSimIds = result?.affectedSimIds instanceof Set
      ? [...result.affectedSimIds]
      : [...new Set(result?.affectedSimIds || [])];
    output.affectedFamilyIds = result?.affectedFamilyIds instanceof Set
      ? [...result.affectedFamilyIds]
      : [...new Set(result?.affectedFamilyIds || [])];
    if (result?.simId) output.simId = String(result.simId);
    if (result?.familyId) output.familyId = String(result.familyId);
    if (result?.relationshipId) output.relationshipId = String(result.relationshipId);
    return output;
  }

  function mergeResults() {
    const merged = rawResult();
    [...arguments].filter(Boolean).forEach(item => {
      FLAGS.forEach(flag => {
        if (item[flag]) merged[flag] = true;
      });
      addAffected(merged, 'sim', item.affectedSimIds);
      addAffected(merged, 'family', item.affectedFamilyIds);
      if (item.simId) merged.simId = String(item.simId);
      if (item.familyId) merged.familyId = String(item.familyId);
      if (item.relationshipId) merged.relationshipId = String(item.relationshipId);
    });
    return finalized(merged);
  }

  function create({
    uid,
    isSiblingLink,
    siblingRelationType = 'sibling',
    siblingRelationLabel = '兄弟姊妹',
    normalizeRelationshipType = value => String(value || '').trim(),
    isBuiltInRelationshipType = () => false,
    isSymmetricRelationshipType = () => false,
    normalizeTraitText = value => String(value ?? '').trim(),
    normalizeAvatarFrame = frame => (
      frame && typeof frame === 'object' && !Array.isArray(frame)
        ? cloneValue(frame)
        : null
    ),
    petSpeciesValues = [],
    sexedPetSpeciesValues = ['dog','cat','horse'],
    gameManagedSimFields = [],
    cardSettingFieldKeys = [],
    defaultCardViewSettings = {},
    defaultCardEditSettings = {},
    cardViewAppearances = ['minimal','translucent','full']
  } = {}) {
    let activeData = null;

    const cardSettingFields = new Set(
      (cardSettingFieldKeys || [])
        .map(String)
        .filter(Boolean)
    );

    const cardAppearanceValues = new Set(
      (cardViewAppearances || [])
        .map(String)
        .filter(Boolean)
    );

    const petSpeciesSet = new Set(
      (petSpeciesValues || [])
        .map(String)
        .filter(Boolean)
    );

    const sexedPetSpeciesSet = new Set(
      (sexedPetSpeciesValues || [])
        .map(String)
        .filter(Boolean)
    );

    const gameManagedSimFieldSet = new Set(
      (gameManagedSimFields || [])
        .map(String)
        .filter(Boolean)
    );

    function isGameImportedRecord(record) {
      return !!(
        record &&
        record.gameData &&
        record.gameData.simId != null &&
        String(record.gameData.simId)
      );
    }

    function manualOverrideValues(record) {
      return [...new Set(
        (
          Array.isArray(record?.gameData?.manualOverrides)
            ? record.gameData.manualOverrides
            : []
        )
          .map(String)
          .filter(Boolean)
      )];
    }

    function markManualOverrides(record, fields) {
      if (!isGameImportedRecord(record)) {
        return false;
      }

      if (
        !record.gameData ||
        typeof record.gameData !== 'object' ||
        Array.isArray(record.gameData)
      ) {
        record.gameData = {};
      }

      const before =
        manualOverrideValues(record);

      const next =
        [...new Set([
          ...before,
          ...(fields || [])
            .map(String)
            .filter(Boolean)
        ])];

      if (sameValue(before, next)) {
        return false;
      }

      record.gameData.manualOverrides =
        next;

      return true;
    }

    // ========【人物頭像雙來源】 設定 - 只接受目前 schema；avatar / avatarFrame 僅作目前顯示衍生值 ========
    function syncSimAvatarSources(record) {
      if (
        !record ||
        typeof record !== 'object' ||
        Array.isArray(record)
      ) {
        return;
      }

      if (record.gameAvatar === undefined) {
        record.gameAvatar = null;
      }

      if (record.customAvatar === undefined) {
        record.customAvatar = null;
      }

      record.gameAvatarFrame =
        record.gameAvatar
          ? normalizeAvatarFrame(
              record.gameAvatarFrame
            )
          : null;

      record.customAvatarFrame =
        record.customAvatar
          ? normalizeAvatarFrame(
              record.customAvatarFrame
            )
          : null;

      let source =
        record.avatarSource === 'game' ||
        record.avatarSource === 'custom'
          ? record.avatarSource
          : record.customAvatar
            ? 'custom'
            : record.gameAvatar
              ? 'game'
              : 'custom';

      if (
        source === 'game' &&
        !record.gameAvatar &&
        record.customAvatar
      ) {
        source = 'custom';
      } else if (
        source === 'custom' &&
        !record.customAvatar &&
        record.gameAvatar
      ) {
        source = 'game';
      }

      record.avatarSource = source;

      record.avatar =
        source === 'game'
          ? record.gameAvatar
          : record.customAvatar;

      record.avatarFrame =
        normalizeAvatarFrame(
          source === 'game'
            ? record.gameAvatarFrame
            : record.customAvatarFrame
        );
    }

    function normalizePetGenderValue(value) {
      const text =
        String(value || '')
          .trim()
          .toLowerCase();

      if (['male','男','公'].includes(text)) {
        return 'male';
      }

      if (['female','女','母'].includes(text)) {
        return 'female';
      }

      return '';
    }

    function normalizePetRecord(pet) {
      if (!pet || typeof pet !== 'object' || Array.isArray(pet)) {
        return null;
      }

      const rawSpecies =
        String(pet.species || '');

      const species =
        petSpeciesSet.has(rawSpecies)
          ? rawSpecies
          : (
              petSpeciesSet.has('other')
                ? 'other'
                : rawSpecies
            );

      const normalized = {
        ...pet,
        id:String(
          pet.id ||
          (
            typeof uid === 'function'
              ? uid('pet')
              : 'pet_' + Date.now()
          )
        ),
        name:pet.name || '',
        species,
        breed:pet.breed || '',
        gender:
          sexedPetSpeciesSet.has(species)
            ? (
                normalizePetGenderValue(
                  pet.gender
                ) ||
                'male'
              )
            : '',
        ageStage:pet.ageStage || '成年',
        status:pet.status || '在世',
        traits:
          Array.isArray(pet.traits)
            ? pet.traits
                .map(normalizeTraitText)
                .filter(Boolean)
            : [],
        avatar:pet.avatar || null,
        avatarFrame:
          normalizeAvatarFrame(
            pet.avatarFrame
          )
      };

      if (
        normalized.gameData &&
        typeof normalized.gameData === 'object' &&
        !Array.isArray(normalized.gameData)
      ) {
        normalized.gameData.manualOverrides =
          manualOverrideValues(
            normalized
          );
      }

      return normalized;
    }

    function normalizeGalleryItem(item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      return {
        ...item,
        id:String(
          item.id ||
          (
            typeof uid === 'function'
              ? uid('gal')
              : 'gal_' + Date.now()
          )
        ),
        title:item.title || '',
        note:item.note || '',
        lifeStage:item.lifeStage || '',
        image:item.image || '',
        addedAt:item.addedAt || Date.now()
      };
    }

    function normalizeCardSettings(mode, current) {
      const normalizedMode =
        mode === 'edit'
          ? 'edit'
          : 'view';

      const defaults =
        normalizedMode === 'edit'
          ? defaultCardEditSettings
          : defaultCardViewSettings;

      const settings =
        current &&
        typeof current === 'object' &&
        !Array.isArray(current)
          ? current
          : {};

      settings.avatar = true;

      if (
        typeof settings.genderBar ===
        'boolean'
      ) {
        settings.gender =
          !!settings.gender ||
          settings.genderBar;

        delete settings.genderBar;
      }

      cardSettingFields.forEach(field => {
        if (typeof settings[field] !== 'boolean') {
          settings[field] = !!defaults[field];
        }
      });

      if (normalizedMode === 'view') {
        const fallbackAppearance =
          cardAppearanceValues.has(
            String(defaults.appearance || '')
          )
            ? String(defaults.appearance)
            : 'minimal';

        if (
          !cardAppearanceValues.has(
            String(settings.appearance || '')
          )
        ) {
          settings.appearance =
            fallbackAppearance;
        }
      }

      return settings;
    }

    function ensureCardSettings(current) {
      if (
        !current.meta ||
        typeof current.meta !== 'object' ||
        Array.isArray(current.meta)
      ) {
        current.meta = {};
      }

      current.meta.cardView =
        normalizeCardSettings(
          'view',
          current.meta.cardView
        );

      current.meta.cardEdit =
        normalizeCardSettings(
          'edit',
          current.meta.cardEdit
        );

      return current.meta;
    }

    function normalizeSimRecord(sim, simId, current) {
      if (!sim || typeof sim !== 'object' || Array.isArray(sim)) {
        return null;
      }

      const id =
        String(
          simId ||
          sim.id ||
          ''
        );

      sim.id = id;
      sim.gender = sim.gender || '男';
      sim.lifeStage = sim.lifeStage || '成年';
      sim.status = sim.status || '在世';

      sim.parentIds =
        uniqueIds(
          Array.isArray(sim.parentIds)
            ? sim.parentIds
            : [],
          current,
          id
        );

      sim.spouseIds =
        uniqueIds(
          Array.isArray(sim.spouseIds)
            ? sim.spouseIds
            : [],
          current,
          id
        );

      sim.exSpouseIds =
        uniqueIds(
          Array.isArray(sim.exSpouseIds)
            ? sim.exSpouseIds
            : [],
          current,
          id
        );

      sim.traits =
        Array.isArray(sim.traits)
          ? sim.traits
              .map(normalizeTraitText)
              .filter(Boolean)
          : [];

      if (sim.race === undefined) sim.race = '';
      if (sim.residence === undefined) sim.residence = '';
      if (sim.aspiration === undefined) sim.aspiration = '';
      if (sim.causeOfDeath === undefined) sim.causeOfDeath = '';
      if (typeof sim.notes !== 'string') sim.notes = '';

      // 人物簡介已由 notes 取代；原版世家欄位也不屬於現行 schema。
      // 只清人物記錄，不影響家庭 family.bio。
      delete sim.bio;
      delete sim.dynasties;
      delete sim.dynastyRole;

      const gameData =
        ensureAdoptionMetadata(
          sim
        );

      gameData.manualOverrides =
        manualOverrideValues(
          sim
        );

      syncSimAvatarSources(
        sim
      );

      gameData.adoptedParentIds =
        uniqueIds(
          gameData.adoptedParentIds,
          current,
          id
        );

      gameData.adoptedChildIds =
        uniqueIds(
          gameData.adoptedChildIds,
          current,
          id
        );

      gameData.deceasedSpouseIds =
        uniqueIds(
          Array.isArray(
            gameData.deceasedSpouseIds
          )
            ? gameData.deceasedSpouseIds
            : [],
          current,
          id
        );

      const deceasedSpouseIds =
        new Set(
          gameData.deceasedSpouseIds
        );

      sim.spouseIds =
        sim.spouseIds.filter(id =>
          !deceasedSpouseIds.has(id)
        );

      sim.pets =
        (Array.isArray(sim.pets)
          ? sim.pets
          : []
        )
          .map(normalizePetRecord)
          .filter(Boolean);

      sim.gallery =
        (Array.isArray(sim.gallery)
          ? sim.gallery
          : []
        )
          .map(normalizeGalleryItem)
          .filter(Boolean);

      return sim;
    }

    function normalizeRelationshipMap(current) {
      const source =
        current.relationshipMap &&
        typeof current.relationshipMap === 'object' &&
        !Array.isArray(current.relationshipMap)
          ? current.relationshipMap
          : {};

      const normalized = {};

      Object.entries(source)
        .forEach(([key, saved]) => {
          if (
            !saved ||
            typeof saved !== 'object' ||
            Array.isArray(saved)
          ) {
            return;
          }

          const text =
            typeof saved.text === 'string'
              ? saved.text.trim()
              : '';

          const hidden =
            saved.hidden === true ||
            saved.kind === 'none';

          if (!text && !hidden) {
            return;
          }

          normalized[key] = {
            ...(text ? { text } : {}),
            ...(hidden ? { hidden:true } : {})
          };
        });

      current.relationshipMap =
        normalized;
    }

    function normalizeDatabaseShape(current) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        throw new Error('Genealogy Store requires a canonical database object.');
      }

      current.sims =
        current.sims &&
        typeof current.sims === 'object' &&
        !Array.isArray(current.sims)
          ? current.sims
          : {};

      const normalizedSims = {};

      Object.entries(current.sims)
        .forEach(([id, sim]) => {
          const normalized =
            normalizeSimRecord(
              sim,
              id,
              current
            );

          if (normalized) {
            normalizedSims[String(id)] =
              normalized;
          }
        });

      current.sims =
        normalizedSims;

      Object.entries(current.sims)
        .forEach(([id, sim]) => {
          normalizeSimRecord(
            sim,
            id,
            current
          );
        });

      current.families =
        Array.isArray(current.families)
          ? current.families
              .filter(family =>
                family &&
                typeof family === 'object' &&
                !Array.isArray(family)
              )
          : [];

      const normalizedLinks =
        (Array.isArray(current.links)
          ? current.links
          : []
        )
          .filter(link =>
            link &&
            typeof link === 'object' &&
            !Array.isArray(link)
          )
          .map(link => {
            const id =
              String(
                link.id ||
                (
                  typeof uid === 'function'
                    ? uid('lnk')
                    : 'lnk_' + Date.now()
                )
              );

            const source =
              link.source === 'game' ||
              /^game_rel_/.test(id)
                ? 'game'
                : 'manual';

            const normalizedType =
              normalizeRelationshipType(
                link.type ||
                link.label ||
                '關聯'
              ) ||
              '關聯';

            const normalizedLabel =
              normalizeRelationshipType(
                link.label ||
                normalizedType
              ) ||
              normalizedType;

            let from =
              String(link.from || '');

            let to =
              String(link.to || '');

            if (
              isSymmetricRelationshipType(
                normalizedType
              ) &&
              from &&
              to &&
              from > to
            ) {
              [from, to] =
                [to, from];
            }

            return {
              ...link,
              id,
              from,
              to,
              type:normalizedType,
              label:normalizedLabel,
              source,
              manualOverrides:
                source === 'game'
                  ? [...new Set(
                      (
                        Array.isArray(link.manualOverrides)
                          ? link.manualOverrides
                          : []
                      )
                        .map(String)
                        .filter(Boolean)
                    )]
                  : []
            };
          });

      const symmetricKeys =
        new Set();

      current.links =
        normalizedLinks
          .filter(link => {
            if (
              !isSymmetricRelationshipType(
                link.type
              )
            ) {
              return true;
            }

            const key = [
              String(link.from || ''),
              String(link.to || ''),
              String(link.type || '')
            ].join('|');

            if (
              symmetricKeys.has(key)
            ) {
              return false;
            }

            symmetricKeys.add(key);
            return true;
          });

      normalizeRelationshipMap(
        current
      );

      current.labelPositions =
        current.labelPositions &&
        typeof current.labelPositions === 'object' &&
        !Array.isArray(current.labelPositions)
          ? current.labelPositions
          : {};

      const importedRelationshipTypeLibrary =
        Array.isArray(
          current.relationshipTypeLibrary
        )
          ? current.relationshipTypeLibrary
          : [];

      const relationshipTypesFromLinks =
        current.links
          .filter(link =>
            !isSiblingLink?.(link)
          )
          .map(link =>
            normalizeRelationshipType(
              link.label ||
              link.type ||
              ''
            )
          )
          .filter(Boolean);

      current.relationshipTypeLibrary =
        [...new Set([
          ...importedRelationshipTypeLibrary
            .map(
              normalizeRelationshipType
            )
            .filter(Boolean),
          ...relationshipTypesFromLinks
        ])]
          .filter(type =>
            type !== '關聯' &&
            !isBuiltInRelationshipType(
              type
            )
          );

      current.families
        .forEach(family => {
          family.id =
            String(
              family.id ||
              (
                typeof uid === 'function'
                  ? uid('fam')
                  : 'fam_' + Date.now()
              )
            );

          const importedHouseholdMemberIds =
            family.gameImport &&
            family.gameData?.householdId != null &&
            Array.isArray(
              family.gameData?.householdMemberIds
            )
              ? family.gameData.householdMemberIds
              : null;

          family.memberIds =
            uniqueIds(
              importedHouseholdMemberIds ||
              (
                Array.isArray(
                  family.memberIds
                )
                  ? family.memberIds
                  : []
              ),
              current,
              null
            );

          ensureFamilyLayout(
            family
          );

          if (
            family.gameData &&
            typeof family.gameData === 'object' &&
            !Array.isArray(family.gameData)
          ) {
            family.gameData.manualOverrides =
              [...new Set(
                (
                  Array.isArray(family.gameData.manualOverrides)
                    ? family.gameData.manualOverrides
                    : []
                )
                  .map(String)
                  .filter(Boolean)
              )];
          }

          if (
            typeof family.bio !==
            'string'
          ) {
            family.bio = '';
          }

          if (
            family.coverImage ===
            undefined
          ) {
            family.coverImage = null;
          }
        });

      if (
        current.meta &&
        Array.isArray(
          current.meta.unassignedPets
        )
      ) {
        current.meta.unassignedPets =
          current.meta.unassignedPets
            .map(normalizePetRecord)
            .filter(Boolean);
      }

      const currentFamilyKey =
        current.currentFamilyId == null
          ? ''
          : String(
              current.currentFamilyId
            );

      const currentFamily =
        current.families.find(
          family =>
            String(
              family.id || ''
            ) === currentFamilyKey
        );

      current.currentFamilyId =
        currentFamily
          ? String(currentFamily.id)
          : (
              current.families[0]
                ? String(
                    current.families[0].id
                  )
                : null
            );

      ensureCardSettings(
        current
      );

      return current;
    }

    function normalizeDatabase(current) {
      let before = null;

      try {
        before =
          JSON.stringify(
            current
          );
      } catch (_) {}

      const normalized =
        normalizeDatabaseShape(
          current
        );

      let changed = true;

      if (before !== null) {
        try {
          changed =
            JSON.stringify(
              normalized
            ) !== before;
        } catch (_) {}
      }

      return {
        data:normalized,
        changed
      };
    }

    // ========【資料序列化】固定使用目前的 canonical database；Blob 留給 Assets 備份 ========
    function serializeDatabase() {
      return JSON.stringify(activeData);
    }

    function snapshotDatabase() {
      return JSON.parse(serializeDatabase());
    }

    function getData() {
      return activeData;
    }

    function replaceDatabase(nextData) {
      activeData =
        normalizeDatabase(
          nextData
        ).data;
      invalidateChildrenIndex();

      return activeData;
    }

    function data() {
      if (!activeData) {
        throw new Error('Genealogy Store has no active canonical database.');
      }

      return activeData;
    }

    // ========【族譜查詢】Store 為 canonical 資料與關係判斷的唯一查詢來源 ========
    function canonicalParentRelations(child, byId = null) {
      if (!child) return [];

      const childId = String(child.id || '');
      const relationByParent = new Map();

      const hasParent = parentId => {
        const id = String(parentId || '');
        if (!id || id === childId) return false;
        return byId instanceof Map
          ? byId.has(id)
          : !!data().sims[id];
      };

      const addRelation = (parentId, kind) => {
        const id = String(parentId || '');
        if (!hasParent(id)) return;

        const current = relationByParent.get(id);
        if (current === 'adoptive') return;

        if (kind === 'adoptive' || !current) {
          relationByParent.set(id, kind);
        }
      };

      (child.parentIds || []).forEach(parentId => {
        addRelation(parentId, 'parent-child');
      });

      const explicitAdoptedParentIds =
        (child.gameData?.adoptedParentIds || [])
          .map(String)
          .filter(Boolean);

      explicitAdoptedParentIds.forEach(parentId => {
        addRelation(parentId, 'adoptive');
      });

      const parentPool =
        byId instanceof Map
          ? [...byId.values()]
          : Object.values(data().sims);

      parentPool.forEach(parent => {
        if (!parent || parent.id == null) return;

        const adoptedChildIds =
          (parent.gameData?.adoptedChildIds || [])
            .map(String);

        if (adoptedChildIds.includes(childId)) {
          addRelation(parent.id, 'adoptive');
        }
      });

      return [...relationByParent.entries()]
        .map(([parentId, kind]) => ({ parentId, kind }))
        .sort((left, right) =>
          String(left.parentId).localeCompare(String(right.parentId))
        );
    }

    function canonicalParentIds(child, byId = null) {
      return canonicalParentRelations(child, byId)
        .map(relation => relation.parentId);
    }

    function canonicalParentRelationGroups(child, byId = null) {
      const groups = new Map();

      canonicalParentRelations(child, byId)
        .forEach(relation => {
          if (!groups.has(relation.kind)) {
            groups.set(relation.kind, []);
          }
          groups.get(relation.kind).push(relation.parentId);
        });

      return [...groups.entries()]
        .map(([kind, parentIds]) => ({
          kind,
          parentIds:[...new Set(parentIds)].sort()
        }))
        .filter(group => group.parentIds.length);
    }

    function canonicalParentKindFor(child, parentId, byId = null) {
      const id = String(parentId || '');
      const relation =
        canonicalParentRelations(child, byId)
          .find(item => item.parentId === id);

      return relation ? relation.kind : 'parent-child';
    }


    // ========【子女索引】Store 維持單一快取，避免重複遍歷所有人物 ========
    let childrenIndex = null;

    function getChildrenOf(id) {
      const parentId = String(id || '');
      if (!childrenIndex) {
        childrenIndex = new Map();
        Object.values(data().sims).forEach(child => {
          canonicalParentIds(child).forEach(pid => {
            if (!childrenIndex.has(pid)) childrenIndex.set(pid, []);
            const list = childrenIndex.get(pid);
            if (!list.some(item => String(item.id) === String(child.id))) list.push(child);
          });
        });
      }
      return childrenIndex.get(parentId) || [];
    }

    function invalidateChildrenIndex() {
      childrenIndex = null;
    }

    function findAncestorPath(
      sourceId,
      targetId,
      maxDepth = 8
    ) {
      const source = String(sourceId || '');
      const target = String(targetId || '');

      if (!source || !target || source === target) {
        return null;
      }

      const queue = [{ id:source, path:[] }];
      const bestDepth = new Map([[source, 0]]);

      while (queue.length) {
        const current = queue.shift();

        if (current.path.length >= maxDepth) {
          continue;
        }

        const sim = data().sims[current.id];
        if (!sim) continue;

        const relations = canonicalParentRelations(sim);

        for (const relation of relations) {
          const nextId = String(relation.parentId);
          if (!nextId) continue;

          const nextPath = [
            ...current.path,
            nextId
          ];

          if (nextId === target) {
            return nextPath;
          }

          const known = bestDepth.get(nextId);

          if (
            known != null &&
            known <= nextPath.length
          ) {
            continue;
          }

          bestDepth.set(
            nextId,
            nextPath.length
          );

          queue.push({
            id:nextId,
            path:nextPath
          });
        }
      }

      return null;
    }

    function findDescendantPath(
      sourceId,
      targetId,
      maxDepth = 8
    ) {
      const source = String(sourceId || '');
      const target = String(targetId || '');

      if (!source || !target || source === target) {
        return null;
      }

      const queue = [{ id:source, path:[] }];
      const bestDepth = new Map([[source, 0]]);

      while (queue.length) {
        const current = queue.shift();

        if (current.path.length >= maxDepth) {
          continue;
        }

        const children = getChildrenOf(current.id);

        for (const child of children) {
          const nextId = String(child.id);
          if (!nextId) continue;

          const nextPath = [
            ...current.path,
            nextId
          ];

          if (nextId === target) {
            return nextPath;
          }

          const known = bestDepth.get(nextId);

          if (
            known != null &&
            known <= nextPath.length
          ) {
            continue;
          }

          bestDepth.set(
            nextId,
            nextPath.length
          );

          queue.push({
            id:nextId,
            path:nextPath
          });
        }
      }

      return null;
    }


    // 家庭視圖：由 UI 指定首要成員與篩選，但關係擴張只執行一次。
    function getVisibleFamilyIds(family, { relationshipSourceIds = null, matchesSim = null } = {}) {
      const sims = data().sims;
      if (!family) return new Set();
      const memberIds = (family.memberIds || []).map(String).filter(id => sims[id]);
      const visible = new Set(memberIds);
      const sources = Array.isArray(relationshipSourceIds) && relationshipSourceIds.length
        ? relationshipSourceIds : memberIds;
      [...new Set(sources.map(String))].forEach(id => {
        const sim = sims[id];
        if (!sim) return;
        [...(sim.spouseIds || []), ...(sim.exSpouseIds || [])].map(String)
          .forEach(relatedId => { if (sims[relatedId]) visible.add(relatedId); });
      });
      if (typeof matchesSim === 'function') {
        [...visible].forEach(id => { if (!matchesSim(sims[id])) visible.delete(id); });
      }
      return visible;
    }

    function simById(simId) {
      return data().sims[String(simId || '')] || null;
    }

    function familyById(familyId) {
      const key = String(familyId || '');
      return data().families.find(family => family && String(family.id) === key) || null;
    }

    function getCurrentFamily() {
      const db = data();
      const key = String(db.currentFamilyId || '');
      return db.families.find(family => family && String(family.id) === key) || db.families[0] || null;
    }

    function setCurrentFamilyId(familyId) {
      const db = data();
      const key = String(familyId || '');
      if (!key || !db.families.some(family => family && String(family.id) === key)) return false;
      if (String(db.currentFamilyId || '') === key) return false;
      db.currentFamilyId = key;
      return true;
    }

    function getCardSettings(mode) {
      const db = data();
      const normalizedMode =
        mode === 'edit'
          ? 'edit'
          : 'view';

      ensureCardSettings(db);

      const settings =
        normalizedMode === 'edit'
          ? db.meta.cardEdit
          : db.meta.cardView;

      return Object.freeze({
        ...settings
      });
    }

    function setCardField(
      mode,
      field,
      enabled
    ) {
      const db = data();
      const result = rawResult();
      const normalizedMode =
        mode === 'edit'
          ? 'edit'
          : 'view';
      const key = String(field || '');

      if (!cardSettingFields.has(key)) {
        return finalized(result);
      }

      ensureCardSettings(db);

      const settings =
        normalizedMode === 'edit'
          ? db.meta.cardEdit
          : db.meta.cardView;
      const next = !!enabled;

      if (settings[key] === next) {
        return finalized(result);
      }

      settings[key] = next;

      mark(result, {
        dataChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        saveDirty:true
      });

      return finalized(result);
    }

    function setCardAppearance(appearance) {
      const db = data();
      const result = rawResult();
      const next =
        String(appearance || '');

      if (!cardAppearanceValues.has(next)) {
        return finalized(result);
      }

      ensureCardSettings(db);

      if (
        db.meta.cardView.appearance === next
      ) {
        return finalized(result);
      }

      db.meta.cardView.appearance =
        next;

      mark(result, {
        dataChanged:true,
        nodesChanged:true,
        saveDirty:true
      });

      return finalized(result);
    }

    function ensureAdoptionMetadata(sim) {
      if (!sim) return null;
      if (!sim.gameData || typeof sim.gameData !== 'object' || Array.isArray(sim.gameData)) {
        sim.gameData = {};
      }
      if (!Array.isArray(sim.gameData.adoptedParentIds)) sim.gameData.adoptedParentIds = [];
      if (!Array.isArray(sim.gameData.adoptedChildIds)) sim.gameData.adoptedChildIds = [];
      sim.gameData.adoptedParentIds = [...new Set(sim.gameData.adoptedParentIds.map(String).filter(Boolean))];
      sim.gameData.adoptedChildIds = [...new Set(sim.gameData.adoptedChildIds.map(String).filter(Boolean))];
      return sim.gameData;
    }

    function ensureFamilyLayout(family) {
      if (!family) return;
      if (!family.manualPositions || typeof family.manualPositions !== 'object') {
        family.manualPositions = { view:{}, edit:{} };
      }
      if (!family.manualPositions.view || typeof family.manualPositions.view !== 'object') family.manualPositions.view = {};
      if (!family.manualPositions.edit || typeof family.manualPositions.edit !== 'object') family.manualPositions.edit = {};
      if (!family.freeLayout || typeof family.freeLayout !== 'object') {
        family.freeLayout = { view:false, edit:false };
      }
      if (typeof family.freeLayout.view !== 'boolean') family.freeLayout.view = false;
      if (typeof family.freeLayout.edit !== 'boolean') family.freeLayout.edit = false;
      if (typeof family.locked !== 'boolean') family.locked = false;
    }

    function replaceArray(owner, key, next) {
      const normalized = [...next];
      if (sameValue(owner[key], normalized)) return false;
      owner[key] = normalized;
      return true;
    }

    function parentRelationSignature(sim) {
      if (!sim || typeof canonicalParentRelations !== 'function') return '';
      return canonicalParentRelations(sim)
        .map(item => String(item.parentId) + ':' + (item.kind === 'adoptive' ? 'adoptive' : 'parent-child'))
        .sort()
        .join('|');
    }

    function setCanonicalParentRelation(child, parentId, kind) {
      const db = data();
      const childId = String(child?.id || '');
      const parentKey = String(parentId || '');
      if (!child || !childId || !parentKey || childId === parentKey) return false;

      let changed = false;
      const currentParents = Array.isArray(child.parentIds)
        ? child.parentIds.map(String).filter(Boolean)
        : [];

      changed = replaceArray(
        child,
        'parentIds',
        currentParents.filter(id => id !== parentKey)
      ) || changed;

      const childGameData = ensureAdoptionMetadata(child);
      changed = replaceArray(
        childGameData,
        'adoptedParentIds',
        childGameData.adoptedParentIds.filter(id => id !== parentKey)
      ) || changed;

      const parent = db.sims[parentKey];
      if (parent) {
        const parentGameData = ensureAdoptionMetadata(parent);
        changed = replaceArray(
          parentGameData,
          'adoptedChildIds',
          parentGameData.adoptedChildIds.filter(id => id !== childId)
        ) || changed;
      }

      if (kind === 'adoptive') {
        changed = replaceArray(
          childGameData,
          'adoptedParentIds',
          [...new Set([...childGameData.adoptedParentIds, parentKey])]
        ) || changed;

        if (parent) {
          changed = replaceArray(
            parent.gameData,
            'adoptedChildIds',
            [...new Set([...parent.gameData.adoptedChildIds, childId])]
          ) || changed;
        }
      } else if (kind === 'parent-child') {
        changed = replaceArray(
          child,
          'parentIds',
          [...new Set([...(child.parentIds || []).map(String), parentKey])]
        ) || changed;
      }

      return changed;
    }

    function setParents(simId, desiredRelations) {
      const db = data();
      const child = db.sims[String(simId || '')];
      const result = rawResult();
      if (!child) return finalized(result);

      const before = parentRelationSignature(child);
      const desired = new Map(
        (desiredRelations || [])
          .filter(item => item && item.parentId != null)
          .map(item => [
            String(item.parentId),
            item.kind === 'adoptive' ? 'adoptive' : 'parent-child'
          ])
          .filter(([parentId]) => parentId && parentId !== String(child.id) && db.sims[parentId])
      );

      const existing = typeof canonicalParentRelations === 'function'
        ? canonicalParentRelations(child).map(item => String(item.parentId))
        : [];

      let rawChanged = false;
      new Set([...existing, ...desired.keys()]).forEach(parentId => {
        rawChanged = setCanonicalParentRelation(
          child,
          parentId,
          desired.get(parentId) || null
        ) || rawChanged;
      });

      const after = parentRelationSignature(child);
      if (!rawChanged && before === after) return finalized(result);

      mark(result, {
        dataChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [child.id, ...existing, ...desired.keys()]);

      if (before !== after) {
        invalidateChildrenIndex();
        mark(result, {
          relationshipGraphChanged:true,
          childrenIndexChanged:true,
          layoutChanged:true,
          nodesChanged:true,
          edgesChanged:true,
          listsChanged:true
        });
      }

      return finalized(result);
    }

    function setChildren(parentId, desiredRelations) {
      const db = data();
      const parentKey = String(parentId || '');
      if (!db.sims[parentKey]) return finalized(rawResult());

      const desired = new Map(
        (desiredRelations || [])
          .filter(item => item && item.childId != null)
          .map(item => [
            String(item.childId),
            item.kind === 'adoptive' ? 'adoptive' : 'parent-child'
          ])
          .filter(([childId]) => childId && childId !== parentKey && db.sims[childId])
      );

      const existing = new Set();
      Object.values(db.sims).forEach(child => {
        if (!child || String(child.id) === parentKey || typeof canonicalParentRelations !== 'function') return;
        if (canonicalParentRelations(child).some(item => String(item.parentId) === parentKey)) {
          existing.add(String(child.id));
        }
      });

      const mutations = [];
      new Set([...existing, ...desired.keys()]).forEach(childId => {
        const child = db.sims[childId];
        if (!child) return;

        const relations = typeof canonicalParentRelations === 'function'
          ? canonicalParentRelations(child)
              .filter(item => String(item.parentId) !== parentKey)
              .map(item => ({ parentId:String(item.parentId), kind:item.kind }))
          : [];

        if (desired.has(childId)) {
          relations.push({ parentId:parentKey, kind:desired.get(childId) });
        }

        mutations.push(setParents(childId, relations));
      });

      return mergeResults(...mutations);
    }

    function setPartnerRelations(simId, spouseIds, exSpouseIds) {
      const db = data();
      const key = String(simId || '');
      const sim = db.sims[key];
      const result = rawResult();
      if (!sim) return finalized(result);

      const nextSpouses = uniqueIds(spouseIds, db, key);
      const nextExSpouses = uniqueIds(exSpouseIds, db, key);
      let changed = false;
      const affected = new Set([key]);

      Object.values(db.sims).forEach(other => {
        if (!other || String(other.id) === key) return;
        const otherId = String(other.id);
        const spouses = Array.isArray(other.spouseIds) ? other.spouseIds.map(String) : [];
        const exSpouses = Array.isArray(other.exSpouseIds) ? other.exSpouseIds.map(String) : [];
        const nextOtherSpouses = spouses.filter(id => id !== key);
        const nextOtherExSpouses = exSpouses.filter(id => id !== key);

        if (!sameValue(spouses, nextOtherSpouses)) {
          other.spouseIds = nextOtherSpouses;
          changed = true;
          affected.add(otherId);
        }

        if (!sameValue(exSpouses, nextOtherExSpouses)) {
          other.exSpouseIds = nextOtherExSpouses;
          changed = true;
          affected.add(otherId);
        }
      });

      changed = replaceArray(sim, 'spouseIds', nextSpouses) || changed;
      changed = replaceArray(sim, 'exSpouseIds', nextExSpouses) || changed;

      nextSpouses.forEach(otherId => {
        const other = db.sims[otherId];
        if (!other) return;
        changed = replaceArray(
          other,
          'spouseIds',
          [...new Set([...(other.spouseIds || []).map(String), key])]
        ) || changed;
        affected.add(otherId);
      });

      nextExSpouses.forEach(otherId => {
        const other = db.sims[otherId];
        if (!other) return;
        changed = replaceArray(
          other,
          'exSpouseIds',
          [...new Set([...(other.exSpouseIds || []).map(String), key])]
        ) || changed;
        affected.add(otherId);
      });

      if (!changed) return finalized(result);

      mark(result, {
        dataChanged:true,
        relationshipGraphChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        listsChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [...affected]);
      return finalized(result);
    }

    function setSpouses(simId, spouseIds) {
      const sim = simById(simId);
      if (!sim) return finalized(rawResult());
      return setPartnerRelations(simId, spouseIds, sim.exSpouseIds || []);
    }

    function setExSpouses(simId, exSpouseIds) {
      const sim = simById(simId);
      if (!sim) return finalized(rawResult());
      return setPartnerRelations(simId, sim.spouseIds || [], exSpouseIds);
    }

    function setSiblings(simId, siblingIds) {
      const db = data();
      const key = String(simId || '');
      const sim = db.sims[key];
      const result = rawResult();
      if (!sim) return finalized(result);

      const desired = new Set(uniqueIds(siblingIds, db, key));
      const beforeLinks = db.links;
      const kept = [];
      const affected = new Set([key]);

      beforeLinks.forEach(link => {
        if (!link || typeof link !== 'object') return;
        const from = String(link.from || '');
        const to = String(link.to || '');
        const touches = from === key || to === key;

        if (!touches || !isSiblingLink?.(link)) {
          kept.push(link);
          return;
        }

        const other = from === key ? to : from;
        affected.add(other);
        if (desired.has(other)) kept.push(link);
      });

      desired.forEach(other => {
        affected.add(other);
        const exists = kept.some(link =>
          isSiblingLink?.(link) &&
          (
            (String(link.from) === key && String(link.to) === other) ||
            (String(link.to) === key && String(link.from) === other)
          )
        );

        if (!exists) {
          kept.push({
            id:typeof uid === 'function' ? uid('lnk') : 'lnk_' + Date.now(),
            from:key,
            to:other,
            type:siblingRelationType,
            label:siblingRelationLabel,
            source:'manual'
          });
        }
      });

      if (sameValue(beforeLinks, kept)) return finalized(result);

      db.links = kept;
      mark(result, {
        dataChanged:true,
        relationshipGraphChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        listsChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [...affected]);
      return finalized(result);
    }

    function createSim(simInput) {
      const db = data();
      const result = rawResult();
      const input = cloneValue(simInput || {});
      const id = String(input.id || (typeof uid === 'function' ? uid('sim') : 'sim_' + Date.now()));

      if (db.sims[id]) {
        throw new Error('Sim already exists: ' + id);
      }

      input.id = id;
      db.sims[id] =
        normalizeSimRecord(
          input,
          id,
          db
        );
      invalidateChildrenIndex();

      mark(result, {
        dataChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true,
        assetsChanged:[...SIM_ASSET_FIELDS].some(field => input[field])
      });
      addAffected(result, 'sim', [id]);
      result.simId = id;
      return finalized(result);
    }

    function updateSim(simId, patch) {
      const db = data();
      const key = String(simId || '');
      const sim = db.sims[key];
      const result = rawResult();
      if (!sim) return finalized(result);

      let changed = false;
      let layoutChanged = false;
      let assetsChanged = false;
      const manualGameFields = [];

      Object.entries(patch || {}).forEach(([field, value]) => {
        if (BLOCKED_SIM_PATCH_KEYS.has(field)) return;
        if (sameValue(sim[field], value)) return;

        sim[field] = cloneValue(value);
        changed = true;

        if (
          gameManagedSimFieldSet.has(field)
        ) {
          manualGameFields.push(
            field
          );
        }

        if (SIM_LAYOUT_FIELDS.has(field)) layoutChanged = true;
        if (SIM_ASSET_FIELDS.has(field)) assetsChanged = true;
      });

      if (!changed) return finalized(result);

      markManualOverrides(
        sim,
        manualGameFields
      );

      normalizeSimRecord(
        sim,
        key,
        db
      );

      mark(result, {
        dataChanged:true,
        layoutChanged,
        nodesChanged:true,
        edgesChanged:layoutChanged,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true,
        assetsChanged
      });
      addAffected(result, 'sim', [key]);
      result.simId = key;
      return finalized(result);
    }

    function setFamilyMembership(simId, familyIds) {
      const db = data();
      const key = String(simId || '');
      const result = rawResult();
      if (!db.sims[key]) return finalized(result);

      const desired = new Set((familyIds || []).map(String));
      let changed = false;

      db.families.forEach(family => {
        if (!family) return;
        ensureFamilyLayout(family);

        const familyKey = String(family.id);
        const members = Array.isArray(family.memberIds) ? family.memberIds.map(String) : [];
        const has = members.includes(key);
        const shouldHave = desired.has(familyKey);

        if (has === shouldHave) return;

        if (shouldHave) {
          family.memberIds = [...members, key];
        } else {
          family.memberIds = members.filter(id => id !== key);
          delete family.manualPositions.view[key];
          delete family.manualPositions.edit[key];
        }

        changed = true;
        addAffected(result, 'family', [familyKey]);
      });

      if (!changed) return finalized(result);

      mark(result, {
        dataChanged:true,
        familyMembershipChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        chromeChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [key]);
      return finalized(result);
    }

    function addFamilyMember(familyId, simId) {
      const db = data();
      const family = familyById(familyId);
      const key = String(simId || '');
      const result = rawResult();

      if (!family || !db.sims[key]) return finalized(result);

      const members = Array.isArray(family.memberIds) ? family.memberIds.map(String) : [];
      if (members.includes(key)) return finalized(result);

      family.memberIds = [...members, key];

      mark(result, {
        dataChanged:true,
        familyMembershipChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        chromeChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [key]);
      addAffected(result, 'family', [family.id]);
      return finalized(result);
    }

    function removeFamilyMember(familyId, simId) {
      const family = familyById(familyId);
      const key = String(simId || '');
      const result = rawResult();

      if (!family) return finalized(result);

      ensureFamilyLayout(family);
      const members = Array.isArray(family.memberIds) ? family.memberIds.map(String) : [];

      if (!members.includes(key)) return finalized(result);

      family.memberIds = members.filter(id => id !== key);
      delete family.manualPositions.view[key];
      delete family.manualPositions.edit[key];

      mark(result, {
        dataChanged:true,
        familyMembershipChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        chromeChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [key]);
      addAffected(result, 'family', [family.id]);
      return finalized(result);
    }

    function addFamilyMembers(familyId, simIds) {
      return mergeResults(...(simIds || []).map(simId => addFamilyMember(familyId, simId)));
    }

    function removeFamilyMembers(familyId, simIds) {
      return mergeResults(...(simIds || []).map(simId => removeFamilyMember(familyId, simId)));
    }

    function createFamily(familyInput, { makeCurrent = false } = {}) {
      const db = data();
      const result = rawResult();
      const family = cloneValue(familyInput || {});
      const id = String(family.id || (typeof uid === 'function' ? uid('fam') : 'fam_' + Date.now()));

      if (db.families.some(item => item && String(item.id) === id)) {
        throw new Error('Family already exists: ' + id);
      }

      family.id = id;
      if (!Array.isArray(family.memberIds)) family.memberIds = [];
      ensureFamilyLayout(family);
      if (typeof family.bio !== 'string') family.bio = '';
      if (family.coverImage === undefined) family.coverImage = null;

      db.families.push(family);
      if (makeCurrent) db.currentFamilyId = id;

      mark(result, {
        dataChanged:true,
        familiesChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        chromeChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true
      });
      addAffected(result, 'family', [id]);
      result.familyId = id;
      return finalized(result);
    }

    function updateFamily(familyId, patch) {
      const family = familyById(familyId);
      const result = rawResult();
      if (!family) return finalized(result);

      let changed = false;
      let assetsChanged = false;
      const manualGameFields = [];

      ['name','bio','coverImage'].forEach(field => {
        if (!Object.prototype.hasOwnProperty.call(patch || {}, field)) return;
        if (sameValue(family[field], patch[field])) return;

        family[field] = cloneValue(patch[field]);
        changed = true;

        if (
          family.gameImport &&
          (field === 'name' || field === 'bio')
        ) {
          manualGameFields.push(field);
        }

        if (field === 'coverImage') assetsChanged = true;
      });

      if (!changed) return finalized(result);

      if (
        family.gameImport &&
        manualGameFields.length
      ) {
        if (
          !family.gameData ||
          typeof family.gameData !== 'object' ||
          Array.isArray(family.gameData)
        ) {
          family.gameData = {};
        }

        family.gameData.manualOverrides =
          [...new Set([
            ...(Array.isArray(
              family.gameData.manualOverrides
            )
              ? family.gameData.manualOverrides
              : []),
            ...manualGameFields
          ])];
      }

      mark(result, {
        dataChanged:true,
        chromeChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true,
        assetsChanged
      });
      addAffected(result, 'family', [family.id]);
      return finalized(result);
    }

    function deleteFamily(familyId, { fallbackFamilyId = null } = {}) {
      const db = data();
      const key = String(familyId || '');
      const index = db.families.findIndex(family => family && String(family.id) === key);
      const result = rawResult();

      if (index < 0) return finalized(result);

      const removed = db.families[index];
      db.families.splice(index, 1);

      if (String(db.currentFamilyId || '') === key) {
        const fallback = fallbackFamilyId && db.families.some(family => String(family.id) === String(fallbackFamilyId))
          ? String(fallbackFamilyId)
          : String(db.families[0]?.id || '');
        db.currentFamilyId = fallback || null;
      }

      mark(result, {
        dataChanged:true,
        familiesChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        chromeChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true,
        assetsChanged:!!removed?.coverImage
      });
      addAffected(result, 'family', [key]);
      return finalized(result);
    }

    function setFamilyLayoutState(familyId, mode, state) {
      const family = familyById(familyId);
      const result = rawResult();
      const layoutMode = mode === 'edit' ? 'edit' : 'view';

      if (!family) return finalized(result);

      ensureFamilyLayout(family);
      let changed = false;

      if (Object.prototype.hasOwnProperty.call(state || {}, 'freeLayout')) {
        const value = !!state.freeLayout;
        if (family.freeLayout[layoutMode] !== value) {
          family.freeLayout[layoutMode] = value;
          changed = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(state || {}, 'manualPositions')) {
        const normalized = {};
        Object.entries(state.manualPositions || {}).forEach(([simId, position]) => {
          if (!position || typeof position !== 'object') return;
          normalized[String(simId)] = {
            x:Number(position.x) || 0,
            y:Number(position.y) || 0
          };
        });

        if (!sameValue(family.manualPositions[layoutMode], normalized)) {
          family.manualPositions[layoutMode] = normalized;
          changed = true;
        }
      }

      if (!changed) return finalized(result);

      mark(result, {
        dataChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        chromeChanged:true,
        saveDirty:true
      });
      addAffected(result, 'family', [family.id]);
      return finalized(result);
    }

    function setFamilyLocked(familyId, locked) {
      const family = familyById(familyId);
      const result = rawResult();
      if (!family) return finalized(result);

      ensureFamilyLayout(family);
      const next = !!locked;

      if (family.locked === next) return finalized(result);

      family.locked = next;
      mark(result, {
        dataChanged:true,
        chromeChanged:true,
        saveDirty:true
      });
      addAffected(result, 'family', [family.id]);
      return finalized(result);
    }

    function setNodePositions(familyId, mode, positionMap, { replace = false } = {}) {
      const family = familyById(familyId);
      const result = rawResult();
      const layoutMode = mode === 'edit' ? 'edit' : 'view';

      if (!family) return finalized(result);

      ensureFamilyLayout(family);
      const next = replace ? {} : { ...family.manualPositions[layoutMode] };
      let touched = false;

      Object.entries(positionMap || {}).forEach(([simId, position]) => {
        const key = String(simId);
        if (!position || typeof position !== 'object') return;

        const normalized = {
          x:Number(position.x) || 0,
          y:Number(position.y) || 0
        };

        if (!sameValue(next[key], normalized)) touched = true;
        next[key] = normalized;
        addAffected(result, 'sim', [key]);
      });

      if (replace && !sameValue(family.manualPositions[layoutMode], next)) touched = true;
      if (!touched) return finalized(result);

      family.manualPositions[layoutMode] = next;
      mark(result, {
        dataChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        saveDirty:true
      });
      addAffected(result, 'family', [family.id]);
      return finalized(result);
    }

    function setNodePosition(familyId, mode, simId, position) {
      const map = {};
      map[String(simId)] = position;
      return setNodePositions(familyId, mode, map);
    }

    function removeNodePositions(familyId, mode, simIds) {
      const family = familyById(familyId);
      const result = rawResult();
      const layoutMode = mode === 'edit' ? 'edit' : 'view';

      if (!family) return finalized(result);

      ensureFamilyLayout(family);
      const next = { ...family.manualPositions[layoutMode] };
      let changed = false;

      (simIds || []).forEach(simId => {
        const key = String(simId);
        if (!Object.prototype.hasOwnProperty.call(next, key)) return;
        delete next[key];
        changed = true;
        addAffected(result, 'sim', [key]);
      });

      if (!changed) return finalized(result);

      family.manualPositions[layoutMode] = next;
      mark(result, {
        dataChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        saveDirty:true
      });
      addAffected(result, 'family', [family.id]);
      return finalized(result);
    }

    function setRelationshipLabelPosition(key, position) {
      const db = data();
      const result = rawResult();
      const annotationKey = String(key || '');

      if (!annotationKey) return finalized(result);

      const normalized = position && (Number(position.dx) || Number(position.dy))
        ? { dx:Number(position.dx) || 0, dy:Number(position.dy) || 0 }
        : null;

      const before = db.labelPositions[annotationKey] || null;
      if (sameValue(before, normalized)) return finalized(result);

      if (normalized) db.labelPositions[annotationKey] = normalized;
      else delete db.labelPositions[annotationKey];

      mark(result, {
        dataChanged:true,
        edgesChanged:true,
        saveDirty:true
      });
      return finalized(result);
    }

    function setRelationshipAnnotation(key, annotation) {
      const db = data();
      const result = rawResult();
      const annotationKey = String(key || '');

      if (!annotationKey) return finalized(result);

      const text = typeof annotation?.text === 'string' ? annotation.text.trim() : '';
      const hidden = annotation?.hidden === true;
      const next = (text || hidden)
        ? { ...(text ? { text } : {}), ...(hidden ? { hidden:true } : {}) }
        : null;

      const before = db.relationshipMap[annotationKey] || null;
      if (sameValue(before, next)) return finalized(result);

      if (next) db.relationshipMap[annotationKey] = next;
      else delete db.relationshipMap[annotationKey];

      mark(result, {
        dataChanged:true,
        edgesChanged:true,
        saveDirty:true
      });
      return finalized(result);
    }

    function setRelationshipAnnotations(entries) {
      return mergeResults(...(entries || []).map(entry =>
        setRelationshipAnnotation(entry.key, entry)
      ));
    }

    function rememberRelationshipType(value) {
      const db = data();
      const result = rawResult();
      const type = normalizeRelationshipType(value);

      if (!type || type === '關聯' || isBuiltInRelationshipType(type)) {
        return finalized(result);
      }

      const existing = db.relationshipTypeLibrary
        .map(normalizeRelationshipType)
        .filter(Boolean);

      if (existing.includes(type)) return finalized(result);

      db.relationshipTypeLibrary.push(type);

      mark(result, {
        dataChanged:true,
        listsChanged:true,
        saveDirty:true,
        relationshipTypeLibraryChanged:true
      });
      return finalized(result);
    }

    function addRelationship({ from, to, type, label } = {}) {
      const db = data();
      const fromId = String(from || '');
      const toId = String(to || '');
      const result = rawResult();

      if (!fromId || !toId || fromId === toId || !db.sims[fromId] || !db.sims[toId]) {
        return finalized(result);
      }

      const normalizedType =
        normalizeRelationshipType(
          type ||
          label ||
          '關聯'
        ) ||
        '關聯';

      const normalizedLabel =
        normalizeRelationshipType(
          label ||
          normalizedType
        ) ||
        normalizedType;

      let normalizedFrom =
        fromId;

      let normalizedTo =
        toId;

      const symmetric =
        isSymmetricRelationshipType(
          normalizedType
        );

      if (
        symmetric &&
        normalizedFrom >
        normalizedTo
      ) {
        [normalizedFrom, normalizedTo] =
          [normalizedTo, normalizedFrom];
      }

      if (symmetric) {
        const existing =
          db.links.find(link =>
            link &&
            isSymmetricRelationshipType(
              normalizeRelationshipType(
                link.type ||
                link.label ||
                ''
              )
            ) &&
            normalizeRelationshipType(
              link.type ||
              link.label ||
              ''
            ) === normalizedType &&
            (
              (
                String(link.from) ===
                  normalizedFrom &&
                String(link.to) ===
                  normalizedTo
              ) ||
              (
                String(link.from) ===
                  normalizedTo &&
                String(link.to) ===
                  normalizedFrom
              )
            )
          );

        if (existing) {
          result.relationshipId =
            String(existing.id || '');

          return finalized(result);
        }
      }

      const relationship = {
        id:
          typeof uid === 'function'
            ? uid('lnk')
            : 'lnk_' + Date.now(),
        from:normalizedFrom,
        to:normalizedTo,
        type:normalizedType,
        label:normalizedLabel,
        source:'manual'
      };

      db.links.push(relationship);

      const sibling =
        !!isSiblingLink?.(
          relationship
        );

      mark(result, {
        dataChanged:true,
        relationshipGraphChanged:sibling,
        layoutChanged:sibling,
        nodesChanged:sibling,
        edgesChanged:true,
        listsChanged:sibling,
        saveDirty:true
      });
      addAffected(result, 'sim', [fromId, toId]);
      result.relationshipId = relationship.id;

      return mergeResults(result, rememberRelationshipType(normalizedType));
    }

    function updateRelationship(relationshipId, patch) {
      const db = data();
      const key = String(relationshipId || '');
      const link = db.links.find(item => item && String(item.id) === key);
      const result = rawResult();

      if (!link) return finalized(result);

      const wasSibling = !!isSiblingLink?.(link);
      let changed = false;
      const changedFields = [];

      ['from','to','type','label'].forEach(field => {
        if (!Object.prototype.hasOwnProperty.call(patch || {}, field)) return;

        const value = field === 'from' || field === 'to'
          ? String(patch[field] || '')
          : normalizeRelationshipType(patch[field]);

        if (link[field] === value) return;
        link[field] = value;
        changed = true;
        changedFields.push(field);
      });

      if (!changed) return finalized(result);

      const normalizedUpdatedType =
        normalizeRelationshipType(
          link.type ||
          link.label ||
          ''
        );

      if (
        isSymmetricRelationshipType(
          normalizedUpdatedType
        ) &&
        String(link.from || '') >
          String(link.to || '')
      ) {
        const nextFrom =
          String(link.to || '');

        const nextTo =
          String(link.from || '');

        link.from = nextFrom;
        link.to = nextTo;
      }

      if (
        link.source === 'game' ||
        /^game_rel_/.test(
          String(link.id || '')
        )
      ) {
        link.source = 'game';
        link.manualOverrides =
          [...new Set([
            ...(Array.isArray(link.manualOverrides)
              ? link.manualOverrides
              : []),
            ...changedFields
          ])];
      }

      const nowSibling = !!isSiblingLink?.(link);

      mark(result, {
        dataChanged:true,
        relationshipGraphChanged:wasSibling || nowSibling,
        layoutChanged:wasSibling || nowSibling,
        nodesChanged:wasSibling || nowSibling,
        edgesChanged:true,
        listsChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [link.from, link.to]);
      return finalized(result);
    }

    function removeRelationship(relationshipId) {
      const db = data();
      const key = String(relationshipId || '');
      const index = db.links.findIndex(item => item && String(item.id) === key);
      const result = rawResult();

      if (index < 0) return finalized(result);

      const link = db.links[index];
      const sibling = !!isSiblingLink?.(link);

      if (
        link.source === 'game' ||
        /^game_rel_/.test(
          String(link.id || '')
        )
      ) {
        if (
          !db.meta ||
          typeof db.meta !== 'object' ||
          Array.isArray(db.meta)
        ) {
          db.meta = {};
        }

        db.meta.suppressedGameRelationshipIds =
          [...new Set([
            ...(Array.isArray(
              db.meta.suppressedGameRelationshipIds
            )
              ? db.meta.suppressedGameRelationshipIds
              : []),
            String(link.id)
          ])];
      }

      db.links.splice(index, 1);
      delete db.relationshipMap['link:' + key];
      delete db.labelPositions['link:' + key];

      mark(result, {
        dataChanged:true,
        relationshipGraphChanged:sibling,
        layoutChanged:sibling,
        nodesChanged:sibling,
        edgesChanged:true,
        listsChanged:true,
        saveDirty:true
      });
      addAffected(result, 'sim', [link.from, link.to]);
      return finalized(result);
    }

    function keyReferencesSim(annotationKey, simId, removedLinkIds) {
      const key = String(annotationKey || '');
      const colon = key.indexOf(':');
      const raw = colon >= 0 ? key.slice(colon + 1) : key;

      if (raw.split('::').includes(simId)) return true;
      return key.startsWith('link:') && removedLinkIds.has(key.slice(5));
    }

    function deleteSim(simId) {
      const db = data();
      const key = String(simId || '');
      const sim = db.sims[key];
      const result = rawResult();

      if (!sim) return finalized(result);

      const affected = new Set([key]);

      db.families.forEach(family => {
        if (!family) return;
        ensureFamilyLayout(family);

        const members = Array.isArray(family.memberIds) ? family.memberIds.map(String) : [];

        if (members.includes(key)) {
          family.memberIds = members.filter(id => id !== key);
          addAffected(result, 'family', [family.id]);
          mark(result, { familyMembershipChanged:true });
        }

        delete family.manualPositions.view[key];
        delete family.manualPositions.edit[key];
      });

      delete db.sims[key];
      invalidateChildrenIndex();

      Object.values(db.sims).forEach(other => {
        if (!other) return;

        const otherId = String(other.id);
        const beforeParents = Array.isArray(other.parentIds) ? other.parentIds.map(String) : [];
        const beforeSpouses = Array.isArray(other.spouseIds) ? other.spouseIds.map(String) : [];
        const beforeEx = Array.isArray(other.exSpouseIds) ? other.exSpouseIds.map(String) : [];

        const nextParents = beforeParents.filter(id => id !== key);
        const nextSpouses = beforeSpouses.filter(id => id !== key);
        const nextEx = beforeEx.filter(id => id !== key);

        if (!sameValue(beforeParents, nextParents)) {
          other.parentIds = nextParents;
          affected.add(otherId);
        }

        if (!sameValue(beforeSpouses, nextSpouses)) {
          other.spouseIds = nextSpouses;
          affected.add(otherId);
        }

        if (!sameValue(beforeEx, nextEx)) {
          other.exSpouseIds = nextEx;
          affected.add(otherId);
        }

        if (other.gameData && typeof other.gameData === 'object') {
          const beforeAdoptedParents = Array.isArray(other.gameData.adoptedParentIds)
            ? other.gameData.adoptedParentIds.map(String)
            : [];

          const beforeAdoptedChildren = Array.isArray(other.gameData.adoptedChildIds)
            ? other.gameData.adoptedChildIds.map(String)
            : [];

          const nextAdoptedParents = beforeAdoptedParents.filter(id => id !== key);
          const nextAdoptedChildren = beforeAdoptedChildren.filter(id => id !== key);

          if (!sameValue(beforeAdoptedParents, nextAdoptedParents)) {
            other.gameData.adoptedParentIds = nextAdoptedParents;
            affected.add(otherId);
          }

          if (!sameValue(beforeAdoptedChildren, nextAdoptedChildren)) {
            other.gameData.adoptedChildIds = nextAdoptedChildren;
            affected.add(otherId);
          }
        }
      });

      const removedLinks = db.links.filter(link =>
        link && (String(link.from) === key || String(link.to) === key)
      );

      const removedLinkIds = new Set(
        removedLinks
          .map(link => String(link.id || ''))
          .filter(Boolean)
      );

      removedLinks.forEach(link => {
        affected.add(String(link.from || ''));
        affected.add(String(link.to || ''));
      });

      db.links = db.links.filter(link =>
        !link || (String(link.from) !== key && String(link.to) !== key)
      );

      Object.keys(db.relationshipMap).forEach(annotationKey => {
        if (keyReferencesSim(annotationKey, key, removedLinkIds)) {
          delete db.relationshipMap[annotationKey];
        }
      });

      Object.keys(db.labelPositions).forEach(annotationKey => {
        if (keyReferencesSim(annotationKey, key, removedLinkIds)) {
          delete db.labelPositions[annotationKey];
        }
      });

      mark(result, {
        dataChanged:true,
        relationshipGraphChanged:true,
        childrenIndexChanged:true,
        layoutChanged:true,
        nodesChanged:true,
        edgesChanged:true,
        chromeChanged:true,
        listsChanged:true,
        familyUiChanged:true,
        saveDirty:true,
        assetsChanged:true
      });
      addAffected(result, 'sim', [...affected].filter(Boolean));
      return finalized(result);
    }

    function saveSimDraft({
      simId = null,
      sim:simPatch = {},
      parentRelations = [],
      childRelations = [],
      spouseIds = [],
      exSpouseIds = [],
      siblingIds = [],
      familyIds = []
    } = {}) {
      const db = data();
      const cleanPatch = cloneValue(simPatch || {});

      const originalSim =
        simId
          ? db.sims[String(simId)] || null
          : null;

      const originalParentSignature =
        originalSim
          ? parentRelationSignature(originalSim)
          : '';

      const originalPartners =
        originalSim
          ? [
              ...(originalSim.spouseIds || [])
                .map(String)
                .sort(),
              '|',
              ...(originalSim.exSpouseIds || [])
                .map(String)
                .sort()
            ].join(',')
          : '';

      const originalPartnerIds =
        originalSim
          ? new Set([
              ...(originalSim.spouseIds || []).map(String),
              ...(originalSim.exSpouseIds || []).map(String)
            ])
          : new Set();

      const originalChildRelations =
        new Map();

      if (originalSim) {
        Object.values(db.sims)
          .forEach(child => {
            if (
              !child ||
              String(child.id) === String(originalSim.id) ||
              typeof canonicalParentRelations !== 'function'
            ) {
              return;
            }

            const relation =
              canonicalParentRelations(child)
                .find(item =>
                  String(item.parentId) ===
                  String(originalSim.id)
                );

            if (relation) {
              originalChildRelations.set(
                String(child.id),
                relation.kind
              );
            }
          });
      }

      delete cleanPatch.id;
      delete cleanPatch.order;
      delete cleanPatch.parentIds;
      delete cleanPatch.spouseIds;
      delete cleanPatch.exSpouseIds;
      delete cleanPatch.gameData;

      let id = simId ? String(simId) : '';
      let mutation;

      if (id && db.sims[id]) {
        mutation = updateSim(id, cleanPatch);
      } else {
        id = String(typeof uid === 'function' ? uid('sim') : 'sim_' + Date.now());

        mutation = createSim({
          id,
          order:Object.keys(db.sims).length,
          parentIds:[],
          spouseIds:[],
          exSpouseIds:[],
          gameData:{
            adoptedParentIds:[],
            adoptedChildIds:[]
          },
          ...cleanPatch
        });
      }

      const combined = mergeResults(
        mutation,
        setParents(id, parentRelations),
        setChildren(id, childRelations),
        setPartnerRelations(id, spouseIds, exSpouseIds),
        setSiblings(id, siblingIds),
        setFamilyMembership(id, familyIds)
      );

      const savedSim =
        db.sims[id];

      if (
        originalSim &&
        savedSim
      ) {
        const nextParentSignature =
          parentRelationSignature(
            savedSim
          );

        if (
          nextParentSignature !==
          originalParentSignature
        ) {
          markManualOverrides(
            savedSim,
            ['parents']
          );
        }

        const nextPartners = [
          ...(savedSim.spouseIds || [])
            .map(String)
            .sort(),
          '|',
          ...(savedSim.exSpouseIds || [])
            .map(String)
            .sort()
        ].join(',');

        if (
          nextPartners !==
          originalPartners
        ) {
          const touchedPartnerIds =
            new Set([
              ...originalPartnerIds,
              ...(savedSim.spouseIds || []).map(String),
              ...(savedSim.exSpouseIds || []).map(String)
            ]);

          markManualOverrides(
            savedSim,
            ['partners']
          );

          touchedPartnerIds
            .forEach(partnerId => {
              const partner =
                db.sims[partnerId];

              if (partner) {
                markManualOverrides(
                  partner,
                  ['partners']
                );
              }
            });
        }

        const nextChildRelations =
          new Map();

        Object.values(db.sims)
          .forEach(child => {
            if (
              !child ||
              String(child.id) === id ||
              typeof canonicalParentRelations !== 'function'
            ) {
              return;
            }

            const relation =
              canonicalParentRelations(child)
                .find(item =>
                  String(item.parentId) === id
                );

            if (relation) {
              nextChildRelations.set(
                String(child.id),
                relation.kind
              );
            }
          });

        const touchedChildIds =
          new Set([
            ...originalChildRelations.keys(),
            ...nextChildRelations.keys()
          ]);

        touchedChildIds
          .forEach(childId => {
            if (
              originalChildRelations.get(childId) ===
              nextChildRelations.get(childId)
            ) {
              return;
            }

            const child =
              db.sims[childId];

            if (child) {
              markManualOverrides(
                child,
                ['parents']
              );
            }
          });
      }

      combined.simId = id;
      return combined;
    }

    return Object.freeze({
      getData,
      serializeDatabase,
      snapshotDatabase,
      normalizeDatabase,
      replaceDatabase,
      getSim:simById,
      getFamily:familyById,
      getCurrentFamily,
      getParentRelations:canonicalParentRelations,
      getParentIds:canonicalParentIds,
      getParentRelationGroups:canonicalParentRelationGroups,
      getParentKindFor:canonicalParentKindFor,
      getChildrenOf,
      invalidateChildrenIndex,
      findAncestorPath,
      findDescendantPath,
      getVisibleFamilyIds,
      setCurrentFamilyId,
      getCardSettings,
      setCardField,
      setCardAppearance,
      mergeResults,
      createSim,
      updateSim,
      deleteSim,
      saveSimDraft,
      setParents,
      setChildren,
      setSpouses,
      setExSpouses,
      setSiblings,
      setFamilyMembership,
      addFamilyMember,
      removeFamilyMember,
      addFamilyMembers,
      removeFamilyMembers,
      createFamily,
      updateFamily,
      deleteFamily,
      setFamilyLayoutState,
      setFamilyLocked,
      setNodePosition,
      setNodePositions,
      removeNodePositions,
      setRelationshipLabelPosition,
      setRelationshipAnnotation,
      setRelationshipAnnotations,
      rememberRelationshipType,
      addRelationship,
      updateRelationship,
      removeRelationship
    });
  }

  global.L1nGGenealogyStore = Object.freeze({
    create
  });
})(window);
