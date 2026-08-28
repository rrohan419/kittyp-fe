import { ApiSuccessResponse, CurrencyType } from './cartService';
import axiosInstance from "@/config/axionInstance";

export interface FavoriteProduct {
  uuid: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string[];
  currency: CurrencyType;
  status: ProductStatus;
}

export enum ProductStatus{
  ACTIVE = "active",
  INACTIVE = "inactive",
  OUT_OF_STOCK = "out_of_stock",
  // DISCONTINUED = "discontinued",
  // RESTOCKING = "restocking",
  // PRE_ORDER = "pre_order",
  // BACKORDER = "backorder",
  // CANCELLED = "cancelled",
  // RETURNED = "returned",
}

export interface FavoritesResponse {
  models: FavoriteProduct[];
  isFirst: boolean;
  isLast: boolean;
  totalElements: number;
  totalPages: number;
}

export const fetchFavorites = async (userUuid: string, page = 1, size = 10, category?: string): Promise<ApiSuccessResponse<FavoritesResponse>> => {
  const response = await axiosInstance.get(`/favorites?userUuid=${userUuid}&pageNumber=${page}&pageSize=${size}${category ? `&category=${category}` : ''}`);
  if (response.status !== 200) throw new Error('Failed to fetch favorites');
  return response.data;
};

export const addToFavorites = async (userUuid: string, productUuid: string, category?: string): Promise<ApiSuccessResponse<void>> => {
  const response = await axiosInstance.post(`/favorites/${productUuid}?userUuid=${userUuid}${category ? `&category=${category}` : ''}`);
  if (response.status !== 200) throw new Error('Failed to add to favorites');
  return response.data;
};

export const removeFromFavorites = async (userUuid: string, productUuid: string): Promise<ApiSuccessResponse<void>> => {
  const response = await axiosInstance.delete(`/favorites/${productUuid}?userUuid=${userUuid}`);
  if (response.status !== 200) throw new Error('Failed to remove from favorites');
  return response.data;
}; 