// Camada de acesso aos dados bíblicos.
//
// Cada versão fica em data/bible/<id>/: um index.json leve (nome, abreviação
// e quantidade de capítulos dos 66 livros, sem o texto) e um arquivo
// <bookIndex>.json por livro (com o texto completo daquele livro), carregado
// só quando o usuário realmente abre aquele livro. Isso evita baixar os ~4MB
// de uma versão inteira só para ler um capítulo.
import { getBibleVersionMeta } from '../state/bibleVersion.js';
import { getVersionMeta } from '../../data/bibleVersions.js';

const indexCache = new Map(); // versionId -> índice leve dos 66 livros
const indexPromiseCache = new Map();
const bookCache = new Map(); // "versionId:bookIndex" -> livro completo
const bookPromiseCache = new Map();

function loadIndex(versionId) {
  if (indexCache.has(versionId)) return Promise.resolve(indexCache.get(versionId));
  if (indexPromiseCache.has(versionId)) return indexPromiseCache.get(versionId);

  const url = new URL(`../../data/bible/${versionId}/index.json`, import.meta.url);
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Falha ao carregar índice da Bíblia (HTTP ${res.status})`);
      return res.json();
    })
    .then((data) => {
      indexCache.set(versionId, data);
      indexPromiseCache.delete(versionId);
      return data;
    })
    .catch((err) => {
      indexPromiseCache.delete(versionId);
      throw err;
    });

  indexPromiseCache.set(versionId, promise);
  return promise;
}

function loadBook(versionId, bookIndex) {
  const chave = `${versionId}:${bookIndex}`;
  if (bookCache.has(chave)) return Promise.resolve(bookCache.get(chave));
  if (bookPromiseCache.has(chave)) return bookPromiseCache.get(chave);

  const url = new URL(`../../data/bible/${versionId}/${bookIndex}.json`, import.meta.url);
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Falha ao carregar livro (HTTP ${res.status})`);
      return res.json();
    })
    .then((data) => {
      bookCache.set(chave, data);
      bookPromiseCache.delete(chave);
      return data;
    })
    .catch((err) => {
      bookPromiseCache.delete(chave);
      throw err;
    });

  bookPromiseCache.set(chave, promise);
  return promise;
}

function currentVersionId() {
  const meta = getBibleVersionMeta();
  if (!meta.available) {
    throw new Error(`O arquivo de dados de "${meta.name}" ainda não foi adicionado a este projeto.`);
  }
  return meta.id;
}

export async function getAllBooks() {
  const indice = await loadIndex(currentVersionId());
  return indice.map((livro, index) => ({
    index,
    name: livro.name,
    abbrev: livro.abbrev,
    chapterCount: livro.chapterCount,
    testament: index < 39 ? 'old' : 'new',
  }));
}

export async function getBook(bookIndex) {
  const indice = await loadIndex(currentVersionId());
  const livro = indice[bookIndex];
  if (!livro) throw new Error(`Livro inválido: ${bookIndex}`);
  return { index: bookIndex, name: livro.name, abbrev: livro.abbrev, chapterCount: livro.chapterCount };
}

export async function getChapter(bookIndex, chapterIndex) {
  const livro = await loadBook(currentVersionId(), bookIndex);
  const verses = livro.chapters[chapterIndex];
  if (!verses) throw new Error(`Capítulo inválido: ${bookIndex}/${chapterIndex}`);
  return verses;
}

/** Busca um único versículo numa versão específica, sem trocar a versão
 * atualmente selecionada no app. Usado pelo comparador de versões. */
export async function getVerseFromVersion(versionId, bookIndex, chapterIndex, verseIndex) {
  getVersionMeta(versionId); // valida que a versão existe
  const livro = await loadBook(versionId, bookIndex);
  const chapter = livro.chapters[chapterIndex];
  if (!chapter) throw new Error(`Capítulo inválido: ${bookIndex}/${chapterIndex}`);
  const verse = chapter[verseIndex];
  if (verse === undefined) throw new Error(`Versículo inválido: ${bookIndex}/${chapterIndex}/${verseIndex}`);
  return verse;
}

/** Busca um termo em todo o texto bíblico. Carrega os livros necessários
 * sob demanda (em paralelo) — só quando o usuário realmente busca algo. */
export async function search(query, limit = 50) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const versionId = currentVersionId();
  const indice = await loadIndex(versionId);
  const livros = await Promise.all(indice.map((_, i) => loadBook(versionId, i)));

  const results = [];
  for (let bIdx = 0; bIdx < livros.length; bIdx++) {
    const book = livros[bIdx];
    for (let cIdx = 0; cIdx < book.chapters.length; cIdx++) {
      const chapter = book.chapters[cIdx];
      for (let vIdx = 0; vIdx < chapter.length; vIdx++) {
        if (chapter[vIdx].toLowerCase().includes(needle)) {
          results.push({
            bookName: book.name,
            bookIndex: bIdx,
            chapter: cIdx,
            verse: vIdx,
            text: chapter[vIdx],
          });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}
