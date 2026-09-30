/* ========【L1nG Genealogy Scene】 設定 - Canvas Layout / Geometry / Renderer Authority ======== */
(function (global) {
  'use strict';
  function create({ runtime, dom, constants, state, helpers } = {}) {
    if (!dom || !state || !helpers) throw new Error('Genealogy Scene requires dom, state, and helpers.');
    const genealogyRuntime = runtime || null;
    const { stage, svg, labelsSvg, nodes } = dom;
    if (!stage || !svg || !labelsSvg || !nodes) throw new Error('Genealogy Scene requires Canvas DOM references.');
    const { PAD, RACE_PRESETS, GUIDE_SNAP_PX, RELATIONSHIP_VERTICAL_SNAP_PX } = constants;

    // ========【Scene 卡片幾何】 設定 - 卡片尺寸 / 間距 / 檢視版型由 Scene 唯一持有 ========
    const NODE_DIMS = Object.freeze({
      edit:Object.freeze({ W:220, H:148 }),
      view:Object.freeze({ W:136, H:118 })
    });

    const GAPS = Object.freeze({
      edit:Object.freeze({ SPOUSE:30, SIBLING:56, LEVEL:118 }),
      view:Object.freeze({ SPOUSE:22, SIBLING:40, LEVEL:90 })
    });

    const VIEW_CARD_LAYOUT = Object.freeze({
      width:176,
      avatarSize:76,
      horizontalPadding:20,
      topPadding:12,
      bottomPadding:10,
      gap:4,
      nameFontSize:11,
      metaFontSize:10,
      nameLineHeight:13.2,
      metaLineHeight:12.5
    });
    const { getData, getViewMode, getFamilyTreeViewMode, getShowRelLabels, getRelationshipPerspectiveId, getScale } = state;
    const {
      getCardViewSettings, getCardEditSettings, cardViewAppearanceClass, cardSettingsHasBody,
      buildViewCardContentModel, renderViewCardLine, formatCardGender, formatCardAge,
      getActiveFamilySelectorEntry, currentTreeFamily, currentFamily, uiText, displayDataText,
      displayRelationshipText, isSiblingLink, resolveKinshipLabel, relationshipPerspectiveSim,
      clampRelationshipCurveAmount, relationshipLineSetting, relationshipOtherType,
      getOtherRelationshipLineSetting, relationshipResolvedColor, relationshipInlineSvgStyle,
      relationshipLayoutPriority, genealogyParentIds, genealogyParentRelationGroups, getChildrenOf, getRelInfoByKey, measureText,
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

    // ========【Genealogy Scene Cache】 設定 - 拓撲、卡片幾何與拖曳關係索引分層快取 ========
    const GEOMETRY_BUCKET_SIZE = 256;
    let nodeDimensionCache = new Map();
    let genealogyTopologyCache = new Map();
    let relationshipEdgeRecords = new Map();
    let relationshipEdgesBySim = new Map();
    let relationshipEdgeElements = new Map();
    let relationshipLabelElements = new Map();
    let pendingRelationshipPreviewIds = new Set();

    function resetNodeDimensionCache() {
      nodeDimensionCache = new Map();
    }

    function visibleScopeCacheKey(visibleIds) {
      return [...(visibleIds || [])]
        .map(String)
        .sort()
        .join('\u001f');
    }

    function invalidateTopologyCache() {
      genealogyTopologyCache.clear();
      relationshipEdgeRecords.clear();
      relationshipEdgesBySim.clear();
      relationshipEdgeElements.clear();
      relationshipLabelElements.clear();
      pendingRelationshipPreviewIds.clear();
    }

    // ========【Canonical Generation】 設定 - 世代只由親子 / 領養關係決定 ========
    // 使用帶位移的 Union-Find 解 parent -> child = +1 的有限等式系統。
    // 共同父母會自然得到相同世代，不再靠「父母抬高 → 子女抬高」反覆迭代。
    // 若來源資料真的形成祖先循環，只忽略造成矛盾的那一條約束，
    // 不允許世代數在 render 中持續膨脹。
    function solveCanonicalGenerationLevels(
      sims,
      byId
    ) {
      const parent =
        new Map();

      const rank =
        new Map();

      const offsetToParent =
        new Map();

      sims.forEach(sim => {
        const id =
          String(sim.id);

        parent.set(id, id);
        rank.set(id, 0);
        offsetToParent.set(id, 0);
      });

      const find = id => {
        const currentParent =
          parent.get(id);

        if (
          currentParent == null ||
          currentParent === id
        ) {
          return id;
        }

        const root =
          find(currentParent);

        offsetToParent.set(
          id,
          (
            offsetToParent.get(id) ||
            0
          ) +
          (
            offsetToParent.get(
              currentParent
            ) || 0
          )
        );

        parent.set(
          id,
          root
        );

        return root;
      };

      const relativeToRoot = id => {
        find(id);

        return (
          offsetToParent.get(id) ||
          0
        );
      };

      const conflicts = [];

      const constrain = (
        parentId,
        childId
      ) => {
        const a =
          String(parentId);

        const b =
          String(childId);

        if (
          !parent.has(a) ||
          !parent.has(b) ||
          a === b
        ) {
          return false;
        }

        const aRoot =
          find(a);

        const bRoot =
          find(b);

        const aOffset =
          relativeToRoot(a);

        const bOffset =
          relativeToRoot(b);

        // canonical equation:
        // generation(child) - generation(parent) = 1
        const delta = 1;

        if (aRoot === bRoot) {
          const actual =
            bOffset -
            aOffset;

          if (
            Math.abs(
              actual -
              delta
            ) > 0.0001
          ) {
            conflicts.push({
              parentId:a,
              childId:b,
              actual
            });

            return false;
          }

          return true;
        }

        const aRank =
          rank.get(aRoot) || 0;

        const bRank =
          rank.get(bRoot) || 0;

        if (aRank < bRank) {
          parent.set(
            aRoot,
            bRoot
          );

          // value(aRoot) - value(bRoot)
          offsetToParent.set(
            aRoot,
            bOffset -
              aOffset -
              delta
          );
        } else {
          parent.set(
            bRoot,
            aRoot
          );

          // value(bRoot) - value(aRoot)
          offsetToParent.set(
            bRoot,
            delta +
              aOffset -
              bOffset
          );

          if (aRank === bRank) {
            rank.set(
              aRoot,
              aRank + 1
            );
          }
        }

        return true;
      };

      const edges = [];

      sims.forEach(child => {
        genealogyParentIds(
          child,
          byId
        ).forEach(parentId => {
          if (!byId.has(parentId)) {
            return;
          }

          edges.push({
            parentId:String(parentId),
            childId:String(child.id)
          });
        });
      });

      edges
        .sort((left, right) =>
          left.childId.localeCompare(
            right.childId
          ) ||
          left.parentId.localeCompare(
            right.parentId
          )
        )
        .forEach(edge => {
          constrain(
            edge.parentId,
            edge.childId
          );
        });

      const minByRoot =
        new Map();

      const rawBySim =
        new Map();

      const componentBySim =
        new Map();

      sims.forEach(sim => {
        const id =
          String(sim.id);

        const root =
          find(id);

        const raw =
          relativeToRoot(id);

        rawBySim.set(
          id,
          raw
        );

        componentBySim.set(
          id,
          root
        );

        const currentMin =
          minByRoot.get(root);

        if (
          currentMin == null ||
          raw < currentMin
        ) {
          minByRoot.set(
            root,
            raw
          );
        }
      });

      const generationBySim =
        new Map();

      sims.forEach(sim => {
        const id =
          String(sim.id);

        const root =
          componentBySim.get(id);

        const normalized =
          (
            rawBySim.get(id) || 0
          ) -
          (
            minByRoot.get(root) || 0
          );

        generationBySim.set(
          id,
          Math.max(
            0,
            Math.round(normalized)
          )
        );
      });

      return {
        generationBySim,
        componentBySim,
        conflicts
      };
    }

    function buildCachedGenealogyTopology(
      visibleIds
    ) {
      const sims =
        [...visibleIds]
          .map(id =>
            genealogyData.sims[id]
          )
          .filter(Boolean);

      const byId =
        new Map(
          sims.map(sim => [
            String(sim.id),
            sim
          ])
        );

      const parentGroups =
        buildParentChildConnectorGroups(
          byId,
          new Set(byId.keys())
        );

      const parentToChildren =
        new Map(
          sims.map(sim => [
            String(sim.id),
            new Set()
          ])
        );

      const childToParents =
        new Map(
          sims.map(sim => [
            String(sim.id),
            new Set()
          ])
        );

      parentGroups.forEach(group => {
        group.parentIds.forEach(parentId => {
          const normalizedParentId =
            String(parentId);

          if (!parentToChildren.has(
            normalizedParentId
          )) {
            parentToChildren.set(
              normalizedParentId,
              new Set()
            );
          }

          group.children.forEach(childId => {
            const normalizedChildId =
              String(childId);

            parentToChildren
              .get(normalizedParentId)
              .add(normalizedChildId);

            if (!childToParents.has(
              normalizedChildId
            )) {
              childToParents.set(
                normalizedChildId,
                new Set()
              );
            }

            childToParents
              .get(normalizedChildId)
              .add(normalizedParentId);
          });
        });
      });

      const canonical =
        solveCanonicalGenerationLevels(
          sims,
          byId
        );

      return {
        sims,
        byId,
        parentGroups,
        parentToChildren,
        childToParents,

        // 真正世代：側邊欄排序 / 「X 代」統計只能讀這一份。
        canonicalGenerationBySim:
          canonical.generationBySim,

        canonicalComponentBySim:
          canonical.componentBySim,

        generationConflicts:
          canonical.conflicts
      };
    }

    function getCachedGenealogyTopology(
      visibleIds
    ) {
      const key =
        visibleScopeCacheKey(
          visibleIds
        );

      if (
        genealogyTopologyCache.has(
          key
        )
      ) {
        return genealogyTopologyCache.get(
          key
        );
      }

      if (
        genealogyTopologyCache.size >
        12
      ) {
        genealogyTopologyCache.clear();
      }

      const topology =
        buildCachedGenealogyTopology(
          visibleIds
        );

      genealogyTopologyCache.set(
        key,
        topology
      );

      return topology;
    }

    function geometryBucketKey(
      x,
      y
    ) {
      return x + ':' + y;
    }

    function geometryBucketKeysForRect(
      rect
    ) {
      const left =
        Math.floor(
          rect.left /
          GEOMETRY_BUCKET_SIZE
        );

      const right =
        Math.floor(
          rect.right /
          GEOMETRY_BUCKET_SIZE
        );

      const top =
        Math.floor(
          rect.top /
          GEOMETRY_BUCKET_SIZE
        );

      const bottom =
        Math.floor(
          rect.bottom /
          GEOMETRY_BUCKET_SIZE
        );

      const keys = [];

      for (
        let x = left;
        x <= right;
        x += 1
      ) {
        for (
          let y = top;
          y <= bottom;
          y += 1
        ) {
          keys.push(
            geometryBucketKey(
              x,
              y
            )
          );
        }
      }

      return keys;
    }

    function addGeometryRectToSpatialIndex(
      geometry,
      id,
      rect
    ) {
      const key =
        String(id);

      const bucketKeys =
        geometryBucketKeysForRect(
          rect
        );

      geometry.bucketKeysById.set(
        key,
        bucketKeys
      );

      bucketKeys.forEach(bucketKey => {
        if (
          !geometry.spatialBuckets.has(
            bucketKey
          )
        ) {
          geometry.spatialBuckets.set(
            bucketKey,
            new Set()
          );
        }

        geometry.spatialBuckets
          .get(bucketKey)
          .add(key);
      });
    }

    function removeGeometryRectFromSpatialIndex(
      geometry,
      id
    ) {
      const key =
        String(id);

      (
        geometry.bucketKeysById.get(
          key
        ) ||
        []
      ).forEach(bucketKey => {
        const bucket =
          geometry.spatialBuckets.get(
            bucketKey
          );

        if (!bucket) return;

        bucket.delete(key);

        if (!bucket.size) {
          geometry.spatialBuckets.delete(
            bucketKey
          );
        }
      });

      geometry.bucketKeysById.delete(
        key
      );
    }

    function rawCardOuterRect(
      position,
      dimensions
    ) {
      const left =
        position.x + PAD;

      const top =
        position.y + PAD;

      return {
        left,
        top,
        right:
          left +
          dimensions.W,
        bottom:
          top +
          dimensions.H,
        centerX:
          left +
          dimensions.W / 2,
        centerY:
          top +
          dimensions.H / 2
      };
    }

    function rawCardAvatarRect(
      position
    ) {
      const geometry =
        getCardAvatarGeometry();

      const left =
        position.x +
        PAD +
        geometry.left;

      const top =
        position.y +
        PAD +
        geometry.top;

      return {
        left,
        top,
        right:left + geometry.size,
        bottom:top + geometry.size,
        centerX:left + geometry.size / 2,
        centerY:top + geometry.size / 2
      };
    }

    function updateSceneGeometryCard(
      geometry,
      id,
      position
    ) {
      if (!geometry || !position) {
        return;
      }

      const key =
        String(id);

      removeGeometryRectFromSpatialIndex(
        geometry,
        key
      );

      const dimensions =
        getNodeDimensionsById(
          key
        );

      const rect =
        rawCardOuterRect(
          position,
          dimensions
        );

      geometry.dimensions.set(
        key,
        dimensions
      );

      geometry.rects.set(
        key,
        rect
      );

      geometry.avatars.set(
        key,
        rawCardAvatarRect(
          position
        )
      );

      addGeometryRectToSpatialIndex(
        geometry,
        key,
        rect
      );
    }

    function buildSceneGeometry(
      pos,
      visibleIds
    ) {
      const geometry = {
        dimensions:new Map(),
        rects:new Map(),
        avatars:new Map(),
        spatialBuckets:new Map(),
        bucketKeysById:new Map(),
        width:0,
        height:0
      };

      visibleIds.forEach(id => {
        const position =
          pos.get(id);

        if (!position) return;

        updateSceneGeometryCard(
          geometry,
          id,
          position
        );

        const dimensions =
          geometry.dimensions.get(
            String(id)
          );

        geometry.width =
          Math.max(
            geometry.width,
            position.x +
              dimensions.W
          );

        geometry.height =
          Math.max(
            geometry.height,
            position.y +
              dimensions.H
          );
      });

      return geometry;
    }

    function queryGeometryCandidatesForSegment(
      geometry,
      x1,
      y1,
      x2,
      y2
    ) {
      if (!geometry) {
        return null;
      }

      const bounds = {
        left:Math.min(x1, x2),
        right:Math.max(x1, x2),
        top:Math.min(y1, y2),
        bottom:Math.max(y1, y2)
      };

      const candidates =
        new Set();

      geometryBucketKeysForRect(
        bounds
      ).forEach(bucketKey => {
        (
          geometry.spatialBuckets.get(
            bucketKey
          ) ||
          []
        ).forEach(id => {
          candidates.add(id);
        });
      });

      return candidates;
    }

    function validManualPosition(
      position
    ) {
      return !!(
        position &&
        Number.isFinite(
          Number(position.x)
        ) &&
        Number.isFinite(
          Number(position.y)
        )
      );
    }

    function buildFreeLayoutFallbackPositions(
      visibleIds,
      manualPositions
    ) {
      const topology =
        getCachedGenealogyTopology(
          visibleIds
        );

      const {
        SIBLING:SIBLING_GAP,
        LEVEL:LEVEL_GAP
      } =
        resolveLayoutGaps();

      const validManual =
        [...visibleIds]
          .map(id => ({
            id,
            position:
              manualPositions[id]
          }))
          .filter(item =>
            validManualPosition(
              item.position
            )
          );

      let manualRight = 0;
      let manualTop = 0;
      let hasManual = false;

      validManual.forEach(item => {
        const dimensions =
          getNodeDimensionsById(
            item.id
          );

        manualRight =
          Math.max(
            manualRight,
            Number(item.position.x) +
              dimensions.W
          );

        manualTop =
          hasManual
            ? Math.min(
                manualTop,
                Number(item.position.y)
              )
            : Number(item.position.y);

        hasManual = true;
      });

      const missing =
        [...visibleIds]
          .filter(id =>
            !validManualPosition(
              manualPositions[id]
            )
          )
          .sort((left, right) =>
            (
              topology.canonicalGenerationBySim.get(
                left
              ) || 0
            ) -
              (
                topology.canonicalGenerationBySim.get(
                  right
                ) || 0
              ) ||
            (
              topology.byId.get(left)?.order ??
              0
            ) -
              (
                topology.byId.get(right)?.order ??
                0
              ) ||
            String(left).localeCompare(
              String(right)
            )
          );

      if (!missing.length) {
        return new Map();
      }

      const maxCardHeight =
        Math.max(
          ...missing.map(id =>
            getNodeDimensionsById(id).H
          ),
          resolveDefaultCardDimensions().H
        );

      const generations =
        [...new Set(
          missing.map(id =>
            topology.canonicalGenerationBySim.get(
              id
            ) || 0
          )
        )]
          .sort((a, b) => a - b);

      const firstGeneration =
        generations[0] || 0;

      const baseX =
        hasManual
          ? manualRight +
            SIBLING_GAP
          : 0;

      const baseY =
        hasManual
          ? manualTop
          : 0;

      const fallback =
        new Map();

      generations.forEach(generation => {
        let cursorX =
          baseX;

        const rowY =
          baseY +
          (
            generation -
            firstGeneration
          ) *
          (
            maxCardHeight +
            LEVEL_GAP
          );

        missing
          .filter(id =>
            (
              topology.canonicalGenerationBySim.get(
                id
              ) || 0
            ) === generation
          )
          .forEach(id => {
            const dimensions =
              getNodeDimensionsById(
                id
              );

            fallback.set(
              id,
              {
                id,
                x:cursorX,
                y:rowY
              }
            );

            cursorX +=
              dimensions.W +
              SIBLING_GAP;
          });
      });

      return fallback;
    }


    function estimateWrappedRows(
      text,
      maxWidth,
      fontSize
    ) {
      const value =
        String(text || '').trim();

      if (!value) return 0;

      return Math.max(
        1,
        Math.ceil(
          measureText(
            value,
            fontSize
          ) /
          Math.max(
            24,
            maxWidth
          )
        )
      );
    }

    function estimateViewCardHeight(
      sim,
      settings
    ) {
      const model =
        buildViewCardContentModel(
          sim,
          settings
        );

      if (!model.hasText) return 100;

      const innerWidth =
        VIEW_CARD_LAYOUT.width -
        VIEW_CARD_LAYOUT.horizontalPadding;

      let height =
        VIEW_CARD_LAYOUT.topPadding +
        VIEW_CARD_LAYOUT.avatarSize +
        VIEW_CARD_LAYOUT.gap;

      if (model.name) {
        height +=
          estimateWrappedRows(
            model.name,
            innerWidth,
            VIEW_CARD_LAYOUT.nameFontSize
          ) *
          VIEW_CARD_LAYOUT.nameLineHeight;

        height +=
          VIEW_CARD_LAYOUT.gap;
      }

      [
        ...model.primary,
        ...model.details
      ].forEach(line => {
        const lineWidth =
          Math.max(
            24,
            innerWidth -
              (line.icon ? 18 : 0)
          );

        height +=
          estimateWrappedRows(
            line.text,
            lineWidth,
            VIEW_CARD_LAYOUT.metaFontSize
          ) *
          VIEW_CARD_LAYOUT.metaLineHeight;

        height +=
          VIEW_CARD_LAYOUT.gap;
      });

      return Math.max(
        100,
        Math.ceil(
          height +
          VIEW_CARD_LAYOUT.bottomPadding
        )
      );
    }

    function getViewCardDimensions(
      settings
    ) {
      let maxHeight = 100;
      let hasVisibleText = false;

      if (
        genealogyData?.families?.length &&
        genealogyData?.sims
      ) {
        const family =
          currentFamily();

        const visibleIds =
          family
            ? getVisibleIds(
                family.id
              )
            : new Set();

        visibleIds.forEach(id => {
          const sim =
            genealogyData.sims[id];

          if (!sim) return;

          const model =
            buildViewCardContentModel(
              sim,
              settings
            );

          hasVisibleText =
            hasVisibleText ||
            model.hasText;

          maxHeight =
            Math.max(
              maxHeight,
              estimateViewCardHeight(
                sim,
                settings
              )
            );
        });
      }

      if (
        !hasVisibleText &&
        !cardSettingsHasBody(
          settings
        )
      ) {
        return {
          W:100,
          H:100
        };
      }

      return {
        W:VIEW_CARD_LAYOUT.width,
        H:maxHeight
      };
    }

    function resolveDefaultCardDimensions() {
      if (viewMode === 'edit') {
        const settings =
          getCardEditSettings();

        const bodyRows = [
          settings.name ||
            settings.gender,
          settings.lifeStage ||
            settings.age,
          settings.birthday,
          settings.status ||
            settings.race,
          settings.career,
          settings.residence,
          settings.aspiration,
          settings.traits,
          settings.pets,
          settings.gallery
        ].filter(Boolean).length;

        if (!bodyRows) {
          return {
            W:92,
            H:92
          };
        }

        return {
          W:NODE_DIMS.edit.W,
          H:Math.max(
            98,
            30 +
            Math.max(
              64,
              bodyRows * 18
            )
          )
        };
      }

      return getViewCardDimensions(
        getCardViewSettings()
      );
    }

    function getNodeDimensions(
      sim
    ) {
      const cacheKey =
        sim?.id != null
          ? String(sim.id)
          : null;

      if (
        cacheKey &&
        nodeDimensionCache.has(
          cacheKey
        )
      ) {
        return nodeDimensionCache.get(
          cacheKey
        );
      }

      const dimensions =
        (
          viewMode === 'view' &&
          sim
        )
          ? {
              W:VIEW_CARD_LAYOUT.width,
              H:estimateViewCardHeight(
                sim,
                getCardViewSettings()
              )
            }
          : resolveDefaultCardDimensions();

      if (cacheKey) {
        nodeDimensionCache.set(
          cacheKey,
          dimensions
        );
      }

      return dimensions;
    }

    function getNodeDimensionsById(
      id
    ) {
      return getNodeDimensions(
        id &&
        genealogyData?.sims
          ? genealogyData.sims[id]
          : null
      );
    }

    function resolveLayoutGaps() {
      return (
        GAPS[viewMode] ||
        GAPS.view
      );
    }

    function getCurrentManualPositions(
      fam
    ) {
      if (!fam?.manualPositions) {
        return {};
      }

      return (
        fam.manualPositions[
          viewMode
        ] ||
        {}
      );
    }

    function isFreeLayoutActive(
      fam
    ) {
      if (
        !fam?.freeLayout ||
        typeof fam.freeLayout !==
          'object'
      ) {
        return false;
      }

      return !!fam.freeLayout[
        viewMode
      ];
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

function relationshipSegmentIntersectsRect(
  x1,
  y1,
  x2,
  y2,
  rect,
  padding = 6
) {
  const left =
    rect.left - padding;
  const right =
    rect.right + padding;
  const top =
    rect.top - padding;
  const bottom =
    rect.bottom + padding;

  const dx = x2 - x1;
  const dy = y2 - y1;

  let t0 = 0;
  let t1 = 1;

  const clip = (p, q) => {
    if (Math.abs(p) < 0.000001) {
      return q >= 0;
    }

    const ratio = q / p;

    if (p < 0) {
      if (ratio > t1) return false;
      if (ratio > t0) t0 = ratio;
    } else {
      if (ratio < t0) return false;
      if (ratio < t1) t1 = ratio;
    }

    return true;
  };

  return (
    clip(-dx, x1 - left) &&
    clip(dx, right - x1) &&
    clip(-dy, y1 - top) &&
    clip(dy, bottom - y1) &&
    t0 <= t1
  );
}

function relationshipBlockingCard(
  routeContext,
  x1,
  y1,
  x2,
  y2
) {
  if (
    !routeContext?.pos ||
    !routeContext?.byId
  ) {
    return null;
  }

  const ignored =
    new Set([
      String(
        routeContext.fromId || ''
      ),
      String(
        routeContext.toId || ''
      )
    ]);

  const geometry =
    routeContext.geometry ||
    (
      routeContext.pos ===
        layoutCache?.pos
        ? layoutCache.geometry
        : null
    );

  const candidates =
    queryGeometryCandidatesForSegment(
      geometry,
      x1,
      y1,
      x2,
      y2
    );

  const candidateIds =
    candidates ||
    new Set(
      [...routeContext.pos.keys()]
        .map(String)
    );

  for (
    const id
    of candidateIds
  ) {
    if (ignored.has(String(id))) {
      continue;
    }

    const position =
      routeContext.pos.get(id);

    if (!position) {
      continue;
    }

    const rect =
      geometry?.rects?.get(
        String(id)
      ) ||
      cardOuterRect(
        position
      );

    if (
      relationshipSegmentIntersectsRect(
        x1,
        y1,
        x2,
        y2,
        rect
      )
    ) {
      return {
        id:String(id),
        rect
      };
    }
  }

  return null;
}

function relationshipCurveDirection(
  blocker,
  x1,
  y1,
  x2,
  y2
) {
  if (!blocker?.rect) {
    return 1;
  }

  const cross =
    (x2 - x1) *
      (blocker.rect.centerY - y1) -
    (y2 - y1) *
      (blocker.rect.centerX - x1);

  return cross >= 0
    ? -1
    : 1;
}

function relationshipQuadraticGeometry(
  x1,
  y1,
  x2,
  y2,
  curveAmount,
  direction = 1
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
    ) *
    (
      direction < 0
        ? -1
        : 1
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
  setting,
  routeContext = null
) {
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

  const blocker =
    relationshipBlockingCard(
      routeContext,
      aX,
      aY,
      bX,
      bY
    );

  const useCurve =
    setting.routing === 'manual'
      ? !!setting.curved
      : !!blocker;

  if (!useCurve) {
    const join =
      pairJoinPoint(a, b);

    return {
      d:createPartnerConnectionPath(a, b),
      labelX:join.x,
      labelY:join.y
    };
  }

  return relationshipQuadraticGeometry(
    aX,
    aY,
    bX,
    bY,
    setting.curveAmount,
    relationshipCurveDirection(
      blocker,
      aX,
      aY,
      bX,
      bY
    )
  );
}

function relationshipOtherRenderGeometry(
  a,
  b,
  setting,
  routeContext = null
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

  const blocker =
    relationshipBlockingCard(
      routeContext,
      x1,
      y1,
      x2,
      y2
    );

  const useCurve =
    setting.routing === 'manual'
      ? !!setting.curved
      : !!blocker;

  if (useCurve) {
    return relationshipQuadraticGeometry(
      x1,
      y1,
      x2,
      y2,
      setting.curveAmount,
      relationshipCurveDirection(
        blocker,
        x1,
        y1,
        x2,
        y2
      )
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

// ========【族譜自動排版核心】 設定 - Parent Group / 主要水平配對 / 血緣世代 ========
function buildGenealogyLayoutModel(visibleIds) {
  const {
    SPOUSE:SPOUSE_GAP
  } = resolveLayoutGaps();

  const topology =
    getCachedGenealogyTopology(
      visibleIds
    );

  const {
    sims,
    byId,
    parentGroups
  } = topology;

  // canonical generation 永遠不受配偶 / 伴侶 / 畫面排列影響。
  const canonicalGenerationBySim =
    new Map(
      topology.canonicalGenerationBySim
    );

  // Layout Row 是獨立副本，只供畫布幾何使用。
  const layoutGenerationBySim =
    new Map(
      canonicalGenerationBySim
    );

  const pairCandidates =
    collectGenealogyHorizontalPairCandidates(
      sims,
      byId,
      parentGroups
    );

  // 只有彼此獨立的血緣 component 可以整塊上下平移，
  // 這不會回寫 canonical generation。
  alignIndependentLineageGenerations(
    sims,
    byId,
    layoutGenerationBySim,
    pairCandidates
  );

  const pairSelection =
    selectPrimaryHorizontalPairs(
      pairCandidates,
      layoutGenerationBySim
    );

  const pairedIds =
    new Set();

  const units = [];
  const unitBySim =
    new Map();

  const createUnit = (
    members,
    pairInfo = null
  ) => {
    const ordered =
      [...members].sort(
        (left, right) =>
          (left.order ?? 0) -
            (right.order ?? 0) ||
          String(left.name || '')
            .localeCompare(
              String(right.name || ''),
              'zh'
            ) ||
          String(left.id)
            .localeCompare(
              String(right.id)
            )
      );

    let width = 0;
    let height = 0;
    let pairGap = 0;

    if (ordered.length === 2) {
      pairGap =
        getAdaptiveHorizontalPairGap(
          ordered,
          SPOUSE_GAP
        );
    }

    ordered.forEach(
      (member, index) => {
        const dims =
          getNodeDimensions(
            member
          );

        width += dims.W;

        height =
          Math.max(
            height,
            dims.H
          );

        if (
          index <
          ordered.length - 1
        ) {
          width += pairGap;
        }
      }
    );

    const generation =
      Math.max(
        ...ordered.map(member =>
          layoutGenerationBySim.get(
            member.id
          ) || 0
        )
      );

    const unit = {
      id:
        'unit:' +
        ordered
          .map(member => member.id)
          .sort()
          .join('|'),
      members:ordered,
      memberIds:
        new Set(
          ordered.map(
            member => member.id
          )
        ),
      width,
      height,
      pairGap,
      pairInfo,
      sequence:units.length,
      parentUnitIds:new Set(),
      childUnitIds:new Set(),
      generation,
      x:0,
      y:0
    };

    units.push(unit);

    ordered.forEach(member => {
      pairedIds.add(member.id);
      unitBySim.set(
        member.id,
        unit
      );
    });

    return unit;
  };

  pairSelection.forEach(pair => {
    const first =
      byId.get(pair.a);

    const second =
      byId.get(pair.b);

    if (!first || !second) return;

    createUnit(
      [first, second],
      pair
    );
  });

  sims.forEach(sim => {
    if (pairedIds.has(sim.id)) {
      return;
    }

    createUnit([sim], null);
  });

  const unitById =
    new Map(
      units.map(unit => [
        unit.id,
        unit
      ])
    );

  // Parent Group 是族譜真正的骨架。同一個人可以同時參與多個 Parent Group，
  // 但人物卡只存在一次，不再因多配偶 / 多共同生育對象被 union 成三人以上 layout unit。
  parentGroups.forEach(group => {
    group.parentUnitIds =
      [...new Set(
        group.parentIds
          .map(parentId =>
            unitBySim.get(
              parentId
            )?.id
          )
          .filter(Boolean)
      )];

    group.childUnitIds =
      [...new Set(
        group.children
          .map(childId =>
            unitBySim.get(
              childId
            )?.id
          )
          .filter(Boolean)
      )];

    group.parentUnitIds
      .forEach(parentUnitId => {
        const parentUnit =
          unitById.get(
            parentUnitId
          );

        if (!parentUnit) return;

        group.childUnitIds
          .forEach(childUnitId => {
            const childUnit =
              unitById.get(
                childUnitId
              );

            if (
              !childUnit ||
              childUnit.id ===
                parentUnit.id
            ) {
              return;
            }

            parentUnit.childUnitIds
              .add(
                childUnit.id
              );

            childUnit.parentUnitIds
              .add(
                parentUnit.id
              );
          });
      });
  });

  return {
    sims,
    byId,
    units,
    unitById,
    unitBySim,
    parentGroups,
    pairCandidates,
    pairSelection,
    canonicalGenerationBySim,
    layoutGenerationBySim
  };
}

function relationshipPairKey(
  firstId,
  secondId
) {
  return pairKey(
    String(firstId),
    String(secondId)
  );
}

function pairRelationshipInfo(
  first,
  second
) {
  if (!first || !second) {
    return null;
  }

  const firstId =
    String(first.id);

  const secondId =
    String(second.id);

  const pairK =
    pairKey(
      firstId,
      secondId
    );

  if (
    (first.spouseIds || [])
      .map(String)
      .includes(secondId)
  ) {
    return getRelInfoByKey(
      'spouse:' + pairK,
      'spouse'
    );
  }

  if (
    (first.gameData
      ?.deceasedSpouseIds || [])
      .map(String)
      .includes(secondId)
  ) {
    return getRelInfoByKey(
      'deceased-spouse:' +
        pairK,
      'deceased-spouse'
    );
  }

  if (
    (first.exSpouseIds || [])
      .map(String)
      .includes(secondId)
  ) {
    return getRelInfoByKey(
      'exspouse:' + pairK,
      'exspouse'
    );
  }

  const link =
    (genealogyData.links || [])
      .find(entry =>
        entry &&
        !isSiblingLink(entry) &&
        (
          (
            String(entry.from) ===
              firstId &&
            String(entry.to) ===
              secondId
          ) ||
          (
            String(entry.from) ===
              secondId &&
            String(entry.to) ===
              firstId
          )
        )
      );

  if (link) {
    return getRelInfoByKey(
      'link:' + link.id,
      'social',
      relationshipOtherType(
        link
      )
    );
  }

  return null;
}

function getAdaptiveHorizontalPairGap(
  members,
  baseGap
) {
  if (
    !members ||
    members.length !== 2
  ) {
    return baseGap;
  }

  const info =
    pairRelationshipInfo(
      members[0],
      members[1]
    );

  const labelWidth =
    info
      ? relationshipBubbleWidth(
          info
        )
      : 0;

  const visualMinimum =
    viewMode === 'view'
      ? 52
      : 60;

  const labelDrivenGap =
    labelWidth
      ? labelWidth + 20
      : 0;

  return Math.min(
    Math.max(
      baseGap,
      visualMinimum,
      labelDrivenGap
    ),
    168
  );
}

function collectGenealogyHorizontalPairCandidates(
  sims,
  byId,
  parentGroups
) {
  const candidates =
    new Map();

  const adjacencyTier = meta => {
    if (meta.kind === 'spouse') {
      return 500;
    }

    if (
      meta.kind === 'social' &&
      (
        meta.type === '訂婚' ||
        meta.type === '伴侶'
      )
    ) {
      return 450;
    }

    if (meta.kind === 'parent-group') {
      return 400;
    }

    if (meta.kind === 'social') {
      return 300;
    }

    if (meta.kind === 'exspouse') {
      return 200;
    }

    if (meta.kind === 'deceased-spouse') {
      return 150;
    }

    return 0;
  };

  const add = (
    firstId,
    secondId,
    score,
    meta = {}
  ) => {
    const a =
      String(firstId || '');

    const b =
      String(secondId || '');

    if (
      !a ||
      !b ||
      a === b ||
      !byId.has(a) ||
      !byId.has(b)
    ) {
      return;
    }

    const key =
      relationshipPairKey(
        a,
        b
      );

    const tier =
      adjacencyTier(meta);

    const existing =
      candidates.get(key);

    const reasons =
      [
        ...(existing?.reasons || []),
        {
          ...meta,
          score:
            Number(score) || 0,
          tier
        }
      ];

    const candidate = {
      key,
      a,
      b,

      // score 仍用於跨血緣 component 的同列判斷；
      // adjacencyTier 才決定誰有資格佔據唯一水平相鄰位置。
      score:Math.max(
        Number(score) || 0,
        existing?.score || 0
      ),
      adjacencyTier:Math.max(
        tier,
        existing?.adjacencyTier || 0
      ),
      reasons
    };

    const existingPrimary =
      existing?.primaryReason ||
      null;

    const nextReason = {
      ...meta,
      score:
        Number(score) || 0,
      tier
    };

    candidate.primaryReason =
      (
        !existingPrimary ||
        nextReason.tier >
          existingPrimary.tier ||
        (
          nextReason.tier ===
            existingPrimary.tier &&
          nextReason.score >
            existingPrimary.score
        )
      )
        ? nextReason
        : existingPrimary;

    candidate.kind =
      candidate.primaryReason.kind;

    if (candidate.primaryReason.type) {
      candidate.type =
        candidate.primaryReason.type;
    }

    if (
      candidate.primaryReason
        .parentGroupKey
    ) {
      candidate.parentGroupKey =
        candidate.primaryReason
          .parentGroupKey;
    }

    if (candidate.primaryReason.linkId) {
      candidate.linkId =
        candidate.primaryReason.linkId;
    }

    candidates.set(
      key,
      candidate
    );
  };

  parentGroups.forEach(group => {
    const parents =
      group.parentIds
        .filter(id =>
          byId.has(id)
        );

    for (
      let firstIndex = 0;
      firstIndex < parents.length;
      firstIndex += 1
    ) {
      for (
        let secondIndex =
          firstIndex + 1;
        secondIndex < parents.length;
        secondIndex += 1
      ) {
        add(
          parents[firstIndex],
          parents[secondIndex],
          1100 +
            group.children.length *
              25,
          {
            kind:'parent-group',
            parentGroupKey:
              group.key
          }
        );
      }
    }
  });

  sims.forEach(sim => {
    const deceased =
      new Set(
        (
          sim.gameData
            ?.deceasedSpouseIds ||
          []
        ).map(String)
      );

    (sim.spouseIds || [])
      .forEach(spouseId => {
        add(
          sim.id,
          spouseId,
          deceased.has(
            String(spouseId)
          )
            ? 180
            : 900,
          {
            kind:
              deceased.has(
                String(spouseId)
              )
                ? 'deceased-spouse'
                : 'spouse'
          }
        );
      });

    (sim.gameData?.deceasedSpouseIds || [])
      .forEach(spouseId => {
        add(
          sim.id,
          spouseId,
          180,
          {
            kind:'deceased-spouse'
          }
        );
      });

    (sim.exSpouseIds || [])
      .forEach(spouseId => {
        add(
          sim.id,
          spouseId,
          220,
          {
            kind:'exspouse'
          }
        );
      });
  });

  (genealogyData.links || [])
    .forEach(link => {
      if (
        !link ||
        isSiblingLink(link) ||
        !byId.has(
          String(link.from)
        ) ||
        !byId.has(
          String(link.to)
        )
      ) {
        return;
      }

      const type =
        relationshipOtherType(
          link
        );

      const priority =
        relationshipLayoutPriority(
          type
        );

      if (priority <= 0) {
        return;
      }

      add(
        link.from,
        link.to,
        priority,
        {
          kind:'social',
          type,
          linkId:
            link.id || null
        }
      );
    });

  return [...candidates.values()]
    .sort((left, right) =>
      right.adjacencyTier -
        left.adjacencyTier ||
      right.score -
        left.score ||
      String(left.key)
        .localeCompare(
          String(right.key)
        )
    );
}

function buildPersonLineageComponents(
  sims,
  byId
) {
  const adjacency =
    new Map(
      sims.map(sim => [
        sim.id,
        new Set()
      ])
    );

  sims.forEach(sim => {
    genealogyParentIds(
      sim,
      byId
    ).forEach(parentId => {
      if (!byId.has(parentId)) {
        return;
      }

      adjacency.get(sim.id)
        .add(parentId);

      adjacency.get(parentId)
        .add(sim.id);
    });
  });

  const componentBySim =
    new Map();

  let nextComponent = 0;

  sims.forEach(sim => {
    if (
      componentBySim.has(
        sim.id
      )
    ) {
      return;
    }

    const componentId =
      'lineage:' +
      nextComponent++;

    const stack = [
      sim.id
    ];

    componentBySim.set(
      sim.id,
      componentId
    );

    while (stack.length) {
      const id =
        stack.pop();

      (
        adjacency.get(id) ||
        []
      ).forEach(relatedId => {
        if (
          componentBySim.has(
            relatedId
          )
        ) {
          return;
        }

        componentBySim.set(
          relatedId,
          componentId
        );

        stack.push(
          relatedId
        );
      });
    }
  });

  return componentBySim;
}

function alignIndependentLineageGenerations(
  sims,
  byId,
  layoutGenerationBySim,
  pairCandidates
) {
  const componentBySim =
    buildPersonLineageComponents(
      sims,
      byId
    );

  const adjacency =
    new Map();

  componentBySim.forEach(
    componentId => {
      if (
        !adjacency.has(
          componentId
        )
      ) {
        adjacency.set(
          componentId,
          []
        );
      }
    }
  );

  pairCandidates
    .filter(candidate =>
      candidate.score >= 500
    )
    .forEach(candidate => {
      const aComponent =
        componentBySim.get(
          candidate.a
        );

      const bComponent =
        componentBySim.get(
          candidate.b
        );

      if (
        !aComponent ||
        !bComponent ||
        aComponent ===
          bComponent
      ) {
        return;
      }

      const delta =
        (
          layoutGenerationBySim.get(
            candidate.a
          ) || 0
        ) -
        (
          layoutGenerationBySim.get(
            candidate.b
          ) || 0
        );

      adjacency.get(aComponent)
        .push({
          target:bComponent,
          delta,
          score:candidate.score
        });

      adjacency.get(bComponent)
        .push({
          target:aComponent,
          delta:-delta,
          score:candidate.score
        });
    });

  adjacency.forEach(edges => {
    edges.sort(
      (left, right) =>
        right.score -
        left.score
    );
  });

  const offsetByComponent =
    new Map();

  [...adjacency.keys()]
    .forEach(start => {
      if (
        offsetByComponent.has(
          start
        )
      ) {
        return;
      }

      offsetByComponent.set(
        start,
        0
      );

      const queue = [start];

      while (queue.length) {
        const component =
          queue.shift();

        const baseOffset =
          offsetByComponent.get(
            component
          ) || 0;

        (
          adjacency.get(
            component
          ) ||
          []
        ).forEach(edge => {
          if (
            offsetByComponent.has(
              edge.target
            )
          ) {
            return;
          }

          offsetByComponent.set(
            edge.target,
            baseOffset +
              edge.delta
          );

          queue.push(
            edge.target
          );
        });
      }
    });

  sims.forEach(sim => {
    const component =
      componentBySim.get(
        sim.id
      );

    layoutGenerationBySim.set(
      sim.id,
      (
        layoutGenerationBySim.get(
          sim.id
        ) || 0
      ) +
        (
          offsetByComponent.get(
            component
          ) || 0
        )
    );
  });

  const minGeneration =
    Math.min(
      0,
      ...sims.map(sim =>
        layoutGenerationBySim.get(
          sim.id
        ) || 0
      )
    );

  if (minGeneration < 0) {
    sims.forEach(sim => {
      layoutGenerationBySim.set(
        sim.id,
        (
          layoutGenerationBySim.get(
            sim.id
          ) || 0
        ) -
          minGeneration
      );
    });
  }
}

function selectPrimaryHorizontalPairs(
  candidates,
  layoutGenerationBySim
) {
  const used =
    new Set();

  const selected = [];

  candidates.forEach(candidate => {
    if (
      used.has(candidate.a) ||
      used.has(candidate.b) ||
      (
        layoutGenerationBySim.get(
          candidate.a
        ) || 0
      ) !==
        (
          layoutGenerationBySim.get(
            candidate.b
          ) || 0
        )
    ) {
      return;
    }

    used.add(candidate.a);
    used.add(candidate.b);

    selected.push(
      candidate
    );
  });

  return selected;
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

  // ========【Primary Branch Expansion】 設定 - Parent Group 連上的家系都屬於真正分支 ========
  // 大家族模式的 primaryMemberIds 只是「從哪個 EA 族譜進入」，
  // 不能把後續透過親子 / 領養延伸到的 B / C 家庭降級成 attachment。
  // 只要 unit 透過 Parent Group 骨架與主分支相連，就遞迴升格為 branch unit。
  if (primaryUnitIds.size) {
    let changed = true;

    while (changed) {
      changed = false;

      (model.parentGroups || [])
        .forEach(group => {
          const relatedUnitIds =
            [...new Set([
              ...(group.parentUnitIds || []),
              ...(group.childUnitIds || [])
            ])]
              .filter(Boolean);

          if (
            !relatedUnitIds.some(unitId =>
              primaryUnitIds.has(unitId)
            )
          ) {
            return;
          }

          relatedUnitIds.forEach(unitId => {
            if (primaryUnitIds.has(unitId)) {
              return;
            }

            primaryUnitIds.add(unitId);
            changed = true;
          });
        });
    }
  }

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

  const childGroupKeyByOwner =
    new Map();

  (model.parentGroups || [])
    .forEach(group => {
      const parentUnitIds =
        (group.parentUnitIds || [])
          .filter(parentUnitId =>
            primaryUnitIds.has(
              parentUnitId
            )
          );

      const childUnitIds =
        (group.childUnitIds || [])
          .filter(childUnitId =>
            primaryUnitIds.has(
              childUnitId
            )
          );

      parentUnitIds.forEach(
        parentUnitId => {
          childUnitIds.forEach(
            childUnitId => {
              childGroupKeyByOwner.set(
                parentUnitId +
                  '\u0001' +
                  childUnitId,
                group.key
              );
            }
          );
        }
      );
    });

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
        .sort((leftId, rightId) => {
          const leftGroup =
            childGroupKeyByOwner.get(
              unit.id +
                '\u0001' +
                leftId
            ) || '';

          const rightGroup =
            childGroupKeyByOwner.get(
              unit.id +
                '\u0001' +
                rightId
            ) || '';

          return (
            leftGroup.localeCompare(
              rightGroup
            ) ||
            stableGenealogyUnitCompare(
              model.unitById.get(leftId),
              model.unitById.get(rightId)
            )
          );
        })
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
      const socialAttachmentIds =
        (genealogyData.links || [])
          .filter(link =>
            link &&
            !isSiblingLink(link) &&
            relationshipLayoutPriority(
              relationshipOtherType(
                link
              )
            ) > 0 &&
            (
              String(link.from) ===
                String(member.id) ||
              String(link.to) ===
                String(member.id)
            )
          )
          .map(link =>
            String(link.from) ===
              String(member.id)
              ? String(link.to)
              : String(link.from)
          );

      const relatedIds =
        new Set([
          ...(member.spouseIds || []),
          ...(member.exSpouseIds || []),
          ...(member.gameData?.deceasedSpouseIds || []),
          ...socialAttachmentIds,
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
    primaryParents,
    primaryChildren,
    childGroupKeyByOwner,
    pathByUnit,
    rootByUnit,
    ownerParentByUnit,
    primarySideByUnit,
    attachmentOwnerByUnit,
    attachmentSideByUnit
  };
}

// ========【Family Branch Block Layout】 設定 - 先保留整個子孫分支，再放人物 ========
function buildFamilyBranchBlockMetrics(
  model,
  ownership
) {
  const {
    SIBLING:SIBLING_GAP
  } = resolveLayoutGaps();

  const PARENT_GROUP_GAP =
    Math.max(
      SIBLING_GAP * 2,
      SIBLING_GAP + 40
    );

  const widthByUnit =
    new Map();

  const childGroupsByOwner =
    new Map();

  const groupWidthByOwnerKey =
    new Map();

  const visiting =
    new Set();

  const ownedChildrenFor =
    unitId =>
      (
        ownership.primaryChildren
          .get(unitId) ||
        []
      )
        .filter(childId =>
          ownership.ownerParentByUnit
            .get(childId) === unitId
        );

  const groupOwnedChildren = unitId => {
    if (
      childGroupsByOwner.has(
        unitId
      )
    ) {
      return childGroupsByOwner.get(
        unitId
      );
    }

    const groups =
      new Map();

    ownedChildrenFor(unitId)
      .forEach(childId => {
        const groupKey =
          ownership.childGroupKeyByOwner
            .get(
              unitId +
                '\u0001' +
                childId
            ) ||
          (
            'ungrouped:' +
            childId
          );

        if (!groups.has(groupKey)) {
          groups.set(
            groupKey,
            []
          );
        }

        groups.get(groupKey)
          .push(childId);
      });

    const ordered =
      [...groups.entries()]
        .map(([groupKey, childIds]) => ({
          groupKey,
          childIds:
            [...childIds]
              .sort((leftId, rightId) =>
                stableGenealogyUnitCompare(
                  model.unitById.get(leftId),
                  model.unitById.get(rightId)
                )
              )
        }))
        .sort((left, right) =>
          String(left.groupKey)
            .localeCompare(
              String(right.groupKey)
            )
        );

    childGroupsByOwner.set(
      unitId,
      ordered
    );

    return ordered;
  };

  const measure = unitId => {
    if (widthByUnit.has(unitId)) {
      return widthByUnit.get(unitId);
    }

    const unit =
      model.unitById.get(unitId);

    if (!unit) {
      return 0;
    }

    if (visiting.has(unitId)) {
      return unit.width;
    }

    visiting.add(unitId);

    const groups =
      groupOwnedChildren(
        unitId
      );

    const groupWidths =
      groups.map(group => {
        const childWidths =
          group.childIds.map(
            measure
          );

        const width =
          childWidths.length
            ? childWidths.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) +
              SIBLING_GAP *
                (
                  childWidths.length - 1
                )
            : 0;

        groupWidthByOwnerKey.set(
          unitId +
            '\u0001' +
            group.groupKey,
          width
        );

        return width;
      });

    const childrenWidth =
      groupWidths.length
        ? groupWidths.reduce(
            (sum, value) =>
              sum + value,
            0
          ) +
          PARENT_GROUP_GAP *
            (
              groupWidths.length - 1
            )
        : 0;

    const width =
      Math.max(
        unit.width,
        childrenWidth
      );

    visiting.delete(unitId);

    widthByUnit.set(
      unitId,
      width
    );

    return width;
  };

  ownership.primaryUnitIds
    .forEach(measure);

  return {
    widthByUnit,
    childGroupsByOwner,
    groupWidthByOwnerKey,
    siblingGap:SIBLING_GAP,
    parentGroupGap:PARENT_GROUP_GAP
  };
}

function assignFamilyBranchBlockPositions(
  layers,
  model,
  ownership
) {
  const metrics =
    buildFamilyBranchBlockMetrics(
      model,
      ownership
    );

  const {
    widthByUnit,
    childGroupsByOwner,
    groupWidthByOwnerKey,
    siblingGap,
    parentGroupGap
  } = metrics;

  const primaryRoots =
    [...ownership.primaryUnitIds]
      .filter(unitId =>
        !ownership.ownerParentByUnit
          .has(unitId)
      )
      .sort((leftId, rightId) =>
        compareFamilyBranchPath(
          ownership.pathByUnit.get(
            leftId
          ),
          ownership.pathByUnit.get(
            rightId
          )
        ) ||
        stableGenealogyUnitCompare(
          model.unitById.get(leftId),
          model.unitById.get(rightId)
        )
      );

  const placed =
    new Set();

  const blockBoundsByUnit =
    new Map();

  const placeBranch = (
    unitId,
    blockLeft
  ) => {
    const unit =
      model.unitById.get(unitId);

    if (!unit || placed.has(unitId)) {
      return;
    }

    placed.add(unitId);

    const blockWidth =
      widthByUnit.get(unitId) ||
      unit.width;

    blockBoundsByUnit.set(
      unitId,
      {
        left:blockLeft,
        right:
          blockLeft +
          blockWidth,
        width:blockWidth
      }
    );

    unit.x =
      blockLeft +
      (
        blockWidth -
        unit.width
      ) / 2;

    const groups =
      childGroupsByOwner.get(
        unitId
      ) || [];

    if (!groups.length) {
      return;
    }

    const groupWidths =
      groups.map(group =>
        groupWidthByOwnerKey.get(
          unitId +
            '\u0001' +
            group.groupKey
        ) || 0
      );

    const totalGroupsWidth =
      groupWidths.reduce(
        (sum, value) =>
          sum + value,
        0
      ) +
      parentGroupGap *
        (
          groupWidths.length - 1
        );

    let groupLeft =
      blockLeft +
      (
        blockWidth -
        totalGroupsWidth
      ) / 2;

    groups.forEach(
      (group, groupIndex) => {
        const groupWidth =
          groupWidths[groupIndex];

        const childWidths =
          group.childIds.map(childId =>
            widthByUnit.get(childId) ||
            model.unitById.get(childId)?.width ||
            0
          );

        const childrenWidth =
          childWidths.reduce(
            (sum, value) =>
              sum + value,
            0
          ) +
          siblingGap *
            Math.max(
              0,
              childWidths.length - 1
            );

        let childLeft =
          groupLeft +
          (
            groupWidth -
            childrenWidth
          ) / 2;

        group.childIds.forEach(
          (childId, childIndex) => {
            placeBranch(
              childId,
              childLeft
            );

            childLeft +=
              childWidths[childIndex] +
              siblingGap;
          }
        );

        groupLeft +=
          groupWidth +
          parentGroupGap;
      }
    );
  };

  let cursorX = 0;

  primaryRoots.forEach(rootId => {
    const width =
      widthByUnit.get(rootId) ||
      model.unitById.get(rootId)?.width ||
      0;

    placeBranch(
      rootId,
      cursorX
    );

    cursorX +=
      width +
      parentGroupGap;
  });

  // DAG / 異常來源資料若還有未被 owner tree 走到的 branch，
  // 只能追加成另一個完整 block，不准塞回已建立的 Parent Group 內。
  [...ownership.primaryUnitIds]
    .filter(unitId =>
      !placed.has(unitId)
    )
    .sort((leftId, rightId) =>
      compareFamilyBranchPath(
        ownership.pathByUnit.get(
          leftId
        ),
        ownership.pathByUnit.get(
          rightId
        )
      ) ||
      stableGenealogyUnitCompare(
        model.unitById.get(leftId),
        model.unitById.get(rightId)
      )
    )
    .forEach(unitId => {
      const width =
        widthByUnit.get(unitId) ||
        model.unitById.get(unitId)?.width ||
        0;

      placeBranch(
        unitId,
        cursorX
      );

      cursorX +=
        width +
        parentGroupGap;
    });

  // 純社交 / 無 Parent Group 骨架的人才是 attachment。
  // 它們掛在 owner branch 外側，而不是把整個 B / C 血緣家系趕到全圖最左 / 最右。
  layers.forEach(layer => {
    const attachments =
      layer.filter(unit =>
        !ownership.primaryUnitIds
          .has(unit.id)
      );

    attachments.forEach(unit => {
      const ownerId =
        ownership.attachmentOwnerByUnit
          .get(unit.id);

      const owner =
        ownerId
          ? model.unitById.get(
              ownerId
            )
          : null;

      const ownerBounds =
        ownerId
          ? blockBoundsByUnit.get(
              ownerId
            )
          : null;

      const side =
        ownership.attachmentSideByUnit
          .get(unit.id) ||
        1;

      if (owner && ownerBounds) {
        unit.x =
          side < 0
            ? ownerBounds.left -
              siblingGap -
              unit.width
            : ownerBounds.right +
              siblingGap;

        return;
      }

      unit.x =
        cursorX;

      cursorX +=
        unit.width +
        siblingGap;
    });
  });

  return {
    ...metrics,
    blockBoundsByUnit
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

  // 兄弟姊妹所在位置最能代表「原生家系應該從主要水平配對的哪一側延伸」。
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

  // 沒有兄弟姊妹時，父母家系的位置仍可決定主要水平配對左右方向。
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

function orientHorizontalPairUnitsByLineage(
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
  } = resolveLayoutGaps();

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
  } = resolveLayoutGaps();

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
      cursorX += unit.pairGap;
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

  const isHorizontalPair =
    first.unit.id ===
      second.unit.id &&
    first.unit.members.length === 2;

  if (isHorizontalPair) {
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
  } = resolveLayoutGaps();

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
  } = resolveLayoutGaps();

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
  } = resolveLayoutGaps();

  layers.forEach(layer => {
    if (!layer.length) return;

    // ========【同世代防重疊】 設定 - 保留家系語意順序 ========
    // layer 的順序與初始空間已由 Family Branch Block Layout 決定。
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
      // 中間子女可依實際 layout unit 寬度自然展開，不被固定死。
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
  } = resolveLayoutGaps();

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

  // ========【Auto Relationship Geometry Solver】 設定 - 問題規模線性上限 + 停滯偵測 ========
  // 每一輪都會完整投影 relationship equality 與同代 collision。
  // 上限改為接近「一輪覆蓋所有 active unit / constraint」的線性規模，
  // 並設硬上限，避免大型族譜因難收斂而在主執行緒跑數千輪。
  const problemSize =
    model.units.length +
    constraints.length;

  const maxPasses =
    Math.min(
      192,
      Math.max(
        32,
        problemSize + 8
      )
    );

  let previousError =
    Number.POSITIVE_INFINITY;

  let stagnantPasses = 0;

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

    const currentError =
      Math.max(
        maxOverlap,
        maxRelationshipError
      );

    if (currentError <= 0.01) {
      break;
    }

    const improvement =
      previousError -
      currentError;

    const minimumUsefulImprovement =
      Math.max(
        0.001,
        Number.isFinite(
          previousError
        )
          ? previousError * 0.0001
          : 0.001
      );

    if (
      improvement <=
      minimumUsefulImprovement
    ) {
      stagnantPasses += 1;
    } else {
      stagnantPasses = 0;
    }

    previousError =
      currentError;

    if (stagnantPasses >= 12) {
      break;
    }
  }

  for (
    let settle = 0;
    settle < 4;
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
        cursorX += unit.pairGap;
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

// ========【親子直線優先】 設定 - 排列器先對齊，renderer 才需要最少折線 ========
function genealogyLayerForUnit(
  layers,
  unit
) {
  if (!unit) return null;
  return layers.get(unit.generation) || null;
}

function canPlaceGenealogyUnitAtX(
  unit,
  targetX,
  layer,
  gap
) {
  if (
    !unit ||
    !layer ||
    !Number.isFinite(targetX)
  ) {
    return false;
  }

  const left =
    targetX;

  const right =
    targetX +
    unit.width;

  return layer.every(other => {
    if (other.id === unit.id) {
      return true;
    }

    return (
      right + gap <= other.x ||
      left >= other.x + other.width + gap
    );
  });
}

function alignDirectParentChildGroups(
  layers,
  model,
  connectorGroups
) {
  const {
    SIBLING:SIBLING_GAP
  } = resolveLayoutGaps();

  const parentGroupsByChild =
    new Map();

  const childGroupsByParent =
    new Map();

  connectorGroups.forEach(group => {
    group.children.forEach(childId => {
      if (!parentGroupsByChild.has(childId)) {
        parentGroupsByChild.set(
          childId,
          []
        );
      }

      parentGroupsByChild
        .get(childId)
        .push(group);
    });

    group.parentIds.forEach(parentId => {
      if (!childGroupsByParent.has(parentId)) {
        childGroupsByParent.set(
          parentId,
          []
        );
      }

      childGroupsByParent
        .get(parentId)
        .push(group);
    });
  });

  const groups =
    connectorGroups
      .filter(group =>
        group.children.length === 1
      )
      .sort((left, right) => {
        const leftChild =
          model.unitBySim.get(
            left.children[0]
          );

        const rightChild =
          model.unitBySim.get(
            right.children[0]
          );

        return (
          (leftChild?.generation || 0) -
          (rightChild?.generation || 0)
        );
      });

  groups.forEach(group => {
    const childId =
      group.children[0];

    const childUnit =
      model.unitBySim.get(
        childId
      );

    const childGeometry =
      genealogyUnitMemberRelationshipGeometry(
        childUnit,
        childId
      );

    if (!childUnit || !childGeometry) {
      return;
    }

    const childAnchorX =
      childUnit.x +
      childGeometry.anchorLocalX;

    // 單一父 / 母 → 單一子女：
    // 優先把沒有上一代的根節點移到子女正上方。
    if (group.parentIds.length === 1) {
      const parentId =
        group.parentIds[0];

      const parentUnit =
        model.unitBySim.get(
          parentId
        );

      const parentGeometry =
        genealogyUnitMemberRelationshipGeometry(
          parentUnit,
          parentId
        );

      if (!parentUnit || !parentGeometry) {
        return;
      }

      const parentHasOwnParents =
        (
          parentGroupsByChild.get(
            parentId
          ) || []
        ).length > 0;

      const childHasOwnChildren =
        (
          childGroupsByParent.get(
            childId
          ) || []
        ).length > 0;

      const parentTargetX =
        childAnchorX -
        parentGeometry.anchorLocalX;

      const parentLayer =
        genealogyLayerForUnit(
          layers,
          parentUnit
        );

      if (
        !parentHasOwnParents &&
        canPlaceGenealogyUnitAtX(
          parentUnit,
          parentTargetX,
          parentLayer,
          SIBLING_GAP
        )
      ) {
        parentUnit.x =
          parentTargetX;

        return;
      }

      const sourceX =
        genealogyGroupSourceX(
          group,
          model
        );

      const childTargetX =
        Number.isFinite(sourceX)
          ? sourceX -
            childGeometry.anchorLocalX
          : null;

      const childLayer =
        genealogyLayerForUnit(
          layers,
          childUnit
        );

      if (
        !childHasOwnChildren &&
        canPlaceGenealogyUnitAtX(
          childUnit,
          childTargetX,
          childLayer,
          SIBLING_GAP
        )
      ) {
        childUnit.x =
          childTargetX;
      }

      return;
    }

    // 雙親已經是一個水平 pair，只有一名子女時，
    // 子女直接放在 pair join 正下方；只有真的會撞卡片才保留折線。
    if (group.parentIds.length === 2) {
      const firstUnit =
        model.unitBySim.get(
          group.parentIds[0]
        );

      const secondUnit =
        model.unitBySim.get(
          group.parentIds[1]
        );

      if (
        !firstUnit ||
        !secondUnit ||
        firstUnit.id !== secondUnit.id
      ) {
        return;
      }

      const sourceX =
        genealogyGroupSourceX(
          group,
          model
        );

      const childTargetX =
        Number.isFinite(sourceX)
          ? sourceX -
            childGeometry.anchorLocalX
          : null;

      const childLayer =
        genealogyLayerForUnit(
          layers,
          childUnit
        );

      if (
        canPlaceGenealogyUnitAtX(
          childUnit,
          childTargetX,
          childLayer,
          SIBLING_GAP
        )
      ) {
        childUnit.x =
          childTargetX;
      }
    }
  });
}

function solveAutomaticGenealogyPositions(visibleIds) {
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
    model.parentGroups;

  // Family Branch Ordering 決定同世代語意順序；
  // Family Branch Block Layout 再替每個完整 descendant subtree 保留空間。
  applyFamilyBranchOrdering(
    layers,
    model,
    ownership
  );

  setGenerationVerticalPositions(
    layers
  );

  assignFamilyBranchBlockPositions(
    layers,
    model,
    ownership
  );

  const horizontalPairOrientationChanged =
    orientHorizontalPairUnitsByLineage(
      model,
      connectorGroups,
      ownership
    );

  if (horizontalPairOrientationChanged) {
    applyFamilyBranchOrdering(
      layers,
      model,
      ownership
    );

    assignFamilyBranchBlockPositions(
      layers,
      model,
      ownership
    );
  }

  // 先滿足最簡單、最可讀的親子直線；只有碰撞時才交給 renderer 畫折線。
  alignDirectParentChildGroups(
    layers,
    model,
    connectorGroups
  );

  // Family Branch Block 本身就是最終水平幾何權威。
  // 不再執行 generation-global packing，避免把已保留的 Parent Group block 再推壞。
  return placeGenealogyUnitMembers(
    model.units
  );
}

function composeScenePlan() {
  const fam =
    currentFamily();

  const visibleIds =
    getVisibleIds(
      fam.id
    );

  const sims =
    [...visibleIds]
      .map(id =>
        genealogyData.sims[id]
      )
      .filter(Boolean);

  const byId =
    new Map(
      sims.map(sim => [
        sim.id,
        sim
      ])
    );

  const manualPositions =
    getCurrentManualPositions(
      fam
    );

  const isFree =
    isFreeLayoutActive(
      fam
    );

  let pos =
    new Map();

  if (isFree) {
    const fallback =
      buildFreeLayoutFallbackPositions(
        visibleIds,
        manualPositions
      );

    sims.forEach(sim => {
      const manual =
        manualPositions[
          sim.id
        ];

      const source =
        validManualPosition(
          manual
        )
          ? manual
          : fallback.get(
              sim.id
            ) || {
              x:0,
              y:0
            };

      pos.set(
        sim.id,
        {
          id:sim.id,
          x:Number(source.x) || 0,
          y:Number(source.y) || 0
        }
      );
    });
  } else {
    pos =
      solveAutomaticGenealogyPositions(
        visibleIds
      );
  }

  const geometry =
    buildSceneGeometry(
      pos,
      visibleIds
    );

  return {
    pos,
    width:geometry.width,
    height:geometry.height,
    geometry,
    byId,
    visibleIds
  };
}



// ========【Scene Incremental Pipeline】 設定 - Layout / Nodes / Edges 由 Scene 單獨失效 ========
const RENDER_DIRTY = Object.freeze({ layout:1, nodes:2, edges:4 });
let layoutCache = null;
let renderDirtyMask = 0;
let renderInvalidationRaf = 0;
let relationshipPreviewPending = false;
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

  if (renderInvalidationRaf) {
    cancelAnimationFrame(renderInvalidationRaf);
    renderInvalidationRaf = 0;
  }

  let mask =
    renderDirtyMask;

  renderDirtyMask = 0;

  if (!mask) return;

  const layoutWasDirty =
    !!(
      mask &
      RENDER_DIRTY.layout
    );

  if (layoutWasDirty) {
    relationshipPreviewPending = false;
    pendingRelationshipPreviewIds.clear();
    resetNodeDimensionCache();

    layoutCache =
      composeScenePlan();

    syncStageGeometryFromLayout();

    mask |=
      RENDER_DIRTY.nodes |
      RENDER_DIRTY.edges;
  }

  if (
    mask &
    RENDER_DIRTY.edges
  ) {
    const previewOnly =
      relationshipPreviewPending &&
      !layoutWasDirty &&
      pendingRelationshipPreviewIds.size > 0;

    relationshipPreviewPending = false;

    if (previewOnly) {
      const updated =
        paintRelationshipPreview(
          pendingRelationshipPreviewIds
        );

      pendingRelationshipPreviewIds.clear();

      if (!updated) {
        paintRelationshipLayer({
          includeLabels:true
        });
      }
    } else {
      pendingRelationshipPreviewIds.clear();

      paintRelationshipLayer({
        includeLabels:true
      });
    }
  }

  if (
    mask &
    RENDER_DIRTY.nodes
  ) {
    paintPersonLayer();
  }
}

function requestSceneUpdate(
  layers,
  { immediate = false } = {}
) {
  renderDirtyMask |=
    renderMaskFromLayers(layers);

  if (!renderDirtyMask) return;

  if (immediate) {
    flushRenderInvalidation();
    return;
  }

  if (renderInvalidationRaf) return;

  renderInvalidationRaf =
    requestAnimationFrame(() => {
      renderInvalidationRaf = 0;
      flushRenderInvalidation();
    });
}

function requestRelationshipLayerUpdate() {
  relationshipPreviewPending = false;
  pendingRelationshipPreviewIds.clear();
  requestSceneUpdate({ edges:true });
}

function requestRelationshipPreviewUpdate(
  simIds = []
) {
  if (
    renderDirtyMask &
    RENDER_DIRTY.layout
  ) {
    relationshipPreviewPending = false;
    pendingRelationshipPreviewIds.clear();
    requestSceneUpdate({
      edges:true
    });
    return;
  }

  const ids =
    [...(simIds || [])]
      .map(String)
      .filter(Boolean);

  if (!ids.length) {
    relationshipPreviewPending = false;
    pendingRelationshipPreviewIds.clear();
    requestSceneUpdate({
      edges:true
    });
    return;
  }

  ids.forEach(id => {
    pendingRelationshipPreviewIds.add(
      id
    );
  });

  relationshipPreviewPending = true;

  requestSceneUpdate({
    edges:true
  });
}

function renderSceneImmediately() {
  relationshipPreviewPending = false;
  requestSceneUpdate(
    {
      layout:true,
      nodes:true,
      edges:true
    },
    { immediate:true }
  );
}
function readScenePlan() { return layoutCache; }
function readPersonPosition(id) { const pos = layoutCache?.pos?.get(String(id)); return pos ? { ...pos } : null; }
function updateTransientPersonPosition(id, position) {
  if (
    !layoutCache?.pos ||
    !position
  ) {
    return false;
  }

  const key =
    String(id);

  if (
    !layoutCache.pos.has(
      key
    )
  ) {
    return false;
  }

  const next = {
    id:key,
    x:Number(position.x) || 0,
    y:Number(position.y) || 0
  };

  layoutCache.pos.set(
    key,
    next
  );

  updateSceneGeometryCard(
    layoutCache.geometry,
    key,
    next
  );

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

function parentConnectorSource(
  group,
  pos,
  byId,
  paths,
  {
    collisionRouting = true
  } = {}
) {
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

  const pairLink =
    (genealogyData.links || [])
      .find(link =>
        link &&
        !isSiblingLink(link) &&
        (
          (
            String(link.from) ===
              String(first.id) &&
            String(link.to) ===
              String(second.id)
          ) ||
          (
            String(link.from) ===
              String(second.id) &&
            String(link.to) ===
              String(first.id)
          )
        ) &&
        relationshipLayoutPriority(
          relationshipOtherType(
            link
          )
        ) > 0
      );

  const hasVisibleHorizontalRelation =
    (firstSim.spouseIds || [])
      .map(String)
      .includes(String(secondId)) ||
    (firstSim.exSpouseIds || [])
      .map(String)
      .includes(String(secondId)) ||
    (firstSim.gameData?.deceasedSpouseIds || [])
      .map(String)
      .includes(String(secondId)) ||
    !!pairLink;

  if (hasVisibleHorizontalRelation) {
    const geometry =
      getPairConnectionGeometry(
        first.pos,
        second.pos
      );

    // 拖曳 preview 沿用 main 的穩定關係幾何：
    // 不在每一幀因為 blocker 進出而切換 parent source。
    if (!collisionRouting) {
      return pairJoinPoint(
        first.pos,
        second.pos
      );
    }

    const blocker =
      relationshipBlockingCard(
        {
          fromId:first.id,
          toId:second.id,
          pos,
          byId
        },
        geometry.aX,
        geometry.aY,
        geometry.bX,
        geometry.bY
      );

    if (
      Math.abs(
        geometry.aY -
        geometry.bY
      ) <= 0.75 &&
      !blocker
    ) {
      return pairJoinPoint(
        first.pos,
        second.pos
      );
    }
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

function drawParentConnectorGroup(
  group,
  pos,
  byId,
  paths,
  labels,
  options = {}
) {
  const source =
    parentConnectorSource(
      group,
      pos,
      byId,
      paths,
      options
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

    if (labels && showRelLabels && !relationshipPerspectiveSimId) {
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

  if (labels && showRelLabels && !relationshipPerspectiveSimId) {
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

function paintRelationshipLayer({
  includeLabels = true
} = {}) {
  if (!layoutCache) return;

  const {
    pos,
    byId,
    visibleIds,
    geometry
  } = layoutCache;

  const paths = [];
  const labels =
    includeLabels
      ? []
      : null;

  const labelTarget =
    labels || [];

  const markerDefinitions = [];
  const arrowMarkerByColor =
    new Map();

  const records =
    new Map();

  const edgesBySim =
    new Map();

  const registerEdge = (
    record,
    html
  ) => {
    records.set(
      record.key,
      record
    );

    record.simIds.forEach(id => {
      const key =
        String(id);

      if (!edgesBySim.has(key)) {
        edgesBySim.set(
          key,
          new Set()
        );
      }

      edgesBySim
        .get(key)
        .add(record.key);
    });

    paths.push(
      '<g data-relationship-edge-key="' +
      esc(record.key) +
      '">' +
      html +
      '</g>'
    );
  };

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

  const topology =
    getCachedGenealogyTopology(
      visibleIds
    );

  topology.parentGroups.forEach(group => {
    const groupPaths = [];

    drawParentConnectorGroup(
      group,
      pos,
      byId,
      groupPaths,
      labelTarget
    );

    registerEdge(
      {
        key:
          'parent:' +
          group.key,
        kind:'parent',
        group,
        simIds:[
          ...group.parentIds,
          ...group.children
        ].map(String)
      },
      groupPaths.join('')
    );
  });

  const drawnPair =
    new Set();

  const spouseSetting =
    relationshipLineSetting(
      'spouse'
    );

  visibleIds.forEach(id => {
    const sim =
      byId.get(id);

    if (!sim) return;

    (sim.spouseIds || [])
      .forEach(spouseId => {
        if (
          !visibleIds.has(
            spouseId
          )
        ) {
          return;
        }

        const pairK =
          pairKey(
            id,
            spouseId
          );

        if (
          drawnPair.has(
            pairK
          )
        ) {
          return;
        }

        drawnPair.add(
          pairK
        );

        const a =
          pos.get(id);

        const b =
          pos.get(spouseId);

        if (!a || !b) return;

        const geometryResult =
          relationshipPairRenderGeometry(
            a,
            b,
            spouseSetting,
            {
              fromId:id,
              toId:spouseId,
              pos,
              byId,
              geometry
            }
          );

        registerEdge(
          {
            key:
              'spouse:' +
              pairK,
            kind:'pair',
            fromId:String(id),
            toId:String(spouseId),
            setting:spouseSetting,
            labelKind:'spouse',
            edgeClass:'edge edge-spouse',
            simIds:[
              String(id),
              String(spouseId)
            ]
          },
          '<path class="edge edge-spouse" d="' +
          geometryResult.d +
          '"/>'
        );

        if (
          !includeLabels ||
          !showRelLabels ||
          relationshipPerspectiveSimId
        ) {
          return;
        }

        const key =
          'spouse:' +
          pairK;

        const info =
          getRelInfoByKey(
            key,
            'spouse'
          );

        if (!info) return;

        labels.push(
          makeLabelSVG(
            geometryResult.labelX,
            geometryResult.labelY,
            info.icon,
            info.text,
            key
          )
        );
      });
  });

  const drawnDeceased =
    new Set();

  const deceasedSetting = {
    ...relationshipLineSetting(
      'exspouse'
    ),
    routing:'auto'
  };

  visibleIds.forEach(id => {
    const sim =
      byId.get(id);

    if (!sim) return;

    (
      sim.gameData
        ?.deceasedSpouseIds ||
      []
    ).forEach(spouseId => {
      if (
        !visibleIds.has(
          spouseId
        )
      ) {
        return;
      }

      const pairK =
        pairKey(
          id,
          spouseId
        );

      if (
        drawnDeceased.has(
          pairK
        )
      ) {
        return;
      }

      drawnDeceased.add(
        pairK
      );

      const a =
        pos.get(id);

      const b =
        pos.get(spouseId);

      if (!a || !b) return;

      const geometryResult =
        relationshipPairRenderGeometry(
          a,
          b,
          deceasedSetting,
          {
            fromId:id,
            toId:spouseId,
            pos,
            byId,
            geometry
          }
        );

      registerEdge(
        {
          key:
            'deceased-spouse:' +
            pairK,
          kind:'pair',
          fromId:String(id),
          toId:String(spouseId),
          setting:deceasedSetting,
          edgeClass:'edge edge-exspouse',
          simIds:[
            String(id),
            String(spouseId)
          ]
        },
        '<path class="edge edge-exspouse" d="' +
        geometryResult.d +
        '"/>'
      );

      if (
        !includeLabels ||
        !showRelLabels ||
        relationshipPerspectiveSimId
      ) {
        return;
      }

      const key =
        'deceased-spouse:' +
        pairK;

      const info =
        getRelInfoByKey(
          key,
          'deceased-spouse'
        );

      if (!info) return;

      labels.push(
        makeLabelSVG(
          geometryResult.labelX,
          geometryResult.labelY,
          info.icon,
          info.text,
          key
        )
      );
    });
  });

  const drawnEx =
    new Set();

  const exSetting =
    relationshipLineSetting(
      'exspouse'
    );

  visibleIds.forEach(id => {
    const sim =
      byId.get(id);

    if (!sim) return;

    (sim.exSpouseIds || [])
      .forEach(spouseId => {
        if (
          !visibleIds.has(
            spouseId
          )
        ) {
          return;
        }

        const pairK =
          pairKey(
            id,
            spouseId
          );

        if (
          drawnEx.has(
            pairK
          )
        ) {
          return;
        }

        drawnEx.add(
          pairK
        );

        const a =
          pos.get(id);

        const b =
          pos.get(spouseId);

        if (!a || !b) return;

        const geometryResult =
          relationshipPairRenderGeometry(
            a,
            b,
            exSetting,
            {
              fromId:id,
              toId:spouseId,
              pos,
              byId,
              geometry
            }
          );

        registerEdge(
          {
            key:
              'exspouse:' +
              pairK,
            kind:'pair',
            fromId:String(id),
            toId:String(spouseId),
            setting:exSetting,
            labelKind:'exspouse',
            edgeClass:'edge edge-exspouse',
            simIds:[
              String(id),
              String(spouseId)
            ]
          },
          '<path class="edge edge-exspouse" d="' +
          geometryResult.d +
          '"/>'
        );

        if (
          !includeLabels ||
          !showRelLabels ||
          relationshipPerspectiveSimId
        ) {
          return;
        }

        const key =
          'exspouse:' +
          pairK;

        const info =
          getRelInfoByKey(
            key,
            'exspouse'
          );

        if (!info) return;

        labels.push(
          makeLabelSVG(
            geometryResult.labelX,
            geometryResult.labelY,
            info.icon,
            info.text,
            key
          )
        );
      });
  });

  (genealogyData.links || [])
    .forEach(link => {
      if (
        !visibleIds.has(
          link.from
        ) ||
        !visibleIds.has(
          link.to
        )
      ) {
        return;
      }

      const a =
        pos.get(
          link.from
        );

      const b =
        pos.get(
          link.to
        );

      if (!a || !b) return;

      const type =
        relationshipOtherType(
          link
        );

      const setting =
        getOtherRelationshipLineSetting(
          type
        );

      const geometryResult =
        relationshipOtherRenderGeometry(
          a,
          b,
          setting,
          {
            fromId:link.from,
            toId:link.to,
            pos,
            byId,
            geometry
          }
        );

      const markerAttributes =
        bidirectionalMarkerAttributes(
          setting
        );

      registerEdge(
        {
          key:
            'link:' +
            link.id,
          kind:'other',
          link,
          setting,
          simIds:[
            String(link.from),
            String(link.to)
          ]
        },
        '<path class="edge edge-other" d="' +
        geometryResult.d +
        '" style="' +
        relationshipInlineSvgStyle(
          setting,
          'other'
        ) +
        '"' +
        markerAttributes +
        '/>'
      );

      if (
        !includeLabels ||
        !showRelLabels ||
        relationshipPerspectiveSimId
      ) {
        return;
      }

      const key =
        'link:' +
        link.id;

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
          geometryResult.labelX,
          geometryResult.labelY,
          info.icon,
          info.text,
          key
        )
      );
    });

  relationshipEdgeRecords =
    records;

  relationshipEdgesBySim =
    edgesBySim;

  svg.innerHTML =
    (
      markerDefinitions.length
        ? '<defs>' +
          markerDefinitions.join('') +
          '</defs>'
        : ''
    ) +
    paths.join('');

  relationshipEdgeElements =
    new Map();

  svg
    .querySelectorAll(
      '[data-relationship-edge-key]'
    )
    .forEach(element => {
      relationshipEdgeElements.set(
        element.getAttribute(
          'data-relationship-edge-key'
        ),
        element
      );
    });

  if (includeLabels) {
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

    relationshipLabelElements =
      new Map();

    labelsSvg
      .querySelectorAll(
        '.edge-label[data-key]'
      )
      .forEach(element => {
        relationshipLabelElements.set(
          element.getAttribute(
            'data-key'
          ),
          element
        );
      });
  }
}

function relationshipPairPreviewGeometry(
  a,
  b,
  setting
) {
  // main 的拖曳感：拖動途中不做 blocker 判斷，
  // 只有玩家明確指定曲線時才維持曲線。
  if (
    setting.routing === 'manual' &&
    setting.curved
  ) {
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

  const y =
    Math.abs(aY - bY) < 2
      ? (aY + bY) / 2
      : aY;

  const join = {
    x:(aX + bX) / 2,
    y:(aY + bY) / 2
  };

  return {
    d:
      'M' + aX + ' ' + y +
      ' H' + bX,
    labelX:join.x,
    labelY:join.y
  };
}

function relationshipOtherPreviewGeometry(
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

  if (
    setting.routing === 'manual' &&
    setting.curved
  ) {
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

function replaceRelationshipPreviewLabelMarkup(
  markup
) {
  if (!markup) return;

  const scratch =
    document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );

  scratch.innerHTML =
    markup;

  const next =
    scratch.firstElementChild;

  if (!next) return;

  const key =
    next.getAttribute(
      'data-key'
    );

  if (!key) return;

  const current =
    relationshipLabelElements.get(
      key
    );

  if (current) {
    current.replaceWith(next);
  } else {
    labelsSvg.appendChild(next);
  }

  relationshipLabelElements.set(
    key,
    next
  );
}

function updateRelationshipPreviewLabel(
  record,
  x,
  y
) {
  if (
    !showRelLabels ||
    relationshipPerspectiveSimId ||
    !record
  ) {
    return;
  }

  let info = null;

  if (record.kind === 'pair') {
    info =
      getRelInfoByKey(
        record.key,
        record.labelKind
      );
  } else if (
    record.kind === 'other'
  ) {
    const type =
      relationshipOtherType(
        record.link
      );

    info =
      getRelInfoByKey(
        record.key,
        isSiblingLink(record.link)
          ? 'sibling'
          : 'social',
        isSiblingLink(record.link)
          ? null
          : type
      );
  }

  if (!info) return;

  replaceRelationshipPreviewLabelMarkup(
    makeLabelSVG(
      x,
      y,
      info.icon,
      info.text,
      record.key
    )
  );
}

function paintRelationshipPreview(
  simIds
) {
  if (
    !layoutCache ||
    !relationshipEdgeRecords.size
  ) {
    return false;
  }

  // 親屬視角標籤不是 edge-local，而是整體由 root 推導；
  // 這個特殊模式沿用 authoritative full redraw。
  if (relationshipPerspectiveSimId) {
    return false;
  }

  const affectedKeys =
    new Set();

  [...simIds]
    .map(String)
    .forEach(id => {
      (
        relationshipEdgesBySim.get(
          id
        ) ||
        []
      ).forEach(key => {
        affectedKeys.add(key);
      });
    });

  if (!affectedKeys.size) {
    return true;
  }

  const {
    pos,
    byId
  } = layoutCache;

  affectedKeys.forEach(key => {
    const record =
      relationshipEdgeRecords.get(
        key
      );

    const element =
      relationshipEdgeElements.get(
        key
      );

    if (!record || !element) {
      return;
    }

    if (
      record.kind ===
      'parent'
    ) {
      const groupPaths = [];
      const groupLabels = [];

      drawParentConnectorGroup(
        record.group,
        pos,
        byId,
        groupPaths,
        groupLabels,
        {
          collisionRouting:false
        }
      );

      element.innerHTML =
        groupPaths.join('');

      groupLabels.forEach(
        replaceRelationshipPreviewLabelMarkup
      );

      return;
    }

    const fromId =
      record.fromId ||
      record.link?.from;

    const toId =
      record.toId ||
      record.link?.to;

    const a =
      pos.get(
        fromId
      );

    const b =
      pos.get(
        toId
      );

    if (!a || !b) return;

    const path =
      element.querySelector(
        'path'
      );

    if (!path) return;

    if (
      record.kind ===
      'pair'
    ) {
      const result =
        relationshipPairPreviewGeometry(
          a,
          b,
          record.setting
        );

      path.setAttribute(
        'd',
        result.d
      );

      updateRelationshipPreviewLabel(
        record,
        result.labelX,
        result.labelY
      );

      return;
    }

    if (
      record.kind ===
      'other'
    ) {
      const result =
        relationshipOtherPreviewGeometry(
          a,
          b,
          record.setting
        );

      path.setAttribute(
        'd',
        result.d
      );

      updateRelationshipPreviewLabel(
        record,
        result.labelX,
        result.labelY
      );
    }
  });

  return true;
}



// ========【族譜連線】 設定 - 橫向關係接頭像側邊；直向親子線保留完整資訊空間 ========
function getCardAvatarGeometry() {
  const { W:NODE_W } = resolveDefaultCardDimensions();

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
  const key =
    card?.id != null
      ? String(card.id)
      : null;

  if (
    key &&
    layoutCache?.pos?.get(key) === card
  ) {
    const cached =
      layoutCache.geometry
        ?.avatars
        ?.get(key);

    if (cached) {
      return cached;
    }
  }

  return rawCardAvatarRect(
    card
  );
}

function cardOuterRect(card) {
  const key =
    card?.id != null
      ? String(card.id)
      : null;

  if (
    key &&
    layoutCache?.pos?.get(key) === card
  ) {
    const cached =
      layoutCache.geometry
        ?.rects
        ?.get(key);

    if (cached) {
      return cached;
    }
  }

  const dimensions =
    key
      ? getNodeDimensionsById(
          key
        )
      : resolveDefaultCardDimensions();

  return rawCardOuterRect(
    card,
    dimensions
  );
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

function createPartnerConnectionPath(a, b) {
  const {
    aX,
    aY,
    bX,
    bY
  } = getPairConnectionGeometry(a, b);

  // ========【族譜伴侶線】 設定 - 預設直線，手動錯位後使用 H-V-H ========
  // 兩端永遠直接取自卡片左右 anchor，因此不論直線或折線都黏在卡片上。
  const aligned =
    Math.abs(aY - bY) <= 0.75;

  if (aligned) {
    const y =
      (aY + bY) / 2;

    return `M${aX} ${y} H${bX}`;
  }

  const midX =
    (aX + bX) / 2;

  return (
    `M${aX} ${aY}` +
    ` H${midX}` +
    ` V${bY}` +
    ` H${bX}`
  );
}



function buildPersonCardClassList(c, opts) {
  opts = opts || {};
  return [
    'person-card',
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

function paintPersonLayer() {
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
    const cls = buildPersonCardClassList(c, {viewMode:isView, isInlaw});
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
        <div class="person-card-view-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
        ${model.name ? `<div class="person-card-view-name" title="${esc(model.name)}">${esc(model.name)}</div>` : ''}
        ${model.primary.map(renderViewCardLine).join('')}
        ${model.details.map(renderViewCardLine).join('')}
      </div>`;
    }

    // 編輯模式有自己的顯示內容設定，不再跟檢視模式同步。
    const editRows = [];
    if (!cardSettings.name && cardSettings.gender) {
      editRows.push(`<div class="person-card-edit-meta">${esc(uiText(c.gender || '其他'))}</div>`);
    }

    const stageAge = [];
    if (cardSettings.lifeStage) stageAge.push(dStage);
    if (cardSettings.age && c.age != null && c.age !== '') stageAge.push(formatCardAge(c.age));
    if (stageAge.length) editRows.push(`<div class="person-card-edit-meta">${esc(stageAge.join(' · '))}</div>`);

    if (cardSettings.birthday && c.birthdayMonth && c.birthdayDay) {
      editRows.push(`<div class="person-card-edit-meta">${iconSvg('cake2')}<span>${esc(formatBirthdaySummary(c.birthdayMonth, c.birthdayDay, c.birthdayYear))}</span></div>`);
    }

    const statusRace = [];
    if (cardSettings.status) statusRace.push(uiText(c.status || '在世'));
    if (cardSettings.race && c.race && RACE_PRESETS[c.race]) statusRace.push(uiText(RACE_PRESETS[c.race].label));
    if (statusRace.length) editRows.push(`<div class="person-card-edit-meta">${esc(statusRace.join(' · '))}</div>`);

    if (cardSettings.career && c.career) editRows.push(`<div class="person-card-edit-meta person-card-edit-text" title="${esc(dCareer)}">${esc(dCareer)}</div>`);
    if (cardSettings.residence && c.residence) editRows.push(`<div class="person-card-residence" title="${esc(dResidence)}">${iconSvg('house')}${esc(dResidence)}</div>`);
    if (cardSettings.aspiration && c.aspiration) editRows.push(`<div class="person-card-aspiration" title="${esc(uiText('人生抱負'))}：${esc(dAspiration)}">${iconSvg('bullseye')}${esc(dAspiration)}</div>`);
    if (cardSettings.traits && dTraits.length) editRows.push(`<div class="person-card-tags">${buildTagsHTML(c.traits, c)}</div>`);
    if (cardSettings.pets && (c.pets||[]).length) editRows.push(`<div class="person-card-pets">${buildPetsChipsHTML(c.pets, c)}</div>`);
    if (cardSettings.gallery && (c.gallery||[]).length) editRows.push(`<div class="person-card-life-photo-badge" title="${esc(uiText('人生照片'))} ${(c.gallery||[]).length}">${iconSvg('images')} ${(c.gallery||[]).length}</div>`);

    const configuredEditBody = cardSettingsHasBody(cardSettings);
    const editBody = configuredEditBody ? `<div class="person-card-body">
      ${cardSettings.name ? `<div class="person-card-name" title="${esc(displayName)}">${esc(displayName)}</div>` : ''}
      ${editRows.join('') || (cardSettings.name ? '' : `<div class="person-card-edit-meta">—</div>`)}
    </div>` : '';
    const avatarOnlyClass = configuredEditBody ? '' : ' card-avatar-only';

    return `<div class="${cls} mode-edit${genderBarHiddenClass}${avatarOnlyClass}" data-id="${c.id}" data-render-key="${esc(renderKey)}" data-stage="${c.lifeStage}"
      style="left:${p.x+PAD}px;top:${p.y+PAD}px;width:${NODE_W}px;height:${NODE_H}px">
      <div class="person-card-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
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
        layoutCache.geometry
          ?.dimensions
          ?.get(String(id)) ||
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

  getCachedGenealogyTopology(
    layoutCache.visibleIds
  ).parentGroups.forEach(group => {
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

function resizeStageToContent() {
  const fam =
    currentFamily();

  if (
    !isFreeLayoutActive(
      fam
    ) ||
    !layoutCache?.pos
  ) {
    return;
  }

  let maxX = 0;
  let maxY = 0;

  layoutCache.pos.forEach((position, id) => {
    const dimensions =
      layoutCache.geometry
        ?.dimensions
        ?.get(String(id)) ||
      getNodeDimensionsById(
        id
      );

    maxX =
      Math.max(
        maxX,
        position.x +
          dimensions.W
      );

    maxY =
      Math.max(
        maxY,
        position.y +
          dimensions.H
      );
  });

  layoutCache.width =
    maxX;

  layoutCache.height =
    maxY;

  if (layoutCache.geometry) {
    layoutCache.geometry.width =
      maxX;

    layoutCache.geometry.height =
      maxY;
  }

  syncStageGeometryFromLayout();

  // 拖曳結束後做一次 authoritative full redraw；拖曳幀內只更新受影響線條。
  requestRelationshipLayerUpdate();
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

      const topology =
        getCachedGenealogyTopology(
          visibleIds
        );

      return new Map(
        topology.canonicalGenerationBySim
      );
    }

    function withState(fn) { return function () { syncState(); return fn.apply(null, arguments); }; }
    return Object.freeze({
      requestUpdate:requestSceneUpdate,
      renderImmediately:renderSceneImmediately,
      requestRelationshipUpdate:requestRelationshipLayerUpdate,
      requestRelationshipPreviewUpdate,
      invalidateTopologyCache,
      readScenePlan,
      readPersonPosition,
      updateTransientPersonPosition,
      readContentBounds:withState(getVisibleTreeContentBounds),
      findRelationshipSnapTargets:withState(getRelationshipPositionSnap),
      createDragGeometrySnapshot:withState(buildDragPerformanceGeometry),
      createSingleDragRelationshipTargets:withState(buildSingleDragRelationshipTargets),
      resizeStageToContent:withState(resizeStageToContent),
      measurePersonCard:withState(getNodeDimensions),
      measurePersonCardById:withState(getNodeDimensionsById),
      isFreeLayoutActive:withState(isFreeLayoutActive),
      mapGenerationLevels:getGenerationLevels,
      syncStageBounds:withState(syncStageGeometryFromLayout)
    });
  }
  global.L1nGGenealogyScene = Object.freeze({ create });
})(window);