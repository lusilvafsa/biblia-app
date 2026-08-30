import { getVoiceSettings } from '../state/voiceSettings.js';

const synth = window.speechSynthesis || null;

// Plugin TTS fornecido pelo Capacitor no aplicativo nativo.
// No navegador normal, permanece indisponível e usamos o fallback web.
const TextToSpeech = (() => {
  try {
    if (
      typeof window !== 'undefined' &&
      window.Capacitor &&
      typeof window.Capacitor.registerPlugin === 'function'
    ) {
      return window.Capacitor.registerPlugin('TextToSpeech');
    }
  } catch (e) {
    console.warn('TTS Capacitor indisponível:', e);
  }
  return null;
})();

let ptVoice = null;
let allVoices = [];
let currentUtterance = null;
let speaking = false;
let nativeTTS = false;

const voicesListeners = new Set();

const isNative = () =>
  !!(window.Capacitor &&
     typeof window.Capacitor.isNativePlatform === 'function' &&
     window.Capacitor.isNativePlatform());

async function loadNativeVoices() {
  if (!isNative()) return [];

  try {
    const result = await TextToSpeech.getSupportedVoices();
    allVoices = result?.voices || [];

    if (allVoices.length > 0) {
      ptVoice =
        allVoices.find(v => (v.lang || '').toLowerCase() === 'pt-br') ||
        allVoices.find(v => (v.lang || '').toLowerCase().startsWith('pt')) ||
        allVoices[0];
    }

    nativeTTS = true;

    voicesListeners.forEach(fn => {
      try {
        fn(getAvailableVoices());
      } catch (_) {}
    });

    return allVoices;
  } catch (error) {
    console.warn('Erro ao carregar vozes nativas:', error);
    nativeTTS = true;
    return [];
  }
}

function pickWebVoices() {
  if (!synth) return;

  const voices = synth.getVoices();
  if (!voices || voices.length === 0) return;

  allVoices = voices;

  const ptBR = v =>
    (v.lang || '').toLowerCase() === 'pt-br';

  const pt = v =>
    (v.lang || '').toLowerCase().startsWith('pt');

  ptVoice =
    voices.find(ptBR) ||
    voices.find(pt) ||
    voices[0];

  voicesListeners.forEach(fn => {
    try {
      fn(getAvailableVoices());
    } catch (_) {}
  });
}

function containsWord(text, hint) {
  if (!text || !hint) return false;

  if (!/^[a-z]+$/i.test(hint)) {
    return text.toLowerCase().includes(hint.toLowerCase());
  }

  return new RegExp(`(?:^|[^a-z])${hint}(?:[^a-z]|$)`, 'i')
    .test(text);
}

const MALE_NAME_HINTS = [
  'daniel',
  'duarte',
  'felipe',
  'ricardo',
  'diego',
  'bruno',
  'rodrigo',
  'antonio',
  'joaquim',
  'paulo',
  'pedro',
  'carlos',
  'jorge',
  'miguel',
  'tiago',
  'thiago',
  'masculin'
];

const FEMALE_NAME_HINTS = [
  'maria',
  'luciana',
  'camila',
  'fernanda',
  'joana',
  'ines',
  'inês',
  'raquel',
  'helia',
  'hélia',
  'catarina',
  'femin'
];

export function guessVoiceGender(voice) {
  if (!voice) return 'unknown';

  const haystack =
    `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();

  const isFemale = FEMALE_NAME_HINTS.some(
    hint => haystack.includes(hint) || containsWord(haystack, 'female')
  );

  if (isFemale) return 'female';

  const isMale = MALE_NAME_HINTS.some(
    hint => haystack.includes(hint) || containsWord(haystack, 'male')
  );

  if (isMale) return 'male';

  return 'unknown';
}

export function getAvailableVoices() {
  const rank = v => {
    const lang = (v.lang || '').toLowerCase();
    const male = guessVoiceGender(v) === 'male';

    if (lang === 'pt-br') return male ? 0 : 1;
    if (lang.startsWith('pt')) return male ? 2 : 3;

    return 4;
  };

  return [...allVoices].sort((a, b) => rank(a) - rank(b));
}

export function onVoicesChanged(fn) {
  voicesListeners.add(fn);

  return () => voicesListeners.delete(fn);
}

export function findVoiceByGender(genderPreference) {
  if (!genderPreference) return ptVoice;

  const matches = v =>
    guessVoiceGender(v) === genderPreference;

  const isPtBR = v =>
    v.lang &&
    v.lang.toLowerCase() === 'pt-br';

  const isPt = v =>
    v.lang &&
    v.lang.toLowerCase().startsWith('pt');

  return (
    allVoices.find(v => isPtBR(v) && matches(v)) ||
    allVoices.find(v => isPt(v) && matches(v)) ||
    allVoices.find(v => matches(v)) ||
    ptVoice
  );
}

async function ensureReady() {
  if (isNative()) {
    if (!nativeTTS || allVoices.length === 0) {
      await loadNativeVoices();
    }

    return true;
  }

  if (synth) {
    pickWebVoices();
    return true;
  }

  return false;
}

export async function speak(
  text,
  { onStart, onEnd, onError } = {}
) {
  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return false;
  }

  const settings = getVoiceSettings() || {};

  const pitch = Number(settings.pitch ?? 1);
  const rate = Number(settings.rate ?? 1);
  const voiceURI = settings.voiceURI;

  try {
    await stopSpeech();
  } catch (_) {}

  // =========================
  // TTS NATIVO DO ANDROID
  // =========================
  if (isNative()) {
    try {
      await ensureReady();

      const lang =
        (settings.lang || 'pt-BR').toString();

      if (onStart) onStart();

      speaking = true;

      console.log('[TTS] falando:', {
        text: text.trim(),
        lang,
        rate,
        pitch
      });

      await TextToSpeech.speak({
        text: text.trim(),
        lang,
        rate,
        pitch,
        volume: 1,
        queueStrategy: 0
      });

      speaking = false;

      console.log('[TTS] fala concluída');

      if (onEnd) onEnd();

      return true;

    } catch (error) {
      speaking = false;

      console.error('[TTS] ERRO NATIVO:', error);

      if (onError) onError(error);

      return false;
    }
  }

  // =========================
  // FALLBACK PARA NAVEGADOR
  // =========================
  if (!synth) {
    const error = new Error(
      'TTS não suportado neste navegador'
    );

    if (onError) onError(error);

    return false;
  }

  try {
    pickWebVoices();

    const voice =
      allVoices.find(v => v.voiceURI === voiceURI) ||
      ptVoice;

    const utterance =
      new SpeechSynthesisUtterance(text.trim());

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || 'pt-BR';
    } else {
      utterance.lang = 'pt-BR';
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    currentUtterance = utterance;

    utterance.onstart = () => {
      speaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      speaking = false;
      currentUtterance = null;

      if (onEnd) onEnd();
    };

    utterance.onerror = error => {
      speaking = false;
      currentUtterance = null;

      if (
        error.error === 'canceled' ||
        error.error === 'interrupted'
      ) {
        return;
      }

      if (onError) onError(error);
      if (onEnd) onEnd();
    };

    synth.speak(utterance);

    return true;
  } catch (error) {
    speaking = false;

    if (onError) onError(error);

    return false;
  }
}

export async function stopSpeech() {
  speaking = false;
  currentUtterance = null;

  if (isNative()) {
    try {
      await TextToSpeech.stop();
    } catch (_) {}

    return;
  }

  if (synth) {
    try {
      synth.cancel();
    } catch (_) {}
  }
}

export function pauseSpeech() {
  if (!isNative() && synth) {
    try {
      synth.pause();
    } catch (_) {}
  }
}

export function resumeSpeech() {
  if (!isNative() && synth) {
    try {
      synth.resume();
    } catch (_) {}
  }
}

export function isSpeaking() {
  if (isNative()) {
    return speaking;
  }

  return !!(synth && synth.speaking);
}

export function isSpeechSupported() {
  return isNative() || !!synth;
}

// Inicialização
if (isNative()) {
  loadNativeVoices();
} else if (synth) {
  pickWebVoices();

  if ('onvoiceschanged' in synth) {
    synth.onvoiceschanged = pickWebVoices;
  }

  setTimeout(pickWebVoices, 1000);
  setTimeout(pickWebVoices, 3000);
}
