/* ============================================================
   Noter — UI layer
   ============================================================ */
(function (global) {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const Cap = global.Capacitor;
  const isCapacitor = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
  const capPlugins = (Cap && Cap.Plugins) || {};
  const capApp = capPlugins.App || null;
  const capFilesystem = capPlugins.Filesystem || null;
  const capShare = capPlugins.Share || null;
  const capStatusBar = capPlugins.StatusBar || null;

  const el = {
    metaTheme:      $('#meta-theme-color'),
    views:          $$('.view'),
    tabbar:         $('#tabbar'),
    tabs:           $$('.tab'),
    fab:            $('#fab'),
    greetingTitle:  $('#greeting-title'),
    greetingSub:    $('#greeting-sub'),
    homeDate:       $('#home-date'),
    homeDateStrip:  $('#home-date-strip'),
    homeList:       $('#home-list'),
    searchList:     $('#search-list'),
    searchInput:    $('#search-input'),
    searchClear:    $('#search-clear'),
    searchHeader:   $('.view-header--search'),
    allNotesLabel:  $('#all-notes-label'),
    allNotesSort:   $('#all-notes-sort'),
    allNotesSortLabel: $('#all-notes-sort-label'),

    catBack:        $('#cat-back'),
    catTitle:       $('#cat-title'),
    catHeaderActions: $('#cat-header-actions'),
    catViewToggle:  $('#cat-view-toggle'),
    catAdd:         $('#cat-add'),
    catContent:     $('#cat-content'),

    moreMain:            $('#more-main'),
    moreAppearance:      $('#more-appearance'),
    moreAccent:          $('#more-accent'),
    moreAbout:           $('#more-about'),
    moreTrash:           $('#more-trash'),
    moreAppearanceValue: $('#more-appearance-value'),
    moreAccentSwatch:    $('#more-accent-swatch'),
    moreAppearanceBack:  $('#more-appearance-back'),
    moreAccentBack:      $('#more-accent-back'),
    moreAboutBack:       $('#more-about-back'),
    moreTrashBack:       $('#more-trash-back'),
    moreTrashCount:      $('#more-trash-count'),
    moreTrashEmpty:      $('#more-trash-empty'),
    trashList:           $('#trash-list'),

    themeList:      $('#theme-list'),
    accentSwatches: $('#accent-swatches'),
    storageNote:    $('#storage-note'),

    editor:         $('#editor'),
    editorBack:     $('#editor-back'),
    editorMode:     $('#editor-mode'),
    editorPin:      $('#editor-pin'),
    editorFav:      $('#editor-fav'),
    editorDelete:   $('#editor-delete'),
    editorTitle:    $('#editor-title'),
    editorContent:  $('#editor-content'),
    editorCats:     $('#editor-categories'),

    sheetBackdrop:  $('#sheet-backdrop'),
    sheetTitle:     $('#sheet-title'),
    sheetActions:   $('#sheet-actions'),
    sheetCancel:    $('#sheet-cancel'),

    trashSheetBackdrop: $('#trash-sheet-backdrop'),
    trashSheetTitle:    $('#trash-sheet-title'),
    trashSheetActions:  $('#trash-sheet-actions'),
    trashSheetCancel:   $('#trash-sheet-cancel'),

    catSheetBackdrop: $('#cat-sheet-backdrop'),
    catSheetTitle:  $('#cat-sheet-title'),
    catSheetActions: $('#cat-sheet-actions'),
    catSheetCancel: $('#cat-sheet-cancel'),

    catEditorBackdrop: $('#cat-editor-backdrop'),
    catEditorTitle: $('#cat-editor-title'),
    catEditorName:  $('#cat-editor-name'),
    catEditorIcons: $('#cat-editor-icons'),
    catEditorCancel: $('#cat-editor-cancel'),
    catEditorSave:  $('#cat-editor-save'),

    sortSheetBackdrop: $('#sort-sheet-backdrop'),
    sortSheetActions:  $('#sort-sheet-actions'),
    sortSheetCancel:   $('#sort-sheet-cancel'),

    savePromptBackdrop: $('#save-prompt-backdrop'),
    savePromptDiscard:  $('#save-prompt-discard'),
    savePromptSave:     $('#save-prompt-save'),
    savePromptCancel:   $('#save-prompt-cancel'),

    dialogBackdrop: $('#dialog-backdrop'),
    dialogTitle:    $('#dialog-title'),
    dialogMsg:      $('#dialog-msg'),
    dialogCancel:   $('#dialog-cancel'),
    dialogConfirm:  $('#dialog-confirm'),

    toast:          $('#toast'),
    toastMsg:       $('#toast-msg'),
    toastAction:    $('#toast-action'),

    importFile:     $('#import-file')
  };

  const SORT_LABELS = {
    newest: 'Newest',
    oldest: 'Oldest',
    az: 'A–Z',
    za: 'Z–A'
  };

  const THEME_LABELS = {
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  };

  const state = {
    view: 'home',
    editor: null,
    sheetNoteId: null,
    trashSheetNoteId: null,
    dialogAction: null,
    toastTimer: null,
    lastFocused: null,
    closingEditor: false,
    justLongPressed: false,

    catDetail: null,
    catEditor: null,
    catSheetId: null,
    catLongPressFired: false,

    homeDate: null,
    homeDateInitialized: false,

    searchExpanded: false,

    moreSub: 'main'
  };

  /* ==========================================================
     Utilities
     ========================================================== */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function startOfDay(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  const DAY = 86400000;

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatTime(ts) {
    const d = new Date(ts);
    let h = d.getHours();
    const m = d.getMinutes();
    const suffix = h >= 12 ? 'pm' : 'am';
    h = h % 12; if (h === 0) h = 12;
    return pad2(h) + ':' + pad2(m) + ' ' + suffix;
  }

  function formatDay(ts) {
    const todayStart = startOfDay(Date.now());
    const noteStart = startOfDay(ts);
    const diffDays = Math.round((todayStart - noteStart) / DAY);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    const d = new Date(ts);
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function groupLabel(ts) {
    const todayStart = startOfDay(Date.now());
    const noteStart = startOfDay(ts);
    const dayDiff = Math.round((todayStart - noteStart) / DAY);
    if (dayDiff <= 0) return 'Today';
    if (dayDiff === 1) return 'Yesterday';
    if (dayDiff < 7) return new Date(ts).toLocaleDateString(undefined, { weekday: 'long' });
    if (new Date(ts).getFullYear() === new Date().getFullYear()) {
      return new Date(ts).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    }
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function longDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  function shortWeekday(ts) {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'short' });
  }

  function updateGreeting() {
    const h = new Date().getHours();
    let greeting;
    if (h >= 5 && h < 12) greeting = 'Good morning';
    else if (h >= 12 && h < 17) greeting = 'Good afternoon';
    else if (h >= 17 && h < 22) greeting = 'Good evening';
    else greeting = 'Good night';
    el.greetingTitle.textContent = greeting + ', Zayd';
    el.greetingSub.textContent = 'What’s on your mind?';
    if (el.homeDate) el.homeDate.textContent = longDate(Date.now());
  }

  function syncStatusBar() {
    if (!capStatusBar) return;
    const resolved = Settings.resolvedTheme();
    try {
      if (resolved === 'dark') {
        capStatusBar.setStyle({ style: 'DARK' });
        capStatusBar.setBackgroundColor({ color: '#000000' });
      } else {
        capStatusBar.setStyle({ style: 'LIGHT' });
        capStatusBar.setBackgroundColor({ color: '#f5f5f7' });
      }
    } catch (e) { /* ignore */ }
  }

  function cssEscape(value) {
    if (global.CSS && typeof CSS.escape === 'function') return CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  /* ==========================================================
     Home date strip
     ========================================================== */

  function renderDateStrip() {
    if (!el.homeDateStrip) return;

    const todayMid = startOfDay(Date.now());
    if (!state.homeDateInitialized) {
      state.homeDate = todayMid;
      state.homeDateInitialized = true;
    }
    if (state.homeDate === null) state.homeDate = todayMid;

    const ref = new Date(todayMid);
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const firstMid = startOfDay(new Date(year, month, 1).getTime());
    const lastMid = startOfDay(new Date(year, month + 1, 0).getTime());

    let html = '';
    for (let ts = firstMid; ts <= lastMid; ts += DAY) {
      const isSelected = ts === state.homeDate;
      const classes = 'date-chip' + (isSelected ? ' is-selected' : '');
      html += (
        '<button type="button" class="' + classes + '" data-day="' + ts + '" ' +
                'role="tab" aria-selected="' + (isSelected ? 'true' : 'false') + '">' +
          '<span class="date-chip-day">' + escapeHtml(shortWeekday(ts)) + '</span>' +
          '<span class="date-chip-num">' + new Date(ts).getDate() + '</span>' +
        '</button>'
      );
    }
    el.homeDateStrip.innerHTML = html;

    requestAnimationFrame(() => {
      if (!el.homeDateStrip) return;
      const target = el.homeDateStrip.querySelector('.date-chip.is-selected');
      if (!target) return;
      const strip = el.homeDateStrip;
      const targetCenter = target.offsetLeft + target.offsetWidth / 2;
      const stripHalf = strip.clientWidth / 2;
      const nextLeft = Math.max(0, targetCenter - stripHalf);
      strip.scrollTo({ left: nextLeft, behavior: 'auto' });
    });
  }

  /* ==========================================================
     Note row rendering
     ========================================================== */

  function noteFlagsHtml(note) {
    let html = '';
    if (note.pinned) {
      html += '<svg class="note-flag note-flag--pin" viewBox="0 0 24 24" aria-hidden="true">' +
              '<use href="#i-pin"/></svg>';
    }
    if (note.favorite) {
      html += '<svg class="note-flag note-flag--fav" viewBox="0 0 24 24" aria-hidden="true">' +
              '<use href="#i-star"/></svg>';
    }
    return html;
  }

  function noteRowHtml(note) {
    const cat = Settings.getCategory(note.category);
    const title = NotesStore.displayTitle(note);
    const titleClass = title ? 'note-title' : 'note-title note-title--empty';
    const titleText = title ? escapeHtml(title) : 'Empty note';
    const flags = noteFlagsHtml(note);
    const aria = title ? title : 'Empty note';
    const time = escapeHtml(formatTime(note.updatedAt));
    const day = escapeHtml(formatDay(note.updatedAt));

    return (
      '<li class="note-item" data-id="' + escapeHtml(note.id) + '">' +
        '<div class="note-face" role="button" tabindex="0" aria-label="' + escapeHtml(aria) + '">' +
          '<span class="note-icon" aria-hidden="true">' +
            '<svg class="ico"><use href="#' + escapeHtml(cat.icon) + '"/></svg>' +
          '</span>' +
          '<span class="note-main">' +
            '<span class="note-title-row">' +
              '<span class="' + titleClass + '">' + titleText + '</span>' +
              (flags ? '<span class="note-flags">' + flags + '</span>' : '') +
            '</span>' +
            '<span class="note-meta">' +
              '<span class="note-meta-time">' + time + '</span>' +
              '<span class="note-meta-day">' + day + '</span>' +
            '</span>' +
          '</span>' +
        '</div>' +
      '</li>'
    );
  }

  function trashRowHtml(note) {
    const cat = Settings.getCategory(note.category);
    const title = NotesStore.displayTitle(note);
    const titleClass = title ? 'note-title' : 'note-title note-title--empty';
    const titleText = title ? escapeHtml(title) : 'Empty note';
    const days = NotesStore.daysLeft(note);
    const daysText = days === 1 ? 'Deletes in 1 day' : ('Deletes in ' + days + ' days');
    const aria = (title ? title : 'Empty note') + '. ' + daysText;

    return (
      '<li class="note-item trash-item" data-id="' + escapeHtml(note.id) + '">' +
        '<div class="note-face" role="button" tabindex="0" aria-label="' + escapeHtml(aria) + '">' +
          '<span class="note-icon" aria-hidden="true">' +
            '<svg class="ico"><use href="#' + escapeHtml(cat.icon) + '"/></svg>' +
          '</span>' +
          '<span class="note-main">' +
            '<span class="note-title-row">' +
              '<span class="' + titleClass + '">' + titleText + '</span>' +
            '</span>' +
            '<span class="note-meta">' +
              '<span class="note-meta-time">Deleted ' + escapeHtml(formatTime(note.deletedAt)) + '</span>' +
              '<span class="note-meta-day">' + escapeHtml(daysText) + '</span>' +
            '</span>' +
          '</span>' +
        '</div>' +
      '</li>'
    );
  }

  function emptyStateHtml(iconId, title, sub) {
    return (
      '<div class="empty">' +
        '<div class="empty-ico"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' +
          '<use href="#' + iconId + '"/></svg></div>' +
        '<p class="empty-title">' + escapeHtml(title) + '</p>' +
        '<p class="empty-sub">' + escapeHtml(sub) + '</p>' +
      '</div>'
    );
  }

  function renderGrouped(container, notes, emptyHtml) {
    if (!notes.length) { container.innerHTML = emptyHtml; return; }
    let html = '';
    let currentGroup = null;
    let open = false;
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const label = groupLabel(note.updatedAt);
      if (label !== currentGroup) {
        if (open) html += '</ul></div>';
        html += '<div class="group"><h2 class="group-title">' + escapeHtml(label) + '</h2><ul class="note-list">';
        currentGroup = label;
        open = true;
      }
      html += noteRowHtml(note);
    }
    if (open) html += '</ul></div>';
    container.innerHTML = html;
  }

  function renderFlat(container, notes, emptyHtml) {
    if (!notes.length) { container.innerHTML = emptyHtml; return; }
    let html = '<ul class="note-list">';
    for (let i = 0; i < notes.length; i++) html += noteRowHtml(notes[i]);
    html += '</ul>';
    container.innerHTML = html;
  }

  /* ==========================================================
     Sorting
     ========================================================== */

  function applySort(notes) {
    const mode = Settings.getSort();
    const copy = notes.slice();

    copy.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      if (mode === 'az' || mode === 'za') {
        const at = (NotesStore.displayTitle(a) || '').toLowerCase();
        const bt = (NotesStore.displayTitle(b) || '').toLowerCase();
        const cmp = at.localeCompare(bt);
        return mode === 'az' ? cmp : -cmp;
      }
      if (mode === 'oldest') return a.updatedAt - b.updatedAt;
      return b.updatedAt - a.updatedAt;
    });
    return copy;
  }

  /* ==========================================================
     Home + Search
     ========================================================== */

  function renderHome() {
    const dayStart = state.homeDate != null ? state.homeDate : startOfDay(Date.now());
    const dayEnd = dayStart + DAY;

    const todays = NotesStore.live().filter((n) => {
      return n.updatedAt >= dayStart && n.updatedAt < dayEnd;
    });

    const sorted = NotesStore.sorted(todays);

    renderGrouped(
      el.homeList,
      sorted,
      emptyStateHtml('i-home', 'No notes for this day', 'Tap + to create')
    );
  }

  function renderSearch() {
    const query = el.searchInput.value;
    const hasQuery = !!query.trim();
    el.searchClear.hidden = !query;

    const sortLabel = SORT_LABELS[Settings.getSort()] || 'Newest';
    el.allNotesSortLabel.textContent = sortLabel;

    if (hasQuery) {
      el.allNotesLabel.textContent = 'Results';
      el.allNotesSort.classList.remove('is-hidden');
    } else if (state.searchExpanded) {
      el.allNotesLabel.textContent = 'All notes';
      el.allNotesSort.classList.remove('is-hidden');
    } else {
      el.allNotesLabel.textContent = 'See all notes';
      el.allNotesSort.classList.add('is-hidden');
    }

    if (hasQuery) {
      const results = Search.run(query, NotesStore.live());
      if (!results.length) {
        el.searchList.innerHTML = emptyStateHtml(
          'i-search', 'No notes found', 'Try a different word or check the spelling.'
        );
        return;
      }
      renderFlat(el.searchList, applySort(results), '');
      return;
    }

    if (!state.searchExpanded) {
      el.searchList.innerHTML = emptyStateHtml(
        'i-search', 'Search your notes', 'Find notes by title, content, or category.'
      );
      return;
    }

    const all = applySort(NotesStore.live());
    if (!all.length) {
      el.searchList.innerHTML = emptyStateHtml(
        'i-search', 'No notes yet', 'Tap + to create'
      );
      return;
    }
    renderFlat(el.searchList, all, '');
  }

  /* ==========================================================
     Categories view
     ========================================================== */

  function renderCategoriesView() {
    const detail = state.catDetail;
    const view = Settings.getCategoryView();
    const counts = NotesStore.countsByCategory();
    const favoritesCount = NotesStore.favorites().length;

    if (detail) {
      el.catBack.hidden = false;
      el.catTitle.textContent = detail.name;
      el.catHeaderActions.hidden = true;

      const notes = detail.id === 'favorites'
        ? NotesStore.favorites()
        : NotesStore.byCategory(detail.id);

      if (detail.id === 'favorites') {
        renderFlat(el.catContent, notes,
          emptyStateHtml('i-star', 'No favorite notes yet',
            'Tap the star on a note to save it here.'));
      } else {
        renderFlat(el.catContent, notes,
          emptyStateHtml('i-categories', 'No notes in ' + detail.name,
            'Notes assigned to this category will show up here.'));
      }
      return;
    }

    el.catBack.hidden = true;
    el.catTitle.textContent = 'Categories';
    el.catHeaderActions.hidden = false;

    const toggleIcon = view === 'grid' ? 'i-list' : 'i-grid';
    const toggleLabel = view === 'grid' ? 'Switch to list view' : 'Switch to grid view';
    el.catViewToggle.setAttribute('aria-label', toggleLabel);
    el.catViewToggle.innerHTML =
      '<svg class="ico ico-20" aria-hidden="true"><use href="#' + toggleIcon + '"/></svg>';

    const cats = Settings.getCategories();
    let html = '';

    html +=
      '<button type="button" class="fav-entry" id="cat-favorites" aria-label="Open favorites">' +
        '<span class="fav-entry-icon" aria-hidden="true">' +
          '<svg class="ico"><use href="#i-star"/></svg>' +
        '</span>' +
        '<span class="fav-entry-label">Favorites</span>' +
        '<span class="fav-entry-count">' + favoritesCount + '</span>' +
        '<svg class="ico ico-18 row-chev" aria-hidden="true"><use href="#i-chevron"/></svg>' +
      '</button>';

    html += '<h2 class="group-title cat-section-title">All categories</h2>';

    if (!cats.length) {
      html += '<p class="cat-empty">No categories.</p>';
    } else if (view === 'grid') {
      html += '<div class="cat-grid" id="cat-grid">';
      for (const c of cats) {
        html += (
          '<button type="button" class="cat-card" data-cat-id="' + escapeHtml(c.id) + '">' +
            '<span class="cat-card-icon" aria-hidden="true">' +
              '<svg class="ico"><use href="#' + escapeHtml(c.icon) + '"/></svg>' +
            '</span>' +
            '<span class="cat-card-name">' + escapeHtml(c.name) + '</span>' +
            '<span class="cat-card-count">' + (counts[c.id] || 0) +
              (counts[c.id] === 1 ? ' note' : ' notes') + '</span>' +
          '</button>'
        );
      }
      html += '</div>';
    } else {
      html += '<div class="cat-list" id="cat-list">';
      for (const c of cats) {
        html += (
          '<button type="button" class="cat-list-item" data-cat-id="' + escapeHtml(c.id) + '">' +
            '<span class="cat-list-icon" aria-hidden="true">' +
              '<svg class="ico"><use href="#' + escapeHtml(c.icon) + '"/></svg>' +
            '</span>' +
            '<span class="cat-list-name">' + escapeHtml(c.name) + '</span>' +
            '<span class="cat-list-count">' + (counts[c.id] || 0) + '</span>' +
            '<svg class="ico ico-18 row-chev" aria-hidden="true"><use href="#i-chevron"/></svg>' +
          '</button>'
        );
      }
      html += '</div>';
    }

    el.catContent.innerHTML = html;
  }

  function openCategoryDetail(id) {
    if (id === 'favorites') {
      state.catDetail = { id: 'favorites', name: 'Favorites' };
    } else {
      const cat = Settings.getCategory(id);
      if (!cat) return;
      state.catDetail = { id: cat.id, name: cat.name };
    }
    renderCategoriesView();
    const v = $('#view-categories');
    if (v) v.scrollTop = 0;
  }

  function closeCategoryDetail() {
    state.catDetail = null;
    renderCategoriesView();
  }

  /* ==========================================================
     Category actions sheet
     ========================================================== */

  function openCategoryActions(id) {
    const cat = Settings.getCategory(id);
    if (!cat) return;

    state.catSheetId = id;
    el.catSheetTitle.textContent = cat.name;

    const isProtected = id === Settings.PROTECTED_CATEGORY_ID;

    let html = '';
    html += (
      '<button type="button" class="sheet-btn" data-cat-action="rename">' +
        '<svg class="ico ico-20" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-edit"/></svg>' +
        '<span>Rename</span>' +
      '</button>'
    );
    if (!isProtected) {
      html += (
        '<button type="button" class="sheet-btn sheet-btn--danger" data-cat-action="delete">' +
          '<svg class="ico ico-20" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-trash"/></svg>' +
          '<span>Delete</span>' +
        '</button>'
      );
    }

    el.catSheetActions.innerHTML = html;
    el.catSheetBackdrop.hidden = false;
  }

  function closeCategoryActions() {
    el.catSheetBackdrop.hidden = true;
    state.catSheetId = null;
    resetSheetStyles(el.catSheetBackdrop);
  }

  /* ==========================================================
     Category editor sheet
     ========================================================== */

  function renderCategoryIconPicker() {
    const selected = state.catEditor ? state.catEditor.icon : 'c-other';
    const choices = Settings.ICON_CHOICES;
    let html = '';
    for (const iconId of choices) {
      const checked = iconId === selected;
      html += (
        '<button type="button" class="icon-opt" role="radio" data-icon="' + iconId + '" ' +
                'aria-checked="' + (checked ? 'true' : 'false') + '" aria-label="Icon">' +
          '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + iconId + '"/></svg>' +
        '</button>'
      );
    }
    el.catEditorIcons.innerHTML = html;
  }

  function syncCategoryEditorSave() {
    const ed = state.catEditor;
    if (!ed) return;
    const name = el.catEditorName.value.trim();
    el.catEditorSave.disabled = name.length === 0;
  }

  function openCategoryEditor(mode, categoryId) {
    let icon = 'c-other';
    let name = '';

    if (mode === 'rename' && categoryId) {
      const cat = Settings.getCategory(categoryId);
      if (!cat) return;
      icon = cat.icon;
      name = cat.name;
    } else {
      mode = 'add';
      icon = Settings.ICON_CHOICES[0];
      categoryId = null;
    }

    state.catEditor = { mode, categoryId, icon };
    el.catEditorTitle.textContent = mode === 'add' ? 'New category' : 'Rename category';
    el.catEditorName.value = name;
    renderCategoryIconPicker();
    syncCategoryEditorSave();

    el.catEditorBackdrop.hidden = false;

    requestAnimationFrame(() => {
      el.catEditorName.focus({ preventScroll: true });
      try {
        const len = el.catEditorName.value.length;
        el.catEditorName.setSelectionRange(len, len);
      } catch (e) {}
    });
  }

  function closeCategoryEditor() {
    el.catEditorBackdrop.hidden = true;
    state.catEditor = null;
    resetSheetStyles(el.catEditorBackdrop);
  }

  function saveCategoryEditor() {
    const ed = state.catEditor;
    if (!ed) return;

    const name = el.catEditorName.value.trim();
    if (!name) return;

    if (ed.mode === 'add') {
      const created = Settings.addCategory(name, ed.icon);
      if (!created) { showToast('That name is already in use'); return; }
      closeCategoryEditor();
      renderCategoriesView();
      showToast('Category created');
    } else {
      const ok = Settings.updateCategory(ed.categoryId, { name, icon: ed.icon });
      if (!ok) { showToast('That name is already in use'); return; }
      if (state.catDetail && state.catDetail.id === ed.categoryId) {
        state.catDetail.name = name;
      }
      closeCategoryEditor();
      renderCategoriesView();
      renderAllNotesViews();
      showToast('Category updated');
    }
  }

  /* ==========================================================
     Category deletion
     ========================================================== */

  function requestDeleteCategory(id) {
    const cat = Settings.getCategory(id);
    if (!cat) return;
    if (id === Settings.PROTECTED_CATEGORY_ID) {
      showToast('"Other" cannot be deleted');
      return;
    }

    const count = NotesStore.countsByCategory()[id] || 0;
    const msg = count === 0
      ? 'This category will be removed.'
      : (count === 1
          ? '1 note will be moved to “Other”.'
          : count + ' notes will be moved to “Other”.');

    requestConfirm({
      title: 'Delete “' + cat.name + '”?',
      message: msg,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await NotesStore.reassignCategory(id, Settings.PROTECTED_CATEGORY_ID);
        const ok = Settings.deleteCategory(id);
        if (!ok) { showToast('Could not delete category'); return; }
        if (state.catDetail && state.catDetail.id === id) {
          state.catDetail = null;
        }
        renderCategoriesView();
        renderAllNotesViews();
        showToast('Category deleted');
      }
    });
  }

  /* ==========================================================
     Sort sheet
     ========================================================== */

  function renderSortSheet() {
    const current = Settings.getSort();
    const options = Settings.SORTS;
    let html = '';
    for (const opt of options) {
      const checked = opt === current;
      html += (
        '<button type="button" class="sheet-btn" role="menuitemradio" ' +
                'data-sort="' + opt + '" aria-checked="' + (checked ? 'true' : 'false') + '">' +
          '<span style="flex:1">' + escapeHtml(SORT_LABELS[opt] || opt) + '</span>' +
          (checked
            ? '<svg class="ico ico-18" viewBox="0 0 24 24" style="color:var(--accent)"><use href="#i-check"/></svg>'
            : '') +
        '</button>'
      );
    }
    el.sortSheetActions.innerHTML = html;
  }

  function openSortSheet() {
    renderSortSheet();
    el.sortSheetBackdrop.hidden = false;
  }

  function closeSortSheet() {
    el.sortSheetBackdrop.hidden = true;
    resetSheetStyles(el.sortSheetBackdrop);
  }

  /* ==========================================================
     Trash view
     ========================================================== */

  function renderTrashView() {
    const items = NotesStore.trashed();

    if (!items.length) {
      el.trashList.innerHTML = emptyStateHtml(
        'i-trash', 'Trash is empty', 'Deleted notes are stored in trash for 30 days before being removed.'
      );
      return;
    }

    let html = '<p class="trash-hint">Notes here are removed automatically after 30 days. Long-press a note to restore or delete it permanently.</p>';
    html += '<ul class="note-list">';
    for (const n of items) html += trashRowHtml(n);
    html += '</ul>';
    el.trashList.innerHTML = html;
  }

  function openTrashSheet(id) {
    const note = NotesStore.get(id);
    if (!note || !note.deletedAt) return;

    state.trashSheetNoteId = id;
    el.trashSheetTitle.textContent = NotesStore.displayTitle(note) || 'Empty note';

    let html = '';
    html += (
      '<button type="button" class="sheet-btn" data-trash-action="restore">' +
        '<svg class="ico ico-20" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-restore"/></svg>' +
        '<span>Restore note</span>' +
      '</button>'
    );
    html += (
      '<button type="button" class="sheet-btn sheet-btn--danger" data-trash-action="purge">' +
        '<svg class="ico ico-20" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-trash"/></svg>' +
        '<span>Delete permanently</span>' +
      '</button>'
    );

    el.trashSheetActions.innerHTML = html;
    el.trashSheetBackdrop.hidden = false;
  }

  function closeTrashSheet() {
    el.trashSheetBackdrop.hidden = true;
    state.trashSheetNoteId = null;
    resetSheetStyles(el.trashSheetBackdrop);
  }

  async function restoreTrashed(id) {
    const note = NotesStore.get(id);
    if (!note || !note.deletedAt) return;
    await NotesStore.restore(id);
    renderAll();
    showToast('Note restored');
  }

  function purgeTrashed(id) {
    const note = NotesStore.get(id);
    if (!note) return;
    requestConfirm({
      title: 'Delete permanently?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await NotesStore.purge(id);
        renderTrashView();
        renderAll();
        showToast('Note deleted');
      }
    });
  }

  function emptyTrash() {
    if (NotesStore.trashCount() === 0) {
      showToast('Trash is already empty');
      return;
    }
    requestConfirm({
      title: 'Empty Trash?',
      message: 'All notes in trash will be permanently deleted.',
      confirmLabel: 'Empty Trash',
      destructive: true,
      onConfirm: async () => {
        await NotesStore.emptyTrash();
        renderTrashView();
        renderAll();
        showToast('Trash emptied');
      }
    });
  }

  /* ==========================================================
     More page sub-navigation
     ========================================================== */

  function showMoreSub(name) {
    if (state.moreSub === name) return;
    state.moreSub = name;
    el.moreMain.hidden       = name !== 'main';
    el.moreAppearance.hidden = name !== 'appearance';
    el.moreAccent.hidden     = name !== 'accent';
    el.moreAbout.hidden      = name !== 'about';
    el.moreTrash.hidden      = name !== 'trash';

    if (name === 'main') updateMoreValues();
    if (name === 'accent') renderAccentSwatches();
    if (name === 'appearance') syncThemeUI();
    if (name === 'trash') renderTrashView();
  }

  function updateMoreValues() {
    if (el.moreAppearanceValue) {
      el.moreAppearanceValue.textContent = THEME_LABELS[Settings.getTheme()] || 'System';
    }
    if (el.moreAccentSwatch) {
      const resolved = Settings.resolvedTheme();
      const accent = Settings.PALETTE.find((p) => p.id === Settings.getAccent()) || Settings.PALETTE[0];
      const mode = resolved === 'dark' ? accent.dark : accent.light;
      el.moreAccentSwatch.style.background = mode.bg;
    }
    if (el.moreTrashCount) {
      const n = NotesStore.trashCount();
      el.moreTrashCount.textContent = n === 0 ? '' : String(n);
    }
    if (el.moreTrashEmpty) {
      el.moreTrashEmpty.disabled = NotesStore.trashCount() === 0;
    }
  }

  function isMoreSubOpen() {
    return state.moreSub !== 'main';
  }

  function closeMoreSub() {
    if (state.moreSub === 'main') return;
    state.moreSub = 'main';
    el.moreMain.hidden = false;
    el.moreAppearance.hidden = true;
    el.moreAccent.hidden = true;
    el.moreAbout.hidden = true;
    el.moreTrash.hidden = true;
    updateMoreValues();
  }

  /* ==========================================================
     Navigation
     ========================================================== */

  function switchView(name) {
    if (state.view === name) return;
    state.view = name;

    for (const v of el.views) v.classList.toggle('is-active', v.dataset.view === name);
    for (const tab of el.tabs) {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('is-active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }

    if (name !== 'search' && document.activeElement === el.searchInput) el.searchInput.blur();
    el.fab.classList.toggle('is-hidden', name === 'more' || name === 'categories');

    if (name === 'categories') {
      state.catDetail = null;
      renderCategoriesView();
    } else if (name === 'more') {
      closeMoreSub();
      updateMoreValues();
    } else if (name === 'search') {
      renderSearch();
    }
  }

  /* ==========================================================
     Note actions
     ========================================================== */

  async function togglePin(id) {
    const note = NotesStore.get(id);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    await NotesStore.upsert(note);
    renderAll();
    showToast(note.pinned ? 'Pinned' : 'Unpinned');
  }

  async function toggleFavorite(id) {
    const note = NotesStore.get(id);
    if (!note) return;
    note.favorite = !note.favorite;
    note.updatedAt = Date.now();
    await NotesStore.upsert(note);
    renderAll();
    showToast(note.favorite ? 'Added to favorites' : 'Removed from favorites');
  }

  function deleteNote(id) {
    const note = NotesStore.get(id);
    if (!note || note.deletedAt) return;
    requestConfirm({
      title: 'Delete this note?',
      message: ' ',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const item = document.querySelector('.note-item[data-id="' + cssEscape(id) + '"]');
        if (item) {
          item.classList.add('is-removing');
          await new Promise((r) => setTimeout(r, 200));
        }
        await NotesStore.softDelete(id);
        renderAll();
        showToast('Moved to Trash');
      }
    });
  }

  /* ==========================================================
     Toast
     ========================================================== */

  function showToast(message) {
    clearTimeout(state.toastTimer);
    el.toastMsg.textContent = message;
    el.toastAction.hidden = true;
    el.toast.hidden = false;
    state.toastTimer = setTimeout(hideToast, 2200);
  }

  function hideToast() {
    clearTimeout(state.toastTimer);
    el.toast.hidden = true;
  }

  /* ==========================================================
     Confirm dialog
     ========================================================== */

  function requestConfirm(opts) {
    el.dialogTitle.textContent = opts.title || 'Are you sure?';
    const msg = opts.message || '';
    el.dialogMsg.textContent = msg;
    el.dialogMsg.hidden = !msg;
    el.dialogConfirm.textContent = opts.confirmLabel || 'Confirm';
    el.dialogConfirm.classList.toggle('dialog-btn--danger', !!opts.destructive);
    state.dialogAction = opts.onConfirm || null;
    el.dialogBackdrop.hidden = false;
    el.dialogConfirm.focus({ preventScroll: true });
  }

  function closeConfirm() {
    el.dialogBackdrop.hidden = true;
    state.dialogAction = null;
  }

  async function runDialogAction() {
    const fn = state.dialogAction;
    closeConfirm();
    if (typeof fn === 'function') await fn();
  }

  function showExitConfirm() {
    requestConfirm({
      title: 'Exit Noter?',
      message: '',
      confirmLabel: 'Exit',
      destructive: true,
      onConfirm: () => {
        if (capApp && typeof capApp.exitApp === 'function') {
          try { capApp.exitApp(); } catch (e) {}
        }
      }
    });
  }

  /* ==========================================================
     Note action sheet
     ========================================================== */

  function sheetBtn(action, label, icon, danger) {
    return (
      '<button type="button" class="sheet-btn' + (danger ? ' sheet-btn--danger' : '') + '" ' +
              'data-sheet="' + action + '">' +
        '<svg class="ico ico-20" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + icon + '"/></svg>' +
        '<span>' + escapeHtml(label) + '</span>' +
      '</button>'
    );
  }

  function openSheet(id) {
    const note = NotesStore.get(id);
    if (!note || note.deletedAt) return;
    state.sheetNoteId = id;
    el.sheetTitle.textContent = NotesStore.displayTitle(note) || 'Empty note';

    let html = '';
    html += sheetBtn('pin', note.pinned ? 'Unpin note' : 'Pin to top', 'i-pin', false);
    html += sheetBtn('fav', note.favorite ? 'Remove from favorites' : 'Add to favorites', 'i-star', false);
    html += sheetBtn('delete', 'Delete note', 'i-trash', true);

    el.sheetActions.innerHTML = html;
    el.sheetBackdrop.hidden = false;
  }

  function closeSheet() {
    el.sheetBackdrop.hidden = true;
    state.sheetNoteId = null;
    resetSheetStyles(el.sheetBackdrop);
  }

  /* ==========================================================
     Save prompt
     ========================================================== */

  function editorHasChanges() {
    const ed = state.editor;
    if (!ed) return false;
    const title = el.editorTitle.value;
    const content = el.editorContent.value;
    if (ed.originallyNew) {
      return title.trim() !== '' || content.trim() !== '';
    }
    return title !== ed.original.title || content !== ed.original.content;
  }

  function openSavePrompt() {
    el.savePromptBackdrop.hidden = false;
  }

  function closeSavePrompt() {
    el.savePromptBackdrop.hidden = true;
  }

  function cancelSavePrompt() {
    closeSavePrompt();
    if (state.editor) {
      const ed = state.editor;
      if (ed.mode === 'edit') {
        requestAnimationFrame(() => {
          el.editorContent.focus({ preventScroll: true });
        });
      }
    }
  }

  async function discardEditorChanges() {
    const ed = state.editor;
    if (!ed) return;
    clearTimeout(ed.timer);
    ed.timer = null;

    const noteId = ed.note.id;
    const existing = NotesStore.get(noteId);

    if (ed.originallyNew) {
      if (existing) await NotesStore.remove(noteId);
    } else if (existing) {
      const orig = ed.original;
      existing.title = orig.title;
      existing.content = orig.content;
      existing.category = orig.category;
      existing.pinned = orig.pinned;
      existing.favorite = orig.favorite;
      existing.updatedAt = orig.updatedAt;
      existing.deletedAt = null;
      await NotesStore.upsert(existing);
    }

    ed.dirty = false;
    ed.isNew = false;
    renderAll();
  }

  async function onSavePromptAction(action) {
    if (action === 'save') {
      closeSavePrompt();
      try { await flushEditorSave(); } catch (e) {}
      await closeEditor({ skipSave: true });
    } else if (action === 'discard') {
      closeSavePrompt();
      await discardEditorChanges();
      await closeEditor({ skipSave: true });
    }
  }

  /* ==========================================================
     Editor (note)
     ========================================================== */

  function autoGrowTitle() {
    el.editorTitle.style.height = 'auto';
    el.editorTitle.style.height = el.editorTitle.scrollHeight + 'px';
  }

  function renderEditorCategories(selectedId) {
    const cats = Settings.getCategories();
    let html = '';
    for (const c of cats) {
      const checked = c.id === selectedId;
      html += (
        '<button type="button" class="chip" role="radio" data-cat="' + escapeHtml(c.id) + '" ' +
                'aria-checked="' + (checked ? 'true' : 'false') + '">' +
          '<svg class="ico chip-icon" aria-hidden="true"><use href="#' + escapeHtml(c.icon) + '"/></svg>' +
          '<span>' + escapeHtml(c.name) + '</span>' +
        '</button>'
      );
    }
    el.editorCats.innerHTML = html;
  }

  function syncEditorChrome() {
    const note = state.editor && state.editor.note;
    if (!note) return;
    el.editorPin.setAttribute('aria-pressed', note.pinned ? 'true' : 'false');
    el.editorPin.setAttribute('aria-label', note.pinned ? 'Unpin note' : 'Pin note');
    el.editorFav.setAttribute('aria-pressed', note.favorite ? 'true' : 'false');
    el.editorFav.setAttribute('aria-label', note.favorite ? 'Remove from favorites' : 'Mark as favorite');
    el.editorDelete.disabled = state.editor.isNew;
    const chips = $$('.chip', el.editorCats);
    for (const chip of chips) {
      chip.setAttribute('aria-checked', chip.dataset.cat === note.category ? 'true' : 'false');
    }
  }

  function applyEditorMode() {
    const ed = state.editor;
    if (!ed) return;
    const isEdit = ed.mode === 'edit';
    el.editorTitle.readOnly = !isEdit;
    el.editorContent.readOnly = !isEdit;
    el.editor.classList.toggle('is-view-mode', !isEdit);
    el.editorMode.textContent = isEdit ? 'Done' : 'Edit';
    el.editorMode.setAttribute('aria-label', isEdit ? 'Save note' : 'Edit note');
  }

  function enterEditMode() {
    const ed = state.editor;
    if (!ed || ed.mode === 'edit') return;
    ed.mode = 'edit';
    applyEditorMode();
    requestAnimationFrame(() => {
      autoGrowTitle();
      el.editorContent.focus({ preventScroll: true });
    });
  }

  async function exitEditMode() {
    const ed = state.editor;
    if (!ed || ed.mode === 'view') return;
    ed.mode = 'view';
    el.editorTitle.blur();
    el.editorContent.blur();
    applyEditorMode();
    await flushEditorSave();
  }

  function defaultCategoryForNewNote() {
    const sorted = NotesStore.sorted();
    return sorted.length ? sorted[0].category : 'thought';
  }

  function openEditor(id) {
    if (state.editor) return;
    let note, isNew = false;
    if (id) {
      const existing = NotesStore.get(id);
      if (!existing || existing.deletedAt) return;
      note = Object.assign({}, existing);
    } else {
      note = NotesStore.createDraft(defaultCategoryForNewNote());
      isNew = true;
    }
    state.editor = {
      note,
      isNew,
      originallyNew: isNew,
      mode: isNew ? 'edit' : 'view',
      timer: null,
      dirty: false,
      original: {
        title: note.title,
        content: note.content,
        category: note.category,
        pinned: note.pinned,
        favorite: note.favorite,
        updatedAt: note.updatedAt
      }
    };
    state.lastFocused = document.activeElement;
    el.editorTitle.value = note.title;
    el.editorContent.value = note.content;
    renderEditorCategories(note.category);
    applyEditorMode();
    syncEditorChrome();
    el.editor.hidden = false;
    el.fab.classList.add('is-hidden');
    requestAnimationFrame(() => {
      autoGrowTitle();
      if (!state.editor || state.editor.mode !== 'edit') return;
      if (state.editor.isNew) el.editorTitle.focus({ preventScroll: true });
      else el.editorContent.focus({ preventScroll: true });
    });
  }

  function scheduleEditorSave() {
    const ed = state.editor;
    if (!ed) return;
    ed.dirty = true;
    clearTimeout(ed.timer);
    ed.timer = setTimeout(flushEditorSave, 450);
  }

  async function flushEditorSave() {
    const ed = state.editor;
    if (!ed) return;
    clearTimeout(ed.timer);
    ed.timer = null;
    if (!ed.dirty && !ed.isNew) return;
    const note = ed.note;
    note.title = el.editorTitle.value;
    note.content = el.editorContent.value;
    if (NotesStore.isBlank(note)) {
      if (!ed.isNew) {
        await NotesStore.softDelete(note.id);
        ed.isNew = true;
        ed.dirty = false;
        renderAll();
      }
      return;
    }
    note.deletedAt = null;
    note.updatedAt = Date.now();
    await NotesStore.upsert(note);
    ed.isNew = false;
    ed.dirty = false;
    el.editorDelete.disabled = false;
  }

  async function closeEditor(options) {
    const opts = options || {};
    if (state.closingEditor) return;
    const ed = state.editor;
    if (!ed) return;
    state.closingEditor = true;

    clearTimeout(ed.timer);
    if (!opts.skipSave) {
      try { await flushEditorSave(); } catch (e) {}
    }

    el.editor.classList.add('is-closing');
    await new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      el.editor.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, 320);
    });
    el.editor.classList.remove('is-closing');
    el.editor.hidden = true;
    state.editor = null;
    el.fab.classList.toggle('is-hidden', state.view === 'more' || state.view === 'categories');
    renderAll();
    if (state.lastFocused && document.contains(state.lastFocused)) {
      try { state.lastFocused.focus({ preventScroll: true }); } catch (e) {}
    }
    state.lastFocused = null;
    state.closingEditor = false;
  }

  function requestEditorClose() {
    const ed = state.editor;
    if (!ed) return;
    if (ed.mode === 'edit' && editorHasChanges()) {
      openSavePrompt();
      return;
    }
    closeEditor();
  }

  function editorDeleteFlow() {
    const ed = state.editor;
    if (!ed || ed.isNew) return;
    const id = ed.note.id;
    requestConfirm({
      title: 'Delete this note?',
      message: ' ',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await NotesStore.softDelete(id);
        state.editor = null;
        el.editor.hidden = true;
        el.fab.classList.toggle('is-hidden', state.view === 'more' || state.view === 'categories');
        renderAll();
        showToast('Moved to Trash');
      }
    });
  }

  /* ==========================================================
     Back button
     ========================================================== */

  function handleBack() {
    if (!el.savePromptBackdrop.hidden) {
      cancelSavePrompt();
      return true;
    }

    if (state.editor) {
      requestEditorClose();
      return true;
    }

    if (state.trashSheetNoteId) { closeTrashSheet(); return true; }
    if (state.catSheetId)       { closeCategoryActions(); return true; }
    if (state.sheetNoteId)      { closeSheet(); return true; }

    if (state.catEditor) { closeCategoryEditor(); return true; }

    if (!el.sortSheetBackdrop.hidden) { closeSortSheet(); return true; }
    if (!el.dialogBackdrop.hidden) { closeConfirm(); return true; }

    if (isMoreSubOpen()) { closeMoreSub(); return true; }

    if (state.catDetail) { closeCategoryDetail(); return true; }

    if (state.view !== 'home') {
      switchView('home');
      return true;
    }

    return false;
  }

  global.addEventListener('popstate', () => {
    if (isCapacitor) return;
    handleBack();
  });

  /* ==========================================================
     Backup / export / import
     ========================================================== */

  async function exportBackup() {
    const payload = {
      app: 'noter', version: 1,
      exportedAt: new Date().toISOString(),
      notes: NotesStore.sorted(),
      settings: Settings.snapshot()
    };
    const json = JSON.stringify(payload, null, 2);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = 'noter-backup-' + stamp + '.json';

    if (capFilesystem && capShare) {
      try {
        const written = await capFilesystem.writeFile({
          path: filename,
          data: json,
          directory: 'CACHE',
          encoding: 'utf8'
        });
        await capShare.share({
          title: 'Noter backup',
          dialogTitle: 'Save or share backup',
          url: written.uri
        });
        return;
      } catch (err) {
        const msg = String((err && err.message) || '').toLowerCase();
        if (msg.indexOf('cancel') !== -1 || msg.indexOf('abort') !== -1) return;
      }
    }

    try {
      const blob = new Blob([json], { type: 'application/json' });
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Noter backup' });
          return;
        } catch (err) {
          if (err && err.name === 'AbortError') return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      showToast('Export failed');
    }
  }

  function triggerImport() {
    el.importFile.value = '';
    el.importFile.click();
  }

  async function handleImportFile(file) {
    if (!file) return;
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch (err) {
      requestConfirm({ title: 'Import failed', message: 'That file could not be read as a Noter backup.', confirmLabel: 'OK', onConfirm: null });
      return;
    }
    const notes = Array.isArray(data) ? data : (data && Array.isArray(data.notes) ? data.notes : null);
    if (!notes) {
      requestConfirm({ title: 'Import failed', message: 'No notes were found in that file.', confirmLabel: 'OK', onConfirm: null });
      return;
    }
    const clean = notes.filter((n) => n && typeof n === 'object');
    if (!clean.length) {
      requestConfirm({ title: 'Nothing to import', message: 'That backup does not contain any notes.', confirmLabel: 'OK', onConfirm: null });
      return;
    }
    requestConfirm({
      title: 'Import ' + clean.length + (clean.length === 1 ? ' note?' : ' notes?'),
      message: 'Existing notes are kept unless the imported copy is newer.',
      confirmLabel: 'Import',
      onConfirm: async () => {
        try {
          const result = await NotesStore.merge(clean);
          if (data && data.settings) Settings.restore(data.settings);
          renderAll();
          syncThemeUI();
          renderAccentSwatches();
          renderDateStrip();
          updateMoreValues();
          if (isMoreSubOpen() && state.moreSub === 'trash') renderTrashView();
          const parts = [];
          if (result.added) parts.push(result.added + ' added');
          if (result.updated) parts.push(result.updated + ' updated');
          if (result.skipped) parts.push(result.skipped + ' kept');
          showToast(parts.length ? 'Imported: ' + parts.join(', ') : 'Nothing new to import');
        } catch (err) {
          showToast('Import failed');
        }
      }
    });
  }

  /* ==========================================================
     Theme + accent
     ========================================================== */

  function syncThemeUI() {
    const current = Settings.getTheme();
    const rows = $$('.theme-row', el.themeList);
    for (const row of rows) {
      row.setAttribute('aria-checked', row.dataset.themeOpt === current ? 'true' : 'false');
    }
    updateMoreValues();
  }

  function renderAccentSwatches() {
    if (!el.accentSwatches) return;
    const current = Settings.getAccent();
    const resolved = Settings.resolvedTheme();
    const palette = Settings.PALETTE;

    let html = '';
    for (let i = 0; i < palette.length; i++) {
      const p = palette[i];
      const mode = resolved === 'dark' ? p.dark : p.light;
      const checked = p.id === current;
      html += (
        '<button type="button" class="swatch" role="radio" ' +
                'data-accent="' + p.id + '" ' +
                'aria-checked="' + (checked ? 'true' : 'false') + '" ' +
                'aria-label="' + escapeHtml(p.name) + '" ' +
                'title="' + escapeHtml(p.name) + '" ' +
                'style="--swatch-color:' + mode.bg + ';--swatch-ink:' + mode.ink + '">' +
          '<span class="swatch-check" aria-hidden="true">' +
            '<svg class="ico" viewBox="0 0 24 24"><use href="#i-check"/></svg>' +
          '</span>' +
        '</button>'
      );
    }
    el.accentSwatches.innerHTML = html;
  }

  /* ==========================================================
     Render all
     ========================================================== */

  function renderAllNotesViews() {
    renderHome();
    renderSearch();
    if (state.view === 'categories' || state.catDetail) renderCategoriesView();
    if (isMoreSubOpen() && state.moreSub === 'trash') renderTrashView();
  }

  function renderAll() {
    renderAllNotesViews();
    renderCategoriesView();
    renderStorageNote();
    updateMoreValues();
  }

  function renderStorageNote() {
    const n = NotesStore.live().length;
    el.storageNote.textContent =
      n + (n === 1 ? ' note stored on this device' : ' notes stored on this device');
  }

  /* ==========================================================
     Sheet swipe-to-dismiss
     ========================================================== */

  function resetSheetStyles(backdropEl) {
    if (!backdropEl) return;
    const sheetEl = backdropEl.querySelector('.sheet');
    if (!sheetEl) return;
    sheetEl.style.transition = '';
    sheetEl.style.transform = '';
    sheetEl.style.opacity = '';
  }

  function wireSheetDrag(backdropEl) {
    if (!backdropEl) return;
    const sheetEl = backdropEl.querySelector('.sheet');
    const handleEl = sheetEl ? sheetEl.querySelector('.sheet-handle') : null;
    if (!sheetEl || !handleEl) return;

    const isTop = backdropEl.classList.contains('sheet-backdrop--top');
    let dragState = null;

    handleEl.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragState = {
        startY: e.clientY,
        pointerId: e.pointerId,
        height: sheetEl.offsetHeight
      };
      try { handleEl.setPointerCapture(e.pointerId); } catch (err) {}
      sheetEl.style.transition = 'none';
      e.preventDefault();
    });

    handleEl.addEventListener('pointermove', (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      let dy = e.clientY - dragState.startY;
      if (isTop && dy > 0) dy = dy * 0.28;
      if (!isTop && dy < 0) dy = dy * 0.28;
      sheetEl.style.transform = 'translateY(' + dy + 'px)';
      e.preventDefault();
    });

    handleEl.addEventListener('pointerup', (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const dy = e.clientY - dragState.startY;
      const d = dragState;
      dragState = null;

      const threshold = Math.min(120, d.height * 0.34);
      const shouldDismiss = isTop
        ? Math.abs(dy) > threshold
        : dy > threshold;

      if (shouldDismiss) {
        const dir = isTop ? (dy < 0 ? -1 : 1) : 1;
        sheetEl.style.transition = 'transform .22s cubic-bezier(.32,.72,0,1), opacity .22s ease';
        sheetEl.style.transform = 'translateY(' + (dir * (d.height + 80)) + 'px)';
        sheetEl.style.opacity = '0';
        setTimeout(() => {
          const cancel = sheetEl.querySelector('.sheet-cancel');
          if (cancel) cancel.click();
        }, 190);
      } else {
        sheetEl.style.transition = 'transform .24s cubic-bezier(.32,.72,0,1)';
        sheetEl.style.transform = '';
        setTimeout(() => { sheetEl.style.transition = ''; }, 260);
      }
    });

    handleEl.addEventListener('pointercancel', () => {
      dragState = null;
      sheetEl.style.transition = '';
      sheetEl.style.transform = '';
    });
  }

  /* ==========================================================
     Long-press on a note (live or trashed)
     ========================================================== */

  let notePressTimer = null;
  let notePressTarget = null;

  function notePointerDown(e) {
    const face = e.target.closest && e.target.closest('.note-face');
    if (!face) return;
    const item = face.closest('.note-item');
    if (!item) return;
    state.justLongPressed = false;
    const isTrash = !!item.closest('#trash-list');
    notePressTarget = {
      id: item.dataset.id,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      isTrash: isTrash
    };
    clearTimeout(notePressTimer);
    notePressTimer = setTimeout(() => {
      if (notePressTarget && !notePressTarget.moved) {
        state.justLongPressed = true;
        if (notePressTarget.isTrash) openTrashSheet(notePressTarget.id);
        else openSheet(notePressTarget.id);
      }
    }, 480);
  }

  function notePointerMove(e) {
    if (!notePressTarget || notePressTarget.moved) return;
    const dx = Math.abs(e.clientX - notePressTarget.startX);
    const dy = Math.abs(e.clientY - notePressTarget.startY);
    if (dx > 8 || dy > 8) {
      notePressTarget.moved = true;
      clearTimeout(notePressTimer);
    }
  }

  function notePointerEnd() {
    clearTimeout(notePressTimer);
    notePressTarget = null;
  }

  function handleListClick(e) {
    const item = e.target.closest ? e.target.closest('.note-item') : null;
    if (!item) return;
    if (state.justLongPressed) {
      state.justLongPressed = false;
      return;
    }
    const inTrash = !!item.closest('#trash-list');
    if (inTrash) {
      openTrashSheet(item.dataset.id);
      return;
    }
    const face = e.target.closest('.note-face');
    if (face) {
      openEditor(item.dataset.id);
    }
  }

  function handleListKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const face = e.target.closest && e.target.closest('.note-face');
    if (!face) return;
    e.preventDefault();
    const item = face.closest('.note-item');
    if (!item) return;
    if (item.closest('#trash-list')) openTrashSheet(item.dataset.id);
    else openEditor(item.dataset.id);
  }

  /* ==========================================================
     Categories long-press
     ========================================================== */

  let catPressTimer = null;
  let catPressTarget = null;

  function catPointerDown(e) {
    const target = e.target.closest && e.target.closest('[data-cat-id]');
    if (!target) return;
    catPressTarget = {
      id: target.dataset.catId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };
    state.catLongPressFired = false;
    clearTimeout(catPressTimer);
    catPressTimer = setTimeout(() => {
      if (catPressTarget && !catPressTarget.moved) {
        state.catLongPressFired = true;
        openCategoryActions(catPressTarget.id);
      }
    }, 480);
  }

  function catPointerMove(e) {
    if (!catPressTarget || catPressTarget.moved) return;
    const dx = Math.abs(e.clientX - catPressTarget.startX);
    const dy = Math.abs(e.clientY - catPressTarget.startY);
    if (dx > 8 || dy > 8) {
      catPressTarget.moved = true;
      clearTimeout(catPressTimer);
    }
  }

  function catPointerEnd() {
    clearTimeout(catPressTimer);
    catPressTarget = null;
  }

  function catContentClick(e) {
    if (e.target.closest('#cat-favorites')) {
      openCategoryDetail('favorites');
      return;
    }
    const hit = e.target.closest('[data-cat-id]');
    if (!hit) return;
    if (state.catLongPressFired) {
      state.catLongPressFired = false;
      return;
    }
    openCategoryDetail(hit.dataset.catId);
  }

  /* ==========================================================
     Event wiring
     ========================================================== */

  function wireEvents() {
    el.tabbar.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      const name = tab.dataset.tab;
      if (!name || name === state.view) return;
      switchView(name);
    });

    el.fab.addEventListener('click', () => openEditor(null));

    const noteLists = [el.homeList, el.searchList, el.catContent, el.trashList];
    for (const list of noteLists) {
      list.addEventListener('click', handleListClick);
      list.addEventListener('keydown', handleListKeydown);
      list.addEventListener('pointerdown', notePointerDown, { passive: true });
      list.addEventListener('pointermove', notePointerMove, { passive: true });
      list.addEventListener('pointerup', notePointerEnd);
      list.addEventListener('pointercancel', notePointerEnd);
      list.addEventListener('contextmenu', (ev) => {
        if (ev.target.closest && ev.target.closest('.note-face')) {
          ev.preventDefault();
        }
      });
    }

    if (el.homeDateStrip) {
      el.homeDateStrip.addEventListener('click', (e) => {
        const chip = e.target.closest('.date-chip');
        if (!chip) return;
        const ts = Number(chip.dataset.day);
        if (!Number.isFinite(ts)) return;
        if (state.homeDate === ts) return;
        state.homeDate = ts;
        renderDateStrip();
        renderHome();
      });
    }

    el.catContent.addEventListener('pointerdown', catPointerDown, { passive: true });
    el.catContent.addEventListener('pointermove', catPointerMove, { passive: true });
    el.catContent.addEventListener('pointerup', catPointerEnd);
    el.catContent.addEventListener('pointercancel', catPointerEnd);
    el.catContent.addEventListener('click', catContentClick);

    let searchRaf = 0;
    el.searchInput.addEventListener('input', () => {
      if (searchRaf) return;
      searchRaf = requestAnimationFrame(() => { searchRaf = 0; renderSearch(); });
    });

    el.searchClear.addEventListener('click', () => {
      el.searchInput.value = '';
      renderSearch();
      el.searchInput.focus({ preventScroll: true });
    });

    el.allNotesLabel.addEventListener('click', () => {
      state.searchExpanded = !state.searchExpanded;
      renderSearch();
    });

    el.allNotesSort.addEventListener('click', openSortSheet);

    const searchView = $('#view-search');
    searchView.addEventListener('scroll', () => {
      el.searchHeader.classList.toggle('is-scrolled', searchView.scrollTop > 2);
    }, { passive: true });

    el.catBack.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCategoryDetail();
    });

    el.catViewToggle.addEventListener('click', () => {
      const next = Settings.getCategoryView() === 'grid' ? 'list' : 'grid';
      Settings.setCategoryView(next);
      renderCategoriesView();
    });

    el.catAdd.addEventListener('click', () => openCategoryEditor('add'));

    el.catSheetCancel.addEventListener('click', closeCategoryActions);
    el.catSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.catSheetBackdrop) closeCategoryActions();
    });

    el.catSheetActions.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat-action]');
      if (!btn) return;
      const action = btn.dataset.catAction;
      const id = state.catSheetId;
      if (!id) return;

      if (action === 'rename') {
        closeCategoryActions();
        openCategoryEditor('rename', id);
        return;
      }
      if (action === 'delete') {
        closeCategoryActions();
        requestDeleteCategory(id);
        return;
      }
    });

    el.catEditorCancel.addEventListener('click', closeCategoryEditor);
    el.catEditorBackdrop.addEventListener('click', (e) => {
      if (e.target === el.catEditorBackdrop) closeCategoryEditor();
    });
    el.catEditorSave.addEventListener('click', saveCategoryEditor);
    el.catEditorName.addEventListener('input', syncCategoryEditorSave);
    el.catEditorName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!el.catEditorSave.disabled) saveCategoryEditor();
      }
    });

    el.catEditorIcons.addEventListener('click', (e) => {
      const opt = e.target.closest('.icon-opt');
      if (!opt || !state.catEditor) return;
      state.catEditor.icon = opt.dataset.icon;
      renderCategoryIconPicker();
    });

    el.sortSheetCancel.addEventListener('click', closeSortSheet);
    el.sortSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.sortSheetBackdrop) closeSortSheet();
    });
    el.sortSheetActions.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sort]');
      if (!btn) return;
      Settings.setSort(btn.dataset.sort);
      closeSortSheet();
      renderSearch();
    });

    /* ---- More page navigation ---- */
    const moreView = $('#view-more');
    moreView.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-more-nav]');
      if (nav) {
        showMoreSub(nav.dataset.moreNav);
        return;
      }
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'export') exportBackup();
        else if (action === 'import') triggerImport();
        return;
      }
    });

    if (el.moreAppearanceBack) el.moreAppearanceBack.addEventListener('click', closeMoreSub);
    if (el.moreAccentBack)     el.moreAccentBack.addEventListener('click', closeMoreSub);
    if (el.moreAboutBack)      el.moreAboutBack.addEventListener('click', closeMoreSub);
    if (el.moreTrashBack)      el.moreTrashBack.addEventListener('click', closeMoreSub);
    if (el.moreTrashEmpty)     el.moreTrashEmpty.addEventListener('click', emptyTrash);

    /* ---- Trash sheet ---- */
    el.trashSheetCancel.addEventListener('click', closeTrashSheet);
    el.trashSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.trashSheetBackdrop) closeTrashSheet();
    });
    el.trashSheetActions.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-trash-action]');
      if (!btn) return;
      const action = btn.dataset.trashAction;
      const id = state.trashSheetNoteId;
      if (!id) return;
      closeTrashSheet();
      if (action === 'restore') await restoreTrashed(id);
      else if (action === 'purge') purgeTrashed(id);
    });

    /* ---- Save prompt ---- */
    if (el.savePromptCancel) el.savePromptCancel.addEventListener('click', cancelSavePrompt);
    if (el.savePromptSave)    el.savePromptSave.addEventListener('click', () => onSavePromptAction('save'));
    if (el.savePromptDiscard) el.savePromptDiscard.addEventListener('click', () => onSavePromptAction('discard'));
    el.savePromptBackdrop.addEventListener('click', (e) => {
      if (e.target === el.savePromptBackdrop) cancelSavePrompt();
    });

    /* ---- Note editor ---- */
    el.editorBack.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      requestEditorClose();
    });

    el.editorMode.addEventListener('click', async () => {
      const ed = state.editor;
      if (!ed) return;
      if (ed.mode === 'view') { enterEditMode(); return; }
      await flushEditorSave();
      const current = state.editor;
      if (!current) return;
      if (current.isNew) { closeEditor({ skipSave: true }); return; }
      exitEditMode();
      showToast('Note saved');
    });

    el.editorTitle.addEventListener('input', () => { autoGrowTitle(); scheduleEditorSave(); });
    el.editorContent.addEventListener('input', scheduleEditorSave);

    el.editorPin.addEventListener('click', () => {
      const ed = state.editor;
      if (!ed) return;
      ed.note.pinned = !ed.note.pinned;
      ed.dirty = true;
      syncEditorChrome();
      scheduleEditorSave();
      showToast(ed.note.pinned ? 'Pinned' : 'Unpinned');
    });

    el.editorFav.addEventListener('click', () => {
      const ed = state.editor;
      if (!ed) return;
      ed.note.favorite = !ed.note.favorite;
      ed.dirty = true;
      syncEditorChrome();
      scheduleEditorSave();
      showToast(ed.note.favorite ? 'Added to favorites' : 'Removed from favorites');
    });

    el.editorDelete.addEventListener('click', editorDeleteFlow);

    el.editorCats.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const ed = state.editor;
      if (!ed) return;
      ed.note.category = chip.dataset.cat;
      ed.dirty = true;
      syncEditorChrome();
      scheduleEditorSave();
    });

    /* ---- Note action sheet ---- */
    el.sheetCancel.addEventListener('click', closeSheet);
    el.sheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.sheetBackdrop) closeSheet();
    });

    el.sheetActions.addEventListener('click', async (e) => {
      const btn = e.target.closest('.sheet-btn');
      if (!btn) return;
      const action = btn.dataset.sheet;
      const id = state.sheetNoteId;
      if (!id) return;
      closeSheet();
      if (action === 'pin') await togglePin(id);
      else if (action === 'fav') await toggleFavorite(id);
      else if (action === 'delete') deleteNote(id);
    });

    /* ---- Confirm dialog ---- */
    el.dialogCancel.addEventListener('click', closeConfirm);
    el.dialogConfirm.addEventListener('click', runDialogAction);
    el.dialogBackdrop.addEventListener('click', (e) => {
      if (e.target === el.dialogBackdrop) closeConfirm();
    });

    /* ---- Theme rows ---- */
    el.themeList.addEventListener('click', (e) => {
      const row = e.target.closest('.theme-row');
      if (!row) return;
      const opt = row.dataset.themeOpt;
      if (!opt) return;
      Settings.setTheme(opt);
      syncThemeUI();
      renderAccentSwatches();
    });

    /* ---- Accent swatches ---- */
    el.accentSwatches.addEventListener('click', (e) => {
      const sw = e.target.closest('.swatch');
      if (!sw) return;
      Settings.setAccent(sw.dataset.accent);
      renderAccentSwatches();
      updateMoreValues();
    });

    el.importFile.addEventListener('change', () => {
      const file = el.importFile.files && el.importFile.files[0];
      if (file) handleImportFile(file);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!el.savePromptBackdrop.hidden) { cancelSavePrompt(); return; }
      if (state.catEditor) { closeCategoryEditor(); return; }
      if (state.catSheetId) { closeCategoryActions(); return; }
      if (state.trashSheetNoteId) { closeTrashSheet(); return; }
      if (!el.sortSheetBackdrop.hidden) { closeSortSheet(); return; }
      if (state.editor) { requestEditorClose(); return; }
      if (!el.dialogBackdrop.hidden) { closeConfirm(); return; }
      if (!el.sheetBackdrop.hidden) { closeSheet(); return; }
      if (isMoreSubOpen()) { closeMoreSub(); }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && state.editor) flushEditorSave();
    });

    global.addEventListener('pagehide', () => {
      if (state.editor) flushEditorSave();
    });

    Settings.onThemeChange(() => {
      renderAccentSwatches();
      updateMoreValues();
      syncStatusBar();
    });

    wireSheetDrag(el.sheetBackdrop);
    wireSheetDrag(el.trashSheetBackdrop);
    wireSheetDrag(el.catSheetBackdrop);
    wireSheetDrag(el.catEditorBackdrop);
    wireSheetDrag(el.sortSheetBackdrop);

    if (capApp && typeof capApp.addListener === 'function') {
      try {
        capApp.addListener('backButton', () => {
          try {
            const closed = handleBack();
            if (!closed) showExitConfirm();
          } catch (err) {
            showExitConfirm();
          }
        });
      } catch (e) {}
    }
  }

  /* ==========================================================
     Boot
     ========================================================== */

  async function boot() {
    Settings.applyTheme();
    syncStatusBar();
    syncThemeUI();
    renderAccentSwatches();
    updateGreeting();
    renderDateStrip();
    updateMoreValues();
    setInterval(updateGreeting, 60000);

    try {
      await NotesStore.init();
    } catch (err) {
      el.homeList.innerHTML = emptyStateHtml(
        'i-warn',
        'Storage unavailable',
        'Noter could not open its local database. Private browsing mode can cause this.'
      );
      return;
    }

    try {
      const purged = await NotesStore.purgeExpired();
      if (purged > 0) console.log('[Noter] purged ' + purged + ' expired note(s)');
    } catch (e) { /* ignore */ }

    renderAll();
    wireEvents();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !state.editor) {
        updateGreeting();
        const todayMid = startOfDay(Date.now());
        if (state.homeDateInitialized && state.homeDate != null) {
          const selectedOffset = Math.round((state.homeDate - todayMid) / DAY);
          if (selectedOffset < -15 || selectedOffset > 15) {
            state.homeDate = todayMid;
            renderDateStrip();
          }
        }
        renderAll();
      }
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
