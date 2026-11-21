// Acesso aos títulos por livro e associação com estudos. Os arquivos de títulos
// continuam sendo a fonte canônica; este módulo apenas os normaliza em memória.
import { TITLE_STUDIES } from '../../data/titleStudies.js';
import { getTitleStudyStatus } from '../../data/titleStudyStatus.js';
import { getAllBooks, getChapter } from './bibleRepository.js';

let titleIndexPromise = null;
const chapterLengthCache = new Map();

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseStudyEnd(study, book, chapterNumber, startVerse) {
  if (!study || typeof study.identificacao !== 'string') return null;
  const escapedBook = book.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = study.identificacao.match(new RegExp(
    '^' + escapedBook + '\\s+(\\d+):(\\d+)(?:\\s*[–-]\\s*(\\d+))?', 'i'
  ));
  if (!match || Number(match[1]) !== chapterNumber || Number(match[2]) !== startVerse) return null;
  return Number(match[3] || match[2]);
}

async function getChapterLength(bookIndex, chapterIndex) {
  const cacheKey = `${bookIndex}-${chapterIndex}`;
  if (!chapterLengthCache.has(cacheKey)) {
    chapterLengthCache.set(cacheKey, getChapter(bookIndex, chapterIndex).then((verses) => verses.length));
  }
  return chapterLengthCache.get(cacheKey);
}

async function loadBookTitles(book) {
  const url = new URL(`../../data/titles/${book.index}.json`, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível carregar os títulos de ${book.name}.`);
  return response.json();
}

async function buildTitleIndex() {
  const books = await getAllBooks();
  const bookTitleData = [];
  const batchSize = 8;
  for (let offset = 0; offset < books.length; offset += batchSize) {
    const batch = books.slice(offset, offset + batchSize);
    bookTitleData.push(...await Promise.all(batch.map(loadBookTitles)));
  }

  const entries = [];
  for (const book of books) {
    const chapters = bookTitleData[book.index] || {};
    for (const [chapterText, verseTitles] of Object.entries(chapters)) {
      const chapterNumber = Number(chapterText);
      const chapterIndex = chapterNumber - 1;
      const starts = Object.keys(verseTitles)
        .map(Number)
        .filter((verse) => Number.isInteger(verse) && verse >= 1)
        .sort((a, b) => a - b);

      for (let index = 0; index < starts.length; index += 1) {
        const startVerse = starts[index];
        const nextStart = starts[index + 1];
        const key = `${book.index}-${chapterIndex}-${startVerse - 1}`;
        const study = TITLE_STUDIES[key] || null;
        let endVerse = nextStart ? nextStart - 1 : parseStudyEnd(study, book, chapterNumber, startVerse);

        // Para títulos sem estudo no fim do capítulo, use o comprimento real
        // da ACF acessada pelo repositório, sem estimar o limite.
        if (!endVerse) endVerse = await getChapterLength(book.index, chapterIndex);

        const reference = `${book.name} ${chapterNumber}:${startVerse}` +
          (endVerse > startVerse ? `–${endVerse}` : '');
        const status = study
          ? (getTitleStudyStatus(key) || 'unverified')
          : 'missing';

        entries.push({
          key,
          bookIndex: book.index,
          bookName: book.name,
          bookAbbrev: book.abbrev || '',
          chapterIndex,
          chapterNumber,
          startVerseIndex: startVerse - 1,
          startVerse,
          endVerse,
          title: verseTitles[String(startVerse)],
          reference,
          study,
          status,
          searchText: normalizeText(`${verseTitles[String(startVerse)]} ${book.name} ${book.abbrev || ''} ${reference}`),
        });
      }
    }
  }

  entries.sort((a, b) => a.bookIndex - b.bookIndex || a.chapterIndex - b.chapterIndex || a.startVerseIndex - b.startVerseIndex);
  return { books, entries };
}

export function getTitleIndex() {
  if (!titleIndexPromise) {
    titleIndexPromise = buildTitleIndex().catch((error) => {
      titleIndexPromise = null;
      throw error;
    });
  }
  return titleIndexPromise;
}

export async function getTitleEntry(bookIndex, chapterIndex, startVerseIndex) {
  const { entries } = await getTitleIndex();
  return entries.find((entry) => entry.bookIndex === Number(bookIndex) &&
    entry.chapterIndex === Number(chapterIndex) &&
    entry.startVerseIndex === Number(startVerseIndex)) || null;
}

export function normalizeTitleSearch(value) {
  return normalizeText(value);
}
