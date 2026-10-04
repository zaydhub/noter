/* ============================================================
   Noter — IndexedDB layer
   Notes are the only persisted entity. Schema is versioned so
   extra fields can be added later without breaking old notes.
   ============================================================ */
(function (global) {
  'use strict';

  const DB_NAME = 'noter';
  const DB_VERSION = 1;
  const STORE = 'notes';

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      let req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (err) {
        reject(err);
        return;
      }

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };

      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
      req.onblocked = () => reject(new Error('IndexedDB blocked by another tab'));
    });

    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
  }

  function reqProm(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  }

  const DB = {
    open,

    async all() {
      const db = await open();
      const tx = db.transaction(STORE, 'readonly');
      const result = await reqProm(tx.objectStore(STORE).getAll());
      return result || [];
    },

    async get(id) {
      const db = await open();
      const tx = db.transaction(STORE, 'readonly');
      return reqProm(tx.objectStore(STORE).get(id));
    },

    async put(note) {
      const db = await open();
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(note);
      await txDone(tx);
      return note;
    },

    async putMany(notes) {
      if (!notes.length) return;
      const db = await open();
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      for (const n of notes) store.put(n);
      await txDone(tx);
    },

    async remove(id) {
      const db = await open();
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      await txDone(tx);
    },

    async clear() {
      const db = await open();
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      await txDone(tx);
    },

    async count() {
      const db = await open();
      const tx = db.transaction(STORE, 'readonly');
      return reqProm(tx.objectStore(STORE).count());
    }
  };

  global.DB = DB;
})(window);
