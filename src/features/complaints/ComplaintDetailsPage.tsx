import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminComplaints } from "@shared/hooks/useAdminComplaints";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { ComplaintDto } from "@shared/types";

// ============================================
// Icons
// ============================================

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

const CheckIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 12.75 6 6 9-13.5"
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
// ComplaintDetailsPage Component
// ============================================

export const ComplaintDetailsPage: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const { fetchComplaintById, resolveComplaint } = useAdminComplaints();

  const [complaint, setComplaint] = useState<ComplaintDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState("");

  const fetchData = useCallback(async () => {
    if (!complaintId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchComplaintById(complaintId);
      setComplaint(data);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل الشكوى", en: "Failed to load complaint" }),
        ),
      );
      navigate("/dashboard/complaints");
    } finally {
      setLoading(false);
    }
  }, [complaintId, fetchComplaintById, navigate, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async () => {
    if (!complaintId) return;
    setActionLoading(true);
    try {
      const resolved = await resolveComplaint(complaintId, {
        resolution: resolution.trim() || null,
      });
      setComplaint(resolved);
      toast.success(
        lang({
          ar: "تم حل الشكوى بنجاح",
          en: "Complaint resolved successfully",
        }),
      );
      setShowResolveModal(false);
      setResolution("");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حل الشكوى", en: "Failed to resolve complaint" }),
        ),
      );
    } finally {
      setActionLoading(false);
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

  const t = {
    back: { ar: "العودة للشكاوى", en: "Back to Complaints" },
    details: { ar: "تفاصيل الشكوى", en: "Complaint Details" },
    customer: { ar: "العميل", en: "Customer" },
    orderId: { ar: "رقم الطلب", en: "Order ID" },
    description: { ar: "وصف الشكوى", en: "Complaint Description" },
    resolution: { ar: "الحل", en: "Resolution" },
    createdAt: { ar: "تاريخ الشكوى", en: "Filed Date" },
    resolvedAt: { ar: "تاريخ الحل", en: "Resolved Date" },
    open: { ar: "مفتوحة", en: "Open" },
    resolved: { ar: "تم الحل", en: "Resolved" },
    closed: { ar: "مغلقة", en: "Closed" },
    resolve: { ar: "حل الشكوى", en: "Resolve Complaint" },
    resolving: { ar: "جاري الحل...", en: "Resolving..." },
    resolveTitle: { ar: "حل الشكوى", en: "Resolve Complaint" },
    resolvePlaceholder: {
      ar: "اكتب تفاصيل الحل هنا...",
      en: "Enter resolution details...",
    },
    cancel: { ar: "إلغاء", en: "Cancel" },
    confirmResolve: { ar: "تأكيد الحل", en: "Confirm Resolution" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    noResolution: {
      ar: "لم يتم تقديم حل بعد",
      en: "No resolution provided yet",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "الشكوى غير موجودة", en: "Complaint not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/complaints")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {lang(t.back)}
        </button>
      </div>
    );
  }

  const status = complaint.status ?? "Open";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/complaints")}
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-error-500 to-error-600 flex items-center justify-center shadow-lg shadow-error-500/20 flex-shrink-0">
            <ComplaintIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {lang(t.details)}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 font-mono">
              {complaint.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium",
            status === "Resolved"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : status === "Closed"
                ? "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                : "bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300",
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
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

      {/* Details Card */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.customer)}
              </label>
              <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                <UserIcon />
                {complaint.customerName || (isAr ? "عميل" : "Customer")}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.orderId)}
              </label>
              {complaint.orderId ? (
                <button
                  onClick={() =>
                    navigate(`/dashboard/orders/${complaint.orderId}`)
                  }
                  className="font-mono text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  {getOrderDisplay(complaint)}
                </button>
              ) : (
                <p className="text-surface-400 dark:text-surface-500">—</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.createdAt)}
              </label>
              <p className="text-surface-700 dark:text-surface-300 text-sm flex items-center gap-1.5">
                <ClockIcon />
                {formatDate(complaint.createdAt)}
              </p>
            </div>
            {complaint.resolvedAt && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.resolvedAt)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm flex items-center gap-1.5">
                  <ClockIcon />
                  {formatDate(complaint.resolvedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
              {lang(t.description)}
            </label>
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed whitespace-pre-wrap">
                {complaint.description || "—"}
              </p>
            </div>
          </div>

          {/* Resolution */}
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
              {lang(t.resolution)}
            </label>
            {complaint.resolution ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                <p className="text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed whitespace-pre-wrap flex items-start gap-2">
                  <NoteIcon />
                  <span>{complaint.resolution}</span>
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <p className="text-surface-400 dark:text-surface-500 text-sm italic">
                  {lang(t.noResolution)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action (only for open complaints) */}
      {status === "Open" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {lang({ ar: "إجراءات", en: "Actions" })}
            </h3>
            <button
              onClick={() => {
                setResolution("");
                setShowResolveModal(true);
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
            >
              <CheckIcon />
              {lang(t.resolve)}
            </button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowResolveModal(false);
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
                  {complaint.customerName || (isAr ? "عميل" : "Customer")} —{" "}
                  {getOrderDisplay(complaint)}
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 line-clamp-3 bg-surface-50 dark:bg-surface-800 p-3 rounded-xl">
              {complaint.description || "—"}
            </p>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.resolution)}
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder={lang(t.resolvePlaceholder)}
              rows={4}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
            />
            <div className="flex items-center gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setResolution("");
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {actionLoading ? lang(t.resolving) : lang(t.confirmResolve)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailsPage;