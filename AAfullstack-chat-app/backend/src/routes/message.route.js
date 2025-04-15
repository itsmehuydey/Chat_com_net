// File: src/routes/message.route.js
import express from "express";
import multer from "multer";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getMessages,
    getUsersForSidebar,
    sendMessage,
    createGroup,
    sendGroupMessage,
    getUserGroups,
    getGroupMessages,
    broadcastLivestream,
    endLivestream,
    leaveLivestream,
    downloadFile,
    getPeersFromTracker,
} from "../controllers/message.controller.js";

const router = express.Router();

const storage = multer.memoryStorage();
const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("File type not supported"), false);
        }
    },
}).single("file");

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/groups", protectRoute, getUserGroups);
router.get("/group/:id", protectRoute, getGroupMessages);
router.get("/:id", protectRoute, getMessages);
router.get("/download/:messageId", protectRoute, downloadFile);

router.post("/send/:id", protectRoute, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            console.log("Multer error:", err.message);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, sendMessage);

router.post("/group/send/:id", protectRoute, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            console.log("Multer error:", err.message);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, sendGroupMessage);

router.post("/create-group", protectRoute, createGroup);
router.post("/broadcast-livestream", protectRoute, broadcastLivestream);
router.post("/end-livestream", protectRoute, endLivestream);
router.post("/leave-livestream", protectRoute, leaveLivestream);
router.post("/peers", protectRoute, getPeersFromTracker);

export default router;