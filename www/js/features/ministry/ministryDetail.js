// Tela: detalhe de um tema do Guia de Ministração — passagem principal,
// esboço estruturado, aplicação prática e sugestão de oração final.
import { icons } from '../../components/icons.js';
import { toast } from '../../utils/toast.js';
import { navigateTo } from '../../router.js';
import { setHeaderTitle } from '../../state/header.js';
import { getMinistryOutline } from '../../../data/ministryOutlines.js';
import { getAllBooks } from '../../data-access/bibleRepository.js';

function parseRef(ref) {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;
  return { bookName: match[1].trim(), chapter: Number(match[2]), verse: Number(match[3]) };
}

function montarTextoCompartilhavel(item) {
  const pontosTexto = item.esboco.pontos.map((p) => `${p.titulo}\n${p.texto}`).join('\n\n');
  return [
    `📖 ${item.tema}`,
    '',
    `Passagem principal: ${item.versiculoPrincipal.ref}`,
    `"${item.versiculoPrincipal.texto}"`,
    '',
    item.esboco.introducao,
    '',
    pontosTexto,
    '',
    `Aplicação: ${item.esboco.aplicacao}`,
    '',
    `Oração final: ${item.esboco.oracaoFinal}`,
  ].join('\n');
}

export const ministryDetailPage = {
  async render(container, params) {
    const item = getMinistryOutline(params.id);
    if (!item) {
      container.innerHTML = `<div class="state-message error">Tema não encontrado.</div>`;
      return;
    }

    setHeaderTitle(item.tema);

    const pontosHtml = item.esboco.pontos
      .map((p) => `<div class="ministry-point"><h4>${p.titulo}</h4><p>${p.texto}</p></div>`)
      .join('');

    const apoioHtml = item.versiculosApoio.map((ref) => `<span class="ministry-ref-chip">${ref}</span>`).join('');

    container.innerHTML = `
      <div class="ministry-share-actions no-print">
        <button class="read-btn" id="btnShareOutline">🔗 Compartilhar</button>
        <button class="read-btn" id="btnPrintOutline">🖨️ Imprimir / PDF</button>
      </div>

      <div class="ministry-header-card">
        <div class="ministry-theme-label">${icons.explain} TEMA</div>
        <h2>${item.tema}</h2>
      </div>

      <div class="verse-card" style="margin-top:16px;">
        <div class="verse-label">📖 Passagem Principal</div>
        <div class="verse-text">"${item.versiculoPrincipal.texto}"</div>
        <div class="verse-ref">${item.versiculoPrincipal.ref}</div>
        <div class="verse-actions no-print">
          <button class="icon-btn" id="btnOpenPassage" title="Abrir no leitor">${icons.bibleNav}</button>
        </div>
      </div>

      <div class="settings-section-title" style="margin-top:20px;">Esboço</div>
      <div class="ministry-outline-card">
        <p class="ministry-intro-text">${item.esboco.introducao}</p>
        ${pontosHtml}
      </div>

      <div class="settings-section-title" style="margin-top:20px;">Aplicação</div>
      <div class="settings-card"><p class="ministry-plain-text">${item.esboco.aplicacao}</p></div>

      <div class="settings-section-title" style="margin-top:20px;">Sugestão de Oração Final</div>
      <div class="settings-card"><p class="ministry-plain-text">🙏 ${item.esboco.oracaoFinal}</p></div>

      ${item.versiculosApoio.length ? `
        <div class="settings-section-title" style="margin-top:20px;">Versículos de Apoio</div>
        <div class="ministry-ref-chips">${apoioHtml}</div>
      ` : ''}
    `;

    const openBtn = container.querySelector('#btnOpenPassage');
    if (openBtn) {
      openBtn.addEventListener('click', async () => {
        const parsed = parseRef(item.versiculoPrincipal.ref);
        if (!parsed) {
          toast.info('Não foi possível localizar essa referência automaticamente.');
          return;
        }
        try {
          const books = await getAllBooks();
          const book = books.find((b) => b.name === parsed.bookName);
          if (!book) {
            toast.info('Não foi possível localizar esse livro automaticamente.');
            return;
          }
          navigateTo(`/biblia/${book.index}/${parsed.chapter - 1}`);
        } catch (_e) {
          toast.error('Não foi possível abrir a passagem agora.');
        }
      });
    }

    container.querySelector('#btnShareOutline').addEventListener('click', async () => {
      const texto = montarTextoCompartilhavel(item);
      if (navigator.share) {
        try {
          await navigator.share({ title: item.tema, text: texto });
        } catch (_e) {
          /* usuário cancelou — sem erro */
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
        toast.success('Esboço copiado! Cole onde quiser compartilhar.');
      } else {
        toast.info('Compartilhamento não suportado neste navegador.');
      }
    });

    container.querySelector('#btnPrintOutline').addEventListener('click', () => {
      window.print();
    });
  },
};
