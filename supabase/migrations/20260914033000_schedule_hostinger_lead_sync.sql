-- Refresh the mailing audience from recent Hostinger inbox activity before
-- the 09:00 EST Daily Growth Brief. The function itself admits only known
-- customers/leads and rejects suppressed, unsubscribed, or automated senders.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'sync-hostinger-leads-daily';

SELECT cron.schedule(
  'sync-hostinger-leads-daily',
  '45 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sxcsbqglcmwbueztpvei.supabase.co/functions/v1/sync-hostinger-leads',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_resend_cron_key' LIMIT 1)
    ),
    body := '{"days":2}'::jsonb
  );
  $$
);
