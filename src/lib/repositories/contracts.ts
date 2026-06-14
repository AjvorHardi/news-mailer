import type {
  ActivityStats,
  Campaign,
  CampaignRecipient,
  CampaignStatus,
  Id,
  Newsletter,
  Segment,
  SegmentRule,
  SignupForm,
  Subscriber,
  SubscriberStatus,
} from '../../shared/types/domain';

export type CreateNewsletterInput = {
  name: string;
  description?: string | null;
  senderName: string;
};

export type UpdateNewsletterSettingsInput = CreateNewsletterInput & {
  fromEmail: string;
};

export type UpsertSubscriberInput = {
  email: string;
  name?: string | null;
  status?: SubscriberStatus;
  sourceFormId?: Id | null;
};

export type CreateSignupFormInput = Omit<
  SignupForm,
  'id' | 'newsletterId' | 'createdAt' | 'updatedAt'
>;

export type UpdateSignupFormInput = Partial<CreateSignupFormInput>;

export type SaveSegmentInput = {
  name: string;
  rules: SegmentRule[];
};

export type SaveCampaignInput = {
  subject: string;
  bodyJson: unknown | null;
  bodyHtml: string | null;
  audienceType: Campaign['audienceType'];
  segmentId: Id | null;
};

export type SendCampaignResult = {
  campaign: Campaign;
  recipients: CampaignRecipient[];
};

export interface NewsletterRepository {
  list(): Promise<Newsletter[]>;
  get(newsletterId: Id): Promise<Newsletter | null>;
  create(input: CreateNewsletterInput): Promise<Newsletter>;
  updateSettings(newsletterId: Id, input: UpdateNewsletterSettingsInput): Promise<Newsletter>;
}

export interface SubscriberRepository {
  list(newsletterId: Id): Promise<Subscriber[]>;
  get(newsletterId: Id, subscriberId: Id): Promise<Subscriber | null>;
  upsert(newsletterId: Id, input: UpsertSubscriberInput): Promise<Subscriber>;
  update(newsletterId: Id, subscriberId: Id, input: UpsertSubscriberInput): Promise<Subscriber>;
  remove(newsletterId: Id, subscriberId: Id): Promise<void>;
  setStatus(newsletterId: Id, subscriberId: Id, status: SubscriberStatus): Promise<Subscriber>;
}

export interface SignupFormRepository {
  list(newsletterId: Id): Promise<SignupForm[]>;
  get(newsletterId: Id, formId: Id): Promise<SignupForm | null>;
  getPublicBySlug(slug: string): Promise<SignupForm | null>;
  create(newsletterId: Id, input: CreateSignupFormInput): Promise<SignupForm>;
  update(newsletterId: Id, formId: Id, input: UpdateSignupFormInput): Promise<SignupForm>;
  remove(newsletterId: Id, formId: Id): Promise<void>;
}

export interface SegmentRepository {
  list(newsletterId: Id): Promise<Segment[]>;
  get(newsletterId: Id, segmentId: Id): Promise<Segment | null>;
  save(newsletterId: Id, input: SaveSegmentInput, segmentId?: Id): Promise<Segment>;
  remove(newsletterId: Id, segmentId: Id): Promise<void>;
  countMatches(newsletterId: Id, rules: SegmentRule[]): Promise<number>;
}

export interface CampaignRepository {
  list(newsletterId: Id): Promise<Campaign[]>;
  get(newsletterId: Id, campaignId: Id): Promise<Campaign | null>;
  saveDraft(newsletterId: Id, input: SaveCampaignInput, campaignId?: Id): Promise<Campaign>;
  setStatus(newsletterId: Id, campaignId: Id, status: CampaignStatus): Promise<Campaign>;
  send(newsletterId: Id, campaignId: Id): Promise<SendCampaignResult>;
}

export interface ActivityRepository {
  getStats(newsletterId: Id, campaignId?: Id): Promise<ActivityStats>;
  listRecipients(newsletterId: Id, campaignId?: Id): Promise<CampaignRecipient[]>;
}

export type DataRepositories = {
  newsletters: NewsletterRepository;
  subscribers: SubscriberRepository;
  signupForms: SignupFormRepository;
  segments: SegmentRepository;
  campaigns: CampaignRepository;
  activity: ActivityRepository;
};
