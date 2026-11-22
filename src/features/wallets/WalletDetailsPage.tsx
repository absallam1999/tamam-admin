import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminWallets } from "@shared/hooks/useAdminWallets";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import {
  formatCurrency,
  getRelativeTime,
  formatDate,
} from "@shared/utils/formatters";
import type {
  PaymentConfirmationDto,
  WithdrawalDto,
} from "@shared/types";

// ============================================
// Helpers
// ============================================

type DetailTab = "overview" | "withdrawals" | "confirmations" | "transactions";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function getFullMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const clean = url.startsWith("/") ? url : `/${url}`;
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return `${base}${clean}`;
}

function getStatusBadgeClass(status?: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (s === "completed" || s === "approved" || s === "verified") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  if (s === "pending" || s === "processing") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }
  if (s === "rejected" || s === "failed" || s === "reversed") {
    return "bg-error-100 text-error-700 dark:bg-error-950/40 dark:text-error-300";
  }
  return "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300";
}

// ============================================
// WalletDetailsPage Component
// ============================================

export const WalletDetailsPage: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    withdrawals,
    fetchWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    confirmations,
    fetchPaymentConfirmations,
    verifyPayment,
    rejectPayment,
    payouts,
    fetchPayouts,
    transactions,
    fetchTransactions,
    walletStats,
    fetchWalletStats,
    platformWallet,
    fetchPlatformWallet,
    financialSummary,
    fetchFinancialSummary,
    loading,
  } = useAdminWallets();

  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Action Modals
  const [withdrawalModal, setWithdrawalModal] = useState<{
    mode: "approve" | "reject";
    item: WithdrawalDto;
  } | null>(null);
  const [withdrawalNote, setWithdrawalNote] = useState("");

  const [confirmationModal, setConfirmationModal] = useState<{
    mode: "verify" | "reject";
    item: PaymentConfirmationDto;
  } | null>(null);
  const [confirmationNote, setConfirmationNote] = useState("");
  const [confirmationDetail, setConfirmationDetail] =
    useState<PaymentConfirmationDto | null>(null);

  const loadData = useCallback(async () => {
    try {
      await Promise.allSettled([
        fetchPlatformWallet(),
        fetchWalletStats(),
        fetchFinancialSummary(),
        fetchWithdrawals({ pageIndex: 1, pageSize: 50 }),
        fetchPaymentConfirmations({ pageIndex: 1, pageSize: 50 }),
        fetchPayouts(1, 50),
        fetchTransactions({ pageIndex: 1, pageSize: 50 }),
      ]);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحميل بيانات المحفظة",
            en: "Failed to load wallet details",
          }),
        ),
      );
    } finally {
      setInitialLoading(false);
    }
  }, [
    fetchPlatformWallet,
    fetchWalletStats,
    fetchFinancialSummary,
    fetchWithdrawals,
    fetchPaymentConfirmations,
    fetchPayouts,
    fetchTransactions,
    toast,
    lang,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Match records belonging to this walletId / ownerId / record id
  const matchedWithdrawals = useMemo(() => {
    if (!walletId || showAllRecords) return withdrawals;
    const matched = withdrawals.filter(
      (w) =>
        w.walletId === walletId ||
        w.ownerId === walletId ||
        w.id === walletId,
    );
    return matched;
  }, [withdrawals, walletId, showAllRecords]);

  const matchedPayouts = useMemo(() => {
    if (!walletId || showAllRecords) return payouts;
    return payouts.filter(
      (p) =>
        p.walletId === walletId ||
        p.ownerId === walletId ||
        p.id === walletId,
    );
  }, [payouts, walletId, showAllRecords]);

  const matchedConfirmations = useMemo(() => {
    if (!walletId || showAllRecords) return confirmations;
    return confirmations.filter(
      (c) =>
        c.ownerId === walletId ||
        c.paymentNumberId === walletId ||
        c.id === walletId,
    );
  }, [confirmations, walletId, showAllRecords]);

  const matchedTransactions = useMemo(() => {
    const base =
      !walletId || showAllRecords
        ? transactions
        : transactions.filter(
            (tx) => tx.referenceId === walletId || tx.id === walletId,
          );
    return base.filter((tx) => {
      if (txTypeFilter && (tx.type ?? "") !== txTypeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(q) ||
        tx.referenceNumber?.toLowerCase().includes(q) ||
        tx.type?.toLowerCase().includes(q)
      );
    });
  }, [transactions, walletId, showAllRecords, txTypeFilter, searchQuery]);

  // Derive owner summary from any matched record
  const ownerSummary = useMemo(() => {
    const p = matchedPayouts[0];
    const w = matchedWithdrawals[0];
    const c = matchedConfirmations[0];
    return {
      ownerId: p?.ownerId ?? w?.ownerId ?? c?.ownerId ?? null,
      ownerName: p?.ownerName ?? c?.ownerName ?? null,
      ownerType: p?.ownerType ?? w?.ownerType ?? c?.ownerType ?? null,
    };
  }, [matchedPayouts, matchedWithdrawals, matchedConfirmations]);

  const totals = useMemo(() => {
    const withdrawalsAmount = matchedWithdrawals.reduce(
      (sum, w) => sum + w.amount,
      0,
    );
    const payoutsAmount = matchedPayouts.reduce((sum, p) => sum + p.amount, 0);
    const depositsAmount = matchedConfirmations.reduce(
      (sum, c) => sum + c.amount,
      0,
    );
    return {
      withdrawalsAmount,
      payoutsAmount,
      depositsAmount,
      transactionsCount: matchedTransactions.length,
    };
  }, [
    matchedWithdrawals,
    matchedPayouts,
    matchedConfirmations,
    matchedTransactions,
  ]);

  // ============================================
  // Action Handlers
  // ============================================

  const handleWithdrawalAction = async () => {
    if (!withdrawalModal) return;
    setSubmitting(true);
    try {
      if (withdrawalModal.mode === "approve") {
        await approveWithdrawal(withdrawalModal.item.id, {
          notes: withdrawalNote.trim() || null,
        });
        toast.success(
          lang({
            ar: "تمت الموافقة على طلب السحب",
            en: "Withdrawal processed successfully",
          }),
        );
      } else {
        await rejectWithdrawal(withdrawalModal.item.id, {
          reason: withdrawalNote.trim() || null,
        });
        toast.success(
          lang({ ar: "تم رفض طلب السحب", en: "Withdrawal rejected" }),
        );
      }
      setWithdrawalModal(null);
      setWithdrawalNote("");
      await loadData();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تنفيذ الإجراء", en: "Action failed" }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmationAction = async () => {
    if (!confirmationModal) return;
    setSubmitting(true);
    try {
      let updated: PaymentConfirmationDto;
      if (confirmationModal.mode === "verify") {
        updated = await verifyPayment(confirmationModal.item.id, {
          notes: confirmationNote.trim() || null,
        });
        toast.success(
          lang({
            ar: "تم تأكيد الإيداع بنجاح",
            en: "Deposit verified successfully",
          }),
        );
      } else {
        updated = await rejectPayment(confirmationModal.item.id, {
          reason: confirmationNote.trim() || null,
        });
        toast.success(
          lang({ ar: "تم رفض الإيداع", en: "Deposit rejected" }),
        );
      }
      if (confirmationDetail?.id === updated.id) {
        setConfirmationDetail(updated);
      }
      setConfirmationModal(null);
      setConfirmationNote("");
      await loadData();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تنفيذ الإجراء", en: "Action failed" }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const t = {
    back: { ar: "العودة للمحافظ", en: "Back to Wallets" },
    title: { ar: "تفاصيل المحفظة", en: "Wallet Details" },
    refresh: { ar: "تحديث", en: "Refresh" },
    showAllToggle: {
      ar: "عرض جميع سجلات المنصة",
      en: "Show all platform records",
    },
    filteredToWallet: {
      ar: "تصفية حسب المعرف الحالي",
      en: "Filtered to current ID",
    },
    overviewTab: { ar: "نظرة عامة", en: "Overview" },
    withdrawalsTab: { ar: "طلبات السحب", en: "Withdrawals" },
    confirmationsTab: { ar: "تأكيدات الإيداع", en: "Deposits" },
    transactionsTab: { ar: "المعاملات والمدفوعات", en: "Transactions & Payouts" },
    walletId: { ar: "معرف المحفظة / المرجع", en: "Wallet / Reference ID" },
    owner: { ar: "المالك", en: "Owner" },
    ownerType: { ar: "النوع", en: "Owner Type" },
    matchedWithdrawals: { ar: "إجمالي السحوبات المطابقة", en: "Matched Withdrawals" },
    matchedPayouts: { ar: "إجمالي المدفوعات المطابقة", en: "Matched Payouts" },
    matchedDeposits: { ar: "إجمالي الإيداعات المطابقة", en: "Matched Deposits" },
    platformNet: { ar: "صافي محفظة المنصة", en: "Platform Net Balance" },
    totalWallets: { ar: "إجمالي أرصدة المحافظ", en: "All Wallets Balance" },
    driversBalance: { ar: "رصيد السائقين", en: "Drivers Balance" },
    storesBalance: { ar: "رصيد المتاجر", en: "Stores Balance" },
    supervisorsBalance: { ar: "رصيد المشرفين", en: "Supervisors Balance" },
    customersBalance: { ar: "رصيد العملاء", en: "Customers Balance" },
    approve: { ar: "موافقة", en: "Approve" },
    verify: { ar: "تأكيد", en: "Verify" },
    reject: { ar: "رفض", en: "Reject" },
    details: { ar: "تفاصيل", en: "Details" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    noRecords: { ar: "لا توجد سجلات مطابقة", en: "No matching records found" },
    searchPlaceholder: {
      ar: "بحث في المعاملات...",
      en: "Search transactions...",
    },
    allTypes: { ar: "كل الأنواع", en: "All Types" },
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-8",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/wallets")}
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
              isAr
                ? "m8.25 4.5 7.5 7.5-7.5 7.5"
                : "M15.75 19.5 8.25 12l7.5-7.5"
            }
          />
        </svg>
        {lang(t.back)}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 font-mono mt-1">
            #{walletId || "—"}
            {ownerSummary.ownerName ? ` • ${ownerSummary.ownerName}` : ""}
            {ownerSummary.ownerType ? ` (${ownerSummary.ownerType})` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAllRecords((v) => !v)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors",
              showAllRecords
                ? "bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800"
                : "bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700",
            )}
          >
            {showAllRecords
              ? lang(t.showAllToggle)
              : lang(t.filteredToWallet)}
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50"
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.matchedWithdrawals)}
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totals.withdrawalsAmount)}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            ({matchedWithdrawals.length})
          </p>
        </div>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.matchedPayouts)}
          </p>
          <p className="text-2xl font-bold text-info-600 dark:text-info-400 mt-1">
            {formatCurrency(totals.payoutsAmount)}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            ({matchedPayouts.length})
          </p>
        </div>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.matchedDeposits)}
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totals.depositsAmount)}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            ({matchedConfirmations.length})
          </p>
        </div>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.platformNet)}
          </p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {formatCurrency(platformWallet?.netBalance ?? 0)}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {lang(t.totalWallets)}:{" "}
            {formatCurrency(walletStats?.totalWalletBalance ?? 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-x-auto">
        {(
          [
            { key: "overview" as const, label: lang(t.overviewTab) },
            {
              key: "withdrawals" as const,
              label: `${lang(t.withdrawalsTab)} (${matchedWithdrawals.length})`,
            },
            {
              key: "confirmations" as const,
              label: `${lang(t.confirmationsTab)} (${matchedConfirmations.length})`,
            },
            {
              key: "transactions" as const,
              label: `${lang(t.transactionsTab)} (${matchedTransactions.length + matchedPayouts.length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all",
              activeTab === tab.key
                ? "bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB: OVERVIEW                                                    */}
      {/* ================================================================ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reference & Owner Info */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">
              {isAr ? "معلومات المحفظة والمالك" : "Wallet & Owner Summary"}
            </h3>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800 text-sm">
              <span className="text-surface-500">{lang(t.walletId)}</span>
              <span className="font-mono text-surface-900 dark:text-surface-100">
                {walletId || "—"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800 text-sm">
              <span className="text-surface-500">{lang(t.owner)}</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">
                {ownerSummary.ownerName || ownerSummary.ownerId || "—"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800 text-sm">
              <span className="text-surface-500">{lang(t.ownerType)}</span>
              <span className="text-surface-900 dark:text-surface-100">
                {ownerSummary.ownerType || "—"}
              </span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-surface-500">
                {isAr ? "إجمالي أرصدة المنصة" : "Total Platform Revenue"}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(financialSummary?.totalRevenue ?? 0)}
              </span>
            </div>
          </div>

          {/* Platform Wallet & Stats Breakdown */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">
              {isAr ? "توزيع محافظ المنصة" : "Platform Wallet Breakdown"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {lang(t.driversBalance)}
                </p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {formatCurrency(walletStats?.totalDriverBalance ?? 0)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {lang(t.storesBalance)}
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(walletStats?.totalStoreBalance ?? 0)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {lang(t.supervisorsBalance)}
                </p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatCurrency(walletStats?.totalSupervisorBalance ?? 0)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-xs text-surface-500">
                  {lang(t.customersBalance)}
                </p>
                <p className="text-lg font-bold text-info-600 dark:text-info-400 mt-1">
                  {formatCurrency(walletStats?.totalCustomerBalance ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: WITHDRAWALS                                                 */}
      {/* ================================================================ */}
      {activeTab === "withdrawals" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500">
                  <th className="py-3 px-4 text-start">{isAr ? "المالك" : "Owner"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "المرجع" : "Reference"}</th>
                  <th className="py-3 px-4 text-center">{isAr ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="py-3 px-4 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {matchedWithdrawals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-surface-500"
                    >
                      {lang(t.noRecords)}
                    </td>
                  </tr>
                ) : (
                  matchedWithdrawals.map((w) => {
                    const isPending =
                      (w.status ?? "Pending").toLowerCase() === "pending";
                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-surface-900 dark:text-surface-100">
                            {w.ownerType || "—"}
                          </p>
                          <p className="text-xs font-mono text-surface-400">
                            {w.ownerId.slice(0, 8)}...
                          </p>
                        </td>
                        <td className="py-3 px-4 font-bold text-surface-900 dark:text-surface-100">
                          {formatCurrency(w.amount)}
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-500">
                          {w.paymentReference || w.notes || "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              getStatusBadgeClass(w.status),
                            )}
                          >
                            {w.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-500">
                          {getRelativeTime(w.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-end">
                          {isPending && (
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => {
                                  setWithdrawalNote("");
                                  setWithdrawalModal({
                                    mode: "approve",
                                    item: w,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                {lang(t.approve)}
                              </button>
                              <button
                                onClick={() => {
                                  setWithdrawalNote("");
                                  setWithdrawalModal({
                                    mode: "reject",
                                    item: w,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 hover:bg-error-100"
                              >
                                {lang(t.reject)}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: DEPOSITS / PAYMENT CONFIRMATIONS                            */}
      {/* ================================================================ */}
      {activeTab === "confirmations" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500">
                  <th className="py-3 px-4 text-start">{isAr ? "المستخدم" : "Owner"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "من / إلى" : "From / To"}</th>
                  <th className="py-3 px-4 text-center">{isAr ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="py-3 px-4 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {matchedConfirmations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-surface-500"
                    >
                      {lang(t.noRecords)}
                    </td>
                  </tr>
                ) : (
                  matchedConfirmations.map((c) => {
                    const isPending =
                      (c.status ?? "Pending").toLowerCase() === "pending";
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-surface-900 dark:text-surface-100">
                            {c.ownerName || c.ownerType || "—"}
                          </p>
                          <p className="text-xs text-surface-400">
                            {c.paymentMethod || "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(c.amount)}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-surface-500">
                          {c.phoneFrom || "—"} → {c.paymentNumberPhone || "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              getStatusBadgeClass(c.status),
                            )}
                          >
                            {c.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-500">
                          {getRelativeTime(c.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setConfirmationDetail(c)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-200 dark:border-surface-700"
                            >
                              {lang(t.details)}
                            </button>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => {
                                    setConfirmationNote("");
                                    setConfirmationModal({
                                      mode: "verify",
                                      item: c,
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  {lang(t.verify)}
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmationNote("");
                                    setConfirmationModal({
                                      mode: "reject",
                                      item: c,
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400"
                                >
                                  {lang(t.reject)}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: TRANSACTIONS & PAYOUTS                                      */}
      {/* ================================================================ */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang(t.searchPlaceholder)}
              className="flex-1 rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <select
              value={txTypeFilter}
              onChange={(e) => setTxTypeFilter(e.target.value)}
              className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm border border-surface-200 dark:border-surface-700"
            >
              <option value="">{lang(t.allTypes)}</option>
              <option value="Commission">{isAr ? "عمولة" : "Commission"}</option>
              <option value="Withdrawal">{isAr ? "سحب" : "Withdrawal"}</option>
              <option value="Refund">{isAr ? "استرداد" : "Refund"}</option>
              <option value="Bonus">{isAr ? "مكافأة" : "Bonus"}</option>
            </select>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500">
                    <th className="py-3 px-4 text-start">{isAr ? "النوع" : "Type"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الوصف" : "Description"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "المرجع" : "Reference"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {matchedTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center text-sm text-surface-500"
                      >
                        {lang(t.noRecords)}
                      </td>
                    </tr>
                  ) : (
                    matchedTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30"
                      >
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800">
                            {tx.type || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-700 dark:text-surface-300">
                          {tx.description || "—"}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-surface-400">
                          {tx.referenceNumber
                            ? `#${tx.referenceNumber}`
                            : tx.referenceId
                              ? `#${tx.referenceId.slice(0, 8)}`
                              : "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-surface-900 dark:text-surface-100">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-500">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Approve/Reject Modal */}
      {withdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setWithdrawalModal(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {withdrawalModal.mode === "approve"
                ? isAr
                  ? "تأكيد معالجة السحب"
                  : "Approve Withdrawal"
                : isAr
                  ? "رفض طلب السحب"
                  : "Reject Withdrawal"}
            </h3>
            <p className="text-sm text-surface-500 mt-1 mb-4">
              {formatCurrency(withdrawalModal.item.amount)}
            </p>
            <textarea
              value={withdrawalNote}
              onChange={(e) => setWithdrawalNote(e.target.value)}
              placeholder={
                withdrawalModal.mode === "approve"
                  ? isAr
                    ? "ملاحظات (اختياري)..."
                    : "Notes (optional)..."
                  : isAr
                    ? "سبب الرفض (اختياري)..."
                    : "Rejection reason (optional)..."
              }
              rows={3}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setWithdrawalModal(null)}
                className="px-4 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleWithdrawalAction}
                disabled={submitting}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50",
                  withdrawalModal.mode === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-error-600 hover:bg-error-700",
                )}
              >
                {submitting ? lang(t.processing) : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Detail Modal */}
      {confirmationDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmationDetail(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isAr ? "تفاصيل الإيداع" : "Deposit Details"}
              </h3>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  getStatusBadgeClass(confirmationDetail.status),
                )}
              >
                {confirmationDetail.status || "Pending"}
              </span>
            </div>
            {confirmationDetail.screenshotUrl && (
              <div className="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800">
                <img
                  src={getFullMediaUrl(confirmationDetail.screenshotUrl)}
                  alt="Receipt"
                  className="w-full max-h-72 object-contain"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmationDetail(null)}
                className="px-4 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Verify/Reject Modal */}
      {confirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmationModal(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {confirmationModal.mode === "verify"
                ? isAr
                  ? "تأكيد الإيداع"
                  : "Verify Deposit"
                : isAr
                  ? "رفض الإيداع"
                  : "Reject Deposit"}
            </h3>
            <p className="text-sm text-surface-500 mt-1 mb-4">
              {formatCurrency(confirmationModal.item.amount)}
            </p>
            <textarea
              value={confirmationNote}
              onChange={(e) => setConfirmationNote(e.target.value)}
              placeholder={
                confirmationModal.mode === "verify"
                  ? isAr
                    ? "ملاحظات (اختياري)..."
                    : "Notes (optional)..."
                  : isAr
                    ? "سبب الرفض (اختياري)..."
                    : "Rejection reason (optional)..."
              }
              rows={3}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmationModal(null)}
                className="px-4 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleConfirmationAction}
                disabled={submitting}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50",
                  confirmationModal.mode === "verify"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-error-600 hover:bg-error-700",
                )}
              >
                {submitting ? lang(t.processing) : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDetailsPage;