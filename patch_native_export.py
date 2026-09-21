path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_import = "import { shareText } from '../../utils/share.js';"
new_import = old_import + "\nimport { shareElementAsImage } from '../../utils/nativeExport.js';"
qtd0 = content.count(old_import)
if qtd0 != 1:
    raise SystemExit(f"ERRO 0: encontrado {qtd0} vezes")
content = content.replace(old_import, new_import)

old_print = """    function handlePrintSelection(text, context) {
      const referencia = context && context.verseIndex !== undefined
        ? `${book.name} ${chapterIndex + 1}:${context.verseIndex + 1}`
        : `${book.name} ${chapterIndex + 1}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'print-only-selection';
      wrapper.innerHTML = `
        <div class="ministry-header-card">
          <div class="ministry-theme-label">📖 ${referencia}</div>
        </div>
        <div class="verse-card" style="margin-top:16px;">
          <div class="verse-text">"${text}"</div>
        </div>
      `;
      document.body.appendChild(wrapper);
      document.body.classList.add('printing-selection');

      const limpar = () => {
        document.body.classList.remove('printing-selection');
        wrapper.remove();
        window.removeEventListener('afterprint', limpar);
      };
      window.addEventListener('afterprint', limpar);
      window.print();
      setTimeout(limpar, 3000);
    }"""

new_print = """    async function handlePrintSelection(text, context) {
      const referencia = context && context.verseIndex !== undefined
        ? `${book.name} ${chapterIndex + 1}:${context.verseIndex + 1}`
        : `${book.name} ${chapterIndex + 1}`;

      const capacitor = typeof window !== 'undefined' ? window.Capacitor : null;
      const isNative = !!(capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform());

      const wrapper = document.createElement('div');
      wrapper.className = isNative ? '' : 'print-only-selection';
      if (isNative) {
        wrapper.style.position = 'fixed';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '0';
        wrapper.style.width = '360px';
        wrapper.style.padding = '24px';
        wrapper.style.background = '#0f1729';
      }
      wrapper.innerHTML = `
        <div class="ministry-header-card">
          <div class="ministry-theme-label">📖 ${referencia}</div>
        </div>
        <div class="verse-card" style="margin-top:16px;">
          <div class="verse-text">"${text}"</div>
        </div>
      `;
      document.body.appendChild(wrapper);

      if (isNative) {
        const resultado = await shareElementAsImage(wrapper, `${referencia}.png`, referencia);
        wrapper.remove();
        if (resultado === 'shared') toast.success('Pronto! Escolha imprimir, salvar ou enviar.');
        if (resultado === 'error') toast.error('Não foi possível gerar a imagem para impressão.');
        return;
      }

      document.body.classList.add('printing-selection');
      const limpar = () => {
        document.body.classList.remove('printing-selection');
        wrapper.remove();
        window.removeEventListener('afterprint', limpar);
      };
      window.addEventListener('afterprint', limpar);
      window.print();
      setTimeout(limpar, 3000);
    }"""

qtd1 = content.count(old_print)
if qtd1 != 1:
    raise SystemExit(f"ERRO 1: encontrado {qtd1} vezes")
content = content.replace(old_print, new_print)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("reader.js (print) atualizado com sucesso")
