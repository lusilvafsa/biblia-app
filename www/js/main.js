// Ponto de entrada da aplicação.
// Monta a casca do app (splash, relógio, tema, navegação) e registra as
// rotas que o roteador (router.js) usa para decidir o que renderizar
// dentro de #appContent.
import { qs, qsa, el } from './utils/dom.js';
import { icons } from './components/icons.js';
import { registerRoute, setNotFound, onRouteChange, initRouter, navigateTo } from './router.js';
import { bindHeaderTitleElement, setHeaderTitle } from './state/header.js';
import { getTheme, toggleTheme, onThemeChange } from './state/theme.js';
import { initDailyNotification } from './utils/dailyNotification.js';

import { homePage } from './features/home/home.js';
import { bookListPage } from './features/bible/bookList.js';
import { chapterGridPage } from './features/bible/chapterGrid.js';
import { verseGridPage } from './features/bible/verseGrid.js';
import { readerPage } from './features/bible/reader.js';
import { searchPage } from './features/bible/search.js';
import { prayerPage } from './features/prayer/prayer.js';
import { quizPage } from './features/quiz/quiz.js';
import { profilePage } from './features/profile/profile.js';
import { settingsPage } from './features/settings/settings.js';
import { ministryListPage } from './features/ministry/ministryList.js';
import { ministryDetailPage } from './features/ministry/ministryDetail.js';
import { notFoundPage } from './features/notFound.js';
import { favoritesPage } from './features/favorites/favorites.js';
import { reviewPage } from './features/favorites/review.js';
import { notesPage } from './features/favorites/notes.js';
import { assistantPage } from './features/assistant/assistant.js';
import { planDetailPage } from './features/plans/planDetail.js';
import { studyCornerPage } from './features/bible/studyCorner.js';
import { plansListPage } from './features/plans/plansList.js';

const NAV_ICONS = {
  home: icons.home,
  bible: icons.bibleNav,
  audio: icons.audio,
  prayer: icons.prayer,
  profile: icons.profile,
  favorites: '♥',
  assistant: icons.explain
};

function initSplashScreen() {
  const splash = qs('#splashScreen');
  if (!splash) return;

  const hide = () => {
    splash.classList.add('hidden');
    splash.style.opacity = '0';
    splash.style.visibility = 'hidden';
    splash.style.pointerEvents = 'none';
  };

  setTimeout(hide, 1000);
}

function initBottomNavIcons() {
  qsa('.nav-item').forEach((btn) => {
    const key = btn.dataset.navKey;
    const iconHost = qs('.nav-icon', btn);
    iconHost.innerHTML = NAV_ICONS[key] || '';
    btn.addEventListener('click', () => navigateTo(btn.dataset.route));
  });
}

function updateBottomNav(navKey) {
  qsa('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.navKey === navKey);
  });
}

function renderHeaderActions(meta) {
  const host = qs('#headerActions');
  host.innerHTML = '';

  if (meta.showBack) {
    const backBtn = el('button', { className: 'icon-btn', html: icons.back, title: 'Voltar', 'aria-label': 'Voltar' });
    backBtn.addEventListener('click', () => history.back());
    host.appendChild(backBtn);
  }

  if (meta.showSearch) {
    const searchBtn = el('button', { className: 'icon-btn', html: icons.search, title: 'Buscar', 'aria-label': 'Buscar na Bíblia' });
    searchBtn.addEventListener('click', () => navigateTo('/biblia/busca'));
    host.appendChild(searchBtn);
  }

  if (meta.showSettings) {
    const settingsBtn = el('button', { className: 'icon-btn', html: icons.settings, title: 'Configurações', 'aria-label': 'Configurações' });
    settingsBtn.addEventListener('click', () => navigateTo('/configuracoes'));
    host.appendChild(settingsBtn);
  }

  const themeBtn = el('button', {
    className: 'theme-toggle',
    html: getTheme() === 'light' ? icons.moon : icons.sun,
    title: 'Alternar tema',
    'aria-label': 'Alternar tema claro/escuro',
  });
  themeBtn.addEventListener('click', () => toggleTheme());
  host.appendChild(themeBtn);
}

function initRoutes() {
  registerRoute('/', homePage, { title: 'Versículo do Dia', navKey: 'home', showSettings: true });
  registerRoute('/biblia', bookListPage, { title: 'Bíblia Sagrada', navKey: 'bible', showSearch: true, showSettings: true });
  registerRoute('/biblia/busca', searchPage, { title: 'Buscar na Bíblia', navKey: 'bible', showBack: true });
  registerRoute('/biblia/:book', chapterGridPage, { title: 'Bíblia Sagrada', navKey: 'bible', showBack: true, showSearch: true });
  registerRoute('/biblia/:book/:chapter', verseGridPage, { title: 'Bíblia Sagrada', navKey: 'bible', showBack: true, showSearch: true });
  registerRoute('/biblia/:book/:chapter/versiculo/:verse', readerPage, { title: 'Bíblia Sagrada', navKey: 'bible', showBack: true, showSearch: true });
  registerRoute('/oracao', prayerPage, { title: 'Oração Diária', navKey: 'prayer', showSettings: true });
  registerRoute('/quiz', quizPage, { title: 'Quiz Bíblico', navKey: null, showBack: true });
  registerRoute('/ministracao', ministryListPage, { title: 'Guia de Ministração', navKey: null, showBack: true });
  registerRoute('/ministracao/:id', ministryDetailPage, { title: 'Guia de Ministração', navKey: null, showBack: true });
  registerRoute('/planos', plansListPage, { title: 'Planos de Leitura', navKey: null, showBack: true });
  registerRoute('/planos/:id', planDetailPage, { title: 'Plano de Leitura', navKey: null, showBack: true });
  registerRoute('/estudo/:book/:chapter/:verse', studyCornerPage, { title: 'Cantinho de Estudo', navKey: null, showBack: true });
  registerRoute('/perfil', profilePage, { title: 'Meu Perfil', navKey: 'profile', showSettings: true });
  registerRoute('/favoritos', reviewPage, { title: 'Meus Marcadores', navKey: null, showBack: true });
  registerRoute('/anotacoes', reviewPage, { title: 'Meus Marcadores', navKey: null, showBack: true });
  registerRoute('/assistente', assistantPage, { title: 'Assistente Bíblico', navKey: null, showBack: true });
  registerRoute('/configuracoes', settingsPage, { title: 'Configurações', navKey: null, showBack: true });
  setNotFound(notFoundPage);

  onRouteChange((meta) => {
    setHeaderTitle(meta.title || 'Bíblia de Estudo');
    renderHeaderActions(meta);
    updateBottomNav(meta.navKey);
  });
}

function init() {
  bindHeaderTitleElement(qs('#headerTitle'));
  initSplashScreen();
  initBottomNavIcons();
  initRoutes();
  initRouter(qs('#appContent'));
  initDailyNotification();

  onThemeChange(() => {
    const host = qs('#headerActions');
    const themeBtn = qs('.theme-toggle', host);
    if (themeBtn) themeBtn.innerHTML = getTheme() === 'light' ? icons.moon : icons.sun;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

(() => {
  const initCompactBottomMenu = () => {
    const toggle = document.querySelector('#bottomMenuToggle');
    const menu = document.querySelector('.bottom-nav.compact-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const aberto = menu.classList.toggle('menu-open');

      toggle.setAttribute('aria-expanded', String(aberto));
      toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) {
        menu.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menu');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompactBottomMenu);
  } else {
    initCompactBottomMenu();
  }
})();

(() => {

    const NOMES_AUDIO = ['Iniciar', 'Pausar', 'Continuar', 'Parar'];

    function compactarBotoesAudio() {

        const botoes = [...document.querySelectorAll('button')].filter(botao => {
            const texto = botao.textContent.trim();

            return NOMES_AUDIO.includes(texto) ||
                   botao.classList.contains('biblia-audio-icon-only');
        });

        if (!botoes.length) return;

        botoes.forEach(botao => {

            const textoOriginal = botao.getAttribute('aria-label') ||
                                  botao.textContent.trim();

            if (NOMES_AUDIO.includes(textoOriginal)) {
                botao.setAttribute('aria-label', textoOriginal);
                botao.setAttribute('title', textoOriginal);
            }

            botao.classList.add('biblia-audio-icon-only');

            [...botao.childNodes].forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.remove();
                }
            });

            [...botao.querySelectorAll('span, strong, b, label')].forEach(el => {

                const possuiIcone = el.querySelector('svg, img, i');

                if (!possuiIcone && NOMES_AUDIO.includes(el.textContent.trim())) {
                    el.remove();
                }
            });

            botao.style.width = '54px';
            botao.style.minWidth = '54px';
            botao.style.height = '50px';
            botao.style.minHeight = '50px';
            botao.style.padding = '0';
            botao.style.margin = '0';
            botao.style.display = 'flex';
            botao.style.alignItems = 'center';
            botao.style.justifyContent = 'center';
            botao.style.flexShrink = '0';
            botao.style.fontSize = '0';
            botao.style.lineHeight = '0';

            const icone = botao.querySelector('svg, img, i');

            if (icone) {
                icone.style.width = '24px';
                icone.style.height = '24px';
                icone.style.margin = '0';
                icone.style.display = 'block';
                icone.style.fontSize = '24px';
                icone.style.lineHeight = '1';
            }
        });

        const primeiro = botoes[0];

        if (primeiro && primeiro.parentElement) {

            const container = primeiro.parentElement;

            container.classList.add('biblia-audio-controls-icons');

            container.style.display = 'flex';
            container.style.flexDirection = 'row';
            container.style.flexWrap = 'nowrap';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.gap = '6px';
        }
    }

    const estilo = document.createElement('style');

    estilo.textContent = `
        .biblia-audio-icon-only {
            font-size: 0 !important;
            line-height: 0 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-indent: 0 !important;
        }

        .biblia-audio-icon-only svg,
        .biblia-audio-icon-only img,
        .biblia-audio-icon-only i {
            width: 24px !important;
            height: 24px !important;
            display: block !important;
            margin: 0 !important;
            font-size: 24px !important;
            line-height: 1 !important;
        }

        .biblia-audio-icon-only span:not(:has(svg)):not(:has(img)):not(:has(i)),
        .biblia-audio-icon-only strong:not(:has(svg)):not(:has(img)):not(:has(i)),
        .biblia-audio-icon-only b:not(:has(svg)):not(:has(img)):not(:has(i)),
        .biblia-audio-icon-only label:not(:has(svg)):not(:has(img)):not(:has(i)) {
            display: none !important;
        }

        .biblia-audio-controls-icons {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
        }
    `;

    document.head.appendChild(estilo);

    compactarBotoesAudio();

    const observador = new MutationObserver(() => {
        compactarBotoesAudio();
    });

    observador.observe(document.body, {
        childList: true,
        subtree: true
    });

    setInterval(compactarBotoesAudio, 500);

})();
