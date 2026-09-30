/* ========【L1nG Genealogy UI】 設定 - 網站表單選擇器 / 建議清單唯一管理層 ======== */
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

    const controllers = new Set();
    const controllerById = new Map();
    const controllerBySource = new WeakMap();
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
      const placeholderSource = wrap.dataset.placeholder || '點選選擇…';
      const home = { parent:dropdown.parentNode, next:dropdown.nextSibling };

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
          const selectedIcon = !multiple && option.selected
            ? '<span class="ui-select-option-selected-icon">' + iconSvg('check-lg') + '</span>'
            : '';
          const note = option.dataset.uiSelectNote || '';

          return (
            '<div class="' + classes + '" data-value="' + esc(option.value) + '"' +
            (option.disabled ? ' aria-disabled="true"' : '') +
            ' role="option" aria-selected="' + (option.selected ? 'true' : 'false') + '">' +
            check +
            '<span>' + esc(option.textContent) + '</span>' +
            (note ? '<span class="ui-select-option-note">' + esc(note) + '</span>' : '') +
            selectedIcon +
            '</div>'
          );
        }).join('');

        const createHTML =
          creatable && raw && !hasExact
            ? '<div class="ui-select-option" data-create-value="' + esc(raw) + '" role="option"><span>' +
              esc(createOptionText(raw)) + '</span></div>'
            : '';

        optionsHost.innerHTML =
          optionHTML || createHTML
            ? optionHTML + createHTML
            : '<div class="ui-select-empty">' + esc(uiText('沒有符合的項目')) + '</div>';

        resetKeyboardIndex(optionsHost);

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
        positionPortal(trigger, menu, {
          minWidth:Math.max(120, trigger.getBoundingClientRect().width),
          maxWidth:420,
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
      refreshAllControls,
      readPendingValue,
      observeFormControls,
      dispose
    });
  }

  global.L1nGGenealogyUI = Object.freeze({ create });
})(window);
