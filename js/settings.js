/* ============================================================
   Noter — settings (theme, accent, categories)
   ============================================================ */
(function (global) {
  'use strict';

  const KEY_THEME  = 'noter.theme';
  const KEY_ACCENT = 'noter.accent';
  const KEY_CATS   = 'noter.categories';
  const KEY_CAT_VIEW = 'noter.categoryView';
  const THEMES = ['light', 'dark', 'system'];

  const PALETTE = [
    { id: 'orange', name: 'Orange', light: { bg: '#ff9500', ink: '#ffffff' }, dark: { bg: '#ffb340', ink: '#1c1c1e' } },
    { id: 'blue',   name: 'Blue',   light: { bg: '#007aff', ink: '#ffffff' }, dark: { bg: '#0a84ff', ink: '#ffffff' } },
    { id: 'indigo', name: 'Indigo', light: { bg: '#5856d6', ink: '#ffffff' }, dark: { bg: '#5e5ce6', ink: '#ffffff' } },
    { id: 'purple', name: 'Purple', light: { bg: '#af52de', ink: '#ffffff' }, dark: { bg: '#bf5af2', ink: '#1c1c1e' } },
    { id: 'pink',   name: 'Pink',   light: { bg: '#ff2d55', ink: '#ffffff' }, dark: { bg: '#ff6482', ink: '#1c1c1e' } },
    { id: 'red',    name: 'Red',    light: { bg: '#ff3b30', ink: '#ffffff' }, dark: { bg: '#ff453a', ink: '#ffffff' } },
    { id: 'yellow', name: 'Yellow', light: { bg: '#ffcc00', ink: '#1c1c1e' }, dark: { bg: '#ffd60a', ink: '#1c1c1e' } },
    { id: 'green',  name: 'Green',  light: { bg: '#34c759', ink: '#ffffff' }, dark: { bg: '#30d158', ink: '#1c1c1e' } },
    { id: 'teal',   name: 'Teal',   light: { bg: '#30b0c7', ink: '#ffffff' }, dark: { bg: '#40cbe0', ink: '#1c1c1e' } }
  ];

  const DEFAULT_ACCENT = 'orange';

  const DEFAULT_CATEGORIES = [
    { id: 'thought',   name: 'Thought',   icon: 'c-thought'   },
    { id: 'idea',      name: 'Idea',      icon: 'c-idea'      },
    { id: 'work',      name: 'Work',      icon: 'c-work'      },
    { id: 'shopping',  name: 'Shopping',  icon: 'c-shopping'  },
    { id: 'important', name: 'Important', icon: 'c-important' },
    { id: 'todo',      name: 'To-do',     icon: 'c-todo'      },
    { id: 'study',     name: 'Study',     icon: 'c-study'     },
    { id: 'other',     name: 'Other',     icon: 'c-other'     }
  ];

  const ICON_CHOICES = [
    'c-thought', 'c-idea', 'c-work', 'c-shopping',
    'c-important', 'c-todo', 'c-study', 'c-other',
    'c-tag', 'c-bookmark', 'c-heart', 'c-flag'
  ];

  const PROTECTED_CATEGORY_ID = 'other';
  const FALLBACK_CATEGORY = DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
  const mql = global.matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set();

  function read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  function normalizeCategory(c) {
    if (!c || typeof c.id !== 'string' || typeof c.name !== 'string') return null;
    const fallback = DEFAULT_CATEGORIES.find((d) => d.id === c.id);
    const icon = (typeof c.icon === 'string' && c.icon)
      ? c.icon
      : (fallback ? fallback.icon : 'c-other');
    return { id: c.id, name: c.name.slice(0, 24), icon };
  }

  function findAccent(id) {
    return PALETTE.find((p) => p.id === id) || PALETTE[0];
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

  /* ---------- Accent ---------- */

  function getAccent() {
    const v = read(KEY_ACCENT, DEFAULT_ACCENT);
    return PALETTE.some((p) => p.id === v) ? v : DEFAULT_ACCENT;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function applyAccent() {
    const resolved = resolvedTheme();
    const accent = findAccent(getAccent());
    const mode = resolved === 'dark' ? accent.dark : accent.light;
    const rgb = hexToRgb(mode.bg);

    const root = document.documentElement;
    root.style.setProperty('--accent', mode.bg);
    root.style.setProperty('--accent-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
    root.style.setProperty('--accent-soft',
      'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + (resolved === 'dark' ? '0.16' : '0.14') + ')');
    root.style.setProperty('--accent-ink', mode.ink);
  }

  function setAccent(id) {
    if (!PALETTE.some((p) => p.id === id)) return;
    write(KEY_ACCENT, id);
    applyAccent();
  }

  /* ---------- Theme (continued) ---------- */

  function applyTheme() {
    const resolved = resolvedTheme();
    document.documentElement.dataset.theme = resolved;

    const meta = document.getElementById('meta-theme-color');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#000000' : '#f5f5f7');

    applyAccent();

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
          const clean = parsed.map(normalizeCategory).filter(Boolean);
          if (clean.length) return clean;
        }
      } catch (e) { /* fall through */ }
    }
    return DEFAULT_CATEGORIES.slice();
  }

  function getCategory(id) {
    return getCategories().find((c) => c.id === id) || FALLBACK_CATEGORY;
  }

  function setCategories(list) {
    if (!Array.isArray(list) || !list.length) return;
    const clean = list.map(normalizeCategory).filter(Boolean);
    if (!clean.length) return;
    write(KEY_CATS, JSON.stringify(clean));
  }

  function generateCategoryId() {
    return 'custom-' + Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2, 6);
  }

  /** Returns the new category, or null if the name is empty/duplicate. */
  function addCategory(name, icon) {
    const trimmed = String(name || '').trim().slice(0, 24);
    if (!trimmed) return null;

    const cats = getCategories();
    const dup = cats.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (dup) return null;

    const chosenIcon = ICON_CHOICES.includes(icon) ? icon : 'c-other';
    const cat = { id: generateCategoryId(), name: trimmed, icon: chosenIcon };
    cats.push(cat);
    setCategories(cats);
    return cat;
  }

  /** Returns true on success. Refuses duplicate names (except for itself). */
  function updateCategory(id, patch) {
    const cats = getCategories();
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    const next = { id: cats[idx].id, name: cats[idx].name, icon: cats[idx].icon };

    if (patch && typeof patch.name === 'string') {
      const trimmed = patch.name.trim().slice(0, 24);
      if (!trimmed) return false;
      const dup = cats.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase());
      if (dup) return false;
      next.name = trimmed;
    }
    if (patch && typeof patch.icon === 'string' && ICON_CHOICES.includes(patch.icon)) {
      next.icon = patch.icon;
    }

    cats[idx] = next;
    setCategories(cats);
    return true;
  }

  /** Cannot delete the protected category. Returns true on success. */
  function deleteCategory(id) {
    if (id === PROTECTED_CATEGORY_ID) return false;
    const cats = getCategories();
    if (cats.length <= 1) return false;
    const filtered = cats.filter((c) => c.id !== id);
    if (filtered.length === cats.length) return false;
    setCategories(filtered);
    return true;
  }

  /* ---------- Category view mode (grid / list) ---------- */

  function getCategoryView() {
    const v = read(KEY_CAT_VIEW, 'grid');
    return v === 'list' ? 'list' : 'grid';
  }

  function setCategoryView(v) {
    if (v !== 'grid' && v !== 'list') return;
    write(KEY_CAT_VIEW, v);
  }

  /* ---------- Snapshot / restore ---------- */

  function snapshot() {
    return {
      theme: getTheme(),
      accent: getAccent(),
      categories: getCategories(),
      categoryView: getCategoryView()
    };
  }

  function restore(data) {
    if (!data || typeof data !== 'object') return;
    if (THEMES.includes(data.theme)) write(KEY_THEME, data.theme);
    if (typeof data.accent === 'string' && PALETTE.some((p) => p.id === data.accent)) {
      write(KEY_ACCENT, data.accent);
    }
    if (Array.isArray(data.categories) && data.categories.length) {
      setCategories(data.categories);
    }
    if (data.categoryView === 'grid' || data.categoryView === 'list') {
      write(KEY_CAT_VIEW, data.categoryView);
    }
    applyTheme();
  }

  global.Settings = {
    THEMES,
    PALETTE,
    DEFAULT_ACCENT,
    DEFAULT_CATEGORIES,
    ICON_CHOICES,
    PROTECTED_CATEGORY_ID,
    FALLBACK_CATEGORY,
    getTheme,
    resolvedTheme,
    setTheme,
    applyTheme,
    onThemeChange,
    getAccent,
    setAccent,
    applyAccent,
    getCategories,
    getCategory,
    setCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryView,
    setCategoryView,
    snapshot,
    restore
  };
})(window);
