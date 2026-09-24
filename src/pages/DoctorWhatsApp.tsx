import { useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { WhatsAppBusinessPage } from '@/components/whatsapp/WhatsAppBusinessPage';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  fetchDoctorWhatsAppSettings,
  setupDoctorWhatsAppTemplates,
  updateDoctorWhatsAppSettings,
} from '@/services/invoiceService';

export default function DoctorWhatsApp() {
  const { isPersonalPractice, loading } = useActiveClinic();
  const loadSettings = useCallback(() => fetchDoctorWhatsAppSettings(), []);
  const saveManual = useCallback(
    (values: { phoneNumberId: string; businessAccountId: string; token?: string }) =>
      updateDoctorWhatsAppSettings(values),
    []
  );
  const retryTemplates = useCallback(() => setupDoctorWhatsAppTemplates(), []);

  if (!loading && !isPersonalPractice) {
    return <Navigate to="/doctor" replace />;
  }

  return (
    <WhatsAppBusinessPage
      mode="doctor"
      loadSettings={loadSettings}
      saveManual={saveManual}
      retryTemplates={retryTemplates}
    />
  );
}
