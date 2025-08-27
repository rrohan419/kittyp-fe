import { Author, AuthorApiResponse, SaveAuthor } from "@/pages/Interface/PagesInterface";
import { ApiSuccessResponse } from "./cartService";
import axiosInstance from "@/config/axionInstance";

export const fetchAuthors = async ({ page, size }) : Promise<AuthorApiResponse> => {
    const response = await axiosInstance.get(`/article/author/all?page=${page}&size=${size}`);
    return response.data;
  };

  export const createAuthors = async (body: SaveAuthor): Promise<ApiSuccessResponse<Author>> => {
    const response = await axiosInstance.post('admin/author/create', body);
    return response.data;
  };

  export const editAuthors = async (id: number, body: SaveAuthor): Promise<ApiSuccessResponse<Author>> => {
    const response = await axiosInstance.patch(`/author/${id}`, body);
    return response.data;
  };