/* ========【L1nG Genealogy Interaction】 設定 - 拖曳 Snapshot / rAF 執行層 ======== */
(function (global) {
  'use strict';

  function normalizeGeometry(
    geometry
  ) {
    return (geometry || [])
      .map(item => {
        const x = Number(item.x);
        const y = Number(item.y);
        const width = Number(item.width);
        const height = Number(item.height);

        if (
          !item ||
          !String(item.id || '') ||
          !Number.isFinite(x) ||
          !Number.isFinite(y) ||
          !Number.isFinite(width) ||
          !Number.isFinite(height)
        ) {
          return null;
        }

        return {
          id:String(item.id),
          x,
          y,
          width,
          height,
          right:x + width,
          bottom:y + height,
          centerX:x + width / 2,
          centerY:y + height / 2
        };
      })
      .filter(Boolean);
  }

  function horizontalSpacingGuide(
    firstStart,
    firstEnd,
    secondStart,
    secondEnd,
    centerY,
    gap
  ) {
    return {
      axis:'x',
      gap,
      cross:centerY,
      segments:[
        {
          start:firstStart,
          end:firstEnd
        },
        {
          start:secondStart,
          end:secondEnd
        }
      ]
    };
  }

  function verticalSpacingGuide(
    firstStart,
    firstEnd,
    secondStart,
    secondEnd,
    centerX,
    gap
  ) {
    return {
      axis:'y',
      gap,
      cross:centerX,
      segments:[
        {
          start:firstStart,
          end:firstEnd
        },
        {
          start:secondStart,
          end:secondEnd
        }
      ]
    };
  }

  function closer(
    first,
    second
  ) {
    if (!first) return second;
    if (!second) return first;

    return (
      second.distance <
      first.distance
    )
      ? second
      : first;
  }

  function closestTarget(
    targets,
    rawValue,
    threshold,
    usePriority = false
  ) {
    let best = null;

    for (
      const target of
      targets || []
    ) {
      const value =
        Number(
          typeof target === 'number'
            ? target
            : target?.value
        );

      if (!Number.isFinite(value)) {
        continue;
      }

      const priority =
        Number(
          target?.priority ?? 0
        );

      const distance =
        Math.abs(
          value - rawValue
        );

      if (
        distance > threshold
      ) {
        continue;
      }

      if (
        !best ||
        distance <
          best.distance - 0.001 ||
        (
          usePriority &&
          Math.abs(
            distance -
            best.distance
          ) <= 0.001 &&
          priority <
            best.priority
        )
      ) {
        best = {
          value,
          distance,
          priority
        };
      }
    }

    return best;
  }

  function createSingleDragSession({
    id,
    geometry,
    guideSnapPx = 8,
    relationshipSnapPx = 10,
    relationshipTargets = null
  } = {}) {
    const normalized =
      normalizeGeometry(
        geometry
      );

    const dragId =
      String(id || '');

    const dragged =
      normalized.find(
        item =>
          item.id === dragId
      );

    if (!dragged) {
      return null;
    }

    const others =
      normalized.filter(
        item =>
          item.id !== dragId
      );

    const byX =
      [...others].sort(
        (a, b) =>
          a.x - b.x
      );

    const byY =
      [...others].sort(
        (a, b) =>
          a.y - b.y
      );

    const relationX =
      relationshipTargets?.x ||
      [];

    const relationY =
      relationshipTargets?.y ||
      [];

    function snap(
      rawX,
      rawY,
      scale = 1
    ) {
      const safeScale =
        Math.max(
          Number(scale) || 1,
          0.001
        );

      const threshold =
        guideSnapPx /
        safeScale;

      const rowTolerance =
        guideSnapPx *
        1.5 /
        safeScale;

      const relationshipXThreshold =
        relationshipSnapPx /
        safeScale;

      const relationshipYThreshold =
        guideSnapPx *
        1.5 /
        safeScale;

      const draggedX = [
        rawX,
        rawX +
          dragged.width / 2,
        rawX +
          dragged.width
      ];

      const draggedY = [
        rawY,
        rawY +
          dragged.height / 2,
        rawY +
          dragged.height
      ];

      const draggedCenterX =
        draggedX[1];

      const draggedCenterY =
        draggedY[1];

      let alignmentX = null;
      let alignmentY = null;

      for (const target of others) {
        const targetX = [
          target.x,
          target.centerX,
          target.right
        ];

        const targetY = [
          target.y,
          target.centerY,
          target.bottom
        ];

        for (
          let index = 0;
          index < 3;
          index += 1
        ) {
          const delta =
            targetX[index] -
            draggedX[index];

          const distance =
            Math.abs(delta);

          if (
            distance <= threshold &&
            (
              !alignmentX ||
              distance <
                alignmentX.distance
            )
          ) {
            alignmentX = {
              value:
                rawX + delta,
              distance,
              guide:
                targetX[index]
            };
          }
        }

        for (
          let index = 0;
          index < 3;
          index += 1
        ) {
          const delta =
            targetY[index] -
            draggedY[index];

          const distance =
            Math.abs(delta);

          if (
            distance <= threshold &&
            (
              !alignmentY ||
              distance <
                alignmentY.distance
            )
          ) {
            alignmentY = {
              value:
                rawY + delta,
              distance,
              guide:
                targetY[index]
            };
          }
        }
      }

      const rowNodes =
        byX.filter(target =>
          Math.abs(
            target.centerY -
            draggedCenterY
          ) <= rowTolerance
        );

      let spacingX = null;

      const considerX = (
        value,
        gap,
        guide
      ) => {
        const distance =
          Math.abs(
            value - rawX
          );

        if (
          distance > threshold
        ) {
          return;
        }

        if (
          !spacingX ||
          distance <
            spacingX.distance
        ) {
          spacingX = {
            value,
            distance,
            spacingGuide:guide
          };
        }
      };

      for (
        let index = 0;
        index <
          rowNodes.length - 1;
        index += 1
      ) {
        const left =
          rowNodes[index];

        const right =
          rowNodes[index + 1];

        if (
          Math.abs(
            left.centerY -
            right.centerY
          ) > rowTolerance
        ) {
          continue;
        }

        const existingGap =
          right.x -
          (
            left.x +
            left.width
          );

        const rowCenterY =
          (
            left.centerY +
            right.centerY +
            draggedCenterY
          ) / 3;

        if (existingGap >= 0) {
          const rightTarget =
            right.x +
            right.width +
            existingGap;

          considerX(
            rightTarget,
            existingGap,
            horizontalSpacingGuide(
              left.x +
                left.width,
              right.x,
              right.x +
                right.width,
              rightTarget,
              rowCenterY,
              existingGap
            )
          );

          const leftTarget =
            left.x -
            dragged.width -
            existingGap;

          considerX(
            leftTarget,
            existingGap,
            horizontalSpacingGuide(
              leftTarget +
                dragged.width,
              left.x,
              left.x +
                left.width,
              right.x,
              rowCenterY,
              existingGap
            )
          );
        }

        const available =
          right.x -
          (
            left.x +
            left.width
          );

        if (
          available >=
          dragged.width
        ) {
          const middleGap =
            (
              available -
              dragged.width
            ) / 2;

          const middleTarget =
            left.x +
            left.width +
            middleGap;

          considerX(
            middleTarget,
            middleGap,
            horizontalSpacingGuide(
              left.x +
                left.width,
              middleTarget,
              middleTarget +
                dragged.width,
              right.x,
              rowCenterY,
              middleGap
            )
          );
        }
      }

      const columnNodes =
        byY.filter(target =>
          Math.abs(
            target.centerX -
            draggedCenterX
          ) <= rowTolerance
        );

      let spacingY = null;

      const considerY = (
        value,
        gap,
        guide
      ) => {
        const distance =
          Math.abs(
            value - rawY
          );

        if (
          distance > threshold
        ) {
          return;
        }

        if (
          !spacingY ||
          distance <
            spacingY.distance
        ) {
          spacingY = {
            value,
            distance,
            spacingGuide:guide
          };
        }
      };

      for (
        let index = 0;
        index <
          columnNodes.length - 1;
        index += 1
      ) {
        const top =
          columnNodes[index];

        const bottom =
          columnNodes[index + 1];

        if (
          Math.abs(
            top.centerX -
            bottom.centerX
          ) > rowTolerance
        ) {
          continue;
        }

        const existingGap =
          bottom.y -
          (
            top.y +
            top.height
          );

        const columnCenterX =
          (
            top.centerX +
            bottom.centerX +
            draggedCenterX
          ) / 3;

        if (existingGap >= 0) {
          const bottomTarget =
            bottom.y +
            bottom.height +
            existingGap;

          considerY(
            bottomTarget,
            existingGap,
            verticalSpacingGuide(
              top.y +
                top.height,
              bottom.y,
              bottom.y +
                bottom.height,
              bottomTarget,
              columnCenterX,
              existingGap
            )
          );

          const topTarget =
            top.y -
            dragged.height -
            existingGap;

          considerY(
            topTarget,
            existingGap,
            verticalSpacingGuide(
              topTarget +
                dragged.height,
              top.y,
              top.y +
                top.height,
              bottom.y,
              columnCenterX,
              existingGap
            )
          );
        }

        const available =
          bottom.y -
          (
            top.y +
            top.height
          );

        if (
          available >=
          dragged.height
        ) {
          const middleGap =
            (
              available -
              dragged.height
            ) / 2;

          const middleTarget =
            top.y +
            top.height +
            middleGap;

          considerY(
            middleTarget,
            middleGap,
            verticalSpacingGuide(
              top.y +
                top.height,
              middleTarget,
              middleTarget +
                dragged.height,
              bottom.y,
              columnCenterX,
              middleGap
            )
          );
        }
      }

      const bestX =
        closer(
          alignmentX,
          spacingX
        );

      const bestY =
        closer(
          alignmentY,
          spacingY
        );

      const relationSnapX =
        closestTarget(
          relationX,
          rawX,
          relationshipXThreshold
        );

      const relationSnapY =
        closestTarget(
          relationY,
          rawY,
          relationshipYThreshold,
          true
        );

      return {
        x:
          relationSnapX
            ? relationSnapX.value
            : bestX
              ? bestX.value
              : rawX,

        y:
          relationSnapY
            ? relationSnapY.value
            : bestY
              ? bestY.value
              : rawY,

        guideX:
          relationSnapX
            ? null
            : (
                bestX &&
                bestX.guide !==
                  undefined
                  ? bestX.guide
                  : null
              ),

        guideY:
          relationSnapY
            ? null
            : (
                bestY &&
                bestY.guide !==
                  undefined
                  ? bestY.guide
                  : null
              ),

        spacingX:
          relationSnapX
            ? null
            : (
                bestX?.spacingGuide ||
                null
              ),

        spacingY:
          relationSnapY
            ? null
            : (
                bestY?.spacingGuide ||
                null
              )
      };
    }

    return {
      id:dragId,
      snap
    };
  }

  function createGroupDragSession({
    dragIds,
    startPositions,
    geometry,
    guideSnapPx = 8
  } = {}) {
    const selected =
      new Set(
        (dragIds || [])
          .map(String)
      );

    const normalized =
      normalizeGeometry(
        geometry
      );

    const geometryById =
      new Map(
        normalized.map(item => [
          item.id,
          item
        ])
      );

    const startBoxes = [];

    for (
      const [rawId, position] of
      startPositions || []
    ) {
      const id =
        String(rawId);

      const shape =
        geometryById.get(id);

      if (
        !shape ||
        !position
      ) {
        continue;
      }

      const x =
        Number(position.x);

      const y =
        Number(position.y);

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        continue;
      }

      startBoxes.push({
        id,
        x,
        y,
        right:
          x + shape.width,
        bottom:
          y + shape.height
      });
    }

    if (!startBoxes.length) {
      return null;
    }

    const baseBounds = {
      left:
        Math.min(
          ...startBoxes.map(
            box => box.x
          )
        ),
      right:
        Math.max(
          ...startBoxes.map(
            box => box.right
          )
        ),
      top:
        Math.min(
          ...startBoxes.map(
            box => box.y
          )
        ),
      bottom:
        Math.max(
          ...startBoxes.map(
            box => box.bottom
          )
        )
    };

    baseBounds.centerX =
      (
        baseBounds.left +
        baseBounds.right
      ) / 2;

    baseBounds.centerY =
      (
        baseBounds.top +
        baseBounds.bottom
      ) / 2;

    const targets =
      normalized.filter(
        item =>
          !selected.has(item.id)
      );

    function snapDelta(
      rawDeltaX,
      rawDeltaY,
      scale = 1
    ) {
      const safeScale =
        Math.max(
          Number(scale) || 1,
          0.001
        );

      const threshold =
        guideSnapPx /
        safeScale;

      const draggedX = [
        baseBounds.left +
          rawDeltaX,
        baseBounds.centerX +
          rawDeltaX,
        baseBounds.right +
          rawDeltaX
      ];

      const draggedY = [
        baseBounds.top +
          rawDeltaY,
        baseBounds.centerY +
          rawDeltaY,
        baseBounds.bottom +
          rawDeltaY
      ];

      let bestX = null;
      let bestY = null;

      targets.forEach(target => {
        const targetX = [
          target.x,
          target.centerX,
          target.right
        ];

        const targetY = [
          target.y,
          target.centerY,
          target.bottom
        ];

        for (
          let index = 0;
          index < 3;
          index += 1
        ) {
          const delta =
            targetX[index] -
            draggedX[index];

          const distance =
            Math.abs(delta);

          if (
            distance <= threshold &&
            (
              !bestX ||
              distance <
                bestX.distance
            )
          ) {
            bestX = {
              delta,
              distance,
              guide:
                targetX[index]
            };
          }
        }

        for (
          let index = 0;
          index < 3;
          index += 1
        ) {
          const delta =
            targetY[index] -
            draggedY[index];

          const distance =
            Math.abs(delta);

          if (
            distance <= threshold &&
            (
              !bestY ||
              distance <
                bestY.distance
            )
          ) {
            bestY = {
              delta,
              distance,
              guide:
                targetY[index]
            };
          }
        }
      });

      return {
        deltaX:
          rawDeltaX +
          (
            bestX
              ? bestX.delta
              : 0
          ),

        deltaY:
          rawDeltaY +
          (
            bestY
              ? bestY.delta
              : 0
          ),

        guideX:
          bestX
            ? bestX.guide
            : null,

        guideY:
          bestY
            ? bestY.guide
            : null
      };
    }

    return {
      snapDelta
    };
  }

  function createFrameScheduler(
    handler
  ) {
    if (
      typeof handler !==
      'function'
    ) {
      return null;
    }

    let raf = 0;
    let pending = null;

    function run() {
      raf = 0;

      if (pending === null) {
        return;
      }

      const value = pending;
      pending = null;

      handler(value);
    }

    return {
      push(value) {
        pending = value;

        if (raf) return;

        raf =
          global.requestAnimationFrame(
            run
          );
      },

      flush() {
        if (raf) {
          global.cancelAnimationFrame(
            raf
          );

          raf = 0;
        }

        run();
      },

      cancel() {
        if (raf) {
          global.cancelAnimationFrame(
            raf
          );

          raf = 0;
        }

        pending = null;
      }
    };
  }

  global.L1nGGenealogyInteraction =
    Object.freeze({
      createSingleDragSession,
      createGroupDragSession,
      createFrameScheduler
    });
})(window);
