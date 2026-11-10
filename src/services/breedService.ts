import axiosInstance from '@/config/axionInstance';
import type { PaginationModel } from '@/services/adminService';
import type { ApiSuccessResponse } from '@/services/cartService';

export interface BreedOption {
  id: number;
  species: string;
  name: string;
  aliases: string[];
}

export async function searchBreeds(
  species: string,
  search: string,
  pageNumber: number,
  signal?: AbortSignal,
): Promise<PaginationModel<BreedOption>> {
  const response = await axiosInstance.get<ApiSuccessResponse<PaginationModel<BreedOption>>>(
    '/public/breeds',
    { params: { species: species.trim(), search: search.trim(), pageNumber, pageSize: 20 }, signal },
  );
  return response.data.data;
}
