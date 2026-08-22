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
import { getBook, getChapter } from '../../data-access/bibleRepository.js';
import { progressRepository } from '../../data-access/progressRepository.js';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';
import { speak, stopSpeech, isSpeechSupported } from '../../utils/speech.js';
import { setHeaderTitle } from '../../state/header.js';
import { attachSelectionToolbar } from './selectionToolbar.js';
import { showVerseExplanation } from './verseExplanation.js';
import { openExternalExplanation } from '../../utils/externalExplain.js';
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
        <button class="tool-btn" id="btnPlayPause" title="Iniciar leitura">${icons.listen}<span id="btnPlayPauseLabel">Iniciar</span></button>
        <button class="tool-btn" id="btnStop" title="Parar leitura" disabled>${icons.stop}<span>Parar</span></button>
        <button class="tool-btn" id="btnFontMinus" aria-label="Diminuir fonte">A-</button>
        <button class="tool-btn" id="btnFontPlus" aria-label="Aumentar fonte">A+</button>
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
    const bookIndex = Number(params.book);
    const chapterIndex = Number(params.chapter);
    let settings = loadReaderSettings();

    container.innerHTML = '<div class="state-message">Carregando capítulo...</div>';

    let book, verses;
    try {
      [book, verses] = await Promise.all([getBook(bookIndex), getChapter(bookIndex, chapterIndex)]);
    } catch (err) {
      container.innerHTML = `<div class="state-message error">Capítulo não encontrado.</div>`;
      return;
    }

    container.innerHTML = template();
    setHeaderTitle(book.name);
    qs('#readSubtitle', container).textContent = `${book.name} — Capítulo ${chapterIndex + 1}`;

    const readContent = qs('#readContent', container);
    const verseEls = [];
    verses.forEach((text, idx) => {
      const p = el('p', { className: 'verse-line' }, [
        el('sup', { className: 'verse-num' }, String(idx + 1)),
        document.createTextNode(' ' + text),
      ]);
      p.style.fontSize = settings.fontSize + 'px';
      p.style.lineHeight = String(settings.lineHeight);
      p.addEventListener('click', () => {
        // Evita conflitar com uma seleção de texto (arrastar para
        // selecionar um trecho): só abre a explicação se não há seleção.
        if (window.getSelection().toString().length > 0) return;
        verseEls.forEach((v, i) => v.classList.toggle('selected', i === idx));
        showVerseExplanation({ bookIndex, bookName: book.name, chapterIndex, verseIndex: idx, verseText: text });
      });
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
      if (chapterIndex < book.chapterCount - 1) navigateTo(`/biblia/${bookIndex}/${chapterIndex + 1}`);
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
    qs('#btnFontMinus', container).addEventListener('click', () => {
      settings.fontSize = Math.max(MIN_FONT, settings.fontSize - 1);
      applySettings();
    });
    qs('#btnFontPlus', container).addEventListener('click', () => {
      settings.fontSize = Math.min(MAX_FONT, settings.fontSize + 1);
      applySettings();
    });

    // ---- Narrativa: iniciar / pausar / continuar / parar -----------------
    const playPauseBtn = qs('#btnPlayPause', container);
    const stopBtn = qs('#btnStop', container);

    let readingState = 'idle'; // 'idle' | 'playing' | 'paused'
    let readingIndex = hasResumableProgress ? savedProgress.verse : 0;

    if (!isSpeechSupported()) {
      playPauseBtn.disabled = true;
      playPauseBtn.title = 'Leitura por voz não é suportada neste navegador';
      toast.info('Este navegador não suporta leitura por voz.');
    }

    function updateControlsUI() {
      stopBtn.disabled = readingState === 'idle';
      playPauseBtn.classList.toggle('active-audio', readingState === 'playing');
      if (readingState === 'playing') {
        playPauseBtn.innerHTML = `${icons.pause}<span id="btnPlayPauseLabel">Pausar</span>`;
        playPauseBtn.title = 'Pausar leitura';
      } else if (readingState === 'paused') {
        playPauseBtn.innerHTML = `${icons.listen}<span id="btnPlayPauseLabel">Continuar</span>`;
        playPauseBtn.title = 'Continuar leitura';
      } else {
        const label = readingIndex > 0 ? 'Continuar' : 'Iniciar';
        playPauseBtn.innerHTML = `${icons.listen}<span id="btnPlayPauseLabel">${label}</span>`;
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

    function readLoop() {
      if (readingState !== 'playing') return;
      if (readingIndex >= verses.length) {
        onChapterFinished();
        return;
      }
      highlightVerse(readingIndex);
      const text = `Versículo ${readingIndex + 1}. ${verses[readingIndex]}`;
      speak(text, {
        onEnd: () => {
          if (readingState !== 'playing') return; // foi pausado/parado durante a fala
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
      readingState = 'idle';
      readingIndex = 0;
      clearHighlights();
      updateControlsUI();
      syncBackgroundPlayback(false);
      progressRepository.saveProgress({ book: bookIndex, chapter: chapterIndex, verse: 0 });

      const hasNextChapter = chapterIndex < book.chapterCount - 1;
      if (!hasNextChapter) {
        toast.success('Você concluiu o último capítulo deste livro.');
        speak('Você concluiu o último capítulo deste livro.', {});
        clearMediaSession();
        return;
      }

      const nextChapterHuman = chapterIndex + 2; // próximo capítulo, 1-based
      toast.info(`Avançando para ${book.name} capítulo ${nextChapterHuman}...`);
      const announcement = `Você concluiu ${book.name} capítulo ${chapterIndex + 1}. Agora vamos continuar com ${book.name} capítulo ${nextChapterHuman}.`;
      requestAutoStart(0);
      const goToNext = () => navigateTo(`/biblia/${bookIndex}/${chapterIndex + 1}`);
      speak(announcement, { onEnd: goToNext, onError: goToNext });
    }

    /** Início "novo" (não retomando uma pausa da mesma sessão): sempre
     * anuncia o livro e capítulo antes de começar a ler os versículos,
     * conforme pedido — vale tanto para o primeiro play quanto para
     * retomar uma leitura salva de uma sessão anterior. */
    function startFresh(fromVerse) {
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
      if (readingState !== 'paused') return;
      readingState = 'playing';
      updateControlsUI();
      syncBackgroundPlayback(true);
      readLoop();
    }

    function stopReading() {
      stopSpeech();
      readingState = 'idle';
      readingIndex = 0;
      clearHighlights();
      updateControlsUI();
      syncBackgroundPlayback(false);
      clearMediaSession();
      progressRepository.saveProgress({ book: bookIndex, chapter: chapterIndex, verse: 0 });
    }

    playPauseBtn.addEventListener('click', () => {
      if (readingState === 'idle') {
        startFresh(readingIndex); // readingIndex já é 0 ou o versículo salvo
      } else if (readingState === 'playing') {
        pauseReading();
      } else {
        continueReading();
      }
    });
    stopBtn.addEventListener('click', () => {
      stopReading();
      toast.info('Leitura parada');
    });

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
      const shareData = { title: `${book.name} ${chapterIndex + 1}`, text };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (_e) {
          /* usuário cancelou — sem erro */
        }
      } else if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          () => toast.success('Trecho copiado!'),
          () => toast.error('Não foi possível copiar')
        );
      } else {
        toast.info('Compartilhamento não suportado neste navegador');
      }
    }

    function handleExplainSelection(text) {
      openExternalExplanation(text);
      toast.info('Abrindo explicação em uma nova aba...');
    }

    function handleNarrateSelection(text) {
      // Não interrompe a narrativa do capítulo por engano: se estava
      // tocando, pausa (preservando o ponto) em vez de simplesmente cortar.
      if (readingState === 'playing') pauseReading();
      toast.info('Lendo trecho selecionado...');
      speak(text, { onError: () => toast.error('Não foi possível ler o trecho') });
    }

    const detachSelectionToolbar = attachSelectionToolbar(readContent, {
      onShare: handleShareSelection,
      onExplain: handleExplainSelection,
      onNarrate: handleNarrateSelection,
    });

    // Cleanup: para a leitura em voz alta, desliga wake lock/áudio
    // silencioso/media session, e remove os listeners de seleção de
    // texto ao sair da tela.
    return () => {
      stopSpeech();
      detachSelectionToolbar();
      detachWakeLockReacquire();
      releaseWakeLock();
      stopKeepAlive();
      clearMediaSession();
    };
  },
};
