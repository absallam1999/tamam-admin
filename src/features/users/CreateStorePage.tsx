import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import {
  useCreateStoreByAdmin,
  useCreateStoreOwnerByAdmin,
} from "@/shared/hooks/useAdminManagement";
import { useAdminCities } from "@shared/hooks/useAdminCities";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { CreateStoreDto, CreateStoreOwnerDto } from "@/shared/types";

interface AdminCreateStoreDto {
  phoneNumber?: string;
  storeNameAr?: string;
  storeNameEn?: string;
  storeDescriptionAr?: string;
  storeDescriptionEn?: string;
  storeStreetAr?: string;
  storeStreetEn?: string;
  ownerName?: string;
  email?: string;
  password?: string;
  latitude: number;
  longitude: number;
  cityId?: string;
}

// ============================================
// Icons
// ============================================

const StoreIcon = () => (
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
      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
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

const CityIcon = () => (
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
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0v3.75m0 0v3.75m0 0V21"
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
// CreateStorePage Component
// ============================================

export const CreateStorePage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  // ← replaces usePendingApprovals().adminCreateStore
  const createStoreMutation = useCreateStoreByAdmin();
  const createOwnerMutation = useCreateStoreOwnerByAdmin();

  // ← use lookupCities (lightweight) for the dropdown, keeps rendering the same
  const { cities, fetchCities } = useAdminCities();

  const [formData, setFormData] = useState<AdminCreateStoreDto>({
    phoneNumber: "",
    storeNameAr: "",
    storeNameEn: "",
    storeDescriptionAr: "",
    storeDescriptionEn: "",
    storeStreetAr: "",
    storeStreetEn: "",
    ownerName: "",
    email: "",
    password: "",
    latitude: 0,
    longitude: 0,
    cityId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdStore, setCreatedStore] = useState("");
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Auto-detect location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        lang({
          ar: "تحديد الموقع غير مدعوم في متصفحك",
          en: "Geolocation is not supported by your browser",
        }),
      );
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setUseGeolocation(true);
        setGeoLoading(false);
        toast.success(
          lang({
            ar: "تم تحديد الموقع بنجاح",
            en: "Location detected successfully",
          }),
        );
        // Clear location errors
        if (errors.latitude || errors.longitude) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.latitude;
            delete next.longitude;
            return next;
          });
        }
      },
      (_err) => {
        setGeoLoading(false);
        toast.error(
          lang({
            ar: "فشل تحديد الموقع. الرجاء إدخال الإحداثيات يدوياً.",
            en: "Failed to get location. Please enter coordinates manually.",
          }),
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeNameAr?.trim() && !formData.storeNameEn?.trim()) {
      newErrors.storeName = lang({
        ar: "اسم المتجر مطلوب (العربية أو الإنجليزية)",
        en: "Store name is required (Arabic or English)",
      });
    }

    if (!formData.ownerName?.trim()) {
      newErrors.ownerName = lang({
        ar: "اسم المالك مطلوب",
        en: "Owner name is required",
      });
    }

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
        ar: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        en: "Password must be at least 6 characters",
      });
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = lang({
        ar: "الموقع مطلوب. استخدم تحديد الموقع أو أدخل الإحداثيات يدوياً",
        en: "Location is required. Use geolocation or enter coordinates manually",
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // ── Step 1: create the store ─────────────────────────────────────────
      const storeDto: CreateStoreDto = {
        nameAr: formData.storeNameAr?.trim() || undefined,
        nameEn: formData.storeNameEn?.trim() || undefined,
        descriptionAr: formData.storeDescriptionAr?.trim() || undefined,
        descriptionEn: formData.storeDescriptionEn?.trim() || undefined,
        streetAr: formData.storeStreetAr?.trim() || undefined,
        streetEn: formData.storeStreetEn?.trim() || undefined,
        phoneNumber: formData.phoneNumber?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        cityId: formData.cityId || undefined,
      };
      const createdStoreDto = await createStoreMutation.mutateAsync(storeDto);

      // ── Step 2: create & assign the store owner ──────────────────────────
      const ownerDto: CreateStoreOwnerDto = {
        fullName: formData.ownerName?.trim() || undefined,
        phoneNumber: formData.phoneNumber?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        password: formData.password || undefined,
        storeId: createdStoreDto.id,
      };

      try {
        await createOwnerMutation.mutateAsync(ownerDto);
      } catch (ownerErr: any) {
        // Store was created but owner creation failed — surface store id so
        // the admin can retry from the store detail page.
        toast.error(
          lang({
            ar: `تم إنشاء المتجر لكن فشل إنشاء المالك. معرف المتجر: ${createdStoreDto.id.slice(0, 8)}...`,
            en: `Store created but owner creation failed. Store ID: ${createdStoreDto.id.slice(0, 8)}...`,
          }),
        );
        setSubmitting(false);
        return;
      }

      setCreatedStore(
        isAr
          ? formData.storeNameAr || formData.storeNameEn || ""
          : formData.storeNameEn || formData.storeNameAr || "",
      );
      setSuccess(true);
      toast.success(
        lang({
          ar: `تم إنشاء المتجر "${isAr ? formData.storeNameAr : formData.storeNameEn}" بنجاح`,
          en: `Store "${isAr ? formData.storeNameEn : formData.storeNameAr}" created successfully`,
        }),
      );
    } catch (err: any) {
      toast.error(
        err.message ||
          lang({ ar: "فشل إنشاء المتجر", en: "Failed to create store" }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update handleReset
  const handleReset = () => {
    setFormData({
      phoneNumber: "",
      storeNameAr: "",
      storeNameEn: "",
      storeDescriptionAr: "",
      storeDescriptionEn: "",
      storeStreetAr: "",
      storeStreetEn: "",
      ownerName: "",
      email: "",
      password: "",
      latitude: 0,
      longitude: 0,
      cityId: "",
    });
    setErrors({});
    setSuccess(false);
    setCreatedStore("");
    setUseGeolocation(false);
  };

  const updateField = (
    field: keyof AdminCreateStoreDto,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    // Clear combined location error
    if ((field === "latitude" || field === "longitude") && errors.location) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.location;
        return next;
      });
    }
  };

  const t = {
    title: { ar: "إنشاء متجر جديد", en: "Create New Store" },
    subtitle: {
      ar: "إضافة متجر جديد إلى المنصة مع بيانات المالك والموقع",
      en: "Add a new store to the platform with owner and location details",
    },
    back: { ar: "العودة للمستخدمين", en: "Back to Users" },
    storeInfo: { ar: "معلومات المتجر", en: "Store Information" },
    ownerInfo: { ar: "معلومات المالك", en: "Owner Information" },
    locationInfo: { ar: "الموقع", en: "Location" },
    storeName: { ar: "اسم المتجر", en: "Store Name" },
    storeNamePlaceholder: { ar: "أدخل اسم المتجر", en: "Enter store name" },
    ownerName: { ar: "اسم المالك", en: "Owner Name" },
    ownerNamePlaceholder: { ar: "أدخل اسم المالك", en: "Enter owner name" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    phonePlaceholder: { ar: "05xxxxxxxx", en: "05xxxxxxxx" },
    email: { ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)" },
    emailPlaceholder: { ar: "store@example.com", en: "store@example.com" },
    password: { ar: "كلمة المرور", en: "Password" },
    passwordPlaceholder: { ar: "أدخل كلمة المرور", en: "Enter password" },
    city: { ar: "المدينة (اختياري)", en: "City (optional)" },
    selectCity: { ar: "اختر المدينة", en: "Select city" },
    latitude: { ar: "خط العرض", en: "Latitude" },
    longitude: { ar: "خط الطول", en: "Longitude" },
    detectLocation: { ar: "تحديد الموقع تلقائياً", en: "Auto-detect Location" },
    detecting: { ar: "جاري التحديد...", en: "Detecting..." },
    submit: { ar: "إنشاء المتجر", en: "Create Store" },
    submitting: { ar: "جاري الإنشاء...", en: "Creating..." },
    reset: { ar: "إعادة تعيين", en: "Reset" },
    createAnother: { ar: "إنشاء متجر آخر", en: "Create Another Store" },
    viewUsers: { ar: "عرض المستخدمين", en: "View Users" },
    successTitle: {
      ar: "تم إنشاء المتجر بنجاح!",
      en: "Store Created Successfully!",
    },
    successMessage: {
      ar: "تم إنشاء حساب المتجر الجديد",
      en: "The new store account has been created",
    },
    coordinatesNote: {
      ar: "يمكنك استخدام زر تحديد الموقع أو إدخال الإحداثيات يدوياً",
      en: "You can use the auto-detect button or enter coordinates manually",
    },
  };

  // Success state
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
            {createdStore}
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
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-600 dark:text-emerald-400">
            <StoreIcon />
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <StoreIcon />
              {lang(t.storeInfo)}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Store Name (Arabic) */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang({ ar: "اسم المتجر (عربي)", en: "Store Name (Arabic)" })}{" "}
                <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={formData.storeNameAr || ""}
                onChange={(e) => updateField("storeNameAr", e.target.value)}
                placeholder={lang({
                  ar: "أدخل اسم المتجر بالعربية",
                  en: "Enter store name in Arabic",
                })}
                className={cn(
                  "w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                  errors.storeName
                    ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
                    : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                  "focus:outline-none focus:ring-2",
                )}
              />
            </div>

            {/* Store Name (English) */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang({
                  ar: "اسم المتجر (إنجليزي)",
                  en: "Store Name (English)",
                })}{" "}
                <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={formData.storeNameEn || ""}
                onChange={(e) => updateField("storeNameEn", e.target.value)}
                placeholder={lang({
                  ar: "أدخل اسم المتجر بالإنجليزية",
                  en: "Enter store name in English",
                })}
                className={cn(
                  "w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                  errors.storeName
                    ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
                    : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                  "focus:outline-none focus:ring-2",
                )}
                dir="ltr"
              />
            </div>
            {errors.storeName && (
              <p className="text-xs text-error-500 mt-1.5">
                {errors.storeName}
              </p>
            )}

            {/* Store Description (Arabic) */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang({ ar: "وصف المتجر (عربي)", en: "Description (Arabic)" })}
              </label>
              <textarea
                value={formData.storeDescriptionAr || ""}
                onChange={(e) =>
                  updateField("storeDescriptionAr", e.target.value)
                }
                placeholder={lang({
                  ar: "أدخل وصف المتجر بالعربية",
                  en: "Enter store description in Arabic",
                })}
                rows={2}
                className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
              />
            </div>

            {/* Store Description (English) */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang({
                  ar: "وصف المتجر (إنجليزي)",
                  en: "Description (English)",
                })}
              </label>
              <textarea
                value={formData.storeDescriptionEn || ""}
                onChange={(e) =>
                  updateField("storeDescriptionEn", e.target.value)
                }
                placeholder={lang({
                  ar: "أدخل وصف المتجر بالإنجليزية",
                  en: "Enter store description in English",
                })}
                rows={2}
                className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                dir="ltr"
              />
            </div>

            {/* Street Address (Arabic) */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang({ ar: "الشارع (عربي)", en: "Street (Arabic)" })}
              </label>
              <input
                type="text"
                value={formData.storeStreetAr || ""}
                onChange={(e) => updateField("storeStreetAr", e.target.value)}
                placeholder={lang({
                  ar: "أدخل اسم الشارع بالعربية",
                  en: "Enter street name in Arabic",
                })}
                className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
              />
            </div>

            {/* Street Address (English) */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang({ ar: "الشارع (إنجليزي)", en: "Street (English)" })}
              </label>
              <input
                type="text"
                value={formData.storeStreetEn || ""}
                onChange={(e) => updateField("storeStreetEn", e.target.value)}
                placeholder={lang({
                  ar: "أدخل اسم الشارع بالإنجليزية",
                  en: "Enter street name in English",
                })}
                className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                dir="ltr"
              />
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
                  value={formData.email || ""}
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

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.city)}
              </label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
                  <CityIcon />
                </span>
                <select
                  value={formData.cityId || ""}
                  onChange={(e) => updateField("cityId", e.target.value)}
                  className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">{lang(t.selectCity)}</option>
                  {(cities || []).map((city) => (
                    <option key={city.id} value={city.id}>
                      {isAr
                        ? city.nameAr || city.nameEn || ""
                        : city.nameEn || city.nameAr || ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <UserIcon />
              {lang(t.ownerInfo)}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Owner Name */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                {lang(t.ownerName)} <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => updateField("ownerName", e.target.value)}
                placeholder={lang(t.ownerNamePlaceholder)}
                className={cn(
                  "w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                  errors.ownerName
                    ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
                    : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                  "focus:outline-none focus:ring-2",
                )}
              />
              {errors.ownerName && (
                <p className="text-xs text-error-500 mt-1.5">
                  {errors.ownerName}
                </p>
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
                  value={formData.password || ""}
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
                <p className="text-xs text-error-500 mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <LocationIcon />
              {lang(t.locationInfo)}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.coordinatesNote)}
            </p>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={geoLoading}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50",
                "bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400",
                "border border-primary-200 dark:border-primary-900/50",
                "hover:bg-primary-100 dark:hover:bg-primary-950/50",
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <LocationIcon />
                {geoLoading ? lang(t.detecting) : lang(t.detectLocation)}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.latitude)}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude || ""}
                  onChange={(e) =>
                    updateField("latitude", parseFloat(e.target.value) || 0)
                  }
                  className={cn(
                    "w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                    errors.location
                      ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
                      : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                    "focus:outline-none focus:ring-2",
                  )}
                  placeholder="24.7136"
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
                  value={formData.longitude || ""}
                  onChange={(e) =>
                    updateField("longitude", parseFloat(e.target.value) || 0)
                  }
                  className={cn(
                    "w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border transition-all text-sm",
                    errors.location
                      ? "border-error-500 focus:ring-error-500/50 focus:border-error-500"
                      : "border-surface-200 dark:border-surface-700 focus:ring-primary-500/50 focus:border-primary-500",
                    "focus:outline-none focus:ring-2",
                  )}
                  placeholder="46.6753"
                  dir="ltr"
                />
              </div>
            </div>
            {errors.location && (
              <p className="text-xs text-error-500">{errors.location}</p>
            )}
            {useGeolocation && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {lang({
                    ar: "تم تحديد الموقع تلقائياً",
                    en: "Location auto-detected",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "flex-1 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-primary-600 text-white hover:bg-primary-700",
              "shadow-lg shadow-primary-500/20",
            )}
          >
            {submitting ? lang(t.submitting) : lang(t.submit)}
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

export default CreateStorePage;
