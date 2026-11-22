import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/config/admin.api";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminAreas } from "@shared/hooks/useAdminAreas";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type {
  AreaDto,
  CityDto,
  CreateAreaDto,
  UpdateAreaDto,
  UpdateCityDto,
} from "@shared/types";

// ============================================
// Icons
// ============================================

const CityIcon = () => (
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
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0v3.75m0 0v3.75m0 0V21"
    />
  </svg>
);

const LocationIcon = () => (
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
      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);

const AreaIcon = () => (
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
      d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
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

// ============================================
// Helpers
// ============================================

interface CityFormState {
  nameAr: string;
  nameEn: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  maxCustomerDistanceKm: number;
  isActive: boolean;
}

interface AreaFormState {
  name: string;
  description: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  maxCustomerDistanceKm: number;
  supervisorFixedFee: number;
  isActive: boolean;
}

function toCityFormState(data: CityDto): CityFormState {
  return {
    nameAr: data.nameAr ?? "",
    nameEn: data.nameEn ?? "",
    centerLatitude: data.centerLatitude,
    centerLongitude: data.centerLongitude,
    radiusKm: data.radiusKm,
    maxCustomerDistanceKm: data.maxCustomerDistanceKm,
    isActive: data.isActive,
  };
}

const initialAreaFormState: AreaFormState = {
  name: "",
  description: "",
  centerLatitude: 0,
  centerLongitude: 0,
  radiusKm: 5,
  maxCustomerDistanceKm: 10,
  supervisorFixedFee: 0,
  isActive: true,
};

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
// CityDetailsPage Component
// ============================================

export const CityDetailsPage: React.FC = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    areas,
    loading: areasLoading,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
  } = useAdminAreas();

  const [city, setCity] = useState<CityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteCityConfirm, setDeleteCityConfirm] = useState(false);

  const [formData, setFormData] = useState<CityFormState>({
    nameAr: "",
    nameEn: "",
    centerLatitude: 0,
    centerLongitude: 0,
    radiusKm: 10,
    maxCustomerDistanceKm: 5,
    isActive: true,
  });

  // Area modals state
  const [showCreateAreaModal, setShowCreateAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDto | null>(null);
  const [deletingArea, setDeletingArea] = useState<AreaDto | null>(null);
  const [areaForm, setAreaForm] = useState<AreaFormState>(initialAreaFormState);

  const fetchData = useCallback(async () => {
    if (!cityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cityData] = await Promise.all([
        adminApi.getCity(cityId),
        fetchAreas().catch(() => [] as AreaDto[]),
      ]);
      setCity(cityData);
      setFormData(toCityFormState(cityData));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل بيانات المدينة", en: "Failed to load city" }),
        ),
      );
      navigate("/dashboard/cities");
    } finally {
      setLoading(false);
    }
  }, [cityId, fetchAreas, navigate, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // City Handlers
  // ============================================

  const handleSave = async () => {
    if (!cityId || !city) return;
    setSaving(true);
    try {
      const dto: UpdateCityDto = {
        nameAr: formData.nameAr.trim() || null,
        nameEn: formData.nameEn.trim() || null,
        centerLatitude: formData.centerLatitude,
        centerLongitude: formData.centerLongitude,
        radiusKm: formData.radiusKm,
        maxCustomerDistanceKm: formData.maxCustomerDistanceKm,
        isActive: formData.isActive,
      };
      const updated = await adminApi.updateCity(cityId, dto);
      setCity(updated);
      setFormData(toCityFormState(updated));
      toast.success(
        lang({ ar: "تم تحديث المدينة بنجاح", en: "City updated successfully" }),
      );
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث المدينة", en: "Failed to update city" }),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCityActive = async () => {
    if (!cityId || !city) return;
    setActionLoading("toggle-city");
    try {
      const updated = await adminApi.setCityActive(cityId, {
        isActive: !city.isActive,
      });
      setCity(updated);
      setFormData(toCityFormState(updated));
      toast.success(
        lang({ ar: "تم تحديث حالة المدينة", en: "City status updated" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث الحالة", en: "Failed to update status" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCity = async () => {
    if (!cityId) return;
    setActionLoading("delete-city");
    try {
      await adminApi.deleteCity(cityId);
      toast.success(
        lang({ ar: "تم حذف المدينة بنجاح", en: "City deleted successfully" }),
      );
      navigate("/dashboard/cities");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حذف المدينة", en: "Failed to delete city" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // Area Handlers (via useAdminAreas)
  // ============================================

  const openCreateAreaModal = () => {
    setAreaForm({
      ...initialAreaFormState,
      centerLatitude: city?.centerLatitude ?? 0,
      centerLongitude: city?.centerLongitude ?? 0,
    });
    setShowCreateAreaModal(true);
  };

  const openEditAreaModal = (area: AreaDto) => {
    setAreaForm({
      name: area.name ?? "",
      description: area.description ?? "",
      centerLatitude: area.centerLatitude,
      centerLongitude: area.centerLongitude,
      radiusKm: area.radiusKm,
      maxCustomerDistanceKm: city?.maxCustomerDistanceKm ?? 10,
      supervisorFixedFee: 0,
      isActive: area.isActive,
    });
    setEditingArea(area);
  };

  const handleCreateArea = async () => {
    if (!cityId) return;
    if (!areaForm.name.trim()) {
      toast.error(
        lang({ ar: "اسم المنطقة مطلوب", en: "Area name is required" }),
      );
      return;
    }
    setActionLoading("create-area");
    try {
      const dto: CreateAreaDto = {
        cityId,
        name: areaForm.name.trim(),
        description: areaForm.description.trim() || null,
        centerLatitude: areaForm.centerLatitude,
        centerLongitude: areaForm.centerLongitude,
        radiusKm: areaForm.radiusKm,
        maxCustomerDistanceKm: areaForm.maxCustomerDistanceKm,
        supervisorFixedFee: areaForm.supervisorFixedFee,
      };
      await createArea(dto);
      setCity((prev) =>
        prev ? { ...prev, areaCount: prev.areaCount + 1 } : prev,
      );
      toast.success(
        lang({ ar: "تم إنشاء المنطقة بنجاح", en: "Area created successfully" }),
      );
      setShowCreateAreaModal(false);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل إنشاء المنطقة", en: "Failed to create area" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditArea = async () => {
    if (!cityId || !editingArea) return;
    if (!areaForm.name.trim()) {
      toast.error(
        lang({ ar: "اسم المنطقة مطلوب", en: "Area name is required" }),
      );
      return;
    }
    setActionLoading("edit-area");
    try {
      const dto: UpdateAreaDto = {
        cityId,
        name: areaForm.name.trim(),
        description: areaForm.description.trim() || null,
        centerLatitude: areaForm.centerLatitude,
        centerLongitude: areaForm.centerLongitude,
        radiusKm: areaForm.radiusKm,
        maxCustomerDistanceKm: areaForm.maxCustomerDistanceKm,
        supervisorFixedFee: areaForm.supervisorFixedFee,
        isActive: areaForm.isActive,
      };
      await updateArea(editingArea.id, dto);
      toast.success(
        lang({ ar: "تم تحديث المنطقة بنجاح", en: "Area updated successfully" }),
      );
      setEditingArea(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث المنطقة", en: "Failed to update area" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteArea = async () => {
    if (!deletingArea) return;
    setActionLoading(`delete-area-${deletingArea.id}`);
    try {
      await deleteArea(deletingArea.id);
      setCity((prev) =>
        prev ? { ...prev, areaCount: Math.max(0, prev.areaCount - 1) } : prev,
      );
      toast.success(
        lang({ ar: "تم حذف المنطقة بنجاح", en: "Area deleted successfully" }),
      );
      setDeletingArea(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حذف المنطقة", en: "Failed to delete area" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const displayName = (c: { nameAr?: string | null; nameEn?: string | null }) =>
    isAr ? c.nameAr || c.nameEn || "—" : c.nameEn || c.nameAr || "—";

  const t = {
    back: { ar: "العودة للمدن", en: "Back to Cities" },
    edit: { ar: "تعديل", en: "Edit" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    save: { ar: "حفظ التغييرات", en: "Save Changes" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },
    nameAr: { ar: "اسم المدينة (عربي)", en: "City Name (Arabic)" },
    nameEn: { ar: "اسم المدينة (إنجليزي)", en: "City Name (English)" },
    latitude: { ar: "خط العرض", en: "Latitude" },
    longitude: { ar: "خط الطول", en: "Longitude" },
    radius: { ar: "نطاق التوصيل", en: "Delivery Radius" },
    maxDistance: { ar: "أقصى مسافة للعميل", en: "Max Customer Distance" },
    status: { ar: "الحالة", en: "Status" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    toggleActive: { ar: "تبديل الحالة", en: "Toggle Active" },
    deleteCity: { ar: "حذف المدينة", en: "Delete City" },
    deleteCityConfirm: {
      ar: "هل أنت متأكد من حذف هذه المدينة؟ لا يمكن التراجع عن هذا الإجراء.",
      en: "Are you sure you want to delete this city? This action cannot be undone.",
    },
    areaCount: { ar: "عدد المناطق", en: "Areas" },
    storeCount: { ar: "عدد المتاجر", en: "Stores" },
    areasTitle: { ar: "المناطق", en: "Areas" },
    addArea: { ar: "إضافة منطقة للمدينة", en: "Add Area" },
    createAreaTitle: { ar: "إضافة منطقة جديدة", en: "Add New Area" },
    editAreaTitle: { ar: "تعديل المنطقة", en: "Edit Area" },
    deleteAreaTitle: { ar: "حذف المنطقة", en: "Delete Area" },
    deleteAreaConfirm: {
      ar: "هل أنت متأكد من حذف هذه المنطقة؟",
      en: "Are you sure you want to delete this area?",
    },
    areaName: { ar: "اسم المنطقة", en: "Area Name" },
    description: { ar: "الوصف", en: "Description" },
    supervisorFixedFee: {
      ar: "الرسوم الثابتة للمشرف",
      en: "Supervisor Fixed Fee",
    },
    noAreas: { ar: "لا توجد مناطق", en: "No areas found" },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    km: { ar: "كم", en: "km" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "المدينة غير موجودة", en: "City not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/cities")}
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
        onClick={() => navigate("/dashboard/cities")}
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-info-500 to-info-600 flex items-center justify-center shadow-lg shadow-info-500/20 flex-shrink-0">
            <CityIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {displayName(city)}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.radius)}: {city.radiusKm} {lang(t.km)}
            </p>
          </div>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleCityActive}
              disabled={actionLoading === "toggle-city"}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
            >
              {actionLoading === "toggle-city"
                ? lang(t.processing)
                : lang(t.toggleActive)}
            </button>
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
            <button
              onClick={() => setDeleteCityConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 border border-error-200 dark:border-error-900/50 hover:bg-error-100 dark:hover:bg-error-950/50 transition-colors"
            >
              {lang(t.deleteCity)}
            </button>
          </div>
        )}
      </div>

      {/* City Info Card */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.nameAr)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="rtl"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {city.nameAr || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.nameEn)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {city.nameEn || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.radius)}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={formData.radiusKm || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      radiusKm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {city.radiusKm} {lang(t.km)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.maxDistance)}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.maxCustomerDistanceKm || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxCustomerDistanceKm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {city.maxCustomerDistanceKm} {lang(t.km)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.latitude)}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="any"
                  value={formData.centerLatitude || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      centerLatitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              ) : (
                <p className="text-surface-700 dark:text-surface-300 font-mono text-sm flex items-center gap-1.5">
                  <LocationIcon />
                  {city.centerLatitude.toFixed(6)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.longitude)}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="any"
                  value={formData.centerLongitude || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      centerLongitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              ) : (
                <p className="text-surface-700 dark:text-surface-300 font-mono text-sm flex items-center gap-1.5">
                  <LocationIcon />
                  {city.centerLongitude.toFixed(6)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.status)}
              </label>
              {isEditing ? (
                <label className="inline-flex items-center gap-2.5 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {formData.isActive ? lang(t.active) : lang(t.inactive)}
                  </span>
                </label>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                    city.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      city.isActive ? "bg-emerald-500" : "bg-surface-400",
                    )}
                  />
                  {city.isActive ? lang(t.active) : lang(t.inactive)}
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.areaCount)} / {lang(t.storeCount)}
              </label>
              <p className="text-surface-700 dark:text-surface-300 text-sm">
                {city.areaCount} / {city.storeCount}
              </p>
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
                  setIsEditing(false);
                  setFormData(toCityFormState(city));
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Areas Management Section (via useAdminAreas) */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <AreaIcon />
              {lang(t.areasTitle)} ({areas.length})
            </h3>
            <button
              onClick={openCreateAreaModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-sm"
            >
              <PlusIcon />
              {lang(t.addArea)}
            </button>
          </div>

          {areasLoading ? (
            <div className="py-8 flex justify-center">
              <PageLoader variant="inline" message={lang(t.loading)} />
            </div>
          ) : areas.length === 0 ? (
            <div className="text-center py-8 text-sm text-surface-500 dark:text-surface-400">
              {lang(t.noAreas)}
            </div>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => navigate(`/dashboard/areas/${area.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700/70 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                      {area.name || "—"}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {lang(t.radius)}: {area.radiusKm} {lang(t.km)} •{" "}
                      {area.centerLatitude.toFixed(4)},{" "}
                      {area.centerLongitude.toFixed(4)}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        area.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400",
                      )}
                    >
                      {area.isActive ? lang(t.active) : lang(t.inactive)}
                    </span>
                    <button
                      onClick={() => openEditAreaModal(area)}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline px-1.5"
                    >
                      {lang(t.edit)}
                    </button>
                    <button
                      onClick={() => setDeletingArea(area)}
                      className="text-xs text-error-600 dark:text-error-400 hover:underline px-1.5"
                    >
                      {isAr ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Area Modal */}
      {(showCreateAreaModal || editingArea) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowCreateAreaModal(false);
              setEditingArea(null);
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {editingArea
                ? lang(t.editAreaTitle)
                : lang(t.createAreaTitle)}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.areaName)} <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={areaForm.name}
                  onChange={(e) =>
                    setAreaForm({ ...areaForm, name: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.description)}
                </label>
                <textarea
                  value={areaForm.description}
                  onChange={(e) =>
                    setAreaForm({ ...areaForm, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.latitude)}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={areaForm.centerLatitude || ""}
                    onChange={(e) =>
                      setAreaForm({
                        ...areaForm,
                        centerLatitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.longitude)}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={areaForm.centerLongitude || ""}
                    onChange={(e) =>
                      setAreaForm({
                        ...areaForm,
                        centerLongitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.radius)}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={areaForm.radiusKm || ""}
                    onChange={(e) =>
                      setAreaForm({
                        ...areaForm,
                        radiusKm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.maxDistance)}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={areaForm.maxCustomerDistanceKm || ""}
                    onChange={(e) =>
                      setAreaForm({
                        ...areaForm,
                        maxCustomerDistanceKm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.supervisorFixedFee)}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={areaForm.supervisorFixedFee}
                  onChange={(e) =>
                    setAreaForm({
                      ...areaForm,
                      supervisorFixedFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              {editingArea && (
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={areaForm.isActive}
                    onChange={(e) =>
                      setAreaForm({ ...areaForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {lang(t.active)}
                  </span>
                </label>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setShowCreateAreaModal(false);
                  setEditingArea(null);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={editingArea ? handleEditArea : handleCreateArea}
                disabled={
                  actionLoading === "create-area" ||
                  actionLoading === "edit-area"
                }
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {actionLoading === "create-area" ||
                actionLoading === "edit-area"
                  ? lang(t.processing)
                  : lang(t.save)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete City / Area Confirmation */}
      {(deleteCityConfirm || deletingArea) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setDeleteCityConfirm(false);
              setDeletingArea(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {deletingArea ? lang(t.deleteAreaTitle) : lang(t.deleteCity)}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 mb-4">
              {deletingArea
                ? lang(t.deleteAreaConfirm)
                : lang(t.deleteCityConfirm)}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteCityConfirm(false);
                  setDeletingArea(null);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={deletingArea ? handleDeleteArea : handleDeleteCity}
                disabled={
                  actionLoading === "delete-city" ||
                  (deletingArea
                    ? actionLoading === `delete-area-${deletingArea.id}`
                    : false)
                }
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading ? lang(t.processing) : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityDetailsPage;