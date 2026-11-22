import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminStores } from "@shared/hooks/useAdminStores";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { StoreDto, StoreTypeProfileDto } from "@shared/types";

// ============================================
// Icons
// ============================================

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
    className="w-4 h-4"
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

const MailIcon = () => (
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
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const LocationIcon = () => (
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
      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
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

const StarIcon = () => (
  <svg
    className="w-4 h-4 text-amber-400"
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
    className="w-5 h-5"
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

function isTypeApproved(type: StoreTypeProfileDto): boolean {
  return type.status === "Approved" || type.status === "Verified";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// StoreDetailsPage Component
// ============================================

export const StoreDetailsPage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    fetchStoreById,
    verifyStore,
    rejectStore,
    suspendStore,
    setStoreActive,
    setStoreBoost,
    approveStoreTypeMapping,
    rejectStoreTypeMapping,
  } = useAdminStores();

  const [store, setStore] = useState<StoreDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "types">("info");

  const [confirmAction, setConfirmAction] = useState<{
    type:
      | "verify"
      | "reject"
      | "suspend"
      | "activate"
      | "toggleBoost"
      | "approveAllTypes";
    title: string;
    message: string;
  } | null>(null);
  const [actionNote, setActionNote] = useState("");

  const fetchStore = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchStoreById(storeId);
      setStore(data);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل بيانات المتجر", en: "Failed to load store" }),
        ),
      );
      navigate("/dashboard/stores");
    } finally {
      setLoading(false);
    }
  }, [storeId, fetchStoreById, navigate, toast, lang]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const handleAction = async () => {
    if (!confirmAction || !storeId || !store) return;
    setActionLoading(confirmAction.type);
    try {
      let updated: StoreDto = store;
      switch (confirmAction.type) {
        case "verify":
          updated = await verifyStore(storeId, {
            notes: actionNote.trim() || null,
          });
          break;
        case "reject":
          updated = await rejectStore(storeId, {
            reason: actionNote.trim() || null,
          });
          break;
        case "suspend":
          updated = await suspendStore(storeId, {
            reason: actionNote.trim() || null,
          });
          break;
        case "activate":
          updated = await setStoreActive(storeId, { isActive: true });
          break;
        case "toggleBoost":
          updated = await setStoreBoost(storeId, {
            boosted: !store.isBoosted,
          });
          break;
        case "approveAllTypes": {
          const pending = (store.storeTypes ?? []).filter(
            (item) => !isTypeApproved(item),
          );
          const results = await Promise.all(
            pending.map((item) =>
              approveStoreTypeMapping(item.storeTypeMappingId),
            ),
          );
          if (results.length > 0) {
            updated = results[results.length - 1];
          }
          break;
        }
      }
      setStore(updated);
      toast.success(
        lang({ ar: "تم تنفيذ الإجراء بنجاح", en: "Action completed" }),
      );
      setConfirmAction(null);
      setActionNote("");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تنفيذ الإجراء", en: "Action failed" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveType = async (mappingId: string) => {
    setActionLoading(`approve-type-${mappingId}`);
    try {
      const updated = await approveStoreTypeMapping(mappingId);
      setStore(updated);
      toast.success(lang({ ar: "تم توثيق النوع", en: "Type approved" }));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل توثيق النوع", en: "Failed to approve type" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectType = async (mappingId: string) => {
    setActionLoading(`reject-type-${mappingId}`);
    try {
      const updated = await rejectStoreTypeMapping(mappingId, { reason: null });
      setStore(updated);
      toast.success(lang({ ar: "تم رفض النوع", en: "Type rejected" }));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل رفض النوع", en: "Failed to reject type" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (time?: string | null) => {
    if (!time) return "—";
    return time;
  };

  const t = {
    back: { ar: "العودة للمتاجر", en: "Back to Stores" },
    info: { ar: "المعلومات", en: "Info" },
    storeTypes: { ar: "أنواع المتجر", en: "Store Types" },
    description: { ar: "الوصف", en: "Description" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    location: { ar: "الموقع", en: "Location" },
    address: { ar: "العنوان", en: "Address" },
    city: { ar: "المدينة", en: "City" },
    openingTime: { ar: "وقت الفتح", en: "Opening Time" },
    closingTime: { ar: "وقت الإغلاق", en: "Closing Time" },
    minimumOrder: { ar: "الحد الأدنى للطلب", en: "Minimum Order" },
    deliveryFee: { ar: "رسوم التوصيل", en: "Delivery Fee" },
    prepTime: { ar: "مدة التحضير", en: "Prep Time" },
    minutes: { ar: "دقيقة", en: "min" },
    totalOrders: { ar: "إجمالي الطلبات", en: "Total Orders" },
    views: { ar: "المشاهدات", en: "Views" },
    verificationNotes: { ar: "ملاحظات التوثيق", en: "Verification Notes" },
    status: { ar: "الحالة", en: "Status" },
    verified: { ar: "موثق", en: "Verified" },
    unverified: { ar: "غير موثق", en: "Unverified" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    open: { ar: "مفتوح", en: "Open" },
    closed: { ar: "مغلق", en: "Closed" },
    boosted: { ar: "معزز", en: "Boosted" },
    notBoosted: { ar: "عادي", en: "Standard" },
    enableBoost: { ar: "تفعيل التعزيز", en: "Boost Store" },
    disableBoost: { ar: "إلغاء التعزيز", en: "Remove Boost" },
    rating: { ar: "التقييم", en: "Rating" },
    reviews: { ar: "تقييمات", en: "reviews" },
    createdAt: { ar: "تاريخ التسجيل", en: "Registered" },
    verify: { ar: "توثيق المتجر", en: "Verify Store" },
    reject: { ar: "رفض المتجر", en: "Reject Store" },
    suspend: { ar: "تعليق المتجر", en: "Suspend Store" },
    activate: { ar: "تنشيط المتجر", en: "Activate Store" },
    approveAllTypes: { ar: "توثيق كل الأنواع", en: "Approve All Types" },
    approveType: { ar: "توثيق", en: "Approve" },
    rejectType: { ar: "رفض", en: "Reject" },
    approved: { ar: "موثق", en: "Approved" },
    pendingType: { ar: "معلق", en: "Pending" },
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
    confirmBoostEnable: {
      ar: "هل تريد تفعيل تعزيز هذا المتجر ليظهر في المقدمة؟",
      en: "Boost this store so it appears prominently?",
    },
    confirmBoostDisable: {
      ar: "هل تريد إلغاء تعزيز هذا المتجر؟",
      en: "Remove boost from this store?",
    },
    confirmApproveAll: {
      ar: "هل أنت متأكد من توثيق كل أنواع المتجر؟",
      en: "Are you sure you want to approve all store types?",
    },
    notesLabel: {
      ar: "ملاحظات / سبب (اختياري)",
      en: "Notes / Reason (optional)",
    },
    notesPlaceholder: {
      ar: "اكتب هنا...",
      en: "Enter notes or reason...",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    noTypes: { ar: "لا توجد أنواع مسجلة", en: "No types registered" },
    egp: { ar: "ج.م", en: "EGP" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "المتجر غير موجود", en: "Store not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/stores")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {lang(t.back)}
        </button>
      </div>
    );
  }

  const storeName =
    (isAr ? store.nameAr || store.nameEn : store.nameEn || store.nameAr) || "—";
  const storeDescription = isAr
    ? store.descriptionAr || store.descriptionEn
    : store.descriptionEn || store.descriptionAr;
  const cityName = isAr
    ? store.cityAr || store.cityEn
    : store.cityEn || store.cityAr;
  const streetName = isAr
    ? store.streetAr || store.streetEn
    : store.streetEn || store.streetAr;
  const verified = isStoreVerified(store);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
              isAr ? "m8.25 4.5 7.5 7.5-7.5 7.5" : "M15.75 19.5 8.25 12l7.5-7.5"
            }
          />
        </svg>
        {lang(t.back)}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <span className="text-xl font-bold text-white">
              {storeName.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {storeName}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {store.verificationStatus ||
                (verified ? lang(t.verified) : lang(t.unverified))}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setActionNote("");
            setConfirmAction({
              type: "toggleBoost",
              title: store.isBoosted
                ? lang(t.disableBoost)
                : lang(t.enableBoost),
              message: store.isBoosted
                ? lang(t.confirmBoostDisable)
                : lang(t.confirmBoostEnable),
            });
          }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors self-start sm:self-auto",
            store.isBoosted
              ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
              : "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-950/50",
          )}
        >
          <RocketIcon />
          {store.isBoosted ? lang(t.disableBoost) : lang(t.enableBoost)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800 w-fit">
        {[
          { key: "info" as const, labelKey: "info" as const },
          { key: "types" as const, labelKey: "storeTypes" as const },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm"
                : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
            )}
          >
            {lang(t[tab.labelKey])}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === "info" && (
        <>
          {/* Status Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
                {lang(t.status)}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  store.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
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
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
                {lang(t.verified)}
              </p>
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
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
                {lang({ ar: "المتجر", en: "Store" })}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  store.isOpen
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    store.isOpen ? "bg-emerald-500" : "bg-surface-400",
                  )}
                />
                {store.isOpen ? lang(t.open) : lang(t.closed)}
              </span>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 text-center">
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
                {lang(t.boosted)}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  store.isBoosted
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                    : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                )}
              >
                {store.isBoosted ? lang(t.boosted) : lang(t.notBoosted)}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.phoneNumber)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <PhoneIcon />
                    {store.phoneNumber || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.email)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <MailIcon />
                    {store.email || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.location)}
                  </label>
                  <p className="text-surface-700 dark:text-surface-300 text-sm font-mono">
                    {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.city)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <LocationIcon />
                    {cityName || "—"}
                  </p>
                </div>
                {streetName && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                      {lang(t.address)}
                    </label>
                    <p className="text-surface-700 dark:text-surface-300">
                      {streetName}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.openingTime)}
                  </label>
                  <p className="text-surface-700 dark:text-surface-300 flex items-center gap-2">
                    <ClockIcon />
                    {formatTime(store.openingTime)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.closingTime)}
                  </label>
                  <p className="text-surface-700 dark:text-surface-300 flex items-center gap-2">
                    <ClockIcon />
                    {formatTime(store.closingTime)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.minimumOrder)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <MoneyIcon />
                    {store.minimumOrderAmount > 0
                      ? `${store.minimumOrderAmount} ${lang(t.egp)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.deliveryFee)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <MoneyIcon />
                    {store.deliveryFee > 0
                      ? `${store.deliveryFee} ${lang(t.egp)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.prepTime)}
                  </label>
                  <p className="text-surface-700 dark:text-surface-300 text-sm">
                    {store.estimatedPreparationMinutes} {lang(t.minutes)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.createdAt)}
                  </label>
                  <p className="text-surface-700 dark:text-surface-300 text-sm">
                    {formatDate(store.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.totalOrders)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {store.totalOrders}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.views)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {store.viewCount}
                  </p>
                </div>
                {store.rating > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                      {lang(t.rating)}
                    </label>
                    <p className="flex items-center gap-1.5">
                      <StarIcon />
                      <span className="font-medium text-surface-900 dark:text-surface-100">
                        {store.rating.toFixed(1)}
                      </span>
                      <span className="text-surface-500">
                        ({store.ratingCount || 0} {lang(t.reviews)})
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {storeDescription && (
                <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.description)}
                  </label>
                  <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed">
                    {storeDescription}
                  </p>
                </div>
              )}

              {store.verificationNotes && (
                <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.verificationNotes)}
                  </label>
                  <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed">
                    {store.verificationNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">
                {lang({ ar: "إجراءات سريعة", en: "Quick Actions" })}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!verified && (
                  <>
                    <button
                      onClick={() => {
                        setActionNote("");
                        setConfirmAction({
                          type: "verify",
                          title: lang(t.verify),
                          message: lang(t.confirmVerify),
                        });
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
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
                        setActionNote("");
                        setConfirmAction({
                          type: "reject",
                          title: lang(t.reject),
                          message: lang(t.confirmReject),
                        });
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 border border-error-200 dark:border-error-900/50 text-sm font-medium hover:bg-error-100 dark:hover:bg-error-950/50 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
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
                      setActionNote("");
                      setConfirmAction({
                        type: "suspend",
                        title: lang(t.suspend),
                        message: lang(t.confirmSuspend),
                      });
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 border border-error-200 dark:border-error-900/50 text-sm font-medium hover:bg-error-100 dark:hover:bg-error-950/50 transition-colors"
                  >
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
                        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    {lang(t.suspend)}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActionNote("");
                      setConfirmAction({
                        type: "activate",
                        title: lang(t.activate),
                        message: lang(t.confirmActivate),
                      });
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                  >
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
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    {lang(t.activate)}
                  </button>
                )}
                <button
                  onClick={() => {
                    setActionNote("");
                    setConfirmAction({
                      type: "toggleBoost",
                      title: store.isBoosted
                        ? lang(t.disableBoost)
                        : lang(t.enableBoost),
                      message: store.isBoosted
                        ? lang(t.confirmBoostDisable)
                        : lang(t.confirmBoostEnable),
                    });
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
                >
                  <RocketIcon />
                  {store.isBoosted
                    ? lang(t.disableBoost)
                    : lang(t.enableBoost)}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Store Types Tab */}
      {activeTab === "types" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {lang(t.storeTypes)}
              </h3>
              {store.storeTypes &&
                store.storeTypes.some((item) => !isTypeApproved(item)) && (
                  <button
                    onClick={() =>
                      setConfirmAction({
                        type: "approveAllTypes",
                        title: lang(t.approveAllTypes),
                        message: lang(t.confirmApproveAll),
                      })
                    }
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {lang(t.approveAllTypes)}
                  </button>
                )}
            </div>
            {!store.storeTypes || store.storeTypes.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                  <StoreIcon />
                </div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {lang(t.noTypes)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {store.storeTypes.map((type) => {
                  const typeName =
                    (isAr
                      ? type.nameAr || type.nameEn
                      : type.nameEn || type.nameAr) || "—";
                  const approved = isTypeApproved(type);

                  return (
                    <div
                      key={type.storeTypeMappingId}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800"
                    >
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {typeName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            approved
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                          )}
                        >
                          {approved
                            ? lang(t.approved)
                            : type.status || lang(t.pendingType)}
                        </span>
                        {!approved && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleApproveType(type.storeTypeMappingId)
                              }
                              disabled={
                                actionLoading ===
                                `approve-type-${type.storeTypeMappingId}`
                              }
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
                              title={lang(t.approveType)}
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
                            </button>
                            <button
                              onClick={() =>
                                handleRejectType(type.storeTypeMappingId)
                              }
                              disabled={
                                actionLoading ===
                                `reject-type-${type.storeTypeMappingId}`
                              }
                              className="p-1.5 rounded-lg text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors disabled:opacity-50"
                              title={lang(t.rejectType)}
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
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setConfirmAction(null);
              setActionNote("");
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
              {storeName}
            </p>

            {(confirmAction.type === "verify" ||
              confirmAction.type === "reject" ||
              confirmAction.type === "suspend") && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.notesLabel)}
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={lang(t.notesPlaceholder)}
                  rows={3}
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setActionNote("");
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleAction}
                disabled={!!actionLoading}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50",
                  confirmAction.type === "verify" ||
                    confirmAction.type === "activate" ||
                    confirmAction.type === "approveAllTypes"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : confirmAction.type === "toggleBoost"
                      ? "bg-purple-600 hover:bg-purple-700"
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

export default StoreDetailsPage;