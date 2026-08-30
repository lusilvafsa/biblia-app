import { icons } from '../../components/icons.js';
import { favoritesRepository } from '../../data-access/favoritesRepository.js';
import { navigateTo } from '../../router.js';
import { statsRepository } from '../../data-access/statsRepository.js';

const BADGES = [
  { icon: icons.badgeFirst, name: 'Primeira Leitura', unlocked: true },
  { icon: icons.badgeStreak, name: '7 Dias Seguidos', unlocked: true },
  { icon: icons.prayer, name: 'Guerreiro de Oração', unlocked: true },
  { icon: icons.badgeDouble, name: 'Estudioso da Bíblia', unlocked: false },
  { icon: icons.badgeQuiz, name: 'Mestre do Quiz', unlocked: false },
  { icon: icons.badgeFull, name: 'Bíblia Completa', unlocked: false },
];

function template() {
  const favoritesCount = favoritesRepository.getFavorites().length;
  const notesCount = favoritesRepository.getNotes().length;
  const readVersesCount = statsRepository.getReadVersesCount();
  const audioVersesCount = statsRepository.getAudioVersesCount();

  const badgesHtml = BADGES.map(
    (b) => `
      <div class="badge-item ${b.unlocked ? 'unlocked' : ''}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>
    `
  ).join('');

  return `
    <div class="streak-banner">
      <div class="streak-flame">${icons.bible}</div>
      <div class="streak-info">
        <h4>Sequência de leitura de 7 dias</h4>
        <p>Melhor: 14 dias</p>
      </div>
    </div>

    <div class="section-title">Insígnias de Fé</div>

    <div class="badge-grid">
      ${badgesHtml}
    </div>

    <div class="section-title">Estatísticas</div>

    <div class="menu-grid">

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileBible"
      >
        <div class="menu-icon">${icons.bible}</div>
        <div class="menu-title">${readVersesCount}</div>
        <div class="menu-desc">Versículos lidos</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileAudio"
      >
        <div class="menu-icon">${icons.audio}</div>
        <div class="menu-title">${audioVersesCount}</div>
        <div class="menu-desc">Áudio ouvido</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfilePrayer"
      >
        <div class="menu-icon">${icons.prayer}</div>
        <div class="menu-title">45</div>
        <div class="menu-desc">Orações feitas</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileFavorites"
      >
        <div class="menu-icon">♥</div>
        <div class="menu-title">${favoritesCount}</div>
        <div class="menu-desc">Favoritos</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileNotes"
      >
        <div class="menu-icon">📝</div>
        <div class="menu-title">${notesCount}</div>
        <div class="menu-desc">Anotações</div>
      </button>

    </div>
  `;
}

export const profilePage = {
  render(container) {
    container.innerHTML = template();

    const bibleBtn = container.querySelector('#btnProfileBible');
    if (bibleBtn) {
      bibleBtn.addEventListener('click', () => {
        navigateTo('/biblia');
      });
    }

    const audioBtn = container.querySelector('#btnProfileAudio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        navigateTo('/audio');
      });
    }

    const prayerBtn = container.querySelector('#btnProfilePrayer');
    if (prayerBtn) {
      prayerBtn.addEventListener('click', () => {
        navigateTo('/oracao');
      });
    }

    const favoritesBtn = container.querySelector('#btnProfileFavorites');
    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', () => {
        navigateTo('/favoritos');
      });
    }

    const notesBtn = container.querySelector('#btnProfileNotes');
    if (notesBtn) {
      notesBtn.addEventListener('click', () => {
        navigateTo('/anotacoes');
      });
    }
  },
};
