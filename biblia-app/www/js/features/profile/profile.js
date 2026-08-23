import { icons } from '../../components/icons.js';
import { progressRepository } from '../../data-access/progressRepository.js';
import { getAllBooks } from '../../data-access/bibleRepository.js';

const BADGES = [
  { icon: icons.badgeFirst, name: 'Primeira Leitura', test: s => s.versesRead >= 1 },
  { icon: icons.badgeStreak, name: '7 Dias Seguidos', test: s => s.days >= 7 },
  { icon: icons.prayer, name: 'Guerreiro de Oração', test: s => s.prayers >= 10 },
  { icon: icons.badgeDouble, name: 'Estudioso da Bíblia', test: s => s.versesRead >= 1000 },
  { icon: icons.badgeQuiz, name: 'Mestre do Quiz', test: s => s.quizCorrect >= 50 },
  { icon: icons.badgeFull, name: 'Bíblia Completa', test: s => s.chaptersRead >= 1189 },
];

function template(stats, totalChapters) {
  const percent = Math.min(100, Math.round((stats.chaptersRead / totalChapters) * 100));
  const badgesHtml = BADGES.map(b => {
    const unlocked = b.test(stats);
    return `<div class="badge-item ${unlocked ? 'unlocked' : ''}"><div class="badge-icon">${b.icon}</div><div class="badge-name">${b.name}</div></div>`;
  }).join('');
  const items = [
    [icons.bible, stats.versesRead.toLocaleString('pt-BR'), 'Versículos lidos'],
    [icons.bible, stats.chaptersRead.toLocaleString('pt-BR'), 'Capítulos concluídos'],
    [icons.prayer, stats.prayers.toLocaleString('pt-BR'), 'Orações feitas'],
    [icons.bookmark, Object.keys(stats.favorites).length.toLocaleString('pt-BR'), 'Favoritos'],
  ];
  return `<div class="streak-banner"><div class="streak-flame">${icons.bible}</div><div class="streak-info"><h4>${stats.days} dia(s) de leitura registrada</h4><p>Continue sua jornada todos os dias.</p></div></div>
  <div class="section-title">Progresso da Bíblia</div><div class="progress-card"><div class="progress-card-top"><strong>${percent}%</strong><span>${stats.chaptersRead} de ${totalChapters} capítulos</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></div>
  <div class="section-title">Insígnias de Fé</div><div class="badge-grid">${badgesHtml}</div>
  <div class="section-title">Estatísticas</div><div class="menu-grid">${items.map(([icon,value,label]) => `<div class="menu-item menu-item--static"><div class="menu-icon">${icon}</div><div class="menu-title">${value}</div><div class="menu-desc">${label}</div></div>`).join('')}</div>`;
}

export const profilePage = {
  async render(container) {
    container.innerHTML = '<div class="state-message">Carregando seu progresso...</div>';
    const [stats, books] = await Promise.all([progressRepository.getStats(), getAllBooks()]);
    const favorites = await progressRepository.getFavorites();
    stats.favorites = favorites;
    stats.days = Array.isArray(stats.days) ? stats.days.length : 0;
    const totalChapters = books.reduce((sum, b) => sum + b.chapterCount, 0);
    container.innerHTML = template(stats, totalChapters);
  },
};
