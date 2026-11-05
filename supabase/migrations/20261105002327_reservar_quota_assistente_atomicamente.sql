-- Reserva atômica da quota diária do Assistente Bíblico.
-- Usa a PK existente (user_id, dia); não cria nem altera tabelas.

CREATE OR REPLACE FUNCTION public.reservar_quota_assistente(
    p_user_id uuid,
    p_dia date,
    p_limite integer
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_contagem integer;
BEGIN
    IF p_user_id IS NULL OR p_dia IS NULL
       OR p_limite IS NULL OR p_limite <= 0 THEN
        RAISE EXCEPTION 'Parâmetros inválidos para reserva de quota';
    END IF;

    INSERT INTO public.assistente_uso (user_id, dia, contagem)
    VALUES (p_user_id, p_dia, 1)
    ON CONFLICT (user_id, dia)
    DO UPDATE
       SET contagem = public.assistente_uso.contagem + 1
     WHERE public.assistente_uso.contagem < p_limite
    RETURNING contagem INTO v_contagem;

    -- NULL significa que a linha já atingiu o limite.
    RETURN v_contagem;
END;
$function$;

REVOKE ALL PRIVILEGES ON TABLE public.assistente_uso
    FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION
    public.reservar_quota_assistente(uuid, date, integer)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.reservar_quota_assistente(uuid, date, integer)
    TO service_role;
