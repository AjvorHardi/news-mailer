import type {
  ActivityRepository,
  CampaignRepository,
  CreateNewsletterInput,
  CreateSignupFormInput,
  DataRepositories,
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
  DemoState,
  Id,
  Newsletter,
  Segment,
  SegmentRule,
  SignupForm,
  Subscriber,
  SubscriberStatus,
} from '../../shared/types/domain';
import { normalizeSubscriberEmail } from '../../shared/utils/email';
import { loadDemoState, saveDemoState } from './storage';
import { subscriberMatchesRules } from './segmentMatcher';
import { DEMO_USER_ID } from './seed';

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function mutateDemoState<T>(mutator: (state: DemoState) => T) {
  const state = loadDemoState();
  const result = mutator(state);
  saveDemoState(state);
  return result;
}

function findNewsletter(state: DemoState, newsletterId: Id) {
  return state.newsletters.find((newsletter) => newsletter.id === newsletterId) ?? null;
}

function requireNewsletter(state: DemoState, newsletterId: Id) {
  const newsletter = findNewsletter(state, newsletterId);

  if (!newsletter) {
    throw new Error('Newsletter not found');
  }

  return newsletter;
}

function requireSameNewsletterForm(state: DemoState, newsletterId: Id, sourceFormId: Id | null | undefined) {
  if (!sourceFormId) {
    return;
  }

  const form = state.signupForms.find((signupForm) => signupForm.id === sourceFormId);

  if (!form || form.newsletterId !== newsletterId) {
    throw new Error('Source form does not belong to this newsletter');
  }
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

class DemoNewsletterRepository {
  async list() {
    return loadDemoState().newsletters;
  }

  async get(newsletterId: Id) {
    return findNewsletter(loadDemoState(), newsletterId);
  }

  async create(input: CreateNewsletterInput): Promise<Newsletter> {
    return mutateDemoState((state) => {
      const timestamp = now();
      const newsletter: Newsletter = {
        id: createId('newsletter'),
        userId: DEMO_USER_ID,
        name: input.name,
        description: input.description ?? null,
        senderName: input.senderName,
        fromEmail: 'newsletter@example.com',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.newsletters.push(newsletter);
      return newsletter;
    });
  }

  async updateSettings(newsletterId: Id, input: UpdateNewsletterSettingsInput): Promise<Newsletter> {
    return mutateDemoState((state) => {
      const newsletter = requireNewsletter(state, newsletterId);

      newsletter.name = input.name;
      newsletter.description = input.description ?? null;
      newsletter.senderName = input.senderName;
      newsletter.fromEmail = input.fromEmail;
      newsletter.updatedAt = now();

      return newsletter;
    });
  }
}

class DemoSubscriberRepository implements SubscriberRepository {
  async list(newsletterId: Id) {
    return loadDemoState().subscribers.filter((subscriber) => subscriber.newsletterId === newsletterId);
  }

  async get(newsletterId: Id, subscriberId: Id) {
    return (
      loadDemoState().subscribers.find(
        (subscriber) => subscriber.newsletterId === newsletterId && subscriber.id === subscriberId,
      ) ?? null
    );
  }

  async create(newsletterId: Id, input: UpsertSubscriberInput): Promise<Subscriber> {
    return mutateDemoState((state) => {
      requireNewsletter(state, newsletterId);
      requireSameNewsletterForm(state, newsletterId, input.sourceFormId);

      const emailNormalized = normalizeSubscriberEmail(input.email);
      const existingSubscriber = state.subscribers.find(
        (subscriber) => subscriber.newsletterId === newsletterId && subscriber.emailNormalized === emailNormalized,
      );

      if (existingSubscriber) {
        throw new Error('A subscriber with this email already exists');
      }

      const timestamp = now();
      const subscriber: Subscriber = {
        id: createId('subscriber'),
        newsletterId,
        email: input.email.trim(),
        emailNormalized,
        name: input.name ?? null,
        status: input.status ?? 'subscribed',
        sourceFormId: input.sourceFormId ?? null,
        unsubscribeToken: createId('unsubscribe'),
        createdAt: timestamp,
        updatedAt: timestamp,
        unsubscribedAt: input.status === 'unsubscribed' ? timestamp : null,
      };

      state.subscribers.push(subscriber);
      return subscriber;
    });
  }

  async upsert(newsletterId: Id, input: UpsertSubscriberInput): Promise<Subscriber> {
    return mutateDemoState((state) => {
      requireNewsletter(state, newsletterId);
      requireSameNewsletterForm(state, newsletterId, input.sourceFormId);

      const timestamp = now();
      const emailNormalized = normalizeSubscriberEmail(input.email);
      const existingSubscriber = state.subscribers.find(
        (subscriber) => subscriber.newsletterId === newsletterId && subscriber.emailNormalized === emailNormalized,
      );

      if (existingSubscriber) {
        existingSubscriber.email = input.email.trim();
        existingSubscriber.name = input.name ?? null;
        existingSubscriber.status = input.status ?? existingSubscriber.status;
        existingSubscriber.sourceFormId = input.sourceFormId ?? existingSubscriber.sourceFormId;
        existingSubscriber.updatedAt = timestamp;
        existingSubscriber.unsubscribedAt = existingSubscriber.status === 'unsubscribed' ? timestamp : null;
        return existingSubscriber;
      }

      const subscriber: Subscriber = {
        id: createId('subscriber'),
        newsletterId,
        email: input.email.trim(),
        emailNormalized,
        name: input.name ?? null,
        status: input.status ?? 'subscribed',
        sourceFormId: input.sourceFormId ?? null,
        unsubscribeToken: createId('unsubscribe'),
        createdAt: timestamp,
        updatedAt: timestamp,
        unsubscribedAt: input.status === 'unsubscribed' ? timestamp : null,
      };

      state.subscribers.push(subscriber);
      return subscriber;
    });
  }

  async update(newsletterId: Id, subscriberId: Id, input: UpsertSubscriberInput): Promise<Subscriber> {
    return mutateDemoState((state) => {
      requireNewsletter(state, newsletterId);
      requireSameNewsletterForm(state, newsletterId, input.sourceFormId);

      const subscriber = state.subscribers.find(
        (candidate) => candidate.newsletterId === newsletterId && candidate.id === subscriberId,
      );

      if (!subscriber) {
        throw new Error('Subscriber not found');
      }

      const emailNormalized = normalizeSubscriberEmail(input.email);
      const duplicateSubscriber = state.subscribers.find(
        (candidate) =>
          candidate.newsletterId === newsletterId &&
          candidate.emailNormalized === emailNormalized &&
          candidate.id !== subscriberId,
      );

      if (duplicateSubscriber) {
        throw new Error('A subscriber with this email already exists');
      }

      const timestamp = now();
      subscriber.email = input.email.trim();
      subscriber.emailNormalized = emailNormalized;
      subscriber.name = input.name ?? null;
      subscriber.status = input.status ?? subscriber.status;
      subscriber.sourceFormId = input.sourceFormId ?? null;
      subscriber.updatedAt = timestamp;
      subscriber.unsubscribedAt = subscriber.status === 'unsubscribed' ? timestamp : null;

      return subscriber;
    });
  }

  async remove(newsletterId: Id, subscriberId: Id) {
    mutateDemoState((state) => {
      state.subscribers = state.subscribers.filter(
        (subscriber) => subscriber.newsletterId !== newsletterId || subscriber.id !== subscriberId,
      );
    });
  }

  async setStatus(newsletterId: Id, subscriberId: Id, status: SubscriberStatus): Promise<Subscriber> {
    return mutateDemoState((state) => {
      const subscriber = state.subscribers.find(
        (candidate) => candidate.newsletterId === newsletterId && candidate.id === subscriberId,
      );

      if (!subscriber) {
        throw new Error('Subscriber not found');
      }

      const timestamp = now();
      subscriber.status = status;
      subscriber.updatedAt = timestamp;
      subscriber.unsubscribedAt = status === 'unsubscribed' ? timestamp : null;

      return subscriber;
    });
  }
}

class DemoSignupFormRepository implements SignupFormRepository {
  async list(newsletterId: Id) {
    return loadDemoState().signupForms.filter((form) => form.newsletterId === newsletterId);
  }

  async get(newsletterId: Id, formId: Id) {
    return loadDemoState().signupForms.find((form) => form.newsletterId === newsletterId && form.id === formId) ?? null;
  }

  async getPublicBySlug(slug: string) {
    return loadDemoState().signupForms.find((form) => form.slug === slug && form.isActive) ?? null;
  }

  async create(newsletterId: Id, input: CreateSignupFormInput): Promise<SignupForm> {
    return mutateDemoState((state) => {
      requireNewsletter(state, newsletterId);

      if (state.signupForms.some((form) => form.slug === input.slug)) {
        throw new Error('Signup form slug already exists');
      }

      const timestamp = now();
      const form: SignupForm = {
        ...input,
        id: createId('form'),
        newsletterId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.signupForms.push(form);
      return form;
    });
  }

  async update(newsletterId: Id, formId: Id, input: UpdateSignupFormInput): Promise<SignupForm> {
    return mutateDemoState((state) => {
      const form = state.signupForms.find((candidate) => candidate.newsletterId === newsletterId && candidate.id === formId);

      if (!form) {
        throw new Error('Signup form not found');
      }

      if (input.slug && state.signupForms.some((candidate) => candidate.id !== formId && candidate.slug === input.slug)) {
        throw new Error('Signup form slug already exists');
      }

      Object.assign(form, input, { updatedAt: now() });
      return form;
    });
  }

  async remove(newsletterId: Id, formId: Id) {
    mutateDemoState((state) => {
      state.signupForms = state.signupForms.filter((form) => form.newsletterId !== newsletterId || form.id !== formId);
      state.subscribers = state.subscribers.map((subscriber) =>
        subscriber.newsletterId === newsletterId && subscriber.sourceFormId === formId
          ? { ...subscriber, sourceFormId: null, updatedAt: now() }
          : subscriber,
      );
    });
  }
}

class DemoSegmentRepository implements SegmentRepository {
  async list(newsletterId: Id) {
    return loadDemoState().segments.filter((segment) => segment.newsletterId === newsletterId);
  }

  async get(newsletterId: Id, segmentId: Id) {
    return loadDemoState().segments.find((segment) => segment.newsletterId === newsletterId && segment.id === segmentId) ?? null;
  }

  async save(newsletterId: Id, input: SaveSegmentInput, segmentId?: Id): Promise<Segment> {
    return mutateDemoState((state) => {
      requireNewsletter(state, newsletterId);
      const timestamp = now();

      if (segmentId) {
        const segment = state.segments.find((candidate) => candidate.newsletterId === newsletterId && candidate.id === segmentId);

        if (!segment) {
          throw new Error('Segment not found');
        }

        segment.name = input.name;
        segment.rules = input.rules;
        segment.updatedAt = timestamp;
        return segment;
      }

      const segment: Segment = {
        id: createId('segment'),
        newsletterId,
        name: input.name,
        rules: input.rules,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.segments.push(segment);
      return segment;
    });
  }

  async remove(newsletterId: Id, segmentId: Id) {
    mutateDemoState((state) => {
      state.segments = state.segments.filter((segment) => segment.newsletterId !== newsletterId || segment.id !== segmentId);
    });
  }

  async countMatches(newsletterId: Id, rules: SegmentRule[]) {
    return loadDemoState().subscribers.filter(
      (subscriber) => subscriber.newsletterId === newsletterId && subscriberMatchesRules(subscriber, rules),
    ).length;
  }
}

class DemoCampaignRepository implements CampaignRepository {
  async list(newsletterId: Id) {
    return loadDemoState().campaigns.filter((campaign) => campaign.newsletterId === newsletterId);
  }

  async get(newsletterId: Id, campaignId: Id) {
    return loadDemoState().campaigns.find((campaign) => campaign.newsletterId === newsletterId && campaign.id === campaignId) ?? null;
  }

  async saveDraft(newsletterId: Id, input: SaveCampaignInput, campaignId?: Id): Promise<Campaign> {
    return mutateDemoState((state) => {
      requireNewsletter(state, newsletterId);
      const timestamp = now();

      if (campaignId) {
        const campaign = state.campaigns.find((candidate) => candidate.newsletterId === newsletterId && candidate.id === campaignId);

        if (!campaign) {
          throw new Error('Campaign not found');
        }

        if (campaign.status !== 'draft') {
          throw new Error('Only draft campaigns can be edited');
        }

        Object.assign(campaign, input, { updatedAt: timestamp });
        return campaign;
      }

      const campaign: Campaign = {
        id: createId('campaign'),
        newsletterId,
        subject: input.subject,
        bodyJson: input.bodyJson,
        bodyHtml: input.bodyHtml,
        status: 'draft',
        audienceType: input.audienceType,
        segmentId: input.segmentId,
        sentAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.campaigns.push(campaign);
      return campaign;
    });
  }

  async setStatus(newsletterId: Id, campaignId: Id, status: CampaignStatus): Promise<Campaign> {
    return mutateDemoState((state) => {
      const campaign = state.campaigns.find((candidate) => candidate.newsletterId === newsletterId && candidate.id === campaignId);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      campaign.status = status;
      campaign.updatedAt = now();
      campaign.sentAt = status === 'sent' ? campaign.updatedAt : campaign.sentAt;

      return campaign;
    });
  }

  async send(newsletterId: Id, campaignId: Id): Promise<SendCampaignResult> {
    return mutateDemoState((state) => {
      const campaign = state.campaigns.find((candidate) => candidate.newsletterId === newsletterId && candidate.id === campaignId);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status === 'sent') {
        return {
          campaign,
          recipients: state.campaignRecipients.filter((recipient) => recipient.campaignId === campaign.id),
        };
      }

      if (campaign.status !== 'draft') {
        throw new Error('Campaign cannot be sent from its current status');
      }

      const segment = campaign.segmentId
        ? state.segments.find((candidate) => candidate.newsletterId === newsletterId && candidate.id === campaign.segmentId)
        : null;
      const subscribers = state.subscribers.filter((subscriber) => {
        if (subscriber.newsletterId !== newsletterId || subscriber.status !== 'subscribed') {
          return false;
        }

        if (campaign.audienceType === 'segment') {
          return segment ? subscriberMatchesRules(subscriber, segment.rules) : false;
        }

        return true;
      });
      const timestamp = now();
      const recipients = subscribers.map<CampaignRecipient>((subscriber, index) => ({
        id: createId('recipient'),
        campaignId: campaign.id,
        newsletterId,
        subscriberId: subscriber.id,
        email: subscriber.email,
        emailNormalized: subscriber.emailNormalized,
        name: subscriber.name,
        status: index % 4 === 0 ? 'delivered' : 'sent',
        providerMessageId: `demo-message-${campaign.id}-${subscriber.id}`,
        failureReason: null,
        sentAt: timestamp,
        deliveredAt: index % 4 === 0 ? timestamp : null,
        createdAt: timestamp,
      }));

      state.campaignRecipients = [
        ...state.campaignRecipients.filter((recipient) => recipient.campaignId !== campaign.id),
        ...recipients,
      ];
      campaign.status = recipients.length > 0 ? 'sent' : 'failed';
      campaign.sentAt = recipients.length > 0 ? timestamp : null;
      campaign.updatedAt = timestamp;

      return { campaign, recipients };
    });
  }
}

class DemoActivityRepository implements ActivityRepository {
  async getStats(newsletterId: Id, campaignId?: Id) {
    const recipients = await this.listRecipients(newsletterId, campaignId);
    return calculateStats(recipients);
  }

  async listRecipients(newsletterId: Id, campaignId?: Id) {
    return loadDemoState().campaignRecipients.filter((recipient) => {
      if (recipient.newsletterId !== newsletterId) {
        return false;
      }

      return campaignId ? recipient.campaignId === campaignId : true;
    });
  }
}

export function createDemoRepositories(): DataRepositories {
  return {
    newsletters: new DemoNewsletterRepository(),
    subscribers: new DemoSubscriberRepository(),
    signupForms: new DemoSignupFormRepository(),
    segments: new DemoSegmentRepository(),
    campaigns: new DemoCampaignRepository(),
    activity: new DemoActivityRepository(),
  };
}
