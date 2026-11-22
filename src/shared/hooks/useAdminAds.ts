import { useCallback, useState } from "react";
import { adminApi } from "@/config/admin.api";
import type { AdDto, CreateAdDto, UpdateAdDto } from "@shared/types";

export type Ad = AdDto;

export interface UseAdminAdsResult {
  ads: AdDto[];
  loading: boolean;
  error: Error | null;
  fetchAds: (isActive?: boolean) => Promise<AdDto[]>;
  fetchAdById: (adId: string) => Promise<AdDto>;
  createAd: (dto: CreateAdDto) => Promise<AdDto>;
  updateAd: (adId: string, dto: UpdateAdDto) => Promise<AdDto>;
  deleteAd: (adId: string) => Promise<void>;
  toggleAdActive: (adId: string) => Promise<AdDto>;
}

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; Message?: unknown };
    if (typeof value.message === "string") return new Error(value.message);
    if (typeof value.Message === "string") return new Error(value.Message);
  }
  return new Error(fallback);
}

/**
 * Admin Ads API hook.
 *
 * - GET/POST /api/admin/ads
 * - GET/PUT/DELETE /api/admin/ads/{adId}
 * - PATCH /api/admin/ads/{adId}/toggle
 */
export function useAdminAds(): UseAdminAdsResult {
  const [ads, setAds] = useState<AdDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAds = useCallback(async (isActive?: boolean): Promise<AdDto[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getAds({ isActive });
      setAds(result);
      return result;
    } catch (cause) {
      const nextError = toError(cause, "Failed to load advertisements.");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdById = useCallback(async (adId: string): Promise<AdDto> => {
    try {
      return await adminApi.getAd(adId);
    } catch (cause) {
      throw toError(cause, "Failed to load the advertisement.");
    }
  }, []);

  const createAd = useCallback(async (dto: CreateAdDto): Promise<AdDto> => {
    try {
      const created = await adminApi.createAd(dto);
      setAds((current) => [created, ...current]);
      return created;
    } catch (cause) {
      throw toError(cause, "Failed to create the advertisement.");
    }
  }, []);

  const updateAd = useCallback(
    async (adId: string, dto: UpdateAdDto): Promise<AdDto> => {
      try {
        const updated = await adminApi.updateAd(adId, dto);
        setAds((current) =>
          current.map((ad) => (ad.id === adId ? updated : ad)),
        );
        return updated;
      } catch (cause) {
        throw toError(cause, "Failed to update the advertisement.");
      }
    },
    [],
  );

  const deleteAd = useCallback(async (adId: string): Promise<void> => {
    try {
      await adminApi.deleteAd(adId);
      setAds((current) => current.filter((ad) => ad.id !== adId));
    } catch (cause) {
      throw toError(cause, "Failed to delete the advertisement.");
    }
  }, []);

  const toggleAdActive = useCallback(async (adId: string): Promise<AdDto> => {
    try {
      const updated = await adminApi.toggleAd(adId);
      setAds((current) =>
        current.map((ad) => (ad.id === adId ? updated : ad)),
      );
      return updated;
    } catch (cause) {
      throw toError(cause, "Failed to change advertisement status.");
    }
  }, []);

  return {
    ads,
    loading,
    error,
    fetchAds,
    fetchAdById,
    createAd,
    updateAd,
    deleteAd,
    toggleAdActive,
  };
}
