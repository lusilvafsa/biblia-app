import {
  getItem,
  setItem,
  STORAGE_KEYS
} from '../utils/storage.js';

import { supabase } from '../supabaseClient.js';
import { usuarioAtual } from '../supabaseAuth.js';

const DEFAULT_PROGRESS = {
  book: 0,
  chapter: 0,
  verse: 0
};

function getUser() {
  return usuarioAtual();
}

function getStorageKey() {
  const user = getUser();

  return user
    ? `${STORAGE_KEYS.bibleProgress}:${user.id}`
    : STORAGE_KEYS.bibleProgress;
}

function normalizeProgress(progress) {
  if (
    !progress ||
    typeof progress.book !== 'number' ||
    typeof progress.chapter !== 'number'
  ) {
    return { ...DEFAULT_PROGRESS };
  }

  return {
    book: progress.book,
    chapter: progress.chapter,
    verse: typeof progress.verse === 'number'
      ? progress.verse
      : 0
  };
}

function hasProgress(progress) {
  return (
    progress.book !== 0 ||
    progress.chapter !== 0 ||
    progress.verse !== 0
  );
}

function readLocalProgress() {
  return normalizeProgress(
    getItem(getStorageKey(), null)
  );
}

function writeLocalProgress(progress) {
  return setItem(
    getStorageKey(),
    normalizeProgress(progress)
  );
}

function readAnonymousProgress() {
  return normalizeProgress(
    getItem(STORAGE_KEYS.bibleProgress, null)
  );
}

async function saveCloudProgress(progress) {
  const user = getUser();

  if (!user) return;

  const normalized = normalizeProgress(progress);

  try {
    const { error } = await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: user.id,
          book: normalized.book,
          chapter: normalized.chapter,
          verse: normalized.verse,
          bible_version: 'ARC',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    console.log(
      '[Supabase Progress] Progresso salvo:',
      user.id,
      normalized
    );
  } catch (error) {
    console.error(
      '[Supabase Progress] Erro ao salvar progresso:',
      error
    );
  }
}

async function loadCloudProgress() {
  const user = getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('reading_progress')
    .select('book, chapter, verse, bible_version, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error(
      '[Supabase Progress] Erro ao carregar progresso:',
      error
    );
    throw error;
  }

  return data ? normalizeProgress(data) : null;
}

export const LocalStorageProgressRepository = {
  async getProgress() {
    // A leitura local nunca aguarda a conexão com o Supabase.
    return readLocalProgress();
  },

  async saveProgress(progress) {
    const current = readLocalProgress();

    const nextProgress = normalizeProgress({
      book: typeof progress?.book === 'number'
        ? progress.book
        : current.book,

      chapter: typeof progress?.chapter === 'number'
        ? progress.chapter
        : current.chapter,

      verse: typeof progress?.verse === 'number'
        ? progress.verse
        : current.verse
    });

    // Salva primeiro no aparelho, mesmo sem login.
    writeLocalProgress(nextProgress);

    // A sincronização é secundária e não bloqueia a leitura.
    if (getUser()) {
      void saveCloudProgress(nextProgress);
    }
  },

  async syncWithCloud() {
    const user = getUser();

    if (!user) {
      return readAnonymousProgress();
    }

    // Sem conexão, mantém os dados locais e adia a sincronização.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return readLocalProgress();
    }

    // Primeiro verifica se a conta já possui progresso na nuvem.
    const cloudProgress = await loadCloudProgress();

    if (cloudProgress) {
      writeLocalProgress(cloudProgress);
      return cloudProgress;
    }

    // Sem registro na nuvem, preserva o progresso local da conta.
    const accountProgress = readLocalProgress();

    if (hasProgress(accountProgress)) {
      await saveCloudProgress(accountProgress);
      return accountProgress;
    }

    // Só importa o progresso anônimo se a conta estiver vazia.
    const anonymousProgress = readAnonymousProgress();

    if (hasProgress(anonymousProgress)) {
      writeLocalProgress(anonymousProgress);
      await saveCloudProgress(anonymousProgress);
      return anonymousProgress;
    }

    return { ...DEFAULT_PROGRESS };
  }
};

export const progressRepository =
  LocalStorageProgressRepository;
