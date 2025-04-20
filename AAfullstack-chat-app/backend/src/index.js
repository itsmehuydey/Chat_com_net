//
// import express from "express";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import cors from "cors";
// import path from "path";
// import { connectDB } from "./lib/db.js";
// import authRoutes from "./routes/auth.route.js";
// import messageRoutes from "./routes/message.route.js";
// import { app, server } from "./lib/socket.js";
//
// // Tải dotenv với đường dẫn cụ thể
// dotenv.config({ path: path.resolve(process.cwd(), ".env") });
//
// console.log("Loaded environment variables:", {
//     CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
//     CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
//     CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "[REDACTED]" : undefined,
// });
//
// const PORT = process.env.PORT || 5001; // Đảm bảo PORT khớp với BASE_URL trong useAuthStore.js
// const __dirname = path.resolve();
//
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(cookieParser());
// app.use(
//     cors({
//         origin: "http://localhost:5173",
//         credentials: true,
//     })
// );
//
// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);
//
// // Serve frontend in production
// if (process.env.NODE_ENV === "production") {
//     app.use(express.static(path.join(__dirname, "../frontend/dist")));
//
//     app.get("*", (req, res) => {
//         res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//     });
// }
//
// // Start server and connect to database
// server.listen(PORT, () => {
//     console.log("server is running on PORT:" + PORT);
//     connectDB();
// });

// File: index.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Tải dotenv với đường dẫn cụ thể
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("Loaded environment variables:", {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "[REDACTED]" : undefined,
    GOOGLE_GEN_AI_KEY: process.env.GOOGLE_GEN_AI_KEY ? "[REDACTED]" : undefined,
});

const PORT = process.env.PORT || 5001; // Đảm bảo PORT khớp với BASE_URL trong useAuthStore.js
const __dirname = path.resolve();

// Khởi tạo Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Gemini API endpoint
app.post("/gemini", async (req, res) => {
    try {
        const { message, history } = req.body;

        const chat = model.startChat({
            history: history.map((msg) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
            })),
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        console.error("Error with Gemini API:", error);
        res.status(500).json({ error: "Failed to get response from Gemini API" });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

// Start server and connect to database
server.listen(PORT, () => {
    console.log("Server is running on PORT:" + PORT);
    connectDB();
});