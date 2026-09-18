# Continue-where-you-left-off emails

## What will change
- Record the signed-in user and dashboard section with each meaningful activity, so the app can identify the last unfinished step accurately.
- Add a small lifecycle-email state store to prevent duplicate or excessive reminders.
- Add a protected scheduled function that waits 30 minutes after inactivity, checks what the user actually completed, and sends one relevant next-step email.
- Start with clear journeys: account created but no scan, scan finished but results not revisited, recommendations viewed but none started, and a started optimization that did not finish.
- Each email will name the real domain or scan when available, say where the user stopped, give one next action, and deep-link directly back to that section.

## Safety and delivery rules
- Never email suppressed or unsubscribed addresses.
- Cancel a reminder when the user completes the next step before delivery.
- Send no more than one reminder in 48 hours and no more than three lifecycle reminders in 30 days per person.
- Use idempotent message IDs and the existing reliable email queue so retries cannot create duplicates.
- Keep these emails factual: no invented progress, promises, or generic recommendations.

## Technical details
- Extend activity records with an authenticated user reference and useful page/domain/scan context.
- Create an RLS-protected lifecycle email state table with explicit backend grants.
- Schedule the evaluator every 10 minutes; a user becomes eligible after 30 minutes without relevant activity.
- Add dashboard activity events for section visits and recommendation actions where those signals already exist.
- Deploy and test the evaluator without sending duplicate messages to existing users.
