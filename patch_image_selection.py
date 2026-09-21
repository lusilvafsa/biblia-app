path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """    async function handleImageSelection(text, context) {
      const referencia = context && context.verseIndex !== undefined
        ? `${book.name} ${chapterIndex + 1}:${context.verseIndex + 1}`
        : `${book.name} ${chapterIndex + 1}`;
      if (typeof html2canvas === 'undefined') {
        toast.error('Recurso de imagem ainda carregando, tente novamente em instantes.');
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = '360px';
      wrapper.style.padding = '24px';
      wrapper.style.background = '#0f1729';
      wrapper.innerHTML = `
        <div class="ministry-theme-label" style="margin-bottom:10px;">📖 ${referencia}</div>
        <div class="verse-text">"${text}"</div>
      `;
      document.body.appendChild(wrapper);

      try {
        const canvas = await html2canvas(wrapper, { backgroundColor: '#0f1729', scale: 2 });
        canvas.toBlob(async (blob) => {
          const arquivo = new File([blob], `${book.name}-${chapterIndex + 1}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            try {
              await navigator.share({ files: [arquivo], title: referencia });
            } catch (_e) {
              /* usuário cancelou — sem erro */
            }
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${book.name}-${chapterIndex + 1}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      } catch (_e) {
        toast.error('Não foi possível gerar a imagem agora.');
      } finally {
        wrapper.remove();
      }
    }"""

new = """    async function handleImageSelection(text, context) {
      const referencia = context && context.verseIndex !== undefined
        ? `${book.name} ${chapterIndex + 1}:${context.verseIndex + 1}`
        : `${book.name} ${chapterIndex + 1}`;

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = '360px';
      wrapper.style.padding = '24px';
      wrapper.style.background = '#0f1729';
      wrapper.innerHTML = `
        <div class="ministry-theme-label" style="margin-bottom:10px;">📖 ${referencia}</div>
        <div class="verse-text">"${text}"</div>
      `;
      document.body.appendChild(wrapper);

      const resultado = await shareElementAsImage(wrapper, `${referencia}.png`, referencia);
      wrapper.remove();

      if (resultado === 'unavailable') toast.error('Recurso de imagem ainda carregando, tente novamente em instantes.');
      if (resultado === 'error') toast.error('Não foi possível gerar a imagem agora.');
      if (resultado === 'downloaded') toast.success('Imagem baixada!');
    }"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("reader.js (imagem) atualizado com sucesso")
