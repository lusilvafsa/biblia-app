// Tela: lista de todos os planos de leitura disponíveis, com progresso.
import { icons } from '../../components/icons.js';
import { navigateTo } from '../../router.js';
import { setHeaderTitle } from '../../state/header.js';
import { READING_PLANS } from '../../../data/readingPlans.js';
import { planProgressRepository } from '../../data-access/planProgressRepository.js';

export const plansListPage = {
  render(container) {
    setHeaderTitle('Planos de Leitura');

    container.innerHTML = READING_PLANS.map((plan) => {
      const total = plan.dias.length;
      const feitos = planProgressRepository.getDoneDays(plan.id).length;
      const percent = total ? Math.round((feitos / total) * 100) : 0;
      return `
        <button class="plan-card" data-plan-id="${plan.id}">
          <div class="plan-icon-box">${icons.planBook}</div>
          <div class="plan-info">
            <h4>${plan.titulo}</h4>
            <p>${plan.descricao}</p>
          </div>
          <div class="plan-progress">${percent}%</div>
        </button>
      `;
    }).join('');

    container.querySelectorAll('[data-plan-id]').forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(`/planos/${btn.dataset.planId}`));
    });
  },
};
