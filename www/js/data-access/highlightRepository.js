// Grifos de versículos por cor temática, salvos localmente no aparelho.
// Não exige login, igual ao progresso dos planos de leitura.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';

export const HIGHLIGHT_COLORS = [
  { id: 'amarelo', label: 'Promessa', hex: '#f2c94c' },
  { id: 'azul', label: 'Ensino', hex: '#56ccf2' },
  { id: 'verde', label: 'Crescimento', hex: '#6fcf97' },
  { id: 'rosa', label: 'Advertência', hex: '#eb5757' },
];

function makeKey(bookIndex, chapterIndex, verseIndex) {
  return `${bookIndex}-${chapterIndex}-${verseIndex}`;
}

function readAll() {
  return getItem(STORAGE_KEYS.highlights, {});
}

function writeAll(data) {
  setItem(STORAGE_KEYS.highlights, data);
}

export const highlightRepository = {
  getAll() {
    return readAll();
  },
  get(bookIndex, chapterIndex, verseIndex) {
    const all = readAll();
    return all[makeKey(bookIndex, chapterIndex, verseIndex)] || null;
  },
  set(bookIndex, chapterIndex, verseIndex, colorId) {
    const all = readAll();
    all[makeKey(bookIndex, chapterIndex, verseIndex)] = colorId;
    writeAll(all);
  },
  remove(bookIndex, chapterIndex, verseIndex) {
    const all = readAll();
    delete all[makeKey(bookIndex, chapterIndex, verseIndex)];
    writeAll(all);
  },
};
