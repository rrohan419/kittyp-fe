import { API_BASE_URL } from "../config/env";

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface AuthData {
    email: string;
    password: string;
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

export const login = async (data: AuthData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed. Please try again.');
      }
      console.log("---------------------------->>>>>>>>>>>>>>>>>>>>>>>>",response)
      return response.json(); // Assuming response contains { token, user info }
    } catch (error: any) {
      throw error.message || 'Login failed. Please try again.';
    }
  };
