import { DemoLayout } from '../../app/layouts/DemoLayout';
import { DemoWorkspaceProvider } from './DemoWorkspaceProvider';

export function DemoWorkspaceRoute() {
  return (
    <DemoWorkspaceProvider>
      <DemoLayout />
    </DemoWorkspaceProvider>
  );
}
