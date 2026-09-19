import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
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
  Phone,
  Plus,
  Link2,
  User,
} from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicOwnerProfileModel,
  addPetToClinicOwner,
  fetchClinicOwnerProfile,
  sendPetConsentOtp,
  verifyPetConsentOtp,
} from '@/services/clinicService';
import { PetPhoto } from '@/components/clinic/PetPhoto';
import { formatPetDobWithAge } from '@/utils/petAge';
import { PetPhotoField } from '@/components/clinic/PetPhotoField';
import { toast } from 'sonner';

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

export default function ClinicOwnerProfile() {
  const { ownerUuid = '' } = useParams();
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

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicUuid || !ownerUuid || !petForm.name.trim()) return;
    if (!consentVerified) {
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
          <Link to="/clinic/patients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm">Client not found.</p>
      </div>
    );
  }

  const owner = profile.owner;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/clinic/patients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Clients & Pets
          </Link>
        </Button>
        <div className="flex items-center gap-2">
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
              {owner.phone || '—'}
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
              {profile.billingStatus.replaceAll('_', ' ')}
              {profile.invoiceCount > 0 ? ` · ${profile.invoiceCount} invoice(s)` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Pets</h2>
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
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/clinic/pets/${p.petUuid}`}>Open pet profile</Link>
                  </Button>
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
            <div className="rounded-md border px-3 py-2.5 space-y-2">
              <p className="text-sm font-medium">Owner consent (email OTP)</p>
              <p className="text-xs text-muted-foreground">
                A one-time code is emailed to the owner for this pet name only.
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
              <div className="space-y-1.5">
                <Label htmlFor="clinic-owner-pet-dob">Date of birth</Label>
                <DatePicker
                  id="clinic-owner-pet-dob"
                  value={petForm.dateOfBirth}
                  onChange={(dateOfBirth) => setPetForm((s) => ({ ...s, dateOfBirth }))}
                  placeholder="Select date of birth"
                  disableFuture
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Weight</Label>
                <Input
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
              <Button type="submit" disabled={saving || !consentVerified}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add pet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
