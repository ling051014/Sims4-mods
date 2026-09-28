/* ========【L1nG Genealogy Scene】 設定 - Canvas Layout / Geometry / Renderer Authority ======== */
(function (global) {
  'use strict';
  function create({ runtime, dom, constants, state, helpers } = {}) {
    if (!dom || !state || !helpers) throw new Error('Genealogy Scene requires dom, state, and helpers.');
    const genealogyRuntime = runtime || null;
    const { stage, svg, labelsSvg, nodes } = dom;
    if (!stage || !svg || !labelsSvg || !nodes) throw new Error('Genealogy Scene requires Canvas DOM references.');
    const { PAD, VIEW_CARD_LAYOUT, RACE_PRESETS, GUIDE_SNAP_PX, RELATIONSHIP_VERTICAL_SNAP_PX } = constants;
    const { getData, getViewMode, getFamilyTreeViewMode, getShowRelLabels, getRelationshipPerspectiveId, getScale } = state;
    const {
      getCardViewSettings, getCardEditSettings, cardViewAppearanceClass, cardSettingsHasBody,
      buildViewCardContentModel, renderViewCardLine, getDims, getNodeDimensions, getNodeDimensionsById,
      getGaps, getCurrentManualPositions, getCurrentFreeLayout, formatCardGender, formatCardAge,
      getActiveFamilySelectorEntry, currentTreeFamily, currentFamily, uiText, displayDataText,
      displayRelationshipText, isSiblingLink, resolveKinshipLabel, relationshipPerspectiveSim,
      clampRelationshipCurveAmount, relationshipLineSetting, relationshipOtherType,
      getOtherRelationshipLineSetting, relationshipResolvedColor, relationshipInlineSvgStyle,
      genealogyParentIds, genealogyParentRelationGroups, getChildrenOf, getRelInfoByKey, measureText,
      makeLabelSVG, getVisibleIds, syncNodeSelectionClasses, formatBirthdaySummary, esc, iconSvg, pairKey,
      avatarHTML, buildTagsHTML, buildPetsChipsHTML, genderClass, statusClass
    } = helpers;
    let genealogyData = null;
    let viewMode = 'view';
    let familyTreeViewMode = 'family';
    let showRelLabels = true;
    let relationshipPerspectiveSimId = null;
    let scale = 1;
    function syncState() {
      genealogyData = getData();
      viewMode = getViewMode();
      familyTreeViewMode = getFamilyTreeViewMode();
      showRelLabels = getShowRelLabels();
      relationshipPerspectiveSimId = getRelationshipPerspectiveId();
      scale = getScale();
    }
function relationshipCurveFactor(value) {
  const percent =
    clampRelationshipCurveAmount(
      value
    );

  // 50% 對應舊版「其他關係」約 0.15 的固定曲率。
  return (
    0.03 +
    (percent / 100) * 0.24
  );
}

function relationshipQuadraticGeometry(
  x1,
  y1,
  x2,
  y2,
  curveAmount
) {
  const dx =
    x2 - x1;

  const dy =
    y2 - y1;

  const distance =
    Math.max(
      1,
      Math.hypot(dx, dy)
    );

  const normalX =
    -dy / distance;

  const normalY =
    dx / distance;

  const bend =
    distance *
    relationshipCurveFactor(
      curveAmount
    );

  const cx =
    (x1 + x2) / 2 +
    normalX * bend;

  const cy =
    (y1 + y2) / 2 +
    normalY * bend;

  return {
    d:
      'M' + x1 + ' ' + y1 +
      ' Q' + cx + ' ' + cy +
      ' ' + x2 + ' ' + y2,
    cx,
    cy,
    labelX:
      0.25 * x1 +
      0.5 * cx +
      0.25 * x2,
    labelY:
      0.25 * y1 +
      0.5 * cy +
      0.25 * y2
  };
}

function relationshipPairRenderGeometry(
  a,
  b,
  setting
) {
  if (!setting.curved) {
    const join =
      pairJoinPoint(a, b);

    return {
      d:pairPath(a, b),
      labelX:join.x,
      labelY:join.y
    };
  }

  const {
    aX,
    aY,
    bX,
    bY
  } =
    getPairConnectionGeometry(
      a,
      b
    );

  return relationshipQuadraticGeometry(
    aX,
    aY,
    bX,
    bY,
    setting.curveAmount
  );
}

function relationshipOtherRenderGeometry(
  a,
  b,
  setting
) {
  const fromAnchor =
    avatarBoundaryAnchor(a, b);

  const toAnchor =
    avatarBoundaryAnchor(b, a);

  const x1 =
    fromAnchor.x;

  const y1 =
    fromAnchor.y;

  const x2 =
    toAnchor.x;

  const y2 =
    toAnchor.y;

  if (setting.curved) {
    return relationshipQuadraticGeometry(
      x1,
      y1,
      x2,
      y2,
      setting.curveAmount
    );
  }

  return {
    d:
      'M' + x1 + ' ' + y1 +
      ' L' + x2 + ' ' + y2,
    labelX:(x1 + x2) / 2,
    labelY:(y1 + y2) / 2
  };
}

function drawPerspectiveKinshipLabels(
  labels,
  pos,
  visibleIds
) {
  const root =
    relationshipPerspectiveSim();

  if (
    !root ||
    !visibleIds?.has(
      String(root.id)
    )
  ) {
    return;
  }

  const kinshipLabels =
    genealogyRuntime?.getKinshipLabels?.(
      root.id,
      visibleIds,
      resolveKinshipLabel
    ) ||
    null;

  visibleIds.forEach(targetId => {
    const target =
      genealogyData.sims[
        targetId
      ];

    const card =
      pos.get(targetId);

    if (!target || !card) return;

    const label =
      kinshipLabels
        ? kinshipLabels.get(
            String(targetId)
          )
        : resolveKinshipLabel(
            root.id,
            targetId
          );

    if (!label) return;

    const rect =
      cardOuterRect(card);

    const key =
      'perspective:' +
      root.id +
      ':' +
      targetId;

    labels.push(
      makeLabelSVG(
        rect.centerX,
        Math.max(
          12,
          rect.top - 16
        ),
        '',
        label,
        key
      )
    );
  });
}

// ========【配偶間距】 設定 - 依關係標籤實際寬度自適應 ========
function relationshipBubbleWidth(info) {
  if (!info) return 0;
  const fs = 12;
  const displayText = displayRelationshipText(info.text || '');
  const iconSpace = info.icon ? 18 : 0;
  return Math.max(Math.ceil(measureText(displayText, fs) + iconSpace + 24), 42);
}

function getAdaptiveSpouseGap(members, baseGap) {
  if (!members || members.length < 2) return baseGap;

  // 配偶標籤必須完整放在兩張卡片之間，左右各保留約 10px 呼吸空間。
  // 英文、自訂長關係名稱都會依實際顯示文字重新量測；隱藏關係按鈕不會改變這個幾何間距。
  let widestLabel = 0;
  const head = members[0];
  for (let i = 1; i < members.length; i += 1) {
    const spouse = members[i];
    const pairK = pairKey(head.id, spouse.id);
    const info = getRelInfoByKey('spouse:' + pairK, 'spouse');
    widestLabel = Math.max(widestLabel, relationshipBubbleWidth(info));
  }

  const visualMinimum = viewMode === 'view' ? 52 : 60;
  const labelDrivenGap = widestLabel ? widestLabel + 20 : 0;
  // 上限避免極長自訂關係把整棵族譜撐得過度鬆散。
    return Math.min(Math.max(baseGap, visualMinimum, labelDrivenGap), 168);
}

// ========【族譜自動排版核心】 設定 - Family Unit / 世代分層 / 交叉最小化 ========
function buildGenealogyLayoutModel(visibleIds) {
  const {
    SPOUSE:SPOUSE_GAP
  } = getGaps();

  const sims = [...visibleIds]
    .map(id => genealogyData.sims[id])
    .filter(Boolean);

  const byId = new Map(
    sims.map(sim => [sim.id, sim])
  );

  const componentParent = new Map(
    sims.map(sim => [sim.id, sim.id])
  );

  const find = id => {
    const parent = componentParent.get(id);
    if (parent == null) return null;
    if (parent === id) return id;

    const root = find(parent);
    componentParent.set(id, root);
    return root;
  };

  const union = (a, b) => {
    const aRoot = find(a);
    const bRoot = find(b);

    if (aRoot == null || bRoot == null || aRoot === bRoot) return;
    componentParent.set(bRoot, aRoot);
  };

  // 現任配偶是同一個 family unit。
  // 前任配偶保留關係線，但不強迫與現任家庭綁成同一橫向單位。
  sims.forEach(sim => {
    (sim.spouseIds || []).forEach(spouseId => {
      if (byId.has(spouseId)) union(sim.id, spouseId);
    });
  });

  const unitMembers = new Map();

  sims.forEach(sim => {
    const root = find(sim.id);
    if (!unitMembers.has(root)) unitMembers.set(root, []);
    unitMembers.get(root).push(sim);
  });

  const units = [];
  const unitBySim = new Map();

  [...unitMembers.entries()].forEach(([root, members], sequence) => {
    members.sort((a, b) =>
      (a.order ?? 0) - (b.order ?? 0) ||
      String(a.name || '').localeCompare(String(b.name || ''), 'zh') ||
      String(a.id).localeCompare(String(b.id))
    );

    let width = 0;
    let height = 0;
    let spouseGap = SPOUSE_GAP;

    if (members.length === 2) {
      spouseGap = getAdaptiveSpouseGap(
        members,
        SPOUSE_GAP
      );
    }

    members.forEach((member, index) => {
      const dims = getNodeDimensions(member);
      width += dims.W;
      height = Math.max(height, dims.H);

      if (index < members.length - 1) {
        width += spouseGap;
      }
    });

    const unit = {
      id:'unit:' + root,
      members,
      memberIds:new Set(members.map(member => member.id)),
      width,
      height,
      spouseGap,
      sequence,
      parentUnitIds:new Set(),
      childUnitIds:new Set(),
      generation:0,
      x:0,
      y:0
    };

    units.push(unit);
    members.forEach(member => unitBySim.set(member.id, unit));
  });

  const unitById = new Map(
    units.map(unit => [unit.id, unit])
  );

  // family unit 之間由 canonical 親子關係建立世代方向。
  // 親生與領養都是真正的 parent-child；差異只留在線型與標籤。
  sims.forEach(child => {
    const childUnit = unitBySim.get(child.id);
    if (!childUnit) return;

    genealogyParentIds(child, byId).forEach(parentId => {
      const parentUnit = unitBySim.get(parentId);
      if (!parentUnit || parentUnit.id === childUnit.id) return;

      parentUnit.childUnitIds.add(childUnit.id);
      childUnit.parentUnitIds.add(parentUnit.id);
    });
  });

  const generationMemo = new Map();
  const visiting = new Set();

  const resolveGeneration = unitId => {
    if (generationMemo.has(unitId)) {
      return generationMemo.get(unitId);
    }

    if (visiting.has(unitId)) {
      // 異常循環資料保護：正常 genealogy 不應形成祖先循環。
      return 0;
    }

    visiting.add(unitId);

    const unit = unitById.get(unitId);
    const parentIds = unit
      ? [...unit.parentUnitIds]
      : [];

    const generation = parentIds.length
      ? 1 + Math.max(...parentIds.map(resolveGeneration))
      : 0;

    visiting.delete(unitId);
    generationMemo.set(unitId, generation);

    return generation;
  };

  units.forEach(unit => {
    unit.generation = resolveGeneration(unit.id);
  });

  // ========【族譜世代約束】 設定 - 共同父母 / 前任伴侶固定於同一世代列 ========
  // 只調整畫面上的世代，不改寫任何關係資料。
  // 標準族譜的伴侶關係必須是水平線，因此不能讓共同父母或前任落在不同高度。
  const maxGenerationPasses =
    Math.max(4, units.length * 4);

  for (let pass = 0; pass < maxGenerationPasses; pass += 1) {
    let changed = false;

    // 同一名子女的共同父母位於同一世代。
    sims.forEach(child => {
      const parentUnits = [...new Set(
        genealogyParentIds(child, byId)
          .map(parentId => unitBySim.get(parentId))
          .filter(Boolean)
      )];

      if (parentUnits.length < 2) return;

      const targetGeneration = Math.max(
        ...parentUnits.map(unit => unit.generation)
      );

      parentUnits.forEach(unit => {
        if (unit.generation === targetGeneration) return;
        unit.generation = targetGeneration;
        changed = true;
      });
    });

    // 前任配偶仍屬於族譜中的伴侶關係，固定同一世代列。
    sims.forEach(sim => {
      const unit = unitBySim.get(sim.id);
      if (!unit) return;

      (sim.exSpouseIds || []).forEach(exId => {
        const exUnit = unitBySim.get(exId);
        if (!exUnit || exUnit.id === unit.id) return;

        const targetGeneration =
          Math.max(unit.generation, exUnit.generation);

        if (unit.generation !== targetGeneration) {
          unit.generation = targetGeneration;
          changed = true;
        }

        if (exUnit.generation !== targetGeneration) {
          exUnit.generation = targetGeneration;
          changed = true;
        }
      });
    });

    // 上一代被對齊後，子代至少必須再往下一代。
    units.forEach(parentUnit => {
      parentUnit.childUnitIds.forEach(childUnitId => {
        const childUnit = unitById.get(childUnitId);
        if (!childUnit) return;

        const minimumGeneration =
          parentUnit.generation + 1;

        if (childUnit.generation >= minimumGeneration) return;

        childUnit.generation = minimumGeneration;
        changed = true;
      });
    });

    if (!changed) break;
  }

  return {
    sims,
    byId,
    units,
    unitById,
    unitBySim
  };
}

function stableGenealogyUnitCompare(a, b) {
  const aOrder = Math.min(
    ...a.members.map(member => member.order ?? Number.MAX_SAFE_INTEGER)
  );
  const bOrder = Math.min(
    ...b.members.map(member => member.order ?? Number.MAX_SAFE_INTEGER)
  );

  return (
    aOrder - bOrder ||
    a.sequence - b.sequence ||
    String(a.members[0]?.name || '').localeCompare(
      String(b.members[0]?.name || ''),
      'zh'
    )
  );
}


// ========【族譜排列身分】 設定 - 主家族與外部關係人物分離 ========
function getActiveLayoutPrimaryIds(
  visibleIds
) {
  const visible =
    visibleIds instanceof Set
      ? visibleIds
      : new Set(visibleIds || []);

  const entry =
    getActiveFamilySelectorEntry(
      familyTreeViewMode
    );

  const candidates =
    (
      entry &&
      Array.isArray(
        entry.primaryMemberIds
      ) &&
      entry.primaryMemberIds.length
    )
      ? entry.primaryMemberIds
      : (
          currentTreeFamily()?.memberIds ||
          []
        );

  const primary =
    new Set(
      candidates
        .map(String)
        .filter(id =>
          visible.has(id) &&
          genealogyData.sims[id]
        )
    );

  // 篩選可能暫時隱藏所有主家族成員。
  // 這時退回目前 visible 集合，避免沒有排列權威。
  if (!primary.size) {
    visible.forEach(id => {
      if (genealogyData.sims[id]) {
        primary.add(id);
      }
    });
  }

  return primary;
}

function compareFamilyBranchPath(
  leftPath,
  rightPath
) {
  const left =
    leftPath || [];

  const right =
    rightPath || [];

  const length =
    Math.max(
      left.length,
      right.length
    );

  for (
    let index = 0;
    index < length;
    index += 1
  ) {
    if (left[index] == null) return -1;
    if (right[index] == null) return 1;

    if (left[index] !== right[index]) {
      return (
        left[index] -
        right[index]
      );
    }
  }

  return 0;
}

function buildFamilyBranchOwnership(
  model,
  primarySimIds
) {
  const primaryUnitIds =
    new Set();

  model.units.forEach(unit => {
    const primaryMemberIds =
      new Set(
        unit.members
          .map(member => member.id)
          .filter(id =>
            primarySimIds.has(id)
          )
      );

    const attachmentMemberIds =
      new Set(
        unit.members
          .map(member => member.id)
          .filter(id =>
            !primarySimIds.has(id)
          )
      );

    unit.primaryMemberIds =
      primaryMemberIds;

    unit.attachmentMemberIds =
      attachmentMemberIds;

    unit.isPrimaryBranch =
      primaryMemberIds.size > 0;

    if (unit.isPrimaryBranch) {
      primaryUnitIds.add(unit.id);
    }
  });

  // 若目前資料沒有可辨識的 primary unit，
  // 所有 visible unit 都視為主族譜，保持安全退化。
  if (!primaryUnitIds.size) {
    model.units.forEach(unit => {
      unit.isPrimaryBranch = true;
      unit.primaryMemberIds =
        new Set(
          unit.members.map(
            member => member.id
          )
        );
      unit.attachmentMemberIds =
        new Set();
      primaryUnitIds.add(unit.id);
    });
  }

  const primaryParents =
    new Map();

  const primaryChildren =
    new Map();

  model.units.forEach(unit => {
    if (!primaryUnitIds.has(unit.id)) {
      return;
    }

    primaryParents.set(
      unit.id,
      [...unit.parentUnitIds]
        .filter(parentId =>
          primaryUnitIds.has(parentId)
        )
    );

    primaryChildren.set(
      unit.id,
      [...unit.childUnitIds]
        .filter(childId =>
          primaryUnitIds.has(childId)
        )
        .sort((leftId, rightId) =>
          stableGenealogyUnitCompare(
            model.unitById.get(leftId),
            model.unitById.get(rightId)
          )
        )
    );
  });

  const pathByUnit =
    new Map();

  const rootByUnit =
    new Map();

  const ownerParentByUnit =
    new Map();

  const roots =
    model.units
      .filter(unit =>
        primaryUnitIds.has(unit.id) &&
        !(
          primaryParents.get(unit.id) ||
          []
        ).length
      )
      .sort(stableGenealogyUnitCompare);

  let nextRootIndex = 0;

  roots.forEach(root => {
    pathByUnit.set(
      root.id,
      [nextRootIndex]
    );

    rootByUnit.set(
      root.id,
      root.id
    );

    nextRootIndex += 1;
  });

  const primaryUnitsByGeneration =
    model.units
      .filter(unit =>
        primaryUnitIds.has(unit.id)
      )
      .sort((left, right) =>
        left.generation -
          right.generation ||
        stableGenealogyUnitCompare(
          left,
          right
        )
      );

  // generation DAG 由上往下建立遞迴 branch path。
  // B branch = [root, B]；B 的所有後代都會保留這個 prefix，
  // 因此其他 family 永遠無法插進 B / C branch 之間。
  primaryUnitsByGeneration
    .forEach(unit => {
      if (pathByUnit.has(unit.id)) {
        return;
      }

      const parentCandidates =
        (
          primaryParents.get(unit.id) ||
          []
        )
          .filter(parentId =>
            pathByUnit.has(parentId)
          )
          .sort((leftId, rightId) =>
            compareFamilyBranchPath(
              pathByUnit.get(leftId),
              pathByUnit.get(rightId)
            ) ||
            stableGenealogyUnitCompare(
              model.unitById.get(leftId),
              model.unitById.get(rightId)
            )
          );

      if (!parentCandidates.length) {
        pathByUnit.set(
          unit.id,
          [nextRootIndex]
        );

        rootByUnit.set(
          unit.id,
          unit.id
        );

        nextRootIndex += 1;
        return;
      }

      const ownerParentId =
        parentCandidates[0];

      const siblings =
        primaryChildren.get(
          ownerParentId
        ) || [];

      const siblingIndex =
        Math.max(
          0,
          siblings.indexOf(unit.id)
        );

      pathByUnit.set(
        unit.id,
        [
          ...pathByUnit.get(
            ownerParentId
          ),
          siblingIndex
        ]
      );

      rootByUnit.set(
        unit.id,
        rootByUnit.get(
          ownerParentId
        ) ||
        ownerParentId
      );

      ownerParentByUnit.set(
        unit.id,
        ownerParentId
      );
    });

  // 每個 generation 中，主家族的左右位置用來決定外部配偶應往哪一側掛。
  const primarySideByUnit =
    new Map();

  const generations =
    [...new Set(
      model.units
        .filter(unit =>
          primaryUnitIds.has(unit.id)
        )
        .map(unit =>
          unit.generation
        )
    )]
      .sort((a, b) => a - b);

  generations.forEach(generation => {
    const primaryUnits =
      model.units
        .filter(unit =>
          primaryUnitIds.has(unit.id) &&
          unit.generation === generation
        )
        .sort((left, right) =>
          compareFamilyBranchPath(
            pathByUnit.get(left.id),
            pathByUnit.get(right.id)
          ) ||
          stableGenealogyUnitCompare(
            left,
            right
          )
        );

    const midpoint =
      (primaryUnits.length - 1) / 2;

    primaryUnits.forEach(
      (unit, index) => {
        primarySideByUnit.set(
          unit.id,
          index < midpoint
            ? -1
            : (
                index > midpoint
                  ? 1
                  : 0
              )
        );
      }
    );
  });

  const attachmentOwnerByUnit =
    new Map();

  const attachmentSideByUnit =
    new Map();

  // Attachment unit（通常是前任）只找直接關聯的 primary owner，
  // 不把它自己的親族遞迴帶進主家族。
  model.units.forEach(unit => {
    if (primaryUnitIds.has(unit.id)) {
      return;
    }

    const candidates =
      new Map();

    unit.members.forEach(member => {
      const relatedIds =
        new Set([
          ...(member.spouseIds || []),
          ...(member.exSpouseIds || []),
          ...genealogyParentIds(
            member,
            model.byId
          ),
          ...getChildrenOf(
            String(member.id)
          )
            .map(child =>
              String(child.id)
            )
        ]);

      relatedIds.forEach(relatedId => {
        const relatedUnit =
          model.unitBySim.get(
            String(relatedId)
          );

        if (
          !relatedUnit ||
          !primaryUnitIds.has(
            relatedUnit.id
          )
        ) {
          return;
        }

        const generationDistance =
          Math.abs(
            relatedUnit.generation -
            unit.generation
          );

        const existing =
          candidates.get(
            relatedUnit.id
          );

        if (
          !existing ||
          generationDistance <
            existing.generationDistance
        ) {
          candidates.set(
            relatedUnit.id,
            {
              unit:relatedUnit,
              generationDistance
            }
          );
        }
      });
    });

    const owner =
      [...candidates.values()]
        .sort((left, right) =>
          left.generationDistance -
            right.generationDistance ||
          compareFamilyBranchPath(
            pathByUnit.get(
              left.unit.id
            ),
            pathByUnit.get(
              right.unit.id
            )
          )
        )[0]?.unit ||
      null;

    if (!owner) {
      return;
    }

    attachmentOwnerByUnit.set(
      unit.id,
      owner.id
    );

    let side =
      primarySideByUnit.get(
        owner.id
      ) || 0;

    if (!side) {
      side =
        stableGenealogyUnitCompare(
          unit,
          owner
        ) < 0
          ? -1
          : 1;
    }

    attachmentSideByUnit.set(
      unit.id,
      side
    );
  });

  return {
    primarySimIds,
    primaryUnitIds,
    pathByUnit,
    rootByUnit,
    ownerParentByUnit,
    primarySideByUnit,
    attachmentOwnerByUnit,
    attachmentSideByUnit
  };
}

function applyFamilyBranchOrdering(
  layers,
  model,
  ownership
) {
  layers.forEach(layer => {
    if (!layer || layer.length < 2) {
      return;
    }

    const primary = [];
    const leftAttachments = [];
    const rightAttachments = [];

    layer.forEach(unit => {
      if (
        ownership.primaryUnitIds
          .has(unit.id)
      ) {
        primary.push(unit);
        return;
      }

      const side =
        ownership.attachmentSideByUnit
          .get(unit.id) || 1;

      (
        side < 0
          ? leftAttachments
          : rightAttachments
      ).push(unit);
    });

    primary.sort((left, right) =>
      compareFamilyBranchPath(
        ownership.pathByUnit.get(
          left.id
        ),
        ownership.pathByUnit.get(
          right.id
        )
      ) ||
      stableGenealogyUnitCompare(
        left,
        right
      )
    );

    const attachmentCompare =
      (left, right) => {
        const leftOwner =
          ownership.attachmentOwnerByUnit
            .get(left.id);

        const rightOwner =
          ownership.attachmentOwnerByUnit
            .get(right.id);

        const ownerOrder =
          compareFamilyBranchPath(
            ownership.pathByUnit.get(
              leftOwner
            ),
            ownership.pathByUnit.get(
              rightOwner
            )
          );

        return (
          ownerOrder ||
          stableGenealogyUnitCompare(
            left,
            right
          )
        );
      };

    leftAttachments.sort(
      attachmentCompare
    );

    rightAttachments.sort(
      attachmentCompare
    );

    // 外部人物只能待在整個 Primary Family block 的外側。
    // 不允許 [B branch][外人][C branch]。
    layer.splice(
      0,
      layer.length,
      ...leftAttachments,
      ...primary,
      ...rightAttachments
    );
  });
}

function buildGenerationLayers(units) {
  const layers = new Map();

  units.forEach(unit => {
    if (!layers.has(unit.generation)) {
      layers.set(unit.generation, []);
    }

    layers.get(unit.generation).push(unit);
  });

  layers.forEach(layer => {
    layer.sort(stableGenealogyUnitCompare);
  });

  return layers;
}

function genealogyFamilySideScore(member, unit, model, connectorGroups) {
  const weighted = [];

  // 兄弟姊妹所在位置最能代表「原生家系應該從夫妻哪一側延伸」。
  connectorGroups.forEach(group => {
    if (!group.children.includes(member.id)) return;

    group.children.forEach(childId => {
      const childUnit =
        model.unitBySim.get(childId);

      if (
        !childUnit ||
        childUnit.id === unit.id
      ) {
        return;
      }

      weighted.push({
        value:
          childUnit.x +
          childUnit.width / 2,
        weight:3
      });
    });
  });

  // 沒有兄弟姊妹時，父母家系的位置仍可決定夫妻左右方向。
  genealogyParentIds(
    member,
    model.byId
  ).forEach(parentId => {
    const parentUnit =
      model.unitBySim.get(parentId);

    if (!parentUnit) return;

    weighted.push({
      value:
        parentUnit.x +
        parentUnit.width / 2,
      weight:2
    });
  });

  if (!weighted.length) {
    return null;
  }

  const totalWeight =
    weighted.reduce(
      (sum, entry) =>
        sum + entry.weight,
      0
    );

  return weighted.reduce(
    (sum, entry) =>
      sum +
      entry.value *
      entry.weight,
    0
  ) / totalWeight;
}

function orientSpouseUnitsByLineage(
  model,
  connectorGroups,
  ownership = null
) {
  let changed = false;

  model.units.forEach(unit => {
    if (unit.members.length !== 2) {
      return;
    }

    const [leftMember, rightMember] =
      unit.members;

    // ========【主家族配偶方向】 設定 - 外部配偶永遠朝主家族外側 ========
    if (
      ownership &&
      unit.primaryMemberIds &&
      unit.primaryMemberIds.size === 1 &&
      unit.attachmentMemberIds &&
      unit.attachmentMemberIds.size === 1
    ) {
      const primaryId =
        [...unit.primaryMemberIds][0];

      const primaryIsLeft =
        leftMember.id === primaryId;

      const side =
        ownership.primarySideByUnit
          .get(unit.id) || 0;

      // 左 branch：X ─ B
      // 右 branch：C ─ Y
      if (side < 0 && primaryIsLeft) {
        unit.members.reverse();
        changed = true;
        return;
      }

      if (side > 0 && !primaryIsLeft) {
        unit.members.reverse();
        changed = true;
        return;
      }

      if (side !== 0) {
        return;
      }
    }

    // 主家族中央或兩人都屬於 primary 時，
    // 沿用既有 lineage orientation。
    const leftScore =
      genealogyFamilySideScore(
        leftMember,
        unit,
        model,
        connectorGroups
      );

    const rightScore =
      genealogyFamilySideScore(
        rightMember,
        unit,
        model,
        connectorGroups
      );

    let shouldReverse = false;

    if (
      Number.isFinite(leftScore) &&
      Number.isFinite(rightScore)
    ) {
      shouldReverse =
        leftScore >
        rightScore + 0.5;
    } else {
      const unitCenter =
        unit.x +
        unit.width / 2;

      if (Number.isFinite(leftScore)) {
        shouldReverse =
          leftScore > unitCenter;
      } else if (
        Number.isFinite(rightScore)
      ) {
        shouldReverse =
          rightScore < unitCenter;
      }
    }

    if (!shouldReverse) return;

    unit.members.reverse();
    changed = true;
  });

  return changed;
}

function setGenerationVerticalPositions(layers) {
  const {
    LEVEL:LEVEL_GAP
  } = getGaps();

  const generations = [...layers.keys()]
    .sort((a, b) => a - b);

  let cursorY = 0;

  generations.forEach(generation => {
    const layer = layers.get(generation);
    const maxHeight = Math.max(
      0,
      ...layer.map(unit => unit.height)
    );

    layer.forEach(unit => {
      unit.y = cursorY;
    });

    cursorY += maxHeight + LEVEL_GAP;
  });
}

function packGenealogyLayer(layer, desiredLefts, gap) {
  if (!layer || !layer.length) return;

  const targets = layer.map(unit => {
    const target = desiredLefts.get(unit.id);
    return Number.isFinite(target) ? target : unit.x;
  });

  const packed = [...targets];

  // ========【同世代防重疊】 設定 - 只處理卡片碰撞，不重新定義族譜中心 ========
  // 先由左至右消除碰撞，再由右至左回收不必要的位移。
  // 這裡只負責「卡片不能重疊」，父母 / 子女的真正中心由 pedigree anchor solver 決定。
  for (let index = 1; index < layer.length; index += 1) {
    const minimum =
      packed[index - 1] +
      layer[index - 1].width +
      gap;

    if (packed[index] < minimum) {
      packed[index] = minimum;
    }
  }

  for (let index = layer.length - 2; index >= 0; index -= 1) {
    const maximum =
      packed[index + 1] -
      layer[index].width -
      gap;

    if (
      packed[index] > maximum &&
      targets[index] <= maximum
    ) {
      packed[index] = maximum;
    }
  }

  layer.forEach((unit, index) => {
    unit.x = packed[index];
  });
}

function assignInitialGenealogyHorizontalPositions(layers) {
  const {
    SIBLING:SIBLING_GAP
  } = getGaps();

  layers.forEach(layer => {
    let cursorX = 0;

    layer.forEach(unit => {
      unit.x = cursorX;
      cursorX += unit.width + SIBLING_GAP;
    });
  });
}

function genealogyUnitMemberLocalGeometry(unit, simId) {
  if (!unit) return null;

  let cursorX = 0;

  for (let index = 0; index < unit.members.length; index += 1) {
    const member = unit.members[index];
    const dims = getNodeDimensions(member);
    const left = cursorX;
    const right = left + dims.W;

    if (member.id === simId) {
      return {
        left,
        right,
        centerX:(left + right) / 2,
        leftExtent:(left + right) / 2,
        rightExtent:unit.width - (left + right) / 2
      };
    }

    cursorX = right;

    if (index < unit.members.length - 1) {
      cursorX += unit.spouseGap;
    }
  }

  return null;
}

// ========【族譜關係錨點】 設定 - 自動排列與 SVG 共用同一個頭像／卡片連接中心 ========
function genealogyUnitMemberRelationshipGeometry(
  unit,
  simId
) {
  const base =
    genealogyUnitMemberLocalGeometry(
      unit,
      simId
    );

  if (!unit || !base) {
    return null;
  }

  const anchorLocalX =
    base.left +
    relationshipVerticalAnchorLocalX(
      simId
    );

  return {
    ...base,
    anchorLocalX,

    // sibling 排列的左右安全距離必須從真正的關係 anchor 算，
    // 不能再從卡片幾何中心算。
    leftExtent:anchorLocalX,
    rightExtent:
      unit.width -
      anchorLocalX
  };
}


function genealogyGroupParentEntries(group, model) {
  return group.parentIds
    .map(parentId => {
      const unit =
        model.unitBySim.get(parentId);

      const geometry =
        genealogyUnitMemberRelationshipGeometry(
          unit,
          parentId
        );

      if (!unit || !geometry) {
        return null;
      }

      return {
        id:parentId,
        sim:model.byId.get(parentId),
        unit,
        geometry,
        anchorX:
          unit.x +
          geometry.anchorLocalX
      };
    })
    .filter(Boolean);
}

function genealogyGroupSourceX(group, model) {
  const parents =
    genealogyGroupParentEntries(
      group,
      model
    );

  if (!parents.length) {
    return null;
  }

  const toPosition = parent => ({
    id:parent.id,
    x:
      parent.unit.x +
      parent.geometry.left,
    y:parent.unit.y
  });

  if (parents.length === 1) {
    return (
      cardVerticalAnchor(
        toPosition(parents[0]),
        'bottom'
      ).x -
      PAD
    );
  }

  const [first, second] =
    parents;

  const isPartnerPair =
    !!first.sim &&
    (
      (first.sim.spouseIds || [])
        .includes(second.id) ||
      (first.sim.exSpouseIds || [])
        .includes(second.id)
    );

  if (isPartnerPair) {
    return (
      pairJoinPoint(
        toPosition(first),
        toPosition(second)
      ).x -
      PAD
    );
  }

  const firstX =
    cardVerticalAnchor(
      toPosition(first),
      'bottom'
    ).x -
    PAD;

  const secondX =
    cardVerticalAnchor(
      toPosition(second),
      'bottom'
    ).x -
    PAD;

  return (
    firstX +
    secondX
  ) / 2;
}

// ========【自動排列關係軸】 設定 - 使用與 renderer 完全相同的 parent source 幾何 ========


function genealogyChildAnchorX(childId, model) {
  const unit =
    model.unitBySim.get(childId);

  const geometry =
    genealogyUnitMemberRelationshipGeometry(
      unit,
      childId
    );

  if (!unit || !geometry) {
    return null;
  }

  return (
    unit.x +
    geometry.anchorLocalX
  );
}

function pedigreeChildEntries(group, model, generation, layerIndex) {
  const entries =
    group.children
      .map(childId => {
        const unit =
          model.unitBySim.get(childId);

        if (
          !unit ||
          unit.generation !== generation
        ) {
          return null;
        }

        const geometry =
          genealogyUnitMemberRelationshipGeometry(
            unit,
            childId
          );

        if (!geometry) return null;

        return {
          childId,
          unit,
          geometry,
          order:
            layerIndex.get(unit.id) ??
            Number.MAX_SAFE_INTEGER
        };
      })
      .filter(Boolean)
      .sort((a, b) =>
        a.order - b.order ||
        a.geometry.anchorLocalX -
          b.geometry.anchorLocalX
      );

  // 同一 family unit 只佔一個自動排列位置；
  // 真正 SVG 仍可保留每一位子女自己的 relationship anchor。
  const unique = [];
  const seen = new Set();

  entries.forEach(entry => {
    if (seen.has(entry.unit.id)) {
      return;
    }

    seen.add(entry.unit.id);
    unique.push(entry);
  });

  return unique;
}

function buildPedigreeChildTargets(
  group,
  model,
  generation,
  layerIndex,
  gap
) {
  const sourceX =
    genealogyGroupSourceX(
      group,
      model
    );

  if (!Number.isFinite(sourceX)) {
    return [];
  }

  const entries =
    pedigreeChildEntries(
      group,
      model,
      generation,
      layerIndex
    );

  if (!entries.length) {
    return [];
  }

  if (entries.length === 1) {
    const entry =
      entries[0];

    return [{
      unit:entry.unit,
      left:
        sourceX -
        entry.geometry.anchorLocalX
    }];
  }

  // ========【多子女 Relationship Bus】 設定 - 以真正 child relationship anchor 排 sibling ========
  // 水平 sibling bus 是必要結構，但最後落到每名子女的 branch 必須是純垂直；
  // 因此所有間距與置中都以實際 relationship anchor 為基準，不再使用卡片中心。
  const anchorXs = [0];

  for (
    let index = 1;
    index < entries.length;
    index += 1
  ) {
    const previous =
      entries[index - 1];

    const current =
      entries[index];

    anchorXs[index] =
      anchorXs[index - 1] +
      previous.geometry.rightExtent +
      gap +
      current.geometry.leftExtent;
  }

  const busCenter =
    (
      anchorXs[0] +
      anchorXs[
        anchorXs.length - 1
      ]
    ) / 2;

  const shift =
    sourceX -
    busCenter;

  return entries.map(
    (entry, index) => {
      const branchX =
        anchorXs[index] +
        shift;

      return {
        unit:entry.unit,
        left:
          branchX -
          entry.geometry.anchorLocalX
      };
    }
  );
}

function mergePedigreeLeftTarget(targets, unitId, left) {
  if (!Number.isFinite(left)) return;

  if (!targets.has(unitId)) {
    targets.set(unitId, []);
  }

  targets.get(unitId).push(left);
}

function averagePedigreeLeftTargets(targets) {
  const averaged = new Map();

  targets.forEach((values, unitId) => {
    if (!values.length) return;

    averaged.set(
      unitId,
      values.reduce((sum, value) => sum + value, 0) /
        values.length
    );
  });

  return averaged;
}

function alignPedigreeChildrenToParents(layers, model, connectorGroups) {
  const {
    SIBLING:SIBLING_GAP
  } = getGaps();

  const generations =
    [...layers.keys()].sort((a, b) => a - b);

  generations.slice(1).forEach(generation => {
    const layer = layers.get(generation);
    const layerIndex =
      new Map(
        layer.map((unit, index) => [unit.id, index])
      );

    const requestedLefts = new Map();

    connectorGroups.forEach(group => {
      buildPedigreeChildTargets(
        group,
        model,
        generation,
        layerIndex,
        SIBLING_GAP
      ).forEach(target => {
        mergePedigreeLeftTarget(
          requestedLefts,
          target.unit.id,
          target.left
        );
      });
    });

    packGenealogyLayer(
      layer,
      averagePedigreeLeftTargets(requestedLefts),
      SIBLING_GAP
    );
  });
}

function alignPedigreeParentsToChildren(layers, model, connectorGroups) {
  const {
    SIBLING:SIBLING_GAP
  } = getGaps();

  const generations =
    [...layers.keys()].sort((a, b) => a - b);

  generations
    .slice(0, -1)
    .reverse()
    .forEach(generation => {
      const requestedLefts = new Map();

      connectorGroups.forEach(group => {
        const parents =
          genealogyGroupParentEntries(group, model)
            .filter(entry =>
              entry.unit.generation === generation
            );

        if (!parents.length) return;

        const childXs =
          group.children
            .map(childId =>
              genealogyChildAnchorX(
                childId,
                model
              )
            )
            .filter(Number.isFinite);

        if (!childXs.length) return;

        const targetX =
          childXs.length === 1
            ? childXs[0]
            : (
                Math.min(...childXs) +
                Math.max(...childXs)
              ) / 2;

        const sourceX =
          genealogyGroupSourceX(group, model);

        if (!Number.isFinite(sourceX)) return;

        const delta =
          targetX - sourceX;

        const parentUnits =
          new Map();

        parents.forEach(parent => {
          parentUnits.set(
            parent.unit.id,
            parent.unit
          );
        });

        parentUnits.forEach(unit => {
          if (!requestedLefts.has(unit.id)) {
            requestedLefts.set(unit.id, []);
          }

          requestedLefts.get(unit.id)
            .push(unit.x + delta);
        });
      });

      const layer =
        layers.get(generation);

      const desiredLefts =
        new Map();

      layer.forEach(unit => {
        const requests =
          requestedLefts.get(unit.id);

        if (!requests || !requests.length) {
          desiredLefts.set(
            unit.id,
            unit.x
          );
          return;
        }

        desiredLefts.set(
          unit.id,
          requests.reduce(
            (sum, value) => sum + value,
            0
          ) / requests.length
        );
      });

      // 對齊父母時同時做 collision packing。
      // 「不重疊」是硬約束；無法完全置中時交給正交關係線處理，
      // 不再為了追求垂直主幹把另一個家系壓進來。
      packGenealogyLayer(
        layer,
        desiredLefts,
        SIBLING_GAP
      );
    });
}

function resolvePedigreeLayerCollisions(layers) {
  const {
    SIBLING:SIBLING_GAP
  } = getGaps();

  layers.forEach(layer => {
    if (!layer.length) return;

    // ========【同世代防重疊】 設定 - 保留家系語意順序 ========
    // layer 的順序已由 crossing minimization + sibling branch block 決定。
    // collision pass 只能推開距離，不能再依目前 x 重新排序，
    // 否則同父母子女會再次被其他家系插入。
    const targets =
      new Map(
        layer.map(unit => [
          unit.id,
          unit.x
        ])
      );

    packGenealogyLayer(
      layer,
      targets,
      SIBLING_GAP
    );
  });
}




// ========【親子垂直關係線】 設定 - 自動排列以單一子女直線為硬約束，不借用卡片智慧吸附 ========

// ========【自動排列關係幾何】 設定 - 單一子女親子線預設必須為垂直，不以 V-H-V 解決碰撞 ========
function buildAutoVerticalRelationshipConstraints(
  model,
  connectorGroups
) {
  const constraints = [];

  connectorGroups.forEach(group => {
    const parentEntries =
      genealogyGroupParentEntries(
        group,
        model
      );

    if (!parentEntries.length) {
      return;
    }

    const sourceX =
      genealogyGroupSourceX(
        group,
        model
      );

    if (!Number.isFinite(sourceX)) {
      return;
    }

    const parentUnitIds =
      [...new Set(
        parentEntries.map(
          entry => entry.unit.id
        )
      )];

    const parentCoefficients =
      new Map();

    if (parentUnitIds.length === 1) {
      parentCoefficients.set(
        parentUnitIds[0],
        1
      );
    } else {
      const weight =
        1 /
        parentUnitIds.length;

      parentUnitIds.forEach(unitId => {
        parentCoefficients.set(
          unitId,
          weight
        );
      });
    }

    const sourceConstant =
      sourceX -
      [...parentCoefficients.entries()]
        .reduce(
          (
            sum,
            [unitId, coefficient]
          ) =>
            sum +
            coefficient *
            (
              model.unitById
                .get(unitId)?.x ||
              0
            ),
          0
        );

    const children =
      group.children
        .map(childId => {
          const unit =
            model.unitBySim.get(
              childId
            );

          const geometry =
            genealogyUnitMemberRelationshipGeometry(
              unit,
              childId
            );

          if (!unit || !geometry) {
            return null;
          }

          return {
            childId,
            unit,
            geometry,
            anchorX:
              unit.x +
              geometry.anchorLocalX
          };
        })
        .filter(Boolean)
        .sort((left, right) =>
          left.anchorX -
            right.anchorX ||
          String(left.childId)
            .localeCompare(
              String(right.childId)
            )
        );

    if (!children.length) {
      return;
    }

    const coefficients =
      new Map();

    const addCoefficient =
      (unitId, value) => {
        coefficients.set(
          unitId,
          (
            coefficients.get(unitId) ||
            0
          ) +
          value
        );
      };

    parentCoefficients.forEach(
      (coefficient, unitId) => {
        addCoefficient(
          unitId,
          -coefficient
        );
      }
    );

    let childConstant = 0;
    let type = 'single-child-axis';

    if (children.length === 1) {
      const child =
        children[0];

      addCoefficient(
        child.unit.id,
        1
      );

      childConstant =
        child.geometry.anchorLocalX;
    } else {
      // 多子女的 canonical 幾何：
      // parent trunk 對準 sibling bus 的外側 child branches 中點。
      // 中間子女可依實際 Family Unit 寬度自然展開，不被固定死。
      const leftChild =
        children[0];

      const rightChild =
        children[
          children.length - 1
        ];

      addCoefficient(
        leftChild.unit.id,
        0.5
      );

      addCoefficient(
        rightChild.unit.id,
        0.5
      );

      childConstant =
        (
          leftChild.geometry.anchorLocalX +
          rightChild.geometry.anchorLocalX
        ) / 2;

      type =
        'multi-child-bus-center';
    }

    constraints.push({
      type,
      groupKey:group.key,
      childIds:
        children.map(
          child => child.childId
        ),
      coefficients,

      // child expression = parent source
      // Σ(child coefficients * unit.x) + childConstant
      // =
      // Σ(parent coefficients * unit.x) + sourceConstant
      b:
        sourceConstant -
        childConstant
    });
  });

  return constraints;
}

function projectAutoVerticalRelationshipConstraints(
  model,
  constraints
) {
  let maxError = 0;

  constraints.forEach(constraint => {
    let current = 0;
    let denominator = 0;

    constraint.coefficients.forEach(
      (coefficient, unitId) => {
        const unit =
          model.unitById.get(unitId);

        if (!unit) return;

        current +=
          coefficient *
          unit.x;

        denominator +=
          coefficient *
          coefficient;
      }
    );

    if (denominator <= 0) {
      return;
    }

    const error =
      constraint.b -
      current;

    maxError =
      Math.max(
        maxError,
        Math.abs(error)
      );

    if (Math.abs(error) <= 0.0001) {
      return;
    }

    const correction =
      error /
      denominator;

    constraint.coefficients.forEach(
      (coefficient, unitId) => {
        const unit =
          model.unitById.get(unitId);

        if (!unit) return;

        unit.x +=
          coefficient *
          correction;
      }
    );
  });

  return maxError;
}


function projectAutoRelationshipLayerCollisions(
  layers
) {
  const {
    SIBLING:SIBLING_GAP
  } = getGaps();

  let maxOverlap = 0;

  layers.forEach(layer => {
    if (!layer || layer.length < 2) {
      return;
    }

    for (
      let index = 1;
      index < layer.length;
      index += 1
    ) {
      const left =
        layer[index - 1];

      const right =
        layer[index];

      const required =
        left.x +
        left.width +
        SIBLING_GAP;

      const overlap =
        required -
        right.x;

      if (overlap <= 0.0001) {
        continue;
      }

      maxOverlap =
        Math.max(
          maxOverlap,
          overlap
        );

      // 同代 collision 也是正式幾何約束。
      // 左右各退一半，下一個 relationship projection 再把關係軸精準拉回。
      const half =
        overlap / 2;

      left.x -= half;
      right.x += half;
    }
  });

  return maxOverlap;
}

function measureAutoRelationshipConstraintError(
  model,
  constraints
) {
  let maxError = 0;

  constraints.forEach(constraint => {
    let current = 0;

    constraint.coefficients.forEach(
      (coefficient, unitId) => {
        const unit =
          model.unitById.get(unitId);

        if (!unit) return;

        current +=
          coefficient *
          unit.x;
      }
    );

    maxError =
      Math.max(
        maxError,
        Math.abs(
          constraint.b -
          current
        )
      );
  });

  return maxError;
}

function solveAutoRelationshipGeometry(
  layers,
  model,
  connectorGroups
) {
  const constraints =
    buildAutoVerticalRelationshipConstraints(
      model,
      connectorGroups
    );

  if (!constraints.length) {
    return;
  }

  // ========【Auto Relationship Geometry Solver】 設定 - 單／多子女共用同一套幾何權威 ========
  // Equality：
  // - 單子女：parent source = child relationship anchor
  // - 多子女：parent source = sibling bus 外側 child branches 的中點
  //
  // Inequality：
  // - 同世代 Family Unit 保持最小安全距離
  //
  // 兩類約束交替投影；不再把整個家系鎖成剛體，也不再用 V-H-V 代替排列。
  const maxPasses =
    Math.max(
      96,
      constraints.length * 20 +
      model.units.length * 8
    );

  for (
    let pass = 0;
    pass < maxPasses;
    pass += 1
  ) {
    projectAutoVerticalRelationshipConstraints(
      model,
      constraints
    );

    const maxOverlap =
      projectAutoRelationshipLayerCollisions(
        layers
      );

    const maxRelationshipError =
      measureAutoRelationshipConstraintError(
        model,
        constraints
      );

    if (
      maxOverlap <= 0.01 &&
      maxRelationshipError <= 0.01
    ) {
      break;
    }
  }

  // 最後以 relationship geometry 收斂一次。
  // 若仍有極小浮點誤差，renderer 的 0.75px 容差只負責數值噪音，
  // 不再負責「看起來像吸附」。
  for (
    let settle = 0;
    settle < 8;
    settle += 1
  ) {
    const error =
      projectAutoVerticalRelationshipConstraints(
        model,
        constraints
      );

    if (error <= 0.0001) {
      break;
    }
  }
}

function solvePedigreeHorizontalLayout(layers, model, connectorGroups) {
  // ========【族譜幾何核心】 設定 - 在 Family Branch Ordering 內求解座標 ========
  // 硬約束：
  // 1. 同世代 family unit 不重疊。
  // 2. 配偶維持同一世代。
  //
  // 軟約束：
  // 3. 父母 union 儘量對準子女群中心。
  // 4. 子女群儘量以父母 union 為中心。
  //
  // 這一階段只調整既定 branch order 下的座標，不得重新排序 unit。
  // 單／多子女的 canonical relationship geometry
  // 仍由 solveAutoRelationshipGeometry() 作為最終 hard constraint。
  for (let iteration = 0; iteration < 10; iteration += 1) {
    alignPedigreeChildrenToParents(
      layers,
      model,
      connectorGroups
    );

    alignPedigreeParentsToChildren(
      layers,
      model,
      connectorGroups
    );
  }

  // 最後一次硬性 collision pass。
  // 後面不再執行任何會把 family unit 拉回去的步驟。
  resolvePedigreeLayerCollisions(layers);
}

function placeGenealogyUnitMembers(units) {
  const pos = new Map();

  units.forEach(unit => {
    let cursorX = unit.x;

    unit.members.forEach((member, index) => {
      pos.set(member.id, {
        id:member.id,
        x:cursorX,
        y:unit.y
      });

      cursorX += getNodeDimensions(member).W;

      if (index < unit.members.length - 1) {
        cursorX += unit.spouseGap;
      }
    });
  });

  let minX = Infinity;
  let minY = Infinity;

  pos.forEach(position => {
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
  });

  const shiftX =
    Number.isFinite(minX) && minX < 0
      ? -minX
      : 0;

  const shiftY =
    Number.isFinite(minY) && minY < 0
      ? -minY
      : 0;

  if (shiftX || shiftY) {
    pos.forEach(position => {
      position.x += shiftX;
      position.y += shiftY;
    });
  }

  return pos;
}

function computeAutoPositions(visibleIds) {
  const primarySimIds =
    getActiveLayoutPrimaryIds(
      visibleIds
    );

  const model =
    buildGenealogyLayoutModel(
      visibleIds
    );

  const ownership =
    buildFamilyBranchOwnership(
      model,
      primarySimIds
    );

  const layers =
    buildGenerationLayers(
      model.units
    );

  const connectorGroups =
    buildParentChildConnectorGroups(
      model.byId,
      visibleIds
    );

  // ========【Family Branch Ordering】 設定 - 先排家族，再排人物 ========
  // 主家族的遞迴 branch path 是排序權威：
  // A -> B branch / C branch 各自保持完整；
  // 外部 relationship attachment 只能留在 Primary Family block 外側。
  applyFamilyBranchOrdering(
    layers,
    model,
    ownership
  );

  setGenerationVerticalPositions(
    layers
  );

  assignInitialGenealogyHorizontalPositions(
    layers
  );

  // 幾何 solver 只能在既定 branch order 下調整座標；
  // 不再有 generation-global crossing minimization 可以把別家插回來。
  solvePedigreeHorizontalLayout(
    layers,
    model,
    connectorGroups
  );

  const spouseOrientationChanged =
    orientSpouseUnitsByLineage(
      model,
      connectorGroups,
      ownership
    );

  if (spouseOrientationChanged) {
    // 只改 Family Unit 內的人物左右方向，
    // branch ownership / generation order 保持不變。
    applyFamilyBranchOrdering(
      layers,
      model,
      ownership
    );

    assignInitialGenealogyHorizontalPositions(
      layers
    );

    solvePedigreeHorizontalLayout(
      layers,
      model,
      connectorGroups
    );
  }

  // 前面已確認的 canonical relationship geometry 保持最終權威。
  // Branch Ordering 只決定「誰在哪一側」，不改親子／配偶拓撲。
  solveAutoRelationshipGeometry(
    layers,
    model,
    connectorGroups
  );

  return placeGenealogyUnitMembers(
    model.units
  );
}

function computeLayout() {
  const { W: NODE_W, H: NODE_H } = getDims();
  const fam = currentFamily();
  const visibleIds = getVisibleIds(fam.id);
  const sims = [...visibleIds].map(id => genealogyData.sims[id]).filter(Boolean);
  const byId = new Map(sims.map(c => [c.id, c]));
  const manualPositions = getCurrentManualPositions(fam);
  const isFree = getCurrentFreeLayout(fam);
  if (isFree) {
    const autoPos = computeAutoPositions(visibleIds);
    const pos = new Map();

    sims.forEach(s => {
      const manual = manualPositions[s.id];
      const p =
        manual ||
        autoPos.get(s.id) ||
        {x:0,y:0};

      pos.set(s.id, {
        id:s.id,
        x:p.x,
        y:p.y
      });
    });

    // 自由排列仍遵守族譜語意：
    // 配偶 / 前任只允許同世代的水平直線，不因手動拖曳產生 H-V-H。
    const partnerAdjacency = new Map();

    visibleIds.forEach(id => {
      partnerAdjacency.set(id, new Set());
    });

    visibleIds.forEach(id => {
      const sim = byId.get(id);
      if (!sim) return;

      [
        ...(sim.spouseIds || []),
        ...(sim.exSpouseIds || [])
      ].forEach(partnerId => {
        if (!visibleIds.has(partnerId)) return;
        partnerAdjacency.get(id)?.add(partnerId);
        partnerAdjacency.get(partnerId)?.add(id);
      });
    });

    const visitedPartners = new Set();

    visibleIds.forEach(startId => {
      if (visitedPartners.has(startId)) return;

      const queue = [startId];
      const component = [];

      while (queue.length) {
        const id = queue.shift();
        if (visitedPartners.has(id)) continue;

        visitedPartners.add(id);
        component.push(id);

        (partnerAdjacency.get(id) || [])
          .forEach(nextId => {
            if (!visitedPartners.has(nextId)) {
              queue.push(nextId);
            }
          });
      }

      if (component.length < 2) return;

      const yValues = component
        .map(id => pos.get(id)?.y)
        .filter(Number.isFinite);

      if (!yValues.length) return;

      const sharedY =
        yValues.reduce((sum, value) => sum + value, 0) /
        yValues.length;

      component.forEach(id => {
        const p = pos.get(id);
        if (p) p.y = sharedY;
      });
    });

    let maxX = 0;
    let maxY = 0;

    pos.forEach((p, id) => {
      const dims = getNodeDimensionsById(id);
      maxX = Math.max(maxX, p.x + dims.W);
      maxY = Math.max(maxY, p.y + dims.H);
    });

    return {
      pos,
      width:maxX,
      height:maxY,
      byId,
      visibleIds
    };
  }
  const pos = computeAutoPositions(visibleIds);
  let maxX=0, maxY=0;
  pos.forEach((p, id) => {
    const dims = getNodeDimensionsById(id);
    maxX = Math.max(maxX, p.x + dims.W);
    maxY = Math.max(maxY, p.y + dims.H);
  });
  return {pos, width:maxX, height:maxY, byId, visibleIds};
}



// ========【Scene Incremental Pipeline】 設定 - Layout / Nodes / Edges 由 Scene 單獨失效 ========
const RENDER_DIRTY = Object.freeze({ layout:1, nodes:2, edges:4 });
let layoutCache = null;
let renderDirtyMask = 0;
let renderInvalidationRaf = 0;
function renderMaskFromLayers(layers = {}) {
  let mask = 0;
  if (layers.layout) mask |= RENDER_DIRTY.layout;
  if (layers.nodes) mask |= RENDER_DIRTY.nodes;
  if (layers.edges) mask |= RENDER_DIRTY.edges;
  return mask;
}
function syncStageGeometryFromLayout() {
  if (!layoutCache) return;
  const {width, height} = layoutCache;
  const sW = Math.max(width + PAD * 2, 400);
  const sH = Math.max(height + PAD * 2, 300);
  stage.style.width = sW + 'px';
  stage.style.height = sH + 'px';
  svg.setAttribute('width', sW);
  svg.setAttribute('height', sH);
  svg.setAttribute('viewBox', '0 0 ' + sW + ' ' + sH);
  labelsSvg.setAttribute('width', sW);
  labelsSvg.setAttribute('height', sH);
  labelsSvg.setAttribute('viewBox', '0 0 ' + sW + ' ' + sH);
}
function flushRenderInvalidation() {
  syncState();
  if (renderInvalidationRaf) { cancelAnimationFrame(renderInvalidationRaf); renderInvalidationRaf = 0; }
  let mask = renderDirtyMask;
  renderDirtyMask = 0;
  if (!mask) return;
  if (mask & RENDER_DIRTY.layout) {
    layoutCache = computeLayout();
    syncStageGeometryFromLayout();
    mask |= RENDER_DIRTY.nodes | RENDER_DIRTY.edges;
  }
  if (mask & RENDER_DIRTY.edges) drawEdges();
  if (mask & RENDER_DIRTY.nodes) drawNodes();
}
function invalidateScene(layers, { immediate = false } = {}) {
  renderDirtyMask |= renderMaskFromLayers(layers);
  if (!renderDirtyMask) return;
  if (immediate) { flushRenderInvalidation(); return; }
  if (renderInvalidationRaf) return;
  renderInvalidationRaf = requestAnimationFrame(() => { renderInvalidationRaf = 0; flushRenderInvalidation(); });
}
function scheduleEdgeRedraw() { invalidateScene({ edges:true }); }
function renderAll() { invalidateScene({ layout:true, nodes:true, edges:true }, { immediate:true }); }
function getLayoutSnapshot() { return layoutCache; }
function getNodePosition(id) { const pos = layoutCache?.pos?.get(String(id)); return pos ? { ...pos } : null; }
function updateLiveNodePosition(id, position) {
  if (!layoutCache?.pos || !position) return false;
  const key = String(id);
  if (!layoutCache.pos.has(key)) return false;
  layoutCache.pos.set(key, { id:key, x:Number(position.x)||0, y:Number(position.y)||0 });
  return true;
}

function buildParentChildConnectorGroups(byId, visibleIds) {
  const groups = new Map();

  visibleIds.forEach(childId => {
    const child = byId.get(childId);
    if (!child) return;

    genealogyParentRelationGroups(child, byId)
      .forEach(relationGroup => {
        const parentIds =
          relationGroup.parentIds
            .filter(parentId => byId.has(parentId))
            .sort();

        if (!parentIds.length) return;

        const key = parentIds.join('|');

        if (!groups.has(key)) {
          groups.set(key, {
            key,
            parentIds,
            children:[],
            childKinds:new Map()
          });
        }

        const group = groups.get(key);

        if (!group.children.includes(childId)) {
          group.children.push(childId);
        }

        const currentKind = group.childKinds.get(childId);
        if (!currentKind || relationGroup.kind === 'adoptive') {
          group.childKinds.set(childId, relationGroup.kind);
        }
      });
  });

  return [...groups.values()];
}

function parentConnectorSource(group, pos, byId, paths) {
  const parentPositions = group.parentIds
    .map(parentId => ({
      id:parentId,
      sim:byId.get(parentId),
      pos:pos.get(parentId)
    }))
    .filter(item => item.sim && item.pos);

  if (!parentPositions.length) return null;

  if (parentPositions.length === 1) {
    return cardVerticalAnchor(
      parentPositions[0].pos,
      'bottom'
    );
  }

  const [first, second] = parentPositions;
  const firstSim = first.sim;
  const secondId = second.id;

  const isPartnerPair =
    (firstSim.spouseIds || []).includes(secondId) ||
    (firstSim.exSpouseIds || []).includes(secondId);

  if (isPartnerPair) {
    return pairJoinPoint(
      first.pos,
      second.pos
    );
  }

  // 兩位共同父母不是配偶 / 前任時，不使用懸空的「假配偶中點」。
  // 直接從兩張父母卡片向下匯流，再由匯流點接往子女。
  const firstAnchor =
    cardVerticalAnchor(first.pos, 'bottom');
  const secondAnchor =
    cardVerticalAnchor(second.pos, 'bottom');

  const bridgeY =
    Math.max(firstAnchor.y, secondAnchor.y) +
    18;

  paths.push(
    '<path class="edge edge-parent" d="' +
    'M' + firstAnchor.x + ' ' + firstAnchor.y +
    ' V' + bridgeY +
    ' H' + secondAnchor.x +
    ' V' + secondAnchor.y +
    '"/>'
  );

  return {
    x:(firstAnchor.x + secondAnchor.x) / 2,
    y:bridgeY
  };
}

function parentConnectorChildAnchor(childPosition, source) {
  const childIsBelow =
    cardCenterY(childPosition) >= source.y;

  return cardVerticalAnchor(
    childPosition,
    childIsBelow
      ? 'top'
      : 'bottom'
  );
}

function parentConnectorBranchY(source, childAnchors) {
  if (!childAnchors.length) return source.y;

  const below = childAnchors
    .filter(anchor => anchor.y >= source.y);

  const above = childAnchors
    .filter(anchor => anchor.y < source.y);

  if (below.length >= above.length) {
    const nearestChildY = Math.min(
      ...below.map(anchor => anchor.y)
    );

    return source.y +
      (nearestChildY - source.y) / 2;
  }

  const nearestChildY = Math.max(
    ...above.map(anchor => anchor.y)
  );

  return source.y +
    (nearestChildY - source.y) / 2;
}

function drawParentConnectorGroup(group, pos, byId, paths, labels) {
  const source =
    parentConnectorSource(
      group,
      pos,
      byId,
      paths
    );

  if (!source) return;

  const children = group.children
    .map(childId => ({
      id:childId,
      sim:byId.get(childId),
      pos:pos.get(childId),
      kind:
        group.childKinds?.get(childId) ||
        'parent-child'
    }))
    .filter(item => item.sim && item.pos)
    .map(item => ({
      ...item,
      anchor:
        parentConnectorChildAnchor(
          item.pos,
          source
        )
    }));

  if (!children.length) return;

  const edgeClassForKind = kind =>
    'edge edge-parent' +
    (
      kind === 'adoptive'
        ? ' edge-adopt'
        : ''
    );

  const edgeClassForChild = child =>
    edgeClassForKind(child.kind);

  if (children.length === 1) {
    const child = children[0];
    const edgeClass =
      edgeClassForChild(child);

    const x1 = source.x;
    const y1 = source.y;
    const x2 = child.anchor.x;
    const y2 = child.anchor.y;

    // ========【單一子女路徑】 設定 - renderer 只忠實反映真實 anchor，不自行吸附 ========
    const verticallyAligned =
      Math.abs(x1 - x2) <= 0.75;

    let labelX =
      verticallyAligned
        ? x1
        : (x1 + x2) / 2;

    let labelY =
      y1 + (y2 - y1) / 2;

    if (verticallyAligned) {
      paths.push(
        '<path class="' + edgeClass + '" d="' +
        'M' + x1 + ' ' + y1 +
        ' V' + y2 +
        '"/>'
      );
    } else {
      const branchY =
        y1 + (y2 - y1) / 2;

      paths.push(
        '<path class="' + edgeClass + '" d="' +
        'M' + x1 + ' ' + y1 +
        ' V' + branchY +
        ' H' + x2 +
        ' V' + y2 +
        '"/>'
      );

      labelY = branchY;
    }

    if (showRelLabels && !relationshipPerspectiveSimId) {
      const key =
        'parent:' + child.id;

      const info =
        getRelInfoByKey(
          key,
          child.kind
        );

      if (info) {
        labels.push(
          makeLabelSVG(
            labelX,
            labelY,
            info.icon,
            info.text,
            key
          )
        );
      }
    }

    return;
  }

  const branchY =
    parentConnectorBranchY(
      source,
      children.map(
        child => child.anchor
      )
    );

  const allAdoptive =
    children.every(
      child =>
        child.kind === 'adoptive'
    );

  // 多子女 canonical topology：
  // 垂直 parent trunk + 水平 sibling bus + 每名子女純垂直 child branch。
  // branch X 直接來自該子女真實 relationship anchor；renderer 不自行修正位置。
  paths.push(
    '<path class="' +
    edgeClassForKind(
      allAdoptive
        ? 'adoptive'
        : 'parent-child'
    ) +
    '" d="' +
    'M' + source.x + ' ' + source.y +
    ' V' + branchY +
    '"/>'
  );

  // ========【Sibling Bus 分段】 設定 - 進入純領養分支後立刻使用領養線型 ========
  const busPoints =
    [...new Set([
      source.x,
      ...children.map(
        child => child.anchor.x
      )
    ])]
      .sort((a, b) => a - b);

  for (
    let index = 0;
    index < busPoints.length - 1;
    index += 1
  ) {
    const left =
      busPoints[index];

    const right =
      busPoints[index + 1];

    if (Math.abs(right - left) < 0.75) {
      continue;
    }

    const mid =
      (left + right) / 2;

    const crossingChildren =
      children.filter(child => {
        const childX =
          child.anchor.x;

        const minX =
          Math.min(
            source.x,
            childX
          );

        const maxX =
          Math.max(
            source.x,
            childX
          );

        return (
          mid > minX &&
          mid < maxX
        );
      });

    if (!crossingChildren.length) {
      continue;
    }

    const segmentKind =
      crossingChildren.every(
        child =>
          child.kind === 'adoptive'
      )
        ? 'adoptive'
        : 'parent-child';

    paths.push(
      '<path class="' +
      edgeClassForKind(segmentKind) +
      '" d="' +
      'M' + left + ' ' + branchY +
      ' H' + right +
      '"/>'
    );
  }

  children.forEach(child => {
    paths.push(
      '<path class="' +
      edgeClassForChild(child) +
      '" d="' +
      'M' + child.anchor.x + ' ' + branchY +
      ' V' + child.anchor.y +
      '"/>'
    );
  });

  if (showRelLabels && !relationshipPerspectiveSimId) {
    children.forEach(child => {
      const key =
        'parent:' + child.id;

      const info =
        getRelInfoByKey(
          key,
          child.kind
        );

      if (!info) return;

      labels.push(
        makeLabelSVG(
          child.anchor.x,
          branchY +
            (
              child.anchor.y -
              branchY
            ) / 2,
          info.icon,
          info.text,
          key
        )
      );
    });
  }
}

function drawEdges() {
  if (!layoutCache) return;

  const {
    pos,
    byId,
    visibleIds
  } = layoutCache;

  const paths = [];
  const labels = [];
  const markerDefinitions = [];
  const arrowMarkerByColor =
    new Map();

  const bidirectionalMarkerAttributes =
    setting => {
      if (!setting.bidirectional) {
        return '';
      }

      const color =
        relationshipResolvedColor(
          setting,
          'other'
        );

      let markerId =
        arrowMarkerByColor.get(
          color
        );

      if (!markerId) {
        markerId =
          'rel-other-arrow-' +
          arrowMarkerByColor.size;

        arrowMarkerByColor.set(
          color,
          markerId
        );

        markerDefinitions.push(
          '<marker id="' +
          markerId +
          '" viewBox="0 0 10 10" ' +
          'refX="8.4" refY="5" ' +
          'markerWidth="5.5" markerHeight="5.5" ' +
          'orient="auto-start-reverse">' +
            '<path d="M1 1 L9 5 L1 9 Z" fill="' +
            color +
            '" fill-opacity=".9"/>' +
          '</marker>'
        );
      }

      return (
        ' marker-start="url(#' +
        markerId +
        ')" marker-end="url(#' +
        markerId +
        ')"'
      );
    };

  // 親子關係維持既有 canonical genealogy topology。
  buildParentChildConnectorGroups(
    byId,
    visibleIds
  ).forEach(group => {
    drawParentConnectorGroup(
      group,
      pos,
      byId,
      paths,
      labels
    );
  });

  const drawnPair = new Set();

  visibleIds.forEach(id => {
    const sim = byId.get(id);
    if (!sim) return;

    (sim.spouseIds || [])
      .forEach(spouseId => {
        if (
          !visibleIds.has(spouseId)
        ) {
          return;
        }

        const pairK =
          pairKey(id, spouseId);

        if (
          drawnPair.has(pairK)
        ) {
          return;
        }

        drawnPair.add(pairK);

        const a =
          pos.get(id);

        const b =
          pos.get(spouseId);

        if (!a || !b) return;

        paths.push(
          '<path class="edge edge-spouse" d="' +
          pairPath(a, b) +
          '"/>'
        );

        if (!showRelLabels || relationshipPerspectiveSimId) return;

        const key =
          'spouse:' + pairK;

        const info =
          getRelInfoByKey(
            key,
            'spouse'
          );

        if (!info) return;

        const join =
          pairJoinPoint(a, b);

        labels.push(
          makeLabelSVG(
            join.x,
            join.y,
            info.icon,
            info.text,
            key
          )
        );
      });
  });

  const drawnEx = new Set();
  const exSetting =
    relationshipLineSetting(
      'exspouse'
    );

  visibleIds.forEach(id => {
    const sim = byId.get(id);
    if (!sim) return;

    (sim.exSpouseIds || [])
      .forEach(spouseId => {
        if (
          !visibleIds.has(spouseId)
        ) {
          return;
        }

        const pairK =
          pairKey(id, spouseId);

        if (
          drawnEx.has(pairK)
        ) {
          return;
        }

        drawnEx.add(pairK);

        const a =
          pos.get(id);

        const b =
          pos.get(spouseId);

        if (!a || !b) return;

        const geometry =
          relationshipPairRenderGeometry(
            a,
            b,
            exSetting
          );

        paths.push(
          '<path class="edge edge-exspouse" d="' +
          geometry.d +
          '"/>'
        );

        if (!showRelLabels || relationshipPerspectiveSimId) return;

        const key =
          'exspouse:' + pairK;

        const info =
          getRelInfoByKey(
            key,
            'exspouse'
          );

        if (!info) return;

        labels.push(
          makeLabelSVG(
            geometry.labelX,
            geometry.labelY,
            info.icon,
            info.text,
            key
          )
        );
      });
  });

  // ========【其他關係】 設定 - 每個具體關係類型擁有自己的外觀 ========
  (genealogyData.links || [])
    .forEach(link => {
      if (
        !visibleIds.has(link.from) ||
        !visibleIds.has(link.to)
      ) {
        return;
      }

      const a =
        pos.get(link.from);

      const b =
        pos.get(link.to);

      if (!a || !b) return;

      const type =
        relationshipOtherType(
          link
        );

      const setting =
        getOtherRelationshipLineSetting(
          type
        );

      const geometry =
        relationshipOtherRenderGeometry(
          a,
          b,
          setting
        );

      paths.push(
        '<path class="edge edge-other" d="' +
        geometry.d +
        '" style="' +
        relationshipInlineSvgStyle(
          setting,
          'other'
        ) +
        '"' +
        bidirectionalMarkerAttributes(
          setting
        ) +
        '/>'
      );

      if (!showRelLabels || relationshipPerspectiveSimId) return;

      const key =
        'link:' + link.id;

      const info =
        getRelInfoByKey(
          key,
          isSiblingLink(link)
            ? 'sibling'
            : 'social',
          isSiblingLink(link)
            ? null
            : type
        );

      if (!info) return;

      labels.push(
        makeLabelSVG(
          geometry.labelX,
          geometry.labelY,
          info.icon,
          info.text,
          key
        )
      );
    });

  svg.innerHTML =
    (
      markerDefinitions.length
        ? '<defs>' +
          markerDefinitions.join('') +
          '</defs>'
        : ''
    ) +
    paths.join('');

  if (
    relationshipPerspectiveSimId
  ) {
    drawPerspectiveKinshipLabels(
      labels,
      pos,
      visibleIds
    );
  }

  labelsSvg.innerHTML =
    labels.join('');
}

// ========【族譜連線】 設定 - 橫向關係接頭像側邊；直向親子線保留完整資訊空間 ========
function getCardAvatarGeometry() {
  const { W:NODE_W } = getDims();

  if (viewMode === 'edit') {
    const settings = getCardEditSettings();
    const hasBody = cardSettingsHasBody(settings);

    return hasBody
      ? { size:64, left:12, top:14 }
      : {
          size:64,
          left:(NODE_W - 64) / 2,
          top:14
        };
  }

  return {
    size:VIEW_CARD_LAYOUT.avatarSize,
    left:
      (NODE_W - VIEW_CARD_LAYOUT.avatarSize) /
      2,
    top:12
  };
}

function cardAvatarRect(card) {
  const geo = getCardAvatarGeometry();
  const left = card.x + PAD + geo.left;
  const top = card.y + PAD + geo.top;

  return {
    left,
    top,
    right:left + geo.size,
    bottom:top + geo.size,
    centerX:left + geo.size / 2,
    centerY:top + geo.size / 2
  };
}

function cardOuterRect(card) {
  const dims =
    card && card.id
      ? getNodeDimensionsById(card.id)
      : getDims();

  const left = card.x + PAD;
  const top = card.y + PAD;

  return {
    left,
    top,
    right:left + dims.W,
    bottom:top + dims.H,
    centerX:left + dims.W / 2,
    centerY:top + dims.H / 2
  };
}

function usesMinimalViewAnchors() {
  return (
    viewMode === 'view' &&
    getCardViewSettings().appearance === 'minimal'
  );
}

function cardHorizontalConnectionRect(card) {
  return usesMinimalViewAnchors()
    ? cardAvatarRect(card)
    : cardOuterRect(card);
}

function cardVerticalConnectionRect(card) {
  if (!usesMinimalViewAnchors()) {
    return cardOuterRect(card);
  }

  const avatar = cardAvatarRect(card);
  const outer = cardOuterRect(card);

  return {
    left:avatar.left,
    right:avatar.right,
    top:avatar.top,
    bottom:outer.bottom,
    centerX:avatar.centerX,
    centerY:
      (avatar.top + outer.bottom) /
      2
  };
}

// ========【關係線錨點幾何】 設定 - 排列、拖曳、畫線共用同一個頭像／卡片中心 ========
function relationshipVerticalAnchorOffsetX(id) {
  return cardVerticalConnectionRect({
    id,
    x:0,
    y:0
  }).centerX;
}

function relationshipVerticalAnchorLocalX(id) {
  return (
    relationshipVerticalAnchorOffsetX(id) -
    PAD
  );
}


function cardVerticalAnchor(card, side) {
  const rect =
    cardVerticalConnectionRect(card);

  return {
    x:rect.centerX,
    y:
      side === 'top'
        ? rect.top
        : rect.bottom
  };
}

function cardCenterY(card) {
  return cardOuterRect(card).centerY;
}

function avatarBoundaryAnchor(card, targetCard) {
  const sourceOuter = cardOuterRect(card);
  const targetOuter = cardOuterRect(targetCard);
  const dx =
    targetOuter.centerX -
    sourceOuter.centerX;
  const dy =
    targetOuter.centerY -
    sourceOuter.centerY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const rect =
      cardHorizontalConnectionRect(card);

    return {
      x:dx >= 0 ? rect.right : rect.left,
      y:rect.centerY
    };
  }

  const rect =
    cardVerticalConnectionRect(card);

  return {
    x:rect.centerX,
    y:dy >= 0 ? rect.bottom : rect.top
  };
}

// ========【配偶關係連線】 設定 - 配偶固定為同世代橫向關係，不受卡片高度影響 ========
function getPairConnectionGeometry(a, b) {
  const aOuter = cardOuterRect(a);
  const bOuter = cardOuterRect(b);
  const aHorizontalRect = cardHorizontalConnectionRect(a);
  const bHorizontalRect = cardHorizontalConnectionRect(b);
  const aAvatar = cardAvatarRect(a);
  const bAvatar = cardAvatarRect(b);

  const dx =
    bOuter.centerX -
    aOuter.centerX;

  // 配偶 / 前任配偶在族譜語意上永遠屬於同一世代的橫向關係。
  // 不再用兩張卡片 centerY 的差距判斷方向，避免檢視卡內容高度不同時被誤判成直向關係。
  const aX =
    dx >= 0
      ? aHorizontalRect.right
      : aHorizontalRect.left;

  const bX =
    dx >= 0
      ? bHorizontalRect.left
      : bHorizontalRect.right;

  // 橫向配偶線使用頭像中心高度作為穩定基準。
  // 完整 / 半透明卡仍接在卡片外側，極簡卡則接頭像外側，但都不受文字內容高度影響。
  const aY = aAvatar.centerY;
  const bY = bAvatar.centerY;

  return {
    horizontal:true,
    dx,
    dy:bY - aY,
    aX,
    aY,
    bX,
    bY
  };
}

function pairJoinPoint(a, b) {
  const {
    aX,
    aY,
    bX,
    bY
  } = getPairConnectionGeometry(a, b);

  return {
    x:(aX + bX) / 2,
    y:(aY + bY) / 2
  };
}

function pairPath(a, b) {
  const {
    aX,
    aY,
    bX,
    bY
  } = getPairConnectionGeometry(a, b);

  // ========【族譜伴侶線】 設定 - 配偶 / 前任永遠只畫水平直線 ========
  // 世代排版與自由排列約束會先把兩端放在同一 row，
  // 畫線器不再用 H-V-H 折線修補高度差。
  const y =
    Math.abs(aY - bY) < 2
      ? (aY + bY) / 2
      : aY;

  return `M${aX} ${y} H${bX}`;
}



function commonNodeClasses(c, opts) {
  opts = opts || {};
  return [
    'node',
    opts.viewMode ? 'view' : '',
    genderClass(c),
    statusClass(c),
    opts.isInlaw ? 'inlaw' : ''
  ].filter(Boolean).join(' ');
}

function nodeRenderSignature(
  sim,
  {
    isView,
    isInlaw,
    cardSettings,
    appearanceClass
  }
) {
  if (
    !genealogyRuntime?.signature
  ) {
    return '';
  }

  return genealogyRuntime.signature({
    lang:
      document.documentElement.lang ||
      'zh-Hant',

    mode:
      isView
        ? 'view'
        : 'edit',

    isInlaw:
      !!isInlaw,

    appearanceClass:
      appearanceClass || '',

    cardSettings,

    sim:{
      id:sim.id,
      name:sim.name,
      gender:sim.gender,
      lifeStage:sim.lifeStage,
      age:sim.age,
      birthdayYear:sim.birthdayYear,
      birthdayMonth:sim.birthdayMonth,
      birthdayDay:sim.birthdayDay,
      status:sim.status,
      race:sim.race,
      career:sim.career,
      residence:sim.residence,
      aspiration:sim.aspiration,
      causeOfDeath:sim.causeOfDeath,
      avatar:sim.avatar,
      avatarFrame:sim.avatarFrame,
      traits:sim.traits,
      pets:sim.pets,
      galleryCount:
        (sim.gallery || []).length
    }
  });
}

function drawNodes() {
  const fam = currentTreeFamily();
  const memberSet = new Set(fam.memberIds);
  const {pos, byId, visibleIds} = layoutCache;
  const isView = viewMode === 'view';
  const cardSettings = isView ? getCardViewSettings() : getCardEditSettings();
  const appearanceClass = isView ? cardViewAppearanceClass() : '';

  const html = [...visibleIds].map(id => {
    const c = byId.get(id);
    const p = pos.get(id);
    if (!c || !p) return '';

    const {
      W:NODE_W,
      H:NODE_H
    } = getNodeDimensions(c);

    const isInlaw = !memberSet.has(id);

    const dName = displayDataText(c.name, c);
    const dCareer = displayDataText(c.career, c);
    const dResidence = displayDataText(c.residence, c);
    const dAspiration = displayDataText(c.aspiration, c);
    const dCause = displayDataText(c.causeOfDeath, c);
    const dTraits = (c.traits||[]).map(value => displayDataText(value, c));
    const cls = commonNodeClasses(c, {viewMode:isView, isInlaw});
    const dStage = uiText(c.lifeStage);
    const displayName = cardSettings.name ? `${dName}${cardSettings.gender ? formatCardGender(c.gender) : ''}` : '';
    const genderBarHiddenClass = cardSettings.genderBar ? '' : ' card-gender-bar-hidden';

    const renderKey =
      nodeRenderSignature(
        c,
        {
          isView,
          isInlaw,
          cardSettings,
          appearanceClass
        }
      );

    if (isView) {
      const model =
        buildViewCardContentModel(
          c,
          cardSettings
        );

      const avatarOnlyClass =
        model.hasText
          ? ''
          : ' card-avatar-only';

      return `<div class="${cls} mode-view ${appearanceClass}${genderBarHiddenClass}${avatarOnlyClass}" data-id="${c.id}" data-render-key="${esc(renderKey)}" data-stage="${c.lifeStage}"
        style="left:${p.x+PAD}px;top:${p.y+PAD}px;width:${NODE_W}px;height:${NODE_H}px">
        <div class="n-view-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
        ${model.name ? `<div class="n-view-name" title="${esc(model.name)}">${esc(model.name)}</div>` : ''}
        ${model.primary.map(renderViewCardLine).join('')}
        ${model.details.map(renderViewCardLine).join('')}
      </div>`;
    }

    // 編輯模式有自己的顯示內容設定，不再跟檢視模式同步。
    const editRows = [];
    if (!cardSettings.name && cardSettings.gender) {
      editRows.push(`<div class="n-edit-meta">${esc(uiText(c.gender || '其他'))}</div>`);
    }

    const stageAge = [];
    if (cardSettings.lifeStage) stageAge.push(dStage);
    if (cardSettings.age && c.age != null && c.age !== '') stageAge.push(formatCardAge(c.age));
    if (stageAge.length) editRows.push(`<div class="n-edit-meta">${esc(stageAge.join(' · '))}</div>`);

    if (cardSettings.birthday && c.birthdayMonth && c.birthdayDay) {
      editRows.push(`<div class="n-edit-meta">${iconSvg('cake2')}<span>${esc(formatBirthdaySummary(c.birthdayMonth, c.birthdayDay, c.birthdayYear))}</span></div>`);
    }

    const statusRace = [];
    if (cardSettings.status) statusRace.push(uiText(c.status || '在世'));
    if (cardSettings.race && c.race && RACE_PRESETS[c.race]) statusRace.push(uiText(RACE_PRESETS[c.race].label));
    if (statusRace.length) editRows.push(`<div class="n-edit-meta">${esc(statusRace.join(' · '))}</div>`);

    if (cardSettings.career && c.career) editRows.push(`<div class="n-edit-meta n-edit-text" title="${esc(dCareer)}">${esc(dCareer)}</div>`);
    if (cardSettings.residence && c.residence) editRows.push(`<div class="n-residence" title="${esc(dResidence)}">${iconSvg('house')}${esc(dResidence)}</div>`);
    if (cardSettings.aspiration && c.aspiration) editRows.push(`<div class="n-aspiration" title="${esc(uiText('人生抱負'))}：${esc(dAspiration)}">${iconSvg('bullseye')}${esc(dAspiration)}</div>`);
    if (cardSettings.traits && dTraits.length) editRows.push(`<div class="n-tags">${buildTagsHTML(c.traits, c)}</div>`);
    if (cardSettings.pets && (c.pets||[]).length) editRows.push(`<div class="n-pets">${buildPetsChipsHTML(c.pets, c)}</div>`);
    if (cardSettings.gallery && (c.gallery||[]).length) editRows.push(`<div class="n-gallery-badge" title="${esc(uiText('人生照片'))} ${(c.gallery||[]).length}">${iconSvg('images')} ${(c.gallery||[]).length}</div>`);

    const configuredEditBody = cardSettingsHasBody(cardSettings);
    const editBody = configuredEditBody ? `<div class="n-body">
      ${cardSettings.name ? `<div class="n-name" title="${esc(displayName)}">${esc(displayName)}</div>` : ''}
      ${editRows.join('') || (cardSettings.name ? '' : `<div class="n-edit-meta">—</div>`)}
    </div>` : '';
    const avatarOnlyClass = configuredEditBody ? '' : ' card-avatar-only';

    return `<div class="${cls} mode-edit${genderBarHiddenClass}${avatarOnlyClass}" data-id="${c.id}" data-render-key="${esc(renderKey)}" data-stage="${c.lifeStage}"
      style="left:${p.x+PAD}px;top:${p.y+PAD}px;width:${NODE_W}px;height:${NODE_H}px">
      <div class="n-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
      ${editBody}
    </div>`;
  }).join('');

  const nodeHtml =
    html ||
    `<div class="empty">${esc(uiText('目前家族還沒有成員，使用「成員 ＋」新增或加入人物'))}</div>`;

  if (
    html &&
    genealogyRuntime?.patchKeyedNodes
  ) {
    genealogyRuntime
      .patchKeyedNodes(
        nodes,
        html
      );
  } else {
    nodes.innerHTML =
      nodeHtml;
  }

  syncNodeSelectionClasses();
}



function getVisibleTreeContentBounds() {
  if (
    !layoutCache ||
    !layoutCache.pos ||
    !layoutCache.pos.size
  ) {
    return null;
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  layoutCache.pos.forEach((position, id) => {
    const dims =
      getNodeDimensionsById(id);

    const x =
      position.x + PAD;

    const y =
      position.y + PAD;

    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x + dims.W);
    bottom = Math.max(bottom, y + dims.H);
  });

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(right) ||
    !Number.isFinite(bottom)
  ) {
    return null;
  }

  return {
    left,
    top,
    right,
    bottom,
    width:Math.max(1, right - left),
    height:Math.max(1, bottom - top),
    centerX:(left + right) / 2,
    centerY:(top + bottom) / 2
  };
}

function getSpouseRowSnap(id, rawY) {
  if (
    !layoutCache ||
    !layoutCache.byId ||
    !layoutCache.visibleIds ||
    !layoutCache.pos
  ) {
    return null;
  }

  const sim =
    layoutCache.byId.get(id);

  if (!sim) return null;

  const avatarGeometry =
    getCardAvatarGeometry();

  const draggedAvatarOffset =
    avatarGeometry.top +
    avatarGeometry.size / 2;

  const threshold =
    (GUIDE_SNAP_PX * 1.5) /
    Math.max(scale, 0.001);

  const candidates = [];
  const seen = new Set();

  (sim.spouseIds || []).forEach(partnerId => {
    if (seen.has(partnerId)) return;
    seen.add(partnerId);
    candidates.push({
      id:partnerId,
      priority:0
    });
  });

  (sim.exSpouseIds || []).forEach(partnerId => {
    if (seen.has(partnerId)) return;
    seen.add(partnerId);
    candidates.push({
      id:partnerId,
      priority:1
    });
  });

  let best = null;

  candidates.forEach(candidate => {
    if (
      !layoutCache.visibleIds.has(candidate.id)
    ) {
      return;
    }

    const partnerPosition =
      layoutCache.pos.get(candidate.id);

    if (!partnerPosition) return;

    const partnerAvatarCenter =
      cardAvatarRect(partnerPosition).centerY;

    const targetY =
      partnerAvatarCenter -
      PAD -
      draggedAvatarOffset;

    const distance =
      Math.abs(targetY - rawY);

    if (distance > threshold) return;

    if (
      !best ||
      distance < best.distance - 0.001 ||
      (
        Math.abs(distance - best.distance) <= 0.001 &&
        candidate.priority < best.priority
      )
    ) {
      best = {
        value:targetY,
        distance,
        priority:candidate.priority,
        relation:'spouse-row'
      };
    }
  });

  return best;
}

function getParentConnectorStraightSnap(id, rawX) {
  if (
    !layoutCache ||
    !layoutCache.byId ||
    !layoutCache.visibleIds ||
    !layoutCache.pos ||
    !layoutCache.byId.has(id)
  ) {
    return null;
  }

  const threshold =
    RELATIONSHIP_VERTICAL_SNAP_PX /
    Math.max(scale, 0.001);

  let best = null;

  buildParentChildConnectorGroups(
    layoutCache.byId,
    layoutCache.visibleIds
  ).forEach(group => {
    // 多子女本來就各自擁有垂直 child branch；
    // 只有單一子女才存在「V-H-V 是否收斂成 V」這個關係軸問題。
    if (
      group.children.length !== 1 ||
      group.children[0] !== id
    ) {
      return;
    }

    const source =
      parentConnectorSource(
        group,
        layoutCache.pos,
        layoutCache.byId,
        []
      );

    if (!source) return;

    // source.x 與 relationshipVerticalAnchorOffsetX()
    // 都使用 renderer 的實際座標系，因此吸附後頭像／卡片中心必定落在線上。
    const targetX =
      source.x -
      relationshipVerticalAnchorOffsetX(id);

    const distance =
      Math.abs(
        targetX -
        rawX
      );

    if (
      distance <= threshold &&
      (
        !best ||
        distance < best.distance
      )
    ) {
      best = {
        value:targetX,
        distance,
        relation:'parent-vertical-axis'
      };
    }
  });

  return best;
}

function getRelationshipPositionSnap(id, rawX, rawY) {
  const parentConnector =
    getParentConnectorStraightSnap(
      id,
      rawX
    );

  const spouseRow =
    getSpouseRowSnap(
      id,
      rawY
    );

  return {
    x:
      parentConnector
        ? parentConnector.value
        : null,
    y:
      spouseRow
        ? spouseRow.value
        : null
  };
}

function buildDragPerformanceGeometry() {
  if (!layoutCache?.pos) {
    return [];
  }

  const geometry = [];

  layoutCache.pos.forEach(
    (position, id) => {
      const dimensions =
        getNodeDimensionsById(id);

      geometry.push({
        id:String(id),
        x:position.x,
        y:position.y,
        width:dimensions.W,
        height:dimensions.H
      });
    }
  );

  return geometry;
}

function buildSingleDragRelationshipTargets(
  id
) {
  const targets = {
    x:[],
    y:[]
  };

  if (
    !layoutCache?.byId ||
    !layoutCache?.visibleIds ||
    !layoutCache?.pos
  ) {
    return targets;
  }

  buildParentChildConnectorGroups(
    layoutCache.byId,
    layoutCache.visibleIds
  ).forEach(group => {
    if (
      group.children.length !== 1 ||
      group.children[0] !== id
    ) {
      return;
    }

    const source =
      parentConnectorSource(
        group,
        layoutCache.pos,
        layoutCache.byId,
        []
      );

    if (!source) return;

    targets.x.push({
      value:
        source.x -
        relationshipVerticalAnchorOffsetX(
          id
        ),
      priority:0
    });
  });

  const sim =
    layoutCache.byId.get(id);

  if (!sim) {
    return targets;
  }

  const avatarGeometry =
    getCardAvatarGeometry();

  const draggedAvatarOffset =
    avatarGeometry.top +
    avatarGeometry.size / 2;

  const seen =
    new Set();

  [
    ...(sim.spouseIds || [])
      .map(partnerId => ({
        id:partnerId,
        priority:0
      })),

    ...(sim.exSpouseIds || [])
      .map(partnerId => ({
        id:partnerId,
        priority:1
      }))
  ].forEach(candidate => {
    const partnerId =
      String(candidate.id || '');

    if (
      !partnerId ||
      seen.has(partnerId) ||
      !layoutCache.visibleIds.has(
        partnerId
      )
    ) {
      return;
    }

    seen.add(partnerId);

    const partnerPosition =
      layoutCache.pos.get(
        partnerId
      );

    if (!partnerPosition) return;

    targets.y.push({
      value:
        cardAvatarRect(
          partnerPosition
        ).centerY -
        PAD -
        draggedAvatarOffset,

      priority:
        candidate.priority
    });
  });

  return targets;
}

function expandStageToFit() {
  const fam = currentFamily();
  if (!getCurrentFreeLayout(fam)) return;
  let maxX=0, maxY=0;

  layoutCache.pos.forEach((p, id) => {
    const dims = getNodeDimensionsById(id);
    maxX = Math.max(maxX, p.x + dims.W);
    maxY = Math.max(maxY, p.y + dims.H);
  });
  const sW = Math.max(maxX + PAD*2, 400);
  const sH = Math.max(maxY + PAD*2, 300);
  stage.style.width = sW + 'px';
  stage.style.height = sH + 'px';
  svg.setAttribute('width', sW);
  svg.setAttribute('height', sH);
  svg.setAttribute('viewBox', `0 0 ${sW} ${sH}`);
  labelsSvg.setAttribute('width', sW);
  labelsSvg.setAttribute('height', sH);
  labelsSvg.setAttribute('viewBox', `0 0 ${sW} ${sH}`);

  // 尺寸更新後再補一次連線重繪，避免快速拖曳後 SVG 還停留在舊幀。
  scheduleEdgeRedraw();
}
    function getGenerationLevels(simIds) {
      syncState();

      const visibleIds =
        new Set(
          (simIds || [])
            .map(String)
            .filter(id =>
              genealogyData?.sims?.[id]
            )
        );

      if (!visibleIds.size) {
        return new Map();
      }

      const model =
        buildGenealogyLayoutModel(
          visibleIds
        );

      const levels =
        new Map();

      model.units.forEach(unit => {
        unit.members.forEach(member => {
          levels.set(
            String(member.id),
            unit.generation
          );
        });
      });

      return levels;
    }

    function withState(fn) { return function () { syncState(); return fn.apply(null, arguments); }; }
    return Object.freeze({
      invalidate:invalidateScene, renderAll, scheduleEdgeRedraw, getLayoutSnapshot, getNodePosition, updateLiveNodePosition,
      getContentBounds:withState(getVisibleTreeContentBounds),
      getRelationshipPositionSnap:withState(getRelationshipPositionSnap),
      buildDragPerformanceGeometry:withState(buildDragPerformanceGeometry),
      buildSingleDragRelationshipTargets:withState(buildSingleDragRelationshipTargets),
      expandStageToFit:withState(expandStageToFit),
      getGenerationLevels,
      syncStageGeometry:withState(syncStageGeometryFromLayout)
    });
  }
  global.L1nGGenealogyScene = Object.freeze({ create });
})(window);