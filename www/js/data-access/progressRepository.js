import {
  getItem,
  setItem,
  STORAGE_KEYS
} from '../utils/storage.js';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

import {
  auth,
  db
} from '../firebase/firebaseConfig.js';

const DEFAULT_PROGRESS = {
  book: 0,
  chapter: 0,
  verse: 0
};

function getUser() {
  return auth.currentUser;
}

function getStorageKey() {
  const user = getUser();

  if (!user) {
    return null;
  }

  return `${STORAGE_KEYS.bibleProgress}:${user.uid}`;
}

function normalizeProgress(progress) {
  if (
    !progress ||
    typeof progress.book !== 'number' ||
    typeof progress.chapter !== 'number'
  ) {
    return {
      ...DEFAULT_PROGRESS
    };
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
    return {
      ...DEFAULT_PROGRESS
    };
  }

  return normalizeProgress(
    getItem(key, null)
  );
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

function progressRef(uid) {
  return doc(
    db,
    'users',
    uid,
    'progress',
    'current'
  );
}

async function saveCloudProgress(progress) {
  const user = getUser();

  if (!user) {
    return;
  }

  try {
    await setDoc(
      progressRef(user.uid),
      {
        book: progress.book,
        chapter: progress.chapter,
        verse: progress.verse,
        updatedAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

    console.log(
      '[Firebase Progress] Progresso salvo:',
      user.uid,
      progress
    );

  } catch (error) {
    console.error(
      '[Firebase Progress] Erro ao salvar progresso:',
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
    const snapshot = await getDoc(
      progressRef(user.uid)
    );

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return normalizeProgress(data);

  } catch (error) {
    console.error(
      '[Firebase Progress] Erro ao carregar progresso:',
      error
    );

    return null;
  }
}

export const LocalStorageProgressRepository = {

  async getProgress() {
    const user = getUser();

    /*
     * Sem usuário:
     * não compartilhamos o progresso de uma conta
     * com outra conta.
     */
    if (!user) {
      return {
        ...DEFAULT_PROGRESS
      };
    }

    const localProgress =
      readLocalProgress();

    /*
     * O localStorage funciona como cache.
     * O Firestore é consultado para recuperar
     * o progresso pertencente à conta atual.
     */
    const cloudProgress =
      await loadCloudProgress();

    if (cloudProgress) {
      writeLocalProgress(
        cloudProgress
      );

      return cloudProgress;
    }

    /*
     * Se a conta ainda não possui progresso
     * na nuvem, preservamos o progresso local
     * daquela conta, se existir, e enviamos
     * para o Firestore.
     */
    if (
      localProgress.book !== 0 ||
      localProgress.chapter !== 0 ||
      localProgress.verse !== 0
    ) {
      await saveCloudProgress(
        localProgress
      );

      return localProgress;
    }

    return {
      ...DEFAULT_PROGRESS
    };
  },

  async saveProgress(progress) {
    const user = getUser();

    /*
     * Nunca gravar progresso compartilhado
     * quando não existe usuário autenticado.
     */
    if (!user) {
      console.warn(
        '[Firebase Progress] Progresso ignorado: usuário não autenticado.'
      );

      return;
    }

    const current =
      readLocalProgress();

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

    writeLocalProgress(
      nextProgress
    );

    /*
     * Salva imediatamente no Firestore,
     * mas não bloqueia a leitura caso a rede
     * esteja indisponível.
     */
    void saveCloudProgress(
      nextProgress
    );
  },

  async syncWithCloud() {
    const user = getUser();

    if (!user) {
      return {
        ...DEFAULT_PROGRESS
      };
    }

    const cloudProgress =
      await loadCloudProgress();

    if (cloudProgress) {
      writeLocalProgress(
        cloudProgress
      );

      return cloudProgress;
    }

    const localProgress =
      readLocalProgress();

    if (
      localProgress.book !== 0 ||
      localProgress.chapter !== 0 ||
      localProgress.verse !== 0
    ) {
      await saveCloudProgress(
        localProgress
      );
    }

    return localProgress;
  }
};

export const progressRepository =
  LocalStorageProgressRepository;
