import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import {
  useUsers,
  useSuspendUser,
  useActivateUser,
} from "@/shared/hooks/useAdminManagement";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { UserListItemDto, UserRole } from "@/shared/types";
import { UserRole as UserRoleEnum } from "@/shared/types";

type AdminUser = UserListItemDto;

// ============================================
// Icons
// ============================================

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

// ============================================
// Role Badge Styles (string-keyed now)
// ============================================

const roleBadgeStyles: Record<UserRole, string> = {
  Customer: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Driver: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  StoreOwner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  Supervisor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

// ============================================
// Role Arabic Labels
// ============================================

const roleLabelsAr: Record<string, string> = {
  Customer: "عميل",
  Driver: "سائق",
  Store: "متجر",
  StoreOwner: "متجر",
  Supervisor: "مشرف",
  Admin: "مسؤول",
};

// ============================================
// UsersPage Component
// ============================================

export const UsersPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 12;

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Role Helpers (string-based now)
  const normalizeRole = (role: string | number | null | undefined): UserRole => {
    if (role === undefined || role === null || role === "") return UserRoleEnum.Customer;

    if (typeof role === "number") {
      const numericMap: Record<number, UserRole> = {
        0: UserRoleEnum.Customer,
        1: UserRoleEnum.Driver,
        2: UserRoleEnum.StoreOwner,
        3: UserRoleEnum.Admin,
        4: UserRoleEnum.Supervisor,
      };
      return numericMap[role] ?? UserRoleEnum.Customer;
    }

    const key = String(role).toLowerCase();
    if (key === "store" || key === "storeowner") return UserRoleEnum.StoreOwner;
    if (key === "customer") return UserRoleEnum.Customer;
    if (key === "driver") return UserRoleEnum.Driver;
    if (key === "supervisor") return UserRoleEnum.Supervisor;
    if (key === "admin" || key === "superadmin") return UserRoleEnum.Admin;
    return UserRoleEnum.Customer;
  };

  const getRoleLabel = (role: string | number | null | undefined): string => {
    const normalized = normalizeRole(role);
    return isAr ? roleLabelsAr[normalized] || normalized : normalized;
  };

  // Build query params
  const queryParams = useMemo(
    () => ({
      Search: debouncedSearch || undefined,
      Role: roleFilter || undefined,
      IsActive:
        statusFilter === "active"
          ? true
          : statusFilter === "inactive"
            ? false
            : undefined,
      PageIndex: pageIndex,
      PageSize: pageSize,
    }),
    [debouncedSearch, roleFilter, statusFilter, pageIndex, pageSize],
  );

  // React Query hook
  const { data, isLoading, refetch } = useUsers(queryParams);

  // Mutations (no toggle — suspend/activate cover it)
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();

  const users = data?.items ?? [];
  const pagination = data;
  const totalPages = pagination?.totalPages || 1;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Close menu on click outside
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSuspend = useCallback(
    async (user: AdminUser) => {
      try {
        await suspendMutation.mutateAsync({
          userId: user.id,
          role: user.role ?? undefined,
        });
        toast.success(lang({ ar: "تم تعليق المستخدم", en: "User suspended" }));
        refetch();
      } catch (err: any) {
        toast.error(
          err.message || lang({ ar: "فشل التعليق", en: "Suspend failed" }),
        );
      }
      setOpenMenuId(null);
    },
    [suspendMutation, toast, lang, refetch],
  );

  const handleActivate = useCallback(
    async (user: AdminUser) => {
      try {
        await activateMutation.mutateAsync({
          userId: user.id,
          role: user.role ?? undefined,
        });
        toast.success(lang({ ar: "تم تنشيط المستخدم", en: "User activated" }));
        refetch();
      } catch (err: any) {
        toast.error(
          err.message || lang({ ar: "فشل التنشيط", en: "Activation failed" }),
        );
      }
      setOpenMenuId(null);
    },
    [activateMutation, toast, lang, refetch],
  );

  const handleToggleActive = useCallback(
    async (user: AdminUser) => {
      try {
        if (user.isActive) {
          await suspendMutation.mutateAsync({
            userId: user.id,
            role: user.role ?? undefined,
          });
        } else {
          await activateMutation.mutateAsync({
            userId: user.id,
            role: user.role ?? undefined,
          });
        }
        toast.success(lang({ ar: "تم تحديث الحالة", en: "Status updated" }));
        refetch();
      } catch (err: any) {
        toast.error(
          err.message || lang({ ar: "فشل التحديث", en: "Update failed" }),
        );
      }
      setOpenMenuId(null);
    },
    [suspendMutation, activateMutation, toast, lang, refetch],
  );

  const t = {
    title: { ar: "إدارة المستخدمين", en: "User Management" },
    subtitle: {
      ar: "عرض وإدارة جميع مستخدمي المنصة",
      en: "View and manage all platform users",
    },
    searchPlaceholder: {
      ar: "بحث بالاسم أو رقم الهاتف...",
      en: "Search by name or phone...",
    },
    allRoles: { ar: "جميع الأدوار", en: "All Roles" },
    allStatuses: { ar: "جميع الحالات", en: "All Statuses" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    customer: { ar: "عميل", en: "Customer" },
    driver: { ar: "سائق", en: "Driver" },
    store: { ar: "متجر", en: "Store" },
    supervisor: { ar: "مشرف", en: "Supervisor" },
    admin: { ar: "مسؤول", en: "Admin" },
    viewDetails: { ar: "عرض التفاصيل", en: "View Details" },
    suspend: { ar: "تعليق", en: "Suspend" },
    activate: { ar: "تنشيط", en: "Activate" },
    toggleStatus: { ar: "تبديل الحالة", en: "Toggle Status" },
    noUsers: { ar: "لا يوجد مستخدمين", en: "No users found" },
    noUsersDesc: {
      ar: "لم يتم العثور على مستخدمين مطابقين لمعايير البحث",
      en: "No users match your search criteria",
    },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    total: { ar: "المجموع", en: "Total" },
    users: { ar: "مستخدم", en: "users" },
    user: { ar: "المستخدم", en: "User" },
    role: { ar: "الدور", en: "Role" },
    phone: { ar: "رقم الهاتف", en: "Phone" },
    status: { ar: "الحالة", en: "Status" },
    actions: { ar: "إجراءات", en: "Actions" },
    noName: { ar: "بدون اسم", en: "No Name" },
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={cn(isAr ? "text-right" : "text-left")}>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {lang(t.title)}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {lang(t.subtitle)}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang(t.searchPlaceholder)}
            className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all cursor-pointer min-w-[140px]"
        >
          <option value="">{lang(t.allRoles)}</option>
          <option value="Customer">{lang(t.customer)}</option>
          <option value="Driver">{lang(t.driver)}</option>
          <option value="StoreOwner">{lang(t.store)}</option>
          <option value="Supervisor">{lang(t.supervisor)}</option>
          <option value="Admin">{lang(t.admin)}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all cursor-pointer min-w-[140px]"
        >
          <option value="">{lang(t.allStatuses)}</option>
          <option value="active">{lang(t.active)}</option>
          <option value="inactive">{lang(t.inactive)}</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noUsers)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noUsersDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <th className={cn("text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300", isAr ? "text-right" : "text-left")}>
                    {lang(t.user)}
                  </th>
                  <th className={cn("text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden sm:table-cell", isAr ? "text-right" : "text-left")}>
                    {lang(t.role)}
                  </th>
                  <th className={cn("text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden md:table-cell", isAr ? "text-right" : "text-left")}>
                    {lang(t.phone)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.status)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 w-16">
                    {lang(t.actions)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(`/dashboard/users/${user.id}?role=${user.role ?? ""}`)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-xs font-bold text-white">
                            {user.fullName?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                            {user.fullName || lang(t.noName)}
                          </p>
                          {user.email && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate flex items-center gap-1 mt-0.5">
                              <MailIcon />
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                          roleBadgeStyles[normalizeRole(user.role)],
                        )}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-surface-600 dark:text-surface-400 flex items-center gap-1.5">
                        <PhoneIcon />
                        {user.phoneNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            user.isActive ? "bg-emerald-500" : "bg-surface-400",
                          )}
                        />
                        {user.isActive ? lang(t.active) : lang(t.inactive)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div
                        className="relative inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === user.id ? null : user.id)
                          }
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <MoreIcon />
                        </button>
                        {openMenuId === user.id && (
                          <div
                            className={cn(
                              "absolute z-20 top-full mt-1 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-fade-in-scale",
                              isAr ? "left-0 origin-top-left" : "right-0 origin-top-right",
                            )}
                          >
                            <button
                              onClick={() => {
                                navigate(`/dashboard/users/${user.id}?role=${user.role ?? ""}`);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                              {lang(t.viewDetails)}
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                              </svg>
                              {lang(t.toggleStatus)}
                            </button>
                            {user.isActive ? (
                              <button
                                onClick={() => handleSuspend(user)}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                {lang(t.suspend)}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(user)}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                {lang(t.activate)}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.total)}: {pagination?.totalCount || users.length} {lang(t.users)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={isAr ? "m8.25 4.5 7.5 7.5-7.5 7.5" : "M15.75 19.5 8.25 12l7.5-7.5"} />
                </svg>
              </button>
              <span className="text-sm text-surface-600 dark:text-surface-400 px-2">
                {lang(t.page)} {pageIndex} {lang(t.of)} {totalPages}
              </span>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                className="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={isAr ? "m15.75 19.5-7.5-7.5 7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;