import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PetNameType } from '@/components/ui/PetNameType';
import { PatientSearchScope, type PatientSearchScopeValue } from './PatientSearchScope';
import { searchPatientsForAppointment } from '@/services/appointmentPatientSearch';
import { APPOINTMENT_SEARCH_MIN, normalizeAppointmentSearchQuery } from '@/utils/appointmentPatientSearch';
import type { AppointmentSearchHit } from '@/utils/appointmentSearchResults';

type Props = {
  clinicUuid: string;
  scope: PatientSearchScopeValue;
  onScopeChange: (scope: PatientSearchScopeValue) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (hit: AppointmentSearchHit) => void;
  disabled?: boolean;
  paused?: boolean;
  autoFocus?: boolean;
  inputId: string;
  emptyAction?: string;
  includePhone?: boolean;
};

export function PatientSearch({
  clinicUuid, scope, onScopeChange, query, onQueryChange, onSelect,
  disabled = false, paused = false, autoFocus = false, inputId,
  emptyAction = 'New patient', includePhone = false,
}: Props) {
  const [hits, setHits] = useState<AppointmentSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setHits([]);
    setFailed(false);
    setSearching(false);
    const q = normalizeAppointmentSearchQuery(query);
    if (!clinicUuid || paused || q.length < APPOINTMENT_SEARCH_MIN) return;
    const timer = setTimeout(() => {
      setSearching(true);
      void searchPatientsForAppointment(clinicUuid, q, scope, includePhone)
        .then((results) => { if (!cancelled) setHits(results); })
        .catch((error: unknown) => {
          console.error('Patient search failed', error);
          if (!cancelled) {
            setFailed(true);
            toast.error('Could not search patients — try again');
          }
        })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [clinicUuid, query, scope, paused, attempt, includePhone]);

  return (
    <div className="space-y-2">
      <PatientSearchScope value={scope} onChange={onScopeChange} disabled={disabled || paused} />
      <p className="text-xs text-muted-foreground">
        {scope === 'local' ? 'Search clients and enrolled pets at this clinic.' : 'Search clinic records and KittyP pet parents and pets.'}
      </p>
      <Label htmlFor={inputId}>
        {includePhone ? 'Search by pet or parent name, email, phone, or ID' : 'Search by pet or parent name, email, or ID'}
      </Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input id={inputId} className="pl-8" value={query} onChange={(e) => onQueryChange(e.target.value)}
          placeholder={includePhone ? 'Pet or parent name, email, phone, or ID...' : 'Pet or parent name, email, or ID...'}
          disabled={disabled || paused} autoFocus={autoFocus} />
      </div>
      {!paused ? (
        <div className="border rounded-md max-h-52 overflow-y-auto divide-y" aria-live="polite">
          {searching || disabled ? (
            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : failed ? (
            <div className="p-3 text-sm text-muted-foreground">
              Search failed.
              <Button type="button" variant="link" size="sm" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
            </div>
          ) : hits.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {normalizeAppointmentSearchQuery(query).length < APPOINTMENT_SEARCH_MIN
                ? `Type at least 3 characters of a name, email, ${includePhone ? 'phone, ' : ''}or generated ID`
                : scope === 'local'
                  ? `No local match — try Global search or ${emptyAction}`
                  : `No match for that search — try ${emptyAction}`}
            </p>
          ) : hits.map((hit) => (
            <button key={hit.kind === 'user' ? `user-${hit.user.userUuid}` : hit.kind === 'client'
              ? `client-${hit.owner.ownerUuid}` : `pet-${hit.pet.petUuid}`}
              type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60"
              onClick={() => onSelect(hit)}>
              {hit.kind === 'user' ? (
                <>
                  <div className="font-medium flex items-center gap-2">{hit.user.name || hit.user.email}
                    <Badge variant="secondary" className="text-[10px] font-normal">KittyP</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{hit.user.email}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{hit.user.userUuid}</p>
                </>
              ) : hit.kind === 'client' ? (
                <>
                  <div className="font-medium">{hit.owner.name}</div>
                  <p className="text-xs text-muted-foreground truncate">{hit.owner.email}</p>
                  <p className="text-xs text-muted-foreground">No enrolled pets</p>
                </>
              ) : (
                <>
                  <PetNameType name={hit.pet.name} type={hit.pet.species} />
                  <p className="text-xs text-muted-foreground truncate">
                    {(hit.kind === 'platformPet'
                      ? [hit.user.name, hit.user.email]
                      : [hit.pet.ownerName, hit.pet.ownerEmail]).filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {[hit.pet.patientNumber, hit.pet.globalPetId || hit.pet.petUuid].filter(Boolean).join(' · ')}
                  </p>
                  {hit.kind === 'platformPet' && !hit.pet.clinicPatient
                    ? <p className="text-xs text-muted-foreground">Not enrolled at this clinic</p> : null}
                </>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
