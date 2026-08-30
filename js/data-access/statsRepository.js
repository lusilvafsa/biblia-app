import { getItem, setItem } from '../utils/storage.js';

const STORAGE_KEY = 'bibliaAppStats';

const DEFAULT_STATS = {
  readVerses: [],
  audioVerses: [],
  prayerCount: 0,
};

function readStats() {
  const saved = getItem(STORAGE_KEY, null);

  if (!saved || typeof saved !== 'object') {
    return { ...DEFAULT_STATS };
  }

  return {
    readVerses: Array.isArray(saved.readVerses)
      ? saved.readVerses
      : [],

    audioVerses: Array.isArray(saved.audioVerses)
      ? saved.audioVerses
      : [],

    prayerCount:
      typeof saved.prayerCount === 'number' && saved.prayerCount >= 0
        ? saved.prayerCount
        : 0,
  };
}

function writeStats(stats) {
  setItem(STORAGE_KEY, stats);
}

function verseId(bookIndex, chapterIndex, verseIndex) {
  return `${bookIndex}-${chapterIndex}-${verseIndex}`;
}

export const statsRepository = {

  getStats() {
    return readStats();
  },

  // =========================
  // VERSÍCULOS LIDOS
  // =========================

  getReadVersesCount() {
    return readStats().readVerses.length;
  },

  markVerseRead(bookIndex, chapterIndex, verseIndex) {
    const stats = readStats();
    const id = verseId(bookIndex, chapterIndex, verseIndex);

    if (!stats.readVerses.includes(id)) {
      stats.readVerses.push(id);
      writeStats(stats);
    }

    return stats.readVerses.length;
  },

  // =========================
  // VERSÍCULOS NARRADOS
  // =========================

  getAudioVersesCount() {
    return readStats().audioVerses.length;
  },

  markAudioVerse(bookIndex, chapterIndex, verseIndex) {
    const stats = readStats();
    const id = verseId(bookIndex, chapterIndex, verseIndex);

    if (!stats.audioVerses.includes(id)) {
      stats.audioVerses.push(id);
      writeStats(stats);
    }

    return stats.audioVerses.length;
  },

  // =========================
  // ORAÇÕES
  // =========================

  incrementPrayerCount() {
    const stats = readStats();

    stats.prayerCount += 1;

    writeStats(stats);

    return stats.prayerCount;
  },

  getPrayerCount() {
    return readStats().prayerCount;
  },
};
