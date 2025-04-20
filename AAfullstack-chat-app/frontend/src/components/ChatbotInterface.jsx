import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import toast from "react-hot-toast";

const ChatbotInterface = ({ onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        console.log("ChatbotInterface mounted");
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:5001/gemini", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: input,
                    history: messages,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response from Gemini API");
            }

            const data = await response.json();
            const botMessage = { role: "assistant", content: data.response };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            toast.error("Failed to get response from chatbot");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">AI Chatbot</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-700 p-6 rounded-lg m-6">
                    {messages.length === 0 && (
                        <p className="text-gray-400 text-center text-lg">Start chatting with the AI!</p>
                    )}
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-4 p-3 rounded-lg ${
                                msg.role === "user" ? "bg-blue-600 ml-auto max-w-[80%]" : "bg-gray-600 max-w-[80%]"
                            }`}
                        >
                            <span className="text-base">{msg.content}</span>
                        </div>
                    ))}
                    {isLoading && <div className="text-gray-400 italic text-base">Bot: Typing...</div>}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-6 flex gap-3 bg-gray-800 border-t border-gray-700">
                    <input
                        type="text"
                        className="flex-1 p-3 rounded-lg bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                        disabled={isLoading || !input.trim()}
                    >
                        <Send size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotInterface;