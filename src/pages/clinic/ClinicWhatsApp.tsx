import { useCallback } from 'react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { WhatsAppBusinessPage } from '@/components/whatsapp/WhatsAppBusinessPage';
import {
  fetchClinicWhatsAppSettings,
  setupClinicWhatsAppTemplates,
  updateClinicWhatsAppSettings,
} from '@/services/invoiceService';

export default function ClinicWhatsApp() {
  const { clinicUuid } = useActiveClinic();

  const loadSettings = useCallback(() => {
    if (!clinicUuid) return Promise.reject(new Error('No clinic'));
    return fetchClinicWhatsAppSettings(clinicUuid);
  }, [clinicUuid]);

  const saveManual = useCallback(
    (values: { phoneNumberId: string; businessAccountId: string; token?: string }) => {
      if (!clinicUuid) return Promise.reject(new Error('No clinic'));
      return updateClinicWhatsAppSettings(clinicUuid, values);
    },
    [clinicUuid]
  );

  const retryTemplates = useCallback(() => {
    if (!clinicUuid) return Promise.reject(new Error('No clinic'));
    return setupClinicWhatsAppTemplates(clinicUuid);
  }, [clinicUuid]);

  if (!clinicUuid) {
    return <p className="p-6 text-sm text-muted-foreground">Select a clinic to connect WhatsApp.</p>;
  }

  return (
    <WhatsAppBusinessPage
      mode="clinic"
      clinicUuid={clinicUuid}
      loadSettings={loadSettings}
      saveManual={saveManual}
      retryTemplates={retryTemplates}
    />
  );
}
