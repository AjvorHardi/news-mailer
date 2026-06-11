import { Navigate, Route, Routes } from 'react-router';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../../features/auth/LoginPage';
import { RegisterPage } from '../../features/auth/RegisterPage';
import { DemoHomePage } from '../../features/demo/DemoHomePage';
import { MarketingHomePage } from '../../features/marketing/MarketingHomePage';
import { PublicSubscribePage } from '../../features/public-subscribe/PublicSubscribePage';
import { PublicUnsubscribePage } from '../../features/public-unsubscribe/PublicUnsubscribePage';
import { ActivityPage } from '../../features/activity/ActivityPage';
import { CampaignsPage } from '../../features/campaigns/CampaignsPage';
import { FormsPage } from '../../features/forms/FormsPage';
import { NewsletterOverviewPage } from '../../features/newsletters/NewsletterOverviewPage';
import { NewsletterSelectPage } from '../../features/newsletters/NewsletterSelectPage';
import { SegmentsPage } from '../../features/segments/SegmentsPage';
import { SettingsPage } from '../../features/settings/SettingsPage';
import { SubscribersPage } from '../../features/subscribers/SubscribersPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<MarketingHomePage />} />
        <Route path="demo" element={<DemoHomePage />} />
        <Route path="subscribe/:formSlug" element={<PublicSubscribePage />} />
        <Route path="unsubscribe/:token" element={<PublicUnsubscribePage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="app" element={<AppLayout />}>
          <Route index element={<NewsletterSelectPage />} />
          <Route path="newsletters/:newsletterId">
            <Route index element={<NewsletterOverviewPage />} />
            <Route path="subscribers" element={<SubscribersPage />} />
            <Route path="forms" element={<FormsPage />} />
            <Route path="segments" element={<SegmentsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
