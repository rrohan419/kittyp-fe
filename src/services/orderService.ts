import axiosInstance from "@/config/axionInstance";
import { ApiSuccessResponse, CurrencyType, Taxes } from "./cartService";
import { UserProfile } from "./authService";

export interface OrderAddress {
  name: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  formattedAddress: string | null;
}

export interface OrderProduct {
  uuid: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyType;
  status: string;
  productImageUrls: string[];
  category: string;
  attributes: {
    color: string;
    size: string;
    material: string;
  };
}

export interface OrderItem {
  product: OrderProduct;
  quantity: number;
  price: number;
  itemDetails: {
    size: string;
    color: string;
  };
}

export interface Order {
  orderNumber: string;
  createdAt: string;
  aggregatorOrderNumber: string;
  totalAmount: number;
  subTotal: number;
  taxes: Taxes | null;
  currency: CurrencyType;
  status: string;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  orderItems: OrderItem[];
  user: UserProfile;
}

export interface OrderFilterRequest {
  userUuid: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  searchText: string | null;
}

export interface OrderApiResponse {
  success: boolean;
  message: string;
  data: {
    totalPages: number;
    totalElements: number;
    isFirst: boolean;
    isLast: boolean;
    models: Order[];
  };
  timestamp: string;
  status: number;
}

export interface OrderSingleApiResponse {
  success: boolean;
  message: string;
  data: Order;
  timestamp: string;
  status: number;
}


export const fetchFilteredOrders = async (
  page: number,
  size: number,
  filters: OrderFilterRequest
): Promise<OrderApiResponse> => {
  try {
    // console.log(`Fetching orders with page=${page}, size=${size}, filters:`, filters);
    const response = await axiosInstance.post(
      `/order/filter?page=${page}&size=${size}`,
      filters
    );
    // console.log("Order API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const fetchOrderByOrderNumber = async (orderNumber: string): Promise<OrderSingleApiResponse> => {
  const response = await axiosInstance.get(`/order?orderNumber=${orderNumber}`);
  return response.data;
};

export const fetchOrderInvoice = async (
  orderNumber: string,
  userUuid: string
): Promise<string> => {
  try {
    const response = await axiosInstance.get(
      `/order/invoice/${orderNumber}?userUuid=${userUuid}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    throw error;
  }
};

export const updateOrderStatus = async (orderNumber: string, orderStatus: string): Promise<OrderSingleApiResponse> => {
  const response = await axiosInstance.post(`/order/update/status`, {'orderNumber' : orderNumber, 'orderStatus' : orderStatus});

  return response.data;
}


export const fetchSuccessfullOrderCount = async (): Promise<ApiSuccessResponse<number>> => {
  const response = await axiosInstance.get(`/order/count`);
  return response.data;
};
