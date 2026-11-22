import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminRequests } from "@shared/hooks/useAdminRequests";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { RequestDto } from "@shared/types";

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

const MailIcon = () => (
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
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
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

const TagIcon = () => (
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
    className="w-4 h-4 flex-shrink-0 mt-0.5"
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

type StatusFilter = "All" | "Pending" | "Approved" | "Rejected";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// RequestsPage Component
// ============================================

export const RequestsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();
  const toast = useToast();

  const {
    requests,
    loading,
    fetchRequests,
    fetchPendingRequests,
    approveRequest,
    rejectRequest,
  } = useAdminRequests();

  const [requestList, setRequestList] = useState<RequestDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [rejectModal, setRejectModal] = useState<RequestDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setRequestList(requests);
  }, [requests]);

  const loadData = useCallback(
    async (
      filter: StatusFilter = statusFilter,
      page: number = pageIndex,
      search: string = searchTerm,
    ) => {
      try {
        const result =
          filter === "Pending" && !search.trim()
            ? await fetchPendingRequests(page, 20)
            : await fetchRequests({
                Status: filter === "All" ? undefined : filter,
                Search: search.trim() || undefined,
                PageIndex: page,
                PageSize: 20,
              });
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages || 1);
        setHasNext(result.hasNext);
        setHasPrevious(result.hasPrevious);
      } catch (err: unknown) {
        toast.error(
          getErrorMessage(
            err,
            lang({ ar: "فشل تحميل الطلبات", en: "Failed to load requests" }),
          ),
        );
      }
    },
    [
      statusFilter,
      pageIndex,
      searchTerm,
      fetchPendingRequests,
      fetchRequests,
      toast,
      lang,
    ],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(statusFilter, pageIndex, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, pageIndex, searchTerm, loadData]);

  const handleFilterChange = (next: StatusFilter) => {
    setStatusFilter(next);
    setPageIndex(1);
  };

  const handleApprove = async (req: RequestDto) => {
    setProcessingId(`approve-${req.id}`);
    try {
      const updated = await approveRequest(req.id);
      toast.success(
        lang({ ar: "تمت الموافقة على الطلب", en: "Request approved" }),
      );
      setRequestList((prev) =>
        statusFilter === "Pending"
          ? prev.filter((item) => item.id !== req.id)
          : prev.map((item) => (item.id === req.id ? updated : item)),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل قبول الطلب", en: "Failed to approve request" }),
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
      const updated = await rejectRequest(rejectModal.id, {
        reason: rejectReason.trim() || null,
      });
      toast.success(
        lang({ ar: "تم رفض الطلب", en: "Request rejected" }),
      );
      setRequestList((prev) =>
        statusFilter === "Pending"
          ? prev.filter((item) => item.id !== rejectModal.id)
          : prev.map((item) => (item.id === rejectModal.id ? updated : item)),
      );
      setRejectModal(null);
      setRejectReason("");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل رفض الطلب", en: "Failed to reject request" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
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
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0",
          styles[s] ||
            "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300",
        )}
      >
        {labels[s] ? lang(labels[s]) : s}
      </span>
    );
  };

  const t = {
    title: { ar: "طلبات الانضمام", en: "Onboarding Requests" },
    subtitle: {
      ar: "عرض وإدارة طلبات الانضمام للمنصة",
      en: "View and manage platform onboarding requests",
    },
    searchPlaceholder: {
      ar: "بحث بالاسم أو رقم الهاتف أو العلامة التجارية...",
      en: "Search by name, phone, or brand...",
    },
    all: { ar: "الكل", en: "All" },
    pending: { ar: "قيد المراجعة", en: "Pending" },
    approved: { ar: "مقبول", en: "Approved" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    approve: { ar: "قبول", en: "Approve" },
    reject: { ar: "رفض", en: "Reject" },
    rejectTitle: { ar: "رفض الطلب", en: "Reject Request" },
    rejectReasonLabel: { ar: "سبب الرفض", en: "Rejection Reason" },
    rejectReasonPlaceholder: {
      ar: "أدخل سبب الرفض (اختياري)...",
      en: "Enter rejection reason (optional)...",
    },
    confirm: { ar: "تأكيد الرفض", en: "Confirm Reject" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    noRequests: { ar: "لا توجد طلبات", en: "No requests found" },
    noRequestsDesc: {
      ar: "لم يتم العثور على طلبات انضمام",
      en: "No onboarding requests found",
    },
    total: { ar: "المجموع", en: "Total" },
    requests: { ar: "طلب", en: "requests" },
    prev: { ar: "السابق", en: "Previous" },
    next: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
  };

  const filterTabs: { value: StatusFilter; label: { ar: string; en: string } }[] =
    [
      { value: "All", label: t.all },
      { value: "Pending", label: t.pending },
      { value: "Approved", label: t.approved },
      { value: "Rejected", label: t.rejected },
    ];

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

        {/* Status Filter Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 self-start">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
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

      {/* Search */}
      <div className="relative">
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

      {/* Requests Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : requestList.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <RequestIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noRequests)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noRequestsDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {requestList.map((req) => {
              const brandLabel = isAr
                ? req.brandName || req.brandNameEn
                : req.brandNameEn || req.brandName;
              const categoryLabel = isAr
                ? req.storeCategoryNameAr || req.storeCategoryNameEn
                : req.storeCategoryNameEn || req.storeCategoryNameAr;
              const isPending = (req.status ?? "Pending") === "Pending";

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-info-500 to-info-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-sm font-bold text-white">
                            {req.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                            {req.name || "—"}
                          </h3>
                          <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                            <PhoneIcon />
                            {req.phoneNumber || "—"}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 mb-3">
                      {req.email && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5 truncate">
                          <MailIcon />
                          {req.email}
                        </p>
                      )}
                      {req.city && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5 truncate">
                          <LocationIcon />
                          {req.city}
                        </p>
                      )}
                      {brandLabel && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5 truncate">
                          <TagIcon />
                          {brandLabel}
                        </p>
                      )}
                    </div>

                    {/* Role / Type / Category Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {req.requestedRole && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-300">
                          {req.requestedRole}
                        </span>
                      )}
                      {req.requestType &&
                        req.requestType !== req.requestedRole && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                            {req.requestType}
                          </span>
                        )}
                      {categoryLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                          {categoryLabel}
                        </span>
                      )}
                    </div>

                    {/* Note Preview */}
                    {req.note && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mb-3 flex items-start gap-1.5">
                        <NoteIcon />
                        <span>{req.note}</span>
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800 gap-2">
                      <span className="text-[10px] text-surface-400 flex items-center gap-1">
                        <ClockIcon />
                        {formatDate(req.createdAt)}
                      </span>
                      {isPending && (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={processingId === `approve-${req.id}`}
                            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                          >
                            {processingId === `approve-${req.id}`
                              ? lang(t.processing)
                              : lang(t.approve)}
                          </button>
                          <button
                            onClick={() => {
                              setRejectReason("");
                              setRejectModal(req);
                            }}
                            disabled={!!processingId}
                            className="text-xs font-medium text-error-500 hover:text-error-700 hover:underline disabled:opacity-50"
                          >
                            {lang(t.reject)}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.total)}: {totalCount || requestList.length}{" "}
              {lang(t.requests)}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={!hasPrevious}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {lang(t.prev)}
                </button>
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {lang(t.page)} {pageIndex} {lang(t.of)} {totalPages}
                </span>
                <button
                  onClick={() => setPageIndex((p) => p + 1)}
                  disabled={!hasNext}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {lang(t.next)}
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
            onClick={() => setRejectModal(null)}
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
                  {rejectModal.name || "—"} — {rejectModal.phoneNumber || "—"}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.rejectReasonLabel)}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={lang(t.rejectReasonPlaceholder)}
                rows={3}
                className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setRejectModal(null)}
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
                  : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;