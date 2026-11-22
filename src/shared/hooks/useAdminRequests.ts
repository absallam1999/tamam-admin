import { useState, useCallback } from "react";

import { adminApi } from "@/config/admin.api";

import type {
  RequestDto,
  RequestQueryParams,
  RejectRequestDto,
} from "@shared/types";

export function useAdminRequests() {
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(
    async (params?: RequestQueryParams) => {
      setLoading(true);

      try {
        const result = await adminApi.getRequests(params);

        setRequests(result.items ?? []);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPendingRequests = useCallback(
    async (pageIndex = 1, pageSize = 20) => {
      setLoading(true);

      try {
        const result = await adminApi.getPendingRequests(
          pageIndex,
          pageSize,
        );

        setRequests(result.items ?? []);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchRequestById = useCallback(
    async (id: string): Promise<RequestDto> => {
      return adminApi.getRequest(id);
    },
    [],
  );

  const approveRequest = useCallback(
    async (id: string): Promise<RequestDto> => {
      return adminApi.approveRequest(id);
    },
    [],
  );

  const rejectRequest = useCallback(
    async (
      id: string,
      dto: RejectRequestDto,
    ): Promise<RequestDto> => {
      return adminApi.rejectRequest(id, dto);
    },
    [],
  );

  return {
    requests,
    loading,

    fetchRequests,
    fetchPendingRequests,
    fetchRequestById,

    approveRequest,
    rejectRequest,
  };
}