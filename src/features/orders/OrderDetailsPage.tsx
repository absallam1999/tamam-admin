import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminOrders } from "@shared/hooks/useAdminOrders";
import { PageLoader } from "@shared/components/PageLoader";

// ============================================
// Icons
// ============================================

const OrderIcon = () => (
  <svg
    className="w-6 h-6"
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

// ============================================
// OrderDetailsPage Component
// ============================================

export const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const { stats, metrics } = useAdminOrders();

  const t = {
    back: { ar: "العودة للطلبات", en: "Back to Orders" },
    orderReference: { ar: "مرجع الطلب", en: "Order Reference" },
    unavailableTitle: {
      ar: "تفاصيل الطلب الفردي غير متاحة في واجهة الإدارة الحالية",
      en: "Individual order details are not exposed by the current Admin API",
    },
    unavailableDesc: {
      ar: "توفر واجهة برمجة الإدارة الحالية إحصائيات وتحليلات الطلبات الإجمالية بدلاً من تفاصيل الطلب الفردي.",
      en: "The current Admin API contract provides aggregate order metrics and period analytics rather than per-order detail records.",
    },
    viewAnalytics: {
      ar: "عرض تحليلات الطلبات",
      en: "View Order Analytics",
    },
    totalOrders: { ar: "إجمالي الطلبات", en: "Total Orders" },
    activeOrders: { ar: "طلبات نشطة", en: "Active Orders" },
    completedOrders: { ar: "طلبات مكتملة", en: "Completed Orders" },
    ordersToday: { ar: "طلبات اليوم", en: "Orders Today" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
  };

  if (stats.isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/orders")}
        className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              isAr ? "m8.25 4.5 7.5 7.5-7.5 7.5" : "M15.75 19.5 8.25 12l7.5-7.5"
            }
          />
        </svg>
        {lang(t.back)}
      </button>

      {/* Notice Card */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 sm:p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <OrderIcon />
        </div>
        <div>
          <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            {lang(t.orderReference)}
          </p>
          <p className="text-lg font-mono font-bold text-primary-600 dark:text-primary-400 mt-1">
            #{orderId || "—"}
          </p>
        </div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          {lang(t.unavailableTitle)}
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-xl mx-auto">
          {lang(t.unavailableDesc)}
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
          >
            {lang(t.viewAnalytics)}
          </button>
        </div>
      </div>

      {/* Current Order Counters from useAdminOrders */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
              {lang(t.totalOrders)}
            </p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {metrics.totalOrders.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
              {lang(t.activeOrders)}
            </p>
            <p className="text-xl font-bold text-info-600 dark:text-info-400">
              {metrics.activeOrders.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
              {lang(t.completedOrders)}
            </p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.completedOrders.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
              {lang(t.ordersToday)}
            </p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {metrics.ordersToday.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;