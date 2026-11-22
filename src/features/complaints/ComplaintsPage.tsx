import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminComplaints } from "@shared/hooks/useAdminComplaints";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { ComplaintDto } from "@shared/types";

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

const ComplaintIcon = () => (
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
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  </svg>
);

const UserIcon = () => (
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function getOrderDisplay(c: ComplaintDto): string {
  if (c.orderNumber) return `#${c.orderNumber}`;
  if (c.orderId) return `#${c.orderId.slice(0, 8)}`;
  return "—";
}

// ============================================
// ComplaintsPage Component
// ============================================

export const ComplaintsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();
  const toast = useToast();

  const {
    complaints,
    totalCount,
    loading,
    fetchComplaints,
    resolveComplaint,
  } = useAdminComplaints();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const pageSize = 20;

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<ComplaintDto | null>(null);
  const [resolution, setResolution] = useState("");

  const loadComplaints = useCallback(async () => {
    try {
      const result = await fetchComplaints({
        status: statusFilter || undefined,
        pageIndex,
        pageSize,
      });
      setTotalPages(result.totalPages || 1);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل الشكاوى", en: "Failed to load complaints" }),
        ),
      );
    }
  }, [fetchComplaints, statusFilter, pageIndex, toast, lang]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const filteredComplaints = complaints.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.customerName?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.orderNumber?.toLowerCase().includes(q) ||
      c.orderId?.toLowerCase().includes(q)
    );
  });

  const handleResolve = async () => {
    if (!resolveModal) return;
    setProcessingId(`resolve-${resolveModal.id}`);
    try {
      await resolveComplaint(resolveModal.id, {
        resolution: resolution.trim() || null,
      });
      toast.success(
        lang({
          ar: "تم حل الشكوى بنجاح",
          en: "Complaint resolved successfully",
        }),
      );
      setResolveModal(null);
      setResolution("");
      if (statusFilter === "Open") {
        await loadComplaints();
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حل الشكوى", en: "Failed to resolve complaint" }),
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const openCount = complaints.filter(
    (c) => (c.status ?? "Open") === "Open",
  ).length;

  const t = {
    title: { ar: "الشكاوى", en: "Complaints" },
    subtitle: {
      ar: "عرض وإدارة شكاوى العملاء",
      en: "View and manage customer complaints",
    },
    searchPlaceholder: {
      ar: "بحث باسم العميل أو رقم الطلب أو الوصف...",
      en: "Search by customer, order #, or description...",
    },
    allStatuses: { ar: "جميع الحالات", en: "All Statuses" },
    open: { ar: "مفتوحة", en: "Open" },
    resolved: { ar: "تم الحل", en: "Resolved" },
    closed: { ar: "مغلقة", en: "Closed" },
    openCount: { ar: `${openCount} مفتوحة`, en: `${openCount} open` },
    resolution: { ar: "الحل", en: "Resolution" },
    resolve: { ar: "حل الشكوى", en: "Resolve" },
    resolving: { ar: "جاري...", en: "Resolving..." },
    resolveTitle: { ar: "حل الشكوى", en: "Resolve Complaint" },
    resolvePlaceholder: {
      ar: "اكتب تفاصيل الحل هنا...",
      en: "Enter resolution details...",
    },
    cancel: { ar: "إلغاء", en: "Cancel" },
    confirmResolve: { ar: "تأكيد الحل", en: "Confirm Resolution" },
    noComplaints: { ar: "لا توجد شكاوى", en: "No complaints found" },
    noComplaintsDesc: {
      ar: "لم يتم العثور على شكاوى تطابق معايير البحث",
      en: "No complaints match your search criteria",
    },
    total: { ar: "المجموع", en: "Total" },
    complaints: { ar: "شكوى", en: "complaints" },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    prev: { ar: "السابق", en: "Previous" },
    next: { ar: "التالي", en: "Next" },
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
        {openCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300">
            <span className="w-2 h-2 rounded-full bg-error-500 animate-pulse" />
            {lang(t.openCount)}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[150px]"
        >
          <option value="">{lang(t.allStatuses)}</option>
          <option value="Open">{lang(t.open)}</option>
          <option value="Resolved">{lang(t.resolved)}</option>
          <option value="Closed">{lang(t.closed)}</option>
        </select>
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <ComplaintIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noComplaints)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noComplaintsDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredComplaints.map((c) => {
              const status = c.status ?? "Open";
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/dashboard/complaints/${c.id}`)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
                          <UserIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                            {c.customerName || (isAr ? "عميل" : "Customer")}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">
                            {getOrderDisplay(c)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
                          status === "Resolved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : status === "Closed"
                              ? "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                              : "bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === "Resolved"
                              ? "bg-emerald-500"
                              : status === "Closed"
                                ? "bg-surface-400"
                                : "bg-error-500",
                          )}
                        />
                        {status === "Resolved"
                          ? lang(t.resolved)
                          : status === "Closed"
                            ? lang(t.closed)
                            : lang(t.open)}
                      </span>
                    </div>

                    <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-3 mb-3">
                      {c.description || "—"}
                    </p>

                    {c.resolution && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 mb-3">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                          <NoteIcon />
                          <span className="line-clamp-2">{c.resolution}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                      <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
                        <ClockIcon />
                        {formatDate(c.createdAt)}
                      </span>
                      {status === "Open" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolution("");
                            setResolveModal(c);
                          }}
                          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {lang(t.resolve)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.total)}: {totalCount || filteredComplaints.length}{" "}
              {lang(t.complaints)}
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

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setResolveModal(null);
              setResolution("");
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center flex-shrink-0">
                <ComplaintIcon />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {lang(t.resolveTitle)}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {resolveModal.customerName || (isAr ? "عميل" : "Customer")} —{" "}
                  {getOrderDisplay(resolveModal)}
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 line-clamp-2">
              {resolveModal.description || "—"}
            </p>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.resolution)}
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder={lang(t.resolvePlaceholder)}
              rows={3}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
            />
            <div className="flex items-center gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setResolveModal(null);
                  setResolution("");
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleResolve}
                disabled={processingId === `resolve-${resolveModal.id}`}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {processingId === `resolve-${resolveModal.id}`
                  ? lang(t.resolving)
                  : lang(t.confirmResolve)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;