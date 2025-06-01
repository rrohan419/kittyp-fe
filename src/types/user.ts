export interface UserProfile {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: UserProfile;
  };
  timestamp: string;
  status: number;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
  };
  timestamp: string;
  status: number;
} 