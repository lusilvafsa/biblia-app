p = 'supabase/functions/assistente-biblico/index.ts'
c = open(p, encoding='utf-8').read()

def rep(old, new):
    global c
    n = c.count(old)
    if n != 1:
        raise SystemExit(f'ERRO: trecho achado {n}x (esperado 1): {old[:70]}')
    c = c.replace(old, new)

rep('let body: { mensagem?: unknown; tipo?: unknown; chave?: unknown };',
    'let body: { mensagem?: unknown; tipo?: unknown; chave?: unknown; consultarUso?: unknown };')

rep('if (typeof body.mensagem !== "string" || !body.mensagem.trim()) {',
    'const soConsulta = body.consultarUso === true;\n  if (!soConsulta && (typeof body.mensagem !== "string" || !body.mensagem.trim())) {')

rep('const texto = body.mensagem.trim();',
    'const texto = typeof body.mensagem === "string" ? body.mensagem.trim() : "";')

rep('const hoje = new Date().toISOString().slice(0, 10);',
    '// (dia calculado acima, no fuso de Brasília)')

rep('// ===== CACHE COMPARTILHADO (nao gasta o limite diario nem chama a IA) =====',
'''// ===== CONSULTA DE USO (nao chama a IA nem gasta pergunta) =====
  const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (soConsulta) {
    const { data: uso } = await adminClient
      .from("assistente_uso")
      .select("contagem")
      .eq("user_id", userId)
      .eq("dia", hoje)
      .maybeSingle();
    const usadas = uso?.contagem ?? 0;
    return Response.json(
      { sucesso: true, usadas, limite: LIMITE_DIARIO, restantes: Math.max(0, LIMITE_DIARIO - usadas) },
      { headers: corsHeaders },
    );
  }

  // ===== CACHE COMPARTILHADO (nao gasta o limite diario nem chama a IA) =====''')

open(p, 'w', encoding='utf-8').write(c)
print('OK: index.ts atualizado')
