# AGENTS.md

## Project

This repo contains NEWS-MAILER, a portfolio SaaS MVP for creating newsletters, managing subscribers, building public signup forms, creating dynamic audience segments, writing campaigns, and sending emails through Resend.

The app should feel like a real, polished SaaS product, not a toy demo.

Primary stack:

* React
* Vite
* TypeScript
* Tailwind CSS
* React Router
* TanStack Query
* React Hook Form
* Zod
* Supabase Auth
* Supabase Postgres
* Supabase RLS
* Supabase Edge Functions or server-side API functions
* Resend
* TipTap

## Working Rules

Before making changes:

* Read the relevant existing files first.
* Inspect `package.json` before assuming dependencies or scripts.
* Follow the existing repo structure unless there is a clear reason to change it.
* Prefer small, reviewable changes over large rewrites.
* Do not install new packages unless the task explicitly asks for it or you explain why it is necessary.
* Do not commit changes unless explicitly asked.
* Do not introduce unrelated refactors.
* Do not leave dead code, unused files, unused imports, or commented-out experiments.

When the user asks for a plan:

* Do not create, edit, delete, move, or rename files.
* Do not run migrations.
* Do not install packages.
* Return the plan only.

When implementing:

* State the intended approach before making major changes.
* Keep implementation aligned with the requested phase or task.
* At the end, summarize changed files and verification performed.
* If verification cannot be run, explain why.

## Product Priorities

Optimize for:

1. Portfolio polish
2. Realistic SaaS architecture
3. Recruiter-friendly demo experience
4. Security around auth, RLS, email sending, and secrets
5. Maintainable code that is easy to explain in interviews

Avoid:

* Over-engineering
* Fake complexity
* Huge all-at-once implementations
* Client-side access to secrets
* Demo code that can accidentally send real emails
* Arbitrary SQL or unsafe dynamic query generation

## Design Rules

Visual style:

* Monochrome only: black, white, neutral grays.
* Red only for destructive actions.
* Clean, document-like interface.
* Minimal, professional, SaaS-like.
* Avoid colorful dashboard clutter.

Tailwind/className rules:

* Use normal string `className` values for static classes.
* Use `clsx` only when a className has conditions, variants, or multiple optional classes.
* Prefer readable class strings over clever abstraction.
* Keep components accessible: labels, focus states, keyboard navigation, semantic HTML.

## Frontend Architecture

Prefer a feature-first structure.

Recommended direction:

* `src/app` for app providers, router setup, and global app shell.
* `src/features` for product features such as auth, newsletters, subscribers, forms, segments, campaigns, activity, demo.
* `src/shared` for reusable UI, utilities, hooks, types, and cross-feature helpers.
* `src/lib` for configured clients and low-level integrations.
* `src/pages` only if the existing repo already uses page-based organization, otherwise prefer route modules inside features.

Guidelines:

* Keep business logic out of presentational components.
* Keep Supabase calls in repository/service-style modules, not scattered through UI components.
* Use TanStack Query for server state.
* Use local React state for local UI state.
* Do not add global state libraries unless clearly justified.
* Use React Hook Form + Zod for meaningful forms.
* Co-locate schemas near the feature that owns the form/data.
* Prefer explicit types over inferred mystery shapes.
* Avoid `any` unless there is no reasonable alternative, and explain why.

## Demo Mode Rules

Demo mode is a first-class product feature.

Requirements:

* Route: `/demo`
* No login required.
* Uses seeded demo data.
* Persists demo changes in localStorage.
* Has a reset demo data action.
* Allows realistic interactions with subscribers, forms, segments, campaigns, and simulated sends.
* Never sends real emails.
* Never requires Supabase Auth.
* Never calls Resend.
* Should share UI with the authenticated app where practical.

Architecture preference:

* Use a data-access abstraction so real mode can use Supabase-backed services and demo mode can use localStorage-backed services.
* Avoid duplicating entire screens just for demo mode.
* Demo-specific behavior should be isolated and obvious.

## Auth and Security Rules

Authentication:

* Use Supabase Auth with email/password.
* Sessions should persist.
* Protected app routes require a logged-in user.
* Public subscribe/unsubscribe routes must not require login.

Database/security:

* Use Supabase RLS for user-scoped data.
* Users may only access newsletters they own and related child records.
* Ownership should flow from `newsletters.user_id` to child tables.
* Public signup forms must not expose private newsletter data.
* Public inserts should go through a safe server function, RPC, or tightly constrained public policy.

Secrets:

* Never expose Resend API keys to the browser.
* Never expose service-role keys to the browser.
* Use server-side functions for email sending and webhook handling.
* Keep `.env` files out of version control.

Email safety:

* Real campaign sending must be restricted to the logged-in user’s own email or allowlisted test recipients.
* Demo mode must simulate sending only.
* Every real campaign email must include an unsubscribe URL.
* Unsubscribed subscribers must be excluded from future sends.
* Campaign recipients should be snapshotted at send time for accurate historical activity.
* Store provider message IDs for delivery updates.
* Resend webhook handling should be limited to delivery, bounce, and failure status updates for MVP.

Segments:

* Store segment rules as JSON.
* Only allow safe, predefined fields and operators.
* Do not generate arbitrary SQL from user input.
* Segment matching should be deterministic and explainable.

TipTap/campaign content:

* Treat rich text HTML as untrusted input.
* Sanitize or strictly control rendered/sent HTML.
* Do not allow unsafe scripts or arbitrary embedded content.

## Database Expectations

Likely core tables:

* `profiles`
* `newsletters`
* `subscribers`
* `signup_forms`
* `segments`
* `campaigns`
* `campaign_recipients` or `campaign_deliveries`
* `allowed_test_recipients`
* `webhook_events`

Important data rules:

* A subscriber belongs to one newsletter.
* Subscriber email is unique per newsletter.
* A subscriber may have `source_form_id`.
* Campaigns can target all subscribed subscribers or one saved dynamic segment.
* Campaign delivery/activity should remain accurate even if subscriber data later changes.

## Server/API Function Boundaries

Server-side boundaries should be explicit.

Likely functions:

* Public subscribe
* Public unsubscribe
* Send campaign
* Resend webhook handler

Function rules:

* Send campaign requires authenticated user.
* Send campaign verifies newsletter ownership server-side.
* Send campaign resolves recipients server-side.
* Send campaign enforces portfolio safety allowlist.
* Public subscribe must only expose the minimum needed data.
* Public unsubscribe should use an opaque token.
* Webhook handler should verify authenticity if supported and store raw event metadata for debugging/idempotency.

## Code Quality

General:

* Prefer simple, readable code.
* Use strict TypeScript.
* Keep functions small and named clearly.
* Avoid clever abstractions until repetition proves they are needed.
* Prefer boring code that is easy to debug.
* Do not hide important logic in overly generic helpers.

React:

* Keep components focused.
* Prefer composition over prop explosion.
* Avoid unnecessary memoization.
* Avoid useEffect for derived state.
* Use TanStack Query mutations and invalidation for server updates.
* Handle loading, empty, error, and success states.

Forms:

* Use React Hook Form + Zod for forms with validation.
* Show useful validation messages.
* Keep validation rules consistent between UI and server where possible.

Accessibility:

* Use semantic HTML.
* Inputs need labels.
* Buttons need clear text or accessible labels.
* Dialogs/sheets/popovers should be keyboard-friendly.
* Do not rely on color alone to communicate state.

## Verification

Prefer running available checks before finishing implementation:

* Typecheck
* Lint
* Tests, if present
* Build

Use the scripts that actually exist in `package.json`.

If a check fails:

* Fix failures caused by the current task.
* Do not hide unrelated pre-existing failures.
* Report unrelated failures clearly.

If checks cannot be run:

* Explain what was skipped and why.

## Communication Style

In final responses:

* Be concise.
* Mention what changed.
* Mention files changed.
* Mention verification run.
* Mention any risks, follow-ups, or decisions needed.

Do not claim something works unless it was implemented and verified.

## Git Rules

### General Rules

* Never commit directly to `main`.
* Never merge into `main`.
* Never push unless explicitly instructed.
* Never create a pull request unless explicitly instructed.
* Pull requests are for the user to review before merging.
* Do not commit during planning-only tasks.
* Do not run Git commands that discard, overwrite, reset, stash, or remove user work unless explicitly instructed.
* Before making changes, check the current branch and working tree status.
* If there are existing uncommitted changes that are unrelated to the current task, stop and ask before continuing.
* Keep changes small and reviewable.
* Do not mix unrelated changes in one branch or commit.

### Branch Rules

For implementation work, create a feature branch before making changes.

* Branch from `main`.
* Make sure `main` is up to date when possible.
* If updating `main` requires network access or could affect local work, ask first.
* One branch should map to one feature, phase, fix, or meaningful refactor.
* Use small, reviewable branches.

Create a new branch for:

* each feature
* each app phase
* each meaningful fix
* each refactor that touches multiple files

Do not create a new branch for:

* tiny follow-up fixes on the same feature branch
* docs updates related to the current branch
* styling polish related to the current feature branch

If unsure whether to create a new branch, ask first.

### Branch Naming

Use lowercase kebab-case.

Examples:

* `setup/project-scaffold`
* `feature/auth-flow`
* `feature/demo-mode`
* `feature/newsletter-crud`
* `feature/subscribers`
* `feature/forms-builder`
* `feature/segments`
* `feature/campaign-editor`
* `feature/email-sending`
* `fix/auth-session-persistence`
* `chore/update-dependencies`
* `docs/architecture-plan`

### Commit Rules

Codex may make local commits only during implementation work.

* Commit after meaningful, working milestones.
* Prefer fewer clean commits over many noisy commits.
* Do not commit broken code.
* Do not commit unrelated changes.
* Do not commit secrets, `.env` files, API keys, service-role keys, or generated build output.
* Before committing, inspect the diff.
* Before committing, run available checks using scripts that exist in `package.json`.

Required checks before each commit:

* Run `npm run lint` if available.
* Run `npm run build` if available.
* Run `npm run typecheck` if available.
* Run relevant tests if available.

If checks fail:

* Fix issues caused by the current task before committing.
* Do not commit failing work unless explicitly instructed.
* If failures appear unrelated or pre-existing, report them clearly and ask how to proceed.

### Commit Messages

Use Conventional Commits.

Format:

```text
type: short imperative summary
```

Allowed types:

* `feat`
* `fix`
* `docs`
* `style`
* `refactor`
* `test`
* `chore`

Good examples:

* `chore: scaffold Vite React app`
* `docs: add architecture plan`
* `feat: add app layout shell`
* `feat: add demo mode data store`
* `feat: add subscriber management`
* `fix: preserve auth session on refresh`
* `refactor: split newsletter routes`
* `style: polish dashboard spacing`
* `test: add subscriber validation tests`

Bad examples:

* `added stuff`
* `changes`
* `fixed bugs`
* `WIP`