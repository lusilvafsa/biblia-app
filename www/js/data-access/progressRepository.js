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

  if (!user) {
    return null;
  }

  return `${STORAGE_KEYS.bibleProgress}:${user.id}`;
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
    verse:
      typeof progress.verse === 'number'
        ? progress.verse
        : 0
  };
}

function readLocalProgress() {
  const key = getStorageKey();

  if (!key) {
    return { ...DEFAULT_PROGRESS };
  }

  return normalizeProgress(getItem(key, null));
}

function writeLocalProgress(progress) {
  const key = getStorageKey();

  if (!key) {
    return false;
  }

  return setItem(
    key,
    normalizeProgress(progress)
  );
}

async function saveCloudProgress(progress) {
  const user = getUser();

  if (!user) {
    return;
  }

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
        {
          onConflict: 'user_id'
        }
      );

    if (error) {
      throw error;
    }

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

  if (!user) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select(
        'book, chapter, verse, bible_version, updated_at'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return normalizeProgress(data);
  } catch (error) {
    console.error(
      '[Supabase Progress] Erro ao carregar progresso:',
      error
    );

    return null;
  }
}

export const LocalStorageProgressRepository = {
  async getProgress() {
    const user = getUser();

    if (!user) {
      return { ...DEFAULT_PROGRESS };
    }

    const localProgress = readLocalProgress();

    const cloudProgress = await loadCloudProgress();

    if (cloudProgress) {
      writeLocalProgress(cloudProgress);
      return cloudProgress;
    }

    if (
      localProgress.book !== 0 ||
      localProgress.chapter !== 0 ||
      localProgress.verse !== 0
    ) {
      await saveCloudProgress(localProgress);
      return localProgress;
    }

    return { ...DEFAULT_PROGRESS };
  },

  async saveProgress(progress) {
    const user = getUser();

    if (!user) {
      console.warn(
        '[Supabase Progress] Progresso ignorado: usuário não autenticado.'
      );
      return;
    }

    const current = readLocalProgress();

    const nextProgress = {
      book:
        typeof progress?.book === 'number'
          ? progress.book
          : current.book,

      chapter:
        typeof progress?.chapter === 'number'
          ? progress.chapter
          : current.chapter,

      verse:
        typeof progress?.verse === 'number'
          ? progress.verse
          : current.verse
    };

    writeLocalProgress(nextProgress);

    void saveCloudProgress(nextProgress);
  },

  async syncWithCloud() {
    const user = getUser();

    if (!user) {
      return { ...DEFAULT_PROGRESS };
    }

    const cloudProgress = await loadCloudProgress();

    if (cloudProgress) {
      writeLocalProgress(cloudProgress);
      return cloudProgress;
    }

    const localProgress = readLocalProgress();

    if (
      localProgress.book !== 0 ||
      localProgress.chapter !== 0 ||
      localProgress.verse !== 0
    ) {
      await saveCloudProgress(localProgress);
    }

    return localProgress;
  }
};

export const progressRepository =
  LocalStorageProgressRepository;
