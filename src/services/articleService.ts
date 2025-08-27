import axiosInstance from "@/config/axionInstance";
import { ArticleApiResponse } from "@/pages/Interface/PagesInterface";
import { ApiSuccessResponse } from "./cartService";

// Define types for response
type Author = {
  id: number;
  name: string;
  avatar: string;
  role: string;
};

export type ArticleData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  createdAt: string;
  readTime: number;
  author: Author;
  commentCount: number;
  likeCount: number;
};

export type ArticleCommentDto = {
  comment: string;
  articleId: number;
}

export type SaveArticleCommentModel = {
  comment: string;
  commenterUuid: string;
  articleId: number;
};

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

export const fetchArticles = async ({ page, size, body }: FetchArticles): Promise<ArticleApiResponse> => {
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

// Comments
export type ArticleCommentAuthor = {
  id?: number;
  name: string;
  avatar: string;
  role?: string;
};

export type ArticleComment = {
  id: number;
  content: string;
  createdAt: string;
  author: ArticleCommentAuthor;
  likes?: number;
  liked?: boolean;
};

export type PaginationResult<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export interface WrappedPaginationResponse<T> {
  success: boolean;
  message: string;
  data: PaginationResult<T>;
  timestamp: string;
  status: number;
}

export const fetchArticleComments = async (
  {
    articleId,
    page,
    size
  }: { articleId: number; page: number; size: number }
): Promise<WrappedPaginationResponse<ArticleComment>> => {
  const response = await axiosInstance.get(`/comments`, {
    params: { page, size, articleId }
  });
  return response.data;
};

export const addComment = async (articleCommentsDto: ArticleCommentDto): Promise<ApiSuccessResponse<SaveArticleCommentModel>> => {
  const response = await axiosInstance.post(`comment/add`, articleCommentsDto);
  return response.data;
};

export const addLikeForArticle = async (articleId: number): Promise<ApiSuccessResponse<number>> => {
  const response = await axiosInstance.post(`like/add/${articleId}`);
  return response.data;
}