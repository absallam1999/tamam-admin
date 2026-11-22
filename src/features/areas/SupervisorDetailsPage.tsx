import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminAreas } from "@shared/hooks/useAdminAreas";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type {
  SupervisorDto,
  UpdateSupervisorDto,
  AreaDto,
} from "@shared/types";

// ============================================
// Icons
// ============================================

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
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const PhoneIcon = () => (
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
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  </svg>
);

const MailIcon = () => (
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
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// SupervisorDetailsPage Component
// ============================================

export const SupervisorDetailsPage: React.FC = () => {
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    fetchSupervisorById,
    updateSupervisor,
    areas,
    fetchAreas,
    assignAreaToSupervisor,
    removeAreaFromSupervisor,
  } = useAdminAreas();

  const [supervisor, setSupervisor] = useState<SupervisorDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    isActive: true,
  });

  // Assign area modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const fetchData = useCallback(async () => {
    if (!supervisorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [supervisorData] = await Promise.all([
        fetchSupervisorById(supervisorId),
        fetchAreas().catch(() => [] as AreaDto[]),
      ]);
      setSupervisor(supervisorData);
      setFormData({
        fullName: supervisorData.fullName ?? "",
        email: supervisorData.email ?? "",
        isActive: supervisorData.isActive,
      });
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحميل بيانات المشرف",
            en: "Failed to load supervisor",
          }),
        ),
      );
      navigate("/dashboard/areas/supervisors");
    } finally {
      setLoading(false);
    }
  }, [supervisorId, fetchSupervisorById, fetchAreas, navigate, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const areaLookup = useMemo(() => {
    const map = new Map<string, AreaDto>();
    for (const area of areas) {
      map.set(area.id, area);
    }
    return map;
  }, [areas]);

  const assignedAreas = useMemo(
    () => supervisor?.areas ?? [],
    [supervisor],
  );

  const availableAreas = useMemo(() => {
    const assignedIds = new Set(assignedAreas.map((a) => a.areaId));
    return areas.filter((a) => !assignedIds.has(a.id));
  }, [areas, assignedAreas]);

  const handleSave = async () => {
    if (!supervisorId || !supervisor) return;
    setSaving(true);
    try {
      const dto: UpdateSupervisorDto = {
        fullName: formData.fullName.trim() || null,
        email: formData.email.trim() || null,
        isActive: formData.isActive,
      };
      const updated = await updateSupervisor(supervisorId, dto);
      setSupervisor(updated);
      setFormData({
        fullName: updated.fullName ?? "",
        email: updated.email ?? "",
        isActive: updated.isActive,
      });
      toast.success(
        lang({
          ar: "تم تحديث المشرف بنجاح",
          en: "Supervisor updated successfully",
        }),
      );
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحديث المشرف",
            en: "Failed to update supervisor",
          }),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAssignArea = async () => {
    if (!supervisorId || !selectedAreaId) return;
    setActionLoading("assign");
    try {
      await assignAreaToSupervisor(supervisorId, selectedAreaId);
      const refreshed = await fetchSupervisorById(supervisorId);
      setSupervisor(refreshed);
      toast.success(
        lang({
          ar: "تم تعيين المنطقة للمشرف",
          en: "Area assigned to supervisor",
        }),
      );
      setShowAssignModal(false);
      setSelectedAreaId("");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تعيين المنطقة للمشرف",
            en: "Failed to assign area",
          }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveArea = async (areaId: string) => {
    if (!supervisorId) return;
    setActionLoading(`remove-${areaId}`);
    try {
      await removeAreaFromSupervisor(supervisorId, areaId);
      const refreshed = await fetchSupervisorById(supervisorId);
      setSupervisor(refreshed);
      toast.success(
        lang({
          ar: "تم إزالة المنطقة من المشرف",
          en: "Area removed from supervisor",
        }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل إزالة المنطقة من المشرف",
            en: "Failed to remove area",
          }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const t = {
    back: { ar: "العودة للمشرفين", en: "Back to Supervisors" },
    supervisorDetails: { ar: "تفاصيل المشرف", en: "Supervisor Details" },
    edit: { ar: "تعديل", en: "Edit" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    save: { ar: "حفظ التغييرات", en: "Save Changes" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },
    fullName: { ar: "الاسم الكامل", en: "Full Name" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    city: { ar: "المدينة", en: "City" },
    status: { ar: "الحالة", en: "Status" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    areas: { ar: "المناطق المسؤول عنها", en: "Assigned Areas" },
    assignArea: { ar: "تعيين منطقة", en: "Assign Area" },
    selectArea: { ar: "اختر المنطقة", en: "Select area" },
    assign: { ar: "تعيين", en: "Assign" },
    remove: { ar: "إزالة", en: "Remove" },
    noAreas: { ar: "لا توجد مناطق", en: "No areas assigned" },
    noAreasDesc: {
      ar: "لم يتم تعيين أي منطقة لهذا المشرف بعد",
      en: "No areas have been assigned to this supervisor yet",
    },
    noAvailable: { ar: "لا توجد مناطق متاحة", en: "No available areas" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "المشرف غير موجود", en: "Supervisor not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/areas/supervisors")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {lang(t.back)}
        </button>
      </div>
    );
  }

  const cityName = isAr
    ? supervisor.cityAr || supervisor.cityEn
    : supervisor.cityEn || supervisor.cityAr;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/areas/supervisors")}
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
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <span className="text-xl font-bold text-white">
              {supervisor.fullName?.charAt(0) || "?"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {supervisor.fullName || "—"}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {supervisor.phoneNumber || "—"}
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

      {/* Supervisor Info Card */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.fullName)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                  <SupervisorIcon />
                  {supervisor.fullName || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.phoneNumber)}
              </label>
              <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                <PhoneIcon />
                {supervisor.phoneNumber || "—"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.email)}
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              ) : (
                <p className="text-surface-900 dark:text-surface-100 font-medium flex items-center gap-2">
                  <MailIcon />
                  {supervisor.email || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.city)}
              </label>
              <p className="text-surface-900 dark:text-surface-100 font-medium">
                {cityName || "—"}
              </p>
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
                    supervisor.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      supervisor.isActive ? "bg-emerald-500" : "bg-surface-400",
                    )}
                  />
                  {supervisor.isActive ? lang(t.active) : lang(t.inactive)}
                </span>
              )}
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
                  setFormData({
                    fullName: supervisor.fullName ?? "",
                    email: supervisor.email ?? "",
                    isActive: supervisor.isActive,
                  });
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Areas Section */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <AreaIcon />
              {lang(t.areas)} ({assignedAreas.length})
            </h3>
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={availableAreas.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon />
              {lang(t.assignArea)}
            </button>
          </div>

          {assignedAreas.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <AreaIcon />
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.noAreas)}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {lang(t.noAreasDesc)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedAreas.map((assignedArea) => {
                const fullArea = areaLookup.get(assignedArea.areaId);
                return (
                  <div
                    key={assignedArea.areaId}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <AreaIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                          {assignedArea.areaName || fullArea?.name || "—"}
                        </p>
                        {fullArea?.description && (
                          <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                            {fullArea.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {fullArea && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            fullArea.isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400",
                          )}
                        >
                          {fullArea.isActive
                            ? lang(t.active)
                            : lang(t.inactive)}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveArea(assignedArea.areaId)}
                        disabled={
                          actionLoading === `remove-${assignedArea.areaId}`
                        }
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Area Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {lang(t.assignArea)}
            </h3>

            {availableAreas.length === 0 ? (
              <div className="text-center py-6">
                <AreaIcon />
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                  {lang(t.noAvailable)}
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.selectArea)}
                </label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">{lang(t.selectArea)}</option>
                  {availableAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name || "—"} — {area.radiusKm}{" "}
                      {lang({ ar: "كم", en: "km" })}
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
                onClick={handleAssignArea}
                disabled={!selectedAreaId || actionLoading === "assign"}
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

export default SupervisorDetailsPage;