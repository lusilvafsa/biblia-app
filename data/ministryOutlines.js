// Esboços de ministração curados: para cada tema, uma passagem principal
// e uma estrutura de esboço (introdução, pontos, aplicação, oração final)
// pensada para apoiar quem vai conduzir um estudo, devocional ou
// pregação curta sobre o assunto.
//
// Mesma observação do comentário de versículos (data/verseCommentary.js):
// como o app não tem backend nem IA, este é um conjunto curado com
// cuidado, não uma geração automática para qualquer tema.
export const MINISTRY_OUTLINES = [
  {
    id: 'fe',
    tema: 'Fé',
    versiculoPrincipal: { ref: 'Hebreus 11:1', texto: 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.' },
    versiculosApoio: ['Romanos 10:17', 'Marcos 11:24', 'Tiago 2:17'],
    esboco: {
      introducao: 'A fé é o que sustenta o cristão mesmo quando as circunstâncias não mudaram. Não é ausência de dúvida, mas confiança ativa em quem Deus é e no que Ele prometeu.',
      pontos: [
        { titulo: '1. A fé nasce da Palavra', texto: 'Romanos 10:17 mostra que a fé vem pelo ouvir a palavra de Deus — ela cresce com exposição constante às Escrituras, não com esforço de vontade isolado.' },
        { titulo: '2. A fé se prova na ação', texto: 'Tiago 2:17 ensina que fé sem obras é morta — fé genuína se manifesta em como vivemos, não apenas no que declaramos crer.' },
        { titulo: '3. A fé enfrenta o invisível', texto: 'Hebreus 11:1 define fé como confiança no que ainda não se vê — ela lida com promessas, não apenas com evidências já cumpridas.' },
      ],
      aplicacao: 'Convide o grupo a identificar uma área da vida em que estão andando mais pela vista do que pela fé, e a escolher um passo concreto de obediência esta semana.',
      oracaoFinal: 'Peça a Deus para fortalecer a fé do grupo através do tempo na Palavra, e coragem para agir de acordo com o que creem.',
    },
  },
  {
    id: 'oracao',
    tema: 'Oração',
    versiculoPrincipal: { ref: 'Filipenses 4:6', texto: 'Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplicas, com ação de graças.' },
    versiculosApoio: ['Mateus 6:9-13', '1 Tessalonicenses 5:17', 'Tiago 5:16'],
    esboco: {
      introducao: 'A oração é o meio pelo qual o cristão mantém uma relação viva com Deus — não é um ritual isolado, mas uma conversa contínua.',
      pontos: [
        { titulo: '1. Oração como confiança, não ansiedade', texto: 'Filipenses 4:6 contrasta inquietação com oração — orar é entregar a Deus o que nos preocupa, em vez de carregar sozinho.' },
        { titulo: '2. Um modelo simples de oração', texto: 'O Pai Nosso (Mateus 6:9-13) ensina uma estrutura: adoração, submissão, pedido, perdão e proteção — um roteiro prático para orar com propósito.' },
        { titulo: '3. Oração como estilo de vida', texto: '1 Tessalonicenses 5:17 pede para orar sem cessar — não uma atividade pontual, mas uma postura constante de dependência de Deus.' },
      ],
      aplicacao: 'Sugira ao grupo estabelecer um horário fixo, mesmo que curto, para orar nos próximos dias, e compartilhar como foi na próxima vez que se reunirem.',
      oracaoFinal: 'Ore para que a oração deixe de ser obrigação e se torne um hábito natural e desejado no dia a dia de cada um.',
    },
  },
  {
    id: 'amor',
    tema: 'Amor',
    versiculoPrincipal: { ref: '1 Coríntios 13:4-7', texto: 'O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbece.' },
    versiculosApoio: ['João 13:34-35', '1 João 4:19', 'Romanos 5:8'],
    esboco: {
      introducao: 'O amor cristão vai além do sentimento — é uma escolha de compromisso com o bem-estar do outro, inspirada no próprio amor de Deus por nós.',
      pontos: [
        { titulo: '1. O padrão do amor', texto: '1 Coríntios 13:4-7 descreve o amor em termos de atitudes práticas: paciência, bondade, ausência de inveja e arrogância.' },
        { titulo: '2. O amor como marca do discípulo', texto: 'João 13:34-35 mostra que o amor mútuo entre os cristãos é o sinal visível de que pertencem a Cristo.' },
        { titulo: '3. A origem do amor', texto: 'Romanos 5:8 e 1 João 4:19 lembram que amamos porque Deus amou primeiro — o amor humano genuíno nasce de ter recebido o amor de Deus.' },
      ],
      aplicacao: 'Peça que cada um pense em um relacionamento difícil no momento e escolha uma atitude concreta de 1 Coríntios 13 para praticar ali esta semana.',
      oracaoFinal: 'Ore pedindo que o grupo reflita mais o caráter do amor de Deus em suas relações mais próximas.',
    },
  },
  {
    id: 'perdao',
    tema: 'Perdão',
    versiculoPrincipal: { ref: 'Efésios 4:32', texto: 'Antes sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.' },
    versiculosApoio: ['Mateus 18:21-22', 'Colossenses 3:13', 'Mateus 6:14-15'],
    esboco: {
      introducao: 'Perdoar é um dos aspectos mais desafiadores da vida cristã, mas está diretamente ligado a como recebemos o perdão de Deus.',
      pontos: [
        { titulo: '1. O padrão: como Deus perdoou', texto: 'Efésios 4:32 e Colossenses 3:13 ligam o nosso perdão ao outro ao perdão que já recebemos de Deus em Cristo — não é uma medida à parte.' },
        { titulo: '2. Sem limite para perdoar', texto: 'Mateus 18:21-22 responde a pergunta "quantas vezes?" com "setenta vezes sete" — uma forma de dizer que o perdão não deve ser contado ou racionado.' },
        { titulo: '3. O perdão e nossa relação com Deus', texto: 'Mateus 6:14-15 alerta que a forma como perdoamos afeta nossa própria experiência do perdão de Deus.' },
      ],
      aplicacao: 'Com sensibilidade, pergunte se alguém está carregando uma mágoa não resolvida e o que um primeiro passo em direção ao perdão poderia ser — sem forçar respostas públicas.',
      oracaoFinal: 'Ore por cura para feridas antigas e coragem para dar passos de perdão, no tempo de cada pessoa.',
    },
  },
  {
    id: 'esperanca',
    tema: 'Esperança',
    versiculoPrincipal: { ref: 'Romanos 15:13', texto: 'Ora, o Deus de esperança vos encha de todo o gozo e paz em crença, para que abundeis em esperança pela virtude do Espírito Santo.' },
    versiculosApoio: ['Jeremias 29:11', 'Romanos 8:24-25', 'Salmos 42:11'],
    esboco: {
      introducao: 'A esperança bíblica não é otimismo vago — é confiança firme baseada no caráter e nas promessas de Deus, mesmo em meio a circunstâncias difíceis.',
      pontos: [
        { titulo: '1. Deus como fonte da esperança', texto: 'Romanos 15:13 identifica Deus como "Deus de esperança" — ela não vem de nós mesmos, mas é dada por Ele através do Espírito Santo.' },
        { titulo: '2. Esperança que espera o que não se vê', texto: 'Romanos 8:24-25 conecta esperança com paciência — esperar em Deus envolve perseverança, não solução imediata.' },
        { titulo: '3. Falando esperança à própria alma', texto: 'Salmos 42:11 mostra o salmista conversando com sua própria alma abatida, escolhendo esperar em Deus apesar do sentimento presente.' },
      ],
      aplicacao: 'Convide o grupo a escrever ou verbalizar uma situação em que precisam escolher esperança hoje, apoiados numa promessa específica de Deus.',
      oracaoFinal: 'Ore para que o Deus de esperança encha o grupo de paz mesmo em meio a circunstâncias incertas.',
    },
  },
  {
    id: 'gratidao',
    tema: 'Gratidão',
    versiculoPrincipal: { ref: '1 Tessalonicenses 5:18', texto: 'Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.' },
    versiculosApoio: ['Salmos 100:4', 'Colossenses 3:15-17', 'Filipenses 4:6'],
    esboco: {
      introducao: 'Gratidão é uma escolha e uma disciplina espiritual — reconhecer ativamente a bondade de Deus muda a forma como enxergamos as circunstâncias.',
      pontos: [
        { titulo: '1. Gratidão em tudo, não apenas no bom', texto: '1 Tessalonicenses 5:18 pede gratidão "em tudo", não necessariamente "por tudo" — uma atitude de confiança em Deus mesmo em meio à dificuldade.' },
        { titulo: '2. Gratidão como porta de entrada à presença de Deus', texto: 'Salmos 100:4 associa entrar com ação de graças e louvor — a gratidão nos posiciona para adorar.' },
        { titulo: '3. Gratidão que transborda em comunidade', texto: 'Colossenses 3:15-17 liga gratidão à paz de Cristo e à forma como nos relacionamos uns com os outros.' },
      ],
      aplicacao: 'Peça que cada pessoa compartilhe uma coisa específica pela qual é grata hoje, incentivando a prática de nomear bênçãos concretas.',
      oracaoFinal: 'Ore agradecendo a Deus por bênçãos específicas mencionadas pelo grupo, terminando com um tom de louvor.',
    },
  },
  {
    id: 'sabedoria',
    tema: 'Sabedoria',
    versiculoPrincipal: { ref: 'Tiago 1:5', texto: 'E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente, e o não lança em rosto, e ser-lhe-á dada.' },
    versiculosApoio: ['Provérbios 9:10', 'Provérbios 3:5-6', 'Colossenses 2:2-3'],
    esboco: {
      introducao: 'A sabedoria bíblica é mais do que conhecimento — é a capacidade de aplicar a verdade de Deus às decisões e desafios reais da vida.',
      pontos: [
        { titulo: '1. Sabedoria começa com Deus', texto: 'Provérbios 9:10 ensina que o temor do Senhor é o princípio da sabedoria — reverência a Deus é a base, não o ponto de chegada.' },
        { titulo: '2. Sabedoria é confiar além do próprio entendimento', texto: 'Provérbios 3:5-6 contrasta confiar em Deus com apoiar-se no próprio entendimento limitado.' },
        { titulo: '3. Sabedoria está disponível para quem pede', texto: 'Tiago 1:5 promete que Deus dá sabedoria liberalmente a quem pede — não é reservada só para poucos.' },
      ],
      aplicacao: 'Pergunte se há uma decisão específica em que o grupo precisa pedir sabedoria a Deus esta semana, e ore especificamente por isso.',
      oracaoFinal: 'Ore pedindo sabedoria de Deus para as decisões que o grupo está enfrentando.',
    },
  },
  {
    id: 'paciencia',
    tema: 'Paciência',
    versiculoPrincipal: { ref: 'Tiago 1:2-4', texto: 'Meus irmãos, tende grande gozo quando cairdes em várias tentações, sabendo que a prova da vossa fé produz a paciência.' },
    versiculosApoio: ['Romanos 5:3-4', 'Gálatas 5:22', 'Salmos 27:14'],
    esboco: {
      introducao: 'A paciência bíblica é construída através de provas — não é um traço natural, mas um fruto que amadurece com o tempo e a confiança em Deus.',
      pontos: [
        { titulo: '1. Provações produzem paciência', texto: 'Tiago 1:2-4 e Romanos 5:3-4 mostram um processo: tribulação produz paciência, e paciência leva à maturidade de caráter.' },
        { titulo: '2. Paciência é fruto do Espírito', texto: 'Gálatas 5:22 lista a paciência entre as qualidades que o Espírito Santo produz — não é conquistada só por esforço próprio.' },
        { titulo: '3. Esperar no Senhor com coragem', texto: 'Salmos 27:14 conecta esperar em Deus com ser forte e ter coragem — paciência ativa, não passividade.' },
      ],
      aplicacao: 'Convide o grupo a identificar uma situação atual que exige paciência, e a orar especificamente pedindo força para esperar bem, não apenas para que a espera acabe.',
      oracaoFinal: 'Ore por perseverança e paz para quem está em um período de espera difícil no grupo.',
    },
  },
  {
    id: 'familia',
    tema: 'Família',
    versiculoPrincipal: { ref: 'Josué 24:15', texto: 'Eu e a minha casa serviremos ao Senhor.', },
    versiculosApoio: ['Efésios 6:1-4', 'Provérbios 22:6', 'Salmos 127:3'],
    esboco: {
      introducao: 'A família é um espaço central de discipulado e cuidado na visão bíblica — um lugar onde a fé é vivida e transmitida no dia a dia.',
      pontos: [
        { titulo: '1. Uma decisão declarada', texto: 'Josué 24:15 mostra uma liderança clara: servir ao Senhor como família é uma escolha deliberada, não algo automático.' },
        { titulo: '2. Educação com propósito', texto: 'Provérbios 22:6 e Efésios 6:4 falam sobre criar e instruir os filhos no caminho e na disciplina do Senhor, com paciência e sem provocação.' },
        { titulo: '3. Família como bênção de Deus', texto: 'Salmos 127:3 lembra que os filhos são herança do Senhor — um chamado a cuidar da família com gratidão, não apenas obrigação.' },
      ],
      aplicacao: 'Pergunte que hábito familiar simples (uma refeição junto, uma oração antes de dormir) o grupo poderia estabelecer ou fortalecer esta semana.',
      oracaoFinal: 'Ore pelas famílias do grupo, por unidade, paciência e por servirem ao Senhor juntas.',
    },
  },
  {
    id: 'servico',
    tema: 'Serviço',
    versiculoPrincipal: { ref: 'Gálatas 5:13', texto: 'Servi-vos uns aos outros pelo amor.' },
    versiculosApoio: ['Marcos 10:45', 'João 13:14-15', '1 Pedro 4:10'],
    esboco: {
      introducao: 'Servir é um chamado central da vida cristã, inspirado no exemplo do próprio Jesus, que veio para servir, não para ser servido.',
      pontos: [
        { titulo: '1. O exemplo de Jesus', texto: 'Marcos 10:45 e João 13:14-15 (o lava-pés) mostram Jesus servindo mesmo sendo Senhor — um modelo de humildade prática.' },
        { titulo: '2. Liberdade que se expressa em serviço', texto: 'Gálatas 5:13 conecta a liberdade em Cristo com servir uns aos outros pelo amor, não com fazer o que quiser.' },
        { titulo: '3. Cada um com seu dom', texto: '1 Pedro 4:10 lembra que cada pessoa recebeu um dom para servir aos outros — o serviço é diverso, não uniforme.' },
      ],
      aplicacao: 'Peça que cada pessoa pense em uma forma prática e específica de servir alguém (dentro ou fora do grupo) nos próximos dias.',
      oracaoFinal: 'Ore pedindo um coração disposto a servir e sensibilidade para enxergar oportunidades práticas de ajudar.',
    },
  },
  {
    id: 'confianca',
    tema: 'Confiança em Deus',
    versiculoPrincipal: { ref: 'Provérbios 3:5-6', texto: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.' },
    versiculosApoio: ['Salmos 56:3', 'Isaías 26:3', 'Salmos 46:1'],
    esboco: {
      introducao: 'Confiar em Deus é entregar o controle das circunstâncias a Ele, especialmente quando não entendemos completamente o que está acontecendo.',
      pontos: [
        { titulo: '1. Confiança de coração inteiro', texto: 'Provérbios 3:5-6 pede confiança "de todo o coração" — não parcial, reservando uma área para controlar sozinho.' },
        { titulo: '2. Confiança no lugar do medo', texto: 'Salmos 56:3 mostra uma escolha ativa: "no dia em que temer, eu em ti confiarei" — confiança como resposta ao medo, não ausência dele.' },
        { titulo: '3. Deus como refúgio presente', texto: 'Salmos 46:1 descreve Deus como refúgio e fortaleza, socorro bem presente na angústia — base concreta para a confiança.' },
      ],
      aplicacao: 'Pergunte em que área da vida é mais difícil confiar em Deus agora, e ore especificamente entregando essa área a Ele.',
      oracaoFinal: 'Ore por paz para os corações do grupo diante de situações que estão fora do seu controle.',
    },
  },
  {
    id: 'provacoes',
    tema: 'Superação de Provações',
    versiculoPrincipal: { ref: 'Romanos 8:28', texto: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.' },
    versiculosApoio: ['2 Coríntios 4:16-18', 'Salmos 34:17-18', 'Tiago 1:12'],
    esboco: {
      introducao: 'Provações fazem parte da experiência humana, mas a Bíblia oferece uma perspectiva de propósito e presença de Deus mesmo nos momentos mais difíceis.',
      pontos: [
        { titulo: '1. Deus trabalha em meio às dificuldades', texto: 'Romanos 8:28 não promete ausência de dificuldade, mas afirma que Deus pode integrar até o que é difícil a um propósito bom.' },
        { titulo: '2. Uma perspectiva eterna', texto: '2 Coríntios 4:16-18 convida a olhar além do sofrimento momentâneo, em direção ao que é eterno.' },
        { titulo: '3. Deus perto dos que sofrem', texto: 'Salmos 34:17-18 assegura que o Senhor está perto dos que têm o coração quebrantado — Deus não está distante na dor.' },
      ],
      aplicacao: 'Com cuidado pastoral, pergunte se alguém está passando por uma provação agora e como o grupo pode apoiar essa pessoa nesta semana, além da oração.',
      oracaoFinal: 'Ore especificamente pelas dificuldades compartilhadas, pedindo conforto, força e a percepção da presença de Deus.',
    },
  },
];

export function getMinistryOutline(id) {
  return MINISTRY_OUTLINES.find((m) => m.id === id) || null;
}
