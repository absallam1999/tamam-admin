import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/config/admin.api";
import type {
  AnalyticsDashboardDto,
  DashboardStatsDto,
} from "@shared/types";

export interface AdminOrderMetrics {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  ordersToday: number;
  totalRevenue: DashboardStatsDto["totalRevenue"];
  revenueToday: DashboardStatsDto["revenueToday"];
  totalCommission: DashboardStatsDto["totalCommission"];
}

export interface UseAdminOrdersResult {
  stats: ReturnType<typeof useAdminOrderStats>;
  analytics: ReturnType<typeof useAdminOrderAnalytics>;
  metrics: AdminOrderMetrics | null;
}

/**
 * Fetches order-related counters
 */
export const useAdminOrderStats = () =>
  useQuery<DashboardStatsDto>({
    queryKey: ["adminOrderStats"],
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
  });

/**
 * Fetches order analytics
 */
export const useAdminOrderAnalytics = (period = "week") =>
  useQuery<AnalyticsDashboardDto>({
    queryKey: ["adminOrderAnalytics", period],
    queryFn: () => adminApi.getAnalytics(period),
    staleTime: 60_000,
    retry: 2,
  });

export const useAdminOrders = (period = "week"): UseAdminOrdersResult => {
  const stats = useAdminOrderStats();
  const analytics = useAdminOrderAnalytics(period);

  const metrics: AdminOrderMetrics | null = stats.data
    ? {
        totalOrders: stats.data.totalOrders,
        activeOrders: stats.data.activeOrders,
        completedOrders: stats.data.completedOrders,
        cancelledOrders: stats.data.cancelledOrders,
        ordersToday: stats.data.ordersToday,
        totalRevenue: stats.data.totalRevenue,
        revenueToday: stats.data.revenueToday,
        totalCommission: stats.data.totalCommission,
      }
    : null;

  return { stats, analytics, metrics };
};
