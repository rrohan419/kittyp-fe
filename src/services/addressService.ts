import axiosInstance from "@/config/axionInstance";
import { ApiSuccessResponse } from "./cartService";
import { UserProfile } from "./authService";


export interface Address {
  id?: string;
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface AddressModel {
  uuid: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  phoneNumber: string;
  user: UserProfile
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export interface CheckoutSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  serviceFee: number;
  total: number;
}

export enum AddressType {
  HOME = "HOME",
  OFFICE = "OFFICE",
  OTHER = "OTHER"
}

export interface SaveAddressDto {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: AddressType;
  phoneNumber: string;
  formattedAddress: string;
}


// Mock saved addresses - in a real app, these would come from an API
const savedAddresses: Address[] = [
  {
    id: "addr_1",
    street: "123 Main Street",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110001",
    country: "India",
    isDefault: true,
    fullName: "John Doe",
    phoneNumber: "1234567890"
  },
  {
    id: "addr_2",
    street: "456 Park Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
    isDefault: false,
    fullName: "Jane Smith",
    phoneNumber: "0987654321"
  }
];

export const fetchSavedAddresses = async (): Promise<Address[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(savedAddresses), 500);
  });
};

export const findAllSavedAddress = async (userUuid: string): Promise<ApiSuccessResponse<AddressModel[]>> => {
  const response = await axiosInstance.get(`user/address?userUuid=${userUuid}`);
  return response?.data;
};

export const saveNewAddress = async (address: SaveAddressDto, userUuid: string): Promise<AddressModel> => {
  const response = await axiosInstance.post(`user/address?userUuid=${userUuid}`, address);
  return response?.data?.data;
};

export const deleteAddress = async (userUuid: string, addressUuid: string): Promise<ApiSuccessResponse<string>> => {
  const response = await axiosInstance.delete(`/user/address?userUuid=${userUuid}&addressUuid=${addressUuid}`);
  return response?.data;
}
