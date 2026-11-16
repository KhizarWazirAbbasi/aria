"use client";
import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "aria-chat-history";

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [blink, setBlink] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(interval);
  }, []);

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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#0A090E",
      color: "#DCCFB8",
      fontFamily: "'Courier New', Courier, monospace",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* CRT Scanlines */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.18) 1px, rgba(0,0,0,0.18) 2px)",
        backgroundSize: "100% 2px",
      }} />

      {/* CRT Vignette */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 11,
        pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
      }} />

      {/* Flicker animation */}
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.94; }
          94% { opacity: 1; }
          96% { opacity: 0.97; }
          97% { opacity: 1; }
        }
        .crt-flicker {
          animation: flicker 8s infinite;
        }
        @keyframes phosphor {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-enter {
          animation: phosphor 0.3s ease-out forwards;
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="crt-flicker" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #1e1a14",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              color: "#D9A36A",
              fontSize: "13px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              textShadow: "0 0 8px rgba(217,163,106,0.6), 0 0 20px rgba(217,163,106,0.2)",
            }}>aria</span>
            <span style={{ color: "#3d3326", fontSize: "11px" }}>—</span>
            <span style={{ color: "#6b5a3e", fontSize: "11px" }}>online</span>
            <span style={{
              color: "#D9A36A",
              fontSize: "11px",
              opacity: blink ? 1 : 0,
              textShadow: "0 0 6px rgba(217,163,106,0.8)",
              transition: "opacity 0.1s",
            }}>▌</span>
          </div>
          <span style={{ color: "#1e1a14", fontSize: "10px", letterSpacing: "0.15em" }}>v1.0</span>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "40px 16px",
          scrollbarWidth: "none",
        }}>
          <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
            {messages.map((msg, i) => (
              <div key={i} className="msg-enter" style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                {msg.role === "assistant" ? (
                  <div style={{ maxWidth: "420px", width: "100%" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#3d3326", marginBottom: "8px", textTransform: "uppercase" }}>aria</div>
                    <div style={{
                      padding: "12px 16px",
                      fontSize: "13px",
                      lineHeight: "1.9",
                      color: "#D9A36A",
                      backgroundColor: "#0f0d0a",
                      borderLeft: "2px solid #4C3427",
                      textShadow: "0 0 10px rgba(217,163,106,0.35)",
                    }}>
                      {msg.content}
                    </div>
                    {msg.time && <div style={{ fontSize: "10px", color: "#1e1a14", marginTop: "6px" }}>{msg.time}</div>}
                  </div>
                ) : (
                  <div style={{ maxWidth: "420px", width: "100%" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#2a2318", marginBottom: "8px", textTransform: "uppercase", textAlign: "right" }}>you</div>
                    <div style={{
                      padding: "12px 16px",
                      fontSize: "13px",
                      lineHeight: "1.9",
                      color: "#DCCFB8",
                      textAlign: "right",
                      borderRight: "2px solid #2a2318",
                    }}>
                      {msg.content}
                    </div>
                    {msg.time && <div style={{ fontSize: "10px", color: "#1e1a14", marginTop: "6px", textAlign: "right" }}>{msg.time}</div>}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="msg-enter" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ maxWidth: "420px", width: "100%" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#3d3326", marginBottom: "8px", textTransform: "uppercase" }}>aria</div>
                  <div style={{
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "#3d3326",
                    backgroundColor: "#0f0d0a",
                    borderLeft: "2px solid #2a1f14",
                    textShadow: "0 0 8px rgba(61,51,38,0.5)",
                  }}>. . .</div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{
          borderTop: "1px solid #1e1a14",
          padding: "20px 16px",
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#3d3326", fontSize: "13px" }}>›</span>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="say something..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "#DCCFB8",
                caretColor: "#D9A36A",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                background: "none",
                border: "none",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#D9A36A",
                fontFamily: "'Courier New', Courier, monospace",
                cursor: !input.trim() || loading ? "default" : "pointer",
                opacity: !input.trim() || loading ? 0.15 : 0.8,
                textShadow: !input.trim() || loading ? "none" : "0 0 8px rgba(217,163,106,0.5)",
                transition: "opacity 0.2s",
                padding: 0,
              }}
            >send</button>
          </div>
        </div>

      </div>
    </div>
  );
}