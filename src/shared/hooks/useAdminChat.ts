import { useState, useCallback } from "react";

import { adminApi } from "@/config/admin.api";

import type {
  ConversationListItemDto,
  ConversationDto,
  MessageDto,
  SendMessageDto,
  ChatQueryParams,
  ChatMessagesQueryParams,
  AssignConversationDto,
  CloseConversationDto,
} from "@shared/types";

export function useAdminChat() {
  const [conversations, setConversations] = useState<ConversationListItemDto[]>([]);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(
    async (params?: ChatQueryParams) => {
      setLoading(true);

      try {
        const result = await adminApi.getConversations(params);

        setConversations(result.items ?? []);

        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchUnreadConversations = useCallback(async () => {
    setLoading(true);

    try {
      const result = await adminApi.getConversations({
        OnlyUnread: true,
      });

      return result.items ?? [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnassignedConversations = useCallback(async () => {
    setLoading(true);

    try {
      const result = await adminApi.getConversations({
        UnassignedOnly: true,
      });

      return result.items ?? [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversation = useCallback(
    async (conversationId: string): Promise<ConversationDto> => {
      return adminApi.getConversation(conversationId);
    },
    [],
  );

  const fetchMessages = useCallback(
    async (
      conversationId: string,
      params?: ChatMessagesQueryParams,
    ) => {
      const result = await adminApi.getConversationMessages(
        conversationId,
        params,
      );

      setMessages(result.items ?? []);

      return result;
    },
    [],
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      dto: SendMessageDto,
    ): Promise<MessageDto> => {
      return adminApi.sendMessage(conversationId, dto);
    },
    [],
  );

  const assignConversation = useCallback(
    async (
      conversationId: string,
      dto: AssignConversationDto,
    ): Promise<void> => {
      await adminApi.assignConversation(conversationId, dto);
    },
    [],
  );

  const closeConversation = useCallback(
    async (
      conversationId: string,
      dto: CloseConversationDto,
    ): Promise<void> => {
      await adminApi.closeConversation(conversationId, dto);
    },
    [],
  );

  const markConversationRead = useCallback(
    async (conversationId: string): Promise<void> => {
      await adminApi.markConversationRead(conversationId);
    },
    [],
  );

  const getUnreadCount = useCallback(async () => {
    return adminApi.getChatUnreadCount();
  }, []);

  return {
    conversations,
    messages,
    loading,

    fetchConversations,
    fetchUnreadConversations,
    fetchUnassignedConversations,

    fetchConversation,
    fetchMessages,

    sendMessage,

    assignConversation,
    closeConversation,
    markConversationRead,

    getUnreadCount,
  };
}