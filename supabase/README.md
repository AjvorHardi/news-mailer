# Supabase Functions

Phase 11 adds Edge Functions for public unsubscribe and server-side campaign sending.

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
```

## Safety Rules

- Demo mode still uses local simulated sends only.
- App mode sends through `send-campaign`.
- `send-campaign` verifies the authenticated user and newsletter ownership server-side.
- Real sends are restricted to the logged-in user's own email for portfolio safety.
- Other resolved recipients are snapshotted as failed with a safety message.
- Every accepted email includes an `/unsubscribe/:token` link.
- Delivery webhooks are not implemented in this phase.
