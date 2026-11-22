import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminAreas } from "@shared/hooks/useAdminAreas";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { AreaDto, UpdateAreaDto, SupervisorDto } from "@shared/types";

// ============================================
// Icons
// ============================================

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

function toFormState(data: AreaDto): AreaFormState {
  return {
    cityId: "",
    name: data.name ?? "",
    description: data.description ?? "",
    centerLatitude: data.centerLatitude,
    centerLongitude: data.centerLongitude,
    radiusKm: data.radiusKm,
    maxCustomerDistanceKm: 10,
    supervisorFixedFee: 0,
    isActive: data.isActive,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// AreaDetailsPage Component
// ============================================

export const AreaDetailsPage: React.FC = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    fetchAreaById,
    updateArea,
    supervisors,
    fetchSupervisors,
    assignAreaToSupervisor,
    removeAreaFromSupervisor,
  } = useAdminAreas();

  const [area, setArea] = useState<AreaDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState<AreaFormState>({
    cityId: "",
    name: "",
    description: "",
    centerLatitude: 0,
    centerLongitude: 0,
    radiusKm: 5,
    maxCustomerDistanceKm: 10,
    supervisorFixedFee: 0,
    isActive: true,
  });

  // Assign supervisor modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  const fetchData = useCallback(async () => {
    if (!areaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [areaData] = await Promise.all([
        fetchAreaById(areaId),
        fetchSupervisors().catch(() => [] as SupervisorDto[]),
      ]);
      setArea(areaData);
      setFormData(toFormState(areaData));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل بيانات المنطقة", en: "Failed to load area" }),
        ),
      );
      navigate("/dashboard/areas");
    } finally {
      setLoading(false);
    }
  }, [areaId, fetchAreaById, fetchSupervisors, navigate, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignedSupervisors = useMemo(
    () =>
      supervisors.filter((s) => s.areas?.some((a) => a.areaId === areaId)),
    [supervisors, areaId],
  );

  const availableSupervisors = useMemo(() => {
    const assignedIds = new Set(assignedSupervisors.map((s) => s.id));
    return supervisors.filter((s) => !assignedIds.has(s.id));
  }, [supervisors, assignedSupervisors]);

  const handleSave = async () => {
    if (!areaId || !area) return;
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
    setSaving(true);
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
      const updated = await updateArea(areaId, dto);
      setArea(updated);
      setFormData(toFormState(updated));
      toast.success(
        lang({ ar: "تم تحديث المنطقة بنجاح", en: "Area updated successfully" }),
      );
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث المنطقة", en: "Failed to update area" }),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!areaId || !selectedSupervisorId) return;
    setActionLoading("assign");
    try {
      await assignAreaToSupervisor(selectedSupervisorId, areaId);
      toast.success(
        lang({
          ar: "تم تعيين المشرف للمنطقة",
          en: "Supervisor assigned to area",
        }),
      );
      setShowAssignModal(false);
      setSelectedSupervisorId("");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تعيين المشرف", en: "Failed to assign supervisor" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveSupervisor = async (supervisorId: string) => {
    if (!areaId) return;
    setActionLoading(`remove-${supervisorId}`);
    try {
      await removeAreaFromSupervisor(supervisorId, areaId);
      toast.success(
        lang({
          ar: "تم إزالة المشرف من المنطقة",
          en: "Supervisor removed from area",
        }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل إزالة المشرف", en: "Failed to remove supervisor" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const t = {
    back: { ar: "العودة للمناطق", en: "Back to Areas" },
    areaDetails: { ar: "تفاصيل المنطقة", en: "Area Details" },
    edit: { ar: "تعديل", en: "Edit" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    save: { ar: "حفظ التغييرات", en: "Save Changes" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },
    cityId: { ar: "معرف المدينة", en: "City ID" },
    cityIdPlaceholder: {
      ar: "أدخل معرف المدينة (UUID)",
      en: "Enter city UUID",
    },
    name: { ar: "اسم المنطقة", en: "Area Name" },
    description: { ar: "الوصف", en: "Description" },
    latitude: { ar: "خط العرض", en: "Latitude" },
    longitude: { ar: "خط الطول", en: "Longitude" },
    radius: { ar: "نطاق التوصيل", en: "Delivery Radius" },
    maxCustomerDistance: {
      ar: "أقصى مسافة للعميل (كم)",
      en: "Max Customer Distance (km)",
    },
    supervisorFixedFee: {
      ar: "الرسوم الثابتة للمشرف",
      en: "Supervisor Fixed Fee",
    },
    driversCount: { ar: "عدد السائقين", en: "Drivers" },
    status: { ar: "الحالة", en: "Status" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    supervisors: { ar: "المشرفين المسؤولين", en: "Assigned Supervisors" },
    assignSupervisor: { ar: "تعيين مشرف", en: "Assign Supervisor" },
    selectSupervisor: { ar: "اختر المشرف", en: "Select supervisor" },
    assign: { ar: "تعيين", en: "Assign" },
    remove: { ar: "إزالة", en: "Remove" },
    noSupervisors: { ar: "لا يوجد مشرفين", en: "No supervisors assigned" },
    noSupervisorsDesc: {
      ar: "لم يتم تعيين أي مشرف لهذه المنطقة بعد",
      en: "No supervisors have been assigned to this area yet",
    },
    noAvailable: { ar: "لا يوجد مشرفين متاحين", en: "No available supervisors" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    km: { ar: "كم", en: "km" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "المنطقة غير موجودة", en: "Area not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/areas")}
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
        onClick={() => navigate("/dashboard/areas")}
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <AreaIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {area.name || "—"}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.radius)}: {area.radiusKm} {lang(t.km)} •{" "}
              {lang(t.driversCount)}: {area.driverCount}
            </p>
          </div>
        </div>
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

      {/* Area Info Card */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {isEditing && (
              <div className="sm:col-span-2">
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
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm font-mono"
                  dir="ltr"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.name)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {area.name || "—"}
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
                  {area.radiusKm} {lang(t.km)}
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
                <p className="text-surface-700 dark:text-surface-300 font-mono text-sm">
                  {area.centerLatitude.toFixed(6)}
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
                <p className="text-surface-700 dark:text-surface-300 font-mono text-sm">
                  {area.centerLongitude.toFixed(6)}
                </p>
              )}
            </div>
            {isEditing && (
              <>
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
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
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
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </>
            )}
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
                    area.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      area.isActive ? "bg-emerald-500" : "bg-surface-400",
                    )}
                  />
                  {area.isActive ? lang(t.active) : lang(t.inactive)}
                </span>
              )}
            </div>
          </div>

          {(isEditing || area.description) && (
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
                  rows={2}
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                />
              ) : (
                <p className="text-surface-700 dark:text-surface-300 text-sm">
                  {area.description}
                </p>
              )}
            </div>
          )}

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
                  setFormData(toFormState(area));
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

      {/* Supervisors Section */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <SupervisorIcon />
              {lang(t.supervisors)} ({assignedSupervisors.length})
            </h3>
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={availableSupervisors.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon />
              {lang(t.assignSupervisor)}
            </button>
          </div>

          {assignedSupervisors.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <SupervisorIcon />
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.noSupervisors)}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {lang(t.noSupervisorsDesc)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedSupervisors.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-white">
                        {supervisor.fullName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                        {supervisor.fullName || (isAr ? "بدون اسم" : "No Name")}
                      </p>
                      {supervisor.phoneNumber && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                          <PhoneIcon />
                          {supervisor.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        supervisor.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400",
                      )}
                    >
                      {supervisor.isActive ? lang(t.active) : lang(t.inactive)}
                    </span>
                    <button
                      onClick={() => handleRemoveSupervisor(supervisor.id)}
                      disabled={actionLoading === `remove-${supervisor.id}`}
                      className="p-1.5 rounded-lg text-error-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors disabled:opacity-50"
                      title={lang(t.remove)}
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
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Supervisor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {lang(t.assignSupervisor)}
            </h3>

            {availableSupervisors.length === 0 ? (
              <div className="text-center py-6">
                <SupervisorIcon />
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                  {lang(t.noAvailable)}
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.selectSupervisor)}
                </label>
                <select
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">{lang(t.selectSupervisor)}</option>
                  {availableSupervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName || "—"} — {s.phoneNumber || "—"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleAssignSupervisor}
                disabled={!selectedSupervisorId || actionLoading === "assign"}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {actionLoading === "assign"
                  ? lang(t.processing)
                  : lang(t.assign)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaDetailsPage;