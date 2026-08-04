import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppRole, getRoleLabel, getPortalPath } from '@/utils/roles';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/module/store/store';
import { setActiveRole } from '@/module/slice/AuthSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface RoleSelectModalProps {
  open: boolean;
  roles: AppRole[];
  onOpenChange?: (open: boolean) => void;
}

export function RoleSelectModal({ open, roles, onOpenChange }: RoleSelectModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSelect = (role: AppRole) => {
    dispatch(setActiveRole(role));
    toast.success(`Continuing as ${getRoleLabel(role)}`);
    onOpenChange?.(false);
    navigate(getPortalPath(role), { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your role</DialogTitle>
          <DialogDescription>
            You have more than one assigned role. Select which workspace to open for this session.
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
                <span className="font-semibold">{getRoleLabel(role)}</span>
                <span className="text-xs text-muted-foreground">{getPortalPath(role)}</span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
