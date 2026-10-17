/* ========【家庭親屬稱謂】 設定 - 以現有血緣與婚姻資料推導顯示，不建立假親子關係 ======== */
(function (global) {
  'use strict';

  const INTIMATE_TYPES = new Set([
    '情人', '秘密情人', '外遇', '一夜情', '砲友'
  ]);
  const ids = values => [...new Set(
    (Array.isArray(values) ? values : []).map(String).filter(Boolean)
  )];
  const has = (values, id) => ids(values).includes(String(id));

  function parentIds(child, sims) {
    if (!child || !sims) return [];
    const childId = String(child.id);
    const result = ids(child.parentIds);
    ids(child.gameData?.adoptedParentIds).forEach(id => {
      if (!result.includes(id)) result.push(id);
    });
    return result.filter(id => id !== childId && !!sims[id]);
  }

  function biologicalParentIds(child, sims) {
    return parentIds(child, sims).filter(id =>
      !has(child.gameData?.adoptedParentIds, id) &&
      !has(sims[id]?.gameData?.adoptedChildIds, child.id)
    );
  }

  function relationType(link) {
    return String(link?.type || link?.label || '').trim();
  }

  function coParentKind(child, sims, links = []) {
    const parents = biologicalParentIds(child, sims);
    if (parents.length !== 2) return null;
    const [first, second] = parents;
    const a = sims[first];
    const b = sims[second];
    const marriedOrFormer =
      has(a?.spouseIds, second) ||
      has(b?.spouseIds, first) ||
      has(a?.exSpouseIds, second) ||
      has(b?.exSpouseIds, first) ||
      has(a?.gameData?.deceasedSpouseIds, second) ||
      has(b?.gameData?.deceasedSpouseIds, first);
    if (marriedOrFormer) return null;

    const pairLinks = (Array.isArray(links) ? links : []).filter(link =>
      link && (
        (String(link.from) === first && String(link.to) === second) ||
        (String(link.from) === second && String(link.to) === first)
      )
    );
    if (pairLinks.length) {
      const romantic = pairLinks.find(link => INTIMATE_TYPES.has(relationType(link)));
      return romantic ? { type:relationType(romantic), inferred:false } : null;
    }
    // 與畫布既有推定規則一致：沒有任何既存伴侶或其他連結，才暫定為「情人」。
    return { type:'情人', inferred:true };
  }

  function childKinshipLabel(child, sims, links = []) {
    if (!coParentKind(child, sims, links)) return '';
    const gender = String(child.gender || '').trim().toLowerCase();
    if (gender === '男' || gender === 'male') return '私生子';
    if (gender === '女' || gender === 'female') return '私生女';
    return '私生子女';
  }

  function stepParentIds(child, sims, parentOverride = null) {
    if (!child || !sims) return [];
    const currentParents = new Set(parentIds(child, sims));
    const parents = parentOverride === null
      ? [...currentParents]
      : ids(parentOverride).filter(id => !!sims[id]);
    const result = new Set();
    parents.forEach(parentId => {
      ids(sims[parentId]?.spouseIds).forEach(spouseId => {
        if (sims[spouseId] &&
            spouseId !== String(child.id) &&
            !currentParents.has(spouseId) &&
            !parents.includes(spouseId)) result.add(spouseId);
      });
    });
    return [...result];
  }

  function stepChildIds(stepparent, sims, spouseOverride = null) {
    if (!stepparent || !sims) return [];
    const partners = new Set(
      spouseOverride === null
        ? ids(stepparent.spouseIds)
        : ids(spouseOverride)
    );
    if (!partners.size) return [];
    return Object.values(sims)
      .filter(child => child && String(child.id) !== String(stepparent.id))
      .filter(child => {
        const parents = parentIds(child, sims);
        return !parents.includes(String(stepparent.id)) &&
          parents.some(id => partners.has(id));
      })
      .map(child => String(child.id));
  }

  // 中文稱謂只在親屬及其現任配偶性別對應傳統用法時使用；
  // 其他性別組合維持「親屬稱謂的配偶」，不推測性別或婚姻角色。
  const AFFINAL_KINSHIP_TITLES = Object.freeze({
    descendant:Object.freeze({
      '兒子':Object.freeze({female:'兒媳'}),
      '女兒':Object.freeze({male:'女婿'}),
      '孫子':Object.freeze({female:'孫媳'}),
      '孫女':Object.freeze({male:'孫女婿'}),
      '外孫':Object.freeze({female:'外孫媳'}),
      '外孫女':Object.freeze({male:'外孫女婿'}),
      '曾孫':Object.freeze({female:'曾孫媳'}),
      '曾孫女':Object.freeze({male:'曾孫女婿'}),
      '玄孫':Object.freeze({female:'玄孫媳'}),
      '玄孫女':Object.freeze({male:'玄孫女婿'})
    }),
    sibling:Object.freeze({
      '哥哥':Object.freeze({female:'嫂嫂'}),
      '弟弟':Object.freeze({female:'弟媳'}),
      '姐姐':Object.freeze({male:'姐夫'}),
      '妹妹':Object.freeze({male:'妹夫'})
    }),
    'parent-sibling':Object.freeze({
      '伯父':Object.freeze({female:'伯母'}),
      '叔叔':Object.freeze({female:'嬸嬸'}),
      '姑姑':Object.freeze({male:'姑丈'}),
      '舅舅':Object.freeze({female:'舅媽'}),
      '阿姨':Object.freeze({male:'姨丈'})
    }),
    'sibling-child':Object.freeze({
      '姪子':Object.freeze({female:'姪媳'}),
      '姪女':Object.freeze({male:'姪女婿'}),
      '外甥':Object.freeze({female:'外甥媳'}),
      '外甥女':Object.freeze({male:'外甥女婿'})
    })
  });

  function kinshipGender(sim) {
    const gender = String(sim?.gender || '').toLowerCase();
    return gender === 'male' || gender === '男' ? 'male'
      : gender === 'female' || gender === '女' ? 'female' : 'other';
  }

  // 現任婚姻可能在匯入資料中只記錄單側；只讀取 spouseIds，
  // 絕不把前配偶、情人、共同父母或其他關係當作現任姻親。
  function currentSpouseIds(simId, sims) {
    const id = String(simId || '');
    if (!id || !sims?.[id]) return [];
    const result = new Set(ids(sims[id].spouseIds).filter(other => sims[other] && other !== id));
    Object.values(sims).forEach(sim => {
      if (sim && String(sim.id) !== id && has(sim.spouseIds, id)) result.add(String(sim.id));
    });
    return [...result].sort();
  }

  function affinalKinshipTitle(relation, target) {
    if (!relation?.label) return null;
    const title = AFFINAL_KINSHIP_TITLES[relation.kind]?.[relation.label]?.[kinshipGender(target)];
    return title || relation.label + '的配偶';
  }

  // 視角稱謂是衍生資料：先認定 XXX 的血親、旁支，再沿一條現任婚姻接到對象。
  // 函式僅回傳稱謂，不寫入 family links，也不建立假的血親。
  function perspectiveAffinalKinship(options = {}) {
    const {perspectiveId, targetId, sims, describeBlood, siblingIds, siblingLabel} = options;
    const root = String(perspectiveId || ''), target = String(targetId || '');
    if (!root || !target || root === target || !sims?.[root] || !sims?.[target]) return null;
    if (typeof describeBlood !== 'function') return null;

    const spouseIds = currentSpouseIds(target, sims);
    const candidates = [];
    for (const relativeId of spouseIds) {
      if (relativeId === root) continue; // 本人的現任配偶由既有直接關係規則處理。
      const relation = describeBlood(relativeId);
      if (!relation?.label) continue;
      const priorities = {
        descendant:100, ancestor:90, sibling:80,
        'parent-sibling':70, 'sibling-child':60, cousin:50
      };
      const priority = (priorities[relation.kind] || 10) -
        Math.max(0, Number(relation.depth) || 0);
      candidates.push({priority, label:affinalKinshipTitle(relation,sims[target])});
    }
    if (candidates.length) {
      candidates.sort((a,b)=>b.priority-a.priority||a.label.localeCompare(b.label));
      return candidates[0].label;
    }

    // 配偶的兄弟姊妹，以血緣方向正確、也適用同性婚姻的描述表示。
    if (typeof siblingIds === 'function' && typeof siblingLabel === 'function') {
      for (const spouseId of currentSpouseIds(root,sims)) {
        if (siblingIds(spouseId).map(String).includes(target)) {
          return '配偶的' + siblingLabel(sims[spouseId],sims[target]);
        }
      }
    }
    return null;
  }

  const api = Object.freeze({
    parentIds, biologicalParentIds, coParentKind,
    childKinshipLabel, stepParentIds, stepChildIds,
    currentSpouseIds, affinalKinshipTitle, perspectiveAffinalKinship
  });
  global.L1nGGenealogyKinship = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
