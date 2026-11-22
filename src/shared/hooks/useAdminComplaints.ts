import { useCallback, useState } from "react";
import { adminApi } from "@config/admin.api";
import type {
  ComplaintDto,
  PagedResult,
  ResolveComplaintDto,
} from "@shared/types";

export type Complaint = ComplaintDto;

export interface UseAdminComplaintsResult {
  complaints: ComplaintDto[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
  fetchComplaints: (
    statusOrParams?: string | { status?: string; pageIndex?: number; pageSize?: number },
  ) => Promise<PagedResult<ComplaintDto>>;
  fetchComplaintById: (id: string) => Promise<ComplaintDto>;
  resolveComplaint: (id: string, dto: ResolveComplaintDto) => Promise<ComplaintDto>;
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
 * Admin complaints hook.
 *
 * Supported routes:
 * - GET /api/admin/complaints
 * - GET /api/admin/complaints/{id}
 * - POST /api/admin/complaints/{id}/resolve
 */
export function useAdminComplaints(): UseAdminComplaintsResult {
  const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComplaints = useCallback(
    async (
      statusOrParams?: string | { status?: string; pageIndex?: number; pageSize?: number },
    ): Promise<PagedResult<ComplaintDto>> => {
      setLoading(true);
      setError(null);
      try {
        const params =
          typeof statusOrParams === "string"
            ? { status: statusOrParams }
            : statusOrParams;
        const result = await adminApi.getComplaints(params);
        setComplaints(result.items ?? []);
        setTotalCount(result.totalCount);
        return result;
      } catch (cause) {
        const nextError = toError(cause, "Failed to load complaints.");
        setError(nextError);
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchComplaintById = useCallback(async (id: string): Promise<ComplaintDto> => {
    try {
      return await adminApi.getComplaint(id);
    } catch (cause) {
      throw toError(cause, "Failed to load the complaint.");
    }
  }, []);

  const resolveComplaint = useCallback(
    async (id: string, dto: ResolveComplaintDto): Promise<ComplaintDto> => {
      try {
        const resolved = await adminApi.resolveComplaint(id, dto);
        setComplaints((current) =>
          current.map((complaint) =>
            complaint.id === id ? resolved : complaint,
          ),
        );
        return resolved;
      } catch (cause) {
        throw toError(cause, "Failed to resolve the complaint.");
      }
    },
    [],
  );

  return {
    complaints,
    totalCount,
    loading,
    error,
    fetchComplaints,
    fetchComplaintById,
    resolveComplaint,
  };
}
