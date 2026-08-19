import { useLocation } from 'react-router-dom';

/** Clinic portal and doctor portal both host the same doctor directory. */
export function useDoctorsBasePath(): string {
  const { pathname } = useLocation();
  return pathname.startsWith('/doctor') ? '/doctor/doctors' : '/clinic/doctors';
}
