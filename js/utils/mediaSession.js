// Plugin nativo de notificação do Capacitor.
// Mesmo padrão usado pelo TTS que já funciona no APK.
const MediaNotification = (() => {
  try {
    if (typeof window !== 'undefined' && window.Capacitor) {
      // Usa o mesmo mecanismo nativo já utilizado pelo TTS.
      return window.Capacitor.Plugins?.MediaNotification || null;
    }
  } catch (e) {
    console.warn('MediaNotification Capacitor indisponível:', e);
  }
  return null;
})();

async function syncNativeNotification(playing, title = 'Bíblia de Estudo', artist = 'Bíblia em Áudio') {
  if (!MediaNotification) return;
  try {
    await MediaNotification.update({
      title,
      artist,
      playing: !!playing
    });
  } catch (err) {
    console.warn('MediaNotification indisponível:', err);
  }
}

// Integração com a Media Session API: mostra controles de reprodução na
// tela de bloqueio / central de notificações do celular, e sinaliza ao
// navegador que a página está reproduzindo mídia — isso também ajuda o
// navegador a tratar a aba com menos agressividade quando ela vai para
// segundo plano (parte do que torna a reprodução em segundo plano mais
// confiável). Suporte: bom no Chrome/Edge/Android; parcial no Safari/iOS.
export function isMediaSessionSupported() {
  return 'mediaSession' in navigator;
}

export function setMediaSessionMetadata({ title, artist, album }) {
  if (!isMediaSessionSupported()) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Bíblia de Estudo',
      artist: artist || '',
      album: album || 'Bíblia de Estudo',
    });
  } catch (_err) {
    /* ignora */
  }
}

/** 'playing' | 'paused' | 'none' */
export function setMediaSessionPlaybackState(state) {
  if (isMediaSessionSupported()) {
    try {
      navigator.mediaSession.playbackState = state;
    } catch (_err) {
      /* ignora */
    }
  }

  syncNativeNotification(
    state === 'playing',
    'Bíblia de Estudo',
    'Bíblia em Áudio'
  );
}

/** Handlers ausentes/null desativam aquele botão de controle. */
export function setMediaSessionHandlers({ onPlay, onPause, onStop, onNext, onPrev } = {}) {
  if (!isMediaSessionSupported()) return;
  const set = (action, handler) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler || null);
    } catch (_err) {
      /* navegador pode não suportar essa ação específica */
    }
  };
  set('play', onPlay);
  set('pause', onPause);
  set('stop', onStop);
  set('nexttrack', onNext);
  set('previoustrack', onPrev);
}

export function clearMediaSession() {
  setMediaSessionHandlers({});
  setMediaSessionPlaybackState('none');
  if (isMediaSessionSupported()) {
    try {
      navigator.mediaSession.metadata = null;
    } catch (_err) {
      /* ignora */
    }
  }
}
