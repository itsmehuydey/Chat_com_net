// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";
//
// export const useChatStore = create((set, get) => ({
//   messages: [],
//   users: [],
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,
//   peers: [],
//   livestream: null,
//   peerConnection: null,
//   participantCount: 0,
//   currentUserId: null,
//
//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to fetch users");
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },
//
//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       const updatedMessages = res.data.map((message) => {
//         if (message.file) {
//           return {
//             ...message,
//             file: message.file.replace('/auto/upload/', '/image/upload/'),
//           };
//         }
//         return message;
//       });
//       set({ messages: updatedMessages });
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to fetch messages");
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },
//
//   sendMessage: async (formData) => {
//     const { selectedUser, messages } = get();
//     try {
//       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       const updatedMessage = {
//         ...res.data,
//         file: res.data.file ? res.data.file.replace('/auto/upload/', '/image/upload/') : null,
//       };
//       set({ messages: [...messages, updatedMessage] });
//     } catch (error) {
//       throw new Error(error.response?.data?.message || "Failed to send message");
//     }
//   },
//
//   subscribeToMessages: () => {
//     const { selectedUser } = get();
//     if (!selectedUser) return;
//
//     const socket = useAuthStore.getState().socket;
//
//     socket.on("newMessage", (newMessage) => {
//       const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
//       if (!isMessageSentFromSelectedUser) return;
//
//       const updatedMessage = {
//         ...newMessage,
//         file: newMessage.file ? newMessage.file.replace('/auto/upload/', '/image/upload/') : null,
//       };
//
//       set({
//         messages: [...get().messages, updatedMessage],
//       });
//     });
//   },
//
//   unsubscribeFromMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     socket.off("newMessage");
//   },
//
//   setSelectedUser: (selectedUser) => set({ selectedUser }),
//
//   getPeersFromTracker: async (torrentFilePath) => {
//     try {
//       const res = await axiosInstance.post("/messages/peers", { torrentFilePath });
//       set({ peers: res.data });
//       return res.data;
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to fetch peers");
//       throw error;
//     }
//   },
//
//   subscribeToLivestream: () => {
//     const socket = useAuthStore.getState().socket;
//     socket.on("livestreamNotification", (notification) => {
//       toast.success(notification.message, {
//         duration: 5000,
//       });
//       set({ livestream: notification, currentUserId: notification.userId });
//     });
//
//     socket.on("participant-update", (count) => {
//       set({ participantCount: count });
//     });
//
//     socket.on("participantJoined", () => {
//       set((state) => ({ participantCount: state.participantCount + 1 }));
//     });
//
//     socket.on("participantLeft", () => {
//       set((state) => ({ participantCount: Math.max(0, state.participantCount - 1) }));
//     });
//
//     return () => {
//       socket.off("livestreamNotification");
//       socket.off("participant-update");
//       socket.off("participantJoined");
//       socket.off("participantLeft");
//     };
//   },
//
//   joinLivestream: async (streamId) => {
//     const socket = useAuthStore.getState().socket;
//
//     socket.emit("join-livestream", streamId);
//
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });
//
//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("ice-candidate", {
//           streamId,
//           candidate: event.candidate,
//           targetId: get().livestream?.streamerId,
//         });
//       }
//     };
//
//     socket.on("receive-stream", async ({ offer, streamerId }) => {
//       await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await peerConnection.createAnswer();
//       await peerConnection.setLocalDescription(answer);
//       socket.emit("answer-stream", { streamId, answer, streamerId });
//     });
//
//     socket.on("ice-candidate", ({ candidate }) => {
//       peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
//     });
//
//     set({ peerConnection });
//   },
//
//   startLivestream: async (streamId) => {
//     const socket = useAuthStore.getState().socket;
//
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });
//
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//     stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
//
//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("ice-candidate", {
//           streamId,
//           candidate: event.candidate,
//           targetId: null,
//         });
//       }
//     };
//
//     const offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);
//
//     socket.emit("start-livestream", { streamId, offer });
//
//     socket.on("receive-answer", async ({ answer }) => {
//       await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
//     });
//
//     socket.on("ice-candidate", ({ candidate }) => {
//       peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
//     });
//
//     set({ peerConnection, livestream: { streamId, streamerId: socket.id } });
//
//     await axiosInstance.post("/messages/broadcast-livestream", { streamId });
//   },
// }));

// File: src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  peers: [],
  livestream: null,
  peerConnection: null,
  participantCount: 0,
  currentUserId: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    try {
      const res = await axiosInstance.get("/messages/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const updatedMessages = res.data.map((message) => {
        if (message.file) {
          return {
            ...message,
            file: message.file.replace('/auto/upload/', '/image/upload/'),
          };
        }
        return message;
      });
      set({ messages: updatedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/group/${groupId}`);
      const updatedMessages = res.data.map((message) => {
        if (message.file) {
          return {
            ...message,
            file: message.file.replace('/auto/upload/', '/image/upload/'),
          };
        }
        return message;
      });
      set({ messages: updatedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (formData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const updatedMessage = {
        ...res.data,
        file: res.data.file ? res.data.file.replace('/auto/upload/', '/image/upload/') : null,
      };
      set({ messages: [...messages, updatedMessage] });
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to send message");
    }
  },

  sendGroupMessage: async (formData) => {
    const { selectedGroup, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/group/send/${selectedGroup._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const updatedMessage = {
        ...res.data,
        file: res.data.file ? res.data.file.replace('/auto/upload/', '/image/upload/') : null,
      };
      set({ messages: [...messages, updatedMessage] });
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to send group message");
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/messages/create-group", groupData);
      set((state) => ({
        groups: [...state.groups, res.data],
      }));
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create group");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    socket.on("newMessage", (newMessage) => {
      const { messages } = get();
      const isMessageForCurrentChat =
          (newMessage.senderId === authUser._id && newMessage.receiverId === get().selectedUser?._id) ||
          (newMessage.senderId === get().selectedUser?._id && newMessage.receiverId === authUser._id);

      if (!isMessageForCurrentChat) return;

      const updatedMessage = {
        ...newMessage,
        file: newMessage.file ? newMessage.file.replace('/auto/upload/', '/image/upload/') : null,
      };

      set({
        messages: [...messages, updatedMessage],
      });
    });
  },

  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newGroupMessage", (newMessage) => {
      const isMessageFromSelectedGroup = newMessage.groupId === selectedGroup._id;
      if (!isMessageFromSelectedGroup) return;

      const updatedMessage = {
        ...newMessage,
        file: newMessage.file ? newMessage.file.replace('/auto/upload/', '/image/upload/') : null,
      };

      set({
        messages: [...get().messages, updatedMessage],
      });
    });

    socket.on("groupCreated", (newGroup) => {
      set((state) => ({
        groups: [...state.groups, newGroup],
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newGroupMessage");
    socket.off("groupCreated");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, selectedGroup: null }),

  setSelectedGroup: (selectedGroup) => set({ selectedGroup, selectedUser: null }),

  getPeersFromTracker: async (torrentFilePath) => {
    try {
      const res = await axiosInstance.post("/messages/peers", { torrentFilePath });
      set({ peers: res.data });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch peers");
      throw error;
    }
  },

  subscribeToLivestream: () => {
    const socket = useAuthStore.getState().socket;
    socket.on("livestreamNotification", (notification) => {
      toast.success("Livestream started! Join here: " + notification.streamLink, {
        duration: 5000,
      });
      set({ livestream: notification, currentUserId: notification.userId });
    });

    socket.on("participant-update", (count) => {
      set({ participantCount: count });
    });

    socket.on("participantJoined", () => {
      set((state) => ({ participantCount: state.participantCount + 1 }));
    });

    socket.on("participantLeft", () => {
      set((state) => ({ participantCount: Math.max(0, state.participantCount - 1) }));
    });

    return () => {
      socket.off("livestreamNotification");
      socket.off("participant-update");
      socket.off("participantJoined");
      socket.off("participantLeft");
    };
  },

  joinLivestream: async (streamId) => {
    const socket = useAuthStore.getState().socket;

    socket.emit("join-livestream", streamId);

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          streamId,
          candidate: event.candidate,
          targetId: get().livestream?.streamerId,
        });
      }
    };

    socket.on("receive-stream", async ({ offer, streamerId }) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer-stream", { streamId, answer, streamerId });
    });

    socket.on("ice-candidate", ({ candidate }) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    set({ peerConnection });
  },

  startLivestream: async (streamId) => {
    const socket = useAuthStore.getState().socket;

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          streamId,
          candidate: event.candidate,
          targetId: null,
        });
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("start-livestream", { streamId, offer });

    socket.on("receive-answer", async ({ answer }) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", ({ candidate }) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    set({ peerConnection, livestream: { streamId, streamerId: socket.id } });

    await axiosInstance.post("/messages/broadcast-livestream", { streamId });
  },
}));