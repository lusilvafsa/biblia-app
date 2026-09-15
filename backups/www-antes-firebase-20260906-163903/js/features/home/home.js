// Página Home: versículo do dia, sequência, acesso rápido e planos de leitura.
import { qs, qsa, el } from '../../utils/dom.js';
import { icons } from '../../components/icons.js';
import { toast } from '../../utils/toast.js';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';
import { speak, stopSpeech } from '../../utils/speech.js';
import { navigateTo } from '../../router.js';
import { DAILY_VERSES } from '../../../data/verses.js';
import { progressRepository } from '../../data-access/progressRepository.js';
import { getBook } from '../../data-access/bibleRepository.js';
import { requestAutoStart } from '../bible/reader.js';

let verseIndex = 0;
let isSpeakingVerse = false;

function isBookmarked(ref) {
  const favorites = getItem(STORAGE_KEYS.favorites, []);
  return favorites.includes(ref);
}

function toggleBookmark(ref) {
  const favorites = getItem(STORAGE_KEYS.favorites, []);
  const idx = favorites.indexOf(ref);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    setItem(STORAGE_KEYS.favorites, favorites);
    toast.info('Favorito removido');
  } else {
    favorites.push(ref);
    setItem(STORAGE_KEYS.favorites, favorites);
    toast.success('Favoritado!');
  }
  return isBookmarked(ref);
}

function template() {
  const verse = DAILY_VERSES[verseIndex];
  return `
    <div class="hero-card">
      <video autoplay loop muted playsinline aria-hidden="true">
        <source src="assets/media/hero-loop.webm" type="video/webm">
        <source src="assets/media/hero-loop.mp4" type="video/mp4">
      </video>
      <div class="hero-overlay"></div>
    </div>

    <div id="continueReadingSlot"></div>

    <div class="streak-banner">
      <div class="streak-flame">${icons.bible}</div>
      <div class="streak-info">
        <h4>Sequência de 7 dias</h4>
        <p>Continue lendo para manter sua sequência</p>
      </div>
    </div>

    <div class="verse-card">
      <div class="verse-label">${icons.bible} Versículo do Dia</div>
      <div class="verse-text" id="verseText">${verse.text}</div>
      <div class="verse-ref" id="verseRef">${verse.ref}</div>
      <button class="audio-btn-top" id="btnVerseTTS" title="Ouvir versículo" aria-label="Ouvir versículo do dia">${icons.listen}</button>
      <div class="verse-actions">
        <button class="icon-btn" id="btnCopyVerse" title="Copiar" aria-label="Copiar versículo">${icons.copy}</button>
        <button class="icon-btn" id="btnBookmarkVerse" title="Favoritar" aria-label="Favoritar versículo">${icons.bookmark}</button>
        <button class="icon-btn" id="btnShareVerse" title="Compartilhar" aria-label="Compartilhar versículo">${icons.share}</button>
        <button class="icon-btn" id="btnNewVerse" title="Novo versículo" aria-label="Carregar novo versículo">${icons.refresh}</button>
      </div>
    </div>

    <div class="section-title">
      Acesso Rápido
      <button class="see-all" id="btnSeeAll">Ver tudo</button>
    </div>
    <div class="menu-grid">
      <button class="menu-item" data-route="/biblia">
        <div class="menu-icon">${icons.bible}</div>
        <div class="menu-title">Ler Bíblia</div>
        <div class="menu-desc">ACF e mais versões</div>
      </button>
      <button class="menu-item" data-route="/audio">
        <div class="menu-icon">${icons.audio}</div>
        <div class="menu-title">Bíblia em Áudio</div>
        <div class="menu-desc">Ouça as Escrituras</div>
      </button>
      <button class="menu-item" data-route="/oracao">
        <div class="menu-icon">${icons.prayer}</div>
        <div class="menu-title">Oração Diária</div>
        <div class="menu-desc">Devoções guiadas</div>
      </button>
      <button class="menu-item" data-route="/quiz">
        <div class="menu-icon">${icons.quiz}</div>
        <div class="menu-title">Quiz Bíblico</div>
        <div class="menu-desc">Teste seus conhecimentos</div>
      </button>
      <button class="menu-item" data-route="/ministracao">
        <div class="menu-icon">${icons.explain}</div>
        <div class="menu-title">Guia de Ministração</div>
        <div class="menu-desc">Temas, passagens e esboços</div>
      </button>
    </div>

    <div class="section-title">Planos de Leitura</div>
    <button class="plan-card" id="plan1">
      <div class="plan-icon-box">${icons.planBook}</div>
      <div class="plan-info"><h4>30 Dias com Jesus</h4><p>Dia 12 de 30</p></div>
      <div class="plan-progress">40%</div>
    </button>
    <button class="plan-card" id="plan2">
      <div class="plan-icon-box">${icons.planBook}</div>
      <div class="plan-info"><h4>Salmos de Conforto</h4><p>Dia 5 de 21</p></div>
      <div class="plan-progress">24%</div>
    </button>
  `;
}

function updateVerseDisplay(container) {
  const verse = DAILY_VERSES[verseIndex];
  qs('#verseText', container).textContent = verse.text;
  qs('#verseRef', container).textContent = verse.ref;
  const bookmarkBtn = qs('#btnBookmarkVerse', container);
  bookmarkBtn.style.color = isBookmarked(verse.ref) ? 'var(--gold)' : '';
}

function copyVerse(container) {
  const verse = DAILY_VERSES[verseIndex];
  const text = `${verse.text} — ${verse.ref}`;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Versículo copiado!'),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    const ok = document.execCommand('copy');
    toast[ok ? 'success' : 'error'](ok ? 'Versículo copiado!' : 'Não foi possível copiar');
  } catch (_e) {
    toast.error('Não foi possível copiar');
  }
  document.body.removeChild(ta);
}

async function shareVerse() {
  const verse = DAILY_VERSES[verseIndex];
  const shareData = { title: 'Bíblia de Estudo', text: `${verse.text} — ${verse.ref}` };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (_e) {
      /* usuário cancelou o compartilhamento — sem erro */
    }
  } else {
    toast.info('Compartilhamento não suportado neste navegador');
  }
}

function toggleVerseAudio(container) {
  const btn = qs('#btnVerseTTS', container);
  if (isSpeakingVerse) {
    stopSpeech();
    isSpeakingVerse = false;
    btn.classList.remove('playing');
    toast.info('Leitura parada');
    return;
  }
  const verse = DAILY_VERSES[verseIndex];
  const fullText = `${verse.text}. Referência: ${verse.ref}.`;
  isSpeakingVerse = true;
  btn.classList.add('playing');
  toast.info('Lendo versículo do dia...');
  speak(fullText, {
    onEnd: () => {
      isSpeakingVerse = false;
      btn.classList.remove('playing');
    },
    onError: () => {
      isSpeakingVerse = false;
      btn.classList.remove('playing');
      toast.error('Não foi possível ler em voz alta');
    },
  });
}

/**
 * Se houver progresso de leitura salvo (fora do estado inicial), mostra um
 * card "Continue de onde parou" na Home com opções de continuar a
 * narrativa exatamente do versículo pausado ou recomeçar o capítulo do
 * início. Carregado à parte (sem bloquear o resto da Home) porque exige
 * buscar o nome do livro nos dados da Bíblia.
 */
async function renderContinueReadingCard(container) {
  const slot = qs('#continueReadingSlot', container);
  if (!slot) return;

  const progress = await progressRepository.getProgress();
  const hasProgress = !(progress.book === 0 && progress.chapter === 0 && progress.verse === 0);
  if (!hasProgress) return;

  let book;
  try {
    book = await getBook(progress.book);
  } catch (_e) {
    return; // dados indisponíveis — não quebra a Home por causa disso
  }
  // A Home pode ter sido trocada por outra tela enquanto isso carregava.
  if (!document.body.contains(slot)) return;

  const subtitle =
    progress.verse > 0
      ? `${book.name}, capítulo ${progress.chapter + 1} — narração pausada no versículo ${progress.verse + 1}`
      : `${book.name}, capítulo ${progress.chapter + 1}`;

  const card = el('div', { className: 'continue-reading-card' }, [
    el('div', { className: 'continue-reading-info' }, [
      el('h4', {}, 'Continue de onde parou'),
      el('p', {}, subtitle),
    ]),
    el('div', { className: 'continue-reading-actions' }, [
      el('button', { className: 'read-btn read-btn--primary', id: 'btnContinueReading' }, '▶ Continuar leitura'),
      el('button', { className: 'read-btn', id: 'btnRestartReading' }, '↺ Começar do início'),
    ]),
  ]);
  slot.appendChild(card);

  qs('#btnContinueReading', card).addEventListener('click', () => {
    if (progress.verse > 0) requestAutoStart(progress.verse);
    navigateTo(`/biblia/${progress.book}/${progress.chapter}`);
  });
  qs('#btnRestartReading', card).addEventListener('click', () => {
    progressRepository.saveProgress({ book: progress.book, chapter: progress.chapter, verse: 0 });
    navigateTo(`/biblia/${progress.book}/${progress.chapter}`);
  });
}

export const homePage = {
  render(container) {
    container.innerHTML = template();

    qs('#btnCopyVerse', container).addEventListener('click', () => copyVerse(container));
    qs('#btnBookmarkVerse', container).addEventListener('click', () => {
      toggleBookmark(DAILY_VERSES[verseIndex].ref);
      updateVerseDisplay(container);
    });
    qs('#btnShareVerse', container).addEventListener('click', shareVerse);
    qs('#btnNewVerse', container).addEventListener('click', () => {
      verseIndex = (verseIndex + 1) % DAILY_VERSES.length;
      updateVerseDisplay(container);
      toast.info('Novo versículo carregado');
    });
    qs('#btnVerseTTS', container).addEventListener('click', () => toggleVerseAudio(container));
    qs('#btnSeeAll', container).addEventListener('click', () => toast.info('Mais recursos em breve'));
    qs('#plan1', container).addEventListener('click', () => toast.info('Plano aberto: 30 Dias com Jesus'));
    qs('#plan2', container).addEventListener('click', () => toast.info('Plano aberto: Salmos de Conforto'));

    qsa('[data-route]', container).forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.route));
    });

    updateVerseDisplay(container);
    renderContinueReadingCard(container);

    // Cleanup: para a leitura do versículo do dia ao sair da Home.
    return () => {
      if (isSpeakingVerse) {
        stopSpeech();
        isSpeakingVerse = false;
      }
    };
  },
};
