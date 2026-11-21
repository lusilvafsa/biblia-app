# Ferramenta de estudos por título

Ferramenta local, sem dependências adicionais. Não altera o aplicativo, não incorpora estudos, não faz build nem publica. A proteção cobre os quatro estudos oficiais aprovados: Gênesis 1:1–25 (`0-0-0`), Gênesis 1:26–31 (`0-0-25`), Gênesis 2:1–3 (`0-1-0`) e Gênesis 2:4–17 (`0-1-3`). Os testes de geração usam conteúdo técnico sintético em arquivos temporários, sem produzir outro estudo editorial ou incorporá-lo ao aplicativo.

## Comandos

Executar os testes iniciais (mostram o diretório temporário e o hash oficial):

```sh
node --test tests/title-studies.test.cjs
```

Validar o arquivo oficial, somente por leitura:

```sh
node scripts/validar-estudos-titulo.cjs
```

Exemplo para preparar metadados e texto de uma passagem ainda não cadastrada (Gênesis 2:18–25), sem redigir um estudo:

```sh
node scripts/gerar-estudo-titulo.cjs --livro Gênesis --capitulo 2 --versiculo 18 --versao acf
```

O comando imprime em JSON o caminho de `passagem.json` em um novo diretório `title-studies-*` dentro do temporário do sistema. Sem `--conteudo`, não produz um estudo nem preenche conteúdo fictício. Livro aceita nome ou abreviação do índice; capítulo e versículo são números humanos, a partir de 1. Versões aceitas: `acf`, `blivre` e `alm1911`.

Após redigir e revisar um JSON de conteúdo nesse diretório, usar os caminhos reais impressos pela ferramenta:

```sh
node scripts/gerar-estudo-titulo.cjs --livro Gênesis --capitulo 2 --versiculo 18 --conteudo /caminho/temporario/title-studies-ABC123/estudo.json
node scripts/validar-estudos-titulo.cjs --arquivo /caminho/temporario/title-studies-XYZ789/titleStudies.candidate.mjs --versao acf
```

Os caminhos acima são exemplos; cada execução cria seu diretório exclusivo. `--saida` é opcional e só aceita arquivo inexistente dentro de um diretório temporário `title-studies-*`. O diretório pai deve existir, não pode resolver para dentro do projeto e é conferido após resolução de links simbólicos. A criação usa `wx`, que recusa arquivos e links já existentes. Não há opção de força ou de incorporação ao oficial.

## Contrato e revisão

### Base editorial obrigatória: ACF

A versão ACF é a base obrigatória para elaborar os estudos. Explicação, contexto, aplicação, conceitos e referências devem ser redigidos considerando o texto ACF de toda a passagem. BLivre e ALM1911 podem ser consultadas apenas para comparação e esclarecimento de diferenças; não substituem a ACF como base editorial.

ACF continua sendo a versão padrão do gerador (`acf` quando `--versao` não é informado). A seleção técnica de outra versão para comparação ou validação de coordenadas não altera essa regra editorial. A fidelidade do conteúdo à ACF deve ser conferida na revisão humana.

O conteúdo é um objeto JSON com exatamente `identificacao`, `explicacao`, `contexto`, `aplicacao`, `conceitos` e `referencias`. Os cinco primeiros são textos não vazios; `referencias` é uma lista não vazia de objetos com exatamente `ref` e `explicacao`, ambos textos não vazios. `identificacao` deve reproduzir exatamente o valor preparado pela ferramenta. Conceitos usam `Termo: definição. Outro termo: definição.` para manter compatibilidade com o leitor atual.

O gerador lê o oficial, compara os quatro objetos oficiais completos com a fixture e recusa chaves cadastradas. Recebe o conteúdo revisado, valida e serializa um módulo separado com os estudos originais mais o novo. A serialização é determinística para as mesmas entradas; o caminho temporário varia. Não usa IA, rede ou credenciais.

Cada candidato deve ser revisado quanto à fidelidade ao intervalo completo, clareza, contexto, aplicação, conceitos e pertinência das referências. Apresente o texto, os avisos e o resultado da validação ao responsável pela aprovação. Correções devem gerar outro arquivo, sem sobrescrever o anterior. Validação automática não comprova correção teológica ou editorial. Não existe promoção automática ao aplicativo. As chaves já cadastradas são recusadas inclusive na preparação de metadados; para inspecionar uma passagem oficial, utilize os dados locais e o validador. A fixture e seu hash somente devem ser atualizados após uma incorporação editorial expressamente aprovada, com backup e comparação dos registros; testes e comandos de rotina nunca os regeneram.

## Intervalos, referências e proteção

O início deve coincidir com um título em `www/data/titles/<livro>.json`. O fim é o versículo anterior ao próximo título ou o fim do próprio capítulo. Passagens nunca atravessam capítulos ou livros. Versículos antes do primeiro título não recebem associação inventada. Não existem argumentos para fornecer um fim ou intervalo personalizado.

Referências relacionadas podem apontar para outros livros e capítulos. São aceitos capítulos completos (`Salmo 104`), versículos e intervalos dentro de um capítulo (`João 1:1–3`), com hífen, meia-risca ou travessão. Intervalos que atravessam capítulos ou livros, listas de referências em uma string e formatos fora dessa gramática são rejeitados; devem ser expressos como entradas separadas suportadas.

O parser aceita somente `export const TITLE_STUDIES =` seguido de objetos, arrays e strings JSON com aspas duplas. Aceita nomes simples de propriedades, comentários e vírgulas finais. Rejeita duplicatas em qualquer nível, expressões, getters, chamadas, imports, templates, propriedades de protótipo e código adicional. Não utiliza `eval`, `vm` ou importação dinâmica dos candidatos. JSON de conteúdo e fixture também passam por esse parser, sem permitir duplicatas. Formatos JavaScript válidos fora dessa gramática são intencionalmente recusados.

`tests/fixtures/title-studies/existing.json` registra integralmente `0-0-0`, `0-0-25`, `0-1-0` e `0-1-3`, a partir do arquivo em disco. É uma referência de teste confiável, não deve ser regenerada para fazer alterações passarem. A comparação profunda inclui a ordem e o conteúdo das referências. A cobertura pode ser parcial; ausências de estudos para outros títulos não são erro.

Antes de interpretar ou utilizar a fixture, a ferramenta confere o SHA-256 dos bytes contra o valor fixado no código: `1d8d68d568c12f87c7395cedb36b1379be75481fdb450d7d6acf625d41a5f29e`. Qualquer divergência, inclusive de formatação, faz a validação falhar com uma mensagem que informa o arquivo e os hashes esperado e encontrado. Os mesmos bytes conferidos são usados na interpretação, sem releitura. A comparação completa dos objetos continua sendo obrigatória após essa verificação. Os testes adulteram apenas cópias temporárias, mantendo a fixture original intacta.

O validador apenas lê arquivos e retorna código 1 para erros e 0 para sucesso. Informa avisos sobre seções iguais, referências repetidas e campos acima de 3000 caracteres. Esses avisos são heurísticas, sem mínimos artificiais de comprimento. Não detecta todas as repetições ou problemas de interpretação.

## Escopo da verificação inicial

O gerador recusa as quatro chaves oficiais, com ou sem conteúdo informado. Os testes usam a ACF por padrão na geração sintética e as três versões para conferir os limites de Gênesis 2:1–3. Também verificam a delimitação de Gênesis 2:4–17 na ACF e limites no fim de capítulos e de livros; proteção completa dos originais; integridade do hash oficial; validações negativas; duplicatas; código proibido; colisões; argumentos e destinos inseguros; e códigos de saída da CLI. Os artefatos temporários ficam disponíveis para inspeção e não são apagados automaticamente.

Esta suíte verifica dados e comandos, sem modificar `reader.js`, configurações ou comentários por versículo. Não automatiza uma sessão visual no navegador nem reprodução TTS. O posicionamento e a narração reais do cartão no leitor precisam de verificação em uma cópia isolada do aplicativo; áudio nativo exige dispositivo/emulador. Esses testes de interface não são alegados como executados pela suíte Node.
