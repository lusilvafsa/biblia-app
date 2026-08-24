// Wrapper único sobre a Web Speech API (speechSynthesis).
// Centraliza a seleção de voz em português e os contornos de bugs conhecidos
// de iOS/Chrome (cancelar antes de falar, pequeno atraso antes de speak(),
// e nova tentativa se a fala não iniciar). Tanto o player de áudio quanto a
// leitura de capítulos da Bíblia usam este módulo, então nunca há duas
// falas simultâneas concorrendo pela mesma voz. O tom, a velocidade e a
// voz escolhida vêm de state/voiceSettings.js (editável em Configurações).

import { getVoiceSettings } from '../state/voiceSettings.js';

const synth = window.speechSynthesis || null;

let ptVoice = null;
let allVoices = [];
let currentUtterance = null;
let watchdogTimer = null;
const voicesListeners = new Set();

// A Web Speech API não expõe o gênero da voz — só dá pra estimar pelo nome.
// Cobre os nomes de voz em português mais comuns no Windows/Edge, macOS/iOS
// e Android/Chrome. Em muitos aparelhos Android/Chrome (sobretudo com o
// motor de TTS do Google), as vozes vêm com nome totalmente genérico, tipo
// "português do Brasil", sem nenhuma pista de gênero — nesse caso a
// detecção automática não tem como funcionar, e a tela de Configurações
// orienta o usuário a testar as vozes manualmente.
const MALE_NAME_HINTS = ['daniel', 'duarte', 'felipe', 'ricardo', 'diego', 'diogo', 'bruno', 'rodrigo', 'antonio', 'antónio', 'joaquim', 'paulo', 'pedro', 'carlos', 'jorge', 'miguel', 'tiago', 'thiago', 'masculin'];
const FEMALE_NAME_HINTS = ['maria', 'luciana', 'camila', 'fernanda', 'joana', 'ines', 'inês', 'raquel', 'helia', 'hélia', 'catarina', 'feminin'];

/** Testa se `text` contém `hint` como palavra isolada (evita, por exemplo,
 * que "female" seja confundido com "male" por conter esse trecho). */
function containsWord(text, hint) {
  if (!/^[a-z]+$/.test(hint)) return text.includes(hint); // hints com acento: substring simples
  return new RegExp(`(?:^|[^a-z])${hint}(?:[^a-z]|$)`, 'i').test(text);
}

/** Estima o gênero de uma voz pelo nome/identificador (heurística, sem
 * garantia). Verifica "female" antes de "male" para não classificar como
 * masculina uma voz cujo nome contenha a palavra "female" (que contém
 * "male" como substring). */
export function guessVoiceGender(voice) {
  if (!voice) return 'unknown';
  const haystack = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
  const isFemale = FEMALE_NAME_HINTS.some((hint) => haystack.includes(hint)) || containsWord(haystack, 'female');
  if (isFemale) return 'female';
  const isMale = MALE_NAME_HINTS.some((hint) => haystack.includes(hint)) || containsWord(haystack, 'male');
  if (isMale) return 'male';
  return 'unknown';
}

function pickVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  if (voices.length === 0) return;
  allVoices = voices;

  const isPtBR = (v) => v.lang && v.lang.toLowerCase() === 'pt-br';
  const isPt = (v) => v.lang && v.lang.toLowerCase().startsWith('pt');
  const isMale = (v) => guessVoiceGender(v) === 'male';

  // Preferência por padrão: voz masculina em português do Brasil. Se o
  // dispositivo não tiver nenhuma, cai para a melhor opção em português
  // disponível. O usuário pode sempre escolher manualmente em Configurações.
  ptVoice =
    voices.find((v) => isPtBR(v) && isMale(v)) ||
    voices.find((v) => isPtBR(v)) ||
    voices.find((v) => isPt(v) && isMale(v)) ||
    voices.find((v) => isPt(v)) ||
    voices.find((v) => v.name && v.name.toLowerCase().includes('portugu')) ||
    voices[0];

  voicesListeners.forEach((fn) => fn(getAvailableVoices()));
}

if (synth) {
  pickVoice();
  if ('onvoiceschanged' in synth) synth.onvoiceschanged = pickVoice;
  // Alguns navegadores carregam a lista de vozes de forma assíncrona/tardia.
  setTimeout(pickVoice, 1000);
  setTimeout(pickVoice, 3000);
}

export function isSpeechSupported() {
  return !!synth;
}

/**
 * Lista de vozes disponíveis no navegador, priorizando português do Brasil
 * e, dentro dele, vozes masculinas primeiro (mesma preferência usada na
 * escolha automática). Usado pela tela de Configurações para montar o
 * seletor de voz.
 */
export function getAvailableVoices() {
  const rank = (v) => {
    const lang = (v.lang || '').toLowerCase();
    const male = guessVoiceGender(v) === 'male';
    if (lang === 'pt-br') return male ? 0 : 1;
    if (lang.startsWith('pt')) return male ? 2 : 3;
    return 4;
  };
  return [...allVoices].sort((a, b) => rank(a) - rank(b));
}

/** Chama `fn` sempre que a lista de vozes do navegador for (re)carregada. */
export function onVoicesChanged(fn) {
  voicesListeners.add(fn);
  return () => voicesListeners.delete(fn);
}

function resolveVoice(voiceURI) {
  if (!voiceURI) return ptVoice;
  return allVoices.find((v) => v.voiceURI === voiceURI) || ptVoice;
}

/**
 * Procura uma voz específica que combine com a preferência de gênero
 * informada ('male' | 'female'), priorizando português do Brasil. Usado
 * pelo seletor rápido "Masculina / Feminina / Automática" em Configurações.
 * Retorna null se nenhuma voz correspondente existir neste navegador.
 */
export function findVoiceByGender(genderPreference) {
  const isPtBR = (v) => v.lang && v.lang.toLowerCase() === 'pt-br';
  const isPt = (v) => v.lang && v.lang.toLowerCase().startsWith('pt');
  const matches = (v) => guessVoiceGender(v) === genderPreference;
  return (
    allVoices.find((v) => isPtBR(v) && matches(v)) ||
    allVoices.find((v) => isPt(v) && matches(v)) ||
    allVoices.find((v) => matches(v)) ||
    null
  );
}

/**
 * Fala um texto em voz alta, usando o tom/velocidade/voz configurados em
 * Configurações (ou os valores padrão, se o usuário não alterou nada).
 * @param {string} text
 * @param {{ onStart?: () => void, onEnd?: () => void, onError?: (e: any) => void }} handlers
 * @returns {boolean} false se TTS não é suportado ou o texto está vazio
 */
export function speak(text, { onStart, onEnd, onError } = {}) {
  if (!synth) {
    if (onError) onError(new Error('TTS não suportado neste navegador'));
    return false;
  }
  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    synth.cancel();
  } catch (_e) {
    /* ignora */
  }

  const { pitch, rate, voiceURI } = getVoiceSettings();
  const voice = resolveVoice(voiceURI);

  const utterance = new SpeechSynthesisUtterance(text.trim());
  if (voice) utterance.voice = voice;
  utterance.lang = (voice && voice.lang) || 'pt-BR';
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;

  let hasStarted = false;

  utterance.onstart = () => {
    hasStarted = true;
    if (onStart) onStart();
  };
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = (e) => {
    if (e.error === 'canceled' || e.error === 'interrupted') return;
    if (onError) onError(e);
    if (onEnd) onEnd();
  };

  currentUtterance = utterance;

  // Pequeno atraso antes de speak(): reduz falhas silenciosas em iOS.
  setTimeout(() => {
    try {
      synth.speak(utterance);
    } catch (err) {
      if (onError) onError(err);
      if (onEnd) onEnd();
      return;
    }

    clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(() => {
      if (!hasStarted && synth && !synth.speaking) {
        try {
          synth.cancel();
          synth.speak(utterance);
        } catch (_e) {
          /* ignora */
        }
      }
    }, 500);
  }, 50);

  return true;
}

export function stopSpeech() {
  clearTimeout(watchdogTimer);
  if (!synth) return;
  try {
    synth.cancel();
  } catch (_e) {
    /* ignora */
  }
  currentUtterance = null;
}

export function pauseSpeech() {
  if (synth) synth.pause();
}

export function resumeSpeech() {
  if (synth) synth.resume();
}

export function isSpeaking() {
  return !!synth && synth.speaking;
}
