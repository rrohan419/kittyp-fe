import { useDispatch, useSelector } from 'react-redux';
import { Building2, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ClinicModel } from '@/services/clinicService';
import { cn } from '@/lib/utils';

interface ClinicSwitcherProps {
  className?: string;
}

export function ClinicSwitcher({ className }: ClinicSwitcherProps) {
  const dispatch = useDispatch<AppDispatch>();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const { clinics, clinic, loading } = useActiveClinic();

  const select = (next: ClinicModel) => {
    dispatch(setActiveClinic(next.uuid));
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
      <Button variant="outline" size="sm" disabled className={className}>
        <Building2 className="h-4 w-4 mr-2" />
        No clinics yet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('max-w-full', className)}>
          <Building2 className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate max-w-[160px]">{clinic?.name ?? 'Select clinic'}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 ml-2 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Your clinics</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clinics.map((item) => (
          <DropdownMenuItem key={item.uuid} onClick={() => select(item)}>
            <Check
              className={`h-4 w-4 mr-2 ${item.uuid === (activeClinicId ?? clinic?.uuid) ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              {item.address && (
                <p className="truncate text-[11px] text-muted-foreground">{item.address}</p>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
