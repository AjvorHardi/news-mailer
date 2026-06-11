export type Id = string;
export type IsoDateString = string;

export type SubscriberStatus = 'subscribed' | 'unsubscribed';
export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'failed';
export type CampaignRecipientStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
export type CampaignAudienceType = 'all_subscribed' | 'segment';
export type SegmentField = 'created_at' | 'source_form_id' | 'status';
export type SegmentOperator = 'after' | 'equals';

export type Profile = {
  id: Id;
  email: string;
  fullName: string | null;
  selectedPlan: string | null;
  subscriberLimit: number | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type Newsletter = {
  id: Id;
  userId: Id;
  name: string;
  description: string | null;
  senderName: string;
  fromEmail: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SignupForm = {
  id: Id;
  newsletterId: Id;
  internalName: string;
  slug: string;
  heading: string;
  buttonText: string;
  successMessage: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type Subscriber = {
  id: Id;
  newsletterId: Id;
  email: string;
  emailNormalized: string;
  name: string | null;
  status: SubscriberStatus;
  sourceFormId: Id | null;
  unsubscribeToken: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  unsubscribedAt: IsoDateString | null;
};

export type SignedUpAfterRule = {
  id: Id;
  field: 'created_at';
  operator: 'after';
  value: IsoDateString;
};

export type SourceFormEqualsRule = {
  id: Id;
  field: 'source_form_id';
  operator: 'equals';
  value: Id;
};

export type StatusEqualsRule = {
  id: Id;
  field: 'status';
  operator: 'equals';
  value: SubscriberStatus;
};

export type SegmentRule = SignedUpAfterRule | SourceFormEqualsRule | StatusEqualsRule;

export type Segment = {
  id: Id;
  newsletterId: Id;
  name: string;
  rules: SegmentRule[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type Campaign = {
  id: Id;
  newsletterId: Id;
  subject: string;
  bodyJson: unknown | null;
  bodyHtml: string | null;
  status: CampaignStatus;
  audienceType: CampaignAudienceType;
  segmentId: Id | null;
  sentAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CampaignRecipient = {
  id: Id;
  campaignId: Id;
  newsletterId: Id;
  subscriberId: Id | null;
  email: string;
  emailNormalized: string;
  name: string | null;
  status: CampaignRecipientStatus;
  providerMessageId: string | null;
  failureReason: string | null;
  sentAt: IsoDateString | null;
  deliveredAt: IsoDateString | null;
  createdAt: IsoDateString;
};

export type ActivityStats = {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
};

export type DemoState = {
  version: number;
  profiles: Profile[];
  newsletters: Newsletter[];
  subscribers: Subscriber[];
  signupForms: SignupForm[];
  segments: Segment[];
  campaigns: Campaign[];
  campaignRecipients: CampaignRecipient[];
};
