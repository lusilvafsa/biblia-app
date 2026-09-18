import { getItem, setItem } from '../utils/storage.js';

const STORAGE_KEY = 'bibliaAppStats';

const DEFAULT_STATS = {
  readVerses: [],
  audioVerses: [],
  prayerCount: 0,
  readDays: [],
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

    readDays: Array.isArray(saved.readDays) ? saved.readDays : [],
  };
}

function writeStats(stats) {
  setItem(STORAGE_KEY, stats);
}

function verseId(bookIndex, chapterIndex, verseIndex) {
  return `${bookIndex}-${chapterIndex}-${verseIndex}`;
}

function hojeISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
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

  // =========================
  // SEQUÊNCIA DE DIAS LENDO
  // =========================

  /** Registra que houve leitura hoje. Chamado ao abrir um capítulo. */
  registerActivityToday() {
    const stats = readStats();
    const hoje = hojeISO();

    if (!stats.readDays.includes(hoje)) {
      stats.readDays.push(hoje);
      writeStats(stats);
    }
  },

  /** Sequência atual de dias consecutivos com leitura, contando hoje ou
   * ontem como ponto de partida (a sequência só "quebra" depois de um dia
   * inteiro sem nenhuma leitura). */
  getStreak() {
    const dias = new Set(readStats().readDays);
    if (dias.size === 0) return 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const isoHoje = hoje.toISOString().slice(0, 10);

    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const isoOntem = ontem.toISOString().slice(0, 10);

    if (!dias.has(isoHoje) && !dias.has(isoOntem)) return 0;

    let contagem = 0;
    const cursor = dias.has(isoHoje) ? new Date(hoje) : new Date(ontem);

    while (dias.has(cursor.toISOString().slice(0, 10))) {
      contagem++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return contagem;
  },
};
