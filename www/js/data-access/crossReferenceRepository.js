// Referências cruzadas (versículos relacionados), carregadas por livro sob
// demanda a partir de data/crossrefs/<bookIndex>.json. Dados derivados do
// projeto público OpenBible.info (licença CC BY 4.0) — mantidas apenas as
// 6 referências mais votadas por versículo, para manter cada arquivo leve.
const cacheByBook = new Map();
const loadPromiseByBook = new Map();

function loadBook(bookIndex) {
  if (cacheByBook.has(bookIndex)) return Promise.resolve(cacheByBook.get(bookIndex));
  if (loadPromiseByBook.has(bookIndex)) return loadPromiseByBook.get(bookIndex);

  const url = new URL(`../../data/crossrefs/${bookIndex}.json`, import.meta.url);
  const promise = fetch(url)
    .then((res) => (res.ok ? res.json() : {}))
    .then((data) => {
      cacheByBook.set(bookIndex, data);
      loadPromiseByBook.delete(bookIndex);
      return data;
    })
    .catch(() => {
      loadPromiseByBook.delete(bookIndex);
      return {};
    });

  loadPromiseByBook.set(bookIndex, promise);
  return promise;
}

/**
 * Retorna as referências relacionadas a um versículo, já com o nome do
 * livro resolvido.
 * @param {(bookIndex: number) => Promise<string>} getBookName
 */
export async function getCrossReferences(bookIndex, chapterIndex, verseIndex, getBookName) {
  const data = await loadBook(bookIndex);
  const lista = data[`${chapterIndex}.${verseIndex}`] || [];

  return Promise.all(
    lista.map(async (item) => {
      const [toBook, toChapter, toVerseStart, toVerseEnd] = item;
      const nome = await getBookName(toBook);
      const ref = toVerseEnd !== undefined
        ? `${nome} ${toChapter + 1}:${toVerseStart + 1}-${toVerseEnd + 1}`
        : `${nome} ${toChapter + 1}:${toVerseStart + 1}`;
      return { bookIndex: toBook, chapter: toChapter, verse: toVerseStart, ref };
    })
  );
}
