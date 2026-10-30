// Resumos de capítulo prontos: aparecem na hora no botão "Explicar capítulo", sem internet
// e sem gastar as perguntas diárias do Assistente.
// Chave: "{bookIndex}-{chapterIndex}", ambos a partir de 0.
// Cada entrada: { ref, resumo, pontos: [3 a 5 frases curtas], aplicacao }.
// "ref" é só uma etiqueta legível usada pelo verificador; o app ignora esse campo.
export const CHAPTER_SUMMARIES = {
  // ---------- Filipenses ----------
  '49-0': {
    ref: 'Filipenses 1',
    resumo: 'Paulo escreve da prisão à igreja de Filipos, agradece pela parceria deles no evangelho e ora para que o amor deles cresça com conhecimento e discernimento. Mostra que até a prisão ajudou a espalhar o evangelho e os exorta a viver de modo digno de Cristo, unidos e firmes.',
    pontos: [
      'Paulo agradece a Deus pela parceria dos filipenses no evangelho desde o primeiro dia.',
      'Ele ora para que o amor deles aumente em conhecimento e discernimento, e que sejam sinceros e irrepreensíveis.',
      'A prisão de Paulo serviu para o avanço do evangelho, e Cristo é anunciado até por motivos diferentes.',
      'Para Paulo, viver é Cristo e morrer é ganho, e ele aceita permanecer para ajudar os irmãos.',
      'Os crentes são chamados a viver como cidadãos dignos do evangelho, unidos, sem se intimidar com os adversários.',
    ],
    aplicacao: 'Mesmo em circunstâncias difíceis, é possível enxergar como Deus pode usá-las, e viver de modo coerente com o evangelho, em unidade com os irmãos.',
  },
  '49-1': {
    ref: 'Filipenses 2',
    resumo: 'Paulo pede unidade e humildade na igreja e apresenta Cristo como modelo: Ele, sendo Deus, se esvaziou, serviu e foi obediente até a cruz, e por isso Deus o exaltou. Em seguida, orienta os filipenses a viver com firmeza e alegria e cita Timóteo e Epafrodito como exemplos de serviço.',
    pontos: [
      'A unidade nasce da humildade e de olhar para os outros com respeito e interesse.',
      'Cristo, sendo igual a Deus, se esvaziou, tomou a forma de servo e foi obediente até a morte de cruz.',
      'Deus exaltou a Jesus, e toda língua confessará que Ele é Senhor.',
      'Os crentes são chamados a viver a salvação com seriedade, sem murmurações, brilhando como luzeiros, pois é Deus quem age neles.',
      'Timóteo e Epafrodito aparecem como exemplos de quem serve com sinceridade e se dedica à obra de Cristo.',
    ],
    aplicacao: 'Imitar a atitude de Cristo na prática diária: servir com humildade e buscar a unidade antes da própria vantagem.',
  },
  '49-2': {
    ref: 'Filipenses 3',
    resumo: 'Paulo alerta contra quem confia em méritos religiosos e conta que considera perda tudo o que antes valorizava, para ganhar a Cristo e a justiça que vem da fé. Ele segue em frente para o alvo e lembra que a cidadania dos cristãos está nos céus.',
    pontos: [
      'Paulo adverte contra os que confiam em ritos e conquistas humanas em vez de Cristo.',
      'Ele lista seus títulos e méritos, mas os considera perda diante do valor de conhecer a Cristo.',
      'A justiça que vale vem da fé em Cristo, e não do esforço pessoal de cumprir a lei.',
      'Paulo reconhece que ainda não chegou à perfeição, mas esquece o que ficou para trás e avança para o alvo.',
      'A cidadania dos cristãos está nos céus, de onde esperam o Salvador, que transformará o seu corpo.',
    ],
    aplicacao: 'Examinar em que se confia, se nas próprias conquistas ou em Cristo, e seguir crescendo sem olhar para trás com culpa ou orgulho.',
  },
  '49-3': {
    ref: 'Filipenses 4',
    resumo: 'Paulo encerra a carta com exortações práticas: unidade, alegria no Senhor, oração no lugar da ansiedade e pensamento voltado para o que é bom. Ele fala do contentamento que aprendeu em qualquer situação e agradece a oferta que os filipenses enviaram.',
    pontos: [
      'Paulo pede a duas mulheres da igreja, Evódia e Síntique, que vivam em harmonia.',
      'Ele convida a alegrar-se sempre no Senhor, a ser amável com todos e a não viver ansioso.',
      'A oração com ação de graças traz a paz de Deus, que guarda o coração e a mente.',
      'Os crentes são orientados a pensar no que é verdadeiro, honesto, justo, puro e digno de louvor.',
      'Paulo aprendeu a viver contente em qualquer situação, e agradece a generosidade dos filipenses.',
    ],
    aplicacao: 'Treinar o pensamento e a oração diariamente, trocando a ansiedade por gratidão e pedidos, e cultivar contentamento em vez de comparação.',
  },
};

export function getChapterSummary(bookIndex, chapterIndex) {
  return CHAPTER_SUMMARIES[`${bookIndex}-${chapterIndex}`] || null;
}
