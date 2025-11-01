import { create } from "zustand";
import { persist } from "zustand/middleware";
import { graphqlClient } from "../lib/graphqlClient";
import { getSocket, initSocket } from "../lib/socket";
import {
  GET_CONVERSATION,
  GET_OR_CREATE_CONVERSATION_WITH,
} from "../graphql/userQueries";
import { useAuthStore } from "./authStore";

export const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,
      socketInitiated: false,
      loading: false,


      initSocketConnection: () => {
        const s = getSocket() || initSocket();
        if (!s) return;

        s.off("message:receive");
        s.on("message:receive", (msg) => {
          if (!msg || !msg.conversationId) return;

          const convId = msg.conversationId;
          const existing = get().conversations[convId] || {
            id: convId,
            messages: [],
          };

          const already = (existing.messages || []).some(
            (m) => m.id === msg.id
          );
          if (already) return;

          const filtered = (existing.messages || []).filter((m) => {
            if (!String(m.id).startsWith("temp-")) return true;
            return !(m.senderId === msg.senderId && m.content === msg.content);
          });

          const merged = [...filtered, msg].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );

          set((state) => ({
            conversations: {
              ...state.conversations,
              [convId]: { ...existing, messages: merged },
            },
          }));
        });

        set({ socketInitiated: true });
      },

      fetchConversation: async (conversationId) => {
        set({ loading: true });
        try {
          const data = await graphqlClient.request(GET_CONVERSATION, {
            conversationId,
          });
          const conv = data.getConversationById;

          set((state) => {
            const existing = (
              state.conversations[conv.id]?.messages || []
            ).filter((m) => !String(m.id).startsWith("temp-"));

            const mergedMap = new Map();
            existing.forEach((m) => mergedMap.set(m.id, m));
            (conv.messages || []).forEach((m) => mergedMap.set(m.id, m));

            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            return {
              conversations: {
                ...state.conversations,
                [conv.id]: { id: conv.id, messages: merged },
              },
              activeConversationId: conv.id,
              loading: false,
            };
          });
        } catch (err) {
          console.error("fetchConversation error:", err);
          set({ loading: false });
        }
      },

      fetchOrCreateConversationWith: async (otherUserId) => {
        set({ loading: true });
        try {
          const data = await graphqlClient.request(
            GET_OR_CREATE_CONVERSATION_WITH,
            { userId: otherUserId }
          );
          const conv = data.getOrCreateConversationWith;

          set((state) => {
            const existing = state.conversations[conv.id] || {
              id: conv.id,
              messages: [],
            };
            const mergedMap = new Map();
            (existing.messages || []).forEach((m) => mergedMap.set(m.id, m));
            (conv.messages || []).forEach((m) => mergedMap.set(m.id, m));
            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            return {
              conversations: {
                ...state.conversations,
                [conv.id]: { id: conv.id, messages: merged },
              },
              activeConversationId: conv.id,
              loading: false,
            };
          });

          const s = getSocket();
          if (s && conv?.id)
            s.emit("joinConversation", { conversationId: conv.id });
          return conv.id;
        } catch (err) {
          console.error("fetchOrCreateConversationWith error:", err);
          set({ loading: false });
          return null;
        }
      },

      setActiveConversation: (id) => {
        const s = getSocket();
        if (s && id) s.emit("joinConversation", { conversationId: id });
        set({ activeConversationId: id });
      },

      sendMessageViaSocket: (convId, toUserId, text, attachment = null) => {
        const s = getSocket();
        if (!s) return;

        const hasConv = !!convId;
        let tempMsg = null;

        if (!text?.trim() && !attachment) return;

        const isImageOnly = !text?.trim() && attachment?.fileBuffer;
        if (hasConv && !isImageOnly) {
          tempMsg = {
            id: "temp-" + Date.now(),
            senderId: useAuthStore.getState().user?.id,
            receiverId: toUserId,
            content: text,
            createdAt: new Date().toISOString(),
            conversationId: convId,
          };
          get().addMessageToConversation(convId, tempMsg);
        }

        const payload = {};
        if (text?.trim()) payload.content = text.trim();
        if (attachment && attachment.fileBuffer) {
          payload.attachment = attachment;
        }
        payload.toUserId = toUserId;
        s.emit("sendMessage", { payload }, (ack) => {
          if (!ack?.ok || !ack.message) {
            if (hasConv && tempMsg) {
              set((state) => ({
                conversations: {
                  ...state.conversations,
                  [convId]: {
                    ...state.conversations[convId],
                    messages: state.conversations[convId].messages.filter(
                      (m) => m.id !== tempMsg.id
                    ),
                  },
                },
              }));
            }
            return;
          }

          const serverMsg = ack.message;
          const newConvId = serverMsg.conversationId;

          set((state) => {
            const nextConvs = { ...state.conversations };

            // 🧩 FIX: Skip adding if we already have it from "message:receive"
            const already = (nextConvs[newConvId]?.messages || []).some(
              (m) => m.id === serverMsg.id
            );
            if (already) return state;

            if (hasConv && tempMsg) {
              const convMsgs = (
                state.conversations[convId]?.messages || []
              ).map((m) => (m.id === tempMsg.id ? serverMsg : m));
              nextConvs[convId] = {
                ...(state.conversations[convId] || { id: convId }),
                messages: convMsgs,
              };
              return { conversations: nextConvs };
            }

            nextConvs[newConvId] = {
              ...(state.conversations[newConvId] || { id: newConvId }),
              messages: [
                ...(state.conversations[newConvId]?.messages || []),
                serverMsg,
              ],
            };

            return {
              conversations: nextConvs,
              activeConversationId: newConvId,
            };
          });

          if (!hasConv) {
            s.emit("joinConversation", { conversationId: newConvId });
          }
        });
      },

      addMessageToConversation: (convId, message) =>
        set((state) => {
          const existing = state.conversations[convId] || {
            id: convId,
            messages: [],
          };
          const already = (existing.messages || []).some(
            (m) => m.id === message.id
          );
          if (already) return state;
          return {
            conversations: {
              ...state.conversations,
              [convId]: {
                ...existing,
                messages: [...(existing.messages || []), message],
              },
            },
          };
        }),
    }),
    { name: "chattr-chat" }
  )
);
