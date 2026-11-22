import { useCallback, useState } from "react";
import { adminApi } from "@config/admin.api";
import type {
  CreateDriverDto,
  DriverBrowseDto,
  DriverDocumentDto,
  DriverDto,
  DriverQueryParams,
  PagedResult,
  RejectDocumentRequest,
  SetDriverVerificationRequest,
  UpdateDriverDto,
  VerifyDocumentDto,
} from "@shared/types";

export type Driver = DriverDto;
export type DriverDocument = DriverDocumentDto;

export interface UseAdminDriversResult {
  // Drivers
  drivers: DriverDto[];
  driversTotalCount: number;
  fetchDrivers: (params?: DriverQueryParams) => Promise<PagedResult<DriverDto>>;
  fetchDriverById: (driverId: string) => Promise<DriverDto>;
  createDriver: (dto: CreateDriverDto) => Promise<DriverDto>;
  updateDriver: (driverId: string, dto: UpdateDriverDto) => Promise<DriverDto>;
  setDriverVerified: (
    driverId: string,
    dto: SetDriverVerificationRequest,
  ) => Promise<DriverDto>;
  fetchNearbyDrivers: (params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  }) => Promise<DriverBrowseDto[]>;

  // Documents
  documents: DriverDocumentDto[];
  documentsTotalCount: number;
  fetchDocuments: (params?: {
    pageIndex?: number;
    pageSize?: number;
    driverId?: string;
    status?: string;
  }) => Promise<PagedResult<DriverDocumentDto>>;
  fetchPendingDocuments: (
    pageIndex?: number,
    pageSize?: number,
  ) => Promise<PagedResult<DriverDocumentDto>>;
  fetchDriverDocuments: (driverId: string) => Promise<DriverDocumentDto[]>;
  viewDocument: (documentId: string) => Promise<DriverDocumentDto>;
  verifyDocument: (input: {
    documentId: string;
    dto: VerifyDocumentDto;
  }) => Promise<DriverDocumentDto>;
  rejectDocument: (input: {
    documentId: string;
    dto: RejectDocumentRequest;
  }) => Promise<DriverDocumentDto>;

  // Shared request state
  loading: boolean;
  error: Error | null;
  fetchError: unknown;
  isVerifying: boolean;
  isRejecting: boolean;
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
 * Consolidated Admin driver and driver-document hook.
 *
 * Supported backend routes:
 * - /api/admin/drivers
 * - /api/admin/drivers/{driverId}
 * - /api/admin/drivers/nearby
 * - /api/admin/drivers/{driverId}/verify
 * - /api/admin/documents
 * - /api/admin/documents/pending
 * - /api/admin/documents/{documentId}
 * - /api/admin/documents/by-driver/{driverId}
 * - /api/admin/documents/{documentId}/verify
 * - /api/admin/documents/{documentId}/reject
 */
export function useAdminDrivers(): UseAdminDriversResult {
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [driversTotalCount, setDriversTotalCount] = useState(0);
  const [documents, setDocuments] = useState<DriverDocumentDto[]>([]);
  const [documentsTotalCount, setDocumentsTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchError, setFetchError] = useState<unknown>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const run = useCallback(async <T,>(
    operation: () => Promise<T>,
    fallback: string,
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    setFetchError(null);
    try {
      return await operation();
    } catch (cause) {
      const nextError = toError(cause, fallback);
      setError(nextError);
      setFetchError(cause);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Drivers
  // ---------------------------------------------------------------------------

  const fetchDrivers = useCallback(
    (params?: DriverQueryParams) =>
      run(async () => {
        const result = await adminApi.getDrivers(params);
        setDrivers(result.items ?? []);
        setDriversTotalCount(result.totalCount);
        return result;
      }, "Failed to load drivers."),
    [run],
  );

  const fetchDriverById = useCallback(
    (driverId: string) =>
      run(
        () => adminApi.getDriver(driverId),
        "Failed to load the driver.",
      ),
    [run],
  );

  const createDriver = useCallback(
    (dto: CreateDriverDto) =>
      run(async () => {
        const created = await adminApi.createDriver(dto);
        setDrivers((current) => [created, ...current]);
        setDriversTotalCount((current) => current + 1);
        return created;
      }, "Failed to create the driver."),
    [run],
  );

  const updateDriver = useCallback(
    (driverId: string, dto: UpdateDriverDto) =>
      run(async () => {
        const updated = await adminApi.updateDriver(driverId, dto);
        setDrivers((current) =>
          current.map((driver) => (driver.id === driverId ? updated : driver)),
        );
        return updated;
      }, "Failed to update the driver."),
    [run],
  );

  const setDriverVerified = useCallback(
    (driverId: string, dto: SetDriverVerificationRequest) =>
      run(async () => {
        const updated = await adminApi.setDriverVerified(driverId, dto);
        setDrivers((current) =>
          current.map((driver) => (driver.id === driverId ? updated : driver)),
        );
        return updated;
      }, "Failed to update driver verification status."),
    [run],
  );

  const fetchNearbyDrivers = useCallback(
    (params: { latitude: number; longitude: number; radiusKm: number }) =>
      run(
        () => adminApi.getNearbyDrivers(params),
        "Failed to load nearby drivers.",
      ),
    [run],
  );

  // ---------------------------------------------------------------------------
  // Documents
  // ---------------------------------------------------------------------------

  const fetchDocuments = useCallback(
    (params?: {
      pageIndex?: number;
      pageSize?: number;
      driverId?: string;
      status?: string;
    }) =>
      run(async () => {
        const result = await adminApi.getDriverDocuments(params);
        setDocuments(result.items ?? []);
        setDocumentsTotalCount(result.totalCount);
        return result;
      }, "Failed to load driver documents."),
    [run],
  );

  const fetchPendingDocuments = useCallback(
    (pageIndex = 1, pageSize = 20) =>
      run(async () => {
        const result = await adminApi.getPendingDriverDocuments(pageIndex, pageSize);
        setDocuments(result.items ?? []);
        setDocumentsTotalCount(result.totalCount);
        return result;
      }, "Failed to load pending driver documents."),
    [run],
  );

  const fetchDriverDocuments = useCallback(
    (driverId: string) =>
      run(
        () => adminApi.getDocumentsByDriver(driverId),
        "Failed to load documents for the driver.",
      ),
    [run],
  );

  const viewDocument = useCallback(
    (documentId: string) =>
      run(
        () => adminApi.getDriverDocument(documentId),
        "Failed to load the driver document.",
      ),
    [run],
  );

  const verifyDocument = useCallback(
    async (input: {
      documentId: string;
      dto: VerifyDocumentDto;
    }): Promise<DriverDocumentDto> => {
      setIsVerifying(true);
      setError(null);
      try {
        const updated = await adminApi.verifyDriverDocument(
          input.documentId,
          input.dto,
        );
        setDocuments((current) =>
          current.map((document) =>
            document.id === input.documentId ? updated : document,
          ),
        );
        return updated;
      } catch (cause) {
        const nextError = toError(cause, "Failed to verify the driver document.");
        setError(nextError);
        throw nextError;
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  const rejectDocument = useCallback(
    async (input: {
      documentId: string;
      dto: RejectDocumentRequest;
    }): Promise<DriverDocumentDto> => {
      setIsRejecting(true);
      setError(null);
      try {
        const updated = await adminApi.rejectDriverDocument(
          input.documentId,
          input.dto,
        );
        setDocuments((current) =>
          current.map((document) =>
            document.id === input.documentId ? updated : document,
          ),
        );
        return updated;
      } catch (cause) {
        const nextError = toError(cause, "Failed to reject the driver document.");
        setError(nextError);
        throw nextError;
      } finally {
        setIsRejecting(false);
      }
    },
    [],
  );

  return {
    drivers,
    driversTotalCount,
    fetchDrivers,
    fetchDriverById,
    createDriver,
    updateDriver,
    setDriverVerified,
    fetchNearbyDrivers,
    documents,
    documentsTotalCount,
    fetchDocuments,
    fetchPendingDocuments,
    fetchDriverDocuments,
    viewDocument,
    verifyDocument,
    rejectDocument,
    loading,
    error,
    fetchError,
    isVerifying,
    isRejecting,
  };
}
