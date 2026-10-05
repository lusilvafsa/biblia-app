// Versículo do dia: o MESMO para a tela inicial e para o lembrete diário,
// calculado só pela data (dias desde 01/01/1970, no fuso do aparelho).
import { DAILY_VERSES } from '../../data/verses.js';
import { VERSES_EXTRA } from '../../data/versesExtra.js';

export const ALL_VERSES = [...DAILY_VERSES, ...VERSES_EXTRA];

export function verseIndexForDate(date = new Date()) {
  const dias = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return ((dias % ALL_VERSES.length) + ALL_VERSES.length) % ALL_VERSES.length;
}

export function verseForDate(date = new Date()) {
  return ALL_VERSES[verseIndexForDate(date)];
}

export function refShort(ref) {
  return String(ref).replace(/\s*\(ACF\)\s*$/, '');
}
