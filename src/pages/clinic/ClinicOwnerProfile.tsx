import { useEffect, useState } from 'react';
import {
  digitsOnlyPhone,
  displayPhone,
  parseApiErrorMessage,
  validateEmail,
  validatePhone,
} from '@/utils/validation';
import { Link, useLocation, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { PetDobField } from '@/components/ui/PetDobField';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Link2,
  User,
} from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ClinicOwnerPetModel,
  ClinicOwnerProfileModel,
  addPetToClinicOwner,
  admitClinicPet,
  admitOwnerPets,
  fetchClinicOwnerProfile,
  sendPetConsentOtp,
  updateClinicOwner,
  verifyPetConsentOtp,
} from '@/services/clinicService';
import { PetPhoto } from '@/components/clinic/PetPhoto';
import { formatPetDobWithAge } from '@/utils/petAge';
import { PetPhotoField } from '@/components/clinic/PetPhotoField';
import { toast } from 'sonner';
import { clinicCrmPaths } from '@/utils/clinicCrmPaths';

const emptyPet = {
  name: '',
  species: '',
  breed: '',
  gender: '',
  dateOfBirth: '',
  weight: '',
  microchipNumber: '',
  photoUrl: '',
};

const emptyOwnerEdit = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: '',
  notes: '',
};

export default function ClinicOwnerProfile() {
  const { ownerUuid = '' } = useParams();
  const { pathname } = useLocation();
  const crm = clinicCrmPaths(pathname);
  const { clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [profile, setProfile] = useState<ClinicOwnerProfileModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [petForm, setPetForm] = useState(emptyPet);
  const [saving, setSaving] = useState(false);
  const [consentCode, setConsentCode] = useState('');
  const [consentVerified, setConsentVerified] = useState(false);
  const [consentSending, setConsentSending] = useState(false);
  const [consentVerifying, setConsentVerifying] = useState(false);
  const [pickedPetIds, setPickedPetIds] = useState<string[]>([]);
  const [associating, setAssociating] = useState(false);
  const [consentPet, setConsentPet] = useState<ClinicOwnerPetModel | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyOwnerEdit);
  const [editErrors, setEditErrors] = useState<{
    firstName?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
  }>({});
  const [editSaving, setEditSaving] = useState(false);

  const openEditDialog = () => {
    if (!profile) return;
    const o = profile.owner;
    setEditForm({
      firstName: o.firstName || o.name || '',
      lastName: o.lastName || '',
      email: o.email || '',
      phone: o.phone ? digitsOnlyPhone(o.phone) : '',
      alternatePhone: o.alternatePhone ? digitsOnlyPhone(o.alternatePhone) : '',
      address: o.address || '',
      notes: o.notes || '',
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicUuid || !ownerUuid || !profile) return;
    if (profile.owner.linked) {
      toast.error('KittyP-linked client profiles cannot be edited by the clinic.');
      return;
    }

    const errors: { firstName?: string; email?: string; phone?: string; alternatePhone?: string } = {};
    if (!editForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    const emailErr = validateEmail(editForm.email, true);
    if (emailErr) {
      errors.email = emailErr;
    }
    if (editForm.phone.trim()) {
      const phoneErr = validatePhone(editForm.phone, false);
      if (phoneErr) {
        errors.phone = phoneErr;
      }
    }
    if (editForm.alternatePhone.trim()) {
      const altPhoneErr = validatePhone(editForm.alternatePhone, false);
      if (altPhoneErr) {
        errors.alternatePhone = altPhoneErr;
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditSaving(true);
    try {
      await updateClinicOwner(clinicUuid, ownerUuid, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim() || undefined,
        email: editForm.email.trim(),
        phone: editForm.phone.trim() ? digitsOnlyPhone(editForm.phone) : undefined,
        alternatePhone: editForm.alternatePhone.trim() ? digitsOnlyPhone(editForm.alternatePhone) : undefined,
        address: editForm.address.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      toast.success('Client updated successfully');
      setEditOpen(false);
      await reload();
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Failed to update client'));
    } finally {
      setEditSaving(false);
    }
  };

  const reload = async () => {
    if (!clinicUuid || !ownerUuid) return;
    const data = await fetchClinicOwnerProfile(clinicUuid, ownerUuid);
    setProfile(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (clinicLoading) return;
      if (!clinicUuid || !ownerUuid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchClinicOwnerProfile(clinicUuid, ownerUuid);
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) {
          setProfile(null);
          toast.error('Failed to load client profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid, ownerUuid, clinicLoading]);

  const needsPetConsent = Boolean(profile?.owner.linked);

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicUuid || !ownerUuid || !petForm.name.trim()) return;
    if (needsPetConsent && !consentVerified) {
      toast.error('Verify owner email consent before adding this pet');
      return;
    }
    setSaving(true);
    try {
      const pet = await addPetToClinicOwner(clinicUuid, ownerUuid, {
        name: petForm.name.trim(),
        species: petForm.species.trim() || undefined,
        breed: petForm.breed.trim() || undefined,
        gender: petForm.gender.trim() || undefined,
        dateOfBirth: petForm.dateOfBirth || undefined,
        weight: petForm.weight.trim() || undefined,
        microchipNumber: petForm.microchipNumber.trim() || undefined,
        photoUrl: petForm.photoUrl.trim() || undefined,
      });
      toast.success(`${pet.name} added`);
      setAddOpen(false);
      setPetForm(emptyPet);
      setConsentCode('');
      setConsentVerified(false);
      await reload();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to add pet';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendConsent = async () => {
    if (!clinicUuid || !ownerUuid || !petForm.name.trim()) {
      toast.error('Enter the pet name first');
      return;
    }
    setConsentSending(true);
    try {
      await sendPetConsentOtp(clinicUuid, ownerUuid, petForm.name.trim());
      setConsentVerified(false);
      toast.success('Consent code sent to owner email');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send consent code';
      toast.error(message);
    } finally {
      setConsentSending(false);
    }
  };

  const handleVerifyConsent = async () => {
    if (!clinicUuid || !ownerUuid || !petForm.name.trim() || !consentCode.trim()) {
      toast.error('Enter pet name and the code');
      return;
    }
    setConsentVerifying(true);
    try {
      await verifyPetConsentOtp(clinicUuid, ownerUuid, petForm.name.trim(), consentCode.trim());
      setConsentVerified(true);
      toast.success('Owner consent verified');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid consent code';
      toast.error(message);
      setConsentVerified(false);
    } finally {
      setConsentVerifying(false);
    }
  };

  const togglePickedPet = (petUuid: string, checked: boolean) => {
    setPickedPetIds((current) =>
      checked ? [...current, petUuid] : current.filter((id) => id !== petUuid)
    );
  };

  const associatePickedPets = async (petUuids: string[]) => {
    if (!clinicUuid || !ownerUuid || petUuids.length === 0) return;
    setAssociating(true);
    try {
      await admitOwnerPets(clinicUuid, ownerUuid, petUuids);
      toast.success(petUuids.length === 1 ? 'Pet associated with this clinic' : 'Selected pets associated with this clinic');
      setPickedPetIds([]);
      await reload();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not associate pet';
      toast.error(message);
    } finally {
      setAssociating(false);
    }
  };

  const handleSendExistingConsent = async (pet: ClinicOwnerPetModel) => {
    if (!clinicUuid || !ownerUuid) return;
    setConsentPet(pet);
    setConsentSending(true);
    setConsentVerified(false);
    try {
      await sendPetConsentOtp(clinicUuid, ownerUuid, pet.name);
      toast.success('Consent code sent to owner email');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send consent code';
      toast.error(message);
    } finally {
      setConsentSending(false);
    }
  };

  const handleAdmitExistingPet = async (pet: ClinicOwnerPetModel) => {
    if (!clinicUuid || !ownerUuid || !consentCode.trim()) {
      toast.error('Enter the code from the owner');
      return;
    }
    setConsentVerifying(true);
    try {
      await verifyPetConsentOtp(clinicUuid, ownerUuid, pet.name, consentCode.trim());
      await admitClinicPet(clinicUuid, pet.petUuid);
      toast.success(`${pet.name} added to this clinic`);
      setConsentPet(null);
      setConsentCode('');
      setConsentVerified(false);
      await reload();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not add pet';
      toast.error(message);
    } finally {
      setConsentVerifying(false);
    }
  };

  if (clinicLoading || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading client…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={crm.clients}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm">Client not found.</p>
      </div>
    );
  }

  const owner = profile.owner;
  const pendingPets = owner.pets.filter((pet) => pet.clinicPatient === false);
  const choosingFirstPets = (owner.petCount ?? 0) === 0 && pendingPets.length > 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link to={crm.clients}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Clients & Pets
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {!owner.linked && (
            <Button variant="outline" onClick={openEditDialog}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit client
            </Button>
          )}
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add pet
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
            <User className="h-5 w-5 text-primary" />
            {owner.name}
            {owner.linked ? (
              <Badge variant="secondary" className="gap-1">
                <Link2 className="h-3 w-3" /> KittyP linked
              </Badge>
            ) : (
              <Badge variant="outline">Clinic only</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Email</p>
            <p className="font-medium flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {owner.email || '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Phone</p>
            <p className="font-medium flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {displayPhone(owner.phone) || '—'}
            </p>
          </div>
          {owner.alternatePhone && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Alternate phone</p>
              <p className="font-medium">{owner.alternatePhone}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs mb-1">Address</p>
            <p className="font-medium flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span>{owner.address || 'Not provided'}</span>
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground text-xs mb-1">Notes</p>
            <p className="font-medium whitespace-pre-wrap">{owner.notes || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Billing</p>
            <p className="font-medium">
              {profile.billingStatus.replace(/_/g, ' ')}
              {profile.invoiceCount > 0 ? ` · ${profile.invoiceCount} invoice(s)` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">Pets</h2>
          {choosingFirstPets ? (
            <Button
              size="sm"
              disabled={associating || pickedPetIds.length === 0}
              onClick={() => void associatePickedPets(pickedPetIds)}
            >
              {associating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Associate selected
            </Button>
          ) : null}
        </div>
        {pendingPets.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            {choosingFirstPets
              ? 'This KittyP account has more than one pet. Choose which pets belong at this clinic. The client-attach confirmation already covers this first choice.'
              : (owner.petCount ?? 0) === 0
                ? 'This pet is on their KittyP account. Add it to open the clinic chart.'
                : 'Pets the owner added on KittyP are not clinic patients until you request their consent.'}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {owner.pets.map((p) => (
            <Card key={p.petUuid} className="border-0 shadow-sm overflow-hidden">
              <div className="p-3 pb-0">
                <PetPhoto
                  photoUrl={p.photoUrl}
                  name={p.name}
                  species={p.species}
                  seed={p.globalPetId || p.petUuid}
                  variant="cover"
                  fit="contain"
                  className="h-28 rounded-xl bg-muted/40"
                />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.species, p.breed].filter(Boolean).join(' · ') || 'Pet'}
                    {p.dateOfBirth ? ` · ${formatPetDobWithAge(p.dateOfBirth)}` : ''}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                    Pet ID: {p.petUuid}
                  </p>
                  {p.lastVisit && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Registered {format(parseISO(p.lastVisit), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {p.clinicPatient !== false ? (
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to={crm.pet(p.petUuid)}>Open pet profile</Link>
                    </Button>
                  ) : choosingFirstPets || (owner.petCount ?? 0) === 0 ? (
                    choosingFirstPets ? (
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={pickedPetIds.includes(p.petUuid)}
                          onCheckedChange={(checked) => togglePickedPet(p.petUuid, checked === true)}
                        />
                        Associate with this clinic
                      </label>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={associating}
                        onClick={() => void associatePickedPets([p.petUuid])}
                      >
                        Add to this clinic
                      </Button>
                    )
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={consentSending && consentPet?.petUuid === p.petUuid}
                        onClick={() => void handleSendExistingConsent(p)}
                      >
                        {consentSending && consentPet?.petUuid === p.petUuid ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : null}
                        Request owner consent
                      </Button>
                      {consentPet?.petUuid === p.petUuid ? (
                        <div className="flex gap-2">
                          <Input
                            className="h-8"
                            placeholder="Code"
                            value={consentCode}
                            onChange={(e) => setConsentCode(e.target.value)}
                          />
                          <Button
                            size="sm"
                            disabled={consentVerifying || !consentCode.trim()}
                            onClick={() => void handleAdmitExistingPet(p)}
                          >
                            Add
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!owner.pets.length && (
            <p className="text-sm text-muted-foreground col-span-full">No pets yet. Add one to start a medical chart.</p>
          )}
        </div>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setPetForm(emptyPet);
            setConsentCode('');
            setConsentVerified(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pet for {owner.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPet} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Pet name *</Label>
              <Input
                value={petForm.name}
                onChange={(e) => {
                  setPetForm((s) => ({ ...s, name: e.target.value }));
                  setConsentVerified(false);
                }}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Species</Label>
                <Input
                  value={petForm.species}
                  onChange={(e) => setPetForm((s) => ({ ...s, species: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Breed</Label>
                <Input
                  value={petForm.breed}
                  onChange={(e) => setPetForm((s) => ({ ...s, breed: e.target.value }))}
                />
              </div>
            </div>
            {needsPetConsent ? (
            <div className="rounded-md border px-3 py-2.5 space-y-2">
              <p className="text-sm font-medium">Owner consent (email OTP)</p>
              <p className="text-xs text-muted-foreground">
                KittyP-linked clients need an email OTP for every new pet added by the clinic.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={consentSending || !petForm.name.trim()}
                  onClick={() => void handleSendConsent()}
                >
                  {consentSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Send code
                </Button>
                <Input
                  className="max-w-[140px] h-8"
                  placeholder="6-digit code"
                  value={consentCode}
                  onChange={(e) => {
                    setConsentCode(e.target.value);
                    setConsentVerified(false);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={consentVerifying || !consentCode.trim()}
                  onClick={() => void handleVerifyConsent()}
                >
                  {consentVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Verify
                </Button>
                {consentVerified ? (
                  <Badge variant="secondary" className="self-center">
                    Verified
                  </Badge>
                ) : null}
              </div>
            </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                First pet for this client does not need an email OTP.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select
                  value={petForm.gender || undefined}
                  onValueChange={(value) => setPetForm((s) => ({ ...s, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <PetDobField
              id="clinic-owner-pet-dob"
              value={petForm.dateOfBirth}
              onChange={(dateOfBirth) => setPetForm((s) => ({ ...s, dateOfBirth }))}
              defaultMode="months"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={petForm.weight}
                  onChange={(e) => setPetForm((s) => ({ ...s, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Microchip</Label>
                <Input
                  value={petForm.microchipNumber}
                  onChange={(e) => setPetForm((s) => ({ ...s, microchipNumber: e.target.value }))}
                />
              </div>
            </div>
            <PetPhotoField
              value={petForm.photoUrl || null}
              onChange={(url) => setPetForm((s) => ({ ...s, photoUrl: url || '' }))}
              disabled={saving}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || (needsPetConsent && !consentVerified)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add pet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog (Clinic-only clients) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveOwner} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editFirstName">First name *</Label>
                <Input
                  id="editFirstName"
                  value={editForm.firstName}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, firstName: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  required
                />
                {editErrors.firstName && (
                  <p className="text-xs text-destructive">{editErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editLastName">Last name</Label>
                <Input
                  id="editLastName"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, email: e.target.value }));
                  setEditErrors((prev) => ({ ...prev, email: undefined }));
                }}
                required
              />
              {editErrors.email && (
                <p className="text-xs text-destructive">{editErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editPhone">Phone (optional)</Label>
                <Input
                  id="editPhone"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={editForm.phone}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, phone: digitsOnlyPhone(e.target.value) }));
                    setEditErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                />
                {editErrors.phone && (
                  <p className="text-xs text-destructive">{editErrors.phone}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editAlternatePhone">Alternate phone</Label>
                <Input
                  id="editAlternatePhone"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={editForm.alternatePhone}
                  onChange={(e) => {
                    setEditForm((prev) => ({
                      ...prev,
                      alternatePhone: digitsOnlyPhone(e.target.value),
                    }));
                    setEditErrors((prev) => ({ ...prev, alternatePhone: undefined }));
                  }}
                />
                {editErrors.alternatePhone && (
                  <p className="text-xs text-destructive">{editErrors.alternatePhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editAddress">Address</Label>
              <Textarea
                id="editAddress"
                rows={2}
                placeholder="Clinic client address"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                rows={3}
                placeholder="Additional notes about client..."
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={editSaving}
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
