/* ============================================================
   Noter — UI layer
   Views, navigation, editor, gestures, dialogs, backup/import.
   ============================================================ */
(function (global) {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const el = {
    metaTheme:      $('#meta-theme-color'),
    views:          $$('.view'),
    tabbar:         $('#tabbar'),
    tabs:           $$('.tab'),
    fab:            $('#fab'),
    greetingTitle:  $('#greeting-title'),
    greetingSub:    $('#greeting-sub'),
    homeList:       $('#home-list'),
    searchList:     $('#search-list'),
    favoritesList:  $('#favorites-list'),
    searchInput:    $('#search-input'),
    searchClear:    $('#search-clear'),
    searchHeader:   $('.view-header--search'),
    themeSegmented: $('#theme-segmented'),
    categoriesCard: $('#categories-card'),
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

  const state = {
    view: 'home',
    editor: null,
    openSwipeId: null,
    sheetNoteId: null,
    dialogAction: null,
    toastTimer: null,
    toastActionFn: null,
    lastFocused: null,
    closingEditor: false
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

  function updateGreeting() {
    const h = new Date().getHours();
    let greeting;
    if (h >= 5 && h < 12) greeting = 'Good morning';
    else if (h >= 12 && h < 17) greeting = 'Good afternoon';
    else if (h >= 17 && h < 22) greeting = 'Good evening';
    else greeting = 'Good night';

    el.greetingTitle.textContent = greeting + ', Zayd';
    el.greetingSub.textContent = 'What’s on your mind?';
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
            '<span class="' + titleClass + '">' + titleText + '</span>' +
            '<span class="note-meta">' +
              '<span class="note-meta-time">' + time + '</span>' +
              '<span class="note-meta-day">' + day + '</span>' +
            '</span>' +
          '</span>' +
          (flags ? '<span class="note-flags">' + flags + '</span>' : '') +
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
     Rendering per view
     ========================================================== */

  function renderHome() {
    renderGrouped(
      el.homeList,
      NotesStore.sorted(),
      emptyStateHtml('i-home', 'No notes yet', 'Tap + to start writing something.')
    );
  }

  function renderFavorites() {
    renderFlat(
      el.favoritesList,
      NotesStore.favorites(),
      emptyStateHtml('i-star', 'No favorite notes yet', 'Save important notes here for quick access.')
    );
  }

  function renderSearch() {
    const query = el.searchInput.value;
    el.searchClear.hidden = !query;

    if (!query.trim()) {
      el.searchList.innerHTML = emptyStateHtml(
        'i-search', 'Search your notes', 'Find notes by title, content, or category.'
      );
      return;
    }

    const results = Search.run(query, NotesStore.notes);

    if (!results.length) {
      el.searchList.innerHTML = emptyStateHtml(
        'i-search', 'No notes found', 'Try a different word or check the spelling.'
      );
      return;
    }

    renderFlat(el.searchList, results, '');
  }

  function renderCategoriesCard() {
    const cats = Settings.getCategories();
    const counts = NotesStore.countsByCategory();

    let html = '';
    for (let i = 0; i < cats.length; i++) {
      const c = cats[i];
      if (i > 0) html += '<div class="row-sep"></div>';
      html += (
        '<div class="cat-row">' +
          '<span class="cat-row-icon" aria-hidden="true">' +
            '<svg class="ico"><use href="#' + escapeHtml(c.icon) + '"/></svg>' +
          '</span>' +
          '<span class="cat-row-name">' + escapeHtml(c.name) + '</span>' +
          '<span class="cat-row-count">' + (counts[c.id] || 0) + '</span>' +
        '</div>'
      );
    }
    el.categoriesCard.innerHTML = html;
  }

  function renderStorageNote() {
    const n = NotesStore.notes.length;
    el.storageNote.textContent =
      n + (n === 1 ? ' note stored on this device' : ' notes stored on this device');
  }

  function renderAll() {
    renderHome();
    renderFavorites();
    renderSearch();
    renderCategoriesCard();
    renderStorageNote();
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
    el.fab.classList.toggle('is-hidden', name === 'more');
    if (name === 'more') renderCategoriesCard();
  }

  /* ==========================================================
     Swipe gestures
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
    el.dialogMsg.textContent = opts.message || '';
    el.dialogConfirm.textContent = opts.confirmLabel || 'Confirm';
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

  /* ==========================================================
     Action sheet
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

    const cats = Settings.getCategories();
    let html = '';
    html += sheetBtn('pin', note.pinned ? 'Unpin note' : 'Pin to top', 'i-pin', false);
    html += sheetBtn('fav', note.favorite ? 'Remove from favorites' : 'Add to favorites', 'i-star', false);

    for (const c of cats) {
      const checked = c.id === note.category;
      html += (
        '<button type="button" class="sheet-btn" data-sheet="cat" data-cat="' + escapeHtml(c.id) + '" ' +
                'role="menuitemradio" aria-checked="' + (checked ? 'true' : 'false') + '">' +
          '<svg class="ico sheet-cat-icon" aria-hidden="true"><use href="#' + escapeHtml(c.icon) + '"/></svg>' +
          '<span style="flex:1">' + escapeHtml(c.name) + '</span>' +
          (checked
            ? '<svg class="ico ico-18" viewBox="0 0 24 24" style="color:var(--accent)"><use href="#i-check"/></svg>'
            : '') +
        '</button>'
      );
    }

    html += sheetBtn('delete', 'Delete note', 'i-trash', true);
    el.sheetActions.innerHTML = html;
    el.sheetBackdrop.hidden = false;
    pushOverlayHistory('sheet');
  }

  function closeSheet() {
    el.sheetBackdrop.hidden = true;
    state.sheetNoteId = null;
  }

  /* ==========================================================
     Editor
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

      // New note → cursor starts in the title so you can type it first.
      // Existing note that just entered edit mode → cursor in the content.
      if (state.editor.isNew) {
        el.editorTitle.focus({ preventScroll: true });
      } else {
        el.editorContent.focus({ preventScroll: true });
      }
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
    el.fab.classList.toggle('is-hidden', state.view === 'more');
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
      onConfirm: async () => {
        await NotesStore.remove(id);
        state.editor = null;
        el.editor.hidden = true;
        el.fab.classList.toggle('is-hidden', state.view === 'more');
        renderAll();
        showToast('Note deleted', 'Undo', async () => {
          await NotesStore.upsert(snapshot);
          renderAll();
        });
      }
    });
  }

  /* ==========================================================
     Android / browser back button
     ========================================================== */

  const overlayStack = [];

  function pushOverlayHistory(kind) {
    overlayStack.push(kind);
    try { history.pushState({ noter: kind, depth: overlayStack.length }, ''); } catch (e) {}
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

    if (state.editor) { closeEditor(); return true; }
    if (!el.dialogBackdrop.hidden) { closeConfirm(); return true; }
    if (!el.sheetBackdrop.hidden) { closeSheet(); return true; }

    if (state.view !== 'home') {
      switchView('home');
      try { history.pushState({ noter: 'home' }, ''); } catch (e) {}
      return true;
    }
    return false;
  }

  global.addEventListener('popstate', () => {
    if (popOverlayHistory()) {
      handleBack();
    } else if (state.view !== 'home') {
      switchView('home');
      try { history.replaceState({ noter: 'home' }, ''); } catch (e) {}
    }
  });

  /* ==========================================================
     Backup / export / import
     ========================================================== */

  async function exportBackup() {
    try {
      const payload = {
        app: 'noter', version: 1,
        exportedAt: new Date().toISOString(),
        notes: NotesStore.sorted(),
        settings: Settings.snapshot()
      };

      const json = JSON.stringify(payload, null, 2);
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = 'noter-backup-' + stamp + '.json';
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
      showToast('Backup exported (' + payload.notes.length + ' notes)');
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
     Theme UI
     ========================================================== */

  function syncThemeUI() {
    const current = Settings.getTheme();
    const segs = $$('.seg', el.themeSegmented);
    for (const seg of segs) {
      seg.setAttribute('aria-checked', seg.dataset.themeOpt === current ? 'true' : 'false');
    }
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

  function wireEvents() {
    el.tabbar.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      const name = tab.dataset.tab;
      if (!name || name === state.view) return;
      switchView(name);
      try { history.pushState({ noter: 'view', view: name }, ''); } catch (err) {}
    });

    el.fab.addEventListener('click', () => openEditor(null));

    for (const list of [el.homeList, el.favoritesList, el.searchList]) {
      list.addEventListener('click', handleListClick);
      list.addEventListener('keydown', handleListKeydown);
      list.addEventListener('pointerdown', onPointerDown, { passive: true });
      list.addEventListener('pointermove', onPointerMove, { passive: false });
      list.addEventListener('pointerup', onPointerUp);
      list.addEventListener('pointercancel', onPointerUp);
      list.addEventListener('scroll', () => { if (drag) resetDrag(); }, { passive: true });
    }

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

    const searchView = $('#view-search');
    searchView.addEventListener('scroll', () => {
      el.searchHeader.classList.toggle('is-scrolled', searchView.scrollTop > 2);
    }, { passive: true });

    el.editorBack.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (overlayStack[overlayStack.length - 1] === 'editor') {
          overlayStack.pop();
          history.replaceState({ noter: 'view' }, '');
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

    el.sheetCancel.addEventListener('click', () => {
      if (overlayStack[overlayStack.length - 1] === 'sheet') history.back();
      else closeSheet();
    });

    el.sheetBackdrop.addEventListener('click', (e) => {
      if (e.target === el.sheetBackdrop) el.sheetCancel.click();
    });

    el.sheetActions.addEventListener('click', async (e) => {
      const btn = e.target.closest('.sheet-btn');
      if (!btn) return;
      const action = btn.dataset.sheet;
      const id = state.sheetNoteId;
      if (!id) return;

      if (action === 'cat') {
        await setCategory(id, btn.dataset.cat);
        closeSheet();
        return;
      }

      closeSheet();
      if (action === 'pin') await togglePin(id);
      else if (action === 'fav') await toggleFavorite(id);
      else if (action === 'delete') deleteNote(id);
    });

    el.dialogCancel.addEventListener('click', () => {
      if (overlayStack[overlayStack.length - 1] === 'dialog') history.back();
      else closeConfirm();
    });

    el.dialogConfirm.addEventListener('click', runDialogAction);

    el.dialogBackdrop.addEventListener('click', (e) => {
      if (e.target === el.dialogBackdrop) el.dialogCancel.click();
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

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && state.toastActionFn) {
        e.preventDefault();
        const fn = state.toastActionFn;
        hideToast();
        fn();
      }
    });
  }

  /* ==========================================================
     Boot
     ========================================================== */

  async function boot() {
    Settings.applyTheme();
    syncThemeUI();
    updateGreeting();
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

    try {
      history.replaceState({ noter: 'home' }, '');
      history.pushState({ noter: 'home' }, '');
    } catch (e) {}

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !state.editor) {
        updateGreeting();
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
