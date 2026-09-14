SELECT net.http_post(
  url := 'https://sxcsbqglcmwbueztpvei.supabase.co/functions/v1/sync-hostinger-leads',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_resend_cron_key' LIMIT 1)
  ),
  body := '{"days":2}'::jsonb
);