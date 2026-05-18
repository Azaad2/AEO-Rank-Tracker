import type { User } from '@supabase/supabase-js';

export const ADMIN_EMAILS = ['hello@aimentionyou.com'];

export function isAdminUser(user: Pick<User, 'email'> | null | undefined): boolean {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
