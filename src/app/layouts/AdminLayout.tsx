import React, {
  Suspense,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  NavLink,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useAdminStore } from "@app/providers/AdminProvider";
import { useTheme } from "@app/providers/ThemeProvider";
import { useLanguage } from "@shared/hooks/useLanguage";
import { LanguageSwitcher } from "@shared/components/LanguageSwitcher";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { adminApi } from "@/config/admin.api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@shared/utils/cn";

// ============================================
// Types
// ============================================

interface NavItem {
  to: string;
  labelAr: string;
  labelEn: string;
  icon?: ReactNode;
  badge?: number;
  end?: boolean;
  children?: NavItem[];
}

// ============================================
// Icon Helper
// ============================================

const Icon: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <svg
    className={cn("w-5 h-5 flex-shrink-0", className)}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    {children}
  </svg>
);

// ============================================
// API Hooks — Live Data
// ============================================

/** Fetch unread Admin chat conversation count */
const useChatBadgeCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["adminChatBadge"],
    queryFn: async () => {
      const result = await adminApi.getChatUnreadCount();
      return result?.conversationsWithUnread ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: isAuthenticated,
    retry: (failureCount: number, error: unknown) => {
      if ((error as { status?: number })?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

/** Fetch pending payment confirmations count */
const usePendingPaymentsCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pendingPaymentsCount"],
    queryFn: async () => {
      const result = await adminApi.getPaymentConfirmations({
        status: "Pending",
        pageSize: 1,
      });
      return result?.totalCount ?? 0;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
};

/** Fetch pending withdrawals count */
const usePendingWithdrawalsCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pendingWithdrawalsCount"],
    queryFn: async () => {
      const result = await adminApi.getWithdrawals({
        status: "Pending",
        pageSize: 1,
      });
      return result?.totalCount ?? 0;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
};

/** Fetch pending complaints count */
const usePendingComplaintsCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pendingComplaintsCount"],
    queryFn: async () => {
      const result = await adminApi.getComplaints({
        status: "Open",
        pageSize: 1,
      });
      return result?.totalCount ?? 0;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
};

/** Fetch pending Admin onboarding requests count */
const usePendingRequestsCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pendingRequestsCount"],
    queryFn: async () => {
      const requests = await adminApi.getPendingRequests(1, 1);
      return requests?.totalCount ?? 0;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
};

/** Fetch pending Admin driver documents count */
const usePendingDriverDocumentsCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pendingDriverDocsCount"],
    queryFn: async () => {
      const docs = await adminApi.getPendingDriverDocuments(1, 1);
      return docs?.totalCount ?? 0;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
};

/** Fetch pending stores count */
const usePendingStoresCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pendingStoresCount"],
    queryFn: async () => {
      const stores = await adminApi.getPendingStores(1, 1);
      return stores?.totalCount ?? 0;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
};

/** Fetch pending store coupons count */
const usePendingCouponsCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pendingStoreCouponsCount"],
    queryFn: async () => {
      const coupons = await adminApi.getPendingStoreCoupons(1, 1);
      return coupons?.totalCount ?? 0;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
};

/** Fetch unread authenticated Admin notifications count */
const useUnreadNotificationsCount = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["adminUnreadNotifications"],
    queryFn: async () => {
      try {
        const response = await adminApi.getUnreadNotificationCount();
        return response?.total ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: isAuthenticated,
  });
};

// ============================================
// Navigation Items — Aligned with AppRouter
// ============================================

const useNavigationItems = (): NavItem[] => {
  const { data: pendingPayments = 0 } = usePendingPaymentsCount();
  const { data: pendingWithdrawals = 0 } = usePendingWithdrawalsCount();
  const { data: pendingComplaints = 0 } = usePendingComplaintsCount();
  const { data: pendingRequests = 0 } = usePendingRequestsCount();
  const { data: pendingDocs = 0 } = usePendingDriverDocumentsCount();
  const { data: pendingStores = 0 } = usePendingStoresCount();
  const { data: pendingCoupons = 0 } = usePendingCouponsCount();
  const { data: chatCount = 0 } = useChatBadgeCount();

  const walletBadge = pendingPayments + pendingWithdrawals;

  return [
    {
      to: "/dashboard",
      labelAr: "لوحة التحكم",
      labelEn: "Dashboard",
      end: true,
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/users",
      labelAr: "المستخدمين",
      labelEn: "Users",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </Icon>
      ),
      children: [
        { to: "/dashboard/users", labelAr: "الكل", labelEn: "All", end: true },
        {
          to: "/dashboard/admins/new",
          labelAr: "إضافة مسؤول",
          labelEn: "Add Admin",
        },
        {
          to: "/dashboard/stores/new",
          labelAr: "إضافة متجر",
          labelEn: "Add Store",
        },
        {
          to: "/dashboard/supervisors/new",
          labelAr: "إضافة مشرف",
          labelEn: "Add Supervisor",
        },
      ],
    },
    {
      to: "/dashboard/onboarding/requests",
      labelAr: "طلبات الانضمام",
      labelEn: "Onboarding Requests",
      badge: pendingRequests,
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/drivers",
      labelAr: "السائقين",
      labelEn: "Drivers",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </Icon>
      ),
      children: [
        {
          to: "/dashboard/drivers",
          labelAr: "الكل",
          labelEn: "All",
          end: true,
        },
        {
          to: "/dashboard/drivers/documents",
          labelAr: "المستندات",
          labelEn: "Documents",
          badge: pendingDocs,
        },
      ],
    },
    {
      to: "/dashboard/stores",
      labelAr: "المتاجر",
      labelEn: "Stores",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        </Icon>
      ),
      children: [
        { to: "/dashboard/stores", labelAr: "الكل", labelEn: "All", end: true },
        {
          to: "/dashboard/stores/pending",
          labelAr: "قيد المراجعة",
          labelEn: "Pending",
          badge: pendingStores,
        },
        {
          to: "/dashboard/stores/boosted",
          labelAr: "المعززة",
          labelEn: "Boosted",
        },
        {
          to: "/dashboard/store-types",
          labelAr: "التصنيفات والأنواع",
          labelEn: "Types & Categories",
        },
        {
          to: "/dashboard/store-coupons",
          labelAr: "الكوبونات",
          labelEn: "Coupons",
          badge: pendingCoupons,
        },
      ],
    },
    {
      to: "/dashboard/cities",
      labelAr: "المدن والمناطق",
      labelEn: "Cities & Areas",
      icon: (
        <Icon>
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
        </Icon>
      ),
      children: [
        {
          to: "/dashboard/cities",
          labelAr: "المدن",
          labelEn: "Cities",
          end: true,
        },
        { to: "/dashboard/areas", labelAr: "المناطق", labelEn: "Areas" },
        {
          to: "/dashboard/supervisors",
          labelAr: "المشرفين",
          labelEn: "Supervisors",
        },
      ],
    },
    {
      to: "/dashboard/orders",
      labelAr: "الطلبات",
      labelEn: "Orders",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/wallets",
      labelAr: "المحافظ",
      labelEn: "Finance",
      badge: walletBadge,
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/commissions",
      labelAr: "العمولات",
      labelEn: "Commissions",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/complaints",
      labelAr: "الشكاوى",
      labelEn: "Complaints",
      badge: pendingComplaints,
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/ads",
      labelAr: "الإعلانات",
      labelEn: "Ads",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/chat",
      labelAr: "المحادثات",
      labelEn: "Chat",
      badge: chatCount,
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/broadcast",
      labelAr: "إرسال إشعار",
      labelEn: "Broadcast",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </Icon>
      ),
    },
  ];
};

const useBottomNavItems = (): NavItem[] => {
  const { data: unreadNotifs = 0 } = useUnreadNotificationsCount();
  return [
    {
      to: "/dashboard/notifications",
      labelAr: "الإشعارات",
      labelEn: "Notifications",
      badge: unreadNotifs,
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/reports",
      labelAr: "التقارير",
      labelEn: "Reports",
      icon: (
        <Icon>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </Icon>
      ),
    },
    {
      to: "/dashboard/settings",
      labelAr: "الإعدادات",
      labelEn: "Settings",
      icon: (
        <Icon>
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
        </Icon>
      ),
    },
  ];
};

// ============================================
// Sidebar
// ============================================

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const isAr = currentLanguage === "ar";
  const navigationItems = useNavigationItems();
  const bottomNavItems = useBottomNavItems();

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of navigationItems) {
      if (
        item.children?.some(
          (child) =>
            location.pathname === child.to ||
            location.pathname.startsWith(`${child.to}/`),
        )
      ) {
        initial.add(item.to);
      }
    }
    return initial;
  });

  const adminName = user?.fullName || (isAr ? "مدير النظام" : "System Admin");
  const adminInitial = adminName?.charAt(0) || "م";

  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    if (prevPathname.current === location.pathname) return;
    prevPathname.current = location.pathname;

    for (const item of navigationItems) {
      if (
        item.children?.some(
          (child) =>
            location.pathname === child.to ||
            location.pathname.startsWith(`${child.to}/`),
        )
      ) {
        setExpandedItems((prev) => {
          if (prev.has(item.to)) return prev;
          return new Set(prev).add(item.to);
        });
      }
    }
  }, [location.pathname, navigationItems]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleExpand = (to: string) => {
    if (collapsed && !mobileOpen) {
      setCollapsed(false);
      setExpandedItems(new Set([to]));
      return;
    }
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to);
      else next.add(to);
      return next;
    });
  };
  const getLabel = (item: NavItem) => (isAr ? item.labelAr : item.labelEn);

  const renderNavItem = (item: NavItem) => {
    const hasChildren = !!item.children?.length;
    const isExpanded = expandedItems.has(item.to);
    const isActive =
      location.pathname === item.to ||
      (item.end && location.pathname === item.to);
    const childActive = item.children?.some(
      (c) =>
        location.pathname === c.to || location.pathname.startsWith(`${c.to}/`),
    );

    if (hasChildren) {
      return (
        <React.Fragment key={item.to}>
          <button
            onClick={() => toggleExpand(item.to)}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative w-full text-start",
              !(collapsed && !mobileOpen) && "gap-3 px-3 py-2.5",
              collapsed &&
                !mobileOpen &&
                "lg:w-12 lg:h-12 lg:p-0 lg:justify-center lg:mx-auto",
              isActive || childActive
                ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm"
                : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-surface-200",
            )}
            title={collapsed && !mobileOpen ? getLabel(item) : undefined}
          >
            {(isActive || childActive) && (
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary-600 dark:bg-primary-400 animate-scale-in",
                  isAr ? "right-0 rounded-l-full" : "left-0 rounded-r-full",
                  collapsed &&
                    !mobileOpen &&
                    (isAr ? "lg:-right-3" : "lg:-left-3"),
                )}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex-shrink-0">{item.icon}</span>
            <span
              className={cn(
                "truncate relative z-10 transition-all flex-1",
                collapsed && !mobileOpen && "lg:hidden",
              )}
            >
              {getLabel(item)}
            </span>
            {item.badge != null && item.badge > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full relative z-10",
                  isActive || childActive
                    ? "bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300"
                    : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
                  collapsed && !mobileOpen && "lg:hidden",
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            {item.badge != null &&
              item.badge > 0 &&
              collapsed &&
              !mobileOpen && (
                <span
                  className="hidden lg:block absolute top-2.5 end-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-900 shadow-sm"
                  aria-hidden="true"
                />
              )}
            <svg
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-transform duration-200 relative z-10",
                isExpanded && "rotate-180",
                collapsed && !mobileOpen && "lg:hidden",
              )}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {isExpanded && !(collapsed && !mobileOpen) && (
            <div className="space-y-0.5 ms-6 border-s-2 border-surface-200 dark:border-surface-700 ps-2 my-1">
              {item.children!.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  end={child.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive
                        ? "bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 font-medium"
                        : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/50",
                    )
                  }
                >
                  <span className="truncate flex-1">
                    {isAr ? child.labelAr : child.labelEn}
                  </span>
                  {child.badge != null && child.badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[9px] font-bold rounded-full bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">
                      {child.badge > 99 ? "99+" : child.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </React.Fragment>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative",
            !(collapsed && !mobileOpen) && "gap-3 px-3 py-2.5 w-full",
            collapsed &&
              !mobileOpen &&
              "lg:w-12 lg:h-12 lg:p-0 lg:justify-center lg:mx-auto",
            isActive
              ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm"
              : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-surface-200",
          )
        }
        title={collapsed && !mobileOpen ? getLabel(item) : undefined}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary-600 dark:bg-primary-400",
                  isAr ? "right-0 rounded-l-full" : "left-0 rounded-r-full",
                  collapsed &&
                    !mobileOpen &&
                    (isAr ? "lg:-right-3" : "lg:-left-3"),
                )}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex-shrink-0">{item.icon}</span>
            <span
              className={cn(
                "truncate relative z-10 transition-all",
                collapsed && !mobileOpen ? "lg:hidden" : "flex-1",
              )}
            >
              {getLabel(item)}
            </span>
            {item.badge != null && item.badge > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full relative z-10",
                  isActive
                    ? "bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300"
                    : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
                  collapsed && !mobileOpen && "lg:hidden",
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            {item.badge != null &&
              item.badge > 0 &&
              collapsed &&
              !mobileOpen && (
                <span
                  className="hidden lg:block absolute top-2.5 end-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-900 shadow-sm"
                  aria-hidden="true"
                />
              )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed top-0 h-full z-50 flex flex-col bg-surface-50/90 dark:bg-surface-950/90 backdrop-blur-xl border-e border-surface-200/50 dark:border-surface-800/50 transition-all duration-300",
          isAr ? "right-0" : "left-0",
          mobileOpen ? "w-full" : collapsed ? "w-[72px]" : "w-64",
          mobileOpen
            ? "translate-x-0"
            : cn(
                isAr
                  ? "translate-x-full lg:translate-x-0"
                  : "-translate-x-full lg:translate-x-0",
              ),
        )}
        aria-label={isAr ? "القائمة الجانبية" : "Sidebar navigation"}
      >
        <div
          className={cn(
            "h-16 flex items-center border-b border-surface-200/50 dark:border-surface-800/50 flex-shrink-0",
            collapsed && !mobileOpen
              ? "lg:justify-center px-3"
              : "justify-between px-5",
          )}
        >
          {/* Logo */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <img
              src="/icon.svg"
              alt="Tamam"
              className="w-8 h-8 rounded-lg flex-shrink-0"
            />
            <div
              className={cn(
                "flex flex-col min-w-0",
                collapsed && !mobileOpen && "lg:hidden",
              )}
            >
              <span className="text-lg font-bold text-surface-900 dark:text-surface-100 truncate">
                {isAr ? "تطبيق تمام" : "Tamam App"}
              </span>
              <span className="text-[10px] text-surface-500 dark:text-surface-400 -mt-0.5">
                {isAr ? "منصة تحكم الإدارة" : "Admin Control Platform"}
              </span>
            </div>
          </NavLink>

          {/* Close Button - Mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
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

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {navigationItems.map(renderNavItem)}
          <div className="my-3 border-t border-surface-200 dark:border-surface-700" />
          {bottomNavItems.map(renderNavItem)}
        </nav>

        <div className="p-3 border-t border-surface-200/50 dark:border-surface-800/50">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && !mobileOpen && "lg:justify-center",
            )}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {adminInitial}
              </span>
            </div>
            <div
              className={cn(
                "flex-1 min-w-0",
                collapsed && !mobileOpen && "lg:hidden",
              )}
            >
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                {adminName}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {isAr ? "مدير النظام" : "System Admin"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// ============================================
// Navbar — Live API Data
// ============================================

const Navbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { admin } = useAdminStore();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const isDark = resolvedTheme === "dark";

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: unreadNotifs = 0 } = useUnreadNotificationsCount();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as HTMLElement)
      )
        setUserMenuOpen(false);
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as HTMLElement)
      )
        setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success(isAr ? "تم تسجيل الخروج" : "Logged out");
    navigate("/auth/login");
  };
  const displayName =
    admin?.fullName || user?.fullName || (isAr ? "مدير النظام" : "Admin");
  const displayEmail = admin?.email || user?.email || "";

  return (
    <header
      className={cn(
        "h-16 sticky top-0 z-30 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50 flex items-center justify-between px-4 lg:px-6",
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <LanguageSwitcher variant="navbar" />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
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
              className="w-5 h-5 text-surface-600"
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

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            className={cn(
              "p-2 rounded-xl relative text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800",
              notificationsOpen && "bg-surface-100 dark:bg-surface-800",
            )}
          >
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
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-error-500 ring-2 ring-white dark:ring-surface-900" />
            )}
          </button>
          {notificationsOpen && (
            <div
              className={cn(
                "absolute top-full mt-2 w-80 rounded-2xl glass glass-elevated z-50",
                isAr ? "left-0" : "right-0",
              )}
            >
              <div className="p-4 border-b border-surface-200/50 dark:border-surface-800/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold">
                  {isAr ? "الإشعارات" : "Notifications"}
                </h3>
                <NavLink
                  to="/dashboard/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-primary-600 dark:text-primary-400"
                >
                  {isAr ? "عرض الكل" : "View all"}
                </NavLink>
              </div>
              <div className="p-4 text-center text-sm text-surface-500">
                {unreadNotifs > 0
                  ? isAr
                    ? `لديك ${unreadNotifs} إشعار غير مقروء`
                    : `You have ${unreadNotifs} unread notifications`
                  : isAr
                    ? "لا توجد إشعارات جديدة"
                    : "No new notifications"}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {displayName?.charAt(0) || "A"}
              </span>
            </div>
          </button>
          {userMenuOpen && (
            <div
              className={cn(
                "absolute top-full mt-2 w-56 rounded-2xl glass glass-elevated z-50",
                isAr ? "left-0" : "right-0",
              )}
            >
              <div className="p-4 border-b border-surface-200/50 dark:border-surface-800/50">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {displayEmail}
                </p>
              </div>
              <div className="p-2">
                <NavLink
                  to="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
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
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                  {isAr ? "الإعدادات" : "Settings"}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30"
                >
                  {isAr ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================
// AdminLayout
// ============================================

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("tamam-sidebar-collapsed") === "true",
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("tamam-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  if (isLoading)
    return <PageLoader message={isAr ? "جاري التحميل..." : "Loading..."} />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div
      className="h-screen flex bg-surface-50 dark:bg-surface-950"
      dir={isAr ? "rtl" : "ltr"}
    >
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:ms-[72px]" : "lg:ms-64",
        )}
      >
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
            <Suspense fallback={<PageLoader variant="inline" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
