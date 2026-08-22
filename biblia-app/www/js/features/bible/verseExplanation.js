// Painel de explicação exibido ao tocar/selecionar um versículo.
// Não interrompe nenhuma narrativa em andamento — só abre uma camada
// visual por cima; fechar o painel simplesmente o remove.
import { icons } from '../../components/icons.js';
import { getVerseCommentary } from '../../../data/verseCommentary.js';
import { openExternalExplanation } from '../../utils/externalExplain.js';
import { progressRepository } from '../../data-access/progressRepository.js';

let overlayEl = null;

function removePanel() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}

function sectionHtml(icon, title, text) {
  return `
    <div class="verse-explain-section">
      <h4>${icon} ${title}</h4>
      <p>${text}</p>
    </div>
  `;
}

/**
 * Mostra o painel de explicação para um versículo.
 * @param {{ bookIndex: number, bookName: string, chapterIndex: number, verseIndex: number, verseText: string }} info
 */
export async function showVerseExplanation({ bookIndex, bookName, chapterIndex, verseIndex, verseText }) {
  removePanel();

  const commentary = getVerseCommentary(bookIndex, chapterIndex, verseIndex);
  const ref = `${bookName} ${chapterIndex + 1}:${verseIndex + 1}`;
  const isFavorite = await progressRepository.isFavorite(ref);
  const note = await progressRepository.getNote(ref);

  overlayEl = document.createElement('div');
  overlayEl.className = 'verse-explain-overlay';

  const body = commentary
    ? `
      ${sectionHtml('💡', 'Explicação', commentary.explicacao)}
      ${sectionHtml('📚', 'Contexto', commentary.contexto)}
      ${sectionHtml('🙏', 'Aplicação', commentary.aplicacao)}
      ${sectionHtml('🔎', 'Conceitos importantes', commentary.conceitos)}
    `
    : `
      <div class="verse-explain-fallback">
        <p>Ainda não temos uma explicação detalhada preparada para este versículo específico.</p>
        <p>Este app não tem um serviço de IA por trás (é 100% local, sem servidor), então não dá para gerar uma explicação nova sob demanda — mas você pode buscar comentários bíblicos confiáveis sobre este trecho.</p>
        <button type="button" id="btnExternalExplain">${icons.explain} Buscar comentário bíblico</button>
      </div>
    `;

  overlayEl.innerHTML = `
    <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Explicação de ${ref}">
      <div class="verse-explain-handle"></div>
      <button class="verse-explain-close" id="btnCloseExplain" aria-label="Fechar">${icons.close}</button>
      <div class="verse-explain-ref">📖 ${ref}</div>
      <div class="verse-actions"><button type="button" id="btnFavoriteVerse" class="verse-action-btn">${isFavorite ? "⭐ Remover dos favoritos" : "☆ Adicionar aos favoritos"}</button><button type="button" id="btnNoteVerse" class="verse-action-btn">📝 ${note ? "Editar anotação" : "Adicionar anotação"}</button></div>
      <blockquote class="verse-explain-text">"${verseText}"</blockquote>
      ${body}
    </div>
  `;

  document.body.appendChild(overlayEl);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) removePanel(); // toca fora do painel fecha
  });
  overlayEl.querySelector('#btnCloseExplain').addEventListener('click', removePanel);

  overlayEl.querySelector('#btnFavoriteVerse').addEventListener('click', async () => {
    const active = await progressRepository.toggleFavorite(ref, { bookIndex, bookName, chapterIndex, verseIndex, verseText });
    overlayEl.querySelector('#btnFavoriteVerse').textContent = active ? '⭐ Remover dos favoritos' : '☆ Adicionar aos favoritos';
  });
  overlayEl.querySelector('#btnNoteVerse').addEventListener('click', async () => {
    const current = await progressRepository.getNote(ref);
    const value = window.prompt(`Anotação para ${ref}:`, current);
    if (value !== null) { await progressRepository.saveNote(ref, value); overlayEl.querySelector('#btnNoteVerse').textContent = value.trim() ? '📝 Editar anotação' : '📝 Adicionar anotação'; }
  });

  const externalBtn = overlayEl.querySelector('#btnExternalExplain');
  if (externalBtn) {
    externalBtn.addEventListener('click', () => openExternalExplanation(`${verseText} (${ref})`));
  }
}

export function hideVerseExplanation() {
  removePanel();
}
