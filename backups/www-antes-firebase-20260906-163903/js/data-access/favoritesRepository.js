import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';

function makeId(bookIndex, chapterIndex, verseIndex) {
  return `${bookIndex}-${chapterIndex}-${verseIndex}`;
}

function readAll() {
  const saved = getItem(STORAGE_KEYS.favorites, []);
  return Array.isArray(saved) ? saved : [];
}

function writeAll(items) {
  setItem(STORAGE_KEYS.favorites, items);
}

function createEntry(info) {
  const now = new Date().toISOString();

  return {
    id: makeId(info.bookIndex, info.chapterIndex, info.verseIndex),
    bookIndex: info.bookIndex,
    bookName: info.bookName,
    chapterIndex: info.chapterIndex,
    verseIndex: info.verseIndex,
    reference: `${info.bookName} ${info.chapterIndex + 1}:${info.verseIndex + 1}`,
    text: info.verseText,
    favorite: false,
    note: '',
    createdAt: now,
    updatedAt: now,
  };
}

export const favoritesRepository = {

  getAll() {
    return readAll();
  },

  getFavorites() {
    return readAll().filter(item => item.favorite === true);
  },

  getNotes() {
    return readAll().filter(
      item => typeof item.note === 'string' && item.note.trim().length > 0
    );
  },

  get(bookIndex, chapterIndex, verseIndex) {
    const id = makeId(bookIndex, chapterIndex, verseIndex);
    return readAll().find(item => item.id === id) || null;
  },

  isFavorite(bookIndex, chapterIndex, verseIndex) {
    const item = this.get(bookIndex, chapterIndex, verseIndex);
    return !!item?.favorite;
  },

  toggleFavorite(info) {
    const items = readAll();
    const id = makeId(info.bookIndex, info.chapterIndex, info.verseIndex);

    let item = items.find(entry => entry.id === id);

    if (!item) {
      item = createEntry(info);
      item.favorite = true;
      items.push(item);
    } else {
      item.favorite = !item.favorite;
      item.updatedAt = new Date().toISOString();
    }

    const index = items.findIndex(entry => entry.id === id);
    items[index] = item;

    // Se não é favorito e também não possui anotação,
    // não precisamos manter o registro.
    if (!item.favorite && !item.note.trim()) {
      items.splice(index, 1);
    }

    writeAll(items);

    return item.favorite;
  },

  saveNote(info, note) {
    const items = readAll();
    const id = makeId(info.bookIndex, info.chapterIndex, info.verseIndex);

    let item = items.find(entry => entry.id === id);

    if (!item) {
      item = createEntry(info);
      items.push(item);
    }

    item.note = String(note || '').trim();
    item.updatedAt = new Date().toISOString();

    const index = items.findIndex(entry => entry.id === id);
    items[index] = item;

    if (!item.favorite && !item.note) {
      items.splice(index, 1);
    }

    writeAll(items);

    return item;
  },

  removeFavorite(bookIndex, chapterIndex, verseIndex) {
    const items = readAll();
    const id = makeId(bookIndex, chapterIndex, verseIndex);

    const item = items.find(entry => entry.id === id);

    if (!item) return;

    if (item.note && item.note.trim()) {
      item.favorite = false;
      item.updatedAt = new Date().toISOString();
      writeAll(items);
      return;
    }

    writeAll(items.filter(entry => entry.id !== id));
  },

  removeNote(bookIndex, chapterIndex, verseIndex) {
    const items = readAll();
    const id = makeId(bookIndex, chapterIndex, verseIndex);

    const item = items.find(entry => entry.id === id);

    if (!item) return;

    item.note = '';
    item.updatedAt = new Date().toISOString();

    if (!item.favorite) {
      writeAll(items.filter(entry => entry.id !== id));
    } else {
      writeAll(items);
    }
  },
};
