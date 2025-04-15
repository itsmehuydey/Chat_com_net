import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { io } from "socket.io-client";

const LiveStream = () => {
    const { streamId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const streamRef = useRef(null);
    const hasJoined = useRef(false);
    const { livestream, startLivestream, joinLivestream, subscribeToLivestream, participantCount, currentUserId } = useChatStore();

    const socket = io("http://localhost:5000");

    const queryParams = new URLSearchParams(location.search);
    const userIdFromQuery = queryParams.get("userId");
    const isBroadcaster = !userIdFromQuery;

    useEffect(() => {
        const unsubscribe = subscribeToLivestream();

        socket.on("livestreamEnded", (data) => {
            if (data.streamId === streamId) {
                setIsJoined(false);
                setIsStreaming(false);
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
                const peerConnection = useChatStore.getState().peerConnection;
                if (peerConnection) {
                    peerConnection.close();
                }
                navigate("/chat");
            }
        });

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            const peerConnection = useChatStore.getState().peerConnection;
            if (peerConnection) {
                peerConnection.close();
            }
            socket.off("livestreamEnded");
            hasJoined.current = false;
            unsubscribe();
        };
    }, [streamId, subscribeToLivestream, navigate, socket]);

    const handleStartStream = async () => {
        if (!isBroadcaster) return;

        try {
            await startLivestream(streamId);
            setIsStreaming(true);

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("Error starting stream:", error);
        }
    };

    const handleJoinStream = () => {
        if (isBroadcaster || hasJoined.current) return;

        setIsJoined(true);
        hasJoined.current = true;

        joinLivestream(streamId);

        const peerConnection = useChatStore.getState().peerConnection;
        if (peerConnection) {
            peerConnection.ontrack = (event) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0];
                    videoRef.current.play().catch((error) => console.error("Error playing video:", error));
                }
            };
        }

        socket.emit("participantJoined", streamId);
    };

    const handleLeaveStream = async () => {
        if (isBroadcaster) return;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        const peerConnection = useChatStore.getState().peerConnection;
        if (peerConnection) {
            peerConnection.close();
        }
        setIsJoined(false);
        hasJoined.current = false;

        await fetch("/api/messages/leave-livestream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ streamId }),
        });

        socket.emit("participantLeft", streamId);
        navigate("/chat");
    };

    const stopStream = async () => {
        if (!isBroadcaster) return;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        const peerConnection = useChatStore.getState().peerConnection;
        if (peerConnection) {
            peerConnection.close();
        }
        setIsStreaming(false);
        setIsJoined(false);
        hasJoined.current = false;

        await fetch("/api/messages/end-livestream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ streamId }),
        });

        socket.emit("livestreamEnded", { streamId });

        navigate("/chat");
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <h2 className="text-3xl font-bold text-center mb-4">Livestream {streamId}</h2>
                <div className="space-y-2 mb-4">
                    <div className="bg-gray-700 p-4 rounded-lg mb-4">
                        <p className="text-center text-lg">
                            <span className="font-semibold">Participants:</span> {participantCount}
                        </p>
                        <p className="text-center text-lg">
                            <span className="font-semibold">User ID:</span>{" "}
                            {userIdFromQuery || currentUserId || "Unknown"}
                        </p>
                        <p className="text-center text-lg">
                            <span className="font-semibold">Role:</span>{" "}
                            {isBroadcaster ? "Broadcaster" : "Viewer"}
                        </p>
                    </div>
                </div>
                <div className="flex justify-center mb-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md rounded-md border border-gray-600"
                    />
                </div>
                <div className="flex justify-center gap-3 mb-4">
                    {isBroadcaster && participantCount === 0 && !isStreaming && (
                        <button
                            onClick={handleStartStream}
                            className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Start Livestream
                        </button>
                    )}
                    {isBroadcaster && isStreaming && (
                        <button
                            onClick={stopStream}
                            className="btn btn-error bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Stop Livestream
                        </button>
                    )}
                    {!isBroadcaster && !isJoined && (
                        <button
                            onClick={handleJoinStream}
                            className="btn btn-success bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Join Livestream
                        </button>
                    )}
                    {!isBroadcaster && isJoined && (
                        <button
                            onClick={handleLeaveStream}
                            className="btn btn-error bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Leave Livestream
                        </button>
                    )}
                </div>
                {livestream && !isStreaming && !isJoined && !isBroadcaster && (
                    <div className="text-center">
                        <p className="text-lg mb-2">{livestream.message}</p>
                        <button
                            onClick={handleJoinStream}
                            className="btn btn-success bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Join Livestream
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveStream;