CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  VALUES (NEW.id, 'free', 'active', now(), now() + INTERVAL '1 month');

  -- Claim any guest scans captured with this email (server-side, no browser needed)
  BEGIN
    UPDATE public.scans s
    SET user_id = NEW.id
    WHERE s.user_id IS NULL
      AND s.id IN (
        SELECT c.scan_id FROM public.customers c
        WHERE lower(c.email) = lower(NEW.email)
          AND c.scan_id IS NOT NULL
      );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'scan claim failed for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;