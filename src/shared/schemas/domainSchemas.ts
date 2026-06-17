import { z } from 'zod';

export const subscriberStatusSchema = z.enum(['subscribed', 'unsubscribed']);
export const campaignStatusSchema = z.enum(['draft', 'sending', 'sent', 'failed']);
export const campaignRecipientStatusSchema = z.enum(['pending', 'sent', 'delivered', 'bounced', 'failed']);
export const campaignAudienceTypeSchema = z.enum(['all_subscribed', 'segment']);

export const createNewsletterSchema = z.object({
  name: z.string().trim().min(1, 'Newsletter name is required'),
  description: z.string().trim().max(500).nullable().optional(),
  senderName: z.string().trim().min(1, 'Sender name is required'),
});

export const updateNewsletterSettingsSchema = createNewsletterSchema.extend({
  fromEmail: z.email('Use a valid sender email'),
});

export const subscriberInputSchema = z.object({
  email: z.email('Use a valid email address'),
  name: z.string().trim().max(120).nullable().optional(),
  status: subscriberStatusSchema.default('subscribed'),
  sourceFormId: z.string().nullable().optional(),
});

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color, like #171717');

export const signupFormInputSchema = z.object({
  internalName: z.string().trim().min(1, 'Internal name is required'),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  heading: z.string().trim().min(1, 'Heading is required'),
  buttonText: z.string().trim().min(1, 'Button text is required'),
  successMessage: z.string().trim().max(300, 'Success message must be 300 characters or less').nullable().optional(),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  buttonColor: hexColorSchema,
  buttonTextColor: hexColorSchema,
  isActive: z.boolean().default(true),
});

export const signedUpAfterRuleSchema = z.object({
  id: z.string(),
  field: z.literal('created_at'),
  operator: z.literal('after'),
  value: z.iso.datetime(),
});

export const sourceFormEqualsRuleSchema = z.object({
  id: z.string(),
  field: z.literal('source_form_id'),
  operator: z.literal('equals'),
  value: z.string().min(1),
});

export const statusEqualsRuleSchema = z.object({
  id: z.string(),
  field: z.literal('status'),
  operator: z.literal('equals'),
  value: subscriberStatusSchema,
});

export const segmentRuleSchema = z.discriminatedUnion('field', [
  signedUpAfterRuleSchema,
  sourceFormEqualsRuleSchema,
  statusEqualsRuleSchema,
]);

export const segmentInputSchema = z.object({
  name: z.string().trim().min(1, 'Segment name is required'),
  rules: z.array(segmentRuleSchema).min(1, 'Add at least one rule'),
});

export const campaignInputSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required'),
  bodyJson: z.unknown().nullable(),
  bodyHtml: z.string().nullable(),
  audienceType: campaignAudienceTypeSchema,
  segmentId: z.string().nullable(),
});

export const sendCampaignRequestSchema = z.object({
  campaignId: z.string().min(1),
});
