import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useAdminCities } from "@shared/hooks/useAdminCities";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import type { CityWithStatsDto } from "@/shared/types";

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

const MoneyIcon = () => (
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
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const StoreIcon = () => (
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
      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
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

const RefreshIcon = () => (
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
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
    />
  </svg>
);

// ============================================
// StoreFeesPage Component
// (Repurposed → read-only City Delivery Metrics
//  backed by getCitiesWithStats / CityWithStatsDto)
// ============================================

export const StoreFeesPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const navigate = useNavigate();
  const toast = useToast();

  const { citiesWithStats, loading, fetchCitiesWithStats } = useAdminCities();

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCitiesWithStats().catch((err: any) =>
      toast.error(err?.message),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    try {
      await fetchCitiesWithStats();
      toast.success(
        lang({ ar: "تم تحديث البيانات", en: "Data refreshed" }),
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const displayName = (c: CityWithStatsDto) =>
    isAr ? c.nameAr || c.nameEn || "—" : c.nameEn || c.nameAr || "—";

  const filteredCities = citiesWithStats.filter((city) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      city.nameAr?.toLowerCase().includes(term) ||
      city.nameEn?.toLowerCase().includes(term) ||
      city.id.toLowerCase().includes(term)
    );
  });

  const t = {
    title: { ar: "مؤشرات المدن والتوصيل", en: "City Delivery Metrics" },
    subtitle: {
      ar: "عرض مؤشرات المتاجر والطلبات والإيرادات لكل مدينة",
      en: "View store, order, and revenue metrics per city",
    },
    searchPlaceholder: {
      ar: "بحث باسم المدينة...",
      en: "Search by city name...",
    },
    back: { ar: "العودة للمدن", en: "Back to Cities" },
    refresh: { ar: "تحديث", en: "Refresh" },
    city: { ar: "المدينة", en: "City" },
    areas: { ar: "المناطق", en: "Areas" },
    stores: { ar: "المتاجر", en: "Stores" },
    activeStores: { ar: "متاجر نشطة", en: "Active Stores" },
    orders: { ar: "الطلبات", en: "Orders" },
    revenue: { ar: "الإيرادات", en: "Revenue" },
    noCities: { ar: "لا توجد بيانات مدن", en: "No city metrics available" },
    noCitiesDesc: {
      ar: "لم يتم إضافة أي مدن بعد",
      en: "No cities have been added yet",
    },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    total: { ar: "المجموع", en: "Total" },
    citiesCount: { ar: "مدينة", en: "cities" },
    egp: { ar: "ج.م", en: "EGP" },
  };

  const totalRevenue = filteredCities.reduce(
    (sum, c) => sum + (c.totalRevenue ?? 0),
    0,
  );
  const totalOrders = filteredCities.reduce(
    (sum, c) => sum + (c.totalOrders ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/cities")}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
        >
          <RefreshIcon />
          {lang(t.refresh)}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute top-1/2 -translate-y-1/2 start-3 text-surface-400 dark:text-surface-500">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang(t.searchPlaceholder)}
          className="w-full rounded-xl py-2.5 ps-10 pe-4 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader variant="inline" message={lang(t.loading)} />
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <MoneyIcon />
          </div>
          <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {lang(t.noCities)}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.noCitiesDesc)}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <th className="text-start px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.city)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.areas)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.stores)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.activeStores)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.orders)}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600 dark:text-surface-300">
                    {lang(t.revenue)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {filteredCities.map((city) => (
                  <tr
                    key={city.id}
                    className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/cities/${city.id}`)}
                  >
                    {/* City */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-info-100 dark:bg-info-900/30 flex items-center justify-center flex-shrink-0">
                          <CityIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                            {displayName(city)}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">
                            {city.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Areas */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        {city.areaCount}
                      </span>
                    </td>

                    {/* Stores */}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <StoreIcon />
                        <span className="font-semibold text-surface-900 dark:text-surface-100">
                          {city.storeCount}
                        </span>
                      </div>
                    </td>

                    {/* Active Stores */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          city.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            city.isActive ? "bg-emerald-500" : "bg-surface-400",
                          )}
                        />
                        {city.activeStores}
                      </span>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        {city.totalOrders}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        {city.totalRevenue} {lang(t.egp)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.total)}: {filteredCities.length} {lang(t.citiesCount)}
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.orders)}:{" "}
              <span className="font-semibold text-surface-900 dark:text-surface-100">
                {totalOrders}
              </span>
              {"  ·  "}
              {lang(t.revenue)}:{" "}
              <span className="font-semibold text-surface-900 dark:text-surface-100">
                {totalRevenue} {lang(t.egp)}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default StoreFeesPage;