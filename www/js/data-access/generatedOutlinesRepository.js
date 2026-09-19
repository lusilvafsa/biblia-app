// Esboços de ministração gerados pelo Assistente Bíblico, guardados
// localmente para não precisar gastar o limite diário de IA repetindo o
// mesmo tema. Chave: o nome do tema já normalizado (sem acento, minúsculo).
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';

function readAll() {
  return getItem(STORAGE_KEYS.generatedOutlines, {});
}

function writeAll(data) {
  setItem(STORAGE_KEYS.generatedOutlines, data);
}

export const generatedOutlinesRepository = {
  get(chaveNormalizada) {
    return readAll()[chaveNormalizada] || null;
  },
  save(chaveNormalizada, tema, mensagem) {
    const all = readAll();
    all[chaveNormalizada] = { tema, mensagem };
    writeAll(all);
  },
  getAll() {
    return readAll();
  },
};
