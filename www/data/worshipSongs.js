// Sugestões de louvores gospel conhecidos. O app não reproduz áudio nem
// letra (direitos autorais das gravadoras/compositores) — só sugere o
// título e abre uma busca no YouTube para o usuário ouvir na fonte oficial.
export const WORSHIP_SONGS = [
  { title: 'Ousado Amor', artist: 'Isaías Saad' },
  { title: 'Lugar Secreto', artist: 'Gabriela Rocha' },
  { title: 'Bondade de Deus', artist: 'Isaías Saad' },
  { title: 'Grandes Coisas', artist: 'Fernandinho' },
  { title: 'Ninguém Explica Deus', artist: 'Preto no Branco' },
  { title: 'Deus Cuida de Mim', artist: 'Fernandinho' },
  { title: 'Ele É Exaltado', artist: 'Diante do Trono' },
  { title: 'Digno É o Senhor', artist: 'Diante do Trono' },
  { title: 'Poder Milagroso', artist: 'Fernandinho' },
  { title: 'Águas Purificadoras', artist: 'Fernandinho' },
  { title: 'Refúgio e Fortaleza', artist: 'Aline Barros' },
  { title: 'Tua Graça Me Basta', artist: 'Davi Sacer' },
  { title: 'Assim Como Eu Sou', artist: 'Aline Barros' },
  { title: 'Quão Grande É o Meu Deus', artist: 'Soraya Moraes' },
];

/** Escolhe um louvor "do dia" de forma determinística (mesmo dia = mesma
 * música, mas muda a cada dia), sem precisar guardar nada. */
export function getTodaysSong() {
  const inicioDoAno = new Date(new Date().getFullYear(), 0, 0);
  const diffMs = new Date() - inicioDoAno;
  const diaDoAno = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return WORSHIP_SONGS[diaDoAno % WORSHIP_SONGS.length];
}
