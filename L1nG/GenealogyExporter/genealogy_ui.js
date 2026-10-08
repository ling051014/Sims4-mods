/* ========【L1nG Genealogy UI】 設定 - 網站表單選擇器 / 建議清單唯一管理層 ======== */
(function (global) {
  'use strict';

  // ========【頂欄／側欄介面】UI 模組管理側欄寬度、選單與提示浮層 ========
  function createChromeController({ dom = {}, constants = {}, helpers = {} } = {}) {
    const { sidebar, sidebarBackdrop, menuToggle, sidebarResizer } = dom;
    const { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_DEFAULT_WIDTH,
      SIDEBAR_WIDTH_KEY, FAMILY_PANEL_COLLAPSED_KEY } = constants;
    const { uiText, iconSvg, scheduleFamilyNameInputWidthSync,
      createDebouncedCallback } = helpers;
    const $ = id => document.getElementById(id);

    function openSidebar() {
      if (!sidebar) return;
      sidebar.classList.add('open');
      sidebarBackdrop?.classList.add('show');
    }
    function closeSidebar() {
      if (!sidebar) return;
      sidebar.classList.remove('open');
      sidebarBackdrop?.classList.remove('show');
    }
    function setFamilyPanelCollapsed(collapsed, { persist = true } = {}) {
      const next = !!collapsed;
      document.body.classList.toggle('family-panel-collapsed', next);
      const btn = $('familyPanelCollapseBtn');
      if (btn) {
        btn.innerHTML = iconSvg(next ? 'chevron-right' : 'chevron-left');
        btn.title = uiText(next ? '展開家族欄' : '收合家族欄');
        btn.setAttribute('aria-label', btn.title);
      }
      if (persist) { try { localStorage.setItem(FAMILY_PANEL_COLLAPSED_KEY, next ? '1' : '0'); } catch (_) {} }
    }
    function restoreFamilyPanelCollapsed() {
      let collapsed = false;
      try { collapsed = localStorage.getItem(FAMILY_PANEL_COLLAPSED_KEY) === '1'; } catch (_) {}
      setFamilyPanelCollapsed(collapsed, { persist:false });
    }
    menuToggle.onclick = () => {
      if (window.innerWidth <= 720) {
        if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
      } else {
        setFamilyPanelCollapsed(!document.body.classList.contains('family-panel-collapsed'));
      }
    };
    sidebarBackdrop.onclick = closeSidebar;
    $('familyPanelCollapseBtn')?.addEventListener('click', () => setFamilyPanelCollapsed(true));

    // ========【共用彈出選單】 設定 - 頂欄、家族與成員操作 ========
    function restoreAppMenuPortal(menu) {
      const popover =
        menu?._bodyPortalPopover;

      if (!popover) return;

      popover.classList.remove(
        'ui-menu-body-portal'
      );

      popover.style.removeProperty('top');
      popover.style.removeProperty('left');
      popover.style.removeProperty('right');
      popover.style.removeProperty('bottom');

      menu.appendChild(popover);
      menu._bodyPortalPopover = null;
    }

    function positionAppMenuPortal(
      menu,
      trigger,
      popover
    ) {
      const margin = 8;
      const gap = 4;
      const triggerRect =
        trigger.getBoundingClientRect();

      document.body.appendChild(popover);

      popover.classList.add(
        'ui-menu-body-portal'
      );

      const popoverRect =
        popover.getBoundingClientRect();

      const left =
        Math.max(
          margin,
          Math.min(
            triggerRect.right -
              popoverRect.width,
            window.innerWidth -
              popoverRect.width -
              margin
          )
        );

      const belowTop =
        triggerRect.bottom + gap;

      const aboveTop =
        triggerRect.top -
        popoverRect.height -
        gap;

      const top =
        belowTop +
          popoverRect.height <=
            window.innerHeight -
              margin
          ? belowTop
          : Math.max(
              margin,
              aboveTop
            );

      popover.style.left =
        Math.round(left) + 'px';

      popover.style.top =
        Math.round(top) + 'px';

      popover.style.right = 'auto';
      popover.style.bottom = 'auto';

      menu._bodyPortalPopover =
        popover;
    }

    function closeAppMenu(menu) {
      if (!menu) return;

      menu.classList.remove('open');

      menu
        .querySelector(
          ':scope > .ui-menu-trigger'
        )
        ?.setAttribute(
          'aria-expanded',
          'false'
        );

      restoreAppMenuPortal(menu);
    }

    function closeAppMenus(except = null) {
      document
        .querySelectorAll(
          '.ui-menu.open'
        )
        .forEach(menu => {
          if (menu === except) return;
          closeAppMenu(menu);
        });
    }

    let _appMenuGlobalBound = false;

    function setupAppMenus() {
      document
        .querySelectorAll('.ui-menu')
        .forEach(menu => {
          const trigger =
            menu.querySelector(
              ':scope > .ui-menu-trigger'
            );

          if (
            !trigger ||
            trigger.dataset.menuBound === '1'
          ) {
            return;
          }

          trigger.dataset.menuBound = '1';

          trigger.addEventListener(
            'click',
            e => {
              e.preventDefault();
              e.stopPropagation();

              const willOpen =
                !menu.classList.contains(
                  'open'
                );

              closeAppMenus(menu);

              if (!willOpen) {
                closeAppMenu(menu);
                return;
              }

              menu.classList.add('open');

              trigger.setAttribute(
                'aria-expanded',
                'true'
              );

              if (
                menu.dataset.menuPortal ===
                'body'
              ) {
                const popover =
                  menu.querySelector(
                    ':scope > .ui-menu-popover'
                  );

                if (popover) {
                  positionAppMenuPortal(
                    menu,
                    trigger,
                    popover
                  );
                }
              }
            }
          );

          menu
            .querySelectorAll(
              '.ui-menu-item'
            )
            .forEach(item =>
              item.addEventListener(
                'click',
                () => {
                  setTimeout(
                    () => closeAppMenus(),
                    0
                  );
                }
              )
            );
        });

      if (!_appMenuGlobalBound) {
        _appMenuGlobalBound = true;

        document.addEventListener(
          'click',
          e => {
            if (
              !e.target.closest?.(
                '.ui-menu, .ui-menu-body-portal'
              )
            ) {
              closeAppMenus();
            }
          }
        );

        document.addEventListener(
          'keydown',
          e => {
            if (e.key === 'Escape') {
              closeAppMenus();
            }
          }
        );

        window.addEventListener(
          'resize',
          () => closeAppMenus()
        );
      }
    }

    // ========【共用說明 Tooltip】 設定 - 掛到 body，避免被 modal overflow 裁切 ========
    function setupHelpTooltipPortal() {
      if ($('globalHelpTooltip')) return;
      const tip = document.createElement('div');
      tip.id = 'globalHelpTooltip';
      tip.setAttribute('role','tooltip');
      document.body.appendChild(tip);
      let active = null;
      const place = () => {
        if (!active || !tip.classList.contains('show')) return;
        const r = active.getBoundingClientRect();
        const tr = tip.getBoundingClientRect();
        const margin = 10, gap = 8;
        const canTop = r.top >= tr.height + gap + margin;
        const side = canTop ? 'top' : 'bottom';
        let left = r.left + r.width / 2 - tr.width / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - tr.width - margin));
        const top = side === 'top' ? r.top - tr.height - gap : r.bottom + gap;
        const arrowX = Math.max(9, Math.min(tr.width - 9, r.left + r.width / 2 - left));
        tip.dataset.side = side;
        tip.style.left = `${Math.round(left)}px`; tip.style.top = `${Math.round(top)}px`;
        tip.style.setProperty('--tooltip-arrow-x', `${Math.round(arrowX)}px`);
      };
      const show = target => {
        const text = target?.dataset?.tooltip; if (!text) return;
        active = target; tip.textContent = text; tip.classList.add('show');
        requestAnimationFrame(place);
      };
      const hide = target => { if (!target || target === active) { tip.classList.remove('show'); active = null; } };
      document.addEventListener('mouseover', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) show(t); });
      document.addEventListener('mouseout', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t && !t.contains(e.relatedTarget)) hide(t); });
      document.addEventListener('focusin', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) show(t); });
      document.addEventListener('focusout', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) hide(t); });
      document.addEventListener('click', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) { e.stopPropagation(); active===t && tip.classList.contains('show') ? hide(t) : show(t); } else hide(); });
      window.addEventListener('resize', place);
      document.addEventListener('scroll', place, true);
    }

    // ========【側邊欄寬度】 設定 - 桌面版拖曳調整並保存寬度 ========
    function getSidebarMaxWidth() {
      // 避免側邊欄在較窄桌面畫面佔掉過多族譜工作區
      return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.floor(window.innerWidth * 0.42)));
    }

    function clampSidebarWidth(value) {
      const width = Number(value);
      if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH;
      return Math.max(SIDEBAR_MIN_WIDTH, Math.min(getSidebarMaxWidth(), Math.round(width)));
    }

    function applySidebarWidth(value, { persist = true } = {}) {
      const width = clampSidebarWidth(value);
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
      scheduleFamilyNameInputWidthSync();
      if (sidebarResizer) sidebarResizer.setAttribute('aria-valuenow', String(width));
      if (persist) {
        try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width)); } catch (_) {}
      }
      return width;
    }

    function restoreSidebarWidth() {
      let saved = SIDEBAR_DEFAULT_WIDTH;
      try { saved = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || SIDEBAR_DEFAULT_WIDTH; } catch (_) {}
      applySidebarWidth(saved, { persist: false });
    }

    restoreSidebarWidth();

    if (sidebarResizer) {
      sidebarResizer.setAttribute('aria-valuemin', String(SIDEBAR_MIN_WIDTH));
      sidebarResizer.setAttribute('aria-valuemax', String(SIDEBAR_MAX_WIDTH));

      sidebarResizer.addEventListener('pointerdown', e => {
        if (window.innerWidth <= 720 || document.body.classList.contains('family-panel-collapsed')) return;
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebar.getBoundingClientRect().width;
        document.body.classList.add('sidebar-resizing');
        try { sidebarResizer.setPointerCapture(e.pointerId); } catch (_) {}

        const onMove = ev => {
          applySidebarWidth(startWidth + (ev.clientX - startX));
        };

        const onUp = () => {
          sidebarResizer.removeEventListener('pointermove', onMove);
          sidebarResizer.removeEventListener('pointerup', onUp);
          sidebarResizer.removeEventListener('pointercancel', onUp);
          document.body.classList.remove('sidebar-resizing');
        };

        sidebarResizer.addEventListener('pointermove', onMove);
        sidebarResizer.addEventListener('pointerup', onUp);
        sidebarResizer.addEventListener('pointercancel', onUp);
      });

      sidebarResizer.addEventListener('dblclick', () => {
        applySidebarWidth(SIDEBAR_DEFAULT_WIDTH);
      });

      sidebarResizer.addEventListener('keydown', e => {
        if (window.innerWidth <= 720) return;
        const current = sidebar.getBoundingClientRect().width;
        const step = e.shiftKey ? 20 : 8;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          applySidebarWidth(current - step);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          applySidebarWidth(current + step);
        } else if (e.key === 'Home') {
          e.preventDefault();
          applySidebarWidth(SIDEBAR_MIN_WIDTH);
        } else if (e.key === 'End') {
          e.preventDefault();
          applySidebarWidth(getSidebarMaxWidth());
        }
      });
    }

    window.addEventListener('resize', createDebouncedCallback(() => {
      if (window.innerWidth > 720) {
        const current = sidebar.getBoundingClientRect().width;
        const clamped = clampSidebarWidth(current);
        if (Math.abs(clamped - current) > 0.5) applySidebarWidth(clamped);
      }
    }, 80));



    return Object.freeze({
      openSidebar,
      closeSidebar,
      setFamilyPanelCollapsed,
      restoreFamilyPanelCollapsed,
      setupAppMenus,
      closeAppMenus,
      setupHelpTooltipPortal,
      getSidebarMaxWidth,
      clampSidebarWidth,
      applySidebarWidth,
      restoreSidebarWidth
    });
  }

  // ========【共用對話視窗】UI 管理確認、提示、輸入及載入按鈕 ========
  function createDialogController({ uiText = value => String(value ?? ''), esc = value => String(value ?? '') } = {}) {
    const $ = id => document.getElementById(id);
    let _uiDialogResolve = null;
    let _uiDialogMode = 'alert';

    function closeUiDialog(result = null) {
      const overlay = $('confirmationDialog');
      if (!overlay || !overlay.classList.contains('show')) return;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      const resolve = _uiDialogResolve;
      _uiDialogResolve = null;
      if (resolve) resolve(result);
    }

    function openUiDialog({
      title = '提示',
      message = '',
      mode = 'alert',
      kind = 'default',
      defaultValue = '',
      confirmText = '確定',
      cancelText = '取消',
      secondaryText = '',
      secondaryValue = null,
      secondaryKind = 'default',
      secondaryHint = '',
      confirmHint = '',
      confirmValue = true,
      cancelValue = mode === 'confirm' ? false : null
    } = {}) {
      const overlay = $('confirmationDialog');
      const dialog = $('uiDialog');
      const titleEl = $('uiDialogTitle');
      const messageEl = $('uiDialogMessage');
      const inputEl = $('uiDialogInput');
      const cancelBtn = $('uiDialogCancel');
      const secondaryBtn = $('uiDialogSecondary');
      const confirmBtn = $('uiDialogConfirm');
      const titleHint = $('uiDialogTitleHint');
      const closeBtn = $('uiDialogClose');

      if (!overlay || !dialog || !titleEl || !messageEl || !inputEl || !cancelBtn || !secondaryBtn || !confirmBtn || !titleHint || !closeBtn) {
        return Promise.resolve(
          mode === 'confirm'
            ? false
            : mode === 'choice'
              ? null
              : mode === 'prompt'
                ? null
                : true
        );
      }

      if (_uiDialogResolve) closeUiDialog(null);
      _uiDialogMode = mode;
      titleEl.textContent = uiText(title);
      // 先嘗試翻譯完整訊息，讓跨行確認文案與動態樣式能一次正確處理；
      // 若沒有完整對應，再逐行翻譯，避免英文介面殘留繁中文字。
      const rawMessage = String(message ?? '');
      const wholeMessage = uiText(rawMessage);
      messageEl.textContent = wholeMessage !== rawMessage
        ? wholeMessage
        : rawMessage.split('\n').map(line => uiText(line)).join('\n');
      dialog.dataset.kind = kind;
      const hasSecondaryAction =
        !!String(secondaryText || '').trim();

      dialog.dataset.actionCount =
        mode === 'alert'
          ? '1'
          : hasSecondaryAction
            ? '3'
            : '2';

      confirmBtn.textContent = uiText(confirmText);
      cancelBtn.textContent = uiText(cancelText);
      cancelBtn.style.display = mode === 'alert' ? 'none' : '';

      secondaryBtn.textContent =
        hasSecondaryAction
          ? uiText(secondaryText)
          : '';

      secondaryBtn.hidden =
        !hasSecondaryAction;

      secondaryBtn.classList.toggle(
        'danger',
        hasSecondaryAction &&
        secondaryKind === 'danger'
      );

      const confirmHintText =
        String(confirmHint || '').trim();

      const secondaryHintText =
        String(secondaryHint || '').trim();

      const titleHintSections = [];

      if (confirmHintText) {
        titleHintSections.push(
          `${uiText(confirmText)}：${uiText(confirmHintText)}`
        );
      }

      if (
        hasSecondaryAction &&
        secondaryHintText
      ) {
        titleHintSections.push(
          `${uiText(secondaryText)}：${uiText(secondaryHintText)}`
        );
      }

      const titleHintText =
        titleHintSections.join('\n\n');

      titleHint.hidden =
        !titleHintText;

      if (titleHintText) {
        titleHint.dataset.tooltip =
          titleHintText;

        titleHint.setAttribute(
          'aria-label',
          uiText('匯入方式說明')
        );
      } else {
        delete titleHint.dataset.tooltip;
      }

      inputEl.classList.toggle('show', mode === 'prompt');
      inputEl.value = mode === 'prompt' ? uiText(defaultValue) : '';

      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden', 'false');

      return new Promise(resolve => {
        _uiDialogResolve = resolve;

        const finishConfirm = () => {
          if (mode === 'prompt') {
            closeUiDialog(inputEl.value);
            return;
          }

          closeUiDialog(confirmValue);
        };

        const finishSecondary = () =>
          closeUiDialog(secondaryValue);

        const finishCancel = () =>
          closeUiDialog(cancelValue);

        confirmBtn.onclick = finishConfirm;
        secondaryBtn.onclick =
          hasSecondaryAction
            ? finishSecondary
            : null;
        cancelBtn.onclick = finishCancel;
        closeBtn.onclick = finishCancel;
        overlay.onclick = event => {
          if (event.target === overlay) finishCancel();
        };

        inputEl.onkeydown = event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            finishConfirm();
          }
        };

        requestAnimationFrame(() => {
          if (mode === 'prompt') {
            inputEl.focus();
            inputEl.select();
            return;
          }

          dialog.focus({
            preventScroll:true
          });
        });
      });
    }

    function uiAlert(message, options = {}) {
      return openUiDialog({
        title: options.title || '提示',
        message,
        mode: 'alert',
        kind: options.kind || 'default',
        confirmText: options.confirmText || '確定'
      });
    }

    function uiConfirm(message, options = {}) {
      return openUiDialog({
        title: options.title || '請確認',
        message,
        mode: 'confirm',
        kind: options.kind || 'default',
        confirmText: options.confirmText || '確定',
        cancelText: options.cancelText || '取消'
      });
    }

    function uiPrompt(message, defaultValue = '', options = {}) {
      return openUiDialog({
        title: options.title || '輸入資料',
        message,
        mode: 'prompt',
        kind: options.kind || 'default',
        defaultValue,
        confirmText: options.confirmText || '確定',
        cancelText: options.cancelText || '取消'
      });
    }

    function uiToast(message, duration = 2600) {
      const region = $('toastRegion');
      if (!region) return;
      const toast = document.createElement('div');
      toast.className = 'ui-toast';
      toast.textContent = uiText(message);
      region.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
        toast.style.transition = 'opacity .18s ease, transform .18s ease';
        setTimeout(() => toast.remove(), 200);
      }, duration);
    }

    const actionButtonLoadingState =
      new WeakMap();

    function setActionButtonLoading(
      button,
      loading,
      label = ''
    ) {
      if (!button) return;

      if (loading) {
        if (
          actionButtonLoadingState
            .has(button)
        ) {
          return;
        }

        const measuredWidth =
          Math.ceil(
            button
              .getBoundingClientRect()
              .width
          );

        actionButtonLoadingState.set(
          button,
          {
            html:button.innerHTML,
            disabled:button.disabled,
            minWidth:button.style.minWidth
          }
        );

        if (measuredWidth > 0) {
          button.style.minWidth =
            measuredWidth + 'px';
        }

        button.disabled = true;
        button.classList.add(
          'is-loading'
        );
        button.setAttribute(
          'aria-busy',
          'true'
        );

        const loadingLabel =
          uiText(label || '處理中')
            .replace(/[.…]+$/u,'');

        button.innerHTML =
          '<span class="button-loading-label">' +
            esc(loadingLabel) +
          '</span>' +
          '<span class="button-loading-dots" aria-hidden="true">' +
            '<span></span><span></span><span></span>' +
          '</span>';

        return;
      }

      const state =
        actionButtonLoadingState
          .get(button);

      if (!state) return;

      button.innerHTML =
        state.html;

      button.disabled =
        state.disabled;

      button.style.minWidth =
        state.minWidth;

      button.classList.remove(
        'is-loading'
      );
      button.removeAttribute(
        'aria-busy'
      );

      actionButtonLoadingState
        .delete(button);
    }

    async function withActionButtonLoading(
      button,
      label,
      action
    ) {
      if (
        !button ||
        actionButtonLoadingState.has(button)
      ) {
        return;
      }

      setActionButtonLoading(
        button,
        true,
        label
      );

      // 等兩個 animation frame：第一幀提交 loading 狀態，第二幀再開始工作，
      // 避免同步儲存與關窗搶在瀏覽器真正繪製「儲存中」之前完成。
      await new Promise(resolve =>
        requestAnimationFrame(() =>
          requestAnimationFrame(resolve)
        )
      );

      try {
        return await action();
      } finally {
        setActionButtonLoading(
          button,
          false
        );
      }
    }


    document.addEventListener('keydown', event => {
      const overlay = $('confirmationDialog');
      if (!overlay || !overlay.classList.contains('show')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeUiDialog(_uiDialogMode === 'confirm' ? false : null);
      }
    });



    return Object.freeze({
      open:openUiDialog,
      close:closeUiDialog,
      alert:uiAlert,
      confirm:uiConfirm,
      prompt:uiPrompt,
      toast:uiToast,
      withActionButtonLoading
    });
  }

  // 各視窗自行關閉，UI 只選擇當前最上層可見的視窗。
  function closeTopmostDialog(lifecycles) {
    for (const lifecycle of lifecycles || []) {
      if (!lifecycle.dialog || !lifecycle.dialog.classList.contains('show')) continue;
      lifecycle.close();
      return true;
    }
    return false;
  }

  function create({ helpers = {} } = {}) {
    const uiText = typeof helpers.uiText === 'function' ? helpers.uiText : value => String(value ?? '');
    const esc = typeof helpers.esc === 'function' ? helpers.esc : value => String(value ?? '');
    const iconSvg = typeof helpers.iconSvg === 'function' ? helpers.iconSvg : () => '';
    const debounce = typeof helpers.debounce === 'function' ? helpers.debounce : fn => fn;
    const normalizeCreatableValue =
      typeof helpers.normalizeCreatableValue === 'function'
        ? helpers.normalizeCreatableValue
        : value => String(value || '').trim();
    const createOptionText =
      typeof helpers.createOptionText === 'function'
        ? helpers.createOptionText
        : value => String(value || '');

    const controllers = new Set();
    const controllerById = new Map();
    const controllerBySource = new WeakMap();

    // ========【虛擬選項資料源】 設定 - 大型下拉不必把全部候選人複製進多個原生 select ========
    const optionProviders = new Map();

    let formObserver = null;
    let activeController = null;
    let activeKeyboardIndex = -1;

    function emitChange(source) {
      source.dispatchEvent(new Event('change', { bubbles:true }));
    }

    function registerController(controller, source) {
      controllers.add(controller);

      if (source) {
        controllerBySource.set(
          source,
          controller
        );

        if (source.id) {
          controllerById.set(
            source.id,
            controller
          );
        }
      }

      return controller;
    }

    function unregisterController(controller) {
      if (!controller) return;

      try {
        controller.close?.();
      } catch (_) {}

      controller.popup?.remove?.();
      controllers.delete(controller);

      const source =
        controller.source;

      if (source) {
        controllerBySource.delete(
          source
        );

        if (
          source.id &&
          controllerById.get(
            source.id
          ) === controller
        ) {
          controllerById.delete(
            source.id
          );
        }
      }

      clearActive(controller);
    }

    function pruneDisconnectedControllers() {
      [...controllers]
        .forEach(controller => {
          const source =
            controller.source;

          if (
            source &&
            !source.isConnected
          ) {
            unregisterController(
              controller
            );
          }
        });
    }

    function clearActive(controller) {
      if (activeController === controller) {
        activeController = null;
        activeKeyboardIndex = -1;
      }
    }

    function activate(controller) {
      if (activeController && activeController !== controller) {
        activeController.close();
      }
      activeController = controller;
      activeKeyboardIndex = -1;
    }

    function positionPortal(anchor, popup, {
      minWidth = 120,
      maxWidth = 420,
      maxHeight = 320
    } = {}) {
      if (!anchor || !popup) return;

      const rect = anchor.getBoundingClientRect();
      const margin = 10;
      const gap = 5;
      const viewportWidth = Math.max(1, global.innerWidth || document.documentElement.clientWidth || 1);
      const viewportHeight = Math.max(1, global.innerHeight || document.documentElement.clientHeight || 1);
      const width = Math.min(
        Math.max(minWidth, rect.width),
        Math.max(minWidth, Math.min(maxWidth, viewportWidth - margin * 2))
      );
      const left = Math.min(
        Math.max(margin, rect.left),
        Math.max(margin, viewportWidth - width - margin)
      );
      const below = viewportHeight - rect.bottom - gap - margin;
      const above = rect.top - gap - margin;
      const openAbove = below < 190 && above > below;
      const available = Math.max(140, openAbove ? above : below);
      const height = Math.min(maxHeight, available);

      popup.style.position = 'fixed';
      popup.style.width = Math.round(width) + 'px';
      popup.style.left = Math.round(left) + 'px';
      popup.style.maxHeight = Math.round(height) + 'px';
      popup.style.top = openAbove
        ? Math.round(Math.max(margin, rect.top - Math.min(height, popup.scrollHeight || height) - gap)) + 'px'
        : Math.round(rect.bottom + gap) + 'px';
      popup.dataset.uiSide = openAbove ? 'top' : 'bottom';
    }

    function keyboardOptions(container) {
      return [...container.querySelectorAll('.ui-select-option:not(.disabled)')];
    }

    function setKeyboardIndex(container, nextIndex) {
      const items = keyboardOptions(container);
      if (!items.length) {
        activeKeyboardIndex = -1;
        return;
      }

      activeKeyboardIndex =
        ((nextIndex % items.length) + items.length) % items.length;

      items.forEach((item, index) => {
        item.classList.toggle('keyboard-active', index === activeKeyboardIndex);
      });

      items[activeKeyboardIndex]?.scrollIntoView({
        block:'nearest'
      });
    }

    function moveKeyboardIndex(container, delta) {
      const items = keyboardOptions(container);
      if (!items.length) return;

      if (activeKeyboardIndex < 0) {
        const selectedIndex = items.findIndex(item => item.classList.contains('selected'));
        activeKeyboardIndex = selectedIndex >= 0 ? selectedIndex : 0;
      } else {
        activeKeyboardIndex += delta;
      }

      setKeyboardIndex(container, activeKeyboardIndex);
    }

    function resetKeyboardIndex(container) {
      activeKeyboardIndex = -1;
      container.querySelectorAll('.keyboard-active').forEach(item => {
        item.classList.remove('keyboard-active');
      });
    }

    function registerOptionProvider(name, provider) {
      const key = String(name || '').trim();

      if (
        !key ||
        typeof provider !== 'function'
      ) {
        return false;
      }

      optionProviders.set(
        key,
        provider
      );

      return true;
    }

    function unregisterOptionProvider(name) {
      return optionProviders.delete(
        String(name || '').trim()
      );
    }

    function normalizeProvidedOption(item) {
      if (
        !item ||
        item.value == null
      ) {
        return null;
      }

      const value =
        String(item.value);

      return {
        value,
        label:
          String(
            item.label ??
            item.text ??
            value
          ),
        selected:
          item.selected === true,
        disabled:
          item.disabled === true,
        note:
          String(
            item.note ||
            ''
          )
      };
    }

    function createSearchableSelect(wrap) {
      const selectId = String(wrap.dataset.uiSelectFor || '');
      if (!selectId) return null;

      const select = document.getElementById(selectId);
      if (!select) return null;

      const existing = controllerBySource.get(select);
      if (existing) return existing;

      const input = wrap.querySelector('.ui-select-input');
      const dropdown = wrap.querySelector('.ui-select-dropdown');
      const search = wrap.querySelector('.ui-select-search');
      const optionsHost = wrap.querySelector('.ui-select-options');

      if (!input || !dropdown || !search || !optionsHost) return null;

      const multiple = !!select.multiple;
      const creatable = wrap.dataset.uiSelectCreatable === 'true';
      const portal = wrap.dataset.uiSelectPortal === 'true';
      const addOnly =
        multiple &&
        wrap.dataset.uiSelectMode === 'add-only';

      const providerName =
        String(
          wrap.dataset.uiSelectProvider ||
          ''
        ).trim();

      const placeholderSource = wrap.dataset.placeholder || '點選選擇…';
      const home = { parent:dropdown.parentNode, next:dropdown.nextSibling };

      function nativeOptionModel(option) {
        return {
          value:String(option.value),
          label:String(option.textContent || ''),
          selected:!!option.selected,
          disabled:!!option.disabled,
          note:String(option.dataset.uiSelectNote || '')
        };
      }

      function optionModels() {
        const provider =
          providerName
            ? optionProviders.get(
                providerName
              )
            : null;

        if (!provider) {
          return [...select.options]
            .map(nativeOptionModel);
        }

        let provided = [];

        try {
          const result =
            provider({
              selectId,
              select,
              wrap
            });

          if (Array.isArray(result)) {
            provided = result;
          }
        } catch (_) {
          provided = [];
        }

        const nativeByValue =
          new Map(
            [...select.options]
              .map(option=>[
                String(option.value),
                option
              ])
          );

        const models = [];
        const seen = new Set();

        provided
          .map(normalizeProvidedOption)
          .filter(Boolean)
          .forEach(model=>{
            const native =
              nativeByValue.get(
                model.value
              );

            if (native) {
              model.selected =
                !!native.selected;

              model.disabled =
                !!native.disabled ||
                model.disabled;

              model.note =
                String(
                  native.dataset
                    .uiSelectNote ||
                  model.note ||
                  ''
                );
            }

            models.push(model);
            seen.add(model.value);
          });

        // 已選或曾操作過的項目即使暫時不在 provider 候選中，也必須保留。
        nativeByValue.forEach((option,value)=>{
          if(seen.has(value))return;
          models.push(
            nativeOptionModel(
              option
            )
          );
        });

        return models;
      }

      function ensureNativeOption(model) {
        const value =
          String(
            model?.value ??
            ''
          );

        let option =
          [...select.options]
            .find(item=>
              String(item.value)===
              value
            );

        if (!option) {
          option =
            document.createElement(
              'option'
            );

          option.value=value;
          option.textContent=
            String(
              model?.label ??
              value
            );

          select.appendChild(
            option
          );
        }

        if (
          model &&
          model.label != null
        ) {
          option.textContent=
            String(model.label);
        }

        option.disabled=
          model?.disabled === true;

        const note=
          String(
            model?.note ||
            ''
          );

        if(note){
          option.dataset
            .uiSelectNote=note;
        }else{
          delete option.dataset
            .uiSelectNote;
        }

        return option;
      }

      function restoreHome() {
        if (!portal || dropdown.parentNode === home.parent) return;
        dropdown.classList.remove('ui-select-dropdown-portal');
        ['left','top','width','max-height','position'].forEach(name => dropdown.style.removeProperty(name));

        if (home.next && home.next.parentNode === home.parent) {
          home.parent.insertBefore(dropdown, home.next);
        } else {
          home.parent.appendChild(dropdown);
        }
      }

      function position() {
        if (!portal || !wrap.classList.contains('ui-select-open')) return;

        if (dropdown.parentNode !== document.body) {
          document.body.appendChild(dropdown);
        }

        dropdown.classList.add('ui-select-dropdown-portal');
        positionPortal(input, dropdown, {
          minWidth:280,
          maxWidth:520,
          maxHeight:360
        });
      }

      function paintSelection() {
        const placeholder = uiText(placeholderSource);

        if (multiple) {
          if (addOnly) {
            input.innerHTML =
              '<span class="ui-select-add-label">' +
                iconSvg('plus-lg') +
                '<span>' +
                  esc(placeholder) +
                '</span>' +
              '</span>';
          } else {
            const selected = [...select.options].filter(option => option.selected);

            input.innerHTML = selected.length
              ? selected.map(option => {
                  const locked = option.disabled;
                  const note = option.dataset.uiSelectNote || '';

                  return (
                    '<span class="ui-select-tag' + (locked ? ' locked' : '') + '"' +
                    (note ? ' title="' + esc(note) + '"' : '') + '>' +
                    esc(option.textContent) +
                    (locked
                      ? '<span class="ui-select-tag-note">' + esc(uiText('自動')) + '</span>'
                      : '<span class="ui-select-tag-x" data-remove="' + esc(option.value) + '" title="' + esc(uiText('移除')) + '">×</span>') +
                    '</span>'
                  );
                }).join('')
              : '<span class="ui-select-placeholder">' + esc(placeholder) + '</span>';

            input.querySelectorAll('.ui-select-tag-x').forEach(remove => {
              remove.onclick = event => {
                event.stopPropagation();

                const option = [...select.options].find(item => item.value === remove.dataset.remove);
                if (option) option.selected = false;

                paintSelection();
                paintOptions(search.value);
                emitChange(select);
              };
            });
          }
        } else {
          const selected = select.options[select.selectedIndex];

          input.innerHTML =
            !selected
              ? '<span class="ui-select-placeholder">' + esc(placeholder) + '</span>'
              : '<span class="ui-single-select-value">' + esc(selected.textContent) + '</span>';
        }

        input.insertAdjacentHTML(
          'beforeend',
          iconSvg('chevron-down', 'ui-select-chevron-icon')
        );
      }

      function close() {
        dropdown.style.display = 'none';
        wrap.classList.remove('ui-select-open');
        input.setAttribute('aria-expanded', 'false');
        resetKeyboardIndex(optionsHost);
        restoreHome();
        clearActive(api);
      }

      function selectSingle(option) {
        [...select.options].forEach(item => {
          item.selected = false;
        });

        option.selected = true;
        paintSelection();
        emitChange(select);
        close();
      }

      function commit(rawValue) {
        if (!creatable) return '';

        const value = normalizeCreatableValue(rawValue);
        if (!value) return '';

        let option = [...select.options].find(item =>
          item.value === value ||
          item.textContent.trim().toLowerCase() === value.toLowerCase()
        );

        if (!option) {
          option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        }

        selectSingle(option);
        return option.value;
      }

      function paintOptions(filter = '') {
        const raw = String(filter || '').trim();
        const query = raw.toLowerCase();
        const options = optionModels();

        const availableOptions =
          addOnly
            ? options.filter(option =>
                !option.selected &&
                !option.disabled
              )
            : options;

        const filtered = query
          ? availableOptions.filter(option =>
              option.label
                .toLowerCase()
                .includes(query)
            )
          : availableOptions;

        const hasExact =
          !!raw &&
          options.some(option =>
            option.value === raw ||
            option.label
              .trim()
              .toLowerCase() === query
          );

        const optionHTML =
          filtered
            .map(option => {
              const empty =
                option.value === '';

              const classes = [
                'ui-select-option',
                option.selected
                  ? 'selected'
                  : '',
                option.disabled
                  ? 'disabled'
                  : '',
                empty
                  ? 'none'
                  : ''
              ]
                .filter(Boolean)
                .join(' ');

              const check =
                multiple &&
                !empty
                  ? '<span class="check">' +
                    (
                      option.selected
                        ? iconSvg('check-lg')
                        : ''
                    ) +
                    '</span>'
                  : '';

              const selectedIcon =
                !multiple &&
                option.selected
                  ? '<span class="ui-select-option-selected-icon">' +
                    iconSvg('check-lg') +
                    '</span>'
                  : '';

              return (
                '<div class="' +
                classes +
                '" data-value="' +
                esc(option.value) +
                '"' +
                (
                  option.disabled
                    ? ' aria-disabled="true"'
                    : ''
                ) +
                ' role="option" aria-selected="' +
                (
                  option.selected
                    ? 'true'
                    : 'false'
                ) +
                '">' +
                  check +
                  '<span>' +
                    esc(option.label) +
                  '</span>' +
                  (
                    option.note
                      ? '<span class="ui-select-option-note">' +
                        esc(option.note) +
                        '</span>'
                      : ''
                  ) +
                  selectedIcon +
                '</div>'
              );
            })
            .join('');

        const createHTML =
          creatable &&
          raw &&
          !hasExact
            ? '<div class="ui-select-option" data-create-value="' +
              esc(raw) +
              '" role="option"><span>' +
              esc(
                createOptionText(raw)
              ) +
              '</span></div>'
            : '';

        optionsHost.innerHTML =
          optionHTML ||
          createHTML
            ? optionHTML +
              createHTML
            : '<div class="ui-select-empty">' +
              esc(
                uiText(
                  '沒有符合的項目'
                )
              ) +
              '</div>';

        resetKeyboardIndex(
          optionsHost
        );

        optionsHost
          .querySelectorAll(
            '.ui-select-option[data-value]'
          )
          .forEach(element => {
            element.onclick = event => {
              event.stopPropagation();

              const model =
                optionModels()
                  .find(item =>
                    item.value ===
                    element.dataset.value
                  );

              if (
                !model ||
                model.disabled
              ) {
                return;
              }

              const option =
                ensureNativeOption(
                  model
                );

              if (multiple) {
                option.selected =
                  addOnly
                    ? true
                    : !option.selected;

                paintSelection();
                paintOptions(
                  search.value
                );
                emitChange(
                  select
                );

                if (portal) {
                  global
                    .requestAnimationFrame(
                      position
                    );
                }
              } else {
                selectSingle(
                  option
                );
              }
            };
          });

        optionsHost
          .querySelectorAll(
            '[data-create-value]'
          )
          .forEach(element => {
            element.onclick = event => {
              event.stopPropagation();
              commit(
                element.dataset
                  .createValue
              );
            };
          });
      }

      function open() {
        activate(api);
        dropdown.style.display = '';
        wrap.classList.add('ui-select-open');
        input.setAttribute('aria-expanded', 'true');
        search.value = '';
        paintSelection();
        paintOptions();

        if (portal) {
          global.requestAnimationFrame(() => {
            position();
            global.requestAnimationFrame(position);
          });
        }

        global.setTimeout(() => search.focus(), 30);
      }

      function refresh() {
        paintSelection();

        if (!wrap.classList.contains('ui-select-open')) return;

        paintOptions(search.value);
        if (portal) global.requestAnimationFrame(position);
      }

      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-haspopup', 'listbox');
      input.setAttribute('aria-expanded', 'false');
      optionsHost.setAttribute('role', 'listbox');

      input.onclick = event => {
        if (event.target.closest('.ui-select-tag-x')) return;
        wrap.classList.contains('ui-select-open') ? close() : open();
      };

      input.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          open();
        }
      };

      search.oninput = () => paintOptions(search.value);
      search.onkeydown = event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
          input.focus();
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveKeyboardIndex(optionsHost, 1);
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveKeyboardIndex(optionsHost, -1);
          return;
        }

        if (event.key === 'Enter') {
          const items = keyboardOptions(optionsHost);
          const active = activeKeyboardIndex >= 0 ? items[activeKeyboardIndex] : null;

          if (active) {
            event.preventDefault();
            active.click();
            return;
          }

          if (creatable && search.value.trim()) {
            event.preventDefault();
            commit(search.value);
          }
        }
      };

      const api = {
        type:'searchable',
        source:select,
        refresh,
        open,
        close,
        position,
        pendingValue:() => normalizeCreatableValue(search.value),
        commit,
        popup:dropdown,
        containsTarget:target => wrap.contains(target) || dropdown.contains(target)
      };

      registerController(api, select);
      paintSelection();
      return api;
    }

    function inferLabelText(source) {
      const explicit =
        source.getAttribute('aria-label') ||
        '';

      if (explicit) return explicit;

      const labelledBy =
        source.getAttribute('aria-labelledby');

      if (labelledBy) {
        const label = document.getElementById(labelledBy);
        if (label) return label.textContent.trim();
      }

      if (source.id) {
        const label = document.querySelector('label[for="' + CSS.escape(source.id) + '"]');
        if (label) return label.textContent.trim();
      }

      const implicit = source.closest('label');
      if (implicit) {
        const clone = implicit.cloneNode(true);
        clone.querySelectorAll('input,select,textarea,button,datalist').forEach(node => node.remove());
        const text = clone.textContent.replace(/\s+/g, ' ').trim();
        if (text) return text;
      }

      return uiText('選擇項目');
    }

    function eligibleSingleSelect(select) {
      return (
        select instanceof global.HTMLSelectElement &&
        !select.multiple &&
        !select.hasAttribute('hidden') &&
        !select.classList.contains('nav-native-select') &&
        !select.closest('.ui-select-wrap') &&
        !select.closest('.ui-single-select')
      );
    }

    function createSingleSelect(select) {
      if (!eligibleSingleSelect(select)) return null;

      const existing = controllerBySource.get(select);
      if (existing) return existing;

      const host = document.createElement('span');
      host.className = 'ui-single-select';

      const compact =
        select.dataset.uiCompact === 'true';

      const matchPopoverWidth =
        select.dataset.uiPopoverMatchWidth === 'true';

      if (compact) {
        host.classList.add('ui-single-select-compact');
      }

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'ui-select-input ui-single-select-trigger';
      trigger.setAttribute('role', 'combobox');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');

      const menu = document.createElement('div');
      menu.className = 'ui-select-dropdown ui-select-dropdown-portal ui-single-select-menu';
      menu.style.display = 'none';

      const optionsHost = document.createElement('div');
      optionsHost.className = 'ui-select-options';
      optionsHost.setAttribute('role', 'listbox');
      menu.appendChild(optionsHost);

      const parent = select.parentNode;
      if (!parent) return null;

      parent.insertBefore(host, select);
      host.appendChild(select);
      host.appendChild(trigger);

      select.classList.add('ui-control-source');
      select.setAttribute('aria-hidden', 'true');
      select.tabIndex = -1;

      const sourceLabelledBy = select.getAttribute('aria-labelledby');
      const sourceLabel = select.getAttribute('aria-label');

      if (sourceLabelledBy) {
        trigger.setAttribute('aria-labelledby', sourceLabelledBy);
      } else {
        trigger.setAttribute('aria-label', sourceLabel || inferLabelText(select));
      }

      function paintTrigger() {
        const option = select.options[select.selectedIndex];
        const text = option ? option.textContent : '';

        trigger.innerHTML =
          '<span class="ui-single-select-value">' + esc(text) + '</span>' +
          iconSvg('chevron-down', 'ui-select-chevron-icon');

        trigger.disabled = !!select.disabled;
      }

      function paintOptions() {
        optionsHost.innerHTML =
          [...select.options].map(option => {
            const classes = [
              'ui-select-option',
              option.selected ? 'selected' : '',
              option.disabled ? 'disabled' : '',
              option.value === '' ? 'none' : ''
            ].filter(Boolean).join(' ');

            return (
              '<div class="' + classes + '" data-value="' + esc(option.value) + '"' +
              (option.disabled ? ' aria-disabled="true"' : '') +
              ' role="option" aria-selected="' + (option.selected ? 'true' : 'false') + '">' +
              '<span>' + esc(option.textContent) + '</span>' +
              (option.selected
                ? '<span class="ui-select-option-selected-icon">' + iconSvg('check-lg') + '</span>'
                : '') +
              '</div>'
            );
          }).join('');

        resetKeyboardIndex(optionsHost);

        optionsHost.querySelectorAll('.ui-select-option[data-value]').forEach(element => {
          element.onclick = event => {
            event.preventDefault();
            event.stopPropagation();

            const option = [...select.options].find(item => item.value === element.dataset.value);
            if (!option || option.disabled) return;

            select.value = option.value;
            emitChange(select);
            refresh();
            close();
            trigger.focus();
          };
        });
      }

      function position() {
        if (!host.classList.contains('ui-select-open')) return;

        const triggerWidth =
          Math.max(
            1,
            trigger.getBoundingClientRect().width
          );

        positionPortal(trigger, menu, {
          minWidth:
            matchPopoverWidth
              ? triggerWidth
              : Math.max(120,triggerWidth),
          maxWidth:
            matchPopoverWidth
              ? triggerWidth
              : 420,
          maxHeight:320
        });
      }

      function open() {
        if (select.disabled) return;

        activate(api);
        paintTrigger();
        paintOptions();

        if (menu.parentNode !== document.body) {
          document.body.appendChild(menu);
        }

        menu.style.display = '';
        host.classList.add('ui-select-open');
        trigger.setAttribute('aria-expanded', 'true');

        global.requestAnimationFrame(() => {
          position();
          const selected = optionsHost.querySelector('.ui-select-option.selected');
          selected?.scrollIntoView({ block:'nearest' });
        });
      }

      function close() {
        menu.style.display = 'none';
        host.classList.remove('ui-select-open');
        trigger.setAttribute('aria-expanded', 'false');
        resetKeyboardIndex(optionsHost);
        clearActive(api);
      }

      function refresh() {
        paintTrigger();

        if (host.classList.contains('ui-select-open')) {
          paintOptions();
          global.requestAnimationFrame(position);
        }
      }

      trigger.addEventListener('click', event => {
        event.preventDefault();
        host.classList.contains('ui-select-open') ? close() : open();
      });

      trigger.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          if (host.classList.contains('ui-select-open')) {
            event.preventDefault();
            close();
          }
          return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();

          if (!host.classList.contains('ui-select-open')) {
            open();
          }

          moveKeyboardIndex(optionsHost, event.key === 'ArrowDown' ? 1 : -1);
          return;
        }

        if (event.key === 'Home' || event.key === 'End') {
          if (!host.classList.contains('ui-select-open')) return;
          event.preventDefault();
          const items = keyboardOptions(optionsHost);
          if (items.length) setKeyboardIndex(optionsHost, event.key === 'Home' ? 0 : items.length - 1);
          return;
        }

        if ((event.key === 'Enter' || event.key === ' ') && host.classList.contains('ui-select-open')) {
          event.preventDefault();
          const items = keyboardOptions(optionsHost);
          const active = activeKeyboardIndex >= 0 ? items[activeKeyboardIndex] : null;
          (active || optionsHost.querySelector('.ui-select-option.selected') || items[0])?.click();
        }
      });

      select.addEventListener('change', refresh);

      const api = {
        type:'single',
        source:select,
        host,
        refresh,
        open,
        close,
        position,
        popup:menu,
        containsTarget:target => host.contains(target) || menu.contains(target)
      };

      registerController(api, select);
      paintTrigger();
      return api;
    }

    function suggestionValues(input) {
      const listId = String(input.dataset.uiSuggestionList || '');
      const list = listId ? document.getElementById(listId) : null;

      if (!(list instanceof global.HTMLDataListElement)) return [];

      return [...list.options]
        .map(option => String(option.value || option.textContent || '').trim())
        .filter(Boolean);
    }

    function createSuggestionInput(input) {
      if (
        !(input instanceof global.HTMLInputElement) ||
        !input.dataset.uiSuggestionList ||
        input.closest('.ui-suggestion-combobox')
      ) {
        return null;
      }

      const existing = controllerBySource.get(input);
      if (existing) return existing;

      const host = document.createElement('span');
      host.className = 'ui-suggestion-combobox';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'ui-suggestion-toggle';
      toggle.setAttribute('aria-label', uiText('顯示建議'));
      toggle.innerHTML = iconSvg('chevron-down');

      const menu = document.createElement('div');
      menu.className = 'ui-select-dropdown ui-select-dropdown-portal ui-suggestion-menu';
      menu.style.display = 'none';

      const optionsHost = document.createElement('div');
      optionsHost.className = 'ui-select-options';
      optionsHost.setAttribute('role', 'listbox');
      menu.appendChild(optionsHost);

      const parent = input.parentNode;
      if (!parent) return null;

      parent.insertBefore(host, input);
      host.appendChild(input);
      host.appendChild(toggle);

      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-haspopup', 'listbox');
      input.setAttribute('aria-expanded', 'false');

      function paintOptions(filter = input.value) {
        const query = String(filter || '').trim().toLocaleLowerCase();
        const values = suggestionValues(input);
        const filtered = query
          ? values.filter(value => value.toLocaleLowerCase().includes(query))
          : values;

        optionsHost.innerHTML = filtered.length
          ? filtered.map(value =>
              '<div class="ui-select-option" data-suggestion-value="' + esc(value) + '" role="option">' +
              '<span>' + esc(value) + '</span>' +
              '</div>'
            ).join('')
          : '<div class="ui-select-empty">' + esc(uiText('沒有符合的項目')) + '</div>';

        resetKeyboardIndex(optionsHost);

        optionsHost.querySelectorAll('[data-suggestion-value]').forEach(element => {
          element.onclick = event => {
            event.preventDefault();
            event.stopPropagation();

            input.value = element.dataset.suggestionValue || '';
            input.dispatchEvent(new Event('input', { bubbles:true }));
            input.dispatchEvent(new Event('change', { bubbles:true }));
            close();
            input.focus();
          };
        });
      }

      function position() {
        if (!host.classList.contains('ui-select-open')) return;
        positionPortal(input, menu, {
          minWidth:Math.max(180, input.getBoundingClientRect().width),
          maxWidth:520,
          maxHeight:320
        });
      }

      function open() {
        activate(api);
        paintOptions();

        if (menu.parentNode !== document.body) {
          document.body.appendChild(menu);
        }

        menu.style.display = '';
        host.classList.add('ui-select-open');
        input.setAttribute('aria-expanded', 'true');
        global.requestAnimationFrame(position);
      }

      function close() {
        menu.style.display = 'none';
        host.classList.remove('ui-select-open');
        input.setAttribute('aria-expanded', 'false');
        resetKeyboardIndex(optionsHost);
        clearActive(api);
      }

      function refresh() {
        if (host.classList.contains('ui-select-open')) {
          paintOptions();
          global.requestAnimationFrame(position);
        }
      }

      input.addEventListener('focus', open);
      input.addEventListener('input', () => {
        if (!host.classList.contains('ui-select-open')) open();
        else {
          paintOptions();
          global.requestAnimationFrame(position);
        }
      });

      input.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          if (host.classList.contains('ui-select-open')) {
            event.preventDefault();
            close();
          }
          return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!host.classList.contains('ui-select-open')) open();
          moveKeyboardIndex(optionsHost, event.key === 'ArrowDown' ? 1 : -1);
          return;
        }

        if (event.key === 'Enter' && host.classList.contains('ui-select-open')) {
          const items = keyboardOptions(optionsHost);
          const active = activeKeyboardIndex >= 0 ? items[activeKeyboardIndex] : null;
          if (active) {
            event.preventDefault();
            active.click();
          }
        }
      });

      toggle.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        if (host.classList.contains('ui-select-open')) {
          close();
        } else {
          input.focus();
          open();
        }
      });

      const api = {
        type:'suggestion',
        source:input,
        host,
        refresh,
        open,
        close,
        position,
        popup:menu,
        containsTarget:target => host.contains(target) || menu.contains(target)
      };

      registerController(api, input);
      return api;
    }

    function collect(root, selector) {
      const items = [];

      if (root instanceof global.Element && root.matches(selector)) {
        items.push(root);
      }

      if (root && typeof root.querySelectorAll === 'function') {
        items.push(...root.querySelectorAll(selector));
      }

      return items;
    }

    function mountSearchableSelects(root = document) {
      collect(root, '.ui-select-wrap').forEach(createSearchableSelect);
    }

    function mountSingleSelects(root = document) {
      collect(root, 'select:not([multiple])').forEach(createSingleSelect);
    }

    function mountSuggestionInputs(root = document) {
      collect(root, 'input[data-ui-suggestion-list]').forEach(createSuggestionInput);
    }

    function mountFormControls(root = document) {
      mountSearchableSelects(root);
      mountSingleSelects(root);
      mountSuggestionInputs(root);
    }

    function refreshSelect(sourceId) {
      controllerById.get(String(sourceId || ''))?.refresh();
    }

    function refreshControl(source) {
      if (!source) return;

      controllerBySource
        .get(source)
        ?.refresh();
    }

    function refreshAllControls() {
      pruneDisconnectedControllers();

      controllers.forEach(
        controller =>
          controller.refresh()
      );
    }

    function readPendingValue(selectId) {
      return controllerById.get(String(selectId || ''))?.pendingValue?.() || '';
    }

    function refreshMutationSource(target) {
      if (!(target instanceof global.Element)) return;

      const select =
        target instanceof global.HTMLSelectElement
          ? target
          : target.closest('select');

      if (select) {
        controllerBySource.get(select)?.refresh();
      }

      const datalist =
        target instanceof global.HTMLDataListElement
          ? target
          : target.closest('datalist');

      if (datalist?.id) {
        controllers.forEach(controller => {
          if (
            controller.type === 'suggestion' &&
            controller.source.dataset.uiSuggestionList === datalist.id
          ) {
            controller.refresh();
          }
        });
      }
    }

    function observeFormControls() {
      mountFormControls(document);

      if (formObserver) return;

      formObserver = new MutationObserver(records => {
        records.forEach(record => {
          refreshMutationSource(
            record.target
          );

          record.addedNodes
            .forEach(node => {
              if (
                node instanceof
                global.Element
              ) {
                mountFormControls(
                  node
                );

                refreshMutationSource(
                  node
                );
              }
            });
        });

        pruneDisconnectedControllers();
      });

      formObserver.observe(document.body, {
        childList:true,
        subtree:true
      });
    }

    document.addEventListener('pointerdown', event => {
      if (
        activeController &&
        !activeController.containsTarget(event.target)
      ) {
        activeController.close();
      }
    }, true);

    const repositionActive =
      debounce(() => {
        activeController?.position?.();
      }, 40);

    global.addEventListener('resize', repositionActive);
    document.addEventListener('scroll', repositionActive, true);

    function dispose() {
      activeController?.close?.();

      [...controllers]
        .forEach(
          unregisterController
        );

      controllers.clear();
      controllerById.clear();

      formObserver?.disconnect?.();
      formObserver = null;
      activeController = null;
      activeKeyboardIndex = -1;
    }

    return Object.freeze({
      mountFormControls,
      mountSearchableSelects,
      mountSingleSelects,
      mountSuggestionInputs,
      refreshSelect,
      refreshControl,
      refreshAllControls,
      readPendingValue,
      registerOptionProvider,
      unregisterOptionProvider,
      observeFormControls,
      dispose
    });
  }

  global.L1nGGenealogyUI = Object.freeze({ create, createChromeController, createDialogController, closeTopmostDialog });
})(window);
