import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/config/admin.api";
import { useLanguage } from "@shared/hooks/useLanguage";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency } from "@shared/utils/formatters";
import type {
  AnalyticsDashboardDto,
  CityWithStatsDto,
  DashboardStatsDto,
  FinancialSummaryDto,
  NotificationStatsDto,
} from "@shared/types";

// ============================================
// Icons
// ============================================

const RevenueIcon = () => (
  <svg
    className="w-5 h-5 text-white"
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
);

const OrderIcon = () => (
  <svg
    className="w-5 h-5 text-white"
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
);

const DriverIcon = () => (
  <svg
    className="w-5 h-5 text-white"
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
);

const StoreIcon = () => (
  <svg
    className="w-5 h-5 text-white"
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
);

const DownloadIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

// ============================================
// Helpers
// ============================================

type PeriodOption = "day" | "week" | "month" | "year";

function getPeriodRange(period: PeriodOption): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now);
  if (period === "day") start.setHours(0, 0, 0, 0);
  else if (period === "week") start.setDate(now.getDate() - 7);
  else if (period === "month") start.setMonth(now.getMonth() - 1);
  else start.setFullYear(now.getFullYear() - 1);

  return {
    from: start.toISOString(),
    to: now.toISOString(),
  };
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csvContent =
    "\uFEFF" + rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// ReportsPage Component
// ============================================

export const ReportsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("month");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsDashboardDto | null>(
    null,
  );
  const [dashboardStats, setDashboardStats] =
    useState<DashboardStatsDto | null>(null);
  const [financeSummary, setFinanceSummary] =
    useState<FinancialSummaryDto | null>(null);
  const [cities, setCities] = useState<CityWithStatsDto[]>([]);
  const [notifStats, setNotifStats] = useState<NotificationStatsDto | null>(
    null,
  );

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getPeriodRange(selectedPeriod);
      const [
        analyticsRes,
        statsRes,
        financeRes,
        citiesRes,
        notifRes,
      ] = await Promise.allSettled([
        adminApi.getAnalytics(selectedPeriod),
        adminApi.getDashboardStats(),
        adminApi.getFinancialSummary(from, to),
        adminApi.getCitiesWithStats({ PageIndex: 1, PageSize: 20 }),
        adminApi.getNotificationStats(from, to),
      ]);

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value);
      }
      if (statsRes.status === "fulfilled") {
        setDashboardStats(statsRes.value);
      }
      if (financeRes.status === "fulfilled") {
        setFinanceSummary(financeRes.value);
      }
      if (citiesRes.status === "fulfilled") {
        setCities(citiesRes.value.items ?? []);
      }
      if (notifRes.status === "fulfilled") {
        setNotifStats(notifRes.value);
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل التقارير", en: "Failed to load reports" }),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, toast, lang]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const reportCards = useMemo(() => {
    const placed = analytics?.ordersPlaced ?? dashboardStats?.totalOrders ?? 0;
    const delivered =
      analytics?.ordersDelivered ?? dashboardStats?.completedOrders ?? 0;
    const cancelled =
      analytics?.ordersCancelled ?? dashboardStats?.cancelledOrders ?? 0;
    const cancellationRate =
      placed > 0 ? `${((cancelled / placed) * 100).toFixed(1)}%` : "0.0%";

    const topDrivers = analytics?.topDrivers ?? [];
    const avgDriverRating =
      topDrivers.length > 0
        ? (
            topDrivers.reduce((sum, d) => sum + d.rating, 0) / topDrivers.length
          ).toFixed(1)
        : "—";

    const topStores = analytics?.topStores ?? [];
    const avgStoreRevenue =
      topStores.length > 0
        ? topStores.reduce((sum, s) => sum + s.revenue, 0) / topStores.length
        : 0;

    return [
      {
        key: "revenue",
        titleAr: "تقرير الإيرادات والمالية",
        titleEn: "Revenue & Finance Report",
        descriptionAr: "ملخص الإيرادات وصافي الأرباح والعمولات",
        descriptionEn: "Revenue, net profit, and commission summary",
        icon: RevenueIcon,
        color: "from-emerald-500 to-emerald-600",
        stats: [
          {
            labelAr: "إجمالي الإيرادات",
            labelEn: "Total Revenue",
            value: formatCurrency(
              financeSummary?.totalRevenue ?? analytics?.totalRevenue ?? 0,
            ),
          },
          {
            labelAr: "صافي الإيرادات",
            labelEn: "Net Revenue",
            value: formatCurrency(financeSummary?.netRevenue ?? 0),
          },
          {
            labelAr: "متوسط قيمة الطلب",
            labelEn: "Avg Order Value",
            value: formatCurrency(analytics?.averageOrderValue ?? 0),
          },
          {
            labelAr: "العمولات",
            labelEn: "Commissions",
            value: formatCurrency(
              financeSummary?.totalCommission ?? analytics?.totalCommission ?? 0,
            ),
          },
        ],
      },
      {
        key: "orders",
        titleAr: "تقرير الطلبات",
        titleEn: "Orders Report",
        descriptionAr: "إحصائيات الطلبات ومعدلات التسليم والإلغاء",
        descriptionEn: "Order counts, completion, and cancellation rates",
        icon: OrderIcon,
        color: "from-blue-500 to-blue-600",
        stats: [
          {
            labelAr: "إجمالي الطلبات",
            labelEn: "Orders Placed",
            value: placed.toLocaleString(),
          },
          {
            labelAr: "الطلبات المسلمة",
            labelEn: "Delivered",
            value: delivered.toLocaleString(),
          },
          {
            labelAr: "الطلبات الملغية",
            labelEn: "Cancelled",
            value: cancelled.toLocaleString(),
          },
          {
            labelAr: "نسبة الإلغاء",
            labelEn: "Cancellation Rate",
            value: cancellationRate,
          },
        ],
      },
      {
        key: "drivers",
        titleAr: "تقرير السائقين",
        titleEn: "Drivers Report",
        descriptionAr: "إحصائيات السائقين وأفضل الموصلين",
        descriptionEn: "Driver counts and top delivery performance",
        icon: DriverIcon,
        color: "from-amber-500 to-amber-600",
        stats: [
          {
            labelAr: "إجمالي السائقين",
            labelEn: "Total Drivers",
            value: (dashboardStats?.totalDrivers ?? 0).toLocaleString(),
          },
          {
            labelAr: "سائقين قيد المراجعة",
            labelEn: "Pending Drivers",
            value: (dashboardStats?.pendingDrivers ?? 0).toLocaleString(),
          },
          {
            labelAr: "توصيلات الأفضل أداءً",
            labelEn: "Top Drivers Deliveries",
            value: topDrivers
              .reduce((sum, d) => sum + d.deliveries, 0)
              .toLocaleString(),
          },
          {
            labelAr: "متوسط التقييم",
            labelEn: "Avg Rating",
            value: avgDriverRating,
          },
        ],
      },
      {
        key: "stores",
        titleAr: "تقرير المتاجر",
        titleEn: "Stores Report",
        descriptionAr: "إحصائيات المتاجر وأفضل المبيعات",
        descriptionEn: "Store counts and top store performance",
        icon: StoreIcon,
        color: "from-purple-500 to-purple-600",
        stats: [
          {
            labelAr: "إجمالي المتاجر",
            labelEn: "Total Stores",
            value: (dashboardStats?.totalStores ?? 0).toLocaleString(),
          },
          {
            labelAr: "متاجر قيد المراجعة",
            labelEn: "Pending Stores",
            value: (dashboardStats?.pendingStores ?? 0).toLocaleString(),
          },
          {
            labelAr: "متوسط مبيعات المتجر",
            labelEn: "Avg Top Store Sales",
            value: formatCurrency(avgStoreRevenue),
          },
          {
            labelAr: "إجمالي العملاء",
            labelEn: "Total Customers",
            value: (dashboardStats?.totalCustomers ?? 0).toLocaleString(),
          },
        ],
      },
    ];
  }, [analytics, dashboardStats, financeSummary]);

  const handleExportSection = (key: string) => {
    const suffix = `${selectedPeriod}-${new Date().toISOString().slice(0, 10)}`;
    if (key === "revenue") {
      const rows: (string | number)[][] = [
        ["Metric", "Value"],
        [
          "Total Revenue",
          financeSummary?.totalRevenue ?? analytics?.totalRevenue ?? 0,
        ],
        ["Net Revenue", financeSummary?.netRevenue ?? 0],
        [
          "Total Commission",
          financeSummary?.totalCommission ?? analytics?.totalCommission ?? 0,
        ],
        ["Total Refunds", financeSummary?.totalRefunds ?? 0],
        ["Total Withdrawals", financeSummary?.totalWithdrawals ?? 0],
        ["Total Bonuses", financeSummary?.totalBonuses ?? 0],
        ["Total Discount", analytics?.totalDiscount ?? 0],
        ["Average Order Value", analytics?.averageOrderValue ?? 0],
      ];
      downloadCsv(`revenue-report-${suffix}.csv`, rows);
    } else if (key === "orders") {
      const rows: (string | number)[][] = [
        ["Date", "Orders", "Revenue", "Commission"],
        ...(analytics?.dailyBreakdown ?? []).map((d) => [
          d.date,
          d.orders,
          d.revenue,
          d.commission,
        ]),
      ];
      downloadCsv(`orders-report-${suffix}.csv`, rows);
    } else if (key === "drivers") {
      const rows: (string | number)[][] = [
        ["Driver ID", "Full Name", "Deliveries", "Earnings", "Rating"],
        ...(analytics?.topDrivers ?? []).map((d) => [
          d.driverId,
          d.fullName ?? "",
          d.deliveries,
          d.earnings,
          d.rating,
        ]),
      ];
      downloadCsv(`drivers-report-${suffix}.csv`, rows);
    } else if (key === "stores") {
      const rows: (string | number)[][] = [
        ["Store ID", "Name (AR)", "Name (EN)", "Orders", "Revenue", "Rating"],
        ...(analytics?.topStores ?? []).map((s) => [
          s.storeId,
          s.nameAr ?? "",
          s.nameEn ?? "",
          s.orderCount,
          s.revenue,
          s.rating,
        ]),
      ];
      downloadCsv(`stores-report-${suffix}.csv`, rows);
    }
    toast.success(
      lang({ ar: "تم تصدير التقرير بنجاح", en: "Report exported successfully" }),
    );
  };

  const handleExportAll = () => {
    const suffix = `${selectedPeriod}-${new Date().toISOString().slice(0, 10)}`;
    const rows: (string | number)[][] = [
      ["Section", "Metric", "Value"],
      ...reportCards.flatMap((card) =>
        card.stats.map((s) => [
          isAr ? card.titleAr : card.titleEn,
          isAr ? s.labelAr : s.labelEn,
          s.value,
        ]),
      ),
      [],
      ["Daily Breakdown"],
      ["Date", "Orders", "Revenue", "Commission"],
      ...(analytics?.dailyBreakdown ?? []).map((d) => [
        d.date,
        d.orders,
        d.revenue,
        d.commission,
      ]),
      [],
      ["Cities With Stats"],
      ["City", "Total Orders", "Active Stores", "Active Drivers", "Total Revenue"],
      ...cities.map((c) => [
        (isAr ? c.nameAr || c.nameEn : c.nameEn || c.nameAr) ?? "",
        c.totalOrders,
        c.activeStores,
        c.activeDrivers,
        c.totalRevenue,
      ]),
    ];
    downloadCsv(`tamam-full-report-${suffix}.csv`, rows);
    toast.success(
      lang({
        ar: "تم تصدير جميع التقارير بنجاح",
        en: "All reports exported successfully",
      }),
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const t = {
    title: { ar: "التقارير والتحليلات", en: "Reports & Analytics" },
    subtitle: {
      ar: "تحليلات وإحصائيات شاملة ومباشرة للمنصة",
      en: "Comprehensive live platform analytics and financial reports",
    },
    today: { ar: "اليوم", en: "Today" },
    week: { ar: "هذا الأسبوع", en: "This Week" },
    month: { ar: "هذا الشهر", en: "This Month" },
    year: { ar: "هذه السنة", en: "This Year" },
    refresh: { ar: "تحديث", en: "Refresh" },
    export: { ar: "تصدير CSV", en: "Export CSV" },
    exportAll: { ar: "تصدير جميع التقارير", en: "Export All Reports" },
    dailyBreakdown: { ar: "التفصيل اليومي", en: "Daily Breakdown" },
    citiesReport: { ar: "تقرير المدن", en: "Cities Performance" },
    notificationsReport: {
      ar: "إحصائيات الإشعارات",
      en: "Notification Delivery Stats",
    },
    noData: { ar: "لا توجد بيانات", en: "No data available" },
  };

  if (loading && !analytics && !dashboardStats && !financeSummary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" />
      </div>
    );
  }

  const dailyBreakdown = analytics?.dailyBreakdown ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodOption)}
            className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer"
          >
            <option value="day">{lang(t.today)}</option>
            <option value="week">{lang(t.week)}</option>
            <option value="month">{lang(t.month)}</option>
            <option value="year">{lang(t.year)}</option>
          </select>

          <button
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
          >
            <svg
              className={cn("w-4 h-4", loading && "animate-spin")}
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
            {lang(t.refresh)}
          </button>

          <button
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900/50 hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors"
          >
            <DownloadIcon />
            {lang(t.exportAll)}
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCards.map((report) => (
          <div
            key={report.key}
            className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            {/* Card Header */}
            <div className="p-5 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0",
                      report.color,
                    )}
                  >
                    <report.icon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                      {isAr ? report.titleAr : report.titleEn}
                    </h3>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {isAr ? report.descriptionAr : report.descriptionEn}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportSection(report.key)}
                  className="p-2 rounded-lg text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                  title={lang(t.export)}
                >
                  <DownloadIcon />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-3">
                {report.stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700"
                  >
                    <p className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                      {isAr ? stat.labelAr : stat.labelEn}
                    </p>
                    <p className="text-lg font-bold text-surface-900 dark:text-surface-100">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Breakdown Table */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
            {lang(t.dailyBreakdown)}
          </h3>
          {analytics && (
            <span className="text-xs text-surface-500">
              {formatDate(analytics.periodStart)} —{" "}
              {formatDate(analytics.periodEnd)}
            </span>
          )}
        </div>
        {dailyBreakdown.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-8">
            {lang(t.noData)}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30 text-xs text-surface-500">
                  <th className="py-3 px-4 text-start">
                    {isAr ? "التاريخ" : "Date"}
                  </th>
                  <th className="py-3 px-4 text-center">
                    {isAr ? "الطلبات" : "Orders"}
                  </th>
                  <th className="py-3 px-4 text-center">
                    {isAr ? "الإيرادات" : "Revenue"}
                  </th>
                  <th className="py-3 px-4 text-center">
                    {isAr ? "العمولات" : "Commission"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {dailyBreakdown.map((day) => (
                  <tr
                    key={day.date}
                    className="hover:bg-surface-50 dark:hover:bg-surface-800/30"
                  >
                    <td className="py-3 px-4 text-surface-700 dark:text-surface-300">
                      {formatDate(day.date)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-surface-900 dark:text-surface-100">
                      {day.orders.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className="py-3 px-4 text-center text-surface-700 dark:text-surface-300">
                      {formatCurrency(day.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cities Performance & Notifications Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cities Table */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.citiesReport)}
            </h3>
          </div>
          {cities.length === 0 ? (
            <p className="text-sm text-surface-500 text-center py-8">
              {lang(t.noData)}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500">
                    <th className="py-3 px-4 text-start">
                      {isAr ? "المدينة" : "City"}
                    </th>
                    <th className="py-3 px-4 text-center">
                      {isAr ? "الطلبات" : "Orders"}
                    </th>
                    <th className="py-3 px-4 text-center">
                      {isAr ? "المتاجر" : "Stores"}
                    </th>
                    <th className="py-3 px-4 text-center">
                      {isAr ? "السائقين" : "Drivers"}
                    </th>
                    <th className="py-3 px-4 text-end">
                      {isAr ? "الإيرادات" : "Revenue"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {cities.map((city) => (
                    <tr
                      key={city.id}
                      onClick={() => navigate(`/dashboard/cities/${city.id}`)}
                      className="hover:bg-surface-50 dark:hover:bg-surface-800/30 cursor-pointer"
                    >
                      <td className="py-3 px-4 font-medium text-surface-900 dark:text-surface-100">
                        {(isAr
                          ? city.nameAr || city.nameEn
                          : city.nameEn || city.nameAr) || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {city.totalOrders.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {city.activeStores}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {city.activeDrivers}
                      </td>
                      <td className="py-3 px-4 text-end font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(city.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications Stats */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.notificationsReport)}
            </h3>
          </div>
          {!notifStats ? (
            <p className="text-sm text-surface-500 text-center py-8">
              {lang(t.noData)}
            </p>
          ) : (
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {isAr ? "المرسلة" : "Total Sent"}
                </p>
                <p className="text-lg font-bold text-surface-900 dark:text-surface-100 mt-0.5">
                  {notifStats.totalSent.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {isAr ? "نسبة التسليم" : "Delivery Rate"}
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {notifStats.deliveryRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {isAr ? "نسبة الفتح" : "Open Rate"}
                </p>
                <p className="text-lg font-bold text-info-600 dark:text-info-400 mt-0.5">
                  {notifStats.openRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {isAr ? "الفاشلة" : "Failed"}
                </p>
                <p className="text-lg font-bold text-error-600 dark:text-error-400 mt-0.5">
                  {notifStats.totalFailed.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;