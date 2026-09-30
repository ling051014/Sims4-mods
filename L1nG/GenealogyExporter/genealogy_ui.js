/* ========【L1nG Genealogy UI】 設定 - 共用選擇器 / 原生下拉外觀唯一管理層 ======== */
(function (global) {
  'use strict';

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

    const controllers = new Map();
    let nativeSelectObserver = null;

    function emitChange(select) {
      select.dispatchEvent(new Event('change', { bubbles:true }));
    }

    function createSearchableSelect(wrap) {
      const selectId = String(wrap.dataset.uiSelectFor || '');
      if (!selectId) return null;
      if (controllers.has(selectId)) return controllers.get(selectId);

      const select = document.getElementById(selectId);
      const input = wrap.querySelector('.ui-select-input');
      const dropdown = wrap.querySelector('.ui-select-dropdown');
      const search = wrap.querySelector('.ui-select-search');
      const optionsHost = wrap.querySelector('.ui-select-options');

      if (!select || !input || !dropdown || !search || !optionsHost) return null;

      const multiple = !!select.multiple;
      const creatable = wrap.dataset.uiSelectCreatable === 'true';
      const portal = wrap.dataset.uiSelectPortal === 'true';
      const placeholderSource = wrap.dataset.placeholder || '點選選擇…';
      const home = { parent:dropdown.parentNode, next:dropdown.nextSibling };

      function restoreHome() {
        if (!portal || dropdown.parentNode === home.parent) return;
        dropdown.classList.remove('ui-select-dropdown-portal');
        ['left','top','width','max-height'].forEach(name => dropdown.style.removeProperty(name));
        if (home.next && home.next.parentNode === home.parent) home.parent.insertBefore(dropdown, home.next);
        else home.parent.appendChild(dropdown);
      }

      function positionPortal() {
        if (!portal || !wrap.classList.contains('ui-select-open')) return;
        if (dropdown.parentNode !== document.body) document.body.appendChild(dropdown);
        dropdown.classList.add('ui-select-dropdown-portal');

        const rect = input.getBoundingClientRect();
        const margin = 10;
        const gap = 5;
        const width = Math.min(
          Math.max(280, rect.width),
          Math.max(280, global.innerWidth - margin * 2)
        );
        const left = Math.min(
          Math.max(margin, rect.left),
          Math.max(margin, global.innerWidth - width - margin)
        );
        const below = global.innerHeight - rect.bottom - gap - margin;
        const above = rect.top - gap - margin;
        const openAbove = below < 220 && above > below;
        const maxHeight = Math.max(180, Math.min(360, openAbove ? above : below));

        dropdown.style.width = Math.round(width) + 'px';
        dropdown.style.left = Math.round(left) + 'px';
        dropdown.style.maxHeight = Math.round(maxHeight) + 'px';
        dropdown.style.top = openAbove
          ? Math.round(Math.max(
              margin,
              rect.top - Math.min(maxHeight, dropdown.scrollHeight || maxHeight) - gap
            )) + 'px'
          : Math.round(rect.bottom + gap) + 'px';
      }

      function paintSelection() {
        const placeholder = uiText(placeholderSource);

        if (multiple) {
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
                    : '<span class="ui-select-tag-x" data-remove="' + esc(option.value) + '" title="移除">×</span>') +
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
        } else {
          const selected = select.options[select.selectedIndex];
          input.innerHTML =
            !selected || selected.value === ''
              ? '<span class="ui-select-placeholder">' + esc(placeholder) + '</span>'
              : esc(selected.textContent);
        }

        input.insertAdjacentHTML(
          'beforeend',
          iconSvg('chevron-down', 'ui-select-chevron-icon')
        );
      }

      function close() {
        dropdown.style.display = 'none';
        wrap.classList.remove('ui-select-open');
        restoreHome();
      }

      function selectSingle(option) {
        [...select.options].forEach(item => { item.selected = false; });
        option.selected = true;
        close();
        paintSelection();
        emitChange(select);
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
        const options = [...select.options];
        const filtered = query
          ? options.filter(option => option.textContent.toLowerCase().includes(query))
          : options;
        const hasExact = !!raw && options.some(option =>
          option.value === raw ||
          option.textContent.trim().toLowerCase() === query
        );

        const optionHTML = filtered.map(option => {
          const empty = option.value === '';
          const classes = [
            'ui-select-option',
            option.selected ? 'selected' : '',
            option.disabled ? 'disabled' : '',
            empty ? 'none' : ''
          ].filter(Boolean).join(' ');
          const check = multiple && !empty
            ? '<span class="check">' + (option.selected ? iconSvg('check-lg') : '') + '</span>'
            : '';
          const note = option.dataset.uiSelectNote || '';

          return (
            '<div class="' + classes + '" data-value="' + esc(option.value) + '"' +
            (option.disabled ? ' aria-disabled="true"' : '') + '>' +
            check + '<span>' + esc(option.textContent) + '</span>' +
            (note ? '<span class="ui-select-option-note">' + esc(note) + '</span>' : '') +
            '</div>'
          );
        }).join('');

        const createHTML =
          creatable && raw && !hasExact
            ? '<div class="ui-select-option" data-create-value="' + esc(raw) + '"><span>' +
              esc(createOptionText(raw)) + '</span></div>'
            : '';

        if (!optionHTML && !createHTML) {
          optionsHost.innerHTML =
            '<div class="ui-select-empty">' + esc(uiText('沒有符合的項目')) + '</div>';
          return;
        }

        optionsHost.innerHTML = optionHTML + createHTML;

        optionsHost.querySelectorAll('.ui-select-option[data-value]').forEach(element => {
          element.onclick = event => {
            event.stopPropagation();
            const option = [...select.options].find(item => item.value === element.dataset.value);
            if (!option || option.disabled) return;

            if (multiple) {
              option.selected = !option.selected;
              paintSelection();
              paintOptions(search.value);
              emitChange(select);
            } else {
              selectSingle(option);
            }
          };
        });

        optionsHost.querySelectorAll('[data-create-value]').forEach(element => {
          element.onclick = event => {
            event.stopPropagation();
            commit(element.dataset.createValue);
          };
        });
      }

      function open() {
        controllers.forEach(controller => {
          if (controller !== api) controller.close();
        });
        dropdown.style.display = '';
        wrap.classList.add('ui-select-open');
        search.value = '';
        paintOptions();

        if (portal) {
          global.requestAnimationFrame(() => {
            positionPortal();
            global.requestAnimationFrame(positionPortal);
          });
        }

        global.setTimeout(() => search.focus(), 30);
      }

      function refresh() {
        paintSelection();
        if (!wrap.classList.contains('ui-select-open')) return;
        paintOptions(search.value);
        if (portal) global.requestAnimationFrame(positionPortal);
      }

      input.onclick = event => {
        if (event.target.closest('.ui-select-tag-x')) return;
        wrap.classList.contains('ui-select-open') ? close() : open();
      };
      search.oninput = () => paintOptions(search.value);
      search.onkeydown = event => {
        if (event.key === 'Escape') {
          close();
          input.focus();
          return;
        }
        if (event.key === 'Enter' && creatable && search.value.trim()) {
          event.preventDefault();
          commit(search.value);
        }
      };

      document.addEventListener('click', event => {
        if (!wrap.contains(event.target) && !dropdown.contains(event.target)) close();
      });

      if (portal) {
        global.addEventListener('resize', debounce(positionPortal, 50));
        document.addEventListener('scroll', () => {
          if (wrap.classList.contains('ui-select-open')) positionPortal();
        }, true);
      }

      const api = Object.freeze({
        selectId,
        refresh,
        open,
        close,
        pendingValue:() => normalizeCreatableValue(search.value),
        commit
      });

      controllers.set(selectId, api);
      paintSelection();
      return api;
    }

    function mountSearchableSelects(root = document) {
      const wraps = [];
      if (root instanceof global.Element && root.matches('.ui-select-wrap')) wraps.push(root);
      if (root && typeof root.querySelectorAll === 'function') {
        wraps.push(...root.querySelectorAll('.ui-select-wrap'));
      }
      wraps.forEach(createSearchableSelect);
    }

    function refreshSelect(selectId) {
      controllers.get(String(selectId || ''))?.refresh();
    }

    function readPendingValue(selectId) {
      return controllers.get(String(selectId || ''))?.pendingValue() || '';
    }

    function installNativeSelectChevrons(root = document) {
      const selector = '.ui-dialog-panel select:not([multiple])';
      const candidates = [];
      if (root instanceof global.Element && root.matches(selector)) candidates.push(root);
      if (root && typeof root.querySelectorAll === 'function') {
        candidates.push(...root.querySelectorAll(selector));
      }

      candidates.forEach(select => {
        if (
          !select ||
          select.hidden ||
          select.hasAttribute('hidden') ||
          select.classList.contains('nav-native-select') ||
          select.closest('.select-chevron-shell')
        ) return;

        const parent = select.parentNode;
        if (!parent) return;

        const shell = document.createElement('span');
        shell.className = 'select-chevron-shell';
        parent.insertBefore(shell, select);
        shell.appendChild(select);

        const icon = document.createElement('span');
        icon.className = 'l1ng-icon icon-chevron-down select-chevron-icon';
        icon.setAttribute('aria-hidden', 'true');
        shell.appendChild(icon);
      });
    }

    function observeNativeSelectChevrons() {
      installNativeSelectChevrons(document);
      if (nativeSelectObserver) return;

      nativeSelectObserver = new MutationObserver(records => {
        records.forEach(record => {
          record.addedNodes.forEach(node => {
            if (node instanceof global.Element) installNativeSelectChevrons(node);
          });
        });
      });

      nativeSelectObserver.observe(document.body, { childList:true, subtree:true });
    }

    function dispose() {
      controllers.forEach(controller => controller.close());
      controllers.clear();
      nativeSelectObserver?.disconnect?.();
      nativeSelectObserver = null;
    }

    return Object.freeze({
      mountSearchableSelects,
      refreshSelect,
      readPendingValue,
      installNativeSelectChevrons,
      observeNativeSelectChevrons,
      dispose
    });
  }

  global.L1nGGenealogyUI = Object.freeze({ create });
})(window);
