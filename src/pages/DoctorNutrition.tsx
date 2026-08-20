import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Apple, CheckCircle2, Send, Eye, Info } from 'lucide-react';
import { toast } from 'sonner';
import { RootState } from '@/module/store/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { NutritionPlanPreview } from '@/components/nutrition/NutritionPlanPreview';
import {
  fetchFilteredNutritionPlans,
  planResponseToPetCarePlan,
  updateNutritionPlan,
  type NutritionPlan,
} from '@/services/petNutritionService';
import type { PetCarePlan } from '@/services/aiService';
import { defaultEnvironmentData } from '@/services/aiService';
import { PetParentNutritionTracker } from '@/components/nutrition/PetParentNutritionTracker';

export default function DoctorNutrition() {
  const user = useSelector((s: RootState) => s.authReducer.user);
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewPlan, setReviewPlan] = useState<NutritionPlan | null>(null);
  const [editablePlan, setEditablePlan] = useState<PetCarePlan | null>(null);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);
  const [trackerPetUuid, setTrackerPetUuid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchFilteredNutritionPlans(0, 30, {
        userUuid: user?.uuid,
      });
      setPlans(page.models ?? []);
    } catch {
      toast.error('Failed to load nutrition plans');
    } finally {
      setLoading(false);
    }
  }, [user?.uuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const openReview = (plan: NutritionPlan) => {
    setReviewPlan(plan);
    setEditablePlan(planResponseToPetCarePlan(plan));
  };

  const handleSaveEdits = async (uuid: string) => {
    if (!editablePlan || reviewPlan?.uuid !== uuid) return;
    setBusyUuid(uuid);
    try {
      await updateNutritionPlan(uuid, {
        recommendationResponse: editablePlan,
        environmentDataDto: editablePlan.environment ?? defaultEnvironmentData,
      });
      toast.success('Edits saved');
      await load();
    } catch {
      toast.error('Failed to save edits');
    } finally {
      setBusyUuid(null);
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
            Generate a plan for a patient, review it, and save a draft.
          </p>
        </div>
        <Button asChild>
          <Link to="/doctor/nutrition/new">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Generate plan
          </Link>
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Approve and send to parent are coming soon. For now, generate a plan, review or edit it, and save a
          draft. Pet parents will receive plans from here in a later update.
        </AlertDescription>
      </Alert>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Apple className="h-4 w-4" /> Inbox
          </CardTitle>
          <CardDescription>Saved drafts you can review and edit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : draftOrApproved.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending plans. Generate one for a patient.</p>
          ) : (
            draftOrApproved.map((plan) => (
              <div
                key={plan.uuid}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border rounded-lg p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{plan.planName}</p>
                    <Badge variant="secondary">{plan.status || 'DRAFT'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pet {plan.petUuid.slice(0, 8)}… · {plan.generationTimestamp}
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
                      disabled
                      title="Approve will be available in a later update"
                    >
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled
                    title="Sending to the pet parent will be available in a later update"
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
          <CardDescription>Parents can track progress; you can view feeding logs on the pet dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sent plans yet.</p>
          ) : (
            sent.map((plan) => (
              <div key={plan.uuid} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{plan.planName}</span>
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
            <DialogDescription>Bi-directional visibility into the 30-day feeding log.</DialogDescription>
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
              Adjust the plan and save your edits. Approve and send to parent will be available later.
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
                <Button variant="secondary" disabled title="Approve will be available in a later update">
                  Approve
                </Button>
                <Button disabled title="Sending to the pet parent will be available in a later update">
                  <Send className="h-4 w-4 mr-1.5" />
                  Send to parent
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
