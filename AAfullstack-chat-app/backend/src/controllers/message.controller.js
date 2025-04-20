
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import fetch from "node-fetch";
import { initializeTrackerProtocol } from "../lib/tracker.js";
import { logMessage } from "../lib/logger.js";

const getHost = (req) => {
  return (
      req.headers['x-host'] ||
      process.env.SERVER_HOST ||
      (req.hostname === 'localhost' ? 'centralized' : 'channel')
  );
};

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
    const host = getHost(req);

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
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      file: fileUrl || null,
      fileName: fileName || null,
    });

    await newMessage.save();

    logMessage(
        {
          type: 'message',
          senderId,
          receiverId,
          text,
          file: fileUrl || null,
          fileName: fileName || null,
        },
        host
    );

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

export const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const creatorId = req.user._id;
    const host = getHost(req);

    if (!name || !memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ error: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    if (!memberIds.includes(creatorId.toString())) {
      memberIds.push(creatorId);
    }

    const users = await User.find({ _id: { $in: memberIds } });
    if (users.length !== memberIds.length) {
      return res.status(400).json({ error: "Một số thành viên không tồn tại" });
    }

    const newGroup = new Group({
      name,
      members: memberIds,
      creator: creatorId,
    });

    await newGroup.save();

    logMessage(
        {
          type: 'group_created',
          creatorId,
          groupId: newGroup._id,
          name,
          members: memberIds,
        },
        host
    );

    const memberSocketIds = memberIds
        .map((id) => getReceiverSocketId(id))
        .filter((id) => id);
    memberSocketIds.forEach((socketId) => {
      io.to(socketId).emit("groupCreated", {
        groupId: newGroup._id,
        name: newGroup.name,
        members: newGroup.members,
      });
    });

    res.status(201).json({
      groupId: newGroup._id,
      name: newGroup.name,
      members: newGroup.members,
    });
  } catch (error) {
    console.log("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Không thể tạo nhóm: " + error.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;
    const host = getHost(req);

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Nhóm không tồn tại" });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ error: "Bạn không phải thành viên của nhóm" });
    }

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
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      file: fileUrl || null,
      fileName: fileName || null,
    });

    await newMessage.save();

    logMessage(
        {
          type: 'group_message',
          senderId,
          groupId,
          text,
          file: fileUrl || null,
          fileName: fileName || null,
        },
        host
    );

    const messageWithMimeType = {
      ...newMessage._doc,
      file: fileUrl || null,
      mimeType,
    };

    const memberSocketIds = group.members
        .map((id) => getReceiverSocketId(id.toString()))
        .filter((id) => id);
    memberSocketIds.forEach((socketId) => {
      io.to(socketId).emit("newGroupMessage", messageWithMimeType);
    });

    res.status(201).json(messageWithMimeType);
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);
    res.status(500).json({ error: "Không thể gửi tin nhắn nhóm: " + error.message });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId }).populate("members", "fullName email");
    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getUserGroups controller: ", error.message);
    res.status(500).json({ error: "Không thể lấy danh sách nhóm: " + error.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Nhóm không tồn tại" });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ error: "Bạn không phải thành viên của nhóm" });
    }

    const messages = await Message.find({ groupId }).populate("senderId", "fullName");

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
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Không thể lấy tin nhắn nhóm: " + error.message });
  }
};

export const broadcastLivestream = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { streamId } = req.body;
    const host = getHost(req);

    const users = await User.find({ _id: { $ne: senderId } }).select("_id");

    const messagePromises = users.map(async (user) => {
      const streamLink = `http://localhost:5173/livestream/${streamId}?userId=${user._id}`;
      const newMessage = new Message({
        senderId,
        receiverId: user._id,
        text: `I started a livestream! Join here: ${streamLink}`,
      });
      await newMessage.save();

      logMessage(
          {
            type: 'livestream_broadcast',
            senderId,
            receiverId: user._id,
            streamId,
            streamLink,
          },
          host
      );

      const receiverSocketId = getReceiverSocketId(user._id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
        io.to(receiverSocketId).emit("livestreamNotification", { streamId, streamLink, userId: user._id });
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

export const endLivestream = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { streamId } = req.body;
    const host = getHost(req);

    if (!streamId) {
      return res.status(400).json({ error: "Stream ID is required" });
    }

    // Emit sự kiện livestreamEnded đến tất cả client trong phòng livestream
    io.to(streamId).emit("livestreamEnded", { streamId });

    logMessage(
        {
          type: 'livestream_ended',
          senderId,
          streamId,
        },
        host
    );

    res.status(200).json({ message: "Livestream ended notification sent to all users" });
  } catch (error) {
    console.log("Error in endLivestream controller: ", error.message);
    res.status(500).json({ error: "Failed to end livestream: " + error.message });
  }
};

export const leaveLivestream = async (req, res) => {
  try {
    const userId = req.user._id;
    const { streamId } = req.body;
    const host = getHost(req);

    if (!streamId) {
      return res.status(400).json({ error: "Stream ID is required" });
    }

    // Emit sự kiện participantLeft đến tất cả client trong phòng livestream
    io.to(streamId).emit("participantLeft", { streamId, userId });

    logMessage(
        {
          type: 'livestream_participant_left',
          senderId: userId,
          streamId,
        },
        host
    );

    res.status(200).json({ message: "Successfully left livestream" });
  } catch (error) {
    console.log("Error in leaveLivestream controller: ", error.message);
    res.status(500).json({ error: "Failed to leave livestream: " + error.message });
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