import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { initSocket, closeSocket } from "./lib/socket";
import { useAuthStore } from "./store/authStore";
import { useChatStore } from "./store/chatStore";

const App = () => {
  const { user } = useAuthStore();

  // initialise socket
  useEffect(() => {
    if (user) {
      const socket = initSocket();
      useChatStore.getState().initSocketConnection();
      socket.on("update_online_users", (userIds) => {
        useAuthStore.getState().setOnlineUsers(userIds);
      });

      return () => {
        socket.off("update_online_users");
        closeSocket();
      };
    } else {
      closeSocket();
    }
  }, [user?.id]);

  return (
    <div className="bg-[url('./assets/bgImage.svg')] bg-contain">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
};

export default App;
