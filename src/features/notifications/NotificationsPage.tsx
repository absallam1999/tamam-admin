import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@shared/hooks/useLanguage";
import { adminApi } from "@config/admin.api";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type {
  NotificationSummaryDto,
  NotificationQueryParams,
  PagedResult,
} from "@shared/types";

// ============================================
// Icons
// ============================================

const BellIcon = () => (
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
      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
    />
  </svg>
);

const CheckAllIcon = () => (
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

// ============================================
// Helpers
// ============================================

type ReadFilter = "all" | "unread" | "read";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

// ============================================
// NotificationsPage Component
// ============================================

export const NotificationsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const toast = useToast();

  const [notifications, setNotifications] = useState<NotificationSummaryDto[]>(
    [],
  );
  const [pagination, setPagination] =
    useState<PagedResult<NotificationSummaryDto> | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [readAllLoading, setReadAllLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await adminApi.getUnreadNotificationCount();
      setUnreadTotal(result?.total ?? 0);
    } catch {
      // keep fallback count from loaded list
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: NotificationQueryParams = {
        pageIndex: page,
        pageSize,
        IsRead:
          readFilter === "unread"
            ? false
            : readFilter === "read"
              ? true
              : undefined,
      };

      const result = await adminApi.getNotifications(params);
      setNotifications(result?.items ?? []);
      setPagination(result ?? null);
    } catch {
      setNotifications([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, readFilter]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleMarkRead = async (id: string) => {
    setProcessingId(id);
    try {
      await adminApi.markNotificationRead(id);
      setNotifications((prev) =>
        readFilter === "unread"
          ? prev.filter((n) => n.id !== id)
          : prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadTotal((prev) => Math.max(0, prev - 1));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err, lang({ ar: "فشل التحديث", en: "Update failed" })),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setReadAllLoading(true);
    try {
      await adminApi.markAllNotificationsRead();
      setNotifications((prev) =>
        readFilter === "unread"
          ? []
          : prev.map((n) => ({ ...n, isRead: true })),
      );
      setUnreadTotal(0);
      toast.success(
        lang({ ar: "تم تحديد الكل كمقروء", en: "All marked as read" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err, lang({ ar: "فشل التحديث", en: "Update failed" })),
      );
    } finally {
      setReadAllLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (isAr) {
        if (minutes < 1) return "الآن";
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
      } else {
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
      }

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

  const listUnreadCount = notifications.filter((n) => !n.isRead).length;
  const displayUnreadCount = unreadTotal || listUnreadCount;
  const totalPages = pagination?.totalPages || 1;

  const t = {
    title: { ar: "الإشعارات", en: "Notifications" },
    subtitle: {
      ar: "عرض جميع الإشعارات الواردة",
      en: "View all incoming notifications",
    },
    markAllRead: { ar: "تحديد الكل كمقروء", en: "Mark All as Read" },
    marking: { ar: "جاري التحديد...", en: "Marking..." },
    all: { ar: "الكل", en: "All" },
    unread: { ar: "غير مقروء", en: "Unread" },
    read: { ar: "مقروء", en: "Read" },
    noNotifications: { ar: "لا توجد إشعارات", en: "No notifications" },
    noNotificationsDesc: {
      ar: "لم تصلك أي إشعارات حتى الآن",
      en: "You haven't received any notifications yet",
    },
    markRead: { ar: "تحديد كمقروء", en: "Mark as Read" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    total: { ar: "المجموع", en: "Total" },
    notifications: { ar: "إشعار", en: "notifications" },
  };

  return (
    <div className="space-y-6 w-full">
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
          {displayUnreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              {displayUnreadCount} {lang(t.unread)}
            </span>
          )}
          {displayUnreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={readAllLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900/50 hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors disabled:opacity-50"
            >
              <CheckAllIcon />
              {readAllLoading ? lang(t.marking) : lang(t.markAllRead)}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-xl p-1 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
        {(["all", "unread", "read"] as ReadFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => {
              setReadFilter(filter);
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              readFilter === filter
                ? "bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100",
            )}
          >
            {lang(t[filter])}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" message={lang(t.loading)} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <BellIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noNotifications)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noNotificationsDesc)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const title =
              (isAr
                ? notification.titleAr || notification.titleEn
                : notification.titleEn || notification.titleAr) || "—";
            const body = isAr
              ? notification.bodyAr || notification.bodyEn
              : notification.bodyEn || notification.bodyAr;

            return (
              <div
                key={notification.id}
                className={cn(
                  "rounded-2xl border p-4 transition-all duration-200",
                  notification.isRead
                    ? "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
                    : "border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20 shadow-sm",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      notification.isRead
                        ? "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"
                        : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400",
                    )}
                  >
                    <BellIcon />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          notification.isRead
                            ? "font-medium text-surface-700 dark:text-surface-300"
                            : "font-semibold text-surface-900 dark:text-surface-100",
                        )}
                      >
                        {title}
                      </p>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={processingId === notification.id}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0 disabled:opacity-50"
                        >
                          {processingId === notification.id
                            ? "..."
                            : lang(t.markRead)}
                        </button>
                      )}
                    </div>
                    {body && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                        {body}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[10px] text-surface-400 dark:text-surface-500 flex items-center gap-1">
                        <ClockIcon />
                        {formatDate(notification.createdAt)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          notification.isRead
                            ? "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                            : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
                        )}
                      >
                        {notification.isRead ? lang(t.read) : lang(t.unread)}
                      </span>
                      {notification.type && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                          {notification.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread Dot */}
                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {lang(t.total)}: {pagination?.totalCount ?? notifications.length}{" "}
            {lang(t.notifications)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
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
              {lang(t.page)} {page} {lang(t.of)} {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
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
      )}
    </div>
  );
};

export default NotificationsPage;