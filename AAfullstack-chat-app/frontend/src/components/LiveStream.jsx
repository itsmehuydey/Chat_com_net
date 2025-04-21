import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const LiveStream = () => {
    const { streamId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const messageInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [liveMessages, setLiveMessages] = useState([]);
    const [socketError, setSocketError] = useState(null);
    const streamRef = useRef(null);
    const hasJoined = useRef(false);
    const { livestream, startLivestream, joinLivestream, subscribeToLivestream, participantCount, currentUserId } = useChatStore();
    const { authUser, socket } = useAuthStore();
    const queryParams = new URLSearchParams(location.search);
    const userIdFromQuery = queryParams.get("userId");
    const isBroadcaster = !userIdFromQuery;

    const stopTracks = (stream) => {
        return new Promise((resolve) => {
            if (stream) {
                console.log("Stopping tracks...");
                const tracks = stream.getTracks();
                tracks.forEach((track) => {
                    track.stop();
                    console.log(`Track ${track.kind} stopped`);
                });
                resolve();
            } else {
                console.log("No stream to stop");
                resolve();
            }
        });
    };

    useEffect(() => {
        if (!socket) {
            console.error("Socket is not initialized in useAuthStore");
            setSocketError("Failed to connect to chat server. Please refresh the page or log in again.");
            return;
        }

        if (!socket.connected) {
            console.warn("Socket is not connected. Attempting to connect...");
            socket.connect();
        }

        const handleSocketConnect = () => {
            console.log("Socket connected:", socket.id);
            setSocketError(null);

            const unsubscribe = subscribeToLivestream();

            socket.on("livestreamEnded", async (data) => {
                if (data.streamId === streamId) {
                    console.log("Livestream ended by host, cleaning up...");
                    setIsJoined(false);
                    setIsStreaming(false);
                    setLiveMessages([]);

                    await stopTracks(streamRef.current);
                    streamRef.current = null;

                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                        videoRef.current.load();
                        console.log("Video source cleared and reloaded for viewer");
                    }

                    const peerConnection = useChatStore.getState().peerConnection;
                    if (peerConnection) {
                        peerConnection.close();
                        console.log("PeerConnection closed for viewer");
                    }

                    console.log("Navigating to home screen for viewer...");
                    navigate("/");
                }
            });

            socket.on("liveMessages", (messages) => {
                console.log("Received live messages:", messages);
                setLiveMessages(messages || []);
            });

            socket.on("newLiveMessage", (message) => {
                console.log("New live message received:", message);
                setLiveMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, message];
                    console.log("Updated liveMessages state:", updatedMessages);
                    return updatedMessages;
                });
            });

            if (!isBroadcaster && !hasJoined.current) {
                handleJoinStream();
            }
        };

        socket.on("connect", handleSocketConnect);

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            setSocketError("Failed to connect to chat server. Please try again later.");
        });

        return () => {
            console.log("Component unmounting, cleaning up resources...");
            const cleanup = async () => {
                await stopTracks(streamRef.current);
                streamRef.current = null;

                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                    videoRef.current.load();
                    console.log("Video source cleared on unmount");
                }

                const peerConnection = useChatStore.getState().peerConnection;
                if (peerConnection) {
                    peerConnection.close();
                    console.log("PeerConnection closed on unmount");
                }

                socket.off("connect", handleSocketConnect);
                socket.off("connect_error");
                socket.off("livestreamEnded");
                socket.off("liveMessages");
                socket.off("newLiveMessage");
                hasJoined.current = false;
                subscribeToLivestream()();
            };
            cleanup();
        };
    }, [streamId, subscribeToLivestream, navigate, socket, isBroadcaster]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [liveMessages]);

    const handleStartStream = async () => {
        if (!isBroadcaster || !socket.connected) return;

        try {
            await startLivestream(streamId);
            setIsStreaming(true);

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            console.log("Stream assigned to streamRef.current:", streamRef.current);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                console.log("Video source set for broadcaster");
            } else {
                console.error("Video ref is not available");
            }

            socket.emit("start-livestream", { streamId });
        } catch (error) {
            console.error("Error starting stream:", error);
        }
    };

    const handleJoinStream = async () => {
        if (isBroadcaster || hasJoined.current || !socket.connected) return;

        setIsJoined(true);
        hasJoined.current = true;

        await joinLivestream(streamId);

        const peerConnection = useChatStore.getState().peerConnection;
        if (peerConnection) {
            peerConnection.ontrack = (event) => {
                if (videoRef.current) {
                    console.log("Received stream from broadcaster, setting video source...");
                    const stream = event.streams[0];
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                    console.log("Stream assigned to streamRef.current for viewer:", streamRef.current);
                    videoRef.current.play().catch((error) => console.error("Error playing video:", error));
                }
            };
        }

        socket.emit("join-livestream", streamId);
        socket.emit("participantJoined", streamId);
    };

    const handleLeaveStream = async () => {
        if (isBroadcaster) return;

        console.log("Viewer leaving livestream:", streamId);

        await stopTracks(streamRef.current);
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.load();
            console.log("Video source cleared for viewer");
        }

        const peerConnection = useChatStore.getState().peerConnection;
        if (peerConnection) {
            peerConnection.close();
            console.log("PeerConnection closed for viewer");
        }

        setIsJoined(false);
        setLiveMessages([]);
        hasJoined.current = false;

        try {
            const response = await fetch("/api/messages/leave-livestream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ streamId }),
            });
            if (!response.ok) {
                throw new Error("Failed to leave livestream");
            }
            console.log("Successfully called leave-livestream API");
        } catch (error) {
            console.error("Error leaving livestream:", error);
        }

        socket.emit("participantLeft", streamId);

        console.log("Navigating to home screen for viewer...");
        navigate("/");
    };

    const stopStream = async (e) => {
        e.preventDefault();
        if (!isBroadcaster || !socket.connected) return;

        console.log("Host stopping livestream:", streamId);

        await stopTracks(streamRef.current);
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.load();
            console.log("Video source cleared and reloaded for host");
        }

        const peerConnection = useChatStore.getState().peerConnection;
        if (peerConnection) {
            peerConnection.close();
            console.log("PeerConnection closed for host");
        }

        setIsStreaming(false);
        setIsJoined(false);
        setLiveMessages([]);
        hasJoined.current = false;

        try {
            const response = await fetch("/api/messages/end-livestream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ streamId }),
            });
            if (!response.ok) {
                throw new Error("Failed to end livestream");
            }
            console.log("Successfully called end-livestream API");
        } catch (error) {
            console.error("Error stopping livestream:", error);
        }

        socket.emit("livestreamEnded", { streamId });

        console.log("Navigating to home screen for host...");
        navigate("/");
    };

    const handleSendMessage = () => {
        if (!socket || !socket.connected) {
            console.error("Cannot send message: Socket is not connected");
            setSocketError("Cannot send message: Chat server is not connected.");
            return;
        }

        if (!isBroadcaster && !isJoined) {
            console.log("Cannot send message: Not joined (viewer)");
            return;
        }

        if (isBroadcaster && !isStreaming) {
            console.log("Cannot send message: Livestream not started (broadcaster)");
            return;
        }

        const message = messageInputRef.current.value.trim();
        if (message) {
            console.log("Sending message:", message, "to streamId:", streamId);
            socket.emit("sendLiveMessage", { streamId, message, senderId: authUser?._id || currentUserId || "Host" });
            messageInputRef.current.value = "";
        } else {
            console.log("Message is empty, not sending");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-12 px-4">
            <div className="bg-gray-800 text-white rounded-lg w-full max-w-5xl flex flex-col md:flex-row gap-6 p-6">
                <div className="flex-1 flex flex-col gap-4">
                    <h2 className="text-3xl font-bold text-center">Livestream {streamId}</h2>
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <p><span className="font-semibold">Participants:</span> {participantCount}</p>
                            <p><span className="font-semibold">User ID:</span> {userIdFromQuery || currentUserId || "Host"}</p>
                            <p><span className="font-semibold">Role:</span> {isBroadcaster ? "Broadcaster" : "Viewer"}</p>
                        </div>
                    </div>
                    {socketError && (
                        <div className="text-red-500 text-center p-2">
                            {socketError}
                        </div>
                    )}
                    <div className="flex justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full max-w-3xl rounded-md"
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {isBroadcaster && participantCount === 0 && !isStreaming && (
                            <button
                                onClick={handleStartStream}
                                className="bg-blue-600 text-white py-2 px-6 rounded"
                            >
                                Start Livestream
                            </button>
                        )}
                        {isBroadcaster && isStreaming && (
                            <button
                                onClick={stopStream}
                                className="bg-red-600 text-white py-2 px-6 rounded"
                            >
                                Stop Livestream
                            </button>
                        )}
                        {!isBroadcaster && !isJoined && (
                            <button
                                onClick={handleJoinStream}
                                className="bg-green-600 text-white py-2 px-6 rounded"
                            >
                                Join Livestream
                            </button>
                        )}
                        {!isBroadcaster && isJoined && (
                            <button
                                onClick={handleLeaveStream}
                                className="bg-red-600 text-white py-2 px-6 rounded"
                            >
                                Leave Livestream
                            </button>
                        )}
                    </div>
                    {livestream && !isStreaming && !isJoined && !isBroadcaster && (
                        <div className="text-center">
                            <p className="mb-2">{livestream.message}</p>
                            <button
                                onClick={handleJoinStream}
                                className="bg-green-600 text-white py-2 px-6 rounded"
                            >
                                Join Livestream
                            </button>
                        </div>
                    )}
                </div>
                {(isStreaming || isJoined) && (
                    <div className="w-full md:w-80 bg-gray-700 p-4 rounded-lg flex flex-col gap-3 h-full">
                        <h3 className="text-xl font-semibold">Live Chat</h3>
                        <div className="flex-1 overflow-y-auto bg-gray-800 p-2 rounded">
                            {liveMessages.length === 0 ? (
                                <p className="text-gray-400">No messages yet, you can join the chat below...</p>
                            ) : (
                                liveMessages.map((msg, index) => (
                                    <div key={index} className="mb-2">
                                        <span className="text-gray-400 text-sm">
                                            [{new Date(msg.timestamp).toLocaleTimeString()}]{" "}
                                        </span>
                                        <span className="font-semibold text-blue-300">{msg.senderId}: </span>
                                        <span>{msg.text}</span>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="flex gap-2">
                            <input
                                ref={messageInputRef}
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 p-2 rounded bg-gray-600 text-white"
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-blue-600 text-white py-2 px-4 rounded"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveStream;