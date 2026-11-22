// Visualização independente do texto bíblico e estudo associado ao título.
import { el } from '../../utils/dom.js';
import { navigateTo } from '../../router.js';
import { getTitleEntry } from '../../data-access/titleRepository.js';
import { getChapter } from '../../data-access/bibleRepository.js';
import { icons } from '../../components/icons.js';
import { speak, stopSpeech, isSpeechSupported } from '../../utils/speech.js';
import { referenciaParaFala } from '../../utils/bibleReferenceSpeech.js';

function statusText(status) {
  if (status === 'approved') return ['Aprovado editorialmente', 'approved'];
  if (status === 'provisional') return ['Estudo provisório · pendente de revisão editorial', 'provisional'];
  if (status === 'missing') return ['Estudo ainda não disponível', 'missing'];
  return ['Situação editorial não verificada', 'unverified'];
}

function limparTexto(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function renderPassage(verses, entry) {
  const section = el('section', {
    className: 'title-detail-passage',
    'aria-label': 'Texto bíblico da passagem',
  });

  section.appendChild(el('div', { className: 'title-detail-passage-heading' }, [
    el('h2', {}, 'Texto bíblico'),
    el('span', { className: 'title-detail-passage-reference' }, entry.reference),
  ]));

  const startIndex = entry.startVerseIndex;
  const endIndex = Math.min(Number(entry.endVerse) || verses.length, verses.length);
  const passageVerses = verses.slice(startIndex, endIndex);

  if (!passageVerses.length) {
    section.appendChild(el('p', { className: 'title-detail-passage-error' },
      'Não foi possível localizar o texto desta passagem.'));
    return section;
  }

  const content = el('div', { className: 'title-detail-passage-content' });

  passageVerses.forEach((verse, index) => {
    const verseNumber = startIndex + index + 1;
    content.appendChild(el('p', {
      className: 'title-detail-passage-verse',
      dataset: { audioTarget: `verse-${verseNumber}` },
    }, [
      el('span', { className: 'title-detail-verse-number' }, String(verseNumber)),
      el('span', { className: 'title-detail-verse-text' }, verse),
    ]));
  });

  section.appendChild(content);
  return section;
}

function renderReferences(references) {
  const section = el('section', {
    className: 'title-detail-section',
    dataset: { audioTarget: 'references' },
  });
  section.appendChild(el('h2', {}, 'Referências bíblicas'));
  const list = el('ul', { className: 'title-detail-references' });

  references.forEach((item) => {
    if (!item || !item.ref) return;
    list.appendChild(el('li', {}, [
      el('strong', {}, item.ref),
      item.explicacao ? el('span', {}, ` — ${item.explicacao}`) : null,
    ]));
  });

  section.appendChild(list);
  return section;
}

function montarFilaDeAudio(entry, verses) {
  const queue = [];
  const add = (text, target = null) => {
    const value = limparTexto(text);
    if (value) queue.push({ text: value, target });
  };

  // Apresentação do estudo.
  add(entry.title, 'study-title');
  const intervalo = Number(entry.startVerse) === Number(entry.endVerse)
    ? `versículo ${entry.startVerse}`
    : `versículos ${entry.startVerse} a ${entry.endVerse}`;

  add(`Passagem bíblica: ${entry.bookName}, capítulo ${entry.chapterNumber}, ${intervalo}.`);

  // Leitura bíblica, versículo por versículo.
  if (verses) {
    const start = entry.startVerseIndex;
    const end = Math.min(Number(entry.endVerse) || verses.length, verses.length);

    for (let index = start; index < end; index += 1) {
      const number = index + 1;
      add(`Versículo ${number}. ${verses[index]}`, `verse-${number}`);
    }
  }

  // Explicações e demais conteúdos do estudo.
  const study = entry.study;
  if (study) {
    add(study.explicacao && `Explicação. ${study.explicacao}`, 'study-explicacao');
    add(study.contexto && `Contexto bíblico. ${study.contexto}`, 'study-contexto');
    add(study.aplicacao && `Aplicação. ${study.aplicacao}`, 'study-aplicacao');
    add(study.conceitos && `Conceitos importantes. ${study.conceitos}`, 'study-conceitos');

    if (Array.isArray(study.referencias) && study.referencias.length) {
      const references = study.referencias
        .filter((item) => item && item.ref)
        .map((item) => {
          const explanation = limparTexto(item.explicacao);
          const reference = referenciaParaFala(item.ref);
          return explanation ? `${reference}. ${explanation}` : reference;
        });

      if (references.length) {
        add(`Referências bíblicas relacionadas. ${references.join('. ')}`, 'references');
      }
    }
  }

  return queue;
}
export const titleStudyDetailPage = {
  async render(container, params, isCurrent = () => true) {
    container.innerHTML = '<p class="state-message">Carregando passagem e estudo…</p>';

    let entry;
    try {
      entry = await getTitleEntry(params.book, params.chapter, params.verse);
    } catch (error) {
      if (!isCurrent()) return;
      container.innerHTML = `<p class="state-message error">${error.message || 'Não foi possível abrir o estudo.'}</p>`;
      return;
    }

    if (!isCurrent()) return;

    if (!entry) {
      container.innerHTML = '<p class="state-message error">Título não encontrado no índice.</p>';
      return;
    }

    let verses = null;
    let passageError = false;

    try {
      verses = await getChapter(entry.bookIndex, entry.chapterIndex);
    } catch (_error) {
      passageError = true;
    }

    if (!isCurrent()) return;

    const [label, statusClass] = statusText(entry.status);
    const article = el('article', { className: 'title-detail-page' });

    article.appendChild(el('div', { className: 'title-detail-topline' }, [
      el('span', { className: `title-index-status ${statusClass}` }, label),
      el('span', { className: 'title-detail-reference' }, entry.reference),
    ]));

    const headingRow = el('div', { className: 'title-detail-heading-row' }, [
      el('h1', { className: 'title-detail-heading', dataset: { audioTarget: 'study-title' } }, entry.title),
    ]);

    const audioAvailable = isSpeechSupported();
    let playButton = null;
    let stopButton = null;
    let status = null;
    let queue = [];
    let queueIndex = 0;
    let playbackToken = 0;
    let playbackState = 'idle';

    if (audioAvailable) {
      playButton = el('button', {
        type: 'button',
        className: 'icon-btn title-detail-audio',
        title: 'Ouvir passagem e estudo',
        'aria-label': 'Iniciar narração da passagem e do estudo',
      });
      playButton.innerHTML = icons.listen;

      stopButton = el('button', {
        type: 'button',
        className: 'icon-btn title-detail-audio-stop',
        title: 'Parar narração',
        'aria-label': 'Parar narração',
        disabled: true,
      });
      stopButton.innerHTML = icons.stop;

      headingRow.append(playButton, stopButton);
      status = el('p', {
        className: 'title-detail-audio-status',
        'aria-live': 'polite',
        hidden: true,
      });
    }

    article.appendChild(headingRow);
    if (status) article.appendChild(status);

    if (verses) {
      article.appendChild(renderPassage(verses, entry));
    } else if (passageError) {
      article.appendChild(el('p', { className: 'title-detail-unavailable' },
        'Não foi possível carregar o texto bíblico. Você ainda pode tentar abrir a passagem no leitor.'));
    }

    if (!entry.study) {
      article.appendChild(el('p', { className: 'title-detail-unavailable' },
        'O estudo desta passagem ainda não está disponível.'));
    } else {
      const study = entry.study;

      if (study.identificacao) {
        article.appendChild(el('p', {
          className: 'title-detail-identification',
          dataset: { audioTarget: 'identification' },
        }, study.identificacao));
      }

      const fields = [
        ['Explicação', study.explicacao, 'study-explicacao'],
        ['Contexto', study.contexto, 'study-contexto'],
        ['Aplicação', study.aplicacao, 'study-aplicacao'],
        ['Conceitos', study.conceitos, 'study-conceitos'],
      ];

      fields.forEach(([heading, content, target]) => {
        if (typeof content !== 'string' || !content.trim()) return;

        article.appendChild(el('section', {
          className: 'title-detail-section',
          dataset: { audioTarget: target },
        }, [
          el('h2', {}, heading),
          el('p', { className: 'title-detail-text' }, content),
        ]));
      });

      if (Array.isArray(study.referencias) && study.referencias.length) {
        article.appendChild(renderReferences(study.referencias));
      }
    }

    article.appendChild(el('div', { className: 'title-detail-actions' }, [
      el('button', {
        type: 'button',
        className: 'read-btn read-btn--primary',
        onClick: () => {
          stopSpeech();
          navigateTo(`/biblia/${entry.bookIndex}/${entry.chapterIndex}/versiculo/${entry.startVerseIndex}`);
        },
      }, 'Abrir no leitor'),
      el('button', {
        type: 'button',
        className: 'read-btn',
        onClick: () => {
          stopSpeech();
          navigateTo('/indice-titulos');
        },
      }, 'Voltar ao índice'),
    ]));

    container.replaceChildren(article);

    if (!audioAvailable) return;

    function clearHighlights() {
      article.querySelectorAll('.audio-reading-current').forEach((node) => {
        node.classList.remove('audio-reading-current');
      });
    }

    function updateAudioControls() {
      const playing = playbackState === 'playing';
      playButton.innerHTML = playing ? icons.pause : icons.listen;
      playButton.classList.toggle('playing', playing);
      playButton.title = playing ? 'Pausar narração' : playbackState === 'paused' ? 'Continuar narração' : 'Ouvir passagem e estudo';
      playButton.setAttribute('aria-label', playButton.title);
      stopButton.disabled = playbackState === 'idle' || playbackState === 'finished';
    }

    function highlightTarget(target) {
      clearHighlights();
      if (!target) return;

      const node = article.querySelector(`[data-audio-target="${target}"]`);
      if (!node) return;

      node.classList.add('audio-reading-current');
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function stopPlayback() {
      playbackToken += 1;
      playbackState = 'idle';
      queue = [];
      queueIndex = 0;
      void stopSpeech();
      clearHighlights();
      status.hidden = true;
      status.textContent = '';
      updateAudioControls();
    }

    function finishPlayback(token) {
      if (token !== playbackToken) return;
      playbackState = 'finished';
      queue = [];
      clearHighlights();
      status.textContent = 'Narração concluída.';
      status.hidden = false;
      updateAudioControls();
    }

    function playNext(token) {
      if (token !== playbackToken || playbackState !== 'playing') return;
      if (!isCurrent()) {
        stopPlayback();
        return;
      }

      if (queueIndex >= queue.length) {
        finishPlayback(token);
        return;
      }

      const segment = queue[queueIndex];
      status.textContent = `Lendo ${queueIndex + 1} de ${queue.length} trechos`;
      status.hidden = false;

      speak(segment.text, {
        onStart: () => {
          if (token === playbackToken && playbackState === 'playing') {
            highlightTarget(segment.target);
          }
        },
        onEnd: () => {
          if (token !== playbackToken || playbackState !== 'playing') return;
          queueIndex += 1;
          playNext(token);
        },
        onError: () => {
          if (token !== playbackToken) return;
          playbackState = 'idle';
          clearHighlights();
          status.textContent = 'Não foi possível continuar a narração.';
          updateAudioControls();
        },
      });
    }

    function startPlayback() {
      stopPlayback();
      queue = montarFilaDeAudio(entry, verses);
      queueIndex = 0;

      if (!queue.length) {
        status.textContent = 'Não há conteúdo disponível para narrar.';
        status.hidden = false;
        return;
      }

      playbackToken += 1;
      playbackState = 'playing';
      const token = playbackToken;
      updateAudioControls();
      playNext(token);
    }

    function pausePlayback() {
      if (playbackState !== 'playing') return;
      playbackToken += 1;
      playbackState = 'paused';
      void stopSpeech();
      status.textContent = 'Narração pausada. Ao continuar, o trecho atual será repetido.';
      updateAudioControls();
    }

    function resumePlayback() {
      if (playbackState !== 'paused') return;
      playbackToken += 1;
      playbackState = 'playing';
      const token = playbackToken;
      updateAudioControls();
      playNext(token);
    }

    playButton.addEventListener('click', () => {
      if (playbackState === 'playing') pausePlayback();
      else if (playbackState === 'paused') resumePlayback();
      else startPlayback();
    });

    stopButton.addEventListener('click', stopPlayback);
  },
};
