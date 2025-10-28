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
  profilePictureUrl?: string;
}

export interface AddPet {
  name: string;
  profilePicture: string;
  type: string;
  breed: string;
  // age: string;
  weight: string;
  activityLevel: string;
  gender: string;
  currentFoodBrand: string;
  healthConditions: string;
  allergies: string;
  isNeutered: boolean;
  dateOfBirth: string;
}

export interface UpdatePet {
  uuid: string;
  name: string;
  profilePicture: string;
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
}

// Function to calculate and format age from DOB
export const calculatePetAgeForDisplay = (dobString: string) => {
  if (!dobString) {
      return '';
  }

  const today = new Date();
  const dob = new Date(dobString);

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  // Adjust years and months if the current date is before the birthday
  if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months += 12;
  }

  if (years > 0) {
      // Example: "2 years, 6 months"
      return `${years} yr${years !== 1 ? 's' : ''}, ${months} mo${months !== 1 ? 's' : ''}`;
  } else if (months > 0) {
      // Example: "6 months"
      return `${months} mo${months !== 1 ? 's' : ''}`;
  } else {
      return 'Less than 1 month';
  }
};


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

export const updateUserProfilePicture = async (userUuid: string, profilePictureUrl: string): Promise<UserProfile> => {
  const userResponse = await axiosInstance.patch<WrappedUserResponse>(
    `/user/profile-picture?userUuid=${userUuid}`,
    { profilePictureUrl }
  );
  const user = userResponse.data.data;
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const updatePetPhotos = async (petUuid: string, photos: string[]): Promise<PetProfile> => {
  const response = await axiosInstance.patch<WrappedResponse<PetProfile>>(
    `/pet/photos?uuid=${petUuid}`,
    { photos }
  );
  return response.data.data;
};

export const fetchUserPets = async (): Promise<PetProfile[]> => {
  const response = await axiosInstance.get<WrappedResponse<PetProfile[]>>('/pet/user');
  return response.data.data;
};

export const saveUserFcmToken = async (fcmToken: string): Promise<UserProfile> => {
  
  const userResponse = await axiosInstance.patch<WrappedUserResponse>(`/user/${fcmToken}`);
  const user = userResponse.data.data;

  // Store updated user data
  localStorage.setItem('user', JSON.stringify(user));

  return user;
};