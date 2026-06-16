import { useMemo, type ReactNode } from 'react';
import { createDemoRepositories, DEMO_NEWSLETTER_ID } from '../../lib/demo-storage';
import { DemoWorkspaceContext } from './demoWorkspaceContext';

type DemoWorkspaceProviderProps = {
  children: ReactNode;
};

export function DemoWorkspaceProvider({ children }: DemoWorkspaceProviderProps) {
  const repositories = useMemo(() => createDemoRepositories(), []);

  return (
    <DemoWorkspaceContext.Provider value={{ newsletterId: DEMO_NEWSLETTER_ID, mode: 'demo', repositories }}>
      {children}
    </DemoWorkspaceContext.Provider>
  );
}
