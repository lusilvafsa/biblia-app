const fs = require('fs');
const { execSync } = require('child_process');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
let build = '0';
try { build = execSync('git rev-list --count HEAD').toString().trim(); } catch (e) {}
const data = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const conteudo = `// Gerado automaticamente por scripts/atualizar-versao.cjs. Não edite à mão.
export const APP_VERSION = '${pkg.version}';
export const APP_BUILD = '${build}';
export const APP_DATE = '${data}';
`;
fs.writeFileSync('www/js/version.js', conteudo);
console.log('Versão', pkg.version, '| build', build, '|', data);
