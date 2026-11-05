-- Devolve uma reserva quando a geração da IA falha.
-- A atualização é atômica e não permite contagem negativa.
CREATE OR REPLACE FUNCTION public.liberar_quota_assistente(
    p_user_id uuid,
    p_dia date
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_contagem integer;
BEGIN
    IF p_user_id IS NULL OR p_dia IS NULL THEN
        RAISE EXCEPTION 'Parâmetros inválidos para liberação de quota';
    END IF;

    UPDATE public.assistente_uso
       SET contagem = contagem - 1
     WHERE user_id = p_user_id
       AND dia = p_dia
       AND contagem > 0
    RETURNING contagem INTO v_contagem;

    RETURN v_contagem;
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION
    public.liberar_quota_assistente(uuid, date)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.liberar_quota_assistente(uuid, date)
    TO service_role;
