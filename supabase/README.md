# Supabase Functions

Supabase Edge Functions keep public writes, unsubscribe actions, and email sending out of the browser.

## Required Secrets

Set these in the linked Supabase project before testing real sends:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set RESEND_FROM_EMAIL="NEWS-MAILER <onboarding@resend.dev>"
supabase secrets set APP_ORIGIN="http://localhost:5173"
```

Use a verified Resend sender when moving beyond local portfolio testing.

## Deploy

```bash
supabase functions deploy unsubscribe
supabase functions deploy send-campaign
supabase functions deploy get-public-form
supabase functions deploy public-subscribe
```

## Safety Rules

- Demo mode still uses local simulated sends only.
- App mode sends through `send-campaign`.
- `send-campaign` verifies the authenticated user and newsletter ownership server-side.
- Real sends are restricted to the logged-in user's own email for portfolio safety.
- Other resolved recipients are snapshotted as failed with a safety message.
- Every accepted email includes an `/unsubscribe/:token` link.
- Public subscribe uses Edge Functions instead of anonymous table selects/inserts.
- `get-public-form` exposes only safe active form copy and color fields.
- `public-subscribe` creates or resubscribes a subscriber by normalized email and records `source_form_id`.
- Delivery webhooks are not implemented in this phase.

## Public Subscribe Checks

- Create an active signup form in the app.
- Open `/subscribe/:formSlug` in a logged-out browser.
- Submit a new email and confirm it appears under subscribers.
- Submit the same email again and confirm no duplicate row is created.
- Unsubscribe that email, submit it again, and confirm it becomes subscribed.
- Deactivate the form and confirm the public route shows an unavailable state.
