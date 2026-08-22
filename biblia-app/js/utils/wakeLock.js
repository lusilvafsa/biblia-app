// Impede a tela de apagar sozinha por inatividade enquanto a narrativa
// está tocando (Screen Wake Lock API). Suporte: Chrome/Edge/Android bons;
// Safari/iOS parcial e mais recente; navegadores sem suporte simplesmente
// não fazem nada (a narrativa continua funcionando normalmente, só sem
// essa proteção extra).
//
// Limitação importante: o wake lock é liberado automaticamente pelo
// navegador quando a aba fica oculta (troca de app, tela bloqueada
// manualmente) — ele impede o apagar automático por inatividade
// enquanto o usuário está com o app aberto na tela, mas não força a tela
// a continuar ligada se o usuário apertar o botão de bloquear ou trocar
// de app propositalmente.
let sentinel = null;

export function isWakeLockSupported() {
  return 'wakeLock' in navigator;
}

export async function requestWakeLock() {
  if (!isWakeLockSupported()) return false;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
    return true;
  } catch (_err) {
    // Falha silenciosa (ex.: documento não visível no momento do pedido) —
    // a narrativa deve continuar funcionando mesmo sem o wake lock.
    return false;
  }
}

export async function releaseWakeLock() {
  if (!sentinel) return;
  try {
    await sentinel.release();
  } catch (_err) {
    /* ignora */
  }
  sentinel = null;
}

export function isWakeLockActive() {
  return !!sentinel;
}

/** Tenta readquirir o wake lock quando a aba volta a ficar visível,
 * apenas se `shouldReacquire()` disser que ainda faz sentido (ex.: a
 * narrativa continua tocando). Retorna uma função para cancelar. */
export function setupWakeLockReacquire(shouldReacquire) {
  async function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && shouldReacquire() && !isWakeLockActive()) {
      await requestWakeLock();
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}
