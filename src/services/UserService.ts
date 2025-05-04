import axiosInstance from "@/config/axionInstance";
import { UserProfile } from "./authService";


 interface WrappedUserResponse {
    success: boolean;
    message: string;
    data: UserProfile;
    timestamp: string;
    status: number;
  }

  export interface UserUpdateDto {
    email: string;
    firstName:string;
    lastName:string;
    phoneNumber:string;
    phoneCountryCode:string;
  }
export const fetchUserDetail = async (): Promise<UserProfile> => {
  const userResponse = await axiosInstance.get<WrappedUserResponse>('/user/me');
    const user = userResponse.data.data;

    // Step 4: Store user data if needed
    localStorage.setItem('user', JSON.stringify(user));

    return user;
};

export const updateUserDetails = async (userUuid: string, userUpdateDto: UserUpdateDto): Promise<UserProfile> => {
    const userResponse = await axiosInstance.post<WrappedUserResponse>(`/user?userUuid=${userUuid}`, userUpdateDto);
    const user = userResponse.data.data;

    // Step 4: Store user data if needed
    localStorage.setItem('user', JSON.stringify(user));

    return user;

};