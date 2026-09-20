path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

anchor = """    const detachSelectionToolbar = attachSelectionToolbar(readContent, {
      onShare: handleShareSelection,
      onExplain: handleExplainSelection,
      onNarrate: handleNarrateSelection,
    });"""

replacement = """    function handlePrintSelection(text) {
      const wrapper = document.createElement('div');
      wrapper.className = 'print-only-selection';
      wrapper.innerHTML = `
        <div class="ministry-header-card">
          <div class="ministry-theme-label">📖 ${book.name} ${chapterIndex + 1}</div>
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
    }

    async function handleImageSelection(text) {
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
        <div class="ministry-theme-label" style="margin-bottom:10px;">📖 ${book.name} ${chapterIndex + 1}</div>
        <div class="verse-text">"${text}"</div>
      `;
      document.body.appendChild(wrapper);

      try {
        const canvas = await html2canvas(wrapper, { backgroundColor: '#0f1729', scale: 2 });
        canvas.toBlob(async (blob) => {
          const arquivo = new File([blob], `${book.name}-${chapterIndex + 1}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            try {
              await navigator.share({ files: [arquivo], title: `${book.name} ${chapterIndex + 1}` });
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
    }

    const detachSelectionToolbar = attachSelectionToolbar(readContent, {
      onShare: handleShareSelection,
      onExplain: handleExplainSelection,
      onNarrate: handleNarrateSelection,
      onPrint: handlePrintSelection,
      onImage: handleImageSelection,
    });"""

qtd = content.count(anchor)
if qtd != 1:
    raise SystemExit(f"ERRO: ancora encontrada {qtd} vezes (esperado 1).")
content = content.replace(anchor, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("reader.js atualizado com sucesso")
