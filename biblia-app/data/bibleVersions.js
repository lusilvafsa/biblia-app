// Registro das versões da Bíblia que o app pode exibir.
//
// Cada entrada aponta para um arquivo em data/bible-<id>.json no mesmo
// formato de data/bible-acf.json (array de livros, cada um com
// {abbrev, name, chapters: string[][]}). Uma versão com `available: false`
// aparece no seletor mas mostra uma mensagem explicando que o arquivo
// ainda não foi adicionado, em vez de quebrar — veja
// js/data-access/bibleRepository.js.
//
// Sobre as versões escolhidas: no Brasil, a maioria das traduções bíblicas
// modernas mais conhecidas (NVI, ARA, NTLH, Almeida Século 21 etc.) é
// protegida por direitos autorais de suas editoras/sociedades bíblicas —
// redistribuir o texto completo sem licença não é apropriado. As versões
// abaixo foram escolhidas por terem uso livre confirmado:
// - ACF: já usada no app desde o protótipo original.
// - BLIVRE (Bíblia Livre): tradução moderna sob licença Creative Commons
//   Atribuição (uso livre, inclusive comercial, com menção da fonte).
// - ALM1911 (Almeida Revista e Corrigida, 1911): edição em domínio
//   público (linguagem mais antiga que as demais).
export const BIBLE_VERSIONS = [
  {
    id: 'acf',
    label: 'ACF',
    name: 'Almeida Corrigida Fiel',
    file: 'bible-acf.json',
    available: true,
  },
  {
    id: 'blivre',
    label: 'BLIVRE',
    name: 'Bíblia Livre',
    file: 'bible-blivre.json',
    available: false,
    note: 'Tradução livre (Creative Commons) baseada na Almeida de 1819. Arquivo de dados ainda não incluído neste projeto — veja o README para como adicioná-lo.',
  },
  {
    id: 'alm1911',
    label: 'ARC 1911',
    name: 'Almeida Revista e Corrigida (1911)',
    file: 'bible-alm1911.json',
    available: false,
    note: 'Edição em domínio público, linguagem mais antiga. Arquivo de dados ainda não incluído neste projeto — veja o README para como adicioná-lo.',
  },
];

export const DEFAULT_BIBLE_VERSION = 'acf';

export function getVersionMeta(id) {
  return BIBLE_VERSIONS.find((v) => v.id === id) || BIBLE_VERSIONS.find((v) => v.id === DEFAULT_BIBLE_VERSION);
}
