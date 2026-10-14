import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from '@/services/cartService';
import { PaginationModel } from '@/services/adminService';

export interface TimeZoneOption {
  timezoneId: string;
  displayName: string;
}

export async function searchTimeZones(
  search: string,
  pageNumber: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<PaginationModel<TimeZoneOption>> {
  const response = await axiosInstance.get<ApiSuccessResponse<PaginationModel<TimeZoneOption>>>(
    '/public/timezones',
    {
      params: { search: search.trim() || undefined, pageNumber, pageSize },
      signal,
    }
  );
  return response.data.data;
}
