// import { Server } from "socket.io";
// import http from "http";
// import express from "express";
//
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"],
//   },
// });
//
// const userSocketMap = {};
//
// io.on("connection", (socket) => {
//   console.log("A user connected", socket.id);
//
//   const userId = socket.handshake.query.userId;
//   if (userId) userSocketMap[userId] = socket.id;
//
//   socket.on("join-stream", (streamId) => {
//     socket.join(streamId);
//   });
//
//   socket.on("start-stream", ({ streamId, offer }) => {
//     socket.to(streamId).emit("receive-stream", offer);
//   });
//
//   socket.on("answer-stream", ({ streamId, answer }) => {
//     socket.to(streamId).emit("receive-answer", answer);
//   });
//
//   socket.on("ice-candidate", ({ streamId, candidate }) => {
//     socket.to(streamId).emit("ice-candidate", candidate);
//   });
//
//   socket.on("disconnect", () => {
//     console.log("User disconnected", socket.id);
//     for (const userId in userSocketMap) {
//       if (userSocketMap[userId] === socket.id) {
//         delete userSocketMap[userId];
//         break;
//       }
//     }
//   });
// });
//
// const getReceiverSocketId = (receiverId) => {
//   return userSocketMap[receiverId];
// };
//
// export { app, server, io, getReceiverSocketId };

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

io.on("connection", (socket) => {
  // Lấy địa chỉ IP của client
  let clientIp = socket.handshake.address;

  // Nếu IP là ::1 (IPv6 localhost), chuyển sang IPv4 (127.0.0.1)
  if (clientIp === "::1") {
    clientIp = "127.0.0.1";
  } else if (clientIp.startsWith("::ffff:")) {
    // Nếu IP là IPv6 dạng mapped IPv4 (ví dụ ::ffff:192.168.1.100), lấy phần IPv4
    clientIp = clientIp.replace("::ffff:", "");
  }

  // Lấy port của client
  const clientPort = socket.handshake.headers['x-forwarded-port'] || socket.request.socket.remotePort;
  const userId = socket.handshake.query.userId || "Unknown";
  console.log(`User ${userId} connected from ${clientIp}:${clientPort} with socket ID ${socket.id}`);

  if (userId && userId !== "Unknown") userSocketMap[userId] = socket.id;

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
    console.log(`User ${userId} disconnected from ${clientIp}:${clientPort} with socket ID ${socket.id}`);
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