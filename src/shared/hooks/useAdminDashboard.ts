import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@config/admin.api";
import type {
  AnalyticsDashboardDto,
  DashboardStatsDto,
  PlatformWalletDto,
} from "@shared/types";

// -----------------------------------------------------------------------------
// Dashboard stats
// GET /api/admin/dashboard/stats
// -----------------------------------------------------------------------------

export const useDashboardStats = () =>
  useQuery<DashboardStatsDto>({
    queryKey: ["adminDashboardStats"],
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
  });

// -----------------------------------------------------------------------------
// Dashboard overview
// GET /api/admin/overview
// -----------------------------------------------------------------------------

export const useDashboardSummary = () =>
  useQuery<DashboardStatsDto>({
    queryKey: ["adminDashboardOverview"],
    queryFn: () => adminApi.getOverview(),
    staleTime: 60_000,
    retry: 2,
  });

// -----------------------------------------------------------------------------
// Platform wallet
// GET /api/admin/finance/platform-wallet
// -----------------------------------------------------------------------------

export const usePlatformWallet = () =>
  useQuery<PlatformWalletDto>({
    queryKey: ["platformWallet"],
    queryFn: () => adminApi.getPlatformWallet(),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 2,
  });

// -----------------------------------------------------------------------------
// Analytics
// GET /api/admin/dashboard/analytics?period={period}
// -----------------------------------------------------------------------------

export const useAnalytics = (period = "week") =>
  useQuery<AnalyticsDashboardDto>({
    queryKey: ["adminAnalytics", period],
    queryFn: () => adminApi.getAnalytics(period),
    staleTime: 60_000,
    retry: 2,
  });