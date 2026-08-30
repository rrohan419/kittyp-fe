import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';

export interface HealthComponent {
  status: string;
  details: Record<string, unknown>;
}

export type HealthOptimizeTarget = 'MEMORY' | 'DISK' | 'POOL' | 'WORKERS';
export type HealthSeverity = 'OK' | 'WATCH' | 'CRITICAL';

export interface HealthAction {
  target: HealthOptimizeTarget;
  severity: HealthSeverity;
  headline: string;
  detail: string;
  optimizeEnabled: boolean;
  optimizeHint: string;
}

export interface SystemHealth {
  status: string;
  components: Record<string, HealthComponent>;
  actions?: HealthAction[];
  loadTestEnabled?: boolean;
  loadTestActive?: HealthOptimizeTarget[];
}

export interface HealthOptimizeResult {
  target: HealthOptimizeTarget;
  applied: boolean;
  summary: string;
  remainingHint: string;
  before: SystemHealth;
  after: SystemHealth;
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await axiosInstance.get<ApiSuccessResponse<SystemHealth>>('/admin/system-health');
  return res.data.data;
}

export async function optimizeSystemHealth(target: HealthOptimizeTarget): Promise<HealthOptimizeResult> {
  const res = await axiosInstance.post<ApiSuccessResponse<HealthOptimizeResult>>(
    '/admin/system-health/optimize',
    { target }
  );
  return res.data.data;
}

export async function startHealthLoad(target: HealthOptimizeTarget): Promise<HealthOptimizeResult> {
  const res = await axiosInstance.post<ApiSuccessResponse<HealthOptimizeResult>>(
    '/admin/system-health/load-test/start',
    { target }
  );
  return res.data.data;
}

export async function stopHealthLoad(target?: HealthOptimizeTarget): Promise<HealthOptimizeResult> {
  const res = await axiosInstance.post<ApiSuccessResponse<HealthOptimizeResult>>(
    '/admin/system-health/load-test/stop',
    target ? { target } : {}
  );
  return res.data.data;
}

export function actionFor(health: SystemHealth | null, target: HealthOptimizeTarget): HealthAction | undefined {
  return health?.actions?.find((action) => action.target === target);
}

export function loadActive(health: SystemHealth | null, target: HealthOptimizeTarget): boolean {
  return Boolean(health?.loadTestActive?.includes(target));
}
