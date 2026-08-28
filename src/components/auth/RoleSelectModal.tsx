import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppRole, getContinueAsLabel, getPortalPath, getRoleLabel } from '@/utils/roles';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/module/store/store';
import { setActiveRole } from '@/module/slice/AuthSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  clearDefaultWorkspace,
  getDefaultWorkspace,
  setDefaultWorkspace,
} from '@/utils/workspacePreference';

interface RoleSelectModalProps {
  open: boolean;
  roles: AppRole[];
  onOpenChange?: (open: boolean) => void;
  /** Optional post-selection redirect (e.g. ?redirect=). */
  redirectTo?: string | null;
}

export function RoleSelectModal({ open, roles, onOpenChange, redirectTo }: RoleSelectModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [saveAsDefault, setSaveAsDefault] = useState(() => !!getDefaultWorkspace());

  const handleSelect = (role: AppRole) => {
    dispatch(setActiveRole(role));
    if (saveAsDefault) {
      setDefaultWorkspace(role);
    } else {
      clearDefaultWorkspace();
    }
    toast.success(getContinueAsLabel(role));
    onOpenChange?.(false);
    const target =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : getPortalPath(role);
    navigate(target, { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your workspace</DialogTitle>
          <DialogDescription>
            You have more than one role. Pick which workspace to open.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {roles.map((role) => (
            <Button
              key={role}
              variant="secondary"
              className="w-full justify-start h-auto py-3"
              onClick={() => handleSelect(role)}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold">{getContinueAsLabel(role)}</span>
                <span className="text-xs text-muted-foreground">
                  {getRoleLabel(role)} · {getPortalPath(role)}
                </span>
              </div>
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-2 pt-3 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={saveAsDefault}
            onChange={(e) => setSaveAsDefault(e.target.checked)}
          />
          Save as default workspace
        </label>
      </DialogContent>
    </Dialog>
  );
}

/** Brief-aligned alias for the post-login multi-role picker. */
export const PostLoginRoleSelector = RoleSelectModal;
