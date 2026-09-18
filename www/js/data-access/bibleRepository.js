// Camada de acesso aos dados bíblicos.
//
// Os dados vêm de um JSON estático por versão (data/bible-<id>.json),
// carregado sob demanda (só quando o usuário entra na Bíblia) para manter
// a carga inicial leve, e mantido em cache por versão — trocar de versão
// não precisa recarregar a que já foi carregada. A interface abaixo foi
// desenhada para que, no futuro, uma implementação equivalente possa
// buscar os mesmos dados de uma API/backend sem exigir mudanças nas telas
// que a consomem:
//
//   getAllBooks()              -> [{ index, name, abbrev, chapterCount }]
//   getChapter(bookIndex, ch)  -> string[] (versículos do capítulo)
//   search(query, limit)       -> resultados encontrados no texto
//
// Basta criar, por exemplo, um `ApiBibleRepository` com a mesma forma e
// trocar a importação nas features que usam este módulo.
import { getBibleVersionMeta } from '../state/bibleVersion.js';
import { getVersionMeta } from '../../data/bibleVersions.js';

const cacheByVersion = new Map(); // id -> dados carregados
const loadPromiseByVersion = new Map(); // id -> Promise em andamento

function loadVersionData(meta) {
  if (!meta.available) {
    return Promise.reject(
      new Error(`O arquivo de dados de "${meta.name}" ainda não foi adicionado a este projeto (data/${meta.file}).`)
    );
  }
  if (cacheByVersion.has(meta.id)) return Promise.resolve(cacheByVersion.get(meta.id));
  if (loadPromiseByVersion.has(meta.id)) return loadPromiseByVersion.get(meta.id);

  const dataUrl = new URL(`../../data/${meta.file}`, import.meta.url);
  const promise = fetch(dataUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`Falha ao carregar dados da Bíblia (HTTP ${res.status})`);
      return res.json();
    })
    .then((data) => {
      cacheByVersion.set(meta.id, data);
      loadPromiseByVersion.delete(meta.id);
      return data;
    })
    .catch((err) => {
      loadPromiseByVersion.delete(meta.id); // permite tentar novamente
      throw err;
    });

  loadPromiseByVersion.set(meta.id, promise);
  return promise;
}

function load() {
  return loadVersionData(getBibleVersionMeta());
}

export async function getAllBooks() {
  const data = await load();
  return data.map((book, index) => ({
    index,
    name: book.name,
    abbrev: book.abbrev,
    chapterCount: book.chapters.length,
    testament: index < 39 ? 'old' : 'new',
  }));
}

export async function getBook(bookIndex) {
  const data = await load();
  const book = data[bookIndex];
  if (!book) throw new Error(`Livro inválido: ${bookIndex}`);
  return { index: bookIndex, name: book.name, abbrev: book.abbrev, chapterCount: book.chapters.length };
}

export async function getChapter(bookIndex, chapterIndex) {
  const data = await load();
  const book = data[bookIndex];
  if (!book) throw new Error(`Livro inválido: ${bookIndex}`);
  const verses = book.chapters[chapterIndex];
  if (!verses) throw new Error(`Capítulo inválido: ${bookIndex}/${chapterIndex}`);
  return verses;
}

/** Busca um único versículo numa versão específica, sem trocar a versão
 * atualmente selecionada no app. Usado pelo comparador de versões. */
export async function getVerseFromVersion(versionId, bookIndex, chapterIndex, verseIndex) {
  const meta = getVersionMeta(versionId);
  const data = await loadVersionData(meta);
  const book = data[bookIndex];
  if (!book) throw new Error(`Livro inválido: ${bookIndex}`);
  const chapter = book.chapters[chapterIndex];
  if (!chapter) throw new Error(`Capítulo inválido: ${bookIndex}/${chapterIndex}`);
  const verse = chapter[verseIndex];
  if (verse === undefined) throw new Error(`Versículo inválido: ${bookIndex}/${chapterIndex}/${verseIndex}`);
  return verse;
}

/** Busca um termo em todo o texto bíblico. Retorna no máximo `limit` resultados. */
export async function search(query, limit = 50) {
  const data = await load();
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const results = [];
  for (let bIdx = 0; bIdx < data.length; bIdx++) {
    const book = data[bIdx];
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
