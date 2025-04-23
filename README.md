# 💬 Realtime Chat & Livestream App | MMT BTL

🎓 This is a full-stack real-time chat & livestream application built for the final project of the **Computer Networks** course (CO3001). It uses a hybrid **Client-Server** and **Peer-to-Peer** model to deliver fast, scalable, and interactive communication — just like a mini Discord! 🧠⚡️

---

## 🧩 Features

🧱 Built with **MERN Stack** (MongoDB + Express + React + Node.js)  
🗨️ Real-time messaging powered by **Socket.io**  
🔐 **JWT Authentication & Authorization** for secure access  
👀 Online user tracking & presence updates  
🎨 Beautiful & responsive UI using **TailwindCSS** + **DaisyUI**  
📦 Cloud image/file uploads via **Cloudinary API**  
📺 **Livestreaming support** — when a peer becomes a streamer, data is transmitted partially via **P2P connections (WebRTC)**  
🔄 Global state management with **Zustand**  
🧯 Full error handling on both client and server  
🚀 Ready for **FREE deployment** with platforms like Render, Vercel, or Railway

---

## 🗂️ Folder Structure
AAfullstack-chat-app/

├── backend/

│   └── .env

└── frontend/



---

## 🔐 Environment Setup (`.env`)

Create a `.env` file inside the `server/` folder and fill it with:

```env
MONGODB_URI=
PORT=5001
VITE_SERVER_HOST=
VITE_CLIENT_HOST=
JWT_SECRET=
GOOGLE_GEN_AI_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NODE_ENV=development
VITE_SERVER_PORT=5001
VITE_CLIENT_PORT=5173
```
## 🟢 Execute client frontend 
```Execute client
npm install or npm install --legacy-peer-deep
npm run or npm run dev
```

## 🟢 Execute server backend
```Execute server
npm install or npm install --legacy-peer-deep
npm start or npm start dev
```

## 📌 Reference
MERN Stack Project: Realtime Chat App Tutorial - React.js & Socket.io via link: https://youtu.be/ntKkVrQqBYY?si=oKPrsLAlNoTes0-c

