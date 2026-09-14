# Include sales outreach as potential customers

## What will change
- Expand the Hostinger inbox import so genuine people pitching services can join the daily outcome-email audience.
- Keep automated senders, system mailboxes, suppressed contacts, and unsubscribed contacts excluded.
- Recognize sales outreach from message content rather than adding every unknown sender.
- Deploy the updated importer and verify the protected daily sync still runs successfully.

## Technical details
- Add conservative sales-intent checks for common service-pitch language in recent inbox messages.
- Treat a sender as eligible when they are already a customer/lead or their email contains clear sales intent.
- Preserve the existing duplicate handling, suppression checks, and unsubscribe protections.
