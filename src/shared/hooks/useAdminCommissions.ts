import { useCallback, useState } from "react";
import { adminApi } from "@config/admin.api";
import type {
  FinancialSummaryDto,
  FinancialTransactionDto,
  FinanceQueryParams,
  PagedResult,
} from "@shared/types";

export type Commission = FinancialTransactionDto;
export type CommissionSummary = FinancialSummaryDto;

export interface UseAdminCommissionsResult {
  commissions: FinancialTransactionDto[];
  summary: FinancialSummaryDto | null;
  totalCount: number;
  loading: boolean;
  error: Error | null;
  fetchCommissions: (
    params?: FinanceQueryParams,
  ) => Promise<PagedResult<FinancialTransactionDto>>;
  fetchSummary: (from?: string, to?: string) => Promise<FinancialSummaryDto>;
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
 * Admin commission/finance hook.
 *
 * The old ADMIN_COMMISSIONS and ADMIN_COMMISSIONS_SUMMARY endpoints are not
 * part of the current contract. Commission data is now provided by:
 * - GET /api/admin/finance/transactions
 * - GET /api/admin/finance/summary
 */
export function useAdminCommissions(): UseAdminCommissionsResult {
  const [commissions, setCommissions] = useState<FinancialTransactionDto[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCommissions = useCallback(
    async (params?: FinanceQueryParams): Promise<PagedResult<FinancialTransactionDto>> => {
      setLoading(true);
      setError(null);
      try {
        const result = await adminApi.getFinancialTransactions(params);
        setCommissions(result.items ?? []);
        setTotalCount(result.totalCount);
        return result;
      } catch (cause) {
        const nextError = toError(cause, "Failed to load financial transactions.");
        setError(nextError);
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchSummary = useCallback(
    async (from?: string, to?: string): Promise<FinancialSummaryDto> => {
      try {
        const result = await adminApi.getFinancialSummary(from, to);
        setSummary(result);
        return result;
      } catch (cause) {
        const nextError = toError(cause, "Failed to load the financial summary.");
        setError(nextError);
        throw nextError;
      }
    },
    [],
  );

  return {
    commissions,
    summary,
    totalCount,
    loading,
    error,
    fetchCommissions,
    fetchSummary,
  };
}
