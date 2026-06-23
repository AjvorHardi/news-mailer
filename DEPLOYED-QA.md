# Deployed QA Checklist

Use this checklist for the deployed portfolio build at:

```text
https://news-mailer-demo.vercel.app
```

## Environment

- Vercel has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Supabase Auth redirect URLs include:
  - `https://news-mailer-demo.vercel.app/app`
  - `https://news-mailer-demo.vercel.app/reset-password`
- Supabase Edge Function secrets include:
  - `APP_ORIGIN=https://news-mailer-demo.vercel.app`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `RESEND_WEBHOOK_SECRET`
- `send-campaign` has been redeployed after campaign email function changes.
- `resend-webhook` is deployed with `--no-verify-jwt`.

## Public Smoke Test

- Open `/`, `/demo`, `/login`, `/register`, and `/forgot-password` directly.
- Refresh each route and confirm Vercel does not return a 404.
- Confirm auth pages do not show the Supabase configuration warning.
- Check one mobile-width viewport for obvious text overflow or broken navigation.

## Demo Mode

- Open `/demo` without logging in.
- Confirm the sidebar footer says `DEMO WORKSPACE`.
- Reset demo data and confirm seeded counts return.
- Create/edit/delete a subscriber.
- Create/edit/toggle/delete a signup form.
- Create/edit/delete a segment and verify match count changes.
- Create/edit/send a campaign.
- Confirm Activity explains simulated sends, not real sends.
- Use `Exit demo` and confirm it returns to the homepage.

## Auth

- Register with a fresh email.
- Confirm the check-email state appears.
- Open the confirmation email and confirm it lands on `/app`.
- Log out, open `/app`, and confirm it redirects to `/login`.
- Log in and refresh `/app`; the session should persist.
- Request a password reset from `/forgot-password`.
- Open the reset email and confirm it lands on `/reset-password`.
- Set a new password, then confirm login works with the new password.

## Workspace Data

- Create a newsletter.
- Use `Back to newsletters` and reopen the newsletter.
- Add a subscriber with the same email as the logged-in account.
- Add at least one more subscriber with a different email.
- Confirm duplicate subscriber emails are handled clearly.
- Create a signup form and open `/subscribe/:formSlug` in a logged-out browser.
- Submit a public subscriber and confirm it appears in the app.
- Deactivate the form and confirm the public route shows an unavailable state.

## Campaign Send And Activity

- Set a distinct newsletter sender name in Settings.
- Create a campaign targeting all subscribed subscribers.
- Send it.
- Confirm the send result says the login email received the real email and other recipients were skipped for testing.
- Confirm the received email display name matches the newsletter sender name.
- Confirm the sender address still uses the configured Resend sender address.
- Open Activity and confirm app mode explains real sends go only to the login email.
- Confirm skipped recipients are listed with a clear failure reason.
- Click the email unsubscribe link and confirm it uses `news-mailer-demo.vercel.app`.
- Confirm unsubscribe marks the subscriber unsubscribed in the app.

## Webhook Check

- In Resend, confirm the webhook endpoint points to:

```text
https://<project-ref>.supabase.co/functions/v1/resend-webhook
```

- Confirm delivery/bounce/failure events are selected.
- After a campaign send, wait for delivery events and refresh Activity.
- Confirm `webhook_events` stores the raw event and recipient status updates when Resend sends a supported event.
