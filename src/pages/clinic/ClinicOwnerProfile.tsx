import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  EyeOff,
} from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicOwnerProfileModel,
  addPetToClinicOwner,
  fetchClinicOwnerProfile,
  hideClinicOwner,
  hideClinicPet,
} from '@/services/clinicService';
import { PetPhoto } from '@/components/clinic/PetPhoto';
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
  const navigate = useNavigate();
  const { clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [profile, setProfile] = useState<ClinicOwnerProfileModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [petForm, setPetForm] = useState(emptyPet);
  const [saving, setSaving] = useState(false);
  const [hideOwnerOpen, setHideOwnerOpen] = useState(false);
  const [hidePetUuid, setHidePetUuid] = useState<{ uuid: string; name: string } | null>(null);
  const [hiding, setHiding] = useState(false);

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

  const confirmHideOwner = async () => {
    if (!clinicUuid || !ownerUuid || !profile) return;
    setHiding(true);
    try {
      await hideClinicOwner(clinicUuid, ownerUuid);
      toast.success(`${profile.owner.name} hidden from clinic lists`, {
        description: 'Records are kept in the database.',
      });
      setHideOwnerOpen(false);
      navigate('/clinic/patients');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not hide client';
      toast.error(message);
    } finally {
      setHiding(false);
    }
  };

  const confirmHidePet = async () => {
    if (!clinicUuid || !hidePetUuid) return;
    setHiding(true);
    try {
      await hideClinicPet(clinicUuid, hidePetUuid.uuid);
      toast.success(`${hidePetUuid.name} hidden from clinic lists`, {
        description: 'Records are kept in the database.',
      });
      setHidePetUuid(null);
      await reload();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not hide pet';
      toast.error(message);
    } finally {
      setHiding(false);
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
          <Button variant="outline" onClick={() => setHideOwnerOpen(true)}>
            <EyeOff className="h-4 w-4 mr-2" />
            Hide client
          </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setHidePetUuid({ uuid: p.petUuid, name: p.name })}
                  >
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    Hide pet
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pet for {owner.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPet} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Pet name *</Label>
              <Input
                value={petForm.name}
                onChange={(e) => setPetForm((s) => ({ ...s, name: e.target.value }))}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Input
                  value={petForm.gender}
                  onChange={(e) => setPetForm((s) => ({ ...s, gender: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <Input
                  type="date"
                  value={petForm.dateOfBirth}
                  onChange={(e) => setPetForm((s) => ({ ...s, dateOfBirth: e.target.value }))}
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
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add pet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={hideOwnerOpen} onOpenChange={(open) => !hiding && setHideOwnerOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide {owner.name} from clinic lists?</DialogTitle>
            <DialogDescription>
              This client and their pets will leave Clients & Pets. Visits and medical records stay
              in the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHideOwnerOpen(false)} disabled={hiding}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmHideOwner()} disabled={hiding}>
              {hiding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, hide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!hidePetUuid} onOpenChange={(open) => !open && !hiding && setHidePetUuid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide {hidePetUuid?.name} from clinic lists?</DialogTitle>
            <DialogDescription>
              The pet will leave clinic directories. Visits and medical history stay in the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHidePetUuid(null)} disabled={hiding}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmHidePet()} disabled={hiding}>
              {hiding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, hide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
