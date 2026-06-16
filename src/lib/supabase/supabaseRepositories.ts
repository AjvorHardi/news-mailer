import type {
  ActivityRepository,
  CampaignRepository,
  CreateNewsletterInput,
  CreateSignupFormInput,
  DataRepositories,
  NewsletterRepository,
  SaveCampaignInput,
  SaveSegmentInput,
  SegmentRepository,
  SendCampaignResult,
  SignupFormRepository,
  SubscriberRepository,
  UpdateNewsletterSettingsInput,
  UpdateSignupFormInput,
  UpsertSubscriberInput,
} from '../repositories/contracts';
import type {
  ActivityStats,
  Campaign,
  CampaignRecipient,
  CampaignStatus,
  Id,
  Newsletter,
  Profile,
  Segment,
  SignupForm,
  Subscriber,
  SubscriberStatus,
} from '../../shared/types/domain';
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

type CampaignRow = {
  id: string;
  newsletter_id: string;
  subject: string;
  body_json: unknown | null;
  body_html: string | null;
  status: CampaignStatus;
  audience_type: Campaign['audienceType'];
  segment_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type CampaignRecipientRow = {
  id: string;
  campaign_id: string;
  newsletter_id: string;
  subscriber_id: string | null;
  email: string;
  email_normalized: string;
  name: string | null;
  status: CampaignRecipient['status'];
  provider_message_id: string | null;
  failure_reason: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type EnsureProfileInput = {
  email: string;
  fullName?: string | null;
  selectedPlan?: string | null;
  subscriberLimit?: number | null;
};

const newsletterColumns = 'id, user_id, name, description, sender_name, from_email, created_at, updated_at';
const subscriberColumns =
  'id, newsletter_id, email, email_normalized, name, status, source_form_id, unsubscribe_token, created_at, updated_at, unsubscribed_at';
const signupFormColumns =
  'id, newsletter_id, internal_name, slug, heading, button_text, success_message, background_color, text_color, button_color, button_text_color, is_active, created_at, updated_at';
const segmentColumns = 'id, newsletter_id, name, rules, created_at, updated_at';
const campaignColumns =
  'id, newsletter_id, subject, body_json, body_html, status, audience_type, segment_id, sent_at, created_at, updated_at';
const campaignRecipientColumns =
  'id, campaign_id, newsletter_id, subscriber_id, email, email_normalized, name, status, provider_message_id, failure_reason, sent_at, delivered_at, created_at';

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

function mapCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    newsletterId: row.newsletter_id,
    subject: row.subject,
    bodyJson: row.body_json,
    bodyHtml: row.body_html,
    status: row.status,
    audienceType: row.audience_type,
    segmentId: row.segment_id,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCampaignRecipient(row: CampaignRecipientRow): CampaignRecipient {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    newsletterId: row.newsletter_id,
    subscriberId: row.subscriber_id,
    email: row.email,
    emailNormalized: row.email_normalized,
    name: row.name,
    status: row.status,
    providerMessageId: row.provider_message_id,
    failureReason: row.failure_reason,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
  };
}

function calculateStats(recipients: CampaignRecipient[]): ActivityStats {
  return recipients.reduce<ActivityStats>(
    (stats, recipient) => ({
      ...stats,
      total: stats.total + 1,
      [recipient.status]: stats[recipient.status] + 1,
    }),
    { total: 0, pending: 0, sent: 0, delivered: 0, bounced: 0, failed: 0 },
  );
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
      .select(newsletterColumns)
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
      .select(newsletterColumns)
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
      .select(newsletterColumns)
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
      .select(newsletterColumns)
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
      .select(subscriberColumns)
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
      .select(subscriberColumns)
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
      .select(subscriberColumns)
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
      .select(subscriberColumns)
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
      .select(subscriberColumns)
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
      .select(signupFormColumns)
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
      .select(signupFormColumns)
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
      .select(signupFormColumns)
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
      .select(signupFormColumns)
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
      .select(signupFormColumns)
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
      .select(segmentColumns)
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
      .select(segmentColumns)
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
        .select(segmentColumns)
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
      .select(segmentColumns)
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

export class SupabaseCampaignRepository implements CampaignRepository {
  async list(newsletterId: Id): Promise<Campaign[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('campaigns')
      .select(campaignColumns)
      .eq('newsletter_id', newsletterId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as CampaignRow[]).map(mapCampaign);
  }

  async get(newsletterId: Id, campaignId: Id): Promise<Campaign | null> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('campaigns')
      .select(campaignColumns)
      .eq('newsletter_id', newsletterId)
      .eq('id', campaignId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapCampaign(data as CampaignRow) : null;
  }

  async saveDraft(newsletterId: Id, input: SaveCampaignInput, campaignId?: Id): Promise<Campaign> {
    const client = requireSupabaseClient();

    if (campaignId) {
      const existingCampaign = await this.get(newsletterId, campaignId);

      if (!existingCampaign) {
        throw new Error('Campaign not found');
      }

      if (existingCampaign.status !== 'draft') {
        throw new Error('Only draft campaigns can be edited');
      }

      const { data, error } = await client
        .from('campaigns')
        .update({
          subject: input.subject,
          body_json: input.bodyJson,
          body_html: input.bodyHtml,
          audience_type: input.audienceType,
          segment_id: input.segmentId,
        })
        .eq('newsletter_id', newsletterId)
        .eq('id', campaignId)
        .select(campaignColumns)
        .single();

      if (error) {
        throw error;
      }

      return mapCampaign(data as CampaignRow);
    }

    const { data, error } = await client
      .from('campaigns')
      .insert({
        newsletter_id: newsletterId,
        subject: input.subject,
        body_json: input.bodyJson,
        body_html: input.bodyHtml,
        audience_type: input.audienceType,
        segment_id: input.segmentId,
      })
      .select(campaignColumns)
      .single();

    if (error) {
      throw error;
    }

    return mapCampaign(data as CampaignRow);
  }

  async setStatus(newsletterId: Id, campaignId: Id, status: CampaignStatus): Promise<Campaign> {
    const client = requireSupabaseClient();
    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from('campaigns')
      .update({
        status,
        sent_at: status === 'sent' ? timestamp : undefined,
      })
      .eq('newsletter_id', newsletterId)
      .eq('id', campaignId)
      .select(campaignColumns)
      .single();

    if (error) {
      throw error;
    }

    return mapCampaign(data as CampaignRow);
  }

  async send(newsletterId: Id, campaignId: Id): Promise<SendCampaignResult> {
    const client = requireSupabaseClient();
    const campaign = await this.get(newsletterId, campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'sent') {
      return {
        campaign,
        recipients: await new SupabaseActivityRepository().listRecipients(newsletterId, campaignId),
      };
    }

    if (campaign.status !== 'draft') {
      throw new Error('Campaign cannot be sent from its current status');
    }

    const segment = campaign.segmentId ? await new SupabaseSegmentRepository().get(newsletterId, campaign.segmentId) : null;
    const subscribers = (await new SupabaseSubscriberRepository().list(newsletterId)).filter((subscriber) => {
      if (subscriber.status !== 'subscribed') {
        return false;
      }

      if (campaign.audienceType === 'segment') {
        return segment ? subscriberMatchesRules(subscriber, segment.rules) : false;
      }

      return true;
    });

    await client.from('campaign_recipients').delete().eq('newsletter_id', newsletterId).eq('campaign_id', campaignId);

    if (subscribers.length > 0) {
      const { error: recipientsError } = await client.from('campaign_recipients').insert(
        subscribers.map((subscriber) => ({
          campaign_id: campaign.id,
          newsletter_id: newsletterId,
          subscriber_id: subscriber.id,
          email: subscriber.email,
          email_normalized: subscriber.emailNormalized,
          name: subscriber.name,
          status: 'pending',
          provider_message_id: null,
          failure_reason: null,
          sent_at: null,
          delivered_at: null,
        })),
      );

      if (recipientsError) {
        throw recipientsError;
      }
    }

    const updatedCampaign = await this.setStatus(newsletterId, campaignId, subscribers.length > 0 ? 'sending' : 'failed');
    const recipients = await new SupabaseActivityRepository().listRecipients(newsletterId, campaignId);

    return {
      campaign: updatedCampaign,
      recipients,
    };
  }
}

export class SupabaseActivityRepository implements ActivityRepository {
  async getStats(newsletterId: Id, campaignId?: Id): Promise<ActivityStats> {
    const recipients = await this.listRecipients(newsletterId, campaignId);
    return calculateStats(recipients);
  }

  async listRecipients(newsletterId: Id, campaignId?: Id): Promise<CampaignRecipient[]> {
    const client = requireSupabaseClient();
    let query = client
      .from('campaign_recipients')
      .select(campaignRecipientColumns)
      .eq('newsletter_id', newsletterId)
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return ((data ?? []) as CampaignRecipientRow[]).map(mapCampaignRecipient);
  }
}

export function createSupabaseRepositories(): DataRepositories {
  return {
    newsletters: new SupabaseNewsletterRepository(),
    subscribers: new SupabaseSubscriberRepository(),
    signupForms: new SupabaseSignupFormRepository(),
    segments: new SupabaseSegmentRepository(),
    campaigns: new SupabaseCampaignRepository(),
    activity: new SupabaseActivityRepository(),
  };
}
