import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { PageHeader } from '../../shared/ui/PageHeader';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Newsletter settings"
        description="Sender details and read-only verified from email configuration will be connected later."
        actions={<Button type="button" disabled>Save settings</Button>}
      />
      <section className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-6">
        <form className="space-y-4">
          <Input label="Newsletter name" placeholder="Product Notes" disabled />
          <Input label="Description" placeholder="Weekly product updates" disabled />
          <Input label="Sender name" placeholder="NEWS-MAILER" disabled />
          <Input label="From email" placeholder="newsletter@example.com" disabled />
        </form>
      </section>
    </div>
  );
}
