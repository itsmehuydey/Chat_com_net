// import { useChatStore } from "../store/useChatStore";
//
// import Sidebar from "../components/Sidebar";
// import NoChatSelected from "../components/NoChatSelected";
// import ChatContainer from "../components/ChatContainer";
//
// const HomePage = () => {
//   const { selectedUser } = useChatStore();
//
//   return (
//     <div className="h-screen bg-base-200">
//       <div className="flex items-center justify-center pt-20 px-4">
//         <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
//           <div className="flex h-full rounded-lg overflow-hidden">
//             <Sidebar />
//
//             {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default HomePage;

// File: src/pages/HomePage.jsx
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import CreateGroupModal from "../components/CreateGroupModal";
import { Users2 } from "lucide-react";

const HomePage = () => {
  const { selectedUser, selectedGroup } = useChatStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
      <div className="h-screen bg-base-200">
        <div className="flex items-center justify-center pt-20 px-4">
          <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)] flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-base-300 flex justify-end">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-sm btn-primary flex items-center gap-2"
                >
                  <Users2 size={16} />
                  <span className="hidden lg:block">Tạo Nhóm</span>
                </button>
              </div>
              {(selectedUser || selectedGroup) ? <ChatContainer /> : <NoChatSelected />}
            </div>
          </div>
        </div>
        <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
  );
};

export default HomePage;