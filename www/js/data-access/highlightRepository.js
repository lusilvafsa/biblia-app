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
  { id: 'laranja', label: 'Gratidão', hex: '#f2994a' },
  { id: 'roxo', label: 'Oração', hex: '#a78bfa' },
  { id: 'rosado', label: 'Amor', hex: '#f472b6' },
  { id: 'cinza', label: 'Reflexão', hex: '#9ca3af' },
];

function getUser() {
  return usuarioAtual();
}

function getStorageKey(user = getUser()) {
  return user
    ? `${STORAGE_KEYS.highlights}:${user.id}`
    : STORAGE_KEYS.highlights;
}

function readAll(user = getUser()) {
  return getItem(getStorageKey(user), {});
}

function writeAll(data, user = getUser()) {
  setItem(getStorageKey(user), data);
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
  async syncWithCloud(user = getUser()) {
    if (!user) return {};

    const local = readAll(user);

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

      // Mantém a gravação vinculada à conta capturada no início.
      writeAll(merged, user);

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
        const { error: upsertError } = await supabase
          .from('user_highlights')
          .upsert(rows, { onConflict: 'user_id,id' });

        if (upsertError) throw upsertError;
      }

      return merged;
    } catch (e) {
      console.error('[Supabase] Erro ao sincronizar grifos:', e);
      return readAll(user);
    }
  },

  async importMap(incoming) {
    const user = getUser();
    if (!user) return { ok: false, adicionados: 0, mantidos: 0 };
    const merged = { ...readAll(user) };
    let adicionados = 0;
    let mantidos = 0;
    for (const [chave, cor] of Object.entries(incoming)) {
      if (chave in merged) {
        mantidos++;
      } else {
        merged[chave] = cor;
        adicionados++;
      }
    }
    writeAll(merged, user);
    await this.syncWithCloud(user);
    return { ok: true, adicionados, mantidos };
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
