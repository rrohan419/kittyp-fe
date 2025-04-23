import { OrderResponseData } from "@/services/cartService";

export interface LoginResponse {
    token: string;
    type: string;
    id: number;
    username: string;
    email: string;
    roles: string[];
  }
  
  export interface Author {
    id: number;
    name: string;
    avatar: string;
    role: string;
  }
  
  export interface ArticleList {
    title: string;
    slug: string;
    excerpt: string;
    readTime: number;
    createdAt: string;
    tags: string[];
    author: Author;
    category: string;
    coverImage : string
  }
  
  export interface ArticleApiResponse {
    success: boolean;
    message: string;
    data: {
      totalPages: number;
      totalElements: number;
      isFirst: boolean;
      isLast: boolean;
      models: ArticleList[];
    };
    timestamp: string;
    status: number;
  }

  export interface OrderApiResponse {
    success: boolean;
    message: string;
    data: {
      totalPages: number;
      totalElements: number;
      isFirst: boolean;
      isLast: boolean;
      models: OrderResponseData[];
    };
    timestamp: string;
    status: number;
  }
  