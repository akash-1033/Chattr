import React, { useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const scrollEnd = useRef();
  const [msg, setMsg] = useState("");

  const { user } = useAuthStore();

  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const fetchConversation = useChatStore((s) => s.fetchConversation);
  const fetchOrCreateConversationWith = useChatStore(
    (s) => s.fetchOrCreateConversationWith
  );
  const sendMessageViaSocket = useChatStore((s) => s.sendMessageViaSocket);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const hydrated = useChatStore.persist.hasHydrated();

  useEffect(() => {
    if (!hydrated) return;

    (async () => {
      if (selectedUser?.conversationId) {
        const convId = selectedUser.conversationId;
        setActiveConversation(convId);

        const existing = useChatStore.getState().conversations[convId];
        if (!existing) {
          await fetchConversation(convId);
        }
        return;
      }

      if (selectedUser?.id) {
        const convId = await fetchOrCreateConversationWith(selectedUser.id);
        if (convId) {
          setActiveConversation(convId);
          await fetchConversation(convId);
        }
      }
    })();
  }, [selectedUser, hydrated]);

  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, activeConversationId]);

  const activeConv = conversations[activeConversationId];
  const messages = activeConv?.messages || [];

  const handleSend = () => {
    if (!msg.trim()) return;
    const convId = activeConversationId || selectedUser?.conversationId || null;
    if (!msg || !selectedUser?.id) return;
    sendMessageViaSocket(convId, selectedUser.id, msg);
    setMsg("");
  };

  return selectedUser ? (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePicUrl}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="max-md:hidden w-7 cursor-pointer"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden w-5" />
      </div>

      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No messages yet — start the conversation!
          </p>
        ) : (
          messages.map((m) => {
            const isSender = user?.id && m.senderId === user.id;
            return (
              <div
                key={`${m.id}-${m.createdAt || ""}`}
                className={`flex items-end gap-2 mb-4 ${
                  isSender ? "justify-end" : "justify-start"
                }`}
              >
                {/* Show profile on LEFT for receiver messages */}
                {!isSender && (
                  <div className="text-center text-xs flex flex-col items-center gap-1">
                    <img
                      src={selectedUser.profilePicUrl || assets.profile_martin}
                      alt=""
                      className="w-6 rounded-full"
                    />
                    <p className="text-gray-400">
                      {formatMessageTime(m.createdAt)}
                    </p>
                  </div>
                )}
          
                {/* Message bubble */}
                {m.image ? (
                  <img
                    src={m.image}
                    alt=""
                    className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden"
                  />
                ) : (
                  <p
                    className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg break-all text-white ${
                      isSender
                        ? "bg-violet-500/30 rounded-br-none"
                        : "bg-gray-700/50 rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </p>
                )}
          
                {/* Show profile on RIGHT for sender messages */}
                {isSender && (
                  <div className="text-center text-xs flex flex-col items-center gap-1">
                    <img
                      src={user.profilePicUrl}
                      alt=""
                      className="w-6 rounded-full"
                    />
                    <p className="text-gray-400">
                      {formatMessageTime(m.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={scrollEnd}></div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input type="file" id="image" accept="image/png, image/jpeg" hidden />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              className="w-5 mr-2 cursor-pointer"
              alt=""
            />
          </label>
        </div>
        <img
          onClick={handleSend}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} alt="" className="max-w-16" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
