import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resetDemoState } from '../../lib/demo-storage';
import type { Campaign } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

export type DemoOverviewData = {
  newsletterName: string;
  newsletterDescription: string | null;
  subscriberCount: number;
  subscribedCount: number;
  formCount: number;
  campaignCount: number;
  recentCampaigns: Campaign[];
};

export function useDemoOverview() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: ['demo', 'overview', newsletterId],
    queryFn: async (): Promise<DemoOverviewData> => {
      const [newsletter, subscribers, forms, campaigns] = await Promise.all([
        repositories.newsletters.get(newsletterId),
        repositories.subscribers.list(newsletterId),
        repositories.signupForms.list(newsletterId),
        repositories.campaigns.list(newsletterId),
      ]);

      if (!newsletter) {
        throw new Error('Demo newsletter not found');
      }

      const recentCampaigns = [...campaigns]
        .sort((firstCampaign, secondCampaign) => secondCampaign.updatedAt.localeCompare(firstCampaign.updatedAt))
        .slice(0, 5);

      return {
        newsletterName: newsletter.name,
        newsletterDescription: newsletter.description,
        subscriberCount: subscribers.length,
        subscribedCount: subscribers.filter((subscriber) => subscriber.status === 'subscribed').length,
        formCount: forms.length,
        campaignCount: campaigns.length,
        recentCampaigns,
      };
    },
  });
}

export function useResetDemoData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => resetDemoState(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['demo'] });
    },
  });
}
