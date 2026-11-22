import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useCreateAdmin } from "@/shared/hooks/useAdminManagement";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { AdminRole, CreateAdminDto } from "@/shared/types";

// ============================================
// Icons
// ============================================

const ShieldIcon = () => (
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
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
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

const ArrowBackIcon = () => (
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
      d="M15.75 19.5 8.25 12l7.5-7.5"
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
// CreateAdminPage Component
// ============================================

export const CreateAdminPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  // ← replaces useAdminAuth()
  const createAdminMutation = useCreateAdmin();
  const isCreating = createAdminMutation.isPending;

  const [formData, setFormData] = useState<CreateAdminDto>({
    phoneNumber: "",
    fullName: "",
    email: "",
    password: "",
    role: "Admin",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.phoneNumber?.trim()) {
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

    if (!formData.fullName?.trim()) {
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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = lang({
        ar: "بريد إلكتروني غير صالح",
        en: "Invalid email address",
      });
    }

    if (!formData.password) {
      newErrors.password = lang({
        ar: "كلمة المرور مطلوبة",
        en: "Password is required",
      });
    } else if (formData.password.length < 6) {
      newErrors.password = lang({
        ar: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        en: "Password must be at least 6 characters",
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const created = await createAdminMutation.mutateAsync({
        phoneNumber: formData.phoneNumber?.trim() || undefined,
        fullName: formData.fullName?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        password: formData.password,
        role: formData.role || "Admin",
      });

      const displayName = created.fullName || formData.fullName || "";
      setCreatedUser(displayName);
      setSuccess(true);
      toast.success(
        lang({
          ar: `تم إنشاء المسؤول "${displayName}" بنجاح`,
          en: `Admin "${displayName}" created successfully`,
        }),
      );
    } catch (err: any) {
      toast.error(
        err.message ||
          lang({ ar: "فشل إنشاء المسؤول", en: "Failed to create admin" }),
      );
    }
  };

  const handleReset = () => {
    setFormData({
      phoneNumber: "",
      fullName: "",
      email: "",
      password: "",
      role: "Admin",
    });
    setErrors({});
    setSuccess(false);
    setCreatedUser("");
  };

  const updateField = <K extends keyof CreateAdminDto>(
    field: K,
    value: CreateAdminDto[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const t = {
    title: { ar: "إنشاء مسؤول جديد", en: "Create New Admin" },
    subtitle: {
      ar: "إضافة مسؤول جديد إلى لوحة التحكم مع الصلاحيات الكاملة",
      en: "Add a new administrator to the dashboard with full privileges",
    },
    back: { ar: "العودة للمستخدمين", en: "Back to Users" },
    fullName: { ar: "الاسم الكامل", en: "Full Name" },
    fullNamePlaceholder: { ar: "أدخل الاسم الكامل", en: "Enter full name" },
    email: { ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)" },
    emailPlaceholder: { ar: "example@tamam.com", en: "example@tamam.com" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    phonePlaceholder: { ar: "05xxxxxxxx", en: "05xxxxxxxx" },
    password: { ar: "كلمة المرور", en: "Password" },
    passwordPlaceholder: { ar: "أدخل كلمة المرور", en: "Enter password" },
    role: { ar: "الدور", en: "Role" },
    roleAdmin: { ar: "مسؤول", en: "Admin" },
    roleSuperAdmin: { ar: "مسؤول رئيسي", en: "Super Admin" },
    submit: { ar: "إنشاء المسؤول", en: "Create Admin" },
    submitting: { ar: "جاري الإنشاء...", en: "Creating..." },
    reset: { ar: "إعادة تعيين", en: "Reset" },
    createAnother: { ar: "إنشاء مسؤول آخر", en: "Create Another Admin" },
    viewUsers: { ar: "عرض المستخدمين", en: "View Users" },
    successTitle: {
      ar: "تم إنشاء المسؤول بنجاح!",
      en: "Admin Created Successfully!",
    },
    successMessage: {
      ar: "تم إنشاء حساب المسؤول الجديد",
      en: "The new admin account has been created",
    },
    securityNote: {
      ar: "سيحصل المسؤول الجديد على صلاحيات كاملة للوحة التحكم. تأكد من مشاركة كلمة المرور بشكل آمن.",
      en: "The new admin will have full dashboard access. Ensure the password is shared securely.",
    },
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex flex-col items-center text-center py-12 px-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 animate-scale-in">
            <SuccessIcon />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
            {lang(t.successTitle)}
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mb-1">
            {lang(t.successMessage)}
          </p>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-8">
            {createdUser}
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/users")}
        className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {isAr ? (
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
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        ) : (
          <ArrowBackIcon />
        )}
        {lang(t.back)}
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-rose-600 dark:text-rose-400">
            <ShieldIcon />
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

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden"
      >
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
                value={formData.fullName ?? ""}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder={lang(t.fullNamePlaceholder)}
                className={cn(
                  "w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                  errors.fullName
                    ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
                    : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                  "focus:outline-none focus:ring-2",
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-error-500 mt-1.5">{errors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
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
                value={formData.phoneNumber ?? ""}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
                placeholder={lang(t.phonePlaceholder)}
                className={cn(
                  "w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                  errors.phoneNumber
                    ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
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
                value={formData.email ?? ""}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder={lang(t.emailPlaceholder)}
                className={cn(
                  "w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                  errors.email
                    ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
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
                value={formData.password ?? ""}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder={lang(t.passwordPlaceholder)}
                className={cn(
                  "w-full rounded-xl py-2.5 ps-10 pe-12 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                  errors.password
                    ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
                    : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                  "focus:outline-none focus:ring-2",
                )}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-error-500 mt-1.5">{errors.password}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              {lang(t.role)}
            </label>
            <div className="relative">
              <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
                <ShieldIcon />
              </span>
              <select
                value={formData.role ?? "Admin"}
                onChange={(e) =>
                  updateField("role", e.target.value as AdminRole)
                }
                className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="Admin">{lang(t.roleAdmin)}</option>
                <option value="SuperAdmin">{lang(t.roleSuperAdmin)}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900/50">
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
        <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex items-center gap-3">
          <button
            type="submit"
            disabled={isCreating}
            className={cn(
              "flex-1 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-primary-600 text-white hover:bg-primary-700",
              "shadow-lg shadow-primary-500/20",
            )}
          >
            {isCreating ? lang(t.submitting) : lang(t.submit)}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {lang(t.reset)}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAdminPage;