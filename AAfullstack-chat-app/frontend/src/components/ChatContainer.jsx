import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { File } from "lucide-react";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        subscribeToMessages,
        unsubscribeFromMessages,
    } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        getMessages(selectedUser._id);
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const renderFile = (file, fileName) => {
        if (!file) return null;

        const fileExtension = fileName?.split(".").pop()?.toLowerCase();
        const isImage = ["jpg", "jpeg", "png"].includes(fileExtension);

        if (isImage) {
            const imageUrl = file.replace('/auto/upload/', '/image/upload/'); // Đảm bảo đúng định dạng URL của Cloudinary
            return (
                <div className="relative">
                    <img
                        src={imageUrl}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                        onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block";
                        }}
                        onLoad={(e) => {
                            e.target.style.display = "block";
                            e.target.nextSibling.style.display = "none";
                        }}
                    />
                    <p
                        className="text-sm text-red-500 hidden"
                        style={{ display: "none" }}
                    >
                        Không thể tải ảnh
                    </p>
                </div>
            );
        }

        return (
            <a
                href={file}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-base-200 rounded-md mb-2"
            >
                <File size={20} />
                <span className="text-sm">{fileName || "Download File"}</span>
            </a>
        );
    };

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={message._id || index}
                        className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                        ref={index === messages.length - 1 ? messageEndRef : null}
                    >
                        <div className="chat-image avatar">
                            <div className="size-10 rounded-full border">
                                <img
                                    src={
                                        message.senderId === authUser._id
                                            ? authUser.profilePic || "/avatar.png"
                                            : selectedUser.profilePic || "/avatar.png"
                                    }
                                    alt="profile pic"
                                />
                            </div>
                        </div>
                        <div className="chat-header mb-1">
                            <time className="text-xs opacity-50 ml-1">
                                {formatMessageTime(message.createdAt)}
                            </time>
                        </div>
                        <div className="chat-bubble flex flex-col">
                            {message.file && renderFile(message.file, message.fileName)}
                            {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
            </div>
            <MessageInput />
        </div>
    );
};

export default ChatContainer;