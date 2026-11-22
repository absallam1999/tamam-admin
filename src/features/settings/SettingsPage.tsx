import { useState } from "react";
import { useLanguage } from "@shared/hooks/useLanguage";
import {
  useTheme,
  type AccentColor,
  type ThemeMode,
} from "@app/providers/ThemeProvider";
import { useAuth } from "@app/providers/AuthProvider";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";

/**
 * SettingsPage
 */

// ============================================
// Types
// ============================================

interface AdminProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationPreferences {
  newStoreRegistration: boolean;
  newDriverRegistration: boolean;
  orderIssues: boolean;
  paymentIssues: boolean;
  systemAlerts: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface PlatformSettings {
  commissionRate: number;
  minOrderAmount: number;
  maxDriverDistance: number;
  autoApproveStores: boolean;
  autoApproveDrivers: boolean;
  maintenanceMode: boolean;
}

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "الإعدادات", en: "Settings" },
  subtitle: {
    ar: "إدارة إعدادات المنصة وتفضيلاتك الشخصية",
    en: "Manage platform settings and your personal preferences",
  },

  // Tabs
  tabProfile: { ar: "الملف الشخصي", en: "Profile" },
  tabSecurity: { ar: "الأمان", en: "Security" },
  tabNotifications: { ar: "الإشعارات", en: "Notifications" },
  tabAppearance: { ar: "المظهر", en: "Appearance" },
  tabPlatform: { ar: "إعدادات المنصة", en: "Platform" },

  // Profile
  profileTitle: { ar: "الملف الشخصي", en: "Profile" },
  profileDesc: {
    ar: "تحديث معلوماتك الشخصية وبيانات الاتصال",
    en: "Update your personal information and contact details",
  },
  fullName: { ar: "الاسم الكامل", en: "Full Name" },
  email: { ar: "البريد الإلكتروني", en: "Email Address" },
  phone: { ar: "رقم الهاتف", en: "Phone Number" },
  role: { ar: "الدور", en: "Role" },
  systemAdmin: { ar: "مدير النظام", en: "System Admin" },

  // Security
  securityTitle: { ar: "الأمان", en: "Security" },
  securityDesc: {
    ar: "تحديث كلمة المرور وإعدادات الأمان",
    en: "Update password and security settings",
  },
  currentPassword: { ar: "كلمة المرور الحالية", en: "Current Password" },
  newPassword: { ar: "كلمة المرور الجديدة", en: "New Password" },
  confirmPassword: { ar: "تأكيد كلمة المرور", en: "Confirm Password" },
  passwordPlaceholder: { ar: "••••••••", en: "••••••••" },
  showPassword: { ar: "إظهار كلمة المرور", en: "Show password" },
  hidePassword: { ar: "إخفاء كلمة المرور", en: "Hide password" },
  twoFactor: { ar: "المصادقة الثنائية", en: "Two-Factor Authentication" },
  twoFactorDesc: {
    ar: "تفعيل طبقة حماية إضافية لحسابك",
    en: "Enable an extra layer of security for your account",
  },
  sessionManagement: { ar: "إدارة الجلسات", en: "Session Management" },
  sessionManagementDesc: {
    ar: "عرض وإدارة الجلسات النشطة",
    en: "View and manage active sessions",
  },
  activeSessions: { ar: "جلسات نشطة", en: "Active Sessions" },
  logoutAll: {
    ar: "تسجيل الخروج من جميع الأجهزة",
    en: "Logout from all devices",
  },

  // Notifications
  notificationsTitle: {
    ar: "تفضيلات الإشعارات",
    en: "Notification Preferences",
  },
  notificationsDesc: {
    ar: "تحكم في الإشعارات التي تصلك عن نشاط المنصة",
    en: "Control notifications about platform activity",
  },
  newStoreRegistration: { ar: "تسجيل متجر جديد", en: "New Store Registration" },
  newStoreRegistrationDesc: {
    ar: "عند تسجيل متجر جديد في المنصة",
    en: "When a new store registers on the platform",
  },
  newDriverRegistration: {
    ar: "تسجيل سائق جديد",
    en: "New Driver Registration",
  },
  newDriverRegistrationDesc: {
    ar: "عند تسجيل سائق جديد في المنصة",
    en: "When a new driver registers on the platform",
  },
  orderIssues: { ar: "مشاكل الطلبات", en: "Order Issues" },
  orderIssuesDesc: {
    ar: "عند وجود مشكلة في طلب (تأخير، إلغاء، شكوى)",
    en: "When there is an order issue (delay, cancellation, complaint)",
  },
  paymentIssues: { ar: "مشاكل الدفع", en: "Payment Issues" },
  paymentIssuesDesc: {
    ar: "عند فشل عملية دفع أو وجود نزاع",
    en: "When a payment fails or there is a dispute",
  },
  systemAlerts: { ar: "تنبيهات النظام", en: "System Alerts" },
  systemAlertsDesc: {
    ar: "تنبيهات هامة عن حالة النظام والأداء",
    en: "Important alerts about system status and performance",
  },
  dailyReport: { ar: "تقرير يومي", en: "Daily Report" },
  dailyReportDesc: {
    ar: "ملخص يومي بأداء المنصة",
    en: "Daily summary of platform performance",
  },
  weeklyReport: { ar: "تقرير أسبوعي", en: "Weekly Report" },
  weeklyReportDesc: {
    ar: "تقرير أسبوعي مفصل عن المنصة",
    en: "Detailed weekly platform report",
  },
  notificationChannels: { ar: "قنوات الإشعارات", en: "Notification Channels" },
  emailNotifications: { ar: "البريد الإلكتروني", en: "Email" },
  emailNotificationsDesc: {
    ar: "تلقي الإشعارات عبر البريد الإلكتروني",
    en: "Receive notifications via email",
  },
  smsNotifications: { ar: "رسائل SMS", en: "SMS" },
  smsNotificationsDesc: {
    ar: "تلقي الإشعارات عبر الرسائل النصية",
    en: "Receive notifications via SMS",
  },

  // Appearance
  appearanceTitle: { ar: "المظهر", en: "Appearance" },
  appearanceDesc: {
    ar: "تخصيص مظهر لوحة التحكم حسب تفضيلاتك",
    en: "Customize your dashboard appearance",
  },
  themeSection: { ar: "المظهر", en: "Theme" },
  themeLight: { ar: "فاتح", en: "Light" },
  themeDark: { ar: "داكن", en: "Dark" },
  themeSystem: { ar: "النظام", en: "System" },
  accentSection: { ar: "لون التمييز", en: "Accent Color" },
  changeAccent: { ar: "تغيير اللون إلى", en: "Change color to" },

  // Platform
  platformTitle: { ar: "إعدادات المنصة", en: "Platform Settings" },
  platformDesc: {
    ar: "تكوين إعدادات المنصة العامة",
    en: "Configure general platform settings",
  },
  commissionRate: { ar: "نسبة العمولة (%)", en: "Commission Rate (%)" },
  commissionRateDesc: {
    ar: "النسبة المئوية التي تخصم من كل طلب",
    en: "Percentage deducted from each order",
  },
  minOrderAmount: { ar: "الحد الأدنى للطلب", en: "Minimum Order Amount" },
  minOrderAmountDesc: {
    ar: "أقل قيمة مسموحة للطلب",
    en: "Minimum allowed order value",
  },
  maxDriverDistance: {
    ar: "أقصى مسافة للسائق (كم)",
    en: "Max Driver Distance (km)",
  },
  maxDriverDistanceDesc: {
    ar: "أقصى مسافة بين السائق والمتجر",
    en: "Maximum distance between driver and store",
  },
  autoApproveStores: { ar: "اعتماد تلقائي للمتاجر", en: "Auto-Approve Stores" },
  autoApproveStoresDesc: {
    ar: "اعتماد المتاجر الجديدة تلقائياً دون مراجعة",
    en: "Automatically approve new stores without review",
  },
  autoApproveDrivers: {
    ar: "اعتماد تلقائي للسائقين",
    en: "Auto-Approve Drivers",
  },
  autoApproveDriversDesc: {
    ar: "اعتماد السائقين الجدد تلقائياً دون مراجعة",
    en: "Automatically approve new drivers without review",
  },
  maintenanceMode: { ar: "وضع الصيانة", en: "Maintenance Mode" },
  maintenanceModeDesc: {
    ar: "تفعيل وضع الصيانة وإظهار رسالة للمستخدمين",
    en: "Enable maintenance mode and show a message to users",
  },

  // Actions
  saveChanges: { ar: "حفظ التغييرات", en: "Save Changes" },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  updatePassword: { ar: "تحديث كلمة المرور", en: "Update Password" },
  updating: { ar: "جاري التحديث...", en: "Updating..." },

  // Validation
  nameRequired: { ar: "الاسم الكامل مطلوب", en: "Full name is required" },
  emailRequired: { ar: "البريد الإلكتروني مطلوب", en: "Email is required" },
  emailInvalid: {
    ar: "يرجى إدخال بريد إلكتروني صحيح",
    en: "Please enter a valid email",
  },
  currentPasswordRequired: {
    ar: "كلمة المرور الحالية مطلوبة",
    en: "Current password is required",
  },
  newPasswordRequired: {
    ar: "كلمة المرور الجديدة مطلوبة",
    en: "New password is required",
  },
  passwordLength: {
    ar: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل",
    en: "Password must be at least 8 characters",
  },
  confirmPasswordRequired: {
    ar: "يرجى تأكيد كلمة المرور",
    en: "Please confirm your password",
  },
  passwordsMatch: {
    ar: "كلمة المرور غير متطابقة",
    en: "Passwords do not match",
  },

  // Toast
  profileSaved: {
    ar: "تم حفظ الملف الشخصي بنجاح",
    en: "Profile saved successfully",
  },
  passwordUpdated: {
    ar: "تم تحديث كلمة المرور بنجاح",
    en: "Password updated successfully",
  },
  notificationsSaved: {
    ar: "تم حفظ تفضيلات الإشعارات",
    en: "Notification preferences saved",
  },
  platformSaved: { ar: "تم حفظ إعدادات المنصة", en: "Platform settings saved" },
  saveError: { ar: "فشل الحفظ", en: "Save failed" },
  saveErrorDesc: { ar: "يرجى المحاولة مرة أخرى", en: "Please try again" },
  sessionsCleared: {
    ar: "تم تسجيل الخروج من جميع الأجهزة",
    en: "Logged out from all devices",
  },
};

// ============================================
// Section Header Component
// ============================================

interface SectionHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isAr: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  isAr,
}) => (
  <div
    className={cn(
      "flex items-start gap-4 mb-6",
      // isAr ? "flex-row-reverse" : "flex-row",
    )}
  >
    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
      {icon}
    </div>
    <div className={cn(isAr ? "text-right" : "text-left")}>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
        {title}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400">
        {description}
      </p>
    </div>
  </div>
);

// ============================================
// Toggle Switch Component
// ============================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0",
      checked
        ? "bg-primary-600 dark:bg-primary-500"
        : "bg-surface-300 dark:bg-surface-600",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
        checked
          ? "ltr:translate-x-6 rtl:-translate-x-6"
          : "ltr:translate-x-1 rtl:-translate-x-1",
      )}
    />
  </button>
);

// ============================================
// SettingsPage — Main Component
// ============================================

export const SettingsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const {
    theme: themeMode,
    setTheme,
    accent,
    setAccent,
    availableAccents
  } = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  // Tab State
  type TabKey =
    | "profile"
    | "security"
    | "notifications"
    | "appearance"
    | "platform";
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<AdminProfile>({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    role: "system_admin",
  });

  // Security State
  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityErrors, setSecurityErrors] = useState<
    Partial<SecuritySettings>
  >({});

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    newStoreRegistration: true,
    newDriverRegistration: true,
    orderIssues: true,
    paymentIssues: true,
    systemAlerts: true,
    dailyReport: false,
    weeklyReport: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  // Platform State
  const [platform, setPlatform] = useState<PlatformSettings>({
    commissionRate: 15,
    minOrderAmount: 10,
    maxDriverDistance: 10,
    autoApproveStores: false,
    autoApproveDrivers: false,
    maintenanceMode: false,
  });

  const inputClass =
    "w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 text-sm border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all";

  // Save Handlers
  const handleSaveProfile = async () => {
    if (!profile.fullName.trim()) {
      toast.error(lang(t.nameRequired));
      return;
    }
    setIsSaving(true);
    try {
      await fetch("/api/admin/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      toast.success(lang(t.profileSaved));
    } catch {
      toast.error(lang(t.saveError), { description: lang(t.saveErrorDesc) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    const errors: Partial<SecuritySettings> = {};
    if (!security.currentPassword)
      errors.currentPassword = lang(t.currentPasswordRequired);
    if (!security.newPassword) errors.newPassword = lang(t.newPasswordRequired);
    else if (security.newPassword.length < 8)
      errors.newPassword = lang(t.passwordLength);
    if (!security.confirmPassword)
      errors.confirmPassword = lang(t.confirmPasswordRequired);
    else if (security.newPassword !== security.confirmPassword)
      errors.confirmPassword = lang(t.passwordsMatch);
    setSecurityErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await fetch("/api/admin/settings/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(security),
      });
      toast.success(lang(t.passwordUpdated));
      setSecurity({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error(lang(t.saveError), { description: lang(t.saveErrorDesc) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/admin/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });
      toast.success(lang(t.notificationsSaved));
    } catch {
      toast.error(lang(t.saveError), { description: lang(t.saveErrorDesc) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlatform = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/admin/settings/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(platform),
      });
      toast.success(lang(t.platformSaved));
    } catch {
      toast.error(lang(t.saveError), { description: lang(t.saveErrorDesc) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await fetch("/api/admin/settings/sessions/clear", { method: "POST" });
      toast.success(lang(t.sessionsCleared));
    } catch {
      toast.error(lang(t.saveError), { description: lang(t.saveErrorDesc) });
    }
  };

  const themeOptions: {
    key: ThemeMode;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "light",
      labelAr: t.themeLight.ar,
      labelEn: t.themeLight.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      ),
    },
    {
      key: "dark",
      labelAr: t.themeDark.ar,
      labelEn: t.themeDark.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      ),
    },
    {
      key: "system",
      labelAr: t.themeSystem.ar,
      labelEn: t.themeSystem.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
          />
        </svg>
      ),
    },
  ];

  const tabs: {
    key: TabKey;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "profile",
      labelAr: t.tabProfile.ar,
      labelEn: t.tabProfile.en,
      icon: (
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
      ),
    },
    {
      key: "security",
      labelAr: t.tabSecurity.ar,
      labelEn: t.tabSecurity.en,
      icon: (
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
      ),
    },
    {
      key: "notifications",
      labelAr: t.tabNotifications.ar,
      labelEn: t.tabNotifications.en,
      icon: (
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
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
      ),
    },
    {
      key: "appearance",
      labelAr: t.tabAppearance.ar,
      labelEn: t.tabAppearance.en,
      icon: (
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
            d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
          />
        </svg>
      ),
    },
    {
      key: "platform",
      labelAr: t.tabPlatform.ar,
      labelEn: t.tabPlatform.en,
      icon: (
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
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      ),
    },
  ];

  const notificationItems = [
    {
      key: "newStoreRegistration" as const,
      labelAr: t.newStoreRegistration.ar,
      labelEn: t.newStoreRegistration.en,
      descAr: t.newStoreRegistrationDesc.ar,
      descEn: t.newStoreRegistrationDesc.en,
    },
    {
      key: "newDriverRegistration" as const,
      labelAr: t.newDriverRegistration.ar,
      labelEn: t.newDriverRegistration.en,
      descAr: t.newDriverRegistrationDesc.ar,
      descEn: t.newDriverRegistrationDesc.en,
    },
    {
      key: "orderIssues" as const,
      labelAr: t.orderIssues.ar,
      labelEn: t.orderIssues.en,
      descAr: t.orderIssuesDesc.ar,
      descEn: t.orderIssuesDesc.en,
    },
    {
      key: "paymentIssues" as const,
      labelAr: t.paymentIssues.ar,
      labelEn: t.paymentIssues.en,
      descAr: t.paymentIssuesDesc.ar,
      descEn: t.paymentIssuesDesc.en,
    },
    {
      key: "systemAlerts" as const,
      labelAr: t.systemAlerts.ar,
      labelEn: t.systemAlerts.en,
      descAr: t.systemAlertsDesc.ar,
      descEn: t.systemAlertsDesc.en,
    },
    {
      key: "dailyReport" as const,
      labelAr: t.dailyReport.ar,
      labelEn: t.dailyReport.en,
      descAr: t.dailyReportDesc.ar,
      descEn: t.dailyReportDesc.en,
    },
    {
      key: "weeklyReport" as const,
      labelAr: t.weeklyReport.ar,
      labelEn: t.weeklyReport.en,
      descAr: t.weeklyReportDesc.ar,
      descEn: t.weeklyReportDesc.en,
    },
  ];

  const channelItems = [
    {
      key: "emailNotifications" as const,
      labelAr: t.emailNotifications.ar,
      labelEn: t.emailNotifications.en,
      descAr: t.emailNotificationsDesc.ar,
      descEn: t.emailNotificationsDesc.en,
    },
    {
      key: "smsNotifications" as const,
      labelAr: t.smsNotifications.ar,
      labelEn: t.smsNotifications.en,
      descAr: t.smsNotificationsDesc.ar,
      descEn: t.smsNotificationsDesc.en,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={cn(isAr ? "text-right" : "text-left")}>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {lang(t.title)}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {lang(t.subtitle)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-surface-200 dark:border-surface-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
              activeTab === tab.key
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">
              {isAr ? tab.labelAr : tab.labelEn}
            </span>
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* Profile Settings */}
      {/* ============================================ */}
      {activeTab === "profile" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.profileTitle)}
            description={lang(t.profileDesc)}
            isAr={isAr}
            icon={
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
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.fullName)}
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
                className={inputClass}
                placeholder="Mohamed Ahmed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.email)}
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className={inputClass}
                placeholder="admin@adminhub.com"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.phone)}
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className={inputClass}
                placeholder="+966 5xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.role)}
              </label>
              <input
                type="text"
                value={lang(t.systemAdmin)}
                className={cn(inputClass, "opacity-60")}
                disabled
              />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>{" "}
                  {lang(t.saving)}
                </>
              ) : (
                lang(t.saveChanges)
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Security Settings */}
      {/* ============================================ */}
      {activeTab === "security" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.securityTitle)}
            description={lang(t.securityDesc)}
            isAr={isAr}
            icon={
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
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.currentPassword)}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={security.currentPassword}
                  onChange={(e) =>
                    setSecurity({
                      ...security,
                      currentPassword: e.target.value,
                    })
                  }
                  className={cn(
                    inputClass,
                    securityErrors.currentPassword && "border-error-400",
                  )}
                  placeholder={lang(t.passwordPlaceholder)}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 p-1 rounded-lg text-surface-400 hover:text-surface-600",
                    isAr ? "left-3" : "right-3",
                  )}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
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
                  ) : (
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
                  )}
                </button>
              </div>
              {securityErrors.currentPassword && (
                <p className="text-xs text-error-500">
                  {securityErrors.currentPassword}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.newPassword)}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={security.newPassword}
                  onChange={(e) =>
                    setSecurity({ ...security, newPassword: e.target.value })
                  }
                  className={cn(
                    inputClass,
                    securityErrors.newPassword && "border-error-400",
                  )}
                  placeholder={lang(t.passwordPlaceholder)}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 p-1 rounded-lg text-surface-400 hover:text-surface-600",
                    isAr ? "left-3" : "right-3",
                  )}
                  tabIndex={-1}
                >
                  {showNewPassword ? (
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
                  ) : (
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
                  )}
                </button>
              </div>
              {securityErrors.newPassword && (
                <p className="text-xs text-error-500">
                  {securityErrors.newPassword}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.confirmPassword)}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={security.confirmPassword}
                  onChange={(e) =>
                    setSecurity({
                      ...security,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={cn(
                    inputClass,
                    securityErrors.confirmPassword && "border-error-400",
                  )}
                  placeholder={lang(t.passwordPlaceholder)}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 p-1 rounded-lg text-surface-400 hover:text-surface-600",
                    isAr ? "left-3" : "right-3",
                  )}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
                  ) : (
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
                  )}
                </button>
              </div>
              {securityErrors.confirmPassword && (
                <p className="text-xs text-error-500">
                  {securityErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>{" "}
                {lang(t.updating)}
              </>
            ) : (
              lang(t.updatePassword)
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className={cn(isAr ? "text-right" : "text-left")}>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {lang(t.twoFactor)}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {lang(t.twoFactorDesc)}
                </p>
              </div>
              <ToggleSwitch
                checked={twoFactorEnabled}
                onChange={setTwoFactorEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className={cn(isAr ? "text-right" : "text-left")}>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {lang(t.sessionManagement)}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {lang(t.sessionManagementDesc)}
                </p>
              </div>
              <button
                onClick={handleLogoutAll}
                className="btn btn-ghost btn-sm text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
              >
                {lang(t.logoutAll)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Notifications Settings */}
      {/* ============================================ */}
      {activeTab === "notifications" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.notificationsTitle)}
            description={lang(t.notificationsDesc)}
            isAr={isAr}
            icon={
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
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            }
          />
          <div className="space-y-4">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
              >
                <div
                  className={cn("min-w-0", isAr ? "text-right" : "text-left")}
                >
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {isAr ? item.labelAr : item.labelEn}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
                <ToggleSwitch
                  checked={notifications[item.key]}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <h4
              className={cn(
                "text-sm font-semibold text-surface-700 dark:text-surface-300",
                isAr ? "text-right" : "text-left",
              )}
            >
              {lang(t.notificationChannels)}
            </h4>
            {channelItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
              >
                <div
                  className={cn("min-w-0", isAr ? "text-right" : "text-left")}
                >
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {isAr ? item.labelAr : item.labelEn}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
                <ToggleSwitch
                  checked={notifications[item.key]}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
            <button
              onClick={handleSaveNotifications}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>{" "}
                  {lang(t.saving)}
                </>
              ) : (
                lang(t.saveChanges)
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Appearance Settings */}
      {/* ============================================ */}
      {activeTab === "appearance" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.appearanceTitle)}
            description={lang(t.appearanceDesc)}
            isAr={isAr}
            icon={
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
                  d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                />
              </svg>
            }
          />
          <div className="mb-6">
            <h4
              className={cn(
                "text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3",
                isAr ? "text-right" : "text-left",
              )}
            >
              {lang(t.themeSection)}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setTheme(mode.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    themeMode === mode.key
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                      : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600",
                  )}
                >
                  {mode.icon}
                  <span className="text-sm font-medium">
                    {isAr ? mode.labelAr : mode.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4
              className={cn(
                "text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3",
                isAr ? "text-right" : "text-left",
              )}
            >
              {lang(t.accentSection)}
            </h4>
            <div
              className={cn(
                "flex gap-3",
                isAr ? "justify-end" : "justify-start",
              )}
            >
              {availableAccents.map((config) => (
                <button
                  key={config.name}
                  onClick={() => setAccent(config.name as AccentColor)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all duration-200 hover:scale-110",
                    accent === config.name &&
                      "ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-surface-950 scale-110",
                  )}
                  style={{ backgroundColor: config.primary }}
                  title={isAr ? config.nameAr : config.name}
                  aria-label={`${lang(t.changeAccent)} ${isAr ? config.nameAr : config.name}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Platform Settings */}
      {/* ============================================ */}
      {activeTab === "platform" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.platformTitle)}
            description={lang(t.platformDesc)}
            isAr={isAr}
            icon={
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
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.commissionRate)}
              </label>
              <input
                type="number"
                value={platform.commissionRate}
                onChange={(e) =>
                  setPlatform({
                    ...platform,
                    commissionRate: Number(e.target.value),
                  })
                }
                className={inputClass}
                min="0"
                max="100"
              />
              <p className="text-xs text-surface-400 dark:text-surface-500">
                {lang(t.commissionRateDesc)}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.minOrderAmount)}
              </label>
              <input
                type="number"
                value={platform.minOrderAmount}
                onChange={(e) =>
                  setPlatform({
                    ...platform,
                    minOrderAmount: Number(e.target.value),
                  })
                }
                className={inputClass}
                min="0"
              />
              <p className="text-xs text-surface-400 dark:text-surface-500">
                {lang(t.minOrderAmountDesc)}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.maxDriverDistance)}
              </label>
              <input
                type="number"
                value={platform.maxDriverDistance}
                onChange={(e) =>
                  setPlatform({
                    ...platform,
                    maxDriverDistance: Number(e.target.value),
                  })
                }
                className={inputClass}
                min="0"
              />
              <p className="text-xs text-surface-400 dark:text-surface-500">
                {lang(t.maxDriverDistanceDesc)}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                key: "autoApproveStores" as const,
                labelAr: t.autoApproveStores.ar,
                labelEn: t.autoApproveStores.en,
                descAr: t.autoApproveStoresDesc.ar,
                descEn: t.autoApproveStoresDesc.en,
              },
              {
                key: "autoApproveDrivers" as const,
                labelAr: t.autoApproveDrivers.ar,
                labelEn: t.autoApproveDrivers.en,
                descAr: t.autoApproveDriversDesc.ar,
                descEn: t.autoApproveDriversDesc.en,
              },
              {
                key: "maintenanceMode" as const,
                labelAr: t.maintenanceMode.ar,
                labelEn: t.maintenanceMode.en,
                descAr: t.maintenanceModeDesc.ar,
                descEn: t.maintenanceModeDesc.en,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
              >
                <div
                  className={cn("min-w-0", isAr ? "text-right" : "text-left")}
                >
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {isAr ? item.labelAr : item.labelEn}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
                <ToggleSwitch
                  checked={platform[item.key]}
                  onChange={(checked) =>
                    setPlatform({ ...platform, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
            <button
              onClick={handleSavePlatform}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>{" "}
                  {lang(t.saving)}
                </>
              ) : (
                lang(t.saveChanges)
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
