import type { ReactNode } from 'react';
import clsx from 'clsx';

type PageHeaderProps = {
  actionsLayout?: 'default' | 'responsive-inline';
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ actionsLayout = 'default', eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div
      className={clsx(
        'flex gap-5 border-b border-neutral-200 pb-6',
        actionsLayout === 'default' && 'flex-col sm:flex-row sm:items-end sm:justify-between',
        actionsLayout === 'responsive-inline' &&
          'flex-col min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between',
      )}
    >
      <div>
        {eyebrow ? (
          <p className="font-display text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">{eyebrow}</p>
        ) : null}
        <h1
          className={clsx(
            'font-display mt-2 text-3xl font-semibold text-neutral-950',
            actionsLayout === 'responsive-inline' && 'whitespace-nowrap',
          )}
        >
          {title}
        </h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
