// Abre uma busca externa sobre um trecho bíblico em uma nova aba.
//
// Por que isso existe: o app não tem backend nem chave de API de IA (é
// 100% estático/client-side), então não há como gerar uma explicação real
// e confiável sob demanda para qualquer trecho da Bíblia. Em vez de
// inventar um comentário teológico automaticamente — o que arriscaria
// conteúdo raso ou impreciso — esta função abre uma busca real sobre o
// trecho. Usado tanto pela seleção de texto (selectionToolbar.js) quanto
// pelo painel de explicação de versículo (verseExplanation.js) quando o
// versículo não está no comentário curado (data/verseCommentary.js).
export function openExternalExplanation(text) {
  const query = encodeURIComponent(`"${text}" significado bíblico explicação`);
  window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
}
