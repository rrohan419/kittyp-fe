import { Navigate } from 'react-router-dom';
import { WhatsAppBusinessPage } from '@/components/whatsapp/WhatsAppBusinessPage';
import { useActiveClinic } from '@/hooks/useActiveClinic';

export default function DoctorWhatsApp() {
  const { isPersonalPractice, loading } = useActiveClinic();

  if (!loading && !isPersonalPractice) {
    return <Navigate to="/doctor" replace />;
  }

  return <WhatsAppBusinessPage />;
}
