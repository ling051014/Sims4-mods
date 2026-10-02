/* ========【L1nG Genealogy Viewport】 設定 - 畫布視角 / 縮放 / 平移 / 座標轉換唯一管理層 ======== */
(function (global) {
  'use strict';

  function create({
    dom = {},
    limits = {},
    getContentBounds = () => null,
    hasSceneLayout = () => true
  } = {}) {
    const viewport = dom.viewport || null;
    const stage = dom.stage || null;
    const zoomValue = dom.zoomValue || null;

    if (!viewport || !stage) {
      return null;
    }

    const minScale =
      Number.isFinite(Number(limits.minScale))
        ? Number(limits.minScale)
        : 0.12;

    const maxScale =
      Number.isFinite(Number(limits.maxScale))
        ? Number(limits.maxScale)
        : 3;

    const fitMaxScale =
      Number.isFinite(Number(limits.fitMaxScale))
        ? Number(limits.fitMaxScale)
        : 1.4;

    let scale = 1;
    let panX = 0;
    let panY = 0;
    let viewState = 'fit';

    let transformSettleTimer = null;
    let resizeObserver = null;
    let resizeRaf = null;
    let lastViewportSize = {
      width:0,
      height:0
    };

    let panSession = null;

    function safeScale() {
      return Math.max(
        Number(scale) || 1,
        0.001
      );
    }

    function snapScale(value) {
      const bounded =
        Math.min(
          Math.max(
            Number(value) || 1,
            minScale
          ),
          maxScale
        );

      return (
        Math.round(bounded * 40) /
        40
      );
    }

    function paintTransform({
      interacting = false
    } = {}) {
      const dpr =
        Math.max(
          1,
          global.devicePixelRatio || 1
        );

      const crispX =
        Math.round(panX * dpr) /
        dpr;

      const crispY =
        Math.round(panY * dpr) /
        dpr;

      stage.style.transform =
        `translate(${crispX}px, ${crispY}px) scale(${scale})`;

      if (interacting) {
        stage.classList.add(
          'is-transforming'
        );

        global.clearTimeout(
          transformSettleTimer
        );

        transformSettleTimer =
          global.setTimeout(() => {
            stage.classList.remove(
              'is-transforming'
            );

            void stage.offsetWidth;

            const settleDpr =
              Math.max(
                1,
                global.devicePixelRatio || 1
              );

            const settleX =
              Math.round(
                panX * settleDpr
              ) /
              settleDpr;

            const settleY =
              Math.round(
                panY * settleDpr
              ) /
              settleDpr;

            stage.style.transform =
              `translate(${settleX}px, ${settleY}px) scale(${scale})`;
          }, 140);
      }

      if (zoomValue) {
        zoomValue.textContent =
          `${Math.round(scale * 100)}%`;
      }
    }

    function getScale() {
      return scale;
    }

    function getState() {
      return Object.freeze({
        scale,
        panX,
        panY,
        viewState
      });
    }

    function screenPixelsToWorld(
      pixels
    ) {
      return (
        Number(pixels || 0) /
        safeScale()
      );
    }

    function screenDeltaToWorld(
      deltaX,
      deltaY
    ) {
      const currentScale =
        safeScale();

      return {
        x:
          Number(deltaX || 0) /
          currentScale,
        y:
          Number(deltaY || 0) /
          currentScale
      };
    }

    function screenPointToWorld(
      clientX,
      clientY
    ) {
      const rect =
        viewport.getBoundingClientRect();

      return {
        x:
          (
            Number(clientX || 0) -
            rect.left -
            panX
          ) /
          safeScale(),
        y:
          (
            Number(clientY || 0) -
            rect.top -
            panY
          ) /
          safeScale()
      };
    }

    function zoomAt(
      clientX,
      clientY,
      factor
    ) {
      const rect =
        viewport.getBoundingClientRect();

      const mouseX =
        Number(clientX || 0) -
        rect.left;

      const mouseY =
        Number(clientY || 0) -
        rect.top;

      const nextScale =
        snapScale(
          scale *
          (Number(factor) || 1)
        );

      if (nextScale === scale) {
        return false;
      }

      const worldX =
        (mouseX - panX) /
        safeScale();

      const worldY =
        (mouseY - panY) /
        safeScale();

      viewState = 'manual';
      scale = nextScale;

      panX =
        mouseX -
        worldX * scale;

      panY =
        mouseY -
        worldY * scale;

      paintTransform({
        interacting:true
      });

      return true;
    }

    // ========【觸控視角】 設定 - 雙指縮放同時保留兩指中心的平移 ========
    function transformGesture(
      previousClientX,
      previousClientY,
      currentClientX,
      currentClientY,
      factor = 1
    ) {
      const rect =
        viewport.getBoundingClientRect();

      const previousX =
        Number(previousClientX || 0) -
        rect.left;

      const previousY =
        Number(previousClientY || 0) -
        rect.top;

      const currentX =
        Number(currentClientX || 0) -
        rect.left;

      const currentY =
        Number(currentClientY || 0) -
        rect.top;

      const previousScale =
        safeScale();

      const worldX =
        (previousX - panX) /
        previousScale;

      const worldY =
        (previousY - panY) /
        previousScale;

      const nextScale =
        snapScale(
          scale *
          (Number(factor) || 1)
        );

      const changed =
        nextScale !== scale ||
        currentX !== previousX ||
        currentY !== previousY;

      if (!changed) {
        return false;
      }

      viewState = 'manual';
      scale = nextScale;

      panX =
        currentX -
        worldX * scale;

      panY =
        currentY -
        worldY * scale;

      paintTransform({
        interacting:true
      });

      return true;
    }

    function fit({
      rememberState = true
    } = {}) {
      const viewportWidth =
        viewport.clientWidth;

      const viewportHeight =
        viewport.clientHeight;

      if (rememberState) {
        viewState = 'fit';
      }

      const bounds =
        getContentBounds() || null;

      if (!bounds) {
        const stageWidth =
          parseFloat(
            stage.style.width
          ) || 1;

        const stageHeight =
          parseFloat(
            stage.style.height
          ) || 1;

        scale =
          Math.max(
            Math.min(
              (
                viewportWidth - 40
              ) /
              stageWidth,
              (
                viewportHeight - 40
              ) /
              stageHeight,
              fitMaxScale
            ),
            minScale
          );

        panX =
          (
            viewportWidth -
            stageWidth * scale
          ) /
          2;

        panY =
          (
            viewportHeight -
            stageHeight * scale
          ) /
          2;

        paintTransform();
        return;
      }

      const fitPadding = 56;

      scale =
        Math.max(
          Math.min(
            (
              viewportWidth -
              fitPadding
            ) /
            bounds.width,
            (
              viewportHeight -
              fitPadding
            ) /
            bounds.height,
            fitMaxScale
          ),
          minScale
        );

      panX =
        viewportWidth / 2 -
        bounds.centerX * scale;

      panY =
        viewportHeight / 2 -
        bounds.centerY * scale;

      paintTransform();
    }

    function preserveWorldCenter(
      previousSize,
      nextSize
    ) {
      if (!hasSceneLayout()) {
        return;
      }

      if (viewState === 'fit') {
        fit({
          rememberState:false
        });
        return;
      }

      if (
        !previousSize?.width ||
        !previousSize?.height
      ) {
        return;
      }

      const currentScale =
        safeScale();

      const worldCenterX =
        (
          previousSize.width / 2 -
          panX
        ) /
        currentScale;

      const worldCenterY =
        (
          previousSize.height / 2 -
          panY
        ) /
        currentScale;

      panX =
        nextSize.width / 2 -
        worldCenterX *
        currentScale;

      panY =
        nextSize.height / 2 -
        worldCenterY *
        currentScale;

      paintTransform();
    }

    function observeResize() {
      if (resizeObserver) {
        return;
      }

      lastViewportSize = {
        width:viewport.clientWidth,
        height:viewport.clientHeight
      };

      const handleResize = (
        width,
        height
      ) => {
        const nextSize = {
          width:
            Math.max(
              1,
              Math.round(width)
            ),
          height:
            Math.max(
              1,
              Math.round(height)
            )
        };

        const previousSize =
          lastViewportSize;

        if (
          nextSize.width ===
            previousSize.width &&
          nextSize.height ===
            previousSize.height
        ) {
          return;
        }

        lastViewportSize =
          nextSize;

        if (resizeRaf) {
          global.cancelAnimationFrame(
            resizeRaf
          );
        }

        resizeRaf =
          global.requestAnimationFrame(
            () => {
              resizeRaf = null;

              preserveWorldCenter(
                previousSize,
                nextSize
              );
            }
          );
      };

      if (
        'ResizeObserver' in
        global
      ) {
        resizeObserver =
          new global.ResizeObserver(
            entries => {
              const entry =
                entries.find(
                  item =>
                    item.target ===
                    viewport
                );

              if (!entry) return;

              handleResize(
                entry.contentRect.width,
                entry.contentRect.height
              );
            }
          );

        resizeObserver.observe(
          viewport
        );

        return;
      }

      const fallback = () => {
        handleResize(
          viewport.clientWidth,
          viewport.clientHeight
        );
      };

      resizeObserver = {
        disconnect:() =>
          global.removeEventListener(
            'resize',
            fallback
          )
      };

      global.addEventListener(
        'resize',
        fallback
      );
    }

    function focusWorldPoint(
      worldX,
      worldY,
      {
        minFocusScale = 0.72
      } = {}
    ) {
      viewState = 'manual';

      if (
        scale <
        minFocusScale
      ) {
        scale =
          Math.min(
            maxScale,
            Math.max(
              minScale,
              minFocusScale
            )
          );
      }

      panX =
        viewport.clientWidth / 2 -
        Number(worldX || 0) *
        scale;

      panY =
        viewport.clientHeight / 2 -
        Number(worldY || 0) *
        scale;

      paintTransform();
    }

    function beginPan(
      clientX,
      clientY
    ) {
      panSession = {
        startX:
          Number(clientX || 0),
        startY:
          Number(clientY || 0),
        startPanX:panX,
        startPanY:panY
      };

      viewState = 'manual';

      viewport.classList.add(
        'dragging'
      );

      return true;
    }

    function movePan(
      clientX,
      clientY
    ) {
      if (!panSession) {
        return false;
      }

      panX =
        panSession.startPanX +
        (
          Number(clientX || 0) -
          panSession.startX
        );

      panY =
        panSession.startPanY +
        (
          Number(clientY || 0) -
          panSession.startY
        );

      paintTransform();
      return true;
    }

    function endPan() {
      const wasPanning =
        !!panSession;

      panSession = null;

      viewport.classList.remove(
        'dragging'
      );

      return wasPanning;
    }

    function cancelPan() {
      return endPan();
    }

    function isPanning() {
      return !!panSession;
    }

    function dispose() {
      if (transformSettleTimer) {
        global.clearTimeout(
          transformSettleTimer
        );
      }

      if (resizeRaf) {
        global.cancelAnimationFrame(
          resizeRaf
        );
      }

      resizeObserver?.disconnect?.();

      transformSettleTimer = null;
      resizeRaf = null;
      resizeObserver = null;
      panSession = null;
    }

    return Object.freeze({
      getScale,
      getState,
      screenPixelsToWorld,
      screenDeltaToWorld,
      screenPointToWorld,
      zoomAt,
      transformGesture,
      fit,
      observeResize,
      focusWorldPoint,
      beginPan,
      movePan,
      endPan,
      cancelPan,
      isPanning,
      dispose
    });
  }

  global.L1nGGenealogyViewport =
    Object.freeze({
      create
    });
})(window);
