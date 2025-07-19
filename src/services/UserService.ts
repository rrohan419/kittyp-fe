import axiosInstance from "@/config/axionInstance";
import { PetProfile, UserProfile } from "./authService";


interface WrappedUserResponse {
  success: boolean;
  message: string;
  data: UserProfile;
  timestamp: string;
  status: number;
}


interface WrappedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  status: number;
}

export interface UserUpdateDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneCountryCode: string;
}

export interface AddPet {
  name: string;
  profilePicture: string;
  breed: string;
  age: string;
  weight: string;
  activityLevel: string;
  gender: string;
  currentFoodBrand: string;
  healthConditions: string;
  allergies: string;
  isNeutered: boolean;
}

export interface UpdatePet {
  uuid: string;
  name: string;
  profilePicture: string;
  breed: string;
  age: string;
  weight: string;
  activityLevel: string;
  gender: string;
  currentFoodBrand: string;
  healthConditions: string;
  allergies: string;
  isNeutered: boolean;
}


export const fetchUserDetail = async (): Promise<UserProfile> => {
  const userResponse = await axiosInstance.get<WrappedUserResponse>('/user/me');
  const user = userResponse.data.data;
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

export const addPet = async (petDto: AddPet): Promise<PetProfile> => {
  const response = await axiosInstance.post<WrappedResponse<PetProfile>>(`/pet`, petDto);
  return response.data.data;
};

export const deletePet = async (uuid: string): Promise<PetProfile> => {
  const response = await axiosInstance.delete<WrappedResponse<PetProfile>>(`/pet/${uuid}`);
  return response.data.data;
};

export const editPet = async (updatePetDto: UpdatePet): Promise<PetProfile> => {
  const { uuid, ...petData } = updatePetDto;
  const response = await axiosInstance.put<WrappedResponse<PetProfile>>(`/pet?uuid=${uuid}`, petData);
  return response.data.data;
};

export const fetchUserPets = async (): Promise<PetProfile[]> => {
  const response = await axiosInstance.get<WrappedResponse<PetProfile[]>>('/pet/user');
  return response.data.data;
};