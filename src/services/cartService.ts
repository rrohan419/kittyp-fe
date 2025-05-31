import axiosInstance from "@/config/axionInstance";
import { Product } from "./productService";

export type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  name?: string;
  phone?: string;
};

export type Taxes = {
  serviceCharge: number;
  shippingCharges: number;
  otherTax: number;
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

export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  PRIORITY = 'PRIORITY'
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
  totalAmount: number;
  subTotal: number;
  taxes: Taxes;
  currency: CurrencyType;
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
  subTotal: number;
  taxes: Taxes;
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

export type RazorpayOrderRequestPayload = {
  amount: number;
  currency: CurrencyType;
  receipt: string;
  notes: string[];
  taxes: Taxes;
}

export type RazorpayVerifyRequestPayLoad = {
  orderId: string;
  paymentId: string;
  signature: string;
}

export type CreateOrderModel = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string;
  status: string;
  attempts: number;
  notes: string;
  created_at: number; // long in Java maps to number in TypeScript
};
export type CreateOrderApiResponse = {
  success: boolean;
  message: string;
  data: CreateOrderModel;
  timestamp: string;
  status: number;
};

export type PaymentVerifyApiResponse = {
  success: boolean;
  message: string;
  data: any;
  timestamp: string;
  status: number;
};

export const formatCurrency = (
  amount: number | string,
  currency: CurrencyType = CurrencyType.INR
): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (!currency || typeof currency !== 'string') {
    console.warn('Invalid currency passed:', currency);
    return numericAmount.toFixed(2);
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

export const latestCartByUserUuid = async (userUuid: string): Promise<OrderApiResponse> => {
  const response = await axiosInstance.get(`/order/created/${userUuid}`);
  return response.data;
};

export const allOrdersByUserUuid = async (userUuid: string): Promise<OrderApiResponse> => {
  const response = await axiosInstance.get(`/order/${userUuid}`);
  return response.data;
};

export const updateOrderStatus = async (updateOrderStatusPayload: UpdateOrderStatusPayload): Promise<OrderApiResponse> => {
  const response = await axiosInstance.post(`/order/update/status`, updateOrderStatusPayload);
  return response.data;
};

export const callRazorpayCreateOrder = async (razorPayOrderRequestPayload : RazorpayOrderRequestPayload) : Promise<CreateOrderApiResponse> => {
  const response = await axiosInstance.post(`/razorpay/create-order`, razorPayOrderRequestPayload);
  return response.data;
}

export const callRazorpayVerifyPayment = async (razorPayVerifyRequestPayload : RazorpayVerifyRequestPayLoad) : Promise<PaymentVerifyApiResponse> => {
  const response = await axiosInstance.post(`/razorpay/verify-payment`, razorPayVerifyRequestPayload);
  console.log("verify res", response);
  return response.data;
}

// Types for Cart
export type CartItemResponse = {
  productUuid: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
};

export type CartResponse = {
  uuid: string;
  items: CartItemResponse[];
  totalAmount: number;
};

export type CartItemRequest = {
  productUuid: string;
  quantity: number;
};

export type ApiSuccessResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  status: number;
};

// Cart Service Functions
export const getCartByUser = async (userUuid: string): Promise<ApiSuccessResponse<CartResponse>> => {
  const response = await axiosInstance.get(`/cart/get/${userUuid}`);
  return response.data;
};

export const addToCart = async (userUuid: string, request: CartItemRequest): Promise<ApiSuccessResponse<CartResponse>> => {
  const response = await axiosInstance.post(`/cart/add/${userUuid}`, request);
  return response.data;
};

export const updateCartItem = async (userUuid: string, request: CartItemRequest): Promise<ApiSuccessResponse<CartResponse>> => {
  const response = await axiosInstance.put(`/cart/update/${userUuid}`, request);
  return response.data;
};

export const removeFromCart = async (userUuid: string, productUuid: string): Promise<ApiSuccessResponse<CartResponse>> => {
  const response = await axiosInstance.delete(`/cart/remove/${userUuid}/${productUuid}`);
  return response.data;
};

export const clearCart = async (userUuid: string): Promise<ApiSuccessResponse<void>> => {
  const response = await axiosInstance.delete(`/cart/clear/${userUuid}`);
  return response.data;
};

export type OrderRequest = {
    billingAddress: Address;
    shippingAddress: Address;
    shippingMethod: ShippingMethod;
};

export type OrderResponse = {
    orderNumber: string;
    createdAt: string;
    aggregatorOrderNumber: string | null;
    totalAmount: number;
    subTotal: number;
    currency: CurrencyType;
    status: string;
    taxes: Taxes;
    shippingAddress: Address;
    billingAddress: Address;
    orderItems: Array<{
        product: Product;
        quantity: number;
        price: number;
        itemDetails: ItemDetails | null;
    }>;
};

// export type OrderApiResponse = ApiSuccessResponse<OrderResponse>;

export const createOrder = async (userUuid: string, orderRequest: OrderRequest): Promise<ApiSuccessResponse<OrderResponse>> => {
    const response = await axiosInstance.post(`/order/checkout/${userUuid}`, orderRequest);
    return response.data;
};

