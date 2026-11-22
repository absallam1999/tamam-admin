import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

// ============================================
// Helpers
// ============================================

type StatusFilter = "Pending" | "All" | "Verified" | "Rejected";

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
// DriverDocumentsPage Component
// ============================================

export const DriverDocumentsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();
  const toast = useToast();

  const {
    documents,
    documentsTotalCount,
    fetchDocuments,
    fetchPendingDocuments,
    verifyDocument,
    rejectDocument,
    isVerifying,
    isRejecting,
  } = useAdminDrivers();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);
  const pageSize = 20;

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<DriverDocumentDto | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const loadDocuments = useCallback(async () => {
    setTableLoading(true);
    try {
      const result =
        statusFilter === "Pending"
          ? await fetchPendingDocuments(pageIndex, pageSize)
          : await fetchDocuments({
              pageIndex,
              pageSize,
              status: statusFilter === "All" ? undefined : statusFilter,
            });
      setTotalPages(result.totalPages || 1);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل المستندات", en: "Failed to load documents" }),
        ),
      );
    } finally {
      setTableLoading(false);
    }
  }, [statusFilter, pageIndex, fetchPendingDocuments, fetchDocuments, toast, lang]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocs = documents.filter(
    (doc) =>
      !searchTerm ||
      doc.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.driverId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleVerify = async (doc: DriverDocumentDto) => {
    setProcessingId(doc.id);
    try {
      await verifyDocument({
        documentId: doc.id,
        dto: { approve: true, rejectionReason: null },
      });
      toast.success(
        lang({
          ar: "تم توثيق المستند بنجاح",
          en: "Document verified successfully",
        }),
      );
      if (statusFilter === "Pending") {
        await loadDocuments();
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل التوثيق", en: "Verification failed" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessingId(rejectModal.id);
    try {
      await rejectDocument({
        documentId: rejectModal.id,
        dto: { reason: rejectionReason.trim() || null },
      });
      toast.success(lang({ ar: "تم رفض المستند", en: "Document rejected" }));
      setRejectModal(null);
      setRejectionReason("");
      if (statusFilter === "Pending") {
        await loadDocuments();
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل الرفض", en: "Rejection failed" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = (doc: DriverDocumentDto) => {
    const url = getFullDocumentUrl(doc.documentUrl);
    if (!url) {
      toast.error(
        lang({ ar: "رابط المستند غير متوفر", en: "Document URL unavailable" }),
      );
      return;
    }
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.download = doc.type || "document";
    anchor.click();
  };

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

  const pendingCount = documents.filter(
    (d) => !isDocVerified(d) && !isDocRejected(d),
  ).length;

  const t = {
    title: { ar: "مستندات السائقين", en: "Driver Documents" },
    subtitle: {
      ar: "مراجعة وتوثيق مستندات السائقين",
      en: "Review and verify driver documents",
    },
    searchPlaceholder: {
      ar: "بحث باسم السائق أو نوع المستند...",
      en: "Search by driver name or document type...",
    },
    all: { ar: "الكل", en: "All" },
    pending: { ar: "معلق", en: "Pending" },
    verified: { ar: "موثق", en: "Verified" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    pendingCount: {
      ar: `${pendingCount} مستندات معلقة`,
      en: `${pendingCount} pending documents`,
    },
    view: { ar: "عرض", en: "View" },
    download: { ar: "تحميل", en: "Download" },
    verify: { ar: "توثيق", en: "Verify" },
    reject: { ar: "رفض", en: "Reject" },
    rejecting: { ar: "جاري الرفض...", en: "Rejecting..." },
    noDocuments: { ar: "لا توجد مستندات", en: "No documents found" },
    noDocumentsDesc: {
      ar: "لا توجد مستندات مطابقة للتصفية الحالية",
      en: "No documents match the current filter",
    },
    driverName: { ar: "السائق", en: "Driver" },
    documentType: { ar: "نوع المستند", en: "Document Type" },
    expiryDate: { ar: "تاريخ الانتهاء", en: "Expiry Date" },
    uploadDate: { ar: "تاريخ الرفع", en: "Upload Date" },
    status: { ar: "الحالة", en: "Status" },
    actions: { ar: "إجراءات", en: "Actions" },
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
    back: { ar: "العودة للسائقين", en: "Back to Drivers" },
    total: { ar: "المجموع", en: "Total" },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
  };

  const filterTabs: { value: StatusFilter; label: { ar: string; en: string } }[] =
    [
      { value: "Pending", label: t.pending },
      { value: "All", label: t.all },
      { value: "Verified", label: t.verified },
      { value: "Rejected", label: t.rejected },
    ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/drivers")}
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
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {lang(t.pendingCount)}
            </span>
          )}
          <div className="inline-flex rounded-xl p-1 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPageIndex(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  statusFilter === tab.value
                    ? "bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm"
                    : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100",
                )}
              >
                {lang(tab.label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
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

      {/* Documents List */}
      {tableLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" message={lang(t.loading)} />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <DocumentIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noDocuments)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noDocumentsDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.driverName)}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.documentType)}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden md:table-cell">
                    {lang(t.expiryDate)}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden lg:table-cell">
                    {lang(t.uploadDate)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.status)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 w-32">
                    {lang(t.actions)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {filteredDocs.map((doc) => {
                  const verified = isDocVerified(doc);
                  const rejected = isDocRejected(doc);
                  const pending = !verified && !rejected;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                    >
                      {/* Driver */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            navigate(`/dashboard/drivers/${doc.driverId}`)
                          }
                          className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                        >
                          <DriverIcon />
                          {doc.driverName || doc.driverId?.slice(0, 8) || "..."}
                        </button>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-surface-700 dark:text-surface-300 font-medium">
                          <DocumentIcon />
                          {doc.type || "—"}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {doc.expiryDate ? (
                          <span className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                            <CalendarIcon />
                            {formatDate(doc.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-surface-400 dark:text-surface-500">
                            —
                          </span>
                        )}
                      </td>

                      {/* Upload Date */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                          <ClockIcon />
                          {formatDate(doc.createdAt)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            verified
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : rejected
                                ? "bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
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
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/drivers/documents/${doc.id}`)
                            }
                            className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                            title={lang(t.view)}
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
                          </button>

                          {doc.documentUrl && (
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 rounded-lg text-surface-400 hover:text-info-600 dark:hover:text-info-400 hover:bg-info-50 dark:hover:bg-info-950/30 transition-colors"
                              title={lang(t.download)}
                            >
                              <DownloadIcon />
                            </button>
                          )}

                          {pending && (
                            <>
                              <button
                                onClick={() => handleVerify(doc)}
                                disabled={
                                  processingId === doc.id ||
                                  isVerifying ||
                                  isRejecting
                                }
                                className="p-1.5 rounded-lg text-surface-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
                                title={lang(t.verify)}
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
                                onClick={() => {
                                  setRejectionReason("");
                                  setRejectModal(doc);
                                }}
                                disabled={
                                  processingId === doc.id ||
                                  isVerifying ||
                                  isRejecting
                                }
                                className="p-1.5 rounded-lg text-surface-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors disabled:opacity-50"
                                title={lang(t.reject)}
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
                            </>
                          )}

                          {doc.rejectionReason && (
                            <span
                              className="p-1.5 rounded-lg text-error-500 cursor-help"
                              title={doc.rejectionReason}
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
                                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.total)}: {documentsTotalCount || documents.length}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={pageIndex <= 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAr ? "السابق" : "Previous"}
                </button>
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {lang(t.page)} {pageIndex} {lang(t.of)} {totalPages}
                </span>
                <button
                  onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                  disabled={pageIndex >= totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAr ? "التالي" : "Next"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setRejectModal(null);
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
                    ar: `رفض مستند ${rejectModal.type || ""}`,
                    en: `Reject ${rejectModal.type || "Document"}`,
                  })}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {rejectModal.driverName ||
                    rejectModal.driverId?.slice(0, 8) ||
                    "—"}
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
                  setRejectModal(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === rejectModal.id || isRejecting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {processingId === rejectModal.id || isRejecting
                  ? lang(t.rejecting)
                  : lang(t.confirmReject)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDocumentsPage;