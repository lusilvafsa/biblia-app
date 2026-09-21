// Tela: Quiz Bíblico — 10 perguntas sorteadas de um banco maior a cada
// partida, com placar e tela de resultado final.
import { el } from '../../utils/dom.js';
import { sortearPerguntas } from '../../../data/quiz.js';
import { statsRepository } from '../../data-access/statsRepository.js';

function renderFinalScore(container, score, total, restart) {
  container.innerHTML = '';
  const card = el('div', { className: 'quiz-card quiz-final' }, [
    el('h3', {}, 'Quiz Finalizado!'),
    el('p', {}, [
      'Você acertou ',
      el('strong', {}, String(score)),
      ' de ',
      el('strong', {}, String(total)),
    ]),
    el('button', { className: 'read-btn', style: 'margin-top:16px;', onClick: restart }, 'Jogar Novamente'),
  ]);
  container.appendChild(card);
}

export const quizPage = {
  render(container) {
    let perguntas = sortearPerguntas(10);
    let questionIndex = 0;
    let score = 0;
    let advanceTimer = null;

    function renderQuestion() {
      if (questionIndex >= perguntas.length) {
        statsRepository.registerQuizResult(score, perguntas.length);
        renderFinalScore(container, score, perguntas.length, () => {
          perguntas = sortearPerguntas(10);
          questionIndex = 0;
          score = 0;
          renderQuestion();
        });
        return;
      }

      const q = perguntas[questionIndex];
      container.innerHTML = '';

      const optionButtons = [];
      const resultEl = el('div', { className: 'quiz-result' });

      const optionsEl = el(
        'div',
        { className: 'quiz-options' },
        q.options.map((opt, i) => {
          const btn = el('button', { className: 'quiz-option' }, opt);
          btn.addEventListener('click', () => answer(i));
          optionButtons.push(btn);
          return btn;
        })
      );

      const card = el('div', { className: 'quiz-card' }, [
        el('p', { className: 'quiz-progress' }, `Pergunta ${questionIndex + 1} de ${perguntas.length}`),
        el('div', { className: 'quiz-question' }, q.question),
        optionsEl,
        resultEl,
      ]);
      container.appendChild(card);

      function answer(selectedIndex) {
        optionButtons.forEach((btn, i) => {
          btn.disabled = true;
          if (i === q.correct) btn.classList.add('correct');
          else if (i === selectedIndex) btn.classList.add('wrong');
        });

        if (selectedIndex === q.correct) {
          score++;
          resultEl.textContent = '✓ Correto!';
          resultEl.style.color = 'var(--success)';
        } else {
          resultEl.textContent = `✗ Resposta: ${q.options[q.correct]}`;
          resultEl.style.color = 'var(--danger)';
        }
        resultEl.classList.add('show');

        clearTimeout(advanceTimer);
        advanceTimer = setTimeout(() => {
          questionIndex++;
          renderQuestion();
        }, 1500);
      }
    }

    renderQuestion();

    return () => clearTimeout(advanceTimer);
  },
};
