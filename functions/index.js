const {setGlobalOptions} = require("firebase-functions");
const {https} = require("firebase-functions");
const {defineSecret} = require("firebase-functions/params");
const {GoogleGenAI} = require("@google/genai");

setGlobalOptions({
  maxInstances: 10,
});

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const SYSTEM_INSTRUCTION = `
Você é o Assistente Bíblico do aplicativo Bíblia de Estudo.

Sua função é ajudar o usuário a estudar a Bíblia com clareza,
respeito, equilíbrio e profundidade.

Regras:
- Responda sempre em português do Brasil.
- Seja fiel ao contexto bíblico.
- Não invente versículos, referências ou citações.
- Quando mencionar uma passagem, informe livro, capítulo e versículo
  quando essa informação estiver disponível.
- Diferencie claramente o texto bíblico de interpretação, aplicação
  e opinião.
- Quando houver diferentes interpretações cristãs relevantes,
  apresente-as com respeito, sem afirmar que uma interpretação
  secundária é consenso.
- Não substitua aconselhamento médico, psicológico ou jurídico
  quando a pergunta envolver essas áreas.
- Seja acolhedor, mas não manipule emocionalmente o usuário.
- Para perguntas simples, responda de forma objetiva.
- Para estudos bíblicos, explique o contexto e organize a resposta
  em seções quando isso ajudar.
- Não diga que possui experiências pessoais ou fé pessoal.
`;

exports.assistenteBiblico = https.onCall(
    {
      secrets: [GEMINI_API_KEY],
    },
    async (request) => {
      if (!request.auth) {
        throw new https.HttpsError(
            "unauthenticated",
            "É necessário estar autenticado para usar o Assistente Bíblico.",
        );
      }

      const mensagem = request.data && request.data.mensagem;

      if (typeof mensagem !== "string" || !mensagem.trim()) {
        throw new https.HttpsError(
            "invalid-argument",
            "Informe uma mensagem.",
        );
      }

      const texto = mensagem.trim();

      if (texto.length > 8000) {
        throw new https.HttpsError(
            "invalid-argument",
            "A mensagem é muito longa. Tente resumir sua pergunta.",
        );
      }

      try {
        const ai = new GoogleGenAI({
          apiKey: GEMINI_API_KEY.value(),
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: texto,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 2000,
          },
        });

        const resposta = response.text;

        if (!resposta || !resposta.trim()) {
          throw new Error("O Gemini retornou uma resposta vazia.");
        }

        return {
          sucesso: true,
          mensagem: resposta.trim(),
        };
      } catch (error) {
        console.error("[assistenteBiblico] erro Gemini:", error);

        throw new https.HttpsError(
            "internal",
            "Não foi possível obter uma resposta do Assistente Bíblico.",
        );
      }
    },
);
