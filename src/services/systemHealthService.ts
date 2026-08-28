import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';

export interface HealthComponent {
  status: string;
  details: Record<string, unknown>;
}

export interface SystemHealth {
  status: string;
  components: Record<string, HealthComponent>;
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await axiosInstance.get<ApiSuccessResponse<SystemHealth>>('/admin/system-health');
  return res.data.data;
}
