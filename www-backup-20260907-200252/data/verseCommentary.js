// Comentário bíblico curado para a explicação ao selecionar um versículo.
//
// Nota importante sobre este arquivo: o app não tem backend nem chave de
// API de IA (é 100% estático), então não há como gerar uma explicação
// "sob demanda" para qualquer um dos 31 mil versículos da Bíblia em tempo
// real. Em vez de inventar comentário teológico automaticamente para
// qualquer versículo (o que arriscaria conteúdo raso ou impreciso em
// escala), este arquivo traz comentário elaborado com cuidado para um
// conjunto curado de ~25 versículos centrais e amplamente conhecidos,
// cobrindo Antigo e Novo Testamento. Para os demais versículos, a tela de
// explicação mostra, de forma transparente, uma opção de buscar comentário
// externo (ver js/features/bible/verseExplanation.js) em vez de fingir uma
// explicação que não existe.
//
// Chave: "{bookIndex}-{chapterIndex}-{verseIndex}", todos 0-based, batendo
// com os índices de data/bible-acf.json.
export const VERSE_COMMENTARY = {
  '0-0-0': {
    explicacao: 'Este é o versículo de abertura de toda a Bíblia e afirma o fundamento de toda a fé: Deus existe antes de tudo e é o criador de todas as coisas — o tempo ("no princípio"), o espaço ("céu e terra") e tudo que neles há.',
    contexto: 'Abre o livro de Gênesis e todo o relato da criação (Gênesis 1–2), que estabelece as bases teológicas para o restante das Escrituras: um Deus soberano, criador e pessoal.',
    aplicacao: 'Reconhecer Deus como criador convida à humildade e à confiança — se Ele criou tudo, Ele também cuida da sua vida e tem propósito para ela.',
    conceitos: '"Princípio" marca o início do tempo; "criou" (hebraico "bara") é usado na Bíblia quase sempre para a ação criadora de Deus, indicando algo trazido à existência.',
  },
  '0-0-26': {
    explicacao: 'Declara que o ser humano — homem e mulher — foi criado à imagem de Deus, distinguindo a humanidade do restante da criação e atribuindo-lhe dignidade única.',
    contexto: 'Conclui o sexto dia da criação, ápice da obra criadora de Deus, e antecede a bênção e a missão dada ao ser humano no versículo seguinte.',
    aplicacao: 'Toda pessoa carrega valor e dignidade por ser imagem de Deus, o que fundamenta o respeito à vida humana e a igualdade entre homem e mulher.',
    conceitos: '"Imagem de Deus" sugere representação e semelhança — não física, mas relacional, moral e espiritual.',
  },
  '1-19-2': {
    explicacao: 'Primeiro dos Dez Mandamentos: o povo de Deus deve adorar somente a Ele, sem dividir lealdade com outros deuses.',
    contexto: 'Dado no Monte Sinai, logo após o Êxodo do Egito, como parte da aliança entre Deus e Israel.',
    aplicacao: 'Convida a examinar o que ocupa o primeiro lugar na vida — dinheiro, sucesso, relacionamentos — e a colocar a Deus acima de tudo.',
    conceitos: '"Diante de mim" pode ser entendido como "além de mim" — não é apenas sobre ordem de prioridade, mas exclusividade na adoração.',
  },
  '18-22-0': {
    explicacao: 'Descreve Deus como pastor que cuida, guia e supre as necessidades de quem confia nEle, usando a imagem comum na cultura pastoril de Israel.',
    contexto: 'Abre um dos salmos mais conhecidos da Bíblia, atribuído a Davi, que havia sido pastor de ovelhas antes de rei.',
    aplicacao: 'Traz conforto em tempos de incerteza — lembra que Deus se importa pessoalmente com cada necessidade, como um pastor cuida de suas ovelhas.',
    conceitos: '"Nada me faltará" não promete ausência de dificuldades, mas suficiência: o pastor provê o necessário no tempo certo.',
  },
  '18-118-104': {
    explicacao: 'Compara a palavra de Deus a uma lâmpada e uma luz, que orienta os passos e o caminho de quem a segue.',
    contexto: 'Parte do maior capítulo da Bíblia, um extenso poema que celebra o valor da lei e da palavra de Deus.',
    aplicacao: 'Incentiva a buscar na Bíblia orientação prática e diária para as decisões da vida, não apenas conhecimento teórico.',
    conceitos: 'A "lâmpada" sugere luz para o passo imediato; a "luz para o caminho" sugere direção para a trajetória mais ampla da vida.',
  },
  '19-2-4': {
    explicacao: 'Convida a confiar plenamente em Deus em vez de depender exclusivamente da própria razão e entendimento limitados.',
    contexto: 'Parte da introdução do livro de Provérbios, em que um pai instrui o filho sobre como viver com sabedoria.',
    aplicacao: 'Nas decisões difíceis, buscar a orientação de Deus em oração e nas Escrituras, em vez de confiar apenas no próprio raciocínio.',
    conceitos: '"Estribar" significa apoiar-se; o versículo não descarta o uso da razão, mas alerta contra fazer dela a única fonte de segurança.',
  },
  '22-52-4': {
    explicacao: 'Profecia que descreve o sofrimento vicário do Servo de Deus, lida pela tradição cristã como referência a Jesus Cristo, ferido pelos pecados alheios.',
    contexto: 'Parte dos "Cânticos do Servo Sofredor" em Isaías, escritos séculos antes de Cristo, mas lidos pelos cristãos como anúncio profético de sua paixão.',
    aplicacao: 'Convida a refletir sobre o significado do sacrifício de Cristo e a gratidão por ele na fé cristã.',
    conceitos: '"Transgressões" e "iniquidades" referem-se a rebeldia e culpa moral; "castigo que nos traz a paz" descreve a reconciliação obtida por meio desse sofrimento.',
  },
  '22-39-30': {
    explicacao: 'Promete renovação de forças a quem espera no Senhor, usando a imagem da águia que voa alto sem se cansar.',
    contexto: 'Parte de uma seção de consolo a Israel, lembrando o povo do poder e da fidelidade de Deus mesmo em tempos difíceis.',
    aplicacao: 'Encoraja a perseverar na espera e na confiança em Deus durante períodos de cansaço ou desânimo.',
    conceitos: '"Esperar no Senhor" carrega a ideia de aguardar com expectativa ativa, não passividade.',
  },
  '23-28-10': {
    explicacao: 'Deus assegura ao povo exilado que tem planos de bem-estar e esperança para o futuro deles, mesmo em meio ao sofrimento do exílio.',
    contexto: 'Parte de uma carta de Jeremias aos judeus exilados na Babilônia, incentivando-os a se estabelecer e confiar no plano de Deus a longo prazo.',
    aplicacao: 'Muitas vezes citado individualmente, o versículo lembra que Deus tem propósitos bons mesmo quando as circunstâncias parecem difíceis — no contexto original, essa promessa envolvia paciência ao longo de gerações.',
    conceitos: '"Pensamentos de paz" (shalom) remete a bem-estar integral, não apenas ausência de conflito.',
  },
  '42-2-15': {
    explicacao: 'Resume o cerne do evangelho cristão: o amor de Deus pelo mundo o levou a entregar seu Filho para que quem nele crê tenha vida eterna.',
    contexto: 'Parte do diálogo de Jesus com Nicodemos, um líder religioso judeu que buscava entender o novo nascimento espiritual.',
    aplicacao: 'Convida à fé pessoal em Jesus como resposta ao amor de Deus, e não apenas ao conhecimento religioso.',
    conceitos: '"Unigênito" indica filho único, ressaltando o valor do que foi dado; "vida eterna" refere-se tanto à qualidade quanto à duração da vida com Deus.',
  },
  '42-0-0': {
    explicacao: 'Afirma a divindade eterna de Jesus Cristo, identificado como "o Verbo", que existia com Deus e era Deus desde o princípio.',
    contexto: 'Abre o Evangelho de João com uma reflexão teológica que ecoa Gênesis 1:1, situando Jesus antes e acima da criação.',
    aplicacao: 'Fundamenta a fé cristã na divindade de Cristo, não apenas como mestre humano, mas como Deus encarnado.',
    conceitos: '"Verbo" (grego "logos") era um termo usado tanto na filosofia grega quanto no pensamento judaico para expressar razão, ordem e revelação divina.',
  },
  '42-13-5': {
    explicacao: 'Jesus se declara o único caminho de acesso ao Pai, afirmando ser também a verdade e a vida.',
    contexto: 'Parte do discurso de despedida de Jesus aos discípulos, na véspera de sua crucificação, respondendo a uma pergunta de Tomé.',
    aplicacao: 'Central para a compreensão cristã da salvação como algo mediado por Cristo.',
    conceitos: 'As três afirmações — caminho, verdade e vida — se complementam: Jesus não apenas ensina o caminho, ele o representa.',
  },
  '39-4-2': {
    explicacao: 'Primeira das bem-aventuranças: declara felizes os que reconhecem sua pobreza espiritual e dependência de Deus.',
    contexto: 'Abre o Sermão do Monte, o mais extenso ensino de Jesus registrado, sobre o caráter e os valores do Reino dos Céus.',
    aplicacao: 'Convida à humildade diante de Deus, reconhecendo que não temos méritos próprios suficientes diante dele.',
    conceitos: '"Pobres de espírito" não se refere à pobreza material, mas à consciência da própria insuficiência espiritual.',
  },
  '39-5-8': {
    explicacao: 'Abre o "Pai Nosso", o modelo de oração ensinado por Jesus, começando por reconhecer Deus como Pai e por santificar seu nome.',
    contexto: 'Parte do Sermão do Monte, em que Jesus ensina os discípulos a orar de forma simples e sincera.',
    aplicacao: 'Serve de modelo para a oração pessoal: começar reconhecendo quem Deus é antes de apresentar pedidos.',
    conceitos: '"Santificado seja o teu nome" expressa o desejo de que o caráter de Deus seja honrado.',
  },
  '39-27-18': {
    explicacao: 'A "Grande Comissão" — Jesus ordena aos discípulos que façam discípulos em todas as nações, batizando-os em nome da Trindade.',
    contexto: 'Últimas palavras de Jesus aos discípulos antes de sua ascensão, encerrando o Evangelho de Mateus.',
    aplicacao: 'Fundamenta a missão da igreja cristã de compartilhar a fé e formar discípulos em todo o mundo.',
    conceitos: 'A fórmula "Pai, Filho e Espírito Santo" é uma das bases bíblicas centrais para a doutrina da Trindade.',
  },
  '41-1-10': {
    explicacao: 'Anúncio do anjo aos pastores sobre o nascimento de Jesus, identificado como Salvador, Cristo e Senhor.',
    contexto: 'Parte do relato do nascimento de Jesus em Belém, marco central da celebração cristã do Natal.',
    aplicacao: 'Lembra que o nascimento de Jesus foi uma boa notícia de salvação oferecida a todos, começando pelos mais simples — os pastores.',
    conceitos: '"Cristo" é o título grego para "Messias" (ungido); "Senhor" reconhece sua autoridade divina.',
  },
  '44-7-27': {
    explicacao: 'Assegura que Deus age em todas as circunstâncias, inclusive nas difíceis, para o bem daqueles que o amam e seguem seu propósito.',
    contexto: 'Parte do capítulo 8 de Romanos, um dos textos mais ricos do Novo Testamento sobre a vida no Espírito e a segurança do crente.',
    aplicacao: 'Traz esperança em tempos de dificuldade, sem prometer ausência de sofrimento, mas afirmando um propósito maior por trás dele.',
    conceitos: '"Contribuem juntamente para o bem" não significa que tudo o que acontece é bom em si, mas que Deus pode integrar até o que é ruim a um propósito bom.',
  },
  '44-2-22': {
    explicacao: 'Declara a condição universal do pecado humano — todos, sem exceção, pecaram e estão aquém da glória de Deus.',
    contexto: 'Parte do argumento de Paulo em Romanos sobre a necessidade universal da graça de Deus, antes de apresentar a solução pela fé em Cristo.',
    aplicacao: 'Convida à humildade, reconhecendo que ninguém tem méritos próprios diante de Deus.',
    conceitos: '"Destituídos da glória de Deus" sugere não alcançar o padrão para o qual os seres humanos foram criados.',
  },
  '44-9-8': {
    explicacao: 'Descreve a fé que salva como confissão de Jesus como Senhor e crença sincera em sua ressurreição.',
    contexto: 'Parte da explicação de Paulo sobre como a salvação está ao alcance de todos que creem, e não apenas dos que seguem a lei.',
    aplicacao: 'Resume de forma simples e prática o convite central do evangelho à fé pessoal em Cristo.',
    conceitos: '"Confessar" e "crer" andam juntos — fé genuína envolve tanto convicção interior quanto expressão exterior.',
  },
  '45-12-3': {
    explicacao: 'Descreve as características práticas do amor genuíno — paciente, bondoso, sem inveja nem arrogância.',
    contexto: 'Parte do "capítulo do amor", em que Paulo corrige o uso indevido de dons espirituais na igreja de Corinto.',
    aplicacao: 'Serve como um "teste" prático para avaliar se nossas atitudes refletem amor genuíno nos relacionamentos do dia a dia.',
    conceitos: 'O termo grego original ("ágape") descreve amor de compromisso e escolha, distinto do amor apenas emocional.',
  },
  '47-4-21': {
    explicacao: 'Lista as qualidades que o Espírito Santo produz na vida de quem segue a Cristo, começando pelo amor.',
    contexto: 'Contrasta com as "obras da carne" listadas nos versículos anteriores, mostrando a transformação que a vida no Espírito produz.',
    aplicacao: 'Convida a avaliar o próprio caráter à luz dessas qualidades, como sinal de uma vida guiada pelo Espírito.',
    conceitos: '"Fruto" está no singular no grego original, sugerindo uma unidade de caráter, não dons isolados para escolher.',
  },
  '48-1-7': {
    explicacao: 'Afirma que a salvação é um presente de Deus recebido pela fé, e não algo conquistado por méritos ou esforço humano.',
    contexto: 'Parte da explicação de Paulo sobre a graça de Deus que transforma quem estava espiritualmente morto em pecado.',
    aplicacao: 'Liberta da ideia de que é preciso "merecer" o amor de Deus, e convida a recebê-lo com gratidão pela fé.',
    conceitos: '"Graça" é favor imerecido; "dom" reforça que a salvação não pode ser produzida pelo próprio esforço.',
  },
  '49-3-12': {
    explicacao: 'Paulo afirma que encontra força em Cristo para enfrentar qualquer circunstância, seja fartura ou necessidade.',
    contexto: 'Escrito na prisão, no contexto imediato de aprender a viver contente tanto na abundância quanto na escassez.',
    aplicacao: 'É frequentemente citado fora de contexto como promessa de sucesso geral, mas seu sentido original é sobre contentamento e resistência em meio às circunstâncias da vida, sustentado pela força de Cristo.',
    conceitos: '"Fortalece" sugere capacitação interior contínua, não uma força pontual.',
  },
  '5-0-8': {
    explicacao: 'Deus encoraja Josué a ser forte e corajoso ao assumir a liderança de Israel após a morte de Moisés, prometendo sua presença constante.',
    contexto: 'Início do livro de Josué, no momento de transição de liderança e véspera da entrada na Terra Prometida.',
    aplicacao: 'Encoraja a enfrentar novos desafios e responsabilidades com coragem, apoiado na certeza da presença de Deus.',
    conceitos: '"Não temas, nem te espantes" é uma ordem, não apenas um conselho — coragem aqui é resposta de fé, não ausência natural de medo.',
  },
  '65-20-3': {
    explicacao: 'Descreve a promessa final da restauração completa, quando Deus eliminará para sempre a dor, o choro e a morte.',
    contexto: 'Parte da visão da "nova Jerusalém" e da nova criação, ápice esperançoso do livro de Apocalipse.',
    aplicacao: 'Sustenta a esperança cristã diante do sofrimento presente, apontando para uma restauração definitiva prometida por Deus.',
    conceitos: '"Não haverá mais morte" indica o fim definitivo das consequências da queda humana descrita em Gênesis, fechando o arco narrativo da Bíblia.',
  },
};

export function getVerseCommentary(bookIndex, chapterIndex, verseIndex) {
  return VERSE_COMMENTARY[`${bookIndex}-${chapterIndex}-${verseIndex}`] || null;
}
