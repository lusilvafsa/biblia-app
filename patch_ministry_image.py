path = 'www/js/features/ministry/ministryDetail.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_buttons = """      <div class="ministry-share-actions no-print">
        <button class="read-btn" id="btnShareOutline">🔗 Compartilhar</button>
        <button class="read-btn" id="btnPrintOutline">🖨️ Imprimir / PDF</button>
      </div>

      <div class="ministry-header-card">"""

new_buttons = """      <div class="ministry-share-actions no-print">
        <button class="read-btn" id="btnShareOutline">🔗 Compartilhar</button>
        <button class="read-btn" id="btnPrintOutline">🖨️ Imprimir / PDF</button>
        <button class="read-btn" id="btnImageOutline">📷 Imagem</button>
      </div>

      <div id="ministryCaptureArea">
      <div class="ministry-header-card">"""

qtd1 = content.count(old_buttons)
if qtd1 != 1:
    raise SystemExit(f"ERRO: bloco dos botoes encontrado {qtd1} vezes (esperado 1).")
content = content.replace(old_buttons, new_buttons)

old_fechamento = """      ${item.versiculosApoio.length ? `
        <div class="settings-section-title" style="margin-top:20px;">Versículos de Apoio</div>
        <div class="ministry-ref-chips">${apoioHtml}</div>
      ` : ''}
    `;"""

new_fechamento = """      ${item.versiculosApoio.length ? `
        <div class="settings-section-title" style="margin-top:20px;">Versículos de Apoio</div>
        <div class="ministry-ref-chips">${apoioHtml}</div>
      ` : ''}
      </div>
    `;"""

qtd2 = content.count(old_fechamento)
if qtd2 != 1:
    raise SystemExit(f"ERRO: fechamento encontrado {qtd2} vezes (esperado 1).")
content = content.replace(old_fechamento, new_fechamento)

old_print_handler = """    container.querySelector('#btnPrintOutline').addEventListener('click', () => {
      window.print();
    });
  },
};"""

new_print_handler = """    container.querySelector('#btnPrintOutline').addEventListener('click', () => {
      window.print();
    });

    container.querySelector('#btnImageOutline').addEventListener('click', async () => {
      const area = container.querySelector('#ministryCaptureArea');
      const btn = container.querySelector('#btnImageOutline');

      if (typeof html2canvas === 'undefined') {
        toast.error('Recurso de imagem ainda carregando, tente novamente em instantes.');
        return;
      }

      btn.disabled = true;
      const textoOriginal = btn.textContent;
      btn.textContent = 'Gerando...';

      try {
        const canvas = await html2canvas(area, { backgroundColor: '#0f1729', scale: 2 });

        canvas.toBlob(async (blob) => {
          const arquivo = new File([blob], `${item.tema}.png`, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            try {
              await navigator.share({ files: [arquivo], title: item.tema });
            } catch (_e) {
              /* usuário cancelou — sem erro */
            }
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.tema}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }

          btn.disabled = false;
          btn.textContent = textoOriginal;
        }, 'image/png');
      } catch (_e) {
        toast.error('Não foi possível gerar a imagem agora.');
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    });
  },
};"""

qtd3 = content.count(old_print_handler)
if qtd3 != 1:
    raise SystemExit(f"ERRO: handler do print encontrado {qtd3} vezes (esperado 1).")
content = content.replace(old_print_handler, new_print_handler)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ministryDetail.js atualizado com sucesso")
