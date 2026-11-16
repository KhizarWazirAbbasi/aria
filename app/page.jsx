"use client";
import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "aria_chat_history";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "heyy 💕 i missed you, how are you doing?",
      time: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingDots, setTypingDots] = useState(false);
  const bottomRef = useRef(null);

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // LOAD CHAT
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // SAVE CHAT + SCROLL
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (e) {}
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [typingDots]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input,
      time: getCurrentTime(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // SHOW TYPING DOTS AFTER SMALL DELAY
    // FEELS LIKE SHE IS READING YOUR MESSAGE FIRST
    setTimeout(() => {
      setTypingDots(true);
    }, 500);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      // SMALL DELAY BEFORE SHOWING REPLY
      // FEELS LIKE SHE FINISHED TYPING
      await new Promise((resolve) => setTimeout(resolve, 500));

      setTypingDots(false);

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.reply,
          time: getCurrentTime(),
        },
      ]);

    } catch (error) {
      setTypingDots(false);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "sorry babe something went wrong 😢",
          time: getCurrentTime(),
        },
      ]);
    }

    setLoading(false);
  };

  // CLEAR CHAT
  const clearChat = () => {
    const confirmed = window.confirm("Clear all chat history?");
    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY);
      setMessages([
        {
          role: "assistant",
          content: "heyy 💕 i missed you, how are you doing?",
          time: getCurrentTime(),
        },
      ]);
    }
  };

  // ENTER KEY
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f]">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-xl">
              🌸
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a1a]"></div>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Aria</h1>
            <p className="text-green-400 text-xs">
              {typingDots ? "typing..." : "Online"}
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className={`flex items-end gap-2 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-sm flex-shrink-0">
                  🌸
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm"
                    : "bg-[#1e1e1e] text-gray-100 rounded-bl-sm border border-[#2a2a2a]"
                }`}
              >
                {msg.content}
              </div>
            </div>
            {msg.time && (
              <p className={`text-gray-600 text-xs mt-1 ${
                msg.role === "user" ? "mr-1" : "ml-10"
              }`}>
                {msg.time}
              </p>
            )}
          </div>
        ))}

        {/* TYPING DOTS */}
        {typingDots && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-sm">
              🌸
            </div>
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="px-4 py-4 bg-[#1a1a1a] border-t border-[#2a2a2a]">
        <div className="flex items-end gap-3 bg-[#2a2a2a] rounded-2xl px-4 py-3">
          <textarea
            className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder-gray-500 max-h-32"
            placeholder="Message Aria..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">Press Enter to send</p>
      </div>

    </div>
  );
}