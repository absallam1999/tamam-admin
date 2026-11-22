import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@app/providers/AuthProvider";
import { adminApi } from "@/config/admin.api";
import type {
  UsersQueryParams,
  UpdateUserDto,
  UpdateSupervisorDto,
  CreateAdminDto,
  CreateStoreDto,
  CreateSupervisorDto,
  CreateStoreOwnerDto,
  UpdateStoreOwnerDto,
  RequestDto,
  RequestQueryParams,
  UserListItemDto,
  UserDetailDto,
  AdminDto,
  SupervisorDto,
  StoreDto,
  StoreOwnerDto,
  PagedResult,
} from "@shared/types";

// -----------------------------------------------------------------------------
// Legacy type aliases
// -----------------------------------------------------------------------------
type AdminCreateStoreDto = CreateStoreDto;
type AdminCreateSupervisorDto = CreateSupervisorDto;

// -----------------------------------------------------------------------------
// Normalise role to the string enum used by the API
// -----------------------------------------------------------------------------
function normalizeRole(role: string | number | null | undefined): string {
  if (role === undefined || role === null || role === "") return "Customer";

  if (typeof role === "number") {
    const numericMap: Record<number, string> = {
      0: "Customer",
      1: "Driver",
      2: "StoreOwner",
      3: "Admin",
      4: "Supervisor",
    };
    return numericMap[role] ?? "Customer";
  }

  const key = String(role).toLowerCase();
  const map: Record<string, string> = {
    customer: "Customer",
    driver: "Driver",
    storeowner: "StoreOwner",
    store: "StoreOwner",
    admin: "Admin",
    superadmin: "Admin",
    moderator: "Admin",
    support: "Admin",
    supervisor: "Supervisor",
  };
  return map[key] ?? "Customer";
}

// ============================================================
// Users List — GET /api/admin/user-management/users
// ============================================================
export const useUsers = (params?: UsersQueryParams) => {
  return useQuery<PagedResult<UserListItemDto>>({
    queryKey: ["adminUsers", params],
    queryFn: () => adminApi.getUsers(params),
    staleTime: 30_000,
  });
};

// ============================================================
// Single User
//   - Supervisor         → GET /api/admin/supervisors/{id}  → SupervisorDto
//   - StoreOwner         → GET /api/admin/store-owners/{id} → StoreOwnerDto
//   - Store              → GET /api/admin/stores/{id}       → StoreDto
//   - Customer/Driver/Admin → GET /api/admin/user-management/users/{id} → UserDetailDto
// ============================================================
export const useUser = (userId: string, role?: string) => {
  return useQuery<
    UserDetailDto | SupervisorDto | StoreOwnerDto | StoreDto
  >({
    queryKey: ["adminUser", userId, role],
    queryFn: async () => {
      const normalizedRole = (role || "").toLowerCase();

      switch (normalizedRole) {
        case "supervisor":
          return adminApi.getSupervisor(userId) as Promise<SupervisorDto>;

        case "storeowner":
          return adminApi.getStoreOwner(userId) as Promise<StoreOwnerDto>;

        case "store":
          return adminApi.getStore(userId) as Promise<StoreDto>;

        case "customer":
        case "driver":
        case "admin":
        case "superadmin":
        default:
          return adminApi.getUser(userId);
      }
    },
    enabled: !!userId,
  });
};

// ============================================================
// Update User — PUT /api/admin/user-management/users/{id}
// ============================================================
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      dto,
    }: {
      userId: string;
      /** Retained for caller compatibility; v2 updateUser does not use role. */
      role?: string;
      dto: UpdateUserDto;
    }) => adminApi.updateUser(userId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUser"] });
    },
  });
};

// ============================================================
// Generic Update User — routes by normalised role:
//   StoreOwner → PUT /api/admin/store-owners/{id}
//   Supervisor → PUT /api/admin/supervisors/{id}
//   others     → PUT /api/admin/user-management/users/{id}
// ============================================================
export const useGenericUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
      dto,
    }: {
      userId: string;
      role: string | number;
      dto: Record<string, unknown>;
    }) => {
      const normalizedRole = normalizeRole(role);

      switch (normalizedRole) {
        case "StoreOwner":
          return adminApi.updateStoreOwner(userId, dto as UpdateStoreOwnerDto);
        case "Supervisor":
          return adminApi.updateSupervisor(userId, dto as UpdateSupervisorDto);
        case "Customer":
        case "Driver":
        case "Admin":
        default:
          return adminApi.updateUser(
            userId,
            dto as UpdateUserDto,
          );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUser"] });
    },
  });
};

// ============================================================
// Suspend User — PATCH /api/admin/user-management/users/{id}/active
// ============================================================
export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string; role?: string }) =>
      adminApi.setUserActive(userId, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUser"] });
    },
  });
};

// ============================================================
// Activate User — PATCH /api/admin/user-management/users/{id}/active
// ============================================================
export const useActivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string; role?: string }) =>
      adminApi.setUserActive(userId, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUser"] });
    },
  });
};

// The current Admin API has no endpoints for cash-unblock, customer blacklist,
// customer unblacklist, or badge recalculation. Those legacy hooks are omitted
// rather than calling unsupported routes.

// ============================================================
// Create Admin — POST /api/admin/admins → AdminDto
// ============================================================
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAdminDto): Promise<AdminDto> =>
      adminApi.createAdmin(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
};

// ============================================================
// Create Store by Admin
// ============================================================
export const useCreateStoreByAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AdminCreateStoreDto) => adminApi.createStore(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStores"] });
    },
  });
};

// ============================================================
// Create Supervisor by Admin
// ============================================================
export const useCreateSupervisorByAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AdminCreateSupervisorDto) =>
      adminApi.createSupervisor(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminSupervisors"] });
    },
  });
};

// ============================================================
// Create Store Owner by Admin
// ============================================================
export const useCreateStoreOwnerByAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStoreOwnerDto) => adminApi.createStoreOwner(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["storeOwners"] });
    },
  });
};

// The current Admin API has no badge-recalculation endpoint.

// ============================================================
// Onboarding Requests — GET /api/admin/requests
// ============================================================
export const useOnboardingRequests = (params?: RequestQueryParams) => {
  const { isAuthenticated } = useAuth();

  return useQuery<PagedResult<RequestDto>>({
    queryKey: ["onboardingRequests", params],
    queryFn: () => adminApi.getRequests(params),
    staleTime: 30_000,
    enabled: isAuthenticated,
    retry: (failureCount: number, error: unknown) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status?: unknown }).status === 401
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// ============================================================
// Approve Request — POST /api/admin/requests/{id}/approve
// ============================================================
export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => adminApi.approveRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
};

// ============================================================
// Reject Request — POST /api/admin/requests/{id}/reject (body: { reason })
// ============================================================
export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason?: string;
    }) => adminApi.rejectRequest(requestId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingRequests"] });
    },
  });
};