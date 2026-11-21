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

function getStorageKey(user = getUser()) {
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

function readLocalProgress(user = getUser()) {
  return normalizeProgress(
    getItem(getStorageKey(user), null)
  );
}

function writeLocalProgress(progress, user = getUser()) {
  return setItem(
    getStorageKey(user),
    normalizeProgress(progress)
  );
}

async function saveCloudProgress(progress, user = getUser()) {
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

async function loadCloudProgress(user = getUser()) {
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
    const user = getUser();
    const current = readLocalProgress(user);

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
    writeLocalProgress(nextProgress, user);

    // A sincronização usa a mesma conta capturada no início.
    if (user) {
      void saveCloudProgress(nextProgress, user);
    }
  },

  async syncWithCloud(user = getUser()) {
    if (!user) {
      return readLocalProgress(null);
    }

    // Sem conexão, mantém os dados locais e adia a sincronização.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return readLocalProgress(user);
    }

    // Primeiro verifica se a conta capturada possui progresso na nuvem.
    const cloudProgress = await loadCloudProgress(user);

    if (cloudProgress) {
      writeLocalProgress(cloudProgress, user);
      return cloudProgress;
    }

    // Sem registro na nuvem, preserva o progresso local dessa conta.
    const accountProgress = readLocalProgress(user);

    if (hasProgress(accountProgress)) {
      await saveCloudProgress(accountProgress, user);
      return accountProgress;
    }

    return { ...DEFAULT_PROGRESS };
  }
};

export const progressRepository =
  LocalStorageProgressRepository;
