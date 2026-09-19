import axiosInstance from "@/config/axionInstance";
import { UserProfile } from "./authService";
import { ApiSuccessResponse } from "./cartService";

export interface PaginationModel<T> {
  models: T[];
  isFirst: boolean;
  isLast: boolean;
  totalElements: number;
  totalPages: number;
  pageNumber?: number;
  pageSize?: number;
}

export function emptyPage<T>(pageSize = 10): PaginationModel<T> {
  return {
    models: [],
    isFirst: true,
    isLast: true,
    totalElements: 0,
    totalPages: 0,
    pageNumber: 1,
    pageSize,
  };
}

export interface WrappedPaginationResponse<T> {
  success: boolean;
  message: string;
  data: PaginationModel<T>;
  timestamp: string;
  status: number;
}

interface WrappedUserResponse {
  success: boolean;
  message: string;
  data: UserProfile;
  timestamp: string;
  status: number;
}

export interface AdminDashboardData {
  totalOrders: number;
  productCount: number;
  usersCount: number;
  articleCount: number;
  pendingDoctorsCount: number;
  clinicsCount: number;
}

export const fetchAllUsers = async (
  pageNumber: number = 1,
  pageSize: number = 10,
  q: string = ''
): Promise<PaginationModel<UserProfile>> => {
  const response = await axiosInstance.get<WrappedPaginationResponse<UserProfile>>(
    '/admin/users',
    {
      params: {
        pageNumber,
        pageSize,
        q: q.trim() || undefined,
      },
    }
  );
  return response.data.data;
};

/** Pet-owner accounts only (ROLE_USER, no staff roles). */
export const fetchPetOwners = async (
  pageNumber: number = 1,
  pageSize: number = 10,
  q: string = ''
): Promise<PaginationModel<UserProfile>> => {
  const response = await axiosInstance.get<WrappedPaginationResponse<UserProfile>>(
    '/admin/parents',
    {
      params: {
        pageNumber,
        pageSize,
        q: q.trim() || undefined,
      },
    }
  );
  return response.data.data;
};

export const updateUserStatus = async (userUuid: string, enabled: boolean): Promise<UserProfile> => {
  const response = await axiosInstance.patch<WrappedUserResponse>(
    `/admin/users/${userUuid}/status`,
    { enabled }
  );
  return response.data.data;
};

export const createUser = async (userData: Omit<UserProfile, 'id' | 'uuid' | 'createdAt' | 'enabled'>): Promise<UserProfile> => {
  const response = await axiosInstance.post<WrappedUserResponse>(
    '/admin/users',
    userData
  );
  return response.data.data;
};

export const updateUser = async (userUuid: string, userData: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await axiosInstance.put<WrappedUserResponse>(
    `/admin/users/${userUuid}`,
    userData
  );
  return response.data.data;
}; 

export const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const response = await axiosInstance.get<ApiSuccessResponse<AdminDashboardData>>(
    `/admin/dashboard-summary`
  );
  return response.data.data;
};