const CACHE_NAME = 'biblia-estudo-v2.3';
const APP_SHELL = [
  './assets/icons/bible-icon.png',
  './assets/icons/favicon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './css/animations.css',
  './css/base.css',
  './css/components.css',
  './css/variables.css',
  './data/audioTracks.js',
  './data/bible-acf.json',
  './data/bibleVersions.js',
  './data/ministryOutlines.js',
  './data/prayers.js',
  './data/quiz.js',
  './data/verseCommentary.js',
  './data/verses.js',
  './index.html',
  './js/components/icons.js',
  './js/data-access/bibleRepository.js',
  './js/data-access/progressRepository.js',
  './js/features/audio/audio.js',
  './js/features/bible/bookList.js',
  './js/features/bible/chapterGrid.js',
  './js/features/bible/reader.js',
  './js/features/bible/search.js',
  './js/features/bible/selectionToolbar.js',
  './js/features/bible/verseExplanation.js',
  './js/features/home/home.js',
  './js/features/ministry/ministryDetail.js',
  './js/features/ministry/ministryList.js',
  './js/features/notFound.js',
  './js/features/prayer/prayer.js',
  './js/features/profile/profile.js',
  './js/features/quiz/quiz.js',
  './js/features/settings/settings.js',
  './js/main.js',
  './js/router.js',
  './js/state/audioPlayer.js',
  './js/state/bibleVersion.js',
  './js/state/header.js',
  './js/state/installPrompt.js',
  './js/state/theme.js',
  './js/state/voiceSettings.js',
  './js/utils/dom.js',
  './js/utils/externalExplain.js',
  './js/utils/format.js',
  './js/utils/keepAlive.js',
  './js/utils/mediaSession.js',
  './js/utils/speech.js',
  './js/utils/storage.js',
  './js/utils/toast.js',
  './js/utils/wakeLock.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
