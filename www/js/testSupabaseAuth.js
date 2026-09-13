import { supabase } from "./supabaseClient.js";

const painel = document.createElement("div");

painel.style.cssText = `
  position: fixed;
  inset: 20px;
  z-index: 999999;
  background: #111;
  color: white;
  padding: 24px;
  border-radius: 16px;
  font-family: sans-serif;
  font-size: 18px;
  overflow: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,.5);
`;

painel.textContent = "🔄 Testando conexão com o Supabase...";
document.body.appendChild(painel);

try {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("[TESTE SUPABASE] Erro:", error);

    painel.innerHTML = `
      <h2>❌ Erro no Supabase</h2>
      <p>${String(error.message || error)}</p>
    `;
  } else {
    const usuario = data?.session?.user?.id || "nenhum";

    console.log(
      "[TESTE SUPABASE] Conexão OK. Usuário:",
      usuario
    );

    painel.innerHTML = `
      <h2>✅ Supabase conectado!</h2>
      <p><strong>Conexão:</strong> OK</p>
      <p><strong>Usuário:</strong> ${usuario}</p>
      <p style="margin-top:30px;font-size:14px;">
        Este é apenas um teste temporário.
      </p>
    `;
  }
} catch (error) {
  console.error("[TESTE SUPABASE] Exceção:", error);

  painel.innerHTML = `
    <h2>❌ Falha no teste</h2>
    <p>${String(error?.message || error)}</p>
  `;
}
