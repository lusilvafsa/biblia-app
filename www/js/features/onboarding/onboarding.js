// Tour de boas-vindas e "Novidades". Quem abre o app pela primeira vez vê o
// tour completo; quem já viu uma versão anterior vê só o que é novo, uma vez.
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';

const VERSAO_ATUAL = 2;
const CHAVE_VERSAO = 'biblia:onboarding-version';

// "desde" = versão do app em que o passo passou a existir (ou foi atualizado).
const STEPS = [
  {
    desde: 1,
    icon: '🧭',
    title: 'Cantinho de Estudo',
    text: 'Toque em um versículo e depois em "Abrir no Cantinho de Estudo" para ver comentário, comparação de versões e o Assistente, tudo numa só tela.',
  },
  {
    desde: 1,
    icon: '🎨',
    title: 'Grife por cor',
    text: 'Marque versículos importantes com cores por tema: promessa, ensino, crescimento ou advertência.',
  },
  {
    desde: 1,
    icon: '📖',
    title: 'Compare versões',
    text: 'Veja o mesmo versículo em ACF, BLIVRE e ARC 1911 lado a lado, direto no painel do versículo.',
  },
  {
    desde: 1,
    icon: '✨',
    title: 'Assistente Bíblico',
    text: 'Peça explicações de versículos e capítulos inteiros, e gere esboços de ministração com IA. Há um limite de perguntas por dia, mostrado na tela.',
  },
  {
    desde: 2,
    icon: '📜',
    title: 'Títulos das passagens',
    text: 'Os livros da Bíblia agora têm títulos em dourado separando as passagens. Em Ajustes, você escolhe se a narração também os lê.',
  },
  {
    desde: 2,
    icon: '🔊',
    title: 'Ouça em voz alta',
    text: 'Na Bíblia, toque em ouvir: a narração continua com a tela apagada e passa de capítulo sozinha. Use a lua 🌙 para parar em alguns minutos e o raio ⚡ para mudar a velocidade, que também muda pela notificação.',
  },
  {
    desde: 2,
    icon: '🙏',
    title: 'Início do dia',
    text: 'Na Início, a Oração do Dia muda conforme a hora. Oração, Versículo e Salmo do Dia têm botões para ouvir, copiar, compartilhar, gerar imagem e trocar.',
  },
  {
    desde: 2,
    icon: '🖼️',
    title: 'Compartilhe como imagem',
    text: 'Toque em um versículo e escolha Imagem, ou use o botão de imagem nos cartões da Início. Escolha o estilo escuro ou claro e envie pelo WhatsApp.',
  },
  {
    desde: 2,
    icon: '📅',
    title: 'Planos de Leitura',
    text: 'Siga um plano dia a dia: Bíblia em 1 ano, Novo Testamento em 90 dias, Evangelhos em 30 dias e outros. Nos planos novos, ouvir os capítulos do dia até o fim marca o dia sozinho.',
  },
];

export function initOnboarding() {
  const jaViu = getItem(STORAGE_KEYS.onboardingSeen, false);
  const versaoVista = Number(getItem(CHAVE_VERSAO, jaViu ? 1 : 0)) || 0;
  if (versaoVista >= VERSAO_ATUAL) return;

  const novidades = !!jaViu;
  const passos = novidades ? STEPS.filter((s) => s.desde > versaoVista) : STEPS;
  if (!passos.length) {
    setItem(CHAVE_VERSAO, VERSAO_ATUAL);
    return;
  }

  let passo = 0;
  const overlay = document.createElement('div');
  overlay.className = 'verse-explain-overlay';

  function fechar() {
    setItem(STORAGE_KEYS.onboardingSeen, true);
    setItem(CHAVE_VERSAO, VERSAO_ATUAL);
    overlay.remove();
  }

  function render() {
    const step = passos[passo];
    const isLast = passo === passos.length - 1;
    const dots = passos.map((_, i) => `<span class="onboarding-dot ${i === passo ? 'active' : ''}"></span>`).join('');
    const selo = novidades
      ? '<div style="color:var(--gold);font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-align:center;margin-bottom:4px;">Novidades</div>'
      : '';
    overlay.innerHTML = `
      <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Bem-vindo ao Bíblia de Estudo LS">
        <div class="verse-explain-handle"></div>
        <button class="verse-explain-close" id="btnOnboardingSkip" aria-label="Pular">✕</button>
        ${selo}
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
