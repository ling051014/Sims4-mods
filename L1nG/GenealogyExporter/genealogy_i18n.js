/* ========【多語系介面】 設定 - 載入獨立語言 JSON、切換語言與同步 DOM ======== */
(function genealogyI18n(global) {
  'use strict';

  const LANG_KEY = 'ling_genealogy_language_v1';
  const SUPPORTED_LANGUAGES = Object.freeze(['zh-Hant', 'zh-Hans', 'en']);
  const LOCALE_FILES = Object.freeze({
    'zh-Hant': 'locales/zh-TW.json?v=20261001-editor-label-r1',
    'zh-Hans': 'locales/zh-CN.json?v=20261001-editor-label-r1',
    'en': 'locales/en.json?v=20261001-editor-label-r1'
  });

  const catalogs = new Map();
  const languageChangeListeners = new Set();
  const nodeSource = new WeakMap();
  const nodeOutput = new WeakMap();
  const attrSource = new WeakMap();

  let language = 'zh-Hant';
  let applying = false;
  let observer = null;
  let loadPromise = null;

  function stripLegacyEmoji(text) {
    return String(text ?? '')
      .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\uFE0F\u200D]/gu, '')
      .replace(/ {2,}/g, ' ')
      .trim();
  }

  function canonicalTraditional(source) {
    return stripLegacyEmoji(source);
  }

  function normalizedCatalog(data = {}) {
    const messages =
      data.messages && typeof data.messages === 'object'
        ? data.messages
        : {};
    const phrases =
      data.phrases && typeof data.phrases === 'object'
        ? data.phrases
        : {};
    const characters =
      data.characters && typeof data.characters === 'object'
        ? data.characters
        : {};

    return {
      meta:
        data._meta && typeof data._meta === 'object'
          ? data._meta
          : {},
      messages,
      phrases,
      characters,
      phraseKeys:Object.keys(phrases).sort((a, b) => b.length - a.length)
    };
  }

  async function loadLocale(lang) {
    if (catalogs.has(lang)) return catalogs.get(lang);

    const file = LOCALE_FILES[lang];
    if (!file) return normalizedCatalog();

    const response = await global.fetch(file, {
      cache:'no-cache'
    });

    if (!response.ok) {
      throw new Error(`無法載入語言檔 ${file}（HTTP ${response.status}）`);
    }

    const catalog = normalizedCatalog(await response.json());
    catalogs.set(lang, catalog);
    return catalog;
  }

  async function loadLocales() {
    if (loadPromise) return loadPromise;

    loadPromise = Promise.allSettled(
      SUPPORTED_LANGUAGES.map(async lang => {
        try {
          await loadLocale(lang);
        } catch (error) {
          console.warn(
            `[多語系] ${lang} 語言檔載入失敗，將保留繁中原文。`,
            error
          );
        }
      })
    );

    await loadPromise;
  }

  function messagesFor(lang) {
    return catalogs.get(lang)?.messages || {};
  }

  function getSavedLanguage() {
    try {
      const value = localStorage.getItem(LANG_KEY);
      if (SUPPORTED_LANGUAGES.includes(value)) return value;
    } catch (_) {}

    return 'zh-Hant';
  }

  function toSimplifiedUI(value) {
    const canonical = canonicalTraditional(value);
    const catalog = catalogs.get('zh-Hans');
    const messages = catalog?.messages || {};

    if (messages[canonical] != null) {
      return stripLegacyEmoji(messages[canonical]);
    }

    let output = canonical;
    const phrases = catalog?.phrases || {};

    for (const key of catalog?.phraseKeys || []) {
      output = output.split(key).join(phrases[key]);
    }

    const characters = catalog?.characters || {};
    output = Array.from(output)
      .map(character => characters[character] || character)
      .join('');

    return stripLegacyEmoji(output);
  }

  function translateFor(lang, source) {
    const canonical = canonicalTraditional(source);

    if (lang === 'zh-Hant') {
      return stripLegacyEmoji(
        messagesFor('zh-Hant')[canonical] ?? canonical
      );
    }

    if (lang === 'zh-Hans') {
      return toSimplifiedUI(canonical);
    }

    if (lang === 'en') {
      return stripLegacyEmoji(
        messagesFor('en')[canonical] ?? canonical
      );
    }

    return canonical;
  }

  function translateExact(source) {
    if (!source) return source;
    return translateFor(language, source);
  }

  function translatePatterns(source) {
    const canonical = canonicalTraditional(source);

    if (language !== 'en') {
      return translateExact(canonical);
    }

    const english = messagesFor('en');

    if (english[canonical] != null) {
      return stripLegacyEmoji(english[canonical]);
    }

    let match;

    if ((match = canonical.match(/^已選\s*(\d+)\s*人$/))) {
      return `Selected ${match[1]} Sim(s)`;
    }
    if ((match = canonical.match(/^寵物（(\d+)）$/))) {
      return `Pets (${match[1]})`;
    }
    if ((match = canonical.match(/^來自：(.+)$/))) {
      return `From: ${match[1]}`;
    }
    if ((match = canonical.match(/^也屬於：(.+)$/))) {
      return `Also in: ${match[1]}`;
    }
    if ((match = canonical.match(/^確定將以下 (\d+) 位從「(.+)」移除嗎？\s+([\s\S]+?)\s+他們仍保留在模擬市民池中。$/))) {
      return `Remove the following ${match[1]} Sim(s) from “${match[2]}”?

${match[3]}

They will remain in the global Sim pool.`;
    }
    if ((match = canonical.match(/^清理完成：刪除了 (\d+) 張未使用圖片。$/))) {
      return `Cleanup complete: deleted ${match[1]} unused image(s).`;
    }
    if ((match = canonical.match(/^儲存空間使用量：(.+)$/))) {
      return `Storage usage: ${match[1]}`;
    }
    if ((match = canonical.match(/^匯入失敗：(.+)$/))) {
      return `Import failed: ${match[1]}`;
    }
    if ((match = canonical.match(/^確定刪除家族「(.+)」嗎？$/))) {
      return `Delete family “${match[1]}”?`;
    }
    if (canonical === '（家族內所有模擬市民仍保留在模擬市民池中）') {
      return '(All Sims in this family will remain in the global Sim pool.)';
    }
    if ((match = canonical.match(/^確定徹底刪除「(.+)」嗎？$/))) {
      return `Permanently delete “${match[1]}”?`;
    }
    if (canonical === '該操作會從所有家族中移除，並從模擬市民池永久刪除。') {
      return 'This removes the Sim from every family and permanently deletes it from the global Sim pool.';
    }
    if (canonical === '（若只想從目前家族移除，請使用「移出家族」）') {
      return '(To remove the Sim only from this family, use “Remove from Family”.)';
    }
    if (canonical === '請輸入新家族名稱。') {
      return 'Enter a name for the new family.';
    }
    if ((match = canonical.match(/^（(\d+) \/ (\d+) 張）$/))) {
      return `(${match[1]} / ${match[2]} images)`;
    }
    if ((match = canonical.match(/^(\d+) 只寵物$/))) {
      return `${match[1]} pet(s)`;
    }
    if ((match = canonical.match(/^原始圖片大小約 ([\d.]+) MB。$/))) {
      return `Original image size: about ${match[1]} MB.`;
    }
    if ((match = canonical.match(/^確定刪除圖片「(.+)」嗎？$/))) {
      return `Delete image “${match[1]}”?`;
    }
    if ((match = canonical.match(/^確定刪除寵物「(.+)」嗎？$/))) {
      return `Delete pet “${match[1]}”?`;
    }
    if ((match = canonical.match(/^圖片處理失敗：(.+)$/))) {
      return `Image processing failed: ${translatePatterns(match[1])}`;
    }
    if ((match = canonical.match(/^背景處理失敗：(.+)$/))) {
      return `Background processing failed: ${translatePatterns(match[1])}`;
    }
    if ((match = canonical.match(/^清除「(.+)模式」下本家族的所有手動位置，恢復自動樹狀。確定嗎？$/))) {
      return `Clear all manual positions for this family in ${translatePatterns(match[1])} mode and restore automatic tree layout?`;
    }
    if ((match = canonical.match(/^確定將以下 (\d+) 位從「(.+)」移除嗎？$/))) {
      return `Remove the following ${match[1]} Sim(s) from “${match[2]}”?`;
    }
    if (canonical === '他們仍保留在模擬市民池中。') {
      return 'They will remain in the global Sim pool.';
    }
    if (canonical === '查看') return 'View';
    if (canonical === '編輯') return 'Edit';

    if (canonical.includes(' · ')) {
      return canonical
        .split(' · ')
        .map(part =>
          english[part] != null
            ? stripLegacyEmoji(english[part])
            : part
        )
        .join(' · ');
    }

    return canonical;
  }

  function translatePreservingSpace(source) {
    const match = String(source).match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match || !match[2]) return source;
    return match[1] + translatePatterns(match[2]) + match[3];
  }

  function translateTextNode(node, refreshSource = false) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const parent = node.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return;
    if (parent.closest && parent.closest('#languageSelect')) return;

    if (refreshSource || !nodeSource.has(node)) {
      nodeSource.set(node, node.nodeValue);
    }

    const translated = translatePreservingSpace(nodeSource.get(node));
    nodeOutput.set(node, translated);

    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  }

  function translateAttrs(element, refreshSource = false) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

    const attrs = ['title', 'placeholder', 'aria-label', 'alt', 'data-tooltip'];
    let cache = attrSource.get(element);

    if (!cache) {
      cache = {};
      attrSource.set(element, cache);
    }

    attrs.forEach(name => {
      if (!element.hasAttribute(name)) return;

      if (refreshSource || cache[name] == null) {
        cache[name] = element.getAttribute(name);
      }

      element.setAttribute(
        name,
        translatePatterns(cache[name])
      );
    });
  }

  function translateTree(root = document.body, refreshSource = false) {
    if (!root) return;

    applying = true;

    try {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root, refreshSource);
      }

      if (root.nodeType === Node.ELEMENT_NODE) {
        translateAttrs(root, refreshSource);
      }

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
      );

      let node;

      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) {
          translateTextNode(node, refreshSource);
        } else {
          translateAttrs(node, refreshSource);
        }
      }

      document.documentElement.lang = language;
      document.title =
        language === 'en'
          ? 'L1nG The Sims 4 Genealogy Tool'
          : language === 'zh-Hans'
            ? 'L1nG 模拟市民族谱工具'
            : 'L1nG 模擬市民族譜工具';
    } finally {
      applying = false;
    }
  }

  function notifyLanguageChanged() {
    languageChangeListeners.forEach(listener => {
      try {
        listener(language);
      } catch (error) {
        console.error('[多語系] 語言切換回呼失敗。', error);
      }
    });
  }

  async function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      lang = 'zh-Hant';
    }

    if (!catalogs.has(lang)) {
      try {
        await loadLocale(lang);
      } catch (error) {
        console.warn(
          `[多語系] ${lang} 語言檔重新載入失敗，將保留繁中原文。`,
          error
        );
      }
    }

    language = lang;

    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (_) {}

    const select = document.getElementById('languageSelect');
    if (select) select.value = lang;

    translateTree(document.body, false);
    notifyLanguageChanged();
  }

  function observe() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(mutations => {
      if (applying) return;

      applying = true;

      try {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') {
            if (
              nodeOutput.has(mutation.target) &&
              mutation.target.nodeValue === nodeOutput.get(mutation.target)
            ) {
              continue;
            }

            translateTextNode(mutation.target, true);
          } else if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.TEXT_NODE) {
                translateTextNode(node, true);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                translateTree(node, true);
              }
            });
          }
        }
      } finally {
        applying = false;
      }
    });

    observer.observe(document.body, {
      subtree:true,
      childList:true,
      characterData:true
    });
  }

  async function initLanguage() {
    await loadLocales();

    language = getSavedLanguage();

    const select = document.getElementById('languageSelect');

    if (select) {
      select.value = language;
      select.addEventListener('change', () => {
        void setLanguage(select.value);
      });
    }

    translateTree(document.body, true);
    observe();
  }

  function onLanguageChanged(listener) {
    if (typeof listener !== 'function') return () => {};

    languageChangeListeners.add(listener);

    return () => {
      languageChangeListeners.delete(listener);
    };
  }

  global.LING_I18N = Object.freeze({
    init:initLanguage,
    setLanguage,
    translate:translatePatterns,
    translateFor,
    onLanguageChanged,
    get language() {
      return language;
    }
  });
})(window);
