import axiosInstance from "@/config/axionInstance";
import { ArticleApiResponse } from "@/pages/Interface/PagesInterface";

// Define types for response
type Author = {
    id: number;
    name: string;
    avatar: string;
    role: string;
  };
  
  type ArticleData = {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    category: string;
    tags: string[];
    readTime: number;
    author: Author;
    comments: any; // Define more specific types if needed
  };
  
//   type ArticleApiResponse = {
//     success: boolean;
//     message: string;
//     data: ArticleData;
//     timestamp: string;
//     status: number;
//   };

interface WrappedArticleResponse {
    success: boolean;
    message: string;
    data: ArticleData;
    timestamp: string;
    status: number;
  }

  export type ArticleSearchRequest = {
    name: string | null;
    isRandom: boolean | null;
    articleStatus: string | null;
  };
  
   type FetchArticles = {
    page: number;
    size: number;
    body: ArticleSearchRequest;
  };

  type FetchArticleBySlug = {
    slug: string;
  };

  export const fetchArticles = async ({ page, size, body }: FetchArticles) : Promise<ArticleApiResponse> => {
    const response = await axiosInstance.post(`/article/all?page=${page}&size=${size}`, body);
    return response.data;
  };

  export const fetchArticleBySlug = async ({ slug }: FetchArticleBySlug): Promise<WrappedArticleResponse> => {
    const response = await axiosInstance.get(`/article/${slug}`);
    return response.data;
  };

  export type CreateArticleRequest = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    category: string;
    tags: string[];
    readTime: number;
    authorId: number;
  };

  export type EditArticleRequest = {
    title?: string;
    excerpt?: string;
    content?: string;
    coverImage?: string;
    category?: string;
    tags?: string[];
    readTime?: number;
  };

  export const createArticle = async (body: CreateArticleRequest): Promise<WrappedArticleResponse> => {
    const response = await axiosInstance.post('/article', body);
    return response.data;
  };

  export const editArticle = async (slug: string, body: EditArticleRequest): Promise<WrappedArticleResponse> => {
    const response = await axiosInstance.patch(`/admin/article/edit/${slug}`, body);
    return response.data;
  };