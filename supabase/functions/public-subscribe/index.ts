import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PublicSubscribeRequest = {
  slug?: unknown;
  email?: unknown;
  name?: unknown;
};

type SignupFormRow = {
  id: string;
  newsletter_id: string;
  success_message: string;
};

type SubscriberRow = {
  id: string;
  status: 'subscribed' | 'unsubscribed';
};

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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Public subscribe service is not configured' }, 500);
  }

  let payload: PublicSubscribeRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const emailNormalized = normalizeEmail(email);
  const name = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : null;

  if (!slug) {
    return jsonResponse({ error: 'Form slug is required' }, 400);
  }

  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: 'Use a valid email address' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { data: formData, error: formError } = await supabase
    .from('signup_forms')
    .select('id, newsletter_id, success_message')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (formError) {
    console.error('Public subscribe form lookup failed', formError);
    return jsonResponse({ error: 'Signup form could not be loaded' }, 500);
  }

  if (!formData) {
    return jsonResponse({ error: 'Signup form is unavailable' }, 404);
  }

  const form = formData as SignupFormRow;
  const timestamp = new Date().toISOString();
  const { data: existingSubscriber, error: existingSubscriberError } = await supabase
    .from('subscribers')
    .select('id, status')
    .eq('newsletter_id', form.newsletter_id)
    .eq('email_normalized', emailNormalized)
    .maybeSingle();

  if (existingSubscriberError) {
    console.error('Existing subscriber lookup failed', existingSubscriberError);
    return jsonResponse({ error: 'Subscription could not be completed' }, 500);
  }

  if (existingSubscriber) {
    const subscriber = existingSubscriber as SubscriberRow;

    if (subscriber.status === 'subscribed') {
      return jsonResponse({
        ok: true,
        status: 'already_subscribed',
        message: 'This email is already subscribed.',
      });
    }

    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        status: 'subscribed',
        source_form_id: form.id,
        unsubscribed_at: null,
      })
      .eq('newsletter_id', form.newsletter_id)
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Existing subscriber update failed', updateError);
      return jsonResponse({ error: 'Subscription could not be completed' }, 500);
    }

    return jsonResponse({ ok: true, status: 'resubscribed', message: form.success_message });
  }

  const { error: insertError } = await supabase.from('subscribers').insert({
    newsletter_id: form.newsletter_id,
    email,
    email_normalized: emailNormalized,
    name,
    status: 'subscribed',
    source_form_id: form.id,
    unsubscribed_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  });

  if (insertError) {
    console.error('Subscriber insert failed', insertError);
    return jsonResponse({ error: 'Subscription could not be completed' }, 500);
  }

  return jsonResponse({ ok: true, status: 'subscribed', message: form.success_message });
});
