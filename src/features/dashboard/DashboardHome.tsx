import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useAdminStore } from "@app/providers/AdminProvider";
import { useLanguage } from "@shared/hooks/useLanguage";
import {
  useDashboardStats,
  useDashboardSummary,
  usePlatformWallet,
  useAnalytics,
} from "@shared/hooks/useAdminDashboard";
import { cn } from "@shared/utils/cn";
import { formatCurrency } from "@shared/utils/formatters";
import type { DailyMetricDto } from "@shared/types";

// ============================================
// Translations
// ============================================

const t = {
  morning: { ar: "صباح الخير", en: "Good Morning" },
  afternoon: { ar: "مساء الخير", en: "Good Afternoon" },
  evening: { ar: "مساء الخير", en: "Good Evening" },
  admin: { ar: "مدير النظام", en: "System Admin" },
  overview: { ar: "نظرة عامة على منصتك", en: "Overview of your platform" },

  totalRevenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
  todayRevenue: { ar: "إيرادات اليوم", en: "Today" },
  totalOrders: { ar: "إجمالي الطلبات", en: "Total Orders" },
  totalDrivers: { ar: "السائقين", en: "Drivers" },
  totalStores: { ar: "المتاجر", en: "Stores" },
  totalUsers: { ar: "العملاء", en: "Customers" },
  activeOrders: { ar: "طلبات نشطة", en: "Active Orders" },
  pendingApprovals: { ar: "موافقات معلقة", en: "Pending Approvals" },
  complaints: { ar: "الشكاوى المفتوحة", en: "Open Complaints" },
  platformWallet: { ar: "صافي محفظة المنصة", en: "Platform Net Balance" },
  commission: { ar: "العمولة", en: "Commission" },

  revenueChart: { ar: "تحليل الإيرادات", en: "Revenue Analytics" },
  noData: { ar: "لا توجد بيانات", en: "No data available" },
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  refresh: { ar: "تحديث", en: "Refresh" },
  thisWeek: { ar: "هذا الأسبوع", en: "This Week" },
  thisMonth: { ar: "هذا الشهر", en: "This Month" },

  quickActions: { ar: "إجراءات سريعة", en: "Quick Actions" },
  users: { ar: "المستخدمين", en: "Users" },
  orders: { ar: "الطلبات", en: "Orders" },
  stores: { ar: "المتاجر", en: "Stores" },
  drivers: { ar: "السائقين", en: "Drivers" },
  chat: { ar: "المحادثات", en: "Chat" },
  ads: { ar: "الإعلانات", en: "Ads" },
  payments: { ar: "المدفوعات", en: "Payments" },
  settings: { ar: "الإعدادات", en: "Settings" },
};

// ============================================
// DashboardHome — Main Component
// ============================================

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { admin } = useAdminStore();
  const { currentLanguage } = useLanguage();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [analyticsPeriod, setAnalyticsPeriod] = useState<"week" | "month">(
    "week",
  );

  // API Hooks
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
    refetch: refetchStats,
  } = useDashboardStats();
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useDashboardSummary();
  const {
    data: wallet,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = usePlatformWallet();
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useAnalytics(analyticsPeriod);

  const isLoading = statsLoading || summaryLoading || walletLoading;

  const handleRefreshAll = () => {
    refetchStats();
    refetchSummary();
    refetchWallet();
    refetchAnalytics();
  };

  const displayStats = useMemo(() => {
    const source = stats ?? summary;
    const pendingTotal =
      (source?.pendingStores ?? 0) +
      (source?.pendingDrivers ?? 0) +
      (source?.pendingRequests ?? 0);

    return {
      totalRevenue: source?.totalRevenue ?? analytics?.totalRevenue ?? 0,
      revenueToday: source?.revenueToday ?? 0,
      totalOrders: source?.totalOrders ?? 0,
      activeOrders: source?.activeOrders ?? 0,
      totalDrivers: source?.totalDrivers ?? 0,
      totalStores: source?.totalStores ?? 0,
      totalCustomers: source?.totalCustomers ?? 0,
      pendingApprovals: pendingTotal,
      openComplaints: source?.openComplaints ?? 0,
      platformBalance: wallet?.netBalance ?? 0,
      totalCommission:
        wallet?.totalCommissionEarned ?? source?.totalCommission ?? 0,
    };
  }, [stats, summary, wallet, analytics]);

  const revenueData = useMemo(() => {
    const breakdown: DailyMetricDto[] = analytics?.dailyBreakdown ?? [];
    return breakdown.map((item) => {
      let label = item.date;
      try {
        label = new Date(item.date).toLocaleDateString(
          isAr ? "ar-EG" : "en-US",
          {
            month: "short",
            day: "numeric",
          },
        );
      } catch {
        label = item.date;
      }
      return {
        label,
        revenue: item.revenue,
        orders: item.orders,
      };
    });
  }, [analytics, isAr]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return lang(t.morning);
    if (hour < 17) return lang(t.afternoon);
    return lang(t.evening);
  };

  const displayName = admin?.fullName || user?.fullName || lang(t.admin);
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  // Quick actions config
  const quickActions = [
    {
      labelAr: t.users.ar,
      labelEn: t.users.en,
      to: "/dashboard/users",
      color: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>
      ),
    },
    {
      labelAr: t.orders.ar,
      labelEn: t.orders.en,
      to: "/dashboard/orders",
      color:
        "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
          />
        </svg>
      ),
    },
    {
      labelAr: t.stores.ar,
      labelEn: t.stores.en,
      to: "/dashboard/stores",
      color:
        "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        </svg>
      ),
    },
    {
      labelAr: t.drivers.ar,
      labelEn: t.drivers.en,
      to: "/dashboard/drivers",
      color:
        "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
      ),
    },
    {
      labelAr: t.chat.ar,
      labelEn: t.chat.en,
      to: "/dashboard/chat",
      color: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      ),
    },
    {
      labelAr: t.ads.ar,
      labelEn: t.ads.en,
      to: "/dashboard/ads",
      color: "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.549.549 0 0 1-.773-.233 18.108 18.108 0 0 1-1.155-3.26m7.695-8.181c.253-.962.584-1.892.985-2.783.247-.55.06-1.21-.463-1.511l-.657-.38a.549.549 0 0 0-.773.233 18.108 18.108 0 0 0-1.155 3.26m0 0a48.11 48.11 0 0 1 2.09-.09h.75a4.5 4.5 0 1 1 0 9h-.75c-.704 0-1.402-.03-2.09-.09m0 0c-.068.688-.09 1.386-.09 2.09v.75a4.5 4.5 0 1 0 9 0v-.75c0-.704-.03-1.402-.09-2.09"
          />
        </svg>
      ),
    },
    {
      labelAr: t.payments.ar,
      labelEn: t.payments.en,
      to: "/dashboard/payments",
      color:
        "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      ),
    },
    {
      labelAr: t.settings.ar,
      labelEn: t.settings.en,
      to: "/dashboard/settings",
      color:
        "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-8",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.overview)}
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isLoading || analyticsLoading}
          className="btn btn-ghost btn-sm"
        >
          <svg
            className={cn(
              "w-4 h-4",
              (isLoading || analyticsLoading) && "animate-spin",
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          <span className="hidden sm:inline">{lang(t.refresh)}</span>
        </button>
      </div>

      {/* Error */}
      {statsError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800/50 flex items-center gap-3"
        >
          <svg
            className="w-5 h-5 text-error-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm text-error-700 dark:text-error-400 flex-1">
            {statsErr instanceof Error ? statsErr.message : lang(t.error)}
          </p>
          <button
            onClick={handleRefreshAll}
            className="text-sm font-medium text-error-600 dark:text-error-400 hover:underline"
          >
            {lang(t.retry)}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[
          {
            label: lang(t.totalRevenue),
            value: formatCurrency(displayStats.totalRevenue),
            sub: `${lang(t.todayRevenue)}: ${formatCurrency(displayStats.revenueToday)}`,
            color:
              "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            to: "/dashboard/financial",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ),
          },
          {
            label: lang(t.totalOrders),
            value: displayStats.totalOrders.toLocaleString(),
            sub: `${displayStats.activeOrders} ${lang(t.activeOrders)}`,
            color:
              "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
            to: "/dashboard/orders",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                />
              </svg>
            ),
          },
          {
            label: lang(t.totalStores),
            value: displayStats.totalStores.toLocaleString(),
            color:
              "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
            to: "/dashboard/stores",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                />
              </svg>
            ),
          },
          {
            label: lang(t.totalDrivers),
            value: displayStats.totalDrivers.toLocaleString(),
            color:
              "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
            to: "/dashboard/drivers",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
            ),
          },
          {
            label: lang(t.totalUsers),
            value: displayStats.totalCustomers.toLocaleString(),
            color:
              "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
            to: "/dashboard/users",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            ),
          },
          {
            label: lang(t.pendingApprovals),
            value: displayStats.pendingApprovals.toLocaleString(),
            color:
              "bg-warning-100 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400",
            to: "/dashboard/requests",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ),
          },
          {
            label: lang(t.complaints),
            value: displayStats.openComplaints.toLocaleString(),
            color:
              "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
            to: "/dashboard/complaints",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            ),
          },
          {
            label: lang(t.platformWallet),
            value: formatCurrency(displayStats.platformBalance),
            sub: `${lang(t.commission)}: ${formatCurrency(displayStats.totalCommission)}`,
            color:
              "bg-info-100 dark:bg-info-500/10 text-info-600 dark:text-info-400",
            to: "/dashboard/financial",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            ),
          },
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.to)}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md hover:border-surface-300 dark:hover:border-surface-700 transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="skeleton h-4 w-24 rounded-lg" />
                  <div className="skeleton h-10 w-10 rounded-xl" />
                </div>
                <div className="skeleton h-8 w-16 rounded-lg" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
                    {card.label}
                  </p>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      card.color,
                    )}
                  >
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {card.value}
                </p>
                {card.sub && (
                  <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-1 truncate">
                    {card.sub}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">
            {lang(t.revenueChart)}
          </h3>
          <div className="inline-flex rounded-xl p-1 bg-surface-100 dark:bg-surface-800">
            <button
              onClick={() => setAnalyticsPeriod("week")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                analyticsPeriod === "week"
                  ? "bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm"
                  : "text-surface-500 dark:text-surface-400",
              )}
            >
              {lang(t.thisWeek)}
            </button>
            <button
              onClick={() => setAnalyticsPeriod("month")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                analyticsPeriod === "month"
                  ? "bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm"
                  : "text-surface-500 dark:text-surface-400",
              )}
            >
              {lang(t.thisMonth)}
            </button>
          </div>
        </div>
        {analyticsLoading ? (
          <div className="p-6 space-y-3">
            <div className="skeleton h-44 w-full rounded-xl" />
          </div>
        ) : revenueData.length === 0 ? (
          <div className="p-10 text-center text-sm text-surface-400 dark:text-surface-500">
            {lang(t.noData)}
          </div>
        ) : (
          <div className="p-6">
            <div
              className="flex items-end gap-2 h-44"
              role="img"
              aria-label={lang(t.revenueChart)}
            >
              {revenueData.map((item) => {
                const height = (item.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={item.label}
                    className="flex-1 flex flex-col items-center gap-1.5 group"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[10px] font-semibold text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div
                      className="w-full bg-surface-100 dark:bg-surface-800 rounded-t-lg relative overflow-hidden"
                      style={{ height: `${height}%`, minHeight: 4 }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary-500 dark:bg-primary-400 rounded-t-lg transition-all duration-500 group-hover:bg-primary-600 dark:group-hover:bg-primary-300"
                        style={{ height: "100%" }}
                      />
                    </div>
                    <span className="text-[10px] text-surface-400 dark:text-surface-500 font-medium truncate max-w-full">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-3">
          {lang(t.quickActions)}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <div
              key={action.to}
              onClick={() => navigate(action.to)}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md hover:border-surface-300 dark:hover:border-surface-700 transition-all duration-200 cursor-pointer flex items-center gap-3"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  action.color,
                )}
              >
                {action.icon}
              </div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {isAr ? action.labelAr : action.labelEn}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;