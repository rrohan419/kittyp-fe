import { useCallback } from 'react';
import { WhatsAppBusinessPage } from '@/components/whatsapp/WhatsAppBusinessPage';
import {
  fetchDoctorWhatsAppSettings,
  setupDoctorWhatsAppTemplates,
  updateDoctorWhatsAppSettings,
} from '@/services/invoiceService';

export default function DoctorWhatsApp() {
  const loadSettings = useCallback(() => fetchDoctorWhatsAppSettings(), []);
  const saveManual = useCallback(
    (values: { phoneNumberId: string; businessAccountId: string; token?: string }) =>
      updateDoctorWhatsAppSettings(values),
    []
  );
  const retryTemplates = useCallback(() => setupDoctorWhatsAppTemplates(), []);

  return (
    <WhatsAppBusinessPage
      mode="doctor"
      loadSettings={loadSettings}
      saveManual={saveManual}
      retryTemplates={retryTemplates}
    />
  );
}
