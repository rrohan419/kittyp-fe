import { useDispatch, useSelector } from 'react-redux';
import { Building2, ChevronsUpDown, Check, Plus, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ClinicModel, switchClinic } from '@/services/clinicService';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { hasAnyRole, ROLES } from '@/utils/roles';
import { useMemo, useState } from 'react';
import { clearStuckUiLocks } from '@/utils/clearStuckUiLocks';

interface ClinicSwitcherProps {
  className?: string;
}

export function ClinicSwitcher({ className }: ClinicSwitcherProps) {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const user = useSelector((s: RootState) => s.authReducer.user);
  const { clinics, clinic, loading, refresh } = useActiveClinic();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const onDoctorPortal = location.pathname.startsWith('/doctor');
  // Only clinic accounts create clinics. Doctors never register a clinic from this switcher.
  const canAddClinic =
    !onDoctorPortal && hasAnyRole(user?.roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF]);
  // Personal practice is doctor-only. Clinic portal only switches branches.
  const showPersonal = onDoctorPortal;

  const ordered = useMemo(() => {
    if (!showPersonal) {
      return [...clinics].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    const personal = clinics.filter((c) => c.personal);
    const rest = clinics.filter((c) => !c.personal);
    return [...personal, ...rest];
  }, [clinics, showPersonal]);

  const select = async (next: ClinicModel) => {
    if (next.uuid === activeClinicId || switching) return;
    setOpen(false);
    clearStuckUiLocks();
    setSwitching(true);
    try {
      await switchClinic(next.uuid);
      dispatch(setActiveClinic(next.uuid));
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not switch clinic');
    } finally {
      setSwitching(false);
      // Async remounts can leave body pointer-events locked — clear after paint
      requestAnimationFrame(() => clearStuckUiLocks());
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={cn('min-w-[140px]', className)}>
        <Building2 className="h-4 w-4 mr-2" />
        Loading…
      </Button>
    );
  }

  if (!clinics.length) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button variant="outline" size="sm" disabled>
          {onDoctorPortal ? (
            <UserRound className="h-4 w-4 mr-2" />
          ) : (
            <Building2 className="h-4 w-4 mr-2" />
          )}
          {onDoctorPortal ? 'Personal' : 'No branches yet'}
        </Button>
        {canAddClinic && (
          <Button variant="default" size="sm" asChild>
            <Link to="/clinic/clinics/new">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </Button>
        )}
      </div>
    );
  }

  const isShutdown = clinic?.status === 'SHUTDOWN';
  const triggerName =
    showPersonal && clinic?.personal
      ? 'Personal'
      : clinic?.name ?? (onDoctorPortal ? 'Select practice' : 'Select branch');

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isShutdown && (
        <Badge
          variant="outline"
          className="text-[10px] shrink-0 bg-red-50 text-red-700 border-red-200"
        >
          Shutdown
        </Badge>
      )}
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(v) => {
          if (switching) return;
          setOpen(v);
          if (!v) clearStuckUiLocks();
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={switching}
            className={cn(
              'max-w-full relative z-[60]',
              isShutdown && 'border-red-200 bg-red-50/80 text-red-800 hover:bg-red-50 hover:text-red-900'
            )}
          >
            {showPersonal && clinic?.personal ? (
              <UserRound className="h-4 w-4 mr-2 shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 mr-2 shrink-0" />
            )}
            <span className="truncate max-w-[180px]">{switching ? 'Switching…' : triggerName}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 ml-2 opacity-60 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="w-72 z-[200]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel>
            {onDoctorPortal ? 'Switch practice' : 'Practice branches'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ordered.map((item) => {
            const itemShutdown = item.status === 'SHUTDOWN';
            const selected = item.uuid === (activeClinicId ?? clinic?.uuid);
            const label =
              showPersonal && item.personal ? 'Personal' : item.name || 'Practice';
            const secondary =
              showPersonal && item.personal
                ? 'Online consults'
                : [item.address, item.kittypPracticeId || item.organizationUuid]
                    .filter(Boolean)
                    .join(' · ');
            return (
              <DropdownMenuItem
                key={item.uuid}
                disabled={switching}
                onSelect={(e) => {
                  e.preventDefault();
                  void select(item);
                }}
                className={cn(itemShutdown && 'bg-red-50/70 focus:bg-red-50 text-red-900')}
              >
                <Check
                  className={`h-4 w-4 mr-2 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{label}</p>
                    {itemShutdown && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 shrink-0 bg-red-50 text-red-700 border-red-200"
                      >
                        Shutdown
                      </Badge>
                    )}
                  </div>
                  {secondary ? (
                    <p className="truncate text-[11px] text-muted-foreground">{secondary}</p>
                  ) : null}
                </div>
              </DropdownMenuItem>
            );
          })}
          {canAddClinic && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/clinic/clinics/new" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add branch
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const PracticeSwitcher = ClinicSwitcher;
