# 📖 Bíblia de Estudo

Aplicativo web de estudo bíblico: Bíblia completa (ACF, com suporte a mais
versões — veja abaixo), busca por palavra, Bíblia em áudio, orações
guiadas, quiz bíblico e guia de ministração. Interface em português, tema
claro/escuro, responsivo em retrato e paisagem, 100% client-side (sem
backend).

## Funcionalidades

- **Bíblia completa** — 66 livros, navegação por Antigo/Novo Testamento,
  grade de capítulos, leitura com fonte e espaçamento ajustáveis
- **Múltiplas versões** — seletor de versão na tela da Bíblia; ACF já
  incluída, com BLIVRE (Bíblia Livre) e ARC 1911 preparadas na
  arquitetura, faltando só o arquivo de dados — veja "Versões da Bíblia"
  abaixo
- **Narrativa em voz alta com controle completo** — Iniciar/Pausar/
  Continuar/Parar de verdade (continuar retoma do mesmo versículo, não
  reinicia o capítulo), anúncio do livro e capítulo antes de começar, e
  avanço automático para o próximo capítulo ao concluir a leitura
- **Continua tocando com a tela apagada/app em segundo plano** — impede o
  apagar automático da tela por inatividade e mostra controles na tela de
  bloqueio (play/pausar/parar/próximo/anterior capítulo); veja "Limitações
  conhecidas" para o que isso garante de verdade em cada navegador
- **Explicação de versículo** — toque em qualquer versículo para ver
  Explicação, Contexto, Aplicação e Conceitos importantes (comentário
  curado para ~25 versículos centrais; para os demais, um link honesto
  para buscar comentário externo — veja "Limitações conhecidas" abaixo)
- **Instalável como app** — em navegadores compatíveis (Chrome/Edge/
  Android), Configurações mostra um botão para instalar o app na tela
  inicial, abrindo em tela cheia sem a barra de endereço do navegador
- **Guia de Ministração** — 12 temas (fé, oração, amor, perdão, família...)
  com busca por tema, passagem principal, esboço estruturado (introdução,
  pontos, aplicação, oração final) e versículos de apoio, pronto para
  conduzir um estudo, devocional ou pregação curta
- **Seleção de texto** — selecione qualquer trecho do capítulo para
  Compartilhar, Explicar (abre uma busca sobre o trecho) ou Narrar
- **Busca** — encontra qualquer palavra ou frase em todo o texto bíblico
- **Bíblia em áudio** — player com faixas de exemplo; se o áudio não
  carregar, cai automaticamente para leitura por voz e depois para um tom
  interno (nunca fica "travado")
- **Orações guiadas** — manhã, força e noite, com botão "Orar Amém"
- **Quiz bíblico** — 10 perguntas de múltipla escolha com placar final
- **Perfil** — sequência de leitura, insígnias e estatísticas
- **Configurações de voz** — seletor rápido Masculina/Feminina/Automática,
  tom (grave/agudo), velocidade da leitura e escolha de uma voz específica
  do sistema, usados em toda leitura por voz do app
- **Tema claro/escuro** — persistido entre sessões
- **"Continue de onde parou"** — se a narrativa foi pausada no meio de um
  capítulo, a Home mostra um card para retomar exatamente daquele
  versículo (com o anúncio do capítulo) ou recomeçar o capítulo do início

## Tecnologia

Sem build step: HTML, CSS e JavaScript puro com **ES Modules nativos**
(`<script type="module">`). Isso significa que:

- Não precisa de `npm install`, bundler ou compilação
- Abre direto no navegador ou em qualquer servidor estático
- Publica no GitHub Pages sem nenhuma etapa de build

```
├── index.html                 # shell da aplicação
├── css/                       # variáveis, base, componentes, animações
├── data/                      # versículos, orações, quiz, faixas de áudio,
│                               #   verseCommentary.js (comentário curado),
│                               #   bible-acf.json (texto bíblico completo)
├── assets/
│   ├── media/                  # vídeo do topo (H.264 + WebM)
│   └── icons/                  # ícone da Bíblia enviado pelo usuário + favicon
└── js/
    ├── main.js                # ponto de entrada, registra rotas
    ├── router.js               # roteador baseado em hash (#/rota)
    ├── state/                  # tema, voz, player de áudio, título do cabeçalho
    ├── data-access/            # acesso aos dados da Bíblia e ao progresso
    │                            #   (troque por uma API no futuro sem mexer
    │                            #    nas telas — mesma interface)
    ├── utils/                  # storage, toast, fala (TTS), DOM helpers,
    │                            #   externalExplain.js (busca externa)
    ├── components/             # ícones SVG/imagem compartilhados
    └── features/                # uma pasta por tela (home, bible, audio,
                                  #   prayer, quiz, profile, settings)
                                  #   bible/selectionToolbar.js: popup de
                                  #   compartilhar/explicar/narrar trecho
                                  #   bible/verseExplanation.js: painel de
                                  #   explicação ao tocar um versículo
```

## Rodando localmente

Como o app carrega dados via `fetch` (o texto da Bíblia em JSON), ele precisa
ser servido por um servidor HTTP — abrir o `index.html` direto como arquivo
(`file://`) não funciona. Qualquer servidor estático simples resolve:

```bash
# Python
python3 -m http.server 8000

# Node (sem instalar nada, usando npx)
npx serve .
```

Depois acesse `http://localhost:8000`.

## Publicando no GitHub Pages

**Opção 1 — GitHub Actions (incluído neste projeto, recomendado)**

1. Crie um repositório no GitHub e suba este projeto:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do app"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
2. No GitHub, vá em **Settings → Pages** e em "Build and deployment" escolha
   **Source: GitHub Actions**.
3. Pronto — o workflow em `.github/workflows/deploy.yml` publica
   automaticamente a cada push na branch `main`. Acompanhe em **Actions**.
4. O site fica disponível em
   `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

**Opção 2 — Deploy pela branch, sem Actions**

Em **Settings → Pages**, em "Build and deployment", escolha **Source: Deploy
from a branch**, selecione a branch `main` e a pasta `/ (root)`. Não é
necessário nenhum passo de build.

## Notas sobre o conteúdo

- Texto bíblico: versão **ACF** (Almeida Corrigida Fiel).
- As faixas da tela "Bíblia em Áudio" usam arquivos de demonstração
  (royalty-free, via SoundHelix) como placeholder — troque `data/audioTracks.js`
  pelas suas próprias narrações quando tiver.
- Sequência de leitura, insígnias e estatísticas do Perfil são valores de
  exemplo (não há, ainda, um sistema de métricas real por trás) — quando
  o app passar a registrar isso de verdade, basta alimentar
  `js/features/profile/profile.js` com os dados reais.
- O botão **Explicar** (na seleção de texto e no painel de explicação de
  versículo) abre uma busca no Google sobre o trecho selecionado em uma
  nova aba — como o app não tem backend nem chave de API de IA, essa é a
  forma de dar uma explicação real sem inventar conteúdo teológico por
  conta própria. Se um dia o app ganhar um backend, dá pra trocar por uma
  chamada de API dentro de `js/utils/externalExplain.js`, mantendo o resto
  igual.
- Por padrão, a leitura por voz tenta usar uma **voz masculina em
  português do Brasil** quando o aparelho tiver uma disponível (a Web
  Speech API não expõe o gênero da voz — o app estima pelo nome; veja
  `guessVoiceGender` em `js/utils/speech.js`). As vozes instaladas variam
  por aparelho/navegador, então em alguns dispositivos pode não haver
  nenhuma voz masculina em pt-BR — nesse caso o app cai para a melhor voz
  em português disponível, e avisa com um toast. O usuário sempre pode
  escolher manualmente em Configurações (Masculina/Feminina/Automática,
  ou uma voz específica).
- **Pausar/Continuar a narrativa** funciona por versículo, não por palavra
  exata: a Web Speech API tem `pause()`/`resume()` nativos, mas eles são
  pouco confiáveis entre navegadores (principalmente Chrome no Android,
  onde a fala pode travar de vez após pausar). Por isso "pausar" para a
  fala do versículo atual sem avançar, e "continuar" relê esse mesmo
  versículo do início — é 100% confiável em qualquer navegador, ao custo
  de não retomar no meio exato de uma frase.

## Versões da Bíblia

O app já vem com a **ACF** (Almeida Corrigida Fiel) e tem a arquitetura
pronta para outras versões — falta só o arquivo de dados de cada uma.

**Por que não vieram prontas:** a maioria das traduções mais conhecidas em
português (NVI, ARA, NTLH, Almeida Século 21 etc.) é protegida por
direitos autorais das editoras/sociedades bíblicas — não é apropriado
redistribuir o texto completo sem licença. Pesquisei alternativas de uso
livre e escolhi duas:

- **Bíblia Livre (BLIVRE)** — tradução moderna sob licença Creative
  Commons Atribuição (uso livre, inclusive comercial, com menção da
  fonte).
- **ARC 1911 (Almeida Revista e Corrigida, 1911)** — edição em domínio
  público.

Encontrei duas fontes prontas com essas versões em JSON, com licença clara:
`damarals/biblias` no GitHub, e o pacote "All Bibles - JSON" do Bible
SuperSearch no SourceForge (esse último inclusive avisa explicitamente que
os arquivos são livres para compartilhar/redistribuir). **Tentei baixar
os dois automaticamente várias vezes nesta e em conversas anteriores, sem
sucesso** — ambos exigem um redirecionamento (GitHub Releases e o "seu
download vai começar em instantes..." do SourceForge) que minha
ferramenta de busca não segue sozinha; ela só acessa o conteúdo bruto de
uma URL, sem executar esse redirecionamento como um navegador faria.
Baixando pelo seu próprio navegador isso não acontece — é só um limite
desta sessão, não um problema de licença.

**Forma mais fácil de resolver:** baixe o arquivo da versão desejada no
link abaixo (abre e baixa direto no seu navegador) e **me envie o
arquivo numa próxima mensagem** — eu mesmo cuido do resto (conversão de
formato se precisar, salvar no lugar certo, ativar no seletor de versão).

- Bíblia Livre: `https://sourceforge.net/projects/biblesuper/files/All%20Bibles%20-%20JSON/PT-Portuguese/blivre.json/download`
  ou `https://github.com/damarals/biblias/releases/latest/download/BLIVRE.json`
- ARC 1911: `https://sourceforge.net/projects/biblesuper/files/All%20Bibles%20-%20JSON/PT-Portuguese/almeida_rc.json/download`
  ou `https://github.com/damarals/biblias/releases/latest/download/ALM1911.json`

Se preferir fazer você mesmo em vez de me enviar o arquivo: salve como
`data/bible-blivre.json` ou `data/bible-alm1911.json` dentro da pasta
`data/` deste projeto, depois abra `data/bibleVersions.js` e mude
`available: false` para `available: true` na versão correspondente — o
formato esperado é um array de livros com `{abbrev, name, chapters}`,
igual `data/bible-acf.json`.

## Limitações conhecidas

- **Reprodução com a tela apagada / app em segundo plano**: um app web
  (sem instalar nada nativo) nunca tem garantia total disso — é uma
  limitação de todo navegador, não só deste projeto. O app usa três
  técnicas em conjunto, tudo em `js/utils/wakeLock.js`,
  `js/utils/mediaSession.js` e `js/utils/keepAlive.js`:
  - **Wake Lock**: impede a tela de apagar sozinha por inatividade
    enquanto a narrativa toca. Funciona bem em Chrome/Edge/Android; o
    navegador libera esse "seguro" automaticamente se você trocar de app
    ou apertar o botão de bloquear manualmente (não tem como impedir
    isso, e nem deveria).
  - **Media Session**: mostra controles de play/pausar/parar/capítulo
    seguinte/anterior na tela de bloqueio e nas notificações, e sinaliza
    ao navegador que há mídia em reprodução — o que também ajuda o
    navegador a não suspender a aba tão agressivamente em segundo plano.
  - **Áudio silencioso em loop**: toca um som inaudível o tempo todo
    durante a narrativa, técnica comum para sinalizar ao navegador que a
    aba está "reproduzindo áudio" e por isso merece menos limitação em
    segundo plano.
  - Na prática: **Chrome/Android costuma se comportar bem** com essas
    três técnicas juntas. **Safari/iOS é historicamente bem mais
    restritivo** com JavaScript em segundo plano e pode pausar a
    narrativa depois de um tempo com a tela apagada, mesmo com tudo isso
    implementado — é uma política do próprio Safari, não algo que dá
    para contornar 100% a partir do código do app.

- **Explicação de versículo com IA**: este app é 100% estático (sem
  backend, sem chave de API), então não há como gerar uma explicação real
  sob demanda para qualquer um dos 31 mil versículos da Bíblia. Em vez de
  inventar comentário teológico automaticamente — o que arriscaria
  conteúdo raso ou impreciso em escala — o painel de explicação traz
  comentário elaborado com cuidado para um conjunto curado de ~25
  versículos centrais e muito conhecidos (`data/verseCommentary.js`,
  função `getVerseCommentary`). Para os demais versículos, o painel mostra
  isso claramente e oferece buscar comentário externo em vez de fingir uma
  explicação que não existe. Para ampliar a cobertura, basta adicionar
  entradas nesse arquivo (chave `"{bookIndex}-{chapterIndex}-{verseIndex}"`,
  todos 0-based) ou, no futuro, ligar essa função a uma API de IA.
- **Progresso salvo é de UM capítulo por vez**: o app lembra a última
  posição de leitura/narrativa (livro, capítulo e versículo), não um
  histórico por capítulo. Se você pausar em Gênesis 1 e depois abrir João 3
  sem retomar, a posição salva passa a ser João 3 — a pausa em Gênesis 1
  não fica guardada em paralelo.
- **Avanço automático de capítulo** funciona dentro do mesmo livro; ao
  concluir o último capítulo de um livro, o app avisa e para (não pula
  automaticamente para o primeiro capítulo do próximo livro).
- **Guia de Ministração**: mesma lógica do comentário de versículo — 12
  temas com esboço elaborado com cuidado (`data/ministryOutlines.js`), não
  geração automática para qualquer tema que se possa imaginar. Para
  ampliar, basta seguir o mesmo formato e adicionar novas entradas. A
  busca só filtra os temas existentes — digitar um tema novo não gera um
  esboço automaticamente pelo mesmo motivo (sem backend/IA), mas oferece
  buscar conteúdo externo sobre ele.
- **Em paisagem** (celular deitado), a toolbar de leitura (Iniciar/Pausar/
  Parar/fonte/espaçamento) ficava grande demais e cobria o texto do
  capítulo — os botões agora encolhem em telas baixas para deixar espaço
  de leitura de verdade.
- **App instalável**: adicionado `manifest.json` (ícone, nome, `display:
  standalone`) e um botão "Instalar aplicativo" em Configurações — abre
  sem a barra de endereço do navegador quando instalado. O ícone do app
  (favicon e ícones de instalação) usa a imagem enviada pelo usuário
  (livro aberto, cruz e pôr do sol dentro de um círculo dourado).

## O que mudou em relação ao protótipo original

Este projeto partiu de um único arquivo HTML de ~7,4MB. Na reestruturação,
foram corrigidos alguns problemas reais encontrados no arquivo original:

- Dois sistemas de navegação concorrentes foram unificados em um roteador
  único baseado em hash
- Um player de áudio duplicado (com uma variável declarada duas vezes no
  escopo global) quebrava a versão "robusta" do player em tempo de
  execução — os botões de próxima/anterior faixa não funcionavam
- O vídeo do topo estava em H.265/HEVC, codec sem suporte nativo na maioria
  dos navegadores (Chrome, Firefox, Edge) — foi convertido para H.264/WebM
- O mesmo vídeo estava embutido em Base64 três vezes no HTML (~3,3MB
  redundantes); agora é um único arquivo real, carregado uma vez
- O rótulo "(KJV)" nos versículos de destaque foi corrigido para "(ACF)",
  a versão realmente usada em todo o app
- O ícone da Bíblia era um livro genérico desenhado em SVG — o nav
  inferior mantém um SVG simples (livro com cruz, pois em 22px a foto
  perde nitidez), e o banner de sequência (Home e Perfil) usa a imagem
  real enviada (`assets/icons/bible-icon.png`, livro com cruz e fita
  vermelha), onde o detalhe aparece bem
- Havia uma barra de status falsa (relógio, sinal, wi-fi, bateria)
  duplicando a barra de status real do navegador/aparelho — foi removida
- A leitura por voz do versículo do dia continuava falando em segundo
  plano mesmo depois de trocar de tela
- O placar do Quiz podia, em certos casos, sobrescrever outra tela já
  aberta se o usuário saísse no meio da transição entre perguntas
- A busca podia mostrar um resultado desatualizado se o usuário digitasse
  rápido demais (resposta antiga chegando depois da mais recente)
- Clicar num versículo para destacá-lo conflitava com arrastar para
  selecionar um trecho de texto
- A narrativa por voz agora tem controle completo de Pausar/Continuar
  (retomando do mesmo versículo, sem reiniciar o capítulo), anuncia o
  livro e capítulo antes de começar, e avança sozinha para o próximo
  capítulo ao terminar, com um aviso de transição falado
- Tocar num versículo agora abre um painel com Explicação, Contexto,
  Aplicação e Conceitos importantes (para os versículos com comentário
  curado — veja "Limitações conhecidas")
- A Home mostra um card "Continue de onde parou" quando há uma narrativa
  pausada, com opção de retomar exatamente do versículo ou recomeçar o
  capítulo
- Adicionado seletor rápido de voz (Masculina/Feminina/Automática) em
  Configurações, além da lista detalhada de vozes já existente
- Removidos os botões de aumentar/diminuir espaçamento entre linhas
  (⇕- ⇕+) da tela de leitura — o espaçamento fica fixo no padrão
- A barra de navegação inferior tinha um espaço vazio grande abaixo dos
  ícones (mais visível no tema claro); reduzida para caber justo no
  tamanho dos botões

## V2.0 — Offline e narrativa contínua

A versão 2 adiciona `sw.js` e registra o Service Worker automaticamente em HTTPS/localhost. O leitor também avança do último capítulo de um livro para o primeiro capítulo do próximo, mantendo a narrativa contínua.

