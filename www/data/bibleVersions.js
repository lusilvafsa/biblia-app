// Registro das versões da Bíblia que o app pode exibir.
//
// Cada versão tem seus dados em www/data/bible/<id>/, com um index.json
// (metadados leves de todos os 66 livros) e um arquivo <bookIndex>.json
// por livro (carregado sob demanda) — veja js/data-access/bibleRepository.js.
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
    available: true,
  },
  {
    id: 'blivre',
    label: 'BLIVRE',
    name: 'Bíblia Livre',
    available: true,
  },
  {
    id: 'alm1911',
    label: 'ARC 1911',
    name: 'Almeida Revista e Corrigida (1911)',
    available: true,
  },
];

export const DEFAULT_BIBLE_VERSION = 'acf';

export function getVersionMeta(id) {
  return BIBLE_VERSIONS.find((v) => v.id === id) || BIBLE_VERSIONS.find((v) => v.id === DEFAULT_BIBLE_VERSION);
}
