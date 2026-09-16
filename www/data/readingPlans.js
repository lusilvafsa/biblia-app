// Planos de leitura estruturados dia a dia.
// Cada plano tem um id (usado na URL /planos/:id), título, descrição
// e uma lista de dias com referência bíblica e o foco do dia.
export const READING_PLANS = [
  {
    id: 'trinta-dias-com-jesus',
    titulo: '30 Dias com Jesus',
    descricao: 'Percorra a vida de Jesus pelos Evangelhos: nascimento, ministério, ensinos, milagres, paixão e ressurreição.',
    dias: [
      { dia: 1, referencia: 'Lucas 1:26-38', foco: 'O anúncio do anjo Gabriel a Maria' },
      { dia: 2, referencia: 'Lucas 2:1-20', foco: 'O nascimento de Jesus' },
      { dia: 3, referencia: 'Mateus 2:1-12', foco: 'A visita dos magos' },
      { dia: 4, referencia: 'Lucas 2:41-52', foco: 'Jesus no templo aos 12 anos' },
      { dia: 5, referencia: 'Mateus 3:1-17', foco: 'O batismo de Jesus' },
      { dia: 6, referencia: 'Mateus 4:1-11', foco: 'A tentação no deserto' },
      { dia: 7, referencia: 'João 1:35-51', foco: 'Os primeiros discípulos' },
      { dia: 8, referencia: 'João 2:1-11', foco: 'As bodas de Caná' },
      { dia: 9, referencia: 'Mateus 5:1-16', foco: 'O Sermão do Monte: as bem-aventuranças' },
      { dia: 10, referencia: 'Mateus 6:5-15', foco: 'Como orar: o Pai Nosso' },
      { dia: 11, referencia: 'Marcos 4:35-41', foco: 'Jesus acalma a tempestade' },
      { dia: 12, referencia: 'Mateus 14:13-21', foco: 'A multiplicação dos pães' },
      { dia: 13, referencia: 'Mateus 14:22-33', foco: 'Jesus anda sobre as águas' },
      { dia: 14, referencia: 'Lucas 10:25-37', foco: 'A parábola do bom samaritano' },
      { dia: 15, referencia: 'Lucas 15:11-32', foco: 'A parábola do filho pródigo' },
      { dia: 16, referencia: 'Mateus 13:1-23', foco: 'A parábola do semeador' },
      { dia: 17, referencia: 'João 4:1-26', foco: 'A mulher samaritana no poço' },
      { dia: 18, referencia: 'João 9:1-41', foco: 'A cura do cego de nascença' },
      { dia: 19, referencia: 'João 11:1-44', foco: 'A ressurreição de Lázaro' },
      { dia: 20, referencia: 'Lucas 19:1-10', foco: 'Zaqueu, o cobrador de impostos' },
      { dia: 21, referencia: 'Mateus 18:21-35', foco: 'O perdão sem limites' },
      { dia: 22, referencia: 'Marcos 10:13-16', foco: 'Jesus e as crianças' },
      { dia: 23, referencia: 'João 13:1-17', foco: 'Jesus lava os pés dos discípulos' },
      { dia: 24, referencia: 'Mateus 21:1-11', foco: 'A entrada triunfal em Jerusalém' },
      { dia: 25, referencia: 'Mateus 26:17-30', foco: 'A última ceia' },
      { dia: 26, referencia: 'Mateus 26:36-46', foco: 'A oração no Getsêmani' },
      { dia: 27, referencia: 'Mateus 27:11-26', foco: 'Jesus diante de Pilatos' },
      { dia: 28, referencia: 'Mateus 27:32-56', foco: 'A crucificação' },
      { dia: 29, referencia: 'Mateus 28:1-10', foco: 'A ressurreição' },
      { dia: 30, referencia: 'Lucas 24:13-35', foco: 'O caminho de Emaús' },
    ],
  },
  {
    id: 'salmos-de-conforto',
    titulo: 'Salmos de Conforto',
    descricao: 'Uma seleção de Salmos para momentos de ansiedade, medo, tristeza e necessidade de paz.',
    dias: [
      { dia: 1, referencia: 'Salmos 23:1-6', foco: 'O Senhor é o meu pastor' },
      { dia: 2, referencia: 'Salmos 27:1-14', foco: 'O Senhor é a minha luz e a minha salvação' },
      { dia: 3, referencia: 'Salmos 34:1-22', foco: 'Perto está o Senhor dos que têm o coração quebrantado' },
      { dia: 4, referencia: 'Salmos 46:1-11', foco: 'Deus é o nosso refúgio e fortaleza' },
      { dia: 5, referencia: 'Salmos 55:1-23', foco: 'Entrega tua carga ao Senhor' },
      { dia: 6, referencia: 'Salmos 62:1-12', foco: 'A minha alma espera somente em Deus' },
      { dia: 7, referencia: 'Salmos 91:1-16', foco: 'Debaixo das asas do Altíssimo' },
      { dia: 8, referencia: 'Salmos 116:1-19', foco: 'Amo o Senhor porque ele ouve a minha voz' },
      { dia: 9, referencia: 'Salmos 121:1-8', foco: 'O meu socorro vem do Senhor' },
      { dia: 10, referencia: 'Salmos 130:1-8', foco: 'Das profundezas eu clamo a ti' },
      { dia: 11, referencia: 'Salmos 139:1-24', foco: 'Tu me sondas e me conheces' },
      { dia: 12, referencia: 'Salmos 143:1-12', foco: 'Ensina-me a fazer a tua vontade' },
    ],
  },
];

export function getReadingPlan(id) {
  return READING_PLANS.find((plan) => plan.id === id) || null;
}
