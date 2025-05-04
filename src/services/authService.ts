import { LoginResponse } from "@/pages/Interface/PagesInterface";
import { API_BASE_URL } from "../config/env";
import axiosInstance from "../config/axionInstance"

interface SignupData {
  name: string;
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

 
  
  export interface UserProfile {
    id: number;
    email: string;
    firstName:string,
    lastName:string,
    roles: string[];
    enabled: boolean;
    uuid: string;
    createdAt: string;
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
