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

  useEffect(() => {
    if (user) {
      initSocket();
      useChatStore.getState().initSocketConnection();
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
