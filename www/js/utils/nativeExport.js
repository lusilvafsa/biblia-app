// Exporta um elemento da tela como imagem, funcionando tanto no navegador
// quanto dentro do APK. O WebView do Android não tem window.print() nem
// compartilhamento de arquivos via navegador, então no app nativo a
// imagem é salva num arquivo temporário (Filesystem) e compartilhada
// pelo menu nativo do Android (Share) — de onde dá pra imprimir, salvar
// no Drive, enviar por WhatsApp, etc.
export async function shareElementAsImage(element, filename, title) {
  if (typeof html2canvas === 'undefined') {
    return 'unavailable';
  }

  const canvas = await html2canvas(element, { backgroundColor: '#0f1729', scale: 2 });

  const capacitor = typeof window !== 'undefined' ? window.Capacitor : null;
  const isNative = !!(
    capacitor &&
    typeof capacitor.isNativePlatform === 'function' &&
    capacitor.isNativePlatform()
  );
  const filesystem = capacitor?.Plugins?.Filesystem || null;
  const share = capacitor?.Plugins?.Share || null;

  if (isNative && filesystem && share) {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      const escrita = await filesystem.writeFile({
        path: filename,
        data: base64,
        directory: 'CACHE',
      });
      await share.share({ title, url: escrita.uri, dialogTitle: title });
      return 'shared';
    } catch (_e) {
      return 'error';
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      try {
        const arquivo = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
          try {
            await navigator.share({ files: [arquivo], title });
            resolve('shared');
          } catch (_e) {
            resolve('cancelled');
          }
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        resolve('downloaded');
      } catch (_e) {
        resolve('error');
      }
    }, 'image/png');
  });
}
