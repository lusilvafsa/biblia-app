// Diário de Estudo: temas e passagens associadas. Fica salvo só no aparelho
// (funciona sem login); exportar e importar servem de cópia de segurança.
import { getItem, setItem } from '../utils/storage.js';

const CHAVE = 'biblia:study-diary';

function ler() {
  const dados = getItem(CHAVE, []);
  return Array.isArray(dados) ? dados : [];
}

function gravar(temas) {
  setItem(CHAVE, temas);
}

function agora() {
  return new Date().toISOString();
}

function novoId(prefixo) {
  return prefixo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function idSeguro(valor, prefixo) {
  const limpo = String(valor || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
  return limpo || novoId(prefixo);
}

function inteiro(v) {
  return Number.isInteger(v) && v >= 0 ? v : null;
}

function limparPassagem(p) {
  if (!p) return null;
  const bookIndex = inteiro(p.bookIndex);
  const chapterIndex = inteiro(p.chapterIndex);
  const verseStart = inteiro(p.verseStart);
  let verseEnd = inteiro(p.verseEnd);
  if (bookIndex === null || chapterIndex === null || verseStart === null) return null;
  if (verseEnd === null || verseEnd < verseStart) verseEnd = verseStart;
  return {
    id: idSeguro(p.id, 'p'),
    bookIndex,
    bookName: String(p.bookName || '').slice(0, 60),
    chapterIndex,
    verseStart,
    verseEnd,
    nota: String(p.nota || '').slice(0, 4000),
  };
}

function mesmaPassagem(a, b) {
  return a.bookIndex === b.bookIndex && a.chapterIndex === b.chapterIndex &&
    a.verseStart === b.verseStart && a.verseEnd === b.verseEnd;
}

export const diaryRepository = {
  listar() {
    return ler().slice().sort((a, b) => String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')));
  },

  obter(id) {
    return ler().find((t) => t.id === id) || null;
  },

  criar({ nome, descricao }) {
    const nomeLimpo = String(nome || '').trim().slice(0, 80);
    if (!nomeLimpo) return null;
    const tema = {
      id: novoId('tema'),
      nome: nomeLimpo,
      descricao: String(descricao || '').trim().slice(0, 500),
      passagens: [],
      criadoEm: agora(),
      atualizadoEm: agora(),
    };
    const temas = ler();
    temas.push(tema);
    gravar(temas);
    return tema;
  },

  atualizar(id, { nome, descricao }) {
    const temas = ler();
    const tema = temas.find((t) => t.id === id);
    const nomeLimpo = String(nome || '').trim().slice(0, 80);
    if (!tema || !nomeLimpo) return null;
    tema.nome = nomeLimpo;
    tema.descricao = String(descricao || '').trim().slice(0, 500);
    tema.atualizadoEm = agora();
    gravar(temas);
    return tema;
  },

  excluir(id) {
    gravar(ler().filter((t) => t.id !== id));
  },

  adicionarPassagem(temaId, dados) {
    const temas = ler();
    const tema = temas.find((t) => t.id === temaId);
    const p = limparPassagem(dados);
    if (!tema || !p) return null;
    if (tema.passagens.some((q) => mesmaPassagem(q, p))) return 'duplicada';
    tema.passagens.push(p);
    tema.atualizadoEm = agora();
    gravar(temas);
    return 'ok';
  },

  removerPassagem(temaId, passagemId) {
    const temas = ler();
    const tema = temas.find((t) => t.id === temaId);
    if (!tema) return;
    tema.passagens = tema.passagens.filter((p) => p.id !== passagemId);
    tema.atualizadoEm = agora();
    gravar(temas);
  },

  salvarNota(temaId, passagemId, nota) {
    const temas = ler();
    const tema = temas.find((t) => t.id === temaId);
    const p = tema && tema.passagens.find((x) => x.id === passagemId);
    if (!p) return;
    p.nota = String(nota || '').trim().slice(0, 4000);
    tema.atualizadoEm = agora();
    gravar(temas);
  },

  // Ids dos temas que contêm este versículo (sozinho ou dentro de um trecho).
  temasDoVersiculo(bookIndex, chapterIndex, verseIndex) {
    return ler()
      .filter((t) => t.passagens.some((p) => p.bookIndex === bookIndex && p.chapterIndex === chapterIndex &&
        verseIndex >= p.verseStart && verseIndex <= p.verseEnd))
      .map((t) => t.id);
  },

  // Liga ou desliga um versículo isolado num tema. Retorna true se ficou ligado.
  alternarVersiculo(temaId, info) {
    const temas = ler();
    const tema = temas.find((t) => t.id === temaId);
    if (!tema) return null;
    const alvo = limparPassagem({ bookIndex: info.bookIndex, bookName: info.bookName, chapterIndex: info.chapterIndex, verseStart: info.verseIndex, verseEnd: info.verseIndex });
    if (!alvo) return null;
    const existente = tema.passagens.find((q) => mesmaPassagem(q, alvo));
    if (existente) {
      tema.passagens = tema.passagens.filter((q) => q !== existente);
    } else {
      tema.passagens.push(alvo);
    }
    tema.atualizadoEm = agora();
    gravar(temas);
    return !existente;
  },

  exportar(ids) {
    const todos = ler();
    const escolhidos = ids && ids.length ? todos.filter((t) => ids.includes(t.id)) : todos;
    return {
      app: 'biblia-de-estudo-ls',
      tipo: 'diario',
      versao: 1,
      exportadoEm: agora(),
      temas: escolhidos,
    };
  },

  importar(obj) {
    if (!obj || obj.tipo !== 'diario' || !Array.isArray(obj.temas)) return null;
    const temas = ler();
    let novos = 0;
    let mesclados = 0;
    let passagens = 0;
    obj.temas.forEach((t) => {
      const nome = String((t && t.nome) || '').trim().slice(0, 80);
      if (!nome) return;
      const id = t.id ? idSeguro(t.id, 'tema') : null;
      let alvo = id ? temas.find((x) => x.id === id) : null;
      if (alvo) {
        mesclados++;
      } else {
        alvo = {
          id: id || novoId('tema'),
          nome,
          descricao: String(t.descricao || '').trim().slice(0, 500),
          passagens: [],
          criadoEm: agora(),
          atualizadoEm: agora(),
        };
        temas.push(alvo);
        novos++;
      }
      (Array.isArray(t.passagens) ? t.passagens : []).forEach((bruta) => {
        const p = limparPassagem(bruta);
        if (p && !alvo.passagens.some((q) => mesmaPassagem(q, p))) {
          alvo.passagens.push(p);
          passagens++;
        }
      });
      alvo.atualizadoEm = agora();
    });
    gravar(temas);
    return { novos, mesclados, passagens };
  },
};
