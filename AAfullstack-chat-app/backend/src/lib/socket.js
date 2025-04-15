import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {};
const streamParticipants = {}; // Lưu số lượng người tham gia mỗi stream

io.on("connection", (socket) => {
  let clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  if (clientIp === "::1") {
    clientIp = "127.0.0.1";
  } else if (clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.replace("::ffff:", "");
  }

  const clientPort = socket.handshake.headers['x-forwarded-port'] || socket.request.socket.remotePort;
  const userId = socket.handshake.query.userId || "Unknown";
  console.log(`User ${userId} connected from ${clientIp}:${clientPort} with socket ID ${socket.id}`);

  if (userId && userId !== "Unknown") userSocketMap[userId] = socket.id;

  socket.on("join-livestream", (streamId) => {
    socket.join(streamId);
    console.log(`User ${userId} joined livestream ${streamId}`);

    if (!streamParticipants[streamId]) {
      streamParticipants[streamId] = new Set();
    }
    streamParticipants[streamId].add(socket.id);

    io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
    socket.to(streamId).emit("peer-joined", { peerId: socket.id });
  });

  socket.on("start-livestream", ({ streamId, offer }) => {
    console.log(`Peer to peer paradigm - 20% (live stream phase): User ${userId} started livestream ${streamId}`);
    socket.join(streamId);

    if (!streamParticipants[streamId]) {
      streamParticipants[streamId] = new Set();
    }
    streamParticipants[streamId].add(socket.id);

    io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
    socket.to(streamId).emit("receive-stream", { offer, streamerId: socket.id });
  });

  socket.on("answer-stream", ({ streamId, answer, streamerId }) => {
    io.to(streamerId).emit("receive-answer", { answer, peerId: socket.id });
  });

  socket.on("ice-candidate", ({ streamId, candidate, targetId }) => {
    io.to(targetId).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected from ${clientIp}:${clientPort} with socket ID ${socket.id}`);
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }

    for (const streamId in streamParticipants) {
      if (streamParticipants[streamId].has(socket.id)) {
        streamParticipants[streamId].delete(socket.id);
        io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
        if (streamParticipants[streamId].size === 0) {
          delete streamParticipants[streamId];
        }
        break;
      }
    }
  });
});

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

export { app, server, io, getReceiverSocketId };