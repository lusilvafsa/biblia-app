import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';

import {
  sincronizarFavoritos,
  enviarFavoritoParaNuvem,
  removerFavoritoDaNuvem
} from '../firebase/favoritesSync.js';

import { auth } from '../firebase/firebaseConfig.js';

function makeId(bookIndex, chapterIndex, verseIndex) {
  return `${bookIndex}-${chapterIndex}-${verseIndex}`;
}

/*
 * Cada usuário possui seu próprio armazenamento local.
 *
 * Exemplo:
 * biblia:favorites:UID_DO_USUARIO
 *
 * Sem usuário autenticado, não existe lista de favoritos.
 */
function getUser() {
  return auth.currentUser;
}

function getStorageKey() {
  const user = getUser();

  if (!user) {
    return null;
  }

  return `${STORAGE_KEYS.favorites}:${user.uid}`;
}

/*
 * Migra uma única vez os favoritos antigos que estavam
 * na chave global "biblia:favorites" para o usuário
 * atualmente autenticado.
 */
function migrateLegacyFavorites() {
  const user = getUser();

  if (!user) return;

  const userKey = getStorageKey();

  if (!userKey) return;

  const existingUserItems = getItem(userKey, null);

  if (Array.isArray(existingUserItems)) {
    return;
  }

  const legacyItems = getItem(STORAGE_KEYS.favorites, null);

  if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
    setItem(userKey, []);
    return;
  }

  setItem(userKey, legacyItems);

  console.log(
    '[Favoritos] Dados antigos migrados para o usuário:',
    user.uid
  );
}

function readAll() {
  const user = getUser();

  if (!user) {
    return [];
  }

  migrateLegacyFavorites();

  const key = getStorageKey();

  if (!key) {
    return [];
  }

  const saved = getItem(key, []);

  return Array.isArray(saved) ? saved : [];
}

function writeAll(items) {
  const key = getStorageKey();

  if (!key) {
    console.warn(
      '[Favoritos] Tentativa de gravar favoritos sem usuário autenticado.'
    );
    return false;
  }

  return setItem(key, items);
}

function syncItem(item) {
  const user = getUser();

  if (!user) {
    console.warn(
      '[Favoritos] Sincronização ignorada: usuário não autenticado.'
    );
    return;
  }

  if (!item?.id) {
    console.warn(
      '[Favoritos] Item sem ID.'
    );
    return;
  }

  void enviarFavoritoParaNuvem(item).catch((error) => {
    console.error(
      '[Firebase Sync] Erro ao enviar favorito/anotação:',
      error
    );
  });
}

function deleteItem(id) {
  const user = getUser();

  if (!user || !id) {
    return;
  }

  void removerFavoritoDaNuvem(id).catch((error) => {
    console.error(
      '[Firebase Sync] Erro ao remover favorito/anotação:',
      error
    );
  });
}

function createEntry(info) {
  const now = new Date().toISOString();

  return {
    id: makeId(
      info.bookIndex,
      info.chapterIndex,
      info.verseIndex
    ),
    bookIndex: info.bookIndex,
    bookName: info.bookName,
    chapterIndex: info.chapterIndex,
    verseIndex: info.verseIndex,
    reference: `${info.bookName} ${info.chapterIndex + 1}:${info.verseIndex + 1}`,
    text: info.verseText,
    favorite: false,
    note: '',
    createdAt: now,
    updatedAt: now,
  };
}

export const favoritesRepository = {

  async syncWithCloud() {
    const user = getUser();

    if (!user) {
      console.log(
        '[Firebase Sync] Nenhum usuário autenticado. Favoritos isolados.'
      );

      return [];
    }

    const localItems = readAll();

    try {
      const mergedItems = await sincronizarFavoritos(localItems);

      writeAll(mergedItems);

      return mergedItems;

    } catch (error) {
      console.error(
        '[Firebase Sync] Erro ao sincronizar favoritos:',
        error
      );

      return localItems;
    }
  },

  getAll() {
    return readAll();
  },

  getFavorites() {
    return readAll().filter(
      item => item.favorite === true
    );
  },

  getNotes() {
    return readAll().filter(
      item =>
        typeof item.note === 'string' &&
        item.note.trim().length > 0
    );
  },

  get(bookIndex, chapterIndex, verseIndex) {
    const id = makeId(
      bookIndex,
      chapterIndex,
      verseIndex
    );

    return (
      readAll().find(
        entry => entry.id === id
      ) || null
    );
  },

  isFavorite(bookIndex, chapterIndex, verseIndex) {
    const item = this.get(
      bookIndex,
      chapterIndex,
      verseIndex
    );

    return !!item?.favorite;
  },

  toggleFavorite(info) {
    const user = getUser();

    if (!user) {
      console.warn(
        '[Favoritos] Usuário não autenticado.'
      );

      alert(
        'Faça login para usar os favoritos.'
      );

      return false;
    }

    const items = readAll();

    const id = makeId(
      info.bookIndex,
      info.chapterIndex,
      info.verseIndex
    );

    let item = items.find(
      entry => entry.id === id
    );

    if (!item) {
      item = createEntry(info);
      item.favorite = true;
      items.push(item);

    } else {
      item.favorite = !item.favorite;
      item.updatedAt = new Date().toISOString();
    }

    const index = items.findIndex(
      entry => entry.id === id
    );

    items[index] = item;

    if (
      !item.favorite &&
      !item.note.trim()
    ) {
      items.splice(index, 1);

      writeAll(items);

      deleteItem(id);

      return false;
    }

    writeAll(items);

    syncItem(item);

    return item.favorite;
  },

  saveNote(info, note) {
    const user = getUser();

    if (!user) {
      console.warn(
        '[Anotações] Usuário não autenticado.'
      );

      alert(
        'Faça login para usar as anotações.'
      );

      return null;
    }

    const items = readAll();

    const id = makeId(
      info.bookIndex,
      info.chapterIndex,
      info.verseIndex
    );

    let item = items.find(
      entry => entry.id === id
    );

    if (!item) {
      item = createEntry(info);
      items.push(item);
    }

    item.note = String(note || '').trim();
    item.updatedAt = new Date().toISOString();

    const index = items.findIndex(
      entry => entry.id === id
    );

    items[index] = item;

    if (
      !item.favorite &&
      !item.note
    ) {
      items.splice(index, 1);

      writeAll(items);

      deleteItem(id);

      return item;
    }

    writeAll(items);

    syncItem(item);

    return item;
  },

  removeFavorite(
    bookIndex,
    chapterIndex,
    verseIndex
  ) {
    const user = getUser();

    if (!user) {
      console.warn(
        '[Favoritos] Usuário não autenticado.'
      );

      return;
    }

    const items = readAll();

    const id = makeId(
      bookIndex,
      chapterIndex,
      verseIndex
    );

    const item = items.find(
      entry => entry.id === id
    );

    if (!item) {
      return;
    }

    if (
      item.note &&
      item.note.trim()
    ) {
      item.favorite = false;
      item.updatedAt = new Date().toISOString();

      writeAll(items);

      syncItem(item);

      return;
    }

    writeAll(
      items.filter(
        entry => entry.id !== id
      )
    );

    deleteItem(id);
  },

  removeNote(
    bookIndex,
    chapterIndex,
    verseIndex
  ) {
    const user = getUser();

    if (!user) {
      console.warn(
        '[Anotações] Usuário não autenticado.'
      );

      return;
    }

    const items = readAll();

    const id = makeId(
      bookIndex,
      chapterIndex,
      verseIndex
    );

    const item = items.find(
      entry => entry.id === id
    );

    if (!item) {
      return;
    }

    item.note = '';
    item.updatedAt = new Date().toISOString();

    if (!item.favorite) {
      writeAll(
        items.filter(
          entry => entry.id !== id
        )
      );

      deleteItem(id);

      return;
    }

    writeAll(items);

    syncItem(item);
  }
};
