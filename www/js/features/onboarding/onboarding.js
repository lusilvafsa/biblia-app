// Tour rápido de boas-vindas, mostrado só na primeira vez que o app abre,
// apontando os recursos mais poderosos (fáceis de passar despercebidos
// num app com tanta coisa).
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';

const STEPS = [
  {
    icon: '🧭',
    title: 'Cantinho de Estudo',
    text: 'Toque em um versículo e depois em "Abrir no Cantinho de Estudo" para ver comentário, comparação de versões e o Assistente, tudo numa só tela.',
  },
  {
    icon: '🎨',
    title: 'Grife por cor',
    text: 'Marque versículos importantes com cores por tema: promessa, ensino, crescimento ou advertência.',
  },
  {
    icon: '📖',
    title: 'Compare versões',
    text: 'Veja o mesmo versículo em ACF, BLIVRE e ARC 1911 lado a lado, direto no painel do versículo.',
  },
  {
    icon: '✨',
    title: 'Assistente Bíblico',
    text: 'Peça explicações de versículos e capítulos inteiros, e gere esboços de ministração com IA.',
  },
  {
    icon: '📅',
    title: 'Planos de Leitura',
    text: 'Siga um plano dia a dia — seu progresso é salvo automaticamente, e você pode ver todos em "Ver todos" na Home.',
  },
];

export function initOnboarding() {
  const jaViu = getItem(STORAGE_KEYS.onboardingSeen, false);
  if (jaViu) return;

  let passo = 0;

  const overlay = document.createElement('div');
  overlay.className = 'verse-explain-overlay';

  function fechar() {
    setItem(STORAGE_KEYS.onboardingSeen, true);
    overlay.remove();
  }

  function render() {
    const step = STEPS[passo];
    const isLast = passo === STEPS.length - 1;
    const dots = STEPS.map((_, i) => `<span class="onboarding-dot ${i === passo ? 'active' : ''}"></span>`).join('');

    overlay.innerHTML = `
      <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Bem-vindo ao Bíblia de Estudo">
        <div class="verse-explain-handle"></div>
        <button class="verse-explain-close" id="btnOnboardingSkip" aria-label="Pular">✕</button>
        <div class="onboarding-icon">${step.icon}</div>
        <h2 class="onboarding-title">${step.title}</h2>
        <p class="onboarding-text">${step.text}</p>
        <div class="onboarding-dots">${dots}</div>
        <button class="read-btn read-btn--primary" id="btnOnboardingNext" style="width:100%; margin-top:16px;">${isLast ? 'Começar a usar' : 'Próximo'}</button>
      </div>
    `;

    overlay.querySelector('#btnOnboardingSkip').addEventListener('click', fechar);
    overlay.querySelector('#btnOnboardingNext').addEventListener('click', () => {
      if (isLast) {
        fechar();
        return;
      }
      passo++;
      render();
    });
  }

  document.body.appendChild(overlay);
  render();
}
