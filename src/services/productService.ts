import axiosInstance from "@/config/axionInstance";
import { ApiSuccessResponse, CurrencyType } from "./cartService";

export interface Product {
    name: string;
    uuid: string;
    description: string;
    status: string;
    price: number;
    productImageUrls: string[];
    category: string;
    attributes: Attributes;
    currency: CurrencyType;
    stockQuantity: number;
    sku: string;
}
export interface Attributes {
    color: string;
    size: string;
    material: string
}

export type ProductFilterRequest = {

    name: string | null;
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    status: string[] | null;
    isRandom: boolean | null;
}

export type FetchProducts = {
    page: number;
    size: number;
    body: ProductFilterRequest;
}

export interface ProductApiResponse {
    success: boolean;
    message: string;
    data: {
        totalPages: number;
        totalElements: number;
        isFirst: boolean;
        isLast: boolean;
        models: Product[];
    };
    timestamp: string;
    status: number;
}

interface WrappedProductResponse {
    success: boolean;
    message: string;
    data: Product;
    timestamp: string;
    status: number;
}

interface WrappedProductCountResponse {
    success: boolean;
    message: string;
    data: number;
    timestamp: string;
    status: number;
}

export interface ProductDto {
    name: string;
    description: string;
    status: ProductStatus;
    price: number;
    productImageUrls: string[];
    category: string;
    attribute: Attributes;
    stockQuantity: number;
    sku: string;
}
enum ProductStatus {
    ACTIVE,
    INACTIVE,
    OUT_OF_STOCK
}

export const fetchFilteredProducts = async ({ page, size, body }: FetchProducts): Promise<ProductApiResponse> => {
    const response = await axiosInstance.post(`/product/all?page=${page}&size=${size}`, body);
    return response.data;
};

export const fetchProductByUuid = async( uuid : string): Promise<WrappedProductResponse> => {
    const response = await axiosInstance.get(`/product/${uuid}`);
    return response.data;
};

export const addProduct = async (data: ProductDto): Promise<WrappedProductResponse> => {
    const response = await axiosInstance.post(`/product`, data);
    return response.data;
};

export const fetchProductCount = async( isActive : Boolean): Promise<WrappedProductCountResponse> => {
    const response = await axiosInstance.get(`admin/product/count?isActive=${isActive}`);
    return response.data;
};

export const deleteProductAdmin = async(productUuid: string): Promise<ApiSuccessResponse<string>> => {
    const response = await axiosInstance.delete(`admin/product/${productUuid}`);
    return response.data;
}

export const updateProductAdmin = async (productUuid: string, data: ProductDto): Promise<WrappedProductResponse> => {
    const response = await axiosInstance.put(`admin/product/update?productUuid=${productUuid}`, data);
    return response.data;
};