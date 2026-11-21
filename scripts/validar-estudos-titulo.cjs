'use strict';

const { options, OFFICIAL, readModule, validate, bible } = require('./title-studies/core.cjs');

try {
  const args = options(process.argv.slice(2), ['arquivo', 'versao']);
  const result = validate(readModule(args.arquivo || OFFICIAL), bible(args.versao || 'acf'));
  for (const error of result.errors) console.error(`ERRO: ${error}`);
  for (const warning of result.warnings) console.log(`AVISO: ${warning}`);
  console.log(`${result.errors.length ? 'REPROVADO' : 'VALIDADO'}: ${result.count} estudos; ${result.errors.length} erros; ${result.warnings.length} avisos. Cobertura parcial permitida; revisão editorial necessária.`);
  if (result.errors.length) process.exitCode = 1;
} catch (error) {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
}
