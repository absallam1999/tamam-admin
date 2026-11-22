import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminDrivers } from "@shared/hooks/useAdminDrivers";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { DriverDocumentDto } from "@shared/types";

// ============================================
// Icons
// ============================================

const DocumentIcon = () => (
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
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const CalendarIcon = () => (
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
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
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

const ExternalLinkIcon = () => (
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
      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
);

// ============================================
// Helpers
// ============================================

const getFullDocumentUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  let cleanPath = url.replace(/^\/uploads/, "");
  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return `${base}${cleanPath}`;
};

function isDocVerified(doc: DriverDocumentDto): boolean {
  const status = (doc.status ?? "").toLowerCase();
  return (
    Boolean(doc.verifiedAt) || status === "verified" || status === "approved"
  );
}

function isDocRejected(doc: DriverDocumentDto): boolean {
  if (isDocVerified(doc)) return false;
  const status = (doc.status ?? "").toLowerCase();
  return status === "rejected" || Boolean(doc.rejectionReason);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// DriverDocumentDetailsPage Component
// ============================================

export const DriverDocumentDetailsPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    viewDocument,
    verifyDocument,
    rejectDocument,
    isVerifying,
    isRejecting,
  } = useAdminDrivers();

  const [doc, setDoc] = useState<DriverDocumentDto | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    try {
      const data = await viewDocument(documentId);
      setDoc(data);
      setImageLoading(true);
      setImageError(false);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل المستند", en: "Failed to load document" }),
        ),
      );
      navigate("/dashboard/drivers/documents");
    } finally {
      setPageLoading(false);
    }
  }, [documentId, viewDocument, navigate, toast, lang]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleVerify = async () => {
    if (!documentId) return;
    try {
      const updated = await verifyDocument({
        documentId,
        dto: { approve: true, rejectionReason: null },
      });
      setDoc(updated);
      toast.success(
        lang({
          ar: "تم توثيق المستند بنجاح",
          en: "Document verified successfully",
        }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل التوثيق", en: "Verification failed" }),
        ),
      );
    }
  };

  const handleReject = async () => {
    if (!documentId) return;
    try {
      const updated = await rejectDocument({
        documentId,
        dto: { reason: rejectionReason.trim() || null },
      });
      setDoc(updated);
      toast.success(lang({ ar: "تم رفض المستند", en: "Document rejected" }));
      setRejectModal(false);
      setRejectionReason("");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل الرفض", en: "Rejection failed" }),
        ),
      );
    }
  };

  const fileUrl = getFullDocumentUrl(doc?.documentUrl);
  const isImage =
    Boolean(fileUrl) &&
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(fileUrl);

  const handleDownload = () => {
    if (!fileUrl) {
      toast.error(
        lang({ ar: "رابط المستند غير متوفر", en: "Document URL unavailable" }),
      );
      return;
    }
    const anchor = window.document.createElement("a");
    anchor.href = fileUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.download = doc?.type || "document";
    anchor.click();
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

  const t = {
    back: { ar: "العودة للمستندات", en: "Back to Documents" },
    backToDriver: { ar: "العودة للسائق", en: "Back to Driver" },
    documentView: { ar: "عرض المستند", en: "Document View" },
    documentType: { ar: "نوع المستند", en: "Document Type" },
    driverName: { ar: "السائق", en: "Driver" },
    status: { ar: "الحالة", en: "Status" },
    verified: { ar: "موثق", en: "Verified" },
    pending: { ar: "معلق", en: "Pending" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    expiryDate: { ar: "تاريخ الانتهاء", en: "Expiry Date" },
    uploadDate: { ar: "تاريخ الرفع", en: "Upload Date" },
    rejectionReason: { ar: "سبب الرفض", en: "Rejection Reason" },
    download: { ar: "تحميل المستند", en: "Download Document" },
    openNewTab: { ar: "فتح في نافذة جديدة", en: "Open in New Tab" },
    verify: { ar: "توثيق المستند", en: "Verify Document" },
    reject: { ar: "رفض المستند", en: "Reject Document" },
    verifying: { ar: "جاري التوثيق...", en: "Verifying..." },
    rejecting: { ar: "جاري الرفض...", en: "Rejecting..." },
    rejectTitle: {
      ar: "سبب الرفض (اختياري)",
      en: "Rejection Reason (optional)",
    },
    rejectPlaceholder: {
      ar: "اكتب سبب الرفض هنا...",
      en: "Enter rejection reason...",
    },
    cancel: { ar: "إلغاء", en: "Cancel" },
    confirmReject: { ar: "تأكيد الرفض", en: "Confirm Rejection" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    imageLoading: { ar: "جاري تحميل الصورة...", en: "Loading image..." },
    imageError: { ar: "تعذر تحميل الصورة", en: "Failed to load image" },
    noPreview: {
      ar: "لا توجد معاينة متاحة لهذا النوع من الملفات",
      en: "No preview available for this file type",
    },
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "المستند غير موجود", en: "Document not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/drivers/documents")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {lang(t.back)}
        </button>
      </div>
    );
  }

  const verified = isDocVerified(doc);
  const rejected = isDocRejected(doc);
  const pending = !verified && !rejected;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/drivers/documents")}
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
        {doc.driverId && (
          <button
            onClick={() => navigate(`/dashboard/drivers/${doc.driverId}`)}
            className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <DriverIcon />
            {lang(t.backToDriver)}
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.documentView)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {doc.type || "—"} — {doc.driverName || doc.driverId?.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {fileUrl && (
            <>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-300 border border-info-200 dark:border-info-900/50 hover:bg-info-100 dark:hover:bg-info-950/50 transition-colors"
              >
                <DownloadIcon />
                {lang(t.download)}
              </button>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                <ExternalLinkIcon />
                {lang(t.openNewTab)}
              </a>
            </>
          )}
        </div>
      </div>

      {/* Document Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <DocumentIcon />
              {lang({ ar: "معاينة المستند", en: "Document Preview" })}
            </h3>
          </div>
          <div className="p-2 flex items-center justify-center min-h-[400px] bg-surface-100 dark:bg-surface-950">
            {isImage ? (
              <>
                {imageLoading && !imageError && (
                  <div className="flex flex-col items-center gap-3">
                    <PageLoader
                      variant="inline"
                      message={lang(t.imageLoading)}
                    />
                  </div>
                )}
                {imageError ? (
                  <div className="flex flex-col items-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-surface-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {lang(t.imageError)}
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {lang(t.download)}
                    </button>
                  </div>
                ) : (
                  <img
                    src={fileUrl}
                    alt={doc.type || "Document"}
                    className="max-w-full max-h-[600px] object-contain rounded-lg"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                    style={{ display: imageLoading ? "none" : "block" }}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center mb-4">
                  <DocumentIcon />
                </div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {lang(t.noPreview)}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {fileUrl?.split(".").pop()?.toUpperCase() ||
                    (isAr ? "ملف" : "FILE")}
                </p>
                {fileUrl && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
                    >
                      {lang(t.download)}
                    </button>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                      {lang(t.openNewTab)}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.documentType)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                  <DocumentIcon />
                  {doc.type || "—"}
                </p>
              </div>

              {doc.driverName && (
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                    {lang(t.driverName)}
                  </label>
                  <button
                    onClick={() => navigate(`/dashboard/drivers/${doc.driverId}`)}
                    className="text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-2"
                  >
                    <DriverIcon />
                    {doc.driverName}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.status)}
                </label>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                    verified
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : rejected
                        ? "bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      verified
                        ? "bg-emerald-500"
                        : rejected
                          ? "bg-error-500"
                          : "bg-amber-500",
                    )}
                  />
                  {verified
                    ? lang(t.verified)
                    : rejected
                      ? lang(t.rejected)
                      : lang(t.pending)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.expiryDate)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm flex items-center gap-1.5">
                  <CalendarIcon />
                  {formatDate(doc.expiryDate)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.uploadDate)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm flex items-center gap-1.5">
                  <ClockIcon />
                  {formatDate(doc.createdAt)}
                </p>
              </div>

              {doc.rejectionReason && (
                <div className="p-3 rounded-xl bg-error-50 dark:bg-error-950/20 border border-error-200 dark:border-error-900/50">
                  <label className="block text-xs font-semibold text-error-600 dark:text-error-400 uppercase tracking-wider mb-1">
                    {lang(t.rejectionReason)}
                  </label>
                  <p className="text-sm text-error-700 dark:text-error-300">
                    {doc.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions (only for pending docs) */}
          {pending && (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
              <div className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  {lang({ ar: "إجراءات", en: "Actions" })}
                </h3>
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || isRejecting}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20",
                  )}
                >
                  {isVerifying ? lang(t.verifying) : lang(t.verify)}
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  disabled={isVerifying || isRejecting}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    "bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-950/50",
                    "border border-error-200 dark:border-error-900/50",
                  )}
                >
                  {isRejecting ? lang(t.rejecting) : lang(t.reject)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setRejectModal(false);
              setRejectionReason("");
            }}
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
                  {lang({
                    ar: `رفض مستند ${doc.type || ""}`,
                    en: `Reject ${doc.type || "Document"}`,
                  })}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {doc.driverName || doc.driverId?.slice(0, 8)}
                </p>
              </div>
            </div>

            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.rejectTitle)}
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={lang(t.rejectPlaceholder)}
              rows={3}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
            />

            <div className="flex items-center gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRejecting ? lang(t.rejecting) : lang(t.confirmReject)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDocumentDetailsPage;