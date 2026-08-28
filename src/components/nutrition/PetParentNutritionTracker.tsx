import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, SkipForward, Apple } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  createFeedingLog,
  fetchFeedingLogs,
  type FeedingLogModel,
} from '@/services/petDashboardService';
import {
  fetchActiveNutritionPlan,
  fetchPetDailyPlan,
  type NutritionPlan,
  type PetDailyPlanItem,
} from '@/services/petNutritionService';
import { ROLES } from '@/utils/roles';

function dayKey(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

interface PetParentNutritionTrackerProps {
  /** When embedded, skip outer page chrome. */
  embedded?: boolean;
  petUuid?: string;
  /** Doctors viewing parent progress (read-only logging). */
  readOnly?: boolean;
}

export function PetParentNutritionTracker({
  embedded = false,
  petUuid: petUuidProp,
  readOnly: readOnlyProp,
}: PetParentNutritionTrackerProps) {
  const [searchParams] = useSearchParams();
  const user = useSelector((s: RootState) => s.authReducer.user);
  const isDoctor = (user?.roles || []).includes(ROLES.DOCTOR);
  const pets = user?.ownerPets ?? [];

  const petUuidFromQuery = searchParams.get('petUuid');
  const [selectedPetUuid, setSelectedPetUuid] = useState(
    petUuidProp || petUuidFromQuery || pets[0]?.uuid || ''
  );
  const readOnly = readOnlyProp ?? (isDoctor && !pets.some((p) => p.uuid === selectedPetUuid));

  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [dailyItems, setDailyItems] = useState<PetDailyPlanItem[]>([]);
  const [logs, setLogs] = useState<FeedingLogModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date().toISOString()));

  const load = useCallback(async () => {
    if (!selectedPetUuid) return;
    setLoading(true);
    try {
      const [active, daily, feeding] = await Promise.all([
        fetchActiveNutritionPlan(selectedPetUuid).catch(() => null),
        fetchPetDailyPlan(selectedPetUuid).catch(() => []),
        fetchFeedingLogs(selectedPetUuid).catch(() => []),
      ]);
      setPlan(active);
      setDailyItems(daily);
      setLogs(feeding);
      if (daily.length > 0) {
        const today = dayKey(new Date().toISOString());
        const hasToday = daily.some((d) => dayKey(d.day) === today);
        setSelectedDay(hasToday ? today : dayKey(daily[0].day));
      }
    } catch {
      toast.error('Could not load nutrition tracker');
    } finally {
      setLoading(false);
    }
  }, [selectedPetUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    const unique = Array.from(new Set(dailyItems.map((d) => dayKey(d.day)).filter(Boolean))).sort();
    return unique.slice(0, 30);
  }, [dailyItems]);

  const dayItems = useMemo(
    () => dailyItems.filter((d) => dayKey(d.day) === selectedDay),
    [dailyItems, selectedDay]
  );

  const completedForDay = useMemo(() => {
    return logs.filter((l) => dayKey(l.loggedAt) === selectedDay && l.status === 'COMPLETED').length;
  }, [logs, selectedDay]);

  const mark = async (status: 'COMPLETED' | 'SKIPPED', item?: PetDailyPlanItem) => {
    if (readOnly || !selectedPetUuid) return;
    try {
      await createFeedingLog(selectedPetUuid, {
        dailyPlanId: item?.id,
        status,
        quantity: item?.quantityInGrams,
        notes: item?.itemName,
        loggedAt: `${selectedDay}T12:00:00`,
      });
      toast.success(status === 'COMPLETED' ? 'Meal logged' : 'Meal skipped');
      await load();
    } catch {
      toast.error('Could not save feeding log');
    }
  };

  const body = (
    <div className="space-y-6">
      {!petUuidProp && pets.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {pets.map((pet) => (
            <Button
              key={pet.uuid}
              size="sm"
              variant={selectedPetUuid === pet.uuid ? 'default' : 'outline'}
              onClick={() => setSelectedPetUuid(pet.uuid)}
            >
              {pet.name}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tracker…</p>
      ) : !plan && days.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Apple className="h-4 w-4" /> No active plan
            </CardTitle>
            <CardDescription>
              When your veterinarian sends a nutrition plan, your 30-day tracker will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{plan?.planName || 'Active nutrition plan'}</CardTitle>
              <CardDescription>
                {readOnly
                  ? 'Doctor view — parent feeding progress (read-only).'
                  : 'Log daily meals for the next 30 days. Your vet can see progress too.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {days.map((day) => {
                  const done = logs.some(
                    (l) => dayKey(l.loggedAt) === day && l.status === 'COMPLETED'
                  );
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`h-9 min-w-9 px-2 rounded-md text-xs border ${
                        selectedDay === day
                          ? 'bg-primary text-primary-foreground border-primary'
                          : done
                            ? 'bg-emerald-500/15 border-emerald-500/40'
                            : 'bg-muted/40 border-border'
                      }`}
                    >
                      {day.slice(8)}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{selectedDay}</CardTitle>
                <Badge variant="secondary">{completedForDay} completed</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No scheduled items for this day. You can still log a meal below.
                </p>
              ) : (
                dayItems.map((item, idx) => (
                  <div
                    key={`${item.id ?? idx}-${item.itemName}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.time || '—'}
                        {item.quantityInGrams ? ` · ${item.quantityInGrams}g` : ''}
                      </p>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void mark('COMPLETED', item)}>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Done
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void mark('SKIPPED', item)}>
                          <SkipForward className="h-3.5 w-3.5 mr-1" />
                          Skip
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
              {!readOnly && dayItems.length === 0 && (
                <Button size="sm" onClick={() => void mark('COMPLETED')}>
                  Log a meal for today
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Nutrition Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">30-day interactive feeding progress</p>
        </div>
        <Button variant="outline" asChild size="sm">
          <Link to="/app">Back</Link>
        </Button>
      </div>
      {body}
    </div>
  );
}

export default PetParentNutritionTracker;
