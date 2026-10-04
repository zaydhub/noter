/* ============================================================
   Noter — settings (theme + categories)
   Preferences are small and non-critical, so localStorage is
   the right tool here. Notes themselves live in IndexedDB.
   ============================================================ */
(function (global) {
  'use strict';

  const KEY_THEME = 'noter.theme';
  const KEY_CATS  = 'noter.categories';
  const THEMES = ['light', 'dark', 'system'];

  const DEFAULT_CATEGORIES = [
    { id: 'thought',   name: 'Thought',   emoji: '💭' },
    { id: 'idea',      name: 'Idea',      emoji: '💡' },
    { id: 'work',      name: 'Work',      emoji: '💼' },
    { id: 'shopping',  name: 'Shopping',  emoji: '🛒' },
    { id: 'important', name: 'Important', emoji: '❗' },
    { id: 'todo',      name: 'To-do',     emoji: '✅' },
    { id: 'study',     name: 'Study',     emoji: '📚' },
    { id: 'other',     name: 'Other',     emoji: '📝' }
  ];

  const FALLBACK_CATEGORY = DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
  const mql = global.matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set();

  function read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* quota / private mode */ }
  }

  /* ---------- Theme ---------- */

  function getTheme() {
    const v = read(KEY_THEME, 'system');
    return THEMES.includes(v) ? v : 'system';
  }

  function resolvedTheme() {
    const t = getTheme();
    if (t === 'system') return mql.matches ? 'dark' : 'light';
    return t;
  }

  function applyTheme() {
    const resolved = resolvedTheme();
    document.documentElement.dataset.theme = resolved;

    const meta = document.getElementById('meta-theme-color');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#000000' : '#f5f5f7');

    listeners.forEach((fn) => {
      try { fn(getTheme(), resolved); } catch (e) { /* ignore */ }
    });
  }

  function setTheme(value) {
    if (!THEMES.includes(value)) return;
    write(KEY_THEME, value);
    applyTheme();
  }

  function onThemeChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // Follow the OS while the preference is "system".
  const onSystemChange = () => { if (getTheme() === 'system') applyTheme(); };
  if (mql.addEventListener) mql.addEventListener('change', onSystemChange);
  else if (mql.addListener) mql.addListener(onSystemChange);

  /* ---------- Categories ---------- */

  function getCategories() {
    const raw = read(KEY_CATS, null);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          const clean = parsed.filter(
            (c) => c && typeof c.id === 'string' && typeof c.name === 'string'
          );
          if (clean.length) return clean;
        }
      } catch (e) { /* fall through to defaults */ }
    }
    return DEFAULT_CATEGORIES.slice();
  }

  function getCategory(id) {
    return getCategories().find((c) => c.id === id) || FALLBACK_CATEGORY;
  }

  function setCategories(list) {
    if (!Array.isArray(list) || !list.length) return;
    write(KEY_CATS, JSON.stringify(list));
  }

  /* ---------- Export / import helper ---------- */

  function snapshot() {
    return { theme: getTheme(), categories: getCategories() };
  }

  function restore(data) {
    if (!data || typeof data !== 'object') return;
    if (THEMES.includes(data.theme)) write(KEY_THEME, data.theme);
    if (Array.isArray(data.categories) && data.categories.length) {
      setCategories(data.categories);
    }
    applyTheme();
  }

  global.Settings = {
    THEMES,
    DEFAULT_CATEGORIES,
    FALLBACK_CATEGORY,
    getTheme,
    resolvedTheme,
    setTheme,
    applyTheme,
    onThemeChange,
    getCategories,
    getCategory,
    setCategories,
    snapshot,
    restore
  };
})(window);
