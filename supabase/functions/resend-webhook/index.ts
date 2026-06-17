import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.1';
import { Webhook } from 'https://esm.sh/svix@1.76.1';

type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    created_at?: string;
    bounce?: {
      message?: string;
      subType?: string;
      type?: string;
    };
    reason?: string;
    message?: string;
  };
};

type RecipientUpdate =
  | {
      status: 'delivered';
      delivered_at: string;
      failure_reason: null;
    }
  | {
      status: 'bounced' | 'failed';
      failure_reason: string;
    };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getEventTimestamp(event: ResendWebhookEvent) {
  return event.data?.created_at ?? event.created_at ?? new Date().toISOString();
}

function getFailureReason(event: ResendWebhookEvent) {
  return (
    event.data?.bounce?.message ??
    event.data?.reason ??
    event.data?.message ??
    event.type ??
    'Resend reported a delivery failure.'
  );
}

function mapEventToRecipientUpdate(event: ResendWebhookEvent): RecipientUpdate | null {
  if (event.type === 'email.delivered') {
    return {
      status: 'delivered',
      delivered_at: getEventTimestamp(event),
      failure_reason: null,
    };
  }

  if (event.type === 'email.bounced') {
    return {
      status: 'bounced',
      failure_reason: getFailureReason(event),
    };
  }

  if (event.type === 'email.failed' || event.type === 'email.suppressed' || event.type === 'email.complained') {
    return {
      status: 'failed',
      failure_reason: getFailureReason(event),
    };
  }

  return null;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return jsonResponse({ error: 'Webhook service is not configured' }, 500);
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return jsonResponse({ error: 'Missing webhook signature headers' }, 400);
  }

  const payload = await request.text();
  let event: ResendWebhookEvent;

  try {
    event = new Webhook(webhookSecret).verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendWebhookEvent;
  } catch (error) {
    console.error('Invalid Resend webhook signature', error);
    return jsonResponse({ error: 'Invalid webhook signature' }, 400);
  }

  if (!event.type) {
    return jsonResponse({ error: 'Webhook event type is required' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { error: eventInsertError } = await supabase.from('webhook_events').insert({
    provider: 'resend',
    provider_event_id: svixId,
    event_type: event.type,
    payload: event,
  });

  if (eventInsertError) {
    if (eventInsertError.code === '23505') {
      return jsonResponse({ ok: true, duplicate: true });
    }

    console.error('Webhook event insert failed', eventInsertError);
    return jsonResponse({ error: 'Webhook event could not be recorded' }, 500);
  }

  const recipientUpdate = mapEventToRecipientUpdate(event);
  const providerMessageId = event.data?.email_id;

  if (recipientUpdate && providerMessageId) {
    const { error: recipientUpdateError } = await supabase
      .from('campaign_recipients')
      .update(recipientUpdate)
      .eq('provider_message_id', providerMessageId);

    if (recipientUpdateError) {
      console.error('Recipient status update failed', recipientUpdateError);
      return jsonResponse({ error: 'Recipient status could not be updated' }, 500);
    }
  }

  const { error: processedError } = await supabase
    .from('webhook_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('provider', 'resend')
    .eq('provider_event_id', svixId);

  if (processedError) {
    console.error('Webhook event processed update failed', processedError);
    return jsonResponse({ error: 'Webhook event could not be marked processed' }, 500);
  }

  return jsonResponse({
    ok: true,
    ignored: !recipientUpdate || !providerMessageId,
  });
});
