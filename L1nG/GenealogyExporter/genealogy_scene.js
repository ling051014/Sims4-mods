/* ========【L1nG Genealogy Scene】 設定 - Canvas Layout / Geometry / Renderer Authority ======== */
(function (global) {
  'use strict';
  function create({ runtime, dom, constants, state, helpers } = {}) {
    if (!dom || !state || !helpers) throw new Error('Genealogy Scene requires dom, state, and helpers.');
    const genealogyRuntime = runtime || null;
    const { stage, svg, labelsSvg, nodes, pets:petLayer } = dom;
    if (!stage || !svg || !labelsSvg || !nodes || !petLayer) throw new Error('Genealogy Scene requires Canvas DOM references.');
    const { PAD, RACE_PRESETS, GUIDE_SNAP_PX, RELATIONSHIP_VERTICAL_SNAP_PX } = constants;

    // ========【Scene 卡片幾何】 設定 - 卡片尺寸 / 間距 / 檢視版型由 Scene 唯一持有 ========
    const NODE_DIMS = Object.freeze({
      edit:Object.freeze({ W:220, H:148 }),
      view:Object.freeze({ W:136, H:118 })
    });

    const PET_VIEW_DIMS = Object.freeze({ W:148,H:126 });
    const PET_EDIT_DIMS = Object.freeze({ W:190,H:84 });
    const PET_CARD_GAP = 12;
    const PET_ROW_GAP = 13;
    const PET_GROUP_GAP = 30;
    const PET_SIDE_GAP = 26;
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
      buildPersonPresentation,
      getActiveFamilySelectorEntry, currentTreeFamily, currentFamily, uiText, displayDataText,
      displayRelationshipText, isSiblingLink, resolveKinshipLabel, relationshipPerspectiveSim,
      clampRelationshipCurveAmount, relationshipLineSetting, relationshipOtherType,
      getOtherRelationshipLineSetting, isSymmetricSocialRelationshipType, relationshipResolvedColor, relationshipInlineSvgStyle,
      relationshipLayoutPriority, genealogyParentIds, genealogyParentRelationGroups, getChildrenOf, getRelInfoByKey,
      getVisibleIds, syncNodeSelectionClasses, formatBirthdaySummary, esc, iconSvg, pairKey,
      avatarHTML, renderTraitTagSummary, renderPetChipSummary, genderClass, statusClass,
      showPetCards, petCardAvatarHTML, petCardSpeciesLabel, petCardGenderLabel, getPetCardSettings,
      syncPetSelectionClasses
    } = helpers;
    // Scene owns canvas-only presentation and relationship-label SVG markup.
    // ========【檢視卡片內容模型】 設定 - 文字列與卡片 HTML 都由 Scene 統一組裝 ========
    function buildViewCardContentModel(sim, settings = getCardViewSettings()) {
      const presentation =
        buildPersonPresentation(sim);

      if (!presentation) {
        return {
          name:'',
          primary:[],
          details:[],
          hasText:false
        };
      }

      const name =
        settings.name
          ? presentation.name
          : '';

      const primary = [];

      const stageAge = [];

      if (settings.lifeStage) {
        stageAge.push(
          presentation.lifeStage.text
        );
      }

      if (
        settings.age &&
        sim.age != null &&
        sim.age !== ''
      ) {
        stageAge.push(
          formatCardAge(sim.age)
        );
      }

      if (stageAge.length) {
        primary.push({
          text:stageAge.join(' · ')
        });
      }

      if (
        settings.birthday &&
        sim.birthdayMonth &&
        sim.birthdayDay
      ) {
        primary.push({
          text:presentation.birthdayText,
          icon:'cake2'
        });
      }

      const statusRace = [];

      if (settings.status) {
        statusRace.push(
          presentation.status.text
        );
      }

      if (
        settings.race &&
        presentation.race
      ) {
        statusRace.push(
          presentation.race.text
        );
      }

      if (statusRace.length) {
        primary.push({
          text:statusRace.join(' · ')
        });
      }

      const details = [];

      if (
        settings.career &&
        presentation.career
      ) {
        details.push({
          text:presentation.career,
          detail:true
        });
      }

      if (
        settings.residence &&
        presentation.residence
      ) {
        details.push({
          text:presentation.residence,
          icon:'house',
          detail:true
        });
      }

      if (
        settings.aspiration &&
        presentation.aspiration
      ) {
        details.push({
          text:presentation.aspiration,
          icon:'bullseye',
          detail:true
        });
      }

      if (
        settings.traits &&
        presentation.traits.length
      ) {
        details.push({
          text:presentation.traits.join(' / '),
          detail:true
        });
      }

      if (
        settings.pets ||
        settings.gallery
      ) {
        const mediaBits = [];

        if (
          settings.pets &&
          (sim.pets || []).length
        ) {
          mediaBits.push(
            `${uiText('寵物')} ${(sim.pets || []).length}`
          );
        }

        if (
          settings.gallery &&
          (sim.gallery || []).length
        ) {
          mediaBits.push(
            `${uiText('人生照片')} ${(sim.gallery || []).length}`
          );
        }

        if (mediaBits.length) {
          details.push({
            text:mediaBits.join(' · ')
          });
        }
      }

      return {
        name,
        primary,
        details,
        hasText:!!(
          name ||
          primary.length ||
          details.length
        )
      };
    }

    function renderViewCardLine(line) {
      const className = `person-card-view-meta${line.detail ? ' person-card-view-text' : ''}`;
      const title = line.text ? ` title="${esc(line.text)}"` : '';
      const body = line.icon
        ? `${iconSvg(line.icon)}<span>${esc(line.text)}</span>`
        : esc(line.text);

      return `<div class="${className}"${title}>${body}</div>`;
    }

    function cardGenderIconHTML(gender) {
      const value =
        String(gender || '其他');

      const icon =
        value === '男'
          ? 'gender-card-male'
          : value === '女'
            ? 'gender-card-female'
            : 'gender-card-other';

      const label =
        uiText(value || '其他');

      return (
        '<span class="person-card-gender-icon" ' +
        'role="img" aria-label="' +
        esc(label) +
        '" title="' +
        esc(label) +
        '">' +
          iconSvg(icon) +
        '</span>'
      );
    }

    function formatCardAge(age) {
      if (age == null || age === '') return '';
      return (document.documentElement.lang || 'zh-Hant') === 'en' ? `${age} ${uiText('歲')}` : `${age} ${uiText('歲')}`;
    }



    function getLabelOffset(key) {
      if (!key) return { dx:0, dy:0 };
      const o = (getData()?.labelPositions || {})[key] || {};
      return { dx: o.dx || 0, dy: o.dy || 0 };
    }

    const RELATIONSHIP_LABEL_TEXT_CACHE_LIMIT = 3000;

    function relationshipLabelFontStack() {
      const language =
        document.documentElement.lang ||
        'zh-Hant';

      if (language === 'zh-Hans') {
        return '"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif';
      }

      if (language === 'en') {
        return '"Segoe UI",Inter,Arial,system-ui,sans-serif';
      }

      return '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
    }

    const relationshipLabelTextMetrics = (() => {
      const canvas =
        document.createElement(
          'canvas'
        );

      const context =
        canvas.getContext('2d');

      const widths =
        new Map();

      return {
        width(text, fontSize) {
          const font =
            relationshipLabelFontStack();

          const source =
            String(text ?? '');

          const size =
            Number(fontSize) || 12;

          const cacheKey =
            [font, size, source]
              .join('\u0001');

          if (widths.has(cacheKey)) {
            return widths.get(cacheKey);
          }

          context.font =
            `${size}px ${font}`;

          const width =
            context.measureText(
              source
            ).width;

          if (
            widths.size >=
            RELATIONSHIP_LABEL_TEXT_CACHE_LIMIT
          ) {
            widths.clear();
          }

          widths.set(
            cacheKey,
            width
          );

          return width;
        }
      };
    })();

    function measureRelationshipLabelText(
      text,
      fontSize
    ) {
      return relationshipLabelTextMetrics
        .width(
          text,
          fontSize
        );
    }

    const RELATIONSHIP_LABEL_ICON_SPRITE =
      '../../html%20icons/relationship-label-icons.svg?v=20260930-relationship-catalog';

    function makeLabelSVG(x, y, iconName, text, key) {
      const fs = 12;
      const displayText =
        displayRelationshipText(text);

      const safeIcon =
        String(iconName || '')
          .replace(
            /[^a-z0-9-]/gi,
            ''
          );

      const hasIcon =
        !!safeIcon;

      const iconSize = 11;
      const iconGap = 4;

      const textWidth =
        measureRelationshipLabelText(
          displayText,
          fs
        );

      const contentWidth =
        textWidth +
        (
          hasIcon
            ? iconSize + iconGap
            : 0
        );

      // 依實際顯示語言量測；英文較長時標籤會自動擴寬，不再被裁切。
      const w =
        Math.max(
          Math.ceil(
            contentWidth + 24
          ),
          42
        );

      const h = 22;
      const contentStart =
        -contentWidth / 2;

      const iconX =
        contentStart;

      const iconY =
        -iconSize / 2;

      const textX =
        hasIcon
          ? contentStart +
            iconSize +
            iconGap
          : 0;

      const off =
        getLabelOffset(key);

      const tx =
        (x + off.dx)
          .toFixed(1);

      const ty =
        (y + off.dy)
          .toFixed(1);

      const keyAttr =
        key
          ? ` data-key="${esc(key)}"`
          : '';

      const iconMarkup =
        hasIcon
          ? `<use
              class="edge-label-icon"
              href="${RELATIONSHIP_LABEL_ICON_SPRITE}#rel-${safeIcon}"
              x="${iconX.toFixed(1)}"
              y="${iconY.toFixed(1)}"
              width="${iconSize}"
              height="${iconSize}"
              aria-hidden="true"
            />`
          : '';

      return `<g
        class="edge-label"
        ${keyAttr}
        data-x="${x.toFixed(1)}"
        data-y="${y.toFixed(1)}"
        transform="translate(${tx},${ty})"
      >
        <rect
          x="${(-w / 2).toFixed(1)}"
          y="${-h / 2}"
          width="${w.toFixed(1)}"
          height="${h}"
          rx="${h / 2}"
          fill="var(--relationship-label-surface)"
          stroke="var(--relationship-label-border)"
          stroke-width="1.5"
        />
        ${iconMarkup}
        <text
          class="edge-label-text"
          x="${textX.toFixed(1)}"
          y="0"
          text-anchor="${hasIcon ? 'start' : 'middle'}"
          dominant-baseline="middle"
        >${esc(displayText)}</text>
      </g>`;
    }


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
          measureRelationshipLabelText(
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
          ? (
              String(viewMode) +
              '\u0001' +
              String(sim.id)
            )
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

  const bend = Math.min(36,distance * relationshipCurveFactor(curveAmount)) *
    (direction < 0 ? -1 : 1);

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

  // 配偶 / 前任 / 已故配偶的預設幾何固定為正交線：
  // 同高時 H；手動拖離同一列後 H-V-H。
  // 只有玩家明確把該關係切成手動曲線時，才允許曲線。
  const useCurve =
    setting.routing === 'manual' &&
    !!setting.curved;

  if (!useCurve) {
    const join =
      pairJoinPoint(
        a,
        b
      );

    return {
      d:
        createPartnerConnectionPath(
          a,
          b
        ),
      labelX:join.x,
      labelY:join.y
    };
  }

  const blocker =
    relationshipBlockingCard(
      routeContext,
      aX,
      aY,
      bX,
      bY
    );

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

// ========【其他關係線避障】 設定 - 統一遵守視覺設定，尋找最短且不穿越卡片的路徑 ========
function relationshipRouteRects(context,start,end) {
  if(!context?.pos)return [];
  const excluded=new Set([String(context.fromId||''),String(context.toId||'')]);
  const result=[];
  context.pos.forEach((position,id)=>{
    if(!position||excluded.has(String(id)))return;
    const rect=context.geometry?.rects?.get(String(id))||cardOuterRect(position);
    if(rect.right<Math.min(start.x,end.x)-230||rect.left>Math.max(start.x,end.x)+230||
       rect.bottom<Math.min(start.y,end.y)-260||rect.top>Math.max(start.y,end.y)+260)return;
    result.push(rect);
  });
  return result;
}

function relationshipSegmentsClear(points,rects) {
  return points.every((point,i)=>i===0||!rects.some(rect=>
    relationshipSegmentIntersectsRect(points[i-1].x,points[i-1].y,point.x,point.y,rect,9)));
}

function relationshipOrthogonalRoute(start,end,rects,upperOnly=false,clearance=15) {
  if(relationshipSegmentsClear([start,end],rects))return [start,end];
  const xValues=new Set([start.x,end.x]),yValues=new Set([start.y,end.y]);
  rects.forEach(rect=>{
    xValues.add(rect.left-clearance);xValues.add(rect.right+clearance);
    yValues.add(rect.top-clearance);yValues.add(rect.bottom+clearance);
  });
  const X=[...xValues].sort((a,b)=>a-b),Y=[...yValues].sort((a,b)=>a-b);
  const nx=X.length,ny=Y.length,index=(x,y)=>y*nx+x;
  const source=index(X.indexOf(start.x),Y.indexOf(start.y));
  const target=index(X.indexOf(end.x),Y.indexOf(end.y));
  const valid=new Uint8Array(nx*ny);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)valid[index(x,y)]=rects.some(r=>
    X[x]>r.left-9&&X[x]<r.right+9&&Y[y]>r.top-9&&Y[y]<r.bottom+9)?0:1;
  valid[source]=1;valid[target]=1;
  const distances=new Map([[source*3+2,0]]),prev=new Map(),open=[{key:source*3+2,dist:0}];
  let last=null;
  while(open.length){
    // 一般畫布只需要繞過少數卡片；不掃描整個族譜做多輪全域排列。
    open.sort((a,b)=>b.dist-a.dist);
    const next=open.pop();
    if(next.dist!==distances.get(next.key))continue;
    const current=Math.floor(next.key/3),direction=next.key%3;
    if(current===target){last=next.key;break;}
    const x=current%nx,y=Math.floor(current/nx);
    for(const [xx,yy,axis] of [[x-1,y,0],[x+1,y,0],[x,y-1,1],[x,y+1,1]]){
      if(xx<0||xx>=nx||yy<0||yy>=ny)continue;
      const adjacent=index(xx,yy);
      if(upperOnly && Y[yy]>Math.max(start.y,end.y)+1)continue;
      if(!valid[adjacent])continue;
      const p={x:X[x],y:Y[y]},q={x:X[xx],y:Y[yy]};
      if(!relationshipSegmentsClear([p,q],rects))continue;
      const cost=next.dist+Math.hypot(p.x-q.x,p.y-q.y)+(direction!==2&&direction!==axis?16:0);
      const key=adjacent*3+axis;
      if(cost>=(distances.get(key)??Infinity))continue;
      distances.set(key,cost);prev.set(key,next.key);open.push({key,dist:cost});
    }
  }
  if(last===null)return null;
  const route=[];
  for(let key=last;key!==undefined;key=prev.get(key)){
    const n=Math.floor(key/3);
    route.push({x:X[n%nx],y:Y[Math.floor(n/nx)]});
  }
  route.reverse();
  const simplified=[];
  route.forEach(point=>{
    while(simplified.length>=2){
      const p=simplified[simplified.length-2],q=simplified[simplified.length-1];
      if((p.x===q.x&&q.x===point.x)||(p.y===q.y&&q.y===point.y))simplified.pop();
      else break;
    }
    simplified.push(point);
  });
  return simplified;
}

// ========【真正的曲線】 設定 - cubic Bézier 連續曲率，非折線加圓角 ========
function relationshipRouteLabelPoint(points) {
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
  const midpoint=lengths.reduce((sum,length)=>sum+length,0)/2;
  let distance=0;
  for(let index=0;index<lengths.length;index++){
    if(distance+lengths[index]>=midpoint){
      const t=lengths[index]?(midpoint-distance)/lengths[index]:0;
      return {
        x:points[index].x+(points[index+1].x-points[index].x)*t,
        y:points[index].y+(points[index+1].y-points[index].y)*t
      };
    }
    distance+=lengths[index];
  }
  return points[Math.floor(points.length/2)];
}

function relationshipStraightRoute(points) {
  const label=relationshipRouteLabelPoint(points);
  return {
    d:points.map((p,i)=>(i?' L':'M')+p.x+' '+p.y).join(''),
    labelX:label.x,labelY:label.y,points
  };
}

function relationshipCubicAt(segment,t) {
  const u=1-t;
  const from=segment.from,to=segment.to,c1=segment.c1,c2=segment.c2;
  return {
    x:u*u*u*from.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*to.x,
    y:u*u*u*from.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*to.y
  };
}

function relationshipCubicClear(segments,rects) {
  // 驗證實際曲線而不是只驗證控制點或折線。
  // 小段曲線提高取樣密度，避免窄卡片被略過。
  return segments.every(segment=>{
    const length=Math.hypot(segment.to.x-segment.from.x,segment.to.y-segment.from.y);
    const steps=Math.max(32,Math.min(160,Math.ceil(length/3)));
    for(let step=1;step<steps;step++){
      const p=relationshipCubicAt(segment,step/steps);
      if(rects.some(rect=>
        p.x>=rect.left-9&&p.x<=rect.right+9&&
        p.y>=rect.top-9&&p.y<=rect.bottom+9
      ))return false;
    }
    return true;
  });
}

function relationshipCubicGeometry(segments) {
  if(!segments.length)return null;
  const d=['M'+segments[0].from.x+' '+segments[0].from.y];
  segments.forEach(segment=>{
    d.push('C'+segment.c1.x+' '+segment.c1.y+' '+
      segment.c2.x+' '+segment.c2.y+' '+
      segment.to.x+' '+segment.to.y);
  });
  // 標籤落在實際平滑曲線中央，而非折線原本的拐角。
  const lengths=segments.map(segment=>{
    let length=0,previous=segment.from;
    for(let i=1;i<=24;i++){
      const current=relationshipCubicAt(segment,i/24);
      length+=Math.hypot(current.x-previous.x,current.y-previous.y);
      previous=current;
    }
    return length;
  });
  const half=lengths.reduce((sum,value)=>sum+value,0)/2;
  let walked=0,label=segments[0].from;
  for(let i=0;i<segments.length;i++){
    if(walked+lengths[i]>=half){
      let consumed=0,previous=segments[i].from;
      for(let step=1;step<=48;step++){
        const point=relationshipCubicAt(segments[i],step/48);
        consumed+=Math.hypot(point.x-previous.x,point.y-previous.y);
        if(walked+consumed>=half){label=point;break;}
        previous=point;
      }
      break;
    }
    walked+=lengths[i];
  }
  return {d:d.join(' '),labelX:label.x,labelY:label.y,segments};
}

function relationshipArcCandidate(start,end,amplitude,sign) {
  const dx=end.x-start.x,dy=end.y-start.y;
  const length=Math.max(1,Math.hypot(dx,dy));
  const nx=-dy/length,ny=dx/length;
  const normal=amplitude*sign;
  return [{
    from:start,
    c1:{x:start.x+dx*0.28+nx*normal,y:start.y+dy*0.28+ny*normal},
    c2:{x:end.x-dx*0.28+nx*normal,y:end.y-dy*0.28+ny*normal},
    to:end
  }];
}

// ========【弧度滑桿與實際曲線】 設定 - 在安全避障空間內連續調整弧度 ========
// ========【弧度優先權】 設定 - 預設找最小安全弧度，玩家手動值不再被避障演算法覆蓋 ========
function relationshipCurveAmplitude(start,end,amount) {
  const span=Math.hypot(end.x-start.x,end.y-start.y);
  const max=Math.max(90,Math.min(230,span*0.65));
  return 8+(max-8)*(clampRelationshipCurveAmount(amount)-10)/90;
}

function relationshipUpperCurveSign(start,end) {
  // SVG 的 Y 軸向下；無論人物排列左右如何，預設曲線只往上拱。
  return end.x>=start.x ? -1 : 1;
}

function relationshipRecommendedCurveAmount(start,end,rects,minAmount=50) {
  const sign=relationshipUpperCurveSign(start,end);
  // 自動弧度不能從視覺上幾乎水平的 10% 起算。
  for(let amount=clampRelationshipCurveAmount(minAmount);amount<=100;amount++){
    const segments=relationshipArcCandidate(
      start,end,relationshipCurveAmplitude(start,end,amount),sign
    );
    if(relationshipCubicClear(segments,rects))return amount;
  }
  return null;
}

const defaultOtherCurveCache=new Map();
function recommendOtherRelationshipCurveAmount(type) {
  if(defaultOtherCurveCache.has(type))return defaultOtherCurveCache.get(type);
  if(!layoutCache?.pos||!layoutCache?.byId)return null;
  const {pos,byId,visibleIds,geometry}=layoutCache;
  const relations=[
    ...(genealogyData.links||[]),
    ...inferCoParentRelationshipLinks(
      buildParentChildConnectorGroups(byId,visibleIds),byId
    )
  ];
  let required=10,found=false;
  relations.forEach(link=>{
    if(relationshipOtherType(link)!==type)return;
    const from=pos.get(String(link.from)),to=pos.get(String(link.to));
    if(!from||!to)return;
    found=true;
    const start=avatarBoundaryAnchor(from,to);
    const end=avatarBoundaryAnchor(to,from);
    const rects=relationshipRouteRects({pos,byId,geometry,fromId:link.from,toId:link.to},start,end);
    const value=relationshipRecommendedCurveAmount(start,end,rects);
    // 少數家族沒有上方安全單弧通道，保留最大值給後續避障分支。
    required=Math.max(required,value??100);
  });
  const result=found?required:null;
  defaultOtherCurveCache.set(type,result);
  return result;
}

function relationshipSmoothRoute(points,rects,amount) {
  const lengths=points.slice(1).map((p,i)=>
    Math.hypot(p.x-points[i].x,p.y-points[i].y)
  );
  const normalized=(clampRelationshipCurveAmount(amount)-10)/90;
  const desired=0.04+0.42*normalized;
  // 只有真正發生碰撞才縮小切線；以滑桿要求值作為第一優先。
  const strengths=[desired,...[0.04,0.10,0.17,0.25,0.33,0.40,0.46]
    .filter(x=>Math.abs(x-desired)>0.001)
    .sort((a,b)=>Math.abs(a-desired)-Math.abs(b-desired))];
  for(const factor of strengths){
    const tangents=points.map((p,i)=>{
      const before=points[Math.max(i-1,0)],after=points[Math.min(i+1,points.length-1)];
      const dx=after.x-before.x,dy=after.y-before.y;
      const distance=Math.hypot(dx,dy)||1;
      const reach=i===0?lengths[0]:i===points.length-1?lengths[i-1]:
        Math.min(lengths[i-1],lengths[i]);
      return {x:dx/distance*reach*factor,y:dy/distance*reach*factor};
    });
    const segments=points.slice(1).map((point,index)=>({
      from:points[index],
      c1:{x:points[index].x+tangents[index].x,y:points[index].y+tangents[index].y},
      c2:{x:point.x-tangents[index+1].x,y:point.y-tangents[index+1].y},
      to:point
    }));
    if(relationshipCubicClear(segments,rects))
      return relationshipCubicGeometry(segments);
  }
  return null;
}

// 避障路徑轉角改用連續三次曲線，不能在「曲線」設定下退回直角折線。
function relationshipRoundedObstacleRoute(points,rects) {
  if(!points||points.length<3)return null;
  const segments=[];
  let current=points[0];
  const append=target=>{
    if(Math.hypot(target.x-current.x,target.y-current.y)<0.001)return;
    segments.push({from:current,
      c1:{x:current.x+(target.x-current.x)/3,y:current.y+(target.y-current.y)/3},
      c2:{x:current.x+(target.x-current.x)*2/3,y:current.y+(target.y-current.y)*2/3},
      to:target});
    current=target;
  };
  for(let i=1;i<points.length-1;i++){
    const prev=points[i-1],corner=points[i],next=points[i+1];
    const a=Math.hypot(corner.x-prev.x,corner.y-prev.y);
    const b=Math.hypot(next.x-corner.x,next.y-corner.y);
    if(!a||!b)continue;
    const radius=Math.min(20,a*0.45,b*0.45);
    const entry={x:corner.x+(prev.x-corner.x)*radius/a,y:corner.y+(prev.y-corner.y)*radius/a};
    const exit={x:corner.x+(next.x-corner.x)*radius/b,y:corner.y+(next.y-corner.y)*radius/b};
    append(entry);
    segments.push({from:entry,c1:corner,c2:corner,to:exit});
    current=exit;
  }
  append(points[points.length-1]);
  return relationshipCubicClear(segments,rects)?relationshipCubicGeometry(segments):null;
}


function relationshipUpperDetourGeometry(start,end,rects) {
  // 單弧無法避障時，從人物上方尋找平滑通道；不能因直線可走就畫成平線。
  // 每個候選都以真正的曲線碰撞檢查通過後才採用。
  const baseline=Math.min(start.y,end.y);
  for(const rise of [55,85,120,165,210,270,340,430]){
    const y=baseline-rise;
    const points=[start,{x:start.x,y},{x:end.x,y},end];
    const curved=relationshipRoundedObstacleRoute(points,rects);
    if(curved)return curved;
  }
  return null;
}

function relationshipOtherRenderGeometry(a,b,setting,context=null) {
  const from=avatarBoundaryAnchor(a,b),to=avatarBoundaryAnchor(b,a);
  const start={x:from.x,y:from.y},end={x:to.x,y:to.y};
  const rects=relationshipRouteRects(context,start,end);

  if(!setting.curved){
    return relationshipStraightRoute(relationshipOrthogonalRoute(start,end,rects)||[start,end]);
  }

  const amount=clampRelationshipCurveAmount(setting.curveAmount);
  const sign=relationshipUpperCurveSign(start,end);
  const segments=relationshipArcCandidate(start,end,
    relationshipCurveAmplitude(start,end,amount),sign
  );

  // 玩家指定弧度維持原樣，不強制替換其數值。
  if(setting.curveAmountManual===true)return relationshipCubicGeometry(segments);

  // 每一條曲線依目前的卡片重新驗證，不沿用同類型其他線的避障結果。
  const safeAmount=relationshipRecommendedCurveAmount(start,end,rects,Math.max(50,amount));
  if(safeAmount!==null){
    return relationshipCubicGeometry(relationshipArcCandidate(start,end,
      relationshipCurveAmplitude(start,end,safeAmount),sign));
  }

  // 單弧不安全時，尋找上方通道，並且保持真正的曲線。
  const points=relationshipOrthogonalRoute(start,end,rects,true,35);
  if(points?.length>=3){
    const smooth=relationshipSmoothRoute(points,rects,Math.max(50,amount));
    if(smooth)return smooth;
    const rounded=relationshipRoundedObstacleRoute(points,rects);
    if(rounded)return rounded;
  }
  // 原路徑搜尋可能回傳只有兩點的直線；在曲線模式下不接受這個結果。
  const detour=relationshipUpperDetourGeometry(start,end,rects);
  if(detour)return detour;
  // 沒有安全通道時仍可能重疊；至少不違反「改用曲線」的設定。
  return relationshipCubicGeometry(segments);
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
  return Math.max(Math.ceil(measureRelationshipLabelText(displayText, fs) + iconSpace + 24), 42);
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

    // 前任與已故配偶應優先於情人／一般社交關係；
    // 共同子女是血緣證據，但不得搶走現任或前任唯一的相鄰位置。
    if (meta.kind === 'exspouse') return 440;
    if (meta.kind === 'deceased-spouse') return 430;
    if (meta.kind === 'parent-group') return 400;
    if (meta.kind === 'social') return 250;

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

          // 同一個實際家庭的同代成員應連續，不再被其他家庭群組穿插。
          const leftHousehold=[...genealogyUnitHouseholds(model.unitById.get(leftId))].sort()[0]||'~';
          const rightHousehold=[...genealogyUnitHouseholds(model.unitById.get(rightId))].sort()[0]||'~';
          return (
            leftHousehold.localeCompare(rightHousehold) ||
            leftGroup.localeCompare(rightGroup) ||
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

  // ========【第三輪父母錨點空間】 依真實親子錨點預留完整家系移動空間 ========
  const singleGroupAnchorByOwner = new Map();
  const parentGroupByKey = new Map(
    (model.parentGroups || []).map(group => [group.key,group])
  );

  const singleGroupAnchorOffset = (unit, group, childIds, widths, siblingGap) => {
    const relation = parentGroupByKey.get(group.groupKey);
    if (!relation ||
        relation.parentIds.some(id => model.unitBySim.get(id)?.id !== unit.id) ||
        relation.children.some(id => ownership.ownerParentByUnit.get(
          model.unitBySim.get(id)?.id
        ) !== unit.id)) return null;

    const sourceX = genealogyGroupSourceX(relation,model);
    if (!Number.isFinite(sourceX)) return null;
    const sourceLocalX = sourceX-unit.x;

    let cursor=0,minX=Infinity,maxX=-Infinity;
    childIds.forEach((childUnitId,index) => {
      const childUnit=model.unitById.get(childUnitId);
      const span=widths[index];
      if (!childUnit) return;
      const localCardX=(span-childUnit.width)/2;
      relation.children.forEach(childId => {
        if (model.unitBySim.get(childId)?.id !== childUnitId) return;
        const geometry=genealogyUnitMemberRelationshipGeometry(childUnit,childId);
        if (!geometry) return;
        const anchorX=cursor+localCardX+geometry.anchorLocalX;
        minX=Math.min(minX,anchorX);
        maxX=Math.max(maxX,anchorX);
      });
      cursor+=span+siblingGap;
    });
    if (!Number.isFinite(minX)||!Number.isFinite(maxX)) return null;
    return {
      sourceLocalX,
      childrenBias:(minX+maxX)/2-(cursor-siblingGap)/2
    };
  };

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
        .sort((left,right)=>{
          // 父母群組仍是不可拆分區塊；其順序再盡量讓同住家庭相鄰。
          const household=group=>{
            const counts=new Map();
            group.childIds.forEach(childId=>{
              genealogyUnitHouseholds(model.unitById.get(childId)).forEach(id=>
                counts.set(id,(counts.get(id)||0)+1));
            });
            return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||'~';
          };
          return household(left).localeCompare(household(right))||
            String(left.groupKey).localeCompare(String(right.groupKey));
        });

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

    let reservedWidth=childrenWidth;
    if (groups.length===1 && groupWidths.length===1) {
      const one=groups[0];
      const childWidths=one.childIds.map(childId => widthByUnit.get(childId) ||
        model.unitById.get(childId)?.width || 0);
      const offset=singleGroupAnchorOffset(
        unit,one,one.childIds,childWidths,SIBLING_GAP
      );
      if (offset) {
        reservedWidth+=2*Math.abs(
          offset.sourceLocalX-unit.width/2-offset.childrenBias
        );
        singleGroupAnchorByOwner.set(unitId,one.groupKey);
      }
    }
    const width=Math.max(unit.width,reservedWidth);

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
    singleGroupAnchorByOwner,
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
    singleGroupAnchorByOwner,
    siblingGap,
    parentGroupGap
  } = metrics;

  const primaryRoots =
    genealogyOrderRootFamilyBlocks(
      [...ownership.primaryUnitIds].filter(unitId=>
        !ownership.ownerParentByUnit.has(unitId)
      ),
      model,ownership
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

    // 單一共同父母群組：整個子孫區塊依真實錨點平移，維持世代與兄弟排序。
    if (groups.length === 1 &&
        singleGroupAnchorByOwner.get(unitId) === groups[0].groupKey) {
      const relation = (model.parentGroups || []).find(
        entry => entry.key === groups[0].groupKey
      );
      if (relation) {
        const anchors = relation.children
          .map(id => genealogyChildAnchorX(id,model))
          .filter(Number.isFinite);
        const source = genealogyGroupSourceX(relation,model);
        if (anchors.length && Number.isFinite(source)) {
          const delta = source - (Math.min(...anchors)+Math.max(...anchors))/2;
          if (Math.abs(delta) > 0.01) {
            const movable = new Set();
            const queue = [...groups[0].childIds];
            while (queue.length) {
              const next = queue.shift();
              if (movable.has(next)) continue;
              movable.add(next);
              (ownership.primaryChildren.get(next) || []).forEach(child => {
                if (ownership.ownerParentByUnit.get(child) === next) queue.push(child);
              });
            }
            const units = [...movable].map(id => model.unitById.get(id)).filter(Boolean);
            const bounds = blockBoundsByUnit.get(unitId);
            if (units.length && bounds &&
                Math.min(...units.map(child => child.x+delta)) >= bounds.left-0.01 &&
                Math.max(...units.map(child => child.x+child.width+delta)) <= bounds.right+0.01) {
              units.forEach(child => { child.x += delta; });
            }
          }
        }
      }
    }
  };

  // 先替每一家系預留所有同代外部關係卡的寬度，避免插進鄰近血緣分支。
  const attachmentByRoot=new Map();
  layers.forEach(layer=>layer.forEach(unit=>{
    if(ownership.primaryUnitIds.has(unit.id))return;
    const ownerId=ownership.attachmentOwnerByUnit.get(unit.id);
    const rootId=ownership.rootByUnit.get(ownerId)||ownerId;
    if(!rootId||!ownership.primaryUnitIds.has(rootId))return;
    if(!attachmentByRoot.has(rootId))attachmentByRoot.set(rootId,new Map());
    const byGeneration=attachmentByRoot.get(rootId);
    if(!byGeneration.has(unit.generation))byGeneration.set(unit.generation,{left:[],right:[]});
    const side=ownership.attachmentSideByUnit.get(unit.id)||1;
    byGeneration.get(unit.generation)[side<0?'left':'right'].push(unit);
  }));
  const rootPadding=new Map();
  attachmentByRoot.forEach((generations,rootId)=>{
    let left=0,right=0;
    generations.forEach(items=>{
      left=Math.max(left,items.left.reduce((sum,u)=>sum+u.width+siblingGap,0));
      right=Math.max(right,items.right.reduce((sum,u)=>sum+u.width+siblingGap,0));
    });
    rootPadding.set(rootId,{left,right});
  });
  const rootBounds=new Map();
  let cursorX=0;
  const placeRoot=rootId=>{
    const unit=model.unitById.get(rootId);
    if(!unit)return;
    const width=widthByUnit.get(rootId)||unit.width;
    const pad=rootPadding.get(rootId)||{left:0,right:0};
    cursorX+=pad.left;
    placeBranch(rootId,cursorX);
    rootBounds.set(rootId,{left:cursorX,right:cursorX+width});
    cursorX+=width+pad.right+parentGroupGap;
  };
  primaryRoots.forEach(placeRoot);

  // 非典型跨家庭／循環資料不插入既有家系區塊，而是追加獨立區塊。
  [...ownership.primaryUnitIds]
    .filter(id=>!placed.has(id))
    .sort((a,b)=>compareFamilyBranchPath(
      ownership.pathByUnit.get(a),ownership.pathByUnit.get(b))||
      stableGenealogyUnitCompare(model.unitById.get(a),model.unitById.get(b)))
    .forEach(placeRoot);

  const placedAttachments=new Set();
  attachmentByRoot.forEach((generations,rootId)=>{
    const bound=rootBounds.get(rootId);
    if(!bound)return;
    generations.forEach(items=>{
      // left 的內側應是前任／配偶，其他關係依序向外；right 反之。
      const sorted=layers.get([...items.left,...items.right][0]?.generation)||[];
      const ordered=side=>items[side].sort((a,b)=>sorted.indexOf(a)-sorted.indexOf(b));
      let x=bound.left;
      [...ordered('left')].reverse().forEach(unit=>{
        x-=unit.width+siblingGap;
        unit.x=x;
        placedAttachments.add(unit.id);
      });
      x=bound.right+siblingGap;
      ordered('right').forEach(unit=>{
        unit.x=x;
        x+=unit.width+siblingGap;
        placedAttachments.add(unit.id);
      });
    });
  });
  // 沒有血緣家系 owner 的孤立社交卡，留在獨立區塊而非插入他人家譜。
  layers.forEach(layer=>layer.forEach(unit=>{
    if(ownership.primaryUnitIds.has(unit.id)||placedAttachments.has(unit.id))return;
    unit.x=cursorX;
    cursorX+=unit.width+siblingGap;
  }));

  return {
    ...metrics,
    blockBoundsByUnit
  };
}

// ========【完整家系同代排序】 家系區塊為最小排序單位，外部關係貼在對應家系兩側 ========
function genealogyAttachmentPriority(unit,ownerId,model) {
  const owner=model.unitById.get(ownerId);
  if(!owner)return 0;
  const related=new Set(unit.members.map(member=>String(member.id)));
  const owners=new Set(owner.members.map(member=>String(member.id)));
  return Math.max(0,...(model.pairCandidates||[])
    .filter(pair=>(related.has(String(pair.a))&&owners.has(String(pair.b)))||
      (related.has(String(pair.b))&&owners.has(String(pair.a))))
    .map(pair=>pair.adjacencyTier||0));
}

// 主家系根區塊排序：保持原血緣先後，只把同一實際家庭的獨立根分支合攏。
function genealogyOrderRootFamilyBlocks(ids,model,ownership) {
  const ordered=[...ids].sort((a,b)=>
    compareFamilyBranchPath(ownership.pathByUnit.get(a),ownership.pathByUnit.get(b))||
    stableGenealogyUnitCompare(model.unitById.get(a),model.unitById.get(b)));
  const firstIndex=new Map();
  ordered.forEach((id,index)=>{
    const household=[...genealogyUnitHouseholds(model.unitById.get(id))].sort()[0];
    const key=household?'household:'+household:'root:'+id;
    if(!firstIndex.has(key))firstIndex.set(key,index);
  });
  return ordered.map((id,index)=>{
    const household=[...genealogyUnitHouseholds(model.unitById.get(id))].sort()[0];
    const key=household?'household:'+household:'root:'+id;
    return {id,index,first:firstIndex.get(key)};
  }).sort((a,b)=>a.first-b.first||a.index-b.index).map(item=>item.id);
}

function applyFamilyBranchOrdering(layers,model,ownership) {
  layers.forEach(layer=>{
    if(!layer||layer.length<2)return;
    const roots=new Map();
    const groupFor=rootId=>{
      if(!roots.has(rootId))roots.set(rootId,{
        id:rootId,primary:[],left:[],right:[]
      });
      return roots.get(rootId);
    };
    layer.forEach(unit=>{
      if(ownership.primaryUnitIds.has(unit.id)){
        const rootId=ownership.rootByUnit.get(unit.id)||unit.id;
        groupFor(rootId).primary.push(unit);
        return;
      }
      const ownerId=ownership.attachmentOwnerByUnit.get(unit.id);
      const rootId=ownership.rootByUnit.get(ownerId)||ownerId||unit.id;
      const side=ownership.attachmentSideByUnit.get(unit.id)||1;
      groupFor(rootId)[side<0?'left':'right'].push(unit);
    });
    const orderedRoots=genealogyOrderRootFamilyBlocks([...roots.keys()],model,ownership)
      .map(id=>roots.get(id));
    const result=[];
    orderedRoots.forEach(root=>{
      root.primary.sort((a,b)=>
        compareFamilyBranchPath(ownership.pathByUnit.get(a.id),ownership.pathByUnit.get(b.id))||
        stableGenealogyUnitCompare(a,b));
      const compareAttachment=(a,b,side)=>{
        const ownerA=ownership.attachmentOwnerByUnit.get(a.id);
        const ownerB=ownership.attachmentOwnerByUnit.get(b.id);
        const priorityA=genealogyAttachmentPriority(a,ownerA,model);
        const priorityB=genealogyAttachmentPriority(b,ownerB,model);
        return (side<0?priorityA-priorityB:priorityB-priorityA)||
          compareFamilyBranchPath(ownership.pathByUnit.get(ownerA),ownership.pathByUnit.get(ownerB))||
          stableGenealogyUnitCompare(a,b);
      };
      root.left.sort((a,b)=>compareAttachment(a,b,-1));
      root.right.sort((a,b)=>compareAttachment(a,b,1));
      result.push(...root.left,...root.primary,...root.right);
    });
    // 在每個完整原生家系的外側加入配偶／前任／社交人物，
    // 而不是把某一家系的人物塞到另一個家系的親子中間。
    layer.splice(0,layer.length,...result);
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

      // 唯一的中央家系也要決定外向方向，而不是回退到隨機姓名順序。
      const side = ownership.primarySideByUnit.get(unit.id) || 1;

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

    // ========【配偶外向排列】 設定 - 雙方皆被列為主家族時仍要辨識原生血緣 ========
    // 只在一方有明確的可見祖先、另一方沒有時才強制方向；
    // 雙方都有祖先的交叉家系維持原有 lineage 判斷，不猜測誰是外人。
    const lineageParentCount = member =>
      genealogyParentIds(member, model.byId)
        .filter(parentId => {
          const parentUnit = model.unitBySim.get(String(parentId));
          return parentUnit && parentUnit.id !== unit.id;
        }).length;
    const leftParentCount = lineageParentCount(leftMember);
    const rightParentCount = lineageParentCount(rightMember);
    const familySide = ownership?.primarySideByUnit?.get(unit.id) || 0;
    if (familySide && !!leftParentCount !== !!rightParentCount) {
      const bloodMemberIsLeft = leftParentCount > rightParentCount;
      const bloodMemberShouldBeLeft = familySide > 0;
      if (bloodMemberIsLeft !== bloodMemberShouldBeLeft) {
        unit.members.reverse();
        changed = true;
      }
      return;
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

// ========【父母／子女中心】 設定 - 分支寬度用於保留空間，親子錨點才是置中依據 ========
    // ========【整組子孫置中】 設定 - 父母受鄰卡限制時，平移完整子孫區塊 ========
function translateFamilyDescendants(layers, model, ownership, group, delta, parentGeneration, gap) {
  if (!ownership || !Number.isFinite(delta) || Math.abs(delta) < 0.75) return false;
  const movedIds = new Set();
  const queue = group.children
    .map(id => model.unitBySim.get(id))
    .filter(unit => unit && unit.generation > parentGeneration);
  if (!queue.length) return false;

  while (queue.length) {
    const unit = queue.shift();
    if (movedIds.has(unit.id)) continue;
    movedIds.add(unit.id);
    // 只延伸經由這個子孫分支擁有的後代，不擅自移動其他配偶家族。
    (ownership?.primaryChildren?.get(unit.id) || []).forEach(childId => {
      if (ownership.ownerParentByUnit?.get(childId) !== unit.id) return;
      const child = model.unitById?.get(childId);
      if (child && child.generation > unit.generation) queue.push(child);
    });
  }

  const movable = [...layers.values()]
    .flat()
    .filter(unit => movedIds.has(unit.id));
  // 必須所有世代都留得下整個區塊，不能犧牲卡片不重疊的規則。
  if (movable.some(unit => {
    const targetLeft = unit.x + delta;
    const targetRight = targetLeft + unit.width;
    return (layers.get(unit.generation) || []).some(other =>
      !movedIds.has(other.id) &&
      targetRight + gap > other.x &&
      targetLeft < other.x + other.width + gap
    );
  })) return false;

  movable.forEach(unit => { unit.x += delta; });
  return true;
}

function alignFamilyBranchParentAxes(layers, model, connectorGroups, ownership = null) {
  const { SIBLING:gap } = resolveLayoutGaps();

  // 由後代往祖先調整：較年長的一代必須看見子女已校正的最終錨點。
  [...layers.keys()]
    .sort((left, right) => right - left)
    .forEach(generation => {
      const layer = layers.get(generation);
      const requestedDeltas = new Map();

      connectorGroups.forEach(group => {
        const parents = genealogyGroupParentEntries(group, model);
        if (
          !parents.length ||
          parents.some(parent => parent.unit.generation !== generation)
        ) {
          return;
        }

        const childAnchors = group.children
          .filter(childId => {
            const unit = model.unitBySim.get(childId);
            return unit && unit.generation > generation;
          })
          .map(childId => genealogyChildAnchorX(childId, model))
          .filter(Number.isFinite);

        if (!childAnchors.length) return;

        // 關係來源與 SVG 繪製共用同一個錨點，不能用配偶區塊的外框中心。
        const sourceX = genealogyGroupSourceX(group, model);
        if (!Number.isFinite(sourceX)) return;

        const childCenterX =
          (Math.min(...childAnchors) + Math.max(...childAnchors)) / 2;
        const delta = childCenterX - sourceX;
        if (Math.abs(delta) < 0.01) return;

        // 同一人可能有多組子女；平均要求，避免最後一組覆蓋之前的結果。
        const weight = childAnchors.length;
        new Set(parents.map(parent => parent.unit.id)).forEach(unitId => {
          const entry = requestedDeltas.get(unitId) || { sum:0, weight:0 };
          entry.sum += delta * weight;
          entry.weight += weight;
          requestedDeltas.set(unitId, entry);
        });
      });

      const shifts = layer
        .filter(unit => requestedDeltas.has(unit.id))
        .map(unit => {
          const entry = requestedDeltas.get(unit.id);
          return { unit, delta:entry.sum / entry.weight };
        });

      const moveWithinLayer = ({ unit, delta }) => {
        if (!Number.isFinite(delta) || Math.abs(delta) < 0.01) return;

        let minimum = -Infinity;
        let maximum = Infinity;

        // 只移動父母所在的 unit（含水平配偶），不改變子女分支的相對位置。
        // 左右界線依既有卡片位置決定，避免跨家族或同代卡片重疊。
        for (const other of layer) {
          if (other.id === unit.id) continue;
          if (other.x + other.width <= unit.x + 0.001) {
            minimum = Math.max(minimum, other.x + other.width + gap);
          } else if (other.x >= unit.x + unit.width - 0.001) {
            maximum = Math.min(maximum, other.x - unit.width - gap);
          } else {
            return;
          }
        }

        if (minimum > maximum) return;
        unit.x = Math.min(maximum, Math.max(minimum, unit.x + delta));
      };

      // 向右移動先處理最右側；向左移動先處理最左側，保留同代順序。
      shifts
        .filter(item => item.delta > 0)
        .sort((a, b) => b.unit.x - a.unit.x)
        .forEach(moveWithinLayer);
      shifts
        .filter(item => item.delta < 0)
        .sort((a, b) => a.unit.x - b.unit.x)
        .forEach(moveWithinLayer);

      // 不再因為父母旁邊有其他卡片就放棄置中：
      // 安全條件允許時，將這組子女及其整個後代平移到父母連接點下方。
      connectorGroups.forEach(group => {
        const parents = genealogyGroupParentEntries(group, model);
        if (!parents.length ||
            parents.some(parent => parent.unit.generation !== generation)) return;
        const childAnchors = group.children
          .filter(id => (model.unitBySim.get(id)?.generation ?? -1) > generation)
          .map(id => genealogyChildAnchorX(id, model))
          .filter(Number.isFinite);
        if (!childAnchors.length) return;
        const sourceX = genealogyGroupSourceX(group, model);
        if (!Number.isFinite(sourceX)) return;
        const childCenter = (Math.min(...childAnchors) + Math.max(...childAnchors)) / 2;
        translateFamilyDescendants(
          layers, model, ownership, group, sourceX - childCenter, generation, gap
        );
      });
    });
}

// ========【情人共同子女自動排列】 在真正的關係線連接點下放置完整後代區塊 ========
// ========【家系分支安全位移】 空間不足時移到可行極限，不是整組原地不動 ========
function genealogySafeDescendantShift(layers,model,ownership,group,delta,parentGeneration,gap) {
  if(!Number.isFinite(delta)||Math.abs(delta)<0.75)return 0;
  const descendants=new Set();
  const queue=group.children.map(id=>model.unitBySim.get(id))
    .filter(unit=>unit&&unit.generation>parentGeneration);
  while(queue.length){
    const unit=queue.shift();
    if(descendants.has(unit.id))continue;
    descendants.add(unit.id);
    (ownership?.primaryChildren?.get(unit.id)||[]).forEach(id=>{
      if(ownership.ownerParentByUnit?.get(id)!==unit.id)return;
      const child=model.unitById?.get(id);
      if(child&&child.generation>unit.generation)queue.push(child);
    });
  }
  let allowed=delta;
  for(const id of descendants){
    const unit=model.unitById?.get(id);
    if(!unit)continue;
    for(const other of (layers.get(unit.generation)||[])){
      if(descendants.has(other.id))continue;
      if(delta>0){
        if(other.x>=unit.x+unit.width-0.001){
          allowed=Math.min(allowed,other.x-unit.x-unit.width-gap);
        }
      }else if(other.x+other.width<=unit.x+0.001){
        allowed=Math.max(allowed,other.x+other.width+gap-unit.x);
      }
    }
  }
  return delta>0?Math.max(0,allowed):Math.min(0,allowed);
}

function alignNonSpousalCoParentBranches(layers,model,ownership,connectorGroups) {
  const {SIBLING:gap}=resolveLayoutGaps();
  // 親子關係座標由同一個 junction 函式取得，避免畫布與排列各算一套中心。
  // 一個人有多位共同生育對象時，每組子女分別尋找自己的線路連接點。
  let adjusted=0;
  [...connectorGroups]
    .sort((a,b)=>{
      const depth=group=>Math.max(...group.parentIds.map(id=>
        model.unitBySim.get(id)?.generation ?? 0));
      return depth(b)-depth(a);
    })
    .forEach(group=>{
      if(group.parentIds.length!==2||!group.children.length)return;
      const link=genealogyNonSpousalCoParentLink(group,model.byId);
      if(!link)return;
      const parentGeneration=Math.max(...group.parentIds.map(id=>
        model.unitBySim.get(id)?.generation??0));
      const descendants=group.children.filter(id=>
        (model.unitBySim.get(id)?.generation??0)>parentGeneration);
      if(!descendants.length)return;
      const pos=placeGenealogyUnitMembers(model.units);
      const point=genealogyCoParentRelationshipJunction(group,pos,model.byId,link);
      if(!point)return;
      const actual=descendants.map(id=>pos.get(id)).filter(Boolean)
        .map(p=>cardVerticalAnchor(p,'top').x);
      if(!actual.length)return;
      const center=(Math.min(...actual)+Math.max(...actual))/2;
      const delta=point.x-center;
      const safeDelta=genealogySafeDescendantShift(
        layers,model,ownership,group,delta,parentGeneration,gap
      );
      if(Math.abs(safeDelta)<0.75)return;
      if(translateFamilyDescendants(
        layers,model,ownership,group,safeDelta,parentGeneration,gap
      ))adjusted++;
    });
  return adjusted;
}

// ========【家庭區塊剛性移動】 同代碰撞向外推移完整子孫分支，而不是讓單一卡片卡住 ========
function genealogyUnitHouseholds(unit) {
  const ids=new Set();
  (unit?.members||[]).forEach(member=>{
    const id=member?.gameData?.householdId;
    if(id!==null&&id!==undefined&&String(id).trim())ids.add(String(id));
  });
  return ids;
}

function genealogyOwnedBranchUnits(model,ownership,seedIds,includeHousehold=true) {
  const result=new Set(),queue=[...seedIds];
  const children=ownership?.primaryChildren||new Map();
  const parents=ownership?.ownerParentByUnit||new Map();
  while(queue.length){
    const id=queue.shift();
    if(result.has(id))continue;
    const unit=model.unitById?.get(id);
    if(!unit)continue;
    result.add(id);
    (children.get(id)||[]).forEach(childId=>{
      if(parents.get(childId)===id)queue.push(childId);
    });
    if(!includeHousehold)continue;
    const householdIds=genealogyUnitHouseholds(unit);
    if(!householdIds.size)continue;
    // 同一世代、同一實際居住家庭一起移動，不允許只把某位家庭成員拉走。
    model.units.forEach(other=>{
      if(other.id===id||other.generation!==unit.generation||result.has(other.id))return;
      if([...genealogyUnitHouseholds(other)].some(value=>householdIds.has(value)))
        queue.push(other.id);
    });
  }
  return result;
}

function genealogyTranslateChildBlockWithClearance(layers,model,ownership,group,delta,parentGeneration,gap) {
  if(!Number.isFinite(delta)||Math.abs(delta)<0.75)return false;
  const seeds=group.children.map(childId=>model.unitBySim.get(childId))
    .filter(unit=>unit&&unit.generation>parentGeneration).map(unit=>unit.id);
  if(!seeds.length)return false;
  const moving=genealogyOwnedBranchUnits(model,ownership,seeds);
  if(!moving.size)return false;
  const original=new Map(model.units.map(unit=>[unit.id,unit.x]));
  const moved=new Set(moving);
  const protectedParents=new Set(group.parentIds.map(id=>model.unitBySim.get(id)?.id).filter(Boolean));
  if([...moving].some(id=>protectedParents.has(id)))return false;

  const shift=(ids,amount)=>{
    ids.forEach(id=>{
      const unit=model.unitById.get(id);
      if(unit)unit.x+=amount;
      moved.add(id);
    });
  };
  const revert=()=>model.units.forEach(unit=>{
    if(original.has(unit.id))unit.x=original.get(unit.id);
  });
  shift(moving,delta);
  const direction=Math.sign(delta);
  const maxPasses=Math.min(256,model.units.length*3+8);
  for(let pass=0;pass<maxPasses;pass++){
    let collision=null;
    // 固定 layer 排列權威：左右順序不允許靠重新排序卡片解決。
    for(const layer of layers.values()){
      for(let index=1;index<layer.length;index++){
        const left=layer[index-1],right=layer[index];
        const overlap=left.x+left.width+gap-right.x;
        if(overlap>0.01){collision={left,right,overlap};break;}
      }
      if(collision)break;
    }
    if(!collision)return true;
    const {left,right,overlap}=collision;
    const block=direction>0?right:left;
    const active=direction>0?left:right;
    // 只能從被位移的區塊向外推；絕對不反向移動另一個家族。
    if(!moved.has(active.id)||protectedParents.has(block.id)){
      revert();return false;
    }
    const branch=genealogyOwnedBranchUnits(model,ownership,[block.id]);
    if(!branch.size||[...branch].some(id=>moving.has(id)||protectedParents.has(id))){
      revert();return false;
    }
    // 若推開的單位是已被移動的區塊，需要保留原有分支相對位置。
    if(branch.has(active.id)){
      revert();return false;
    }
    shift(branch,direction*overlap);
  }
  revert();
  return false;
}

// ========【共通親子排列】 配偶、前任、情人與單親只從實際畫線接點計算子女位置 ========
function alignUnifiedSingleChildBranches(layers,model,ownership,connectorGroups) {
  const {SIBLING:gap}=resolveLayoutGaps();
  const groups=connectorGroups.filter(group=>group.children.length===1)
    .sort((a,b)=>{
      const generation=g=>Math.max(-1,...g.parentIds.map(id=>
        model.unitBySim.get(id)?.generation??-1));
      return generation(b)-generation(a)||String(a.key||'').localeCompare(String(b.key||''));
    });
  let corrected=0;
  // 由下而上，整棵子孫先排好再靠近其父母連接點。
  groups.forEach(group=>{
    const childId=group.children[0];
    const childUnit=model.unitBySim.get(childId);
    if(!childUnit)return;
    const parentGeneration=Math.max(-1,...group.parentIds.map(id=>
      model.unitBySim.get(id)?.generation??-1));
    if(childUnit.generation<=parentGeneration)return;
    const pos=placeGenealogyUnitMembers(model.units);
    const source=parentConnectorSource(group,pos,model.byId,[]);
    const child=pos.get(childId);
    if(!source||!child)return;
    const childX=cardVerticalAnchor(child,'top').x;
    const delta=source.x-childX;
    if(Math.abs(delta)<=0.75)return;
    if(genealogyTranslateChildBlockWithClearance(
      layers,model,ownership,group,delta,parentGeneration,gap
    ))corrected++;
  });
  return corrected;
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

  // 最後依真正子女錨點置中上一代；不重新打散已保留的家族區塊。
  alignFamilyBranchParentAxes(
    layers,
    model,
    connectorGroups,
    ownership
  );

  // 真正改動人物位置：以情人關係線的接點為基準，整組平移私生子女與其後代。
  alignNonSpousalCoParentBranches(
    layers,
    model,
    ownership,
    connectorGroups
  );

  // 讓所有「僅有一名子女」的群組共用真正的 renderer 接點，不再只處理情人。
  // 不重排既有家系；若卡片擋住對齊位置，僅向外推開整個相鄰子孫區塊。
  alignUnifiedSingleChildBranches(
    layers,model,ownership,connectorGroups
  );

  // Family Branch Block 本身就是最終水平幾何權威。
  // 不再執行 generation-global packing，避免把已保留的 Parent Group block 再推壞。
  return placeGenealogyUnitMembers(
    model.units
  );
}

// ========【家庭寵物排列】 設定 - 人物族譜先排好，寵物卡只占用畫布外側空間 ========
// ========【寵物卡顯示資訊】 設定 - 與人物卡分開保存，欄位開關決定實際內容和卡片高度 ========
function petCardFieldRows(pet,owner,settings = getPetCardSettings()) {
  const species = settings.species ? petCardSpeciesLabel(pet) : '';
  const breed = settings.breed ? displayDataText(pet.breed,owner) : '';
  const stage = settings.ageStage ? uiText(pet.ageStage || '') : '';
  const status = settings.status ? uiText(pet.status || '') : '';
  const traits = settings.traits
    ? (pet.traits || []).map(trait => displayDataText(trait,owner)).filter(Boolean)
    : [];
  const rows = [];
  if (species || breed) rows.push({key:'speciesBreed',text:[species,breed].filter(Boolean).join(' · ')});
  if (stage || status) rows.push({key:'stageStatus',text:[stage,status].filter(Boolean).join(' · ')});
  if (traits.length) rows.push({key:'traits',text:traits.join(' / '),traits});
  return rows;
}

function petCardDimensions(pet,owner) {
  const settings = getPetCardSettings();
  const rows = petCardFieldRows(pet,owner,settings);
  const edit = viewMode === 'edit';
  const W = edit ? PET_EDIT_DIMS.W : PET_VIEW_DIMS.W;
  const textWidth = edit ? W - 82 : W - 18;
  const lines = (value,fontSize = 10) => {
    const charWidth = /[^\x00-\x7f]/.test(String(value || '')) ? fontSize : fontSize * 0.58;
    return Math.max(1,Math.ceil([...String(value || '')].length * charWidth / textWidth));
  };
  const name = settings.name ? displayDataText(pet.name,owner) : '';
  const nameHeight = name ? lines(name,edit?12:11)*17 : 0;
  const rowHeight = rows.reduce((sum,row) => {
    if (edit && row.key === 'traits') {
      let used = 0, count = 1;
      for (const trait of row.traits) {
        const width = Math.min(textWidth,[...trait].length*9+12);
        if (used && used+width+3>textWidth) {count++;used=0;}
        used += width+3;
      }
      return sum+count*19;
    }
    return sum+lines(row.text)*14+3;
  },0);
  if (edit) return {W,H:Math.max(84,20+Math.max(51,nameHeight+rowHeight+4))};
  return {W,H:Math.max(90,12+61+(nameHeight?nameHeight+5:0)+rowHeight+10)};
}

function buildPetCardLayout(family, visibleIds, positions, humanGeometry) {
  const empty = {cards:[],groups:[],width:0,height:0};
  if (!showPetCards()) return empty;
  const sourceIds = new Set([
    ...(family?.memberIds || []),
    ...(family?.primaryMemberIds || []),
    ...visibleIds
  ].map(String));
  const householdIds = new Set();
  const byGroup = new Map();
  const seen = new Set();

  sourceIds.forEach(id => {
    const hh = genealogyData?.sims?.[id]?.gameData?.householdId;
    if (hh != null) householdIds.add(String(hh));
  });
  if (family?.gameData?.householdId != null) householdIds.add(String(family.gameData.householdId));

  function addPet(pet, ownerId) {
    if (!pet || typeof pet !== 'object') return;
    const id = String(pet.gameData?.simId || pet.id || (ownerId + ':' + seen.size));
    if (seen.has(id)) return;
    seen.add(id);

    const ownerHousehold = ownerId ? genealogyData?.sims?.[ownerId]?.gameData?.householdId : null;
    const householdId = pet.gameData?.householdId != null
      ? String(pet.gameData.householdId)
      : (ownerHousehold != null ? String(ownerHousehold) : '');
    const groupKey = householdId ? 'household:' + householdId : 'owner:' + (ownerId || id);

    if (!byGroup.has(groupKey)) {
      const matchingFamily = (genealogyData?.families || []).find(entry =>
        householdId && String(entry?.gameData?.householdId ?? '') === householdId
      );
      byGroup.set(groupKey, {
        key:groupKey, householdId,
        title:matchingFamily?.name || uiText('家庭寵物'),
        ownerIds:new Set(), entries:[], anchorY:0
      });
    }
    const group = byGroup.get(groupKey);
    if (ownerId) group.ownerIds.add(ownerId);
    group.entries.push({key:id,pet,ownerId,householdId,groupKey});
  }
  sourceIds.forEach(id => {
    const owner = genealogyData?.sims?.[id];
    if (Array.isArray(owner?.pets)) owner.pets.forEach(pet => addPet(pet,id));
  });

  // EA 多人家庭通常無法指定單一主人：未指派主人但有家庭 ID 的寵物仍須顯示。
  (genealogyData?.meta?.unassignedPets || []).forEach(pet => {
    const household = pet?.gameData?.householdId;
    if (household == null || !householdIds.has(String(household))) return;
    addPet(pet,'');
  });
  const groups = [...byGroup.values()];
  if (!groups.length) return empty;

  // 以實際可見的 EA 家庭成員為錨點，不再把寵物一律塞到整張族譜最右邊。
  const humanRects = [...(humanGeometry.rects?.values() || [])].map(rect => ({
    left:rect.left-PAD,
    top:rect.top-PAD,
    right:rect.right-PAD,
    bottom:rect.bottom-PAD
  }));
  groups.forEach(group => {
    const anchors = [...visibleIds].filter(id => {
      const sim = genealogyData?.sims?.[id];
      return group.ownerIds.has(String(id)) ||
        (!!group.householdId && String(sim?.gameData?.householdId ?? '') === group.householdId);
    }).map(id => {
      const p = positions.get(String(id));
      const dims = humanGeometry.dimensions?.get(String(id)) || getNodeDimensionsById(id);
      return p ? { x:p.x, y:p.y, right:p.x+dims.W } : null;
    }).filter(Boolean).sort((a,b) => a.y-b.y);
    group.anchorY = anchors.length ? anchors[Math.floor((anchors.length-1)/2)].y : 0;
    group.anchorX = anchors.length
      ? Math.max(...anchors.map(anchor => anchor.right))
      : (humanGeometry.width || 0);
  });
  groups.sort((a,b) => a.anchorY-b.anchorY || a.anchorX-b.anchorX || a.key.localeCompare(b.key));

  const cards = [];
  const occupied = humanRects.slice();
  let maxRight = humanGeometry.width || 0;
  let maxBottom = humanGeometry.height || 0;
  const clearance = 10;

  groups.forEach(group => {
    const cols = Math.min(3,group.entries.length);
    const rows = Math.ceil(group.entries.length/3);
    const itemDims = group.entries.map(entry =>
      petCardDimensions(entry.pet,genealogyData?.sims?.[entry.ownerId] || null)
    );
    const W = viewMode === 'edit' ? PET_EDIT_DIMS.W : PET_VIEW_DIMS.W;
    const rowHeights = Array.from({length:rows},(_,i) =>
      Math.max(...itemDims.slice(i*3,i*3+3).map(dim => dim.H))
    );
    const rowTops = rowHeights.map((_,i) =>
      rowHeights.slice(0,i).reduce((sum,height)=>sum+height+PET_ROW_GAP,0)
    );
    const groupW = cols*W+Math.max(0,cols-1)*PET_CARD_GAP;
    const groupH = rowHeights.reduce((sum,height)=>sum+height,0)+
      Math.max(0,rows-1)*PET_ROW_GAP;
    const y = Math.max(0,group.anchorY);
    let x = Math.max(0,group.anchorX+PET_SIDE_GAP);

    // 僅移動寵物群組避開人物卡；不同高度的寵物卡以同列最高卡為間距基準。
    for (let attempt=0; attempt<occupied.length+1; attempt++) {
      const blocking = occupied.find(rect =>
        x < rect.right+clearance && x+groupW+clearance > rect.left &&
        y < rect.bottom+clearance && y+groupH+clearance > rect.top
      );
      if (!blocking) break;
      x = Math.max(x+PET_CARD_GAP,blocking.right+PET_SIDE_GAP);
    }

    group.x = x;
    group.y = y;
    occupied.push({left:x,top:y,right:x+groupW,bottom:y+groupH});
    group.entries.forEach((entry,index) => {
      const cardX = x+(index%3)*(W+PET_CARD_GAP);
      const cardY = y+rowTops[Math.floor(index/3)];
      cards.push({...entry,x:cardX,y:cardY,width:itemDims[index].W,height:itemDims[index].H});
    });
    maxRight = Math.max(maxRight,x+groupW);
    maxBottom = Math.max(maxBottom,y+groupH);
  });
  return {cards,groups,width:maxRight,height:maxBottom};
}

// ========【寵物畫布圖層】 設定 - 不混入人物節點、選取及關係線路由 ========
function paintPetLayer() {
  // 只有 Layout 更新才重建寵物 DOM；拖曳人物卡的每一幀不重建寵物頭像。
  if (lastPaintedPetLayout === layoutCache?.petLayout) return;
  lastPaintedPetLayout = layoutCache?.petLayout;
  if (!layoutCache?.petLayout?.cards?.length) {
    petLayer.replaceChildren();
    syncPetSelectionClasses();
    return;
  }
  const {cards,groups} = layoutCache.petLayout;
  petLayer.innerHTML = groups.map(group => {
    const items = cards.filter(card => card.groupKey === group.key).map(card => {
      const pet = card.pet;
      const owner = genealogyData?.sims?.[card.ownerId] || null;
      const name = displayDataText(pet.name,owner) || uiText('（未命名）');
      const state = pet.status === '幽靈' ? 'ghost' : pet.status === '已故' ? 'dead' : '';
      const settings = getPetCardSettings();
      const fields = petCardFieldRows(pet,owner,settings);
      const edit = viewMode === 'edit';
      const gender = settings.gender ? String(pet.gender || '').toLowerCase() : '';
      const male = ['男','公','male'].includes(gender);
      const female = ['女','母','female'].includes(gender);
      const genderIcon = settings.gender ? (
        '<span class="person-card-gender-icon" role="img" aria-label="' +
        esc(uiText(male ? '公' : female ? '母' : '其他')) + '">' +
        iconSvg(male ? 'gender-card-male' : female ? 'gender-card-female' : 'gender-card-other') +
        '</span>'
      ) : '';
      const fieldHTML = fields.map(row => {
        if (edit && row.key === 'traits') {
          const chips = row.traits.map(trait =>
            `<span class="tag" title="${esc(trait)}">${esc(trait)}</span>`
          ).join('');
          return `<span class="genealogy-pet-card-traits person-card-tags">${chips}</span>`;
        }
        return `<span class="genealogy-pet-card-field${edit ? ' person-card-edit-meta' : ' person-card-view-meta'}" title="${esc(row.text)}">${esc(row.text)}</span>`;
      }).join('');
      const cardMode = edit ? 'mode-edit' : 'mode-view';
      const appearanceClass = edit ? '' : ' card-appearance-' + (settings.appearance || 'minimal');
      const hasContent = settings.name || fields.length;
      return `<button type="button" class="genealogy-pet-card ${cardMode} ${state}${appearanceClass}${hasContent ? '' : ' pet-avatar-only'}" data-pet-id="${esc(card.key)}" title="${esc(name)}"
        style="left:${card.x+PAD}px;top:${card.y+PAD}px;width:${card.width}px;height:${card.height}px">
        <span class="genealogy-pet-card-avatar">${petCardAvatarHTML(pet)}</span>
        ${hasContent ? `<span class="genealogy-pet-card-info">
          ${settings.name ? `<span class="genealogy-pet-card-name">${esc(name)}${genderIcon}</span>` : ''}
          ${fieldHTML}
        </span>` : ''}
      </button>`;
    }).join('');
    return items;
  }).join('');
  syncPetSelectionClasses();
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
  const petLayout = buildPetCardLayout(fam,visibleIds,pos,geometry);
  geometry.width = Math.max(geometry.width,petLayout.width);
  geometry.height = Math.max(geometry.height,petLayout.height);

  return {
    pos,
    petLayout,
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
let lastPaintedPetLayout = null;
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

function updateRelationshipPreviewImmediately(
  simIds = []
) {
  syncState();

  const ids =
    [...(simIds || [])]
      .map(String)
      .filter(Boolean);

  if (!ids.length || !layoutCache) {
    return false;
  }

  const updated =
    paintRelationshipPreview(
      ids
    );

  if (!updated) {
    paintRelationshipLayer({
      includeLabels:true
    });
  }

  return true;
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

    // ========【共同親生父母】 設定 - 僅推定畫布用「情人」，不修改 EA／玩家關係資料 ========
function inferCoParentRelationshipLinks(parentGroups, byId, existingLinks = genealogyData.links || []) {
  const knownPairs = new Set();
  const addKnown = (first, second) => {
    const a = String(first || '');
    const b = String(second || '');
    if (a && b && a !== b) knownPairs.add(pairKey(a, b));
  };

  byId.forEach(sim => {
    [
      ...(sim.spouseIds || []),
      ...(sim.exSpouseIds || []),
      ...(sim.gameData?.deceasedSpouseIds || [])
    ].forEach(otherId => addKnown(sim.id, otherId));
  });
  existingLinks.forEach(link => {
    if (link?.from != null && link?.to != null) {
      addKnown(link.from, link.to);
    }
  });

  const inferred = [];
  parentGroups.forEach(group => {
    if (group.parentIds.length !== 2) return;
    // 養父母只能建立領養線；不得因此推定戀愛或生育關係。
    const hasBiologicalChild = group.children.some(id =>
      group.childKinds?.get(id) === 'parent-child'
    );
    if (!hasBiologicalChild) return;

    const [a, b] = group.parentIds.map(String);
    if (!byId.has(a) || !byId.has(b) || a === b) return;
    const key = pairKey(a, b);
    if (knownPairs.has(key)) return;
    knownPairs.add(key);

    // 不寫入 genealogyData.links；若玩家新增真實關係，此推定自然消失。
    inferred.push({
      id:'inferred-co-parent-' + key,
      from:a,
      to:b,
      type:'情人',
      label:'情人',
      inferred:true
    });
  });
  return inferred;
}

// ========【共同父母連線】 單一關係線同時服務「情人」與親子主幹 ========
function genealogyNonSpousalCoParentLink(group,byId) {
  if (!group || group.parentIds?.length !== 2) return null;
  const [a,b]=group.parentIds.map(String);
  const first=byId.get(a),second=byId.get(b);
  if(!first||!second)return null;
  const hasPartner=(sim,id)=>(sim.spouseIds||[]).map(String).includes(id) ||
    (sim.exSpouseIds||[]).map(String).includes(id) ||
    (sim.gameData?.deceasedSpouseIds||[]).map(String).includes(id);
  if(hasPartner(first,b)||hasPartner(second,a))return null;
  const known=(genealogyData.links||[]).find(link=>
    link&&!isSiblingLink(link) &&
    ((String(link.from)===a&&String(link.to)===b)||
     (String(link.from)===b&&String(link.to)===a))
  );
  if(known)return known;
  return inferCoParentRelationshipLinks([group],byId)[0]||null;
}

// 使用關係線「真正畫出的 SVG 幾何」挑選接合點，不畫第二條伴侶線。
function genealogyCoParentRelationshipJunction(group,pos,byId,link) {
  const a=pos.get(String(link.from)),b=pos.get(String(link.to));
  if(!a||!b)return null;
  const setting=getOtherRelationshipLineSetting(relationshipOtherType(link));
  const context={pos,byId,fromId:link.from,toId:link.to};
  const geometry=relationshipOtherRenderGeometry(a,b,setting,context);
  const positions=group.children.map(id=>pos.get(id)).filter(Boolean);
  if(!positions.length)return null;
  const childAnchors=positions.map(card=>cardVerticalAnchor(card,'top'));
  const start=avatarBoundaryAnchor(a,b),end=avatarBoundaryAnchor(b,a);
  const centerX=(start.x+end.x)/2;
  const childCenter=(Math.min(...childAnchors.map(p=>p.x))+
    Math.max(...childAnchors.map(p=>p.x)))/2;
  const childTop=Math.min(...childAnchors.map(p=>p.y));
  const samples=[];
  if(geometry.segments?.length){
    geometry.segments.forEach((segment,index)=>{
      for(let step=1;step<30;step++){
        const point=relationshipCubicAt(segment,step/30);
        samples.push({...point});
      }
    });
  }else if(geometry.points?.length>1){
    for(let i=1;i<geometry.points.length;i++){
      const first=geometry.points[i-1],second=geometry.points[i];
      for(let step=1;step<30;step++){
        const t=step/30;
        samples.push({x:first.x+(second.x-first.x)*t,
          y:first.y+(second.y-first.y)*t});
      }
    }
  }
  if(!samples.length)return null;
  const obstacles=[];
  pos.forEach((card,id)=>{
    if(group.children.includes(String(id)))return;
    obstacles.push(cardOuterRect(card));
  });
  // 優先不穿卡片，並盡量靠近目前子女群的中心。
  const feasible=samples.filter(p=>p.y<childTop-12&&
    !obstacles.some(rect=>relationshipSegmentIntersectsRect(
      p.x,p.y,p.x,childTop,rect,5
    )));
  const choices=feasible.length?feasible:samples;
  choices.sort((left,right)=>
    Math.abs(left.x-centerX)-Math.abs(right.x-centerX) ||
    Math.abs(left.x-childCenter)-Math.abs(right.x-childCenter) ||
    right.y-left.y
  );
  const point=choices[0];
  return {x:point.x,y:point.y};
}


function parentConnectorSource(
  group,
  pos,
  byId,
  paths
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

  // 雙向辨識配偶／前任／已故配偶。EA 資料偶爾只保留單側關係，
  // 不能因為 parentIds 字串排序不同，就把另一側的連線誤判為情人。
  const recordedPartnerBy = (sim,otherId) =>
    (sim.spouseIds || []).map(String).includes(String(otherId)) ||
    (sim.exSpouseIds || []).map(String).includes(String(otherId)) ||
    (sim.gameData?.deceasedSpouseIds || []).map(String).includes(String(otherId));

  // ========【共同父母共享連接點】 情人與配偶一樣從現有關係線接出子女 ========
  const recordedPartner = recordedPartnerBy(firstSim,secondId) ||
    recordedPartnerBy(second.sim,first.id);

  if(recordedPartner){
    return pairJoinPoint(first.pos,second.pos);
  }

  // 這個共同父母群的關係線已經存在於畫布；從線上取點，
  // 絕不可另外補上「父母下方的兩段橫線」。
  const relation=genealogyNonSpousalCoParentLink(group,byId);
  if(relation){
    const junction=genealogyCoParentRelationshipJunction(
      group,pos,byId,relation
    );
    if(junction)return junction;
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
  labels
) {
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
  defaultOtherCurveCache.clear();

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

  const relationshipArrowMarkerAttributes =
    (setting, type) => {
      if (!setting.showArrow) {
        return '';
      }

      const color =
        relationshipResolvedColor(
          setting,
          'other'
        );

      // 關係 SVG 會跟著整個族譜畫布縮放。桌面版通常接近 100%，
      // 但手機自動適應後可能只剩很小倍率；固定 markerWidth 會一起縮到幾乎看不見。
      // 只反向補償 marker 尺寸，不改線條本身粗細，讓箭頭維持接近固定的螢幕可見大小。
      const safeScale =
        Math.max(
          0.2,
          Number(scale) || 1
        );
      const markerSize =
        6.5 / safeScale;

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
          'markerWidth="' +
          markerSize.toFixed(3) +
          '" markerHeight="' +
          markerSize.toFixed(3) +
          '" ' +
          'orient="auto-start-reverse">' +
            '<path d="M1 1 L9 5 L1 9 Z" fill="' +
            color +
            '" fill-opacity=".9"/>' +
          '</marker>'
        );
      }

      const end =
        ' marker-end="url(#' +
        markerId +
        ')"';

      return (
        isSymmetricSocialRelationshipType(type)
          ? (
              ' marker-start="url(#' +
              markerId +
              ')"' +
              end
            )
          : end
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
        obstacleSensitive:
          group.parentIds.length > 1,
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
            obstacleSensitive:false,
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
          labelKind:'deceased-spouse',
          obstacleSensitive:false,
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
            obstacleSensitive:false,
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

  // 衍生關係只參與畫布繪製與即時拖曳，不持久化，也不改寫已知標籤。
  const drawnOtherLinks = [
    ...(genealogyData.links || []),
    ...inferCoParentRelationshipLinks(topology.parentGroups, byId)
  ];

  drawnOtherLinks
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
        relationshipArrowMarkerAttributes(
          setting,
          type
        );

      registerEdge(
        {
          key:
            'link:' +
            link.id,
          kind:'other',
          link,
          setting,
          obstacleSensitive:
            setting.routing !== 'manual',
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

  // 自動避讓的關係線會受任何卡片位置影響。
  // 拖曳中的卡片即使不是該關係的端點，也必須同步重算，
  // 否則放開後完整重繪時仍可能突然改道。
  relationshipEdgeRecords
    .forEach((record, key) => {
      if (record.obstacleSensitive) {
        affectedKeys.add(key);
      }
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
        groupLabels
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
        relationshipPairRenderGeometry(
          a,
          b,
          record.setting,
          {
            fromId,
            toId,
            pos,
            byId,
            geometry:layoutCache.geometry
          }
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
        relationshipOtherRenderGeometry(
          a,
          b,
          record.setting,
          {
            fromId,
            toId,
            pos,
            byId,
            geometry:layoutCache.geometry
          }
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



function derivePersonCardClassName(
  person,
  {
    viewMode:isViewMode = false,
    isInlaw = false
  } = {}
) {
  const classes =
    new Set([
      'person-card'
    ]);

  if (isViewMode) {
    classes.add(
      'view'
    );
  }

  const gender =
    genderClass(
      person
    );

  if (gender) {
    classes.add(
      gender
    );
  }

  const status =
    statusClass(
      person
    );

  if (status) {
    classes.add(
      status
    );
  }

  if (isInlaw) {
    classes.add(
      'inlaw'
    );
  }

  return [
    ...classes
  ].join(' ');
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
    const cls = derivePersonCardClassName(c, {viewMode:isView, isInlaw});
    const dStage = uiText(c.lifeStage);
    const displayName =
      cardSettings.name
        ? dName
        : '';
    const genderIcon =
      cardSettings.name &&
      cardSettings.gender
        ? cardGenderIconHTML(
            c.gender
          )
        : '';

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

      return `<div class="${cls} mode-view ${appearanceClass}${avatarOnlyClass}" data-id="${c.id}" data-render-key="${esc(renderKey)}" data-stage="${c.lifeStage}"
        style="left:${p.x+PAD}px;top:${p.y+PAD}px;width:${NODE_W}px;height:${NODE_H}px">
        <div class="person-card-view-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
        ${model.name ? `<div class="person-card-view-name" title="${esc(model.name)}">${esc(model.name)}${genderIcon}</div>` : ''}
        ${model.primary.map(renderViewCardLine).join('')}
        ${model.details.map(renderViewCardLine).join('')}
      </div>`;
    }

    // 編輯模式有自己的顯示內容設定，不再跟檢視模式同步。
    const editRows = [];

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
    if (cardSettings.traits && dTraits.length) editRows.push(`<div class="person-card-tags">${renderTraitTagSummary(c.traits, c)}</div>`);
    if (cardSettings.gallery && (c.gallery||[]).length) editRows.push(`<div class="person-card-life-photo-badge" title="${esc(uiText('人生照片'))} ${(c.gallery||[]).length}">${iconSvg('images')} ${(c.gallery||[]).length}</div>`);

    const configuredEditBody = cardSettingsHasBody(cardSettings);
    const editBody = configuredEditBody ? `<div class="person-card-body">
      ${cardSettings.name ? `<div class="person-card-name" title="${esc(displayName)}">${esc(displayName)}${genderIcon}</div>` : ''}
      ${editRows.join('') || (cardSettings.name ? '' : `<div class="person-card-edit-meta">—</div>`)}
    </div>` : '';
    const avatarOnlyClass = configuredEditBody ? '' : ' card-avatar-only';

    return `<div class="${cls} mode-edit${avatarOnlyClass}" data-id="${c.id}" data-render-key="${esc(renderKey)}" data-stage="${c.lifeStage}"
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
  paintPetLayer();
}



function getVisibleTreeContentBounds() {
  if (
    !layoutCache ||
    !layoutCache.pos ||
    !layoutCache.pos.size &&
    !layoutCache.petLayout?.cards?.length
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
  layoutCache.petLayout?.cards?.forEach(card => {
    left = Math.min(left,card.x+PAD);
    top = Math.min(top,card.y+PAD);
    right = Math.max(right,card.x+PAD+card.width);
    bottom = Math.max(bottom,card.y+PAD+card.height);
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

  layoutCache.petLayout = buildPetCardLayout(fam,layoutCache.visibleIds,layoutCache.pos,{width:maxX,height:maxY});
  maxX = Math.max(maxX,layoutCache.petLayout.width);
  maxY = Math.max(maxY,layoutCache.petLayout.height);
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
  paintPetLayer();

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
      recommendedOtherCurveAmount:withState(recommendOtherRelationshipCurveAmount),
      renderImmediately:renderSceneImmediately,
      requestRelationshipUpdate:requestRelationshipLayerUpdate,
      requestRelationshipPreviewUpdate,
      updateRelationshipPreviewImmediately,
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