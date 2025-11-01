import { io } from "socket.io-client";
import { useChatStore } from "../store/chatStore";

const API_URL = import.meta.env.VITE_API_URL;

let socket = null;

export function initSocket() {
  if (socket && socket.connected) return socket;
  if (socket && !socket.connected) return socket;

  socket = io(API_URL, {
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  // setupPresenceListeners(socket);

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.once("connect", () => {
    const { activeConversationId } = useChatStore.getState();
    if (activeConversationId) {
      socket.emit("joinConversation", { conversationId: activeConversationId });
    }
  });

  socket.on("disconnect", (reason) => {
    console.error("Socket disconnected:", reason);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export const closeSocket = () => {
  if (socket) {
    try {
      socket.disconnect();
    } catch (e) {
      console.error("Error closing socket:", e);
    }
  }
  socket = null;
};
