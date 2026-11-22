import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminOrders } from "@shared/hooks/useAdminOrders";
import { PageLoader } from "@shared/components/PageLoader";
import { cn } from "@shared/utils/cn";

// ============================================
// Icons
// ============================================

const OrderIcon = () => (
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
);

const StoreIcon = () => (
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
      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
    />
  </svg>
);

const DriverIcon = () => (
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
      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);

const MoneyIcon = () => (
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
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const ClockIcon = () => (
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
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

// ============================================
// OrdersPage Component
// ============================================

type PeriodOption = "day" | "week" | "month" | "year";

export const OrdersPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();

  const [period, setPeriod] = useState<PeriodOption>("week");
  const { stats, analytics, metrics } = useAdminOrders(period);

  const isLoading = stats.isLoading || analytics.isLoading;
  const hasError = stats.isError || analytics.isError;
  const errorObj = stats.error ?? analytics.error;

  const handleRefresh = () => {
    stats.refetch();
    analytics.refetch();
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
    title: { ar: "إدارة وتحليلات الطلبات", en: "Orders & Analytics" },
    subtitle: {
      ar: "متابعة إحصائيات الطلبات والأداء اليومي وأفضل المتاجر والسائقين",
      en: "Track order counters, daily performance, top stores, and top drivers",
    },
    refresh: { ar: "تحديث", en: "Refresh" },
    retry: { ar: "إعادة المحاولة", en: "Retry" },
    error: {
      ar: "فشل تحميل بيانات الطلبات",
      en: "Failed to load order analytics",
    },
    day: { ar: "اليوم", en: "Day" },
    week: { ar: "أسبوع", en: "Week" },
    month: { ar: "شهر", en: "Month" },
    year: { ar: "سنة", en: "Year" },
    totalOrders: { ar: "إجمالي الطلبات", en: "Total Orders" },
    activeOrders: { ar: "طلبات نشطة", en: "Active Orders" },
    completedOrders: { ar: "طلبات مكتملة", en: "Completed Orders" },
    cancelledOrders: { ar: "طلبات ملغاة", en: "Cancelled Orders" },
    ordersToday: { ar: "طلبات اليوم", en: "Orders Today" },
    totalRevenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
    revenueToday: { ar: "إيرادات اليوم", en: "Revenue Today" },
    totalCommission: { ar: "إجمالي العمولات", en: "Total Commission" },
    periodSummary: { ar: "ملخص الفترة", en: "Period Summary" },
    ordersPlaced: { ar: "طلبات مقدمة", en: "Orders Placed" },
    ordersDelivered: { ar: "طلبات مسلمة", en: "Orders Delivered" },
    ordersCancelled: { ar: "طلبات ملغاة", en: "Orders Cancelled" },
    avgOrderValue: { ar: "متوسط قيمة الطلب", en: "Avg Order Value" },
    totalDiscount: { ar: "إجمالي الخصومات", en: "Total Discount" },
    dailyBreakdown: { ar: "التفصيل اليومي", en: "Daily Breakdown" },
    date: { ar: "التاريخ", en: "Date" },
    orders: { ar: "الطلبات", en: "Orders" },
    revenue: { ar: "الإيرادات", en: "Revenue" },
    commission: { ar: "العمولة", en: "Commission" },
    topStores: { ar: "أفضل المتاجر", en: "Top Stores" },
    topDrivers: { ar: "أفضل السائقين", en: "Top Drivers" },
    deliveries: { ar: "توصيلة", en: "deliveries" },
    earnings: { ar: "الأرباح", en: "Earnings" },
    rating: { ar: "التقييم", en: "Rating" },
    noData: { ar: "لا توجد بيانات للفترة المحددة", en: "No data for this period" },
    egp: { ar: "ج.م", en: "EGP" },
  };

  const periodOptions: { value: PeriodOption; label: { ar: string; en: string } }[] =
    [
      { value: "day", label: t.day },
      { value: "week", label: t.week },
      { value: "month", label: t.month },
      { value: "year", label: t.year },
    ];

  const analyticsData = analytics.data;
  const dailyBreakdown = analyticsData?.dailyBreakdown ?? [];
  const topStores = analyticsData?.topStores ?? [];
  const topDrivers = analyticsData?.topDrivers ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
            <OrderIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {lang(t.title)}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              {lang(t.subtitle)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl p-1 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  period === opt.value
                    ? "bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm"
                    : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100",
                )}
              >
                {lang(opt.label)}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
          >
            <svg
              className={cn("w-4 h-4", isLoading && "animate-spin")}
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
        </div>
      </div>

      {/* Error */}
      {hasError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800/50 flex items-center justify-between gap-3"
        >
          <p className="text-sm text-error-700 dark:text-error-400">
            {errorObj instanceof Error ? errorObj.message : lang(t.error)}
          </p>
          <button
            onClick={handleRefresh}
            className="text-sm font-medium text-error-600 dark:text-error-400 hover:underline flex-shrink-0"
          >
            {lang(t.retry)}
          </button>
        </div>
      )}

      {isLoading && !metrics && !analyticsData ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : (
        <>
          {/* Platform Counters (from metrics) */}
          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
                <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.totalOrders)}
                </p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {metrics.totalOrders.toLocaleString()}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  {lang(t.ordersToday)}: {metrics.ordersToday.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
                <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.activeOrders)}
                </p>
                <p className="text-2xl font-bold text-info-600 dark:text-info-400">
                  {metrics.activeOrders.toLocaleString()}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  {lang(t.completedOrders)}:{" "}
                  {metrics.completedOrders.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
                <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.cancelledOrders)}
                </p>
                <p className="text-2xl font-bold text-error-600 dark:text-error-400">
                  {metrics.cancelledOrders.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
                <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.totalRevenue)}
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.totalRevenue.toLocaleString()} {lang(t.egp)}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  {lang(t.revenueToday)}: {metrics.revenueToday.toLocaleString()}{" "}
                  {lang(t.egp)}
                </p>
              </div>
            </div>
          )}

          {/* Period Analytics Summary */}
          {analyticsData && (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <MoneyIcon />
                  {lang(t.periodSummary)}
                </h2>
                <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
                  <ClockIcon />
                  {formatDate(analyticsData.periodStart)} —{" "}
                  {formatDate(analyticsData.periodEnd)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.ordersPlaced)}
                  </p>
                  <p className="text-lg font-bold text-surface-900 dark:text-surface-100 mt-1">
                    {analyticsData.ordersPlaced.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.ordersDelivered)}
                  </p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {analyticsData.ordersDelivered.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.ordersCancelled)}
                  </p>
                  <p className="text-lg font-bold text-error-600 dark:text-error-400 mt-1">
                    {analyticsData.ordersCancelled.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.avgOrderValue)}
                  </p>
                  <p className="text-lg font-bold text-surface-900 dark:text-surface-100 mt-1">
                    {analyticsData.averageOrderValue.toLocaleString()}{" "}
                    {lang(t.egp)}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.totalDiscount)}
                  </p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {analyticsData.totalDiscount.toLocaleString()}{" "}
                    {lang(t.egp)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Daily Breakdown Table */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {lang(t.dailyBreakdown)}
              </h3>
            </div>
            {dailyBreakdown.length === 0 ? (
              <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-10">
                {lang(t.noData)}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50/60 dark:bg-surface-800/30">
                      <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                        {lang(t.date)}
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                        {lang(t.orders)}
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                        {lang(t.revenue)}
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                        {lang(t.commission)}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {dailyBreakdown.map((day) => (
                      <tr
                        key={day.date}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                          {formatDate(day.date)}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-surface-900 dark:text-surface-100">
                          {day.orders.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                          {day.revenue.toLocaleString()} {lang(t.egp)}
                        </td>
                        <td className="px-4 py-3 text-center text-surface-700 dark:text-surface-300">
                          {day.commission.toLocaleString()} {lang(t.egp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Stores & Top Drivers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Stores */}
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <StoreIcon />
                  {lang(t.topStores)}
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {topStores.length === 0 ? (
                  <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">
                    {lang(t.noData)}
                  </p>
                ) : (
                  topStores.map((store) => {
                    const name =
                      (isAr
                        ? store.nameAr || store.nameEn
                        : store.nameEn || store.nameAr) || "—";
                    return (
                      <div
                        key={store.storeId}
                        onClick={() =>
                          navigate(`/dashboard/stores/${store.storeId}`)
                        }
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700/70 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                            {name}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">
                            {store.orderCount} {lang(t.orders)} •{" "}
                            {lang(t.rating)}: {store.rating.toFixed(1)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          {store.revenue.toLocaleString()} {lang(t.egp)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Top Drivers */}
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <DriverIcon />
                  {lang(t.topDrivers)}
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {topDrivers.length === 0 ? (
                  <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">
                    {lang(t.noData)}
                  </p>
                ) : (
                  topDrivers.map((driver) => (
                    <div
                      key={driver.driverId}
                      onClick={() =>
                        navigate(`/dashboard/drivers/${driver.driverId}`)
                      }
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700/70 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                          {driver.fullName || "—"}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {driver.deliveries} {lang(t.deliveries)} •{" "}
                          {lang(t.rating)}: {driver.rating.toFixed(1)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        {driver.earnings.toLocaleString()} {lang(t.egp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersPage;