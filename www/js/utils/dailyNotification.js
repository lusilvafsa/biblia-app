// Notificação diária, agendada apenas dentro do app instalado (Android).
// No navegador (GitHub Pages) isso não faz nada — não existe suporte a
// notificações locais agendadas fora de um app nativo.
import { getItem, setItem, STORAGE_KEYS } from './storage.js';

const NOTIFICATION_ID = 1001;
const HORA_PADRAO = 8; // 08:00 da manhã

export async function initDailyNotification() {
  const capacitor = typeof window !== 'undefined' ? window.Capacitor : null;
  const isNative = !!(
    capacitor &&
    typeof capacitor.isNativePlatform === 'function' &&
    capacitor.isNativePlatform()
  );

  if (!isNative) return;

  const localNotifications = capacitor?.Plugins?.LocalNotifications || null;
  if (!localNotifications) return;

  const jaAgendada = getItem(STORAGE_KEYS.dailyNotification, false);
  if (jaAgendada) return;

  try {
    const permissao = await localNotifications.requestPermissions();
    if (permissao.display !== 'granted') return;

    await localNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: '📖 Bíblia de Estudo',
          body: 'Seu momento com a Palavra te espera hoje. Toque para continuar sua leitura.',
          schedule: { on: { hour: HORA_PADRAO, minute: 0 }, allowWhileIdle: true },
        },
      ],
    });

    setItem(STORAGE_KEYS.dailyNotification, true);
  } catch (err) {
    console.warn('[dailyNotification] não foi possível agendar:', err);
  }
}

// ---- Configuração do lembrete (usada pela tela de Configurações) ----
const CONFIG_KEY = 'biblia:daily-notification-config';

export function getDailyNotificationConfig() {
  return { enabled: true, hour: HORA_PADRAO, minute: 0, ...getItem(CONFIG_KEY, {}) };
}

export async function applyDailyNotification(partial) {
  const config = { ...getDailyNotificationConfig(), ...partial };
  setItem(CONFIG_KEY, config);
  const capacitor = typeof window !== 'undefined' ? window.Capacitor : null;
  const nativo = !!(capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform());
  const ln = capacitor?.Plugins?.LocalNotifications || null;
  if (!nativo || !ln) return false;
  try {
    await ln.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    if (config.enabled) {
      const permissao = await ln.requestPermissions();
      if (permissao.display !== 'granted') return false;
      await ln.schedule({
        notifications: [
          {
            id: NOTIFICATION_ID,
            title: '📖 Bíblia de Estudo',
            body: 'Seu momento com a Palavra te espera hoje. Toque para continuar sua leitura.',
            schedule: { on: { hour: config.hour, minute: config.minute }, allowWhileIdle: true },
          },
        ],
      });
    }
    setItem(STORAGE_KEYS.dailyNotification, true);
    return true;
  } catch (err) {
    console.warn('[dailyNotification] não foi possível aplicar:', err);
    return false;
  }
}
