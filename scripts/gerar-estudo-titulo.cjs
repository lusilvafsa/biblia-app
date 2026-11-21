'use strict';

const { generate, options } = require('./title-studies/core.cjs');

try {
  const args = options(process.argv.slice(2), ['livro', 'capitulo', 'versiculo', 'versao', 'conteudo', 'saida']);
  if (!args.livro || !args.capitulo || !args.versiculo) throw new Error('Uso: node scripts/gerar-estudo-titulo.cjs --livro Gênesis --capitulo 2 --versiculo 1 [--versao acf] [--conteudo /temporario/estudo.json] [--saida /temporario/arquivo]');
  const result = generate({ book: args.livro, chapter: args.capitulo, verse: args.versiculo,
    version: args.versao || 'acf', content: args.conteudo, out: args.saida });
  console.log(JSON.stringify({ tipo: result.candidate ? 'candidato para revisão' : 'passagem para redação', ...result }, null, 2));
} catch (error) {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
}
