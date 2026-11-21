let carregamentoHtml2Canvas = null;

export function carregarHtml2Canvas() {
  if (typeof globalThis.html2canvas === 'function') {
    return Promise.resolve(globalThis.html2canvas);
  }

  if (!carregamentoHtml2Canvas) {
    carregamentoHtml2Canvas = new Promise((resolve, reject) => {
      const script = document.createElement('script');

      script.src = new URL('../vendor/html2canvas.min.js', import.meta.url).href;
      script.async = true;

      script.onload = () => {
        if (typeof globalThis.html2canvas === 'function') {
          resolve(globalThis.html2canvas);
        } else {
          carregamentoHtml2Canvas = null;
          reject(new Error('html2canvas não foi disponibilizado.'));
        }
      };

      script.onerror = () => {
        carregamentoHtml2Canvas = null;
        reject(new Error('Não foi possível carregar o html2canvas local.'));
      };

      document.head.appendChild(script);
    });
  }

  return carregamentoHtml2Canvas;
}
