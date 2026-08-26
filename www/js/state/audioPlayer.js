/*
 * Estado e lógica do player de áudio da tela "Bíblia em Áudio".
 *
 * Ordem de reprodução:
 * MP3 -> TTS -> tom interno.
 *
 * Também integra a Media Session API para:
 * - controles na central de notificações;
 * - controles na tela de bloqueio;
 * - play / pause / stop;
 * - faixa anterior / próxima;
 * - título da faixa em reprodução.
 */

import { AUDIO_TRACKS } from '../../data/audioTracks.js';
import { formatTime } from '../utils/format.js';
import { speak, stopSpeech } from '../utils/speech.js';

import {
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionHandlers,
  clearMediaSession,
} from '../utils/mediaSession.js';

const listeners = new Set();

const state = {
  trackIndex: 0,
  isPlaying: false,
  mode: null, // 'mp3' | 'tts' | 'tone' | null
  currentTime: 0,
  duration: 0,
  statusText: 'Toque em ▶ para iniciar',
};

let audioEl = null;
let audioCtx = null;
let oscillator = null;
let toneProgressTimer = null;

function emit() {
  listeners.forEach((fn) => fn({ ...state }));
}

export function subscribeAudioPlayer(fn) {
  listeners.add(fn);
  fn({ ...state });
  return () => listeners.delete(fn);
}

function currentTrack() {
  return AUDIO_TRACKS[state.trackIndex];
}

function setStatus(text) {
  state.statusText = text;
  emit();
}

function updateMediaSessionMetadata() {
  const track = currentTrack();

  setMediaSessionMetadata({
    title: track?.title || 'Bíblia em Áudio',
    artist: 'Bíblia de Estudo',
    album: 'Bíblia em Áudio',
  });
}

function configureMediaSession() {
  setMediaSessionHandlers({
    onPlay: () => {
      if (!state.isPlaying) {
        playCurrentTrack();
      }
    },

    onPause: () => {
      if (state.isPlaying) {
        pauseCurrentTrack();
      }
    },

    onStop: () => {
      stopCurrentTrack();
    },

    onNext: () => {
      nextTrack();
    },

    onPrev: () => {
      prevTrack();
    },
  });
}

function ensureAudioEl() {
  if (audioEl) return audioEl;

  audioEl = new Audio();
  audioEl.crossOrigin = 'anonymous';

  audioEl.addEventListener('timeupdate', () => {
    state.currentTime = audioEl.currentTime;
    state.duration = audioEl.duration || 0;
    emit();
  });

  audioEl.addEventListener('loadedmetadata', () => {
    state.duration = audioEl.duration || 0;
    emit();
  });

  audioEl.addEventListener('ended', () => {
    state.isPlaying = false;
    state.currentTime = state.duration || 0;

    setMediaSessionPlaybackState('paused');

    setStatus('▶ Toque para ouvir novamente');
  });

  audioEl.addEventListener('error', () => {
    setStatus('MP3 indisponível, tentando leitura por voz...');
    playTts();
  });

  return audioEl;
}

function stopTone() {
  if (oscillator) {
    try {
      oscillator.stop();
    } catch (_e) {
      /* ignora */
    }

    oscillator = null;
  }

  if (toneProgressTimer) {
    clearInterval(toneProgressTimer);
    toneProgressTimer = null;
  }
}

function playTone() {
  stopTone();

  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;

    if (!Ctx) {
      setStatus('Áudio indisponível neste navegador');
      return;
    }

    audioCtx = new Ctx();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const gain = audioCtx.createGain();

  oscillator = audioCtx.createOscillator();

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.type = 'sine';

  oscillator.frequency.setValueAtTime(
    220,
    audioCtx.currentTime
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    440,
    audioCtx.currentTime + 2
  );

  gain.gain.setValueAtTime(
    0.15,
    audioCtx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 3
  );

  oscillator.start();

  oscillator.stop(
    audioCtx.currentTime + 3
  );

  state.mode = 'tone';
  state.isPlaying = true;
  state.currentTime = 0;
  state.duration = 3;

  updateMediaSessionMetadata();
  setMediaSessionPlaybackState('playing');
  configureMediaSession();

  setStatus(
    'Tocando tom interno (faixa de exemplo indisponível)'
  );

  let pct = 0;

  toneProgressTimer = setInterval(() => {
    pct += 0.1;

    state.currentTime = Math.min(pct, 3);

    emit();

    if (pct >= 3) {
      clearInterval(toneProgressTimer);
      toneProgressTimer = null;

      state.isPlaying = false;

      setMediaSessionPlaybackState('paused');

      setStatus('▶ Toque para ouvir novamente');

      emit();
    }
  }, 100);
}

function playTts() {
  stopTone();

  state.mode = 'tts';

  updateMediaSessionMetadata();
  configureMediaSession();
  setMediaSessionPlaybackState('playing');

  const track = currentTrack();

  const ok = speak(track.text, {
    onStart: () => {
      state.isPlaying = true;

      setMediaSessionPlaybackState('playing');

      setStatus('🗣️ Lendo em voz alta...');
    },

    onEnd: () => {
      state.isPlaying = false;

      setMediaSessionPlaybackState('paused');

      setStatus('✅ Leitura concluída');
    },

    onError: () => {
      setStatus(
        'Leitura por voz falhou, tentando tom interno...'
      );

      playTone();
    },
  });

  if (!ok) {
    playTone();
  }
}

export function playCurrentTrack() {
  const el = ensureAudioEl();

  const track = currentTrack();

  updateMediaSessionMetadata();
  configureMediaSession();

  el.src = track.src;

  setStatus('⏳ Iniciando...');

  const playPromise = el.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        state.mode = 'mp3';
        state.isPlaying = true;

        updateMediaSessionMetadata();
        setMediaSessionPlaybackState('playing');

        setStatus(`▶ ${track.title}`);

        emit();
      })
      .catch(() => {
        playTts();
      });
  }
}

function pauseCurrentTrack() {
  if (audioEl && state.mode === 'mp3') {
    audioEl.pause();
  }

  stopTone();
  stopSpeech();

  state.isPlaying = false;

  setMediaSessionPlaybackState('paused');

  setStatus('⏸ Pausado');

  emit();
}

function stopCurrentTrack() {
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }

  stopTone();
  stopSpeech();

  state.isPlaying = false;
  state.currentTime = 0;

  setMediaSessionPlaybackState('paused');

  setStatus('▶ Toque para iniciar');

  emit();
}

export function togglePlay() {
  if (state.isPlaying) {
    pauseCurrentTrack();
    return;
  }

  playCurrentTrack();
}

export function seekTo(fraction) {
  if (
    state.mode !== 'mp3' ||
    !audioEl ||
    !audioEl.duration
  ) {
    return false;
  }

  audioEl.currentTime =
    Math.max(0, Math.min(1, fraction)) *
    audioEl.duration;

  return true;
}

function loadTrack(index) {
  stopTone();
  stopSpeech();

  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }

  state.trackIndex =
    (index + AUDIO_TRACKS.length) %
    AUDIO_TRACKS.length;

  state.isPlaying = false;
  state.mode = null;
  state.currentTime = 0;
  state.duration = 0;

  updateMediaSessionMetadata();
  setMediaSessionPlaybackState('paused');
  configureMediaSession();

  setStatus('Toque em ▶ para iniciar');
}

export function nextTrack() {
  loadTrack(state.trackIndex + 1);
}

export function prevTrack() {
  loadTrack(state.trackIndex - 1);
}

export function getCurrentTrackMeta() {
  return currentTrack();
}

export function formatPlayerTime(seconds) {
  return formatTime(seconds);
}

/*
 * Para tudo — chamado ao sair da tela de áudio.
 */
export function teardownAudioPlayer() {
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }

  stopTone();
  stopSpeech();

  state.isPlaying = false;

  clearMediaSession();

  emit();
}

/*
 * Configuração inicial da Media Session.
 */
updateMediaSessionMetadata();
configureMediaSession();
