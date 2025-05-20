import { LoginResponse } from "@/pages/Interface/PagesInterface";
import { API_BASE_URL } from "../config/env";
import axiosInstance from "../config/axionInstance"                                           
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
  
  export interface UserProfile {
    id: number;
    email: string;
    firstName:string,
    lastName:string,
    roles: string[];
    enabled: boolean;
    phoneCountryCode: string;
    phoneNumber: string;
    uuid: string;
    createdAt: string;
    accessToken: string;
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

export const login = async (data: AuthData): Promise<{ token, roles }> => {
 
  try {
    // Step 1: Login to get token
    const loginResponse = await axiosInstance.post<WrappedJwtResponse>('/auth/signin', data);

    const { token, roles } = loginResponse.data.data; // <-- This is JwtResponseModel

    // Step 2: Store token and roles
    localStorage.setItem('access_token', token);
    localStorage.setItem('roles', JSON.stringify(roles));
    console.log("user -> -> -> ->", loginResponse);
    console.log("user -> -> -> ->", { token, roles });

    return { token, roles };
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Login or user fetch failed.');
  }
};

export const sendPasswordResetCode = async (email: string): Promise<boolean> => {
  const loginResponse = await axiosInstance.get<WrappedPasswordResetResponse>('/auth/send-code?email='+email);
  return loginResponse.data.data;
};

export const verifyPasswordResetCode = async (code: string, email: string): Promise<boolean> => {
  const loginResponse = await axiosInstance.get<WrappedPasswordResetResponse>('/auth/verify-code?code='+code+'&email='+email);
  return loginResponse.data.data;
};

export const resetPassword = async (code: string, password: string, email: string): Promise<boolean> => {
  const loginResponse = await axiosInstance.post<WrappedPasswordResetResponse>('/auth/password-reset', {password: password, code: code, email: email});
  return loginResponse.data.data;
};
