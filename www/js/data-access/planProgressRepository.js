// Progresso dos planos de leitura. Funciona sem login (salvo só no
// aparelho); quando o usuário entra na conta, sincroniza com o Supabase e
// mescla com o que já existia na nuvem.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';
import { supabase } from '../supabaseClient.js';
import { usuarioAtual } from '../supabaseAuth.js';
import { getReadingPlan } from '../../data/readingPlans.js';

function getUser() {
  return usuarioAtual();
}

function getStorageKey(user = getUser()) {
  return user
    ? `${STORAGE_KEYS.readingPlans}:${user.id}`
    : STORAGE_KEYS.readingPlans;
}

function getScopedStorageKey(baseKey, user = getUser()) {
  return user ? `${baseKey}:${user.id}` : baseKey;
}

function readAll(user = getUser()) {
  return getItem(getStorageKey(user), {});
}

function writeAll(data, user = getUser()) {
  setItem(getStorageKey(user), data);
}

function syncPlan(planId, diasConcluidos, user = getUser()) {
  if (!user) return;

  void supabase
    .from('user_plan_progress')
    .upsert(
      {
        user_id: user.id,
        plan_id: planId,
        dias_concluidos: diasConcluidos,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,plan_id' }
    )
    .then(({ error }) => {
      if (error) console.error('[Supabase] Erro ao enviar progresso do plano:', error);
    });
}

export const planProgressRepository = {
  async syncWithCloud(user = getUser()) {
    if (!user) return {};

    const local = readAll(user);

    try {
      const { data, error } = await supabase
        .from('user_plan_progress')
        .select('plan_id, dias_concluidos')
        .eq('user_id', user.id);

      if (error) throw error;

      const merged = { ...local };
      (data || []).forEach((row) => {
        if (!merged[row.plan_id]) {
          merged[row.plan_id] = { diasConcluidos: row.dias_concluidos || [] };
        } else {
          const uniao = new Set([
            ...(merged[row.plan_id].diasConcluidos || []),
            ...(row.dias_concluidos || []),
          ]);
          merged[row.plan_id] = { diasConcluidos: Array.from(uniao) };
        }
      });

      // Grava no espaço da conta capturada, mesmo se a sessão mudar.
      writeAll(merged, user);

      const rows = Object.entries(merged).map(([planId, info]) => ({
        user_id: user.id,
        plan_id: planId,
        dias_concluidos: info.diasConcluidos || [],
        updated_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error: upsertError } = await supabase
          .from('user_plan_progress')
          .upsert(rows, { onConflict: 'user_id,plan_id' });

        if (upsertError) throw upsertError;
      }

      return merged;
    } catch (e) {
      console.error('[Supabase] Erro ao sincronizar progresso dos planos:', e);
      return readAll(user);
    }
  },

  markStarted(planId) {
    const user = getUser();
    const lista = getItem(getScopedStorageKey('biblia:plans-started', user), []);
    if (!lista.includes(planId)) {
      lista.push(planId);
      setItem(getScopedStorageKey('biblia:plans-started', user), lista);
    }
  },

  markChapterRead(bookIndex, chapterIndex) {
    const user = getUser();
    const iniciados = getItem(getScopedStorageKey('biblia:plans-started', user), []);
    if (!iniciados.length) return;
    const parcial = getItem(getScopedStorageKey('biblia:plans-partial', user), {});
    const chave = bookIndex + ':' + chapterIndex;
    let mudou = false;
    iniciados.forEach((planId) => {
      const plan = getReadingPlan(planId);
      if (!plan) return;
      plan.dias.forEach((dia) => {
        if (!dia.caps || this.isDayDone(planId, dia.dia)) return;
        if (!dia.caps.some((c) => c[0] === bookIndex && c[1] === chapterIndex)) return;
        const k = planId + '#' + dia.dia;
        const lidos = parcial[k] || [];
        if (!lidos.includes(chave)) lidos.push(chave);
        parcial[k] = lidos;
        mudou = true;
        if (dia.caps.every((c) => lidos.includes(c[0] + ':' + c[1]))) {
          this.toggleDay(planId, dia.dia);
          delete parcial[k];
        }
      });
    });
    if (mudou) setItem(getScopedStorageKey('biblia:plans-partial', user), parcial);
  },

  exportAll() {
    return readAll();
  },

  async importPlans(incoming) {
    const user = getUser();
    if (!user) return { ok: false, adicionados: 0, planos: 0 };
    const all = { ...readAll(user) };
    let adicionados = 0;
    let planos = 0;
    for (const [planId, valor] of Object.entries(incoming)) {
      const atuais = all[planId]?.diasConcluidos || [];
      const uniao = [...new Set([...atuais, ...valor.diasConcluidos])].sort((a, b) => a - b);
      const novos = uniao.length - atuais.length;
      if (novos > 0) {
        all[planId] = { diasConcluidos: uniao };
        adicionados += novos;
        planos++;
      }
    }
    if (adicionados > 0) writeAll(all, user);
    await this.syncWithCloud(user);
    return { ok: true, adicionados, planos };
  },

  getDoneDays(planId) {
    const all = readAll();
    return all[planId]?.diasConcluidos || [];
  },
  isDayDone(planId, dia) {
    return this.getDoneDays(planId).includes(dia);
  },
  toggleDay(planId, dia) {
    const user = getUser();
    const all = readAll(user);
    const current = all[planId]?.diasConcluidos || [];
    const isDone = current.includes(dia);
    const updated = isDone ? current.filter((d) => d !== dia) : [...current, dia];
    all[planId] = { diasConcluidos: updated };
    writeAll(all, user);
    syncPlan(planId, updated, user);
    return !isDone;
  },
};
