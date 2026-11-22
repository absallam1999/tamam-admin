import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/config/admin.api";
import type {
  AdminDto,
  CreateAdminDto,
  UpdateAdminDto,
} from "@shared/types";

export type AdminUser = AdminDto;

export interface UpdateAdminInput {
  adminId: string;
  dto: UpdateAdminDto;
}

export interface SetAdminActiveInput {
  adminId: string;
  isActive: boolean;
}

const ADMIN_USERS_QUERY_KEY = ["adminUsers"] as const;

export function useAdminAuth() {
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // GET /api/admin/user-management/admins
  // ---------------------------------------------------------------------------
  const {
    data: admins = [],
    isLoading: isLoadingAdmins,
    isError: isAdminsError,
    error: adminsError,
    refetch: refetchAdmins,
  } = useQuery<AdminDto[]>({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () => adminApi.getAdmins(),
    staleTime: 30_000,
  });

  const invalidateAdmins = async () => {
    await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
  };

  // ---------------------------------------------------------------------------
  // POST /api/admin/user-management/admins
  // ---------------------------------------------------------------------------
  const createMutation = useMutation<AdminDto, Error, CreateAdminDto>({
    mutationFn: (dto: CreateAdminDto) => adminApi.createAdmin(dto),
    onSuccess: invalidateAdmins,
  });

  // ---------------------------------------------------------------------------
  // PUT /api/admin/user-management/admins/{adminId}
  // ---------------------------------------------------------------------------
  const updateMutation = useMutation<AdminDto, Error, UpdateAdminInput>({
    mutationFn: ({ adminId, dto }: UpdateAdminInput) =>
      adminApi.updateAdmin(adminId, dto),
    onSuccess: invalidateAdmins,
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/admin/user-management/admins/{adminId}
  // ---------------------------------------------------------------------------
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (adminId: string) => adminApi.deleteAdmin(adminId),
    onSuccess: invalidateAdmins,
  });

  // Admin active state is updated through the Admin update DTO. There is no
  // legacy numeric-role toggle call in the new Admin-management API.
  const setActiveMutation = useMutation<AdminDto, Error, SetAdminActiveInput>({
    mutationFn: ({ adminId, isActive }: SetAdminActiveInput) =>
      adminApi.updateAdmin(adminId, { isActive }),
    onSuccess: invalidateAdmins,
  });

  return {
    // Data
    admins,
    isLoadingAdmins,
    isAdminsError,
    adminsError,
    refetchAdmins,

    // Create
    createAdmin: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update
    updateAdmin: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete
    deleteAdmin: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Active state
    setAdminActive: setActiveMutation.mutateAsync,
    isSettingAdminActive: setActiveMutation.isPending,
    setAdminActiveError: setActiveMutation.error,
  };
}
