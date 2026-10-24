// Botão "Diário" do leitor: escolhe em quais temas guardar o versículo tocado.
// Usa o repositório do diário que já existe (diaryRepository).
import { toast } from '../../utils/toast.js';
import { getBook } from '../../data-access/bibleRepository.js';
import { diaryRepository } from '../../data-access/diaryRepository.js';

const ESTILO_CAMPO =
  'width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid var(--border);' +
  'background:var(--navy-deep);color:var(--text-primary);font:inherit;font-size:16px;';

let aberto = false;

function criar(tag, atributos = {}, filhos = []) {
  const e = document.createElement(tag);
  Object.entries(atributos).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null) return;
    if (chave === 'style') e.style.cssText = valor;
    else if (chave === 'texto') e.textContent = valor;
    else e.setAttribute(chave, valor);
  });
  [].concat(filhos).forEach((f) => {
    if (f) e.append(f);
  });
  return e;
}

function normalizar(nome) {
  return String(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function nomeDoLivro(bookIndex) {
  try {
    const livro = await getBook(bookIndex);
    return (livro && livro.name) || `Livro ${bookIndex + 1}`;
  } catch (_e) {
    return `Livro ${bookIndex + 1}`;
  }
}

export async function abrirSelecaoDeTemas({ bookIndex, chapterIndex, verseIndex, texto = '' }) {
  if (aberto) return;
  aberto = true;
  const bookName = await nomeDoLivro(bookIndex);
  const info = { bookIndex, bookName, chapterIndex, verseIndex };
  const referencia = `${bookName} ${chapterIndex + 1}:${verseIndex + 1}`;
  const resumo = String(texto || '').trim();
  const curto = resumo.length > 300 ? `${resumo.slice(0, 297)}…` : resumo;

  const fundo = criar('div', {
    style: 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;',
  });
  const caixa = criar('div', {
    role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Guardar no Diário de Estudo',
    style:
      'width:min(440px,100%);max-height:90vh;overflow:auto;background:var(--navy);color:var(--text-primary);' +
      'border:1px solid var(--border);border-radius:18px;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.45);',
  });
  const fechar = () => {
    aberto = false;
    fundo.remove();
  };

  const lista = criar('div');
  const novoNome = criar('input', { type: 'text', maxlength: '80', placeholder: 'Criar tema novo…', 'aria-label': 'Nome do novo tema', style: ESTILO_CAMPO });
  const erro = criar('p', { style: 'margin:8px 0 0;color:var(--danger);font-size:14px;' });
  const criarEGuardar = criar('button', { type: 'button', class: 'tool-btn', texto: 'Criar e guardar', style: 'margin-top:10px;width:100%;padding:12px 10px;' });
  const concluir = criar('button', { type: 'button', class: 'read-btn read-btn--primary', texto: 'Concluir', style: 'margin-top:16px;width:100%;padding:12px 10px;' });

  function desenhar() {
    const marcados = new Set(diaryRepository.temasDoVersiculo(bookIndex, chapterIndex, verseIndex));
    const temas = diaryRepository.listar();
    lista.replaceChildren();
    if (!temas.length) {
      lista.append(criar('p', { texto: 'Você ainda não tem temas. Crie o primeiro abaixo.', style: 'opacity:.8;font-size:14px;' }));
    }
    temas.forEach((tema) => {
      const marca = criar('input', { type: 'checkbox', 'aria-label': tema.nome, style: 'width:22px;height:22px;flex:none;' });
      marca.checked = marcados.has(tema.id);
      marca.addEventListener('change', () => {
        const quis = marca.checked;
        const ligado = diaryRepository.alternarVersiculo(tema.id, info);
        if (ligado === null) {
          marca.checked = !quis;
          toast.error('Não foi possível guardar este versículo.');
          return;
        }
        if (!quis && ligado === true) {
          // O versículo estava dentro de uma passagem maior deste tema: desfaz o que acabou de ser criado.
          diaryRepository.alternarVersiculo(tema.id, info);
          marca.checked = true;
          toast.info('Este versículo faz parte de uma passagem maior deste tema. Para tirá-lo, abra o tema.');
          return;
        }
        marca.checked = ligado;
        toast.info(ligado ? `Guardado em "${tema.nome}"` : `Removido de "${tema.nome}"`);
      });
      lista.append(
        criar('label', { style: 'display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid var(--border);cursor:pointer;' }, [
          marca, criar('span', { texto: tema.nome, style: 'flex:1;' }),
        ]),
      );
    });
  }

  function criarTemaNovo() {
    const nome = novoNome.value.trim();
    if (!nome) {
      erro.textContent = 'Dê um nome ao tema.';
      return;
    }
    if (diaryRepository.listar().some((t) => normalizar(t.nome) === normalizar(nome))) {
      erro.textContent = 'Já existe um tema com esse nome.';
      return;
    }
    const tema = diaryRepository.criar({ nome, descricao: '' });
    if (!tema) {
      erro.textContent = 'Não foi possível criar o tema.';
      return;
    }
    const ligado = diaryRepository.alternarVersiculo(tema.id, info);
    if (ligado === null) {
      erro.textContent = 'O tema foi criado, mas não foi possível guardar o versículo.';
      desenhar();
      return;
    }
    novoNome.value = '';
    erro.textContent = '';
    desenhar();
    toast.success(`Guardado em "${tema.nome}"`);
  }

  criarEGuardar.addEventListener('click', criarTemaNovo);
  novoNome.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      criarTemaNovo();
    }
  });
  concluir.addEventListener('click', fechar);

  caixa.append(
    criar('h2', { texto: 'Guardar no Diário', style: 'margin:0 0 12px;font-size:20px;color:var(--gold);font-family:var(--font-display);' }),
    criar('p', { texto: referencia, style: 'margin:0;color:var(--gold);font-weight:600;' }),
    criar('p', { texto: curto ? `"${curto}"` : '', style: 'margin:6px 0 14px;font-size:14px;opacity:.85;line-height:1.5;' }),
    lista,
    criar('div', { style: 'margin-top:14px;' }, [novoNome, criarEGuardar]),
    erro,
    concluir,
  );
  fundo.append(caixa);
  document.body.append(fundo);
  desenhar();
}
