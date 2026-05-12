// Product Requests API
// GET /product-requests — список заявок
// POST /product-requests — создать заявку (multipart/form-data)
// PUT /product-requests/{id}/status — изменить статус (admin/system)
// GET /product-requests/{id}/files/{file_id} — скачать файл
// DELETE /product-requests/{id} — удалить заявку (admin или владелец)

import api from "~/api/axios";
import { saveAs } from "file-saver";

export type ProductRequestStatus = "PENDING" | "ADDED" | "DECLINED";

export interface IProductRequestFile {
  id: number;
  file_name: string;
  content_type: string;
  size: number;
}

export interface IProductRequestResponse {
  id: number;
  organization_id: number;
  user_id: number;
  name: string;
  category: string | null;
  description: string | null;
  cost: string | null;
  image_url: string | null;
  comments: string | null;
  status: ProductRequestStatus;
  created_at: string;
  files: IProductRequestFile[];
}

export interface ICreateProductRequestForm {
  name: string;
  category?: string;
  description?: string;
  cost?: string;
  comments?: string;
  image?: File;
  files?: File[];
}

export interface IUpdateProductRequestStatusBody {
  status: ProductRequestStatus;
}

export const getProductRequests = async (): Promise<
  IProductRequestResponse[]
> => {
  const response =
    await api.get<IProductRequestResponse[]>("/product-requests");
  return response.data;
};

export const createProductRequest = async (
  form: ICreateProductRequestForm,
): Promise<IProductRequestResponse> => {
  const formData = new FormData();
  formData.append("name", form.name);
  if (form.category != null) formData.append("category", form.category);
  if (form.description != null)
    formData.append("description", form.description);
  if (form.cost != null) formData.append("cost", form.cost);
  if (form.comments != null) formData.append("comments", form.comments);
  if (form.image) formData.append("image", form.image);
  if (form.files?.length) {
    form.files.forEach((file) => formData.append("files", file));
  }

  const response = await api.post<IProductRequestResponse>(
    "/product-requests",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const updateProductRequestStatus = async (
  id: number,
  body: IUpdateProductRequestStatusBody,
): Promise<IProductRequestResponse> => {
  const response = await api.put<IProductRequestResponse>(
    `/product-requests/${id}/status`,
    body,
  );
  return response.data;
};

export const downloadProductRequestFile = async (
  requestId: number,
  fileId: number,
  fileName?: string,
): Promise<void> => {
  const response = await api.get(
    `/product-requests/${requestId}/files/${fileId}`,
    { responseType: "blob" },
  );

  if (!response?.data) {
    throw new Error("Failed to download file");
  }

  let filename = fileName ?? `file-${fileId}`;
  const contentDisposition = response.headers["content-disposition"];
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  saveAs(response.data, filename);
};

export const updateProductRequest = async (
  id: number,
  form: ICreateProductRequestForm,
): Promise<IProductRequestResponse> => {
  const formData = new FormData();
  formData.append("name", form.name);
  if (form.category != null) formData.append("category", form.category);
  if (form.description != null)
    formData.append("description", form.description);
  if (form.cost != null) formData.append("cost", form.cost);
  if (form.comments != null) formData.append("comments", form.comments);
  if (form.image) formData.append("image", form.image);
  if (form.files?.length) {
    form.files.forEach((file) => formData.append("files", file));
  }

  const response = await api.put<IProductRequestResponse>(
    `/product-requests/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const deleteProductRequest = async (id: number): Promise<void> => {
  await api.delete(`/product-requests/${id}`);
};
