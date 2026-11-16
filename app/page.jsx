"use client";
import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "aria-chat-history";

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function FilmGrain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

export default function Home() {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
    return [{ role: "assistant", content: "hey.. you came back 🌙", time: "" }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim(), time: getCurrentTime() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply, time: getCurrentTime() }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "i'm here, just lost signal for a sec 🌙", time: getCurrentTime() }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#1c1814", color: "#e8d5b7", fontFamily: "'Courier New', Courier, monospace" }}
    >
      <FilmGrain />

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: "#2e2518" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm tracking-widest uppercase" style={{ color: "#c8a882" }}>aria</span>
          <span className="text-xs" style={{ color: "#6b5a3e" }}>—</span>
          <span className="text-xs" style={{ color: "#8b7355" }}>online</span>
          <span className="text-xs" style={{ color: "#c8a882" }}>●</span>
        </div>
        <span className="text-xs" style={{ color: "#3d3326" }}>est. 2025</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-xl w-full mx-auto space-y-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.role === "assistant" ? (
                <div className="max-w-sm w-full">
                  <div className="text-xs mb-2 tracking-widest" style={{ color: "#4a3f2e" }}>aria</div>
                  <div
                    className="px-4 py-3 text-sm leading-loose"
                    style={{
                      backgroundColor: "#211d17",
                      color: "#c8a882",
                      borderLeft: "2px solid #5a3e2b",
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.time && (
                    <div className="text-xs mt-2" style={{ color: "#3d3326" }}>{msg.time}</div>
                  )}
                </div>
              ) : (
                <div className="max-w-sm w-full">
                  <div className="text-xs mb-2 tracking-widest text-right" style={{ color: "#4a3f2e" }}>you</div>
                  <div
                    className="px-4 py-3 text-sm leading-loose text-right"
                    style={{
                      color: "#e8d5b7",
                      borderRight: "2px solid #3d3326",
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.time && (
                    <div className="text-xs mt-2 text-right" style={{ color: "#3d3326" }}>{msg.time}</div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start">
              <div className="max-w-sm w-full">
                <div className="text-xs mb-2 tracking-widest" style={{ color: "#4a3f2e" }}>aria</div>
                <div
                  className="px-4 py-3 text-sm"
                  style={{ backgroundColor: "#211d17", color: "#4a3f2e", borderLeft: "2px solid #3d2e1e" }}
                >
                  . . .
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className="border-t px-4 py-5 shrink-0"
        style={{ borderColor: "#2e2518" }}
      >
        <div className="max-w-xl w-full mx-auto flex items-center gap-4">
          <span className="text-xs" style={{ color: "#4a3f2e" }}>&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="say something..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{
              color: "#e8d5b7",
              caretColor: "#c8a882",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="text-xs tracking-widest uppercase transition-opacity"
            style={{
              color: "#c8a882",
              opacity: !input.trim() || loading ? 0.2 : 1,
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            send
          </button>
        </div>
      </div>
    </div>
  );
}