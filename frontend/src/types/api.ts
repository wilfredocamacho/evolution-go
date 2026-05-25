export interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
}

export interface ApiError {
  message: string;
  status: number;
}

export type RequestOptions = {
  method?: string;
  body?: unknown;
  apiKey?: string;
  isAdmin?: boolean;
  instanceId?: string;
  params?: Record<string, string>;
  isFormData?: boolean;
};
