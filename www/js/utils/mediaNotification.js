import { registerPlugin } from '@capacitor/core';

const MediaNotification = registerPlugin('MediaNotification');

export async function updateMediaNotification({
  title = 'Bíblia de Estudo',
  artist = 'Bíblia em Áudio',
  playing = false,
} = {}) {
  try {
    await MediaNotification.update({
      title,
      artist,
      playing,
    });
  } catch (error) {
    console.error('[MediaNotification] update:', error);
  }
}

export async function stopMediaNotification() {
  try {
    await MediaNotification.stop();
  } catch (error) {
    console.error('[MediaNotification] stop:', error);
  }
}
