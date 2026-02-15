ALTER TABLE plans ADD COLUMN suggested_prompts_limit integer NOT NULL DEFAULT 0;
UPDATE plans SET suggested_prompts_limit = 0 WHERE id = 'free';
UPDATE plans SET suggested_prompts_limit = 5 WHERE id = 'pro';
UPDATE plans SET suggested_prompts_limit = 10 WHERE id = 'team';
UPDATE plans SET suggested_prompts_limit = 20 WHERE id = 'agency';