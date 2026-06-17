import { useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { isSupabaseConfigured, requireSupabaseClient } from '../../lib/supabase/client';

type PublicForm = {
  slug: string;
  heading: string;
  buttonText: string;
  successMessage: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
};

type PublicFormResponse = {
  form: PublicForm;
};

type PublicSubscribeResponse = {
  ok: boolean;
  status: 'subscribed' | 'resubscribed' | 'already_subscribed';
  message: string;
};

const publicSubscribeSchema = z.object({
  email: z.email('Use a valid email address'),
  name: z.string().trim().max(120, 'Name must be 120 characters or less').optional(),
});

type PublicSubscribeFormInput = z.input<typeof publicSubscribeSchema>;
type PublicSubscribeFormValues = z.output<typeof publicSubscribeSchema>;

export function PublicSubscribePage() {
  const { formSlug } = useParams();
  const formQuery = useQuery({
    queryKey: ['public-form', formSlug],
    queryFn: async () => {
      if (!formSlug) {
        throw new Error('Signup form is unavailable.');
      }

      const client = requireSupabaseClient();
      const { data, error } = await client.functions.invoke<PublicFormResponse>('get-public-form', {
        body: { slug: formSlug },
      });

      if (error) {
        throw new Error(error.message || 'Signup form could not be loaded.');
      }

      if (!data?.form) {
        throw new Error('Signup form is unavailable.');
      }

      return data.form;
    },
    enabled: Boolean(formSlug) && isSupabaseConfigured,
    retry: false,
  });
  const subscribe = useMutation({
    mutationFn: async (values: PublicSubscribeFormValues) => {
      if (!formSlug) {
        throw new Error('Signup form is unavailable.');
      }

      const client = requireSupabaseClient();
      const { data, error } = await client.functions.invoke<PublicSubscribeResponse>('public-subscribe', {
        body: {
          slug: formSlug,
          email: values.email,
          name: values.name?.trim() || null,
        },
      });

      if (error) {
        throw new Error(error.message || 'Subscription could not be completed.');
      }

      if (!data?.ok) {
        throw new Error('Subscription could not be completed.');
      }

      return data;
    },
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<PublicSubscribeFormInput, unknown, PublicSubscribeFormValues>({
    resolver: zodResolver(publicSubscribeSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });
  const form = formQuery.data;
  const backgroundColor = form?.backgroundColor ?? '#ffffff';
  const textColor = form?.textColor ?? '#171717';
  const buttonColor = form?.buttonColor ?? '#171717';
  const buttonTextColor = form?.buttonTextColor ?? '#ffffff';

  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center px-4 py-12"
      style={{ color: textColor }}
    >
      <div
        className="w-full rounded-lg border border-neutral-200 p-6 shadow-sm"
        style={{ backgroundColor }}
      >
        <p className="font-display text-xs font-semibold tracking-[0.16em] uppercase opacity-70">Newsletter signup</p>

        {!isSupabaseConfigured ? (
          <PublicSubscribeMessage
            title="Signup form unavailable"
            description="Supabase is not configured for public signup requests."
          />
        ) : null}

        {formQuery.isLoading ? (
          <PublicSubscribeMessage title="Loading signup form" description="Preparing this newsletter signup form." />
        ) : null}

        {formQuery.isError ? (
          <PublicSubscribeMessage title="Signup form unavailable" description={formQuery.error.message} />
        ) : null}

        {form ? (
          <>
            <h1 className="font-display mt-3 text-2xl font-semibold">{form.heading}</h1>

            {subscribe.isSuccess ? (
              <PublicSubscribeMessage
                title={subscribe.data.status === 'already_subscribed' ? 'Already subscribed' : 'Subscription confirmed'}
                description={subscribe.data.message}
              />
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => subscribe.mutate(values))}>
                <div>
                  <Input label="Email" type="email" placeholder="reader@example.com" {...register('email')} />
                  {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
                </div>
                <div>
                  <Input label="Name" type="text" placeholder="Optional" {...register('name')} />
                  {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name.message}</p> : null}
                </div>

                {subscribe.error ? (
                  <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
                    {subscribe.error.message}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={subscribe.isPending}
                  style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                >
                  {subscribe.isPending ? 'Subscribing...' : form.buttonText}
                </Button>
              </form>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}

type PublicSubscribeMessageProps = {
  title: string;
  description: string;
};

function PublicSubscribeMessage({ description, title }: PublicSubscribeMessageProps) {
  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 text-neutral-800">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
}
