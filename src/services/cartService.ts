import axiosInstance from "@/config/axionInstance";
import { Product } from "./productService";

export type Address = {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
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
    status: string;
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

  export type UpdateOrderPayload = {
    orderNumber: string;
    productQuantity: Map<string,number>
  };
  


export const createCart = async (orderPayLoad: OrderPayload) : Promise<OrderApiResponse> => {
    const response = await axiosInstance.post(`/order/create`, orderPayLoad);
    return response.data;
};

export const cartByOrderNumber = async (orderNumber : string) : Promise<OrderApiResponse> => {
    const response = await axiosInstance.get(`/order?orderNumber=${orderNumber}`);
    return response.data;
};

export const cartByUserUuid = async (userUuid : string) : Promise<OrderApiResponse> => {
    const response = await axiosInstance.get(`/order/${userUuid}`);
    return response.data;
};

export const updateCartItems = async (updateOrderPayload : UpdateOrderPayload) : Promise<OrderApiResponse> => {
    const response = await axiosInstance.post(`/order/update/quantity`, updateOrderPayload);
    return response.data;
};