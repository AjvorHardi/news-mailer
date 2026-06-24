# Architecture Summary

NEWS-MAILER is a React/Vite portfolio SaaS MVP with two operating modes: a public demo workspace and a Supabase-backed authenticated app.

## Frontend

- React Router owns public, demo, auth, and protected app routes.
- TanStack Query handles server state and repository-backed workspace data.
- React Hook Form and Zod handle forms and validation.
- TipTap powers campaign body editing.
- Tailwind CSS provides the monochrome SaaS UI.

## Demo Mode

Demo mode is available at `/demo` without authentication. It uses seeded localStorage data through the same repository contracts used by the app workspace, which keeps the UI realistic while preventing calls to Supabase or Resend.

Demo sends are simulated only. They create local recipient snapshots and delivery states so the Activity workflow can be reviewed safely.

## Authenticated App

The app workspace is available under `/app` and requires Supabase Auth. Authenticated users can create newsletters, manage subscribers and signup forms, build dynamic segments, draft campaigns, send portfolio-safe campaigns, and review delivery activity.

Newsletter ownership is enforced by Supabase RLS. Child records such as subscribers, forms, segments, campaigns, and campaign recipients are scoped through their newsletter.

## Server Boundaries

Supabase Edge Functions keep sensitive operations out of the browser:

- `get-public-form`: exposes only safe public signup form fields.
- `public-subscribe`: handles public subscriber creation and resubscription.
- `unsubscribe`: marks a subscriber unsubscribed by opaque token.
- `send-campaign`: verifies ownership, resolves recipients, snapshots delivery rows, sends through Resend, and adds unsubscribe links.
- `resend-webhook`: verifies Resend webhook signatures and updates delivery status.

Secrets such as Resend API keys and service-role access are never exposed to the frontend.

## Email Safety

Real campaign sends are intentionally restricted for the portfolio environment. Only the logged-in user's own email receives a real message. Other resolved recipients are snapshotted as skipped/failed so the Activity workflow can still be reviewed without emailing arbitrary addresses.

The sender display name comes from newsletter settings, while the sender address remains the verified `RESEND_FROM_EMAIL` value configured in Supabase secrets.

Every accepted campaign email includes an unsubscribe URL based on `APP_ORIGIN`.

## Deployment

- Vercel hosts the Vite frontend.
- `vercel.json` rewrites unmatched paths to `index.html` so React Router deep links work.
- Supabase hosts Auth, Postgres, RLS, and Edge Functions.
- Resend handles campaign delivery and webhook events.

Current deployed URL:

```text
https://news-mailer-demo.vercel.app
```
