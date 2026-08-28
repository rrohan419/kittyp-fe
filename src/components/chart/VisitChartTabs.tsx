import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotesTab } from './NotesTab';
import { PrescriptionsTab, type ThisVisitRef } from './PrescriptionsTab';
import { VitalsTab } from './VitalsTab';
import { isChartTabId, type ChartNotesSlice, type ChartTabId, type ChartVitalsSlice } from './chartTabs';
import type { PrescriptionPetDetails } from './prescriptionPet';
import type { NoteHistoryItem, PrescriptionHistoryItem, VitalHistoryItem } from './prescriptionsFromVisits';

export interface VisitChartTabsProps {
  tab: ChartTabId;
  onTabChange: (tab: ChartTabId) => void;
  editable: boolean;
  vitals: ChartVitalsSlice;
  onVitalsChange?: (next: ChartVitalsSlice) => void;
  notes: ChartNotesSlice;
  onNotesChange?: (next: ChartNotesSlice) => void;
  plan: string;
  onPlanChange?: (plan: string) => void;
  vitalHistory?: VitalHistoryItem[];
  noteHistory?: NoteHistoryItem[];
  prescriptionHistory?: PrescriptionHistoryItem[];
  clinicUuid?: string | null;
  petUuid?: string | null;
  excludeVisitUuid?: string | null;
  pet: PrescriptionPetDetails;
  thisVisit?: ThisVisitRef | null;
}

export function VisitChartTabs({
  tab,
  onTabChange,
  editable,
  vitals,
  onVitalsChange,
  notes,
  onNotesChange,
  plan,
  onPlanChange,
  vitalHistory,
  noteHistory,
  prescriptionHistory,
  clinicUuid,
  petUuid,
  excludeVisitUuid,
  pet,
  thisVisit,
}: VisitChartTabsProps) {
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (isChartTabId(value)) onTabChange(value);
      }}
    >
      <TabsList className="w-full justify-start">
        <TabsTrigger value="vitals">Vitals</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
      </TabsList>

      {tab === 'vitals' ? (
        <TabsContent value="vitals" className="mt-4">
          <VitalsTab
            editable={editable}
            vitals={vitals}
            onVitalsChange={onVitalsChange}
            history={vitalHistory}
          />
        </TabsContent>
      ) : null}

      {tab === 'notes' ? (
        <TabsContent value="notes" className="mt-4">
          <NotesTab
            editable={editable}
            notes={notes}
            onNotesChange={onNotesChange}
            history={noteHistory}
          />
        </TabsContent>
      ) : null}

      {tab === 'prescriptions' ? (
        <TabsContent value="prescriptions" className="mt-4">
          <PrescriptionsTab
            editable={editable}
            plan={plan}
            onPlanChange={onPlanChange}
            pet={pet}
            thisVisit={thisVisit}
            history={prescriptionHistory}
            clinicUuid={clinicUuid}
            petUuid={petUuid}
            excludeVisitUuid={excludeVisitUuid}
          />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
