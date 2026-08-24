// Leitor de voz da Bíblia.
//
// No APK Android, usa o plugin nativo @capacitor-community/text-to-speech
// quando ele estiver disponível. Isso evita depender da Web Speech API do
// WebView, que pode carregar as vozes tarde ou falhar silenciosamente.
// Em navegador/GitHub Pages, continua usando speechSynthesis como fallback.

import { getVoiceSettings } from '../state/voiceSettings.js';

const nativeTts = (() => {
  try {
    return window.Capacitor?.Plugins?.TextToSpeech || null;
  } catch (_e) {
    return null;
  }
})();

const synth = nativeTts ? null : (window.speechSynthesis || null);

let ptVoice = null;
let allVoices = [];
let watchdogTimer = null;
let speakGeneration = 0;
const voicesListeners = new Set();

const MALE_NAME_HINTS = [
  'daniel', 'duarte', 'felipe', 'ricardo', 'diego', 'diogo', 'bruno',
  'rodrigo', 'antonio', 'antónio', 'joaquim', 'paulo', 'pedro', 'carlos',
  'jorge', 'miguel', 'tiago', 'thiago', 'masculin', 'male'
];
const FEMALE_NAME_HINTS = [
  'maria', 'luciana', 'camila', 'fernanda', 'joana', 'ines', 'inês',
  'raquel', 'helia', 'hélia', 'catarina', 'feminin', 'female'
];

function containsWord(text, hint) {
  if (!/^[a-z]+$/.test(hint)) return text.includes(hint);
  return new RegExp(`(?:^|[^a-z])${hint}(?:[^a-z]|$)`, 'i').test(text);
}

export function guessVoiceGender(voice) {
  if (!voice) return 'unknown';
  const haystack = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
  const isFemale = FEMALE_NAME_HINTS.some((hint) => haystack.includes(hint)) || containsWord(haystack, 'female');
  if (isFemale) return 'female';
  const isMale = MALE_NAME_HINTS.some((hint) => haystack.includes(hint)) || containsWord(haystack, 'male');
  if (isMale) return 'male';
  return 'unknown';
}

const isPtBR = (v) => (v?.lang || '').toLowerCase() === 'pt-br';
const isPt = (v) => (v?.lang || '').toLowerCase().startsWith('pt');
const isMale = (v) => guessVoiceGender(v) === 'male';

function rankVoice(v) {
  const male = isMale(v);
  if (isPtBR(v)) return male ? 0 : 1;
  if (isPt(v)) return male ? 2 : 3;
  return 4;
}

function notifyVoicesChanged() {
  const voices = getAvailableVoices();
  voicesListeners.forEach((fn) => {
    try { fn(voices); } catch (_e) { /* listener não deve quebrar o TTS */ }
  });
}

function chooseDefaultVoice(voices) {
  if (!voices.length) {
    ptVoice = null;
    return;
  }
  ptVoice =
    voices.find((v) => isPtBR(v) && isMale(v)) ||
    voices.find((v) => isPtBR(v)) ||
    voices.find((v) => isPt(v) && isMale(v)) ||
    voices.find((v) => isPt(v)) ||
    voices.find((v) => v.name && v.name.toLowerCase().includes('portugu')) ||
    voices[0];
}

function loadWebVoices() {
  if (!synth) return;
  const voices = synth.getVoices();
  if (!voices.length) return;
  allVoices = voices;
  chooseDefaultVoice(allVoices);
  notifyVoicesChanged();
}

async function loadNativeVoices() {
  if (!nativeTts?.getSupportedVoices) return;
  try {
    const result = await nativeTts.getSupportedVoices();
    const voices = Array.isArray(result?.voices) ? result.voices : [];
    allVoices = voices.filter((v) => v && v.lang);
    chooseDefaultVoice(allVoices);
    notifyVoicesChanged();
  } catch (_e) {
    // Se a lista nativa falhar, o speak() ainda pode funcionar com a voz
    // padrão do Android. Não bloqueamos a leitura por causa da lista.
  }
}

if (nativeTts) {
  loadNativeVoices();
  setTimeout(loadNativeVoices, 800);
  setTimeout(loadNativeVoices, 2500);
} else if (synth) {
  loadWebVoices();
  if ('onvoiceschanged' in synth) synth.onvoiceschanged = loadWebVoices;
  setTimeout(loadWebVoices, 500);
  setTimeout(loadWebVoices, 1500);
  setTimeout(loadWebVoices, 3000);
}

export function isSpeechSupported() {
  return !!nativeTts || !!synth;
}

export function getAvailableVoices() {
  return [...allVoices].sort((a, b) => rankVoice(a) - rankVoice(b));
}

export function onVoicesChanged(fn) {
  voicesListeners.add(fn);
  return () => voicesListeners.delete(fn);
}

function resolveVoice(voiceURI) {
  if (!voiceURI) return ptVoice;
  return allVoices.find((v) => v.voiceURI === voiceURI) || ptVoice;
}

export function findVoiceByGender(genderPreference) {
  return (
    allVoices.find((v) => isPtBR(v) && guessVoiceGender(v) === genderPreference) ||
    allVoices.find((v) => isPt(v) && guessVoiceGender(v) === genderPreference) ||
    allVoices.find((v) => guessVoiceGender(v) === genderPreference) ||
    null
  );
}

function getNativeVoiceIndex(voice) {
  if (!voice) return -1;
  const index = allVoices.findIndex((v) => v.voiceURI === voice.voiceURI);
  return index;
}

/**
 * Fala um texto usando o TTS nativo do Android quando o APK o disponibiliza,
 * ou a Web Speech API quando executado no navegador.
 */
export function speak(text, { onStart, onEnd, onError } = {}) {
  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return false;
  }

  const generation = ++speakGeneration;
  clearTimeout(watchdogTimer);

  // ---------------------------------------------------------------
  // Android/Capacitor: TTS nativo
  // ---------------------------------------------------------------
  if (nativeTts) {
    const { pitch, rate, voiceURI } = getVoiceSettings();
    const voice = resolveVoice(voiceURI);
    const lang = (voice?.lang || (isPtBR(ptVoice) ? ptVoice.lang : null) || 'pt-BR');
    const voiceIndex = voice ? getNativeVoiceIndex(voice) : -1;

    Promise.resolve()
      .then(() => nativeTts.stop?.())
      .catch(() => {})
      .then(() => {
        if (generation !== speakGeneration) return null;
        if (onStart) onStart();
        return nativeTts.speak({
          text: text.trim(),
          lang,
          rate: Number(rate) || 0.85,
          pitch: Number(pitch) || 1,
          volume: 1,
          voice: voiceIndex >= 0 ? voiceIndex : undefined,
          queueStrategy: 0,
        });
      })
      .then(() => {
        if (generation !== speakGeneration) return;
        if (onEnd) onEnd();
      })
      .catch((err) => {
        if (generation !== speakGeneration) return;
        if (onError) onError(err);
        if (onEnd) onEnd();
      });

    return true;
  }

  // ---------------------------------------------------------------
  // Navegador/GitHub Pages: Web Speech API
  // ---------------------------------------------------------------
  if (!synth) {
    if (onError) onError(new Error('TTS não suportado neste dispositivo')); 
    return false;
  }

  try { synth.cancel(); } catch (_e) { /* ignora */ }

  const { pitch, rate, voiceURI } = getVoiceSettings();
  const voice = resolveVoice(voiceURI);
  const utterance = new SpeechSynthesisUtterance(text.trim());
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || 'pt-BR';
  utterance.rate = Number(rate) || 0.85;
  utterance.pitch = Number(pitch) || 1;
  utterance.volume = 1;

  let hasStarted = false;
  utterance.onstart = () => {
    if (generation !== speakGeneration) return;
    hasStarted = true;
    if (onStart) onStart();
  };
  utterance.onend = () => {
    if (generation !== speakGeneration) return;
    if (onEnd) onEnd();
  };
  utterance.onerror = (e) => {
    if (generation !== speakGeneration) return;
    if (e?.error === 'canceled' || e?.error === 'interrupted') return;
    if (onError) onError(e);
    if (onEnd) onEnd();
  };

  setTimeout(() => {
    if (generation !== speakGeneration) return;
    try {
      synth.speak(utterance);
    } catch (err) {
      if (onError) onError(err);
      if (onEnd) onEnd();
      return;
    }

    watchdogTimer = setTimeout(() => {
      if (generation !== speakGeneration || hasStarted) return;
      try {
        if (!synth.speaking && !synth.pending) {
          synth.cancel();
          synth.speak(utterance);
        }
      } catch (_e) { /* ignora */ }
    }, 900);
  }, 80);

  return true;
}

export function stopSpeech() {
  ++speakGeneration;
  clearTimeout(watchdogTimer);
  if (nativeTts) {
    Promise.resolve(nativeTts.stop?.()).catch(() => {});
    return;
  }
  if (!synth) return;
  try { synth.cancel(); } catch (_e) { /* ignora */ }
}

// O leitor do capítulo usa stop/restart para pausar/continuar porque
// pause()/resume() do Web Speech é inconsistente em alguns Androids.
export function pauseSpeech() {
  if (nativeTts) return;
  if (synth) synth.pause();
}

export function resumeSpeech() {
  if (nativeTts) return;
  if (synth) synth.resume();
}

export function isSpeaking() {
  if (nativeTts) return false; // o plugin não expõe um estado síncrono confiável
  return !!synth && synth.speaking;
}
