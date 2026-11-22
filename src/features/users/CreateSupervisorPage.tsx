import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { adminApi } from "@/config/admin.api";
import { useAuth } from "@/app/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { useCreateSupervisorByAdmin } from "@/shared/hooks/useAdminManagement";
import { cn } from "@shared/utils/cn";
import PageLoader from "@/shared/components/PageLoader";
import type { AreaDto, CityListDto, CreateSupervisorDto } from "@/shared/types";

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
      d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
    />
  </svg>
);

const UserIcon = () => (
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

const LockIcon = () => (
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
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
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

const EyeOffIcon = () => (
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
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
    />
  </svg>
);

const CheckIcon = () => (
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
      d="m4.5 12.75 6 6 9-13.5"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg
    className="w-12 h-12 text-emerald-500"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

// ============================================
// Inline Hooks (areas & cities lookup; supervisor creation uses
// the shared useCreateSupervisorByAdmin hook)
// ============================================

const useAreas = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<AreaDto[]>({
    queryKey: ["adminAreas"],
    queryFn: () => adminApi.getAreas(),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
};

const useCitiesLookup = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<CityListDto[]>({
    queryKey: ["adminCitiesLookup"],
    queryFn: () => adminApi.lookupCities(),
    staleTime: 5 * 60_000,
    enabled: isAuthenticated,
  });
};

// ============================================
// CreateSupervisorPage Component
// ============================================

export const CreateSupervisorPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  // ← replaces inline useCreateSupervisor (which incorrectly called createAdmin)
  const createMutation = useCreateSupervisorByAdmin();

  const { data: areas = [], isLoading: areasLoading } = useAreas();
  const { data: cities = [], isLoading: citiesLoading } = useCitiesLookup();

  const [formData, setFormData] = useState<{
    phoneNumber: string;
    fullName: string;
    email: string;
    password: string;
    cityId: string;
    areaIds: string[];
  }>({
    phoneNumber: "",
    fullName: "",
    email: "",
    password: "",
    cityId: "",
    areaIds: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdSupervisor, setCreatedSupervisor] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = lang({
        ar: "الاسم الكامل مطلوب",
        en: "Full name is required",
      });
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = lang({
        ar: "الاسم قصير جداً",
        en: "Name is too short",
      });
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = lang({
        ar: "رقم الهاتف مطلوب",
        en: "Phone number is required",
      });
    } else if (!/^[\d+\-() ]{7,20}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = lang({
        ar: "رقم جوال غير صالح",
        en: "Invalid phone number",
      });
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = lang({
        ar: "بريد إلكتروني غير صالح",
        en: "Invalid email",
      });
    }

    if (!formData.password) {
      newErrors.password = lang({
        ar: "كلمة المرور مطلوبة",
        en: "Password is required",
      });
    } else if (formData.password.length < 6) {
      newErrors.password = lang({
        ar: "كلمة المرور 6 أحرف على الأقل",
        en: "Password must be at least 6 characters",
      });
    }

    if (!formData.cityId) {
      newErrors.cityId = lang({
        ar: "المدينة مطلوبة",
        en: "City is required",
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const dto: CreateSupervisorDto = {
        phoneNumber: formData.phoneNumber.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email?.trim() || undefined,
        password: formData.password,
        cityId: formData.cityId,
        areaIds: formData.areaIds.length > 0 ? formData.areaIds : null,
      };

      await createMutation.mutateAsync(dto);

      setCreatedSupervisor(formData.fullName);
      setSuccess(true);
      toast.success(
        lang({
          ar: `تم إنشاء "${formData.fullName}"`,
          en: `"${formData.fullName}" created`,
        }),
      );
    } catch (err: any) {
      toast.error(
        err.message ||
          lang({ ar: "فشل إنشاء المشرف", en: "Failed to create supervisor" }),
      );
    }
  };

  const handleReset = () => {
    setFormData({
      phoneNumber: "",
      fullName: "",
      email: "",
      password: "",
      cityId: "",
      areaIds: [],
    });
    setErrors({});
    setSuccess(false);
    setCreatedSupervisor("");
  };

  const updateField = (
    field: "phoneNumber" | "fullName" | "email" | "password" | "cityId",
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const toggleArea = (areaId: string) => {
    setFormData((prev) => {
      const current = prev.areaIds || [];
      return {
        ...prev,
        areaIds: current.includes(areaId)
          ? current.filter((id) => id !== areaId)
          : [...current, areaId],
      };
    });
  };

  const selectAllAreas = () =>
    setFormData((prev) => ({ ...prev, areaIds: areas.map((a) => a.id) }));
  const deselectAllAreas = () =>
    setFormData((prev) => ({ ...prev, areaIds: [] }));

  const selectedCount = formData.areaIds?.length || 0;

  const t = {
    title: { ar: "إنشاء مشرف جديد", en: "Create New Supervisor" },
    subtitle: {
      ar: "إضافة مشرف جديد لإدارة السائقين والطلبات",
      en: "Add a new supervisor to manage drivers and orders",
    },
    back: { ar: "العودة للمستخدمين", en: "Back to Users" },
    personalInfo: { ar: "المعلومات الشخصية", en: "Personal Information" },
    areasSection: { ar: "المناطق المسؤول عنها", en: "Assigned Areas" },
    fullName: { ar: "الاسم الكامل", en: "Full Name" },
    fullNamePlaceholder: { ar: "أدخل الاسم الكامل", en: "Enter full name" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    phonePlaceholder: { ar: "05xxxxxxxx", en: "05xxxxxxxx" },
    email: { ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)" },
    emailPlaceholder: {
      ar: "supervisor@tamam.com",
      en: "supervisor@tamam.com",
    },
    password: { ar: "كلمة المرور", en: "Password" },
    passwordPlaceholder: { ar: "أدخل كلمة المرور", en: "Enter password" },
    city: { ar: "المدينة", en: "City" },
    selectCity: { ar: "اختر المدينة", en: "Select city" },
    selectAll: { ar: "تحديد الكل", en: "Select All" },
    deselectAll: { ar: "إلغاء تحديد الكل", en: "Deselect All" },
    areasSelected: {
      ar: `تم تحديد ${selectedCount} مناطق`,
      en: `${selectedCount} area(s) selected`,
    },
    noAreas: { ar: "لا توجد مناطق متاحة", en: "No areas available" },
    noAreasDesc: {
      ar: "يجب إنشاء مناطق أولاً",
      en: "Areas must be created first",
    },
    submit: { ar: "إنشاء المشرف", en: "Create Supervisor" },
    submitting: { ar: "جاري الإنشاء...", en: "Creating..." },
    reset: { ar: "إعادة تعيين", en: "Reset" },
    createAnother: { ar: "إنشاء مشرف آخر", en: "Create Another" },
    viewUsers: { ar: "عرض المستخدمين", en: "View Users" },
    successTitle: { ar: "تم إنشاء المشرف بنجاح!", en: "Supervisor Created!" },
    successMessage: {
      ar: "تم إنشاء حساب المشرف الجديد",
      en: "New supervisor account created",
    },
    securityNote: {
      ar: "سيتمكن المشرف من إدارة السائقين والطلبات في المناطق المحددة فقط.",
      en: "The supervisor can manage drivers and orders only in assigned areas.",
    },
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center text-center py-12 px-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 animate-scale-in">
            <SuccessIcon />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
            {lang(t.successTitle)}
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mb-1">
            {lang(t.successMessage)}
          </p>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-8">
            {createdSupervisor}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
            >
              {lang(t.createAnother)}
            </button>
            <button
              onClick={() => navigate("/dashboard/users")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
              {lang(t.viewUsers)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/users")}
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
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-purple-600 dark:text-purple-400">
            <SupervisorIcon />
          </span>
        </div>
        <div className={cn(isAr ? "text-right" : "text-left")}>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <UserIcon />
              {lang(t.personalInfo)}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.fullName)} <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder={lang(t.fullNamePlaceholder)}
                  className={cn(
                    "w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                    errors.fullName
                      ? "border-error-500 focus:ring-error-500/50"
                      : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                    "focus:outline-none focus:ring-2",
                  )}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-error-500 mt-1.5">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.phoneNumber)} <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
                  <PhoneIcon />
                </span>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  placeholder={lang(t.phonePlaceholder)}
                  className={cn(
                    "w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                    errors.phoneNumber
                      ? "border-error-500 focus:ring-error-500/50"
                      : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                    "focus:outline-none focus:ring-2",
                  )}
                  dir="ltr"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-xs text-error-500 mt-1.5">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.email)}
              </label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder={lang(t.emailPlaceholder)}
                  className={cn(
                    "w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                    errors.email
                      ? "border-error-500 focus:ring-error-500/50"
                      : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                    "focus:outline-none focus:ring-2",
                  )}
                  dir="ltr"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error-500 mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.password)} <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder={lang(t.passwordPlaceholder)}
                  className={cn(
                    "w-full rounded-xl py-2.5 ps-10 pe-12 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                    errors.password
                      ? "border-error-500 focus:ring-error-500/50"
                      : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                    "focus:outline-none focus:ring-2",
                  )}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-surface-400 dark:text-surface-500 hover:text-surface-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error-500 mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.city)} <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
                  <AreaIcon />
                </span>
                <select
                  value={formData.cityId}
                  onChange={(e) => updateField("cityId", e.target.value)}
                  className={cn(
                    "w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm appearance-none cursor-pointer",
                    errors.cityId
                      ? "border-error-500 focus:ring-error-500/50"
                      : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                    "focus:outline-none focus:ring-2",
                  )}
                  disabled={citiesLoading}
                >
                  <option value="">{lang(t.selectCity)}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {isAr
                        ? city.nameAr || city.nameEn || ""
                        : city.nameEn || city.nameAr || ""}
                    </option>
                  ))}
                </select>
              </div>
              {errors.cityId && (
                <p className="text-xs text-error-500 mt-1.5">{errors.cityId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Areas */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <AreaIcon />
              {lang(t.areasSection)}
            </h3>
            {areas.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllAreas}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {lang(t.selectAll)}
                </button>
                <span className="text-surface-300">•</span>
                <button
                  type="button"
                  onClick={deselectAllAreas}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {lang(t.deselectAll)}
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {areasLoading ? (
              <div className="flex items-center justify-center py-8">
                <PageLoader variant="inline" />
              </div>
            ) : areas.length === 0 ? (
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
              <>
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">
                  {lang(t.areasSelected)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {areas.map((area) => {
                    const isSelected =
                      formData.areaIds?.includes(area.id) ?? false;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => toggleArea(area.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-start",
                          isSelected
                            ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-2 border-purple-500"
                            : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-2 border-transparent hover:border-surface-300",
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-purple-500 text-white"
                              : "border-2 border-surface-300 dark:border-surface-600",
                          )}
                        >
                          {isSelected && <CheckIcon />}
                        </div>
                        <span className="truncate">{area.name || "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="px-6 py-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
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
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {lang(t.securityNote)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 px-5 py-3 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {createMutation.isPending ? lang(t.submitting) : lang(t.submit)}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-3 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {lang(t.reset)}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSupervisorPage;