// Repositório local de progresso, histórico, favoritos, anotações e estatísticas.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';

const DEFAULT_PROGRESS = { book: 0, chapter: 0, verse: 0 };
const DEFAULT_STATS = { versesRead: 0, chaptersRead: 0, audioSeconds: 0, prayers: 0, quizCorrect: 0, lastReadAt: null, days: [] };

function normalizeProgress(value) {
  if (!value || typeof value.book !== 'number' || typeof value.chapter !== 'number') return { ...DEFAULT_PROGRESS };
  return { book: value.book, chapter: value.chapter, verse: typeof value.verse === 'number' ? value.verse : 0 };
}

export const LocalStorageProgressRepository = {
  async getProgress() { return normalizeProgress(getItem(STORAGE_KEYS.bibleProgress, DEFAULT_PROGRESS)); },
  async saveProgress(progress) {
    setItem(STORAGE_KEYS.bibleProgress, normalizeProgress(progress));
  },

  async markVerseRead({ book, chapter, verse }) {
    const key = `${book}:${chapter}:${verse}`;
    const history = getItem(STORAGE_KEYS.readHistory, {});
    if (!history[key]) history[key] = { book, chapter, verse, firstReadAt: Date.now(), reads: 0 };
    history[key].reads += 1;
    history[key].lastReadAt = Date.now();
    setItem(STORAGE_KEYS.readHistory, history);

    const stats = getItem(STORAGE_KEYS.stats, DEFAULT_STATS) || { ...DEFAULT_STATS };
    stats.versesRead = Object.keys(history).length;
    stats.lastReadAt = Date.now();
    const day = new Date().toISOString().slice(0, 10);
    stats.days = Array.isArray(stats.days) ? [...new Set([...stats.days, day])] : [day];
    setItem(STORAGE_KEYS.stats, stats);
  },

  async markChapterRead({ book, chapter }) {
    const chapters = getItem(STORAGE_KEYS.completedChapters, {});
    const key = `${book}:${chapter}`;
    if (!chapters[key]) chapters[key] = Date.now();
    setItem(STORAGE_KEYS.completedChapters, chapters);
    const stats = getItem(STORAGE_KEYS.stats, DEFAULT_STATS) || { ...DEFAULT_STATS };
    stats.chaptersRead = Object.keys(chapters).length;
    setItem(STORAGE_KEYS.stats, stats);
  },

  async getStats() {
    const stats = getItem(STORAGE_KEYS.stats, DEFAULT_STATS) || { ...DEFAULT_STATS };
    const history = getItem(STORAGE_KEYS.readHistory, {});
    const chapters = getItem(STORAGE_KEYS.completedChapters, {});
    return { ...DEFAULT_STATS, ...stats, versesRead: Object.keys(history).length, chaptersRead: Object.keys(chapters).length };
  },

  async getHistory() { return getItem(STORAGE_KEYS.readHistory, {}); },

  async toggleFavorite(ref, data = {}) {
    const favorites = getItem(STORAGE_KEYS.favorites, {});
    if (favorites[ref]) { delete favorites[ref]; setItem(STORAGE_KEYS.favorites, favorites); return false; }
    favorites[ref] = { ...data, ref, createdAt: Date.now() };
    setItem(STORAGE_KEYS.favorites, favorites);
    return true;
  },

  async isFavorite(ref) { return Boolean(getItem(STORAGE_KEYS.favorites, {})[ref]); },
  async getFavorites() { return getItem(STORAGE_KEYS.favorites, {}); },

  async saveNote(ref, note) {
    const notes = getItem(STORAGE_KEYS.notes, {});
    if (String(note || '').trim()) notes[ref] = { text: String(note).trim(), updatedAt: Date.now() };
    else delete notes[ref];
    setItem(STORAGE_KEYS.notes, notes);
  },
  async getNote(ref) { return getItem(STORAGE_KEYS.notes, {})[ref]?.text || ''; },
};

export const progressRepository = LocalStorageProgressRepository;
