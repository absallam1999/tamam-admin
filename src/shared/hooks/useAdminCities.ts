import { useState, useCallback } from "react";

import { adminApi } from "@/config/admin.api";

import type {
  CityDto,
  CityWithStatsDto,
  CityListDto,
  CreateCityDto,
  UpdateCityDto,
  SetCityActiveRequest,
  CityQueryParams,
  PagedResult,
} from "@shared/types";

export function useAdminCities() {
  const [cities, setCities] = useState<CityDto[]>([]);
  const [citiesWithStats, setCitiesWithStats] = useState<
    CityWithStatsDto[]
  >([]);

  const [pagination, setPagination] =
    useState<PagedResult<CityDto> | null>(null);

  const [loading, setLoading] = useState(false);

  const fetchCities = useCallback(
    async (params?: CityQueryParams) => {
      setLoading(true);

      try {
        const result = await adminApi.getCities(params);

        setCities(result.items ?? []);
        setPagination(result);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchCitiesWithStats = useCallback(
    async (params?: CityQueryParams) => {
      setLoading(true);

      try {
        const result =
          await adminApi.getCitiesWithStats(params);

        setCitiesWithStats(result.items ?? []);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchCityById = useCallback(
    async (id: string): Promise<CityDto> => {
      return adminApi.getCity(id);
    },
    [],
  );

  const createCity = useCallback(
    async (dto: CreateCityDto): Promise<CityDto> => {
      return adminApi.createCity(dto);
    },
    [],
  );

  const updateCity = useCallback(
    async (
      id: string,
      dto: UpdateCityDto,
    ): Promise<CityDto> => {
      return adminApi.updateCity(id, dto);
    },
    [],
  );

  const deleteCity = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteCity(id);
    },
    [],
  );

  const setCityActive = useCallback(
    async (
      id: string,
      dto: SetCityActiveRequest,
    ): Promise<CityDto> => {
      return adminApi.setCityActive(id, dto);
    },
    [],
  );

  const lookupCities = useCallback(
    async (): Promise<CityListDto[]> => {
      return adminApi.lookupCities();
    },
    [],
  );

  return {
    cities,
    citiesWithStats,
    pagination,
    loading,

    fetchCities,
    fetchCitiesWithStats,
    fetchCityById,

    createCity,
    updateCity,
    deleteCity,

    setCityActive,
    lookupCities,
  };
}