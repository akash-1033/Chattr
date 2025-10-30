import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

let socket;

export function initSocket() {
  if (socket) return socket;

  console.log(import.meta.env.VITE_API_URL);
  socket = io(API_URL, {
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  socket.on("connect_error", (err) => {
    console.log("Reason:", err.message);
    console.log("Details:", err);
  });

  socket.on("connect", () => {
    console.log("socket connected", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("socket disconnected", reason);
  });

  return socket;
}

export function getSocket() {
  if (!socket) return initSocket();
  return socket;
}

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
