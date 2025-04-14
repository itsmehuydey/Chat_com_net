// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";
// import cloudinary from "../lib/cloudinary.js";
// import { getReceiverSocketId, io } from "../lib/socket.js";
// import fetch from "node-fetch";
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
//     const messagesWithCorrectUrls = messages.map((message) => {
//       if (message.file && message.fileName) {
//         const fileExtension = message.fileName.split(".").pop().toLowerCase();
//         const mimeType = {
//           jpg: "image/jpeg",
//           jpeg: "image/jpeg",
//           png: "image/png",
//           pdf: "application/pdf",
//           doc: "application/msword",
//           docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//         }[fileExtension] || "application/octet-stream";
//
//         return {
//           ...message._doc,
//           file: message.file.split('?')[0], // Loại bỏ query params
//           fileName: message.fileName,
//           mimeType,
//         };
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
//     let mimeType;
//     if (req.file) {
//       const base64File = req.file.buffer.toString("base64");
//       const dataUri = `data:${req.file.mimetype};base64,${base64File}`;
//
//       const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
//       const resourceType = ["pdf", "doc", "docx"].includes(fileExtension) ? "raw" : "image";
//
//       const uploadResponse = await cloudinary.uploader.upload(dataUri, {
//         resource_type: resourceType,
//         access_mode: "public",
//       });
//       fileUrl = uploadResponse.secure_url.split('?')[0];
//       fileName = req.file.originalname;
//
//       mimeType = {
//         jpg: "image/jpeg",
//         jpeg: "image/jpeg",
//         png: "image/png",
//         pdf: "application/pdf",
//         doc: "application/msword",
//         docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       }[fileExtension] || "application/octet-stream";
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
//     const messageWithMimeType = {
//       ...newMessage._doc,
//       file: fileUrl || null,
//       mimeType,
//     };
//
//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", messageWithMimeType);
//     }
//
//     res.status(201).json(messageWithMimeType);
//   } catch (error) {
//     console.log("Error in sendMessage controller: ", error.message);
//     res.status(500).json({ error: "Failed to send message: " + error.message });
//   }
// };
//
// export const broadcastLivestream = async (req, res) => {
//   try {
//     const senderId = req.user._id;
//     const { streamLink } = req.body;
//
//     const users = await User.find({ _id: { $ne: senderId } }).select("_id");
//
//     const messagePromises = users.map(async (user) => {
//       const newMessage = new Message({
//         senderId,
//         receiverId: user._id,
//         text: `I started a livestream! Join here: ${streamLink}`,
//       });
//       await newMessage.save();
//       console.log("New message saved:", newMessage);
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
//
// export const downloadFile = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//
//     const message = await Message.findById(messageId);
//     if (!message || !message.file) {
//       return res.status(404).json({ error: "File không tồn tại" });
//     }
//
//     const fileExtension = message.fileName.split(".").pop().toLowerCase();
//     const mimeType = {
//       jpg: "image/jpeg",
//       jpeg: "image/jpeg",
//       png: "image/png",
//       pdf: "application/pdf",
//       doc: "application/msword",
//       docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     }[fileExtension] || "application/octet-stream";
//
//     let fileUrl = message.file;
//     if (fileExtension === "pdf") {
//       fileUrl = message.file.replace("/raw/upload/", "/attachment/upload/");
//       fileUrl = fileUrl.includes("?") ? `${fileUrl}&fl_attachment` : `${fileUrl}?fl_attachment`;
//     }
//
//     const response = await fetch(fileUrl);
//     if (!response.ok) {
//       throw new Error(`Không thể tải file từ Cloudinary: ${response.statusText}`);
//     }
//
//     const fileBuffer = await response.buffer();
//
//     const headers = {
//       "Content-Type": mimeType,
//       "Content-Disposition": `attachment; filename="${message.fileName}"`,
//       "Content-Length": fileBuffer.length,
//     };
//
//     res.set(headers);
//     res.send(fileBuffer);
//   } catch (error) {
//     console.log("Lỗi trong downloadFile controller:", error.message);
//     res.status(500).json({ error: "Không thể tải file: " + error.message });
//   }
// };

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import fetch from "node-fetch";
import { initializeTrackerProtocol } from "../lib/tracker.js";

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
          file: message.file.split('?')[0],
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
    let mimeType;
    if (req.file) {
      const base64File = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64File}`;

      const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
      const resourceType = ["pdf", "doc", "docx"].includes(fileExtension) ? "raw" : "image";

      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        resource_type: resourceType,
        access_mode: "public",
      });
      fileUrl = uploadResponse.secure_url.split('?')[0];
      fileName = req.file.originalname;

      mimeType = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }[fileExtension] || "application/octet-stream";
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

    const messageWithMimeType = {
      ...newMessage._doc,
      file: fileUrl || null,
      mimeType,
    };

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageWithMimeType);
    }

    res.status(201).json(messageWithMimeType);
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
      console.log("New message saved:", newMessage);

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

    const message = await Message.findById(messageId);
    if (!message || !message.file) {
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

    let fileUrl = message.file;
    if (fileExtension === "pdf") {
      fileUrl = message.file.replace("/raw/upload/", "/attachment/upload/");
      fileUrl = fileUrl.includes("?") ? `${fileUrl}&fl_attachment` : `${fileUrl}?fl_attachment`;
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Không thể tải file từ Cloudinary: ${response.statusText}`);
    }

    const fileBuffer = await response.buffer();

    const headers = {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${message.fileName}"`,
      "Content-Length": fileBuffer.length,
    };

    res.set(headers);
    res.send(fileBuffer);
  } catch (error) {
    console.log("Lỗi trong downloadFile controller:", error.message);
    res.status(500).json({ error: "Không thể tải file: " + error.message });
  }
};

export const getPeersFromTracker = async (req, res) => {
  try {
    const { torrentFilePath } = req.body;
    if (!torrentFilePath) {
      return res.status(400).json({ error: "Torrent file path is required" });
    }

    const peers = await initializeTrackerProtocol(torrentFilePath);
    res.status(200).json(peers);
  } catch (error) {
    console.log("Error in getPeersFromTracker controller: ", error.message);
    res.status(500).json({ error: "Failed to get peers from tracker" });
  }
};