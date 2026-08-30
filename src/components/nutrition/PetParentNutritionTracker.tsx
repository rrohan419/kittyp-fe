import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, SkipForward, Apple } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { DEFAULT_PLAN_DURATION_DAYS } from '@/utils/nutritionDuration';

function dayKey(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addCalendarDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, (d || 1) + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
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
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (petUuidProp) setSelectedPetUuid(petUuidProp);
  }, [petUuidProp]);

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
      const uniqueDays = Array.from(new Set(daily.map((d) => dayKey(d.day)).filter(Boolean))).sort();
      const today = todayKey();
      if (uniqueDays.includes(today)) {
        setSelectedDay(today);
      } else if (uniqueDays.length > 0) {
        setSelectedDay(uniqueDays[0]);
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

  const durationDays = plan?.durationDays && plan.durationDays > 0
    ? plan.durationDays
    : DEFAULT_PLAN_DURATION_DAYS;

  const days = useMemo(() => {
    const unique = Array.from(new Set(dailyItems.map((d) => dayKey(d.day)).filter(Boolean))).sort();
    if (unique.length > 0) return unique;
    if (!plan) return [];
    const start = dayKey(plan.sentAt) || todayKey();
    return Array.from({ length: durationDays }, (_, i) => addCalendarDays(start, i));
  }, [dailyItems, plan, durationDays]);

  const dayItems = useMemo(
    () => dailyItems.filter((d) => dayKey(d.day) === selectedDay),
    [dailyItems, selectedDay]
  );

  const dayLogs = useMemo(
    () => logs.filter((l) => dayKey(l.loggedAt) === selectedDay),
    [logs, selectedDay]
  );

  const completedForDay = dayLogs.filter((l) => l.status === 'COMPLETED').length;

  const totalMeals = dailyItems.length;
  const completedMeals = logs.filter((l) => l.status === 'COMPLETED').length;
  const progressPct = totalMeals > 0 ? Math.min(100, Math.round((completedMeals / totalMeals) * 100)) : 0;
  const dayIndex = days.includes(selectedDay) ? days.indexOf(selectedDay) + 1 : 1;
  const feeding = plan?.nutritionRecommendationResponse?.dailyFeedingPlan;
  const considerations = plan?.nutritionRecommendationResponse?.specialConsiderations ?? [];

  const loggedForItem = (item: PetDailyPlanItem) =>
    logs.find((l) => {
      if (l.dailyPlanId != null && item.id != null && l.dailyPlanId === item.id) return true;
      return dayKey(l.loggedAt) === selectedDay && l.notes === item.itemName;
    });

  const mark = async (status: 'COMPLETED' | 'SKIPPED', item?: PetDailyPlanItem) => {
    if (readOnly || !selectedPetUuid) return;
    const now = new Date();
    const loggedAt =
      selectedDay === todayKey()
        ? `${selectedDay}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
        : `${selectedDay}T12:00:00`;
    try {
      const saved = await createFeedingLog(selectedPetUuid, {
        dailyPlanId: item?.id,
        status,
        quantity: item?.quantityInGrams,
        notes: item?.itemName,
        loggedAt,
      });
      setLogs((prev) => [saved, ...prev.filter((l) => l.id !== saved.id)]);
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
              When your veterinarian sends a nutrition plan, your meal tracker will appear here.
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
                  : `Log each scheduled meal. This plan is for ${durationDays} days.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>
                  Day {dayIndex} of {days.length || durationDays}
                </span>
                <span className="text-muted-foreground">
                  {completedMeals}/{totalMeals || 0} meals logged
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
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

          {(feeding?.meals?.length || considerations.length) ? (
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CollapsibleTrigger asChild>
                    <button type="button" className="flex w-full items-center justify-between text-left">
                      <CardTitle className="text-base">What to feed</CardTitle>
                      <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CardDescription>
                    {feeding?.caloriesPerDay ? `${feeding.caloriesPerDay} kcal / day` : 'Meals from the assigned plan'}
                  </CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-2 pt-0">
                    {feeding?.meals?.map((meal, i) => (
                      <div key={`${meal.time}-${meal.foodType}-${i}`} className="text-sm rounded-lg bg-muted/50 p-3">
                        <p className="font-medium">
                          {meal.time || 'Meal'} · {meal.foodType}
                          {meal.portionSizeGrams ? ` · ${meal.portionSizeGrams}g` : ''}
                        </p>
                        {meal.notes ? <p className="text-xs text-muted-foreground mt-1">{meal.notes}</p> : null}
                      </div>
                    ))}
                    {considerations.map((c, i) => (
                      <p key={`${c.condition}-${i}`} className="text-xs text-muted-foreground">
                        {c.condition}: {c.recommendation}
                      </p>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ) : null}

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{formatDayLabel(selectedDay)}</CardTitle>
                <Badge variant="secondary">{completedForDay} completed</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan && dailyItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This plan was sent, but the daily schedule is not ready yet. Ask the clinic to resend the plan, or
                  try again shortly.
                </p>
              ) : dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scheduled items for this day.</p>
              ) : (
                dayItems.map((item, idx) => {
                  const existing = loggedForItem(item);
                  return (
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
                        {existing ? (
                          <p className="text-xs mt-1 capitalize text-emerald-700">
                            {String(existing.status).toLowerCase()}
                          </p>
                        ) : null}
                      </div>
                      {!readOnly && !existing && (
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
                  );
                })
              )}

              {dayLogs.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground">Logged today</p>
                  {dayLogs.map((log, idx) => (
                    <div key={log.id ?? idx} className="text-xs flex justify-between text-muted-foreground">
                      <span className="capitalize">
                        {String(log.status).toLowerCase()}
                        {log.notes ? ` · ${log.notes}` : ''}
                      </span>
                      <span>{log.loggedAt ? log.loggedAt.slice(11, 16) : ''}</span>
                    </div>
                  ))}
                </div>
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
          <p className="text-sm text-muted-foreground mt-1">
            {plan ? `${durationDays}-day feeding progress` : 'Interactive feeding progress'}
          </p>
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
