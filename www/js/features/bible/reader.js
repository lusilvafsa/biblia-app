// Tela: leitura de um capítulo — texto, seleção de versículo, controles de
// fonte e narrativa em voz alta (TTS) com destaque do versículo atual.
//
// Sistema de narrativa (pausar/continuar/parar):
// A Web Speech API tem pause()/resume() nativos, mas eles são conhecidos
// por serem pouco confiáveis entre navegadores (especialmente Chrome no
// Android, onde a fala pode travar de vez após um pause()). Por isso, em
// vez de usar pause()/resume() nativos, a narrativa é lida um versículo
// por vez (já era assim) e "pausar" simplesmente para a fala atual sem
// avançar o índice do versículo — "continuar" retoma a partir do mesmo
// versículo em que parou. É uma granularidade de versículo, não de
// palavra exata, mas é 100% confiável em qualquer navegador, o que importa
// mais do que a precisão de retomar no meio exato de uma frase.
import { qs, el } from '../../utils/dom.js';
import { icons } from '../../components/icons.js';
import { toast } from '../../utils/toast.js';
import { navigateTo } from '../../router.js';
import { getBook, getChapter, getAllBooks } from '../../data-access/bibleRepository.js';
import { progressRepository } from '../../data-access/progressRepository.js';
import { aguardarAuthInicial } from '../../supabaseAuth.js';
import { statsRepository } from '../../data-access/statsRepository.js';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';
import { speak, stopSpeech, isSpeechSupported } from '../../utils/speech.js';
import { planProgressRepository } from '../../data-access/planProgressRepository.js';
import { getVoiceSettings, setVoiceSettings } from '../../state/voiceSettings.js';
import { setHeaderTitle } from '../../state/header.js';
import { attachSelectionToolbar } from './selectionToolbar.js';
import { showVerseExplanation } from './verseExplanation.js';
import { showChapterExplanation } from './chapterExplanation.js';
import { openExternalExplanation } from '../../utils/externalExplain.js';
import { shareText } from '../../utils/share.js';
import { shareElementAsImage } from '../../utils/nativeExport.js';
import { abrirImagemDoVersiculo } from '../../utils/verseImage.js';
import { supabase } from '../../supabaseClient.js';
import { usuarioAtual } from '../../supabaseAuth.js';
import { highlightRepository, HIGHLIGHT_COLORS } from '../../data-access/highlightRepository.js';
import { requestWakeLock, releaseWakeLock, setupWakeLockReacquire } from '../../utils/wakeLock.js';
import { startKeepAlive, stopKeepAlive } from '../../utils/keepAlive.js';
import {
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionHandlers,
  clearMediaSession,
} from '../../utils/mediaSession.js';

const DEFAULT_SETTINGS = { fontSize: 18, lineHeight: 1.8 };
const MIN_FONT = 12;
const MAX_FONT = 32;
const VERSE_PAUSE_MS = 450; // pausa natural entre versículos

// Sinaliza para a PRÓXIMA renderização do leitor que ela deve iniciar a
// narrativa automaticamente (usado no avanço automático de capítulo e em
// "Continuar leitura" a partir da Home). Módulo é singleton, então esse
// valor sobrevive à troca de rota; cada render() consome e limpa o valor.
let pendingAutoStart = null; // { verse: number } | null

export function requestAutoStart(verseIndex = 0) {
  pendingAutoStart = { verse: verseIndex };
}

function loadReaderSettings() {
  const saved = getItem(STORAGE_KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

function saveReaderSettings(settings) {
  setItem(STORAGE_KEYS.settings, settings);
}

function template() {
  return `
    <div class="read-header">
      <div class="read-subtitle" id="readSubtitle"></div>
      <div class="read-toolbar">
        <button class="tool-btn" id="btnPlayPause" title="Iniciar leitura" aria-label="Iniciar leitura">${icons.listen}</button>
        <button class="tool-btn" id="btnStop" title="Parar leitura" aria-label="Parar leitura" disabled>${icons.stop}</button>
        <button class="tool-btn speed-icon-only" id="btnSpeed" title="Velocidade da narração" aria-label="Velocidade da narração">
          ⚡ <span id="btnSpeedLabel" aria-hidden="true"></span>
        </button>
        <button class="tool-btn" id="btnSleep" title="Temporizador para dormir" aria-label="Temporizador para dormir">🌙</button>
        <button class="tool-btn" id="btnExplainChapter" title="Estudo do capitulo com IA" aria-label="Pedir estudo do capitulo ao Assistente">✨</button>
      </div>
    </div>
    <div id="readContent" class="read-content"></div>
    <div class="read-controls">
      <button class="read-btn" id="btnPrevChapter">◀ Anterior</button>
      <button class="read-btn" id="btnChapterList">Capítulos</button>
      <button class="read-btn" id="btnNextChapter">Próximo ▶</button>
    </div>
  `;
}

export const readerPage = {
  async render(container, params) {
    // Aguarda o Supabase restaurar a sessão antes de consultar ou salvar o progresso.
    await aguardarAuthInicial();

    const bookIndex = Number(params.book);
    const chapterIndex = Number(params.chapter);
    const requestedVerse = Number(params.verse);
    let settings = loadReaderSettings();

    container.innerHTML = '<div class="state-message">Carregando capítulo...</div>';

    let book, verses;
    try {
      [book, verses] = await Promise.all([getBook(bookIndex), getChapter(bookIndex, chapterIndex)]);
      statsRepository.registerActivityToday();
    } catch (err) {
      container.innerHTML = `<div class="state-message error">Capítulo não encontrado.</div>`;
      return;
    }

    container.innerHTML = template();
    setHeaderTitle(book.name);
    qs('#readSubtitle', container).textContent = `${book.name} — Capítulo ${chapterIndex + 1}`;

    const readContent = qs('#readContent', container);
    const verseEls = [];
    let showToolbarForVerse = null;
    // Títulos de passagem (opcionais): data/titles/<livro>.json
    let chapterTitles = {};
    try {
      window.__titlesCache = window.__titlesCache || {};
      if (!window.__titlesCache[bookIndex]) {
        const resp = await fetch('data/titles/' + bookIndex + '.json');
        window.__titlesCache[bookIndex] = resp.ok ? await resp.json() : {};
      }
      chapterTitles = window.__titlesCache[bookIndex][String(chapterIndex + 1)] || {};
    } catch (e) {
      chapterTitles = {};
    }
    verses.forEach((text, idx) => {
      const p = el('p', { className: 'verse-line' }, [
        el('sup', { className: 'verse-num' }, String(idx + 1)),
        document.createTextNode(' ' + text),
      ]);
      p.style.fontSize = settings.fontSize + 'px';
      p.style.lineHeight = String(settings.lineHeight);
      const savedColor = highlightRepository.get(bookIndex, chapterIndex, idx);
      if (savedColor) {
        const corInfo = HIGHLIGHT_COLORS.find((c) => c.id === savedColor);
        if (corInfo) p.style.background = corInfo.hex + '33';
      }
      p.addEventListener('click', () => {
        // Evita conflitar com uma seleção de texto (arrastar para
        // selecionar um trecho).
        if (window.getSelection().toString().length > 0) return;

        // Marca o versículo selecionado.
        verseEls.forEach((v, i) => {
          v.classList.toggle('selected', i === idx);
        });

        // Registra este versículo como lido.
        // O repositório evita contar o mesmo versículo duas vezes.
        statsRepository.markVerseRead(
          bookIndex,
          chapterIndex,
          idx
        );

        // Ao tocar no texto, apenas seleciona o versículo.
        readingIndex = idx;
        userSelectedVerse = idx;

        // Em vez de abrir a explicação direto, mostra a barra de ações
        // (a mesma usada ao selecionar um trecho), com um botão pra abrir
        // a explicação completa quando o usuário realmente quiser.
        if (showToolbarForVerse) {
          showToolbarForVerse(p.getBoundingClientRect(), text, {
            verseIndex: idx,
            openFullExplanation: () => showVerseExplanation({
              bookIndex,
              bookName: book.name,
              chapterIndex,
              verseIndex: idx,
              verseText: text,
              onHighlightChange: (colorId) => {
                if (colorId) {
                  const corInfo = HIGHLIGHT_COLORS.find((c) => c.id === colorId);
                  p.style.background = corInfo ? corInfo.hex + '33' : '';
                } else {
                  p.style.background = '';
                }
              }
            }),
          });
        }
      });
      if (chapterTitles[String(idx + 1)]) {
        const h = el('h3', { className: 'pericope-title' }, chapterTitles[String(idx + 1)]);
        h.style.cssText = 'margin:20px 0 6px;font-weight:700;color:var(--gold);font-size:' + Math.round(settings.fontSize * 0.95) + 'px;';
        readContent.appendChild(h);
      }
      readContent.appendChild(p);
      verseEls.push(p);
    });

    // Progresso salvo para ESTE capítulo específico: se existir um
    // versículo em andamento, o botão nasce oferecendo "Continuar" a
    // partir dali em vez de "Iniciar" do zero.
    const savedProgress = await progressRepository.getProgress();
    const hasResumableProgress =
      savedProgress.book === bookIndex && savedProgress.chapter === chapterIndex && savedProgress.verse > 0;

    progressRepository.saveProgress({
      book: bookIndex,
      chapter: chapterIndex,
      verse: hasResumableProgress ? savedProgress.verse : 0,
    });

    // Navegação entre capítulos
    const prevBtn = qs('#btnPrevChapter', container);
    const nextBtn = qs('#btnNextChapter', container);
    prevBtn.disabled = chapterIndex <= 0;
    nextBtn.disabled = chapterIndex >= book.chapterCount - 1;
    prevBtn.addEventListener('click', () => {
      if (chapterIndex > 0) navigateTo(`/biblia/${bookIndex}/${chapterIndex - 1}`);
    });
    nextBtn.addEventListener('click', () => {
      if (chapterIndex < book.chapterCount - 1) navigateTo(`/biblia/${bookIndex}/${chapterIndex + 1}/versiculo/0`);
    });
    qs('#btnChapterList', container).addEventListener('click', () => navigateTo(`/biblia/${bookIndex}`));

    // Ajuste de fonte / espaçamento (persistido)
    function applySettings() {
      verseEls.forEach((v) => {
        v.style.fontSize = settings.fontSize + 'px';
        v.style.lineHeight = String(settings.lineHeight);
      });
      saveReaderSettings(settings);
    }
    qs('#btnExplainChapter', container).addEventListener('click', () => showChapterExplanation({ bookName: book.name, chapterNumber: chapterIndex + 1 }));

    // ---- Narrativa: iniciar / pausar / continuar / parar -----------------
    const playPauseBtn = qs('#btnPlayPause', container);
    const stopBtn = qs('#btnStop', container);

    let readingState = 'idle'; // 'idle' | 'playing' | 'paused'

    const hasRequestedVerse =
      Number.isInteger(requestedVerse) &&
      requestedVerse >= 0 &&
      requestedVerse < verses.length;

    let readingIndex = hasRequestedVerse
      ? requestedVerse
      : (hasResumableProgress ? savedProgress.verse : 0);

    if (!isSpeechSupported()) {
      playPauseBtn.disabled = true;
      playPauseBtn.title = 'Leitura por voz não é suportada neste navegador';
      toast.info('Este navegador não suporta leitura por voz.');
    }

    function updateControlsUI() {
      stopBtn.disabled = readingState === 'idle';
      playPauseBtn.classList.toggle('active-audio', readingState === 'playing');
      if (readingState === 'playing') {
        playPauseBtn.innerHTML = `${icons.pause}`;
        playPauseBtn.setAttribute("aria-label", "Pausar leitura");
        playPauseBtn.title = 'Pausar leitura';
      } else if (readingState === 'paused') {
        playPauseBtn.innerHTML = `${icons.listen}`;
        playPauseBtn.setAttribute("aria-label", "Continuar leitura");
        playPauseBtn.title = 'Continuar leitura';
      } else {
        const label = readingIndex > 0 ? 'Continuar' : 'Iniciar';
        playPauseBtn.innerHTML = `${icons.listen}`;
        playPauseBtn.setAttribute("aria-label", label + " leitura");
        playPauseBtn.title = readingIndex > 0 ? 'Continuar leitura' : 'Iniciar leitura';
      }
    }

    function clearHighlights() {
      verseEls.forEach((v) => v.classList.remove('reading'));
    }

    function highlightVerse(idx) {
      verseEls.forEach((v, i) => v.classList.toggle('reading', i === idx));
      if (verseEls[idx]) verseEls[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setMediaSessionMetadata({
        title: `${book.name} ${chapterIndex + 1}:${idx + 1}`,
        artist: 'Narrativa em voz alta',
        album: 'Bíblia de Estudo',
      });
    }

    // Se o leitor foi aberto diretamente por um versículo,
    // posiciona a tela nesse versículo imediatamente.
    if (hasRequestedVerse) {
      requestAnimationFrame(() => {
        highlightVerse(readingIndex);
      });
    }

    // Mantém a leitura tocando em segundo plano (app minimizado) e com a
    // tela apagada: impede o apagar automático por inatividade (Wake
    // Lock), toca um áudio silencioso que sinaliza ao navegador que há
    // mídia em reprodução, e liga os controles de mídia na tela de
    // bloqueio. Nenhuma dessas técnicas garante 100% em todo aparelho —
    // é o melhor possível para um app web (sem instalar nada nativo).
    async function syncBackgroundPlayback(isPlaying) {
      if (isPlaying) {
        await requestWakeLock();
        await startKeepAlive();
        setMediaSessionPlaybackState('playing');
      } else {
        await releaseWakeLock();
        stopKeepAlive();
        setMediaSessionPlaybackState('paused');
      }
    }

    function persistVerseProgress() {
      progressRepository.saveProgress({ book: bookIndex, chapter: chapterIndex, verse: readingIndex });
    }

        // ============================================================
    // NARRAÇÃO NATIVA (APK): o serviço Android lê vários capítulos
    // seguidos sozinho, sem depender do JavaScript da tela.
    // ============================================================
    let nativeNarrationActive = false;
    let nativeSpokenVerse = -1;
    let userSelectedVerse = null;
    let nativeMap = []; // por item da lista nativa: { chapter, verse } (verse -1 = anúncio)
    const NATIVE_MAX_CHARS = 60000;
    const NATIVE_MAX_EXTRA_CHAPTERS = 10;

    function getNativeNarrator() {
      try {
        const cap = window.Capacitor;
        if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
          return (cap.Plugins && cap.Plugins.MediaNotification) || null;
        }
      } catch (e) { /* segue no modo web */ }
      return null;
    }

    function nativeCall(method) {
      try {
        const p = getNativeNarrator();
        if (p && p[method]) p[method]();
      } catch (e) { console.warn('Narração nativa:', method, e); }
    }

    function nativeStop() {
      window.__sleepTimer = null;
      if (window.__nativeNarr) window.__nativeNarr.active = false;
      if (!nativeNarrationActive) return;
      nativeNarrationActive = false;
      nativeCall('stop');
    }

    function nativeStartFailed(err) {
      console.error('Falha na narração nativa:', err);
      nativeNarrationActive = false;
      if (window.__nativeNarr) window.__nativeNarr.active = false;
      toast.error('Não foi possível iniciar a narração.');
      stopReading();
    }

    async function getBookTitles() {
      window.__titlesCache = window.__titlesCache || {};
      if (!window.__titlesCache[bookIndex]) {
        try {
          const r = await fetch('data/titles/' + bookIndex + '.json');
          window.__titlesCache[bookIndex] = r.ok ? await r.json() : {};
        } catch (e) {
          window.__titlesCache[bookIndex] = {};
        }
      }
      return window.__titlesCache[bookIndex];
    }

    async function buildNativeItems(fromVerse, skipIntro) {
      const items = skipIntro ? [] : ['Vamos iniciar a leitura de ' + book.name + ', capítulo ' + (chapterIndex + 1) + '.'];
      const map = skipIntro ? [] : [{ chapter: chapterIndex, verse: -1 }];
      let chars = skipIntro ? 0 : items[0].length;
      const titles = await getBookTitles();
      const lerTitulos = getVoiceSettings().readTitles !== false;
      const tCur = lerTitulos ? (titles[String(chapterIndex + 1)] || {}) : {};
      for (let i = fromVerse; i < verses.length; i++) {
        if (tCur[String(i + 1)]) {
          items.push(tCur[String(i + 1)]);
          map.push({ chapter: chapterIndex, verse: -1 });
          chars += tCur[String(i + 1)].length;
        }
        items.push('Versículo ' + (i + 1) + '. ' + verses[i]);
        map.push({ chapter: chapterIndex, verse: i });
        chars += verses[i].length + 14;
      }
      const lastChapter = book.chapterCount - 1;
      let ch = chapterIndex + 1;
      while (ch <= lastChapter && ch - chapterIndex <= NATIVE_MAX_EXTRA_CHAPTERS && chars < NATIVE_MAX_CHARS) {
        let vs;
        try { vs = await getChapter(bookIndex, ch); } catch (e) { break; }
        items.push('Você concluiu ' + book.name + ' capítulo ' + ch + '. Agora vamos continuar com ' + book.name + ' capítulo ' + (ch + 1) + '.');
        map.push({ chapter: ch, verse: -1 });
        const tNext = lerTitulos ? (titles[String(ch + 1)] || {}) : {};
        for (let i = 0; i < vs.length; i++) {
          if (tNext[String(i + 1)]) {
            items.push(tNext[String(i + 1)]);
            map.push({ chapter: ch, verse: -1 });
            chars += tNext[String(i + 1)].length;
          }
          items.push('Versículo ' + (i + 1) + '. ' + vs[i]);
          map.push({ chapter: ch, verse: i });
          chars += vs[i].length + 14;
        }
        ch++;
      }
      return { items: items, map: map };
    }

    function startNativeNarration(fromVerse, skipIntro) {
      const p = getNativeNarrator();
      if (!p || !p.startChapterNarration) return false;
      readingState = 'playing';
      readingIndex = fromVerse;
      nativeNarrationActive = true;
      window.__nativeNarr = { active: true, bookIndex: bookIndex, map: [], finishedPending: false, paused: false, follow: null };
      userSelectedVerse = null;
      updateControlsUI();
      const settings = getVoiceSettings() || {};
      buildNativeItems(fromVerse, skipIntro).then((built) => {
        if (!nativeNarrationActive) return; // parou antes de ficar pronto
        nativeMap = built.map;
        window.__nativeNarr.map = built.map;
        return p.startChapterNarration({
          title: book.name + ' ' + (chapterIndex + 1),
          artist: 'Bíblia de Estudo',
          verses: built.items,
          startIndex: 0,
          rate: Number(settings.rate) || 0.85,
          voiceName: settings.voiceURI || '',
        });
      }).catch(nativeStartFailed);
      return true;
    }

    // A tela acompanha o capítulo que o serviço está lendo.
    function nativeFollowChapter(ch, verse) {
      if (window.__nativeNarr) window.__nativeNarr.follow = ch;
      progressRepository.saveProgress({ book: bookIndex, chapter: ch, verse: Math.max(0, verse) });
      clearTimeout(window.__nativeNavTimer);
      window.__nativeNavTimer = setTimeout(() => {
        navigateTo('/biblia/' + bookIndex + '/' + ch + '/versiculo/' + Math.max(0, verse));
      }, 200);
    }

    function nativeVerseChanged(e) {
      if (!nativeNarrationActive) return;
      const n = Number(e.detail && e.detail.verseIndex);
      const m = nativeMap[n];
      if (!m) return;
      const prev = nativeMap[n - 1];
      if (prev && prev.verse >= 0) {
        statsRepository.markAudioVerse(bookIndex, prev.chapter, prev.verse);
      }
      if (prev && prev.verse >= 0 && m.chapter !== prev.chapter) {
        try { planProgressRepository.markChapterRead(bookIndex, prev.chapter); } catch (e) { /* plano é opcional */ }
      }
      if (m.chapter !== chapterIndex) {
        nativeFollowChapter(m.chapter, m.verse);
        return;
      }
      if (m.verse < 0) return; // anúncio
      readingIndex = m.verse;
      nativeSpokenVerse = m.verse;
      persistVerseProgress();
      highlightVerse(m.verse);
    }

    function nativeChapterComplete() {
      if (!nativeNarrationActive) return;
      const last = nativeMap[nativeMap.length - 1];
      if (last && last.verse >= 0) {
        statsRepository.markAudioVerse(bookIndex, last.chapter, last.verse);
      }
      if (last && last.chapter !== chapterIndex) {
        if (window.__nativeNarr) window.__nativeNarr.finishedPending = true;
        nativeFollowChapter(last.chapter, last.verse);
        return;
      }
      nativeNarrationActive = false;
      if (window.__nativeNarr) window.__nativeNarr.active = false;
      onChapterFinished();
    }

    // Se uma narração nativa já está em andamento neste livro, esta tela
    // (recém-aberta) continua acompanhando em vez de começar outra.
    (function adoptNativeNarration() {
      const s = window.__nativeNarr;
      if (!s || !s.active || s.bookIndex !== bookIndex) return;
      if (!s.map.some((m) => m.chapter === chapterIndex)) return;
      const seguindo = s.follow === chapterIndex;
      if (!seguindo && (hasRequestedVerse || s.paused)) return;
      s.follow = null;
      nativeNarrationActive = true;
      nativeMap = s.map;
      readingState = 'playing';
      updateControlsUI();
      if (s.finishedPending) {
        s.finishedPending = false;
        setTimeout(nativeChapterComplete, 0);
      }
    })();

    function readLoop() {
      if (nativeNarrationActive) return;
      if (readingState !== 'playing') return;
      if (readingIndex >= verses.length) {
        onChapterFinished();
        return;
      }
      highlightVerse(readingIndex);
      let text = `Versículo ${readingIndex + 1}. ${verses[readingIndex]}`;
      const tituloLido = (getVoiceSettings().readTitles !== false) ? chapterTitles[String(readingIndex + 1)] : null;
      if (tituloLido) text = tituloLido + '. ' + text;
      speak(text, {
        onEnd: () => {
          if (readingState !== 'playing') return; // foi pausado/parado durante a fala
          // Conta o versículo como áudio ouvido somente após
          // a narração daquele versículo terminar.
          statsRepository.markAudioVerse(
            bookIndex,
            chapterIndex,
            readingIndex
          );

          readingIndex++;
          persistVerseProgress();
          setTimeout(readLoop, VERSE_PAUSE_MS);
        },
        onError: () => {
          if (readingState !== 'playing') return;
          toast.error('A leitura em voz alta foi interrompida.');
          stopReading();
        },
      });
    }

    function onChapterFinished() {
      try { planProgressRepository.markChapterRead(bookIndex, chapterIndex); } catch (e) { /* plano é opcional */ }
      readingState = 'idle';
      readingIndex = 0;
      clearHighlights();
      updateControlsUI();
      syncBackgroundPlayback(false);
      progressRepository.saveProgress({ book: bookIndex, chapter: chapterIndex, verse: 0 });

      const hasNextChapter = chapterIndex < book.chapterCount - 1;
      if (hasNextChapter) {
        const nextChapterHuman = chapterIndex + 2; // próximo capítulo, 1-based
        toast.info(`Avançando para ${book.name} capítulo ${nextChapterHuman}...`);
        const announcement = `Você concluiu ${book.name} capítulo ${chapterIndex + 1}. Agora vamos continuar com ${book.name} capítulo ${nextChapterHuman}.`;
        requestAutoStart(0);
        const goToNext = () => navigateTo(`/biblia/${bookIndex}/${chapterIndex + 1}/versiculo/0`);
        speak(announcement, { onEnd: goToNext, onError: goToNext });
        return;
      }

      (async () => {
        let books;

        try {
          books = await getAllBooks();
        } catch (err) {
          console.error('Erro ao carregar a lista de livros:', err);
          toast.error('Não foi possível localizar o próximo livro.');
          clearMediaSession();
          return;
        }

        const nextBook = books[bookIndex + 1];

        if (!nextBook) {
          toast.success('Você concluiu o último livro da Bíblia.');
          speak('Você concluiu o último livro da Bíblia.', {});
          clearMediaSession();
          return;
        }

        toast.info(`Avançando para ${nextBook.name} capítulo 1...`);

        const announcement =
          `Você concluiu ${book.name}. Agora vamos continuar com ${nextBook.name}, capítulo 1.`;

        requestAutoStart(0);

        const goToNextBook = () =>
          navigateTo(`/biblia/${nextBook.index}/0/versiculo/0`);

        speak(announcement, {
          onEnd: goToNextBook,
          onError: goToNextBook,
        });
      })();
    }

    /** Início "novo" (não retomando uma pausa da mesma sessão): sempre
     * anuncia o livro e capítulo antes de começar a ler os versículos,
     * conforme pedido — vale tanto para o primeiro play quanto para
     * retomar uma leitura salva de uma sessão anterior. */
    function startFresh(fromVerse) {
      if (startNativeNarration(fromVerse)) return;
      readingState = 'playing';
      readingIndex = fromVerse;
      updateControlsUI();
      syncBackgroundPlayback(true);
      const announcement = `Vamos iniciar a leitura de ${book.name}, capítulo ${chapterIndex + 1}.`;
      speak(announcement, {
        onEnd: () => setTimeout(readLoop, 250),
        onError: () => setTimeout(readLoop, 250),
      });
    }

    function pauseReading() {
      if (nativeNarrationActive && readingState === 'playing') {
        nativeCall('pauseNarration');
        if (window.__nativeNarr) window.__nativeNarr.paused = true;
      }
      if (readingState !== 'playing') return;
      stopSpeech();
      readingState = 'paused';
      updateControlsUI();
      syncBackgroundPlayback(false);
      persistVerseProgress();
      toast.info('Leitura pausada');
    }

    /** Continuar dentro da MESMA sessão (após pausa) — não reanuncia o
     * capítulo, retoma direto no versículo em que parou. */
    function continueReading() {
      if (nativeNarrationActive && readingState === 'paused') {
        const alvo = userSelectedVerse;
        userSelectedVerse = null;
        if (alvo !== null && alvo !== nativeSpokenVerse && alvo >= 0 && alvo < verses.length) {
          startNativeNarration(alvo, true); // começa no versículo escolhido, sem repetir o anúncio
          return;
        }
        readingState = 'playing';
        if (window.__nativeNarr) window.__nativeNarr.paused = false;
        updateControlsUI();
        nativeCall('resumeNarration');
        return;
      }
      if (readingState !== 'paused') return;
      readingState = 'playing';
      updateControlsUI();
      syncBackgroundPlayback(true);
      readLoop();
    }

    function stopReading() {
      nativeStop();
      stopSpeech();
      readingState = 'idle';
      readingIndex = 0;
      clearHighlights();
      updateControlsUI();
      syncBackgroundPlayback(false);
      clearMediaSession();
      progressRepository.saveProgress({ book: bookIndex, chapter: chapterIndex, verse: 0 });
    }

    // Controle de versículo pela notificação do Android
    function changeNotificationVerse(delta) {
      if (nativeNarrationActive) return; // o serviço nativo controla os versículos
      if (!verses.length) return;

      // Interrompe imediatamente a fala do versículo atual.
      stopSpeech();

      // Calcula o novo versículo sem sair dos limites do capítulo.
      readingIndex = Math.max(
        0,
        Math.min(verses.length - 1, readingIndex + delta)
      );

      persistVerseProgress();
      highlightVerse(readingIndex);

      // Se estava lendo, começa imediatamente o novo versículo.
      if (readingState === 'playing') {
        readLoop();
      } else {
        updateControlsUI();
      }
    }

    // Controle de capítulo pela notificação do Android.
    function changeNotificationChapter(delta) {
      if (!book || !Number.isInteger(book.chapterCount)) return;

      const targetChapter = chapterIndex + delta;

      if (targetChapter < 0 || targetChapter >= book.chapterCount) return;

      const wasPlaying = readingState === 'playing';

      stopSpeech();
      readingIndex = 0;

      if (wasPlaying) {
        requestAutoStart(0);
      }

      progressRepository.saveProgress({
        book: bookIndex,
        chapter: targetChapter,
        verse: 0
      });

      navigateTo(`/biblia/${bookIndex}/${targetChapter}/versiculo/0`);
    }


    window.addEventListener('media-notification-prev', () => {
      changeNotificationVerse(-1);
    });

    window.addEventListener('media-notification-next', () => {
      changeNotificationVerse(1);
    });

    playPauseBtn.addEventListener('click', () => {
      if (readingState === 'idle') {
        startFresh(readingIndex); // readingIndex já é 0 ou o versículo salvo
      } else if (readingState === 'playing') {
        pauseReading();
      } else {
        continueReading();
      }
    });
    // Permite abrir diretamente um versículo vindo da tela Favoritos
    function openVerseFromFavorite(event) {
      const verseIndex = Number(event.detail?.verseIndex);

      if (!Number.isInteger(verseIndex)) return;
      if (verseIndex < 0 || verseIndex >= verseEls.length) return;

      readingIndex = verseIndex;
      userSelectedVerse = verseIndex;

      verseEls.forEach((verse, index) => {
        verse.classList.toggle('selected', index === verseIndex);
        verse.classList.remove('reading');
      });

      if (verseEls[verseIndex]) {
        verseEls[verseIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }

    window.addEventListener('open-verse', openVerseFromFavorite);

    // Controle de velocidade da narração
    const speedBtn = qs('#btnSpeed', container);
    const speedLabel = qs('#btnSpeedLabel', container);

    const speedOptions = [0.5, 0.75, 0.85, 1.0, 1.15, 1.25, 1.5];

    let speedMenu = null;

    function updateSpeedLabel() {
      const rate = Number(getVoiceSettings().rate) || 0.85;
      speedLabel.textContent = '';
      speedBtn.title = `Velocidade: ${rate}x`;
      speedBtn.setAttribute('aria-label', `Velocidade da narração: ${rate}x`);
    }

    function closeSpeedMenu() {
      if (speedMenu) {
        speedMenu.remove();
        speedMenu = null;
      }
    }

    function openSpeedMenu() {
      closeSpeedMenu();

      speedMenu = document.createElement('div');
      speedMenu.className = 'speed-selection-menu';

      const current = Number(getVoiceSettings().rate) || 0.85;

      speedOptions.forEach((rate) => {
        const option = document.createElement('button');

        option.type = 'button';
        option.className = 'speed-option';
        option.textContent = `${rate}x`;

        if (Math.abs(rate - current) < 0.01) {
          option.classList.add('selected');
        }

        option.addEventListener('click', (event) => {
          event.stopPropagation();

          setVoiceSettings({ rate });
          updateSpeedLabel();
          closeSpeedMenu();

          // Aplica imediatamente se estiver lendo
          if (readingState !== 'idle') {
            stopSpeech();
            startFresh(readingIndex);
          }
        });

        speedMenu.appendChild(option);
      });

      speedBtn.parentElement.appendChild(speedMenu);
    }

    speedBtn.addEventListener('click', (event) => {
      event.stopPropagation();

      if (speedMenu) {
        closeSpeedMenu();
      } else {
        openSpeedMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (
        speedMenu &&
        !speedMenu.contains(event.target) &&
        event.target !== speedBtn
      ) {
        closeSpeedMenu();
      }
    });

    updateSpeedLabel();

  updateSpeedLabel();

  // Temporizador para dormir: quem conta o tempo é o serviço nativo.
    const sleepBtn = qs('#btnSleep', container);
    let sleepMenu = null;
    const sleepOptions = [5, 15, 30, 45, 60];

    function sleepNativeCall(minutes) {
      try {
        const p = getNativeNarrator();
        if (p && p.setSleepTimer) {
          return Promise.resolve(p.setSleepTimer({ minutes: minutes }));
        }
      } catch (e) { console.warn('Temporizador:', e); }
      return Promise.reject(new Error('indisponível'));
    }

    function sleepRemaining() {
      const t = window.__sleepTimer;
      if (!t) return 0;
      const left = Math.ceil((t.endsAt - Date.now()) / 60000);
      if (left <= 0) { window.__sleepTimer = null; return 0; }
      return left;
    }

    function updateSleepBtn() {
      if (!sleepBtn) return;
      const left = sleepRemaining();
      sleepBtn.classList.toggle('active-audio', left > 0);
      sleepBtn.title = left > 0 ? 'Temporizador: faltam cerca de ' + left + ' min' : 'Temporizador para dormir';
    }

    function closeSleepMenu() {
      if (sleepMenu) { sleepMenu.remove(); sleepMenu = null; }
    }

    function applySleepTimer(minutes) {
      if (minutes > 0 && !nativeNarrationActive) {
        toast.info('Inicie a leitura para usar o temporizador.');
        return;
      }
      sleepNativeCall(minutes).then(() => {
        window.__sleepTimer = minutes > 0 ? { minutes: minutes, endsAt: Date.now() + minutes * 60000 } : null;
        updateSleepBtn();
        toast.info(minutes > 0 ? 'A leitura vai parar em ' + minutes + ' minutos' : 'Temporizador desativado');
      }).catch((err) => {
        console.warn('Temporizador:', err);
        toast.error('Não foi possível ativar o temporizador.');
      });
    }

    function openSleepMenu() {
      closeSleepMenu();
      if (typeof closeSpeedMenu === 'function') closeSpeedMenu();
      sleepMenu = document.createElement('div');
      sleepMenu.className = 'speed-selection-menu';
      const ativo = sleepRemaining() > 0 ? window.__sleepTimer.minutes : 0;
      sleepOptions.forEach((m) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'speed-option';
        option.textContent = m + ' min';
        if (m === ativo) option.classList.add('selected');
        option.addEventListener('click', (event) => {
          event.stopPropagation();
          applySleepTimer(m);
          closeSleepMenu();
        });
        sleepMenu.appendChild(option);
      });
      if (ativo > 0) {
        const off = document.createElement('button');
        off.type = 'button';
        off.className = 'speed-option';
        off.textContent = 'Desativar';
        off.addEventListener('click', (event) => {
          event.stopPropagation();
          applySleepTimer(0);
          closeSleepMenu();
        });
        sleepMenu.appendChild(off);
      }
      sleepBtn.parentElement.appendChild(sleepMenu);
    }

    if (sleepBtn) {
      sleepBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (sleepMenu) closeSleepMenu(); else openSleepMenu();
      });
      document.addEventListener('click', (event) => {
        if (sleepMenu && !sleepMenu.contains(event.target) && event.target !== sleepBtn) closeSleepMenu();
      });
      updateSleepBtn();
    }

    stopBtn.addEventListener('click', () => {
      stopReading();
      toast.info('Leitura parada');
    });

    // ============================================================
    // CONTROLES DA NOTIFICAÇÃO NATIVA DO ANDROID
    // ============================================================
    const nativeMediaPlay = () => {
      if (readingState === 'idle') {
        startFresh(readingIndex);
      } else if (readingState === 'paused') {
        continueReading();
      }
    };

    const nativeMediaPrevChapter = () => {
      changeNotificationChapter(-1);
    };

    const nativeMediaNextChapter = () => {
      changeNotificationChapter(1);
    };

    window.addEventListener('media-notification-prev-chapter', nativeMediaPrevChapter);
    window.addEventListener('media-notification-next-chapter', nativeMediaNextChapter);

    const nativeMediaPause = () => {
      if (readingState === 'playing') {
        pauseReading();
      }
    };

    const nativeMediaStop = () => {
      if (readingState !== 'idle') {
        stopReading();
      }
    };

    window.addEventListener('media-notification-play', nativeMediaPlay);
    window.addEventListener('media-notification-pause', nativeMediaPause);
    window.addEventListener('media-notification-stop', nativeMediaStop);
    window.addEventListener('media-notification-verse-changed', nativeVerseChanged);
    if (!window.__rateListener) {
      window.__rateListener = true;
      window.addEventListener('media-notification-rate-changed', (e) => {
        const r = Number(e.detail && e.detail.verseIndex) / 100;
        if (r >= 0.5 && r <= 2) setVoiceSettings({ rate: r });
      });
    }
    window.addEventListener('media-notification-chapter-complete', nativeChapterComplete);

    // Controles de mídia na tela de bloqueio / central de notificações.
    setMediaSessionHandlers({
      onPlay: () => {
        if (readingState === 'idle') startFresh(readingIndex);
        else if (readingState === 'paused') continueReading();
      },
      onPause: pauseReading,
      onStop: stopReading,
      onNext: () => {
        if (chapterIndex < book.chapterCount - 1) navigateTo(`/biblia/${bookIndex}/${chapterIndex + 1}`);
      },
      onPrev: () => {
        if (chapterIndex > 0) navigateTo(`/biblia/${bookIndex}/${chapterIndex - 1}`);
      },
    });

    // O navegador libera o wake lock sozinho quando a aba fica oculta;
    // readquire ao voltar, se a narrativa ainda estiver tocando.
    const detachWakeLockReacquire = setupWakeLockReacquire(() => readingState === 'playing');

    updateControlsUI();

    // Avanço automático (chegou aqui vindo do fim do capítulo anterior) ou
    // "Continuar leitura" disparado a partir da Home.
    if (pendingAutoStart) {
      const fromVerse = pendingAutoStart.verse;
      pendingAutoStart = null;
      if (isSpeechSupported()) startFresh(fromVerse);
    }

    // Seleção de texto: compartilhar / explicar / narrar o trecho selecionado
    async function handleShareSelection(text) {
      const resultado = await shareText({ title: `${book.name} ${chapterIndex + 1}`, text });
      if (resultado === 'copied') toast.success('Trecho copiado!');
      if (resultado === 'error') toast.error('Não foi possível copiar');
      if (resultado === 'unsupported') toast.info('Compartilhamento não suportado neste navegador');
    }

    function escaparHtmlSelecao(texto) {
      return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function formatarRespostaSelecao(texto) {
      return String(texto || '')
        .split(/\r?\n/)
        .filter((linha) => linha.trim().length > 0)
        .map((linha) => {
          const escapada = escaparHtmlSelecao(linha.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          return `<p>${escapada}</p>`;
        })
        .join('');
    }

    async function showQuickAiExplanation(text) {
      const overlay = document.createElement('div');
      overlay.className = 'verse-explain-overlay';
      overlay.innerHTML = `
        <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Explicação">
          <div class="verse-explain-handle"></div>
          <button class="verse-explain-close" aria-label="Fechar">${icons.close}</button>
          <div class="verse-explain-ref">✨ Explicação</div>
          <blockquote class="verse-explain-text">"${text}"</blockquote>
          <div id="quickAiResult"><p>Consultando o Assistente Bíblico...</p></div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
      overlay.querySelector('.verse-explain-close').addEventListener('click', () => overlay.remove());

      const resultEl = overlay.querySelector('#quickAiResult');

      try {
        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: {
            mensagem: `Explique este trecho da Bíblia: "${text}"`,
            tipo: 'trecho',
            chave: text.trim().toLowerCase().slice(0, 200),
          },
        });

        if (error || !data?.sucesso || !data?.mensagem) {
          throw new Error(data?.erro || error?.message || 'Sem resposta.');
        }

        resultEl.innerHTML = formatarRespostaSelecao(data.mensagem);
      } catch (_e) {
        resultEl.innerHTML = '<p>Não foi possível obter a explicação agora. Tente novamente.</p>';
      }
    }

    function handleExplainSelection(text) {
      showQuickAiExplanation(text);
    }
    function handleFullExplainSelection(text, context) {
      if (context && typeof context.openFullExplanation === 'function') {
        context.openFullExplanation();
      } else {
        toast.info('Toque em um único versículo para ver a explicação completa.');
      }
    }
    async function handlePrintSelection(text, context) {
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
    }

    async function handleImageSelection(text, context) {
      const referenciaImg = context && context.verseIndex !== undefined
        ? `${book.name} ${chapterIndex + 1}:${context.verseIndex + 1}`
        : `${book.name} ${chapterIndex + 1}`;
      try {
        await abrirImagemDoVersiculo({ texto: text, referencia: referenciaImg });
      } catch (err) {
        console.error('Imagem do versículo:', err);
        return handleImageSelectionLegacy(text, context);
      }
    }

    async function handleImageSelectionLegacy(text, context) {
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
    }

    const detachSelectionToolbar = attachSelectionToolbar(readContent, {
      onShare: handleShareSelection,
      onExplain: handleExplainSelection,
      onPrint: handlePrintSelection,
      onImage: handleImageSelection,
      onFullExplain: handleFullExplainSelection,
      onReady: (fn) => { showToolbarForVerse = fn; },
    });

    // Cleanup: para a leitura em voz alta, desliga wake lock/áudio
    // silencioso/media session, e remove os listeners de seleção de
    // texto ao sair da tela.
    return () => {
      stopSpeech();

      window.removeEventListener('media-notification-play', nativeMediaPlay);
      window.removeEventListener('media-notification-verse-changed', nativeVerseChanged);
      window.removeEventListener('media-notification-chapter-complete', nativeChapterComplete);
      window.removeEventListener('media-notification-prev-chapter', nativeMediaPrevChapter);
      window.removeEventListener('media-notification-next-chapter', nativeMediaNextChapter);
      window.removeEventListener('media-notification-pause', nativeMediaPause);
      window.removeEventListener('media-notification-stop', nativeMediaStop);

      detachSelectionToolbar();
      detachWakeLockReacquire();
      releaseWakeLock();
      stopKeepAlive();
      clearMediaSession();
    };
  },
};
