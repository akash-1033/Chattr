import { create } from "zustand";
import { persist } from "zustand/middleware";
import { graphqlClient } from "../lib/graphqlClient";
import { getSocket, initSocket } from "../lib/socket";
import {GET_CONVERSATION} from "../graphql/userQueries";

export const useChatStore = create(
    persist(
      (set, get) => ({
        conversations: {},
        activeConversationId: null,
        loading: false,
  
        initSocketConnection: () => {
          const s = initSocket();
          s.on("message:receive", (msg) => {
            const convId = msg.conversationId;
            const conv = get().conversations[convId] || { id: convId, messages: [] };
            set((state) => ({
              conversations: {
                ...state.conversations,
                [convId]: {
                  ...conv,
                  messages: [...(conv.messages || []), msg],
                },
              },
            }));
          });
  
          s.on("typing", ({ from, isTyping, conversationId }) => {
            set((state) => ({
              conversations: {
                ...state.conversations,
                [conversationId]: {
                  ...(state.conversations[conversationId] || {}),
                  isTypingFrom: isTyping ? from : null,
                },
              },
            }));
          });
  
          s.on("message:read", ({ messageId, by }) => {
            const convs = { ...get().conversations };
            Object.values(convs).forEach((conv) => {
              conv.messages = conv.messages.map(m => m.id === messageId ? { ...m, read: true } : m);
            });
            set({ conversations: convs });
          });
        },
  
        fetchConversation: async (conversationId) => {
          set({ loading: true });
          try {
            const data = await graphqlClient.request(GET_CONVERSATION, { conversationId });
            const conv = data.getConversationById;
            set((state) => ({
              conversations: { ...state.conversations, [conv.id]: conv },
              activeConversationId: conv.id,
              loading: false,
            }));
            const s = getSocket();
            s.emit("joinConversation", { conversationId: conv.id });
          } catch (err) {
            console.error("fetchConversation error:", err);
            set({ loading: false });
          }
        },
  
        sendMessageViaSocket: (conversationId, toUserId, content, attachment = null, cb) => {
          const s = getSocket();
          const payload = { toUserId, content, attachment };
          s.emit("sendMessage", { payload }, (ack) => {
            if (ack?.ok) {
              set((state) => {
                const conv = state.conversations[conversationId] || { id: conversationId, messages: [] };
                return {
                  conversations: {
                    ...state.conversations,
                    [conversationId]: {
                      ...conv,
                      messages: [...(conv.messages || []), ack.message],
                    },
                  },
                };
              });
            } else {
              console.warn("sendMessage failed ack:", ack);
            }
            if (typeof cb === "function") cb(ack);
          });
        },
  
        setActiveConversation: (id) => set({ activeConversationId: id }),
      }),
      { name: "chattr-chat" }
    )
  );