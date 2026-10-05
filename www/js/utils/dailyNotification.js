// Lembrete diário, agendado apenas dentro do app instalado (Android).
// No navegador (GitHub Pages) isso não faz nada — não existe suporte a
// notificações locais agendadas fora de um app nativo.
//
// Em vez de um alarme que se repete todo dia, o app agenda uma fila com os
// próximos dias e a refaz quando você abre o app, lê algo ou muda o horário.
// Assim o lembrete de hoje some quando você já leu.
import { getItem, setItem, STORAGE_KEYS } from './storage.js';
import { statsRepository } from '../data-access/statsRepository.js';
import { verseForDate, refShort } from './verseOfDay.js';

const NOTIFICATION_ID_ANTIGO = 1001; // alarme repetido das versões anteriores
const ID_BASE = 2000;
const DIAS_NA_FILA = 30;
const HORA_PADRAO = 8;
const CONFIG_KEY = 'biblia:daily-notification-config';
const TITULO = '📖 Bíblia de Estudo';
const CORPO = 'Seu momento com a Palavra te espera hoje. Toque para continuar sua leitura.';

function plugin() {
  const capacitor = typeof window !== 'undefined' ? window.Capacitor : null;
  const nativo = !!(
    capacitor &&
    typeof capacitor.isNativePlatform === 'function' &&
    capacitor.isNativePlatform()
  );
  return nativo ? capacitor?.Plugins?.LocalNotifications || null : null;
}

export function getDailyNotificationConfig() {
  return { enabled: true, hour: HORA_PADRAO, minute: 0, ...getItem(CONFIG_KEY, {}) };
}

let emAndamento = false;
let pendente = false;
let ultimaExecucao = 0;

async function reagendarLembretes() {
  const ln = plugin();
  if (!ln) return false;
  if (emAndamento) {
    pendente = true;
    return true;
  }
  emAndamento = true;
  try {
    const config = getDailyNotificationConfig();
    const ids = [NOTIFICATION_ID_ANTIGO];
    for (let i = 0; i < DIAS_NA_FILA; i++) ids.push(ID_BASE + i);
    await ln.cancel({ notifications: ids.map((id) => ({ id })) });
    if (!config.enabled) return true;

    let permissao = await ln.checkPermissions();
    if (permissao.display !== 'granted') {
      permissao = await ln.requestPermissions();
      if (permissao.display !== 'granted') return false;
    }

    const lidoHoje = statsRepository.hasReadToday();
    const agora = new Date();
    const fila = [];
    for (let i = 0; i < DIAS_NA_FILA; i++) {
      const quando = new Date(
        agora.getFullYear(), agora.getMonth(), agora.getDate() + i,
        config.hour, config.minute, 0, 0,
      );
      if (i === 0 && (lidoHoje || quando.getTime() <= agora.getTime() + 30000)) continue;
      const v = verseForDate(quando);
      fila.push({
        id: ID_BASE + i,
        title: '📖 ' + refShort(v.ref),
        body: v.text,
        largeBody: v.text,
        schedule: { at: quando, allowWhileIdle: true },
      });
    }
    if (fila.length > 0) await ln.schedule({ notifications: fila });
    setItem(STORAGE_KEYS.dailyNotification, true);
    return true;
  } catch (err) {
    console.warn('[dailyNotification] não foi possível agendar:', err);
    return false;
  } finally {
    emAndamento = false;
    ultimaExecucao = Date.now();
    if (pendente) {
      pendente = false;
      reagendarLembretes();
    }
  }
}

export async function initDailyNotification() {
  await reagendarLembretes();
}

export async function applyDailyNotification(partial) {
  const config = { ...getDailyNotificationConfig(), ...partial };
  setItem(CONFIG_KEY, config);
  return await reagendarLembretes();
}

if (typeof window !== 'undefined') {
  window.addEventListener('biblia:leitura-do-dia', () => {
    reagendarLembretes();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - ultimaExecucao > 60000) {
      reagendarLembretes();
    }
  });
}
