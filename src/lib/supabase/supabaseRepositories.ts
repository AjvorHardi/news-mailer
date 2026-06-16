import type {
  CreateNewsletterInput,
  NewsletterRepository,
  UpdateNewsletterSettingsInput,
} from '../repositories/contracts';
import type { Id, Newsletter, Profile } from '../../shared/types/domain';
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

export type EnsureProfileInput = {
  email: string;
  fullName?: string | null;
  selectedPlan?: string | null;
  subscriberLimit?: number | null;
};

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
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
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
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
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
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
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
      .select('id, user_id, name, description, sender_name, from_email, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return mapNewsletter(data as NewsletterRow);
  }
}
