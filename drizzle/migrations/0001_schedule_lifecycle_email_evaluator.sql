-- lovable-cron-fallback-reviewed: 144 runs/day; inactivity reminders need to arrive within ten minutes after the 30-minute eligibility window, and each run is bounded and idempotent.
SELECT cron.schedule(
  'send-lifecycle-emails-every-10-minutes',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sxcsbqglcmwbueztpvei.supabase.co/functions/v1/send-lifecycle-emails',
    headers := '{"Content-Type":"application/json","x-cron-secret":"FEAL9sUs16-Oam3Frim4sFOYJLlUPJ1yNdaiSiMBqTw"}'::jsonb,
    body := '{"dry_run":false}'::jsonb
  );
  $$
);