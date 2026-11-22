export function referenciaParaFala(ref) {
  const referencia = String(ref || '').trim();

  if (!referencia) return '';

  const salmos = referencia.match(
    /^Salmos?\s+(\d+)(?:\s*:\s*(\d+)(?:\s*[–—-]\s*(\d+))?)?$/i
  );

  if (salmos) {
    if (!salmos[2]) return `Salmos ${salmos[1]}`;

    if (salmos[3]) {
      return `Salmos ${salmos[1]}, versículos ${salmos[2]} a ${salmos[3]}`;
    }

    return `Salmos ${salmos[1]}, versículo ${salmos[2]}`;
  }

  const formasNumeradas = [
    [/^1 Samuel\b/i, 'Primeiro Samuel'],
    [/^2 Samuel\b/i, 'Segundo Samuel'],
    [/^1 Reis\b/i, 'Primeiro Reis'],
    [/^2 Reis\b/i, 'Segundo Reis'],
    [/^1 Crônicas\b/i, 'Primeiro Crônicas'],
    [/^2 Crônicas\b/i, 'Segundo Crônicas'],
    [/^1 Coríntios\b/i, 'Primeira aos Coríntios'],
    [/^2 Coríntios\b/i, 'Segunda aos Coríntios'],
    [/^1 Tessalonicenses\b/i, 'Primeira aos Tessalonicenses'],
    [/^2 Tessalonicenses\b/i, 'Segunda aos Tessalonicenses'],
    [/^1 Timóteo\b/i, 'Primeira a Timóteo'],
    [/^2 Timóteo\b/i, 'Segunda a Timóteo'],
    [/^1 Pedro\b/i, 'Primeira Carta de Pedro'],
    [/^2 Pedro\b/i, 'Segunda Carta de Pedro'],
    [/^1 João\b/i, 'Primeira Carta de João'],
    [/^2 João\b/i, 'Segunda Carta de João'],
    [/^3 João\b/i, 'Terceira Carta de João'],
  ];

  let falada = referencia;

  for (const [padrao, forma] of formasNumeradas) {
    if (padrao.test(falada)) {
      falada = falada.replace(padrao, forma);
      break;
    }
  }

  return falada
    .replace(
      /^(.+?)\s+(\d+):(\d+)\s*[–—-]\s*(\d+)$/,
      '$1, capítulo $2, versículos $3 a $4'
    )
    .replace(
      /^(.+?)\s+(\d+):(\d+)$/,
      '$1, capítulo $2, versículo $3'
    )
    .replace(
      /^(.+?)\s+(\d+)\s*[–—-]\s*(\d+)$/,
      '$1, capítulos $2 a $3'
    )
    .replace(
      /^([^,]+?)\s+(\d+)$/,
      '$1, capítulo $2'
    );
}
