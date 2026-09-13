const {setGlobalOptions} = require("firebase-functions");
const {https} = require("firebase-functions");
const {defineSecret} = require("firebase-functions/params");

setGlobalOptions({
  maxInstances: 10,
});

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.assistenteBiblico = https.onCall(
    {
      secrets: [OPENAI_API_KEY],
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

      return {
        sucesso: true,
        mensagem:
        "Backend do Assistente Bíblico conectado. " +
        "A integração com a IA será ativada no próximo passo.",
      };
    },
);
