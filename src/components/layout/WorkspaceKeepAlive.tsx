import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import {
  UNSAFE_LocationContext,
  useLocation,
  useNavigationType,
  useOutlet,
  type Location,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import {
  clearWorkspaceMemory,
  rememberWorkspacePath,
  workspaceKey,
  type WorkspaceKey,
} from '@/utils/workspaceMemory';

/** Hidden workspaces must not redirect or overwrite the visible role. */
export const WorkspaceLiveContext = createContext(true);

export function useWorkspaceLive(): boolean {
  return useContext(WorkspaceLiveContext);
}

type Slot = {
  node: ReactNode;
  location: Location;
};

/**
 * Keeps pet parent, doctor, clinic, and admin trees mounted across Switch role.
 * Typed fields live in those trees, so leaving the portal does not wipe them.
 */
export function WorkspaceKeepAlive() {
  const outlet = useOutlet();
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.authReducer.isAuthenticated);
  const slots = useRef(new Map<WorkspaceKey, Slot>());
  const key = workspaceKey(location.pathname);

  useEffect(() => {
    if (!isAuthenticated) {
      slots.current.clear();
      clearWorkspaceMemory();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated && slots.current.size > 0) {
    slots.current.clear();
    clearWorkspaceMemory();
  }

  if (key && outlet) {
    rememberWorkspacePath(location.pathname, location.search, location.hash);
    slots.current.set(key, { node: outlet, location });
  }

  const ordered = [...slots.current.entries()].sort((a, b) => {
    if (a[0] === key) return -1;
    if (b[0] === key) return 1;
    return 0;
  });

  return (
    <>
      {ordered.map(([slotKey, slot]) => (
        <WorkspaceFrame key={slotKey} live={slotKey === key} location={slot.location}>
          {slot.node}
        </WorkspaceFrame>
      ))}
      {!key ? outlet : null}
    </>
  );
}

function WorkspaceFrame({
  live,
  location,
  children,
}: {
  live: boolean;
  location: Location;
  children: ReactNode;
}) {
  const realLocation = useLocation();
  const navigationType = useNavigationType();
  return (
    <div hidden={!live} style={live ? { display: 'contents' } : undefined} aria-hidden={live ? undefined : true}>
      <UNSAFE_LocationContext.Provider
        value={{
          location: live ? realLocation : location,
          navigationType: live ? navigationType : 'POP',
        }}
      >
        <WorkspaceLiveContext.Provider value={live}>{children}</WorkspaceLiveContext.Provider>
      </UNSAFE_LocationContext.Provider>
    </div>
  );
}
