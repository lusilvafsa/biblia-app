// Estado da versão da Bíblia selecionada, centralizado e persistido.
// O bibleRepository.js lê o valor
// atual para saber qual arquivo de dados carregar.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';
import { DEFAULT_BIBLE_VERSION, getVersionMeta } from '../../data/bibleVersions.js';

const listeners = new Set();
let currentVersion = getItem(STORAGE_KEYS.bibleVersion, DEFAULT_BIBLE_VERSION);

// Corrige seleções antigas ou versões que não estão disponíveis.
if (!getVersionMeta(currentVersion).available) {
  currentVersion = DEFAULT_BIBLE_VERSION;
  setItem(STORAGE_KEYS.bibleVersion, currentVersion);
}

export function getBibleVersion() {
  return currentVersion;
}

export function getBibleVersionMeta() {
  return getVersionMeta(currentVersion);
}

export function setBibleVersion(id) {
  const meta = getVersionMeta(id);
  currentVersion = meta.id;
  setItem(STORAGE_KEYS.bibleVersion, currentVersion);
  listeners.forEach((fn) => fn(currentVersion));
}

export function onBibleVersionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
