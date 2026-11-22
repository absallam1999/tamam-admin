import { useState, useCallback } from "react";

import { adminApi } from "@/config/admin.api";

import type {
  StoreDto,
  StoreTypeDto,
  StoreCategoryDto,
  StoreCategoryListDto,
  CategoryWithTypesDto,

  VerifyStoreDto,
  ReasonRequest,

  SetStoreActiveRequest,
  SetStoreBoostRequest,

  CreateStoreTypeDto,
  UpdateStoreTypeDto,

  CreateStoreCategoryDto,
  UpdateStoreCategoryDto,

  StoreQueryParams,
  StoreCouponApprovalDto,
  StoreCouponQueryParams,
  RejectStoreCouponDto,
  PagedResult,
} from "@shared/types";

export function useAdminStores() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [pagination, setPagination] =
    useState<PagedResult<StoreDto> | null>(null);

  const [storeTypes, setStoreTypes] = useState<StoreTypeDto[]>([]);
  const [storeCategories, setStoreCategories] = useState<StoreCategoryDto[]>(
    [],
  );
  const [storeCoupons, setStoreCoupons] = useState<StoreCouponApprovalDto[]>(
    [],
  );
  const [couponPagination, setCouponPagination] =
    useState<PagedResult<StoreCouponApprovalDto> | null>(null);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // Stores
  // =====================================================

  const fetchStores = useCallback(
    async (params?: StoreQueryParams) => {
      setLoading(true);

      try {
        const result = await adminApi.getStores(params);

        setStores(result.items ?? []);
        setPagination(result);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPendingStores = useCallback(
    async (pageIndex = 1, pageSize = 20) => {
      setLoading(true);

      try {
        const result = await adminApi.getPendingStores(
          pageIndex,
          pageSize,
        );

        setStores(result.items ?? []);
        setPagination(result);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchBoostedStores = useCallback(
    async (pageIndex = 1, pageSize = 20) => {
      setLoading(true);

      try {
        const result = await adminApi.getBoostedStores(
          pageIndex,
          pageSize,
        );

        setStores(result.items ?? []);
        setPagination(result);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchStoreById = useCallback(
    async (storeId: string): Promise<StoreDto> => {
      return adminApi.getStore(storeId);
    },
    [],
  );

  const verifyStore = useCallback(
    async (
      storeId: string,
      dto: VerifyStoreDto,
    ): Promise<StoreDto> => {
      return adminApi.verifyStore(storeId, dto);
    },
    [],
  );

  const rejectStore = useCallback(
    async (
      storeId: string,
      dto: ReasonRequest,
    ): Promise<StoreDto> => {
      return adminApi.rejectStore(storeId, dto);
    },
    [],
  );

  const suspendStore = useCallback(
    async (
      storeId: string,
      dto: ReasonRequest,
    ): Promise<StoreDto> => {
      return adminApi.suspendStore(storeId, dto);
    },
    [],
  );

  const setStoreActive = useCallback(
    async (
      storeId: string,
      dto: SetStoreActiveRequest,
    ): Promise<StoreDto> => {
      return adminApi.setStoreActive(storeId, dto);
    },
    [],
  );

  const setStoreBoost = useCallback(
    async (
      storeId: string,
      dto: SetStoreBoostRequest,
    ): Promise<StoreDto> => {
      return adminApi.setStoreBoost(storeId, dto);
    },
    [],
  );

  // =====================================================
  // Store Categories
  // =====================================================

  const fetchStoreCategories = useCallback(
    async (params?: { IsActive?: boolean; Search?: string }) => {
      const result = await adminApi.getStoreCategories(params);

      setStoreCategories(result);

      return result;
    },
    [],
  );

  const fetchActiveStoreCategories = useCallback(
    async (): Promise<StoreCategoryListDto[]> => {
      return adminApi.getActiveStoreCategories();
    },
    [],
  );

  const fetchStoreCategoryById = useCallback(
    async (id: string): Promise<StoreCategoryDto> => {
      return adminApi.getStoreCategory(id);
    },
    [],
  );

  const createStoreCategory = useCallback(
    async (
      dto: CreateStoreCategoryDto,
    ): Promise<StoreCategoryDto> => {
      return adminApi.createStoreCategory(dto);
    },
    [],
  );

  const updateStoreCategory = useCallback(
    async (
      id: string,
      dto: UpdateStoreCategoryDto,
    ): Promise<StoreCategoryDto> => {
      return adminApi.updateStoreCategory(id, dto);
    },
    [],
  );

  const deleteStoreCategory = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteStoreCategory(id);
    },
    [],
  );

  const toggleStoreCategoryActive = useCallback(
    async (id: string): Promise<StoreCategoryDto> => {
      return adminApi.toggleStoreCategory(id);
    },
    [],
  );

  const fetchCategoryWithTypes = useCallback(
    async (id: string): Promise<CategoryWithTypesDto> => {
      return adminApi.getCategoryWithTypes(id);
    },
    [],
  );

  const fetchCategoriesWithTypes = useCallback(
    async (
      params?: { IsActive?: boolean; Search?: string },
    ): Promise<CategoryWithTypesDto[]> => {
      return adminApi.getCategoriesWithTypes(params);
    },
    [],
  );

  // =====================================================
  // Store Types
  // =====================================================

  const fetchStoreTypes = useCallback(
    async (params?: {
      StoreCategoryId?: string;
      IsActive?: boolean;
      Search?: string;
    }) => {
      const result = await adminApi.getStoreTypes(params);

      setStoreTypes(result);

      return result;
    },
    [],
  );

  const fetchActiveStoreTypes = useCallback(async () => {
    return adminApi.getActiveStoreTypes();
  }, []);

  const fetchStoreTypeById = useCallback(
    async (id: string): Promise<StoreTypeDto> => {
      return adminApi.getStoreType(id);
    },
    [],
  );

  const createStoreType = useCallback(
    async (
      dto: CreateStoreTypeDto,
    ): Promise<StoreTypeDto> => {
      return adminApi.createStoreType(dto);
    },
    [],
  );

  const updateStoreType = useCallback(
    async (
      id: string,
      dto: UpdateStoreTypeDto,
    ): Promise<StoreTypeDto> => {
      return adminApi.updateStoreType(id, dto);
    },
    [],
  );

  const deleteStoreType = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteStoreType(id);
    },
    [],
  );

  const toggleStoreTypeActive = useCallback(
    async (id: string): Promise<StoreTypeDto> => {
      return adminApi.toggleStoreType(id);
    },
    [],
  );

  // =====================================================
  // Store Type Mappings
  // =====================================================

  const approveStoreTypeMapping = useCallback(
    async (mappingId: string): Promise<StoreDto> => {
      return adminApi.approveStoreTypeMapping(mappingId);
    },
    [],
  );

  const rejectStoreTypeMapping = useCallback(
    async (
      mappingId: string,
      dto: ReasonRequest,
    ): Promise<StoreDto> => {
      return adminApi.rejectStoreTypeMapping(
        mappingId,
        dto,
      );
    },
    [],
  );

  // =====================================================
  // Store Coupons
  // =====================================================

  const fetchStoreCoupons = useCallback(
    async (params?: StoreCouponQueryParams) => {
      const result = await adminApi.getStoreCoupons(params);
      setStoreCoupons(result.items ?? []);
      setCouponPagination(result);
      return result;
    },
    [],
  );

  const fetchPendingStoreCoupons = useCallback(
    async (pageIndex = 1, pageSize = 20) => {
      const result = await adminApi.getPendingStoreCoupons(pageIndex, pageSize);
      setStoreCoupons(result.items ?? []);
      setCouponPagination(result);
      return result;
    },
    [],
  );

  const fetchStoreCouponById = useCallback(
    async (id: string): Promise<StoreCouponApprovalDto> => {
      return adminApi.getStoreCoupon(id);
    },
    [],
  );

  const approveStoreCoupon = useCallback(
    async (id: string): Promise<StoreCouponApprovalDto> => {
      const updated = await adminApi.approveStoreCoupon(id);
      setStoreCoupons((current) =>
        current.map((coupon) => (coupon.id === id ? updated : coupon)),
      );
      return updated;
    },
    [],
  );

  const rejectStoreCoupon = useCallback(
    async (
      id: string,
      dto: RejectStoreCouponDto,
    ): Promise<StoreCouponApprovalDto> => {
      const updated = await adminApi.rejectStoreCoupon(id, dto);
      setStoreCoupons((current) =>
        current.map((coupon) => (coupon.id === id ? updated : coupon)),
      );
      return updated;
    },
    [],
  );

  const setStoreCouponActive = useCallback(
    async (id: string, isActive: boolean): Promise<StoreCouponApprovalDto> => {
      const updated = await adminApi.setStoreCouponActive(id, isActive);
      setStoreCoupons((current) =>
        current.map((coupon) => (coupon.id === id ? updated : coupon)),
      );
      return updated;
    },
    [],
  );

  return {
    stores,
    pagination,
    storeTypes,
    storeCategories,
    storeCoupons,
    couponPagination,
    loading,

    // Stores
    fetchStores,
    fetchPendingStores,
    fetchBoostedStores,
    fetchStoreById,

    verifyStore,
    rejectStore,
    suspendStore,

    setStoreActive,
    setStoreBoost,

    // Store Categories
    fetchStoreCategories,
    fetchActiveStoreCategories,
    fetchStoreCategoryById,

    createStoreCategory,
    updateStoreCategory,
    deleteStoreCategory,
    toggleStoreCategoryActive,

    fetchCategoryWithTypes,
    fetchCategoriesWithTypes,

    // Store Types
    fetchStoreTypes,
    fetchActiveStoreTypes,
    fetchStoreTypeById,

    createStoreType,
    updateStoreType,
    deleteStoreType,
    toggleStoreTypeActive,

    // Store Type Mappings
    approveStoreTypeMapping,
    rejectStoreTypeMapping,

    // Store Coupons
    fetchStoreCoupons,
    fetchPendingStoreCoupons,
    fetchStoreCouponById,
    approveStoreCoupon,
    rejectStoreCoupon,
    setStoreCouponActive,
  };
}