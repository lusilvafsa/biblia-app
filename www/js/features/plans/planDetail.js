// Tela: detalhe de um Plano de Leitura — lista de dias com referência
// bíblica, marcação de dia concluído e atalho para abrir no leitor.
import { icons } from '../../components/icons.js';
import { toast } from '../../utils/toast.js';
import { navigateTo } from '../../router.js';
import { setHeaderTitle } from '../../state/header.js';
import { getReadingPlan } from '../../../data/readingPlans.js';
import { planProgressRepository } from '../../data-access/planProgressRepository.js';
import { getAllBooks } from '../../data-access/bibleRepository.js';

function parseRef(ref) {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;
  return { bookName: match[1].trim(), chapter: Number(match[2]), verse: Number(match[3]) };
}

function renderDayCard(dia, plan) {
  const done = planProgressRepository.isDayDone(plan.id, dia.dia);

  return `
    <div class="plan-day-card ${done ? 'done' : ''}">
      <button type="button" class="plan-day-check" data-action="toggle" data-dia="${dia.dia}" aria-label="${done ? 'Marcar como não concluído' : 'Marcar como concluído'}">
        ${done ? icons.check : ''}
      </button>
      <div class="plan-day-info">
        <div class="plan-day-title">Dia ${dia.dia} — ${dia.foco}</div>
        <div class="plan-day-ref">${dia.referencia}</div>
      </div>
      <button type="button" class="icon-btn" data-action="abrir" data-dia="${dia.dia}" title="Abrir no leitor" aria-label="Abrir no leitor">${icons.bibleNav}</button>
    </div>
  `;
}

function renderProgress(plan) {
  const total = plan.dias.length;
  const feitos = planProgressRepository.getDoneDays(plan.id).length;
  const percent = total ? Math.round((feitos / total) * 100) : 0;

  return `
    <div class="plan-progress-header">
      <p>${plan.descricao}</p>
      <div class="plan-progress-bar"><div class="plan-progress-fill" style="width:${percent}%"></div></div>
      <p class="plan-progress-label">${feitos} de ${total} dias concluídos (${percent}%)</p>
    </div>
  `;
}

export const planDetailPage = {
  async render(container, params) {
    const plan = getReadingPlan(params.id);

    if (!plan) {
      container.innerHTML = `<div class="state-message error">Plano não encontrado.</div>`;
      return;
    }

    setHeaderTitle(plan.titulo);

    function renderAll() {
      container.innerHTML = `
        ${renderProgress(plan)}
        <div id="planDaysList">
          ${plan.dias.map((dia) => renderDayCard(dia, plan)).join('')}
        </div>
      `;

      container.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const dia = Number(btn.dataset.dia);
          planProgressRepository.toggleDay(plan.id, dia);
          renderAll();
        });
      });

      container.querySelectorAll('[data-action="abrir"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const dia = plan.dias.find((d) => d.dia === Number(btn.dataset.dia));
          const parsed = dia && parseRef(dia.referencia);

          if (!parsed) {
            toast.info('Não foi possível abrir essa referência automaticamente.');
            return;
          }

          try {
            const books = await getAllBooks();
            const book = books.find((b) => b.name === parsed.bookName);

            if (!book) {
              toast.info('Não foi possível localizar esse livro automaticamente.');
              return;
            }

            navigateTo(`/biblia/${book.index}/${parsed.chapter - 1}/versiculo/${parsed.verse - 1}`);
          } catch (_e) {
            toast.error('Não foi possível abrir a passagem agora.');
          }
        });
      });
    }

    renderAll();
  },
};
