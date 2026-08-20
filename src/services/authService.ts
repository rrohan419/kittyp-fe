import { LoginResponse } from "@/pages/Interface/PagesInterface";
import { API_BASE_URL } from "../config/env";
import axiosInstance from "../config/axionInstance"
import { store } from '@/module/store/store';
import { setUser } from '@/module/slice/AuthSlice';
import { fetchUserDetail } from "./UserService";
import { TokenResponse } from "@react-oauth/google";
import { SignupRole } from "@/utils/roles";
import { clearAuthStorage, beginNewAuthSession, getAuthItem, setAuthItem } from "@/utils/authStorage";

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: SignupRole;
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
  type: string;
  breed: string;
  // age: string;
  dateOfBirth: string;
  weight: string;
  activityLevel: string;
  gender: string;
  currentFoodBrand: string;
  healthConditions: string;
  allergies: string;
  isNeutered: boolean;
  microchipNumber?: string;
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
  age?: number | null;
  uuid: string;
  createdAt: string;
  /** Present only briefly after email change — never persist to auth storage. */
  accessToken?: string;
  profilePictureUrl: string;
  ownerPets: PetProfile[];
  fcmToken: string;
}

export const signup = async (data: SignupData) => {
  return postSignup('/auth/signup', data);
};

export interface SignupDoctorData extends Omit<SignupData, 'role'> {
  phoneNumber: string;
  licenseNumber?: string;
  registrationNumber: string;
  specialization?: string;
  experience?: number;
  clinicName?: string;
  clinicAddress?: string;
  professionalSummary?: string;
  degreeCertificateUrl: string;
  registrationCertificateUrl: string;
  governmentIdUrl?: string;
  clinicPhotosUrls?: string;
  photoUrl?: string;
  inviteToken?: string;
}

export interface SignupClinicData extends Omit<SignupData, 'role'> {
  clinicName: string;
  licenseNumber?: string;
  address?: string;
  phone?: string;
  timezone?: string;
}

async function postSignup(path: string, data: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    const { parseApiErrorMessage } = await import('@/utils/validation');
    throw new Error(parseApiErrorMessage(text, 'Signup failed. Please try again.'));
  }
  return response.json();
}

export const signupDoctor = (data: SignupDoctorData) =>
  postSignup('/auth/signup', { ...data, role: 'DOCTOR' as const });

export const signupClinic = (data: SignupClinicData) =>
  postSignup('/auth/signup', { ...data, role: 'CLINIC' as const });

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

      // New tab session so we never overwrite another tab's vault entry
      beginNewAuthSession();
      setAuthItem("access_token", token);
      setAuthItem("roles", JSON.stringify(roles));
    } else {
      throw new Error(data.message || "Signup failed");
    }
  } catch (error) {
    console.error("Error during token exchange:", error);
    throw error.response?.data || "Signup failed. Please try again.";
  }


}

export const login = async (data: AuthData): Promise<{ token: string; roles: string[] }> => {

  try {
    // Step 1: Login to get token
    const loginResponse = await axiosInstance.post<WrappedJwtResponse>('/auth/signin', data);

    const { token, roles } = loginResponse.data.data; // <-- This is JwtResponseModel

    // New tab session so Duplicate-tab / prior login cannot leak into this account
    beginNewAuthSession();
    setAuthItem('access_token', token);
    setAuthItem('roles', JSON.stringify(roles));

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
    const accessToken = getAuthItem('access_token');
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
    const token = getAuthItem('access_token');
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
      clearAuthStorage();
    }

    return false;
  }
};

// Add function to get current user with token validation
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const token = getAuthItem('access_token');
    if (!token) {
      return null;
    }

    // Single /user/me fetch — also validates the token
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
