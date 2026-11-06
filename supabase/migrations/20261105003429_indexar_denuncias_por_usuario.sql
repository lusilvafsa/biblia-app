-- Índice de suporte à FK de assistente_denuncias.user_id.
-- Evita varredura completa ao excluir usuário (ON DELETE CASCADE).
CREATE INDEX IF NOT EXISTS idx_assistente_denuncias_user_id
    ON public.assistente_denuncias (user_id);
