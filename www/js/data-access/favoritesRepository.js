import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';
import { supabase } from '../supabaseClient.js';
import { usuarioAtual } from '../supabaseAuth.js';

function makeId(bookIndex, chapterIndex, verseIndex) {
  return `${bookIndex}-${chapterIndex}-${verseIndex}`;
}

/*
 * Cada conta possui seu próprio armazenamento local.
 * Sem login, os dados ficam em uma chave anônima separada.
 */
function getUser() {
  return usuarioAtual();
}

function getStorageKey() {
  const user = getUser();

  if (!user) {
    return STORAGE_KEYS.anonymousFavorites;
  }

  return `${STORAGE_KEYS.favorites}:${user.id}`;
}

/*
 * Migra somente registros completos da chave antiga.
 * Textos simples usados pela página inicial não são importados.
 */
function migrateLegacyFavorites() {
  const user = getUser();

  if (!user) {
    return;
  }

  const userKey = getStorageKey();
  const existingUserItems = getItem(userKey, null);

  if (Array.isArray(existingUserItems)) {
    return;
  }

  const legacyItems = getItem(STORAGE_KEYS.favorites, []);
  const validItems = Array.isArray(legacyItems)
    ? legacyItems.filter(item =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof item.id === 'string'
      )
    : [];

  setItem(userKey, validItems);

  if (validItems.length > 0) {
    console.log(
      '[Favoritos] Registros antigos migrados para o usuário:',
      user.id
    );
  }
}

function readAll() {
  if (getUser()) {
    migrateLegacyFavorites();
  }

  const saved = getItem(getStorageKey(), []);

  return Array.isArray(saved) ? saved : [];
}

function writeAll(items) {
  return setItem(getStorageKey(), items);
}

function itemToRow(item, userId) {
  return {
    user_id: userId,
    id: item.id,
    book_index: item.bookIndex,
    book_name: item.bookName,
    chapter_index: item.chapterIndex,
    verse_index: item.verseIndex,
    reference: item.reference,
    text: item.text,
    favorite: !!item.favorite,
    note: item.note || '',
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function rowToItem(row) {
  return {
    id: row.id,
    bookIndex: row.book_index,
    bookName: row.book_name,
    chapterIndex: row.chapter_index,
    verseIndex: row.verse_index,
    reference: row.reference,
    text: row.text,
    favorite: !!row.favorite,
    note: row.note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function syncItem(item) {
  const user = getUser();

  if (!user) {
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  if (!item?.id) {
    console.warn('[Favoritos] Item sem ID.');
    return;
  }

  void supabase
    .from('user_favorites')
    .upsert(
      itemToRow(item, user.id),
      {
        onConflict: 'user_id,id',
      }
    )
    .then(({ error }) => {
      if (error) {
        console.error(
          '[Supabase] Erro ao enviar favorito/anotação:',
          error
        );
      }
    })
    .catch((error) => {
      console.error(
        '[Supabase] Erro inesperado ao enviar favorito/anotação:',
        error
      );
    });
}

function deleteItem(id) {
  const user = getUser();

  if (!user || !id) {
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  void supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)
    .then(({ error }) => {
      if (error) {
        console.error(
          '[Supabase] Erro ao remover favorito/anotação:',
          error
        );
      }
    })
    .catch((error) => {
      console.error(
        '[Supabase] Erro inesperado ao remover favorito/anotação:',
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

    const localItems = readAll();

    if (!user) {
      return localItems;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return localItems;
    }

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(
          'id, book_index, book_name, chapter_index, verse_index, reference, text, favorite, note, created_at, updated_at'
        )
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const cloudItems = Array.isArray(data)
        ? data.map(rowToItem)
        : [];

      const mergedById = new Map();

      for (const item of cloudItems) {
        mergedById.set(item.id, item);
      }

      for (const item of localItems) {
        const cloudItem = mergedById.get(item.id);

        if (!cloudItem) {
          mergedById.set(item.id, item);
          continue;
        }

        const localTime = new Date(
          item.updatedAt || item.createdAt || 0
        ).getTime();

        const cloudTime = new Date(
          cloudItem.updatedAt || cloudItem.createdAt || 0
        ).getTime();

        if (localTime >= cloudTime) {
          mergedById.set(item.id, item);
        }
      }

      const mergedItems = Array.from(mergedById.values());

      writeAll(mergedItems);

      if (mergedItems.length > 0) {
        const rows = mergedItems.map(item =>
          itemToRow(item, user.id)
        );

        const { error: upsertError } = await supabase
          .from('user_favorites')
          .upsert(rows, {
            onConflict: 'user_id,id',
          });

        if (upsertError) {
          console.error(
            '[Supabase] Erro ao enviar favoritos mesclados:',
            upsertError
          );
        }
      }

      return mergedItems;
    } catch (error) {
      console.error(
        '[Supabase] Erro ao sincronizar favoritos:',
        error
      );

      return localItems;
    }
  },

  async importItems(incoming) {
    const porId = new Map(readAll().map((item) => [item.id, item]));
    let adicionados = 0;
    let atualizados = 0;
    let mantidos = 0;
    for (const novo of incoming) {
      const atual = porId.get(novo.id);
      if (!atual) {
        porId.set(novo.id, novo);
        adicionados++;
        continue;
      }
      const tAtual = new Date(atual.updatedAt || atual.createdAt || 0).getTime();
      const tNovo = new Date(novo.updatedAt || novo.createdAt || 0).getTime();
      if (tNovo > tAtual) {
        porId.set(novo.id, novo);
        atualizados++;
      } else {
        mantidos++;
      }
    }
    writeAll(Array.from(porId.values()));
    await this.syncWithCloud();
    return { ok: true, adicionados, atualizados, mantidos };
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

  isFavorite(
    bookIndex,
    chapterIndex,
    verseIndex
  ) {
    const item = this.get(
      bookIndex,
      chapterIndex,
      verseIndex
    );

    return !!item?.favorite;
  },

  toggleFavorite(info) {
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
  },
};
