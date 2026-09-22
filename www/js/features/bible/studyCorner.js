// Tela: Cantinho de Estudo — reúne comentário curado, comparação de
// versões, referências cruzadas e o Assistente Bíblico para um único
// versículo numa só tela, para um estudo mais aprofundado sem abrir vários
// painéis separados. Não substitui a leitura normal da Bíblia — é um
// caminho extra, opcional.
import { icons } from '../../components/icons.js';
import { navigateTo } from '../../router.js';
import { setHeaderTitle } from '../../state/header.js';
import { getBook, getChapter, getVerseFromVersion, getAllBooks } from '../../data-access/bibleRepository.js';
import { getCrossReferences } from '../../data-access/crossReferenceRepository.js';
import { getVerseCommentary } from '../../../data/verseCommentary.js';
import { BIBLE_VERSIONS } from '../../../data/bibleVersions.js';
import { supabase } from '../../supabaseClient.js';
import { usuarioAtual } from '../../supabaseAuth.js';

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatarRespostaIa(texto) {
  return String(texto || '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim().length > 0)
    .map((linha) => {
      const escapada = escaparHtml(linha.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p>${escapada}</p>`;
    })
    .join('');
}

function sectionHtml(icon, title, text) {
  return `
    <div class="verse-explain-section">
      <h4>${icon} ${title}</h4>
      <p>${text}</p>
    </div>
  `;
}

let nomesLivrosCache = null;
async function nomeDoLivro(bookIndex) {
  if (!nomesLivrosCache) {
    const livros = await getAllBooks();
    nomesLivrosCache = livros.map((l) => l.name);
  }
  return nomesLivrosCache[bookIndex] || `Livro ${bookIndex}`;
}

export const studyCornerPage = {
  async render(container, params) {
    const bookIndex = Number(params.book);
    const chapterIndex = Number(params.chapter);
    const verseIndex = Number(params.verse);

    container.innerHTML = '<div class="state-message">Carregando...</div>';

    let book, verses;
    try {
      book = await getBook(bookIndex);
      verses = await getChapter(bookIndex, chapterIndex);
    } catch (_e) {
      container.innerHTML = '<div class="state-message error">Não foi possível carregar este versículo.</div>';
      return;
    }

    const verseText = verses[verseIndex];
    const ref = `${book.name} ${chapterIndex + 1}:${verseIndex + 1}`;
    setHeaderTitle('Cantinho de Estudo');

    const commentary = getVerseCommentary(bookIndex, chapterIndex, verseIndex);
    const commentaryHtml = commentary
      ? `
        ${sectionHtml('💡', 'Explicação', commentary.explicacao)}
        ${sectionHtml('📚', 'Contexto', commentary.contexto)}
        ${sectionHtml('🙏', 'Aplicação', commentary.aplicacao)}
        ${sectionHtml('🔎', 'Conceitos importantes', commentary.conceitos)}
      `
      : '<p class="verse-explain-fallback">Ainda não há comentário curado para este versículo.</p>';

    container.innerHTML = `
      <div class="study-corner">
        <div class="verse-explain-ref">📖 ${ref}</div>
        <blockquote class="verse-explain-text">"${verseText}"</blockquote>

        <div class="read-controls" style="margin-bottom:18px;">
          <button class="read-btn" id="btnStudyPrev" ${verseIndex === 0 ? 'disabled' : ''}>◀ Anterior</button>
          <button class="read-btn" id="btnStudyNext" ${verseIndex >= verses.length - 1 ? 'disabled' : ''}>Próximo ▶</button>
        </div>

        ${commentaryHtml}

        <div class="settings-section-title" style="margin-top:8px;">Referências Cruzadas</div>
        <div id="studyCrossRefs" class="cross-ref-chips"><p>Buscando versículos relacionados...</p></div>

        <div class="settings-section-title" style="margin-top:18px;">Comparar versões</div>
        <div id="studyCompareResult"><p>Carregando as outras versões...</p></div>

        <div class="settings-section-title" style="margin-top:18px;">Assistente Bíblico</div>
        <button type="button" id="btnStudyAiExplain" class="btn-primary">${icons.sparkles || '✨'} Pedir explicação ao Assistente</button>
        <div id="studyAiResult" hidden></div>

        <button class="read-btn" id="btnBackToReader" style="margin-top:20px; width:100%;">Voltar à leitura</button>
      </div>
    `;

    const prevBtn = container.querySelector('#btnStudyPrev');
    const nextBtn = container.querySelector('#btnStudyNext');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateTo(`/estudo/${bookIndex}/${chapterIndex}/${verseIndex - 1}`));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateTo(`/estudo/${bookIndex}/${chapterIndex}/${verseIndex + 1}`));

    container.querySelector('#btnBackToReader').addEventListener('click', () => {
      navigateTo(`/biblia/${bookIndex}/${chapterIndex}/versiculo/${verseIndex}`);
    });

    // Referências cruzadas: dado local, carrega sozinho, sem custo de IA
    const crossRefsEl = container.querySelector('#studyCrossRefs');
    try {
      const relacionados = await getCrossReferences(bookIndex, chapterIndex, verseIndex, nomeDoLivro);
      if (!relacionados.length) {
        crossRefsEl.innerHTML = '<p class="verse-explain-fallback">Nenhuma referência cruzada catalogada para este versículo.</p>';
      } else {
        crossRefsEl.innerHTML = relacionados
          .map((r) => `<button type="button" class="ref-chip" data-book="${r.bookIndex}" data-chapter="${r.chapter}" data-verse="${r.verse}">${r.ref}</button>`)
          .join('');
        crossRefsEl.querySelectorAll('.ref-chip').forEach((btn) => {
          btn.addEventListener('click', () => {
            navigateTo(`/estudo/${btn.dataset.book}/${btn.dataset.chapter}/${btn.dataset.verse}`);
          });
        });
      }
    } catch (_e) {
      crossRefsEl.innerHTML = '<p class="verse-explain-fallback">Não foi possível carregar as referências agora.</p>';
    }

    // Comparar versões: dado local, carrega sozinho, sem custo de IA
    const compareResult = container.querySelector('#studyCompareResult');
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
    }

    // Assistente: só ao tocar, pra não gastar o limite diário sem o usuário pedir
    const aiBtn = container.querySelector('#btnStudyAiExplain');
    const aiResult = container.querySelector('#studyAiResult');

    aiBtn.addEventListener('click', async () => {
      const usuario = usuarioAtual();
      if (!usuario) {
        aiResult.hidden = false;
        aiResult.innerHTML = '<p>Entre na sua conta para usar o Assistente Bíblico.</p>';
        return;
      }

      aiBtn.disabled = true;
      const textoOriginal = aiBtn.textContent;
      aiBtn.textContent = 'Consultando...';
      aiResult.hidden = false;
      aiResult.innerHTML = '<p>Consultando o Assistente Bíblico...</p>';

      try {
        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: {
            mensagem: `Explique o versículo ${ref}, que diz: "${verseText}". Traga o contexto histórico, o significado principal e uma aplicação prática para a vida hoje.`,
            tipo: 'versiculo',
            chave: `${bookIndex}-${chapterIndex}-${verseIndex}`,
          },
        });

        if (error || !data?.sucesso || !data?.mensagem) {
          throw new Error(data?.erro || error?.message || 'Sem resposta.');
        }

        aiResult.innerHTML = formatarRespostaIa(data.mensagem);
      } catch (_e) {
        aiResult.innerHTML = '<p>Não foi possível obter a explicação agora. Tente novamente.</p>';
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = textoOriginal;
      }
    });
  },
};
