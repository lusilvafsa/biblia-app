-- Otimiza as policies RLS: avalia auth.uid() uma vez por statement,
-- preservando exatamente as condições de propriedade por usuário.

ALTER POLICY "Users can delete own reading progress"
    ON public.reading_progress
    USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can insert own reading progress"
    ON public.reading_progress
    WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can update own reading progress"
    ON public.reading_progress
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can view own reading progress"
    ON public.reading_progress
    USING ((select auth.uid()) = user_id);

ALTER POLICY "Usuario apaga seus proprios grifos"
    ON public.user_highlights
    USING ((select auth.uid()) = user_id);

ALTER POLICY "Usuario atualiza seus proprios grifos"
    ON public.user_highlights
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Usuario grava seus proprios grifos"
    ON public.user_highlights
    WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Usuario le seus proprios grifos"
    ON public.user_highlights
    USING ((select auth.uid()) = user_id);

ALTER POLICY "Usuario atualiza seu proprio progresso"
    ON public.user_plan_progress
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Usuario grava seu proprio progresso"
    ON public.user_plan_progress
    WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Usuario le seu proprio progresso"
    ON public.user_plan_progress
    USING ((select auth.uid()) = user_id);

ALTER POLICY "denuncias_inserir_proprias"
    ON public.assistente_denuncias
    WITH CHECK ((select auth.uid()) = user_id);
