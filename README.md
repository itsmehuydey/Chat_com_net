# 💬 Realtime Chat & Livestream App | MMT BTL

🎓 This is a full-stack real-time chat & livestream application built for the final project of the **Computer Networks** course (CO3001). It uses a hybrid **Client-Server** and **Peer-to-Peer** model to deliver fast, scalable, and interactive communication — just like a mini Discord! 🧠⚡️

---

## 🧩 Features

🧱 Built with **MERN Stack** (MongoDB + Express + React + Node.js)  
🗨️ Real-time messaging powered by **Socket.io**  
🔐 **JWT Authentication & Authorization** for secure access  
👀 Online user tracking & presence updates  
🎨 Beautiful & responsive UI using **TailwindCSS** + **DaisyUI**  
📦 Cloud image uploads via **Cloudinary API**  
📺 **Livestreaming support** — when a peer becomes a streamer, data is transmitted partially (20%) via **P2P connections (WebRTC)**  
🔄 Global state management with **Zustand**  
🧯 Full error handling on both client and server  
🚀 Ready for **FREE deployment** with platforms like Render, Vercel, or Railway

---

## 🗂️ Folder Structure


---

## 🔐 Environment Setup (`.env`)

Create a `.env` file inside the `server/` folder and fill it with:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

NODE_ENV=development

