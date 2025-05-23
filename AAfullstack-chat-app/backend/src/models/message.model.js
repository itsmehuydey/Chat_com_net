//
// import mongoose from "mongoose";
//
// const messageSchema = new mongoose.Schema(
//     {
//         senderId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         receiverId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         text: {
//             type: String,
//         },
//         file: {
//             type: String,
//         },
//         fileName: { // Thêm trường để lưu tên file gốc
//             type: String,
//         },
//     },
//     { timestamps: true }
// );
//
// const Message = mongoose.model("Message", messageSchema);
//
// export default Message;

// File: src/models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        },
        text: {
            type: String,
        },
        file: {
            type: String,
        },
        fileName: {
            type: String,
        },
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;