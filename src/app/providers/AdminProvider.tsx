import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@app/providers/AuthProvider";
import { adminApi } from "@/config/admin.api";
import type {
  AdminDto,
  DashboardStatsDto,
  UpdateUserDto,
  UserDetailDto,
} from "@shared/types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  role: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

interface AdminStoreContextValue {
  admin: AdminProfile | null;
  stats: DashboardStatsDto | null;
  isLoading: boolean;
  error: string | null;
  refreshAdmin: () => Promise<void>;
  refreshStats: () => Promise<void>;
  updateProfile: (dto: UpdateUserDto) => Promise<void>;
  getAdminName: () => string;
}

const AdminStoreContext = createContext<AdminStoreContextValue | undefined>(
  undefined,
);

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function mapUserToProfile(user: AdminDto | UserDetailDto): AdminProfile {
  const role = ("adminRole" in user ? user.adminRole : undefined) ?? user.role ?? "Admin";
  const avatarUrl = "profilePictureUrl" in user ? user.profilePictureUrl : null;
  const updatedAt =
    "updatedAt" in user && typeof user.updatedAt === "string" ? user.updatedAt : null;
  return {
    id: user.id,
    fullName: user.fullName ?? "",
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? "",
    avatarUrl,
    role,
    roleName: role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; Message?: unknown };
    if (typeof value.message === "string") return value.message;
    if (typeof value.Message === "string") return value.Message;
  }
  return "Failed to load administrator profile.";
}

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAdminName = useCallback(
    () => admin?.fullName || authUser?.fullName || "Admin",
    [admin?.fullName, authUser?.fullName],
  );

  const buildFromAuth = useCallback(() => {
    if (authUser) setAdmin(mapUserToProfile(authUser));
  }, [authUser]);

  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      // Dashboard statistics are non-critical, but retain an actionable error.
      setError(getErrorMessage(err));
    }
  }, []);

  const fetchAdmin = useCallback(async (): Promise<void> => {
    if (!authUser) return;

    setIsLoading(true);
    setError(null);

    try {
      // Uses the v2 route: GET /api/admin/user-management/users/{id}.
      const user = await adminApi.getUser(authUser.id);
      setAdmin(mapUserToProfile(user));
    } catch (err) {
      // The auth response already contains enough profile data to keep the UI usable.
      setError(getErrorMessage(err));
      buildFromAuth();
    } finally {
      setIsLoading(false);
    }
  }, [authUser, buildFromAuth]);

  const refreshAdmin = useCallback(() => fetchAdmin(), [fetchAdmin]);
  const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

  const updateProfile = useCallback(
    async (dto: UpdateUserDto): Promise<void> => {
      if (!admin) return;

      const previous = admin;
      setAdmin((current) =>
        current
          ? {
              ...current,
              fullName: dto.fullName ?? current.fullName,
              email: dto.email ?? current.email,
              phoneNumber: dto.phoneNumber ?? current.phoneNumber,
              isActive: dto.isActive ?? current.isActive,
            }
          : current,
      );

      try {
        // Uses PUT /api/admin/user-management/users/{id}.
        const updated = await adminApi.updateUser(admin.id, dto);
        setAdmin(mapUserToProfile(updated));
      } catch (err) {
        setAdmin(previous);
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [admin],
  );

  useEffect(() => {
    if (!isAuthenticated || !authUser) {
      setAdmin(null);
      setStats(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    buildFromAuth();
    void Promise.all([fetchAdmin(), fetchStats()]);
  }, [isAuthenticated, authUser, buildFromAuth, fetchAdmin, fetchStats]);

  const contextValue = useMemo<AdminStoreContextValue>(
    () => ({
      admin,
      stats,
      isLoading,
      error,
      refreshAdmin,
      refreshStats,
      updateProfile,
      getAdminName,
    }),
    [
      admin,
      stats,
      isLoading,
      error,
      refreshAdmin,
      refreshStats,
      updateProfile,
      getAdminName,
    ],
  );

  return (
    <AdminStoreContext.Provider value={contextValue}>
      {children}
    </AdminStoreContext.Provider>
  );
};

export const useAdminStore = (): AdminStoreContextValue => {
  const context = useContext<AdminStoreContextValue | undefined>(AdminStoreContext);
  if (!context) {
    throw new Error("useAdminStore must be used within an <AdminProvider>.");
  }
  return context;
};

export default AdminProvider;
