import axiosInstance from "@/config/axionInstance";
import { UserProfile } from "./authService";
import { ApiSuccessResponse } from "./cartService";

interface PaginationModel<T> {
  models: T[];
  isFirst: boolean;
  isLast: boolean;
  totalElements: number;
  totalPages: number;
}

interface WrappedPaginationResponse<T> {
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

interface AdminDashboardData {
  totalOrders: number;
  productCount: number;
  usersCount : number;
  articleCount : number;
}

export const fetchAllUsers = async (pageNumber: number = 1, pageSize: number = 10): Promise<PaginationModel<UserProfile>> => {
  const response = await axiosInstance.get<WrappedPaginationResponse<UserProfile>>(
    `/admin/users?pageNumber=${pageNumber}&pageSize=${pageSize}`
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