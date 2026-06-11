import { normalizeSubscriberEmail } from '../../shared/utils/email';
import type { DemoState } from '../../shared/types/domain';

export const DEMO_STORAGE_VERSION = 1;
export const DEMO_USER_ID = 'demo-user';
export const DEMO_NEWSLETTER_ID = 'demo-newsletter';

const createdAt = '2026-06-01T09:00:00.000Z';

export const demoSeedState: DemoState = {
  version: DEMO_STORAGE_VERSION,
  profiles: [
    {
      id: DEMO_USER_ID,
      email: 'founder@news-mailer.test',
      fullName: 'Demo Founder',
      selectedPlan: '$30/month up to 3,000 subscribers',
      subscriberLimit: 3000,
      createdAt,
      updatedAt: createdAt,
    },
  ],
  newsletters: [
    {
      id: DEMO_NEWSLETTER_ID,
      userId: DEMO_USER_ID,
      name: 'Product Notes',
      description: 'Weekly product updates for early customers.',
      senderName: 'NEWS-MAILER Demo',
      fromEmail: 'newsletter@example.com',
      createdAt,
      updatedAt: createdAt,
    },
  ],
  signupForms: [
    {
      id: 'demo-form-homepage',
      newsletterId: DEMO_NEWSLETTER_ID,
      internalName: 'Homepage footer',
      slug: 'product-notes',
      heading: 'Get weekly product notes',
      buttonText: 'Subscribe',
      successMessage: 'Thanks for subscribing.',
      backgroundColor: '#ffffff',
      textColor: '#171717',
      buttonColor: '#171717',
      buttonTextColor: '#ffffff',
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    },
  ],
  subscribers: [
    {
      id: 'demo-subscriber-1',
      newsletterId: DEMO_NEWSLETTER_ID,
      email: 'reader.one@example.com',
      emailNormalized: normalizeSubscriberEmail('reader.one@example.com'),
      name: 'Reader One',
      status: 'subscribed',
      sourceFormId: 'demo-form-homepage',
      unsubscribeToken: 'demo-token-reader-one',
      createdAt: '2026-06-02T10:30:00.000Z',
      updatedAt: '2026-06-02T10:30:00.000Z',
      unsubscribedAt: null,
    },
    {
      id: 'demo-subscriber-2',
      newsletterId: DEMO_NEWSLETTER_ID,
      email: 'reader.two@example.com',
      emailNormalized: normalizeSubscriberEmail('reader.two@example.com'),
      name: 'Reader Two',
      status: 'unsubscribed',
      sourceFormId: 'demo-form-homepage',
      unsubscribeToken: 'demo-token-reader-two',
      createdAt: '2026-06-03T11:15:00.000Z',
      updatedAt: '2026-06-06T08:00:00.000Z',
      unsubscribedAt: '2026-06-06T08:00:00.000Z',
    },
  ],
  segments: [
    {
      id: 'demo-segment-subscribed',
      newsletterId: DEMO_NEWSLETTER_ID,
      name: 'Active subscribers',
      rules: [
        {
          id: 'demo-rule-status',
          field: 'status',
          operator: 'equals',
          value: 'subscribed',
        },
      ],
      createdAt,
      updatedAt: createdAt,
    },
  ],
  campaigns: [
    {
      id: 'demo-campaign-draft',
      newsletterId: DEMO_NEWSLETTER_ID,
      subject: 'June product notes',
      bodyJson: null,
      bodyHtml: null,
      status: 'draft',
      audienceType: 'all_subscribed',
      segmentId: null,
      sentAt: null,
      createdAt,
      updatedAt: createdAt,
    },
  ],
  campaignRecipients: [],
};
