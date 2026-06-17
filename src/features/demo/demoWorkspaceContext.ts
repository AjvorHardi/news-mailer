import { createContext, useContext } from 'react';
import type { DataRepositories } from '../../lib/repositories/contracts';

export type DemoWorkspaceContextValue = {
  newsletterId: string;
  mode: 'app' | 'demo';
  repositories: DataRepositories;
};

export const DemoWorkspaceContext = createContext<DemoWorkspaceContextValue | null>(null);

export function useDemoWorkspace() {
  const context = useContext(DemoWorkspaceContext);

  if (!context) {
    throw new Error('useDemoWorkspace must be used within a workspace provider');
  }

  return context;
}
