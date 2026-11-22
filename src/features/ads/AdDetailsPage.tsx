import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminAds } from "@shared/hooks/useAdminAds";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { AdDto, UpdateAdDto } from "@shared/types";

// ============================================
// Icons
// ============================================

const AdIcon = () => (
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
      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
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

const EyeIcon = () => (
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
);

const ClickIcon = () => (
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
      d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
    />
  </svg>
);

const LinkIcon = () => (
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
      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
    />
  </svg>
);

// ============================================
// Helpers
// ============================================

interface AdFormState {
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  type: string;
  placement: string;
  targetStoreId: string;
  validFrom: string;
  validTo: string;
  displayOrder: number;
  hexCode: string;
}

function toFormState(data: AdDto): AdFormState {
  return {
    title: data.title ?? "",
    description: data.description ?? "",
    imageUrl: data.imageUrl ?? "",
    targetUrl: data.targetUrl ?? "",
    type: data.type ?? "",
    placement: data.placement ?? "Home",
    targetStoreId: data.targetStoreId ?? "",
    validFrom: data.validFrom?.slice(0, 16) ?? "",
    validTo: data.validTo?.slice(0, 16) ?? "",
    displayOrder: data.displayOrder ?? 0,
    hexCode: data.hexCode ?? "",
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// AdDetailsPage Component
// ============================================

export const AdDetailsPage: React.FC = () => {
  const { adId } = useParams<{ adId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const { fetchAdById, updateAd, deleteAd, toggleAdActive } = useAdminAds();

  const [ad, setAd] = useState<AdDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<AdFormState>({
    title: "",
    description: "",
    imageUrl: "",
    targetUrl: "",
    type: "",
    placement: "Home",
    targetStoreId: "",
    validFrom: "",
    validTo: "",
    displayOrder: 0,
    hexCode: "",
  });

  const fetchData = useCallback(async () => {
    if (!adId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAdById(adId);
      setAd(data);
      setFormData(toFormState(data));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل الإعلان", en: "Failed to load ad" }),
        ),
      );
      navigate("/dashboard/ads");
    } finally {
      setLoading(false);
    }
  }, [adId, fetchAdById, navigate, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!adId || !ad) return;
    setSaving(true);
    try {
      const payload: UpdateAdDto = {
        title: formData.title.trim() || null,
        description: formData.description.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        targetUrl: formData.targetUrl.trim() || null,
        type: formData.type.trim() || null,
        placement: formData.placement.trim() || null,
        targetStoreId: formData.targetStoreId.trim() || null,
        validFrom: formData.validFrom || ad.validFrom,
        validTo: formData.validTo || ad.validTo,
        displayOrder: formData.displayOrder,
        hexCode: formData.hexCode.trim() || null,
        isActive: ad.isActive,
      };
      const updated = await updateAd(adId, payload);
      setAd(updated);
      setFormData(toFormState(updated));
      toast.success(
        lang({ ar: "تم تحديث الإعلان بنجاح", en: "Ad updated successfully" }),
      );
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث الإعلان", en: "Failed to update ad" }),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!adId) return;
    setActionLoading("toggle");
    try {
      const updated = await toggleAdActive(adId);
      setAd(updated);
      setFormData(toFormState(updated));
      toast.success(
        lang({ ar: "تم تحديث حالة الإعلان", en: "Ad status updated" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث حالة الإعلان", en: "Failed to update status" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!adId) return;
    setActionLoading("delete");
    try {
      await deleteAd(adId);
      toast.success(
        lang({ ar: "تم حذف الإعلان بنجاح", en: "Ad deleted successfully" }),
      );
      navigate("/dashboard/ads");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حذف الإعلان", en: "Failed to delete ad" }),
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

  const t = {
    back: { ar: "العودة للإعلانات", en: "Back to Ads" },
    details: { ar: "تفاصيل الإعلان", en: "Ad Details" },
    edit: { ar: "تعديل", en: "Edit" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    save: { ar: "حفظ التغييرات", en: "Save Changes" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },
    titleField: { ar: "العنوان", en: "Title" },
    description: { ar: "الوصف", en: "Description" },
    imageUrl: { ar: "رابط الصورة", en: "Image URL" },
    targetUrl: { ar: "رابط الهدف", en: "Target URL" },
    type: { ar: "النوع", en: "Type" },
    placement: { ar: "مكان الظهور", en: "Placement" },
    targetStoreId: { ar: "المتجر المستهدف", en: "Target Store" },
    hexCode: { ar: "لون الخلفية", en: "Color Hex" },
    validFrom: { ar: "صالح من", en: "Valid From" },
    validTo: { ar: "صالح حتى", en: "Valid To" },
    displayOrder: { ar: "ترتيب العرض", en: "Display Order" },
    status: { ar: "الحالة", en: "Status" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    views: { ar: "المشاهدات", en: "Views" },
    clicks: { ar: "النقرات", en: "Clicks" },
    toggleActive: { ar: "تبديل الحالة", en: "Toggle Active" },
    delete: { ar: "حذف الإعلان", en: "Delete Ad" },
    deleting: { ar: "جاري الحذف...", en: "Deleting..." },
    toggling: { ar: "جاري التبديل...", en: "Toggling..." },
    deleteTitle: { ar: "حذف الإعلان", en: "Delete Ad" },
    deleteConfirm: {
      ar: "هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.",
      en: "Are you sure you want to delete this ad? This action cannot be undone.",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    openLink: { ar: "فتح الرابط", en: "Open Link" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    noDescription: { ar: "لا يوجد وصف", en: "No description" },
    period: { ar: "الفترة", en: "Period" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "الإعلان غير موجود", en: "Ad not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/ads")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {lang(t.back)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/ads")}
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20 flex-shrink-0">
            <AdIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {ad.title || "—"}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {ad.placement || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
              ad.isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                ad.isActive ? "bg-emerald-500" : "bg-surface-400",
              )}
            />
            {ad.isActive ? lang(t.active) : lang(t.inactive)}
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
              {lang(t.edit)}
            </button>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {ad.imageUrl && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden h-48 sm:h-64 bg-surface-100 dark:bg-surface-800">
          <img
            src={ad.imageUrl}
            alt={ad.title || ""}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Details Card */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.titleField)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {ad.title || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.type)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-700 dark:text-surface-300">
                  {ad.type || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.placement)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.placement}
                  onChange={(e) =>
                    setFormData({ ...formData, placement: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-700 dark:text-surface-300">
                  {ad.placement || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.displayOrder)}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-700 dark:text-surface-300">
                  {ad.displayOrder}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.imageUrl)}
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              ) : (
                <p className="text-surface-700 dark:text-surface-300 text-sm truncate">
                  {ad.imageUrl || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.targetUrl)}
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, targetUrl: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-surface-700 dark:text-surface-300 text-sm truncate">
                    {ad.targetUrl || "—"}
                  </p>
                  {ad.targetUrl && (
                    <a
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 flex-shrink-0"
                      title={lang(t.openLink)}
                    >
                      <LinkIcon />
                    </a>
                  )}
                </div>
              )}
            </div>
            {(isEditing || ad.targetStoreId) && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.targetStoreId)}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.targetStoreId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetStoreId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                ) : (
                  ad.targetStoreId && (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/stores/${ad.targetStoreId}`)
                      }
                      className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                    >
                      {ad.targetStoreName ||
                        `${ad.targetStoreId.slice(0, 8)}...`}
                    </button>
                  )
                )}
              </div>
            )}
            {(isEditing || ad.hexCode) && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.hexCode)}
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(formData.hexCode)
                          ? formData.hexCode
                          : "#000000"
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, hexCode: e.target.value })
                      }
                      className="w-10 h-10 rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={formData.hexCode}
                      onChange={(e) =>
                        setFormData({ ...formData, hexCode: e.target.value })
                      }
                      placeholder="#FF5733"
                      className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm font-mono"
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {ad.hexCode && (
                      <span
                        className="w-4 h-4 rounded border border-surface-200 dark:border-surface-700 flex-shrink-0"
                        style={{ backgroundColor: ad.hexCode }}
                      />
                    )}
                    <span className="text-surface-700 dark:text-surface-300 text-sm font-mono">
                      {ad.hexCode || "—"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.description)}
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
              />
            ) : (
              <p className="text-surface-700 dark:text-surface-300 text-sm">
                {ad.description || lang(t.noDescription)}
              </p>
            )}
          </div>

          {/* Period */}
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
              {lang(t.period)}
            </label>
            <div className="flex items-center gap-3 text-sm">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-xs text-surface-500 mb-1">
                      {lang(t.validFrom)}
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) =>
                        setFormData({ ...formData, validFrom: e.target.value })
                      }
                      className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-500 mb-1">
                      {lang(t.validTo)}
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validTo}
                      onChange={(e) =>
                        setFormData({ ...formData, validTo: e.target.value })
                      }
                      className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                    <CalendarIcon />
                    {formatDate(ad.validFrom)}
                  </span>
                  <span className="text-surface-400">—</span>
                  <span className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                    <CalendarIcon />
                    {formatDate(ad.validTo)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 text-center">
                <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.views)}
                </p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center justify-center gap-2">
                  <EyeIcon />
                  {ad.viewCount || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 text-center">
                <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                  {lang(t.clicks)}
                </p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center justify-center gap-2">
                  <ClickIcon />
                  {ad.clickCount || 0}
                </p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
              >
                {saving ? lang(t.saving) : lang(t.save)}
              </button>
              <button
                onClick={() => {
                  setFormData(toFormState(ad));
                  setIsEditing(false);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!isEditing && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {lang({ ar: "إجراءات سريعة", en: "Quick Actions" })}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleToggleActive}
                disabled={actionLoading === "toggle"}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 text-surface-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                  />
                </svg>
                {actionLoading === "toggle"
                  ? lang(t.toggling)
                  : lang(t.toggleActive)}
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-error-200 dark:border-error-900/50 text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
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
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
                {lang(t.delete)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setDeleteConfirm(false)}
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
                  {lang(t.deleteTitle)}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {ad.title || "—"}
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
              {lang(t.deleteConfirm)}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === "delete"}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading === "delete"
                  ? lang(t.deleting)
                  : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdDetailsPage;
