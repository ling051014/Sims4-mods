/* ========【L1nG Genealogy UI】 設定 - 網站表單選擇器 / 建議清單唯一管理層 ======== */
(function (global) {
  'use strict';

  // ========【頂欄／側欄介面】UI 模組管理側欄寬度、選單與提示浮層 ========
  function createChromeController({ dom = {}, constants = {}, helpers = {} } = {}) {
    const { familySidebar, familySidebarBackdrop, familySidebarToggleButton, sidebarResizer } = dom;
    const { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_DEFAULT_WIDTH,
      SIDEBAR_WIDTH_KEY, FAMILY_PANEL_COLLAPSED_KEY } = constants;
    const { scheduleFamilyNameInputWidthSync,
      createDebouncedCallback } = helpers;
    const $ = id => document.getElementById(id);

    function openSidebar() {
      if (!familySidebar) return;
      familySidebar.classList.add('open');
      familySidebarBackdrop?.classList.add('show');
    }
    function closeSidebar() {
      closeSidebarActionMenus();
      if (!familySidebar) return;
      familySidebar.classList.remove('open');
      familySidebarBackdrop?.classList.remove('show');
    }
    function setFamilyPanelCollapsed(collapsed, { persist = true } = {}) {
      if (collapsed) closeSidebarActionMenus();
      const next = !!collapsed;
      document.body.classList.toggle('family-panel-collapsed', next);
      if (persist) { try { localStorage.setItem(FAMILY_PANEL_COLLAPSED_KEY, next ? '1' : '0'); } catch (_) {} }
    }
    function restoreFamilyPanelCollapsed() {
      let collapsed = false;
      try { collapsed = localStorage.getItem(FAMILY_PANEL_COLLAPSED_KEY) === '1'; } catch (_) {}
      setFamilyPanelCollapsed(collapsed, { persist:false });
    }
    familySidebarToggleButton.onclick = () => {
      if (window.innerWidth <= 720) {
        if (familySidebar.classList.contains('open')) closeSidebar(); else openSidebar();
      } else {
        setFamilyPanelCollapsed(!document.body.classList.contains('family-panel-collapsed'));
      }
    };
    familySidebarBackdrop.onclick = closeSidebar;

    // ========【共用彈出選單】 設定 - 頂欄、家族與成員操作 ========
    function closeSidebarActionMenus() {
      document.querySelectorAll('.family-actions-menu.open, #familyMemberAddMenu.open, .member-manage-menu.open')
        .forEach(menu => closeAppMenu(menu));
    }

    familySidebar?.addEventListener('scroll', closeSidebarActionMenus, true);

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
      popover.style.removeProperty('max-height');
      popover.style.removeProperty('overflow-y');

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

      const availableHeight = Math.max(80, window.innerHeight - margin * 2);
      popover.style.maxHeight = availableHeight + 'px';
      popover.style.overflowY = 'auto';

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
      document.documentElement.style.setProperty('--familySidebar-width', `${width}px`);
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
        const startWidth = familySidebar.getBoundingClientRect().width;
        document.body.classList.add('familySidebar-resizing');
        try { sidebarResizer.setPointerCapture(e.pointerId); } catch (_) {}

        const onMove = ev => {
          applySidebarWidth(startWidth + (ev.clientX - startX));
        };

        const onUp = () => {
          sidebarResizer.removeEventListener('pointermove', onMove);
          sidebarResizer.removeEventListener('pointerup', onUp);
          sidebarResizer.removeEventListener('pointercancel', onUp);
          document.body.classList.remove('familySidebar-resizing');
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
        const current = familySidebar.getBoundingClientRect().width;
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
        const current = familySidebar.getBoundingClientRect().width;
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
    let _uiDialogCancelValue = null;
    let _uiDialogPreviousFocus = null;
    let _uiDialogBackupBusy = false;
    let _uiDialogDismissPolicy = 'default';

    function closeUiDialog(result = null) {
      const overlay = $('confirmationDialog');
      if (!overlay || !overlay.classList.contains('show')) return;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      $('uiDialog')?.classList.remove('ui-dialog-nudge');
      _uiDialogDismissPolicy = 'default';
      const resolve = _uiDialogResolve;
      _uiDialogResolve = null;
      if (resolve) resolve(result);
      window.L1nGGenealogyFocus?.leave(overlay);
      _uiDialogPreviousFocus = null;
    }



    // 六種共用對話框共用結構化資訊容器；外部匯入值永遠以純文字插入。
    function renderDialogRichContent(host, rich, translate) {
      host.replaceChildren();
      if (!rich || typeof rich !== 'object') return;
      const make = (tag, cls, value) => {
        const node = document.createElement(tag);
        node.className = cls;
        if (value !== undefined && value !== null) node.textContent = translate(value);
        return node;
      };
      if (rich.lead) host.appendChild(make('p', 'ui-dialog-rich-lead', rich.lead));
      if (rich.meta?.length) {
        const block = make('div', 'ui-dialog-rich-meta');
        rich.meta.forEach(([label, value]) => {
          const item = make('div', 'ui-dialog-rich-meta-item');
          item.appendChild(make('span', 'ui-dialog-rich-meta-label', label));
          item.appendChild(make('strong', 'ui-dialog-rich-meta-value', value));
          block.appendChild(item);
        });
        host.appendChild(block);
      }
      if (rich.stats?.length) {
        const block = make('div', 'ui-dialog-rich-counters');
        if (rich.statsTitle) block.appendChild(make('span', 'ui-dialog-rich-counter-title', rich.statsTitle));
        rich.stats.forEach(([label, value]) => {
          const item = make('div', 'ui-dialog-rich-counter');
          item.appendChild(make('strong', 'ui-dialog-rich-counter-value', value));
          item.appendChild(make('span', 'ui-dialog-rich-counter-label', label));
          block.appendChild(item);
        });
        host.appendChild(block);
      }
      (rich.sections || []).forEach(section => {
        if (!section?.items?.length) return;
        const block = make('section', 'ui-dialog-rich-section');
        block.appendChild(make('h3', 'ui-dialog-rich-section-title', section.title));
        const grid = make('div', 'ui-dialog-rich-grid');
        section.items.forEach(([label, value]) => {
          const item = make('div', 'ui-dialog-rich-stat');
          item.appendChild(make('span', 'ui-dialog-rich-stat-label', label));
          item.appendChild(make('strong', 'ui-dialog-rich-stat-value', value));
          grid.appendChild(item);
        });
        block.appendChild(grid);
        host.appendChild(block);
      });
      (rich.paragraphs || []).forEach(line =>
        host.appendChild(make('p', 'ui-dialog-rich-paragraph', line))
      );
      (rich.warnings || []).forEach(line =>
        host.appendChild(make('p', 'ui-dialog-rich-warning', line))
      );
      if (rich.footer) host.appendChild(make('p', 'ui-dialog-rich-footer', rich.footer));
      if (rich.importWarning?.title) {
        const group=make('section','ui-dialog-import-warning');
        const heading=make('div','ui-dialog-import-warning-title');
        heading.appendChild(make('span','l1ng-icon icon-exclamation-triangle'));
        heading.appendChild(make('strong','ui-dialog-import-warning-heading',rich.importWarning.title));
        group.appendChild(heading);
        if (rich.importWarning.description) {
          group.appendChild(make('p','ui-dialog-import-warning-description',rich.importWarning.description));
        }
        host.appendChild(group);
      }
    }

    // 六種訊息／決策型視窗共用同一個 DOM，狀態色不等於操作危險程度。
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
      confirmKind = 'default',
      actionLayout = 'default',
      secondaryHint = '',
      confirmHint = '',
      confirmValue = true,
      cancelValue = mode === 'confirm' ? false : null,
      details = null,
      backupAction = null,
      richContent = null,
      dismissPolicy = 'default'
    } = {}) {
      const overlay = $('confirmationDialog');
      const dialog = $('uiDialog');
      const titleEl = $('uiDialogTitle');
      const iconEl = $('uiDialogIcon');
      const messageEl = $('uiDialogMessage');
      const richEl = $('uiDialogRich');
      const detailsEl = $('uiDialogDetails');
      const detailsToggle = $('uiDialogDetailsToggle');
      const detailsContent = $('uiDialogDetailsContent');
      const detailsCopy = $('uiDialogDetailsCopy');
      const backupGroup = $('uiDialogBackup');
      const backupButton = $('uiDialogBackupAction');
      const backupLabel = $('uiDialogBackupLabel');
      const backupStatus = $('uiDialogBackupStatus');
      const inputEl = $('uiDialogInput');
      const cancelBtn = $('uiDialogCancel');
      const secondaryBtn = $('uiDialogSecondary');
      const confirmBtn = $('uiDialogConfirm');

      if (!overlay || !dialog || !titleEl || !iconEl || !messageEl || !richEl ||
          !detailsEl || !detailsToggle || !detailsContent || !detailsCopy ||
          !backupGroup || !backupButton || !backupLabel || !backupStatus ||
          !inputEl || !cancelBtn || !secondaryBtn || !confirmBtn) {
        return Promise.resolve(cancelValue);
      }

      if (_uiDialogResolve) closeUiDialog(null);
      _uiDialogMode = mode;
      _uiDialogDismissPolicy = dismissPolicy === 'explicit' ? 'explicit' : 'default';
      _uiDialogCancelValue = cancelValue;
      _uiDialogPreviousFocus = document.activeElement;
      _uiDialogBackupBusy = false;
      dialog.removeAttribute('aria-busy');

      const presentation = mode === 'result' || kind === 'success'
        ? 'result'
        : mode === 'error' || (mode === 'alert' && kind === 'danger')
          ? 'error'
          : mode === 'choice' ? 'choice'
          : mode === 'prompt' ? 'prompt'
          : mode === 'confirm' ? 'confirm' : 'notice';
      const iconClasses = {
        notice:'icon-info-circle',
        confirm:kind === 'danger' ? 'icon-exclamation-triangle' : 'icon-info-circle',
        choice:kind === 'danger' ? 'icon-exclamation-triangle' : 'icon-info-circle',
        result:'icon-check-circle',
        error:'icon-exclamation-triangle',
        prompt:'icon-pencil-square'
      };

      dialog.dataset.presentation = presentation;
      dialog.dataset.kind = kind;
      dialog.dataset.mode = mode;
      dialog.dataset.actionLayout = actionLayout === 'inline' ? 'inline' : 'default';
      titleEl.textContent = uiText(title);
      iconEl.className = 'l1ng-icon ui-dialog-status-icon ' + iconClasses[presentation];

      // 保持純文字渲染；不讓 ZIP 中的名字或錯誤訊息被當成 HTML 執行。
      const localizeLines = value => {
        const raw = String(value ?? '');
        const whole = uiText(raw);
        return whole !== raw
          ? whole
          : raw.split('\n').map(line => uiText(line)).join('\n');
      };
      messageEl.textContent = localizeLines(message);
      const hasRich = !!richContent;
      dialog.dataset.rich = hasRich ? 'true' : 'false';
      messageEl.hidden = hasRich;
      richEl.hidden = !hasRich;
      dialog.setAttribute('aria-describedby', hasRich ? 'uiDialogRich' : 'uiDialogMessage');
      // 重新開啟視窗前先把診斷容器移回原位置，避免上一個警告區被清空時銷毀。
      richEl.after(detailsEl);
      renderDialogRichContent(richEl, richContent, localizeLines);

      const hasSecondary = !!String(secondaryText || '').trim();
      dialog.dataset.actionCount = mode === 'alert' || mode === 'result' ||
        mode === 'error' ? '1' : hasSecondary ? '3' : '2';
      confirmBtn.textContent = uiText(confirmText);
      confirmBtn.classList.toggle(
        'destructive',
        (mode === 'confirm' && kind === 'danger') || confirmKind === 'danger'
      );
      confirmBtn.title = confirmHint ? uiText(confirmHint) : '';
      if (confirmHint) confirmBtn.setAttribute('aria-description', uiText(confirmHint));
      else confirmBtn.removeAttribute('aria-description');

      cancelBtn.textContent = uiText(cancelText);
      cancelBtn.hidden = mode === 'alert' || mode === 'result' || mode === 'error';
      secondaryBtn.textContent = hasSecondary ? uiText(secondaryText) : '';
      secondaryBtn.hidden = !hasSecondary || mode !== 'choice';
      secondaryBtn.classList.toggle('danger', secondaryKind === 'danger');
      secondaryBtn.title = secondaryHint ? uiText(secondaryHint) : '';
      if (secondaryHint) secondaryBtn.setAttribute('aria-description', uiText(secondaryHint));
      else secondaryBtn.removeAttribute('aria-description');

      const detailText = typeof details === 'string' ? details : details?.text;
      const detailItems = Array.isArray(details?.items) ? details.items : [];
      const hasDetails = !!String(detailText ?? '').trim() || detailItems.length > 0;
      detailsEl.hidden = !hasDetails;
      detailsContent.hidden = true;
      detailsToggle.setAttribute('aria-expanded','false');
      detailsToggle.textContent = uiText(details?.label || '查看詳細資訊');
      detailsContent.replaceChildren();
      if (detailItems.length) {
        detailItems.forEach(item => {
          const card=document.createElement('section');
          card.className='ui-dialog-diagnostic-item';
          const heading=document.createElement('div');
          heading.className='ui-dialog-diagnostic-item-heading';
          const strong=document.createElement('strong');
          strong.textContent=localizeLines(item.title || '錯誤紀錄');
          heading.appendChild(strong);
          if (item.caption) {
            const caption=document.createElement('small');
            caption.textContent=localizeLines(item.caption);
            heading.appendChild(caption);
          }
          card.appendChild(heading);
          const fields=document.createElement('dl');
          fields.className='ui-dialog-diagnostic-fields';
          (item.fields || []).forEach(([label,value]) => {
            const dt=document.createElement('dt');
            dt.textContent=localizeLines(label);
            const dd=document.createElement('dd');
            dd.textContent=String(value ?? '未擷取');
            fields.append(dt,dd);
          });
          card.appendChild(fields);
          detailsContent.appendChild(card);
        });
      } else {
        detailsContent.textContent=hasDetails ? localizeLines(detailText) : '';
      }
      if (richContent?.importWarning?.title) {
        const warning=richEl.querySelector('.ui-dialog-import-warning');
        if (warning) warning.appendChild(detailsEl);
      }
      const copyText = typeof details === 'object' && details?.copyText
        ? String(details.copyText) : String(detailText ?? '');
      detailsCopy.hidden=true;
      detailsCopy.setAttribute('aria-label',uiText('複製完整診斷報告'));
      const copyLabel=detailsCopy.querySelector('.ui-dialog-details-copy-label');
      const copyGlyph=detailsCopy.querySelector('.l1ng-copy-glyph');
      if (detailsCopy._resetTimer) {
        clearTimeout(detailsCopy._resetTimer);
        detailsCopy._resetTimer=null;
      }
      copyGlyph?.classList.remove('l1ng-copy-running');
      if (copyLabel) copyLabel.textContent=uiText('複製完整診斷報告');
      detailsToggle.onclick=()=>{
        const expanded=detailsToggle.getAttribute('aria-expanded')==='true';
        detailsContent.hidden=expanded;
        detailsCopy.hidden=expanded;
        detailsToggle.setAttribute('aria-expanded',String(!expanded));
        detailsToggle.textContent=uiText(expanded ? (details?.label || '查看詳細資訊') : '收合詳細資訊');
      };
      detailsCopy.onclick=async()=>{
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(copyText);
          } else {
            const textarea=document.createElement('textarea');
            textarea.value=copyText;
            textarea.style.position='fixed';
            textarea.style.opacity='0';
            document.body.appendChild(textarea);
            textarea.select();
            const copied=document.execCommand('copy');
            textarea.remove();
            if (!copied) throw new Error('Clipboard copy failed');
          }
          if (copyLabel) copyLabel.textContent=uiText('已複製');
          if (copyGlyph) {
            copyGlyph.classList.remove('l1ng-copy-running');
            void copyGlyph.getBoundingClientRect();
            copyGlyph.classList.add('l1ng-copy-running');
          }
          if (detailsCopy._resetTimer) clearTimeout(detailsCopy._resetTimer);
          detailsCopy._resetTimer=setTimeout(()=>{
            copyGlyph?.classList.remove('l1ng-copy-running');
            if (copyLabel) copyLabel.textContent=uiText('複製完整診斷報告');
          },3900);
        } catch(error) {
          console.warn('[共用視窗] 複製明細失敗：',error);
          if (copyLabel) copyLabel.textContent=uiText('複製失敗');
        }
      };

      // 備份只是附屬操作；不結束選擇或確認 Promise。
      const canBackup = typeof backupAction === 'function' &&
        (mode === 'choice' || mode === 'confirm');
      backupGroup.hidden = !canBackup;
      backupButton.disabled = !canBackup;
      backupLabel.textContent = uiText('匯出 JSON 備份');
      backupStatus.hidden = true;
      backupStatus.dataset.state = '';
      backupStatus.textContent = '';
      backupButton.onclick = canBackup ? async () => {
        if (_uiDialogBackupBusy) return;
        _uiDialogBackupBusy = true;
        dialog.setAttribute('aria-busy', 'true');
        const originalDisabled = [confirmBtn, cancelBtn, secondaryBtn]
          .map(button => button.disabled);
        [confirmBtn, cancelBtn, secondaryBtn, backupButton]
          .forEach(button => { button.disabled = true; });
        backupStatus.hidden = false;
        backupStatus.dataset.state = 'progress';
        backupStatus.textContent = uiText('正在產生備份……');
        try {
          await backupAction();
          backupLabel.textContent = uiText('再次匯出 JSON 備份');
          backupStatus.dataset.state = 'success';
          backupStatus.textContent = uiText('已產生備份，請確認下載。');
        } catch (error) {
          backupStatus.dataset.state = 'error';
          backupStatus.textContent = uiText('匯出失敗：') +
            (error?.message || uiText('未知錯誤'));
          console.error('[族譜確認視窗備份]', error);
        } finally {
          _uiDialogBackupBusy = false;
          dialog.removeAttribute('aria-busy');
          [confirmBtn, cancelBtn, secondaryBtn]
            .forEach((button, index) => { button.disabled = originalDisabled[index]; });
          backupButton.disabled = false;
          if (overlay.classList.contains('show')) backupButton.focus({preventScroll:true});
        }
      } : null;

      inputEl.classList.toggle('show', mode === 'prompt');
      inputEl.value = mode === 'prompt' ? uiText(defaultValue) : '';
      inputEl.setAttribute('aria-label', uiText(title));

      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden', 'false');
      window.L1nGGenealogyFocus?.enter(overlay, null, _uiDialogPreviousFocus);

      return new Promise(resolve => {
        _uiDialogResolve = resolve;
        const finishConfirm = () => { if (_uiDialogBackupBusy) return; closeUiDialog(
          mode === 'prompt' ? inputEl.value : confirmValue
        ); };
        const finishCancel = () => { if (!_uiDialogBackupBusy) closeUiDialog(cancelValue); };
        confirmBtn.onclick = finishConfirm;
        cancelBtn.onclick = finishCancel;
        secondaryBtn.onclick = hasSecondary ? () => {
          if (!_uiDialogBackupBusy) closeUiDialog(secondaryValue);
        } : null;
        overlay.onclick = event => {
          if (event.target !== overlay) return;
          if (_uiDialogDismissPolicy === 'explicit') {
            if (!_uiDialogBackupBusy) {
              dialog.classList.remove('ui-dialog-nudge');
              void dialog.offsetWidth;
              dialog.classList.add('ui-dialog-nudge');
            }
            return;
          }
          finishCancel();
        };
        inputEl.onkeydown = event => {
          if (event.key === 'Enter' && mode === 'prompt') {
            event.preventDefault();
            finishConfirm();
          }
        };
        requestAnimationFrame(() => {
          if (!overlay.classList.contains('show')) return;
          if (mode === 'prompt') {
            inputEl.focus();
            inputEl.select();
          } else if (window.L1nGGenealogyFocus?.isKeyboardInteraction()) {
            confirmBtn.focus({ preventScroll:true });
          } else {
            // 滑鼠開啟時只聚焦無外框的對話視窗本身，避免按鈕顯示焦點框。
            dialog.focus({ preventScroll:true });
          }
        });
      });
    }

    function uiAlert(message, options = {}) {
      return openUiDialog({
        title:options.title || '提示',
        message,
        mode:options.mode || (options.kind === 'danger' ? 'error' :
          options.kind === 'success' ? 'result' : 'alert'),
        kind:options.kind || 'default',
        confirmText:options.confirmText || '確定',
        details:options.details || null,
        richContent:options.richContent || null,
        dismissPolicy:options.dismissPolicy || 'default'
      });
    }

    function uiConfirm(message, options = {}) {
      return openUiDialog({
        title:options.title || '請確認',
        message,
        mode:'confirm',
        kind:options.kind || 'default',
        confirmText:options.confirmText || '確定',
        cancelText:options.cancelText || '取消',
        details:options.details || null,
        backupAction:options.backupAction || null,
        richContent:options.richContent || null,
        dismissPolicy:options.dismissPolicy || 'default'
      });
    }

    function uiPrompt(message, defaultValue = '', options = {}) {
      return openUiDialog({
        title:options.title || '輸入資料',
        message,
        mode:'prompt',
        kind:options.kind || 'default',
        defaultValue,
        confirmText:options.confirmText || '確定',
        cancelText:options.cancelText || '取消'
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
        if (_uiDialogDismissPolicy !== 'explicit' && !_uiDialogBackupBusy) closeUiDialog(_uiDialogCancelValue);
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
    const active = window.L1nGGenealogyFocus?.top();
    if (active) {
      const match = (lifecycles || []).find(lifecycle => lifecycle.dialog === active.element);
      if (match) { match.close(); return true; }
    }
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
        Math.max(1, viewportWidth - margin * 2),
        Math.max(1, Math.min(maxWidth, Math.max(minWidth, rect.width)))
      );
      const left = Math.min(
        Math.max(margin, rect.left),
        Math.max(margin, viewportWidth - width - margin)
      );
      const below = viewportHeight - rect.bottom - gap - margin;
      const above = rect.top - gap - margin;
      const desiredHeight = Math.min(maxHeight, popup.scrollHeight || maxHeight);
      const openAbove = below < desiredHeight && above > below;
      const available = Math.max(0, openAbove ? above : below);
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

      const placeholderSource = wrap.dataset.placeholder || '點選選擇……';
      const matchWidth = wrap.dataset.uiSelectMatchWidth === 'true';
      if (wrap.dataset.uiSelectColumns === '2') dropdown.dataset.uiSelectColumns = '2';
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
        const width = input.getBoundingClientRect().width;
        positionPortal(input, dropdown, {
          minWidth:matchWidth ? Math.min(width, Math.max(1,global.innerWidth - 20)) : 280,
          maxWidth:matchWidth ? Math.max(1,width) : 520,
          maxHeight:360
        });
      }

      function paintSelection() {
        const placeholder = uiText(placeholderSource);
        let markup;

        if (multiple) {
          if (addOnly) {
            markup =
              '<span class="ui-select-add-label">' +
                iconSvg('plus-lg') +
                '<span>' +
                  esc(placeholder) +
                '</span>' +
              '</span>';
          } else {
            const selected = [...select.options].filter(option => option.selected);

            markup = selected.length
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
          }
        } else {
          const selected = select.options[select.selectedIndex];

          markup =
            !selected
              ? '<span class="ui-select-placeholder">' + esc(placeholder) + '</span>'
              : '<span class="ui-single-select-value">' + esc(selected.textContent) + '</span>';
        }

        // 更新選取內容時保留同一個 SVG 節點，避免展開 / 收合動畫被重建中斷。
        const chevron = input.querySelector(':scope > .ui-select-chevron-icon');
        if (chevron) {
          [...input.childNodes].forEach(node => {
            if (node !== chevron) node.remove();
          });
          chevron.insertAdjacentHTML('beforebegin', markup);
        } else {
          input.innerHTML = markup + iconSvg('chevron-down', 'ui-select-chevron-icon');
        }

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

        window.L1nGGenealogyFocus?.focusLater(search, wrap, 30);
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
          event.stopPropagation();
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

      function optionLabel(option) {
        if (!option) return '';
        if (option.value === '' && select.id === 'simBirthdayMonthSelect') {
          return uiText('生日月份提示');
        }
        if (option.value === '' && select.id === 'simBirthdayDaySelect') {
          return uiText('生日日期提示');
        }
        return option.textContent;
      }

      const triggerValue = document.createElement('span');
      triggerValue.className = 'ui-single-select-value';
      trigger.appendChild(triggerValue);
      trigger.insertAdjacentHTML('beforeend', iconSvg('chevron-down', 'ui-select-chevron-icon'));

      function paintTrigger() {
        const option = select.options[select.selectedIndex];
        triggerValue.textContent = optionLabel(option);
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
              '<span>' + esc(optionLabel(option)) + '</span>' +
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
            event.stopPropagation();
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
      global.LING_I18N?.onLanguageChanged?.(refresh);
      paintTrigger();
      return api;
    }

    function suggestionValues(input) {
      const listId = String(input.dataset.uiSuggestionList || '');
      const list = listId ? document.getElementById(listId) : null;

      if (!(list instanceof global.HTMLDataListElement)) return [];

      const catalogKey = list.dataset.suggestionCatalog;
      if (catalogKey) {
        return global.LING_I18N?.getSuggestionList?.(catalogKey) || [];
      }

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
      const editorMenu = !!input.closest('.sim-editor-modal, .pet-editor-modal');
      if (editorMenu) menu.classList.add('ui-suggestion-menu-editor');
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

      // 自訂建議選單已接管候選值，避免瀏覽器輸入紀錄另開第二個浮窗。
      input.setAttribute('autocomplete', 'off');
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
        positionPortal(input, menu, editorMenu
          ? { minWidth:240, maxWidth:430, maxHeight:260 }
          : { minWidth:180, maxWidth:520, maxHeight:320 });
        const viewportLimit = Math.max(0, parseFloat(menu.style.maxHeight) || 0);
        menu.style.setProperty('--ui-suggestion-available-height', Math.max(0, viewportLimit - 8) + 'px');
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
            event.stopPropagation();
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
      global.LING_I18N?.onLanguageChanged?.(refresh);
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

    // ========【搜尋欄】 設定 - 保留現有輸入與事件，補上共用搜尋及清除圖示 ========
    function mountSearchDecorations(root = document) {
      const fields = [
        'input[type="search"]',
        '.relationship-type-search',
        '.ui-select-search'
      ].join(',');
      collect(root, fields).forEach(input => {
        if (input.closest('.l1ng-search-control')) return;
        const parent = input.parentNode;
        if (!parent) return;
        const wrap = document.createElement('span');
        wrap.className = 'l1ng-search-control';
        parent.insertBefore(wrap,input);
        wrap.appendChild(input);
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'l1ng-search-clear';
        clear.setAttribute('aria-label', uiText('清除搜尋'));
        clear.title = '清除搜尋';
        const sync = () => { clear.hidden = !input.value; };
        clear.addEventListener('click',() => {
          if (!input.value) return;
          input.value = '';
          input.dispatchEvent(new Event('input',{bubbles:true}));
          input.focus({preventScroll:true});
          sync();
        });
        input.addEventListener('input',sync);
        wrap.appendChild(clear);
        sync();
      });
    }

    function mountFormControls(root = document) {
      mountSearchableSelects(root);
      mountSingleSelects(root);
      mountSuggestionInputs(root);
      mountSearchDecorations(root);
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

  // ========【選取指示器】編輯分頁與總覽分類的共用滑動底線 / 膠囊 ========
  function initializeSelectionIndicators() {
  const configs = [
    {selector:'.sim-editor-tabs:not(.pet-editor-tabs)', item:'.sim-editor-tab', kind:'line'},
    {selector:'.pet-editor-tabs', item:'.pet-editor-tab', kind:'line'},
    {selector:'.person-library-category-tabs', item:'button[role="tab"]', kind:'adaptive'},
    {selector:'.l1ng-tour-chapter-tabs', item:'.l1ng-tour-chapter-option', kind:'pill'}
  ];
  function mount(config) {
    const root = document.querySelector(config.selector);
    if (!root || root.querySelector(':scope > .l1ng-selection-indicator')) return;
    const indicator = document.createElement('span');
    indicator.className = 'l1ng-selection-indicator';
    indicator.setAttribute('aria-hidden','true');
    root.append(indicator);
    let previous = null;
    let ready = false;
    function refresh() {
      const active = root.querySelector(config.item+'.active') ||
        [...root.querySelectorAll(config.item)].find(el=>el.getAttribute('aria-selected')==='true');
      if (!active || active.hidden || !active.getClientRects().length || !root.getClientRects().length) {
        root.classList.remove('l1ng-indicator-ready');
        root.classList.remove('l1ng-indicator-animated');
        ready = false;
        previous = null;
        return;
      }
      const bounds = root.getBoundingClientRect(), rect=active.getBoundingClientRect();
      const isMobile = config.kind==='adaptive' && matchMedia('(max-width:720px)').matches;
      const x=rect.left-bounds.left+root.scrollLeft+(config.kind==='line'?14:isMobile?1:0);
      const y=rect.top-bounds.top+root.scrollTop;
      const w=rect.width-(config.kind==='line'?28:isMobile?2:0);
      const h=rect.height;
      const state=[x,y,w,h,isMobile].join(':');
      if(state===previous && ready)return;
      const first = !ready;
      previous=state;
      root.style.setProperty('--l1ng-indicator-x',x+'px');
      root.style.setProperty('--l1ng-indicator-y',y+'px');
      root.style.setProperty('--l1ng-indicator-width',Math.max(0,w)+'px');
      root.style.setProperty('--l1ng-indicator-height',h+'px');
      root.classList.add('l1ng-indicator-ready');
      ready = true;
      if (first) requestAnimationFrame(() => root.classList.add('l1ng-indicator-animated'));
    }
    let queued=false;
    const request=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});};
    const observer=new MutationObserver(request);
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class','hidden','style','aria-selected']});
    if('ResizeObserver' in window){const resize=new ResizeObserver(request);resize.observe(root);root.querySelectorAll(config.item).forEach(el=>resize.observe(el));}
    window.addEventListener('resize',request,{passive:true});
    root.addEventListener('scroll',request,{passive:true});
    root.addEventListener('click',request);
    document.fonts?.ready.then(request).catch(()=>{});
    request();
  }
  function init(){configs.forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }

  global.L1nGGenealogyUI = Object.freeze({ create, createChromeController, createDialogController, closeTopmostDialog });

  // ========【分裝置操作導覽】章節與步驟共用引擎；不更動實際族譜資料 ========
  function initializeGuidedTour() {
    const isMobileView = () => window.matchMedia('(max-width:720px)').matches;
    const locale = () => window.LING_I18N?.language || 'zh-Hant';
    const tr = (zh,en) => locale()==='en' ? en : (window.LING_I18N?.translateFor?.(locale(),zh) || zh);
    const step = (target,title,body,enTitle,enBody,options={}) =>
      ({target,title,body,enTitle,enBody,...options});
    const chapters = mobile => {
      if (!mobile) return [
        {id:'top',name:'基本介面',en:'Main interface',steps:[
          step('#familySidebarToggleButton','家族側邊欄','展開或收合家族資訊，讓畫布擁有更多可用空間。','Family sidebar','Show or hide the family sidebar to free up canvas space.'),
          step('.topbar-primary-actions','頂部主要功能','總覽可管理市民與寵物；匯出可保存圖片或備份；恢復預設會取代資料；更多提供匯入及其他設定。','Main tools','Overview manages Sims and pets. Export saves images or backups. Restore replaces data; More contains imports and settings.'),
          step('#topbarFilterBtn','篩選市民','依年齡、狀態、性別和種族篩選顯示內容，不會刪除資料。','Filter Sims','Filter visible Sims by age, status, gender or type without deleting data.')
        ]},
        {id:'workspace',name:'族譜操作',en:'Working with trees',sidebar:true,steps:[
          step('#familySelectTrigger','切換家族與視角','從家族欄切換家庭、EA 族譜或大家族視角。','Family selection','Switch between households, EA genealogy and extended-family views.'),
          step('#genealogyCanvasViewport','畫布操作','拖曳空白處平移畫布，使用滑鼠滾輪縮放；也能使用右下角的縮放與適應畫面工具。','Canvas navigation','Drag empty space to pan and use the mouse wheel to zoom; zoom and fit controls are also available.'),
          step('#canvasToolbar','排列與模式','從畫布工具列切換檢視 / 編輯、自動 / 自由排列，以及關係標籤等功能。','Modes and layout','Switch view/edit modes, automatic/free layout and relationship labels from the canvas toolbar.'),
          step('#genealogyCanvasViewport','市民與寵物操作','點擊卡片查看或編輯，右鍵開啟更多操作；Ctrl / Cmd + Z 可復原，支援的編輯視窗可用 Ctrl + S 儲存。','Cards and shortcuts','Click or right-click cards for actions. Use Ctrl / Cmd + Z to undo and Ctrl + S to save in supported editors.')
        ]},
        {id:'data',name:'匯入與備份',en:'Import and backups',steps:[
          step('#topbarMoreBtn','匯入與設定','在「更多」選單匯入遊戲 ZIP / JSON，或前往族譜提取器及視覺設定；導覽不會執行匯入。','Import and settings','Use More for ZIP/JSON imports, the Exporter and appearance settings. The tour does not import data.'),
          step('#exportBtn','匯出備份','大量編輯或匯入其他存檔前，建議先匯出 JSON 備份。','Save a backup','Export a JSON backup before major changes or importing another save.')
        ]}
      ];
      return [
      {id:'top',name:'頂部導覽',en:'Top navigation',steps:[
        step('#familySidebarToggleButton','家族側邊欄',mobile?'點擊這個選單圖示，展開或收合家族側邊欄。':'開啟或收合家族側邊欄，讓畫布獲得更多空間。','Family sidebar',mobile?'Open or close the family sidebar.':'Toggle the family sidebar to make more room for the tree.'),
        step('#helpBtn','使用說明','從這裡閱讀完整使用說明，或重新啟動操作導覽。','Help','Read detailed help or replay this tour.'),
        step('#topbarFilterBtn','篩選市民','篩選年齡階段、性別、狀態、種族與寵物；只影響畫布顯示，不會刪除資料。','Filter Sims','Filter age, gender, status, occult types and pets without deleting data.'),
        step('#personLibraryBtn','市民與寵物總覽',mobile?'這個 SVG 按鈕是「總覽」，可以搜尋與管理全部市民和寵物。':'在總覽中搜尋、檢視及批次管理市民與寵物。','Sims and pets overview','Search and manage Sims and pets in the overview.'),
        step('#exportBtn','匯出資料','從這裡匯出族譜圖片或 JSON 備份，方便保存和還原。','Export','Export a tree image or JSON backup for safekeeping.'),
        step('#restoreSampleBtn','恢復 / 清空族譜','可以恢復預設範例或清空整份族譜。建議先匯出 JSON 備份；導覽不會真的觸發。','Restore / clear tree','Restore the default example or clear the entire tree. Export a JSON backup first. The tour will not activate it.'),
        step('#topbarMoreBtn','更多功能','這裡包含 ZIP / JSON 匯入、族譜提取器、視覺設定、圖片與儲存及語言切換。','More options','Find ZIP / JSON import, Exporter, appearance, storage and language settings.')
      ]},
      {id:'families',name:'家族與成員',en:'Families and members',sidebar:true,steps:[
        step('#familySelectTrigger','切換家族','選擇要查看的家族；這裡還有 EA 家庭、EA 族譜與大家族視角。','Switch families','Choose a family or switch among Household, EA genealogy and extended views.'),
        step('.family-actions-menu > .ui-menu-trigger','家族管理','這裡可以新增家族或刪除家族。導覽只會介紹，不會執行刪除。','Family management','Create or delete a family. No deletion is performed during the tour.'),
        step('#familyMemberAddMenu > .ui-menu-trigger','新增成員','可以新增模擬市民，或把既有模擬市民加入目前家族。','Add members','Create a Sim or add an existing Sim to the current family.'),
        step('#removeFamilyMembersButton','批次移出家族','先選取要移出的成員，再進行批次操作；不等於永久刪除市民。','Remove members in bulk','Remove selected members from this family without permanently deleting Sims.'),
        step('#familySidebar','家庭成員清單','側邊欄顯示目前家族資料與成員，方便切換和尋找。','Family member list','Use the sidebar to browse the current family and its members.')
      ]},
      {id:'canvas',name:'族譜畫布',en:'Tree canvas',steps:[
        step('#genealogyCanvasViewport',mobile?'單指移動畫布':'拖曳畫布',mobile?'在畫布空白處用一根手指拖曳，可以平移族譜。':'在自動排列時拖曳畫布空白處，可以平移族譜。','Pan the canvas',mobile?'Drag an empty part of the canvas with one finger.':'Drag the empty canvas area to pan the family tree.'),
        step('#genealogyCanvasViewport',mobile?'雙指縮放':'滑鼠滾輪縮放',mobile?'用兩根手指張開或收攏來縮放族譜；也能使用畫面上的縮放按鈕。':'使用滑鼠滾輪，以游標所在位置為中心放大或縮小族譜。','Zoom gestures',mobile?'Pinch with two fingers, or use the zoom controls.':'Use your mouse wheel to zoom around the pointer.'),
        step('#zoomInBtn','放大畫布','這個加號可以放大畫布。可以試著點一下，也可以直接略過。','Zoom in','Press plus to zoom in. You may try it or skip.',{practice:true}),
        step('#zoomOutBtn','縮小畫布','這個減號可以縮小畫布。可以試著點一下，也可以直接略過。','Zoom out','Press minus to zoom out. You may try it or skip.',{practice:true}),
        step('#fitScreenBtn','適應畫面','自動調整縮放與位置，將目前族譜放進可見畫面。','Fit to screen','Fit the current tree within the viewport.',{practice:true}),
        step('#modeToggle','檢視 / 編輯模式','切換卡片的查看與編輯方式；操作導覽不會替你切換模式。','View / edit mode','Switch how cards open for viewing or editing. The tour will not toggle this.'),
        step('#autoLayoutToggleButton','自動 / 自由排列','自動排列依家系安排位置；自由排列可自行調整卡片，並出現更多排列工具。','Automatic / free layout','Auto-layout arranges families; free layout offers more manual tools.'),
        step('#selectToolBtn','選取工具','在自由排列狀態可以框選或多選市民與寵物。','Selection tool','Select one or more cards in free layout.',{optional:true}),
        step('#panToolBtn','拖曳工具','自由排列時可切換為拖曳工具，平移畫布而非框選。','Pan tool','Pan the canvas instead of selecting cards.',{optional:true}),
        step('#canvasLockToggleButton','畫布鎖定','此功能只在對應模式顯示，用來限制部分畫布操作。','Canvas lock','Restricts canvas interactions in supported modes.',{optional:true}),
        step('#resetCanvasLayoutButton','重設卡片位置','會清除手動調整的位置；導覽只介紹，不會執行重設。','Reset positions','Clears custom card positions. The tour will not trigger it.',{optional:true})
      ]},
      {id:'relations',name:'關係與卡片',en:'Relationships and cards',steps:[
        step('#relationshipLabelsVisibilityToggle','顯示 / 隱藏關係','控制關係標籤的顯示，不會刪除實際關係。','Relationship labels','Show or hide relationship labels without deleting connections.'),
        step('#relationshipLabelsLockToggle','鎖定關係','鎖定或解鎖關係線相關操作，避免誤調。','Lock relationships','Lock relationship line interactions to avoid accidental changes.'),
        step('#genealogyPersonLayer',mobile?'點擊市民卡片':'滑鼠操作市民卡片',mobile?'點擊市民卡片查看資訊；編輯模式下可以修改資料。':'在檢視模式點擊查看資料，切換到編輯模式則可修改市民。','Sim cards',mobile?'Tap a card to inspect it, or edit in edit mode.':'Click a card to inspect it; use edit mode to change details.',{fallback:'#genealogyCanvasViewport'}),
        step('#genealogyCanvasViewport',mobile?'長按卡片':'右鍵卡片',mobile?'長按卡片可開啟適用的操作選單；長按也可能用於特定拖曳操作。':'在卡片上按滑鼠右鍵，可以開啟額外的卡片操作選單。','Card actions',mobile?'Long-press a card to open contextual actions, depending on the active tool.':'Right-click a card to open its context menu.'),
        step('#genealogyPetLayer','寵物卡片','寵物也有獨立資料和關係，可以查看與編輯。','Pet cards','Pets have their own profiles and relationships.',{fallback:'#genealogyCanvasViewport'})
      ]},
      {id:'data',name:'資料與備份',en:'Data and backups',steps:[
        step('#topbarMoreBtn','匯入遊戲族譜 ZIP','在「更多」選單匯入提取器產生的 ZIP，網站會辨識現有族譜與存檔來源。導覽不會執行匯入。','Import game ZIP','Import a ZIP from the Exporter via More. The tour will not start an import.'),
        step('#topbarMoreBtn','還原 JSON 備份','從「更多」選單選取 JSON 備份；若會覆蓋現有資料，網站會要求確認。','Restore JSON backup','Restore a JSON backup from More; replacing data requires confirmation.'),
        step('#topbarMoreBtn','族譜提取器與設定','「更多」還包含提取器下載頁、視覺設定、圖片與儲存及語言切換。','Exporter and settings','More also contains the Exporter page, appearance, image storage and language options.'),
        step('#exportBtn','定期備份','建議在大幅修改家族或匯入其他存檔前，先匯出 JSON 備份。','Keep backups','Export a JSON backup before major edits or imports.')
      ]},
      {id:'shortcuts',name:mobile?'觸控補充':'滑鼠與快捷鍵',en:mobile?'Touch tips':'Mouse and shortcuts',steps:mobile?[
        step('#genealogyCanvasViewport','長按與拖曳','長按卡片可能啟動選取、排列或其他操作，實際行為以目前模式為準。','Long press and drag','Long pressing a card may select, reorder or open context actions depending on mode.'),
        step('#fitScreenBtn','畫布重新置中','如果在大型族譜中迷失位置，可點擊適應畫面快速返回。','Recenter your tree','Use Fit to screen to find your tree again.')
      ]:[
        step('#genealogyCanvasViewport','Shift 與多選','在支援的選取模式中，使用 Shift 與滑鼠選取多個卡片。','Shift and multiselect','Use Shift with the mouse to select multiple cards in selection mode.'),
        step('#genealogyCanvasViewport','復原 / 重做','使用 Ctrl / Cmd + Z 復原；需要時使用 Ctrl + Y 重做。','Undo / redo','Use Ctrl / Cmd + Z to undo and Ctrl + Y to redo.'),
        step('#genealogyCanvasViewport','儲存編輯視窗','在支援的編輯視窗中，使用 Ctrl + S 儲存變更。','Save editor','Use Ctrl + S to save in supported editing dialogs.')
      ]}
    ];
    };
    let currentChapters = [];
    let chapterIndex = 0;
    let stepIndex = 0;
    let active = false;
    let deviceAtStart = '';
    let initialFocus = null;
    let tourOpenedSidebar = false;
    let activeTarget = null;
    const overlay = document.createElement('div');
    overlay.className = 'l1ng-tour-overlay';
    overlay.setAttribute('aria-hidden','true');
    const spotlight = document.createElement('div');
    spotlight.className = 'l1ng-tour-spotlight';
    const practiceHitArea = document.createElement('button');
    practiceHitArea.type = 'button';
    practiceHitArea.className = 'l1ng-tour-practice-target';
    practiceHitArea.setAttribute('aria-label','');
    practiceHitArea.hidden = true;
    const panel = document.createElement('section');
    panel.className = 'l1ng-tour-panel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-label','族譜操作導覽');
    panel.tabIndex = -1;
    const chapterTabs = document.createElement('div');
    chapterTabs.className = 'l1ng-tour-chapter-tabs';
    chapterTabs.setAttribute('role','group');
    chapterTabs.setAttribute('aria-label','導覽章節');
    let chapterOptions = [];
    const progress = document.createElement('span');
    progress.className = 'l1ng-tour-progress';
    const heading = document.createElement('div');
    heading.className = 'l1ng-tour-heading';
    heading.append(chapterTabs,progress);
    const title = document.createElement('h3');
    const description = document.createElement('p');
    const hint = document.createElement('p');
    hint.className = 'l1ng-tour-hint';
    const actions = document.createElement('div');
    actions.className = 'l1ng-tour-actions';
    const skip = document.createElement('button');
    skip.type = 'button';
    const previous = document.createElement('button');
    previous.type = 'button';
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'primary';
    actions.append(skip,previous,next);
    panel.append(heading,title,description,hint,actions);
    overlay.append(spotlight,practiceHitArea,panel);
    document.body.append(overlay);
    let welcome = null;
    let replayReminder = null;
    let reminderTimeout = null;
    let returnGhost = null;
    const currentChapter = () => currentChapters[chapterIndex];
    const currentStep = () => currentChapter()?.visibleSteps[stepIndex];
    const validTarget = selector => {
      if (!selector) return null;
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width>0 && rect.height>0 && style.display!=='none' && style.visibility!=='hidden' ? el : null;
    };
    function closeAutoSidebar() {
      if (!tourOpenedSidebar) return;
      const sidebar = document.getElementById('familySidebar');
      const mobile = isMobileView();
      const opened = mobile ? sidebar?.classList.contains('open') :
        !document.body.classList.contains('family-panel-collapsed');
      if (opened) document.getElementById('familySidebarToggleButton')?.click();
      tourOpenedSidebar = false;
    }
    function ensureChapterReady(chapter) {
      if (chapter?.sidebar) {
        const sidebar = document.getElementById('familySidebar');
        const closed = isMobileView() ? !sidebar?.classList.contains('open') :
          document.body.classList.contains('family-panel-collapsed');
        if (closed) {
          document.getElementById('familySidebarToggleButton')?.click();
          tourOpenedSidebar = true;
        }
      } else closeAutoSidebar();
    }
    function availableSteps(chapter) {
      return chapter.steps.filter(item => !item.optional || validTarget(item.target));
    }
    function position() {
      if (!active) return;
      if ((isMobileView()?'mobile':'desktop')!==deviceAtStart) { close(false); return; }
      const stepNow = currentStep();
      if (!stepNow) return;
      const target = validTarget(stepNow.target) || validTarget(stepNow.fallback);
      activeTarget = target;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (!target) {
        spotlight.hidden = true;
        practiceHitArea.hidden = true;
        panel.style.left = '12px';
        panel.style.top = '72px';
        panel.style.width = Math.max(260,viewportWidth-24)+'px';
        return;
      }
      spotlight.hidden = false;
      const rect = target.getBoundingClientRect();
      const pad = 5;
      const x = Math.max(4,Math.min(viewportWidth-30,rect.left-pad));
      const y = Math.max(4,Math.min(viewportHeight-30,rect.top-pad));
      const width = Math.max(30,Math.min(viewportWidth-x-4,rect.width+pad*2));
      const height = Math.max(30,Math.min(viewportHeight-y-4,rect.height+pad*2));
      spotlight.style.left = x+'px';
      spotlight.style.top = y+'px';
      spotlight.style.width = width+'px';
      spotlight.style.height = height+'px';
      practiceHitArea.hidden = !stepNow.practice || target!==document.querySelector(stepNow.target);
      if (!practiceHitArea.hidden) {
        practiceHitArea.style.left = x+'px';
        practiceHitArea.style.top = y+'px';
        practiceHitArea.style.width = width+'px';
        practiceHitArea.style.height = height+'px';
        practiceHitArea.setAttribute('aria-label',tr(stepNow.title,stepNow.enTitle));
      }
      const panelWidth = Math.min(365,viewportWidth-24);
      panel.style.width = panelWidth+'px';
      const panelHeight = Math.max(165,panel.getBoundingClientRect().height);
      const aboveSpace = y-12;
      const belowSpace = viewportHeight-(y+height)-12;
      const top = belowSpace>=panelHeight+14 ? y+height+12 :
        aboveSpace>=panelHeight+14 ? y-panelHeight-12 :
        Math.max(12,Math.min(viewportHeight-panelHeight-12,(viewportHeight-panelHeight)/2));
      panel.style.left = Math.round(Math.max(12,Math.min(viewportWidth-panelWidth-12,x+width/2-panelWidth/2)))+'px';
      panel.style.top = Math.round(Math.max(12,top))+'px';
    }
    const normalizeTourSlashes = value => String(value).replace(/\s*[／\/]\s*/g, ' / ');
    function renderTourDescription(value) {
      const content = normalizeTourSlashes(value);
      const tokenPattern = /滑鼠滾輪|滑鼠右鍵|滑鼠左鍵|滾輪|右鍵|左鍵|滑鼠|mouse wheel|right-click|left-click|mouse|\b(?:Ctrl|Cmd|Shift|Alt|Esc|Delete|Backspace|Space)\b|(?<=\+\s)[A-Z0-9]\b/g;
      description.replaceChildren();
      let last = 0;
      for (const match of content.matchAll(tokenPattern)) {
        description.append(document.createTextNode(content.slice(last, match.index)));
        const token = match[0];
        const mouseToken = /^(?:滑鼠|滾輪|右鍵|左鍵|mouse|right-click|left-click)/.test(token);
        if (mouseToken && !isMobileView()) {
          const type = /滾輪|mouse wheel/.test(token) ? 'wheel' :
            /右鍵|right-click/.test(token) ? 'right' : 'left';
          const icon = document.createElement('span');
          icon.className = 'mouse-hint mouse-' + type;
          icon.setAttribute('role', 'img');
          icon.setAttribute('aria-label', type === 'wheel' ? '滾輪' : type === 'right' ? '右鍵' : '左鍵');
          const wheel = document.createElement('span');
          wheel.className = 'mouse-hint-wheel';
          icon.append(wheel);
          description.append(icon, document.createTextNode(token));
        } else if (!mouseToken) {
          const key = document.createElement('kbd');
          key.textContent = token;
          description.append(key);
        } else description.append(document.createTextNode(token));
        last = match.index + token.length;
      }
      description.append(document.createTextNode(content.slice(last)));
    }
    function renderChapters() {
      chapterTabs.setAttribute('aria-label',tr('導覽章節','Tour chapters'));
      if (chapterOptions.length!==currentChapters.length) {
        chapterOptions.forEach(option=>option.remove());
        chapterOptions=currentChapters.map((chapter,index)=>{
          const option=document.createElement('button');
          option.type='button';
          option.className='l1ng-tour-chapter-option';
          option.addEventListener('click',()=>goToChapter(index));
          option.addEventListener('keydown',event=>{
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
            event.preventDefault();
            const destination=event.key==='Home'?0:event.key==='End'?currentChapters.length-1:
              (index+(event.key==='ArrowRight'?1:-1)+currentChapters.length)%currentChapters.length;
            goToChapter(destination);
            chapterOptions[destination]?.focus();
          });
          chapterTabs.append(option);
          return option;
        });
      }
      chapterOptions.forEach((option,i)=>{
        const selected=i===chapterIndex;
        option.textContent=normalizeTourSlashes(tr(currentChapters[i].name,currentChapters[i].en));
        option.classList.toggle('active',selected);
        option.setAttribute('aria-pressed',String(selected));
      });
      requestAnimationFrame(()=>{
        if(!active)return;
        const selected=chapterOptions[chapterIndex];
        if(!selected)return;
        const left=selected.offsetLeft, right=left+selected.offsetWidth;
        if(left<chapterTabs.scrollLeft || right>chapterTabs.scrollLeft+chapterTabs.clientWidth) {
          const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
          chapterTabs.scrollTo({
            left:Math.max(0,left-(chapterTabs.clientWidth-selected.offsetWidth)/2),
            behavior:reduced?'auto':'smooth'
          });
        }
      });
    }
    function render() {
      if (!active) return;
      const chapter=currentChapter();
      const item=currentStep();
      if (!item) { close(true); return; }
      renderChapters();
      progress.textContent=(stepIndex+1)+' / '+chapter.visibleSteps.length;
      title.textContent=normalizeTourSlashes(tr(item.title,item.enTitle));
      renderTourDescription(tr(item.body,item.enBody));
      hint.hidden=!item.practice;
      hint.textContent=item.practice ? tr('可以點擊聚光目標試試，或直接按「下一步」','Tap the highlighted control to try, or choose Next to skip.') : '';
      skip.textContent=tr('結束導覽','End tour');
      previous.textContent=tr('上一步','Previous');
      next.textContent=chapterIndex===currentChapters.length-1 && stepIndex===chapter.visibleSteps.length-1 ?
        tr('完成導覽','Finish') : stepIndex===chapter.visibleSteps.length-1 ?
        tr('下一章','Next chapter') : tr('下一步','Next');
      previous.disabled=chapterIndex===0 && stepIndex===0;
      requestAnimationFrame(()=>requestAnimationFrame(position));
    }
    function goToChapter(index) {
      if (!active || !currentChapters[index]) return;
      chapterIndex=index;
      ensureChapterReady(currentChapter());
      currentChapter().visibleSteps=availableSteps(currentChapter());
      stepIndex=0;
      render();
    }
    function move(delta) {
      if (!active) return;
      const steps=currentChapter().visibleSteps;
      const n=stepIndex+delta;
      if(n>=0 && n<steps.length){stepIndex=n;render();return;}
      const newChapter=chapterIndex+(delta>0?1:-1);
      if (!currentChapters[newChapter]) {
        if(delta>0) close(true);
        return;
      }
      chapterIndex=newChapter;
      ensureChapterReady(currentChapter());
      currentChapter().visibleSteps=availableSteps(currentChapter());
      stepIndex=delta>0?0:Math.max(0,currentChapter().visibleSteps.length-1);
      render();
    }
    function clearReplayReminder() {
      if (reminderTimeout !== null) {
        clearTimeout(reminderTimeout);
        reminderTimeout = null;
      }
      replayReminder?.remove();
      replayReminder = null;
      document.getElementById('helpBtn')?.classList.remove('l1ng-tour-help-highlight');
    }
    function showReplayReminder() {
      if (active) return;
      clearReplayReminder();
      const help = document.getElementById('helpBtn');
      if (!help?.getClientRects().length) return;
      const bubble = document.createElement('div');
      bubble.className = 'l1ng-tour-replay-hint';
      bubble.setAttribute('role','status');
      bubble.textContent = tr('之後可從這裡開啟「使用說明」，再選「操作導覽」重新查看。',
        'You can replay the tour here: Help → Guided tour.');
      document.body.append(bubble);
      const helpRect = help.getBoundingClientRect();
      const width = Math.min(290,window.innerWidth-24);
      const left = Math.max(12,Math.min(window.innerWidth-width-12,helpRect.left+helpRect.width/2-35));
      bubble.style.width = width+'px';
      bubble.style.left = Math.round(left)+'px';
      bubble.style.top = Math.round(Math.min(window.innerHeight-76,helpRect.bottom+12))+'px';
      bubble.style.setProperty('--l1ng-tour-arrow-x',
        Math.round(Math.max(15,Math.min(width-15,helpRect.left+helpRect.width/2-left)))+'px');
      help.classList.add('l1ng-tour-help-highlight');
      replayReminder = bubble;
      reminderTimeout = setTimeout(clearReplayReminder,4700);
    }
    function animateReturnToHelp() {
      const target = document.getElementById('helpBtn');
      if (!target || !panel.getClientRects().length) {
        showReplayReminder();
        return;
      }
      const from = panel.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      returnGhost?.remove();
      returnGhost = null;
      if (reduced || !Element.prototype.animate) {
        requestAnimationFrame(showReplayReminder);
        return;
      }
      const ghost = panel.cloneNode(true);
      ghost.setAttribute('aria-hidden','true');
      ghost.className = 'l1ng-tour-panel l1ng-tour-return-ghost';
      ghost.style.left = from.left+'px';
      ghost.style.top = from.top+'px';
      ghost.style.width = from.width+'px';
      ghost.style.height = from.height+'px';
      ghost.style.maxHeight = from.height+'px';
      document.body.append(ghost);
      returnGhost = ghost;
      const dx = to.left+to.width/2 - (from.left+from.width/2);
      const dy = to.top+to.height/2 - (from.top+from.height/2);
      const scale = Math.max(.06,Math.min(.16,to.width/from.width));
      const animation = ghost.animate([
        {transform:'translate(0,0) scale(1)',opacity:1,offset:0},
        {transform:'translate('+(dx*.70)+'px,'+(dy*.70)+'px) scale(.38)',opacity:.8,offset:.72},
        {transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:0,offset:1}
      ],{duration:430,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
      animation.finished.then(()=>{
        if (returnGhost !== ghost) return;
        ghost.remove();
        returnGhost = null;
        showReplayReminder();
      }).catch(()=>{ghost.remove();if(returnGhost===ghost)returnGhost=null;});
    }
    function close(remember=true, guideToHelp=false) {
      if (!active) return;
      active=false;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
      practiceHitArea.hidden=true;
      closeAutoSidebar();
      if (guideToHelp) animateReturnToHelp();
      if (remember) {
        try {localStorage.setItem('l1ng_genealogy_tour_v2_'+deviceAtStart,'1');}catch(_){}
      }
      if (initialFocus?.isConnected) {
        try {initialFocus.focus({preventScroll:true});} catch (_) {}
      }
      initialFocus=null;
    }
    function open(chapterId='top') {
      if (active) return;
      if (document.querySelector('.ui-dialog-backdrop.show, .ui-dialog-mask.show, .file-operation-status-mask.show')) return;
      clearReplayReminder();
      returnGhost?.remove();
      returnGhost = null;
      deviceAtStart=isMobileView()?'mobile':'desktop';
      currentChapters=chapters(deviceAtStart==='mobile');
      chapterIndex=Math.max(0,currentChapters.findIndex(ch=>ch.id===chapterId));
      initialFocus=document.activeElement;
      active=true;
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden','false');
      ensureChapterReady(currentChapter());
      currentChapter().visibleSteps=availableSteps(currentChapter());
      stepIndex=0;
      render();
      requestAnimationFrame(()=>panel.focus({preventScroll:true}));
    }
    practiceHitArea.addEventListener('click',()=>{
      const item=currentStep();
      const target=activeTarget;
      if (!active || !item?.practice || !target || target!==document.querySelector(item.target)) return;
      target.click();
      requestAnimationFrame(()=>{if(active) move(1);});
    });
    skip.addEventListener('click',()=>close(true,true));
    previous.addEventListener('click',()=>move(-1));
    next.addEventListener('click',()=>move(1));
    window.addEventListener('resize',position,{passive:true});
    window.addEventListener('scroll',position,true);
    document.getElementById('familySidebar')?.addEventListener('transitionend',position);
    document.addEventListener('keydown',event=>{
      if (!active) return;
      if (event.key==='Escape') {
        event.preventDefault();event.stopImmediatePropagation();close(true,true);return;
      }
      if (event.key==='Tab') {
        const items=[...chapterOptions,skip,previous,next,
          ...(!practiceHitArea.hidden ? [practiceHitArea] : [])].filter(el=>!el.disabled);
        const positionInItems=items.indexOf(document.activeElement);
        if(positionInItems>=0) {
          const nextIndex=(positionInItems+(event.shiftKey?-1:1)+items.length)%items.length;
          event.preventDefault();items[nextIndex].focus();
        } else if(document.activeElement===panel || !panel.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? items[items.length-1] : chapterOptions[chapterIndex]).focus();
        }
      }
    },true);
    function attach() {
      const help=document.querySelector('#helpDialog .help-heading');
      if(help && !document.getElementById('genealogyTourReplay')) {
        const replay=document.createElement('button');
        replay.id='genealogyTourReplay';
        replay.type='button';
        replay.className='l1ng-tour-replay';
        replay.textContent=tr('操作導覽','Guided tour');
        replay.addEventListener('click',()=>{
          document.getElementById('helpCloseBtn')?.click();
          requestAnimationFrame(()=>requestAnimationFrame(()=>open('top')));
        });
        help.append(replay);
        window.LING_I18N?.onLanguageChanged?.(()=>{replay.textContent=tr('操作導覽','Guided tour');if(active)render();});
      }
      const key='l1ng_genealogy_tour_v2_'+(isMobileView()?'mobile':'desktop');
      let seen=false;
      try{seen=localStorage.getItem(key)==='1';}catch(_){}
      if(seen)return;
      welcome=document.createElement('div');
      welcome.className='l1ng-tour-welcome';
      const text=document.createElement('span');
      text.textContent=tr('想認識族譜工具的操作嗎？','Would you like a guided tour?');
      const start=document.createElement('button');
      start.type='button';
      start.textContent=tr('開始導覽','Start tour');
      const dismiss=document.createElement('button');
      dismiss.type='button';
      dismiss.textContent=tr('略過','Skip');
      start.addEventListener('click',()=>{welcome.remove();welcome=null;open('top');});
      dismiss.addEventListener('click',()=>{
        welcome.remove();welcome=null;
        try{localStorage.setItem(key,'1');}catch(_){}
      });
      welcome.append(text,start,dismiss);
      document.body.append(welcome);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});
    else attach();
  }

  initializeGuidedTour();

  initializeSelectionIndicators();
})(window);
