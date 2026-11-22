import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminRequests } from "@shared/hooks/useAdminRequests";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { RequestDto } from "@shared/types";

// ============================================
// Icons
// ============================================

const RequestIcon = () => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);

const UserIcon = () => (
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
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
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

const TagIcon = () => (
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
      d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 6h.008v.008H6V6Z"
    />
  </svg>
);

const NoteIcon = () => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
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
// RequestDetailsPage Component
// ============================================

export const RequestDetailsPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const { fetchRequestById, approveRequest, rejectRequest } =
    useAdminRequests();

  const [request, setRequest] = useState<RequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(
    null,
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchRequestById(requestId);
      setRequest(data);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل الطلب", en: "Failed to load request" }),
        ),
      );
      navigate("/dashboard/requests");
    } finally {
      setLoading(false);
    }
  }, [requestId, fetchRequestById, navigate, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async () => {
    if (!requestId) return;
    setActionLoading("approve");
    try {
      const updated = await approveRequest(requestId);
      setRequest(updated);
      toast.success(
        lang({ ar: "تمت الموافقة على الطلب بنجاح", en: "Request approved" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل قبول الطلب", en: "Failed to approve request" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!requestId) return;
    setActionLoading("reject");
    try {
      const updated = await rejectRequest(requestId, {
        reason: rejectReason.trim() || null,
      });
      setRequest(updated);
      setShowRejectModal(false);
      setRejectReason("");
      toast.success(lang({ ar: "تم رفض الطلب", en: "Request rejected" }));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل رفض الطلب", en: "Failed to reject request" }),
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status?: string | null) => {
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
          "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
          styles[s] ||
            "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300",
        )}
      >
        {labels[s] ? lang(labels[s]) : s}
      </span>
    );
  };

  const t = {
    back: { ar: "العودة للطلبات", en: "Back to Requests" },
    details: { ar: "تفاصيل طلب الانضمام", en: "Onboarding Request Details" },
    name: { ar: "الاسم", en: "Name" },
    phone: { ar: "رقم الهاتف", en: "Phone Number" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    requestedRole: { ar: "الدور المطلوب", en: "Requested Role" },
    requestType: { ar: "نوع الطلب", en: "Request Type" },
    category: { ar: "التصنيف", en: "Category" },
    city: { ar: "المدينة", en: "City" },
    area: { ar: "المنطقة", en: "Area" },
    address: { ar: "العنوان", en: "Address" },
    coordinates: { ar: "الإحداثيات", en: "Coordinates" },
    brandName: { ar: "العلامة التجارية (عربي)", en: "Brand Name (AR)" },
    brandNameEn: { ar: "العلامة التجارية (إنجليزي)", en: "Brand Name (EN)" },
    descriptionAr: { ar: "الوصف (عربي)", en: "Description (AR)" },
    descriptionEn: { ar: "الوصف (إنجليزي)", en: "Description (EN)" },
    vehicleType: { ar: "نوع المركبة", en: "Vehicle Type" },
    vehiclePlate: { ar: "رقم اللوحة", en: "Vehicle Plate" },
    licenseNumber: { ar: "رقم الرخصة", en: "License Number" },
    licenseExpiresAt: { ar: "انتهاء الرخصة", en: "License Expiry" },
    attachments: { ar: "المرفقات", en: "Attachments" },
    note: { ar: "ملاحظات", en: "Notes" },
    rejectionReason: { ar: "سبب الرفض", en: "Rejection Reason" },
    createdAt: { ar: "تاريخ الطلب", en: "Request Date" },
    processedAt: { ar: "تاريخ المعالجة", en: "Processed Date" },
    approve: { ar: "قبول الطلب", en: "Approve" },
    approving: { ar: "جاري القبول...", en: "Approving..." },
    reject: { ar: "رفض الطلب", en: "Reject" },
    rejecting: { ar: "جاري الرفض...", en: "Rejecting..." },
    rejectTitle: { ar: "رفض الطلب", en: "Reject Request" },
    rejectReasonPlaceholder: {
      ar: "أدخل سبب الرفض (اختياري)...",
      en: "Enter rejection reason (optional)...",
    },
    confirm: { ar: "تأكيد الرفض", en: "Confirm Reject" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    noNote: { ar: "لا توجد ملاحظات", en: "No notes" },
    noBrand: { ar: "لا يوجد", en: "None" },
    noEmail: { ar: "غير متوفر", en: "Not provided" },
    noCity: { ar: "غير متوفرة", en: "Not provided" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "الطلب غير موجود", en: "Request not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/requests")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {lang(t.back)}
        </button>
      </div>
    );
  }

  const isPending = (request.status ?? "Pending") === "Pending";
  const categoryName = isAr
    ? request.storeCategoryNameAr || request.storeCategoryNameEn
    : request.storeCategoryNameEn || request.storeCategoryNameAr;
  const street = isAr
    ? request.streetAr || request.streetEn
    : request.streetEn || request.streetAr;
  const attachments = Array.from(
    new Set(
      [
        ...(request.attachmentUrl ? [request.attachmentUrl] : []),
        ...(request.attachmentUrls ?? []),
      ].filter(Boolean),
    ),
  );
  const hasVehicleInfo = Boolean(
    request.vehicleType ||
      request.vehiclePlate ||
      request.licenseNumber ||
      request.licenseExpiresAt,
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/requests")}
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-info-500 to-info-600 flex items-center justify-center shadow-lg shadow-info-500/20 flex-shrink-0">
            <RequestIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {lang(t.details)}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 font-mono">
              {request.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(request.status)}
          {isPending && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {actionLoading === "approve"
                  ? lang(t.approving)
                  : lang(t.approve)}
              </button>
              <button
                onClick={() => {
                  setRejectReason("");
                  setShowRejectModal(true);
                }}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 border border-error-200 dark:border-error-900/50 hover:bg-error-100 dark:hover:bg-error-950/50 transition-colors disabled:opacity-50"
              >
                {lang(t.reject)}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Reason Banner */}
      {request.rejectionReason && (
        <div className="rounded-2xl border border-error-200 dark:border-error-900/50 bg-error-50 dark:bg-error-950/20 p-5">
          <label className="block text-xs font-semibold text-error-600 dark:text-error-400 uppercase tracking-wider mb-1">
            {lang(t.rejectionReason)}
          </label>
          <p className="text-sm text-error-700 dark:text-error-300 whitespace-pre-wrap">
            {request.rejectionReason}
          </p>
        </div>
      )}

      {/* Personal Info */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <UserIcon />
            {lang({ ar: "المعلومات الشخصية", en: "Personal Information" })}
          </h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.name)}
              </label>
              <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                <UserIcon />
                {request.name || "—"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.phone)}
              </label>
              <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                <PhoneIcon />
                {request.phoneNumber || "—"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.email)}
              </label>
              {request.email ? (
                <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                  <MailIcon />
                  {request.email}
                </p>
              ) : (
                <p className="text-surface-400 dark:text-surface-500 text-sm italic">
                  {lang(t.noEmail)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.createdAt)}
              </label>
              <p className="text-surface-700 dark:text-surface-300 text-sm flex items-center gap-1.5">
                <ClockIcon />
                {formatDate(request.createdAt)}
              </p>
            </div>
            {request.processedAt && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.processedAt)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm flex items-center gap-1.5">
                  <ClockIcon />
                  {formatDate(request.processedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role & Request Type */}
      {(request.requestedRole || request.requestType || categoryName) && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <TagIcon />
              {lang({ ar: "تفاصيل الطلب والتصنيف", en: "Role & Category" })}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {request.requestedRole && (
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.requestedRole)}
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-300 border border-info-200 dark:border-info-900/50">
                    {request.requestedRole}
                  </span>
                </div>
              )}
              {request.requestType && (
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.requestType)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 font-medium text-sm">
                    {request.requestType}
                  </p>
                </div>
              )}
              {categoryName && (
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.category)}
                  </label>
                  <p className="text-surface-900 dark:text-surface-100 font-medium text-sm">
                    {categoryName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location & Brand Info */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <LocationIcon />
            {lang({ ar: "الموقع والعلامة التجارية", en: "Location & Brand" })}
          </h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.city)}
              </label>
              {request.city ? (
                <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                  <LocationIcon />
                  {request.city}
                </p>
              ) : (
                <p className="text-surface-400 dark:text-surface-500 text-sm italic">
                  {lang(t.noCity)}
                </p>
              )}
            </div>
            {request.area && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.area)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {request.area}
                </p>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.brandName)}
              </label>
              {request.brandName ? (
                <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                  <TagIcon />
                  {request.brandName}
                </p>
              ) : (
                <p className="text-surface-400 dark:text-surface-500 text-sm italic">
                  {lang(t.noBrand)}
                </p>
              )}
            </div>
            {request.brandNameEn && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.brandNameEn)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {request.brandNameEn}
                </p>
              </div>
            )}
            {(request.address || street) && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.address)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm">
                  {[request.address, street].filter(Boolean).join(" — ")}
                </p>
              </div>
            )}
            {request.latitude != null && request.longitude != null && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.coordinates)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm font-mono">
                  {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
                </p>
              </div>
            )}
            {request.descriptionAr && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.descriptionAr)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm whitespace-pre-wrap">
                  {request.descriptionAr}
                </p>
              </div>
            )}
            {request.descriptionEn && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.descriptionEn)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm whitespace-pre-wrap">
                  {request.descriptionEn}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      {hasVehicleInfo && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {lang({ ar: "معلومات المركبة والرخصة", en: "Vehicle & License" })}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {request.vehicleType && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.vehicleType)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 text-sm font-medium">
                  {request.vehicleType}
                </p>
              </div>
            )}
            {request.vehiclePlate && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.vehiclePlate)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 text-sm font-mono">
                  {request.vehiclePlate}
                </p>
              </div>
            )}
            {request.licenseNumber && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.licenseNumber)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 text-sm font-mono">
                  {request.licenseNumber}
                </p>
              </div>
            )}
            {request.licenseExpiresAt && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.licenseExpiresAt)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm">
                  {formatDate(request.licenseExpiresAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.attachments)}
            </h3>
          </div>
          <div className="p-6 flex flex-wrap gap-2">
            {attachments.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-surface-50 dark:bg-surface-800 text-primary-600 dark:text-primary-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <span>
                  {lang(t.attachments)} #{index + 1}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <NoteIcon />
            {lang(t.note)}
          </h3>
        </div>
        <div className="p-6">
          {request.note ? (
            <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed whitespace-pre-wrap">
              {request.note}
            </p>
          ) : (
            <p className="text-surface-400 dark:text-surface-500 text-sm italic">
              {lang(t.noNote)}
            </p>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-100 dark:bg-error-950/30 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-error-600 dark:text-error-400"
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
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {lang(t.rejectTitle)}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {request.name || "—"} — {request.phoneNumber || "—"}
                </p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={lang(t.rejectReasonPlaceholder)}
              rows={3}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === "reject"}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading === "reject"
                  ? lang(t.rejecting)
                  : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailsPage;