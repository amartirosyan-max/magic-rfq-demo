// src/api/auth.ts
import { useMutation } from "@tanstack/react-query";
import api from "~/api/axios";

interface SigninResponse {
  token: string;
}

interface SigninRequest {
  login: string;
  password: string;
}

const signin = async (credentials: SigninRequest): Promise<SigninResponse> => {
  const response = await api.post<SigninResponse>("/signin", credentials);

  if (!response.data) {
    throw new Error("Authentication failed");
  }

  return response.data;
};

export const useAuth = () => {
  return useMutation({
    mutationFn: signin,
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
    },
  });
};
