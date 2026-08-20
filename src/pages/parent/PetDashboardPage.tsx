import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Heart,
  Lightbulb,
  Pencil,
  Plus,
  Syringe,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { RootState } from '@/module/store/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatPetDobWithAge } from '@/utils/petAge';
import { PetImage } from '@/components/ui/PetImage';
import {
  FeedingLogModel,
  PetDashboardModel,
  WeightLogModel,
  createFeedingLog,
  fetchFeedingLogs,
  fetchPetDashboard,
  fetchWeightHistory,
  logPetWeight,
} from '@/services/petDashboardService';
import { PetHealthTimeline } from '@/components/health/PetHealthTimeline';
import { OwnerPetEditDialog } from '@/components/ui/OwnerPetEditDialog';
import { PetProfile } from '@/services/authService';

export default function PetDashboardPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.authReducer);
  const profilePet = user?.ownerPets?.find((p) => p.uuid === petId);

  const [dashboard, setDashboard] = useState<PetDashboardModel | null>(null);
  const [weights, setWeights] = useState<WeightLogModel[]>([]);
  const [logs, setLogs] = useState<FeedingLogModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    if (!petId) return;
    setLoading(true);
    try {
      const [dash, wh, fl] = await Promise.all([
        fetchPetDashboard(petId),
        fetchWeightHistory(petId),
        fetchFeedingLogs(petId),
      ]);
      setDashboard(dash);
      setWeights(wh);
      setLogs(fl);
    } catch {
      setDashboard(null);
      toast.error('Could not load pet dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const pet = dashboard?.pet ?? profilePet;
  const editablePet: PetProfile | undefined = profilePet ?? dashboard?.pet;
  const chartData = useMemo(
    () =>
      [...weights]
        .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
        .map((w) => ({
          date: format(parseISO(w.recordedAt), 'MMM d'),
          weight: w.weight,
        })),
    [weights]
  );

  const addWeight = async () => {
    if (!petId || !weightInput) return;
    const weight = Number(weightInput);
    if (!Number.isFinite(weight) || weight <= 0) {
      toast.error('Enter a valid weight');
      return;
    }
    setSaving(true);
    try {
      await logPetWeight(petId, { weight });
      setWeightInput('');
      toast.success('Weight logged');
      await load();
    } catch {
      toast.error('Failed to log weight');
    } finally {
      setSaving(false);
    }
  };

  const logMeal = async (status: 'COMPLETED' | 'SKIPPED') => {
    if (!petId) return;
    try {
      await createFeedingLog(petId, { status, notes: 'Logged from pet dashboard' });
      toast.success(status === 'COMPLETED' ? 'Meal marked complete' : 'Meal skipped');
      await load();
    } catch {
      toast.error('Failed to update daily log');
    }
  };

  if (!petId) {
    return null;
  }

  if (!pet && !loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center space-y-4">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="font-semibold">Pet not found</p>
        <Button onClick={() => navigate('/app/pets')}>Back to My Pets</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/app/pets">
          <ArrowLeft className="h-4 w-4 mr-2" />
          My Pets
        </Link>
      </Button>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden shrink-0">
            <PetImage pet={pet} alt={pet?.name ?? 'Pet'} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{pet?.name ?? 'Pet'}</h1>
              {editablePet && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Edit pet details"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {pet?.type} · {pet?.breed || 'Mixed'}
              {pet?.dateOfBirth ? ` · ${formatPetDobWithAge(pet.dateOfBirth)}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">Active</Badge>
              {(dashboard?.latestWeight?.weight ?? pet?.weight) != null && (
                <Badge variant="outline">{dashboard?.latestWeight?.weight ?? pet?.weight} kg</Badge>
              )}
              {pet?.gender && <Badge variant="outline">{pet.gender}</Badge>}
              {pet?.microchipNumber && (
                <Badge variant="outline">Chip {pet.microchipNumber}</Badge>
              )}
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link to={`/app/book?petId=${petId}`}>Book appointment</Link>
          </Button>
        </CardContent>
      </Card>

      {dashboard?.tipOfTheDay?.tip && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 flex gap-3 items-start">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase text-primary">AI Tip of the Day</p>
              <p className="text-sm mt-1">{dashboard.tipOfTheDay.tip}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Nutrition plan</p>
                <p className="font-semibold mt-1">
                  {dashboard?.activeNutritionPlan?.planName || 'None active'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Feedings today</p>
                <p className="font-semibold mt-1">{dashboard?.todayFeedingCompletionCount ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Vaccine dues</p>
                <p className="font-semibold mt-1">{dashboard?.openVaccineDues?.length ?? 0}</p>
              </CardContent>
            </Card>
          </div>
          {(pet?.healthConditions || pet?.allergies) && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Conditions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {pet?.healthConditions && (
                  <p>
                    <span className="text-muted-foreground">Health: </span>
                    {pet.healthConditions}
                  </p>
                )}
                {pet?.allergies && (
                  <p>
                    <span className="text-muted-foreground">Allergies: </span>
                    {pet.allergies}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-4 mt-4">
          {petId && pet?.name && <PetHealthTimeline petId={petId} petName={pet.name} />}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Syringe className="h-4 w-4" /> Vaccine schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dashboard?.openVaccineDues?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming vaccine dues on file.</p>
              ) : (
                dashboard?.openVaccineDues?.map((v, i) => (
                  <div key={`${v.vaccineName}-${i}`} className="flex justify-between text-sm p-3 rounded-lg bg-muted/50">
                    <span>{v.vaccineName}</span>
                    <span className="text-muted-foreground">
                      {v.dueDate ? format(parseISO(v.dueDate), 'MMM d, yyyy') : '—'}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Utensils className="h-4 w-4" /> Daily logging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => logMeal('COMPLETED')}>
                  Mark meal complete
                </Button>
                <Button size="sm" variant="outline" onClick={() => logMeal('SKIPPED')}>
                  Skip meal
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/app/nutrition">View plan</Link>
                </Button>
              </div>
              <div className="space-y-2">
                {logs.slice(0, 8).map((log, idx) => (
                  <div key={log.id ?? idx} className="text-sm flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="capitalize">{String(log.status).toLowerCase()}</span>
                    <span className="text-muted-foreground">
                      {log.loggedAt ? format(parseISO(log.loggedAt), 'MMM d, h:mm a') : '—'}
                    </span>
                  </div>
                ))}
                {!logs.length && (
                  <p className="text-sm text-muted-foreground">No feeding logs yet. Log today&apos;s meals above.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Weight trend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 max-w-sm">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Weight (kg)"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                />
                <Button onClick={addWeight} disabled={saving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Log
                </Button>
              </div>
              {chartData.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Log a weight to start the trend chart.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editablePet && (
        <OwnerPetEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          pet={editablePet}
          onSaved={load}
        />
      )}
    </div>
  );
}
