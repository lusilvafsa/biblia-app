// Grifos de versículos por cor temática. Funciona sem login (salvo só no
// aparelho); quando o usuário entra na conta, sincroniza com o Supabase e
// mescla com o que já existia na nuvem — igual ao que já acontece com
// favoritos e anotações.
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage.js';
import { supabase } from '../supabaseClient.js';
import { usuarioAtual } from '../supabaseAuth.js';

export const HIGHLIGHT_COLORS = [
  { id: 'amarelo', label: 'Promessa', hex: '#f2c94c' },
  { id: 'azul', label: 'Ensino', hex: '#56ccf2' },
  { id: 'verde', label: 'Crescimento', hex: '#6fcf97' },
  { id: 'rosa', label: 'Advertência', hex: '#eb5757' },
];

function getUser() {
  return usuarioAtual();
}

function getStorageKey() {
  const user = getUser();
  return user ? `${STORAGE_KEYS.highlights}:${user.id}` : STORAGE_KEYS.highlights;
}

// Migra, uma única vez, os grifos feitos antes do login para a conta.
function migrateAnonymousHighlights() {
  const user = getUser();
  if (!user) return;

  const userKey = `${STORAGE_KEYS.highlights}:${user.id}`;
  const already = getItem(userKey, null);
  if (already) return; // já migrado antes

  const anonimo = getItem(STORAGE_KEYS.highlights, {});
  setItem(userKey, anonimo);
}

function readAll() {
  migrateAnonymousHighlights();
  return getItem(getStorageKey(), {});
}

function writeAll(data) {
  setItem(getStorageKey(), data);
}

function syncItem(chave, colorId) {
  const user = getUser();
  if (!user) return;

  const [b, c, v] = chave.split('-').map(Number);

  void supabase
    .from('user_highlights')
    .upsert(
      {
        user_id: user.id,
        id: chave,
        book_index: b,
        chapter_index: c,
        verse_index: v,
        color_id: colorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,id' }
    )
    .then(({ error }) => {
      if (error) console.error('[Supabase] Erro ao enviar grifo:', error);
    });
}

function deleteItemCloud(chave) {
  const user = getUser();
  if (!user) return;

  void supabase
    .from('user_highlights')
    .delete()
    .eq('user_id', user.id)
    .eq('id', chave)
    .then(({ error }) => {
      if (error) console.error('[Supabase] Erro ao remover grifo:', error);
    });
}

export const highlightRepository = {
  async syncWithCloud() {
    const user = getUser();
    if (!user) return {};

    const local = readAll();

    try {
      const { data, error } = await supabase
        .from('user_highlights')
        .select('id, color_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const merged = { ...local };
      (data || []).forEach((row) => {
        if (!(row.id in merged)) merged[row.id] = row.color_id;
      });

      writeAll(merged);

      const rows = Object.entries(merged).map(([chave, colorId]) => {
        const [b, c, v] = chave.split('-').map(Number);
        return {
          user_id: user.id,
          id: chave,
          book_index: b,
          chapter_index: c,
          verse_index: v,
          color_id: colorId,
          updated_at: new Date().toISOString(),
        };
      });

      if (rows.length > 0) {
        await supabase.from('user_highlights').upsert(rows, { onConflict: 'user_id,id' });
      }

      return merged;
    } catch (e) {
      console.error('[Supabase] Erro ao sincronizar grifos:', e);
      return local;
    }
  },

  getAll() {
    return readAll();
  },
  get(bookIndex, chapterIndex, verseIndex) {
    const all = readAll();
    return all[`${bookIndex}-${chapterIndex}-${verseIndex}`] || null;
  },
  set(bookIndex, chapterIndex, verseIndex, colorId) {
    const all = readAll();
    const chave = `${bookIndex}-${chapterIndex}-${verseIndex}`;
    all[chave] = colorId;
    writeAll(all);
    syncItem(chave, colorId);
  },
  remove(bookIndex, chapterIndex, verseIndex) {
    const all = readAll();
    const chave = `${bookIndex}-${chapterIndex}-${verseIndex}`;
    delete all[chave];
    writeAll(all);
    deleteItemCloud(chave);
  },
};
