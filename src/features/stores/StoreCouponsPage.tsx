import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminStores } from "@shared/hooks/useAdminStores";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type {
  StoreCouponApprovalDto,
  StoreCouponQueryParams,
} from "@shared/types";

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

const CouponIcon = () => (
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
      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
    />
  </svg>
);

const StoreIcon = () => (
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
      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
    />
  </svg>
);

const CalendarIcon = () => (
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
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
    />
  </svg>
);

// ============================================
// Helpers
// ============================================

type ApprovalFilter = "All" | "Pending" | "Approved" | "Rejected";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// StoreCouponsPage Component
// ============================================

export const StoreCouponsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();
  const toast = useToast();

  const {
    storeCoupons,
    couponPagination,
    fetchStoreCoupons,
    fetchPendingStoreCoupons,
    fetchStoreCouponById,
    approveStoreCoupon,
    rejectStoreCoupon,
    setStoreCouponActive,
  } = useAdminStores();

  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("All");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const pageSize = 12;

  // Modals
  const [selectedCoupon, setSelectedCoupon] =
    useState<StoreCouponApprovalDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectModal, setRejectModal] =
    useState<StoreCouponApprovalDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const hasExtraFilters = Boolean(searchTerm.trim() || activeFilter);
      if (approvalFilter === "Pending" && !hasExtraFilters) {
        await fetchPendingStoreCoupons(pageIndex, pageSize);
      } else {
        const params: StoreCouponQueryParams = {
          ApprovalStatus:
            approvalFilter === "All" ? undefined : approvalFilter,
          IsActive:
            activeFilter === "active"
              ? true
              : activeFilter === "inactive"
                ? false
                : undefined,
          Search: searchTerm.trim() || undefined,
          PageIndex: pageIndex,
          PageSize: pageSize,
        };
        await fetchStoreCoupons(params);
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحميل كوبونات المتاجر",
            en: "Failed to load store coupons",
          }),
        ),
      );
    } finally {
      setCouponsLoading(false);
    }
  }, [
    approvalFilter,
    activeFilter,
    searchTerm,
    pageIndex,
    fetchPendingStoreCoupons,
    fetchStoreCoupons,
    toast,
    lang,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoupons();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadCoupons]);

  const handleOpenDetails = async (coupon: StoreCouponApprovalDto) => {
    setSelectedCoupon(coupon);
    setDetailLoading(true);
    try {
      const fresh = await fetchStoreCouponById(coupon.id);
      setSelectedCoupon(fresh);
    } catch {
      // Keep list item fallback if detail fetch fails
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (coupon: StoreCouponApprovalDto) => {
    setProcessingId(`approve-${coupon.id}`);
    try {
      const updated = await approveStoreCoupon(coupon.id);
      if (selectedCoupon?.id === coupon.id) {
        setSelectedCoupon(updated);
      }
      toast.success(
        lang({
          ar: "تمت الموافقة على الكوبون بنجاح",
          en: "Coupon approved successfully",
        }),
      );
      if (approvalFilter === "Pending") {
        await loadCoupons();
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل الموافقة على الكوبون",
            en: "Failed to approve coupon",
          }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessingId(`reject-${rejectModal.id}`);
    try {
      const updated = await rejectStoreCoupon(rejectModal.id, {
        reason: rejectReason.trim() || null,
      });
      if (selectedCoupon?.id === rejectModal.id) {
        setSelectedCoupon(updated);
      }
      toast.success(
        lang({ ar: "تم رفض الكوبون", en: "Coupon rejected" }),
      );
      setRejectModal(null);
      setRejectReason("");
      if (approvalFilter === "Pending") {
        await loadCoupons();
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل رفض الكوبون", en: "Failed to reject coupon" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (coupon: StoreCouponApprovalDto) => {
    setProcessingId(`toggle-${coupon.id}`);
    try {
      const updated = await setStoreCouponActive(coupon.id, !coupon.isActive);
      if (selectedCoupon?.id === coupon.id) {
        setSelectedCoupon(updated);
      }
      toast.success(
        lang({ ar: "تم تحديث حالة الكوبون", en: "Coupon status updated" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحديث حالة الكوبون",
            en: "Failed to update coupon status",
          }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
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

  const formatDiscountValue = (coupon: StoreCouponApprovalDto) => {
    const type = (coupon.type ?? "").toLowerCase();
    if (type.includes("percent")) return `${coupon.value}%`;
    return `${coupon.value} ${lang(t.egp)}`;
  };

  const getApprovalBadge = (status?: string | null) => {
    const s = status || "Pending";
    const styles: Record<string, string> = {
      Pending:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      Approved:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      Rejected:
        "bg-error-100 text-error-700 dark:bg-error-950/40 dark:text-error-300",
    };
    const labels: Record<string, { ar: string; en: string }> = {
      Pending: { ar: "قيد المراجعة", en: "Pending" },
      Approved: { ar: "مقبول", en: "Approved" },
      Rejected: { ar: "مرفوض", en: "Rejected" },
    };
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          styles[s] ||
            "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300",
        )}
      >
        {labels[s] ? lang(labels[s]) : s}
      </span>
    );
  };

  const totalPages = couponPagination?.totalPages || 1;
  const totalCount = couponPagination?.totalCount ?? storeCoupons.length;

  const t = {
    back: { ar: "العودة للمتاجر", en: "Back to Stores" },
    title: { ar: "كوبونات المتاجر", en: "Store Coupons" },
    subtitle: {
      ar: "مراجعة والموافقة على كوبونات الخصم الخاصة بالمتاجر",
      en: "Review, approve, and manage store discount coupons",
    },
    searchPlaceholder: {
      ar: "بحث بكود الكوبون أو اسم المتجر...",
      en: "Search by coupon code or store name...",
    },
    all: { ar: "الكل", en: "All" },
    pending: { ar: "قيد المراجعة", en: "Pending" },
    approved: { ar: "مقبول", en: "Approved" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    allStatuses: { ar: "كل الحالات", en: "All States" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    approve: { ar: "موافقة", en: "Approve" },
    reject: { ar: "رفض", en: "Reject" },
    activate: { ar: "تفعيل", en: "Activate" },
    deactivate: { ar: "تعطيل", en: "Deactivate" },
    details: { ar: "التفاصيل", en: "Details" },
    usage: { ar: "الاستخدام", en: "Usage" },
    minOrder: { ar: "الحد الأدنى", en: "Min Order" },
    maxDiscount: { ar: "أقصى خصم", en: "Max Discount" },
    maxPerCustomer: { ar: "لكل عميل", en: "Per Customer" },
    validity: { ar: "الصلاحية", en: "Validity" },
    timeWindow: { ar: "الفترة الزمنية", en: "Time Window" },
    owner: { ar: "المالك", en: "Owner" },
    rejectionReason: { ar: "سبب الرفض", en: "Rejection Reason" },
    rejectTitle: { ar: "رفض الكوبون", en: "Reject Coupon" },
    rejectPlaceholder: {
      ar: "أدخل سبب الرفض (اختياري)...",
      en: "Enter rejection reason (optional)...",
    },
    confirmReject: { ar: "تأكيد الرفض", en: "Confirm Reject" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    close: { ar: "إغلاق", en: "Close" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    noCoupons: { ar: "لا توجد كوبونات", en: "No coupons found" },
    noCouponsDesc: {
      ar: "لم يتم العثور على كوبونات تطابق معايير البحث",
      en: "No store coupons match your search criteria",
    },
    total: { ar: "المجموع", en: "Total" },
    coupons: { ar: "كوبون", en: "coupons" },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    prev: { ar: "السابق", en: "Previous" },
    next: { ar: "التالي", en: "Next" },
    egp: { ar: "ج.م", en: "EGP" },
  };

  const filterTabs: {
    value: ApprovalFilter;
    label: { ar: string; en: string };
  }[] = [
    { value: "All", label: t.all },
    { value: "Pending", label: t.pending },
    { value: "Approved", label: t.approved },
    { value: "Rejected", label: t.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/stores")}
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
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
            <CouponIcon />
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

        {/* Approval Filter Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 self-start">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setApprovalFilter(tab.value);
                setPageIndex(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                approvalFilter === tab.value
                  ? "bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100",
              )}
            >
              {lang(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Active Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageIndex(1);
            }}
            placeholder={lang(t.searchPlaceholder)}
            className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="">{lang(t.allStatuses)}</option>
          <option value="active">{lang(t.active)}</option>
          <option value="inactive">{lang(t.inactive)}</option>
        </select>
      </div>

      {/* Coupons Grid */}
      {couponsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : storeCoupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <CouponIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noCoupons)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noCouponsDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {storeCoupons.map((coupon) => {
              const storeName =
                (isAr
                  ? coupon.storeNameAr || coupon.storeNameEn
                  : coupon.storeNameEn || coupon.storeNameAr) || "—";
              const isPending =
                (coupon.approvalStatus ?? "Pending") === "Pending";

              return (
                <div
                  key={coupon.id}
                  onClick={() => handleOpenDetails(coupon)}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    {/* Code & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block font-mono font-bold text-base px-3 py-1 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900/50">
                          {coupon.code || "—"}
                        </span>
                        <p className="text-lg font-bold text-surface-900 dark:text-surface-100 mt-2">
                          {formatDiscountValue(coupon)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {getApprovalBadge(coupon.approvalStatus)}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                            coupon.isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                          )}
                        >
                          {coupon.isActive ? lang(t.active) : lang(t.inactive)}
                        </span>
                      </div>
                    </div>

                    {/* Store & Owner */}
                    <div className="space-y-1 text-xs text-surface-500 dark:text-surface-400">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/stores/${coupon.storeId}`);
                        }}
                        className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        <StoreIcon />
                        <span className="truncate">{storeName}</span>
                      </button>
                      {coupon.storeOwnerName && (
                        <p className="truncate">
                          {lang(t.owner)}: {coupon.storeOwnerName}
                          {coupon.storeOwnerPhone
                            ? ` (${coupon.storeOwnerPhone})`
                            : ""}
                        </p>
                      )}
                    </div>

                    {/* Limits & Validity */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <span className="text-surface-400 block">
                          {lang(t.usage)}
                        </span>
                        <span className="font-semibold text-surface-800 dark:text-surface-200">
                          {coupon.currentUsageCount} / {coupon.maxUsageCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <span className="text-surface-400 block">
                          {lang(t.minOrder)}
                        </span>
                        <span className="font-semibold text-surface-800 dark:text-surface-200">
                          {coupon.minimumOrderAmount != null
                            ? `${coupon.minimumOrderAmount} ${lang(t.egp)}`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
                      <CalendarIcon />
                      {formatDate(coupon.validFrom)} —{" "}
                      {formatDate(coupon.validTo)}
                    </p>

                    {coupon.rejectionReason && (
                      <p className="text-xs text-error-600 dark:text-error-400 line-clamp-2 bg-error-50 dark:bg-error-950/20 p-2 rounded-lg">
                        {coupon.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div
                    className="px-5 py-3 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      disabled={processingId === `toggle-${coupon.id}`}
                      className="text-xs font-medium text-surface-600 dark:text-surface-300 hover:underline disabled:opacity-50"
                    >
                      {coupon.isActive
                        ? lang(t.deactivate)
                        : lang(t.activate)}
                    </button>
                    <div className="flex items-center gap-3">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(coupon)}
                            disabled={processingId === `approve-${coupon.id}`}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                          >
                            {lang(t.approve)}
                          </button>
                          <button
                            onClick={() => {
                              setRejectReason("");
                              setRejectModal(coupon);
                            }}
                            disabled={!!processingId}
                            className="text-xs font-semibold text-error-600 dark:text-error-400 hover:underline disabled:opacity-50"
                          >
                            {lang(t.reject)}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOpenDetails(coupon)}
                        className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {lang(t.details)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.total)}: {totalCount} {lang(t.coupons)}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={!couponPagination?.hasPrevious && pageIndex <= 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {lang(t.prev)}
                </button>
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {lang(t.page)} {pageIndex} {lang(t.of)} {totalPages}
                </span>
                <button
                  onClick={() => setPageIndex((p) => p + 1)}
                  disabled={
                    !couponPagination?.hasNext && pageIndex >= totalPages
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {lang(t.next)}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Coupon Details Modal */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedCoupon(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="font-mono font-bold text-lg text-primary-600 dark:text-primary-400">
                  {selectedCoupon.code || "—"}
                </span>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                  {(isAr
                    ? selectedCoupon.storeNameAr || selectedCoupon.storeNameEn
                    : selectedCoupon.storeNameEn ||
                      selectedCoupon.storeNameAr) || "—"}
                </p>
              </div>
              {getApprovalBadge(selectedCoupon.approvalStatus)}
            </div>

            {detailLoading ? (
              <div className="py-8 flex justify-center">
                <PageLoader variant="inline" />
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <span className="text-xs text-surface-400 block">
                      {selectedCoupon.type || "Discount"}
                    </span>
                    <span className="font-bold text-surface-900 dark:text-surface-100">
                      {formatDiscountValue(selectedCoupon)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <span className="text-xs text-surface-400 block">
                      {lang(t.usage)}
                    </span>
                    <span className="font-bold text-surface-900 dark:text-surface-100">
                      {selectedCoupon.currentUsageCount} /{" "}
                      {selectedCoupon.maxUsageCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <span className="text-xs text-surface-400 block">
                      {lang(t.minOrder)}
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {selectedCoupon.minimumOrderAmount != null
                        ? `${selectedCoupon.minimumOrderAmount} ${lang(t.egp)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <span className="text-xs text-surface-400 block">
                      {lang(t.maxDiscount)}
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {selectedCoupon.maximumDiscount != null
                        ? `${selectedCoupon.maximumDiscount} ${lang(t.egp)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <span className="text-xs text-surface-400 block">
                      {lang(t.maxPerCustomer)}
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {selectedCoupon.maxPerCustomer ?? "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <span className="text-xs text-surface-400 block">
                      {lang(t.timeWindow)}
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {selectedCoupon.startTime && selectedCoupon.endTime
                        ? `${selectedCoupon.startTime} — ${selectedCoupon.endTime}`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <span className="text-xs text-surface-400 block mb-0.5">
                    {lang(t.validity)}
                  </span>
                  <span className="text-surface-800 dark:text-surface-200">
                    {formatDate(selectedCoupon.validFrom)} —{" "}
                    {formatDate(selectedCoupon.validTo)}
                  </span>
                </div>

                {selectedCoupon.rejectionReason && (
                  <div className="p-3 rounded-xl bg-error-50 dark:bg-error-950/20 border border-error-200 dark:border-error-900/50">
                    <span className="text-xs text-error-600 dark:text-error-400 block mb-0.5">
                      {lang(t.rejectionReason)}
                    </span>
                    <span className="text-error-700 dark:text-error-300">
                      {selectedCoupon.rejectionReason}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-6 flex-wrap">
              <button
                onClick={() => setSelectedCoupon(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.close)}
              </button>
              <button
                onClick={() => handleToggleActive(selectedCoupon)}
                disabled={processingId === `toggle-${selectedCoupon.id}`}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
              >
                {selectedCoupon.isActive
                  ? lang(t.deactivate)
                  : lang(t.activate)}
              </button>
              {(selectedCoupon.approvalStatus ?? "Pending") === "Pending" && (
                <>
                  <button
                    onClick={() => {
                      setRejectReason("");
                      setRejectModal(selectedCoupon);
                    }}
                    disabled={!!processingId}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 transition-colors disabled:opacity-50"
                  >
                    {lang(t.reject)}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedCoupon)}
                    disabled={processingId === `approve-${selectedCoupon.id}`}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {lang(t.approve)}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setRejectModal(null);
              setRejectReason("");
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.rejectTitle)}
            </h3>
            <p className="text-sm font-mono text-surface-500 dark:text-surface-400 mt-1 mb-4">
              {rejectModal.code || "—"}
            </p>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.rejectionReason)}
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={lang(t.rejectPlaceholder)}
              rows={3}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
            />
            <div className="flex items-center gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === `reject-${rejectModal.id}`}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {processingId === `reject-${rejectModal.id}`
                  ? lang(t.processing)
                  : lang(t.confirmReject)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCouponsPage;