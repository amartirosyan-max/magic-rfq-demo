// User Management API (admin/system)
// GET /users/me — текущий пользователь
// GET /users — список активных пользователей организации
// GET /users/{user_id} — один пользователь
// POST /users — создать пользователя
// PUT /users/{user_id} — обновить
// DELETE /users/{user_id} — soft delete (204 No Content)

import api from "~/api/axios";

export type UserRole = "system" | "admin" | "user";

/** Роли с доступом к табам Users и Feedback */
export const ADMIN_ROLES: UserRole[] = ["system", "admin"];

export function isAdminRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return (ADMIN_ROLES as string[]).includes(r);
}

export interface IUserResponse {
  id: number;
  name: string;
  email: string;
  login: string;
  division: string | null;
  location: string | null;
  role: UserRole | string;
  organization_id: number;
  organization_name: string;
  created_at: string;
}

export interface ICreateUserRequest {
  organization_id: number;
  name: string;
  email?: string;
  login: string;
  password: string;
  division?: string;
  location?: string;
}

export interface IUpdateUserRequest {
  name?: string;
  email?: string;
  login?: string;
  password?: string;
  division?: string;
  location?: string;
  organization_id?: number; // только для role=system
}

export const getAccountInfo = async (): Promise<IUserResponse> => {
  const response = await api.get<IUserResponse>("/users/me");
  return response.data;
};

export const getUsers = async (): Promise<IUserResponse[]> => {
  const response = await api.get<IUserResponse[]>("/users");
  return response.data;
};

export const getUser = async (userId: string): Promise<IUserResponse> => {
  const response = await api.get<IUserResponse>(`/users/${userId}`);
  return response.data;
};

export const createUser = async (
  data: ICreateUserRequest,
): Promise<IUserResponse> => {
  const response = await api.post<IUserResponse>("/users", data);
  return response.data;
};

export const updateUser = async (
  userId: string,
  data: IUpdateUserRequest,
): Promise<IUserResponse> => {
  const response = await api.put<IUserResponse>(`/users/${userId}`, data);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};
