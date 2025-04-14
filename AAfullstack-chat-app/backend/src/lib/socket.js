import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  socket.on("join-stream", (streamId) => {
    socket.join(streamId);
  });

  socket.on("start-stream", ({ streamId, offer }) => {
    socket.to(streamId).emit("receive-stream", offer);
  });

  socket.on("answer-stream", ({ streamId, answer }) => {
    socket.to(streamId).emit("receive-answer", answer);
  });

  socket.on("ice-candidate", ({ streamId, candidate }) => {
    socket.to(streamId).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
  });
});

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

export { app, server, io, getReceiverSocketId };