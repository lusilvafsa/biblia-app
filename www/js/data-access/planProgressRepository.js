// Progresso dos planos de leitura, salvo localmente no aparelho.
// Diferente do progressRepository (leitura contínua da Bíblia), aqui não
// exigimos login: qualquer pessoa pode começar um plano imediatamente.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';

function readAll() {
  return getItem(STORAGE_KEYS.readingPlans, {});
}

function writeAll(data) {
  setItem(STORAGE_KEYS.readingPlans, data);
}

export const planProgressRepository = {
  getDoneDays(planId) {
    const all = readAll();
    return all[planId]?.diasConcluidos || [];
  },

  isDayDone(planId, dia) {
    return this.getDoneDays(planId).includes(dia);
  },

  toggleDay(planId, dia) {
    const all = readAll();
    const current = all[planId]?.diasConcluidos || [];
    const isDone = current.includes(dia);

    const updated = isDone
      ? current.filter((d) => d !== dia)
      : [...current, dia];

    all[planId] = { diasConcluidos: updated };
    writeAll(all);

    return !isDone;
  },
};
