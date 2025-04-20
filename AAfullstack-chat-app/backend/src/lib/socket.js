// import { Server } from "socket.io";
// import http from "http";
// import express from "express";
// import { logMessage } from "./logger.js";
//
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:5173",
//         methods: ["GET", "POST"],
//         credentials: true,
//     },
// });
//
// const userSocketMap = {};
// const streamParticipants = {};
// const streamMessages = {};
//
// const getHost = (socket) => {
//     return (
//         socket.handshake.headers['x-host'] ||
//         process.env.SERVER_HOST ||
//         (socket.handshake.address === '::1' ? 'centralized' : 'channel')
//     );
// };
//
// io.on("connection", (socket) => {
//     let clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
//     if (clientIp === "::1") {
//         clientIp = "127.0.0.1";
//     } else if (clientIp.startsWith("::ffff:")) {
//         clientIp = clientIp.replace("::ffff:", "");
//     }
//
//     const clientPort = socket.handshake.headers['x-forwarded-port'] || socket.request.socket.remotePort;
//     const userId = socket.handshake.query.userId || "Unknown";
//     const host = getHost(socket);
//
//     logMessage(
//         {
//             type: 'connection',
//             userId,
//             clientIp,
//             clientPort,
//             socketId: socket.id,
//         },
//         host
//     );
//
//     console.log(`User ${userId} connected from ${clientIp}:${clientPort} with socket ID ${socket.id}`);
//
//     if (userId && userId !== "Unknown") userSocketMap[userId] = socket.id;
//
//     socket.on("join-livestream", (streamId) => {
//         socket.join(streamId);
//
//         logMessage(
//             {
//                 type: 'join-livestream',
//                 userId,
//                 streamId,
//                 socketId: socket.id,
//             },
//             host
//         );
//
//         console.log(`User ${userId} joined livestream ${streamId}`);
//
//         if (!streamParticipants[streamId]) {
//             streamParticipants[streamId] = new Set();
//             streamMessages[streamId] = [];
//         }
//         streamParticipants[streamId].add(socket.id);
//
//         io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
//         socket.to(streamId).emit("peer-joined", { peerId: socket.id });
//
//         socket.emit("liveMessages", streamMessages[streamId] || []);
//     });
//
//     socket.on("start-livestream", ({ streamId, offer }) => {
//         socket.join(streamId);
//
//         logMessage(
//             {
//                 type: 'start-livestream',
//                 userId,
//                 streamId,
//                 socketId: socket.id,
//                 offer: offer ? '[offer-data]' : null,
//             },
//             host
//         );
//
//         console.log(`Peer to peer paradigm - 20% (live stream phase): User ${userId} started livestream ${streamId}`);
//
//         if (!streamParticipants[streamId]) {
//             streamParticipants[streamId] = new Set();
//             streamMessages[streamId] = [];
//         }
//         streamParticipants[streamId].add(socket.id);
//
//         io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
//         socket.to(streamId).emit("receive-stream", { offer, streamerId: socket.id });
//
//         socket.emit("liveMessages", streamMessages[streamId] || []);
//     });
//
//     socket.on("answer-stream", ({ streamId, answer, streamerId }) => {
//         logMessage(
//             {
//                 type: 'answer-stream',
//                 userId,
//                 streamId,
//                 streamerId,
//                 socketId: socket.id,
//                 answer: answer ? '[answer-data]' : null,
//             },
//             host
//         );
//
//         io.to(streamerId).emit("receive-answer", { answer, peerId: socket.id });
//     });
//
//     socket.on("ice-candidate", ({ streamId, candidate, targetId }) => {
//         logMessage(
//             {
//                 type: 'ice-candidate',
//                 userId,
//                 streamId,
//                 targetId,
//                 socketId: socket.id,
//                 candidate: candidate ? '[candidate-data]' : null,
//             },
//             host
//         );
//
//         io.to(targetId).emit("ice-candidate", { candidate, from: socket.id });
//     });
//
//     socket.on("sendLiveMessage", ({ streamId, message, senderId }) => {
//         console.log(`Server received sendLiveMessage: streamId=${streamId}, message=${message}, senderId=${senderId || userId}`);
//
//         const rooms = Array.from(socket.rooms);
//         if (!rooms.includes(streamId)) {
//             console.error(`Error: User ${userId} is not in livestream ${streamId}. Cannot send message.`);
//             return;
//         }
//
//         if (!streamMessages[streamId]) {
//             streamMessages[streamId] = [];
//         }
//         const liveMessage = {
//             senderId: senderId || userId,
//             text: message,
//             timestamp: new Date().toISOString(),
//         };
//         streamMessages[streamId].push(liveMessage);
//
//         logMessage(
//             {
//                 type: 'live_message',
//                 userId,
//                 streamId,
//                 message,
//             },
//             host
//         );
//
//         console.log(`Emitting newLiveMessage to stream ${streamId}:`, liveMessage);
//         io.to(streamId).emit("newLiveMessage", liveMessage);
//     });
//
//     socket.on("participantLeft", (streamId) => {
//         if (!streamParticipants[streamId]) {
//             console.log(`Stream ${streamId} does not exist for participant to leave`);
//             return;
//         }
//
//         streamParticipants[streamId].delete(socket.id);
//
//         logMessage(
//             {
//                 type: 'leave-livestream',
//                 userId,
//                 streamId,
//                 socketId: socket.id,
//             },
//             host
//         );
//
//         console.log(`User ${userId} left livestream ${streamId}`);
//
//         io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
//         if (streamParticipants[streamId].size === 0) {
//             delete streamParticipants[streamId];
//             delete streamMessages[streamId];
//         }
//     });
//
//     socket.on("livestreamEnded", ({ streamId }) => {
//         logMessage(
//             {
//                 type: 'stop-livestream',
//                 userId,
//                 streamId,
//                 socketId: socket.id,
//             },
//             host
//         );
//
//         console.log(`User ${userId} stopped livestream ${streamId}`);
//
//         io.to(streamId).emit("livestreamEnded", { streamId });
//
//         if (streamParticipants[streamId]) {
//             delete streamParticipants[streamId];
//         }
//         if (streamMessages[streamId]) {
//             delete streamMessages[streamId];
//         }
//     });
//
//     socket.on("disconnect", () => {
//         logMessage(
//             {
//                 type: 'disconnection',
//                 userId,
//                 clientIp,
//                 clientPort,
//                 socketId: socket.id,
//             },
//             host
//         );
//
//         console.log(`User ${userId} disconnected from ${clientIp}:${clientPort} with socket ID ${socket.id}`);
//         for (const userId in userSocketMap) {
//             if (userSocketMap[userId] === socket.id) {
//                 delete userSocketMap[userId];
//                 break;
//             }
//         }
//
//         for (const streamId in streamParticipants) {
//             if (streamParticipants[streamId].has(socket.id)) {
//                 streamParticipants[streamId].delete(socket.id);
//
//                 logMessage(
//                     {
//                         type: 'leave-livestream',
//                         userId,
//                         streamId,
//                         socketId: socket.id,
//                     },
//                     host
//                 );
//
//                 console.log(`User ${userId} left livestream ${streamId} due to disconnect`);
//
//                 io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
//                 if (streamParticipants[streamId].size === 0) {
//                     delete streamParticipants[streamId];
//                     delete streamMessages[streamId];
//                 }
//                 break;
//             }
//         }
//     });
// });
//
// const getReceiverSocketId = (receiverId) => {
//     return userSocketMap[receiverId];
// };
//
// export { app, server, io, getReceiverSocketId };

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
const streamMessages = {};

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
        // Kiểm tra xem livestream có tồn tại không
        if (!streamParticipants[streamId]) {
            socket.emit("error", { message: "Livestream does not exist or has not started." });
            return;
        }

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

        streamParticipants[streamId].add(socket.id);

        io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
        socket.to(streamId).emit("peer-joined", { peerId: socket.id });

        socket.emit("liveMessages", streamMessages[streamId] || []);
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
            streamMessages[streamId] = [];
        }
        streamParticipants[streamId].add(socket.id);

        io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
        socket.to(streamId).emit("receive-stream", { offer, streamerId: socket.id });

        socket.emit("liveMessages", streamMessages[streamId] || []);
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

    socket.on("sendLiveMessage", ({ streamId, message, senderId }) => {
        console.log(`Server received sendLiveMessage: streamId=${streamId}, message=${message}, senderId=${senderId || userId}`);

        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(streamId)) {
            console.error(`Error: User ${userId} is not in livestream ${streamId}. Cannot send message.`);
            return;
        }

        if (!streamMessages[streamId]) {
            streamMessages[streamId] = [];
        }
        const liveMessage = {
            senderId: senderId || userId,
            text: message,
            timestamp: new Date().toISOString(),
        };
        streamMessages[streamId].push(liveMessage);

        logMessage(
            {
                type: 'live_message',
                userId,
                streamId,
                message,
            },
            host
        );

        console.log(`Emitting newLiveMessage to stream ${streamId}:`, liveMessage);
        io.to(streamId).emit("newLiveMessage", liveMessage);
    });

    socket.on("participantLeft", (streamId) => {
        if (!streamParticipants[streamId]) {
            console.log(`Stream ${streamId} does not exist for participant to leave`);
            return;
        }

        streamParticipants[streamId].delete(socket.id);

        logMessage(
            {
                type: 'leave-livestream',
                userId,
                streamId,
                socketId: socket.id,
            },
            host
        );

        console.log(`User ${userId} left livestream ${streamId}`);

        io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
        if (streamParticipants[streamId].size === 0) {
            delete streamParticipants[streamId];
            delete streamMessages[streamId];
        }
    });

    socket.on("livestreamEnded", ({ streamId }) => {
        logMessage(
            {
                type: 'stop-livestream',
                userId,
                streamId,
                socketId: socket.id,
            },
            host
        );

        console.log(`User ${userId} stopped livestream ${streamId}`);

        io.to(streamId).emit("livestreamEnded", { streamId });

        if (streamParticipants[streamId]) {
            delete streamParticipants[streamId];
        }
        if (streamMessages[streamId]) {
            delete streamMessages[streamId];
        }
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

                logMessage(
                    {
                        type: 'leave-livestream',
                        userId,
                        streamId,
                        socketId: socket.id,
                    },
                    host
                );

                console.log(`User ${userId} left livestream ${streamId} due to disconnect`);

                io.to(streamId).emit("participant-update", streamParticipants[streamId].size);
                if (streamParticipants[streamId].size === 0) {
                    delete streamParticipants[streamId];
                    delete streamMessages[streamId];
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