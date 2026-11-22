import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminStores } from "@shared/hooks/useAdminStores";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { StoreDto } from "@shared/types";

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

const StoreIcon = () => (
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
);

const PhoneIcon = () => (
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
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  </svg>
);

const LocationIcon = () => (
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
      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);

const MoreIcon = () => (
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
      d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
);

const StarIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-amber-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      fillRule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
      clipRule="evenodd"
    />
  </svg>
);

const RocketIcon = () => (
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
      d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
    />
  </svg>
);

// ============================================
// Helpers
// ============================================

function isStoreVerified(store: StoreDto): boolean {
  return (
    Boolean(store.verifiedAt) ||
    store.verificationStatus === "Verified" ||
    store.verificationStatus === "Approved"
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// StoresPage Component
// ============================================

export const StoresPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();
  const toast = useToast();

  const {
    stores,
    pagination,
    loading,
    fetchStores,
    verifyStore,
    rejectStore,
    suspendStore,
    setStoreActive,
  } = useAdminStores();

  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 12;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "verify" | "reject" | "suspend" | "activate";
    store: StoreDto;
    title: string;
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionReason, setActionReason] = useState("");

  const loadStores = useCallback(async () => {
    try {
      await fetchStores({
        Search: search.trim() || undefined,
        IsVerified:
          verifiedFilter === "verified"
            ? true
            : verifiedFilter === "unverified"
              ? false
              : undefined,
        IsActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
        PageIndex: pageIndex,
        PageSize: pageSize,
      });
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل المتاجر", en: "Failed to load stores" }),
        ),
      );
    }
  }, [fetchStores, search, verifiedFilter, statusFilter, pageIndex, toast, lang]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStores();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadStores]);

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      switch (confirmAction.type) {
        case "verify":
          await verifyStore(confirmAction.store.id, { notes: null });
          break;
        case "reject":
          await rejectStore(confirmAction.store.id, {
            reason: actionReason.trim() || null,
          });
          break;
        case "suspend":
          await suspendStore(confirmAction.store.id, {
            reason: actionReason.trim() || null,
          });
          break;
        case "activate":
          await setStoreActive(confirmAction.store.id, { isActive: true });
          break;
      }
      toast.success(
        lang({ ar: "تم تنفيذ الإجراء بنجاح", en: "Action completed" }),
      );
      setConfirmAction(null);
      setActionReason("");
      await loadStores();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تنفيذ الإجراء", en: "Action failed" }),
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = pagination?.totalPages || 1;

  const t = {
    title: { ar: "إدارة المتاجر", en: "Store Management" },
    subtitle: {
      ar: "عرض وإدارة جميع المتاجر المسجلة",
      en: "View and manage all registered stores",
    },
    searchPlaceholder: {
      ar: "بحث باسم المتجر...",
      en: "Search by store name...",
    },
    allVerified: { ar: "كل المتاجر", en: "All Stores" },
    verified: { ar: "موثق", en: "Verified" },
    unverified: { ar: "غير موثق", en: "Unverified" },
    allStatuses: { ar: "كل الحالات", en: "All Statuses" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    viewDetails: { ar: "عرض التفاصيل", en: "View Details" },
    verify: { ar: "توثيق", en: "Verify" },
    reject: { ar: "رفض", en: "Reject" },
    suspend: { ar: "تعليق", en: "Suspend" },
    activate: { ar: "تنشيط", en: "Activate" },
    boost: { ar: "تعزيز", en: "Boost" },
    storeTypes: { ar: "أنواع المتاجر", en: "Store Types" },
    noStores: { ar: "لا توجد متاجر", en: "No stores found" },
    noStoresDesc: {
      ar: "لم يتم العثور على متاجر تطابق معايير البحث",
      en: "No stores match your search criteria",
    },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    total: { ar: "المجموع", en: "Total" },
    stores: { ar: "متجر", en: "stores" },
    confirmVerify: {
      ar: "هل أنت متأكد من توثيق هذا المتجر؟",
      en: "Are you sure you want to verify this store?",
    },
    confirmReject: {
      ar: "هل أنت متأكد من رفض هذا المتجر؟",
      en: "Are you sure you want to reject this store?",
    },
    confirmSuspend: {
      ar: "هل أنت متأكد من تعليق هذا المتجر؟",
      en: "Are you sure you want to suspend this store?",
    },
    confirmActivate: {
      ar: "هل أنت متأكد من تنشيط هذا المتجر؟",
      en: "Are you sure you want to activate this store?",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    reasonLabel: {
      ar: "السبب (اختياري)",
      en: "Reason (optional)",
    },
    reasonPlaceholder: {
      ar: "اكتب السبب هنا...",
      en: "Enter reason...",
    },
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard/stores/types")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-300 border border-info-200 dark:border-info-900/50 hover:bg-info-100 dark:hover:bg-info-950/50 transition-colors"
          >
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
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
              />
            </svg>
            {lang(t.storeTypes)}
          </button>
          <button
            onClick={() => navigate("/dashboard/stores/boost")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
          >
            <RocketIcon />
            {lang(t.boost)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(1);
            }}
            placeholder={lang(t.searchPlaceholder)}
            className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={verifiedFilter}
          onChange={(e) => {
            setVerifiedFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[150px]"
        >
          <option value="">{lang(t.allVerified)}</option>
          <option value="verified">{lang(t.verified)}</option>
          <option value="unverified">{lang(t.unverified)}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="">{lang(t.allStatuses)}</option>
          <option value="active">{lang(t.active)}</option>
          <option value="inactive">{lang(t.inactive)}</option>
        </select>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <StoreIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noStores)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noStoresDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stores.map((store) => {
              const storeName =
                (isAr
                  ? store.nameAr || store.nameEn
                  : store.nameEn || store.nameAr) || "—";
              const cityName = isAr
                ? store.cityAr || store.cityEn
                : store.cityEn || store.cityAr;
              const verified = isStoreVerified(store);

              return (
                <div
                  key={store.id}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/dashboard/stores/${store.id}`)}
                >
                  {/* Card Header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                          <span className="text-lg font-bold text-white">
                            {storeName.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                            {storeName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-surface-500 dark:text-surface-400">
                            <PhoneIcon />
                            <span className="truncate">
                              {store.phoneNumber || "—"}
                            </span>
                          </div>
                          {cityName && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                              <LocationIcon />
                              <span className="truncate">{cityName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === store.id ? null : store.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <MoreIcon />
                        </button>
                        {openMenuId === store.id && (
                          <div
                            className={cn(
                              "absolute z-20 top-full mt-1 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-fade-in-scale",
                              isAr
                                ? "left-0 origin-top-left"
                                : "right-0 origin-top-right",
                            )}
                          >
                            <button
                              onClick={() => {
                                navigate(`/dashboard/stores/${store.id}`);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
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
                                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                              </svg>
                              {lang(t.viewDetails)}
                            </button>
                            {!verified && (
                              <>
                                <button
                                  onClick={() => {
                                    setActionReason("");
                                    setConfirmAction({
                                      type: "verify",
                                      store,
                                      title: lang(t.verify),
                                      message: lang(t.confirmVerify),
                                    });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
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
                                      d="m4.5 12.75 6 6 9-13.5"
                                    />
                                  </svg>
                                  {lang(t.verify)}
                                </button>
                                <button
                                  onClick={() => {
                                    setActionReason("");
                                    setConfirmAction({
                                      type: "reject",
                                      store,
                                      title: lang(t.reject),
                                      message: lang(t.confirmReject),
                                    });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
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
                                      d="M6 18 18 6M6 6l12 12"
                                    />
                                  </svg>
                                  {lang(t.reject)}
                                </button>
                              </>
                            )}
                            {store.isActive ? (
                              <button
                                onClick={() => {
                                  setActionReason("");
                                  setConfirmAction({
                                    type: "suspend",
                                    store,
                                    title: lang(t.suspend),
                                    message: lang(t.confirmSuspend),
                                  });
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                              >
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
                                    d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                                  />
                                </svg>
                                {lang(t.suspend)}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActionReason("");
                                  setConfirmAction({
                                    type: "activate",
                                    store,
                                    title: lang(t.activate),
                                    message: lang(t.confirmActivate),
                                  });
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                              >
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
                                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                  />
                                </svg>
                                {lang(t.activate)}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="px-5 py-3 bg-surface-50 dark:bg-surface-800/50 border-y border-surface-100 dark:border-surface-800 flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        verified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          verified ? "bg-emerald-500" : "bg-amber-500",
                        )}
                      />
                      {verified ? lang(t.verified) : lang(t.unverified)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        store.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          store.isActive ? "bg-emerald-500" : "bg-surface-400",
                        )}
                      />
                      {store.isActive ? lang(t.active) : lang(t.inactive)}
                    </span>
                    {store.rating > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                        <StarIcon />
                        {store.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-5 pt-4">
                    <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                      <span className="flex items-center gap-1">
                        <LocationIcon />
                        {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.total)}: {pagination?.totalCount || stores.length}{" "}
              {lang(t.stores)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
              </button>
              <span className="text-sm text-surface-600 dark:text-surface-400 px-2">
                {lang(t.page)} {pageIndex} {lang(t.of)} {totalPages}
              </span>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                className="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        ? "m15.75 19.5-7.5-7.5 7.5-7.5"
                        : "m8.25 4.5 7.5 7.5-7.5 7.5"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setConfirmAction(null);
              setActionReason("");
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {confirmAction.title}
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
              {confirmAction.message}
            </p>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mt-1">
              {(isAr
                ? confirmAction.store.nameAr || confirmAction.store.nameEn
                : confirmAction.store.nameEn || confirmAction.store.nameAr) ||
                "—"}
            </p>

            {(confirmAction.type === "reject" ||
              confirmAction.type === "suspend") && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.reasonLabel)}
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={lang(t.reasonPlaceholder)}
                  rows={3}
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setActionReason("");
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50",
                  confirmAction.type === "verify" ||
                    confirmAction.type === "activate"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-error-600 hover:bg-error-700",
                )}
              >
                {actionLoading ? lang(t.processing) : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresPage;