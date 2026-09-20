path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    linhas = f.readlines()

def bloco(texto):
    return [l + '\n' for l in texto.strip('\n').split('\n')]

# --- Edição 3 (mais abaixo): remover a linha onNarrate (linha 767) ---
if linhas[766] != "      onNarrate: handleNarrateSelection,\n":
    raise SystemExit(f"ERRO: linha 767 inesperada: {linhas[766]!r}")
del linhas[766:767]

# --- Edição 2: handleExplainSelection + remover handleNarrateSelection (linhas 675-687) ---
if linhas[674] != "    function handleExplainSelection(text) {\n":
    raise SystemExit(f"ERRO: linha 675 inesperada: {linhas[674]!r}")
if linhas[686] != "\n":
    raise SystemExit(f"ERRO: linha 687 inesperada (deveria ser em branco): {linhas[686]!r}")

novo_explicar = bloco("""    function escaparHtmlSelecao(texto) {
      return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function formatarRespostaSelecao(texto) {
      return String(texto || '')
        .split(/\\r?\\n/)
        .filter((linha) => linha.trim().length > 0)
        .map((linha) => {
          const escapada = escaparHtmlSelecao(linha.trim()).replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
          return `<p>${escapada}</p>`;
        })
        .join('');
    }

    async function showQuickAiExplanation(text) {
      const overlay = document.createElement('div');
      overlay.className = 'verse-explain-overlay';
      overlay.innerHTML = `
        <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Explicação">
          <div class="verse-explain-handle"></div>
          <button class="verse-explain-close" aria-label="Fechar">${icons.close}</button>
          <div class="verse-explain-ref">✨ Explicação</div>
          <blockquote class="verse-explain-text">"${text}"</blockquote>
          <div id="quickAiResult"><p>Consultando o Assistente Bíblico...</p></div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
      overlay.querySelector('.verse-explain-close').addEventListener('click', () => overlay.remove());

      const resultEl = overlay.querySelector('#quickAiResult');
      const usuario = usuarioAtual();

      if (!usuario) {
        resultEl.innerHTML = '<p>Entre na sua conta para usar o Assistente Bíblico.</p>';
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: { mensagem: `Explique este trecho da Bíblia: "${text}"` },
        });

        if (error || !data?.sucesso || !data?.mensagem) {
          throw new Error(data?.erro || error?.message || 'Sem resposta.');
        }

        resultEl.innerHTML = formatarRespostaSelecao(data.mensagem);
      } catch (_e) {
        resultEl.innerHTML = '<p>Não foi possível obter a explicação agora. Tente novamente.</p>';
      }
    }

    function handleExplainSelection(text) {
      showQuickAiExplanation(text);
    }

""")
linhas[674:687] = novo_explicar

# --- Edição 1: novos imports após a linha 29 ---
if linhas[28] != "import { openExternalExplanation } from '../../utils/externalExplain.js';\n":
    raise SystemExit(f"ERRO: linha 29 inesperada: {linhas[28]!r}")
linhas[29:29] = bloco("""import { supabase } from '../../supabaseClient.js';
import { usuarioAtual } from '../../supabaseAuth.js';""")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(linhas)

print("reader.js atualizado com sucesso")
