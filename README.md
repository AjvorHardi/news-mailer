# NEWS-MAILER

NEWS-MAILER is a portfolio SaaS MVP for managing newsletter subscribers, public signup forms, dynamic segments, campaign drafts, email sends, and delivery activity.

## Stack

- React, Vite, TypeScript, Tailwind CSS
- React Router
- TanStack Query
- React Hook Form and Zod
- Supabase Auth, Postgres, RLS, Edge Functions
- Resend
- TipTap

## Demo Walkthrough

Use `/demo` for a no-login recruiter walkthrough. Demo mode uses seeded localStorage data and never calls Supabase or Resend.

Suggested path:

1. Open `/demo`.
2. Review overview counts and reset behavior.
3. Add or edit a subscriber.
4. Create a signup form and inspect the live preview.
5. Build a segment and watch the match count update.
6. Create a campaign draft.
7. Send the demo campaign and review Activity.

## Authenticated App Walkthrough

Use `/app` for the real Supabase-backed workspace.

Suggested path:

1. Register or log in.
2. Create a newsletter.
3. Add subscribers and signup forms.
4. Open `/subscribe/:formSlug` in a logged-out browser and subscribe publicly.
5. Create a segment.
6. Create and send a campaign.
7. Review Activity as Resend webhooks update delivery status.

Email sending is portfolio-safe: real sends are restricted to the logged-in user's own email. Other recipients are snapshotted as failed/skipped so the activity flow can be reviewed without emailing arbitrary addresses.

## Local Development

```bash
npm install
npm run dev
```

Required browser env:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Password reset emails require Supabase Auth URL configuration to include the deployed reset route, for example `https://<your-domain>/reset-password`. Keep `http://localhost:5173/reset-password` allowed if you test recovery locally.

Supabase function setup and Resend secret notes are in `supabase/README.md`.

## Verification

```bash
npm run lint
npm run build
```

The production build currently reports a known chunk-size warning from the TipTap editor bundle.
