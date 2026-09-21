// Compartilhamento de texto, funcionando tanto no navegador (Web Share
// API) quanto dentro do APK (plugin nativo @capacitor/share, já que o
// WebView do Android não tem a Web Share API embutida).
export async function shareText({ title, text }) {
  const capacitor = typeof window !== 'undefined' ? window.Capacitor : null;
  const isNative = !!(
    capacitor &&
    typeof capacitor.isNativePlatform === 'function' &&
    capacitor.isNativePlatform()
  );

  const nativeShare = capacitor?.Plugins?.Share || null;

  if (isNative && nativeShare) {
    try {
      await nativeShare.share({ title, text, dialogTitle: title });
      return 'shared';
    } catch (_e) {
      return 'cancelled'; // usuário cancelou o menu nativo — não é erro
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (_e) {
      return 'cancelled';
    }
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch (_e) {
      return 'error';
    }
  }

  return 'unsupported';
}
