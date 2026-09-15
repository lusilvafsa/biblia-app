// Repositório do progresso de leitura do usuário.
//
// Hoje persiste em localStorage. A forma abaixo (getProgress/saveProgress)
// foi escolhida de propósito: no futuro, uma `ApiProgressRepository` com a
// mesma forma poderia buscar/gravar o progresso em um backend, sem exigir
// mudanças nas telas que o consomem.
//
//   getProgress(): Promise<{ book: number, chapter: number, verse: number }>
//   saveProgress(progress): Promise<void>
//
// `verse` é o versículo em que a narrativa (leitura em voz alta) parou —
// permite retomar exatamente de onde a narrativa foi pausada, mesmo depois
// de fechar e reabrir o app.

import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';

const DEFAULT_PROGRESS = { book: 0, chapter: 0, verse: 0 };

export const LocalStorageProgressRepository = {
  async getProgress() {
    const saved = getItem(STORAGE_KEYS.bibleProgress, null);
    if (!saved || typeof saved.book !== 'number' || typeof saved.chapter !== 'number') {
      return { ...DEFAULT_PROGRESS };
    }
    return { verse: 0, ...saved };
  },

  async saveProgress(progress) {
    const current = getItem(STORAGE_KEYS.bibleProgress, DEFAULT_PROGRESS) || DEFAULT_PROGRESS;
    setItem(STORAGE_KEYS.bibleProgress, {
      book: progress.book,
      chapter: progress.chapter,
      verse: typeof progress.verse === 'number' ? progress.verse : current.verse || 0,
    });
  },
};

// Implementação ativa hoje. Trocar por uma ApiProgressRepository no futuro
// não deve exigir mudanças em quem importa `progressRepository`.
export const progressRepository = LocalStorageProgressRepository;
