// Banco de perguntas do Quiz Bíblico. A tela sorteia 10 perguntas
// diferentes deste banco a cada partida, para não ficar sempre igual.
export const QUIZ_QUESTIONS = [
  { question: 'Quem foi o primeiro homem criado por Deus?', options: ['Adão', 'Noé', 'Moisés', 'Abraão'], correct: 0 },
  { question: 'Quantos dias Deus levou para criar o mundo?', options: ['6 dias', '7 dias', '40 dias', '3 dias'], correct: 0 },
  { question: 'Quem construiu a arca?', options: ['Moisés', 'Noé', 'Abraão', 'Davi'], correct: 1 },
  { question: 'Qual o primeiro livro da Bíblia?', options: ['Êxodo', 'Gênesis', 'Levítico', 'Números'], correct: 1 },
  { question: 'Quem liderou os israelitas para fora do Egito?', options: ['Josué', 'Davi', 'Moisés', 'Samuel'], correct: 2 },
  { question: 'Quantos apóstolos Jesus escolheu?', options: ['10', '12', '7', '70'], correct: 1 },
  { question: 'Quem foi lançado na cova dos leões?', options: ['Davi', 'Daniel', 'José', 'Paulo'], correct: 1 },
  { question: 'Qual o último livro da Bíblia?', options: ['Atos', 'Romanos', 'Apocalipse', 'Hebreus'], correct: 2 },
  { question: 'Quem foi o rei mais sábio de Israel?', options: ['Davi', 'Salomão', 'Josias', 'Ezequias'], correct: 1 },
  { question: 'Onde Jesus nasceu?', options: ['Nazaré', 'Jerusalém', 'Belém', 'Capernaum'], correct: 2 },
  { question: 'Quem traiu Jesus por 30 moedas de prata?', options: ['Pedro', 'Judas Iscariotes', 'Tomé', 'João'], correct: 1 },
  { question: 'Quantos dias Jesus jejuou no deserto?', options: ['7', '12', '40', '3'], correct: 2 },
  { question: 'Qual foi o primeiro milagre de Jesus, segundo João?', options: ['Andar sobre as águas', 'Transformar água em vinho', 'Multiplicar pães', 'Curar um cego'], correct: 1 },
  { question: 'Quem negou Jesus três vezes?', options: ['Tiago', 'Pedro', 'André', 'Filipe'], correct: 1 },
  { question: 'Qual apóstolo era conhecido como "o incrédulo"?', options: ['Tomé', 'Mateus', 'Bartolomeu', 'Simão'], correct: 0 },
  { question: 'Quem foi jogado no poço pelos próprios irmãos?', options: ['Jacó', 'José', 'Benjamim', 'Rúben'], correct: 1 },
  { question: 'Quem matou Golias?', options: ['Saul', 'Davi', 'Jônatas', 'Samuel'], correct: 1 },
  { question: 'Quantos livros tem a Bíblia (cânon protestante)?', options: ['66', '73', '39', '27'], correct: 0 },
  { question: 'Qual profeta foi engolido por um grande peixe?', options: ['Elias', 'Jonas', 'Isaías', 'Ezequiel'], correct: 1 },
  { question: 'Quem escreveu a maior parte do Novo Testamento (número de cartas)?', options: ['Pedro', 'João', 'Paulo', 'Tiago'], correct: 2 },
  { question: 'Qual era o nome da esposa de Abraão?', options: ['Rebeca', 'Raquel', 'Sara', 'Lia'], correct: 2 },
  { question: 'Quem interpretou os sonhos do Faraó no Egito?', options: ['Moisés', 'José', 'Daniel', 'Davi'], correct: 1 },
  { question: 'Em que monte Moisés recebeu os Dez Mandamentos?', options: ['Monte Sinai', 'Monte Sião', 'Monte Carmelo', 'Monte das Oliveiras'], correct: 0 },
  { question: 'Quem foi a primeira mulher, segundo a Bíblia?', options: ['Sara', 'Eva', 'Raquel', 'Débora'], correct: 1 },
  { question: 'Qual rei pediu sabedoria a Deus em vez de riquezas?', options: ['Davi', 'Salomão', 'Saul', 'Roboão'], correct: 1 },
  { question: 'Quem foi decapitado a pedido de Herodias?', options: ['Tiago', 'João Batista', 'Estêvão', 'Zacarias'], correct: 1 },
  { question: 'Qual foi o primeiro mártir cristão registrado em Atos?', options: ['Paulo', 'Estêvão', 'Barnabé', 'Timóteo'], correct: 1 },
  { question: 'Quantos anos os israelitas vagaram pelo deserto?', options: ['10 anos', '40 anos', '70 anos', '400 anos'], correct: 1 },
  { question: 'Quem foi transformada em estátua de sal?', options: ['A esposa de Ló', 'Sara', 'Débora', 'Miriã'], correct: 0 },
  { question: 'Qual profeta subiu ao céu em um carro de fogo?', options: ['Eliseu', 'Elias', 'Isaías', 'Jeremias'], correct: 1 },
  { question: 'Quem foi a rainha que intercedeu pelo seu povo na Pérsia?', options: ['Ester', 'Rute', 'Débora', 'Abigail'], correct: 0 },
  { question: 'Qual discípulo caminhou sobre as águas junto com Jesus?', options: ['João', 'Pedro', 'André', 'Tiago'], correct: 1 },
  { question: 'Quem foi o pai de Davi?', options: ['Jessé', 'Saul', 'Booz', 'Obede'], correct: 0 },
  { question: 'Em que cidade Jesus foi crucificado?', options: ['Belém', 'Nazaré', 'Jerusalém', 'Cafarnaum'], correct: 2 },
  { question: 'Qual foi a primeira praga do Egito?', options: ['Gafanhotos', 'Água transformada em sangue', 'Trevas', 'Morte dos primogênitos'], correct: 1 },
  { question: 'Quem foi Timóteo em relação a Paulo?', options: ['Seu irmão', 'Seu discípulo', 'Seu pai', 'Seu carcereiro'], correct: 1 },
  { question: 'Qual é considerado o "livro do meio" da Bíblia, com os Salmos?', options: ['Provérbios', 'Salmos', 'Eclesiastes', 'Jó'], correct: 1 },
  { question: 'Quem foi lançado na fornalha ardente e saiu ileso?', options: ['Daniel', 'Sadraque, Mesaque e Abede-Nego', 'Elias', 'José'], correct: 1 },
  { question: 'Qual apóstolo era cobrador de impostos antes de seguir Jesus?', options: ['Mateus', 'Tiago', 'Filipe', 'Simão'], correct: 0 },
  { question: 'Quantos discípulos Jesus enviou para pregar, além dos 12 apóstolos, segundo Lucas?', options: ['70', '50', '12', '100'], correct: 0 },
];

/** Sorteia `quantidade` perguntas sem repetir, embaralhadas. */
export function sortearPerguntas(quantidade = 10) {
  const copia = [...QUIZ_QUESTIONS];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, quantidade);
}
