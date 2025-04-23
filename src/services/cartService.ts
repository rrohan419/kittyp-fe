import axiosInstance from "@/config/axionInstance";
import { Product } from "./productService";

export type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export enum Status {
  CREATED,
  PROCESSING,
  COMPLETED,
  CANCELLED
}

export enum CurrencyType {
  INR = 'INR',
  USD = 'USD'
}

export type ItemDetails = {
  size: string;
  color: string;
};

export type OrderItem = {
  productUuid: string;
  quantity: number;
  price: number;
  itemDetails: ItemDetails;
};

export type OrderPayload = {
  totalAmount: string;
  shippingAddress: Address;
  billingAddress: Address;
  orderItems: OrderItem[];
};

export type ProductAttributes = {
  color: string;
  size: string;
  material: string;
};

export type OrderItemResponse = {
  product: Product;
  quantity: number;
  price: number;
  itemDetails: ItemDetails;
};

export type OrderResponseData = {
  orderNumber: string;
  totalAmount: number;
  currency: CurrencyType;
  status: Status;
  shippingAddress: Address;
  billingAddress: Address;
  orderItems: OrderItemResponse[];
};

export type OrderApiResponse = {
  success: boolean;
  message: string;
  data: OrderResponseData;
  timestamp: string;
  status: number;
};

export type UpdateOrderStatusPayload = {
  orderNumber: string;
  status: Status
};

export const formatCurrency = (
  amount: number | string,
  currency: CurrencyType = CurrencyType.INR // fallback
): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (!currency || typeof currency !== 'string') {
    console.warn('Invalid currency passed:', currency);
    return numericAmount.toFixed(2); // fallback
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numericAmount);
};


export const createCart = async (orderPayLoad: OrderPayload): Promise<OrderApiResponse> => {
  const response = await axiosInstance.post(`/order/create`, orderPayLoad);
  console.log( "currenct    ",response.data.data.currency);
  return response.data;
};

export const cartByOrderNumber = async (orderNumber: string): Promise<OrderApiResponse> => {
  const response = await axiosInstance.get(`/order?orderNumber=${orderNumber}`);
  return response.data;
};

export const cartByUserUuid = async (userUuid: string): Promise<OrderApiResponse> => {
  const response = await axiosInstance.get(`/order/${userUuid}`);
  return response.data;
};

export const updateOrderStatus = async (updateOrderStatusPayload: UpdateOrderStatusPayload): Promise<OrderApiResponse> => {
  const response = await axiosInstance.post(`/order/update/status`, updateOrderStatusPayload);
  return response.data;
};