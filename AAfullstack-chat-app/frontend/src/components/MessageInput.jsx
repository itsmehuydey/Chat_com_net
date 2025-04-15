// import { useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { Image, Send, X } from "lucide-react";
// import toast from "react-hot-toast";
//
// const MessageInput = () => {
//   const [text, setText] = useState("");
//   const [imagePreview, setImagePreview] = useState(null);
//   const fileInputRef = useRef(null);
//   const { sendMessage } = useChatStore();
//
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (!file.type.startsWith("image/")) {
//       toast.error("Please select an image file");
//       return;
//     }
//
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImagePreview(reader.result);
//     };
//     reader.readAsDataURL(file);
//   };
//
//   const removeImage = () => {
//     setImagePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };
//
//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!text.trim() && !imagePreview) return;
//
//     try {
//       await sendMessage({
//         text: text.trim(),
//         image: imagePreview,
//       });
//
//       // Clear form
//       setText("");
//       setImagePreview(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (error) {
//       console.error("Failed to send message:", error);
//     }
//   };
//
//   return (
//     <div className="p-4 w-full">
//       {imagePreview && (
//         <div className="mb-3 flex items-center gap-2">
//           <div className="relative">
//             <img
//               src={imagePreview}
//               alt="Preview"
//               className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
//             />
//             <button
//               onClick={removeImage}
//               className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
//               flex items-center justify-center"
//               type="button"
//             >
//               <X className="size-3" />
//             </button>
//           </div>
//         </div>
//       )}
//
//       <form onSubmit={handleSendMessage} className="flex items-center gap-2">
//         <div className="flex-1 flex gap-2">
//           <input
//             type="text"
//             className="w-full input input-bordered rounded-lg input-sm sm:input-md"
//             placeholder="Type a message..."
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />
//           <input
//             type="file"
//             accept="image/*"
//             className="hidden"
//             ref={fileInputRef}
//             onChange={handleImageChange}
//           />
//
//           <button
//             type="button"
//             className={`hidden sm:flex btn btn-circle
//                      ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <Image size={20} />
//           </button>
//         </div>
//         <button
//           type="submit"
//           className="btn btn-sm btn-circle"
//           disabled={!text.trim() && !imagePreview}
//         >
//           <Send size={22} />
//         </button>
//       </form>
//     </div>
//   );
// };
// export default MessageInput;
//
//
// import { useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { File, Send, X } from "lucide-react";
// import toast from "react-hot-toast";
//
// const MessageInput = () => {
//   const [text, setText] = useState("");
//   const [filePreview, setFilePreview] = useState(null);
//   const [fileType, setFileType] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const fileInputRef = useRef(null);
//   const { sendMessage } = useChatStore();
//
//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//
//     const allowedTypes = [
//       "image/jpeg",
//       "image/png",
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     ];
//
//     if (!allowedTypes.includes(file.type)) {
//       toast.error("Unsupported file type. Please select an image, PDF, or Word document.");
//       return;
//     }
//
//     setSelectedFile(file);
//     setFileType(file.type);
//
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setFilePreview(reader.result);
//     };
//     reader.readAsDataURL(file);
//   };
//
//   const removeFile = () => {
//     setFilePreview(null);
//     setFileType(null);
//     setSelectedFile(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };
//
//   const renderFilePreview = () => {
//     if (!filePreview) return null;
//     if (fileType.startsWith("image/")) {
//       return (
//           <img
//               src={filePreview}
//               alt="Preview"
//               className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
//           />
//       );
//     }
//     return (
//         <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
//           <File size={20} />
//           <span className="text-sm">Attached File</span>
//         </div>
//     );
//   };
//
//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!text.trim() && !selectedFile) return;
//
//     try {
//       const formData = new FormData();
//       formData.append("text", text.trim());
//       if (selectedFile) {
//         formData.append("file", selectedFile);
//       }
//
//       await sendMessage(formData);
//
//       setText("");
//       setFilePreview(null);
//       setFileType(null);
//       setSelectedFile(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (error) {
//       console.error("Failed to send message:", error);
//       toast.error("Failed to send message");
//     }
//   };
//
//   return (
//       <div className="p-4 w-full">
//         {filePreview && (
//             <div className="mb-3 flex items-center gap-2">
//               <div className="relative">
//                 {renderFilePreview()}
//                 <button
//                     onClick={removeFile}
//                     className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
//                     type="button"
//                 >
//                   <X className="size-3" />
//                 </button>
//               </div>
//             </div>
//         )}
//
//         <form onSubmit={handleSendMessage} className="flex items-center gap-2">
//           <div className="flex-1 flex gap-2">
//             <input
//                 type="text"
//                 className="w-full input input-bordered rounded-lg input-sm sm:input-md"
//                 placeholder="Type a message..."
//                 value={text}
//                 onChange={(e) => setText(e.target.value)}
//             />
//             <input
//                 type="file"
//                 accept="image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//                 className="hidden"
//                 ref={fileInputRef}
//                 onChange={handleFileChange}
//             />
//
//             <button
//                 type="button"
//                 className={`hidden sm:flex btn btn-circle ${filePreview ? "text-emerald-500" : "text-zinc-400"}`}
//                 onClick={() => fileInputRef.current?.click()}
//             >
//               <File size={20} />
//             </button>
//           </div>
//           <button
//               type="submit"
//               className="btn btn-sm btn-circle"
//               disabled={!text.trim() && !selectedFile}
//           >
//             <Send size={22} />
//           </button>
//         </form>
//       </div>
//   );
// };
// export default MessageInput;

import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { File, Send, X, Video } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please select an image, PDF, or Word document.");
      return;
    }

    setSelectedFile(file);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileType(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderFilePreview = () => {
    if (!filePreview) return null;
    if (fileType.startsWith("image/")) {
      return (
          <img
              src={filePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
          />
      );
    }
    return (
        <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
          <File size={20} />
          <span className="text-sm">Attached File</span>
        </div>
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("text", text.trim());
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await sendMessage(formData);

      setText("");
      setFilePreview(null);
      setFileType(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const startLivestream = async () => {
    try {
      const streamId = Date.now().toString(); // Tạo ID duy nhất cho livestream
      const streamLink = `http://localhost:5173/livestream/${streamId}`;
      const messageText = `I started a livestream! Join here: ${streamLink}`;

      const formData = new FormData();
      formData.append("text", messageText);

      await sendMessage(formData); // Gửi thông báo với link livestream
      navigate(`/livestream/${streamId}`); // Chuyển hướng đến trang livestream
    } catch (error) {
      console.error("Failed to start livestream:", error);
      toast.error("Failed to start livestream");
    }
  };

  return (
      <div className="p-4 w-full">
        {filePreview && (
            <div className="mb-3 flex items-center gap-2">
              <div className="relative">
                {renderFilePreview()}
                <button
                    onClick={removeFile}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                    type="button"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <input
                type="text"
                className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <input
                type="file"
                accept="image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <button
                type="button"
                className={`hidden sm:flex btn btn-circle ${filePreview ? "text-emerald-500" : "text-zinc-400"}`}
                onClick={() => fileInputRef.current?.click()}
            >
              <File size={20} />
            </button>

            <button
                type="button"
                className="hidden sm:flex btn btn-circle text-zinc-400"
                onClick={startLivestream}
            >
              <Video size={20} />
            </button>
          </div>
          <button
              type="submit"
              className="btn btn-sm btn-circle"
              disabled={!text.trim() && !selectedFile}
          >
            <Send size={22} />
          </button>
        </form>
      </div>
  );
};

export default MessageInput;
