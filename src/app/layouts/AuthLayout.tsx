import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useTheme } from "@app/providers/ThemeProvider";
import { useLanguage } from "@shared/hooks/useLanguage";
import { LanguageSwitcher } from "@shared/components/LanguageSwitcher";
import { PageLoader } from "@shared/components/PageLoader";
import { cn } from "@shared/utils/cn";

/**
 * AuthLayout
 */

// ============================================
// Types
// ============================================

interface RouteContent {
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: (isAr: boolean) => ReactNode;
}

interface LastSession {
  device: string;
  browser: string;
  location: string;
  time: string;
  ip: string;
}

// ============================================
// Translations
// ============================================

const t = {
  skipToForm: { ar: "تخطي إلى النموذج", en: "Skip to form" },
  brandName: { ar: "تطبيق تمام", en: "Tamam App" },
  brandTagline: { ar: "منصة تحكم الإدارة", en: "Admin Control Platform" },
  securityBadge: {
    ar: "تشفير SSL • بياناتك محمية",
    en: "SSL Encryption • Your data is protected",
  },
  copyright: { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  verifying: { ar: "جاري التحقق من الجلسة...", en: "Verifying session..." },
  needHelp: { ar: "هل تحتاج مساعدة؟", en: "Need help?" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  noAccount: { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  createAccount: { ar: "إنشاء حساب جديد", en: "Create one" },
  haveAccount: { ar: "لديك حساب بالفعل؟", en: "Already have an account?" },
  loginSuccess: { ar: "تم تسجيل الدخول بنجاح", en: "Login successful" },
  loginFailed: { ar: "فشل تسجيل الدخول", en: "Login failed" },
};

// ============================================
// Route Configuration
// ============================================

const routeContent: Record<string, RouteContent> = {
  "/auth/login": {
    taglineAr: "مرحباً بعودتك",
    taglineEn: "Welcome Back",
    descriptionAr:
      "سجل دخولك إلى لوحة التحكم الإدارية لمتابعة المتاجر والطلبات والسائقين.",
    descriptionEn:
      "Sign in to the admin dashboard to manage stores, orders, and drivers.",
    icon: (isAr: boolean) => (
      <svg
        className={cn("w-6 h-6", isAr && "scale-x-[-1]")}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
        />
      </svg>
    ),
  },
  "/auth/forgot-password": {
    taglineAr: "استعادة كلمة المرور",
    taglineEn: "Reset Password",
    descriptionAr:
      "لا تقلق! أدخل رقم هاتفك المسجل في نظامنا وسنرسل لك رسالة خاصة بكود التفعيل.",
    descriptionEn:
      "No worries! Enter your phone number and we'll send you a verification code.",
    icon: () => (
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
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
    ),
  },
  "/auth/reset-password": {
    taglineAr: "تعيين كلمة مرور جديدة",
    taglineEn: "Set New Password",
    descriptionAr: "اختر كلمة مرور قوية وآمنة لحماية حسابك الإداري.",
    descriptionEn:
      "Choose a strong, secure password to protect your admin account.",
    icon: () => (
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
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
};

// ============================================
// Admin Features (shown on non-login pages)
// ============================================

const adminFeatures = [
  {
    titleAr: "إدارة المتاجر",
    titleEn: "Store Management",
    descriptionAr: "مراجعة وقبول طلبات المتاجر",
    descriptionEn: "Review and approve store requests",
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
          d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
        />
      </svg>
    ),
  },
  {
    titleAr: "مراقبة السائقين",
    titleEn: "Driver Monitoring",
    descriptionAr: "متابعة أداء السائقين والطلبات",
    descriptionEn: "Track driver performance and deliveries",
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
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
    ),
  },
  {
    titleAr: "تقارير شاملة",
    titleEn: "Comprehensive Reports",
    descriptionAr: "تحليلات وإحصائيات المنصة",
    descriptionEn: "Platform analytics and statistics",
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
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
];

// ============================================
// Login Features (shown on login page)
// ============================================

const loginFeatures = [
  {
    titleAr: "دخول آمن",
    titleEn: "Secure Login",
    descriptionAr: "تشفير من طرف إلى طرف",
    descriptionEn: "End-to-end encryption",
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
    titleAr: "تحكم كامل",
    titleEn: "Full Control",
    descriptionAr: "إدارة المتاجر والسائقين",
    descriptionEn: "Manage stores and drivers",
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
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>
    ),
  },
  {
    titleAr: "تقارير فورية",
    titleEn: "Real-time Reports",
    descriptionAr: "متابعة الأداء والإحصائيات",
    descriptionEn: "Track performance and stats",
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
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
];

// ============================================
// Last Session Helpers
// ============================================

const getLastSession = async (): Promise<LastSession | null> => {
  try {
    const saved = localStorage.getItem("admin-last-session");
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

export const saveLastSession = (session: LastSession): void => {
  try {
    localStorage.setItem("admin-last-session", JSON.stringify(session));
  } catch {}
};

// ============================================
// Session Info Component
// ============================================

const SessionInfo: React.FC<{ session: LastSession | null; isAr: boolean }> = ({
  session,
  isAr,
}) => {
  if (!session) return null;
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000),
      minutes = Math.floor((diff % 3600000) / 60000);
    if (isAr) {
      if (hours > 24) return `منذ ${Math.floor(hours / 24)} يوم`;
      if (hours > 0) return `منذ ${hours} ساعة`;
      if (minutes > 0) return `منذ ${minutes} دقيقة`;
      return "الآن";
    }
    if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };
  const items = [
    { labelAr: "الجهاز", labelEn: "Device", value: session.device },
    { labelAr: "المتصفح", labelEn: "Browser", value: session.browser },
    { labelAr: "الموقع", labelEn: "Location", value: session.location },
    { labelAr: "الوقت", labelEn: "Time", value: timeAgo(session.time) },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/50">
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
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider">
          {isAr ? "آخر جلسة دخول" : "Last Login Session"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-white/8 backdrop-blur-sm border border-white/8 hover:bg-white/12 transition-colors duration-200"
          >
            <p
              className={cn(
                "text-[10px] text-white/40 uppercase tracking-wider mb-1.5",
                isAr ? "text-right" : "text-left",
              )}
            >
              {isAr ? item.labelAr : item.labelEn}
            </p>
            <p className="text-sm font-medium text-white truncate">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      {session.ip && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-success-400 shadow-lg shadow-success-400/50 animate-pulse-soft flex-shrink-0" />
          <p className="text-xs text-white/50 truncate">
            <span className="text-white/70 font-medium">IP:</span> {session.ip}
            <span className="mx-1.5 text-white/30">•</span>
            <span className="text-success-400/80 font-medium">
              {isAr ? "آمن" : "Secure"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Auth Footer
// ============================================

const AuthFooter: React.FC<{
  isLogin: boolean;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}> = ({ lang }) => (
  <div className="mt-6 text-center space-y-3">
    <a
      href="https://tamamapp.net/contact"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
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
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
        />
      </svg>
      {lang(t.needHelp)}
    </a>
  </div>
);

// ============================================
// Main Component — AuthLayout
// ============================================

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading, isLoginLoading } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { currentLanguage } = useLanguage();
  const location = useLocation();

  const isDark = resolvedTheme === "dark";
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const isLogin = location.pathname === "/auth/login";

  const content =
    routeContent[location.pathname] || routeContent["/auth/login"];

  // Load last session on login page
  useEffect(() => {
    if (isLogin) {
      getLastSession().then(setLastSession);
    }
  }, [isLogin]);

  // Redirect if already authenticated
  if (isLoading) return <PageLoader message={lang(t.verifying)} />;

  if (
    isAuthenticated &&
    !isLoginLoading &&
    !["/auth/forgot-password", "/auth/reset-password"].includes(
      location.pathname,
    )
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <a
        href="#auth-form"
        className="sr-only focus:not-sr-only absolute top-4 start-4 z-[60] px-4 py-2 rounded-xl bg-primary-600 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-950 text-sm font-medium"
      >
        {lang(t.skipToForm)}
      </a>

      {/* Left Panel */}
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-[42%] overflow-hidden items-center p-8 xl:p-12 2xl:p-16">
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-700",
            isDark
              ? "bg-gradient-to-br from-surface-900 via-primary-950 to-surface-950"
              : "bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800",
          )}
        />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute -top-32 -end-32 w-96 h-96 rounded-full blur-[120px]",
            isDark ? "bg-primary-800/25" : "bg-white/8",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute -bottom-40 -start-40 w-[450px] h-[450px] rounded-full blur-[120px]",
            isDark ? "bg-primary-800/15" : "bg-primary-300/12",
          )}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-lg">
          {/* Logo & Brand */}
          <div className="flex items-center gap-5 mb-12">
            <div className="w-16 h-16 xl:w-18 xl:h-18 rounded-2xl bg-white/12 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/15 flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-105 hover:bg-white/18 ring-1 ring-white/10">
              <img
                src="/icon.svg"
                alt="Tamam Logo"
                className="w-9 h-9 xl:w-10 xl:h-10 drop-shadow-lg"
              />
            </div>
            <div className={isAr ? "text-right" : "text-left"}>
              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold tracking-tight leading-none text-white">
                {lang(t.brandName)}
              </h1>
              <p className="text-xs xl:text-sm text-white/55 mt-1.5 font-medium tracking-wider uppercase">
                {lang(t.brandTagline)}
              </p>
            </div>
          </div>

          {/* Route Content */}
          <div className="flex gap-4">
            <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl flex-shrink-0 mt-0.5 bg-white/12 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/80">
              {content.icon(isAr)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-white leading-tight">
                {isAr ? content.taglineAr : content.taglineEn}
              </h2>
              <p className="text-sm xl:text-base text-white/65 leading-relaxed max-w-md mt-1.5">
                {isAr ? content.descriptionAr : content.descriptionEn}
              </p>
            </div>
          </div>

          {/* Session Info or Features */}
          {isLogin && lastSession ? (
            <div className="mt-10 animate-fade-in-up">
              <SessionInfo session={lastSession} isAr={isAr} />
            </div>
          ) : isLogin ? (
            <div className="mt-10 space-y-3 animate-fade-in-up">
              {loginFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/8 backdrop-blur-sm border border-white/10 hover:bg-white/12 transition-colors duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white/70">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {isAr ? f.titleAr : f.titleEn}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {isAr ? f.descriptionAr : f.descriptionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 space-y-3 animate-fade-in-up">
              {adminFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/8 backdrop-blur-sm border border-white/10 hover:bg-white/12 transition-colors duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white/70">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {isAr ? f.titleAr : f.titleEn}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {isAr ? f.descriptionAr : f.descriptionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl mt-10 bg-white/5 border border-white/8">
            <svg
              className="w-4 h-4 text-success-400 flex-shrink-0"
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
            <p className="text-xs text-white/50">
              <span className="text-white/70 font-medium">256-bit</span>{" "}
              {lang(t.securityBadge)}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 xl:p-16 bg-surface-50 dark:bg-surface-950 relative">
        <div className="absolute top-4 end-4 z-40 flex items-center gap-1.5">
          <LanguageSwitcher variant="navbar" className="shadow-sm" />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all duration-200 active:scale-95 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg
                className="w-5 h-5 text-warning-400"
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
            ) : (
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
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="lg:hidden w-full max-w-md mb-8 mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <img src="/icon.svg" alt="Tamam Logo" className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {lang(t.brandName)}
            </span>
          </Link>
          <p className="text-sm text-surface-500 dark:text-surface-400 px-4">
            {isAr ? content.descriptionAr : content.descriptionEn}
          </p>
        </div>

        <div
          id="auth-form"
          className="w-full max-w-md lg:max-w-lg xl:max-w-xl animate-fade-in-up"
        >
          <Suspense
            fallback={
              <div className="p-8 sm:p-10 flex items-center justify-center min-h-[400px] rounded-2xl bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border border-surface-200/50 dark:border-surface-800/50">
                <PageLoader variant="inline" message={lang(t.loading)} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>

        <AuthFooter isLogin={isLogin} isAr={isAr} lang={lang} />

        <div className="mt-6 text-center">
          <p className="text-[11px] text-surface-400 dark:text-surface-500">
            &copy; {new Date().getFullYear()} TamamApp. {lang(t.copyright)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
