import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PublicFormRequest = {
  slug?: unknown;
};

type SignupFormRow = {
  slug: string;
  heading: string;
  button_text: string;
  success_message: string | null;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
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
    return jsonResponse({ error: 'Public form service is not configured' }, 500);
  }

  let payload: PublicFormRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';

  if (!slug) {
    return jsonResponse({ error: 'Form slug is required' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { data, error } = await supabase
    .from('signup_forms')
    .select('slug, heading, button_text, success_message, background_color, text_color, button_color, button_text_color')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Public form lookup failed', error);
    return jsonResponse({ error: 'Signup form could not be loaded' }, 500);
  }

  if (!data) {
    return jsonResponse({ error: 'Signup form is unavailable' }, 404);
  }

  const form = data as SignupFormRow;

  return jsonResponse({
    form: {
      slug: form.slug,
      heading: form.heading,
      buttonText: form.button_text,
      successMessage: form.success_message,
      backgroundColor: form.background_color,
      textColor: form.text_color,
      buttonColor: form.button_color,
      buttonTextColor: form.button_text_color,
    },
  });
});
