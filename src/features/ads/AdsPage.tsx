import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminAds } from "@shared/hooks/useAdminAds";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { CreateAdDto, UpdateAdDto, AdDto } from "@/shared/types";

type Ad = AdDto;

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

const ImageIcon = () => (
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
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
    />
  </svg>
);

const PlusIcon = () => (
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
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const MoreIcon = () => (
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
      d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
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

const EyeIcon = () => (
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
    className="w-3.5 h-3.5"
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

// ============================================
// AdsPage Component
// ============================================

export const AdsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    ads,
    loading,
    fetchAds,
    createAd,
    updateAd,
    deleteAd,
    toggleAdActive,
  } = useAdminAds();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Ad | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Ad | null>(null);

  const [formData, setFormData] = useState<CreateAdDto>({
    title: "",
    description: "",
    imageUrl: "",
    targetUrl: "",
    type: "",
    placement: "Home",
    targetStoreId: "",
    validFrom: new Date().toISOString().slice(0, 16),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    displayOrder: 0,
    hexCode: "",
  });

  useEffect(() => {
    fetchAds(
      activeFilter === "active"
        ? true
        : activeFilter === "inactive"
          ? false
          : undefined,
    );
  }, [fetchAds, activeFilter]);

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const filteredAds = ads.filter(
    (a) =>
      !searchTerm ||
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      targetUrl: "",
      type: "",
      placement: "Home",
      targetStoreId: "",
      validFrom: new Date().toISOString().slice(0, 16),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
      displayOrder: 0,
      hexCode: "",
    });
  };

  const handleCreate = async () => {
    if (!formData.title?.trim()) {
      toast.error(lang({ ar: "العنوان مطلوب", en: "Title is required" }));
      return;
    }
    setProcessingId("create");
    try {
      await createAd({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        targetUrl: formData.targetUrl?.trim() || undefined,
        type: formData.type?.trim() || undefined,
        placement: formData.placement?.trim() || undefined,
        targetStoreId: formData.targetStoreId?.trim() || undefined,
        hexCode: formData.hexCode?.trim() || undefined,
      });
      toast.success(
        lang({ ar: "تم إنشاء الإعلان بنجاح", en: "Ad created successfully" }),
      );
      setShowCreateModal(false);
      resetForm();
      fetchAds();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = async () => {
    if (!showEditModal || !formData.title?.trim()) return;
    setProcessingId("edit");
    try {
      await updateAd(showEditModal.id, {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        targetUrl: formData.targetUrl?.trim() || undefined,
        type: formData.type?.trim() || undefined,
        placement: formData.placement?.trim() || undefined,
        targetStoreId: formData.targetStoreId?.trim() || undefined,
        hexCode: formData.hexCode?.trim() || undefined,
        isActive: showEditModal.isActive,
      } as UpdateAdDto);
      toast.success(
        lang({ ar: "تم تحديث الإعلان بنجاح", en: "Ad updated successfully" }),
      );
      setShowEditModal(null);
      resetForm();
      fetchAds();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (ad: Ad) => {
    setProcessingId(`toggle-${ad.id}`);
    try {
      await toggleAdActive(ad.id);
      toast.success(
        lang({ ar: "تم تحديث حالة الإعلان", en: "Ad status updated" }),
      );
      fetchAds();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setProcessingId(`delete-${deleteConfirm.id}`);
    try {
      await deleteAd(deleteConfirm.id);
      toast.success(
        lang({ ar: "تم حذف الإعلان بنجاح", en: "Ad deleted successfully" }),
      );
      setDeleteConfirm(null);
      fetchAds();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (ad: Ad) => {
    setFormData({
      title: ad.title || "",
      description: ad.description || "",
      imageUrl: ad.imageUrl || "",
      targetUrl: ad.targetUrl || "",
      type: ad.type || "",
      placement: ad.placement || "Home",
      targetStoreId: ad.targetStoreId || "",
      validFrom: ad.validFrom?.slice(0, 16) || "",
      validTo: ad.validTo?.slice(0, 16) || "",
      displayOrder: ad.displayOrder || 0,
      hexCode: ad.hexCode || "",
    });
    setShowEditModal(ad);
    setOpenMenuId(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const t = {
    title: { ar: "إدارة الإعلانات", en: "Ad Management" },
    subtitle: {
      ar: "عرض وإدارة الإعلانات في التطبيق",
      en: "View and manage in-app advertisements",
    },
    searchPlaceholder: {
      ar: "بحث بعنوان الإعلان...",
      en: "Search by ad title...",
    },
    all: { ar: "الكل", en: "All" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    create: { ar: "إضافة إعلان", en: "Add Ad" },
    titleField: { ar: "العنوان", en: "Title" },
    titlePlaceholder: { ar: "أدخل عنوان الإعلان", en: "Enter ad title" },
    description: { ar: "الوصف", en: "Description" },
    descriptionPlaceholder: {
      ar: "وصف مختصر للإعلان",
      en: "Brief description",
    },
    imageUrl: { ar: "رابط الصورة", en: "Image URL" },
    imageUrlPlaceholder: { ar: "https://...", en: "https://..." },
    targetUrl: { ar: "رابط الهدف", en: "Target URL" },
    targetUrlPlaceholder: { ar: "https://...", en: "https://..." },
    type: { ar: "النوع", en: "Type" },
    typePlaceholder: { ar: "مثل: banner, popup", en: "e.g., banner, popup" },
    placement: { ar: "مكان الظهور", en: "Placement" },
    placementPlaceholder: { ar: "Home, Search...", en: "Home, Search..." },
    targetStoreId: { ar: "معرف المتجر المستهدف", en: "Target Store ID" },
    targetStorePlaceholder: { ar: "اختياري", en: "Optional" },
    validFrom: { ar: "صالح من", en: "Valid From" },
    validTo: { ar: "صالح حتى", en: "Valid To" },
    displayOrder: { ar: "ترتيب العرض", en: "Display Order" },
    hexCode: { ar: "كود اللون (Hex)", en: "Hex Code" },
    hexCodePlaceholder: { ar: "#FFFFFF", en: "#FFFFFF" },
    views: { ar: "مشاهدات", en: "Views" },
    clicks: { ar: "نقرات", en: "Clicks" },
    edit: { ar: "تعديل", en: "Edit" },
    delete: { ar: "حذف", en: "Delete" },
    toggleActive: { ar: "تبديل الحالة", en: "Toggle Active" },
    save: { ar: "حفظ", en: "Save" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    createTitle: { ar: "إضافة إعلان جديد", en: "Create New Ad" },
    editTitle: { ar: "تعديل الإعلان", en: "Edit Ad" },
    deleteTitle: { ar: "حذف الإعلان", en: "Delete Ad" },
    deleteConfirm: {
      ar: "هل أنت متأكد من حذف هذا الإعلان؟",
      en: "Are you sure you want to delete this ad?",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    noAds: { ar: "لا توجد إعلانات", en: "No ads found" },
    noAdsDesc: {
      ar: "لم يتم إضافة أي إعلانات بعد",
      en: "No ads have been added yet",
    },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    period: { ar: "الفترة", en: "Period" },
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
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
        >
          <PlusIcon />
          {lang(t.create)}
        </button>
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
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="">{lang(t.all)}</option>
          <option value="active">{lang(t.active)}</option>
          <option value="inactive">{lang(t.inactive)}</option>
        </select>
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <AdIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noAds)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noAdsDesc)}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
          >
            <PlusIcon />
            {lang(t.create)}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => navigate(`/dashboard/ads/${ad.id}`)}
            >
              {/* Image */}
              <div className="h-36 bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden">
                {ad.imageUrl ? (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title || ""}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ImageIcon />
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {ad.title}
                  </h3>
                  <div
                    className="relative flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === ad.id ? null : ad.id)
                      }
                      className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <MoreIcon />
                    </button>
                    {openMenuId === ad.id && (
                      <div
                        className={cn(
                          "absolute z-20 top-full mt-1 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-fade-in-scale",
                          isAr
                            ? "left-0 origin-top-left"
                            : "right-0 origin-top-right",
                        )}
                      >
                        <button
                          onClick={() => {
                            navigate(`/dashboard/ads/${ad.id}`);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                          <EyeIcon />
                          {lang({ ar: "عرض التفاصيل", en: "View Details" })}
                        </button>
                        <button
                          onClick={() => openEditModal(ad)}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
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
                        <button
                          onClick={() => handleToggleActive(ad)}
                          disabled={processingId === `toggle-${ad.id}`}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
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
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                            />
                          </svg>
                          {lang(t.toggleActive)}
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm(ad);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
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
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                          {lang(t.delete)}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {ad.description && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mb-3">
                    {ad.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400 mb-3">
                  <span className="flex items-center gap-1">
                    <EyeIcon />
                    {ad.viewCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClickIcon />
                    {ad.clickCount || 0}
                  </span>
                </div>

                {/* Period & Status */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                  <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                    <CalendarIcon />
                    {formatDate(ad.validFrom)} — {formatDate(ad.validTo)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      ad.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        ad.isActive ? "bg-emerald-500" : "bg-surface-400",
                      )}
                    />
                    {ad.isActive ? lang(t.active) : lang(t.inactive)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(null);
              resetForm();
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {showEditModal ? lang(t.editTitle) : lang(t.createTitle)}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.titleField)} <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={lang(t.titlePlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.description)}
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={lang(t.descriptionPlaceholder)}
                  rows={2}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.imageUrl)}
                </label>
                <input
                  type="url"
                  value={formData.imageUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder={lang(t.imageUrlPlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.targetUrl)}
                </label>
                <input
                  type="url"
                  value={formData.targetUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, targetUrl: e.target.value })
                  }
                  placeholder={lang(t.targetUrlPlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.type)}
                  </label>
                  <input
                    type="text"
                    value={formData.type || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    placeholder={lang(t.typePlaceholder)}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.placement)}
                  </label>
                  <input
                    type="text"
                    value={formData.placement || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, placement: e.target.value })
                    }
                    placeholder={lang(t.placementPlaceholder)}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.hexCode)}
                </label>
                <input
                  type="text"
                  value={formData.hexCode || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, hexCode: e.target.value })
                  }
                  placeholder={lang(t.hexCodePlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.validFrom)}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom?.toString() || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.validTo)}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validTo?.toString() || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, validTo: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.displayOrder)}
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.targetStoreId)}
                  </label>
                  <input
                    type="text"
                    value={formData.targetStoreId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetStoreId: e.target.value,
                      })
                    }
                    placeholder={lang(t.targetStorePlaceholder)}
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                  resetForm();
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={showEditModal ? handleEdit : handleCreate}
                disabled={!!processingId}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {processingId ? lang(t.processing) : lang(t.save)}
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
            onClick={() => setDeleteConfirm(null)}
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
                  {deleteConfirm.title}
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
              {lang(t.deleteConfirm)}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleDelete}
                disabled={processingId === `delete-${deleteConfirm.id}`}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {processingId === `delete-${deleteConfirm.id}`
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

export default AdsPage;
