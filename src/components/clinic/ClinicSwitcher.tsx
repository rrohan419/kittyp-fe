import { useDispatch, useSelector } from 'react-redux';
import { Building2, ChevronsUpDown, Check, Plus } from 'lucide-react';
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
import { Link } from 'react-router-dom';
import { hasAnyRole, ROLES } from '@/utils/roles';

interface ClinicSwitcherProps {
  className?: string;
}

export function ClinicSwitcher({ className }: ClinicSwitcherProps) {
  const dispatch = useDispatch<AppDispatch>();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const user = useSelector((s: RootState) => s.authReducer.user);
  const { clinics, clinic, loading, refresh } = useActiveClinic();
  const canAddClinic = hasAnyRole(user?.roles, [ROLES.CLINIC_ADMIN, ROLES.DOCTOR]);

  const select = async (next: ClinicModel) => {
    if (next.uuid === activeClinicId) return;
    try {
      await switchClinic(next.uuid);
      dispatch(setActiveClinic(next.uuid));
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not switch clinic');
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Building2 className="h-4 w-4 mr-2" />
        Loading clinics…
      </Button>
    );
  }

  if (!clinics.length) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button variant="outline" size="sm" disabled>
          <Building2 className="h-4 w-4 mr-2" />
          No clinics yet
        </Button>
        {canAddClinic && (
          <Button variant="default" size="sm" asChild>
            <Link to="/clinic/clinics/new">
              <Plus className="h-4 w-4 mr-1" />
              Add clinic
            </Link>
          </Button>
        )}
      </div>
    );
  }

  const isShutdown = clinic?.status === 'SHUTDOWN';
  const addClinicPath = hasAnyRole(user?.roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF])
    ? '/clinic/clinics/new'
    : '/doctor/clinics/new';

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'max-w-full',
              isShutdown && 'border-red-200 bg-red-50/80 text-red-800 hover:bg-red-50 hover:text-red-900'
            )}
          >
            <Building2 className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate max-w-[160px]">{clinic?.name ?? 'Select clinic'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 ml-2 opacity-60 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Your clinics</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {clinics.map((item) => {
            const itemShutdown = item.status === 'SHUTDOWN';
            return (
              <DropdownMenuItem
                key={item.uuid}
                onClick={() => select(item)}
                className={cn(itemShutdown && 'bg-red-50/70 focus:bg-red-50 text-red-900')}
              >
                <Check
                  className={`h-4 w-4 mr-2 shrink-0 ${item.uuid === (activeClinicId ?? clinic?.uuid) ? 'opacity-100' : 'opacity-0'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {itemShutdown && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 shrink-0 bg-red-50 text-red-700 border-red-200"
                      >
                        Shutdown
                      </Badge>
                    )}
                  </div>
                  {item.address && (
                    <p className="truncate text-[11px] text-muted-foreground">{item.address}</p>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
          {canAddClinic && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={addClinicPath} className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add clinic
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
