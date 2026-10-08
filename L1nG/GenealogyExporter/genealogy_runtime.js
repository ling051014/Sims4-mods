/* ========【L1nG Genealogy Runtime】 設定 - Cache / DOM / Save 執行層 ======== */
(function (global) {
  'use strict';

  function hashString(input) {
    let hash = 2166136261;

    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
  }

  function signature(value) {
    let serialized = '';

    try {
      serialized =
        typeof value === 'string'
          ? value
          : JSON.stringify(value);
    } catch (_) {
      serialized = String(value ?? '');
    }

    return hashString(serialized);
  }

  function syncOuterAttributes(current, next) {
    const transientClasses = [
      'person-card-selected',
      'dragging',
      'focus-pulse'
    ].filter(className =>
      current.classList?.contains(
        className
      )
    );

    [...current.attributes].forEach(attribute => {
      if (!next.hasAttribute(attribute.name)) {
        current.removeAttribute(attribute.name);
      }
    });

    [...next.attributes].forEach(attribute => {
      current.setAttribute(
        attribute.name,
        attribute.value
      );
    });

    transientClasses.forEach(className => {
      current.classList.add(
        className
      );
    });
  }

  function patchKeyedNodes(container, html) {
    if (!container) {
      return {
        created:0,
        reused:0,
        replaced:0
      };
    }

    const template =
      document.createElement('template');

    template.innerHTML =
      String(html || '');

    const nextNodes =
      [...template.content.children];

    if (
      !nextNodes.length ||
      nextNodes.some(element =>
        !element.matches?.(
          '.node[data-id]'
        )
      )
    ) {
      container.innerHTML =
        String(html || '');

      return {
        created:nextNodes.length,
        reused:0,
        replaced:0
      };
    }

    const existing =
      new Map(
        [...container.children]
          .filter(element =>
            element.matches?.(
              '.node[data-id]'
            )
          )
          .map(element => [
            String(element.dataset.id),
            element
          ])
      );

    const fragment =
      document.createDocumentFragment();

    let created = 0;
    let reused = 0;
    let replaced = 0;

    nextNodes.forEach(next => {
      const id =
        String(next.dataset.id || '');

      const current =
        existing.get(id);

      const sameContent =
        current &&
        current.dataset.renderKey ===
          next.dataset.renderKey;

      if (sameContent) {
        syncOuterAttributes(
          current,
          next
        );

        fragment.appendChild(
          current
        );

        existing.delete(id);
        reused += 1;
        return;
      }

      if (current) {
        existing.delete(id);
        replaced += 1;
      } else {
        created += 1;
      }

      fragment.appendChild(next);
    });

    container.replaceChildren(
      fragment
    );

    return {
      created,
      reused,
      replaced
    };
  }

  function createSaveCoordinator({
    serialize,
    write,
    getExisting = null,
    onError = null,
    delay = 260,
    idleTimeout = 700
  } = {}) {
    if (
      typeof serialize !== 'function' ||
      typeof write !== 'function'
    ) {
      throw new Error(
        'SaveCoordinator requires serialize / write.'
      );
    }

    let pending = false;
    let delayTimer = 0;
    let idleHandle = 0;
    let idleKind = '';

    let lastWritten = null;

    try {
      lastWritten =
        typeof getExisting === 'function'
          ? getExisting()
          : null;
    } catch (_) {}

    function cancelScheduled() {
      if (delayTimer) {
        clearTimeout(delayTimer);
        delayTimer = 0;
      }

      if (idleHandle) {
        if (
          idleKind === 'idle' &&
          typeof global.cancelIdleCallback ===
            'function'
        ) {
          global.cancelIdleCallback(
            idleHandle
          );
        } else {
          clearTimeout(idleHandle);
        }

        idleHandle = 0;
        idleKind = '';
      }
    }

    function flush() {
      cancelScheduled();

      if (!pending) {
        return false;
      }

      pending = false;

      try {
        const serialized =
          serialize();

        if (
          serialized ===
          lastWritten
        ) {
          return false;
        }

        write(serialized);
        lastWritten = serialized;

        return true;
      } catch (error) {
        if (
          typeof onError ===
          'function'
        ) {
          onError(error);
        } else {
          console.error(
            '[Genealogy Save]',
            error
          );
        }

        return false;
      }
    }

    function scheduleIdleFlush() {
      if (
        typeof global.requestIdleCallback ===
        'function'
      ) {
        idleKind = 'idle';

        idleHandle =
          global.requestIdleCallback(
            () => {
              idleHandle = 0;
              idleKind = '';
              flush();
            },
            {
              timeout:
                Math.max(
                  100,
                  Number(idleTimeout) ||
                  700
                )
            }
          );

        return;
      }

      idleKind = 'timer';

      idleHandle =
        setTimeout(() => {
          idleHandle = 0;
          idleKind = '';
          flush();
        }, 0);
    }

    function request({
      immediate = false
    } = {}) {
      pending = true;

      if (immediate) {
        return flush();
      }

      if (
        delayTimer ||
        idleHandle
      ) {
        return false;
      }

      delayTimer =
        setTimeout(() => {
          delayTimer = 0;
          scheduleIdleFlush();
        }, Math.max(0, Number(delay) || 0));

      return false;
    }

    return {
      request,
      flush,
      dispose:flush,
      hasPending() {
        return pending;
      }
    };
  }

  // ========【畫面更新協調】Runtime 管理髒區合併與排程，不依賴畫面 DOM ========
  function createRenderCoordinator({ requestSceneUpdate, refreshChrome, refreshLists } = {}) {
    const DIRTY = Object.freeze({ chrome:1, lists:2 });
    let dirty = 0;
    let frame = 0;

    function flush() {
      if (frame) { global.cancelAnimationFrame(frame); frame = 0; }
      const mask = dirty;
      dirty = 0;
      if (!mask) return;
      if (mask & DIRTY.chrome) refreshChrome?.();
      if (mask & DIRTY.lists) refreshLists?.();
    }

    function invalidate(layers, { immediate = false } = {}) {
      requestSceneUpdate?.({
        layout:!!layers?.layout,
        nodes:!!layers?.nodes,
        edges:!!layers?.edges
      }, { immediate });
      if (layers?.chrome) dirty |= DIRTY.chrome;
      if (layers?.lists) dirty |= DIRTY.lists;
      if (!dirty) return;
      if (immediate) { flush(); return; }
      if (frame) return;
      frame = global.requestAnimationFrame(() => { frame = 0; flush(); });
    }

    return Object.freeze({
      invalidate,
      flush,
      dispose() {
        if (frame) { global.cancelAnimationFrame(frame); frame = 0; }
        dirty = 0;
      }
    });
  }

  function create() {
    let relationshipRevision = 0;

    const kinshipByRoot =
      new Map();

    function invalidateRelationships() {
      relationshipRevision += 1;
      kinshipByRoot.clear();

      return relationshipRevision;
    }

    function getKinshipLabels(
      rootId,
      targetIds,
      resolver
    ) {
      const root =
        String(rootId || '');

      if (
        !root ||
        typeof resolver !== 'function'
      ) {
        return new Map();
      }

      let bucket =
        kinshipByRoot.get(root);

      if (
        !bucket ||
        bucket.revision !==
          relationshipRevision
      ) {
        bucket = {
          revision:
            relationshipRevision,
          labels:new Map()
        };

        kinshipByRoot.set(
          root,
          bucket
        );
      }

      const result =
        new Map();

      for (
        const rawTargetId of
        targetIds || []
      ) {
        const targetId =
          String(rawTargetId || '');

        if (!targetId) continue;

        if (
          !bucket.labels.has(
            targetId
          )
        ) {
          bucket.labels.set(
            targetId,
            resolver(
              root,
              targetId
            ) || null
          );
        }

        result.set(
          targetId,
          bucket.labels.get(
            targetId
          )
        );
      }

      return result;
    }

    return {
      signature,
      patchKeyedNodes,
      createSaveCoordinator,
      createRenderCoordinator,
      invalidateRelationships,
      getKinshipLabels,
      getRelationshipRevision() {
        return relationshipRevision;
      }
    };
  }

  global.L1nGGenealogyRuntime =
    Object.freeze({
      create
    });
})(window);
