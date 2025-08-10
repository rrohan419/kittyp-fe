import { LoginResponse } from "@/pages/Interface/PagesInterface";
import { API_BASE_URL } from "../config/env";
import axiosInstance from "../config/axionInstance"
import { store } from '@/module/store/store';
import { setUser } from '@/module/slice/CartSlice';
import { fetchUserDetail } from "./UserService";
import { TokenResponse } from "@react-oauth/google";
// import { fetchUserProfile } from './userService';

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthData {
  email: string;
  password: string;
}


interface JwtResponseModel {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface WrappedJwtResponse {
  success: boolean;
  message: string;
  data: JwtResponseModel;
}

export interface WrappedPasswordResetResponse {
  success: boolean;
  message: string;
  data: boolean;
}

export interface PetProfile {
  uuid: string;
  name: string;
  profilePicture: string;
  type: string,
  breed: string;
  age: string;
  weight: string;
  activityLevel: string;
  gender: string;
  currentFoodBrand: string;
  healthConditions: string;
  allergies: string;
  isNeutered: boolean;
  createdAt: string
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string,
  lastName: string,
  roles: string[];
  enabled: boolean;
  phoneCountryCode: string;
  phoneNumber: string;
  uuid: string;
  createdAt: string;
  accessToken: string;
  profilePictureUrl: string;
  ownerPets: PetProfile[];
}

export const signup = async (data: SignupData) => {

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response;
  } catch (error: any) {
    throw error.response?.data || "Signup failed. Please try again.";
  }
};

export const socialSso = async (tokenResponse: TokenResponse) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/social-sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: tokenResponse.access_token,
        provider: "GOOGLE",
      }),
    });

    if (!response.ok) {
      throw new Error("Backend response: " + (await response.text()));
    }

    const data = await response.json();

    if (data.success && data.data) {
      const { token, roles } = data.data;

      // Store tokens and roles
      localStorage.setItem("access_token", token);
      localStorage.setItem("roles", JSON.stringify(roles));
    } else {
      throw new Error(data.message || "Signup failed");
    }
  } catch (error) {
    console.error("Error during token exchange:", error);
    throw error.response?.data || "Signup failed. Please try again.";
  }


}

export const login = async (data: AuthData): Promise<{ token, roles }> => {

  try {
    // Step 1: Login to get token
    const loginResponse = await axiosInstance.post<WrappedJwtResponse>('/auth/signin', data);

    const { token, roles } = loginResponse.data.data; // <-- This is JwtResponseModel

    // Step 2: Store token and roles
    localStorage.setItem('access_token', token);
    localStorage.setItem('roles', JSON.stringify(roles));
    // console.log("user -> -> -> ->", loginResponse);
    // console.log("user -> -> -> ->", { token, roles });

    return { token, roles };
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Login or user fetch failed.');
  }
};

export const sendPasswordResetCode = async (email: string): Promise<boolean> => {
  const loginResponse = await axiosInstance.get<WrappedPasswordResetResponse>('/auth/send-code?email=' + email);
  return loginResponse.data.data;
};

export const verifyPasswordResetCode = async (code: string, email: string): Promise<boolean> => {
  const loginResponse = await axiosInstance.get<WrappedPasswordResetResponse>('/auth/verify-code?code=' + code + '&email=' + email);
  return loginResponse.data.data;
};

export const resetPassword = async (code: string, password: string, email: string): Promise<boolean> => {
  const loginResponse = await axiosInstance.post<WrappedPasswordResetResponse>('/auth/password-reset', { password: password, code: code, email: email });
  return loginResponse.data.data;
};

export const initializeUser = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return null;
    }

    const userProfile = await fetchUserDetail();
    store.dispatch(setUser(userProfile));
    return userProfile;
  } catch (error) {
    console.error('Error initializing user:', error);
    return null;
  }
};

// Add token validation function
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }

    // Make a call to a protected endpoint to validate the token
    const response = await axiosInstance.get('/user/me');
    return response.status === 200;
  } catch (error: any) {
    console.error('Token validation failed:', error);

    // If token is invalid, clear it
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
    }

    return false;
  }
};

// Add function to get current user with token validation
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }

    // Validate token first
    const isValid = await validateToken();
    if (!isValid) {
      return null;
    }

    // If token is valid, fetch user details
    const userProfile = await fetchUserDetail();
    return userProfile;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const getSiteMap = async () => {

  try {
    const response = await fetch(`${API_BASE_URL}/public/sitemap.xml`, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Content-Type": "application/xml",
      },
    });
    return response;
  } catch (error: any) {
    throw error.response?.data || "failed. Please try again.";
  }
};
