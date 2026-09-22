// Painel de explicação exibido ao tocar/selecionar um versículo.
// Não interrompe nenhuma narrativa em andamento — só abre uma camada
// visual por cima; fechar o painel simplesmente o remove.
import { icons } from '../../components/icons.js';
import { getVerseCommentary } from '../../../data/verseCommentary.js';
import { openExternalExplanation } from '../../utils/externalExplain.js';
import { favoritesRepository } from '../../data-access/favoritesRepository.js';
import { highlightRepository, HIGHLIGHT_COLORS } from '../../data-access/highlightRepository.js';
import { navigateTo } from '../../router.js';
import { supabase } from '../../supabaseClient.js';
import { usuarioAtual } from '../../supabaseAuth.js';
import { BIBLE_VERSIONS } from '../../../data/bibleVersions.js';
import { getVerseFromVersion } from '../../data-access/bibleRepository.js';

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

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Formatação simples: parágrafos e **negrito**, sem depender do
// parser de markdown do Assistente (mantém este arquivo independente).
function formatarRespostaIa(texto) {
  return String(texto || '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim().length > 0)
    .map((linha) => {
      const escapada = escaparHtml(linha.trim())
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p>${escapada}</p>`;
    })
    .join('');
}

/**
 * Mostra o painel de explicação para um versículo.
 * @param {{ bookIndex: number, bookName: string, chapterIndex: number, verseIndex: number, verseText: string }} info
 */
export function showVerseExplanation({ bookIndex, bookName, chapterIndex, verseIndex, verseText, onHighlightChange }) {
  removePanel();

  const commentary = getVerseCommentary(bookIndex, chapterIndex, verseIndex);
  const ref = `${bookName} ${chapterIndex + 1}:${verseIndex + 1}`;

  overlayEl = document.createElement('div');
  overlayEl.className = 'verse-explain-overlay';

  const isFavorite = favoritesRepository.isFavorite(
    bookIndex,
    chapterIndex,
    verseIndex
  );

  const savedItem = favoritesRepository.get(
    bookIndex,
    chapterIndex,
    verseIndex
  );

  const savedNote = savedItem?.note || '';

  const verseActions = `
    <div class="verse-actions">
      <button
        type="button"
        class="verse-action-btn ${isFavorite ? 'active' : ''}"
        id="btnToggleFavorite"
      >
        <span class="verse-action-icon">
          ${isFavorite ? '★' : '☆'}
        </span>
        <span id="favoriteLabel">
          ${isFavorite ? 'Favoritado' : 'Favoritar'}
        </span>
      </button>

      <button
        type="button"
        class="verse-action-btn"
        id="btnVerseNote"
      >
        <span class="verse-action-icon">📝</span>
        <span id="noteLabel">
          ${savedNote ? 'Editar anotação' : 'Adicionar anotação'}
        </span>
      </button>
    </div>

    <div
      class="verse-note-editor"
      id="verseNoteEditor"
      ${savedNote ? '' : 'hidden'}
    >
      <label for="verseNoteInput">
        📝 Anotação do versículo
      </label>

      <textarea
        id="verseNoteInput"
        rows="4"
        placeholder="Escreva sua anotação, comentário ou lembrete..."
      >${savedNote.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>

      <div class="verse-note-buttons">
        <button type="button" id="btnSaveVerseNote">
          💾 Salvar
        </button>

        <button type="button" id="btnCancelVerseNote">
          Cancelar
        </button>
      </div>
    </div>
  `;

  const body = commentary
    ? `
      ${sectionHtml('💡', 'Explicação', commentary.explicacao)}
      ${sectionHtml('📚', 'Contexto', commentary.contexto)}
      ${sectionHtml('🙏', 'Aplicação', commentary.aplicacao)}
      ${sectionHtml('🔎', 'Conceitos importantes', commentary.conceitos)}
    `
    : `
      <div class="verse-explain-fallback">
        <p>Ainda não temos uma explicação curada para este versículo específico.</p>
        <button type="button" id="btnAiExplain" class="btn-primary">
          ${icons.sparkles || '✨'} Pedir explicação ao Assistente
        </button>
        <div class="verse-explain-ai-result" id="aiExplainResult" hidden></div>
        <button type="button" id="btnExternalExplain">${icons.explain} Buscar comentário bíblico externo</button>
      </div>
    `;

  overlayEl.innerHTML = `
    <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Explicação de ${ref}">
      <div class="verse-explain-handle"></div>
      <button class="verse-explain-close" id="btnCloseExplain" aria-label="Fechar">${icons.close}</button>
      <div class="verse-explain-ref">📖 ${ref}</div>
      <blockquote class="verse-explain-text">"${verseText}"</blockquote>

      <button type="button" id="btnCompareVersions" class="btn-primary" style="margin-bottom:16px;">📖 Comparar nas 3 versões</button>
      <div id="compareVersionsResult" hidden></div>
      <button type="button" id="btnOpenStudyCorner" style="margin-bottom:16px;">🧭 Abrir no Cantinho de Estudo</button>
      <div class="highlight-picker">
        <span class="highlight-label">Grifar:</span>
        <button type="button" class="highlight-dot" data-color="amarelo" style="background:#f2c94c"></button>
        <button type="button" class="highlight-dot" data-color="azul" style="background:#56ccf2"></button>
        <button type="button" class="highlight-dot" data-color="verde" style="background:#6fcf97"></button>
        <button type="button" class="highlight-dot" data-color="rosa" style="background:#eb5757"></button>
        <button type="button" class="highlight-dot highlight-dot--none" id="btnRemoveHighlight" title="Remover grifo">✕</button>
      </div>

      ${verseActions}

      ${body}
    </div>
  `;

  document.body.appendChild(overlayEl);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) removePanel(); // toca fora do painel fecha
  });
  overlayEl.querySelector('#btnCloseExplain').addEventListener('click', removePanel);
  overlayEl.querySelector('#btnOpenStudyCorner').addEventListener('click', () => {
    removePanel();
    navigateTo('/estudo/' + bookIndex + '/' + chapterIndex + '/' + verseIndex);
  });

  // ===== COMPARAR VERSÕES =====

  const compareBtn = overlayEl.querySelector('#btnCompareVersions');
  const compareResult = overlayEl.querySelector('#compareVersionsResult');

  if (compareBtn) {
    compareBtn.addEventListener('click', async () => {
      compareBtn.disabled = true;
      compareBtn.textContent = 'Carregando...';
      compareResult.hidden = false;
      compareResult.innerHTML = '<p>Buscando o versículo nas outras versões...</p>';

      try {
        const textos = await Promise.all(
          BIBLE_VERSIONS.filter((v) => v.available).map(async (v) => {
            try {
              const texto = await getVerseFromVersion(v.id, bookIndex, chapterIndex, verseIndex);
              return { label: v.label, texto };
            } catch (_e) {
              return { label: v.label, texto: null };
            }
          })
        );

        compareResult.innerHTML = textos
          .map(({ label, texto }) => sectionHtml('📖', label, texto ? escaparHtml(texto) : 'Não disponível nesta versão.'))
          .join('');
      } catch (_e) {
        compareResult.innerHTML = '<p>Não foi possível comparar as versões agora.</p>';
      } finally {
        compareBtn.remove();
      }
    });
  }

  overlayEl.querySelectorAll('.highlight-dot[data-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      highlightRepository.set(bookIndex, chapterIndex, verseIndex, btn.dataset.color);
      if (onHighlightChange) onHighlightChange(btn.dataset.color);
    });
  });
  const removeHighlightBtn = overlayEl.querySelector('#btnRemoveHighlight');
  if (removeHighlightBtn) {
    removeHighlightBtn.addEventListener('click', () => {
      highlightRepository.remove(bookIndex, chapterIndex, verseIndex);
      if (onHighlightChange) onHighlightChange(null);
    });
  }

  // ===== FAVORITOS =====

  const favoriteBtn = overlayEl.querySelector('#btnToggleFavorite');

  favoriteBtn.addEventListener('click', () => {
    const favorite = favoritesRepository.toggleFavorite({
      bookIndex,
      bookName,
      chapterIndex,
      verseIndex,
      verseText
    });

    favoriteBtn.classList.toggle('active', favorite);

    favoriteBtn.querySelector('.verse-action-icon').textContent =
      favorite ? '★' : '☆';

    favoriteBtn.querySelector('#favoriteLabel').textContent =
      favorite ? 'Favoritado' : 'Favoritar';
  });


  // ===== ANOTAÇÕES =====

  const noteBtn = overlayEl.querySelector('#btnVerseNote');
  const noteEditor = overlayEl.querySelector('#verseNoteEditor');
  const noteInput = overlayEl.querySelector('#verseNoteInput');
  const saveNoteBtn = overlayEl.querySelector('#btnSaveVerseNote');
  const cancelNoteBtn = overlayEl.querySelector('#btnCancelVerseNote');

  noteBtn.addEventListener('click', () => {
    noteEditor.hidden = false;
    noteInput.focus();
  });

  cancelNoteBtn.addEventListener('click', () => {
    noteEditor.hidden = true;
    noteInput.value = savedNote;
  });

  saveNoteBtn.addEventListener('click', () => {
    favoritesRepository.saveNote(
      {
        bookIndex,
        bookName,
        chapterIndex,
        verseIndex,
        verseText
      },
      noteInput.value
    );

    const hasNote = noteInput.value.trim().length > 0;

    overlayEl.querySelector('#noteLabel').textContent =
      hasNote ? 'Editar anotação' : 'Adicionar anotação';

    noteEditor.hidden = true;
  });


  // ===== EXPLICAÇÃO EXTERNA (busca fora do app) =====

  const externalBtn = overlayEl.querySelector('#btnExternalExplain');
  if (externalBtn) {
    externalBtn.addEventListener('click', () => openExternalExplanation(`${verseText} (${ref})`));
  }

  // ===== EXPLICAÇÃO PELO ASSISTENTE BÍBLICO (IA) =====

  const aiBtn = overlayEl.querySelector('#btnAiExplain');
  const aiResultEl = overlayEl.querySelector('#aiExplainResult');

  if (aiBtn) {
    aiBtn.addEventListener('click', async () => {
      const usuario = usuarioAtual();

      if (!usuario) {
        aiResultEl.hidden = false;
        aiResultEl.innerHTML = '<p>Entre na sua conta para usar o Assistente Bíblico.</p>';
        return;
      }

      aiBtn.disabled = true;
      const textoOriginalBtn = aiBtn.textContent;
      aiBtn.textContent = 'Consultando...';
      aiResultEl.hidden = false;
      aiResultEl.innerHTML = '<p>Consultando o Assistente Bíblico...</p>';

      try {
        const { data, error } = await supabase.functions.invoke(
          'assistente-biblico',
          {
            body: {
              mensagem: `Explique o versículo ${ref}, que diz: "${verseText}". Traga o contexto histórico, o significado principal e uma aplicação prática para a vida hoje.`,
              tipo: 'versiculo',
              chave: `${bookIndex}-${chapterIndex}-${verseIndex}`,
            },
          }
        );

        if (error || !data?.sucesso || !data?.mensagem) {
          throw new Error(data?.erro || error?.message || 'Sem resposta.');
        }

        aiResultEl.innerHTML = formatarRespostaIa(data.mensagem);
      } catch (err) {
        aiResultEl.innerHTML = '<p>Não foi possível obter a explicação agora. Tente novamente.</p>';
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = textoOriginalBtn;
      }
    });
  }
}

export function hideVerseExplanation() {
  removePanel();
}
