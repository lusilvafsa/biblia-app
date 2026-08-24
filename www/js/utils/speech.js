import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { getVoiceSettings } from '../state/voiceSettings.js';

let speaking = false;
let currentText = '';

export function isSpeechSupported() {
  return true;
}

export async function speak(text, { onStart, onEnd, onError } = {}) {
  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    await TextToSpeech.stop();

    const { pitch, rate } = getVoiceSettings();

    currentText = text.trim();
    speaking = true;

    if (onStart) onStart();

    await TextToSpeech.speak({
      text: currentText,
      lang: 'pt-BR',
      rate: Number(rate) || 1.0,
      pitch: Number(pitch) || 1.0,
      volume: 1.0,
      category: 'ambient',
      queueStrategy: 0
    });

    speaking = false;

    if (onEnd) onEnd();

    return true;

  } catch (error) {
    speaking = false;

    console.error('Erro no TTS:', error);

    if (onError) onError(error);
    if (onEnd) onEnd();

    return false;
  }
}

export async function stopSpeech() {
  try {
    await TextToSpeech.stop();
  } catch (error) {
    console.warn('Erro ao parar TTS:', error);
  }

  speaking = false;
  currentText = '';
}

export function pauseSpeech() {
  console.log('Pausa não disponível no TTS nativo.');
}

export function resumeSpeech() {
  console.log('Retomar não disponível no TTS nativo.');
}

export function isSpeaking() {
  return speaking;
}

export function getAvailableVoices() {
  return [];
}

export function onVoicesChanged(fn) {
  return () => {};
}

export function findVoiceByGender() {
  return null;
}
