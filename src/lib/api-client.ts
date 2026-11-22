import { getApiUrl } from "@/config/api";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  data?: unknown;
}

// ----------------------------------------------------------------------
// UserRole enum
// ----------------------------------------------------------------------

export const UserRole = {
  Customer: 0,
  Driver: 1,
  Store: 2,
  Admin: 3,
  Supervisor: 4,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

const USER_ROLE_MAP: Record<string, UserRole> = {
  Customer: 0,
  Driver: 1,
  Store: 2,
  Admin: 3,
  Supervisor: 4,
};

export const getUserRole = (role: string | number): UserRole => {
  if (typeof role === "number") return role as UserRole;
  return USER_ROLE_MAP[role] ?? UserRole.Customer;
};

export const getRoleName = (role: UserRole): string => {
  const names: Record<UserRole, string> = {
    0: "Customer",
    1: "Driver",
    2: "Store",
    3: "Admin",
    4: "Supervisor",
  };
  return names[role];
};

// ----------------------------------------------------------------------
// Storage keys — MUST match AuthProvider
// ----------------------------------------------------------------------

const ACCESS_TOKEN_KEY = "admin-access-token";
const REFRESH_TOKEN_KEY = "admin-refresh-token";

// ----------------------------------------------------------------------
// Request Options
// ----------------------------------------------------------------------

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  isFormData?: boolean;
  skipAuth?: boolean;
}

// ----------------------------------------------------------------------
// API Client Class
// ----------------------------------------------------------------------

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const {
      params,
      body,
      isFormData = false,
      skipAuth = false,
      ...fetchOptions
    } = options;

    let url = getApiUrl(endpoint);
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (!skipAuth) {
      const token = this.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...headers,
        ...(fetchOptions.headers as Record<string, string>),
      },
      credentials: "include",
    };

    if (body !== undefined && options.method !== "GET") {
      config.body = isFormData ? (body as FormData) : JSON.stringify(body);
    }

    try {
      console.log("[apiClient] Request:", {
        method: options.method,
        url: getApiUrl(endpoint),
        hasToken: !!this.getToken(),
        tokenPreview: this.getToken()?.slice(-10),
        headers: headers,
      });

      const response = await fetch(url, config);

      if (response.status === 204) return null as T;

      let data: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      }

      // Handle 401 — try refresh, then retry
      if (response.status === 401 && !skipAuth) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          const newToken = this.getToken();
          if (newToken) {
            const retryHeaders: Record<string, string> = { ...headers };
            retryHeaders["Authorization"] = `Bearer ${newToken}`;
            const retryConfig: RequestInit = {
              ...config,
              headers: {
                ...retryHeaders,
                ...(fetchOptions.headers as Record<string, string>),
              },
            };
            const retryResponse = await fetch(url, retryConfig);
            if (retryResponse.status === 204) return null as T;

            let retryData: any = null;
            const retryContentType = retryResponse.headers.get("content-type");
            if (retryContentType?.includes("application/json")) {
              retryData = await retryResponse.json();
            }

            if (!retryResponse.ok)
              throw this.buildError(retryResponse.status, retryData);

            if (
              retryData &&
              typeof retryData === "object" &&
              "data" in retryData
            ) {
              return retryData.data as T;
            }
            return retryData as T;
          }
        }

        // Refresh failed — clear and throw
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        throw this.buildError(401, { Message: "Session expired" });
      }

      if (!response.ok) throw this.buildError(response.status, data);

      if (data && typeof data === "object" && "data" in data) {
        return data.data as T;
      }

      return data as T;
    } catch (error: any) {
      if (error?.status) throw error;
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw this.buildError(0, {
          Message: "Network error: Unable to connect to the server",
        });
      }
      throw error;
    }
  }

  private buildError(status: number, data: any): ApiError {
    const message =
      data?.Message ??
      data?.message ??
      data?.title ??
      `Request failed with status ${status}`;
    const errors = data?.Errors ?? data?.errors;
    return { status, message, errors, data };
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      const currentToken = this.getToken();
      if (!refreshToken || !currentToken) return false;

      const response = await fetch(getApiUrl("/api/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token: currentToken, refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data?.token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.token);
        if (data.refreshToken)
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  async post<T = any>(
    endpoint: string,
    body?: unknown,
    options?: Partial<RequestOptions>,
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body, ...options });
  }

  async put<T = any>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  async patch<T = any>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PATCH", body });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  }

  async putUpload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: formData,
      isFormData: true,
    });
  }

  async download(endpoint: string, filename?: string): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = { Accept: "*/*" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(getApiUrl(endpoint), { headers });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const apiClient = new ApiClient();
