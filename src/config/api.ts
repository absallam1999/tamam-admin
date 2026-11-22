/**
 * Tamam Admin API
 */

interface RuntimeEnv {
  VITE_API_BASE_URL?: string;
  DEV?: boolean;
  PROD?: boolean;
}

const runtimeEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {};

export const API_BASE_URL = runtimeEnv.VITE_API_BASE_URL || "";

export const withQuery = (
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return query ? `${path}?${query}` : path;
};

export const ENDPOINTS = {
  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  AUTH_LOGIN: "/api/auth/login",
  AUTH_OTP_SEND: "/api/auth/otp/send",
  AUTH_OTP_VERIFY: "/api/auth/otp/verify",
  AUTH_REFRESH: "/api/auth/refresh",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_CHANGE_PASSWORD: "/api/auth/change-password",
  AUTH_ADMIN_TOGGLE_USER_ACTIVE: (userId: string, role?: string) =>
    withQuery(`/api/auth/admin/users/${userId}/toggle-active`, { role }),

  // ---------------------------------------------------------------------------
  // Admin dashboard and legacy account surface
  // ---------------------------------------------------------------------------
  ADMIN_OVERVIEW: "/api/admin/overview",
  ADMIN_DASHBOARD_STATS: "/api/admin/dashboard/stats",
  ADMIN_DASHBOARD_ANALYTICS: "/api/admin/dashboard/analytics",

  // /api/admin/user-management/* routes for the new Admin UI.
  ADMIN_LEGACY_ADMINS: "/api/admin/admins",
  ADMIN_LEGACY_ADMIN_BY_ID: (id: string) => `/api/admin/admins/${id}`,
  ADMIN_LEGACY_USERS: "/api/admin/users",
  ADMIN_LEGACY_USER_BY_ID: (id: string, role?: string) =>
    withQuery(`/api/admin/users/${id}`, { role }),
  ADMIN_LEGACY_USER_SUSPEND: (id: string, role?: string) =>
    withQuery(`/api/admin/users/${id}/suspend`, { role }),
  ADMIN_LEGACY_USER_ACTIVATE: (id: string, role?: string) =>
    withQuery(`/api/admin/users/${id}/activate`, { role }),

  // ---------------------------------------------------------------------------
  // Admin user-management v2
  // ---------------------------------------------------------------------------
  ADMIN_USERS: "/api/admin/user-management/users",
  ADMIN_USER_BY_ID: (id: string) => `/api/admin/user-management/users/${id}`,
  ADMIN_USER_ACTIVE: (id: string) => `/api/admin/user-management/users/${id}/active`,
  ADMIN_ADMINS: "/api/admin/user-management/admins",
  ADMIN_ADMIN_BY_ID: (id: string) => `/api/admin/user-management/admins/${id}`,

  // ---------------------------------------------------------------------------
  // Ads
  // ---------------------------------------------------------------------------
  ADMIN_ADS: "/api/admin/ads",
  ADMIN_AD_BY_ID: (id: string) => `/api/admin/ads/${id}`,
  ADMIN_AD_TOGGLE: (id: string) => `/api/admin/ads/${id}/toggle`,

  // ---------------------------------------------------------------------------
  // Areas and supervisors
  // ---------------------------------------------------------------------------
  ADMIN_AREAS: "/api/admin/areas",
  ADMIN_AREA_BY_ID: (id: string) => `/api/admin/areas/${id}`,
  ADMIN_SUPERVISORS: "/api/admin/supervisors",
  ADMIN_SUPERVISOR_BY_ID: (id: string) => `/api/admin/supervisors/${id}`,
  ADMIN_SUPERVISOR_AREA: (supervisorId: string, areaId: string) =>
    `/api/admin/supervisors/${supervisorId}/areas/${areaId}`,

  // ---------------------------------------------------------------------------
  // Bonus system
  // ---------------------------------------------------------------------------
  ADMIN_BONUS_STATUS: "/api/admin/bonus/status",
  ADMIN_BONUS_ENABLE: "/api/admin/bonus/enable",
  ADMIN_BONUS_DISABLE: "/api/admin/bonus/disable",
  ADMIN_BONUS_TIERS: "/api/admin/bonus/tiers",
  ADMIN_BONUS_TIER_BY_ID: (id: string) => `/api/admin/bonus/tiers/${id}`,
  ADMIN_BONUS_TIER_TOGGLE: (id: string) => `/api/admin/bonus/tiers/${id}/toggle`,

  // ---------------------------------------------------------------------------
  // Admin chat
  // ---------------------------------------------------------------------------
  ADMIN_CHAT: "/api/admin/chat",
  ADMIN_CHAT_BY_ID: (id: string) => `/api/admin/chat/${id}`,
  ADMIN_CHAT_MESSAGES: (id: string) => `/api/admin/chat/${id}/messages`,
  ADMIN_CHAT_MESSAGE_ATTACHMENT: (id: string) => `/api/admin/chat/${id}/messages/attachment`,
  ADMIN_CHAT_READ: (id: string) => `/api/admin/chat/${id}/read`,
  ADMIN_CHAT_CLOSE: (id: string) => `/api/admin/chat/${id}/close`,
  ADMIN_CHAT_ASSIGN: (id: string) => `/api/admin/chat/${id}/assign`,
  ADMIN_CHAT_ATTACHMENTS: (id: string) => `/api/admin/chat/${id}/attachments`,
  ADMIN_CHAT_UNREAD_COUNT: "/api/admin/chat/unread-count",

  // ---------------------------------------------------------------------------
  // Cities
  // ---------------------------------------------------------------------------
  ADMIN_CITIES: "/api/admin/cities",
  ADMIN_CITIES_WITH_STATS: "/api/admin/cities/with-stats",
  ADMIN_CITY_BY_ID: (id: string) => `/api/admin/cities/${id}`,
  ADMIN_CITY_ACTIVE: (id: string) => `/api/admin/cities/${id}/active`,
  ADMIN_CITIES_LOOKUP: "/api/admin/cities/lookup",

  // ---------------------------------------------------------------------------
  // Complaints and customer actions
  // ---------------------------------------------------------------------------
  ADMIN_COMPLAINTS: "/api/admin/complaints",
  ADMIN_COMPLAINT_BY_ID: (id: string) => `/api/admin/complaints/${id}`,
  ADMIN_COMPLAINT_RESOLVE: (id: string) => `/api/admin/complaints/${id}/resolve`,
  ADMIN_CUSTOMER_LOOKUP: "/api/admin/customers/lookup",
  ADMIN_CUSTOMER_LOYALTY_ADJUST: (customerId: string) =>
    `/api/admin/customers/${customerId}/loyalty/adjust`,

  // ---------------------------------------------------------------------------
  // Drivers and driver documents
  // ---------------------------------------------------------------------------
  ADMIN_DRIVERS: "/api/admin/drivers",
  ADMIN_DRIVER_BY_ID: (id: string) => `/api/admin/drivers/${id}`,
  ADMIN_DRIVERS_NEARBY: "/api/admin/drivers/nearby",
  ADMIN_DRIVER_VERIFY: (id: string) => `/api/admin/drivers/${id}/verify`,
  ADMIN_DRIVER_DOCUMENTS: "/api/admin/documents",
  ADMIN_DRIVER_DOCUMENTS_PENDING: "/api/admin/documents/pending",
  ADMIN_DRIVER_DOCUMENT_BY_ID: (id: string) => `/api/admin/documents/${id}`,
  ADMIN_DRIVER_DOCUMENTS_BY_DRIVER: (driverId: string) =>
    `/api/admin/drivers/${driverId}/documents`,
  ADMIN_DRIVER_DOCUMENT_VERIFY: (id: string) => `/api/admin/documents/${id}/verify`,
  ADMIN_DRIVER_DOCUMENT_REJECT: (id: string) => `/api/admin/documents/${id}/reject`,

  // ---------------------------------------------------------------------------
  // Finance
  // ---------------------------------------------------------------------------
  ADMIN_FINANCE_SUMMARY: "/api/admin/finance/summary",
  ADMIN_FINANCE_TRANSACTIONS: "/api/admin/finance/transactions",
  ADMIN_FINANCE_WITHDRAWALS: "/api/admin/finance/withdrawals",
  ADMIN_FINANCE_WITHDRAWAL_PROCESS: (id: string) =>
    `/api/admin/finance/withdrawals/${id}/process`,
  ADMIN_FINANCE_WITHDRAWAL_REJECT: (id: string) =>
    `/api/admin/finance/withdrawals/${id}/reject`,
  ADMIN_FINANCE_PAYOUTS: "/api/admin/finance/payouts",
  ADMIN_FINANCE_WALLET_STATS: "/api/admin/finance/wallets/stats",
  ADMIN_FINANCE_PLATFORM_WALLET: "/api/admin/finance/platform-wallet",

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  ADMIN_NOTIFICATIONS: "/api/admin/notifications",
  ADMIN_NOTIFICATION_BY_ID: (id: string) => `/api/admin/notifications/${id}`,
  ADMIN_NOTIFICATIONS_BULK: "/api/admin/notifications/bulk",
  ADMIN_NOTIFICATIONS_STATS: "/api/admin/notifications/stats",
  ADMIN_NOTIFICATION_RETRY: (id: string) => `/api/admin/notifications/${id}/retry`,

  // Shared authenticated notification inbox for the current Admin user.
  NOTIFICATIONS: "/api/notifications",
  NOTIFICATION_BY_ID: (id: string) => `/api/notifications/${id}`,
  NOTIFICATIONS_UNREAD_COUNT: "/api/notifications/unread-count",
  NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: "/api/notifications/read-all",
  NOTIFICATION_PREFERENCES: "/api/notifications/preferences",

  // ---------------------------------------------------------------------------
  // Onboarding requests
  // ---------------------------------------------------------------------------
  ADMIN_REQUESTS: "/api/admin/requests",
  ADMIN_REQUESTS_PENDING: "/api/admin/requests/pending",
  ADMIN_REQUEST_BY_ID: (id: string) => `/api/admin/requests/${id}`,
  ADMIN_REQUEST_APPROVE: (id: string) => `/api/admin/requests/${id}/approve`,
  ADMIN_REQUEST_REJECT: (id: string) => `/api/admin/requests/${id}/reject`,

  // ---------------------------------------------------------------------------
  // Payments and payment numbers
  // ---------------------------------------------------------------------------
  ADMIN_PAYMENT_NUMBERS: "/api/admin/payments/numbers",
  ADMIN_PAYMENT_NUMBER_BY_ID: (id: string) => `/api/admin/payments/numbers/${id}`,
  ADMIN_PAYMENT_CONFIRMATIONS: "/api/admin/payments/confirmations",
  ADMIN_PAYMENT_CONFIRMATION_BY_ID: (id: string) =>
    `/api/admin/payments/confirmations/${id}`,
  ADMIN_PAYMENT_CONFIRMATION_VERIFY: (id: string) =>
    `/api/admin/payments/confirmations/${id}/verify`,
  ADMIN_PAYMENT_CONFIRMATION_REJECT: (id: string) =>
    `/api/admin/payments/confirmations/${id}/reject`,

  // ---------------------------------------------------------------------------
  // Platform settings
  // ---------------------------------------------------------------------------
  ADMIN_SETTINGS: "/api/admin/settings",

  // ---------------------------------------------------------------------------
  // Store categories
  // ---------------------------------------------------------------------------
  ADMIN_STORE_CATEGORIES: "/api/admin/store-categories",
  ADMIN_STORE_CATEGORIES_ACTIVE: "/api/admin/store-categories/active",
  ADMIN_STORE_CATEGORY_BY_ID: (id: string) => `/api/admin/store-categories/${id}`,
  ADMIN_STORE_CATEGORY_WITH_TYPES: (id: string) =>
    `/api/admin/store-categories/${id}/with-types`,
  ADMIN_STORE_CATEGORIES_WITH_TYPES: "/api/admin/store-categories/with-types",
  ADMIN_STORE_CATEGORY_TOGGLE: (id: string) => `/api/admin/store-categories/${id}/toggle`,

  // ---------------------------------------------------------------------------
  // Store coupons
  // ---------------------------------------------------------------------------
  ADMIN_STORE_COUPONS: "/api/admin/store-coupons",
  ADMIN_STORE_COUPONS_PENDING: "/api/admin/store-coupons/pending",
  ADMIN_STORE_COUPON_BY_ID: (id: string) => `/api/admin/store-coupons/${id}`,
  ADMIN_STORE_COUPON_APPROVE: (id: string) => `/api/admin/store-coupons/${id}/approve`,
  ADMIN_STORE_COUPON_REJECT: (id: string) => `/api/admin/store-coupons/${id}/reject`,
  ADMIN_STORE_COUPON_ACTIVE: (id: string) => `/api/admin/store-coupons/${id}/active`,

  // ---------------------------------------------------------------------------
  // Store owners
  // ---------------------------------------------------------------------------
  ADMIN_STORE_OWNERS: "/api/admin/store-owners",
  ADMIN_STORE_OWNER_BY_ID: (ownerId: string) => `/api/admin/store-owners/${ownerId}`,
  ADMIN_STORE_OWNER_STORE: (ownerId: string, storeId: string) =>
    `/api/admin/store-owners/${ownerId}/stores/${storeId}`,

  // ---------------------------------------------------------------------------
  // Store types
  // ---------------------------------------------------------------------------
  ADMIN_STORE_TYPES: "/api/admin/store-types",
  ADMIN_STORE_TYPES_ACTIVE: "/api/admin/store-types/active",
  ADMIN_STORE_TYPE_BY_ID: (id: string) => `/api/admin/store-types/${id}`,
  ADMIN_STORE_TYPE_TOGGLE: (id: string) => `/api/admin/store-types/${id}/toggle`,

  // ---------------------------------------------------------------------------
  // Stores
  // ---------------------------------------------------------------------------
  ADMIN_STORES: "/api/admin/stores",
  ADMIN_STORES_PENDING: "/api/admin/stores/pending",
  ADMIN_STORES_BOOSTED: "/api/admin/stores/boosted",
  ADMIN_STORE_BY_ID: (id: string) => `/api/admin/stores/${id}`,
  ADMIN_STORE_ASSIGN_OWNER: (storeId: string) =>
    `/api/admin/stores/${storeId}/assign-owner`,
  ADMIN_STORE_OWNER: (storeId: string) => `/api/admin/stores/${storeId}/owner`,
  ADMIN_STORE_VERIFY: (id: string) => `/api/admin/stores/${id}/verify`,
  ADMIN_STORE_REJECT: (id: string) => `/api/admin/stores/${id}/reject`,
  ADMIN_STORE_SUSPEND: (id: string) => `/api/admin/stores/${id}/suspend`,
  ADMIN_STORE_ACTIVE: (id: string) => `/api/admin/stores/${id}/active`,
  ADMIN_STORE_OPEN: (id: string) => `/api/admin/stores/${id}/open`,
  ADMIN_STORE_BUSY: (id: string) => `/api/admin/stores/${id}/busy`,
  ADMIN_STORE_BOOST: (id: string) => `/api/admin/stores/${id}/boost`,
  ADMIN_STORE_OWNER_ASSIGN: (id: string) => `/api/admin/stores/${id}/owner`,
  ADMIN_STORE_LOGO: (id: string) => `/api/admin/stores/${id}/logo`,
  ADMIN_STORE_COVER: (id: string) => `/api/admin/stores/${id}/cover`,
  ADMIN_STORE_TYPE_MAPPING_APPROVE: (mappingId: string) =>
    `/api/admin/stores/type-mappings/${mappingId}/approve`,
  ADMIN_STORE_TYPE_MAPPING_REJECT: (mappingId: string) =>
    `/api/admin/stores/type-mappings/${mappingId}/reject`,

  // ---------------------------------------------------------------------------
  // Shared file upload/manage API
  // ---------------------------------------------------------------------------
  FILE_UPLOAD: "/api/files/upload",
  FILE_UPLOAD_MULTIPLE: "/api/files/upload-multiple",
  FILE_DELETE: (path: string) => `/api/files/${path}`,
  FILE_INFO: "/api/files/info",
} as const;

export const getApiUrl = (endpoint: string): string => `${API_BASE_URL}${endpoint}`;

export const isDev = runtimeEnv.DEV === true;
export const isProd = runtimeEnv.PROD === true;
