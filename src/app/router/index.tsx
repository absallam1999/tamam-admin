import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout } from "@/app/layouts/AuthLayout";
import { AdminLayout } from "@/app/layouts/AdminLayout";
import { PageLoader } from "@/shared/components/PageLoader";

const page = <T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
) => lazy(loader);

const render = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------
const LoginPage = page(() =>
  import("@/features/auth/LoginPage").then(({ LoginPage }) => ({ default: LoginPage })),
);

const ForgotPasswordPage = page(() =>
  import("@/features/auth/ForgotPasswordPage").then(({ ForgotPasswordPage }) => ({ default: ForgotPasswordPage })),
);

const ResetPasswordPage = page(() =>
  import("@/features/auth/ResetPasswordPage").then(({ ResetPasswordPage }) => ({ default: ResetPasswordPage })),
);

// -----------------------------------------------------------------------------
// Dashboard and users
// -----------------------------------------------------------------------------
const DashboardHome = page(() =>
  import("@/features/dashboard/DashboardHome").then(({ DashboardHome }) => ({
    default: DashboardHome,
  })),
);
const UsersPage = page(() =>
  import("@/features/users/UsersPage").then(({ UsersPage }) => ({ default: UsersPage })),
);
const UserDetailsPage = page(() =>
  import("@/features/users/UserDetailsPage").then(({ UserDetailsPage }) => ({
    default: UserDetailsPage,
  })),
);
const CreateAdminPage = page(() =>
  import("@/features/users/CreateAdminPage").then(({ CreateAdminPage }) => ({
    default: CreateAdminPage,
  })),
);
const CreateStorePage = page(() =>
  import("@/features/users/CreateStorePage").then(({ CreateStorePage }) => ({
    default: CreateStorePage,
  })),
);
const CreateSupervisorPage = page(() =>
  import("@/features/users/CreateSupervisorPage").then(({ CreateSupervisorPage }) => ({
    default: CreateSupervisorPage,
  })),
);

// -----------------------------------------------------------------------------
// Onboarding requests
// -----------------------------------------------------------------------------
const RequestsPage = page(() =>
  import("@/features/onboarding/RequestsPage").then(({ RequestsPage }) => ({
    default: RequestsPage,
  })),
);
const RequestDetailsPage = page(() =>
  import("@/features/onboarding/RequestDetailsPage").then(({ RequestDetailsPage }) => ({
    default: RequestDetailsPage,
  })),
);

// -----------------------------------------------------------------------------
// Drivers and documents
// -----------------------------------------------------------------------------
const DriversPage = page(() =>
  import("@/features/drivers/DriversPage").then(({ DriversPage }) => ({ default: DriversPage })),
);
const DriverDetailsPage = page(() =>
  import("@/features/drivers/DriverDetailsPage").then(({ DriverDetailsPage }) => ({
    default: DriverDetailsPage,
  })),
);
const DriverDocumentsPage = page(() =>
  import("@/features/drivers/DriverDocumentsPage").then(({ DriverDocumentsPage }) => ({
    default: DriverDocumentsPage,
  })),
);
const DriverDocumentDetailsPage = page(() =>
  import("@/features/drivers/DriverDocumentDetailsPage").then(({ DriverDocumentDetailsPage }) => ({
    default: DriverDocumentDetailsPage,
  })),
);

// -----------------------------------------------------------------------------
// Stores, types, coupons, commissons, cities, areas, supervisors
// -----------------------------------------------------------------------------
const StoresPage = page(() =>
  import("@/features/stores/StoresPage").then(({ StoresPage }) => ({ default: StoresPage })),
);
const StoreDetailsPage = page(() =>
  import("@/features/stores/StoreDetailsPage").then(({ StoreDetailsPage }) => ({
    default: StoreDetailsPage,
  })),
);
const StoreTypesPage = page(() =>
  import("@/features/stores/StoreTypesPage").then(({ StoreTypesPage }) => ({
    default: StoreTypesPage,
  })),
);
const StoreCouponsPage = page(() =>
  import("@/features/stores/StoreCouponsPage").then(({ StoreCouponsPage }) => ({
    default: StoreCouponsPage,
  })),
);

const CommissionsPage = page(() =>
  import("@/features/commissions/CommissionsPage").then(({ CommissionsPage }) => ({ default: CommissionsPage })),
);

const CitiesPage = page(() =>
  import("@/features/cities/CitiesPage").then(({ CitiesPage }) => ({ default: CitiesPage })),
);
const CityDetailsPage = page(() =>
  import("@/features/cities/CityDetailsPage").then(({ CityDetailsPage }) => ({
    default: CityDetailsPage,
  })),
);
const AreasPage = page(() =>
  import("@/features/areas/AreasPage").then(({ AreasPage }) => ({ default: AreasPage })),
);
const AreaDetailsPage = page(() =>
  import("@/features/areas/AreaDetailsPage").then(({ AreaDetailsPage }) => ({
    default: AreaDetailsPage,
  })),
);

const SupervisorsPage = page(() =>
  import("@/features/areas/SupervisorsPage").then(({ SupervisorsPage }) => ({
    default: SupervisorsPage,
  })),
);
const SupervisorDetailsPage = page(() =>
  import("@/features/areas/SupervisorDetailsPage").then(({ SupervisorDetailsPage }) => ({
    default: SupervisorDetailsPage,
  })),
);

// -----------------------------------------------------------------------------
// Ads, Orders, complaints, wallet, notifications, chat, reports, settings
// -----------------------------------------------------------------------------
const AdsPage = page(() =>
  import("@/features/ads/AdsPage").then(({ AdsPage }) => ({ default: AdsPage })),
);
const AdDetailsPage = page(() =>
  import("@/features/ads/AdDetailsPage").then(({ AdDetailsPage }) => ({
    default: AdDetailsPage,
  })),
);

const OrdersPage = page(() =>
  import("@/features/orders/OrdersPage").then(({ OrdersPage }) => ({ default: OrdersPage })),
);
const OrderDetailsPage = page(() =>
  import("@/features/orders/OrderDetailsPage").then(({ OrderDetailsPage }) => ({
    default: OrderDetailsPage,
  })),
);

const ComplaintsPage = page(() =>
  import("@/features/complaints/ComplaintsPage").then(({ ComplaintsPage }) => ({
    default: ComplaintsPage,
  })),
);
const ComplaintDetailsPage = page(() =>
  import("@/features/complaints/ComplaintDetailsPage").then(({ ComplaintDetailsPage }) => ({
    default: ComplaintDetailsPage,
  })),
);

const BroadcastPage = page(() =>
  import("@/features/notifications/BroadcastPage").then(({ BroadcastPage }) => ({
    default: BroadcastPage,
  })),
);
const NotificationsPage = page(() =>
  import("@/features/notifications/NotificationsPage").then(({ NotificationsPage }) => ({
    default: NotificationsPage,
  })),
);

const WalletsPage = page(() =>
  import("@/features/wallets/WalletsPage").then(({ WalletsPage }) => ({ default: WalletsPage })),
);
const WalletDetailsPage = page(() =>
  import("@/features/wallets/WalletDetailsPage").then(({ WalletDetailsPage }) => ({ default: WalletDetailsPage })),
);

const ChatPage = page(() =>
  import("@/features/chat/ChatPage").then(({ ChatPage }) => ({ default: ChatPage })),
);

const ReportsPage = page(() =>
  import("@/features/reports/ReportsPage").then(({ ReportsPage }) => ({
    default: ReportsPage,
  })),
);

const SettingsPage = page(() =>
  import("@/features/settings/SettingsPage").then(({ SettingsPage }) => ({
    default: SettingsPage,
  })),
);

const NotFoundPage = page(() =>
  import("@/shared/components/NotFoundPage").then(({ NotFoundPage }) => ({
    default: NotFoundPage,
  })),
);

export const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    <Route element={<AuthLayout />}>
      <Route path="/auth/login" element={render(LoginPage)} />
      <Route path="/auth/forgot-password" element={render(ForgotPasswordPage)} />
      <Route path="/auth/reset-password" element={render(ResetPasswordPage)} />
      <Route path="/auth/*" element={<Navigate to="/auth/login" replace />} />
    </Route>

    <Route element={<AdminLayout />}>
      <Route path="/dashboard" element={render(DashboardHome)} />

      <Route path="/dashboard/users" element={render(UsersPage)} />
      <Route path="/dashboard/users/:userId" element={render(UserDetailsPage)} />
      <Route path="/dashboard/admins/new" element={render(CreateAdminPage)} />

      <Route path="/dashboard/onboarding/requests" element={render(RequestsPage)} />
      <Route path="/dashboard/onboarding/requests/:requestId" element={render(RequestDetailsPage)} />

      <Route path="/dashboard/drivers" element={render(DriversPage)} />
      <Route path="/dashboard/drivers/:driverId" element={render(DriverDetailsPage)} />
      <Route path="/dashboard/drivers/documents" element={render(DriverDocumentsPage)} />
      <Route path="/dashboard/drivers/documents/:documentId" element={render(DriverDocumentDetailsPage)} />

      <Route path="/dashboard/stores" element={render(StoresPage)} />
      <Route path="/dashboard/stores/new" element={render(CreateStorePage)} />
      <Route path="/dashboard/stores/pending" element={render(StoresPage)} />
      <Route path="/dashboard/stores/boosted" element={render(StoresPage)} />
      <Route path="/dashboard/stores/:storeId" element={render(StoreDetailsPage)} />
      <Route path="/dashboard/store-types" element={render(StoreTypesPage)} />
      <Route path="/dashboard/store-coupons" element={render(StoreCouponsPage)} />

      <Route path="/dashboard/commissions" element={render(CommissionsPage)} />

      <Route path="/dashboard/cities" element={render(CitiesPage)} />
      <Route path="/dashboard/cities/:cityId" element={render(CityDetailsPage)} />
      <Route path="/dashboard/areas" element={render(AreasPage)} />
      <Route path="/dashboard/areas/:areaId" element={render(AreaDetailsPage)} />
      <Route path="/dashboard/supervisors" element={render(SupervisorsPage)} />
      <Route path="/dashboard/supervisors/new" element={render(CreateSupervisorPage)} />
      <Route path="/dashboard/supervisors/:supervisorId" element={render(SupervisorDetailsPage)} />

      <Route path="/dashboard/ads" element={render(AdsPage)} />
      <Route path="/dashboard/ads/:adId" element={render(AdDetailsPage)} />

      <Route path="/dashboard/orders" element={render(OrdersPage)} />
      <Route path="/dashboard/orders/:orderId" element={render(OrderDetailsPage)} />

      <Route path="/dashboard/complaints" element={render(ComplaintsPage)} />
      <Route path="/dashboard/complaints/:complaintId" element={render(ComplaintDetailsPage)} />

      <Route path="/dashboard/notifications" element={render(NotificationsPage)} />
      <Route path="/dashboard/broadcast" element={render(BroadcastPage)} />
      
      <Route path="/dashboard/wallets" element={render(WalletsPage)} />
      <Route path="/dashboard/wallets/:walletId" element={render(WalletDetailsPage)} />

      <Route path="/dashboard/chat" element={render(ChatPage)} />

      <Route path="/dashboard/reports" element={render(ReportsPage)} />

      <Route path="/dashboard/settings" element={render(SettingsPage)} />
    </Route>

    <Route path="*" element={render(NotFoundPage)} />
  </Routes>
);

export default AppRouter;
