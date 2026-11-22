import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatTime, formatDate } from "@shared/utils/formatters";
import { resolveMediaUrl } from "@/shared/utils/Parser";
import { useAdminChat } from "@shared/hooks/useAdminChat";
import type {
  ConversationListItemDto,
  ConversationDto,
  MessageDto,
  ChatUnreadCountDto,
} from "@shared/types";

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "محادثات الدعم", en: "Support Chat" },
  subtitle: {
    ar: "إدارة والرد على محادثات العملاء والمتاجر والسائقين",
    en: "Manage and respond to customer, store, and driver conversations",
  },
  conversations: { ar: "المحادثات", en: "Conversations" },
  all: { ar: "الكل", en: "All" },
  unread: { ar: "غير مقروءة", en: "Unread" },
  unassigned: { ar: "غير معينة", en: "Unassigned" },
  searchPlaceholder: {
    ar: "بحث بالاسم، الموضوع، أو رقم الطلب...",
    en: "Search by name, subject, or order #...",
  },
  noConversations: { ar: "لا توجد محادثات", en: "No conversations" },
  noConversationsDesc: {
    ar: "ستظهر محادثات الدعم هنا",
    en: "Support conversations will appear here",
  },
  refresh: { ar: "تحديث", en: "Refresh" },
  status: { ar: "الحالة", en: "Status" },
  open: { ar: "مفتوح", en: "Open" },
  assigned: { ar: "معين", en: "Assigned" },
  closed: { ar: "مغلق", en: "Closed" },
  assign: { ar: "تعيين مشرف", en: "Assign" },
  assignTitle: { ar: "تعيين المحادثة لمشرف", en: "Assign Conversation" },
  assignDesc: {
    ar: "أدخل معرف المشرف لتعيين هذه المحادثة له",
    en: "Enter the admin ID to assign this conversation",
  },
  adminId: { ar: "معرف المشرف", en: "Admin ID" },
  adminIdPlaceholder: {
    ar: "أدخل معرف المشرف (UUID)",
    en: "Enter admin UUID",
  },
  assigning: { ar: "جاري التعيين...", en: "Assigning..." },
  assignSuccess: {
    ar: "تم تعيين المحادثة بنجاح",
    en: "Conversation assigned successfully",
  },
  assignError: {
    ar: "فشل تعيين المحادثة",
    en: "Failed to assign conversation",
  },
  closeConversation: { ar: "إغلاق المحادثة", en: "Close Chat" },
  closeTitle: { ar: "إغلاق المحادثة", en: "Close Conversation" },
  closeDesc: {
    ar: "يمكنك إضافة سبب لإغلاق هذه المحادثة (اختياري)",
    en: "Optionally provide a reason for closing this conversation",
  },
  closeReason: { ar: "سبب الإغلاق", en: "Reason" },
  closeReasonPlaceholder: {
    ar: "اكتب سبب الإغلاق...",
    en: "Enter closing reason...",
  },
  closing: { ar: "جاري الإغلاق...", en: "Closing..." },
  closeSuccess: { ar: "تم إغلاق المحادثة", en: "Conversation closed" },
  closeError: {
    ar: "فشل إغلاق المحادثة",
    en: "Failed to close conversation",
  },
  send: { ar: "إرسال", en: "Send" },
  sending: { ar: "جاري الإرسال...", en: "Sending..." },
  sendError: { ar: "فشل إرسال الرسالة", en: "Failed to send message" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  confirm: { ar: "تأكيد", en: "Confirm" },
  typeMessage: { ar: "اكتب رسالتك...", en: "Type your message..." },
  selectConversation: { ar: "اختر محادثة", en: "Select a conversation" },
  selectConversationDesc: {
    ar: "اختر محادثة من القائمة لعرض الرسائل والرد عليها",
    en: "Select a conversation from the list to view and reply to messages",
  },
  noMessages: { ar: "لا توجد رسائل", en: "No messages yet" },
  startConversation: {
    ar: "ابدأ المحادثة بإرسال رسالة",
    en: "Start the conversation by sending a message",
  },
  back: { ar: "رجوع", en: "Back" },
  loadMessages: { ar: "جارٍ تحميل الرسائل...", en: "Loading messages..." },
  created: { ar: "تم الإنشاء", en: "Created" },
  assignedTo: { ar: "معين إلى", en: "Assigned to" },
  order: { ar: "طلب", en: "Order" },
  attachment: { ar: "ملف مرفق", en: "Attachment" },
  tapToDownload: { ar: "انقر للتحميل", en: "Tap to download" },
  tapToView: { ar: "انقر للعرض", en: "Tap to view" },
  conversationClosedNotice: {
    ar: "تم إغلاق هذه المحادثة",
    en: "This conversation is closed",
  },
} as const;

const lang = (key: keyof typeof t, isAr: boolean) =>
  isAr ? t[key].ar : t[key].en;

type FilterTab = "all" | "unread" | "unassigned";

// ============================================================
// Helper
// ============================================================

const formatConversationPreview = (
  preview: string | null | undefined,
  isAr: boolean,
): string => {
  if (!preview) return "";
  const trimmed = preview.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();

  if (lower === "image" || lower === "📷" || lower === "📷 image") {
    return isAr ? "صورة" : "Image";
  }

  if (lower === "attachment" || lower === "📎" || lower === "📎 attachment") {
    return isAr ? "مرفق" : "Attachment";
  }

  if (lower === "file" || lower === "📎 file") {
    return isAr ? "ملف" : "File";
  }

  return trimmed;
};

// ============================================================
// Skeleton Loader
// ============================================================

const SkeletonLoader: React.FC = () => {
  return (
    <div className="h-[calc(100dvh-80px)] flex flex-col bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
        <div className="space-y-2">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-28 sm:w-36 rounded-xl" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex w-80 flex-col border-l border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton h-4 w-28 rounded-lg" />
            <div className="skeleton h-4 w-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="skeleton h-4 w-36 rounded-lg" />
                    <div className="skeleton h-3 w-28 rounded-lg mt-1.5" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="skeleton h-5 w-16 rounded-lg" />
                    <div className="skeleton h-3 w-14 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-surface-900">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-40 sm:w-48 rounded-lg" />
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-20 rounded-lg" />
                  <div className="skeleton h-5 w-20 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="skeleton h-4 w-16 rounded-lg" />
          </div>
          <div className="flex-1 px-4 sm:px-6 py-4 space-y-4 bg-surface-50/30 dark:bg-surface-900/30">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex items-end gap-3",
                  i % 2 === 0 ? "flex-row" : "flex-row-reverse",
                )}
              >
                <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                <div className="max-w-[70%] space-y-1.5">
                  <div className="skeleton h-12 w-48 sm:w-56 rounded-2xl" />
                  <div className="skeleton h-3 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 dark:border-surface-800 px-4 py-3 bg-white dark:bg-surface-900">
            <div className="flex items-end gap-2">
              <div className="skeleton flex-1 h-12 rounded-xl" />
              <div className="skeleton w-20 sm:w-24 h-10 rounded-xl flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Status Badge
// ============================================================

const StatusBadge: React.FC<{ status: string; isAr: boolean }> = ({
  status,
  isAr,
}) => {
  const config: Record<string, { bg: string; dot: string; label: string }> = {
    Open: {
      bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
      dot: "bg-blue-500",
      label: lang("open", isAr),
    },
    Assigned: {
      bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      dot: "bg-amber-500",
      label: lang("assigned", isAr),
    },
    Closed: {
      bg: "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700",
      dot: "bg-surface-400",
      label: lang("closed", isAr),
    },
  };

  const c = config[status] || config.Open;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
        c.bg,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
};

// ============================================================
// Message Bubble
// ============================================================

const MessageBubble: React.FC<{
  message: MessageDto;
  isOwn: boolean;
  isAr: boolean;
}> = ({ message, isOwn, isAr }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const attachmentUrl = resolveMediaUrl(message.attachmentUrl);
  const avatarUrl = resolveMediaUrl(message.senderProfilePictureUrl);

  const isImage =
    message.messageType === "Image" && !!attachmentUrl && !imageError;
  const isFile = !!attachmentUrl && !isImage;
  const attachmentName = message.content?.trim();

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  return (
    <>
      <div
        className={cn(
          "flex items-end gap-3 animate-fade-in max-w-full w-fit",
          isOwn ? "me-auto flex-row" : "ms-auto flex-row-reverse",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold overflow-hidden",
            isOwn
              ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600 text-surface-700 dark:text-surface-300",
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={message.senderName ?? ""}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : isOwn ? (
            isAr ? (
              "إ"
            ) : (
              "A"
            )
          ) : (
            message.senderName?.charAt(0)?.toUpperCase() ||
            (isAr ? "ع" : "U")
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "text-sm leading-relaxed shadow-sm rounded-2xl overflow-hidden",
            isImage ? "w-56 max-w-[70vw] p-2" : "max-w-[70%] px-4 py-2.5",
            isOwn
              ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/20 rounded-ss-none"
              : "bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700 rounded-se-none",
          )}
        >
          {/* Inline image */}
          {isImage && attachmentUrl && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className={cn(
                "relative block w-full aspect-square rounded-lg overflow-hidden cursor-zoom-in group",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isOwn
                  ? "focus-visible:ring-white/70 focus-visible:ring-offset-primary-600"
                  : "focus-visible:ring-primary-500/70 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-800",
                "border",
                isOwn
                  ? "border-white/15"
                  : "border-surface-200/60 dark:border-surface-700/60",
              )}
              aria-label={lang("tapToView", isAr)}
            >
              <img
                src={attachmentUrl}
                alt={attachmentName ?? ""}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-cover block select-none pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-lg pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="p-2 rounded-full bg-black/50 backdrop-blur-sm shadow-lg">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </div>
              </div>
            </button>
          )}

          {/* File card */}
          {isFile && attachmentUrl && (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noreferrer noopener"
              download
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  isOwn
                    ? "bg-white/20 text-white"
                    : "bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
                )}
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
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate max-w-[180px]">
                  {attachmentName || lang("attachment", isAr)}
                </p>
                <p
                  className={cn(
                    "text-[10px]",
                    isOwn
                      ? "text-white/70"
                      : "text-surface-500 dark:text-surface-400",
                  )}
                >
                  {lang("tapToDownload", isAr)}
                </p>
              </div>
            </a>
          )}

          {/* Text content */}
          {message.content && !attachmentUrl && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Timestamp + read/sent check */}
          <div className="flex items-center gap-1.5 mt-1.5 justify-end">
            <span
              className={cn(
                "text-[10px]",
                isOwn
                  ? "text-white/70"
                  : "text-surface-400 dark:text-surface-500",
              )}
            >
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <svg
                className={cn(
                  "w-3 h-3",
                  message.isRead ? "text-white" : "text-white/50",
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && attachmentUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 end-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
          <img
            src={attachmentUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// ============================================================
// Main Component
// ============================================================

export const ChatPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const isRTL = isAr;

  const {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchUnreadConversations,
    fetchUnassignedConversations,
    fetchConversation,
    fetchMessages,
    sendMessage,
    assignConversation,
    closeConversation,
    markConversationRead,
    getUnreadCount,
  } = useAdminChat();

  const [conversationList, setConversationList] = useState<
    ConversationListItemDto[]
  >([]);
  const [messagesList, setMessagesList] = useState<MessageDto[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [selectedConversationDetail, setSelectedConversationDetail] =
    useState<ConversationDto | null>(null);
  const [unreadStats, setUnreadStats] = useState<ChatUnreadCountDto | null>(
    null,
  );

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAdminId, setAssignAdminId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Close modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [closing, setClosing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setConversationList(conversations);
  }, [conversations]);

  useEffect(() => {
    setMessagesList(messages);
  }, [messages]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const stats = await getUnreadCount();
      setUnreadStats(stats);
    } catch {
      // ignore unread badge fetch errors
    }
  }, [getUnreadCount]);

  const loadConversations = useCallback(
    async (tab: FilterTab = activeTab, search: string = searchTerm) => {
      try {
        if (tab === "unread") {
          const items = await fetchUnreadConversations();
          setConversationList(items);
        } else if (tab === "unassigned") {
          const items = await fetchUnassignedConversations();
          setConversationList(items);
        } else {
          await fetchConversations(
            search.trim() ? { Search: search.trim() } : undefined,
          );
        }
      } catch {
        toast.error(
          isAr ? "فشل تحميل المحادثات" : "Failed to load conversations",
        );
      } finally {
        setInitialLoading(false);
      }
    },
    [
      activeTab,
      searchTerm,
      fetchConversations,
      fetchUnreadConversations,
      fetchUnassignedConversations,
      isAr,
      toast,
    ],
  );

  useEffect(() => {
    loadConversations(activeTab, searchTerm);
    loadUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Debounced search for "all" tab
  useEffect(() => {
    if (activeTab !== "all") return;
    const timer = setTimeout(() => {
      fetchConversations(
        searchTerm.trim() ? { Search: searchTerm.trim() } : undefined,
      ).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, fetchConversations]);

  // Select conversation -> fetch detail, messages, mark read
  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversationDetail(null);
      setMessagesList([]);
      return;
    }

    let cancelled = false;
    const loadSelected = async () => {
      setMessagesLoading(true);
      try {
        const [detail] = await Promise.all([
          fetchConversation(selectedConversationId),
          fetchMessages(selectedConversationId),
        ]);
        if (!cancelled) {
          setSelectedConversationDetail(detail);
        }
        await markConversationRead(selectedConversationId);
        if (!cancelled) {
          setConversationList((prev) =>
            prev.map((c) =>
              c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c,
            ),
          );
          loadUnreadCount();
        }
      } catch {
        if (!cancelled) {
          toast.error(
            isAr ? "فشل تحميل المحادثة" : "Failed to load conversation",
          );
        }
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };

    loadSelected();
    return () => {
      cancelled = true;
    };
  }, [
    selectedConversationId,
    fetchConversation,
    fetchMessages,
    markConversationRead,
    loadUnreadCount,
    isAr,
    toast,
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [messagesList]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [newMessage]);

  const displayedConversations = useMemo(() => {
    if (activeTab === "all" || !searchTerm.trim()) return conversationList;
    const q = searchTerm.toLowerCase().trim();
    return conversationList.filter(
      (c) =>
        c.participantName?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.orderNumber?.toLowerCase().includes(q),
    );
  }, [conversationList, activeTab, searchTerm]);

  const selectedListConversation = conversationList.find(
    (c) => c.id === selectedConversationId,
  );
  const selectedConversation =
    selectedConversationDetail ?? selectedListConversation;

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversationId || sending) return;
    setSending(true);
    try {
      const created = await sendMessage(selectedConversationId, {
        content: newMessage.trim(),
        messageType: "Text",
      });
      setMessagesList((prev) => [...prev, created]);
      setConversationList((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? {
                ...c,
                lastMessagePreview: created.content ?? c.lastMessagePreview,
                lastMessageAt: created.createdAt,
              }
            : c,
        ),
      );
      setNewMessage("");
      textareaRef.current?.focus();
    } catch {
      toast.error(lang("sendError", isAr));
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedConversationId, sending, sendMessage, isAr, toast]);

  const handleAssignConversation = useCallback(async () => {
    if (!selectedConversationId || !assignAdminId.trim() || assigning) return;
    setAssigning(true);
    try {
      await assignConversation(selectedConversationId, {
        adminId: assignAdminId.trim(),
      });
      const updatedDetail = await fetchConversation(selectedConversationId);
      setSelectedConversationDetail(updatedDetail);
      setConversationList((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId ? updatedDetail : c,
        ),
      );
      setShowAssignModal(false);
      setAssignAdminId("");
      toast.success(lang("assignSuccess", isAr));
    } catch {
      toast.error(lang("assignError", isAr));
    } finally {
      setAssigning(false);
    }
  }, [
    selectedConversationId,
    assignAdminId,
    assigning,
    assignConversation,
    fetchConversation,
    isAr,
    toast,
  ]);

  const handleCloseConversation = useCallback(async () => {
    if (!selectedConversationId || closing) return;
    setClosing(true);
    try {
      await closeConversation(selectedConversationId, {
        reason: closeReason.trim() || null,
      });
      const updatedDetail = await fetchConversation(selectedConversationId);
      setSelectedConversationDetail(updatedDetail);
      setConversationList((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId ? updatedDetail : c,
        ),
      );
      setShowCloseModal(false);
      setCloseReason("");
      toast.success(lang("closeSuccess", isAr));
    } catch {
      toast.error(lang("closeError", isAr));
    } finally {
      setClosing(false);
    }
  }, [
    selectedConversationId,
    closeReason,
    closing,
    closeConversation,
    fetchConversation,
    isAr,
    toast,
  ]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      loadConversations(activeTab, searchTerm),
      loadUnreadCount(),
      selectedConversationId
        ? fetchMessages(selectedConversationId)
        : Promise.resolve(),
    ]);
  }, [
    loadConversations,
    loadUnreadCount,
    activeTab,
    searchTerm,
    selectedConversationId,
    fetchMessages,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  if (initialLoading && loading) return <SkeletonLoader />;

  const selectedAvatarUrl = resolveMediaUrl(
    selectedConversation?.participantProfilePictureUrl ??
      selectedConversation?.customerProfilePictureUrl,
  );
  const selectedName =
    selectedConversation?.participantName ||
    selectedConversation?.customerName ||
    selectedConversation?.subject ||
    (isAr ? "محادثة دعم" : "Support Chat");
  const isClosed = selectedConversation?.status === "Closed";

  return (
    <div
      className={cn(
        "h-[calc(100dvh-80px)] flex flex-col bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800",
        isRTL ? "text-right" : "text-left",
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/80 to-surface-100/50 dark:from-surface-900/80 dark:to-surface-800/50">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-5 sm:w-6 h-5 sm:h-6 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            {lang("title", isAr)}
            {unreadStats && unreadStats.totalUnread > 0 && (
              <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadStats.totalUnread}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {lang("subtitle", isAr)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary-600 text-white text-xs sm:text-sm font-medium hover:bg-primary-700 active:scale-95 transition-all duration-200 shadow-lg shadow-primary-500/20 disabled:opacity-60"
        >
          <svg
            className={cn("w-4 h-4", loading && "animate-spin")}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          <span className="hidden sm:inline">{lang("refresh", isAr)}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div
          className={cn(
            "w-full md:w-80 flex-shrink-0 overflow-y-auto bg-surface-50/30 dark:bg-surface-900/30 border-l border-surface-200 dark:border-surface-800",
            selectedConversation
              ? "hidden md:flex md:flex-col"
              : "flex flex-col",
            isRTL ? "md:border-l-0 md:border-r" : "md:border-r-0 md:border-l",
          )}
        >
          <div className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                {lang("conversations", isAr)}
              </span>
              <span className="text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-200 dark:bg-surface-800 px-2.5 py-0.5 rounded-full">
                {displayedConversations.length}
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800">
              {(["all", "unread", "unassigned"] as FilterTab[]).map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                      active
                        ? "bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm"
                        : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white",
                    )}
                  >
                    {lang(tab, isAr)}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <svg
                className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-surface-400"
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
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang("searchPlaceholder", isAr)}
                className={cn(
                  "w-full rounded-xl py-2 ps-9 pe-3 text-xs bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all",
                  isRTL && "text-right",
                )}
              />
            </div>

            {displayedConversations.length > 0 ? (
              <div className="space-y-2">
                {displayedConversations.map((conv) => {
                  const isActive = conv.id === selectedConversationId;
                  const previewText = formatConversationPreview(
                    conv.lastMessagePreview,
                    isAr,
                  );
                  const displayName =
                    conv.participantName ||
                    conv.customerName ||
                    conv.subject ||
                    (isAr ? "محادثة دعم" : "Support Chat");

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={cn(
                        "w-full text-left p-3 sm:p-4 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary-50 dark:bg-primary-500/10 border-2 border-primary-500/30 dark:border-primary-500/30 shadow-sm"
                          : "hover:bg-surface-100 dark:hover:bg-surface-800 border-2 border-transparent",
                        isRTL && "text-right",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                              {displayName}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="flex-shrink-0 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          {conv.subject &&
                            conv.subject !== displayName && (
                              <p className="text-[11px] font-medium text-surface-600 dark:text-surface-300 truncate mt-0.5">
                                {conv.subject}
                              </p>
                            )}
                          {previewText ? (
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-1">
                              {previewText}
                            </p>
                          ) : (
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1 italic">
                              {lang("noMessages", isAr)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <StatusBadge
                            status={conv.status ?? "Open"}
                            isAr={isAr}
                          />
                          <span className="text-[10px] text-surface-400">
                            {formatTime(conv.lastMessageAt ?? conv.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-surface-300 dark:text-surface-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  {lang("noConversations", isAr)}
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                  {lang("noConversationsDesc", isAr)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-white dark:bg-surface-900",
            selectedConversation ? "flex" : "hidden md:flex",
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/50 to-surface-100/30 dark:from-surface-900/50 dark:to-surface-800/30 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedConversationId(null)}
                    className="md:hidden p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                    aria-label={lang("back", isAr)}
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
                        d={
                          isRTL
                            ? "M8.25 4.5l7.5 7.5-7.5 7.5"
                            : "M15.75 19.5 8.25 12l7.5-7.5"
                        }
                      />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-600/20 flex items-center justify-center shadow-lg shadow-primary-500/10 flex-shrink-0 overflow-hidden">
                    {selectedAvatarUrl ? (
                      <img
                        src={selectedAvatarUrl}
                        alt={selectedName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {selectedName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                        {selectedName}
                      </p>
                      {selectedConversation.participantType && (
                        <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                          {selectedConversation.participantType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <StatusBadge
                        status={selectedConversation.status ?? "Open"}
                        isAr={isAr}
                      />
                      {selectedConversation.orderNumber && (
                        <span className="text-[10px] text-surface-500 dark:text-surface-400">
                          • {lang("order", isAr)} #
                          {selectedConversation.orderNumber}
                        </span>
                      )}
                      {selectedConversation.adminName && (
                        <span className="text-[10px] text-surface-500 dark:text-surface-400 hidden sm:inline">
                          • {lang("assignedTo", isAr)}:{" "}
                          {selectedConversation.adminName}
                        </span>
                      )}
                      <span className="text-[10px] text-surface-400 hidden md:inline">
                        • {lang("created", isAr)}{" "}
                        {formatDate(selectedConversation.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isClosed && (
                    <>
                      <button
                        onClick={() => {
                          setAssignAdminId(
                            selectedConversation.adminId ?? "",
                          );
                          setShowAssignModal(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {lang("assign", isAr)}
                        </span>
                      </button>
                      <button
                        onClick={() => setShowCloseModal(true)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {lang("closeConversation", isAr)}
                        </span>
                      </button>
                    </>
                  )}
                  {isClosed && (
                    <span className="flex items-center gap-1.5 text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                      {lang("closed", isAr)}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-gradient-to-b from-surface-50/30 to-white dark:from-surface-900/30 dark:to-surface-900">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-3 text-surface-500 dark:text-surface-400">
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm">
                        {lang("loadMessages", isAr)}
                      </span>
                    </div>
                  </div>
                ) : messagesList.length > 0 ? (
                  messagesList.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderType === "Admin"}
                      isAr={isAr}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-surface-300 dark:text-surface-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                      {lang("noMessages", isAr)}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      {lang("startConversation", isAr)}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-surface-200 dark:border-surface-800 px-3 sm:px-4 py-3 bg-white dark:bg-surface-900">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang("typeMessage", isAr)}
                    disabled={isClosed}
                    className={cn(
                      "flex-1 resize-none rounded-xl px-3 sm:px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all min-h-[44px] max-h-32 disabled:opacity-60",
                      isRTL && "text-right",
                    )}
                    rows={1}
                    style={{ height: "44px" }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending || isClosed}
                    className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 shadow-lg shadow-primary-500/20"
                  >
                    {sending ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {lang("sending", isAr)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          {lang("send", isAr)}
                        </span>
                        <svg
                          className={`w-4 h-4 ${isAr ? "-scale-x-100" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                {isClosed && (
                  <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1.5">
                    {lang("conversationClosedNotice", isAr)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
                <svg
                  className="w-12 h-12 text-surface-300 dark:text-surface-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                {lang("selectConversation", isAr)}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mt-1">
                {lang("selectConversationDesc", isAr)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Conversation Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) =>
            e.target === e.currentTarget && setShowAssignModal(false)
          }
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-scale bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-gradient-to-r from-surface-50/80 to-surface-100/50 dark:from-surface-900/80 dark:to-surface-800/50">
              <div className={cn(isRTL && "text-right")}>
                <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-white">
                  {lang("assignTitle", isAr)}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {lang("assignDesc", isAr)}
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
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
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className={cn("space-y-1.5", isRTL && "text-right")}>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300">
                  {lang("adminId", isAr)}
                </label>
                <input
                  type="text"
                  value={assignAdminId}
                  onChange={(e) => setAssignAdminId(e.target.value)}
                  placeholder={lang("adminIdPlaceholder", isAr)}
                  dir="ltr"
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-mono bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAssignModal(false)}
                  disabled={assigning}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
                >
                  {lang("cancel", isAr)}
                </button>
                <button
                  onClick={handleAssignConversation}
                  disabled={!assignAdminId.trim() || assigning}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20"
                >
                  {assigning ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>{lang("assigning", isAr)}</span>
                    </>
                  ) : (
                    <span>{lang("confirm", isAr)}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Conversation Modal */}
      {showCloseModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) =>
            e.target === e.currentTarget && setShowCloseModal(false)
          }
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-scale bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-gradient-to-r from-surface-50/80 to-surface-100/50 dark:from-surface-900/80 dark:to-surface-800/50">
              <div className={cn(isRTL && "text-right")}>
                <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-white">
                  {lang("closeTitle", isAr)}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {lang("closeDesc", isAr)}
                </p>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
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
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className={cn("space-y-1.5", isRTL && "text-right")}>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300">
                  {lang("closeReason", isAr)}
                </label>
                <textarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder={lang("closeReasonPlaceholder", isAr)}
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCloseModal(false)}
                  disabled={closing}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
                >
                  {lang("cancel", isAr)}
                </button>
                <button
                  onClick={handleCloseConversation}
                  disabled={closing}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                >
                  {closing ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>{lang("closing", isAr)}</span>
                    </>
                  ) : (
                    <span>{lang("confirm", isAr)}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;