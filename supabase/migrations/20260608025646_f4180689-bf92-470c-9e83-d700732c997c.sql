
-- Allow authenticated users to claim an unowned scan (set user_id to themselves)
GRANT UPDATE ON public.scans TO authenticated;

CREATE POLICY "Authenticated users can claim unowned scans"
ON public.scans
FOR UPDATE
TO authenticated
USING (user_id IS NULL)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scans"
ON public.scans
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
