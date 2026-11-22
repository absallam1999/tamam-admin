import { useCallback, useState } from "react";
import { adminApi } from "@config/admin.api";
import type {
  BonusStatusDto,
  BonusTierDto,
  CreateBonusTierDto,
  CreatePaymentNumberDto,
  FinancialSummaryDto,
  FinancialTransactionDto,
  FinanceQueryParams,
  PaymentConfirmationDto,
  PaymentConfirmationQueryParams,
  PaymentNumberDto,
  PagedResult,
  PayoutDto,
  PlatformSettingsDto,
  PlatformWalletDto,
  ProcessPaymentConfirmationDto,
  ProcessWithdrawalDto,
  RejectConfirmationRequest,
  RejectWithdrawalRequest,
  UpdateBonusTierDto,
  UpdatePaymentNumberDto,
  WalletStatsDto,
  WithdrawalDto,
} from "@shared/types";

export type Withdrawal = WithdrawalDto;
export type PaymentConfirmation = PaymentConfirmationDto;

export interface UseAdminWalletsResult {
  // Withdrawals
  withdrawals: WithdrawalDto[];
  withdrawalsTotalCount: number;
  fetchWithdrawals: (
    statusOrParams?: string | { status?: string; pageIndex?: number; pageSize?: number },
  ) => Promise<PagedResult<WithdrawalDto>>;
  processWithdrawal: (
    withdrawalId: string,
    dto?: ProcessWithdrawalDto,
  ) => Promise<WithdrawalDto>;
  approveWithdrawal: (
    withdrawalId: string,
    dto?: ProcessWithdrawalDto,
  ) => Promise<WithdrawalDto>;
  rejectWithdrawal: (
    withdrawalId: string,
    dto?: RejectWithdrawalRequest,
  ) => Promise<WithdrawalDto>;

  // Deposits / payment confirmations
  confirmations: PaymentConfirmationDto[];
  confirmationsTotalCount: number;
  fetchPaymentConfirmations: (
    params?: PaymentConfirmationQueryParams,
  ) => Promise<PagedResult<PaymentConfirmationDto>>;
  fetchPaymentConfirmationById: (id: string) => Promise<PaymentConfirmationDto>;
  verifyPayment: (
    id: string,
    dto?: ProcessPaymentConfirmationDto,
  ) => Promise<PaymentConfirmationDto>;
  rejectPayment: (
    id: string,
    dto?: RejectConfirmationRequest,
  ) => Promise<PaymentConfirmationDto>;

  // Finance and payouts
  financialSummary: FinancialSummaryDto | null;
  fetchFinancialSummary: (from?: string, to?: string) => Promise<FinancialSummaryDto>;
  transactions: FinancialTransactionDto[];
  transactionsTotalCount: number;
  fetchTransactions: (
    params?: FinanceQueryParams,
  ) => Promise<PagedResult<FinancialTransactionDto>>;
  payouts: PayoutDto[];
  payoutsTotalCount: number;
  fetchPayouts: (
    pageIndex?: number,
    pageSize?: number,
  ) => Promise<PagedResult<PayoutDto>>;
  walletStats: WalletStatsDto | null;
  fetchWalletStats: () => Promise<WalletStatsDto>;
  platformWallet: PlatformWalletDto | null;
  fetchPlatformWallet: () => Promise<PlatformWalletDto>;

  // Payment numbers
  paymentNumbers: PaymentNumberDto[];
  fetchPaymentNumbers: (isActive?: boolean) => Promise<PaymentNumberDto[]>;
  fetchPaymentNumberById: (id: string) => Promise<PaymentNumberDto>;
  createPaymentNumber: (dto: CreatePaymentNumberDto) => Promise<PaymentNumberDto>;
  updatePaymentNumber: (
    id: string,
    dto: UpdatePaymentNumberDto,
  ) => Promise<PaymentNumberDto>;
  deletePaymentNumber: (id: string) => Promise<void>;

  // Bonus system
  bonusStatus: BonusStatusDto | null;
  fetchBonusStatus: () => Promise<BonusStatusDto>;
  enableBonus: () => Promise<unknown>;
  disableBonus: () => Promise<unknown>;
  bonusTiers: BonusTierDto[];
  fetchBonusTiers: (isActive?: boolean) => Promise<BonusTierDto[]>;
  fetchBonusTierById: (id: string) => Promise<BonusTierDto>;
  createBonusTier: (dto: CreateBonusTierDto) => Promise<BonusTierDto>;
  updateBonusTier: (id: string, dto: UpdateBonusTierDto) => Promise<BonusTierDto>;
  deleteBonusTier: (id: string) => Promise<void>;
  toggleBonusTier: (id: string) => Promise<unknown>;

  // Platform settings
  settings: PlatformSettingsDto | null;
  fetchSettings: () => Promise<PlatformSettingsDto>;
  updateSettings: (dto: PlatformSettingsDto) => Promise<PlatformSettingsDto>;

  // Shared request state
  loading: boolean;
  error: Error | null;
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
 * Consolidated Admin finance/wallet hook.
 *
 * Covers the current Finance, Payments, payment-number, Bonus, and Settings
 * endpoints through the centralized adminApi service.
 */
export function useAdminWallets(): UseAdminWalletsResult {
  const [withdrawals, setWithdrawals] = useState<WithdrawalDto[]>([]);
  const [withdrawalsTotalCount, setWithdrawalsTotalCount] = useState(0);
  const [confirmations, setConfirmations] = useState<PaymentConfirmationDto[]>([]);
  const [confirmationsTotalCount, setConfirmationsTotalCount] = useState(0);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryDto | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransactionDto[]>([]);
  const [transactionsTotalCount, setTransactionsTotalCount] = useState(0);
  const [payouts, setPayouts] = useState<PayoutDto[]>([]);
  const [payoutsTotalCount, setPayoutsTotalCount] = useState(0);
  const [walletStats, setWalletStats] = useState<WalletStatsDto | null>(null);
  const [platformWallet, setPlatformWallet] = useState<PlatformWalletDto | null>(null);
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumberDto[]>([]);
  const [bonusStatus, setBonusStatus] = useState<BonusStatusDto | null>(null);
  const [bonusTiers, setBonusTiers] = useState<BonusTierDto[]>([]);
  const [settings, setSettings] = useState<PlatformSettingsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async <T,>(operation: () => Promise<T>, fallback: string): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const nextError = toError(cause, fallback);
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Finance / withdrawals
  // ---------------------------------------------------------------------------

  const fetchWithdrawals = useCallback(
    (statusOrParams?: string | { status?: string; pageIndex?: number; pageSize?: number }) =>
      run(async () => {
        const params =
          typeof statusOrParams === "string"
            ? { status: statusOrParams }
            : statusOrParams;
        const result = await adminApi.getWithdrawals(params);
        setWithdrawals(result.items ?? []);
        setWithdrawalsTotalCount(result.totalCount);
        return result;
      }, "Failed to load withdrawals."),
    [run],
  );

  const processWithdrawal = useCallback(
    (withdrawalId: string, dto: ProcessWithdrawalDto = {}) =>
      run(async () => {
        const updated = await adminApi.processWithdrawal(withdrawalId, dto);
        setWithdrawals((current) =>
          current.map((withdrawal) =>
            withdrawal.id === withdrawalId ? updated : withdrawal,
          ),
        );
        return updated;
      }, "Failed to process the withdrawal."),
    [run],
  );

  const approveWithdrawal = processWithdrawal;

  const rejectWithdrawal = useCallback(
    (withdrawalId: string, dto: RejectWithdrawalRequest = {}) =>
      run(async () => {
        const updated = await adminApi.rejectWithdrawal(withdrawalId, dto);
        setWithdrawals((current) =>
          current.map((withdrawal) =>
            withdrawal.id === withdrawalId ? updated : withdrawal,
          ),
        );
        return updated;
      }, "Failed to reject the withdrawal."),
    [run],
  );

  // ---------------------------------------------------------------------------
  // Deposits / payment confirmations
  // ---------------------------------------------------------------------------

  const fetchPaymentConfirmations = useCallback(
    (params?: PaymentConfirmationQueryParams) =>
      run(async () => {
        const result = await adminApi.getPaymentConfirmations(params);
        setConfirmations(result.items ?? []);
        setConfirmationsTotalCount(result.totalCount);
        return result;
      }, "Failed to load payment confirmations."),
    [run],
  );

  const fetchPaymentConfirmationById = useCallback(
    (id: string) =>
      run(
        () => adminApi.getPaymentConfirmation(id),
        "Failed to load the payment confirmation.",
      ),
    [run],
  );

  const verifyPayment = useCallback(
    (id: string, dto: ProcessPaymentConfirmationDto = {}) =>
      run(async () => {
        const updated = await adminApi.verifyPaymentConfirmation(id, dto);
        setConfirmations((current) =>
          current.map((confirmation) =>
            confirmation.id === id ? updated : confirmation,
          ),
        );
        return updated;
      }, "Failed to verify the payment confirmation."),
    [run],
  );

  const rejectPayment = useCallback(
    (id: string, dto: RejectConfirmationRequest = {}) =>
      run(async () => {
        const updated = await adminApi.rejectPaymentConfirmation(id, dto);
        setConfirmations((current) =>
          current.map((confirmation) =>
            confirmation.id === id ? updated : confirmation,
          ),
        );
        return updated;
      }, "Failed to reject the payment confirmation."),
    [run],
  );

  // ---------------------------------------------------------------------------
  // Finance summary, transactions, payouts, wallets
  // ---------------------------------------------------------------------------

  const fetchFinancialSummary = useCallback(
    (from?: string, to?: string) =>
      run(async () => {
        const result = await adminApi.getFinancialSummary(from, to);
        setFinancialSummary(result);
        return result;
      }, "Failed to load the financial summary."),
    [run],
  );

  const fetchTransactions = useCallback(
    (params?: FinanceQueryParams) =>
      run(async () => {
        const result = await adminApi.getFinancialTransactions(params);
        setTransactions(result.items ?? []);
        setTransactionsTotalCount(result.totalCount);
        return result;
      }, "Failed to load financial transactions."),
    [run],
  );

  const fetchPayouts = useCallback(
    (pageIndex?: number, pageSize?: number) =>
      run(async () => {
        const result = await adminApi.getPayouts(pageIndex, pageSize);
        setPayouts(result.items ?? []);
        setPayoutsTotalCount(result.totalCount);
        return result;
      }, "Failed to load payouts."),
    [run],
  );

  const fetchWalletStats = useCallback(
    () =>
      run(async () => {
        const result = await adminApi.getWalletStats();
        setWalletStats(result);
        return result;
      }, "Failed to load wallet statistics."),
    [run],
  );

  const fetchPlatformWallet = useCallback(
    () =>
      run(async () => {
        const result = await adminApi.getPlatformWallet();
        setPlatformWallet(result);
        return result;
      }, "Failed to load the platform wallet."),
    [run],
  );

  // ---------------------------------------------------------------------------
  // Payment numbers
  // ---------------------------------------------------------------------------

  const fetchPaymentNumbers = useCallback(
    (isActive?: boolean) =>
      run(async () => {
        const result = await adminApi.getPaymentNumbers(isActive);
        setPaymentNumbers(result);
        return result;
      }, "Failed to load payment numbers."),
    [run],
  );

  const fetchPaymentNumberById = useCallback(
    (id: string) =>
      run(
        () => adminApi.getPaymentNumber(id),
        "Failed to load the payment number.",
      ),
    [run],
  );

  const createPaymentNumber = useCallback(
    (dto: CreatePaymentNumberDto) =>
      run(async () => {
        const created = await adminApi.createPaymentNumber(dto);
        setPaymentNumbers((current) => [created, ...current]);
        return created;
      }, "Failed to create the payment number."),
    [run],
  );

  const updatePaymentNumber = useCallback(
    (id: string, dto: UpdatePaymentNumberDto) =>
      run(async () => {
        const updated = await adminApi.updatePaymentNumber(id, dto);
        setPaymentNumbers((current) =>
          current.map((paymentNumber) =>
            paymentNumber.id === id ? updated : paymentNumber,
          ),
        );
        return updated;
      }, "Failed to update the payment number."),
    [run],
  );

  const deletePaymentNumber = useCallback(
    (id: string) =>
      run(async () => {
        await adminApi.deletePaymentNumber(id);
        setPaymentNumbers((current) =>
          current.filter((paymentNumber) => paymentNumber.id !== id),
        );
      }, "Failed to delete the payment number."),
    [run],
  );

  // ---------------------------------------------------------------------------
  // Bonus system
  // ---------------------------------------------------------------------------

  const fetchBonusStatus = useCallback(
    () =>
      run(async () => {
        const result = await adminApi.getBonusStatus();
        setBonusStatus(result);
        if (result?.tiers) setBonusTiers(result.tiers);
        return result;
      }, "Failed to load bonus status."),
    [run],
  );

  const enableBonus = useCallback(
    () =>
      run(async () => {
        const result = await adminApi.enableBonus();
        setBonusStatus((current) =>
          current ? { ...current, isEnabled: true } : current,
        );
        return result;
      }, "Failed to enable the bonus system."),
    [run],
  );

  const disableBonus = useCallback(
    () =>
      run(async () => {
        const result = await adminApi.disableBonus();
        setBonusStatus((current) =>
          current ? { ...current, isEnabled: false } : current,
        );
        return result;
      }, "Failed to disable the bonus system."),
    [run],
  );

  const fetchBonusTiers = useCallback(
    (isActive?: boolean) =>
      run(async () => {
        const result = await adminApi.getBonusTiers(isActive);
        setBonusTiers(result);
        return result;
      }, "Failed to load bonus tiers."),
    [run],
  );

  const fetchBonusTierById = useCallback(
    (id: string) =>
      run(
        () => adminApi.getBonusTier(id),
        "Failed to load the bonus tier.",
      ),
    [run],
  );

  const createBonusTier = useCallback(
    (dto: CreateBonusTierDto) =>
      run(async () => {
        const created = await adminApi.createBonusTier(dto);
        setBonusTiers((current) => [created, ...current]);
        return created;
      }, "Failed to create the bonus tier."),
    [run],
  );

  const updateBonusTier = useCallback(
    (id: string, dto: UpdateBonusTierDto) =>
      run(async () => {
        const updated = await adminApi.updateBonusTier(id, dto);
        setBonusTiers((current) =>
          current.map((tier) => (tier.id === id ? updated : tier)),
        );
        return updated;
      }, "Failed to update the bonus tier."),
    [run],
  );

  const deleteBonusTier = useCallback(
    (id: string) =>
      run(async () => {
        await adminApi.deleteBonusTier(id);
        setBonusTiers((current) => current.filter((tier) => tier.id !== id));
      }, "Failed to delete the bonus tier."),
    [run],
  );

  const toggleBonusTier = useCallback(
    (id: string) =>
      run(async () => {
        const result = await adminApi.toggleBonusTier(id);
        await fetchBonusTiers();
        return result;
      }, "Failed to toggle the bonus tier."),
    [fetchBonusTiers, run],
  );

  // ---------------------------------------------------------------------------
  // Platform settings
  // ---------------------------------------------------------------------------

  const fetchSettings = useCallback(
    () =>
      run(async () => {
        const result = await adminApi.getSettings();
        setSettings(result);
        return result;
      }, "Failed to load platform settings."),
    [run],
  );

  const updateSettings = useCallback(
    (dto: PlatformSettingsDto) =>
      run(async () => {
        const updated = await adminApi.updateSettings(dto);
        setSettings(updated);
        return updated;
      }, "Failed to update platform settings."),
    [run],
  );

  return {
    withdrawals,
    withdrawalsTotalCount,
    fetchWithdrawals,
    processWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    confirmations,
    confirmationsTotalCount,
    fetchPaymentConfirmations,
    fetchPaymentConfirmationById,
    verifyPayment,
    rejectPayment,
    financialSummary,
    fetchFinancialSummary,
    transactions,
    transactionsTotalCount,
    fetchTransactions,
    payouts,
    payoutsTotalCount,
    fetchPayouts,
    walletStats,
    fetchWalletStats,
    platformWallet,
    fetchPlatformWallet,
    paymentNumbers,
    fetchPaymentNumbers,
    fetchPaymentNumberById,
    createPaymentNumber,
    updatePaymentNumber,
    deletePaymentNumber,
    bonusStatus,
    fetchBonusStatus,
    enableBonus,
    disableBonus,
    bonusTiers,
    fetchBonusTiers,
    fetchBonusTierById,
    createBonusTier,
    updateBonusTier,
    deleteBonusTier,
    toggleBonusTier,
    settings,
    fetchSettings,
    updateSettings,
    loading,
    error,
  };
}
