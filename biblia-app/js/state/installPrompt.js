// Captura o evento beforeinstallprompt (Chrome/Android/Edge) assim que a
// página carrega, para poder oferecer um botão "Instalar aplicativo" em
// Configurações — instalado, o app abre em tela cheia, sem a barra de
// endereço do navegador (modo "standalone" definido em manifest.json).
// Safari/iOS não dispara esse evento; lá a instalação é manual
// (Compartilhar → Adicionar à Tela de Início), então o botão só aparece
// quando o navegador realmente suporta o prompt automático.
let deferredPrompt = null;
const listeners = new Set();

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  listeners.forEach((fn) => fn(true));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  listeners.forEach((fn) => fn(false));
});

export function isInstallAvailable() {
  return !!deferredPrompt;
}

export function onInstallAvailabilityChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Mostra o prompt nativo de instalação. Retorna a escolha do usuário
 * ('accepted' | 'dismissed'), ou null se o prompt não estava disponível. */
export async function promptInstall() {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((fn) => fn(false));
  return outcome;
}
