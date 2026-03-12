CREATE POLICY "Users can update own acceptance"
ON public.eula_acceptances
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);