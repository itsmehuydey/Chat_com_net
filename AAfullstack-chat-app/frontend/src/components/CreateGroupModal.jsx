// File: src/components/CreateGroupModal.jsx
import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { users, createGroup } = useChatStore();
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);

    const handleMemberToggle = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter((id) => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            toast.error("Tên nhóm không được để trống");
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error("Vui lòng chọn ít nhất một thành viên");
            return;
        }

        try {
            await createGroup({ name: groupName, memberIds: selectedMembers });
            toast.success("Nhóm đã được tạo thành công");
            setGroupName("");
            setSelectedMembers([]);
            onClose();
        } catch (error) {
            toast.error("Không thể tạo nhóm: " + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Tạo Nhóm Chat</h2>
                    <button onClick={onClose}>
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleCreateGroup}>
                    <div className="mb-4">
                        <label className="block text-sm mb-1">Tên Nhóm</label>
                        <input
                            type="text"
                            className="w-full input input-bordered rounded-lg input-sm"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm mb-1">Chọn Thành Viên</label>
                        <div className="max-h-40 overflow-y-auto border border-base-300 rounded-lg p-2">
                            {users.map((user) => (
                                <div key={user._id} className="flex items-center gap-2 py-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(user._id)}
                                        onChange={() => handleMemberToggle(user._id)}
                                        className="checkbox checkbox-sm"
                                    />
                                    <span>{user.fullName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="btn btn-sm">
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-sm btn-primary">
                            Tạo Nhóm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;