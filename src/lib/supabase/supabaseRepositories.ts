import type {
  CreateNewsletterInput,
  CreateSignupFormInput,
  NewsletterRepository,
  SaveSegmentInput,
  SegmentRepository,
  SignupFormRepository,
  SubscriberRepository,
  UpdateNewsletterSettingsInput,
  UpdateSignupFormInput,
  UpsertSubscriberInput,
} from '../repositories/contracts';
import type { Id, Newsletter, Profile, Segment, SignupForm, Subscriber, SubscriberStatus } from '../../shared/types/domain';
import { subscriberMatchesRules } from '../demo-storage/segmentMatcher';
import { normalizeSubscriberEmail } from '../../shared/utils/email';
import { requireSupabaseClient } from './client';

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  selected_plan: string | null;
  subscriber_limit: number | null;
  created_at: string;
  updated_at: string;
};

type NewsletterRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sender_name: string;
  from_email: string;
  created_at: string;
  updated_at: string;
};

type SubscriberRow = {
  id: string;
  newsletter_id: string;
  email: string;
  email_normalized: string;
  name: string | null;
  status: SubscriberStatus;
  source_form_id: string | null;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;
};

type SignupFormRow = {
  id: string;
  newsletter_id: string;
  internal_name: string;
  slug: string;
  heading: string;
  button_text: string;
  success_message: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SegmentRow = {
  id: string;
  newsletter_id: string;
  name: string;
  rules: Segment['rules'];
  created_at: string;
  updated_at: string;
};

export type EnsureProfileInput = {
  email: string;
  fullName?: string | null;
  selectedPlan?: string | null;
  subscriberLimit?: number | null;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    selectedPlan: row.selected_plan,
    subscriberLimit: row.subscriber_limit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNewsletter(row: NewsletterRow): Newsletter {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    senderName: row.sender_name,
    fromEmail: row.from_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubscriber(row: SubscriberRow): Subscriber {
  return {
    id: row.id,
    newsletterId: row.newsletter_id,
    email: row.email,
    emailNormalized: row.email_normalized,
    name: row.name,
    status: row.status,
    sourceFormId: row.source_form_id,
    unsubscribeToken: row.unsubscribe_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unsubscribedAt: row.unsubscribed_at,
  };
}

function mapSignupForm(row: SignupFormRow): SignupForm {
  return {
    id: row.id,
    newsletterId: row.newsletter_id,
    internalName: row.internal_name,
    slug: row.slug,
    heading: row.heading,
    buttonText: row.button_text,
    successMessage: row.success_message,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    buttonColor: row.button_color,
    buttonTextColor: row.button_text_color,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSegment(row: SegmentRow): Segment {
  return {
    id: row.id,
    newsletterId: row.newsletter_id,
    name: row.name,
    rules: row.rules,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function ensureSupabaseProfile(input: EnsureProfileInput): Promise<Profile> {
  const client = requireSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await client
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: input.email,
        full_name: input.fullName ?? null,
        selected_plan: input.selectedPlan ?? null,
        subscriber_limit: input.subscriberLimit ?? null,
      },
      { onConflict: 'id' },
    )
    .select('id, email, full_name, selected_plan, subscriber_limit, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data as ProfileRow);
}

export class SupabaseNewsletterRepository implements NewsletterRepository {
  async list(): Promise<Newsletter[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('newsletters')
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as NewsletterRow[]).map(mapNewsletter);
  }

  async get(newsletterId: Id): Promise<Newsletter | null> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('newsletters')
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
      .eq('id', newsletterId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapNewsletter(data as NewsletterRow) : null;
  }

  async create(input: CreateNewsletterInput): Promise<Newsletter> {
    const client = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('No authenticated user found');
    }

    const { data, error } = await client
      .from('newsletters')
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description ?? null,
        sender_name: input.senderName,
        from_email: user.email ?? 'newsletter@example.com',
      })
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return mapNewsletter(data as NewsletterRow);
  }

  async updateSettings(newsletterId: Id, input: UpdateNewsletterSettingsInput): Promise<Newsletter> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('newsletters')
      .update({
        name: input.name,
        description: input.description ?? null,
        sender_name: input.senderName,
        from_email: input.fromEmail,
      })
      .eq('id', newsletterId)
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return mapNewsletter(data as NewsletterRow);
  }
}

export class SupabaseSubscriberRepository implements SubscriberRepository {
  async list(newsletterId: Id): Promise<Subscriber[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('subscribers')
      .select(
        'id, newsletter_id, email, email_normalized, name, status, source_form_id, unsubscribe_token, created_at, updated_at, unsubscribed_at',
      )
      .eq('newsletter_id', newsletterId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as SubscriberRow[]).map(mapSubscriber);
  }

  async get(newsletterId: Id, subscriberId: Id): Promise<Subscriber | null> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('subscribers')
      .select(
        'id, newsletter_id, email, email_normalized, name, status, source_form_id, unsubscribe_token, created_at, updated_at, unsubscribed_at',
      )
      .eq('newsletter_id', newsletterId)
      .eq('id', subscriberId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapSubscriber(data as SubscriberRow) : null;
  }

  async create(newsletterId: Id, input: UpsertSubscriberInput): Promise<Subscriber> {
    const client = requireSupabaseClient();
    const status = input.status ?? 'subscribed';
    const { data, error } = await client
      .from('subscribers')
      .insert({
        newsletter_id: newsletterId,
        email: input.email.trim(),
        email_normalized: normalizeSubscriberEmail(input.email),
        name: input.name?.trim() || null,
        status,
        source_form_id: input.sourceFormId ?? null,
        unsubscribed_at: status === 'unsubscribed' ? new Date().toISOString() : null,
      })
      .select(
        'id, newsletter_id, email, email_normalized, name, status, source_form_id, unsubscribe_token, created_at, updated_at, unsubscribed_at',
      )
      .single();

    if (error) {
      throw mapSupabaseSubscriberError(error);
    }

    return mapSubscriber(data as SubscriberRow);
  }

  async upsert(newsletterId: Id, input: UpsertSubscriberInput): Promise<Subscriber> {
    const existingSubscriber = (await this.list(newsletterId)).find(
      (subscriber) => subscriber.emailNormalized === normalizeSubscriberEmail(input.email),
    );

    if (existingSubscriber) {
      return this.update(newsletterId, existingSubscriber.id, input);
    }

    return this.create(newsletterId, input);
  }

  async update(newsletterId: Id, subscriberId: Id, input: UpsertSubscriberInput): Promise<Subscriber> {
    const client = requireSupabaseClient();
    const status = input.status ?? 'subscribed';
    const { data, error } = await client
      .from('subscribers')
      .update({
        email: input.email.trim(),
        email_normalized: normalizeSubscriberEmail(input.email),
        name: input.name?.trim() || null,
        status,
        source_form_id: input.sourceFormId ?? null,
        unsubscribed_at: status === 'unsubscribed' ? new Date().toISOString() : null,
      })
      .eq('newsletter_id', newsletterId)
      .eq('id', subscriberId)
      .select(
        'id, newsletter_id, email, email_normalized, name, status, source_form_id, unsubscribe_token, created_at, updated_at, unsubscribed_at',
      )
      .single();

    if (error) {
      throw mapSupabaseSubscriberError(error);
    }

    return mapSubscriber(data as SubscriberRow);
  }

  async remove(newsletterId: Id, subscriberId: Id): Promise<void> {
    const client = requireSupabaseClient();
    const { error } = await client.from('subscribers').delete().eq('newsletter_id', newsletterId).eq('id', subscriberId);

    if (error) {
      throw error;
    }
  }

  async setStatus(newsletterId: Id, subscriberId: Id, status: SubscriberStatus): Promise<Subscriber> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('subscribers')
      .update({
        status,
        unsubscribed_at: status === 'unsubscribed' ? new Date().toISOString() : null,
      })
      .eq('newsletter_id', newsletterId)
      .eq('id', subscriberId)
      .select(
        'id, newsletter_id, email, email_normalized, name, status, source_form_id, unsubscribe_token, created_at, updated_at, unsubscribed_at',
      )
      .single();

    if (error) {
      throw error;
    }

    return mapSubscriber(data as SubscriberRow);
  }
}

function mapSupabaseSubscriberError(error: Error) {
  if (error.message.includes('subscribers_newsletter_id_email_normalized_key')) {
    return new Error('A subscriber with this email already exists');
  }

  return error;
}

export class SupabaseSignupFormRepository implements SignupFormRepository {
  async list(newsletterId: Id): Promise<SignupForm[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('signup_forms')
      .select(
        'id, newsletter_id, internal_name, slug, heading, button_text, success_message, background_color, text_color, button_color, button_text_color, is_active, created_at, updated_at',
      )
      .eq('newsletter_id', newsletterId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as SignupFormRow[]).map(mapSignupForm);
  }

  async get(newsletterId: Id, formId: Id): Promise<SignupForm | null> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('signup_forms')
      .select(
        'id, newsletter_id, internal_name, slug, heading, button_text, success_message, background_color, text_color, button_color, button_text_color, is_active, created_at, updated_at',
      )
      .eq('newsletter_id', newsletterId)
      .eq('id', formId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapSignupForm(data as SignupFormRow) : null;
  }

  async getPublicBySlug(slug: string): Promise<SignupForm | null> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('signup_forms')
      .select(
        'id, newsletter_id, internal_name, slug, heading, button_text, success_message, background_color, text_color, button_color, button_text_color, is_active, created_at, updated_at',
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapSignupForm(data as SignupFormRow) : null;
  }

  async create(newsletterId: Id, input: CreateSignupFormInput): Promise<SignupForm> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('signup_forms')
      .insert({
        newsletter_id: newsletterId,
        internal_name: input.internalName,
        slug: input.slug,
        heading: input.heading,
        button_text: input.buttonText,
        success_message: input.successMessage,
        background_color: input.backgroundColor,
        text_color: input.textColor,
        button_color: input.buttonColor,
        button_text_color: input.buttonTextColor,
        is_active: input.isActive,
      })
      .select(
        'id, newsletter_id, internal_name, slug, heading, button_text, success_message, background_color, text_color, button_color, button_text_color, is_active, created_at, updated_at',
      )
      .single();

    if (error) {
      throw mapSupabaseSignupFormError(error);
    }

    return mapSignupForm(data as SignupFormRow);
  }

  async update(newsletterId: Id, formId: Id, input: UpdateSignupFormInput): Promise<SignupForm> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('signup_forms')
      .update({
        internal_name: input.internalName,
        slug: input.slug,
        heading: input.heading,
        button_text: input.buttonText,
        success_message: input.successMessage,
        background_color: input.backgroundColor,
        text_color: input.textColor,
        button_color: input.buttonColor,
        button_text_color: input.buttonTextColor,
        is_active: input.isActive,
      })
      .eq('newsletter_id', newsletterId)
      .eq('id', formId)
      .select(
        'id, newsletter_id, internal_name, slug, heading, button_text, success_message, background_color, text_color, button_color, button_text_color, is_active, created_at, updated_at',
      )
      .single();

    if (error) {
      throw mapSupabaseSignupFormError(error);
    }

    return mapSignupForm(data as SignupFormRow);
  }

  async remove(newsletterId: Id, formId: Id): Promise<void> {
    const client = requireSupabaseClient();
    const { error } = await client.from('signup_forms').delete().eq('newsletter_id', newsletterId).eq('id', formId);

    if (error) {
      throw error;
    }
  }
}

export class SupabaseSegmentRepository implements SegmentRepository {
  async list(newsletterId: Id): Promise<Segment[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('segments')
      .select('id, newsletter_id, name, rules, created_at, updated_at')
      .eq('newsletter_id', newsletterId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as SegmentRow[]).map(mapSegment);
  }

  async get(newsletterId: Id, segmentId: Id): Promise<Segment | null> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('segments')
      .select('id, newsletter_id, name, rules, created_at, updated_at')
      .eq('newsletter_id', newsletterId)
      .eq('id', segmentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapSegment(data as SegmentRow) : null;
  }

  async save(newsletterId: Id, input: SaveSegmentInput, segmentId?: Id): Promise<Segment> {
    const client = requireSupabaseClient();

    if (segmentId) {
      const { data, error } = await client
        .from('segments')
        .update({
          name: input.name,
          rules: input.rules,
        })
        .eq('newsletter_id', newsletterId)
        .eq('id', segmentId)
        .select('id, newsletter_id, name, rules, created_at, updated_at')
        .single();

      if (error) {
        throw error;
      }

      return mapSegment(data as SegmentRow);
    }

    const { data, error } = await client
      .from('segments')
      .insert({
        newsletter_id: newsletterId,
        name: input.name,
        rules: input.rules,
      })
      .select('id, newsletter_id, name, rules, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return mapSegment(data as SegmentRow);
  }

  async remove(newsletterId: Id, segmentId: Id): Promise<void> {
    const client = requireSupabaseClient();
    const { error } = await client.from('segments').delete().eq('newsletter_id', newsletterId).eq('id', segmentId);

    if (error) {
      throw error;
    }
  }

  async countMatches(newsletterId: Id, rules: Segment['rules']): Promise<number> {
    const subscribers = await new SupabaseSubscriberRepository().list(newsletterId);
    return subscribers.filter((subscriber) => subscriberMatchesRules(subscriber, rules)).length;
  }
}

function mapSupabaseSignupFormError(error: Error) {
  if (error.message.includes('signup_forms_slug_key')) {
    return new Error('Signup form slug already exists');
  }

  return error;
}
