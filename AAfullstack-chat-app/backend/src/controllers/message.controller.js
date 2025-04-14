// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";
// import cloudinary from "../lib/cloudinary.js";
// import { getReceiverSocketId, io } from "../lib/socket.js";
//
// export const getUsersForSidebar = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;
//     const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
//     res.status(200).json(filteredUsers);
//   } catch (error) {
//     console.error("Error in getUsersForSidebar: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
//
// export const getMessages = async (req, res) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;
//
//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: userToChatId },
//         { senderId: userToChatId, receiverId: myId },
//       ],
//     });
//
//     // Tạo URL tải đúng cho file
//     const messagesWithCorrectUrls = messages.map((message) => {
//       if (message.file) {
//         const publicId = message.file.split("/").pop().split(".")[0];
//         const fileExtension = message.fileName ? message.fileName.split(".").pop().toLowerCase() : message.file.split(".").pop().toLowerCase();
//         const resourceType = ["pdf", "doc", "docx"].includes(fileExtension) ? "raw" : "image";
//         message.file = cloudinary.url(publicId, {
//           resource_type: resourceType,
//           secure: true,
//         });
//       }
//       return message;
//     });
//
//     res.status(200).json(messagesWithCorrectUrls);
//   } catch (error) {
//     console.log("Error in getMessages controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
//
// export const sendMessage = async (req, res) => {
//   try {
//     const { text } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;
//
//     let fileUrl;
//     let fileName;
//     if (req.file) {
//       console.log("File received:", req.file);
//       const base64File = req.file.buffer.toString("base64");
//       const dataUri = `data:${req.file.mimetype};base64,${base64File}`;
//
//       const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
//       const resourceType = ["pdf", "doc", "docx"].includes(fileExtension) ? "raw" : "auto";
//
//       const uploadResponse = await cloudinary.uploader.upload(dataUri, {
//         resource_type: resourceType,
//         access_mode: "public",
//       });
//       console.log("Cloudinary upload response:", uploadResponse);
//       fileUrl = uploadResponse.secure_url;
//       fileName = req.file.originalname;
//
//       const publicId = fileUrl.split("/").pop().split(".")[0];
//       fileUrl = cloudinary.url(publicId, {
//         resource_type: resourceType,
//         secure: true,
//       });
//     } else {
//       console.log("No file received in request");
//     }
//
//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       file: fileUrl || null,
//       fileName: fileName || null,
//     });
//
//     await newMessage.save();
//     console.log("New message saved:", newMessage);
//
//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }
//
//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage controller: ", error.message);
//     res.status(500).json({ error: "Failed to send message: " + error.message });
//   }
// };
//
// // Thêm hàm mới để gửi thông báo livestream đến tất cả user
// export const broadcastLivestream = async (req, res) => {
//   try {
//     const senderId = req.user._id;
//     const { streamLink } = req.body;
//
//     // Lấy danh sách tất cả user trừ người gửi
//     const users = await User.find({ _id: { $ne: senderId } }).select("_id");
//
//     // Tạo tin nhắn thông báo cho từng user
//     const messagePromises = users.map(async (user) => {
//       const newMessage = new Message({
//         senderId,
//         receiverId: user._id,
//         text: `I started a livestream! Join here: ${streamLink}`,
//       });
//       await newMessage.save();
//
//       const receiverSocketId = getReceiverSocketId(user._id);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("newMessage", newMessage);
//       }
//       return newMessage;
//     });
//
//     await Promise.all(messagePromises);
//
//     res.status(201).json({ message: "Livestream notification sent to all users" });
//   } catch (error) {
//     console.log("Error in broadcastLivestream controller: ", error.message);
//     res.status(500).json({ error: "Failed to broadcast livestream: " + error.message });
//   }
// };

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import fetch from "node-fetch";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    const messagesWithCorrectUrls = messages.map((message) => {
      if (message.file && message.fileName) {
        const fileExtension = message.fileName.split(".").pop().toLowerCase();
        const mimeType = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }[fileExtension] || "application/octet-stream";

        return {
          ...message._doc,
          file: message.file,
          fileName: message.fileName,
          mimeType,
        };
      }
      return message;
    });

    res.status(200).json(messagesWithCorrectUrls);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let fileUrl;
    let fileName;
    if (req.file) {
      console.log("File received:", req.file);
      const base64File = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64File}`;

      const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
      const resourceType = ["pdf", "doc", "docx"].includes(fileExtension) ? "raw" : "auto";

      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        resource_type: resourceType,
        access_mode: "public",
      });
      console.log("Cloudinary upload response:", uploadResponse);
      fileUrl = uploadResponse.secure_url;
      fileName = req.file.originalname;
    } else {
      console.log("No file received in request");
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      file: fileUrl || null,
      fileName: fileName || null,
    });

    await newMessage.save();
    console.log("New message saved:", newMessage);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Failed to send message: " + error.message });
  }
};

export const broadcastLivestream = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { streamLink } = req.body;

    const users = await User.find({ _id: { $ne: senderId } }).select("_id");

    const messagePromises = users.map(async (user) => {
      const newMessage = new Message({
        senderId,
        receiverId: user._id,
        text: `I started a livestream! Join here: ${streamLink}`,
      });
      await newMessage.save();

      const receiverSocketId = getReceiverSocketId(user._id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
      return newMessage;
    });

    await Promise.all(messagePromises);

    res.status(201).json({ message: "Livestream notification sent to all users" });
  } catch (error) {
    console.log("Error in broadcastLivestream controller: ", error.message);
    res.status(500).json({ error: "Failed to broadcast livestream: " + error.message });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log("Yêu cầu tải file với messageId:", messageId);

    const message = await Message.findById(messageId);
    if (!message || !message.file) {
      console.log("File không tồn tại trong database:", messageId);
      return res.status(404).json({ error: "File không tồn tại" });
    }

    const fileExtension = message.fileName.split(".").pop().toLowerCase();
    const mimeType = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }[fileExtension] || "application/octet-stream";

    // Điều chỉnh URL Cloudinary để tải file PDF trực tiếp
    let fileUrl = message.file;
    if (fileExtension === "pdf") {
      // Thay "raw" bằng "attachment" để Cloudinary trả về file PDF
      fileUrl = message.file.replace("/raw/upload/", "/attachment/upload/");
      // Thêm tham số "fl_attachment" để yêu cầu tải file dưới dạng attachment
      fileUrl = fileUrl.includes("?") ? `${fileUrl}&fl_attachment` : `${fileUrl}?fl_attachment`;
    }

    console.log("Tải file từ Cloudinary với URL:", fileUrl);
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.log("Lỗi khi tải file từ Cloudinary:", response.status, response.statusText);
      throw new Error(`Không thể tải file từ Cloudinary: ${response.statusText}`);
    }

    const fileBuffer = await response.buffer();
    console.log("Tải file thành công từ Cloudinary, kích thước:", fileBuffer.length);

    const headers = {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${message.fileName}"`,
      "Content-Length": fileBuffer.length,
    };
    console.log("Gửi header:", headers);

    res.set(headers);
    res.send(fileBuffer);
  } catch (error) {
    console.log("Lỗi trong downloadFile controller:", error.message);
    res.status(500).json({ error: "Không thể tải file: " + error.message });
  }
};