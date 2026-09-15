// Estado da versão da Bíblia selecionada (ACF, Bíblia Livre, ARC 1911...),
// centralizado e persistido. js/data-access/bibleRepository.js lê o valor
// atual para saber qual arquivo de dados carregar.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';
import { DEFAULT_BIBLE_VERSION, getVersionMeta } from '../../data/bibleVersions.js';

const listeners = new Set();
let currentVersion = getItem(STORAGE_KEYS.bibleVersion, DEFAULT_BIBLE_VERSION);

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
