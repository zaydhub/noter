/* ============================================================
   Noter — notes store
   ============================================================ */
(function (global) {
  'use strict';

  const listeners = new Set();

  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'n-' + Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2, 10) +
           Math.random().toString(36).slice(2, 6);
  }

  function normalize(raw) {
    const now = Date.now();
    const n = raw && typeof raw === 'object' ? raw : {};
    return {
      id: typeof n.id === 'string' && n.id ? n.id : uuid(),
      title: typeof n.title === 'string' ? n.title : '',
      content: typeof n.content === 'string' ? n.content : '',
      category: typeof n.category === 'string' && n.category ? n.category : 'other',
      createdAt: Number.isFinite(n.createdAt) ? n.createdAt : now,
      updatedAt: Number.isFinite(n.updatedAt) ? n.updatedAt : now,
      pinned: n.pinned === true,
      favorite: n.favorite === true
    };
  }

  const NotesStore = {
    notes: [],
    ready: false,

    async init() {
      const raw = await DB.all();
      this.notes = raw.map(normalize);
      this.ready = true;
      return this.notes;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    emit() {
      listeners.forEach((fn) => {
        try { fn(this.notes); } catch (e) { /* keep others alive */ }
      });
    },

    get(id) {
      return this.notes.find((n) => n.id === id) || null;
    },

    async upsert(note) {
      const normalized = normalize(note);
      const index = this.notes.findIndex((n) => n.id === normalized.id);
      if (index === -1) this.notes.push(normalized);
      else this.notes[index] = normalized;
      await DB.put(normalized);
      return normalized;
    },

    createDraft(categoryId) {
      const now = Date.now();
      return {
        id: uuid(),
        title: '',
        content: '',
        category: categoryId || 'thought',
        createdAt: now,
        updatedAt: now,
        pinned: false,
        favorite: false
      };
    },

    async remove(id) {
      const index = this.notes.findIndex((n) => n.id === id);
      if (index === -1) return null;
      const [removed] = this.notes.splice(index, 1);
      await DB.remove(id);
      return removed;
    },

    async removeMany(ids) {
      const set = new Set(ids);
      const removed = this.notes.filter((n) => set.has(n.id));
      this.notes = this.notes.filter((n) => !set.has(n.id));
      for (const n of removed) await DB.remove(n.id);
      return removed;
    },

    isBlank(note) {
      return !note || (!note.title.trim() && !note.content.trim());
    },

    sorted(list) {
      const source = list || this.notes;
      return source.slice().sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    },

    favorites() {
      return this.sorted(this.notes.filter((n) => n.favorite));
    },

    byCategory(categoryId) {
      return this.sorted(this.notes.filter((n) => n.category === categoryId));
    },

    countsByCategory() {
      const map = Object.create(null);
      for (const n of this.notes) {
        map[n.category] = (map[n.category] || 0) + 1;
      }
      return map;
    },

    /** Moves every note in one category to another. Returns count moved. */
    async reassignCategory(fromId, toId) {
      if (!fromId || !toId || fromId === toId) return 0;
      const affected = this.notes.filter((n) => n.category === fromId);
      if (!affected.length) return 0;
      const now = Date.now();
      for (const n of affected) {
        n.category = toId;
        n.updatedAt = now;
      }
      await DB.putMany(affected);
      return affected.length;
    },

    displayTitle(note) {
      const t = (note.title || '').trim();
      if (t) return t;
      const firstLine = (note.content || '')
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0);
      return firstLine || '';
    },

    async merge(incoming) {
      const byId = new Map(this.notes.map((n) => [n.id, n]));
      const toWrite = [];
      let added = 0;
      let updated = 0;
      let skipped = 0;

      for (const raw of incoming) {
        const note = normalize(raw);
        const existing = byId.get(note.id);
        if (!existing) { toWrite.push(note); added++; continue; }
        if (note.updatedAt > existing.updatedAt) { toWrite.push(note); updated++; }
        else { skipped++; }
      }

      if (toWrite.length) {
        await DB.putMany(toWrite);
        for (const n of toWrite) {
          const i = this.notes.findIndex((x) => x.id === n.id);
          if (i === -1) this.notes.push(n);
          else this.notes[i] = n;
        }
      }

      return { added, updated, skipped, total: incoming.length };
    },

    uuid
  };

  global.NotesStore = NotesStore;
})(window);
