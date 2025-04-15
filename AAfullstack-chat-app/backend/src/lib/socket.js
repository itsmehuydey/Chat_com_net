// File: src/lib/socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";
import { logMessage } from "./logger.js";

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
const streamParticipants = {};

const getHost = (socket) => {
    return (
        socket.handshake.headers['x-host'] ||
        process.env.SERVER_HOST ||
        (socket.handshake.address === '::1' ? 'centralized' : 'channel')
    );
};

io.on("connection", (socket) => {
    let clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    if (clientIp === "::1") {
        clientIp = "127.0.0.1";
    } else if (clientIp.startsWith("::ffff:")) {
        clientIp = clientIp.replace("::ffff:", "");
    }

    const clientPort = socket.handshake.headers['x-forwarded-port'] || socket.request.socket.remotePort;
    const userId = socket.handshake.query.userId || "Unknown";
    const host = getHost(socket);

    logMessage(
        {
            type: 'connection',
            userId,
            clientIp,
            clientPort,
            socketId: socket.id,
        },
        host
    );

    console.log(`User ${userId} connected from ${clientIp}:${clientPort} with socket ID ${socket.id}`);

    if (userId && userId !== "Unknown") userSocketMap[userId] = socket.id;

    socket.on("join-livestream", (streamId) => {
        socket.join(streamId);

        logMessage(
            {
                type: 'join-livestream',
                userId,
                streamId,
                socketId: socket.id,
            },
            host
        );

        console.log(`User ${userId} joined livestream ${streamId}`);

        if (!streamParticipants[streamId]) {
            streamParticipants[streamId] = new Set();
        }
        streamParticipants[streamId].add(socket.id);

        io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
        socket.to(streamId).emit("peer-joined", { peerId: socket.id });
    });

    socket.on("start-livestream", ({ streamId, offer }) => {
        socket.join(streamId);

        logMessage(
            {
                type: 'start-livestream',
                userId,
                streamId,
                socketId: socket.id,
                offer: offer ? '[offer-data]' : null,
            },
            host
        );

        console.log(`Peer to peer paradigm - 20% (live stream phase): User ${userId} started livestream ${streamId}`);

        if (!streamParticipants[streamId]) {
            streamParticipants[streamId] = new Set();
        }
        streamParticipants[streamId].add(socket.id);

        io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
        socket.to(streamId).emit("receive-stream", { offer, streamerId: socket.id });
    });

    socket.on("answer-stream", ({ streamId, answer, streamerId }) => {
        logMessage(
            {
                type: 'answer-stream',
                userId,
                streamId,
                streamerId,
                socketId: socket.id,
                answer: answer ? '[answer-data]' : null,
            },
            host
        );

        io.to(streamerId).emit("receive-answer", { answer, peerId: socket.id });
    });

    socket.on("ice-candidate", ({ streamId, candidate, targetId }) => {
        logMessage(
            {
                type: 'ice-candidate',
                userId,
                streamId,
                targetId,
                socketId: socket.id,
                candidate: candidate ? '[candidate-data]' : null,
            },
            host
        );

        io.to(targetId).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
        logMessage(
            {
                type: 'disconnection',
                userId,
                clientIp,
                clientPort,
                socketId: socket.id,
            },
            host
        );

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