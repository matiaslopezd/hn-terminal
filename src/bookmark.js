export const DB_NAME = 'hn_hacker_db';
export const DB_VERSION = 1;
export const STORE_NAME = 'bookmarks';

class BookmarkManager {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = (event) => reject(event.target.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = (event) => { this.db = event.target.result; resolve(this.db); };
    });
  }
  async addBookmark(story) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record = { ...story, savedAt: Date.now(), deadline: Date.now() + (3 * 24 * 60 * 60 * 1000), read: false };
      store.put(record).onsuccess = () => resolve(record);
    });
  }
  async removeBookmark(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id).onsuccess = () => resolve(id);
    });
  }
  async toggleReadStatus(id, status) {
    await this.initPromise;
    const item = await this.getBookmark(id);
    if (!item) return;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      item.read = status;
      transaction.objectStore(STORE_NAME).put(item).onsuccess = () => resolve(item);
    });
  }
  async getBookmark(id) {
    await this.initPromise;
    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      transaction.objectStore(STORE_NAME).get(id).onsuccess = (e) => resolve(e.target.result);
    });
  }
  async getAllBookmarks() {
    await this.initPromise;
    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      transaction.objectStore(STORE_NAME).getAll().onsuccess = (e) => resolve(e.target.result);
    });
  }
}

export default BookmarkManager;