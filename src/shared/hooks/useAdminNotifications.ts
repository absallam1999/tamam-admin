import { useCallback } from "react";
import { adminApi } from "@config/admin.api";
import type {
  BulkSendNotificationDto,
  BulkSendResultDto,
} from "@shared/types";

export type BroadcastNotificationDto = BulkSendNotificationDto;

type BroadcastTarget = "Customer" | "Driver" | "Store" | "Supervisor" | "All";

function withRecipientType(
  dto: BulkSendNotificationDto,
  recipientType: BroadcastTarget,
): BulkSendNotificationDto {
  return {
    ...dto,
    recipientType,
  };
}

export function useAdminNotifications() {
  const broadcast = useCallback(
    (dto: BulkSendNotificationDto, recipientType: BroadcastTarget): Promise<BulkSendResultDto> =>
      adminApi.sendBulkNotification(withRecipientType(dto, recipientType)),
    [],
  );

  const broadcastToCustomers = useCallback(
    (dto: BulkSendNotificationDto) => broadcast(dto, "Customer"),
    [broadcast],
  );

  const broadcastToDrivers = useCallback(
    (dto: BulkSendNotificationDto) => broadcast(dto, "Driver"),
    [broadcast],
  );

  const broadcastToStores = useCallback(
    (dto: BulkSendNotificationDto) => broadcast(dto, "Store"),
    [broadcast],
  );

  const broadcastToAll = useCallback(
    (dto: BulkSendNotificationDto) => broadcast(dto, "All"),
    [broadcast],
  );

  const broadcastToSupervisors = useCallback(
    (dto: BulkSendNotificationDto) => broadcast(dto, "Supervisor"),
    [broadcast],
  );

  return {
    broadcastToCustomers,
    broadcastToDrivers,
    broadcastToStores,
    broadcastToAll,
    broadcastToSupervisors,
  };
}
