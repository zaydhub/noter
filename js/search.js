/* ============================================================
   Noter — search
   Simple, allocation-light substring matching across title,
   content, and category. Fast enough for thousands of notes.
   ============================================================ */
(function (global) {
  'use strict';

  function normalize(str) {
    return (str || '').toLowerCase();
  }

  const Search = {
    /**
     * @param {string} query
     * @param {Array}  notes
     * @returns {Array} matching notes, pinned-first then newest
     */
    run(query, notes) {
      const term = normalize(query).trim();
      if (!term) return [];

      const tokens = term.split(/\s+/).filter(Boolean);
      if (!tokens.length) return [];

      const categories = Settings.getCategories();
      const catName = new Map(categories.map((c) => [c.id, normalize(c.name)]));

      const matches = [];

      for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        const haystack = (
          normalize(n.title) + '\n' +
          normalize(n.content) + '\n' +
          (catName.get(n.category) || '') + '\n' +
          normalize(n.category)
        );

        let ok = true;
        for (let t = 0; t < tokens.length; t++) {
          if (haystack.indexOf(tokens[t]) === -1) { ok = false; break; }
        }
        if (ok) matches.push(n);
      }

      return NotesStore.sorted(matches);
    }
  };

  global.Search = Search;
})(window);
