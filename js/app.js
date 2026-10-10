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

    themeSegmented: $('#theme-segmented'),
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

  const state = {
    view: 'home',
    editor: null,
    openSwipeId: null,
    sheetNoteId: null,
    dialogAction: null,
    toastTimer: null,
    toastActionFn: null,
    lastFocused: null,
    closingEditor: false,

    catDetail: null,
    catEditor: null,
    catSheetId: null,
    catLongPressFired: false,

    homeDate: null,
    homeDateInitialized: false,

    searchExpanded: false
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
        '<div class="note-swipe" aria-hidden="true">' +
          '<div class="swipe-side">' +
            '<button type="button" class="swipe-btn swipe-btn--pin" data-swipe="pin" tabindex="-1">' +
              '<svg class="ico ico-20" viewBox="0 0 24 24"><use href="#i-pin"/></svg>' +
              '<span>' + (note.pinned ? 'Unpin' : 'Pin') + '</span>' +
            '</button>' +
            '<button type="button" class="swipe-btn swipe-btn--fav" data-swipe="fav" tabindex="-1">' +
              '<svg class="ico ico-20" viewBox="0 0 24 24"><use href="#i-star"/></svg>' +
              '<span>' + (note.favorite ? 'Unfav' : 'Favorite') + '</span>' +
            '</button>' +
          '</div>' +
          '<div class="swipe-side">' +
            '<button type="button" class="swipe-btn swipe-btn--delete" data-swipe="delete" tabindex="-1">' +
              '<svg class="ico ico-20" viewBox="0 0 24 24"><use href="#i-trash"/></svg>' +
              '<span>Delete</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
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

    const todays = NotesStore.notes.filter((n) => {
      return n.updatedAt >= dayStart && n.updatedAt < dayEnd;
    });

    const sorted = NotesStore.sorted(todays);

    renderGrouped(
      el.homeList,
      sorted,
      emptyStateHtml('i-home', 'No notes for this day', 'Tap + to start writing something.')
    );
  }

  function renderSearch() {
    const query = el.searchInput.value;
    const hasQuery = !!query.trim();
    el.searchClear.hidden = !query;

    // Sort label
    const sortLabel = SORT_LABELS[Settings.getSort()] || 'Newest';
    el.allNotesSortLabel.textContent = sortLabel;

    // Label + sort visibility
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

    // Body
    if (hasQuery) {
      const results = Search.run(query, NotesStore.notes);
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

    const all = applySort(NotesStore.notes);
    if (!all.length) {
      el.searchList.innerHTML = emptyStateHtml(
        'i-search', 'No notes yet', 'Tap + to start writing something.'
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
    pushOverlayHistory('cat-detail');
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
    pushOverlayHistory('cat-sheet');
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
    pushOverlayHistory('cat-editor');

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
    pushOverlayHistory('sort-sheet');
  }

  function closeSortSheet() {
    el.sortSheetBackdrop.hidden = true;
    resetSheetStyles(el.sortSheetBackdrop);
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

    closeSwipe();
    if (name !== 'search' && document.activeElement === el.searchInput) el.searchInput.blur();
    el.fab.classList.toggle('is-hidden', name === 'more' || name === 'categories');

    if (name === 'categories') {
      state.catDetail = null;
      renderCategoriesView();
    } else if (name === 'more') {
      renderAccentSwatches();
    } else if (name === 'search') {
      renderSearch();
    }
  }

  /* ==========================================================
     Swipe gestures (notes)
     ========================================================== */

  const SWIPE_WIDTH = 76;
  const SWIPE_MAX = SWIPE_WIDTH * 2;
  const DRAG_THRESHOLD = 8;
  let drag = null;

  function cssEscape(value) {
    if (global.CSS && typeof CSS.escape === 'function') return CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function closeSwipe(exceptId) {
    if (!state.openSwipeId || state.openSwipeId === exceptId) return;
    const item = document.querySelector('.note-item[data-id="' + cssEscape(state.openSwipeId) + '"]');
    if (item) {
      const face = item.querySelector('.note-face');
      if (face) face.style.transform = '';
      item.classList.remove('is-open');
    }
    state.openSwipeId = null;
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const face = e.target.closest && e.target.closest('.note-face');
    if (!face) return;
    const item = face.closest('.note-item');
    if (!item) return;
    drag = {
      item, face,
      id: item.dataset.id,
      startX: e.clientX, startY: e.clientY,
      baseX: item.classList.contains('is-open')
        ? (item.dataset.openSide === 'right' ? -SWIPE_MAX : SWIPE_WIDTH) : 0,
      dx: 0, axis: null,
      pointerId: e.pointerId,
      moved: false,
      longPressTimer: setTimeout(() => {
        if (drag && !drag.moved) {
          drag.longPressed = true;
          openSheet(drag.id);
          resetDrag();
        }
      }, 480)
    };
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      drag.moved = true;
      clearTimeout(drag.longPressTimer);
    }
    if (drag.axis === null) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y';
      if (drag.axis === 'x') {
        drag.item.classList.add('is-dragging');
        if (drag.item.setPointerCapture) {
          try { drag.item.setPointerCapture(e.pointerId); } catch (err) {}
        }
      } else { return; }
    }
    if (drag.axis !== 'x') return;
    e.preventDefault();
    let next = drag.baseX + dx;
    if (next > SWIPE_MAX) next = SWIPE_MAX + (next - SWIPE_MAX) * 0.28;
    if (next < -SWIPE_MAX) next = -SWIPE_MAX + (next + SWIPE_MAX) * 0.28;
    drag.dx = next;
    drag.face.style.transform = 'translate3d(' + next + 'px,0,0)';
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    clearTimeout(drag.longPressTimer);
    const d = drag;
    if (d.axis === 'x') {
      const item = d.item;
      item.classList.remove('is-dragging');
      let settle = 0, side = null;
      if (d.dx >= SWIPE_WIDTH * 0.55) { settle = SWIPE_WIDTH; side = 'left'; }
      else if (d.dx <= -SWIPE_WIDTH * 0.55) { settle = -SWIPE_WIDTH; side = 'right'; }
      if (settle === 0) {
        d.face.style.transform = '';
        item.classList.remove('is-open');
        delete item.dataset.openSide;
        if (state.openSwipeId === d.id) state.openSwipeId = null;
      } else {
        closeSwipe(d.id);
        d.face.style.transform = 'translate3d(' + settle + 'px,0,0)';
        item.classList.add('is-open');
        item.dataset.openSide = side;
        state.openSwipeId = d.id;
      }
    }
    resetDrag();
  }

  function resetDrag() {
    if (drag) {
      clearTimeout(drag.longPressTimer);
      if (drag.item) drag.item.classList.remove('is-dragging');
    }
    drag = null;
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
    closeSwipe();
    renderAll();
    showToast(note.pinned ? 'Pinned' : 'Unpinned');
  }

  async function toggleFavorite(id) {
    const note = NotesStore.get(id);
    if (!note) return;
    note.favorite = !note.favorite;
    note.updatedAt = Date.now();
    await NotesStore.upsert(note);
    closeSwipe();
    renderAll();
    showToast(note.favorite ? 'Added to favorites' : 'Removed from favorites');
  }

  async function setCategory(id, categoryId) {
    const note = NotesStore.get(id);
    if (!note || note.category === categoryId) return;
    note.category = categoryId;
    note.updatedAt = Date.now();
    await NotesStore.upsert(note);
    renderAll();
  }

  function deleteNote(id, options) {
    const opts = options || {};
    const note = NotesStore.get(id);
    if (!note) return;
    requestConfirm({
      title: 'Delete this note?',
      message: 'You can undo this right after.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const item = document.querySelector('.note-item[data-id="' + cssEscape(id) + '"]');
        if (item && !opts.skipAnimation) {
          item.classList.add('is-removing');
          await new Promise((r) => setTimeout(r, 200));
        }
        const snapshot = Object.assign({}, note);
        await NotesStore.remove(id);
        if (state.openSwipeId === id) state.openSwipeId = null;
        renderAll();
        showToast('Note deleted', 'Undo', async () => {
          await NotesStore.upsert(snapshot);
          renderAll();
        });
      }
    });
  }

  /* ==========================================================
     Toast
     ========================================================== */

  function showToast(message, actionLabel, actionFn) {
    clearTimeout(state.toastTimer);
    el.toastMsg.textContent = message;
    if (actionLabel && typeof actionFn === 'function') {
      el.toastAction.hidden = false;
      el.toastAction.textContent = actionLabel;
      state.toastActionFn = actionFn;
    } else {
      el.toastAction.hidden = true;
      state.toastActionFn = null;
    }
    el.toast.hidden = false;
    state.toastTimer = setTimeout(hideToast, actionLabel ? 5000 : 2200);
  }

  function hideToast() {
    clearTimeout(state.toastTimer);
    el.toast.hidden = true;
    state.toastActionFn = null;
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
    pushOverlayHistory('dialog');
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
    if (!note) return;
    state.sheetNoteId = id;
    el.sheetTitle.textContent = NotesStore.displayTitle(note) || 'Empty note';

    let html = '';
    html += sheetBtn('pin', note.pinned ? 'Unpin note' : 'Pin to top', 'i-pin', false);
    html += sheetBtn('fav', note.favorite ? 'Remove from favorites' : 'Add to favorites', 'i-star', false);
    html += sheetBtn('delete', 'Delete note', 'i-trash', true);

    el.sheetActions.innerHTML = html;
    el.sheetBackdrop.hidden = false;
    pushOverlayHistory('sheet');
  }

  function closeSheet() {
    el.sheetBackdrop.hidden = true;
    state.sheetNoteId = null;
    resetSheetStyles(el.sheetBackdrop);
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
      if (!existing) return;
      note = Object.assign({}, existing);
    } else {
      note = NotesStore.createDraft(defaultCategoryForNewNote());
      isNew = true;
    }
    state.editor = { note, isNew, timer: null, dirty: false, mode: isNew ? 'edit' : 'view' };
    state.lastFocused = document.activeElement;
    el.editorTitle.value = note.title;
    el.editorContent.value = note.content;
    renderEditorCategories(note.category);
    applyEditorMode();
    syncEditorChrome();
    el.editor.hidden = false;
    el.fab.classList.add('is-hidden');
    pushOverlayHistory('editor');
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
        const snapshot = Object.assign({}, note);
        await NotesStore.remove(note.id);
        ed.isNew = true;
        ed.dirty = false;
        renderAll();
        showToast('Empty note removed', 'Undo', async () => {
          await NotesStore.upsert(snapshot);
          if (state.editor && state.editor.note.id === snapshot.id) state.editor.isNew = false;
          renderAll();
        });
      }
      return;
    }
    note.updatedAt = Date.now();
    await NotesStore.upsert(note);
    ed.isNew = false;
    ed.dirty = false;
    el.editorDelete.disabled = false;
  }

  async function closeEditor() {
    if (state.closingEditor) return;
    const ed = state.editor;
    if (!ed) return;
    state.closingEditor = true;
    clearTimeout(ed.timer);
    try { await flushEditorSave(); } catch (e) {}
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

  function editorDeleteFlow() {
    const ed = state.editor;
    if (!ed || ed.isNew) return;
    const id = ed.note.id;
    const snapshot = Object.assign({}, ed.note);
    requestConfirm({
      title: 'Delete this note?',
      message: 'You can undo this right after.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await NotesStore.remove(id);
        state.editor = null;
        el.editor.hidden = true;
        el.fab.classList.toggle('is-hidden', state.view === 'more' || state.view === 'categories');
        renderAll();
        showToast('Note deleted', 'Undo', async () => {
          await NotesStore.upsert(snapshot);
          renderAll();
        });
      }
    });
  }

  /* ==========================================================
     History / back button
     ========================================================== */

  const overlayStack = [];

  function pushHistory(kind) {
    if (isCapacitor) return;
    try { history.pushState({ noter: kind, depth: overlayStack.length }, ''); } catch (e) {}
  }

  function replaceHistory(kind) {
    if (isCapacitor) return;
    try { history.replaceState({ noter: kind }, ''); } catch (e) {}
  }

  function pushOverlayHistory(kind) {
    overlayStack.push(kind);
    pushHistory(kind);
  }

  function popOverlayHistory() {
    if (!overlayStack.length) return false;
    overlayStack.pop();
    return true;
  }

  function handleBack() {
    const kind = overlayStack[overlayStack.length - 1];

    if (kind === 'editor' && state.editor) { closeEditor(); return true; }
    if (kind === 'sheet') { closeSheet(); return true; }
    if (kind === 'dialog') { closeConfirm(); return true; }
    if (kind === 'sort-sheet') { closeSortSheet(); return true; }
    if (kind === 'cat-detail') { closeCategoryDetail(); return true; }
    if (kind === 'cat-sheet') { closeCategoryActions(); return true; }
    if (kind === 'cat-editor') { closeCategoryEditor(); return true; }

    if (state.catEditor) { closeCategoryEditor(); return true; }
    if (state.catSheetId) { closeCategoryActions(); return true; }
    if (!el.sortSheetBackdrop.hidden) { closeSortSheet(); return true; }
    if (state.catDetail) { closeCategoryDetail(); return true; }
    if (state.editor) { closeEditor(); return true; }
    if (!el.dialogBackdrop.hidden) { closeConfirm(); return true; }
    if (!el.sheetBackdrop.hidden) { closeSheet(); return true; }

    if (state.view !== 'home') {
      switchView('home');
      pushHistory('home');
      return true;
    }
    return false;
  }

  global.addEventListener('popstate', () => {
    if (popOverlayHistory()) {
      handleBack();
    } else if (state.view !== 'home') {
      switchView('home');
      replaceHistory('home');
    }
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

    // 1. Native (Capacitor) — write to cache and open the system share sheet.
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
        // Fall through to web path on unexpected errors.
      }
    }

    // 2. Web Share API with files.
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

      // 3. Browser download fallback.
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
    const segs = $$('.seg', el.themeSegmented);
    for (const seg of segs) {
      seg.setAttribute('aria-checked', seg.dataset.themeOpt === current ? 'true' : 'false');
    }
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
  }

  function renderAll() {
    renderAllNotesViews();
    renderCategoriesView();
    renderStorageNote();
  }

  function renderStorageNote() {
    const n = NotesStore.notes.length;
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
     Event wiring
     ========================================================== */

  function handleListClick(e) {
    const item = e.target.closest ? e.target.closest('.note-item') : null;
    if (!item) { closeSwipe(); return; }
    const id = item.dataset.id;
    const swipeBtn = e.target.closest('.swipe-btn');
    if (swipeBtn) {
      const action = swipeBtn.dataset.swipe;
      if (action === 'pin') togglePin(id);
      else if (action === 'fav') toggleFavorite(id);
      else if (action === 'delete') deleteNote(id);
      return;
    }
    const face = e.target.closest('.note-face');
    if (face) {
      if (state.openSwipeId === id) { closeSwipe(); return; }
      if (state.openSwipeId) { closeSwipe(); return; }
      openEditor(id);
    }
  }

  function handleListKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const face = e.target.closest && e.target.closest('.note-face');
    if (!face) return;
    e.preventDefault();
    const item = face.closest('.note-item');
    if (item) openEditor(item.dataset.id);
  }

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

  function dismissCategoryEditor() {
    try {
      if (overlayStack[overlayStack.length - 1] === 'cat-editor') overlayStack.pop();
      if (overlayStack[overlayStack.length - 1] === 'cat-sheet' && el.catSheetBackdrop.hidden) {
        overlayStack.pop();
        state.catSheetId = null;
      }
      replaceHistory('view');
    } catch (e) {}
    closeCategoryEditor();
  }

  function dismissCategoryActions() {
    try {
      if (overlayStack[overlayStack.length - 1] === 'cat-sheet') {
        overlayStack.pop();
        replaceHistory('view');
      }
    } catch (e) {}
    closeCategoryActions();
  }

  function dismissNoteSheet() {
    try {
      if (overlayStack[overlayStack.length - 1] === 'sheet') {
        overlayStack.pop();
        replaceHistory('view');
      }
    } catch (e) {}
    closeSheet();
  }

  function dismissSortSheet() {
    try {
      if (overlayStack[overlayStack.length - 1] === 'sort-sheet') {
        overlayStack.pop();
        replaceHistory('view');
      }
    } catch (e) {}
    closeSortSheet();
  }

  function dismissConfirm() {
    try {
      if (overlayStack[overlayStack.length - 1] === 'dialog') {
        overlayStack.pop();
        replaceHistory('view');
      }
    } catch (e) {}
    closeConfirm();
  }

  function wireEvents() {
    el.tabbar.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      const name = tab.dataset.tab;
      if (!name || name === state.view) return;
      switchView(name);
      pushHistory('view');
    });

    el.fab.addEventListener('click', () => openEditor(null));

    for (const list of [el.homeList, el.searchList, el.catContent]) {
      list.addEventListener('click', handleListClick);
      list.addEventListener('keydown', handleListKeydown);
      list.addEventListener('pointerdown', onPointerDown, { passive: true });
      list.addEventListener('pointermove', onPointerMove, { passive: false });
      list.addEventListener('pointerup', onPointerUp);
      list.addEventListener('pointercancel', onPointerUp);
      list.addEventListener('scroll', () => { if (drag) resetDrag(); }, { passive: true });
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

    document.addEventListener('pointerdown', (e) => {
      if (!state.openSwipeId) return;
      const item = e.target.closest ? e.target.closest('.note-item') : null;
      if (!item || item.dataset.id !== state.openSwipeId) closeSwipe();
    }, true);

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
      try {
        if (overlayStack[overlayStack.length - 1] === 'cat-detail') {
          overlayStack.pop();
          replaceHistory('view');
        }
      } catch (err) {}
      closeCategoryDetail();
    });

    el.catViewToggle.addEventListener('click', () => {
      const next = Settings.getCategoryView() === 'grid' ? 'list' : 'grid';
      Settings.setCategoryView(next);
      renderCategoriesView();
    });

    el.catAdd.addEventListener('click', () => openCategoryEditor('add'));

    el.catSheetCancel.addEventListener('click', dismissCategoryActions);
    el.catSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.catSheetBackdrop) dismissCategoryActions();
    });

    el.catSheetActions.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat-action]');
      if (!btn) return;
      const action = btn.dataset.catAction;
      const id = state.catSheetId;
      if (!id) return;

      if (action === 'rename') {
        try {
          if (overlayStack[overlayStack.length - 1] === 'cat-sheet') {
            overlayStack.pop();
            replaceHistory('view');
          }
        } catch (err) {}
        closeCategoryActions();
        openCategoryEditor('rename', id);
        return;
      }
      if (action === 'delete') {
        try {
          if (overlayStack[overlayStack.length - 1] === 'cat-sheet') {
            overlayStack.pop();
            replaceHistory('view');
          }
        } catch (err) {}
        closeCategoryActions();
        requestDeleteCategory(id);
        return;
      }
    });

    el.catEditorCancel.addEventListener('click', dismissCategoryEditor);
    el.catEditorBackdrop.addEventListener('click', (e) => {
      if (e.target === el.catEditorBackdrop) dismissCategoryEditor();
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

    el.sortSheetCancel.addEventListener('click', dismissSortSheet);
    el.sortSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.sortSheetBackdrop) dismissSortSheet();
    });
    el.sortSheetActions.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sort]');
      if (!btn) return;
      Settings.setSort(btn.dataset.sort);
      closeSortSheet();
      renderSearch();
    });

    el.editorBack.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (overlayStack[overlayStack.length - 1] === 'editor') {
          overlayStack.pop();
          replaceHistory('view');
        }
      } catch (err) {}
      closeEditor();
    });

    el.editorMode.addEventListener('click', async () => {
      const ed = state.editor;
      if (!ed) return;
      if (ed.mode === 'view') { enterEditMode(); return; }
      await flushEditorSave();
      const current = state.editor;
      if (!current) return;
      if (current.isNew) { closeEditor(); return; }
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

    el.sheetCancel.addEventListener('click', dismissNoteSheet);
    el.sheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.sheetBackdrop) dismissNoteSheet();
    });

    el.sheetActions.addEventListener('click', async (e) => {
      const btn = e.target.closest('.sheet-btn');
      if (!btn) return;
      const action = btn.dataset.sheet;
      const id = state.sheetNoteId;
      if (!id) return;

      try {
        if (overlayStack[overlayStack.length - 1] === 'sheet') {
          overlayStack.pop();
          replaceHistory('view');
        }
      } catch (err) {}
      closeSheet();

      if (action === 'pin') await togglePin(id);
      else if (action === 'fav') await toggleFavorite(id);
      else if (action === 'delete') deleteNote(id);
    });

    el.dialogCancel.addEventListener('click', dismissConfirm);
    el.dialogConfirm.addEventListener('click', runDialogAction);
    el.dialogBackdrop.addEventListener('click', (e) => {
      if (e.target === el.dialogBackdrop) dismissConfirm();
    });

    el.toastAction.addEventListener('click', async () => {
      const fn = state.toastActionFn;
      hideToast();
      if (typeof fn === 'function') await fn();
    });

    el.themeSegmented.addEventListener('click', (e) => {
      const seg = e.target.closest('.seg');
      if (!seg) return;
      Settings.setTheme(seg.dataset.themeOpt);
      syncThemeUI();
      renderAccentSwatches();
    });

    el.accentSwatches.addEventListener('click', (e) => {
      const sw = e.target.closest('.swatch');
      if (!sw) return;
      Settings.setAccent(sw.dataset.accent);
      renderAccentSwatches();
    });

    const moreView = $('#view-more');
    moreView.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'export') exportBackup();
      else if (action === 'import') triggerImport();
    });

    el.importFile.addEventListener('change', () => {
      const file = el.importFile.files && el.importFile.files[0];
      if (file) handleImportFile(file);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (state.catEditor) { closeCategoryEditor(); return; }
      if (state.catSheetId) { closeCategoryActions(); return; }
      if (!el.sortSheetBackdrop.hidden) { closeSortSheet(); return; }
      if (state.editor) { closeEditor(); return; }
      if (!el.dialogBackdrop.hidden) { closeConfirm(); return; }
      if (!el.sheetBackdrop.hidden) { closeSheet(); }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && state.editor) flushEditorSave();
    });

    global.addEventListener('pagehide', () => {
      if (state.editor) flushEditorSave();
    });

    Settings.onThemeChange(() => {
      renderAccentSwatches();
    });

    wireSheetDrag(el.sheetBackdrop);
    wireSheetDrag(el.catSheetBackdrop);
    wireSheetDrag(el.catEditorBackdrop);
    wireSheetDrag(el.sortSheetBackdrop);

    // Native Android back button — Capacitor App plugin.
    if (capApp && typeof capApp.addListener === 'function') {
      try {
        capApp.addListener('backButton', () => {
          if (!handleBack()) showExitConfirm();
        });
      } catch (e) {}
    }
  }

  /* ==========================================================
     Boot
     ========================================================== */

  async function boot() {
    Settings.applyTheme();
    syncThemeUI();
    renderAccentSwatches();
    updateGreeting();
    renderDateStrip();
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

    renderAll();
    wireEvents();

    if (!isCapacitor) {
      try {
        history.replaceState({ noter: 'home' }, '');
        history.pushState({ noter: 'home' }, '');
      } catch (e) {}
    }

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
      global.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
