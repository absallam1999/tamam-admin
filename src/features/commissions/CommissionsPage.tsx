import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminCommissions } from "@shared/hooks/useAdminCommissions";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { FinanceQueryParams } from "@shared/types";

// ============================================
// Icons
// ============================================

const SearchIcon = () => (
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
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const MoneyIcon = () => (
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
);

const ClockIcon = () => (
  <svg
    className="w-3.5 h-3.5"
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
// Helpers
// ============================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// CommissionsPage Component
// ============================================

export const CommissionsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const toast = useToast();

  const {
    commissions,
    summary,
    totalCount,
    loading,
    fetchCommissions,
    fetchSummary,
  } = useAdminCommissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const loadData = useCallback(async () => {
    try {
      const fromIso = fromDate
        ? new Date(fromDate).toISOString()
        : undefined;
      const toIso = toDate
        ? new Date(`${toDate}T23:59:59`).toISOString()
        : undefined;

      const params: FinanceQueryParams = {
        type: typeFilter || undefined,
        from: fromIso,
        to: toIso,
        pageIndex,
        pageSize,
      };

      const [txResult] = await Promise.all([
        fetchCommissions(params),
        fetchSummary(fromIso, toIso),
      ]);
      setTotalPages(txResult.totalPages || 1);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحميل المعاملات المالية",
            en: "Failed to load financial transactions",
          }),
        ),
      );
    }
  }, [
    typeFilter,
    fromDate,
    toDate,
    pageIndex,
    fetchCommissions,
    fetchSummary,
    toast,
    lang,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCommissions = commissions.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.description?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.referenceNumber?.toLowerCase().includes(q) ||
      c.referenceId?.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const pageTotalAmount = filteredCommissions.reduce(
    (sum, c) => sum + c.amount,
    0,
  );

  const getTypeBadgeClass = (type?: string | null) => {
    const key = (type ?? "").toLowerCase();
    if (key.includes("commission") || key.includes("revenue")) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    }
    if (key.includes("refund") || key.includes("withdrawal")) {
      return "bg-error-100 text-error-700 dark:bg-error-950/40 dark:text-error-300";
    }
    if (key.includes("bonus")) {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    }
    return "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300";
  };

  const t = {
    title: { ar: "العمولات والمعاملات المالية", en: "Commissions & Finance" },
    subtitle: {
      ar: "عرض ملخص الإيرادات والعمولات وسجل المعاملات المالية",
      en: "View revenue, commissions summary, and financial transactions",
    },
    searchPlaceholder: {
      ar: "بحث بالوصف أو الرقم المرجعي...",
      en: "Search by description or reference...",
    },
    allTypes: { ar: "كل الأنواع", en: "All Types" },
    commissionType: { ar: "عمولة", en: "Commission" },
    orderType: { ar: "طلب", en: "Order" },
    refundType: { ar: "استرداد", en: "Refund" },
    withdrawalType: { ar: "سحب", en: "Withdrawal" },
    bonusType: { ar: "مكافأة", en: "Bonus" },
    type: { ar: "النوع", en: "Type" },
    description: { ar: "الوصف", en: "Description" },
    reference: { ar: "المرجع", en: "Reference" },
    amount: { ar: "المبلغ", en: "Amount" },
    date: { ar: "التاريخ", en: "Date" },
    totalCommission: { ar: "إجمالي العمولات", en: "Total Commission" },
    totalRevenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
    netRevenue: { ar: "صافي الإيرادات", en: "Net Revenue" },
    completedPayouts: { ar: "المدفوعات المكتملة", en: "Completed Payouts" },
    pendingPayouts: { ar: "المدفوعات المعلقة", en: "Pending Payouts" },
    noCommissions: { ar: "لا توجد معاملات", en: "No transactions found" },
    noCommissionsDesc: {
      ar: "لم يتم العثور على معاملات تطابق معايير البحث",
      en: "No transactions match your search criteria",
    },
    total: { ar: "المجموع", en: "Total" },
    transactions: { ar: "معاملة", en: "transactions" },
    pageTotal: { ar: "إجمالي الصفحة", en: "Page Total" },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    prev: { ar: "السابق", en: "Previous" },
    next: { ar: "التالي", en: "Next" },
    egp: { ar: "ج.م", en: "EGP" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {lang(t.title)}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {lang(t.subtitle)}
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
            <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
              {lang(t.totalCommission)}
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.totalCommission.toLocaleString()} {lang(t.egp)}
            </p>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
            <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
              {lang(t.netRevenue)}
            </p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {summary.netRevenue.toLocaleString()} {lang(t.egp)}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {lang(t.totalRevenue)}: {summary.totalRevenue.toLocaleString()}{" "}
              {lang(t.egp)}
            </p>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
            <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
              {lang(t.completedPayouts)}
            </p>
            <p className="text-2xl font-bold text-info-600 dark:text-info-400">
              {summary.completedPayouts.toLocaleString()} {lang(t.egp)}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              ({summary.completedWithdrawalsCount})
            </p>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
            <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
              {lang(t.pendingPayouts)}
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.pendingPayouts.toLocaleString()} {lang(t.egp)}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              ({summary.pendingWithdrawalsCount})
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang(t.searchPlaceholder)}
            className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[150px]"
        >
          <option value="">{lang(t.allTypes)}</option>
          <option value="Commission">{lang(t.commissionType)}</option>
          <option value="Order">{lang(t.orderType)}</option>
          <option value="Refund">{lang(t.refundType)}</option>
          <option value="Withdrawal">{lang(t.withdrawalType)}</option>
          <option value="Bonus">{lang(t.bonusType)}</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-3 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-3 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : filteredCommissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <MoneyIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noCommissions)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noCommissionsDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.type)}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.description)}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden md:table-cell">
                    {lang(t.reference)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.amount)}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden sm:table-cell">
                    {lang(t.date)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {filteredCommissions.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                          getTypeBadgeClass(c.type),
                        )}
                      >
                        {c.type || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-700 dark:text-surface-300 max-w-xs truncate">
                      {c.description || "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-surface-500 dark:text-surface-400">
                        {c.referenceNumber
                          ? `#${c.referenceNumber}`
                          : c.referenceId
                            ? `#${c.referenceId.slice(0, 8)}`
                            : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-surface-900 dark:text-surface-100">
                      {c.amount.toLocaleString()} {lang(t.egp)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
                        <ClockIcon />
                        {formatDate(c.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 text-sm">
              <p className="text-surface-500 dark:text-surface-400">
                {lang(t.total)}: {totalCount || filteredCommissions.length}{" "}
                {lang(t.transactions)}
              </p>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {lang(t.pageTotal)}: {pageTotalAmount.toLocaleString()}{" "}
                {lang(t.egp)}
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={pageIndex <= 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {lang(t.prev)}
                </button>
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {lang(t.page)} {pageIndex} {lang(t.of)} {totalPages}
                </span>
                <button
                  onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                  disabled={pageIndex >= totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {lang(t.next)}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommissionsPage;