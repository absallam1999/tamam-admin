import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminWallets } from "@shared/hooks/useAdminWallets";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency, getRelativeTime } from "@shared/utils/formatters";
import type {
  BonusTierDto,
  CreateBonusTierDto,
  CreatePaymentNumberDto,
  PaymentConfirmationDto,
  PaymentNumberDto,
  UpdateBonusTierDto,
  UpdatePaymentNumberDto,
  WithdrawalDto,
} from "@shared/types";

// ============================================
// Helpers
// ============================================

type WalletTab =
  | "withdrawals"
  | "confirmations"
  | "payouts"
  | "paymentNumbers"
  | "bonus";

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
  if (
    s === "completed" ||
    s === "approved" ||
    s === "verified" ||
    s === "active"
  ) {
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
// Form Defaults
// ============================================

interface PaymentNumberFormState {
  phoneNumber: string;
  paymentMethod: string;
  label: string;
  initialBalance: number;
  isActive: boolean;
}

const initialPaymentNumberForm: PaymentNumberFormState = {
  phoneNumber: "",
  paymentMethod: "VodafoneCash",
  label: "",
  initialBalance: 0,
  isActive: true,
};

interface BonusTierFormState {
  minAmount: number;
  maxAmount: string;
  bonusType: string;
  bonusValue: number;
  isActive: boolean;
}

const initialBonusTierForm: BonusTierFormState = {
  minAmount: 0,
  maxAmount: "",
  bonusType: "Fixed",
  bonusValue: 0,
  isActive: true,
};

// ============================================
// WalletsPage Component
// ============================================

export const WalletsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    // Withdrawals
    withdrawals,
    withdrawalsTotalCount,
    fetchWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    // Confirmations (Deposits)
    confirmations,
    confirmationsTotalCount,
    fetchPaymentConfirmations,
    fetchPaymentConfirmationById,
    verifyPayment,
    rejectPayment,
    // Finance, payouts, stats
    financialSummary,
    fetchFinancialSummary,
    transactions,
    transactionsTotalCount,
    fetchTransactions,
    payouts,
    payoutsTotalCount,
    fetchPayouts,
    walletStats,
    fetchWalletStats,
    platformWallet,
    fetchPlatformWallet,
    // Payment numbers
    paymentNumbers,
    fetchPaymentNumbers,
    createPaymentNumber,
    updatePaymentNumber,
    deletePaymentNumber,
    // Bonus
    bonusStatus,
    fetchBonusStatus,
    enableBonus,
    disableBonus,
    bonusTiers,
    fetchBonusTiers,
    createBonusTier,
    updateBonusTier,
    deleteBonusTier,
    toggleBonusTier,
    loading,
  } = useAdminWallets();

  const [activeTab, setActiveTab] = useState<WalletTab>("withdrawals");
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Pagination
  const [withdrawalStatus, setWithdrawalStatus] = useState("");
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1);

  const [confirmationStatus, setConfirmationStatus] = useState("");
  const [confirmationPage, setConfirmationPage] = useState(1);
  const [confirmationTotalPages, setConfirmationTotalPages] = useState(1);

  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutTotalPages, setPayoutTotalPages] = useState(1);

  const [txTypeFilter, setTxTypeFilter] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  const [paymentNumberActiveFilter, setPaymentNumberActiveFilter] =
    useState<string>("");

  const pageSize = 15;

  // Modals — Withdrawal
  const [withdrawalModal, setWithdrawalModal] = useState<{
    mode: "approve" | "reject";
    item: WithdrawalDto;
  } | null>(null);
  const [withdrawalNote, setWithdrawalNote] = useState("");

  // Modals — Payment Confirmation (Deposit)
  const [confirmationDetail, setConfirmationDetail] =
    useState<PaymentConfirmationDto | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    mode: "verify" | "reject";
    item: PaymentConfirmationDto;
  } | null>(null);
  const [confirmationNote, setConfirmationNote] = useState("");

  // Modals — Payment Numbers
  const [showPaymentNumberModal, setShowPaymentNumberModal] = useState(false);
  const [editingPaymentNumber, setEditingPaymentNumber] =
    useState<PaymentNumberDto | null>(null);
  const [deletingPaymentNumber, setDeletingPaymentNumber] =
    useState<PaymentNumberDto | null>(null);
  const [paymentNumberForm, setPaymentNumberForm] =
    useState<PaymentNumberFormState>(initialPaymentNumberForm);

  // Modals — Bonus Tiers
  const [showBonusTierModal, setShowBonusTierModal] = useState(false);
  const [editingBonusTier, setEditingBonusTier] =
    useState<BonusTierDto | null>(null);
  const [deletingBonusTier, setDeletingBonusTier] =
    useState<BonusTierDto | null>(null);
  const [bonusTierForm, setBonusTierForm] =
    useState<BonusTierFormState>(initialBonusTierForm);

  // ============================================
  // Data Loaders
  // ============================================

  const loadOverview = useCallback(async () => {
    await Promise.allSettled([
      fetchPlatformWallet(),
      fetchWalletStats(),
      fetchFinancialSummary(),
    ]);
  }, [fetchPlatformWallet, fetchWalletStats, fetchFinancialSummary]);

  const loadWithdrawals = useCallback(async () => {
    const res = await fetchWithdrawals({
      status: withdrawalStatus || undefined,
      pageIndex: withdrawalPage,
      pageSize,
    });
    setWithdrawalTotalPages(res.totalPages || 1);
  }, [fetchWithdrawals, withdrawalStatus, withdrawalPage]);

  const loadConfirmations = useCallback(async () => {
    const res = await fetchPaymentConfirmations({
      status: confirmationStatus || undefined,
      pageIndex: confirmationPage,
      pageSize,
    });
    setConfirmationTotalPages(res.totalPages || 1);
  }, [fetchPaymentConfirmations, confirmationStatus, confirmationPage]);

  const loadPayoutsAndTransactions = useCallback(async () => {
    const [pRes, tRes] = await Promise.all([
      fetchPayouts(payoutPage, pageSize),
      fetchTransactions({
        type: txTypeFilter || undefined,
        pageIndex: txPage,
        pageSize,
      }),
    ]);
    setPayoutTotalPages(pRes.totalPages || 1);
    setTxTotalPages(tRes.totalPages || 1);
  }, [fetchPayouts, payoutPage, fetchTransactions, txTypeFilter, txPage]);

  const loadPaymentNumbers = useCallback(async () => {
    const isActive =
      paymentNumberActiveFilter === "active"
        ? true
        : paymentNumberActiveFilter === "inactive"
          ? false
          : undefined;
    await fetchPaymentNumbers(isActive);
  }, [fetchPaymentNumbers, paymentNumberActiveFilter]);

  const loadBonus = useCallback(async () => {
    await Promise.all([fetchBonusStatus(), fetchBonusTiers()]);
  }, [fetchBonusStatus, fetchBonusTiers]);

  const refreshAll = useCallback(async () => {
    try {
      await loadOverview();
      if (activeTab === "withdrawals") await loadWithdrawals();
      else if (activeTab === "confirmations") await loadConfirmations();
      else if (activeTab === "payouts") await loadPayoutsAndTransactions();
      else if (activeTab === "paymentNumbers") await loadPaymentNumbers();
      else if (activeTab === "bonus") await loadBonus();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل البيانات", en: "Failed to load wallet data" }),
        ),
      );
    } finally {
      setInitialLoading(false);
    }
  }, [
    activeTab,
    loadOverview,
    loadWithdrawals,
    loadConfirmations,
    loadPayoutsAndTransactions,
    loadPaymentNumbers,
    loadBonus,
    toast,
    lang,
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

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
      await Promise.allSettled([loadOverview(), loadWithdrawals()]);
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

  const handleOpenConfirmationDetail = async (item: PaymentConfirmationDto) => {
    setConfirmationDetail(item);
    try {
      const fresh = await fetchPaymentConfirmationById(item.id);
      setConfirmationDetail(fresh);
    } catch {
      // keep existing item
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
      await Promise.allSettled([loadOverview(), loadConfirmations()]);
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

  const handleSavePaymentNumber = async () => {
    if (!paymentNumberForm.phoneNumber.trim()) {
      toast.error(
        lang({ ar: "رقم الدفع مطلوب", en: "Phone number is required" }),
      );
      return;
    }
    setSubmitting(true);
    try {
      if (editingPaymentNumber) {
        const dto: UpdatePaymentNumberDto = {
          phoneNumber: paymentNumberForm.phoneNumber.trim(),
          paymentMethod: paymentNumberForm.paymentMethod.trim() || null,
          label: paymentNumberForm.label.trim() || null,
          isActive: paymentNumberForm.isActive,
        };
        await updatePaymentNumber(editingPaymentNumber.id, dto);
        toast.success(
          lang({
            ar: "تم تحديث رقم الدفع بنجاح",
            en: "Payment number updated",
          }),
        );
        setEditingPaymentNumber(null);
      } else {
        const dto: CreatePaymentNumberDto = {
          phoneNumber: paymentNumberForm.phoneNumber.trim(),
          paymentMethod: paymentNumberForm.paymentMethod.trim() || null,
          label: paymentNumberForm.label.trim() || null,
          initialBalance: paymentNumberForm.initialBalance,
        };
        await createPaymentNumber(dto);
        toast.success(
          lang({
            ar: "تم إضافة رقم الدفع بنجاح",
            en: "Payment number created",
          }),
        );
        setShowPaymentNumberModal(false);
      }
      setPaymentNumberForm(initialPaymentNumberForm);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل حفظ رقم الدفع",
            en: "Failed to save payment number",
          }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaymentNumber = async () => {
    if (!deletingPaymentNumber) return;
    setSubmitting(true);
    try {
      await deletePaymentNumber(deletingPaymentNumber.id);
      toast.success(
        lang({ ar: "تم حذف رقم الدفع", en: "Payment number deleted" }),
      );
      setDeletingPaymentNumber(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل الحذف", en: "Failed to delete payment number" }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBonusSystem = async () => {
    setSubmitting(true);
    try {
      if (bonusStatus?.isEnabled) {
        await disableBonus();
        toast.success(
          lang({ ar: "تم إيقاف نظام المكافآت", en: "Bonus system disabled" }),
        );
      } else {
        await enableBonus();
        toast.success(
          lang({ ar: "تم تفعيل نظام المكافآت", en: "Bonus system enabled" }),
        );
      }
      await fetchBonusStatus();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث نظام المكافآت", en: "Failed to toggle bonus" }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBonusTier = async () => {
    setSubmitting(true);
    try {
      const parsedMax =
        bonusTierForm.maxAmount.trim() === ""
          ? null
          : parseFloat(bonusTierForm.maxAmount);
      if (editingBonusTier) {
        const dto: UpdateBonusTierDto = {
          minAmount: bonusTierForm.minAmount,
          maxAmount: parsedMax,
          bonusType: bonusTierForm.bonusType.trim() || null,
          bonusValue: bonusTierForm.bonusValue,
          isActive: bonusTierForm.isActive,
        };
        await updateBonusTier(editingBonusTier.id, dto);
        toast.success(
          lang({ ar: "تم تحديث شريحة المكافأة", en: "Bonus tier updated" }),
        );
        setEditingBonusTier(null);
      } else {
        const dto: CreateBonusTierDto = {
          minAmount: bonusTierForm.minAmount,
          maxAmount: parsedMax,
          bonusType: bonusTierForm.bonusType.trim() || null,
          bonusValue: bonusTierForm.bonusValue,
        };
        await createBonusTier(dto);
        toast.success(
          lang({ ar: "تم إنشاء شريحة المكافأة", en: "Bonus tier created" }),
        );
        setShowBonusTierModal(false);
      }
      setBonusTierForm(initialBonusTierForm);
      await fetchBonusStatus();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل حفظ شريحة المكافأة",
            en: "Failed to save bonus tier",
          }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBonusTier = async (tier: BonusTierDto) => {
    setSubmitting(true);
    try {
      await toggleBonusTier(tier.id);
      await fetchBonusStatus();
      toast.success(
        lang({ ar: "تم تحديث حالة الشريحة", en: "Tier status updated" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث الشريحة", en: "Failed to toggle tier" }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBonusTier = async () => {
    if (!deletingBonusTier) return;
    setSubmitting(true);
    try {
      await deleteBonusTier(deletingBonusTier.id);
      await fetchBonusStatus();
      toast.success(
        lang({ ar: "تم حذف شريحة المكافأة", en: "Bonus tier deleted" }),
      );
      setDeletingBonusTier(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل الحذف", en: "Failed to delete bonus tier" }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // Translations
  // ============================================

  const t = {
    title: { ar: "المحافظ والمالية", en: "Wallets & Finance" },
    subtitle: {
      ar: "إدارة السحوبات والإيداعات وأرقام الدفع والمكافآت والتقارير المالية",
      en: "Manage withdrawals, deposits, payment numbers, bonuses, and finance",
    },
    refresh: { ar: "تحديث", en: "Refresh" },
    netBalance: { ar: "صافي رصيد المنصة", en: "Platform Net Balance" },
    totalRevenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
    totalCommission: { ar: "العمولات المكتسبة", en: "Commission Earned" },
    pendingPayouts: { ar: "مدفوعات معلقة", en: "Pending Payouts" },
    totalWalletBalance: { ar: "إجمالي أرصدة المحافظ", en: "Total Wallets Balance" },
    driversBalance: { ar: "السائقين", en: "Drivers" },
    storesBalance: { ar: "المتاجر", en: "Stores" },
    supervisorsBalance: { ar: "المشرفين", en: "Supervisors" },
    customersBalance: { ar: "العملاء", en: "Customers" },
    activeWallets: { ar: "محافظ نشطة", en: "Active Wallets" },
    withdrawalsTab: { ar: "طلبات السحب", en: "Withdrawals" },
    confirmationsTab: { ar: "تأكيدات الإيداع", en: "Deposits" },
    payoutsTab: { ar: "المدفوعات والمعاملات", en: "Payouts & Ledger" },
    paymentNumbersTab: { ar: "أرقام الدفع", en: "Payment Numbers" },
    bonusTab: { ar: "نظام المكافآت", en: "Bonus System" },
    all: { ar: "الكل", en: "All" },
    pending: { ar: "معلق", en: "Pending" },
    completed: { ar: "مكتمل", en: "Completed" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    approved: { ar: "مقبول", en: "Approved" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    approve: { ar: "موافقة", en: "Approve" },
    verify: { ar: "تأكيد", en: "Verify" },
    reject: { ar: "رفض", en: "Reject" },
    details: { ar: "تفاصيل", en: "Details" },
    edit: { ar: "تعديل", en: "Edit" },
    delete: { ar: "حذف", en: "Delete" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    save: { ar: "حفظ", en: "Save" },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    noRecords: { ar: "لا توجد بيانات", en: "No records found" },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    prev: { ar: "السابق", en: "Previous" },
    next: { ar: "التالي", en: "Next" },
    addPaymentNumber: { ar: "إضافة رقم دفع", en: "Add Payment Number" },
    addBonusTier: { ar: "إضافة شريحة مكافأة", en: "Add Bonus Tier" },
    enableBonus: { ar: "تفعيل نظام المكافآت", en: "Enable Bonus System" },
    disableBonus: { ar: "إيقاف نظام المكافآت", en: "Disable Bonus System" },
  };

  if (initialLoading && !platformWallet && !walletStats && !financialSummary) {
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
        <button
          onClick={refreshAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors self-start sm:self-auto disabled:opacity-50"
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

      {/* Top Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.netBalance)}
          </p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {formatCurrency(platformWallet?.netBalance ?? 0)}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {lang(t.totalCommission)}:{" "}
            {formatCurrency(platformWallet?.totalCommissionEarned ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.totalRevenue)}
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(financialSummary?.totalRevenue ?? 0)}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {isAr ? "الصافي" : "Net"}:{" "}
            {formatCurrency(financialSummary?.netRevenue ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.pendingPayouts)}
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(
              platformWallet?.totalPayoutsPending ??
                financialSummary?.pendingPayouts ??
                0,
            )}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {isAr ? "طلبات معلقة" : "Pending"}:{" "}
            {financialSummary?.pendingWithdrawalsCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.totalWalletBalance)}
          </p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-1">
            {formatCurrency(walletStats?.totalWalletBalance ?? 0)}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {lang(t.activeWallets)}: {walletStats?.activeWallets ?? 0} /{" "}
            {walletStats?.totalWallets ?? 0}
          </p>
        </div>
      </div>

      {/* Wallet Breakdown Strip */}
      {walletStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.driversBalance)}
            </p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {formatCurrency(walletStats.totalDriverBalance)}
            </p>
          </div>
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.storesBalance)}
            </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(walletStats.totalStoreBalance)}
            </p>
          </div>
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.supervisorsBalance)}
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              {formatCurrency(walletStats.totalSupervisorBalance)}
            </p>
          </div>
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.customersBalance)}
            </p>
            <p className="text-lg font-bold text-info-600 dark:text-info-400 mt-0.5">
              {formatCurrency(walletStats.totalCustomerBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-x-auto">
        {(
          [
            {
              key: "withdrawals" as const,
              label: lang(t.withdrawalsTab),
              count: withdrawalsTotalCount,
            },
            {
              key: "confirmations" as const,
              label: lang(t.confirmationsTab),
              count: confirmationsTotalCount,
            },
            {
              key: "payouts" as const,
              label: lang(t.payoutsTab),
              count: payoutsTotalCount,
            },
            {
              key: "paymentNumbers" as const,
              label: lang(t.paymentNumbersTab),
              count: paymentNumbers.length,
            },
            {
              key: "bonus" as const,
              label: lang(t.bonusTab),
              count: bonusTiers.length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
              activeTab === tab.key
                ? "bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100",
            )}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1: WITHDRAWALS                                               */}
      {/* ================================================================ */}
      {activeTab === "withdrawals" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-5 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.withdrawalsTab)}
            </h2>
            <select
              value={withdrawalStatus}
              onChange={(e) => {
                setWithdrawalStatus(e.target.value);
                setWithdrawalPage(1);
              }}
              className="rounded-xl py-2 px-3 bg-surface-50 dark:bg-surface-800 text-xs font-medium text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 cursor-pointer"
            >
              <option value="">{lang(t.all)}</option>
              <option value="Pending">{lang(t.pending)}</option>
              <option value="Completed">{lang(t.completed)}</option>
              <option value="Rejected">{lang(t.rejected)}</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500 dark:text-surface-400">
                  <th className="py-3 px-4 text-start">{isAr ? "المالك" : "Owner"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "المرجع" : "Reference"}</th>
                  <th className="py-3 px-4 text-center">{isAr ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="py-3 px-4 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-surface-500 dark:text-surface-400"
                    >
                      {lang(t.noRecords)}
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => {
                    const isPending =
                      (w.status ?? "Pending").toLowerCase() === "pending";
                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
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
                        <td className="py-3 px-4 text-xs text-surface-500 dark:text-surface-400">
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
                        <td className="py-3 px-4 text-xs text-surface-500 dark:text-surface-400">
                          {getRelativeTime(w.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-end">
                          {isPending && (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setWithdrawalNote("");
                                  setWithdrawalModal({
                                    mode: "approve",
                                    item: w,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
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
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 hover:bg-error-100 transition-colors"
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

          {withdrawalTotalPages > 1 && (
            <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setWithdrawalPage((p) => Math.max(1, p - 1))}
                disabled={withdrawalPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
              >
                {lang(t.prev)}
              </button>
              <span className="text-surface-500">
                {lang(t.page)} {withdrawalPage} {lang(t.of)}{" "}
                {withdrawalTotalPages}
              </span>
              <button
                onClick={() =>
                  setWithdrawalPage((p) =>
                    Math.min(withdrawalTotalPages, p + 1),
                  )
                }
                disabled={withdrawalPage >= withdrawalTotalPages}
                className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
              >
                {lang(t.next)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: PAYMENT CONFIRMATIONS (DEPOSITS)                          */}
      {/* ================================================================ */}
      {activeTab === "confirmations" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-5 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.confirmationsTab)}
            </h2>
            <select
              value={confirmationStatus}
              onChange={(e) => {
                setConfirmationStatus(e.target.value);
                setConfirmationPage(1);
              }}
              className="rounded-xl py-2 px-3 bg-surface-50 dark:bg-surface-800 text-xs font-medium text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 cursor-pointer"
            >
              <option value="">{lang(t.all)}</option>
              <option value="Pending">{lang(t.pending)}</option>
              <option value="Approved">{lang(t.approved)}</option>
              <option value="Rejected">{lang(t.rejected)}</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500 dark:text-surface-400">
                  <th className="py-3 px-4 text-start">{isAr ? "المستخدم" : "Owner"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "من رقم / إلى رقم" : "From / To"}</th>
                  <th className="py-3 px-4 text-center">{isAr ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="py-3 px-4 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {confirmations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-surface-500 dark:text-surface-400"
                    >
                      {lang(t.noRecords)}
                    </td>
                  </tr>
                ) : (
                  confirmations.map((c) => {
                    const isPending =
                      (c.status ?? "Pending").toLowerCase() === "pending";
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
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
                        <td className="py-3 px-4 text-xs font-mono text-surface-600 dark:text-surface-300">
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
                        <td className="py-3 px-4 text-xs text-surface-500 dark:text-surface-400">
                          {getRelativeTime(c.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenConfirmationDetail(c)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
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
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
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
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 hover:bg-error-100 transition-colors"
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

          {confirmationTotalPages > 1 && (
            <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setConfirmationPage((p) => Math.max(1, p - 1))}
                disabled={confirmationPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
              >
                {lang(t.prev)}
              </button>
              <span className="text-surface-500">
                {lang(t.page)} {confirmationPage} {lang(t.of)}{" "}
                {confirmationTotalPages}
              </span>
              <button
                onClick={() =>
                  setConfirmationPage((p) =>
                    Math.min(confirmationTotalPages, p + 1),
                  )
                }
                disabled={confirmationPage >= confirmationTotalPages}
                className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
              >
                {lang(t.next)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: PAYOUTS & TRANSACTIONS                                    */}
      {/* ================================================================ */}
      {activeTab === "payouts" && (
        <div className="space-y-6">
          {/* Payouts */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="p-5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                {isAr ? "المدفوعات" : "Payouts"} ({payoutsTotalCount})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500 dark:text-surface-400">
                    <th className="py-3 px-4 text-start">{isAr ? "المستلم" : "Recipient"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "النوع" : "Type"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                    <th className="py-3 px-4 text-center">{isAr ? "الحالة" : "Status"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {payouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-sm text-surface-500 dark:text-surface-400"
                      >
                        {lang(t.noRecords)}
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30"
                      >
                        <td className="py-3 px-4 font-medium text-surface-900 dark:text-surface-100">
                          {p.ownerName || p.ownerId.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-500">
                          {p.ownerType || "—"}
                        </td>
                        <td className="py-3 px-4 font-bold text-surface-900 dark:text-surface-100">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              getStatusBadgeClass(p.status),
                            )}
                          >
                            {p.status || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-500">
                          {getRelativeTime(p.processedAt ?? p.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {payoutTotalPages > 1 && (
              <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                  disabled={payoutPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
                >
                  {lang(t.prev)}
                </button>
                <span className="text-surface-500">
                  {lang(t.page)} {payoutPage} {lang(t.of)} {payoutTotalPages}
                </span>
                <button
                  onClick={() =>
                    setPayoutPage((p) => Math.min(payoutTotalPages, p + 1))
                  }
                  disabled={payoutPage >= payoutTotalPages}
                  className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
                >
                  {lang(t.next)}
                </button>
              </div>
            )}
          </div>

          {/* Transactions Ledger */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="p-5 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                {isAr ? "سجل المعاملات" : "Financial Transactions"} (
                {transactionsTotalCount})
              </h2>
              <select
                value={txTypeFilter}
                onChange={(e) => {
                  setTxTypeFilter(e.target.value);
                  setTxPage(1);
                }}
                className="rounded-xl py-2 px-3 bg-surface-50 dark:bg-surface-800 text-xs font-medium text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 cursor-pointer"
              >
                <option value="">{lang(t.all)}</option>
                <option value="Commission">
                  {isAr ? "عمولة" : "Commission"}
                </option>
                <option value="Withdrawal">
                  {isAr ? "سحب" : "Withdrawal"}
                </option>
                <option value="Refund">{isAr ? "استرداد" : "Refund"}</option>
                <option value="Bonus">{isAr ? "مكافأة" : "Bonus"}</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs text-surface-500 dark:text-surface-400">
                    <th className="py-3 px-4 text-start">{isAr ? "النوع" : "Type"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الوصف" : "Description"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "المرجع" : "Reference"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-sm text-surface-500 dark:text-surface-400"
                      >
                        {lang(t.noRecords)}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-800/30"
                      >
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
                            {tx.type || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-surface-700 dark:text-surface-300 max-w-xs truncate">
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
                          {getRelativeTime(tx.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {txTotalPages > 1 && (
              <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
                >
                  {lang(t.prev)}
                </button>
                <span className="text-surface-500">
                  {lang(t.page)} {txPage} {lang(t.of)} {txTotalPages}
                </span>
                <button
                  onClick={() =>
                    setTxPage((p) => Math.min(txTotalPages, p + 1))
                  }
                  disabled={txPage >= txTotalPages}
                  className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40"
                >
                  {lang(t.next)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: PAYMENT NUMBERS                                           */}
      {/* ================================================================ */}
      {activeTab === "paymentNumbers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <select
              value={paymentNumberActiveFilter}
              onChange={(e) => setPaymentNumberActiveFilter(e.target.value)}
              className="rounded-xl py-2 px-3 bg-white dark:bg-surface-900 text-xs font-medium text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 cursor-pointer w-fit"
            >
              <option value="">{lang(t.all)}</option>
              <option value="active">{lang(t.active)}</option>
              <option value="inactive">{lang(t.inactive)}</option>
            </select>
            <button
              onClick={() => {
                setPaymentNumberForm(initialPaymentNumberForm);
                setEditingPaymentNumber(null);
                setShowPaymentNumberModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20 self-start sm:self-auto"
            >
              + {lang(t.addPaymentNumber)}
            </button>
          </div>

          {paymentNumbers.length === 0 ? (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-10 text-center text-sm text-surface-500">
              {lang(t.noRecords)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paymentNumbers.map((pn) => (
                <div
                  key={pn.id}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-bold text-base text-surface-900 dark:text-surface-100">
                        {pn.phoneNumber || "—"}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {pn.label || "—"} • {pn.paymentMethod || "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        pn.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                      )}
                    >
                      {pn.isActive ? lang(t.active) : lang(t.inactive)}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(pn.balance)}
                  </p>
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100 dark:border-surface-800 text-xs">
                    <button
                      onClick={() => {
                        setPaymentNumberForm({
                          phoneNumber: pn.phoneNumber ?? "",
                          paymentMethod: pn.paymentMethod ?? "",
                          label: pn.label ?? "",
                          initialBalance: pn.balance,
                          isActive: pn.isActive,
                        });
                        setEditingPaymentNumber(pn);
                      }}
                      className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {lang(t.edit)}
                    </button>
                    <button
                      onClick={() => setDeletingPaymentNumber(pn)}
                      className="font-medium text-error-600 dark:text-error-400 hover:underline"
                    >
                      {lang(t.delete)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 5: BONUS SYSTEM                                              */}
      {/* ================================================================ */}
      {activeTab === "bonus" && (
        <div className="space-y-4">
          {/* Bonus Status Header */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-xs text-surface-500">
                  {isAr ? "الحالة" : "Status"}
                </p>
                <p
                  className={cn(
                    "text-sm font-bold mt-0.5",
                    bonusStatus?.isEnabled
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-surface-500",
                  )}
                >
                  {bonusStatus?.isEnabled
                    ? isAr
                      ? "مفعل"
                      : "Enabled"
                    : isAr
                      ? "معطل"
                      : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500">
                  {isAr ? "الشرائح النشطة" : "Active Tiers"}
                </p>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-0.5">
                  {bonusStatus?.activeTiers ?? 0} /{" "}
                  {bonusStatus?.totalTiers ?? bonusTiers.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500">
                  {isAr ? "إجمالي المكافآت" : "Total Bonus Paid"}
                </p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-0.5">
                  {formatCurrency(bonusStatus?.totalBonusPaid ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500">
                  {isAr ? "مكافآت هذا الشهر" : "Paid This Month"}
                </p>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-0.5">
                  {formatCurrency(bonusStatus?.bonusPaidThisMonth ?? 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleToggleBonusSystem}
                disabled={submitting}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50",
                  bonusStatus?.isEnabled
                    ? "bg-error-600 hover:bg-error-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {bonusStatus?.isEnabled
                  ? lang(t.disableBonus)
                  : lang(t.enableBonus)}
              </button>
              <button
                onClick={() => {
                  setBonusTierForm(initialBonusTierForm);
                  setEditingBonusTier(null);
                  setShowBonusTierModal(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                + {lang(t.addBonusTier)}
              </button>
            </div>
          </div>

          {/* Bonus Tiers Grid */}
          {bonusTiers.length === 0 ? (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-10 text-center text-sm text-surface-500">
              {lang(t.noRecords)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bonusTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-surface-500">
                        {isAr ? "نطاق المبلغ" : "Amount Range"}
                      </p>
                      <p className="font-bold text-surface-900 dark:text-surface-100 mt-0.5">
                        {formatCurrency(tier.minAmount)} —{" "}
                        {tier.maxAmount != null
                          ? formatCurrency(tier.maxAmount)
                          : "∞"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        tier.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                      )}
                    >
                      {tier.isActive ? lang(t.active) : lang(t.inactive)}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {tier.bonusType || "Fixed"}:{" "}
                    {tier.bonusType?.toLowerCase().includes("percent")
                      ? `${tier.bonusValue}%`
                      : formatCurrency(tier.bonusValue)}
                  </p>
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100 dark:border-surface-800 text-xs">
                    <button
                      onClick={() => handleToggleBonusTier(tier)}
                      disabled={submitting}
                      className="font-medium text-surface-600 dark:text-surface-300 hover:underline"
                    >
                      {tier.isActive
                        ? isAr
                          ? "تعطيل"
                          : "Disable"
                        : isAr
                          ? "تفعيل"
                          : "Enable"}
                    </button>
                    <button
                      onClick={() => {
                        setBonusTierForm({
                          minAmount: tier.minAmount,
                          maxAmount:
                            tier.maxAmount != null ? String(tier.maxAmount) : "",
                          bonusType: tier.bonusType ?? "Fixed",
                          bonusValue: tier.bonusValue,
                          isActive: tier.isActive,
                        });
                        setEditingBonusTier(tier);
                      }}
                      className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {lang(t.edit)}
                    </button>
                    <button
                      onClick={() => setDeletingBonusTier(tier)}
                      className="font-medium text-error-600 dark:text-error-400 hover:underline"
                    >
                      {lang(t.delete)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* MODALS                                                           */}
      {/* ================================================================ */}

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
              {formatCurrency(withdrawalModal.item.amount)} —{" "}
              {withdrawalModal.item.ownerType || ""}
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
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 text-sm resize-none mb-4"
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

      {/* Deposit Confirmation Detail Modal */}
      {confirmationDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmationDetail(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {isAr ? "تفاصيل تأكيد الإيداع" : "Deposit Confirmation Details"}
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

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <span className="text-xs text-surface-400 block">
                  {isAr ? "المبلغ" : "Amount"}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(confirmationDetail.amount)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <span className="text-xs text-surface-400 block">
                  {isAr ? "المستخدم" : "Owner"}
                </span>
                <span className="font-medium text-surface-900 dark:text-surface-100">
                  {confirmationDetail.ownerName ||
                    confirmationDetail.ownerType ||
                    "—"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <span className="text-xs text-surface-400 block">
                  {isAr ? "محول من" : "Phone From"}
                </span>
                <span className="font-mono">
                  {confirmationDetail.phoneFrom || "—"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <span className="text-xs text-surface-400 block">
                  {isAr ? "رقم الاستقبال" : "Payment Number"}
                </span>
                <span className="font-mono">
                  {confirmationDetail.paymentNumberPhone || "—"}
                </span>
              </div>
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

            {confirmationDetail.notes && (
              <p className="text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 p-3 rounded-xl">
                {confirmationDetail.notes}
              </p>
            )}
            {confirmationDetail.rejectionReason && (
              <p className="text-xs text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/20 p-3 rounded-xl">
                {confirmationDetail.rejectionReason}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmationDetail(null)}
                className="px-4 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
              {(confirmationDetail.status ?? "Pending").toLowerCase() ===
                "pending" && (
                <>
                  <button
                    onClick={() => {
                      setConfirmationNote("");
                      setConfirmationModal({
                        mode: "reject",
                        item: confirmationDetail,
                      });
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700"
                  >
                    {lang(t.reject)}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmationNote("");
                      setConfirmationModal({
                        mode: "verify",
                        item: confirmationDetail,
                      });
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {lang(t.verify)}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deposit Verify / Reject Modal */}
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
              {formatCurrency(confirmationModal.item.amount)} —{" "}
              {confirmationModal.item.ownerName ||
                confirmationModal.item.phoneFrom ||
                ""}
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
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 text-sm resize-none mb-4"
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

      {/* Create / Edit Payment Number Modal */}
      {(showPaymentNumberModal || editingPaymentNumber) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowPaymentNumberModal(false);
              setEditingPaymentNumber(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale space-y-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {editingPaymentNumber
                ? isAr
                  ? "تعديل رقم الدفع"
                  : "Edit Payment Number"
                : lang(t.addPaymentNumber)}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                  {isAr ? "رقم الهاتف" : "Phone Number"} *
                </label>
                <input
                  type="tel"
                  value={paymentNumberForm.phoneNumber}
                  onChange={(e) =>
                    setPaymentNumberForm({
                      ...paymentNumberForm,
                      phoneNumber: e.target.value,
                    })
                  }
                  dir="ltr"
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                  {isAr ? "وسيلة الدفع" : "Payment Method"}
                </label>
                <input
                  type="text"
                  value={paymentNumberForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentNumberForm({
                      ...paymentNumberForm,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                  {isAr ? "التسمية" : "Label"}
                </label>
                <input
                  type="text"
                  value={paymentNumberForm.label}
                  onChange={(e) =>
                    setPaymentNumberForm({
                      ...paymentNumberForm,
                      label: e.target.value,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                />
              </div>
              {!editingPaymentNumber ? (
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                    {isAr ? "الرصيد الابتدائي" : "Initial Balance"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentNumberForm.initialBalance}
                    onChange={(e) =>
                      setPaymentNumberForm({
                        ...paymentNumberForm,
                        initialBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                  />
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={paymentNumberForm.isActive}
                    onChange={(e) =>
                      setPaymentNumberForm({
                        ...paymentNumberForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600"
                  />
                  <span className="text-sm">{lang(t.active)}</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPaymentNumberModal(false);
                  setEditingPaymentNumber(null);
                }}
                className="px-4 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleSavePaymentNumber}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? lang(t.processing) : lang(t.save)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Bonus Tier Modal */}
      {(showBonusTierModal || editingBonusTier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowBonusTierModal(false);
              setEditingBonusTier(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale space-y-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {editingBonusTier
                ? isAr
                  ? "تعديل شريحة المكافأة"
                  : "Edit Bonus Tier"
                : lang(t.addBonusTier)}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                    {isAr ? "الحد الأدنى" : "Min Amount"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bonusTierForm.minAmount}
                    onChange={(e) =>
                      setBonusTierForm({
                        ...bonusTierForm,
                        minAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                    {isAr ? "الحد الأقصى (اختياري)" : "Max Amount"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bonusTierForm.maxAmount}
                    onChange={(e) =>
                      setBonusTierForm({
                        ...bonusTierForm,
                        maxAmount: e.target.value,
                      })
                    }
                    placeholder="∞"
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                    {isAr ? "نوع المكافأة" : "Bonus Type"}
                  </label>
                  <select
                    value={bonusTierForm.bonusType}
                    onChange={(e) =>
                      setBonusTierForm({
                        ...bonusTierForm,
                        bonusType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                  >
                    <option value="Fixed">{isAr ? "ثابت" : "Fixed"}</option>
                    <option value="Percentage">
                      {isAr ? "نسبة مئوية" : "Percentage"}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">
                    {isAr ? "قيمة المكافأة" : "Bonus Value"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bonusTierForm.bonusValue}
                    onChange={(e) =>
                      setBonusTierForm({
                        ...bonusTierForm,
                        bonusValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm"
                  />
                </div>
              </div>
              {editingBonusTier && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={bonusTierForm.isActive}
                    onChange={(e) =>
                      setBonusTierForm({
                        ...bonusTierForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600"
                  />
                  <span className="text-sm">{lang(t.active)}</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowBonusTierModal(false);
                  setEditingBonusTier(null);
                }}
                className="px-4 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleSaveBonusTier}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? lang(t.processing) : lang(t.save)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation (Payment Number or Bonus Tier) */}
      {(deletingPaymentNumber || deletingBonusTier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setDeletingPaymentNumber(null);
              setDeletingBonusTier(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {isAr ? "تأكيد الحذف" : "Confirm Delete"}
            </h3>
            <p className="text-sm text-surface-500 mt-2 mb-4">
              {deletingPaymentNumber
                ? `${deletingPaymentNumber.phoneNumber || ""} — ${
                    isAr
                      ? "هل أنت متأكد من حذف رقم الدفع؟"
                      : "Are you sure you want to delete this payment number?"
                  }`
                : isAr
                  ? "هل أنت متأكد من حذف شريحة المكافأة؟"
                  : "Are you sure you want to delete this bonus tier?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeletingPaymentNumber(null);
                  setDeletingBonusTier(null);
                }}
                className="px-4 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={
                  deletingPaymentNumber
                    ? handleDeletePaymentNumber
                    : handleDeleteBonusTier
                }
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 disabled:opacity-50"
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

export default WalletsPage;