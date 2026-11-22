import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminDrivers } from "@shared/hooks/useAdminDrivers";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { DriverDto, CreateDriverDto } from "@shared/types";

// ============================================
// Icons
// ============================================

const SearchIcon = () => (
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
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const PhoneIcon = () => (
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
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  </svg>
);

const MailIcon = () => (
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
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const MoreIcon = () => (
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
      d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
);

const VehicleIcon = () => (
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
      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);

const PlusIcon = () => (
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
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

// ============================================
// Helpers
// ============================================

interface DriverFormState {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  vehicleType: string;
  vehiclePlateNumber: string;
  autoVerify: boolean;
}

const initialCreateForm: DriverFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  password: "",
  vehicleType: "",
  vehiclePlateNumber: "",
  autoVerify: true,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ============================================
// DriversPage Component
// ============================================

export const DriversPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = useCallback(
    (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en),
    [isAr],
  );
  const navigate = useNavigate();
  const toast = useToast();

  const {
    drivers,
    driversTotalCount,
    fetchDrivers,
    createDriver,
    updateDriver,
    setDriverVerified,
  } = useAdminDrivers();

  // Local filters & pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);
  const pageSize = 12;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Create Driver Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] =
    useState<DriverFormState>(initialCreateForm);
  const [creating, setCreating] = useState(false);

  const loadDrivers = useCallback(async () => {
    setTableLoading(true);
    try {
      const result = await fetchDrivers({
        Search: search.trim() || undefined,
        IsActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
        IsVerified:
          verifiedFilter === "verified"
            ? true
            : verifiedFilter === "unverified"
              ? false
              : undefined,
        PageIndex: pageIndex,
        PageSize: pageSize,
      });
      setTotalPages(result.totalPages || 1);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحميل السائقين", en: "Failed to load drivers" }),
        ),
      );
    } finally {
      setTableLoading(false);
    }
  }, [fetchDrivers, search, statusFilter, verifiedFilter, pageIndex, toast, lang]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrivers();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadDrivers]);

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleToggleActive = async (driver: DriverDto) => {
    setOpenMenuId(null);
    try {
      await updateDriver(driver.id, { isActive: !driver.isActive });
      toast.success(
        driver.isActive
          ? lang({ ar: "تم تعليق السائق", en: "Driver suspended" })
          : lang({ ar: "تم تنشيط السائق", en: "Driver activated" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل تحديث الحالة", en: "Failed to update status" }),
        ),
      );
    }
  };

  const handleToggleVerified = async (driver: DriverDto) => {
    setOpenMenuId(null);
    try {
      await setDriverVerified(driver.id, { isVerified: !driver.isVerified });
      toast.success(
        !driver.isVerified
          ? lang({ ar: "تم توثيق السائق", en: "Driver verified" })
          : lang({ ar: "تم إلغاء توثيق السائق", en: "Driver unverified" }),
      );
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({
            ar: "فشل تحديث حالة التوثيق",
            en: "Failed to update verification",
          }),
        ),
      );
    }
  };

  const handleCreateDriver = async () => {
    if (!createForm.fullName.trim() || !createForm.phoneNumber.trim()) {
      toast.error(
        lang({
          ar: "الاسم ورقم الهاتف مطلوبان",
          en: "Full name and phone number are required",
        }),
      );
      return;
    }
    setCreating(true);
    try {
      const dto: CreateDriverDto = {
        fullName: createForm.fullName.trim(),
        phoneNumber: createForm.phoneNumber.trim(),
        email: createForm.email.trim() || null,
        password: createForm.password || null,
        vehicleType: createForm.vehicleType.trim() || null,
        vehiclePlateNumber: createForm.vehiclePlateNumber.trim() || null,
        autoVerify: createForm.autoVerify,
      };
      await createDriver(dto);
      toast.success(
        lang({ ar: "تم إضافة السائق بنجاح", en: "Driver created successfully" }),
      );
      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          lang({ ar: "فشل إضافة السائق", en: "Failed to create driver" }),
        ),
      );
    } finally {
      setCreating(false);
    }
  };

  const t = {
    title: { ar: "إدارة السائقين", en: "Driver Management" },
    subtitle: {
      ar: "عرض وإدارة جميع السائقين المسجلين",
      en: "View and manage all registered drivers",
    },
    searchPlaceholder: {
      ar: "بحث بالاسم أو رقم الهاتف...",
      en: "Search by name or phone...",
    },
    allStatuses: { ar: "جميع الحالات", en: "All Statuses" },
    allVerified: { ar: "الكل (التوثيق)", en: "All Verification" },
    active: { ar: "نشط", en: "Active" },
    inactive: { ar: "غير نشط", en: "Inactive" },
    verified: { ar: "موثق", en: "Verified" },
    unverified: { ar: "غير موثق", en: "Unverified" },
    viewDetails: { ar: "عرض التفاصيل", en: "View Details" },
    suspend: { ar: "تعليق", en: "Suspend" },
    activate: { ar: "تنشيط", en: "Activate" },
    verify: { ar: "توثيق", en: "Verify" },
    unverify: { ar: "إلغاء التوثيق", en: "Unverify" },
    noDrivers: { ar: "لا يوجد سائقين", en: "No drivers found" },
    noDriversDesc: {
      ar: "لم يتم العثور على سائقين مطابقين لمعايير البحث",
      en: "No drivers match your search criteria",
    },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },
    total: { ar: "المجموع", en: "Total" },
    drivers: { ar: "سائق", en: "drivers" },
    pendingDocs: { ar: "مستندات معلقة", en: "Pending Documents" },
    addDriver: { ar: "إضافة سائق", en: "Add Driver" },
    createTitle: { ar: "إضافة سائق جديد", en: "Add New Driver" },
    fullName: { ar: "الاسم الكامل", en: "Full Name" },
    phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    password: { ar: "كلمة المرور", en: "Password" },
    vehicleType: { ar: "نوع المركبة", en: "Vehicle Type" },
    vehiclePlate: { ar: "رقم اللوحة", en: "Plate Number" },
    autoVerify: { ar: "توثيق تلقائي", en: "Auto Verify" },
    save: { ar: "حفظ", en: "Save" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    processing: { ar: "جاري المعالجة...", en: "Processing..." },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate("/dashboard/drivers/documents")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            {lang(t.pendingDocs)}
          </button>
          <button
            onClick={() => {
              setCreateForm(initialCreateForm);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
          >
            <PlusIcon />
            {lang(t.addDriver)}
          </button>
        </div>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(1);
            }}
            placeholder={lang(t.searchPlaceholder)}
            className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={verifiedFilter}
          onChange={(e) => {
            setVerifiedFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[150px]"
        >
          <option value="">{lang(t.allVerified)}</option>
          <option value="verified">{lang(t.verified)}</option>
          <option value="unverified">{lang(t.unverified)}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl py-2.5 px-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="">{lang(t.allStatuses)}</option>
          <option value="active">{lang(t.active)}</option>
          <option value="inactive">{lang(t.inactive)}</option>
        </select>
      </div>

      {/* Drivers Table */}
      {tableLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <VehicleIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noDrivers)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noDriversDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang({ ar: "السائق", en: "Driver" })}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden md:table-cell">
                    {lang({ ar: "رقم الهاتف", en: "Phone" })}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 hidden lg:table-cell">
                    {lang({ ar: "المركبة", en: "Vehicle" })}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang({ ar: "التوثيق", en: "Verification" })}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang({ ar: "الحالة", en: "Status" })}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300 w-16">
                    {lang({ ar: "إجراءات", en: "Actions" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {drivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/drivers/${driver.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-xs font-bold text-white">
                            {driver.fullName?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                            {driver.fullName || (isAr ? "بدون اسم" : "No Name")}
                          </p>
                          {driver.email && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate flex items-center gap-1 mt-0.5">
                              <MailIcon />
                              {driver.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-surface-600 dark:text-surface-400 flex items-center gap-1.5">
                        <PhoneIcon />
                        {driver.phoneNumber || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-surface-600 dark:text-surface-400 text-xs">
                        {driver.vehicleType || "—"}
                        {driver.vehiclePlateNumber
                          ? ` (${driver.vehiclePlateNumber})`
                          : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          driver.isVerified
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            driver.isVerified
                              ? "bg-emerald-500"
                              : "bg-amber-500",
                          )}
                        />
                        {driver.isVerified
                          ? lang(t.verified)
                          : lang(t.unverified)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          driver.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            driver.isActive
                              ? "bg-emerald-500"
                              : "bg-surface-400",
                          )}
                        />
                        {driver.isActive ? lang(t.active) : lang(t.inactive)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div
                        className="relative inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === driver.id ? null : driver.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <MoreIcon />
                        </button>
                        {openMenuId === driver.id && (
                          <div
                            className={cn(
                              "absolute z-20 top-full mt-1 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-fade-in-scale",
                              isAr
                                ? "left-0 origin-top-left"
                                : "right-0 origin-top-right",
                            )}
                          >
                            <button
                              onClick={() => {
                                navigate(`/dashboard/drivers/${driver.id}`);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                              {lang(t.viewDetails)}
                            </button>
                            <button
                              onClick={() => handleToggleVerified(driver)}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                              {driver.isVerified
                                ? lang(t.unverify)
                                : lang(t.verify)}
                            </button>
                            <button
                              onClick={() => handleToggleActive(driver)}
                              className={cn(
                                "flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors",
                                driver.isActive
                                  ? "text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30"
                                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
                              )}
                            >
                              {driver.isActive
                                ? lang(t.suspend)
                                : lang(t.activate)}
                            </button>
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
              {lang(t.total)}: {driversTotalCount || drivers.length}{" "}
              {lang(t.drivers)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      isAr
                        ? "m8.25 4.5 7.5 7.5-7.5 7.5"
                        : "M15.75 19.5 8.25 12l7.5-7.5"
                    }
                  />
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
                      isAr
                        ? "m15.75 19.5-7.5-7.5 7.5-7.5"
                        : "m8.25 4.5 7.5 7.5-7.5 7.5"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Driver Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {lang(t.createTitle)}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.fullName)} <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, fullName: e.target.value })
                  }
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                  {lang(t.phoneNumber)}{" "}
                  <span className="text-error-500">*</span>
                </label>
                <input
                  type="tel"
                  value={createForm.phoneNumber}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.email)}
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.password)}
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.vehicleType)}
                  </label>
                  <input
                    type="text"
                    value={createForm.vehicleType}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        vehicleType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                    {lang(t.vehiclePlate)}
                  </label>
                  <input
                    type="text"
                    value={createForm.vehiclePlateNumber}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        vehiclePlateNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-xl py-2.5 px-4 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={createForm.autoVerify}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      autoVerify: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {lang(t.autoVerify)}
                </span>
              </label>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {lang(t.cancel)}
              </button>
              <button
                onClick={handleCreateDriver}
                disabled={creating}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {creating ? lang(t.processing) : lang(t.save)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;