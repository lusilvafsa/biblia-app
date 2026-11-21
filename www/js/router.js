// Roteador central da aplicação, baseado em hash (#/rota).
// GitHub Pages serve arquivos estáticos sem reescrita de URL no servidor,
// então rotas via hash funcionam em produção sem configuração extra.
//
// Cada rota aponta para um módulo de "página" com a forma:
//   { render(container, params): void | Promise<void> }

const routes = [];
let notFoundHandler = null;
let container = null;
let onNavigate = null; // callback(routeMeta, params) — usado p/ header e bottom-nav
let currentCleanup = null; // função opcional retornada pela página anterior
let navigationId = 0; // identifica a renderização mais recente
let pendingNavigation = null;
let activeNavigation = null;

export function registerRoute(pattern, page, meta = {}) {
  // pattern: '/biblia/:book/:chapter' -> regex com grupos nomeados
  const paramNames = [];
  const regexStr = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const regex = new RegExp(`^${regexStr}$`);
  routes.push({ regex, paramNames, page, meta });
}

export function setNotFound(page) {
  notFoundHandler = page;
}

export function onRouteChange(callback) {
  onNavigate = callback;
}

export function initRouter(rootEl) {
  container = rootEl;
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

export function navigateTo(path) {
  return new Promise((resolve) => {
    if (pendingNavigation) {
      pendingNavigation.resolve(false);
      pendingNavigation = null;
    }

    if (activeNavigation) {
      activeNavigation.resolve(false);
      activeNavigation = null;
    }

    pendingNavigation = { path, resolve };

    if (window.location.hash === `#${path}`) {
      handleRouteChange();
    } else {
      window.location.hash = path;
    }
  });
}

function finishNavigation(navigation, success) {
  if (!navigation || activeNavigation !== navigation) return;

  activeNavigation = null;
  navigation.resolve(success);
}

function currentPath() {
  const hash = window.location.hash.slice(1); // remove '#'
  return hash || '/';
}

async function handleRouteChange() {
  const path = currentPath();

  // Ignora eventos hashchange duplicados durante a mesma renderização.
  if (activeNavigation && activeNavigation.path === path) return;

  const currentNavigationId = ++navigationId;
  const isCurrent = () => currentNavigationId === navigationId;

  if (activeNavigation) {
    activeNavigation.resolve(false);
    activeNavigation = null;
  }

  let routeNavigation = null;

  if (pendingNavigation) {
    const requested = pendingNavigation;
    pendingNavigation = null;

    if (requested.path === path) {
      routeNavigation = requested;
      activeNavigation = requested;
    } else {
      requested.resolve(false);
    }
  }

  for (const route of routes) {
    const match = path.match(route.regex);
    if (!match) continue;

    const params = {};

    try {
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      if (typeof currentCleanup === 'function') {
        try { currentCleanup(); } catch (_e) { /* ignora */ }
      }
      currentCleanup = null;

      if (onNavigate) onNavigate(route.meta, params);
      container.innerHTML = '';
      window.scrollTo(0, 0);
    } catch (err) {
      if (!isCurrent()) return;
      console.error('[router] erro ao preparar rota', path, err);
      renderErrorState(container, err);
      finishNavigation(routeNavigation, false);
      return;
    }

    try {
      const cleanup = await route.page.render(container, params, isCurrent);
      if (!isCurrent()) {
        if (typeof cleanup === 'function') {
          try { cleanup(); } catch (_e) { /* ignora limpeza obsoleta */ }
        }
        return;
      }
      if (typeof cleanup === 'function') currentCleanup = cleanup;

      finishNavigation(routeNavigation, true);
    } catch (err) {
      if (!isCurrent()) return;
      console.error('[router] erro ao renderizar rota', path, err);
      renderErrorState(container, err);
      finishNavigation(routeNavigation, false);
    }
    return;
  }

  if (notFoundHandler) {
    container.innerHTML = '';

    try {
      await notFoundHandler.render(container, {});
    } catch (err) {
      if (!isCurrent()) return;
      console.error('[router] erro ao renderizar rota inexistente', path, err);
      renderErrorState(container, err);
    }

    if (!isCurrent()) return;
  }

  finishNavigation(routeNavigation, false);
}

function renderErrorState(target, err) {
  const wrapper = document.createElement('div');
  wrapper.className = 'state-message error';

  const title = document.createElement('p');
  title.textContent = 'Não foi possível carregar esta tela.';

  const detail = document.createElement('p');
  detail.style.marginTop = '6px';
  detail.style.fontSize = '12px';
  detail.textContent =
    err && typeof err.message === 'string' ? err.message : '';

  wrapper.append(title, detail);
  target.replaceChildren(wrapper);
}
