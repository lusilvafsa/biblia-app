// Tela: Oração Diária — a oração de hoje em destaque e as demais logo abaixo,
// cada uma com o botão "Orar Amém".
import { el } from '../../utils/dom.js';
import { icons } from '../../components/icons.js';
import { toast } from '../../utils/toast.js';
import { PRAYERS } from '../../../data/prayers.js';
import { oracaoDoDia } from '../../utils/prayerOfDay.js';
import { statsRepository } from '../../data-access/statsRepository.js';

function cartaoDeOracao(prayer) {
  const amenBtn = el('button', {
    className: 'prayer-amen',
    html: `${icons.check} Orar Amém`,
  });
  amenBtn.addEventListener('click', () => {
    statsRepository.incrementPrayerCount();
    amenBtn.classList.add('prayed');
    amenBtn.innerHTML = `${icons.check} Amém orado`;
    amenBtn.disabled = true;
    toast.success('Oração registrada');
  });

  return el('div', { className: 'prayer-card' }, [
    el('h4', { html: `${icons.prayer} ${prayer.title}` }),
    el('p', {}, prayer.text),
    amenBtn,
  ]);
}

export const prayerPage = {
  render(container) {
    container.innerHTML = '';
    const hoje = oracaoDoDia();
    container.appendChild(el('div', { className: 'section-title' }, 'Oração de hoje'));
    container.appendChild(cartaoDeOracao(hoje));
    container.appendChild(el('div', { className: 'section-title' }, 'Outras orações'));
    PRAYERS.filter((p) => p.id !== hoje.id).forEach((p) => container.appendChild(cartaoDeOracao(p)));
  },
};
