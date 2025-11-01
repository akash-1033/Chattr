import React, { useMemo } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import assets from "../assets/assets";
import { closeSocket } from "../lib/socket";

const RightSidebar = ({ selectedUser }) => {
  const { logout, onlineUsers } = useAuthStore();
  const { conversations, activeConversationId } = useChatStore();
  const navigate = useNavigate();

  const isUserOnline = (id) => {
    return onlineUsers?.includes(id) || false;
  };

  const mediaImages = useMemo(() => {
    if (!activeConversationId) return [];
    const conv = conversations[activeConversationId];
    if (!conv || !conv.messages) return [];

    return conv.messages
      .filter((m) => m.imageUrl || m.attachment)
      .map((m) => m.imageUrl || m.attachment);
  }, [conversations, activeConversationId]);

  if (!selectedUser) return null;

  return (
    <div
      className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      {/* --- USER INFO --- */}
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        <img
          src={selectedUser?.profilePicUrl || assets.avatar_icon}
          alt=""
          className="w-20 aspect-[1/1] rounded-full"
        />
        <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
          {isUserOnline(selectedUser.id) && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}
          {selectedUser.fullName}
        </h1>
        <p className="px-10 mx-auto">{selectedUser.bio}</p>
      </div>

      <hr className="border-[#ffffff50] my-4" />

      {/* --- MEDIA --- */}
      <div className="px-5 text-xs">
        <p>Media</p>
        {mediaImages.length > 0 ? (
          <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
            {mediaImages.map((url, index) => (
              <div
                key={index}
                onClick={() => window.open(url)}
                className="cursor-pointer rounded"
              >
                <img src={url} alt="" className="h-full rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#aaa] text-center py-6 text-sm">No media yet.</p>
        )}
      </div>

      {/* --- LOGOUT --- */}
      <button
        onClick={() => {
          logout();
          closeSocket();
          localStorage.clear();
          toast.success("Logged out successfully");
          setTimeout(() => navigate("/login"), 1000);
        }}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none 
        text-sm font-light py-2 px-20 rounded-full cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
