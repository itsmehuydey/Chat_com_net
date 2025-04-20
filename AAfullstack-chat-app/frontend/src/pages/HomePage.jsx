import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import CreateGroupModal from "../components/CreateGroupModal";
import ChatbotInterface from "../components/ChatbotInterface.jsx";
import { Bot, Users2, Video } from "lucide-react";

const HomePage = () => {
    const { selectedUser, selectedGroup, startLivestream } = useChatStore();
    const { authUser } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [livestreamUrl, setLivestreamUrl] = useState(null);
    const [showChatbot, setShowChatbot] = useState(false);

    const handleStartLive = async () => {
        if (!authUser) {
            console.error("User not logged in. Cannot start livestream.");
            return;
        }

        try {
            const streamId = Date.now().toString();
            await startLivestream(streamId);
            const url = `/livestream/${streamId}`;
            setLivestreamUrl(url);
            setTimeout(() => {
                document.getElementById("livestream-link")?.click();
            }, 0);
        } catch (error) {
            console.error("Error starting livestream:", error);
        }
    };

    const toggleChatbot = () => {
        setShowChatbot((prev) => !prev);
    };

    return (
        <div className="h-screen bg-base-200">
            <div className="flex items-center justify-center pt-20 px-4">
                <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)] flex">
                    <Sidebar />
                    <div className="flex-1 flex flex-col">
                        <div className="p-3 border-b border-base-300 flex justify-end gap-2">
                            <button
                                onClick={handleStartLive}
                                className="btn btn-sm btn-success flex items-center gap-2"
                            >
                                <Video size={16} />
                                <span className="hidden lg:block">Live</span>
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn btn-sm btn-primary flex items-center gap-2"
                            >
                                <Users2 size={16} />
                                <span className="hidden lg:block">Tạo Nhóm</span>
                            </button>
                            <button
                                onClick={toggleChatbot}
                                className="btn btn-sm btn-info flex items-center gap-2"
                            >
                                <Bot size={16} />
                                <span className="hidden lg:block">AI Chat</span>
                            </button>
                        </div>
                        {selectedUser || selectedGroup ? <ChatContainer /> : <NoChatSelected />}
                    </div>
                </div>
            </div>
            <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            {livestreamUrl && (
                <a
                    id="livestream-link"
                    href={livestreamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "none" }}
                >
                    Open Livestream
                </a>
            )}
            {showChatbot && <ChatbotInterface onClose={toggleChatbot} />}
        </div>
    );
};

export default HomePage;