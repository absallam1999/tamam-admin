import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminAreas } from "@shared/hooks/useAdminAreas";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { AreaDto, CreateAreaDto, UpdateAreaDto } from "@shared/types";

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

const AreaIcon = () => (
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

const SupervisorIcon = () => (
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

// ============================================
// Helpers
// ============================================

interface AreaFormState {
  cityId: string;
  name: string;
  description: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  maxCustomerDistanceKm: number;
  supervisorFixedFee: number;
  isActive: boolean;
}

const initialFormState: AreaFormState = {
  cityId: "",
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
  return fallback;
}

// ============================================
// AreasPage Component
// ============================================

export const AreasPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  const { areas, loading, fetchAreas, createArea, updateArea, deleteArea } =
    useAdminAreas();

  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<AreaDto | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AreaDto | null>(null);

  const [formData, setFormData] = useState<AreaFormState>(initialFormState);

  useEffect(() => {
    fetchAreas().catch((err: unknown) => {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل المناطق", en: "Failed to load areas" }),
        ),
      );
    });
  }, [fetchAreas]);

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const filteredAreas = areas.filter(
    (a) =>
      !searchTerm ||
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const handleCreate = async () => {
    if (!formData.cityId.trim()) {
      toast.error(
        lang({ ar: "معرف المدينة مطلوب", en: "City ID is required" }),
      );
      return;
    }
    if (!formData.name.trim()) {
      toast.error(
        lang({ ar: "اسم المنطقة مطلوب", en: "Area name is required" }),
      );
      return;
    }
    setProcessingId("create");
    try {
      const dto: CreateAreaDto = {
        cityId: formData.cityId.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        centerLatitude: formData.centerLatitude,
        centerLongitude: formData.centerLongitude,
        radiusKm: formData.radiusKm,
        maxCustomerDistanceKm: formData.maxCustomerDistanceKm,
        supervisorFixedFee: formData.supervisorFixedFee,
      };
      await createArea(dto);
      toast.success(
        lang({ ar: "تم إنشاء المنطقة بنجاح", en: "Area created successfully" }),
      );
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل إنشاء المنطقة", en: "Failed to create area" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = async () => {
    if (!showEditModal) return;
    if (!formData.cityId.trim()) {
      toast.error(
        lang({ ar: "معرف المدينة مطلوب", en: "City ID is required" }),
      );
      return;
    }
    if (!formData.name.trim()) {
      toast.error(
        lang({ ar: "اسم المنطقة مطلوب", en: "Area name is required" }),
      );
      return;
    }
    setProcessingId("edit");
    try {
      const dto: UpdateAreaDto = {
        cityId: formData.cityId.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        centerLatitude: formData.centerLatitude,
        centerLongitude: formData.centerLongitude,
        radiusKm: formData.radiusKm,
        maxCustomerDistanceKm: formData.maxCustomerDistanceKm,
        supervisorFixedFee: formData.supervisorFixedFee,
        isActive: formData.isActive,
      };
      await updateArea(showEditModal.id, dto);
      toast.success(
        lang({ ar: "تم تحديث المنطقة بنجاح", en: "Area updated successfully" }),
      );
      setShowEditModal(null);
      resetForm();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث المنطقة", en: "Failed to update area" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setProcessingId(`delete-${deleteConfirm.id}`);
    try {
      await deleteArea(deleteConfirm.id);
      toast.success(
        lang({ ar: "تم حذف المنطقة بنجاح", en: "Area deleted successfully" }),
      );
      setDeleteConfirm(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل حذف المنطقة", en: "Failed to delete area" }),
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (area: AreaDto) => {
    setFormData({
      cityId: "",
      name: area.name ?? "",
      description: area.description ?? "",
      centerLatitude: area.centerLatitude,
      centerLongitude: area.centerLongitude,
      radiusKm: area.radiusKm,
      maxCustomerDistanceKm: 10,
      supervisorFixedFee: 0,
      isActive: area.isActive,
    });
    setShowEditModal(area);
    setOpenMenuId(null);
  };

  const t = {
    title: { ar: "إدارة المناطق", en: "Area Management" },
    subtitle: {
      ar: "عرض وإدارة مناطق التوصيل والمشرفين",
      en: "View and manage delivery areas and supervisors",
    },
    searchPlaceholder: {
      ar: "بحث باسم المنطقة...",
      en: "Search by area name...",
    },
    create: { ar: "إضافة منطقة", en: "Add Area" },
    supervisors: { ar: "المشرفين", en: "Supervisors" },
    supervisorsCount: { ar: "مشرفين", en: "Supervisors" },
    driversCount: { ar: "سائقين", en: "Drivers" },
    cityId: { ar: "معرف المدينة", en: "City ID" },
    cityIdPlaceholder: {
      ar: "أدخل معرف المدينة (UUID)",
      en: "Enter city UUID",
    },
    name: { ar: "اسم المنطقة", en: "Area Name" },
    namePlaceholder: { ar: "أدخل اسم المنطقة", en: "Enter area name" },
    description: { ar: "الوصف", en: "Description" },
    descriptionPlaceholder: {
      ar: "وصف مختصر للمنطقة",
      en: "Brief description",
    },
    latitude: { ar: "خط العرض", en: "Latitude" },
    longitude: { ar: "خط الطول", en: "Longitude" },
    radius: { ar: "نطاق التوصيل (كم)", en: "Delivery Radius (km)" },
    maxCustomerDistance: {
      ar: "أقصى مسافة للعميل (كم)",
      en: "Max Customer Distance (km)",
    },
    supervisorFixedFee: {
      ar: "الرسوم الثابتة للمشرف",
      en: "Supervisor Fixed Fee",
    },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    edit: { ar: "تعديل", en: "Edit" },
    delete: { ar: "حذف", en: "Delete" },
    save: { ar: "حفظ", en: "Save" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    createTitle: { ar: "إضافة منطقة جديدة", en: "Add New Area" },
    editTitle: { ar: "تعديل المنطقة", en: "Edit Area" },
    deleteTitle: { ar: "حذف المنطقة", en: "Delete Area" },
    deleteConfirm: {
      ar: "هل أنت متأكد من حذف هذه المنطقة؟",
      en: "Are you sure you want to delete this area?",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    noAreas: { ar: "لا توجد مناطق", en: "No areas found" },
    noAreasDesc: {
      ar: "لم يتم إضافة أي مناطق بعد",
      en: "No areas have been added yet",
    },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    km: { ar: "كم", en: "km" },
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard/areas/supervisors")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
          >
            <SupervisorIcon />
            {lang(t.supervisors)}
          </button>
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

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" message={lang(t.loading)} />
        </div>
      ) : filteredAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <AreaIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noAreas)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noAreasDesc)}
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
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => navigate(`/dashboard/areas/${area.id}`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <AreaIcon />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                        {area.name || "—"}
                      </h3>
                      {area.description && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                          {area.description}
                        </p>
                      )}
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                        {lang(t.radius)}: {area.radiusKm} {lang(t.km)}
                      </p>
                    </div>
                  </div>
                  <div
                    className="relative flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === area.id ? null : area.id)
                      }
                      className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <MoreIcon />
                    </button>
                    {openMenuId === area.id && (
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
                            navigate(`/dashboard/areas/${area.id}`);
                            setOpenMenuId(null);
                          }}
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
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                          {lang({ ar: "عرض التفاصيل", en: "View Details" })}
                        </button>
                        <button
                          onClick={() => openEditModal(area)}
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
                          onClick={() => {
                            setDeleteConfirm(area);
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
                <div className="flex items-center gap-4 mt-3 text-xs text-surface-500 dark:text-surface-400">
                  <span>
                    {lang(t.supervisorsCount)}: {area.supervisorCount}
                  </span>
                  <span>
                    {lang(t.driversCount)}: {area.driverCount}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                  <span className="inline-flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400 font-mono">
                    <LocationIcon />
                    {area.centerLatitude.toFixed(4)},{" "}
                    {area.centerLongitude.toFixed(4)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      area.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        area.isActive ? "bg-emerald-500" : "bg-surface-400",
                      )}
                    />
                    {area.isActive ? lang(t.active) : lang(t.inactive)}
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
                  {lang(t.cityId)} <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cityId}
                  onChange={(e) =>
                    setFormData({ ...formData, cityId: e.target.value })
                  }
                  placeholder={lang(t.cityIdPlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.name)} <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={lang(t.namePlaceholder)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.description)}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={lang(t.descriptionPlaceholder)}
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
                    value={formData.centerLatitude || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
                    value={formData.centerLongitude || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
                    value={formData.radiusKm || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        radiusKm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.maxCustomerDistance)}
                  </label>
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
                  value={formData.supervisorFixedFee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supervisorFixedFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              {showEditModal && (
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
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
                  {deleteConfirm.name || "—"}
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

export default AreasPage;