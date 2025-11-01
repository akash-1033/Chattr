import React, { useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const scrollEnd = useRef();
  const fileInputRef = useRef(null);

  const [msg, setMsg] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { user } = useAuthStore();
  const hydrated = useChatStore.persist.hasHydrated();

  const {
    conversations,
    activeConversationId,
    fetchConversation,
    fetchOrCreateConversationWith,
    sendMessageViaSocket,
    setActiveConversation,
  } = useChatStore();

  const activeConv = conversations[activeConversationId];
  const messages = activeConv?.messages || [];

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

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
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConversationId]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!msg.trim() && !selectedImage) return;
    if (!selectedUser?.id) return;

    const convId = activeConversationId || selectedUser?.conversationId || null;

    let attachment = null;
    if (selectedImage) {
      const base64 = await toBase64(selectedImage);
      attachment = {
        fileBuffer: base64.split(",")[1],
        contentType: selectedImage.type,
        fileName: selectedImage.name,
      };
    }

    sendMessageViaSocket(convId, selectedUser.id, msg, attachment);

    setMsg("");
    clearImageSelection();
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} alt="" className="max-w-16" />
        <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePicUrl}
          alt={selectedUser.fullName}
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="Close"
          className="max-md:hidden w-7 cursor-pointer"
        />
        <img src={assets.help_icon} alt="Help" className="max-md:hidden w-5" />
      </div>

      <div className="flex flex-col h-[calc(100%-150px)] overflow-y-scroll p-3 pb-6">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No messages yet — start the conversation!
          </p>
        ) : (
          messages.map((m) => {
            const isSender = user?.id && m.senderId === user.id;
            const key = m.id || `${m.senderId}-${m.createdAt}`;

            return (
              <div
                key={key}
                className={`flex items-end gap-2 mb-4 ${
                  isSender ? "justify-end" : "justify-start"
                }`}
              >
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

                <div
                  className={`flex flex-col gap-2 max-w-[250px] ${
                    isSender ? "items-end" : "items-start"
                  }`}
                >
                  {m.imageUrl && (
                    <img
                      src={m.imageUrl}
                      alt="attachment"
                      className="rounded-lg border border-gray-700 max-w-full"
                    />
                  )}
                  {m.content && (
                    <p
                      className={`p-2 text-sm font-light rounded-lg break-all text-white ${
                        isSender
                          ? "bg-violet-500/30 rounded-br-none"
                          : "bg-gray-700/50 rounded-bl-none"
                      }`}
                    >
                      {m.content}
                    </p>
                  )}
                </div>

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
        <div ref={scrollEnd} />
      </div>

      {previewUrl && (
        <div className="absolute bottom-20 left-3 flex items-center gap-2 bg-gray-900/70 p-2 rounded-lg border border-gray-600">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              onClick={clearImageSelection}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-300">Ready to send</p>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Send a message..."
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent"
          />
          <input
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
            hidden
            onChange={handleImageSelect}
          />
          <label htmlFor="image" className="cursor-pointer">
            <img src={assets.gallery_icon} className="w-5 mr-2" alt="Attach" />
          </label>
        </div>
        <img
          onClick={handleSend}
          src={assets.send_button}
          alt="Send"
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ChatContainer;
