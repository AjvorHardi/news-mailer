import type { DemoState } from '../../shared/types/domain';
import { demoSeedState, DEMO_STORAGE_VERSION } from './seed';

const DEMO_STORAGE_KEY = 'news-mailer:demo-state';

function cloneDemoState(state: DemoState): DemoState {
  return structuredClone(state);
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getFreshDemoState(): DemoState {
  return cloneDemoState(demoSeedState);
}

export function loadDemoState(): DemoState {
  if (!canUseLocalStorage()) {
    return getFreshDemoState();
  }

  const rawState = window.localStorage.getItem(DEMO_STORAGE_KEY);

  if (!rawState) {
    const seededState = getFreshDemoState();
    saveDemoState(seededState);
    return seededState;
  }

  try {
    const parsedState = JSON.parse(rawState) as DemoState;

    if (parsedState.version !== DEMO_STORAGE_VERSION) {
      return resetDemoState();
    }

    return parsedState;
  } catch {
    return resetDemoState();
  }
}

export function saveDemoState(state: DemoState): DemoState {
  const nextState = cloneDemoState(state);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
}

export function resetDemoState(): DemoState {
  const seededState = getFreshDemoState();
  return saveDemoState(seededState);
}
