"use client";
import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "aria-messages";

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 2 && h < 5) return "can't sleep either? 🌙";
  if (h >= 5 && h < 12) return "you're up early... thinking of me? ☀️";
  if (h >= 12 && h < 18) return "hey you. i was wondering when you'd show up";
  if (h >= 18 && h < 22) return "hey. i missed you tonight";
  return "it's late. glad you're here 🌙";
}

function playBlip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = [520, 660, 580];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.2);
    });
  } catch {}
}

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "", time: "" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const originalTitle = useRef("aria");

  // Load saved messages OR set time-aware greeting
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) { setMessages(parsed); return; }
      } catch {}
    }
    setMessages([{ role: "assistant", content: getGreeting(), time: getCurrentTime() }]);
  }, []);

  // Fix empty time on first message (hydration safe)
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i === 0 && m.time === "") return { ...m, time: getCurrentTime() };
        if (i === 0 && m.content === "") return { ...m, content: getGreeting(), time: getCurrentTime() };
        return m;
      })
    );
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0 && messages[0].content !== "") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  // Tab title notification
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        document.title = originalTitle.current;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim(), time: getCurrentTime() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      const reply = data.reply || "hey, you okay? 🥺";

      // Fake typing delay — longer reply = longer wait
      const delay = Math.min(600 + reply.length * 12, 1800);
      await new Promise((r) => setTimeout(r, delay));

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, time: getCurrentTime() },
      ]);
      playBlip();

      // Tab notification if user is away
      if (document.visibilityState === "hidden") {
        document.title = "💬 aria is thinking of you...";
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "i got disconnected... come back 🥺", time: getCurrentTime() },
      ]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const fresh = [{ role: "assistant", content: getGreeting(), time: getCurrentTime() }];
    setMessages(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #0A090E;
        }

        @keyframes flicker {
          0%, 94%, 100% { opacity: 1; }
          95% { opacity: 0.91; }
          96.5% { opacity: 1; }
          98% { opacity: 0.95; }
          99% { opacity: 1; }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes phosphorIn {
          from { opacity: 0; transform: translateY(5px); filter: brightness(2.5); }
          to   { opacity: 1; transform: translateY(0);  filter: brightness(1); }
        }

        @keyframes typingPulse {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1; }
        }

        @keyframes grain {
          0%   { transform: translate(0,    0   ); }
          10%  { transform: translate(-2%,  -1% ); }
          20%  { transform: translate(2%,   1%  ); }
          30%  { transform: translate(-1%,  2%  ); }
          40%  { transform: translate(1%,  -2%  ); }
          50%  { transform: translate(-2%,  1%  ); }
          60%  { transform: translate(2%,  -1%  ); }
          70%  { transform: translate(-1%, -2%  ); }
          80%  { transform: translate(1%,   2%  ); }
          90%  { transform: translate(-2%,  2%  ); }
        }

        .crt-wrapper {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          font-family: 'Courier New', Courier, monospace;
          color: #DCCFB8;
          background: #0A090E;
          animation: flicker 8s infinite;
          overflow: hidden;
          height: 100dvh;
        }

        /* scanlines */
        .crt-wrapper::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 2px,
            rgba(0,0,0,0.13) 2px,
            rgba(0,0,0,0.13) 4px
          );
          pointer-events: none;
          z-index: 10;
        }

        /* vignette */
        .crt-wrapper::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.80) 100%);
          pointer-events: none;
          z-index: 11;
        }

        /* film grain */
        .grain-overlay {
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          pointer-events: none;
          z-index: 12;
          opacity: 0.028;
          animation: grain 0.4s steps(1) infinite;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }

        .header {
          flex-shrink: 0;
          padding: 15px 20px 12px;
          border-bottom: 1px solid #2e1f16;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 20;
        }

        .header-title {
          font-size: 14px;
          letter-spacing: 0.18em;
          color: #D9A36A;
          text-shadow: 0 0 8px #D9A36A99, 0 0 22px #D9A36A44;
          text-transform: lowercase;
        }

        .header-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
          color: #D9A36A;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .clear-btn {
          font-size: 10px;
          color: #3a2518;
          letter-spacing: 0.12em;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Courier New', monospace;
          transition: color 0.2s, opacity 0.2s;
          text-transform: lowercase;
          opacity: 0.7;
        }
        .clear-btn:hover { color: #D9A36A; opacity: 1; }

        .version {
          font-size: 10px;
          color: #3a2518;
          letter-spacing: 0.1em;
          opacity: 0.5;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 22px 20px 10px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          position: relative;
          z-index: 20;
          scrollbar-width: thin;
          scrollbar-color: #2e1f16 #0A090E;
        }

        .messages-area::-webkit-scrollbar       { width: 3px; }
        .messages-area::-webkit-scrollbar-track  { background: #0A090E; }
        .messages-area::-webkit-scrollbar-thumb  { background: #2e1f16; border-radius: 2px; }

        .msg-aria {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          animation: phosphorIn 0.45s ease forwards;
        }

        .msg-user {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          animation: phosphorIn 0.3s ease forwards;
        }

        .msg-aria-content {
          border-left: 2px solid #D9A36A77;
          padding: 5px 0 5px 13px;
          color: #D9A36A;
          text-shadow: 0 0 7px #D9A36A55;
          font-size: 14px;
          line-height: 1.7;
          max-width: 78%;
          background: rgba(13, 11, 8, 0.45);
        }

        .msg-user-content {
          border-right: 2px solid #4C342766;
          padding: 5px 13px 5px 0;
          color: #DCCFB8;
          font-size: 14px;
          line-height: 1.7;
          max-width: 78%;
          text-align: right;
          opacity: 0.8;
        }

        .msg-time {
          font-size: 9px;
          color: #3a2518;
          opacity: 0.55;
          margin-top: 5px;
          letter-spacing: 0.12em;
        }

        .typing-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          animation: phosphorIn 0.3s ease forwards;
        }

        .typing-dots {
          border-left: 2px solid #D9A36A55;
          padding: 7px 0 7px 13px;
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .typing-dots span {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #D9A36A;
          box-shadow: 0 0 5px #D9A36A88;
          animation: typingPulse 1.3s ease-in-out infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.22s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.44s; }

        .input-area {
          flex-shrink: 0;
          border-top: 1px solid #2e1f16;
          padding: 13px 20px 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 20;
          background: #0A090E;
        }

        .input-prompt {
          color: #4C3427;
          font-size: 13px;
          flex-shrink: 0;
          opacity: 0.75;
          letter-spacing: 0.05em;
        }

        .input-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #DCCFB8;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          caret-color: #D9A36A;
          letter-spacing: 0.03em;
          min-width: 0;
        }

        .input-field::placeholder {
          color: #3a2518;
          opacity: 0.6;
        }

        .send-btn {
          background: none;
          border: 1px solid #3a2518;
          color: #3a2518;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          padding: 5px 11px;
          cursor: pointer;
          letter-spacing: 0.12em;
          transition: all 0.2s;
          text-transform: lowercase;
          flex-shrink: 0;
          line-height: 1.4;
        }

        .send-btn:hover:not(:disabled) {
          border-color: #D9A36A;
          color: #D9A36A;
          text-shadow: 0 0 6px #D9A36A55;
        }

        .send-btn:disabled { opacity: 0.25; cursor: default; }
      `}</style>

      <div className="crt-wrapper">
        <div className="grain-overlay" />

        {/* Header */}
        <div className="header">
          <div className="header-title">
            aria — online<span className="header-cursor">▌</span>
          </div>
          <div className="header-right">
            <button className="clear-btn" onClick={clearChat}>clear</button>
            <span className="version">v1.0</span>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <div key={i} className="msg-aria">
                <div className="msg-aria-content">{msg.content}</div>
                {msg.time && <div className="msg-time">{msg.time}</div>}
              </div>
            ) : (
              <div key={i} className="msg-user">
                <div className="msg-user-content">{msg.content}</div>
                {msg.time && <div className="msg-time">{msg.time}</div>}
              </div>
            )
          )}

          {loading && (
            <div className="typing-row">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <span className="input-prompt">&gt;_</span>
          <input
            ref={inputRef}
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="say something..."
            disabled={loading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            autoFocus
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            send ⏎
          </button>
        </div>
      </div>
    </>
  );
}