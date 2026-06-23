import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SendCampaignRequest = {
  newsletterId?: unknown;
  campaignId?: unknown;
};

type CampaignRow = {
  id: string;
  newsletter_id: string;
  subject: string;
  body_html: string | null;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  audience_type: 'all_subscribed' | 'segment';
  segment_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type NewsletterRow = {
  id: string;
  user_id: string;
  sender_name: string;
};

type SubscriberRow = {
  id: string;
  newsletter_id: string;
  email: string;
  email_normalized: string;
  name: string | null;
  status: 'subscribed' | 'unsubscribed';
  source_form_id: string | null;
  unsubscribe_token: string;
  created_at: string;
};

type SegmentRule =
  | { field: 'created_at'; operator: 'after'; value: string }
  | { field: 'source_form_id'; operator: 'equals'; value: string }
  | { field: 'status'; operator: 'equals'; value: SubscriberRow['status'] };

type SegmentRow = {
  id: string;
  rules: SegmentRule[];
};

type RecipientRow = {
  id: string;
  campaign_id: string;
  newsletter_id: string;
  subscriber_id: string | null;
  email: string;
  email_normalized: string;
  name: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  provider_message_id: string | null;
  failure_reason: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

const allowedEmailTags = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'h2', 'ul', 'ol', 'li']);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatSenderEmail(senderName: string, configuredFromEmail: string) {
  const addressMatch = configuredFromEmail.match(/<([^<>]+)>$/);
  const senderAddress = addressMatch ? addressMatch[1].trim() : configuredFromEmail.trim();
  const safeSenderName = senderName.replace(/[\r\n<>]/g, ' ').replace(/\s+/g, ' ').trim();

  return `${safeSenderName || 'NEWS-MAILER'} <${senderAddress}>`;
}

function sanitizeEmailHtml(html: string | null) {
  if (!html) {
    return '<p></p>';
  }

  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-zA-Z0-9-]+)(?:\s[^>]*)?>/g, (tag, tagName: string) => {
      const normalizedTag = tagName.toLowerCase();

      if (!allowedEmailTags.has(normalizedTag)) {
        return '';
      }

      return tag.startsWith('</') ? `</${normalizedTag}>` : `<${normalizedTag}>`;
    });
}

function subscriberMatchesRule(subscriber: SubscriberRow, rule: SegmentRule) {
  if (rule.field === 'created_at') {
    return new Date(subscriber.created_at).getTime() > new Date(rule.value).getTime();
  }

  if (rule.field === 'source_form_id') {
    return subscriber.source_form_id === rule.value;
  }

  return subscriber.status === rule.value;
}

function subscriberMatchesRules(subscriber: SubscriberRow, rules: SegmentRule[]) {
  return rules.every((rule) => subscriberMatchesRule(subscriber, rule));
}

function mapCampaign(row: CampaignRow) {
  return {
    id: row.id,
    newsletterId: row.newsletter_id,
    subject: row.subject,
    bodyJson: null,
    bodyHtml: row.body_html,
    status: row.status,
    audienceType: row.audience_type,
    segmentId: row.segment_id,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecipient(row: RecipientRow) {
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

function buildEmailHtml(campaign: CampaignRow, subscriber: SubscriberRow, appOrigin: string) {
  const unsubscribeUrl = `${appOrigin.replace(/\/$/, '')}/unsubscribe/${subscriber.unsubscribe_token}`;
  return [
    sanitizeEmailHtml(campaign.body_html),
    '<hr>',
    `<p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>`,
  ].join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const configuredFromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'NEWS-MAILER <onboarding@resend.dev>';
  const appOrigin = Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173';

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) {
    return jsonResponse({ error: 'Send campaign service is not configured' }, 500);
  }

  const authorization = request.headers.get('Authorization') ?? '';

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return jsonResponse({ error: 'Authentication is required' }, 401);
  }

  let payload: SendCampaignRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const newsletterId = typeof payload.newsletterId === 'string' ? payload.newsletterId : '';
  const campaignId = typeof payload.campaignId === 'string' ? payload.campaignId : '';

  if (!newsletterId || !campaignId) {
    return jsonResponse({ error: 'Newsletter and campaign are required' }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user?.email) {
    return jsonResponse({ error: 'Authentication is required' }, 401);
  }

  const { data: newsletter, error: newsletterError } = await adminClient
    .from('newsletters')
    .select('id, user_id, sender_name')
    .eq('id', newsletterId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (newsletterError) {
    console.error('Newsletter lookup failed', newsletterError);
    return jsonResponse({ error: 'Campaign could not be loaded' }, 500);
  }

  if (!newsletter) {
    return jsonResponse({ error: 'Campaign not found' }, 404);
  }

  const newsletterRow = newsletter as NewsletterRow;
  const fromEmail = formatSenderEmail(newsletterRow.sender_name, configuredFromEmail);

  const { data: campaign, error: campaignError } = await adminClient
    .from('campaigns')
    .select('id, newsletter_id, subject, body_html, status, audience_type, segment_id, sent_at, created_at, updated_at')
    .eq('newsletter_id', newsletterId)
    .eq('id', campaignId)
    .maybeSingle();

  if (campaignError) {
    console.error('Campaign lookup failed', campaignError);
    return jsonResponse({ error: 'Campaign could not be loaded' }, 500);
  }

  if (!campaign) {
    return jsonResponse({ error: 'Campaign not found' }, 404);
  }

  const campaignRow = campaign as CampaignRow;

  if (campaignRow.status === 'sent' || campaignRow.status === 'sending') {
    const { data: existingRecipients, error: existingRecipientsError } = await adminClient
      .from('campaign_recipients')
      .select(
        'id, campaign_id, newsletter_id, subscriber_id, email, email_normalized, name, status, provider_message_id, failure_reason, sent_at, delivered_at, created_at',
      )
      .eq('newsletter_id', newsletterId)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (existingRecipientsError) {
      console.error('Recipient lookup failed', existingRecipientsError);
      return jsonResponse({ error: 'Campaign recipients could not be loaded' }, 500);
    }

    return jsonResponse({
      campaign: mapCampaign(campaignRow),
      recipients: ((existingRecipients ?? []) as RecipientRow[]).map(mapRecipient),
    });
  }

  if (campaignRow.status !== 'draft') {
    return jsonResponse({ error: 'Campaign cannot be sent from its current status' }, 409);
  }

  const { data: subscribers, error: subscribersError } = await adminClient
    .from('subscribers')
    .select('id, newsletter_id, email, email_normalized, name, status, source_form_id, unsubscribe_token, created_at')
    .eq('newsletter_id', newsletterId)
    .eq('status', 'subscribed');

  if (subscribersError) {
    console.error('Subscriber lookup failed', subscribersError);
    return jsonResponse({ error: 'Subscribers could not be loaded' }, 500);
  }

  let segment: SegmentRow | null = null;

  if (campaignRow.audience_type === 'segment') {
    const { data: segmentData, error: segmentError } = await adminClient
      .from('segments')
      .select('id, rules')
      .eq('newsletter_id', newsletterId)
      .eq('id', campaignRow.segment_id)
      .maybeSingle();

    if (segmentError) {
      console.error('Segment lookup failed', segmentError);
      return jsonResponse({ error: 'Segment could not be loaded' }, 500);
    }

    segment = segmentData as SegmentRow | null;
  }

  const resolvedSubscribers = ((subscribers ?? []) as SubscriberRow[]).filter((subscriber) => {
    if (campaignRow.audience_type === 'segment') {
      return segment ? subscriberMatchesRules(subscriber, segment.rules) : false;
    }

    return true;
  });
  const timestamp = new Date().toISOString();

  await adminClient.from('campaign_recipients').delete().eq('newsletter_id', newsletterId).eq('campaign_id', campaignId);
  await adminClient.from('campaigns').update({ status: 'sending' }).eq('newsletter_id', newsletterId).eq('id', campaignId);

  if (resolvedSubscribers.length === 0) {
    const { data: failedCampaign, error: failedCampaignError } = await adminClient
      .from('campaigns')
      .update({ status: 'failed' })
      .eq('newsletter_id', newsletterId)
      .eq('id', campaignId)
      .select('id, newsletter_id, subject, body_html, status, audience_type, segment_id, sent_at, created_at, updated_at')
      .single();

    if (failedCampaignError) {
      console.error('Campaign failure update failed', failedCampaignError);
      return jsonResponse({ error: 'Campaign status could not be updated' }, 500);
    }

    return jsonResponse({ campaign: mapCampaign(failedCampaign as CampaignRow), recipients: [] });
  }

  const userEmailNormalized = normalizeEmail(user.email);
  const recipientRows: Array<{
    campaign_id: string;
    newsletter_id: string;
    subscriber_id: string;
    email: string;
    email_normalized: string;
    name: string | null;
    status: 'sent' | 'failed';
    provider_message_id: string | null;
    failure_reason: string | null;
    sent_at: string | null;
    delivered_at: string | null;
  }> = [];

  for (const subscriber of resolvedSubscribers) {
    if (subscriber.email_normalized !== userEmailNormalized) {
      recipientRows.push({
        campaign_id: campaignId,
        newsletter_id: newsletterId,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        email_normalized: subscriber.email_normalized,
        name: subscriber.name,
        status: 'failed',
        provider_message_id: null,
        failure_reason: 'Skipped by portfolio safety: only your own login email can receive real sends.',
        sent_at: null,
        delivered_at: null,
      });
      continue;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [subscriber.email],
        subject: campaignRow.subject,
        html: buildEmailHtml(campaignRow, subscriber, appOrigin),
      }),
    });
    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      recipientRows.push({
        campaign_id: campaignId,
        newsletter_id: newsletterId,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        email_normalized: subscriber.email_normalized,
        name: subscriber.name,
        status: 'failed',
        provider_message_id: null,
        failure_reason:
          typeof responseBody?.message === 'string' ? responseBody.message : 'Resend rejected the email request.',
        sent_at: null,
        delivered_at: null,
      });
      continue;
    }

    recipientRows.push({
      campaign_id: campaignId,
      newsletter_id: newsletterId,
      subscriber_id: subscriber.id,
      email: subscriber.email,
      email_normalized: subscriber.email_normalized,
      name: subscriber.name,
      status: 'sent',
      provider_message_id: typeof responseBody?.id === 'string' ? responseBody.id : null,
      failure_reason: null,
      sent_at: timestamp,
      delivered_at: null,
    });
  }

  const { error: recipientsInsertError } = await adminClient.from('campaign_recipients').insert(recipientRows);

  if (recipientsInsertError) {
    console.error('Recipient insert failed', recipientsInsertError);
    await adminClient.from('campaigns').update({ status: 'failed' }).eq('newsletter_id', newsletterId).eq('id', campaignId);
    return jsonResponse({ error: 'Campaign recipients could not be recorded' }, 500);
  }

  const acceptedCount = recipientRows.filter((recipient) => recipient.status === 'sent').length;
  const { data: updatedCampaign, error: updatedCampaignError } = await adminClient
    .from('campaigns')
    .update({
      status: acceptedCount > 0 ? 'sent' : 'failed',
      sent_at: acceptedCount > 0 ? timestamp : null,
    })
    .eq('newsletter_id', newsletterId)
    .eq('id', campaignId)
    .select('id, newsletter_id, subject, body_html, status, audience_type, segment_id, sent_at, created_at, updated_at')
    .single();

  if (updatedCampaignError) {
    console.error('Campaign completion update failed', updatedCampaignError);
    return jsonResponse({ error: 'Campaign status could not be updated' }, 500);
  }

  const { data: recipients, error: recipientsError } = await adminClient
    .from('campaign_recipients')
    .select(
      'id, campaign_id, newsletter_id, subscriber_id, email, email_normalized, name, status, provider_message_id, failure_reason, sent_at, delivered_at, created_at',
    )
    .eq('newsletter_id', newsletterId)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (recipientsError) {
    console.error('Recipient reload failed', recipientsError);
    return jsonResponse({ error: 'Campaign recipients could not be loaded' }, 500);
  }

  return jsonResponse({
    campaign: mapCampaign(updatedCampaign as CampaignRow),
    recipients: ((recipients ?? []) as RecipientRow[]).map(mapRecipient),
  });
});
