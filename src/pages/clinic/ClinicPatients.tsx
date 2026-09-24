import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  PawPrint,
  Mail,
  Loader2,
  Plus,
  Phone,
  Link2,
  User,
  Building2,
  MapPin,
} from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { PetPhoto } from '@/components/clinic/PetPhoto';
import { PetPhotoField } from '@/components/clinic/PetPhotoField';
import { resolveClinicSearchTarget } from '@/utils/clinicSearchNavigate';
import {
  ClinicOwnerModel,
  ClinicPetListModel,
  OwnerEmailLookupModel,
  PlatformUserSearchModel,
  addClinicPatient,
  ensureClinicOwnerFromUser,
  fetchClinicOwners,
  fetchClinicPets,
  lookupOwnerByEmail,
  searchPlatformUsers,
  sendClientAttachOtp,
  verifyClientAttachOtp,
} from '@/services/clinicService';
import { clinicCrmPaths } from '@/utils/clinicCrmPaths';
import { toast } from 'sonner';
import { ListPager } from '@/components/ui/ListPager';
import { digitsOnlyPhone, parseApiErrorMessage, validateEmail, validatePhone } from '@/utils/validation';
import { cn } from '@/lib/utils';

type OwnerRow = ClinicOwnerModel & { clinicUuid?: string; clinicName?: string };
type PetRow = ClinicPetListModel & { clinicUuid?: string; clinicName?: string };
type AddPickerHit =
  | { kind: 'user'; user: PlatformUserSearchModel }
  | { kind: 'owner'; owner: ClinicOwnerModel };

const emptyForm = {
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerAddress: '',
  petName: '',
  petType: 'CAT',
  petBreed: '',
  petGender: '',
  petDateOfBirth: '',
  petPhotoUrl: '',
};

export default function ClinicPatients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinicUuid, clinic, clinics, isPersonalPractice } = useActiveClinic();
  const { pathname } = useLocation();
  const crm = clinicCrmPaths(pathname);
  const canAddClients = Boolean(clinicUuid) && !isPersonalPractice;
  const [tab, setTab] = useState(searchParams.get('tab') === 'pets' ? 'pets' : 'clients');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [searchAllBranches, setSearchAllBranches] = useState(false);
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [ownerPage, setOwnerPage] = useState(1);
  const [ownerTotal, setOwnerTotal] = useState(0);
  const [ownerPages, setOwnerPages] = useState(0);
  const [petPage, setPetPage] = useState(1);
  const [petTotal, setPetTotal] = useState(0);
  const [petPages, setPetPages] = useState(0);
  const [pets, setPets] = useState<PetRow[]>([]);
  const [platformUsers, setPlatformUsers] = useState<PlatformUserSearchModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectingUserUuid, setSelectingUserUuid] = useState<string | null>(null);
  const [attachUser, setAttachUser] = useState<PlatformUserSearchModel | null>(null);
  const [attachCode, setAttachCode] = useState('');
  const [attachSending, setAttachSending] = useState(false);
  const [attachVerifying, setAttachVerifying] = useState(false);
  const [pickerQ, setPickerQ] = useState('');
  const [pickerHits, setPickerHits] = useState<AddPickerHit[]>([]);
  const [pickerSearching, setPickerSearching] = useState(false);
  const [emailLookup, setEmailLookup] = useState<OwnerEmailLookupModel | null>(null);
  const [matchedOwner, setMatchedOwner] = useState<ClinicOwnerModel | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    setOwnerPage(1);
    setPetPage(1);
  }, [search, clinicUuid, searchAllBranches]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = searchParams.get('tab') === 'pets' ? 'pets' : 'clients';
    setSearch(q);
    setTab(t);
  }, [searchParams]);

  const reload = async () => {
    if (!clinicUuid && !searchAllBranches) {
      setOwners([]);
      setPets([]);
      setPlatformUsers([]);
      return;
    }
    if (searchAllBranches) {
      const results = await Promise.all(
        clinics.map(async (c) => {
          const [o, p, users] = await Promise.all([
            fetchClinicOwners(c.uuid, search || undefined, { pageNumber: 1, pageSize: 20 }),
            fetchClinicPets(c.uuid, search || undefined, { pageNumber: 1, pageSize: 20 }),
            search.trim().length >= 3
              ? searchPlatformUsers(c.uuid, search.trim())
              : Promise.resolve([]),
          ]);
          return {
            owners: (o.models ?? []).map((row) => ({ ...row, clinicUuid: c.uuid, clinicName: c.name })),
            pets: (p.models ?? []).map((row) => ({ ...row, clinicUuid: c.uuid, clinicName: c.name })),
            ownerTotal: o.totalElements ?? 0,
            petTotal: p.totalElements ?? 0,
            users,
          };
        })
      );
      setOwners(results.flatMap((r) => r.owners));
      setPets(results.flatMap((r) => r.pets));
      setOwnerTotal(results.reduce((sum, r) => sum + r.ownerTotal, 0));
      setPetTotal(results.reduce((sum, r) => sum + r.petTotal, 0));
      setOwnerPages(0);
      setPetPages(0);
      // Dedupe platform users by userUuid across branches
      const seen = new Set<string>();
      const merged: PlatformUserSearchModel[] = [];
      for (const u of results.flatMap((r) => r.users)) {
        if (seen.has(u.userUuid)) continue;
        seen.add(u.userUuid);
        merged.push(u);
      }
      setPlatformUsers(merged);
      return;
    }
    const [o, p, users] = await Promise.all([
      fetchClinicOwners(clinicUuid!, search || undefined, { pageNumber: ownerPage, pageSize: 20 }),
      fetchClinicPets(clinicUuid!, search || undefined, { pageNumber: petPage, pageSize: 20 }),
      search.trim().length >= 3
        ? searchPlatformUsers(clinicUuid!, search.trim())
        : Promise.resolve([]),
    ]);
    setOwners((o.models ?? []).map((row) => ({ ...row, clinicUuid: clinicUuid!, clinicName: clinic?.name })));
    setPets((p.models ?? []).map((row) => ({ ...row, clinicUuid: clinicUuid!, clinicName: clinic?.name })));
    setOwnerTotal(o.totalElements ?? 0);
    setOwnerPages(o.totalPages ?? 0);
    setPetTotal(p.totalElements ?? 0);
    setPetPages(p.totalPages ?? 0);
    setPlatformUsers(users);
  };

  useEffect(() => {
    if (!clinicUuid && !searchAllBranches) {
      setOwners([]);
      setPets([]);
      setPlatformUsers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Clear previous branch data immediately on switch
    setOwners([]);
    setPets([]);
    setPlatformUsers([]);
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        if (searchAllBranches) {
          const results = await Promise.all(
            clinics.map(async (c) => {
              const [o, p, users] = await Promise.all([
                fetchClinicOwners(c.uuid, search || undefined, { pageNumber: 1, pageSize: 20 }),
                fetchClinicPets(c.uuid, search || undefined, { pageNumber: 1, pageSize: 20 }),
                  search.trim().length >= 3
                    ? searchPlatformUsers(c.uuid, search.trim())
                    : Promise.resolve([]),
              ]);
              return {
                owners: (o.models ?? []).map((row) => ({ ...row, clinicUuid: c.uuid, clinicName: c.name })),
                pets: (p.models ?? []).map((row) => ({ ...row, clinicUuid: c.uuid, clinicName: c.name })),
                ownerTotal: o.totalElements ?? 0,
                petTotal: p.totalElements ?? 0,
                users,
              };
            })
          );
          if (!cancelled) {
            setOwners(results.flatMap((r) => r.owners));
            setPets(results.flatMap((r) => r.pets));
            setOwnerTotal(results.reduce((sum, r) => sum + r.ownerTotal, 0));
            setPetTotal(results.reduce((sum, r) => sum + r.petTotal, 0));
            setOwnerPages(0);
            setPetPages(0);
            const seen = new Set<string>();
            const merged: PlatformUserSearchModel[] = [];
            for (const u of results.flatMap((r) => r.users)) {
              if (seen.has(u.userUuid)) continue;
              seen.add(u.userUuid);
              merged.push(u);
            }
            setPlatformUsers(merged);
          }
        } else if (clinicUuid) {
          const [o, p, users] = await Promise.all([
            fetchClinicOwners(clinicUuid, search || undefined, { pageNumber: ownerPage, pageSize: 20 }),
            fetchClinicPets(clinicUuid, search || undefined, { pageNumber: petPage, pageSize: 20 }),
            search.trim().length >= 3
              ? searchPlatformUsers(clinicUuid, search.trim())
              : Promise.resolve([]),
          ]);
          if (!cancelled) {
            setOwners((o.models ?? []).map((row) => ({ ...row, clinicUuid, clinicName: clinic?.name })));
            setPets((p.models ?? []).map((row) => ({ ...row, clinicUuid, clinicName: clinic?.name })));
            setOwnerTotal(o.totalElements ?? 0);
            setOwnerPages(o.totalPages ?? 0);
            setPetTotal(p.totalElements ?? 0);
            setPetPages(p.totalPages ?? 0);
            setPlatformUsers(users);
          }
        }
      } catch {
        if (!cancelled) {
          setOwners([]);
          setPets([]);
          setPlatformUsers([]);
          toast.error('Failed to load clients & pets');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [clinicUuid, search, searchAllBranches, clinics, clinic?.name, ownerPage, petPage]);

  // When a header/list search uniquely identifies a pet or owner, open that entity directly.
  useEffect(() => {
    if (loading || searchAllBranches || !clinicUuid) return;
    const q = search.trim();
    if (q.length < 2) return;
    let cancelled = false;
    void resolveClinicSearchTarget(clinicUuid, q).then((target) => {
      if (!cancelled && target) {
        navigate(target, { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loading, search, clinicUuid, searchAllBranches, owners.length, pets.length, navigate]);

  const resetAddDialog = () => {
    setForm(emptyForm);
    setPickerQ('');
    setPickerHits([]);
    setEmailLookup(null);
    setMatchedOwner(null);
    setAttachUser(null);
    setAttachCode('');
    setFieldErrors({});
  };

  const selectPlatformUser = async (user: PlatformUserSearchModel) => {
    const targetClinic = clinicUuid;
    if (!targetClinic) {
      toast.error('Select a clinic first');
      return;
    }
    if (user.alreadyClient && user.clinicOwnerUuid) {
      setAddOpen(false);
      navigate(crm.owner(user.clinicOwnerUuid));
      return;
    }
    if (!canAddClients) {
      toast.error('Switch to an affiliated clinic to add this client');
      return;
    }
    setAddOpen(true);
    setMatchedOwner(null);
    setAttachUser(user);
    setAttachCode('');
    setForm((s) => ({
      ...s,
      ownerFirstName: user.name?.split(/\s+/)[0] || '',
      ownerLastName: user.name?.split(/\s+/).slice(1).join(' ') || '',
      ownerEmail: user.email || '',
      ownerPhone: digitsOnlyPhone(user.phone || ''),
    }));
  };

  const applyLookupHit = (hit: OwnerEmailLookupModel) => {
    setEmailLookup(hit);
    if (!hit.found) {
      setMatchedOwner(null);
      return;
    }
    if (hit.owner) {
      setMatchedOwner(hit.owner);
      setAttachUser(hit.owner.linked ? null : hit.platformUser ?? null);
      return;
    }
    if (hit.platformUser) {
      setMatchedOwner(null);
      setAttachUser(hit.platformUser);
    }
  };

  const runContactLookup = async (raw: string) => {
    if (!clinicUuid || !raw.trim()) return;
    const value = raw.trim();
    const emailErr = value.includes('@') ? validateEmail(value) : null;
    if (emailErr) {
      setFieldErrors((s) => ({ ...s, ownerEmail: emailErr }));
      return;
    }
    try {
      const hit = await lookupOwnerByEmail(clinicUuid, value);
      applyLookupHit(hit);
    } catch {
      setEmailLookup(null);
    }
  };

  const handleSendAttachOtp = async () => {
    if (!clinicUuid || !attachUser) return;
    setAttachSending(true);
    try {
      await sendClientAttachOtp(clinicUuid, attachUser.userUuid);
      toast.success('Confirmation code sent to their email');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not send confirmation code';
      toast.error(message);
    } finally {
      setAttachSending(false);
    }
  };

  const handleVerifyAttachOtp = async () => {
    if (!clinicUuid || !attachUser || !attachCode.trim()) return;
    setAttachVerifying(true);
    try {
      await verifyClientAttachOtp(clinicUuid, attachUser.userUuid, attachCode.trim());
      const owner = await ensureClinicOwnerFromUser(clinicUuid, attachUser.userUuid);
      const pending = (owner.pets ?? []).filter((pet) => pet.clinicPatient === false);
      toast.success(`${owner.name} attached as clinic client`);
      if (pending.length > 1) {
        toast.message('This client has more than one pet. Choose which ones to associate with the clinic.');
      }
      resetAddDialog();
      setAddOpen(false);
      navigate(crm.owner(owner.ownerUuid));
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Could not attach user'));
    } finally {
      setAttachVerifying(false);
    }
  };

  useEffect(() => {
    if (!addOpen || !clinicUuid) {
      setPickerHits([]);
      return;
    }
    const q = pickerQ.trim();
    if (q.length < 3) {
      setPickerHits([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        setPickerSearching(true);
        try {
          const [users, ownersPage] = await Promise.all([
            searchPlatformUsers(clinicUuid, q),
            fetchClinicOwners(clinicUuid, q, { pageNumber: 1, pageSize: 10 }),
          ]);
          if (cancelled) return;
          const hits: AddPickerHit[] = [];
          const seenOwner = new Set<string>();
          for (const user of users) {
            hits.push({ kind: 'user', user });
            if (user.clinicOwnerUuid) seenOwner.add(user.clinicOwnerUuid);
          }
          for (const owner of ownersPage.models ?? []) {
            if (seenOwner.has(owner.ownerUuid)) continue;
            hits.push({ kind: 'owner', owner });
          }
          setPickerHits(hits);
        } catch {
          if (!cancelled) setPickerHits([]);
        } finally {
          if (!cancelled) setPickerSearching(false);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [addOpen, clinicUuid, pickerQ]);

  const onTabChange = (value: string) => {
    setTab(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'pets') next.set('tab', 'pets');
    else next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set('q', value.trim());
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicUuid || !canAddClients) return;
    if (attachUser) {
      toast.error('This KittyP account is already registered. Send the confirmation email to attach them.');
      return;
    }
    if (matchedOwner) {
      toast.error('This person is already a client. Open their profile instead of creating a duplicate.');
      return;
    }
    const emailErr = validateEmail(form.ownerEmail);
    const phoneErr = validatePhone(form.ownerPhone, true);
    if (!form.ownerFirstName.trim()) {
      toast.error('Owner first name is required');
      return;
    }
    if (emailErr) {
      toast.error(emailErr);
      setFieldErrors((s) => ({ ...s, ownerEmail: emailErr }));
      return;
    }
    if (phoneErr) {
      toast.error(phoneErr);
      setFieldErrors((s) => ({ ...s, ownerPhone: phoneErr }));
      return;
    }
    if (!form.petName.trim()) {
      toast.error('Pet name is required');
      return;
    }
    setSaving(true);
    try {
      const hitEmail = await lookupOwnerByEmail(clinicUuid, form.ownerEmail.trim());
      if (hitEmail?.found) {
        applyLookupHit(hitEmail);
        toast.error(
          hitEmail.platformUser
            ? 'This email is already registered on KittyP. Send a confirmation email to attach them.'
            : 'This email is already a client of this clinic.'
        );
        return;
      }
      const phone = digitsOnlyPhone(form.ownerPhone);
      if (phone.length === 10) {
        const hitPhone = await lookupOwnerByEmail(clinicUuid, phone);
        if (hitPhone?.found) {
          applyLookupHit(hitPhone);
          toast.error(
            hitPhone.platformUser
              ? 'This phone is already registered on KittyP. Send a confirmation email to attach them.'
              : 'This phone is already a client of this clinic.'
          );
          return;
        }
      }
      const detail = await addClinicPatient(clinicUuid, {
        ownerFirstName: form.ownerFirstName.trim(),
        ownerLastName: form.ownerLastName.trim() || undefined,
        ownerEmail: form.ownerEmail.trim(),
        ownerPhone: digitsOnlyPhone(form.ownerPhone),
        ownerAddress: form.ownerAddress.trim() || undefined,
        petName: form.petName.trim(),
        petType: form.petType.trim() || undefined,
        petBreed: form.petBreed.trim() || undefined,
        petGender: form.petGender.trim() || undefined,
        petDateOfBirth: form.petDateOfBirth || undefined,
        petPhotoUrl: form.petPhotoUrl.trim() || undefined,
      });
      toast.success('Client & pet added');
      resetAddDialog();
      setAddOpen(false);
      setSearchAllBranches(false);
      await reload();
      const petUuid = detail.patient?.petUuid;
      if (petUuid) navigate(crm.pet(petUuid));
    } catch (err: unknown) {
      const message = parseApiErrorMessage(err, 'Failed to add client');
      toast.error(message);
      if (/KittyP account/i.test(message) || /already registered/i.test(message)) {
        void runContactLookup(form.ownerEmail);
        void runContactLookup(digitsOnlyPhone(form.ownerPhone));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients & Pets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isPersonalPractice
              ? 'Add client is available when you switch to an affiliated clinic.'
              : searchAllBranches
              ? 'Searching across all your branches'
              : clinic?.name
                ? `Showing records for ${clinic.name} only`
                : 'Select a clinic branch to view records'}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} disabled={!canAddClients} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />
          Add client
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 bg-muted/40 border-0 shadow-inner"
            placeholder={
              tab === 'clients'
                ? 'Search KittyP users or clients by name, email, phone, or owner IDâ€¦'
                : 'Search by pet name, breed, microchip, or global IDâ€¦'
            }
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <label
          className={cn(
            'inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer select-none rounded-full px-3 py-1.5 border transition-colors',
            searchAllBranches
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
          )}
        >
          <input
            type="checkbox"
            className="rounded border-border"
            checked={searchAllBranches}
            onChange={(e) => setSearchAllBranches(e.target.checked)}
          />
          <Building2 className="h-3.5 w-3.5" />
          Search in all branches
        </label>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="h-auto p-1 bg-muted gap-1 w-full max-w-full overflow-x-auto flex justify-start">
          <TabsTrigger
            value="clients"
            className="gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User className="h-4 w-4" />
            Clients
            <Badge
              variant="secondary"
              className={cn(
                'h-5 min-w-5 px-1.5 text-[10px] border-0',
                tab === 'clients'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {ownerTotal || owners.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="pets"
            className="gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <PawPrint className="h-4 w-4" />
            Pets
            <Badge
              variant="secondary"
              className={cn(
                'h-5 min-w-5 px-1.5 text-[10px] border-0',
                tab === 'pets'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {petTotal || pets.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4 space-y-3">
          {search.trim() && (
            <div className="space-y-2">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">KittyP accounts</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {search.trim().length < 3
                    ? 'Type at least 3 characters to search pet-parent accounts.'
                    : 'Active pet-parent users â€” select to open or add as a clinic client.'}
                </p>
              </div>
              {search.trim().length < 3 ? null : loading ? null : platformUsers.length ? (
                platformUsers.map((u) => (
                  <Card
                    key={u.userUuid}
                    className="border border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all bg-card"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 font-semibold">
                            {(u.name || '?').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold truncate text-base">{u.name}</p>
                              <Badge className="bg-sky-600/15 text-sky-800 dark:text-sky-200 hover:bg-sky-600/15 border-0 text-[10px]">
                                KittyP user
                              </Badge>
                              {u.alreadyClient && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Already a client
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">{u.email || 'â€”'}</p>
                            <p className="text-[11px] font-mono text-muted-foreground mt-1 break-all">
                              Owner ID: {u.userUuid}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={!!selectingUserUuid || (!u.alreadyClient && !canAddClients)}
                          onClick={() => void selectPlatformUser(u)}
                        >
                          {selectingUserUuid === u.userUuid ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {u.alreadyClient ? 'Open client' : 'Select'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border py-8 text-center bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    No KittyP accounts match â€œ{search.trim()}â€.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-primary/15 bg-accent px-4 py-3">
            <p className="text-sm font-medium text-accent-foreground">Clients (owners)</p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-16 text-muted-foreground justify-center">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading clientsâ€¦
            </div>
          ) : (
            <div className="space-y-2">
              {owners.map((o) => (
                <Card
                  key={`${o.clinicUuid}-${o.ownerUuid}`}
                  className="border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-card"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md shadow-primary/25 font-semibold">
                          {(o.name || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate text-base">{o.name}</p>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px]">
                              Client
                            </Badge>
                            {o.linked ? (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Link2 className="h-3 w-3" /> KittyP linked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Clinic only
                              </Badge>
                            )}
                            {searchAllBranches && o.clinicName && (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <Building2 className="h-3 w-3" />
                                {o.clinicName}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-primary" />
                              {o.phone || 'â€”'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 truncate max-w-[220px]">
                              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{o.email || 'â€”'}</span>
                            </span>
                            {o.address && (
                              <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="truncate">{o.address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
                        <div className="rounded-lg bg-primary/10 px-3 py-2 text-center min-w-[72px]">
                          <p className="text-lg font-bold text-primary tabular-nums">{o.petCount}</p>
                          <p className="text-[10px] text-primary/80 uppercase tracking-wide">
                            pet{o.petCount === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" asChild>
                            <Link to={crm.owner(o.ownerUuid)}>Client profile</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                    {o.lastVisit && (
                      <p className="text-[11px] text-muted-foreground mt-3 pl-[60px] sm:pl-0">
                        Last visit {format(parseISO(o.lastVisit), 'MMM d, yyyy')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {!owners.length && (
                <div className="rounded-xl border border-dashed border-border py-14 text-center bg-muted/30">
                  <User className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No clients found{searchAllBranches ? ' across branches' : ' at this branch'}.
                  </p>
                </div>
              )}
              {!searchAllBranches && (
                <ListPager
                  page={ownerPage}
                  totalPages={ownerPages}
                  totalElements={ownerTotal}
                  noun={ownerTotal === 1 ? 'client' : 'clients'}
                  onPageChange={setOwnerPage}
                  disabled={loading}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pets" className="mt-4 space-y-3">
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Pets (patients)</p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-16 text-muted-foreground justify-center">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading petsâ€¦
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {pets.map((p) => (
                <Card
                  key={`${p.clinicUuid}-${p.petUuid}`}
                  className="border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 transition-all overflow-hidden bg-card"
                >
                  <div className="p-4 pb-0">
                    <PetPhoto
                      photoUrl={p.photoUrl}
                      name={p.name}
                      species={p.species}
                      seed={p.globalPetId || p.petUuid}
                      variant="cover"
                      fit="contain"
                      className="h-40 rounded-xl bg-muted/40"
                    />
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-lg truncate leading-tight">{p.name}</p>
                        <Badge className="mt-1 bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px]">
                          Patient
                        </Badge>
                      </div>
                      {searchAllBranches && p.clinicName && (
                        <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                          <Building2 className="h-3 w-3" />
                          {p.clinicName}
                        </Badge>
                      )}
                    </div>

                    <div className="rounded-xl bg-muted/50 border border-border p-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-xs">Species</span>
                        <span className="font-medium text-right">{p.species || 'â€”'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-xs">Breed</span>
                        <span className="font-medium text-right">{p.breed || 'â€”'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-xs">Gender</span>
                        <span className="font-medium text-right">{p.gender || 'â€”'}</span>
                      </div>
                      <div className="flex justify-between gap-2 items-start">
                        <span className="text-muted-foreground text-xs shrink-0">Pet ID</span>
                        <span className="font-mono text-[10px] text-right break-all">{p.petUuid}</span>
                      </div>
                      <div className="flex justify-between gap-2 items-start">
                        <span className="text-muted-foreground text-xs shrink-0">Owner ID</span>
                        <span className="font-mono text-[10px] text-right break-all">{p.ownerUuid}</span>
                      </div>
                      {p.microchipNumber && (
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs">Microchip</span>
                          <span className="font-mono text-xs text-right">{p.microchipNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">
                        Owner:{' '}
                        <Link
                          to={crm.owner(p.ownerUuid)}
                          className="font-medium text-foreground hover:text-primary underline-offset-2 hover:underline"
                        >
                          {p.ownerName}
                        </Link>
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" asChild className="w-full">
                        <Link to={crm.pet(p.petUuid)}>Open medical profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!pets.length && (
                <div className="col-span-full rounded-xl border border-dashed border-border py-14 text-center bg-muted/30">
                  <PawPrint className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No pets found{searchAllBranches ? ' across branches' : ' for this clinic'}.
                  </p>
                </div>
              )}
              {!searchAllBranches && (
                <div className="col-span-full">
                  <ListPager
                    page={petPage}
                    totalPages={petPages}
                    totalElements={petTotal}
                    noun={petTotal === 1 ? 'pet' : 'pets'}
                    onPageChange={setPetPage}
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddDialog();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add client</DialogTitle>
            <DialogDescription>
              Search KittyP first. New people who are not on KittyP can be added for {clinic?.name || 'this clinic'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Search KittyP or clinic clients</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Email, phone, name, or IDâ€¦"
                  value={pickerQ}
                  onChange={(e) => setPickerQ(e.target.value)}
                />
              </div>
              {pickerSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : pickerQ.trim().length >= 3 ? (
                <div className="border rounded-md max-h-44 overflow-y-auto divide-y mt-2">
                  {pickerHits.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      No KittyP or clinic match â€” fill the form below for a new client.
                    </p>
                  ) : (
                    pickerHits.map((hit) =>
                      hit.kind === 'user' ? (
                        <button
                          key={`user-${hit.user.userUuid}`}
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60"
                          onClick={() => void selectPlatformUser(hit.user)}
                        >
                          <div className="font-medium flex items-center gap-2 flex-wrap">
                            {hit.user.name || hit.user.email}
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              KittyP
                            </Badge>
                            {hit.user.alreadyClient ? (
                              <Badge variant="outline" className="text-[10px]">
                                Already a client
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{hit.user.email}</p>
                          {hit.user.phone ? (
                            <p className="text-xs text-muted-foreground">{hit.user.phone}</p>
                          ) : null}
                        </button>
                      ) : (
                        <button
                          key={`owner-${hit.owner.ownerUuid}`}
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60"
                          onClick={() => {
                            setAddOpen(false);
                            navigate(crm.owner(hit.owner.ownerUuid));
                          }}
                        >
                          <div className="font-medium flex items-center gap-2">
                            {hit.owner.name}
                            <Badge variant="outline" className="text-[10px]">
                              Clinic client
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{hit.owner.email}</p>
                        </button>
                      )
                    )
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Type at least 3 characters to search.</p>
              )}
            </div>

            {matchedOwner ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm space-y-2">
                <p className="font-medium text-foreground">Already a client of this clinic â€” {matchedOwner.name}</p>
                <p className="text-xs text-muted-foreground">{matchedOwner.email}</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setAddOpen(false);
                    navigate(crm.owner(matchedOwner.ownerUuid));
                  }}
                >
                  Open client profile
                </Button>
              </div>
            ) : null}

            {attachUser && !matchedOwner ? (
              <div className="rounded-md border px-3 py-2.5 space-y-2">
                <p className="text-sm font-medium">Already registered on KittyP</p>
                <p className="text-sm text-foreground">{attachUser.name}</p>
                <p className="text-xs text-muted-foreground">{attachUser.email}</p>
                {attachUser.phone ? (
                  <p className="text-xs text-muted-foreground">{attachUser.phone}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Do not create a new record. Send a confirmation code to their email, then enter it to attach them to
                  this clinic.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={attachSending}
                    onClick={() => void handleSendAttachOtp()}
                  >
                    {attachSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Send confirmation email
                  </Button>
                  <Input
                    className="max-w-[140px] h-8"
                    placeholder="6-digit code"
                    value={attachCode}
                    onChange={(e) => setAttachCode(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={attachVerifying || !attachCode.trim()}
                    onClick={() => void handleVerifyAttachOtp()}
                  >
                    {attachVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Attach
                  </Button>
                </div>
              </div>
            ) : null}

            {!attachUser && !matchedOwner ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ownerFirstName">Owner first name *</Label>
                    <Input
                      id="ownerFirstName"
                      value={form.ownerFirstName}
                      onChange={(e) => set('ownerFirstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ownerLastName">Last name</Label>
                    <Input
                      id="ownerLastName"
                      value={form.ownerLastName}
                      onChange={(e) => set('ownerLastName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerEmail">Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => {
                      set('ownerEmail', e.target.value);
                      setEmailLookup(null);
                      setMatchedOwner(null);
                      setAttachUser(null);
                      setFieldErrors((s) => ({ ...s, ownerEmail: '' }));
                    }}
                    onBlur={() => void runContactLookup(form.ownerEmail)}
                  />
                  {fieldErrors.ownerEmail ? (
                    <p className="text-xs text-destructive">{fieldErrors.ownerEmail}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerPhone">Phone (10 digits) *</Label>
                  <Input
                    id="ownerPhone"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    value={form.ownerPhone}
                    onChange={(e) => {
                      set('ownerPhone', digitsOnlyPhone(e.target.value));
                      setFieldErrors((s) => ({ ...s, ownerPhone: '' }));
                    }}
                    onBlur={() => {
                      const err = validatePhone(form.ownerPhone, true);
                      if (err) setFieldErrors((s) => ({ ...s, ownerPhone: err }));
                      else void runContactLookup(digitsOnlyPhone(form.ownerPhone));
                    }}
                  />
                  {fieldErrors.ownerPhone ? (
                    <p className="text-xs text-destructive">{fieldErrors.ownerPhone}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerAddress">Address</Label>
                  <Input
                    id="ownerAddress"
                    value={form.ownerAddress}
                    onChange={(e) => set('ownerAddress', e.target.value)}
                  />
                </div>
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Pet details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="petName">Pet name *</Label>
                      <Input
                        id="petName"
                        value={form.petName}
                        onChange={(e) => set('petName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Species</Label>
                      <Select value={form.petType} onValueChange={(v) => set('petType', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CAT">Cat</SelectItem>
                          <SelectItem value="DOG">Dog</SelectItem>
                          <SelectItem value="BIRD">Bird</SelectItem>
                          <SelectItem value="RABBIT">Rabbit</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="petBreed">Breed</Label>
                    <Input id="petBreed" value={form.petBreed} onChange={(e) => set('petBreed', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="petGender">Gender</Label>
                      <Select
                        value={form.petGender || undefined}
                        onValueChange={(value) => set('petGender', value)}
                      >
                        <SelectTrigger id="petGender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="petDateOfBirth">Date of birth</Label>
                      <DatePicker
                        id="petDateOfBirth"
                        value={form.petDateOfBirth}
                        onChange={(petDateOfBirth) => set('petDateOfBirth', petDateOfBirth)}
                        placeholder="Select date of birth"
                        disableFuture
                      />
                    </div>
                  </div>
                  <PetPhotoField
                    value={form.petPhotoUrl || null}
                    onChange={(url) => set('petPhotoUrl', url || '')}
                    disabled={saving}
                  />
                </div>
              </>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  resetAddDialog();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              {!attachUser && !matchedOwner ? (
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add client
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
