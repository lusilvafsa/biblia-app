// Salvar/compartilhar um arquivo .json e escolher um .json para importar.
export async function exportarJson(nomeArquivo, objeto, titulo) {
  const texto = JSON.stringify(objeto, null, 2);
  const cap = window.Capacitor;
  const nativo = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const fs = cap && cap.Plugins && cap.Plugins.Filesystem;
  const share = cap && cap.Plugins && cap.Plugins.Share;
  if (nativo && fs && share) {
    try {
      const r = await fs.writeFile({ path: nomeArquivo, data: texto, directory: 'CACHE', encoding: 'utf8' });
      await share.share({ title: titulo, url: r.uri, dialogTitle: titulo });
      return 'ok';
    } catch (e) {
      return /cancel/i.test(String((e && (e.message || e)) || '')) ? 'cancelado' : 'erro';
    }
  }
  const blob = new Blob([texto], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'ok';
}

// Abre o seletor de arquivos. Devolve o objeto lido, ou 'invalido' se não for JSON.
export function escolherJson() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const arquivo = input.files && input.files[0];
      input.remove();
      if (!arquivo) {
        resolve(null);
        return;
      }
      const leitor = new FileReader();
      leitor.onload = () => {
        try {
          resolve(JSON.parse(String(leitor.result)));
        } catch (e) {
          resolve('invalido');
        }
      };
      leitor.onerror = () => resolve('invalido');
      leitor.readAsText(arquivo);
    });
    document.body.appendChild(input);
    input.click();
  });
}
