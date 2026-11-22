import { apiClient } from "@/lib/api-client";
import { ENDPOINTS, withQuery } from "@/config/api";

import type {
  AdDto,
  AdminDto,
  AttachmentUploadResultDto,
  AnalyticsDashboardDto,
  ApiResponse,
  AreaDto,
  AssignStoreOwnerRequest,
  AdjustLoyaltyRequest,
  AssignConversationDto,
  BulkSendNotificationDto,
  BulkSendResultDto,
  BonusStatusDto,
  BonusTierDto,
  CategoryWithTypesDto,
  ChatMessagesQueryParams,
  ChatQueryParams,
  ChatUnreadCountDto,
  CityDto,
  CityListDto,
  CityQueryParams,
  CityWithStatsDto,
  CloseConversationDto,
  ComplaintDto,
  CreateAdDto,
  CreateAdminDto,
  CreateAreaDto,
  CreateBonusTierDto,
  CreateCityDto,
  CreateDriverDto,
  CreatePaymentNumberDto,
  CreateStoreCategoryDto,
  CreateStoreDto,
  CreateStoreOwnerDto,
  CreateStoreOwnerResultDto,
  CreateStoreTypeDto,
  CreateSupervisorDto,
  DashboardStatsDto,
  DriverBrowseDto,
  DriverDocumentDto,
  DriverDto,
  DriverQueryParams,
  FinanceQueryParams,
  FinancialSummaryDto,
  FinancialTransactionDto,
  LoginDto,
  AuthResponseDto,
  MessageDto,
  NotificationAdminDto,
  NotificationDto,
  NotificationPreferencesDto,
  NotificationQueryParams,
  NotificationStatsDto,
  NotificationSummaryDto,
  UnreadCountDto,
  MarkAllAsReadResultDto,
  UpdateNotificationPreferencesDto,
  FileUploadResultDto,
  MultipleFileUploadResultDto,
  FileInfoDto,
  PagedResult,
  PaymentConfirmationDto,
  PaymentConfirmationQueryParams,
  PaymentNumberDto,
  PayoutDto,
  PlatformSettingsDto,
  PlatformWalletDto,
  ProcessPaymentConfirmationDto,
  ProcessWithdrawalDto,
  ReasonRequest,
  RejectConfirmationRequest,
  RejectDocumentRequest,
  RejectRequestDto,
  RejectStoreCouponDto,
  RejectWithdrawalRequest,
  RequestDto,
  RequestQueryParams,
  ResolveComplaintDto,
  SendNotificationDto,
  SendMessageDto,
  SetCityActiveRequest,
  SetDriverVerificationRequest,
  SetStoreActiveRequest,
  SetStoreBoostRequest,
  SetStoreBusyRequest,
  SetStoreOpenRequest,
  SetUserActiveRequest,
  StoreCategoryDto,
  StoreCategoryListDto,
  StoreCouponApprovalDto,
  StoreCouponQueryParams,
  StoreDto,
  StoreOwnerDto,
  StoreOwnerListItemDto,
  StoreQueryParams,
  StoreTypeDto,
  StoreTypeListDto,
  SupervisorDto,
  UpdateAdDto,
  UpdateAdminDto,
  UpdateAreaDto,
  UpdateBonusTierDto,
  UpdateCityDto,
  UpdateDriverDto,
  UpdatePaymentNumberDto,
  UpdateStoreCategoryDto,
  UpdateStoreDto,
  UpdateStoreOwnerDto,
  UpdateStoreTypeDto,
  UpdateSupervisorDto,
  UpdateUserDto,
  UserDetailDto,
  UserListItemDto,
  UsersQueryParams,
  VerifyDocumentDto,
  VerifyStoreDto,
  WalletStatsDto,
  WithdrawalDto,
} from "@shared/types";

// -----------------------------------------------------------------------------
// Response normalization
// -----------------------------------------------------------------------------

export type QueryValue = string | number | boolean | null | undefined;

const unwrap = <T>(response: T | ApiResponse<T> | null | undefined): T => {
  if (response && typeof response === "object" && "success" in response) {
    return (response as ApiResponse<T>).data as T;
  }
  return response as T;
};

const unwrapRequest = async <T>(request: Promise<T | ApiResponse<T>>): Promise<T> =>
  unwrap(await request);

const get = <T>(path: string, params?: object) =>
  unwrapRequest<T>(
    apiClient.get<T | ApiResponse<T>>(
      withQuery(path, (params ?? {}) as Record<string, QueryValue>),
    ),
  );

const post = <T>(path: string, body?: unknown) =>
  unwrapRequest<T>(apiClient.post<T | ApiResponse<T>>(path, body));

const put = <T>(path: string, body: unknown) =>
  unwrapRequest<T>(apiClient.put<T | ApiResponse<T>>(path, body));

const patch = <T>(path: string, body?: unknown) =>
  unwrapRequest<T>(apiClient.patch<T | ApiResponse<T>>(path, body));

const del = <T = void>(path: string) =>
  unwrapRequest<T>(apiClient.delete<T | ApiResponse<T>>(path));

const paged = <T>(response: PagedResult<T> | ApiResponse<PagedResult<T>>) =>
  unwrap(response);

// -----------------------------------------------------------------------------
// Admin API
// -----------------------------------------------------------------------------

export const adminApi = {
  // Auth
  login: (dto: LoginDto) => post<AuthResponseDto>(ENDPOINTS.AUTH_LOGIN, dto),
  logout: () => post<void>(ENDPOINTS.AUTH_LOGOUT),
  refreshToken: (dto: { token?: string | null; refreshToken?: string | null }) =>
    post<AuthResponseDto>(ENDPOINTS.AUTH_REFRESH, dto),
  changePassword: (newPassword: string) =>
    post<void>(ENDPOINTS.AUTH_CHANGE_PASSWORD, { newPassword }),
  sendOtp: (dto: { phoneNumber?: string | null; role?: string }) =>
    post(ENDPOINTS.AUTH_OTP_SEND, dto),
  verifyOtp: (dto: { phoneNumber?: string | null; code?: string | null; role?: string }) =>
    post<AuthResponseDto>(ENDPOINTS.AUTH_OTP_VERIFY, dto),

  // Dashboard
  getDashboardStats: () => get<DashboardStatsDto>(ENDPOINTS.ADMIN_DASHBOARD_STATS),
  getOverview: () => get<DashboardStatsDto>(ENDPOINTS.ADMIN_OVERVIEW),
  getAnalytics: (period?: string) =>
    get<AnalyticsDashboardDto>(ENDPOINTS.ADMIN_DASHBOARD_ANALYTICS, { period }),

  // Legacy accounts (kept only for API compatibility)
  getLegacyAdmins: () => get<AdminDto[]>(ENDPOINTS.ADMIN_LEGACY_ADMINS),
  createLegacyAdmin: (dto: CreateAdminDto) => post<AdminDto>(ENDPOINTS.ADMIN_LEGACY_ADMINS, dto),
  getLegacyAdmin: (id: string) => get<AdminDto>(ENDPOINTS.ADMIN_LEGACY_ADMIN_BY_ID(id)),
  updateLegacyAdmin: (id: string, dto: UpdateAdminDto) =>
    put<AdminDto>(ENDPOINTS.ADMIN_LEGACY_ADMIN_BY_ID(id), dto),
  deleteLegacyAdmin: (id: string) => del(ENDPOINTS.ADMIN_LEGACY_ADMIN_BY_ID(id)),
  getLegacyUsers: (params?: UsersQueryParams) =>
    get<PagedResult<UserListItemDto>>(ENDPOINTS.ADMIN_LEGACY_USERS, params).then(paged),
  getLegacyUser: (id: string, role?: string) =>
    get<UserDetailDto>(ENDPOINTS.ADMIN_LEGACY_USER_BY_ID(id, role)),
  updateLegacyUser: (id: string, role: string | undefined, dto: UpdateUserDto) =>
    put<UserDetailDto>(ENDPOINTS.ADMIN_LEGACY_USER_BY_ID(id, role), dto),
  suspendLegacyUser: (id: string, role?: string) =>
    post<void>(ENDPOINTS.ADMIN_LEGACY_USER_SUSPEND(id, role)),
  activateLegacyUser: (id: string, role?: string) =>
    post<void>(ENDPOINTS.ADMIN_LEGACY_USER_ACTIVATE(id, role)),

  // User-management v2
  getUsers: (params?: UsersQueryParams) =>
    get<PagedResult<UserListItemDto>>(ENDPOINTS.ADMIN_USERS, params).then(paged),
  getUser: (id: string) => get<UserDetailDto>(ENDPOINTS.ADMIN_USER_BY_ID(id)),
  updateUser: (id: string, dto: UpdateUserDto) =>
    put<UserDetailDto>(ENDPOINTS.ADMIN_USER_BY_ID(id), dto),
  setUserActive: (id: string, dto: SetUserActiveRequest) =>
    patch<void>(ENDPOINTS.ADMIN_USER_ACTIVE(id), dto),
  getAdmins: () => get<AdminDto[]>(ENDPOINTS.ADMIN_ADMINS),
  createAdmin: (dto: CreateAdminDto) => post<AdminDto>(ENDPOINTS.ADMIN_ADMINS, dto),
  getAdmin: (id: string) => get<AdminDto>(ENDPOINTS.ADMIN_ADMIN_BY_ID(id)),
  updateAdmin: (id: string, dto: UpdateAdminDto) =>
    put<AdminDto>(ENDPOINTS.ADMIN_ADMIN_BY_ID(id), dto),
  deleteAdmin: (id: string) => del(ENDPOINTS.ADMIN_ADMIN_BY_ID(id)),

  // Ads
  getAds: (params?: { isActive?: boolean }) => get<AdDto[]>(ENDPOINTS.ADMIN_ADS, params),
  getAd: (id: string) => get<AdDto>(ENDPOINTS.ADMIN_AD_BY_ID(id)),
  createAd: (dto: CreateAdDto) => post<AdDto>(ENDPOINTS.ADMIN_ADS, dto),
  updateAd: (id: string, dto: UpdateAdDto) => put<AdDto>(ENDPOINTS.ADMIN_AD_BY_ID(id), dto),
  deleteAd: (id: string) => del(ENDPOINTS.ADMIN_AD_BY_ID(id)),
  toggleAd: (id: string) => patch<AdDto>(ENDPOINTS.ADMIN_AD_TOGGLE(id)),

  // Areas and supervisors
  getAreas: () => get<AreaDto[]>(ENDPOINTS.ADMIN_AREAS),
  getArea: (id: string) => get<AreaDto>(ENDPOINTS.ADMIN_AREA_BY_ID(id)),
  createArea: (dto: CreateAreaDto) => post<AreaDto>(ENDPOINTS.ADMIN_AREAS, dto),
  updateArea: (id: string, dto: UpdateAreaDto) =>
    put<AreaDto>(ENDPOINTS.ADMIN_AREA_BY_ID(id), dto),
  deleteArea: (id: string) => del(ENDPOINTS.ADMIN_AREA_BY_ID(id)),
  getSupervisors: () => get<SupervisorDto[]>(ENDPOINTS.ADMIN_SUPERVISORS),
  getSupervisor: (id: string) => get<SupervisorDto>(ENDPOINTS.ADMIN_SUPERVISOR_BY_ID(id)),
  createSupervisor: (dto: CreateSupervisorDto) =>
    post<SupervisorDto>(ENDPOINTS.ADMIN_SUPERVISORS, dto),
  updateSupervisor: (id: string, dto: UpdateSupervisorDto) =>
    put<SupervisorDto>(ENDPOINTS.ADMIN_SUPERVISOR_BY_ID(id), dto),
  deleteSupervisor: (id: string) => del(ENDPOINTS.ADMIN_SUPERVISOR_BY_ID(id)),
  assignAreaToSupervisor: (supervisorId: string, areaId: string) =>
    post<void>(ENDPOINTS.ADMIN_SUPERVISOR_AREA(supervisorId, areaId)),
  unassignAreaFromSupervisor: (supervisorId: string, areaId: string) =>
    del(ENDPOINTS.ADMIN_SUPERVISOR_AREA(supervisorId, areaId)),

  // Bonus
  getBonusStatus: () => get<BonusStatusDto>(ENDPOINTS.ADMIN_BONUS_STATUS),
  enableBonus: () => post<BonusStatusDto>(ENDPOINTS.ADMIN_BONUS_ENABLE),
  disableBonus: () => post<BonusStatusDto>(ENDPOINTS.ADMIN_BONUS_DISABLE),
  getBonusTiers: (isActive?: boolean) =>
    get<BonusTierDto[]>(ENDPOINTS.ADMIN_BONUS_TIERS, { isActive }),
  getBonusTier: (id: string) =>
    get<BonusTierDto>(ENDPOINTS.ADMIN_BONUS_TIER_BY_ID(id)),
  createBonusTier: (dto: CreateBonusTierDto) =>
    post<BonusTierDto>(ENDPOINTS.ADMIN_BONUS_TIERS, dto),
  updateBonusTier: (id: string, dto: UpdateBonusTierDto) =>
    put<BonusTierDto>(ENDPOINTS.ADMIN_BONUS_TIER_BY_ID(id), dto),
  deleteBonusTier: (id: string) =>
    del<void>(ENDPOINTS.ADMIN_BONUS_TIER_BY_ID(id)),
  toggleBonusTier: (id: string) =>
    patch<BonusTierDto>(ENDPOINTS.ADMIN_BONUS_TIER_TOGGLE(id)),

  // Cities
  getCities: (params?: CityQueryParams) =>
    get<PagedResult<CityDto>>(ENDPOINTS.ADMIN_CITIES, params).then(paged),
  getCitiesWithStats: (params?: CityQueryParams) =>
    get<PagedResult<CityWithStatsDto>>(ENDPOINTS.ADMIN_CITIES_WITH_STATS, params).then(paged),
  getCity: (id: string) => get<CityDto>(ENDPOINTS.ADMIN_CITY_BY_ID(id)),
  createCity: (dto: CreateCityDto) => post<CityDto>(ENDPOINTS.ADMIN_CITIES, dto),
  updateCity: (id: string, dto: UpdateCityDto) =>
    put<CityDto>(ENDPOINTS.ADMIN_CITY_BY_ID(id), dto),
  deleteCity: (id: string) => del(ENDPOINTS.ADMIN_CITY_BY_ID(id)),
  setCityActive: (id: string, dto: SetCityActiveRequest) =>
    patch<CityDto>(ENDPOINTS.ADMIN_CITY_ACTIVE(id), dto),
  lookupCities: () => get<CityListDto[]>(ENDPOINTS.ADMIN_CITIES_LOOKUP),

  // Customers and complaints
  lookupCustomer: (phone: string) =>
    get(ENDPOINTS.ADMIN_CUSTOMER_LOOKUP, { phone }),
  adjustCustomerLoyalty: (customerId: string, dto: AdjustLoyaltyRequest) =>
    post(ENDPOINTS.ADMIN_CUSTOMER_LOYALTY_ADJUST(customerId), dto),
  getComplaints: (params?: { status?: string; pageIndex?: number; pageSize?: number }) =>
    get<PagedResult<ComplaintDto>>(ENDPOINTS.ADMIN_COMPLAINTS, params).then(paged),
  getComplaint: (id: string) => get<ComplaintDto>(ENDPOINTS.ADMIN_COMPLAINT_BY_ID(id)),
  resolveComplaint: (id: string, dto: ResolveComplaintDto) =>
    post<ComplaintDto>(ENDPOINTS.ADMIN_COMPLAINT_RESOLVE(id), dto),

  // Drivers and documents
  getDrivers: (params?: DriverQueryParams) =>
    get<PagedResult<DriverDto>>(ENDPOINTS.ADMIN_DRIVERS, params).then(paged),
  createDriver: (dto: CreateDriverDto) => post<DriverDto>(ENDPOINTS.ADMIN_DRIVERS, dto),
  getNearbyDrivers: (params: { latitude: number; longitude: number; radiusKm: number }) =>
    get<DriverBrowseDto[]>(ENDPOINTS.ADMIN_DRIVERS_NEARBY, params),
  getDriver: (id: string) => get<DriverDto>(ENDPOINTS.ADMIN_DRIVER_BY_ID(id)),
  updateDriver: (id: string, dto: UpdateDriverDto) =>
    put<DriverDto>(ENDPOINTS.ADMIN_DRIVER_BY_ID(id), dto),
  setDriverVerified: (id: string, dto: SetDriverVerificationRequest) =>
    patch<DriverDto>(ENDPOINTS.ADMIN_DRIVER_VERIFY(id), dto),
  getDriverDocuments: (params?: {
    status?: string;
    driverId?: string;
    pageIndex?: number;
    pageSize?: number;
  }) => get<PagedResult<DriverDocumentDto>>(ENDPOINTS.ADMIN_DRIVER_DOCUMENTS, params).then(paged),
  getPendingDriverDocuments: (pageIndex?: number, pageSize?: number) =>
    get<PagedResult<DriverDocumentDto>>(ENDPOINTS.ADMIN_DRIVER_DOCUMENTS_PENDING, {
      pageIndex,
      pageSize,
    }).then(paged),
  getDriverDocument: (id: string) =>
    get<DriverDocumentDto>(ENDPOINTS.ADMIN_DRIVER_DOCUMENT_BY_ID(id)),
  getDocumentsByDriver: (driverId: string) =>
    get<DriverDocumentDto[]>(ENDPOINTS.ADMIN_DRIVER_DOCUMENTS_BY_DRIVER(driverId)),
  verifyDriverDocument: (id: string, dto: VerifyDocumentDto) =>
    post<DriverDocumentDto>(ENDPOINTS.ADMIN_DRIVER_DOCUMENT_VERIFY(id), dto),
  rejectDriverDocument: (id: string, dto: RejectDocumentRequest) =>
    post<DriverDocumentDto>(ENDPOINTS.ADMIN_DRIVER_DOCUMENT_REJECT(id), dto),

  // Onboarding requests
  getRequests: (params?: RequestQueryParams) =>
    get<PagedResult<RequestDto>>(ENDPOINTS.ADMIN_REQUESTS, params).then(paged),
  getPendingRequests: (pageIndex?: number, pageSize?: number) =>
    get<PagedResult<RequestDto>>(ENDPOINTS.ADMIN_REQUESTS_PENDING, { pageIndex, pageSize }).then(paged),
  getRequest: (id: string) => get<RequestDto>(ENDPOINTS.ADMIN_REQUEST_BY_ID(id)),
  approveRequest: (id: string) => post<RequestDto>(ENDPOINTS.ADMIN_REQUEST_APPROVE(id)),
  rejectRequest: (id: string, dto: RejectRequestDto) =>
    post<RequestDto>(ENDPOINTS.ADMIN_REQUEST_REJECT(id), dto),

  // Stores
  getStores: (params?: StoreQueryParams) =>
    get<PagedResult<StoreDto>>(ENDPOINTS.ADMIN_STORES, params).then(paged),
  getPendingStores: (pageIndex?: number, pageSize?: number) =>
    get<PagedResult<StoreDto>>(ENDPOINTS.ADMIN_STORES_PENDING, { pageIndex, pageSize }).then(paged),
  getBoostedStores: (pageIndex?: number, pageSize?: number) =>
    get<PagedResult<StoreDto>>(ENDPOINTS.ADMIN_STORES_BOOSTED, { pageIndex, pageSize }).then(paged),
  getStore: (id: string) => get<StoreDto>(ENDPOINTS.ADMIN_STORE_BY_ID(id)),
  createStore: (dto: CreateStoreDto) => post<StoreDto>(ENDPOINTS.ADMIN_STORES, dto),
  updateStore: (id: string, dto: UpdateStoreDto) =>
    put<StoreDto>(ENDPOINTS.ADMIN_STORE_BY_ID(id), dto),
  deleteStore: (id: string) => del(ENDPOINTS.ADMIN_STORE_BY_ID(id)),
  assignStoreOwner: (storeId: string, dto: AssignStoreOwnerRequest) =>
    post<StoreDto>(ENDPOINTS.ADMIN_STORE_ASSIGN_OWNER(storeId), dto),
  removeStoreOwner: (storeId: string) => del(ENDPOINTS.ADMIN_STORE_OWNER(storeId)),
  verifyStore: (id: string, dto: VerifyStoreDto) =>
    post<StoreDto>(ENDPOINTS.ADMIN_STORE_VERIFY(id), dto),
  rejectStore: (id: string, dto: ReasonRequest) =>
    post<StoreDto>(ENDPOINTS.ADMIN_STORE_REJECT(id), dto),
  suspendStore: (id: string, dto: ReasonRequest) =>
    post<StoreDto>(ENDPOINTS.ADMIN_STORE_SUSPEND(id), dto),
  setStoreActive: (id: string, dto: SetStoreActiveRequest) =>
    patch<StoreDto>(ENDPOINTS.ADMIN_STORE_ACTIVE(id), dto),
  setStoreOpen: (id: string, dto: SetStoreOpenRequest) =>
    patch<StoreDto>(ENDPOINTS.ADMIN_STORE_OPEN(id), dto),
  setStoreBusy: (id: string, dto: SetStoreBusyRequest) =>
    patch<StoreDto>(ENDPOINTS.ADMIN_STORE_BUSY(id), dto),
  setStoreBoost: (id: string, dto: SetStoreBoostRequest) =>
    patch<StoreDto>(ENDPOINTS.ADMIN_STORE_BOOST(id), dto),
  assignStoreOwnerDirectly: (id: string, dto: AssignStoreOwnerRequest) =>
    patch<StoreDto>(ENDPOINTS.ADMIN_STORE_OWNER_ASSIGN(id), dto),
  updateStoreLogo: (id: string, imageUrl: string) =>
    put<StoreDto>(ENDPOINTS.ADMIN_STORE_LOGO(id), { imageUrl }),
  updateStoreCover: (id: string, imageUrl: string) =>
    put<StoreDto>(ENDPOINTS.ADMIN_STORE_COVER(id), { imageUrl }),
  approveStoreTypeMapping: (mappingId: string) =>
    post<StoreDto>(ENDPOINTS.ADMIN_STORE_TYPE_MAPPING_APPROVE(mappingId)),
  rejectStoreTypeMapping: (mappingId: string, dto: ReasonRequest) =>
    post<StoreDto>(ENDPOINTS.ADMIN_STORE_TYPE_MAPPING_REJECT(mappingId), dto),

  // Store owners
  getStoreOwners: (params?: { pageIndex?: number; pageSize?: number; search?: string }) =>
    get<PagedResult<StoreOwnerListItemDto>>(ENDPOINTS.ADMIN_STORE_OWNERS, params).then(paged),
  createStoreOwner: (dto: CreateStoreOwnerDto) =>
    post<CreateStoreOwnerResultDto>(ENDPOINTS.ADMIN_STORE_OWNERS, dto),
  getStoreOwner: (ownerId: string) => get<StoreOwnerDto>(ENDPOINTS.ADMIN_STORE_OWNER_BY_ID(ownerId)),
  updateStoreOwner: (ownerId: string, dto: UpdateStoreOwnerDto) =>
    put<StoreOwnerDto>(ENDPOINTS.ADMIN_STORE_OWNER_BY_ID(ownerId), dto),
  deleteStoreOwner: (ownerId: string) => del(ENDPOINTS.ADMIN_STORE_OWNER_BY_ID(ownerId)),
  assignStoreToOwner: (ownerId: string, storeId: string) =>
    post<StoreOwnerDto>(ENDPOINTS.ADMIN_STORE_OWNER_STORE(ownerId, storeId)),

  // Store categories and types
  getStoreCategories: (params?: { IsActive?: boolean; Search?: string }) =>
    get<StoreCategoryDto[]>(ENDPOINTS.ADMIN_STORE_CATEGORIES, params),
  createStoreCategory: (dto: CreateStoreCategoryDto) =>
    post<StoreCategoryDto>(ENDPOINTS.ADMIN_STORE_CATEGORIES, dto),
  getActiveStoreCategories: () =>
    get<StoreCategoryListDto[]>(ENDPOINTS.ADMIN_STORE_CATEGORIES_ACTIVE),
  getStoreCategory: (id: string) =>
    get<StoreCategoryDto>(ENDPOINTS.ADMIN_STORE_CATEGORY_BY_ID(id)),
  updateStoreCategory: (id: string, dto: UpdateStoreCategoryDto) =>
    put<StoreCategoryDto>(ENDPOINTS.ADMIN_STORE_CATEGORY_BY_ID(id), dto),
  deleteStoreCategory: (id: string) => del(ENDPOINTS.ADMIN_STORE_CATEGORY_BY_ID(id)),
  getCategoryWithTypes: (id: string) =>
    get<CategoryWithTypesDto>(ENDPOINTS.ADMIN_STORE_CATEGORY_WITH_TYPES(id)),
  getCategoriesWithTypes: (params?: { IsActive?: boolean; Search?: string }) =>
    get<CategoryWithTypesDto[]>(ENDPOINTS.ADMIN_STORE_CATEGORIES_WITH_TYPES, params),
  toggleStoreCategory: (id: string) =>
    patch<StoreCategoryDto>(ENDPOINTS.ADMIN_STORE_CATEGORY_TOGGLE(id)),
  getStoreTypes: (params?: { StoreCategoryId?: string; IsActive?: boolean; Search?: string }) =>
    get<StoreTypeDto[]>(ENDPOINTS.ADMIN_STORE_TYPES, params),
  createStoreType: (dto: CreateStoreTypeDto) =>
    post<StoreTypeDto>(ENDPOINTS.ADMIN_STORE_TYPES, dto),
  getActiveStoreTypes: () => get<StoreTypeListDto[]>(ENDPOINTS.ADMIN_STORE_TYPES_ACTIVE),
  getStoreType: (id: string) => get<StoreTypeDto>(ENDPOINTS.ADMIN_STORE_TYPE_BY_ID(id)),
  updateStoreType: (id: string, dto: UpdateStoreTypeDto) =>
    put<StoreTypeDto>(ENDPOINTS.ADMIN_STORE_TYPE_BY_ID(id), dto),
  deleteStoreType: (id: string) => del(ENDPOINTS.ADMIN_STORE_TYPE_BY_ID(id)),
  toggleStoreType: (id: string) => patch<StoreTypeDto>(ENDPOINTS.ADMIN_STORE_TYPE_TOGGLE(id)),

  // Store coupons
  getStoreCoupons: (params?: StoreCouponQueryParams) =>
    get<PagedResult<StoreCouponApprovalDto>>(ENDPOINTS.ADMIN_STORE_COUPONS, params).then(paged),
  getPendingStoreCoupons: (pageIndex?: number, pageSize?: number) =>
    get<PagedResult<StoreCouponApprovalDto>>(ENDPOINTS.ADMIN_STORE_COUPONS_PENDING, {
      pageIndex,
      pageSize,
    }).then(paged),
  getStoreCoupon: (id: string) =>
    get<StoreCouponApprovalDto>(ENDPOINTS.ADMIN_STORE_COUPON_BY_ID(id)),
  approveStoreCoupon: (id: string) =>
    post<StoreCouponApprovalDto>(ENDPOINTS.ADMIN_STORE_COUPON_APPROVE(id)),
  rejectStoreCoupon: (id: string, dto: RejectStoreCouponDto) =>
    post<StoreCouponApprovalDto>(ENDPOINTS.ADMIN_STORE_COUPON_REJECT(id), dto),
  setStoreCouponActive: (id: string, isActive: boolean) =>
    patch<StoreCouponApprovalDto>(withQuery(ENDPOINTS.ADMIN_STORE_COUPON_ACTIVE(id), { isActive })),

  // Finance
  getFinancialSummary: (from?: string, to?: string) =>
    get<FinancialSummaryDto>(ENDPOINTS.ADMIN_FINANCE_SUMMARY, { from, to }),
  getFinancialTransactions: (params?: FinanceQueryParams) =>
    get<PagedResult<FinancialTransactionDto>>(ENDPOINTS.ADMIN_FINANCE_TRANSACTIONS, params).then(paged),
  getWithdrawals: (params?: { status?: string; pageIndex?: number; pageSize?: number }) =>
    get<PagedResult<WithdrawalDto>>(ENDPOINTS.ADMIN_FINANCE_WITHDRAWALS, params).then(paged),
  processWithdrawal: (id: string, dto: ProcessWithdrawalDto) =>
    post<WithdrawalDto>(ENDPOINTS.ADMIN_FINANCE_WITHDRAWAL_PROCESS(id), dto),
  rejectWithdrawal: (id: string, dto: RejectWithdrawalRequest) =>
    post<WithdrawalDto>(ENDPOINTS.ADMIN_FINANCE_WITHDRAWAL_REJECT(id), dto),
  getPayouts: (pageIndex?: number, pageSize?: number) =>
    get<PagedResult<PayoutDto>>(ENDPOINTS.ADMIN_FINANCE_PAYOUTS, { pageIndex, pageSize }).then(paged),
  getWalletStats: () => get<WalletStatsDto>(ENDPOINTS.ADMIN_FINANCE_WALLET_STATS),
  getPlatformWallet: () => get<PlatformWalletDto>(ENDPOINTS.ADMIN_FINANCE_PLATFORM_WALLET),

  // Payments
  getPaymentNumbers: (isActive?: boolean) =>
    get<PaymentNumberDto[]>(ENDPOINTS.ADMIN_PAYMENT_NUMBERS, { isActive }),
  createPaymentNumber: (dto: CreatePaymentNumberDto) =>
    post<PaymentNumberDto>(ENDPOINTS.ADMIN_PAYMENT_NUMBERS, dto),
  getPaymentNumber: (id: string) =>
    get<PaymentNumberDto>(ENDPOINTS.ADMIN_PAYMENT_NUMBER_BY_ID(id)),
  updatePaymentNumber: (id: string, dto: UpdatePaymentNumberDto) =>
    put<PaymentNumberDto>(ENDPOINTS.ADMIN_PAYMENT_NUMBER_BY_ID(id), dto),
  deletePaymentNumber: (id: string) => del(ENDPOINTS.ADMIN_PAYMENT_NUMBER_BY_ID(id)),
  getPaymentConfirmations: (params?: PaymentConfirmationQueryParams) =>
    get<PagedResult<PaymentConfirmationDto>>(ENDPOINTS.ADMIN_PAYMENT_CONFIRMATIONS, params).then(paged),
  getPaymentConfirmation: (id: string) =>
    get<PaymentConfirmationDto>(ENDPOINTS.ADMIN_PAYMENT_CONFIRMATION_BY_ID(id)),
  verifyPaymentConfirmation: (id: string, dto: ProcessPaymentConfirmationDto) =>
    post<PaymentConfirmationDto>(ENDPOINTS.ADMIN_PAYMENT_CONFIRMATION_VERIFY(id), dto),
  rejectPaymentConfirmation: (id: string, dto: RejectConfirmationRequest) =>
    post<PaymentConfirmationDto>(ENDPOINTS.ADMIN_PAYMENT_CONFIRMATION_REJECT(id), dto),

  // Notifications
  sendNotification: (dto: SendNotificationDto) =>
    post<NotificationAdminDto>(ENDPOINTS.ADMIN_NOTIFICATIONS, dto),
  getAdminNotifications: (params?: NotificationQueryParams) =>
    get<PagedResult<NotificationAdminDto>>(ENDPOINTS.ADMIN_NOTIFICATIONS, params).then(paged),
  sendBulkNotification: (dto: BulkSendNotificationDto) =>
    post<BulkSendResultDto>(ENDPOINTS.ADMIN_NOTIFICATIONS_BULK, dto),
  getAdminNotification: (id: string) =>
    get<NotificationAdminDto>(ENDPOINTS.ADMIN_NOTIFICATION_BY_ID(id)),
  getNotificationStats: (from?: string, to?: string) =>
    get<NotificationStatsDto>(ENDPOINTS.ADMIN_NOTIFICATIONS_STATS, { from, to }),
  retryNotification: (id: string) => post<void>(ENDPOINTS.ADMIN_NOTIFICATION_RETRY(id)),

  // Shared notification inbox for the authenticated Admin user
  getNotifications: (params?: NotificationQueryParams) =>
    get<PagedResult<NotificationSummaryDto>>(ENDPOINTS.NOTIFICATIONS, params).then(paged),
  getNotification: (id: string) => get<NotificationDto>(ENDPOINTS.NOTIFICATION_BY_ID(id)),
  deleteNotification: (id: string) => del(ENDPOINTS.NOTIFICATION_BY_ID(id)),
  getUnreadNotificationCount: () =>
    get<UnreadCountDto>(ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT),
  markNotificationRead: (id: string) => post<void>(ENDPOINTS.NOTIFICATION_READ(id)),
  markAllNotificationsRead: () =>
    post<MarkAllAsReadResultDto>(ENDPOINTS.NOTIFICATIONS_READ_ALL),
  getNotificationPreferences: () =>
    get<NotificationPreferencesDto>(ENDPOINTS.NOTIFICATION_PREFERENCES),
  updateNotificationPreferences: (dto: UpdateNotificationPreferencesDto) =>
    put<NotificationPreferencesDto>(ENDPOINTS.NOTIFICATION_PREFERENCES, dto),

  // Chat
  getConversations: (params?: ChatQueryParams) =>
    get<PagedResult<any>>(ENDPOINTS.ADMIN_CHAT, params).then(paged),
  getConversation: (id: string) => get<any>(ENDPOINTS.ADMIN_CHAT_BY_ID(id)),
  getConversationMessages: (id: string, params?: ChatMessagesQueryParams) =>
    get<PagedResult<MessageDto>>(ENDPOINTS.ADMIN_CHAT_MESSAGES(id), params).then(paged),
  sendMessage: (id: string, dto: SendMessageDto) =>
    post<MessageDto>(ENDPOINTS.ADMIN_CHAT_MESSAGES(id), dto),
  uploadChatMessageAttachment: (id: string, file: File, messageType?: string) => {
    const formData = new FormData();
    formData.append("File", file);
    if (messageType) formData.append("MessageType", messageType);
    return apiClient.upload<AttachmentUploadResultDto>(
      ENDPOINTS.ADMIN_CHAT_MESSAGE_ATTACHMENT(id),
      formData,
    );
  },
  uploadChatAttachment: (id: string, file: File, messageType?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (messageType) formData.append("messageType", messageType);
    return apiClient.upload<AttachmentUploadResultDto>(
      ENDPOINTS.ADMIN_CHAT_ATTACHMENTS(id),
      formData,
    );
  },
  markConversationRead: (id: string) => post<void>(ENDPOINTS.ADMIN_CHAT_READ(id)),
  closeConversation: (id: string, dto: CloseConversationDto) =>
    post<void>(ENDPOINTS.ADMIN_CHAT_CLOSE(id), dto),
  assignConversation: (id: string, dto: AssignConversationDto) =>
    post<void>(ENDPOINTS.ADMIN_CHAT_ASSIGN(id), dto),
  getChatUnreadCount: () => get<ChatUnreadCountDto>(ENDPOINTS.ADMIN_CHAT_UNREAD_COUNT),

  // Settings
  getSettings: () => get<PlatformSettingsDto>(ENDPOINTS.ADMIN_SETTINGS),
  updateSettings: (dto: PlatformSettingsDto) =>
    put<PlatformSettingsDto>(ENDPOINTS.ADMIN_SETTINGS, dto),

  // Shared file API
  uploadFile: (formData: FormData, category?: string) =>
    unwrapRequest(
      apiClient.upload<FileUploadResultDto | ApiResponse<FileUploadResultDto>>(
        withQuery(ENDPOINTS.FILE_UPLOAD, { category }),
        formData,
      ),
    ),
  uploadFiles: (formData: FormData, category?: string) =>
    unwrapRequest(
      apiClient.upload<MultipleFileUploadResultDto | ApiResponse<MultipleFileUploadResultDto>>(
        withQuery(ENDPOINTS.FILE_UPLOAD_MULTIPLE, { category }),
        formData,
      ),
    ),
  deleteFile: (path: string) => del(ENDPOINTS.FILE_DELETE(path)),
  getFileInfo: (path: string) => get<FileInfoDto>(ENDPOINTS.FILE_INFO, { path }),
} as const;
