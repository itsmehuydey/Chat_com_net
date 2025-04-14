import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const LiveStream = () => {
    const { streamId } = useParams();
    const videoRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [socket, setSocket] = useState(null);
    const peerConnection = useRef(null);
    const streamRef = useRef(null); // Lưu stream để dừng webcam
    const navigate = useNavigate();

    useEffect(() => {
        const socketInstance = io("http://localhost:5001");
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
            console.log("Connected to socket for livestream");
            socketInstance.emit("join-stream", streamId);
        });

        socketInstance.on("receive-stream", async (offer) => {
            if (!peerConnection.current) {
                peerConnection.current = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });

                peerConnection.current.ontrack = (event) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = event.streams[0];
                    }
                };

                peerConnection.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketInstance.emit("ice-candidate", {
                            streamId,
                            candidate: event.candidate,
                        });
                    }
                };
            }

            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socketInstance.emit("answer-stream", { streamId, answer });
        });

        socketInstance.on("ice-candidate", async (candidate) => {
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        return () => {
            socketInstance.disconnect();
            if (peerConnection.current) {
                peerConnection.current.close();
            }
        };
    }, [streamId]);

    const startStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream; // Lưu stream để dừng sau
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            peerConnection.current = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });

            stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice-candidate", { streamId, candidate: event.candidate });
                }
            };

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit("start-stream", { streamId, offer });

            setIsStreaming(true);
        } catch (error) {
            console.error("Error starting stream:", error);
        }
    };

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop()); // Dừng webcam
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (socket) {
            socket.disconnect();
        }
        setIsStreaming(false);
        navigate("/"); // Quay lại trang chính
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl mb-4">Livestream {streamId}</h2>
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-md border" />
            <div className="mt-4 flex gap-2">
                {!isStreaming ? (
                    <button onClick={startStream} className="btn btn-primary">
                        Start Livestream
                    </button>
                ) : (
                    <button onClick={stopStream} className="btn btn-error">
                        Stop Livestream
                    </button>
                )}
            </div>
        </div>
    );
};

export default LiveStream;