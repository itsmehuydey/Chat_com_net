// import { X } from "lucide-react";
// import { useAuthStore } from "../store/useAuthStore";
// import { useChatStore } from "../store/useChatStore";
//
// const ChatHeader = () => {
//   const { selectedUser, setSelectedUser } = useChatStore();
//   const { onlineUsers } = useAuthStore();
//
//   return (
//     <div className="p-2.5 border-b border-base-300">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           {/* Avatar */}
//           <div className="avatar">
//             <div className="size-10 rounded-full relative">
//               <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
//             </div>
//           </div>
//
//           {/* User info */}
//           <div>
//             <h3 className="font-medium">{selectedUser.fullName}</h3>
//             <p className="text-sm text-base-content/70">
//               {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
//             </p>
//           </div>
//         </div>
//
//         {/* Close button */}
//         <button onClick={() => setSelectedUser(null)}>
//           <X />
//         </button>
//       </div>
//     </div>
//   );
// };
// export default ChatHeader;

// File: src/components/ChatHeader.jsx
import { X, Users2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup } = useChatStore();
    const { onlineUsers } = useAuthStore();

    if (!selectedUser && !selectedGroup) return null;

    const isGroupChat = !!selectedGroup;

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            {isGroupChat ? (
                                <div className="size-10 flex items-center justify-center bg-base-300 rounded-full">
                                    <Users2 className="size-6" />
                                </div>
                            ) : (
                                <img
                                    src={selectedUser.profilePic || "/avatar.png"}
                                    alt={selectedUser.fullName}
                                />
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium">{isGroupChat ? selectedGroup.name : selectedUser.fullName}</h3>
                        <p className="text-sm text-base-content/70">
                            {isGroupChat
                                ? `${selectedGroup.members.length} members`
                                : onlineUsers.includes(selectedUser._id)
                                    ? "Online"
                                    : "Offline"}
                        </p>
                    </div>
                </div>
                <button onClick={() => (isGroupChat ? setSelectedGroup(null) : setSelectedUser(null))}>
                    <X />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;