import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import {
  useUser,
  useGenericUpdateUser,
  useSuspendUser,
  useActivateUser,
} from "@/shared/hooks/useAdminManagement";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { UserRole } from "@/shared/types";
import { UserRole as UserRoleEnum } from "@/shared/types";

// ============================================
// Role Badge Styles
// ============================================
const roleBadgeStyles: Record<UserRole, string> = {
  Customer: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Driver: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  StoreOwner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  Supervisor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

const roleLabelsAr: Record<string, string> = {
  Customer: "عميل",
  Driver: "سائق",
  StoreOwner: "صاحب متجر",
  Store: "متجر",
  store: "متجر",
  storeOwner: "صاحب متجر",
  Supervisor: "مشرف",
  Admin: "مسؤول",
  SuperAdmin: "مسؤول",
};

// ============================================
// Helpers
// ============================================
export interface NormalizedUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// UserDetailsPage Component
// ============================================
export const UserDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || undefined;
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const {
    data: rawUser,
    isLoading,
    refetch,
  } = useUser(userId || "", roleParam);
  const updateMutation = useGenericUpdateUser();
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();

  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "activate" | "toggle";
    title: string;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({
    fullName: "",
    email: "",
    phoneNumber: "",
    isActive: undefined,
  });

  // ============================================
  // Helper functions
  // ============================================
  const normalizeRole = (role: string | number | null | undefined): UserRole => {
    if (role === undefined || role === null || role === "") return UserRoleEnum.Customer;

    if (typeof role === "number") {
      const numericMap: Record<number, UserRole> = {
        0: UserRoleEnum.Customer,
        1: UserRoleEnum.Driver,
        2: UserRoleEnum.StoreOwner,
        3: UserRoleEnum.Admin,
        4: UserRoleEnum.Supervisor,
      };
      return numericMap[role] ?? UserRoleEnum.Customer;
    }

    const key = String(role).toLowerCase();
    if (key === "store" || key === "storeowner") return UserRoleEnum.StoreOwner;
    if (key === "customer") return UserRoleEnum.Customer;
    if (key === "driver") return UserRoleEnum.Driver;
    if (key === "supervisor") return UserRoleEnum.Supervisor;
    if (key === "admin" || key === "superadmin") return UserRoleEnum.Admin;
    return UserRoleEnum.Customer;
  };

  const getRoleLabel = (role: string | number | null | undefined): string => {
    const normalized = normalizeRole(role);
    return isAr ? roleLabelsAr[normalized] || normalized : normalized;
  };

  // Normalize user data
  const user = useMemo<NormalizedUser | null>(() => {
    if (!rawUser) return null;

    const data = (rawUser as any)?.data ?? rawUser;

    let role: UserRole;
    let fullName = "";
    let email = "";
    let phoneNumber = "";
    let isActive = true;
    let createdAt = "";
    let updatedAt: string | undefined;

    // Type guard for UserDetailDto (has 'role' property)
    if ("role" in data) {
      const u = data as any;
      role = normalizeRole(u.role ?? roleParam);
      fullName =
        u.fullName ||
        (isAr ? u.nameAr : u.nameEn) ||
        u.name ||
        u.prandName ||
        u.brandName ||
        u.storeName ||
        u.ownerName ||
        "";
      email = u.email || "";
      phoneNumber = u.phoneNumber || u.phone || "";
      isActive = u.isActive ?? true;
      createdAt = u.createdAt || u.created_at || "";
      updatedAt = u.updatedAt || u.updated_at;
    }
    // Type guard for SupervisorDto (has 'areas' property)
    else if ("areas" in data) {
      const supervisor = data as any;
      role = UserRoleEnum.Supervisor;
      fullName = supervisor.fullName || supervisor.name || "";
      email = supervisor.email || "";
      phoneNumber = supervisor.phoneNumber || supervisor.phone || "";
      isActive = supervisor.isActive ?? true;
      createdAt = supervisor.createdAt || "";
      updatedAt = supervisor.updatedAt;
    }
    // Type guard for StoreDto (has 'isOpen' property)
    else if ("isOpen" in data) {
      const store = data as any;
      role = UserRoleEnum.StoreOwner;
      fullName = isAr
        ? store.nameAr || store.nameEn || store.name || ""
        : store.nameEn || store.nameAr || store.name || "";
      email = store.email || "";
      phoneNumber = store.phoneNumber || store.phone || "";
      isActive = store.isActive ?? store.isOpen ?? true;
      createdAt = store.createdAt || store.created_at || "";
      updatedAt = store.updatedAt || store.updated_at;
    }
    // StoreOwnerDto fallback (has 'stores' array, no 'role')
    else if ("stores" in data) {
      const owner = data as any;
      role = UserRoleEnum.StoreOwner;
      fullName = owner.fullName || owner.name || "";
      email = owner.email || "";
      phoneNumber = owner.phoneNumber || owner.phone || "";
      isActive = owner.isActive ?? true;
      createdAt = owner.createdAt || "";
      updatedAt = owner.updatedAt;
    }
    // Fallback
    else {
      role = normalizeRole(roleParam);
    }

    return {
      id: data.id || "",
      fullName,
      email,
      phoneNumber,
      role,
      isActive,
      createdAt,
      updatedAt,
    };
  }, [rawUser, roleParam, isAr]);

  useEffect(() => {
    if (user && rawUser) {
      const data = (rawUser as any)?.data ?? rawUser;
      const userRole = user.role;

      if (userRole === UserRoleEnum.StoreOwner) {
        setFormData({
          nameAr: data.nameAr || "",
          nameEn: data.nameEn || "",
          descriptionAr: data.descriptionAr || "",
          descriptionEn: data.descriptionEn || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          streetAr: data.streetAr || "",
          streetEn: data.streetEn || "",
          isActive: user.isActive,
        });
      } else {
        setFormData({
          fullName: data.fullName || user.fullName || "",
          email: data.email || user.email || "",
          phoneNumber: data.phoneNumber || user.phoneNumber || "",
          isActive: user.isActive,
        });
      }
    }
  }, [user, rawUser]);

  const handleSave = async () => {
    if (!userId || !user) return;
    try {
      await updateMutation.mutateAsync({
        userId,
        role: user.role,
        dto: formData as Record<string, any>,
      });
      toast.success(
        lang({
          ar: "تم تحديث المستخدم بنجاح",
          en: "User updated successfully",
        }),
      );
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      toast.error(
        err.message || lang({ ar: "فشل التحديث", en: "Update failed" }),
      );
    }
  };

  const handleAction = async (type: "suspend" | "activate" | "toggle") => {
    if (!userId || !user) return;
    setActionLoading(type);
    try {
      switch (type) {
        case "suspend":
          await suspendMutation.mutateAsync({ userId });
          break;
        case "activate":
          await activateMutation.mutateAsync({ userId });
          break;
        case "toggle":
          if (user.isActive) {
            await suspendMutation.mutateAsync({ userId });
          } else {
            await activateMutation.mutateAsync({ userId });
          }
          break;
      }
      toast.success(lang({ ar: "تم تنفيذ الإجراء", en: "Action completed" }));
      setConfirmAction(null);
      refetch();
    } catch (err: any) {
      toast.error(
        err.message || lang({ ar: "فشل الإجراء", en: "Action failed" }),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr?: string) => {
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

  const t = {
    back: { ar: "العودة للمستخدمين", en: "Back to Users" },
    edit: { ar: "تعديل", en: "Edit" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    save: { ar: "حفظ التغييرات", en: "Save Changes" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },
    fullName: { ar: "الاسم الكامل", en: "Full Name" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    role: { ar: "الدور", en: "Role" },
    status: { ar: "الحالة", en: "Status" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    userId: { ar: "المعرف", en: "User ID" },
    createdAt: { ar: "تاريخ التسجيل", en: "Registered" },
    updatedAt: { ar: "آخر تحديث", en: "Last Updated" },
    suspend: { ar: "تعليق المستخدم", en: "Suspend User" },
    activate: { ar: "تنشيط المستخدم", en: "Activate User" },
    toggleStatus: { ar: "تبديل الحالة", en: "Toggle Status" },
    confirmTitle: { ar: "تأكيد الإجراء", en: "Confirm Action" },
    confirmSuspend: {
      ar: "هل أنت متأكد من تعليق هذا المستخدم؟",
      en: "Are you sure you want to suspend this user?",
    },
    confirmActivate: {
      ar: "هل أنت متأكد من تنشيط هذا المستخدم؟",
      en: "Are you sure you want to activate this user?",
    },
    confirmToggle: {
      ar: "هل أنت متأكد من تبديل حالة هذا المستخدم؟",
      en: "Are you sure you want to toggle this user's status?",
    },
    confirm: { ar: "تأكيد", en: "Confirm" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    quickActions: { ar: "إجراءات سريعة", en: "Quick Actions" },
    notFound: { ar: "المستخدم غير موجود", en: "User not found" },
    noName: { ar: "بدون اسم", en: "No Name" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader variant="inline" message={lang(t.loading)} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {lang(t.notFound)}
        </p>
        <button
          onClick={() => navigate("/dashboard/users")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {lang(t.back)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
      <button
        onClick={() => navigate("/dashboard/users")}
        className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d={isAr ? "m8.25 4.5 7.5 7.5-7.5 7.5" : "M15.75 19.5 8.25 12l7.5-7.5"} />
        </svg>
        {lang(t.back)}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-xl font-bold text-white">
              {user.fullName?.charAt(0) || "?"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              {user.fullName || lang(t.noName)}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.userId)}: {user.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            {lang(t.edit)}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(["fullName", "email", "phoneNumber"] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t[field])}
                </label>
                {isEditing ? (
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={formData[field] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-3.5 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                ) : (
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {user[field] || "—"}
                  </p>
                )}
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.role)}
              </label>
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border",
                  roleBadgeStyles[user.role],
                )}
              >
                {getRoleLabel(user.role)}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.status)}
              </label>
              {isEditing ? (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? user.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full bg-surface-300 dark:bg-surface-600 peer-checked:bg-emerald-500 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {(formData.isActive ?? user.isActive)
                      ? lang(t.active)
                      : lang(t.inactive)}
                  </span>
                </label>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                    user.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      user.isActive ? "bg-emerald-500" : "bg-surface-400",
                    )}
                  />
                  {user.isActive ? lang(t.active) : lang(t.inactive)}
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.createdAt)}
              </label>
              <p className="text-surface-700 dark:text-surface-300 text-sm">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.updatedAt)}
              </label>
              <p className="text-surface-700 dark:text-surface-300 text-sm">
                {formatDate(user.updatedAt)}
              </p>
            </div>

            {/* Store-specific fields — only render if the raw payload carries them */}
            {user.role === UserRoleEnum.StoreOwner &&
              rawUser &&
              "isOpen" in ((rawUser as any)?.data ?? rawUser) &&
              (() => {
                const storeData = (rawUser as any)?.data ?? rawUser;
                return (
                  <>
                    {(storeData.descriptionAr || storeData.descriptionEn) && (
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                          {lang({ ar: "الوصف", en: "Description" })}
                        </label>
                        <p className="text-surface-700 dark:text-surface-300 text-sm">
                          {isAr
                            ? storeData.descriptionAr || storeData.descriptionEn
                            : storeData.descriptionEn || storeData.descriptionAr}
                        </p>
                      </div>
                    )}
                    {(storeData.streetAr || storeData.streetEn) && (
                      <div>
                        <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                          {lang({ ar: "العنوان", en: "Address" })}
                        </label>
                        <p className="text-surface-700 dark:text-surface-300 text-sm">
                          {isAr
                            ? storeData.streetAr || storeData.streetEn
                            : storeData.streetEn || storeData.streetAr}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                        {lang({ ar: "رسوم التوصيل", en: "Delivery Fee" })}
                      </label>
                      <p className="text-surface-700 dark:text-surface-300 text-sm">
                        {storeData.deliveryFee || 0}{" "}
                        {lang({ ar: "ج.م", en: "EGP" })}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                        {lang({ ar: "الحد الأدنى للطلب", en: "Min. Order" })}
                      </label>
                      <p className="text-surface-700 dark:text-surface-300 text-sm">
                        {storeData.minimumOrderAmount || 0}{" "}
                        {lang({ ar: "ج.م", en: "EGP" })}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                        {lang({ ar: "ساعات العمل", en: "Opening Hours" })}
                      </label>
                      <p className="text-surface-700 dark:text-surface-300 text-sm">
                        {storeData.openingTime?.substring(0, 5) || "00:00"} -{" "}
                        {storeData.closingTime?.substring(0, 5) || "00:00"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                        {lang({ ar: "التقييم", en: "Rating" })}
                      </label>
                      <p className="text-surface-700 dark:text-surface-300 text-sm">
                        ⭐ {storeData.rating || 0} ({storeData.ratingCount || 0}{" "}
                        {lang({ ar: "تقييم", en: "reviews" })})
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                        {lang({ ar: "إجمالي الطلبات", en: "Total Orders" })}
                      </label>
                      <p className="text-surface-700 dark:text-surface-300 text-sm">
                        {storeData.totalOrders || 0}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                        {lang({ ar: "حالة المتجر", en: "Store Status" })}
                      </label>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                          storeData.isOpen
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                        )}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            storeData.isOpen ? "bg-emerald-500" : "bg-amber-500",
                          )}
                        />
                        {storeData.isOpen
                          ? lang({ ar: "مفتوح", en: "Open" })
                          : lang({ ar: "مغلق", en: "Closed" })}
                      </span>
                    </div>
                  </>
                );
              })()}
          </div>
          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 shadow-lg transition-all active:scale-95"
              >
                {updateMutation.isPending ? lang(t.saving) : lang(t.save)}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (user && rawUser) {
                    const data = (rawUser as any)?.data ?? rawUser;
                    if (user.role === UserRoleEnum.StoreOwner) {
                      setFormData({
                        nameAr: data.nameAr || "",
                        nameEn: data.nameEn || "",
                        descriptionAr: data.descriptionAr || "",
                        descriptionEn: data.descriptionEn || "",
                        email: data.email || "",
                        phoneNumber: data.phoneNumber || "",
                        streetAr: data.streetAr || "",
                        streetEn: data.streetEn || "",
                        isActive: user.isActive,
                      });
                    } else {
                      setFormData({
                        fullName: data.fullName || user.fullName || "",
                        email: data.email || user.email || "",
                        phoneNumber: data.phoneNumber || user.phoneNumber || "",
                        isActive: user.isActive,
                      });
                    }
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
            </div>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">
              {lang(t.quickActions)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  type: "toggle" as const,
                  label: t.toggleStatus,
                  message: t.confirmToggle,
                  color: "text-surface-400",
                  border: "border-surface-200 dark:border-surface-700",
                  bg: "hover:bg-surface-50 dark:hover:bg-surface-800",
                },
                ...(user.isActive
                  ? [
                      {
                        type: "suspend" as const,
                        label: t.suspend,
                        message: t.confirmSuspend,
                        color: "text-error-600 dark:text-error-400",
                        border: "border-error-200 dark:border-error-900/50",
                        bg: "hover:bg-error-50 dark:hover:bg-error-950/30",
                      },
                    ]
                  : [
                      {
                        type: "activate" as const,
                        label: t.activate,
                        message: t.confirmActivate,
                        color: "text-emerald-600 dark:text-emerald-400",
                        border: "border-emerald-200 dark:border-emerald-900/50",
                        bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
                      },
                    ]),
              ].map((action) => (
                <button
                  key={action.type}
                  onClick={() =>
                    setConfirmAction({
                      type: action.type,
                      title: lang(action.label),
                      message: lang(action.message),
                    })
                  }
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                    action.color,
                    action.border,
                    action.bg,
                  )}
                >
                  {action.type === "toggle" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                    </svg>
                  )}
                  {action.type === "suspend" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                  {action.type === "activate" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  {lang(action.label)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
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
                    : confirmAction.type === "activate"
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
    </div>
  );
};

export default UserDetailsPage;