// Página Home: versículo do dia, sequência, acesso rápido e planos de leitura.
import { qs, qsa, el } from '../../utils/dom.js';
import { icons } from '../../components/icons.js';
import { toast } from '../../utils/toast.js';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';
import { speak, stopSpeech } from '../../utils/speech.js';
import { navigateTo } from '../../router.js';
import { ALL_VERSES as DAILY_VERSES, verseIndexForDate } from '../../utils/verseOfDay.js';
import { getReadingPlan } from '../../../data/readingPlans.js';
import { PRAYERS } from '../../../data/prayers.js';
import { abrirImagemDoVersiculo } from '../../utils/verseImage.js';
import { shareText } from '../../utils/share.js';
import { progressRepository } from '../../data-access/progressRepository.js';
import { planProgressRepository } from '../../data-access/planProgressRepository.js';
import { getBook, getChapter } from '../../data-access/bibleRepository.js';
import { statsRepository } from '../../data-access/statsRepository.js';
import { getTodaysSong } from '../../../data/worshipSongs.js';
import { requestAutoStart } from '../bible/reader.js';
import { aguardarAuthInicial } from '../../supabaseAuth.js';

let verseIndex = verseIndexForDate();
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

function planCardData(planId) {
  const plan = getReadingPlan(planId);
  const total = plan.dias.length;
  const feitos = planProgressRepository.getDoneDays(planId).length;
  const percent = total ? Math.round((feitos / total) * 100) : 0;
  return { plan, total, feitos, percent };
}

const ICONE_IMAGEM = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';

function copiarTexto(texto, mensagem) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(
      () => toast.success(mensagem),
      () => fallbackCopy(texto)
    );
  } else {
    fallbackCopy(texto);
  }
}

async function compartilharTexto(texto, titulo) {
  const r = await shareText({ title: titulo, text: texto });
  if (r === 'copied') toast.success('Texto copiado!');
  if (r === 'unsupported') toast.info('Compartilhamento não suportado neste aparelho');
  if (r === 'error') toast.error('Não foi possível compartilhar agora.');
}

function imagemDoTexto(texto, referencia) {
  abrirImagemDoVersiculo({ texto: texto, referencia: referencia })
    .catch(() => toast.error('Não foi possível gerar a imagem agora.'));
}

let prayerIndex = null;

function getTodaysPrayer() {
  if (prayerIndex === null) {
    const hoje = new Date();
    const dia = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 86400000);
    prayerIndex = dia % PRAYERS.length;
  }
  return PRAYERS[prayerIndex];
}

function template() {
  const oracao = getTodaysPrayer();
  const streak = statsRepository.getStreak();
  const song = getTodaysSong();
  const verse = DAILY_VERSES[verseIndex];
  const plan1 = planCardData('trinta-dias-com-jesus');
  const plan2 = planCardData('salmos-de-conforto');
  return `
    <div class="hero-card">
      <img src="assets/hero.webp" alt="" aria-hidden="true" decoding="async">
      <div class="hero-overlay"></div>
    </div>

    <div id="continueReadingSlot"></div>


    <div class="verse-card">
      <div class="verse-label">${icons.prayer} Oração do Dia</div>
      <div class="verse-text" id="prayerText">${oracao.text}</div>
      <div class="verse-ref" id="prayerTitle">${oracao.title}</div>
      <div class="verse-actions">
        <button class="icon-btn" id="btnCopyPrayer" title="Copiar" aria-label="Copiar oração">${icons.copy}</button>
        <button class="icon-btn" id="btnSharePrayer" title="Compartilhar" aria-label="Compartilhar oração">${icons.share}</button>
        <button class="icon-btn" id="btnImagePrayer" title="Compartilhar como imagem" aria-label="Compartilhar oração como imagem">${ICONE_IMAGEM}</button>
        <button class="icon-btn" id="btnNewPrayer" title="Outra oração" aria-label="Carregar outra oração">${icons.refresh}</button>
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <button type="button" class="prayer-amen" id="btnPrayAmenHome">${icons.check} Orar Amém</button>
        <button type="button" class="prayer-amen" id="btnAllPrayers">Ver todas</button>
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
        <button class="icon-btn" id="btnShareVerseImage" title="Compartilhar como imagem" aria-label="Compartilhar versículo como imagem"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></button>
        <button class="icon-btn" id="btnNewVerse" title="Novo versículo" aria-label="Carregar novo versículo">${icons.refresh}</button>
      </div>
    </div>

    <div id="psalmOfDaySlot"></div>

    <div class="section-title">Louvor do Dia</div>
    <div class="prayer-card">
      <h4>🎵 ${song.title}</h4>
      <p class="verse-text" style="margin-bottom:0; color:var(--text-primary); font-size:19px; line-height:1.65;">${song.artist}</p>
      <button type="button" class="prayer-amen" id="btnPlaySong">▶ Ouvir no YouTube</button>
    </div>

    <div class="streak-banner">
      <div class="streak-flame">${icons.bible}</div>
      <div class="streak-info">
        <h4>Sequência de ${streak} ${streak === 1 ? 'dia' : 'dias'}</h4>
        <p>${streak > 0 ? 'Continue lendo para manter sua sequência' : 'Leia hoje para começar uma sequência'}</p>
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

    <div class="section-title">
      Planos de Leitura
      <button class="see-all" id="btnSeeAllPlans">Ver todos</button>
    </div>
    <button class="plan-card" id="plan1">
      <div class="plan-icon-box">${icons.planBook}</div>
      <div class="plan-info"><h4>${plan1.plan.titulo}</h4><p>Dia ${plan1.feitos} de ${plan1.total}</p></div>
      <div class="plan-progress">${plan1.percent}%</div>
    </button>
    <button class="plan-card" id="plan2">
      <div class="plan-icon-box">${icons.planBook}</div>
      <div class="plan-info"><h4>${plan2.plan.titulo}</h4><p>Dia ${plan2.feitos} de ${plan2.total}</p></div>
      <div class="plan-progress">${plan2.percent}%</div>
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

function getTodaysPsalmChapter() {
  const inicioDoAno = new Date(new Date().getFullYear(), 0, 0);
  const diffMs = new Date() - inicioDoAno;
  const diaDoAno = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diaDoAno % 150; // Salmos tem 150 capítulos, índice 0-149
}

async function renderPsalmOfDay(container) {
  const slot = qs('#psalmOfDaySlot', container);
  if (!slot) return;

  let chapterIndex = getTodaysPsalmChapter();

  async function mostrar() {
    try {
      const verses = await getChapter(18, chapterIndex); // 18 = Salmos
      if (!document.body.contains(slot)) return;
      const ref = `Salmos ${chapterIndex + 1}:1`;
      const texto = verses[0];
      slot.innerHTML = `
        <div class="section-title">Salmo do Dia</div>
        <div class="prayer-card">
          <div id="btnOpenPsalm" style="cursor:pointer;">
            <h4>📖 Salmos ${chapterIndex + 1}</h4>
            <p class="verse-text" style="margin-bottom:16px; color:var(--text-primary); font-size:19px; line-height:1.65;">${texto}</p>
          </div>
          <div class="verse-actions">
            <button class="icon-btn" id="btnCopyPsalm" title="Copiar" aria-label="Copiar salmo">${icons.copy}</button>
            <button class="icon-btn" id="btnBookmarkPsalm" title="Favoritar" aria-label="Favoritar salmo">${icons.bookmark}</button>
            <button class="icon-btn" id="btnSharePsalm" title="Compartilhar" aria-label="Compartilhar salmo">${icons.share}</button>
            <button class="icon-btn" id="btnImagePsalm" title="Compartilhar como imagem" aria-label="Compartilhar salmo como imagem">${ICONE_IMAGEM}</button>
            <button class="icon-btn" id="btnNewPsalm" title="Outro salmo" aria-label="Carregar outro salmo">${icons.refresh}</button>
          </div>
        </div>
      `;
      const marcador = qs('#btnBookmarkPsalm', slot);
      marcador.style.color = isBookmarked(ref) ? 'var(--gold)' : '';
      qs('#btnOpenPsalm', slot).addEventListener('click', () => {
        navigateTo(`/biblia/18/${chapterIndex}/versiculo/0`);
      });
      qs('#btnCopyPsalm', slot).addEventListener('click', () => copiarTexto(texto + ' — ' + ref, 'Salmo copiado!'));
      marcador.addEventListener('click', () => {
        toggleBookmark(ref);
        marcador.style.color = isBookmarked(ref) ? 'var(--gold)' : '';
      });
      qs('#btnSharePsalm', slot).addEventListener('click', () => compartilharTexto(texto + ' — ' + ref, 'Bíblia de Estudo'));
      qs('#btnImagePsalm', slot).addEventListener('click', () => imagemDoTexto(texto, ref));
      qs('#btnNewPsalm', slot).addEventListener('click', async () => {
        chapterIndex = (chapterIndex + 1) % 150;
        await mostrar();
        toast.info('Novo salmo carregado');
      });
    } catch (_e) {
      // dado indisponível — não quebra a Home por causa disso
    }
  }

  await mostrar();
}

async function renderContinueReadingCard(container) {
  const slot = qs('#continueReadingSlot', container);
  if (!slot) return;

  await aguardarAuthInicial();
  if (!document.body.contains(slot)) return;

  const progress = await progressRepository.getProgress();
  const hasProgress = !(progress.book === 0 && progress.chapter === 0 && progress.verse === 0);
  if (!hasProgress) return;

  let book;
  try {
    book = await getBook(progress.book);
  } catch (_e) {
    return;
  }
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
    navigateTo(
      `/biblia/${progress.book}/${progress.chapter}/versiculo/${progress.verse}`
    );
  });
  qs('#btnRestartReading', card).addEventListener('click', async () => {
    await progressRepository.saveProgress({
        book: 0,
        chapter: 0,
        verse: 0
    });

    navigateTo('/biblia/0/0/versiculo/0');
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
    const btnImgVerse = qs('#btnShareVerseImage', container);
    if (btnImgVerse) {
      btnImgVerse.addEventListener('click', () => {
        const texto = (qs('#verseText', container).textContent || '').trim();
        const ref = (qs('#verseRef', container).textContent || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
        abrirImagemDoVersiculo({ texto: texto, referencia: ref })
          .catch(() => toast.error('Não foi possível gerar a imagem agora.'));
      });
    }
    qs('#btnNewVerse', container).addEventListener('click', () => {
      verseIndex = (verseIndex + 1) % DAILY_VERSES.length;
      updateVerseDisplay(container);
      toast.info('Novo versículo carregado');
    });
    qs('#btnVerseTTS', container).addEventListener('click', () => toggleVerseAudio(container));
    qs('#btnSeeAll', container).addEventListener('click', () => toast.info('Mais recursos em breve'));
    qs('#plan1', container).addEventListener('click', () => navigateTo('/planos/trinta-dias-com-jesus'));
    qs('#plan2', container).addEventListener('click', () => navigateTo('/planos/salmos-de-conforto'));
    qs('#btnSeeAllPlans', container).addEventListener('click', () => navigateTo('/planos'));
    const btnAmen = qs('#btnPrayAmenHome', container);
    if (btnAmen) {
      btnAmen.addEventListener('click', () => {
        statsRepository.incrementPrayerCount();
        btnAmen.classList.add('prayed');
        btnAmen.innerHTML = `${icons.check} Amém orado`;
        btnAmen.disabled = true;
        toast.success('Oração registrada');
      });
    }
    const btnTodas = qs('#btnAllPrayers', container);
    if (btnTodas) btnTodas.addEventListener('click', () => navigateTo('/oracao'));
    const textoOracao = () => (qs('#prayerText', container).textContent || '').trim();
    const tituloOracao = () => (qs('#prayerTitle', container).textContent || '').trim();
    qs('#btnCopyPrayer', container).addEventListener('click', () => copiarTexto(textoOracao() + ' — ' + tituloOracao(), 'Oração copiada!'));
    qs('#btnSharePrayer', container).addEventListener('click', () => compartilharTexto(textoOracao() + ' — ' + tituloOracao(), 'Bíblia de Estudo'));
    qs('#btnImagePrayer', container).addEventListener('click', () => imagemDoTexto(textoOracao(), tituloOracao()));
    qs('#btnNewPrayer', container).addEventListener('click', () => {
      prayerIndex = ((prayerIndex === null ? 0 : prayerIndex) + 1) % PRAYERS.length;
      const p = PRAYERS[prayerIndex];
      qs('#prayerText', container).textContent = p.text;
      qs('#prayerTitle', container).textContent = p.title;
      const amen = qs('#btnPrayAmenHome', container);
      if (amen) {
        amen.disabled = false;
        amen.classList.remove('prayed');
        amen.innerHTML = `${icons.check} Orar Amém`;
      }
      toast.info('Outra oração carregada');
    });
    qs('#btnPlaySong', container).addEventListener('click', () => {
      const s = getTodaysSong();
      const busca = encodeURIComponent(`${s.title} ${s.artist} louvor`);
      window.open(`https://www.youtube.com/results?search_query=${busca}`, '_blank');
    });

    qsa('[data-route]', container).forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.route));
    });

    updateVerseDisplay(container);
    renderContinueReadingCard(container);
    renderPsalmOfDay(container);

    return () => {
      if (isSpeakingVerse) {
        stopSpeech();
        isSpeakingVerse = false;
      }
    };
  },
};
