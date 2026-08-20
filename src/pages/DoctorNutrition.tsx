import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Apple, CheckCircle2, Plus, Send, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NutritionPlanPreview } from '@/components/nutrition/NutritionPlanPreview';
import {
  approveNutritionPlan,
  fetchFilteredNutritionPlans,
  planResponseToPetCarePlan,
  sendNutritionPlan,
  updateNutritionPlan,
  type NutritionPlan,
} from '@/services/petNutritionService';
import type { PetCarePlan } from '@/services/aiService';
import { defaultEnvironmentData } from '@/services/aiService';
import { PetParentNutritionTracker } from '@/components/nutrition/PetParentNutritionTracker';

function petName(plan: NutritionPlan): string {
  return plan.nutritionRecommendationResponse?.petProfileSummary?.name?.trim() || 'Patient';
}

function formatWhen(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'd MMM yyyy, h:mm a');
}

function statusLabel(status?: string): string {
  if (!status || status === 'DRAFT') return 'Draft';
  if (status === 'APPROVED') return 'Approved';
  if (status === 'SENT') return 'Sent';
  return status;
}

export default function DoctorNutrition() {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reviewPlan, setReviewPlan] = useState<NutritionPlan | null>(null);
  const [editablePlan, setEditablePlan] = useState<PetCarePlan | null>(null);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);
  const [trackerPetUuid, setTrackerPetUuid] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<NutritionPlan | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const page = await fetchFilteredNutritionPlans(0, 30, {});
      setPlans(page.models ?? []);
    } catch {
      setLoadError(true);
      toast.error('Failed to load nutrition plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openReview = (plan: NutritionPlan) => {
    setReviewPlan(plan);
    setEditablePlan(planResponseToPetCarePlan(plan));
  };

  const runBusy = async (uuid: string, work: () => Promise<void>) => {
    setBusyUuid(uuid);
    try {
      await work();
      await load();
    } finally {
      setBusyUuid(null);
    }
  };

  const handleSaveEdits = async (uuid: string) => {
    if (!editablePlan || reviewPlan?.uuid !== uuid) return;
    try {
      await runBusy(uuid, async () => {
        await updateNutritionPlan(uuid, {
          recommendationResponse: editablePlan,
          environmentDataDto: editablePlan.environment ?? defaultEnvironmentData,
        });
        toast.success('Edits saved');
      });
    } catch {
      toast.error('Failed to save edits');
    }
  };

  const handleApprove = async (plan: NutritionPlan) => {
    try {
      await runBusy(plan.uuid, async () => {
        await approveNutritionPlan(plan.uuid);
        toast.success(`Approved plan for ${petName(plan)}`);
        setReviewPlan(null);
      });
    } catch {
      toast.error('Failed to approve plan');
    }
  };

  const handleSend = async (plan: NutritionPlan) => {
    try {
      await runBusy(plan.uuid, async () => {
        await sendNutritionPlan(plan.uuid);
        toast.success(`Sent plan to ${petName(plan)}'s parent`);
        setReviewPlan(null);
        setSendTarget(null);
      });
    } catch {
      toast.error('Failed to send plan');
    }
  };

  const draftOrApproved = useMemo(
    () => plans.filter((p) => !p.status || p.status === 'DRAFT' || p.status === 'APPROVED'),
    [plans]
  );
  const sent = useMemo(() => plans.filter((p) => p.status === 'SENT'), [plans]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Nutrition plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, review, approve, and send a plan to the pet parent.
          </p>
        </div>
        <Button asChild>
          <Link to="/doctor/nutrition/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Generate plan
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Apple className="h-4 w-4" /> Inbox
          </CardTitle>
          <CardDescription>Drafts and approved plans waiting to be sent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading plans">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">Could not load plans.</p>
              <Button size="sm" variant="outline" onClick={() => void load()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          ) : draftOrApproved.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No pending plans.</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/doctor/nutrition/new">Generate one for a patient</Link>
              </Button>
            </div>
          ) : (
            draftOrApproved.map((plan) => (
              <div
                key={plan.uuid}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border rounded-lg p-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{plan.planName}</p>
                    <Badge variant={plan.status === 'APPROVED' ? 'default' : 'secondary'}>
                      {statusLabel(plan.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {petName(plan)}
                    {formatWhen(plan.generationTimestamp) ? ` · ${formatWhen(plan.generationTimestamp)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openReview(plan)}>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Review &amp; edit
                  </Button>
                  {plan.status !== 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyUuid === plan.uuid}
                      onClick={() => void handleApprove(plan)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={busyUuid === plan.uuid}
                    onClick={() => setSendTarget(plan)}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Send to parent
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Sent plans</CardTitle>
          <CardDescription>Parents can log meals; you can watch progress here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="h-12 rounded-lg bg-muted animate-pulse" />
          ) : sent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sent plans yet.</p>
          ) : (
            sent.map((plan) => (
              <div
                key={plan.uuid}
                className="flex items-center justify-between gap-2 border border-border rounded-lg p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{plan.planName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {petName(plan)}
                    {formatWhen(plan.sentAt) ? ` · sent ${formatWhen(plan.sentAt)}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setTrackerPetUuid(plan.petUuid)}>
                  View tracker
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!trackerPetUuid} onOpenChange={(open) => !open && setTrackerPetUuid(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parent nutrition progress</DialogTitle>
            <DialogDescription>30-day feeding log for this patient.</DialogDescription>
          </DialogHeader>
          {trackerPetUuid && (
            <PetParentNutritionTracker embedded petUuid={trackerPetUuid} readOnly />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewPlan} onOpenChange={(open) => !open && setReviewPlan(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review &amp; edit nutrition plan</DialogTitle>
            <DialogDescription>
              Adjust the plan, save, approve, then send it to the pet parent.
            </DialogDescription>
          </DialogHeader>
          {editablePlan && (
            <NutritionPlanPreview
              plan={editablePlan}
              editable
              onPlanChange={setEditablePlan}
            />
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewPlan(null)}>
              Close
            </Button>
            {reviewPlan && (
              <>
                <Button
                  variant="secondary"
                  disabled={busyUuid === reviewPlan.uuid}
                  onClick={() => void handleSaveEdits(reviewPlan.uuid)}
                >
                  {busyUuid === reviewPlan.uuid ? 'Saving…' : 'Save edits'}
                </Button>
                {reviewPlan.status !== 'APPROVED' && (
                  <Button
                    variant="secondary"
                    disabled={busyUuid === reviewPlan.uuid}
                    onClick={() => void handleApprove(reviewPlan)}
                  >
                    Approve
                  </Button>
                )}
                <Button
                  disabled={busyUuid === reviewPlan.uuid}
                  onClick={() => setSendTarget(reviewPlan)}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Send to parent
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!sendTarget} onOpenChange={(open) => !open && setSendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this plan to the parent?</AlertDialogTitle>
            <AlertDialogDescription>
              {sendTarget
                ? `${petName(sendTarget)}'s parent will see this plan and can log meals against it. You cannot edit it after sending.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!sendTarget || busyUuid === sendTarget?.uuid}
              onClick={(event) => {
                event.preventDefault();
                if (sendTarget) void handleSend(sendTarget);
              }}
            >
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
