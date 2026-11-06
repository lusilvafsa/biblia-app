-- O cache compartilhado foi removido do fluxo do assistente.
-- Bloqueia leitura e escrita direta por clientes públicos/autenticados.
REVOKE ALL PRIVILEGES ON TABLE public.assistente_cache_publico
    FROM anon, authenticated;

DROP POLICY IF EXISTS "Leitura publica do cache do assistente"
    ON public.assistente_cache_publico;
