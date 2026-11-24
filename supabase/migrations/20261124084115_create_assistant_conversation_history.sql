-- Historico de conversas do Assistente Biblico.
-- Cada conversa e cada mensagem pertencem a um usuario autenticado.
-- O RLS impede acesso cruzado entre contas.

CREATE TABLE public.assistente_conversas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo text NOT NULL DEFAULT 'Nova conversa',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assistente_conversas_titulo_valido
        CHECK (length(btrim(titulo)) BETWEEN 1 AND 120),

    -- Necessario para a chave estrangeira composta das mensagens.
    CONSTRAINT assistente_conversas_usuario_id_unique
        UNIQUE (user_id, id)
);

CREATE TABLE public.assistente_mensagens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id uuid NOT NULL,
    user_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL,
    conteudo text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assistente_mensagens_role_valido
        CHECK (role IN ('user', 'assistant')),

    CONSTRAINT assistente_mensagens_conteudo_valido
        CHECK (length(btrim(conteudo)) BETWEEN 1 AND 20000),

    -- Garante que a mensagem e a conversa pertencam ao mesmo usuario.
    CONSTRAINT assistente_mensagens_conversa_usuario_fkey
        FOREIGN KEY (user_id, conversa_id)
        REFERENCES public.assistente_conversas(user_id, id)
        ON DELETE CASCADE
);

-- Lista conversas recentes de cada usuario.
CREATE INDEX assistente_conversas_usuario_atualizacao_idx
    ON public.assistente_conversas (user_id, updated_at DESC);

-- Recupera mensagens de uma conversa na ordem cronologica.
CREATE INDEX assistente_mensagens_conversa_ordem_idx
    ON public.assistente_mensagens (user_id, conversa_id, created_at, id);

-- Protecao por linha.
ALTER TABLE public.assistente_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistente_mensagens ENABLE ROW LEVEL SECURITY;

-- Conversas: cada usuario acessa somente as proprias.
CREATE POLICY assistente_conversas_select_own
    ON public.assistente_conversas
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY assistente_conversas_insert_own
    ON public.assistente_conversas
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY assistente_conversas_update_own
    ON public.assistente_conversas
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY assistente_conversas_delete_own
    ON public.assistente_conversas
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- Mensagens: o usuario precisa ser dono da conversa correspondente.
CREATE POLICY assistente_mensagens_select_own
    ON public.assistente_mensagens
    FOR SELECT TO authenticated
    USING (
        (select auth.uid()) = user_id
        AND EXISTS (
            SELECT 1
            FROM public.assistente_conversas c
            WHERE c.id = conversa_id
              AND c.user_id = (select auth.uid())
        )
    );

CREATE POLICY assistente_mensagens_insert_own
    ON public.assistente_mensagens
    FOR INSERT TO authenticated
    WITH CHECK (
        (select auth.uid()) = user_id
        AND EXISTS (
            SELECT 1
            FROM public.assistente_conversas c
            WHERE c.id = conversa_id
              AND c.user_id = (select auth.uid())
        )
    );

CREATE POLICY assistente_mensagens_delete_own
    ON public.assistente_mensagens
    FOR DELETE TO authenticated
    USING (
        (select auth.uid()) = user_id
        AND EXISTS (
            SELECT 1
            FROM public.assistente_conversas c
            WHERE c.id = conversa_id
              AND c.user_id = (select auth.uid())
        )
    );

-- Clientes autenticados podem operar somente conforme as policies acima.
REVOKE ALL PRIVILEGES
    ON TABLE public.assistente_conversas, public.assistente_mensagens
    FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.assistente_conversas
    TO authenticated;

GRANT SELECT, INSERT, DELETE
    ON TABLE public.assistente_mensagens
    TO authenticated;
