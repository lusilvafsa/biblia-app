import { icons } from '../../components/icons.js';

function template() {
  return `
    <section class="page assistant-page">
      <div class="page-header">
        <div class="page-header-icon">
          ${icons.sparkles || '✨'}
        </div>
        <div>
          <h2>Assistente Bíblico</h2>
          <p>Estude a Bíblia, prepare ministrações e tire suas dúvidas.</p>
        </div>
      </div>

      <div class="menu-grid">
        <button type="button" class="menu-item">
          <div class="menu-icon">📖</div>
          <div class="menu-title">Estudar a Bíblia</div>
          <div class="menu-desc">
            Explique passagens, capítulos, versículos e temas bíblicos.
          </div>
        </button>

        <button type="button" class="menu-item">
          <div class="menu-icon">🎤</div>
          <div class="menu-title">Criar ministração</div>
          <div class="menu-desc">
            Desenvolva temas, esboços, estudos e ministrações.
          </div>
        </button>

        <button type="button" class="menu-item">
          <div class="menu-icon">🔎</div>
          <div class="menu-title">Pesquisar tema</div>
          <div class="menu-desc">
            Encontre referências e compreenda o que a Bíblia ensina.
          </div>
        </button>

        <button type="button" class="menu-item">
          <div class="menu-icon">🙏</div>
          <div class="menu-title">Criar oração</div>
          <div class="menu-desc">
            Crie orações baseadas na Bíblia e na sua necessidade.
          </div>
        </button>
      </div>

      <div class="card assistant-intro">
        <h3>Como posso ajudar?</h3>
        <p>
          Em breve você poderá conversar diretamente com o Assistente Bíblico
          e fazer perguntas livremente.
        </p>

        <div class="assistant-placeholder">
          <span class="assistant-placeholder-icon">✨</span>
          <span>O assistente estará disponível aqui.</span>
        </div>
      </div>
    </section>
  `;
}

export const assistantPage = {
  render(container) {
    container.innerHTML = template();
  }
};
