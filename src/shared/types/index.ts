// ============================================================
// Tamam Admin API Types
// ============================================================

export type UUID = string;
export type ISODateTime = string;
export type TimeSpan = string;
export type Money = number;

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors?: string[] | null;
}

export interface PagedResult<T> {
  items: T[] | null;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  errors?: Record<string, string[]>;
}

export interface ApiError extends ProblemDetails {
  message?: string;
}

// -----------------------------------------------------------------------------
// Enums exposed by the API
// -----------------------------------------------------------------------------

export const UserRole = {
  Customer: "Customer",
  Driver: "Driver",
  StoreOwner: "StoreOwner",
  Admin: "Admin",
  Supervisor: "Supervisor",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AdminRole = {
  SuperAdmin: "SuperAdmin",
  Admin: "Admin",
  Moderator: "Moderator",
  Support: "Support",
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const TransferStatus = {
  Pending: "Pending",
  Completed: "Completed",
  Failed: "Failed",
  Reversed: "Reversed",
} as const;
export type TransferStatus = (typeof TransferStatus)[keyof typeof TransferStatus];

export type ApiStatus = string;
export type RequestType = string;
export type PaymentMethod = string;
export type NotificationType = string;
export type DocumentType = string;
export type VehicleType = string;
export type StoreVerificationStatus = string;
export type ApprovalStatus = string;

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

export interface LoginDto {
  phoneNumber?: string | null;
  password?: string | null;
  role?: UserRole;
}

export interface SocialLoginDto {
  provider?: string | null;
  token?: string | null;
  phoneNumber?: string | null;
  role?: UserRole;
  referralCode?: string | null;
}

export interface AuthResponseDto {
  userId: UUID;
  phoneNumber?: string | null;
  fullName?: string | null;
  role?: string | null;
  token?: string | null;
  expiresAt: ISODateTime;
  refreshToken?: string | null;
  refreshTokenExpiresAt: ISODateTime;
  isActive: boolean;
}

export interface RefreshTokenDto {
  token?: string | null;
  refreshToken?: string | null;
}

export interface SendOtpDto {
  phoneNumber?: string | null;
  role?: UserRole;
}

export interface VerifyOtpDto {
  phoneNumber?: string | null;
  code?: string | null;
  role?: UserRole;
}

export interface ChangePasswordDto {
  newPassword?: string | null;
}

// -----------------------------------------------------------------------------
// Dashboard and analytics
// -----------------------------------------------------------------------------

export interface DashboardStatsDto {
  totalCustomers: number;
  totalDrivers: number;
  totalStores: number;
  totalAdmins: number;
  totalSupervisors: number;
  pendingStores: number;
  pendingDrivers: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  ordersToday: number;
  totalRevenue: Money;
  revenueToday: Money;
  totalCommission: Money;
  pendingWithdrawals: Money;
  openComplaints: number;
  pendingRequests: number;
  pendingPaymentConfirmations: number;
}

export interface DailyMetricDto {
  date: ISODateTime;
  orders: number;
  revenue: Money;
  commission: Money;
}

export interface TopStoreDto {
  storeId: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  orderCount: number;
  revenue: Money;
  rating: number;
}

export interface TopDriverDto {
  driverId: UUID;
  fullName?: string | null;
  deliveries: number;
  earnings: Money;
  rating: number;
}

export interface AnalyticsDashboardDto {
  period?: string | null;
  periodStart: ISODateTime;
  periodEnd: ISODateTime;
  ordersPlaced: number;
  ordersDelivered: number;
  ordersCancelled: number;
  averageOrderValue: Money;
  totalRevenue: Money;
  totalCommission: Money;
  totalDiscount: Money;
  dailyBreakdown: DailyMetricDto[] | null;
  topStores: TopStoreDto[] | null;
  topDrivers: TopDriverDto[] | null;
}

// -----------------------------------------------------------------------------
// Users and Admin accounts
// -----------------------------------------------------------------------------

export interface UserListItemDto {
  id: UUID;
  fullName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  role?: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: ISODateTime;
}

export interface UserDetailDto {
  id: UUID;
  fullName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  role?: string | null;
  adminRole?: string | null;
  isActive: boolean;
  isVerified: boolean;
  dateOfBirth?: ISODateTime | null;
  lastLoginAt?: ISODateTime | null;
  createdAt: ISODateTime;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  rating?: number | null;
  totalDeliveries?: number | null;
  storeNameAr?: string | null;
  storeNameEn?: string | null;
  walletBalance?: Money | null;
}

export interface UpdateUserDto {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean | null;
}

export interface SetUserActiveRequest {
  isActive: boolean;
}

export interface AdminDto {
  id: UUID;
  phoneNumber?: string | null;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
  isActive: boolean;
  lastLoginAt?: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface CreateAdminDto {
  phoneNumber?: string | null;
  fullName?: string | null;
  email?: string | null;
  password?: string | null;
  role?: AdminRole;
}

export interface UpdateAdminDto {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
  isActive?: boolean | null;
}

export interface UsersQueryParams {
  Role?: string;
  IsActive?: boolean;
  Search?: string;
  PageIndex?: number;
  PageSize?: number;
}

// -----------------------------------------------------------------------------
// Onboarding requests
// -----------------------------------------------------------------------------

export interface RequestDto {
  id: UUID;
  name?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  requestedRole?: string | null;
  requestType?: RequestType | null;
  brandName?: string | null;
  brandNameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  address?: string | null;
  streetAr?: string | null;
  streetEn?: string | null;
  city?: string | null;
  cityId?: UUID | null;
  latitude?: number | null;
  longitude?: number | null;
  storeCategoryId?: UUID | null;
  storeCategoryNameAr?: string | null;
  storeCategoryNameEn?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  licenseNumber?: string | null;
  licenseExpiresAt?: ISODateTime | null;
  area?: string | null;
  areaIds: UUID[] | null;
  attachmentUrl?: string | null;
  attachmentUrls: string[] | null;
  note?: string | null;
  status?: ApiStatus | null;
  rejectionReason?: string | null;
  processedAt?: ISODateTime | null;
  processedBy?: UUID | null;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime | null;
}

export interface RejectRequestDto {
  reason?: string | null;
}

export interface RequestQueryParams {
  Status?: string;
  RequestType?: string;
  StoreCategoryId?: UUID;
  Search?: string;
  PageIndex?: number;
  PageSize?: number;
}

// -----------------------------------------------------------------------------
// Cities, areas, and supervisors
// -----------------------------------------------------------------------------

export interface CityDto {
  id: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  maxCustomerDistanceKm: number;
  isActive: boolean;
  areaCount: number;
  storeCount: number;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime | null;
}

export interface CityWithStatsDto extends CityDto {
  totalOrders: number;
  activeStores: number;
  activeDrivers: number;
  totalRevenue: Money;
}

export interface CityListDto {
  id: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  isActive: boolean;
}

export interface CreateCityDto {
  nameAr?: string | null;
  nameEn?: string | null;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  maxCustomerDistanceKm: number;
}

export interface UpdateCityDto extends CreateCityDto {
  isActive: boolean;
}

export interface SetCityActiveRequest {
  isActive: boolean;
}

export interface CityQueryParams {
  IsActive?: boolean;
  Search?: string;
  SortBy?: string;
  PageIndex?: number;
  PageSize?: number;
}

export interface AreaDto {
  id: UUID;
  name?: string | null;
  description?: string | null;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  isActive: boolean;
  supervisorCount: number;
  driverCount: number;
}

export interface CreateAreaDto {
  cityId: UUID;
  name?: string | null;
  description?: string | null;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  maxCustomerDistanceKm: number;
  supervisorFixedFee: Money;
}

export interface UpdateAreaDto extends CreateAreaDto {
  isActive: boolean;
}

export interface SupervisorAreaDto {
  areaId: UUID;
  areaName?: string | null;
}

export interface SupervisorDto {
  id: UUID;
  phoneNumber?: string | null;
  fullName?: string | null;
  email?: string | null;
  isActive: boolean;
  cityId: UUID;
  cityAr?: string | null;
  cityEn?: string | null;
  areas: SupervisorAreaDto[] | null;
}

export interface CreateSupervisorDto {
  phoneNumber?: string | null;
  fullName?: string | null;
  email?: string | null;
  password?: string | null;
  cityId: UUID;
  areaIds: UUID[] | null;
}

export interface UpdateSupervisorDto {
  fullName?: string | null;
  email?: string | null;
  isActive?: boolean | null;
}

// -----------------------------------------------------------------------------
// Stores, owners, categories, types, and coupons
// -----------------------------------------------------------------------------

export interface StoreDto {
  id: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  latitude: number;
  longitude: number;
  streetAr?: string | null;
  streetEn?: string | null;
  cityId?: UUID | null;
  cityAr?: string | null;
  cityEn?: string | null;
  storeOwnerId?: UUID | null;
  isActive: boolean;
  isOpen: boolean;
  isBusy: boolean;
  isBoosted: boolean;
  openingTime?: TimeSpan | null;
  closingTime?: TimeSpan | null;
  minimumOrderAmount: Money;
  deliveryFee: Money;
  estimatedPreparationMinutes: number;
  rating: number;
  ratingCount: number;
  totalOrders: number;
  viewCount: number;
  verificationStatus?: StoreVerificationStatus | null;
  verificationNotes?: string | null;
  verifiedAt?: ISODateTime | null;
  storeTypes: StoreTypeProfileDto[] | null;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime | null;
}

export interface CreateStoreDto {
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  latitude: number;
  longitude: number;
  cityId?: UUID | null;
  streetAr?: string | null;
  streetEn?: string | null;
}

export interface UpdateStoreDto {
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  latitude: number;
  longitude: number;
  streetAr?: string | null;
  streetEn?: string | null;
  cityId?: UUID | null;
  cityAr?: string | null;
  cityEn?: string | null;
  openingTime?: TimeSpan | null;
  closingTime?: TimeSpan | null;
  minimumOrderAmount: Money;
  deliveryFee: Money;
  estimatedPreparationMinutes: number;
}

export interface VerifyStoreDto {
  notes?: string | null;
}

export interface ReasonRequest {
  reason?: string | null;
}

export interface SetStoreActiveRequest {
  isActive: boolean;
}
export interface SetStoreOpenRequest {
  isOpen: boolean;
}
export interface SetStoreBusyRequest {
  isBusy: boolean;
}
export interface SetStoreBoostRequest {
  boosted: boolean;
}
export interface AssignStoreOwnerRequest {
  ownerId: UUID;
}
export interface ImageUrlRequest {
  imageUrl?: string | null;
}

export interface StoreQueryParams {
  Search?: string;
  IsActive?: boolean;
  IsOpen?: boolean;
  IsBusy?: boolean;
  IsBoosted?: boolean;
  CityId?: UUID;
  IsVerified?: boolean;
  PageIndex?: number;
  PageSize?: number;
}

export interface StoreTypeProfileDto {
  storeTypeMappingId: UUID;
  storeTypeId: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  iconUrl?: string | null;
  status?: ApiStatus | null;
}

export interface StoreOwnerListItemDto {
  id: UUID;
  fullName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  isActive: boolean;
  storeCount: number;
  createdAt: ISODateTime;
  lastLoginAt?: ISODateTime | null;
}

export interface StoreOwnerStoreDto {
  id: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  verificationStatus?: StoreVerificationStatus | null;
  isActive: boolean;
  isOpen: boolean;
}

export interface StoreOwnerDto {
  id: UUID;
  fullName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  isActive: boolean;
  createdAt: ISODateTime;
  lastLoginAt?: ISODateTime | null;
  stores: StoreOwnerStoreDto[] | null;
}

export interface CreateStoreOwnerDto {
  fullName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  password?: string | null;
  storeId?: UUID | null;
}

export interface CreateStoreOwnerResultDto {
  owner: StoreOwnerDto;
  initialPassword?: string | null;
}

export interface UpdateStoreOwnerDto {
  fullName?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  isActive?: boolean | null;
}

export interface StoreCategoryDto {
  id: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  storeTypeCount: number;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime | null;
}

export interface StoreCategoryListDto {
  id: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  iconUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateStoreCategoryDto {
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface UpdateStoreCategoryDto extends CreateStoreCategoryDto {}

export interface StoreTypeDto {
  id: UUID;
  storeCategoryId: UUID;
  categoryNameAr?: string | null;
  categoryNameEn?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  commissionRate: number;
  storeCount: number;
  createdAt: ISODateTime;
}

export interface StoreTypeListDto {
  id: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateStoreTypeDto {
  storeCategoryId: UUID;
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  commissionRate: number;
}

export interface UpdateStoreTypeDto extends CreateStoreTypeDto {
  isActive: boolean;
}

export interface CategoryWithTypesDto {
  categoryId: UUID;
  categoryNameAr?: string | null;
  categoryNameEn?: string | null;
  categoryDescriptionAr?: string | null;
  categoryDescriptionEn?: string | null;
  categoryImageUrl?: string | null;
  categoryIconUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  storeTypes: StoreTypeListDto[] | null;
}

export interface StoreCouponApprovalDto {
  id: UUID;
  storeId: UUID;
  storeNameAr?: string | null;
  storeNameEn?: string | null;
  storeOwnerId?: UUID | null;
  storeOwnerName?: string | null;
  storeOwnerPhone?: string | null;
  code?: string | null;
  type?: string | null;
  value: number;
  minimumOrderAmount?: Money | null;
  maximumDiscount?: Money | null;
  maxUsageCount: number;
  currentUsageCount: number;
  maxPerCustomer?: number | null;
  validFrom: ISODateTime;
  validTo: ISODateTime;
  startTime?: TimeSpan | null;
  endTime?: TimeSpan | null;
  isActive: boolean;
  approvalStatus?: ApprovalStatus | null;
  approvedAt?: ISODateTime | null;
  rejectionReason?: string | null;
  createdAt: ISODateTime;
}

export interface RejectStoreCouponDto {
  reason?: string | null;
}

export interface StoreCouponQueryParams {
  StoreId?: UUID;
  ApprovalStatus?: string;
  IsActive?: boolean;
  Code?: string;
  CreatedFrom?: ISODateTime;
  CreatedTo?: ISODateTime;
  Search?: string;
  PageIndex?: number;
  PageSize?: number;
}

// -----------------------------------------------------------------------------
// Ads
// -----------------------------------------------------------------------------

export interface AdDto {
  id: UUID;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  targetUrl?: string | null;
  type?: string | null;
  placement?: string | null;
  targetStoreId?: UUID | null;
  targetStoreName?: string | null;
  validFrom: ISODateTime;
  validTo: ISODateTime;
  isActive: boolean;
  displayOrder: number;
  viewCount: number;
  clickCount: number;
  hexCode?: string | null;
  createdAt: ISODateTime;
}

export interface CreateAdDto {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  targetUrl?: string | null;
  type?: string | null;
  placement?: string | null;
  targetStoreId?: UUID | null;
  validFrom: ISODateTime;
  validTo: ISODateTime;
  displayOrder: number;
  hexCode?: string | null;
}

export interface UpdateAdDto extends CreateAdDto {
  isActive: boolean;
}

// -----------------------------------------------------------------------------
// Drivers and documents
// -----------------------------------------------------------------------------

export interface DriverDto {
  id: UUID;
  phoneNumber?: string | null;
  email?: string | null;
  fullName?: string | null;
  profilePictureUrl?: string | null;
  dateOfBirth?: ISODateTime | null;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: ISODateTime | null;
  isAvailable: boolean;
  currentLatitude: number;
  currentLongitude: number;
  lastLocationUpdateAt?: ISODateTime | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  rating: number;
  ratingCount: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime | null;
}

export interface DriverBrowseDto {
  id: UUID;
  fullName?: string | null;
  profilePictureUrl?: string | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  rating: number;
  ratingCount: number;
  currentLatitude: number;
  currentLongitude: number;
  distanceKm?: number | null;
}

export interface CreateDriverDto {
  phoneNumber?: string | null;
  fullName?: string | null;
  email?: string | null;
  password?: string | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  autoVerify: boolean;
}

export interface UpdateDriverDto {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean | null;
  isVerified?: boolean | null;
}

export interface SetDriverVerificationRequest {
  isVerified: boolean;
}

export interface DriverDocumentDto {
  id: UUID;
  driverId: UUID;
  driverName?: string | null;
  type?: DocumentType | null;
  documentUrl?: string | null;
  status?: ApiStatus | null;
  rejectionReason?: string | null;
  verifiedAt?: ISODateTime | null;
  expiryDate?: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface VerifyDocumentDto {
  approve: boolean;
  rejectionReason?: string | null;
}

export interface RejectDocumentRequest {
  reason?: string | null;
}

export interface DriverQueryParams {
  IsVerified?: boolean;
  IsAvailable?: boolean;
  IsActive?: boolean;
  Search?: string;
  Latitude?: number;
  Longitude?: number;
  RadiusKm?: number;
  SortBy?: string;
  PageIndex?: number;
  PageSize?: number;
}

// -----------------------------------------------------------------------------
// Complaints and customers
// -----------------------------------------------------------------------------

export interface ComplaintDto {
  id: UUID;
  customerId: UUID;
  customerName?: string | null;
  orderId: UUID;
  orderNumber?: string | null;
  description?: string | null;
  status?: ApiStatus | null;
  resolution?: string | null;
  resolvedAt?: ISODateTime | null;
  resolvedBy?: UUID | null;
  createdAt: ISODateTime;
}

export interface ResolveComplaintDto {
  resolution?: string | null;
}

export interface CustomerLookupDto {
  id: UUID;
  fullName?: string | null;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
}

export interface AdjustLoyaltyRequest {
  signedPoints: number;
  reason?: string | null;
}

// -----------------------------------------------------------------------------
// Finance, withdrawals, payouts, payments
// -----------------------------------------------------------------------------

export interface FinancialSummaryDto {
  totalRevenue: Money;
  totalCommission: Money;
  totalRefunds: Money;
  totalWithdrawals: Money;
  totalBonuses: Money;
  netRevenue: Money;
  pendingPayouts: Money;
  completedPayouts: Money;
  pendingWithdrawalsCount: number;
  completedWithdrawalsCount: number;
  periodStart: ISODateTime;
  periodEnd: ISODateTime;
}

export interface FinancialTransactionDto {
  id: UUID;
  type?: string | null;
  amount: Money;
  description?: string | null;
  referenceId?: UUID | null;
  referenceNumber?: string | null;
  createdAt: ISODateTime;
}

export interface WithdrawalDto {
  id: UUID;
  walletId: UUID;
  ownerId: UUID;
  ownerType?: string | null;
  amount: Money;
  status?: ApiStatus | null;
  notes?: string | null;
  rejectionReason?: string | null;
  paymentReference?: string | null;
  processedAt?: ISODateTime | null;
  processedBy?: UUID | null;
  createdAt: ISODateTime;
}

export interface PayoutDto {
  id: UUID;
  walletId: UUID;
  ownerId: UUID;
  ownerType?: string | null;
  ownerName?: string | null;
  amount: Money;
  status?: ApiStatus | null;
  processedAt?: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface ProcessWithdrawalDto {
  notes?: string | null;
}

export interface RejectWithdrawalRequest {
  reason?: string | null;
}

export interface WalletStatsDto {
  totalWalletBalance: Money;
  totalDriverBalance: Money;
  totalStoreBalance: Money;
  totalSupervisorBalance: Money;
  totalCustomerBalance: Money;
  totalWallets: number;
  activeWallets: number;
}

export interface PlatformWalletDto {
  totalCommissionEarned: Money;
  totalCommissionPaid: Money;
  outstandingCommission: Money;
  totalPayoutsCompleted: Money;
  totalPayoutsPending: Money;
  netBalance: Money;
  lastUpdatedAt: ISODateTime;
}

export interface PaymentNumberDto {
  id: UUID;
  phoneNumber?: string | null;
  paymentMethod?: PaymentMethod | null;
  label?: string | null;
  balance: Money;
  isActive: boolean;
  createdAt: ISODateTime;
}

export interface CreatePaymentNumberDto {
  phoneNumber?: string | null;
  paymentMethod?: PaymentMethod | null;
  label?: string | null;
  initialBalance: Money;
}

export interface UpdatePaymentNumberDto {
  phoneNumber?: string | null;
  paymentMethod?: PaymentMethod | null;
  label?: string | null;
  isActive: boolean;
}

export interface PaymentConfirmationDto {
  id: UUID;
  ownerId: UUID;
  ownerType?: string | null;
  ownerName?: string | null;
  paymentNumberId?: UUID | null;
  paymentNumberPhone?: string | null;
  paymentMethod?: PaymentMethod | null;
  phoneFrom?: string | null;
  amount: Money;
  screenshotUrl?: string | null;
  status?: ApiStatus | null;
  notes?: string | null;
  rejectionReason?: string | null;
  processedAt?: ISODateTime | null;
  processedBy?: UUID | null;
  createdAt: ISODateTime;
}

export interface ProcessPaymentConfirmationDto {
  notes?: string | null;
}

export interface RejectConfirmationRequest {
  reason?: string | null;
}

export interface FinanceQueryParams {
  type?: string;
  from?: ISODateTime;
  to?: ISODateTime;
  pageIndex?: number;
  pageSize?: number;
}

export interface WithdrawalQueryParams {
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface PaymentConfirmationQueryParams {
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------

export interface NotificationPayloadDto {
  action?: string | null;
  targetPage?: string | null;
  targetId?: string | null;
  extra?: Record<string, string> | null;
}

export interface SendNotificationDto {
  recipientId: UUID;
  recipientType: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  sendPush?: boolean;
  payload?: NotificationPayloadDto;
}

export interface BulkSendNotificationDto {
  recipientIds?: UUID[] | null;
  recipientType?: string | null;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  sendPush?: boolean;
  payload?: NotificationPayloadDto;
}

export interface NotificationAdminDto {
  id: UUID;
  recipientId: UUID;
  recipientType?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  type?: NotificationType | null;
  titleAr?: string | null;
  titleEn?: string | null;
  bodyAr?: string | null;
  bodyEn?: string | null;
  payload: NotificationPayloadDto;
  isRead: boolean;
  readAt?: ISODateTime | null;
  isSent: boolean;
  sentAt?: ISODateTime | null;
  isDelivered: boolean;
  deliveredAt?: ISODateTime | null;
  attemptCount: number;
  lastAttemptAt?: ISODateTime | null;
  failureReason?: string | null;
  createdAt: ISODateTime;
}

export interface NotificationStatsDto {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRead: number;
  deliveryRate: number;
  openRate: number;
  byType: Record<string, number> | null;
  periodFrom: ISODateTime;
  periodTo: ISODateTime;
}

export interface BulkSendResultDto {
  notificationsCreated: number;
  sentAt: ISODateTime;
}

export interface NotificationSummaryDto {
  id: UUID;
  type?: NotificationType | null;
  titleAr?: string | null;
  titleEn?: string | null;
  bodyAr?: string | null;
  bodyEn?: string | null;
  payload?: NotificationPayloadDto | null;
  isRead: boolean;
  createdAt: ISODateTime;
}

export interface NotificationDto extends NotificationSummaryDto {
  recipientId: UUID;
  isSent: boolean;
  sentAt?: ISODateTime | null;
  isDelivered: boolean;
  deliveredAt?: ISODateTime | null;
}

export interface UnreadCountDto {
  total: number;
  byType: Record<string, number> | null;
}

export interface MarkAllAsReadResultDto {
  countMarkedAsRead: number;
  markedAt: ISODateTime;
}

export interface NotificationPreferencesDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  chatMessages: boolean;
  systemAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom?: TimeSpan | null;
  quietHoursTo?: TimeSpan | null;
}

export type UpdateNotificationPreferencesDto = NotificationPreferencesDto;

export interface NotificationQueryParams {
  Type?: string;
  IsRead?: boolean;
  From?: ISODateTime;
  To?: ISODateTime;
  pageIndex?: number;
  pageSize?: number;
}

// -----------------------------------------------------------------------------
// Admin chat
// -----------------------------------------------------------------------------

export interface ConversationListItemDto {
  id: UUID;
  participantId: UUID;
  participantType?: string | null;
  participantName?: string | null;
  participantProfilePictureUrl?: string | null;
  customerId: UUID;
  customerName?: string | null;
  customerProfilePictureUrl?: string | null;
  adminId?: UUID | null;
  adminName?: string | null;
  orderId?: UUID | null;
  orderNumber?: string | null;
  status?: ApiStatus | null;
  subject?: string | null;
  unreadCount: number;
  lastMessagePreview?: string | null;
  lastMessageAt?: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface ConversationDto extends ConversationListItemDto {
  messageCount: number;
  lastMessageFrom?: ISODateTime | null;
}

export interface MessageDto {
  id: UUID;
  conversationId: UUID;
  senderId: UUID;
  senderType?: string | null;
  messageType?: string | null;
  senderName?: string | null;
  senderProfilePictureUrl?: string | null;
  content?: string | null;
  attachmentUrl?: string | null;
  isRead: boolean;
  readAt?: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface SendMessageDto {
  content?: string | null;
  attachmentUrl?: string | null;
  messageType?: string | null;
}

export interface CloseConversationDto {
  reason?: string | null;
}

export interface AssignConversationDto {
  adminId: UUID;
}

export interface ChatUnreadCountDto {
  totalUnread: number;
  conversationsWithUnread: number;
  byConversation: Record<string, number> | null;
}

export interface AttachmentUploadResultDto {
  url?: string | null;
  fileName?: string | null;
  sizeInBytes: number;
  contentType?: string | null;
  messageType?: string | null;
}

export interface ChatQueryParams {
  Status?: string;
  AdminId?: UUID;
  UnassignedOnly?: boolean;
  OnlyUnread?: boolean;
  OrderId?: UUID;
  Search?: string;
  SortBy?: string;
  PageIndex?: number;
  PageSize?: number;
}

export interface ChatMessagesQueryParams {
  Since?: ISODateTime;
  Before?: ISODateTime;
  MessageType?: string;
  Order?: string;
  PageIndex?: number;
  PageSize?: number;
}

/** POST /api/admin/chat/{id}/messages/attachment uses capitalized field names. */
export interface AdminChatAttachmentFields {
  File: File;
  MessageType?: string;
}

/** POST /api/admin/chat/{id}/attachments uses lower camelCase field names. */
export interface AdminChatAttachmentFieldsV2 {
  file: File;
  messageType?: string;
}

// -----------------------------------------------------------------------------
// Bonus system and platform settings
// -----------------------------------------------------------------------------

export interface BonusTierDto {
  id: UUID;
  minAmount: Money;
  maxAmount?: Money | null;
  bonusType?: string | null;
  bonusValue: Money;
  isActive: boolean;
  createdAt: ISODateTime;
}

export interface BonusStatusDto {
  isEnabled: boolean;
  enabledAt?: ISODateTime | null;
  disabledAt?: ISODateTime | null;
  totalTiers: number;
  activeTiers: number;
  totalBonusPaid: Money;
  bonusPaidThisMonth: Money;
  lastBonusAwardedAt?: ISODateTime | null;
  tiers: BonusTierDto[] | null;
}

export interface CreateBonusTierDto {
  minAmount: Money;
  maxAmount?: Money | null;
  bonusType?: string | null;
  bonusValue: Money;
}

export interface UpdateBonusTierDto extends CreateBonusTierDto {
  isActive: boolean;
}

export interface PlatformSettingsDto {
  commissionRate: number;
  minOrderAmount: Money;
  maxDriverDistance: number;
  firstOrderDiscountEnabled: boolean;
  firstOrderDiscountPercentage: number;
  firstOrderMaximumDiscount: Money;
  firstOrderMinimumOrderAmount: Money;
  bonusEnabled: boolean;
  bonusEnabledAt?: ISODateTime | null;
  bonusDisabledAt?: ISODateTime | null;
  autoApproveStores: boolean;
  autoApproveDrivers: boolean;
  maintenanceMode: boolean;
  updatedAt: ISODateTime;
  updatedBy?: UUID | null;
}

// -----------------------------------------------------------------------------
// Files
// -----------------------------------------------------------------------------

export interface FileUploadResultDto {
  url?: string | null;
  relativePath?: string | null;
  fileName?: string | null;
  sizeInBytes: number;
  contentType?: string | null;
  category?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
}

export interface MultipleFileUploadResultDto {
  files: FileUploadResultDto[] | null;
  successCount: number;
  failureCount: number;
  errors: string[] | null;
}

export interface FileInfoDto {
  relativePath?: string | null;
  publicUrl?: string | null;
  exists: boolean;
  sizeInBytes: number;
  contentType?: string | null;
  category?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  lastModifiedUtc?: ISODateTime | null;
}

// -----------------------------------------------------------------------------
// Endpoint response aliases for service methods
// -----------------------------------------------------------------------------

export type DashboardStatsResponse = ApiResponse<DashboardStatsDto>;
export type AnalyticsResponse = ApiResponse<AnalyticsDashboardDto>;
export type UsersResponse = ApiResponse<PagedResult<UserListItemDto>>;
export type UserDetailsResponse = ApiResponse<UserDetailDto>;
export type AdminsResponse = ApiResponse<AdminDto[]>;
export type StoreResponse = ApiResponse<StoreDto>;
export type StoresResponse = ApiResponse<PagedResult<StoreDto>>;
export type RequestsResponse = ApiResponse<PagedResult<RequestDto>>;
export type DriversResponse = ApiResponse<PagedResult<DriverDto>>;
export type DocumentsResponse = ApiResponse<PagedResult<DriverDocumentDto>>;
export type ComplaintsResponse = ApiResponse<PagedResult<ComplaintDto>>;
export type WithdrawalsResponse = ApiResponse<PagedResult<WithdrawalDto>>;
export type PaymentsResponse = ApiResponse<PagedResult<PaymentConfirmationDto>>;
export type NotificationsResponse = ApiResponse<PagedResult<NotificationAdminDto>>;
export type ConversationsResponse = ApiResponse<PagedResult<ConversationListItemDto>>;
export type MessagesResponse = ApiResponse<PagedResult<MessageDto>>;

export type EmptySuccess = void;
