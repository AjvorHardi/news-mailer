create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  selected_plan text,
  subscriber_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.newsletters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  sender_name text not null,
  from_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signup_forms (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  internal_name text not null,
  slug text not null,
  heading text not null,
  button_text text not null,
  success_message text not null,
  background_color text not null,
  text_color text not null,
  button_color text not null,
  button_text_color text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, newsletter_id),
  unique (slug),
  check (slug ~ '^[a-z0-9-]+$')
);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  email text not null,
  email_normalized text not null,
  name text,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  source_form_id uuid,
  unsubscribe_token text not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unique (id, newsletter_id),
  unique (newsletter_id, email_normalized),
  unique (unsubscribe_token),
  foreign key (source_form_id, newsletter_id) references public.signup_forms(id, newsletter_id)
);

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  name text not null,
  rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, newsletter_id),
  check (jsonb_typeof(rules) = 'array')
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  subject text not null,
  body_json jsonb,
  body_html text,
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  audience_type text not null default 'all_subscribed' check (audience_type in ('all_subscribed', 'segment')),
  segment_id uuid,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, newsletter_id),
  foreign key (segment_id, newsletter_id) references public.segments(id, newsletter_id)
);

create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  subscriber_id uuid,
  email text not null,
  email_normalized text not null,
  name text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  provider_message_id text,
  failure_reason text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (campaign_id, newsletter_id) references public.campaigns(id, newsletter_id) on delete cascade,
  foreign key (subscriber_id, newsletter_id) references public.subscribers(id, newsletter_id)
);

create table public.allowed_test_recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  email_normalized text not null,
  created_at timestamptz not null default now(),
  unique (user_id, email_normalized)
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index newsletters_user_id_idx on public.newsletters(user_id);
create index signup_forms_newsletter_id_idx on public.signup_forms(newsletter_id);
create index signup_forms_slug_idx on public.signup_forms(slug);
create index subscribers_newsletter_id_idx on public.subscribers(newsletter_id);
create index subscribers_source_form_id_idx on public.subscribers(source_form_id);
create index segments_newsletter_id_idx on public.segments(newsletter_id);
create index campaigns_newsletter_id_idx on public.campaigns(newsletter_id);
create index campaigns_segment_id_idx on public.campaigns(segment_id);
create index campaign_recipients_campaign_id_idx on public.campaign_recipients(campaign_id);
create index campaign_recipients_newsletter_id_idx on public.campaign_recipients(newsletter_id);
create index allowed_test_recipients_user_id_idx on public.allowed_test_recipients(user_id);

create or replace function public.clear_deleted_signup_form_sources()
returns trigger
language plpgsql
as $$
begin
  update public.subscribers
  set source_form_id = null
  where source_form_id = old.id;
  return old;
end;
$$;

create or replace function public.clear_deleted_segment_campaign_targets()
returns trigger
language plpgsql
as $$
begin
  update public.campaigns
  set segment_id = null,
      audience_type = 'all_subscribed'
  where segment_id = old.id;
  return old;
end;
$$;

create or replace function public.clear_deleted_subscriber_recipient_links()
returns trigger
language plpgsql
as $$
begin
  update public.campaign_recipients
  set subscriber_id = null
  where subscriber_id = old.id;
  return old;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger newsletters_set_updated_at before update on public.newsletters
  for each row execute function public.set_updated_at();
create trigger signup_forms_set_updated_at before update on public.signup_forms
  for each row execute function public.set_updated_at();
create trigger subscribers_set_updated_at before update on public.subscribers
  for each row execute function public.set_updated_at();
create trigger segments_set_updated_at before update on public.segments
  for each row execute function public.set_updated_at();
create trigger campaigns_set_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();
create trigger signup_forms_clear_sources before delete on public.signup_forms
  for each row execute function public.clear_deleted_signup_form_sources();
create trigger segments_clear_campaign_targets before delete on public.segments
  for each row execute function public.clear_deleted_segment_campaign_targets();
create trigger subscribers_clear_recipient_links before delete on public.subscribers
  for each row execute function public.clear_deleted_subscriber_recipient_links();

alter table public.profiles enable row level security;
alter table public.newsletters enable row level security;
alter table public.signup_forms enable row level security;
alter table public.subscribers enable row level security;
alter table public.segments enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.allowed_test_recipients enable row level security;
alter table public.webhook_events enable row level security;

create policy "profiles are user scoped" on public.profiles
  for all using (id = auth.uid())
  with check (id = auth.uid());

create policy "newsletters are user scoped" on public.newsletters
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "signup forms follow newsletter ownership" on public.signup_forms
  for all using (
    exists (
      select 1 from public.newsletters
      where newsletters.id = signup_forms.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.newsletters
      where newsletters.id = signup_forms.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  );

create policy "subscribers follow newsletter ownership" on public.subscribers
  for all using (
    exists (
      select 1 from public.newsletters
      where newsletters.id = subscribers.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.newsletters
      where newsletters.id = subscribers.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  );

create policy "segments follow newsletter ownership" on public.segments
  for all using (
    exists (
      select 1 from public.newsletters
      where newsletters.id = segments.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.newsletters
      where newsletters.id = segments.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  );

create policy "campaigns follow newsletter ownership" on public.campaigns
  for all using (
    exists (
      select 1 from public.newsletters
      where newsletters.id = campaigns.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.newsletters
      where newsletters.id = campaigns.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  );

create policy "campaign recipients follow newsletter ownership" on public.campaign_recipients
  for all using (
    exists (
      select 1 from public.newsletters
      where newsletters.id = campaign_recipients.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.newsletters
      where newsletters.id = campaign_recipients.newsletter_id
        and newsletters.user_id = auth.uid()
    )
  );

create policy "allowed test recipients are user scoped" on public.allowed_test_recipients
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
