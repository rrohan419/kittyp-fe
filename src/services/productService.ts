import axiosInstance from "@/config/axionInstance";
import { CurrencyType } from "./cartService";


export interface Product {
    name: string;
    uuid: string;
    description: string;
    status: string;
    price: number;
    productImageUrls: string[];
    category: string;
    attribute: Attributes;
    currency: CurrencyType

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
    status: string | null;
}
type FetchProducts = {
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
}

export const addProduct = async (data: ProductDto): Promise<WrappedProductResponse> => {
    const response = await axiosInstance.post(`/product`, data);
    return response.data;
};