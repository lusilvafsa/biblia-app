// Progresso dos planos de leitura. Funciona sem login (salvo só no
// aparelho); quando o usuário entra na conta, sincroniza com o Supabase e
// mescla com o que já existia na nuvem.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';
import { supabase } from '../supabaseClient.js';
import { usuarioAtual } from '../supabaseAuth.js';

function getUser() {
  return usuarioAtual();
}

function getStorageKey() {
  const user = getUser();
  return user ? `${STORAGE_KEYS.readingPlans}:${user.id}` : STORAGE_KEYS.readingPlans;
}

function migrateAnonymousProgress() {
  const user = getUser();
  if (!user) return;

  const userKey = `${STORAGE_KEYS.readingPlans}:${user.id}`;
  const already = getItem(userKey, null);
  if (already) return;

  const anonimo = getItem(STORAGE_KEYS.readingPlans, {});
  setItem(userKey, anonimo);
}

function readAll() {
  migrateAnonymousProgress();
  return getItem(getStorageKey(), {});
}

function writeAll(data) {
  setItem(getStorageKey(), data);
}

function syncPlan(planId, diasConcluidos) {
  const user = getUser();
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
  async syncWithCloud() {
    const user = getUser();
    if (!user) return {};

    const local = readAll();

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

      writeAll(merged);

      const rows = Object.entries(merged).map(([planId, info]) => ({
        user_id: user.id,
        plan_id: planId,
        dias_concluidos: info.diasConcluidos || [],
        updated_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        await supabase.from('user_plan_progress').upsert(rows, { onConflict: 'user_id,plan_id' });
      }

      return merged;
    } catch (e) {
      console.error('[Supabase] Erro ao sincronizar progresso dos planos:', e);
      return local;
    }
  },

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
    const updated = isDone ? current.filter((d) => d !== dia) : [...current, dia];
    all[planId] = { diasConcluidos: updated };
    writeAll(all);
    syncPlan(planId, updated);
    return !isDone;
  },
};
