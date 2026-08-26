// Ponto de entrada da aplicação.
// Monta a casca do app (splash, relógio, tema, navegação) e registra as
// rotas que o roteador (router.js) usa para decidir o que renderizar
// dentro de #appContent.
import { qs, qsa, el } from './utils/dom.js';
import { icons } from './components/icons.js';
import { registerRoute, setNotFound, onRouteChange, initRouter, navigateTo } from './router.js';
import { bindHeaderTitleElement, setHeaderTitle } from './state/header.js';
import { getTheme, toggleTheme, onThemeChange } from './state/theme.js';

import { homePage } from './features/home/home.js';
import { bookListPage } from './features/bible/bookList.js';
import { chapterGridPage } from './features/bible/chapterGrid.js';
import { readerPage } from './features/bible/reader.js';
import { searchPage } from './features/bible/search.js';
import { audioPage } from './features/audio/audio.js';
import { prayerPage } from './features/prayer/prayer.js';
import { quizPage } from './features/quiz/quiz.js';
import { profilePage } from './features/profile/profile.js';
import { settingsPage } from './features/settings/settings.js';
import { ministryListPage } from './features/ministry/ministryList.js';
import { ministryDetailPage } from './features/ministry/ministryDetail.js';
import { notFoundPage } from './features/notFound.js';

const NAV_ICONS = { home: icons.home, bible: icons.bibleNav, audio: icons.audio, prayer: icons.prayer, profile: icons.profile };

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
  registerRoute('/biblia/:book/:chapter', readerPage, { title: 'Bíblia Sagrada', navKey: 'bible', showBack: true, showSearch: true });
  registerRoute('/audio', audioPage, { title: 'Bíblia em Áudio', navKey: 'audio', showSettings: true });
  registerRoute('/oracao', prayerPage, { title: 'Oração Diária', navKey: 'prayer', showSettings: true });
  registerRoute('/quiz', quizPage, { title: 'Quiz Bíblico', navKey: null, showBack: true });
  registerRoute('/ministracao', ministryListPage, { title: 'Guia de Ministração', navKey: null, showBack: true });
  registerRoute('/ministracao/:id', ministryDetailPage, { title: 'Guia de Ministração', navKey: null, showBack: true });
  registerRoute('/perfil', profilePage, { title: 'Meu Perfil', navKey: 'profile', showSettings: true });
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

  onThemeChange(() => {
    // Reaplica os ícones do cabeçalho (sol/lua) quando o tema muda.
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

/* ===== MENU INFERIOR COMPACTO ===== */
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

/* ===== CONTROLES DA BÍBLIA SOMENTE COM ÍCONES ===== */
(() => {

    const compactarBotoesAudio = () => {

        const nomes = ['Iniciar', 'Continuar', 'Parar'];

        const botoes = [...document.querySelectorAll('button')].filter(botao => {
            const texto = botao.textContent.trim();
            return nomes.includes(texto);
        });

        if (botoes.length === 0) return;

        botoes.forEach(botao => {

            const textoOriginal = botao.textContent.trim();

            /* Mantém o nome para acessibilidade */
            botao.setAttribute('aria-label', textoOriginal);
            botao.setAttribute('title', textoOriginal);

            /* Classe para o modo somente ícone */
            botao.classList.add('biblia-audio-icon-only');

            /* Remove textos diretos */
            [...botao.childNodes].forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.remove();
                }
            });

            /* Esconde elementos que contenham somente o nome */
            [...botao.querySelectorAll('span, strong, b, label')].forEach(elemento => {

                const texto = elemento.textContent.trim();

                const possuiIcone = elemento.querySelector('svg, img, i');

                if (!possuiIcone && nomes.includes(texto)) {
                    elemento.remove();
                }
            });

            /* Tamanho do botão */
            botao.style.width = '58px';
            botao.style.minWidth = '58px';
            botao.style.height = '54px';
            botao.style.padding = '0';
            botao.style.margin = '0';
            botao.style.display = 'flex';
            botao.style.alignItems = 'center';
            botao.style.justifyContent = 'center';
            botao.style.flexShrink = '0';
            botao.style.fontSize = '0';
            botao.style.lineHeight = '0';

            /* Tamanho do ícone */
            const icone = botao.querySelector('svg, img, i');

            if (icone) {
                icone.style.width = '24px';
                icone.style.height = '24px';
                icone.style.margin = '0';
                icone.style.fontSize = '24px';
                icone.style.lineHeight = '1';
                icone.style.display = 'block';
            }
        });

        /* Coloca os botões na mesma linha */
        const primeiro = botoes[0];

        if (primeiro && primeiro.parentElement) {

            const container = primeiro.parentElement;

            container.style.display = 'flex';
            container.style.flexDirection = 'row';
            container.style.flexWrap = 'nowrap';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.gap = '8px';
        }
    };

    /* CSS de segurança para esconder os nomes */
    const estilo = document.createElement('style');

    estilo.textContent = `
        .biblia-audio-icon-only {
            font-size: 0 !important;
            line-height: 0 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
        }

        .biblia-audio-icon-only svg,
        .biblia-audio-icon-only img,
        .biblia-audio-icon-only i {
            width: 24px !important;
            height: 24px !important;
            font-size: 24px !important;
            line-height: 1 !important;
            margin: 0 !important;
            display: block !important;
        }

        .biblia-audio-icon-only span:not(:has(svg)):not(:has(img)):not(:has(i)) {
            display: none !important;
        }
    `;

    document.head.appendChild(estilo);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', compactarBotoesAudio);
    } else {
        compactarBotoesAudio();
    }

})();
