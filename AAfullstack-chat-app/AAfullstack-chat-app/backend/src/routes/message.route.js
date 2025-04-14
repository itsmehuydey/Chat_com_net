// import express from "express";
// import multer from "multer";
// import { protectRoute } from "../middleware/auth.middleware.js";
// import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";
//
// const router = express.Router();
//
// const storage = multer.memoryStorage();
//
// const allowedTypes = [
//     "image/jpeg",
//     "image/png",
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// ];
//
// const upload = multer({
//     storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
//     fileFilter: (req, file, cb) => {
//         if (allowedTypes.includes(file.mimetype)) {
//             cb(null, true);
//         } else {
//             cb(new Error("File type not supported"), false);
//         }
//     },
// }).single("file");
//
//
// router.get("/users", protectRoute, getUsersForSidebar);
// router.get("/:id", protectRoute, getMessages);
//
// router.post("/send/:id", protectRoute, (req, res, next) => {
//     upload(req, res, (err) => {
//         if (err) {
//             console.log("Multer error:", err.message); // Debugging log
//             return res.status(400).json({ error: err.message });
//         }
//         next();
//     });
// }, sendMessage);
//
// export default router;
//
// // import express from "express";
// // import multer from "multer";
// // import { protectRoute } from "../middleware/auth.middleware.js";
// // import {
// //     getMessages,
// //     getUsersForSidebar,
// //     sendMessage,
// //     broadcastLivestream,
// //     downloadFile,
// // } from "../controllers/message.controller.js";
// //
// // const router = express.Router();
// //
// // // Cấu hình multer để xử lý file upload
// // const storage = multer.memoryStorage();
// // const upload = multer({
// //     storage,
// //     fileFilter: (req, file, cb) => {
// //         const allowedTypes = [
// //             "image/jpeg",
// //             "image/png",
// //             "application/pdf",
// //             "application/msword",
// //             "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// //         ];
// //         if (allowedTypes.includes(file.mimetype)) {
// //             cb(null, true);
// //         } else {
// //             cb(new Error("File type not supported"), false);
// //         }
// //     },
// //     limits: { fileSize: 5 * 1024 * 1024 },
// // }).single("file");
// //
// // router.get("/users", protectRoute, getUsersForSidebar);
// // router.get("/:id", protectRoute, getMessages);
// // router.get("/download/:messageId", protectRoute, downloadFile);
// //
// // router.post("/send/:id", protectRoute, (req, res, next) => {
// //     upload(req, res, (err) => {
// //         if (err) {
// //             console.log("Multer error:", err.message);
// //             return res.status(400).json({ error: err.message });
// //         }
// //         next();
// //     });
// // }, sendMessage);
// //
// // router.post("/broadcast-livestream", protectRoute, broadcastLivestream);
// //
// // export default router;

import express from "express";
import multer from "multer";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getMessages,
    getUsersForSidebar,
    sendMessage,
    broadcastLivestream,
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
router.post("/broadcast-livestream", protectRoute, broadcastLivestream);
router.post("/peers", protectRoute, getPeersFromTracker);
export default router;