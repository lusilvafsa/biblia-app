import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SYSTEM_INSTRUCTION = String.raw`
Você é o Assistente Bíblico do aplicativo Bíblia de Estudo.

OBJETIVO
Ajudar o usuário a estudar a Bíblia com clareza, fidelidade ao contexto bíblico e respostas práticas, organizadas e objetivas.

REGRAS GERAIS
- Responda sempre em português do Brasil.
- Seja direto. Não faça introduções longas nem repita a pergunta.
- Evite respostas excessivamente amplas.
- Para perguntas simples, responda de forma curta.
- Para estudos, use títulos e tópicos.
- Prefira 3 a 5 pontos principais.
- Não invente versículos, referências, fatos históricos ou citações.
- Quando mencionar uma passagem bíblica, informe livro, capítulo e versículo quando souber com segurança.
- Diferencie claramente texto bíblico, interpretação e aplicação.
- Quando houver interpretações cristãs relevantes diferentes, apresente-as com respeito e equilíbrio.
- Não diga que possui fé, experiências pessoais ou opiniões pessoais.
- Não substitua aconselhamento médico, psicológico ou jurídico.

ESTUDO BÍBLICO
Quando o usuário pedir um estudo, use:

**Contexto**
Breve explicação.

**O que o texto ensina**
3 a 5 pontos principais.

**Referências bíblicas**
Somente referências relevantes e seguras.

**Aplicação prática**
2 a 4 aplicações objetivas.

**Resumo**
Conclusão curta.

MINISTRAÇÃO
Quando o usuário pedir uma ministração, use:

**Tema:**
**Texto base:**

**Introdução**
Breve introdução.

**1. Primeiro ponto**
Explicação e referências.

**2. Segundo ponto**
Explicação e referências.

**3. Terceiro ponto**
Explicação e referências.

**Aplicação**
Aplicações práticas.

**Conclusão**
Fechamento breve.

Não use mais de 4 pontos principais, salvo se o usuário pedir.

TEMAS BÍBLICOS
- Comece respondendo diretamente.
- Apresente 3 a 5 ensinamentos principais.
- Inclua referências bíblicas.
- Termine com uma aplicação ou resumo curto.

ORAÇÕES
- Crie uma oração natural, reverente e baseada em princípios bíblicos.
- Não invente citações como se fossem versículos.
- Não transforme a oração em uma explicação longa.

PASSAGENS ESPECÍFICAS
- Explique o contexto.
- Explique o sentido principal.
- Separe a aplicação prática.
- Não invente o texto literal do versículo se não tiver segurança.

FORMATAÇÃO
- Use Markdown simples.
- Use **títulos** e listas com -.
- Não use tabelas, salvo quando solicitado.
- Evite excesso de emojis.
- Não repita a pergunta do usuário.
`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { erro: "Método não permitido." },
      { status: 405, headers: corsHeaders },
    );
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json(
      {
        erro:
          "É necessário estar autenticado para usar o Assistente Bíblico.",
      },
      { status: 401, headers: corsHeaders },
    );
  }

  let body: { mensagem?: unknown };

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { erro: "Corpo da requisição inválido." },
      { status: 400, headers: corsHeaders },
    );
  }

  if (typeof body.mensagem !== "string" || !body.mensagem.trim()) {
    return Response.json(
      { erro: "Informe uma mensagem." },
      { status: 400, headers: corsHeaders },
    );
  }

  const texto = body.mensagem.trim();

  if (texto.length > 8000) {
    return Response.json(
      { erro: "A mensagem é muito longa. Tente resumir sua pergunta." },
      { status: 400, headers: corsHeaders },
    );
  }

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    console.error("[assistente-biblico] GEMINI_API_KEY não configurada.");

    return Response.json(
      { erro: "O Assistente Bíblico ainda não está configurado." },
      { status: 503, headers: corsHeaders },
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: texto }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1600,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "[assistente-biblico] erro Gemini:",
        response.status,
        data?.error?.message ?? "erro desconhecido",
      );

      return Response.json(
        {
          erro:
            "Não foi possível obter uma resposta do Assistente Bíblico.",
        },
        { status: 502, headers: corsHeaders },
      );
    }

    const resposta = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!resposta) {
      console.error(
        "[assistente-biblico] Gemini retornou resposta vazia.",
      );

      return Response.json(
        { erro: "O Gemini retornou uma resposta vazia." },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        sucesso: true,
        mensagem: resposta,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("[assistente-biblico] erro:", error);

    return Response.json(
      {
        erro:
          "Não foi possível responder agora. Tente novamente.",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
