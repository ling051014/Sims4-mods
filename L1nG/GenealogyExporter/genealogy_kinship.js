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

  const api = Object.freeze({
    parentIds, biologicalParentIds, coParentKind,
    childKinshipLabel, stepParentIds, stepChildIds
  });
  global.L1nGGenealogyKinship = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
