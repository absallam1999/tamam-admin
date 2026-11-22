import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminNotifications } from "@shared/hooks/useAdminNotifications";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type {
  BulkSendNotificationDto,
  BulkSendResultDto,
  NotificationPayloadDto,
} from "@shared/types";

// ============================================
// Icons
// ============================================

const BroadcastIcon = () => (
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

const CustomerIcon = () => (
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
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const DriverIcon = () => (
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
      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);

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

const SupervisorIcon = () => (
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
      d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
    />
  </svg>
);

const AllIcon = () => (
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
      d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

const SendIcon = () => (
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
      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
    />
  </svg>
);

// ============================================
// Broadcast Targets
// ============================================

interface BroadcastTarget {
  key: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: React.FC;
  color: string;
  endpoint: keyof ReturnType<typeof useAdminNotifications>;
}

const broadcastTargets: BroadcastTarget[] = [
  {
    key: "customers",
    labelAr: "العملاء",
    labelEn: "Customers",
    descriptionAr: "إرسال إشعار لجميع العملاء المسجلين",
    descriptionEn: "Send notification to all registered customers",
    icon: CustomerIcon,
    color:
      "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300",
    endpoint: "broadcastToCustomers",
  },
  {
    key: "drivers",
    labelAr: "السائقين",
    labelEn: "Drivers",
    descriptionAr: "إرسال إشعار لجميع السائقين المسجلين",
    descriptionEn: "Send notification to all registered drivers",
    icon: DriverIcon,
    color:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300",
    endpoint: "broadcastToDrivers",
  },
  {
    key: "stores",
    labelAr: "المتاجر",
    labelEn: "Stores",
    descriptionAr: "إرسال إشعار لجميع أصحاب المتاجر",
    descriptionEn: "Send notification to all store owners",
    icon: StoreIcon,
    color:
      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    endpoint: "broadcastToStores",
  },
  {
    key: "supervisors",
    labelAr: "المشرفين",
    labelEn: "Supervisors",
    descriptionAr: "إرسال إشعار لجميع المشرفين",
    descriptionEn: "Send notification to all supervisors",
    icon: SupervisorIcon,
    color:
      "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-300",
    endpoint: "broadcastToSupervisors",
  },
  {
    key: "all",
    labelAr: "الجميع",
    labelEn: "Everyone",
    descriptionAr: "إرسال إشعار لجميع المستخدمين",
    descriptionEn: "Send notification to all users",
    icon: AllIcon,
    color:
      "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300",
    endpoint: "broadcastToAll",
  },
];

// ============================================
// Helpers
// ============================================

interface BroadcastFormState {
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  sendPush: boolean;
  payloadJson: string;
}

const initialFormState: BroadcastFormState = {
  type: "General",
  titleAr: "",
  titleEn: "",
  bodyAr: "",
  bodyEn: "",
  sendPush: true,
  payloadJson: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// BroadcastPage Component
// ============================================

export const BroadcastPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    broadcastToCustomers,
    broadcastToDrivers,
    broadcastToStores,
    broadcastToAll,
    broadcastToSupervisors,
  } = useAdminNotifications();

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [formData, setFormData] =
    useState<BroadcastFormState>(initialFormState);
  const [sending, setSending] = useState<string | null>(null);

  const endpointMap: Record<
    BroadcastTarget["endpoint"],
    (dto: BulkSendNotificationDto) => Promise<BulkSendResultDto>
  > = {
    broadcastToCustomers,
    broadcastToDrivers,
    broadcastToStores,
    broadcastToSupervisors,
    broadcastToAll,
  };

  const handleSend = async () => {
    if (!selectedTarget) {
      toast.error(
        lang({ ar: "اختر فئة للإرسال", en: "Select a target group" }),
      );
      return;
    }
    if (!formData.titleAr.trim() || !formData.titleEn.trim()) {
      toast.error(
        lang({
          ar: "العنوان بالعربية والإنجليزية مطلوب",
          en: "Arabic and English titles are required",
        }),
      );
      return;
    }
    if (!formData.bodyAr.trim() || !formData.bodyEn.trim()) {
      toast.error(
        lang({
          ar: "المحتوى بالعربية والإنجليزية مطلوب",
          en: "Arabic and English bodies are required",
        }),
      );
      return;
    }

    let payload: NotificationPayloadDto | undefined;
    if (formData.payloadJson.trim()) {
      try {
        payload = JSON.parse(
          formData.payloadJson.trim(),
        ) as NotificationPayloadDto;
      } catch {
        toast.error(
          lang({
            ar: "صيغة JSON غير صالحة",
            en: "Invalid JSON format in payload",
          }),
        );
        return;
      }
    }

    const target = broadcastTargets.find((t) => t.key === selectedTarget);
    if (!target) return;

    setSending(target.key);
    try {
      const sendFn = endpointMap[target.endpoint];
      const dto: BulkSendNotificationDto = {
        type: formData.type.trim() || "General",
        titleAr: formData.titleAr.trim(),
        titleEn: formData.titleEn.trim(),
        bodyAr: formData.bodyAr.trim(),
        bodyEn: formData.bodyEn.trim(),
        sendPush: formData.sendPush,
        payload,
      };
      const result = await sendFn(dto);
      toast.success(
        lang({
          ar: `تم إرسال ${result.notificationsCreated} إشعار بنجاح إلى ${target.labelAr}`,
          en: `Sent ${result.notificationsCreated} notifications successfully to ${target.labelEn}`,
        }),
      );
      setFormData(initialFormState);
      setSelectedTarget(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل إرسال الإشعار",
            en: "Failed to send notification",
          }),
        ),
      );
    } finally {
      setSending(null);
    }
  };

  const t = {
    title: { ar: "إرسال إشعارات", en: "Broadcast Notifications" },
    subtitle: {
      ar: "إرسال إشعارات جماعية لمختلف فئات المستخدمين",
      en: "Send bulk notifications to different user groups",
    },
    back: { ar: "العودة", en: "Back" },
    selectTarget: { ar: "اختر الفئة المستهدفة", en: "Select Target Group" },
    type: { ar: "نوع الإشعار", en: "Notification Type" },
    titleAr: { ar: "العنوان (عربي)", en: "Title (Arabic)" },
    titleEn: { ar: "العنوان (إنجليزي)", en: "Title (English)" },
    titlePlaceholder: {
      ar: "أدخل عنوان الإشعار",
      en: "Enter notification title",
    },
    bodyAr: { ar: "المحتوى (عربي)", en: "Body (Arabic)" },
    bodyEn: { ar: "المحتوى (إنجليزي)", en: "Body (English)" },
    bodyPlaceholder: {
      ar: "أدخل محتوى الإشعار...",
      en: "Enter notification body...",
    },
    sendPush: { ar: "إرسال إشعار فوري (Push)", en: "Send Push Notification" },
    payloadJson: {
      ar: "بيانات إضافية (JSON) - اختياري",
      en: "Payload (JSON) - Optional",
    },
    payloadJsonPlaceholder: {
      ar: '{"targetPage": "offers", "action": "open"}',
      en: '{"targetPage": "offers", "action": "open"}',
    },
    preview: { ar: "معاينة", en: "Preview" },
    sending: { ar: "جاري الإرسال...", en: "Sending..." },
    sendTo: { ar: "إرسال إلى", en: "Send to" },
    characters: { ar: "حرف", en: "characters" },
    targetSelected: { ar: "الفئة المختارة", en: "Selected Target" },
  };

  const selectedTargetData = broadcastTargets.find(
    (t) => t.key === selectedTarget,
  );
  const previewTitle = isAr
    ? formData.titleAr || formData.titleEn
    : formData.titleEn || formData.titleAr;
  const previewBody = isAr
    ? formData.bodyAr || formData.bodyEn
    : formData.bodyEn || formData.bodyAr;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
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
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-rose-600 dark:text-rose-400">
            <BroadcastIcon />
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
      </div>

      {/* Target Selection */}
      <div>
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">
          {lang(t.selectTarget)}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {broadcastTargets.map((target) => (
            <button
              key={target.key}
              onClick={() => setSelectedTarget(target.key)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center",
                selectedTarget === target.key
                  ? `${target.color} border-current shadow-sm scale-[1.02]`
                  : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-sm",
              )}
            >
              <target.icon />
              <span className="text-xs font-semibold">
                {isAr ? target.labelAr : target.labelEn}
              </span>
              <span className="text-[10px] opacity-70 hidden sm:block">
                {isAr ? target.descriptionAr : target.descriptionEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {selectedTarget && selectedTargetData && (
        <div className="space-y-5">
          {/* Selected Target Badge */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium",
              selectedTargetData.color,
            )}
          >
            <selectedTargetData.icon />
            <span>
              {lang(t.targetSelected)}:{" "}
              {isAr ? selectedTargetData.labelAr : selectedTargetData.labelEn}
            </span>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.type)} <span className="text-error-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm cursor-pointer"
            >
              <option value="General">{isAr ? "عام" : "General"}</option>
              <option value="Promotion">
                {isAr ? "عرض ترويجي" : "Promotion"}
              </option>
              <option value="SystemAlert">
                {isAr ? "تنبيه نظام" : "System Alert"}
              </option>
              <option value="Announcement">
                {isAr ? "إعلان" : "Announcement"}
              </option>
            </select>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  {lang(t.titleAr)} <span className="text-error-500">*</span>
                </label>
                <span className="text-[10px] text-surface-400">
                  {formData.titleAr.length} {lang(t.characters)}
                </span>
              </div>
              <input
                type="text"
                value={formData.titleAr}
                onChange={(e) =>
                  setFormData({ ...formData, titleAr: e.target.value })
                }
                placeholder={lang(t.titlePlaceholder)}
                className="w-full rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  {lang(t.titleEn)} <span className="text-error-500">*</span>
                </label>
                <span className="text-[10px] text-surface-400">
                  {formData.titleEn.length} {lang(t.characters)}
                </span>
              </div>
              <input
                type="text"
                value={formData.titleEn}
                onChange={(e) =>
                  setFormData({ ...formData, titleEn: e.target.value })
                }
                placeholder={lang(t.titlePlaceholder)}
                className="w-full rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                dir="ltr"
              />
            </div>
          </div>

          {/* Bodies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  {lang(t.bodyAr)} <span className="text-error-500">*</span>
                </label>
                <span className="text-[10px] text-surface-400">
                  {formData.bodyAr.length} {lang(t.characters)}
                </span>
              </div>
              <textarea
                value={formData.bodyAr}
                onChange={(e) =>
                  setFormData({ ...formData, bodyAr: e.target.value })
                }
                placeholder={lang(t.bodyPlaceholder)}
                rows={4}
                className="w-full rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  {lang(t.bodyEn)} <span className="text-error-500">*</span>
                </label>
                <span className="text-[10px] text-surface-400">
                  {formData.bodyEn.length} {lang(t.characters)}
                </span>
              </div>
              <textarea
                value={formData.bodyEn}
                onChange={(e) =>
                  setFormData({ ...formData, bodyEn: e.target.value })
                }
                placeholder={lang(t.bodyPlaceholder)}
                rows={4}
                className="w-full rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                dir="ltr"
              />
            </div>
          </div>

          {/* Send Push Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.sendPush}
              onChange={(e) =>
                setFormData({ ...formData, sendPush: e.target.checked })
              }
              className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {lang(t.sendPush)}
            </span>
          </label>

          {/* Payload JSON */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.payloadJson)}
            </label>
            <textarea
              value={formData.payloadJson}
              onChange={(e) =>
                setFormData({ ...formData, payloadJson: e.target.value })
              }
              placeholder={lang(t.payloadJsonPlaceholder)}
              rows={3}
              className="w-full rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none font-mono"
              dir="ltr"
            />
          </div>

          {/* Preview */}
          {(previewTitle || previewBody) && (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <h3 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  {lang(t.preview)}
                </h3>
              </div>
              <div className="p-5">
                <div className="max-w-sm mx-auto rounded-2xl bg-surface-50 dark:bg-surface-800 p-4 border border-surface-200 dark:border-surface-700 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <BroadcastIcon />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                        {previewTitle ||
                          (isAr ? "عنوان الإشعار" : "Notification Title")}
                      </p>
                      <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
                        {previewBody ||
                          (isAr ? "محتوى الإشعار..." : "Notification body...")}
                      </p>
                      <p className="text-[10px] text-surface-400 mt-2">
                        {isAr ? "الآن" : "Now"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!!sending}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20",
            )}
          >
            <SendIcon />
            {sending === selectedTarget
              ? lang(t.sending)
              : `${lang(t.sendTo)} ${isAr ? selectedTargetData.labelAr : selectedTargetData.labelEn}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default BroadcastPage;