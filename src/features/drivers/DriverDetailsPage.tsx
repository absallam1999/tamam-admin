import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminDrivers } from "@shared/hooks/useAdminDrivers";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type {
  DriverDto,
  UpdateDriverDto,
  DriverDocumentDto,
} from "@shared/types";

// ============================================
// Icons
// ============================================

const DocumentIcon = () => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
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
// DriverDetailsPage Component
// ============================================

export const DriverDetailsPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );

  const {
    fetchDriverById,
    updateDriver,
    setDriverVerified,
    fetchDriverDocuments,
    verifyDocument,
    rejectDocument,
    isVerifying,
    isRejecting,
  } = useAdminDrivers();

  const [driver, setDriver] = useState<DriverDto | null>(null);
  const [documents, setDocuments] = useState<DriverDocumentDto[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "documents">("info");

  const [formData, setFormData] = useState<UpdateDriverDto>({
    fullName: "",
    email: "",
    phoneNumber: "",
    isActive: true,
    isVerified: false,
  });

  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "activate" | "verify" | "unverify";
    title: string;
    message: string;
  } | null>(null);

  const [rejectDocModal, setRejectDocModal] =
    useState<DriverDocumentDto | null>(null);
  const [rejectDocReason, setRejectDocReason] = useState("");

  const fetchData = useCallback(async () => {
    if (!driverId) {
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    try {
      const [driverData, docsData] = await Promise.all([
        fetchDriverById(driverId),
        fetchDriverDocuments(driverId).catch(() => [] as DriverDocumentDto[]),
      ]);
      setDriver(driverData);
      setDocuments(docsData);
      setFormData({
        fullName: driverData.fullName ?? "",
        email: driverData.email ?? "",
        phoneNumber: driverData.phoneNumber ?? "",
        isActive: driverData.isActive,
        isVerified: driverData.isVerified,
      });
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل بيانات السائق", en: "Failed to load driver" }),
        ),
      );
      navigate("/dashboard/drivers");
    } finally {
      setPageLoading(false);
    }
  }, [driverId, fetchDriverById, fetchDriverDocuments, navigate, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!driverId) return;
    setSaving(true);
    try {
      const updated = await updateDriver(driverId, {
        fullName: formData.fullName?.trim() || null,
        email: formData.email?.trim() || null,
        phoneNumber: formData.phoneNumber?.trim() || null,
        isActive: formData.isActive,
        isVerified: formData.isVerified,
      });
      setDriver(updated);
      setIsEditing(false);
      toast.success(
        lang({
          ar: "تم تحديث السائق بنجاح",
          en: "Driver updated successfully",
        }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل التحديث", en: "Update failed" }),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (
    type: "suspend" | "activate" | "verify" | "unverify",
  ) => {
    if (!driverId) return;
    setActionLoading(type);
    try {
      let updated: DriverDto;
      if (type === "suspend") {
        updated = await updateDriver(driverId, { isActive: false });
      } else if (type === "activate") {
        updated = await updateDriver(driverId, { isActive: true });
      } else if (type === "verify") {
        updated = await setDriverVerified(driverId, { isVerified: true });
      } else {
        updated = await setDriverVerified(driverId, { isVerified: false });
      }
      setDriver(updated);
      setFormData({
        fullName: updated.fullName ?? "",
        email: updated.email ?? "",
        phoneNumber: updated.phoneNumber ?? "",
        isActive: updated.isActive,
        isVerified: updated.isVerified,
      });
      toast.success(
        lang({
          ar: "تم تنفيذ الإجراء بنجاح",
          en: "Action completed successfully",
        }),
      );
      setConfirmAction(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل الإجراء", en: "Action failed" }),
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyDocument = async (doc: DriverDocumentDto) => {
    try {
      const updated = await verifyDocument({
        documentId: doc.id,
        dto: { approve: true, rejectionReason: null },
      });
      setDocuments((prev) =>
        prev.map((item) => (item.id === doc.id ? updated : item)),
      );
      toast.success(
        lang({ ar: "تم توثيق المستند", en: "Document verified" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل توثيق المستند", en: "Failed to verify document" }),
        ),
      );
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectDocModal) return;
    try {
      const updated = await rejectDocument({
        documentId: rejectDocModal.id,
        dto: { reason: rejectDocReason.trim() || null },
      });
      setDocuments((prev) =>
        prev.map((item) => (item.id === rejectDocModal.id ? updated : item)),
      );
      setRejectDocModal(null);
      setRejectDocReason("");
      toast.success(lang({ ar: "تم رفض المستند", en: "Document rejected" }));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل رفض المستند", en: "Failed to reject document" }),
        ),
      );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
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

  const isDocVerified = (d: DriverDocumentDto) =>
    (d.status || "").toLowerCase() === "verified" ||
    (d.status || "").toLowerCase() === "approved" ||
    Boolean(d.verifiedAt);

  const isDocRejected = (d: DriverDocumentDto) =>
    !isDocVerified(d) &&
    ((d.status || "").toLowerCase() === "rejected" || !!d.rejectionReason);

  const t = {
    back: { ar: "العودة للسائقين", en: "Back to Drivers" },
    edit: { ar: "تعديل", en: "Edit" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    save: { ar: "حفظ التغييرات", en: "Save Changes" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },
    fullName: { ar: "الاسم الكامل", en: "Full Name" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    vehicleType: { ar: "نوع المركبة", en: "Vehicle Type" },
    vehiclePlate: { ar: "رقم اللوحة", en: "Plate Number" },
    rating: { ar: "التقييم", en: "Rating" },
    deliveries: { ar: "التوصيلات", en: "Deliveries" },
    availability: { ar: "التوافر", en: "Availability" },
    available: { ar: "متاح", en: "Available" },
    unavailable: { ar: "غير متاح", en: "Unavailable" },
    status: { ar: "الحالة", en: "Status" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    driverId: { ar: "معرف السائق", en: "Driver ID" },
    createdAt: { ar: "تاريخ التسجيل", en: "Registered" },
    updatedAt: { ar: "آخر تحديث", en: "Last Updated" },
    suspend: { ar: "تعليق السائق", en: "Suspend Driver" },
    activate: { ar: "تنشيط السائق", en: "Activate Driver" },
    verifyDriver: { ar: "توثيق السائق", en: "Verify Driver" },
    unverifyDriver: { ar: "إلغاء التوثيق", en: "Unverify Driver" },
    info: { ar: "المعلومات", en: "Info" },
    documents: { ar: "المستندات", en: "Documents" },
    noDocuments: { ar: "لا توجد مستندات", en: "No documents" },
    viewDocument: { ar: "عرض المستند", en: "View Document" },
    verifyDoc: { ar: "توثيق", en: "Verify" },
    rejectDoc: { ar: "رفض", en: "Reject" },
    rejectDocTitle: { ar: "رفض المستند", en: "Reject Document" },
    rejectDocPlaceholder: {
      ar: "سبب الرفض (اختياري)...",
      en: "Rejection reason (optional)...",
    },
    verified: { ar: "موثق", en: "Verified" },
    unverified: { ar: "غير موثق", en: "Unverified" },
    pending: { ar: "معلق", en: "Pending" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    confirmSuspend: {
      ar: "هل أنت متأكد من تعليق هذا السائق؟",
      en: "Are you sure you want to suspend this driver?",
    },
    confirmActivate: {
      ar: "هل أنت متأكد من تنشيط هذا السائق؟",
      en: "Are you sure you want to activate this driver?",
    },
    confirmVerify: {
      ar: "هل أنت متأكد من توثيق هذا السائق؟",
      en: "Are you sure you want to verify this driver?",
    },
    confirmUnverify: {
      ar: "هل أنت متأكد من إلغاء توثيق هذا السائق؟",
      en: "Are you sure you want to unverify this driver?",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang({ ar: "السائق غير موجود", en: "Driver not found" })}
        </p>
        <button
          onClick={() => navigate("/dashboard/drivers")}
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
        onClick={() => navigate("/dashboard/drivers")}
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <span className="text-xl font-bold text-white">
              {driver.fullName?.charAt(0) || "?"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {driver.fullName || (isAr ? "بدون اسم" : "No Name")}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.driverId)}: {driver.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        {!isEditing && activeTab === "info" && (
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

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800 w-fit">
        {(["info", "documents"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setIsEditing(false);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm"
                : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
            )}
          >
            {lang(t[tab])}
            {tab === "documents" && documents.length > 0 && (
              <span className="ms-1.5 text-xs text-surface-400">
                ({documents.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === "info" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.fullName)}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                ) : (
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {driver.fullName || "—"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.email)}
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                ) : (
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {driver.email || "—"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.phoneNumber)}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                ) : (
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {driver.phoneNumber || "—"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.status)}
                </label>
                {isEditing ? (
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive ?? driver.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 rounded-full bg-surface-300 dark:bg-surface-600 peer-checked:bg-emerald-500 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {(formData.isActive ?? driver.isActive)
                        ? lang(t.active)
                        : lang(t.inactive)}
                    </span>
                  </label>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                        driver.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          driver.isActive ? "bg-emerald-500" : "bg-surface-400",
                        )}
                      />
                      {driver.isActive ? lang(t.active) : lang(t.inactive)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                        driver.isVerified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                      )}
                    >
                      {driver.isVerified
                        ? lang(t.verified)
                        : lang(t.unverified)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.vehicleType)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {driver.vehicleType || "—"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.vehiclePlate)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 font-mono">
                  {driver.vehiclePlateNumber || "—"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.deliveries)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {driver.successfulDeliveries} / {driver.totalDeliveries}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.availability)}
                </label>
                <p className="text-surface-900 dark:text-surface-100 font-medium">
                  {driver.isAvailable
                    ? lang(t.available)
                    : lang(t.unavailable)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.createdAt)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm">
                  {formatDate(driver.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.updatedAt)}
                </label>
                <p className="text-surface-700 dark:text-surface-300 text-sm">
                  {formatDate(driver.updatedAt)}
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
                    setFormData({
                      fullName: driver.fullName ?? "",
                      email: driver.email ?? "",
                      phoneNumber: driver.phoneNumber ?? "",
                      isActive: driver.isActive,
                      isVerified: driver.isVerified,
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
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-6">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                  <DocumentIcon />
                </div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {lang(t.noDocuments)}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const verified = isDocVerified(doc);
                  const rejected = isDocRejected(doc);
                  const pending = !verified && !rejected;

                  return (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800"
                    >
                      <div className="flex items-center gap-3">
                        <DocumentIcon />
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                            {doc.type || "—"}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">
                            {formatDate(doc.createdAt)}
                          </p>
                          {doc.rejectionReason && (
                            <p className="text-xs text-error-600 dark:text-error-400 mt-0.5">
                              {doc.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            verified
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : rejected
                                ? "bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                          )}
                        >
                          {verified
                            ? lang(t.verified)
                            : rejected
                              ? lang(t.rejected)
                              : lang(t.pending)}
                        </span>
                        {pending && (
                          <>
                            <button
                              onClick={() => handleVerifyDocument(doc)}
                              disabled={isVerifying || isRejecting}
                              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                            >
                              {lang(t.verifyDoc)}
                            </button>
                            <button
                              onClick={() => {
                                setRejectDocReason("");
                                setRejectDocModal(doc);
                              }}
                              disabled={isVerifying || isRejecting}
                              className="text-xs font-medium text-error-600 dark:text-error-400 hover:underline disabled:opacity-50"
                            >
                              {lang(t.rejectDoc)}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/dashboard/drivers/documents/${doc.id}`)
                          }
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {lang(t.viewDocument)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!isEditing && activeTab === "info" && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {lang({ ar: "إجراءات سريعة", en: "Quick Actions" })}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {driver.isVerified ? (
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "unverify",
                      title: lang(t.unverifyDriver),
                      message: lang(t.confirmUnverify),
                    })
                  }
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-900/50 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                >
                  {lang(t.unverifyDriver)}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "verify",
                      title: lang(t.verifyDriver),
                      message: lang(t.confirmVerify),
                    })
                  }
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  {lang(t.verifyDriver)}
                </button>
              )}
              {driver.isActive ? (
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "suspend",
                      title: lang(t.suspend),
                      message: lang(t.confirmSuspend),
                    })
                  }
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-error-200 dark:border-error-900/50 text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                >
                  {lang(t.suspend)}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "activate",
                      title: lang(t.activate),
                      message: lang(t.confirmActivate),
                    })
                  }
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  {lang(t.activate)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {confirmAction.title}
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
              {confirmAction.message}
            </p>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={() => handleAction(confirmAction.type)}
                disabled={actionLoading === confirmAction.type}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50",
                  confirmAction.type === "suspend"
                    ? "bg-error-600 hover:bg-error-700"
                    : confirmAction.type === "activate" ||
                        confirmAction.type === "verify"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-primary-600 hover:bg-primary-700",
                )}
              >
                {actionLoading === confirmAction.type
                  ? lang(t.processing)
                  : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {rejectDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setRejectDocModal(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              {lang(t.rejectDocTitle)}
            </h3>
            <textarea
              value={rejectDocReason}
              onChange={(e) => setRejectDocReason(e.target.value)}
              placeholder={lang(t.rejectDocPlaceholder)}
              rows={3}
              className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setRejectDocModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleRejectDocument}
                disabled={isRejecting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-error-600 text-white hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRejecting ? lang(t.processing) : lang(t.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDetailsPage;