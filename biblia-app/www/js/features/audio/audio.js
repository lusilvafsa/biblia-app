// Tela: Bíblia em Áudio — player dedicado à narrativa dos capítulos.
// Em vez de faixas musicais de demonstração, esta tela usa o mesmo motor
// de narrativa por voz do leitor da Bíblia e abre o capítulo já em reprodução.
import { qs, el } from '../../utils/dom.js';
import { icons } from '../../components/icons.js';
import { toast } from '../../utils/toast.js';
import { navigateTo } from '../../router.js';
import { getAllBooks } from '../../data-access/bibleRepository.js';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';
import { requestAutoStart } from '../bible/reader.js';
import { getVoiceSettings, setVoiceSettings } from '../../state/voiceSettings.js';
import { isSpeechSupported, getAvailableVoices, guessVoiceGender } from '../../utils/speech.js';

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function template() {
  return `
    <div class="audio-player">
      <div class="audio-track-info">
        <div class="audio-cover">${icons.audio}</div>
        <div class="audio-meta">
          <h4>Narrativa da Bíblia</h4>
          <p id="audioSelectedChapter">Escolha um capítulo para começar</p>
        </div>
      </div>
      <div class="audio-status" id="audioStatus">
        ${isSpeechSupported() ? '🎙️ Narrativa por voz disponível' : '⚠️ Este navegador não oferece leitura por voz'}
      </div>
      <div class="audio-controls">
        <button class="audio-btn" id="btnAudioPrev" aria-label="Capítulo anterior">◀</button>
        <button class="audio-btn play-btn" id="btnAudioStart" aria-label="Escolher capítulo">${icons.play}</button>
        <button class="audio-btn" id="btnAudioNext" aria-label="Próximo capítulo">▶</button>
      </div>
      <div class="audio-speed-row">
        <label for="audioSpeed">Velocidade</label>
        <select id="audioSpeed" class="settings-select" aria-label="Velocidade da narrativa">
          ${SPEEDS.map((s) => `<option value="${s}">${s}×</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="section-title">Escolher livro</div>
    <div id="audioBooks" class="audio-books"></div>
  `;
}

export const audioPage = {
  async render(container) {
    container.innerHTML = template();
    const booksContainer = qs('#audioBooks', container);
    const speedSelect = qs('#audioSpeed', container);
    const settings = getVoiceSettings();
    speedSelect.value = String(settings.rate);
    if (speedSelect.value !== String(settings.rate)) speedSelect.value = '1';
    speedSelect.addEventListener('change', () => setVoiceSettings({ rate: Number(speedSelect.value) }));

    const books = await getAllBooks();
    const saved = getItem(STORAGE_KEYS.progress, {});
    let selectedBook = books[Math.max(0, Math.min(Number(saved.book) || 0, books.length - 1))] || books[0];
    let selectedChapter = Number(saved.chapter) || 0;

    function updateSelected() {
      if (!selectedBook) return;
      selectedChapter = Math.max(0, Math.min(selectedChapter, selectedBook.chapterCount - 1));
      qs('#audioSelectedChapter', container).textContent = `${selectedBook.name} — Capítulo ${selectedChapter + 1}`;
    }

    function openChapter(bookIndex, chapterIndex, autoplay = true) {
      selectedBook = books[bookIndex];
      selectedChapter = chapterIndex;
      updateSelected();
      if (autoplay && isSpeechSupported()) requestAutoStart(0);
      navigateTo(`/biblia/${bookIndex}/${chapterIndex}`);
    }

    books.forEach((book) => {
      const card = el('button', {
        className: 'plan-card audio-book-card',
        onClick: () => {
          selectedBook = book;
          selectedChapter = Math.min(selectedChapter, book.chapterCount - 1);
          updateSelected();
          toast.info(`${book.name}: escolha um capítulo pela opção Continuar no leitor.`);
          openChapter(book.index, selectedChapter, true);
        },
      }, [
        el('div', { className: 'plan-icon-box', html: icons.audio }),
        el('div', { className: 'plan-info' }, [
          el('h4', {}, book.name),
          el('p', {}, `${book.chapterCount} capítulos`),
        ]),
      ]);
      booksContainer.appendChild(card);
    });

    qs('#btnAudioStart', container).addEventListener('click', () => openChapter(selectedBook.index, selectedChapter, true));
    qs('#btnAudioNext', container).addEventListener('click', () => {
      if (selectedChapter < selectedBook.chapterCount - 1) selectedChapter += 1;
      else if (selectedBook.index < books.length - 1) { selectedBook = books[selectedBook.index + 1]; selectedChapter = 0; }
      else return toast.info('Você chegou ao fim da Bíblia.');
      updateSelected();
      openChapter(selectedBook.index, selectedChapter, true);
    });
    qs('#btnAudioPrev', container).addEventListener('click', () => {
      if (selectedChapter > 0) selectedChapter -= 1;
      else if (selectedBook.index > 0) { selectedBook = books[selectedBook.index - 1]; selectedChapter = selectedBook.chapterCount - 1; }
      else return toast.info('Você está no primeiro capítulo da Bíblia.');
      updateSelected();
      openChapter(selectedBook.index, selectedChapter, true);
    });

    updateSelected();
    return () => {};
  },
};
