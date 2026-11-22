import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminApi } from "@/config/admin.api";
import type {
  AdminDto,
  AuthResponseDto,
  LoginDto,
  UserRole,
} from "@shared/types";

// -----------------------------------------------------------------------------
// Public auth context contract
// -----------------------------------------------------------------------------

export interface SendOtpRequest {
  phoneNumber: string;
  role?: UserRole;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
  role?: UserRole;
}

interface AuthContextValue {
  user: AdminDto | null;
  isLoading: boolean;
  isLoginLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  sendOtp: (request: SendOtpRequest) => Promise<void>;
  verifyOtp: (request: VerifyOtpRequest) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// -----------------------------------------------------------------------------
// Storage
// -----------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = "admin-access-token";
const REFRESH_TOKEN_KEY = "admin-refresh-token";
const USER_DATA_KEY = "admin-user-data";

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens(token?: string | null, refreshToken?: string | null): void {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearSessionStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

function getStoredUser(): AdminDto | null {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? (JSON.parse(raw) as AdminDto) : null;
  } catch {
    return null;
  }
}

function storeUser(user: AdminDto): void {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; Message?: unknown };
    if (typeof value.message === "string") return value.message;
    if (typeof value.Message === "string") return value.Message;
  }
  return fallback;
}

/** Convert the auth response into the Admin account shape used by the UI. */
function toAdminUser(
  source: Partial<AuthResponseDto> & Partial<AdminDto>,
  fallback?: AdminDto | null,
): AdminDto {
  return {
    id: source.userId ?? source.id ?? fallback?.id ?? "",
    phoneNumber: source.phoneNumber ?? fallback?.phoneNumber ?? null,
    email: source.email ?? fallback?.email ?? null,
    fullName: source.fullName ?? fallback?.fullName ?? null,
    role: source.role ?? fallback?.role ?? "Admin",
    isActive: source.isActive ?? fallback?.isActive ?? true,
    lastLoginAt: source.lastLoginAt ?? fallback?.lastLoginAt ?? null,
    createdAt: source.createdAt ?? fallback?.createdAt ?? new Date().toISOString(),
  };
}

function requireTokens(result: AuthResponseDto): { token: string; refreshToken: string } {
  if (!result.token || !result.refreshToken) {
    throw new Error("The authentication response did not contain valid tokens.");
  }
  return { token: result.token, refreshToken: result.refreshToken };
}

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AdminDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const applyAuthResult = useCallback(
    (result: AuthResponseDto, fallbackUser?: AdminDto | null) => {
      const tokens = requireTokens(result);
      storeTokens(tokens.token, tokens.refreshToken);

      const nextUser = toAdminUser(result, fallbackUser ?? getStoredUser());
      if (!nextUser.id) throw new Error("The authentication response did not contain a user id.");

      storeUser(nextUser);
      setUser(nextUser);
    },
    [],
  );

  // Restore and rotate the session on application startup.
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const token = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();
      const storedUser = getStoredUser();

      if (!token || !refreshToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const result = await adminApi.refreshToken({ token, refreshToken });
        if (!cancelled) applyAuthResult(result, storedUser);
      } catch {
        if (!cancelled) {
          clearSessionStorage();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [applyAuthResult]);

  const login = useCallback(
    async (dto: LoginDto): Promise<void> => {
      setIsLoginLoading(true);
      try {
        const result = await adminApi.login(dto);
        applyAuthResult(result);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Login failed"));
      } finally {
        setIsLoginLoading(false);
      }
    },
    [applyAuthResult],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await adminApi.logout();
    } catch {
      // Local session cleanup must still happen when the server is unavailable.
    } finally {
      clearSessionStorage();
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<void> => {
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (!token || !refreshToken) {
      await logout();
      return;
    }

    try {
      const result = await adminApi.refreshToken({ token, refreshToken });
      applyAuthResult(result, getStoredUser());
    } catch {
      await logout();
    }
  }, [applyAuthResult, logout]);

  const sendOtp = useCallback(async (request: SendOtpRequest): Promise<void> => {
    try {
      await adminApi.sendOtp({
        phoneNumber: request.phoneNumber.trim(),
        role: request.role,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to send OTP"));
    }
  }, []);

  const verifyOtp = useCallback(
    async (request: VerifyOtpRequest): Promise<void> => {
      try {
        const result = await adminApi.verifyOtp({
          phoneNumber: request.phoneNumber.trim(),
          code: request.code.trim(),
          role: request.role,
        });
        applyAuthResult(result);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to verify OTP"));
      }
    },
    [applyAuthResult],
  );

  const changePassword = useCallback(async (newPassword: string): Promise<void> => {
    try {
      await adminApi.changePassword(newPassword);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to change password"));
    }
  }, []);

  const isAuthenticated = user !== null;

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isLoginLoading,
      isAuthenticated,
      login,
      logout,
      refreshSession,
      sendOtp,
      verifyOtp,
      changePassword,
    }),
    [
      user,
      isLoading,
      isLoginLoading,
      isAuthenticated,
      login,
      logout,
      refreshSession,
      sendOtp,
      verifyOtp,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext<AuthContextValue | undefined>(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within an <AuthProvider>. Wrap your application root with <AuthProvider>.",
    );
  }
  return context;
};
