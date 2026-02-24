"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const DOT_COUNT = 18

export default function Home() {
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat, loading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }, [message])

  async function sendMessage() {
    if (!message.trim() || loading) return
    const userMsg = { role: "user", content: message }
    setChat(prev => [...prev, userMsg])
    setMessage("")
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message }),
      })
      const data = await res.json()
      setChat(prev => [...prev, { role: "assistant", content: data.answer }])
    } catch {
      setChat(prev => [...prev, { role: "assistant", content: "⚠️ Could not reach the server. Is it running on port 8000?" }])
    }
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0f;
          --surface: #111118;
          --surface2: #16161f;
          --border: rgba(255,255,255,0.07);
          --border-bright: rgba(255,255,255,0.13);
          --accent: #00e5ff;
          --accent2: #7c3aed;
          --text: #e8e8f0;
          --text-muted: #6b6b80;
          --user-bg: #1a1a2e;
          --user-border: rgba(124,58,237,0.4);
          --ai-bg: #0f0f1a;
          --ai-border: rgba(0,229,255,0.15);
          --font-ui: 'Syne', sans-serif;
          --font-mono: 'DM Mono', monospace;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--font-ui); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }

        .shell {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          max-width: 860px;
          margin: 0 auto;
          position: relative;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 28px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: relative;
          z-index: 10;
          flex-shrink: 0;
        }
        .header-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(0,229,255,0.2);
        }
        .header-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--text);
        }
        .header-sub {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          margin-top: 2px;
          letter-spacing: 0.06em;
        }
        .header-badge {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          background: rgba(0,229,255,0.08);
          border: 1px solid rgba(0,229,255,0.2);
          padding: 3px 9px;
          border-radius: 20px;
          letter-spacing: 0.08em;
        }

        /* Messages */
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 28px 28px 12px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Empty state */
        .empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          text-align: center;
          padding: 40px;
          animation: fadeUp 0.5s ease both;
        }
        .empty-glyph {
          font-size: 48px;
          line-height: 1;
          filter: drop-shadow(0 0 20px rgba(0,229,255,0.3));
        }
        .empty-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .empty-desc {
          font-size: 13px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          max-width: 340px;
          line-height: 1.7;
        }
        .empty-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 8px;
        }
        .empty-pill {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          border: 1px solid var(--border-bright);
          padding: 5px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
          font-family: var(--font-mono);
        }
        .empty-pill:hover {
          color: var(--accent);
          border-color: rgba(0,229,255,0.4);
          background: rgba(0,229,255,0.05);
        }

        /* Bubble */
        .bubble-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: fadeUp 0.25s ease both;
        }
        .bubble-wrap.user { align-items: flex-end; }
        .bubble-wrap.assistant { align-items: flex-start; }

        .bubble-label {
          font-size: 10px;
          font-family: var(--font-mono);
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding: 0 4px;
        }

        .bubble {
          max-width: min(680px, 88%);
          padding: 14px 18px;
          border-radius: 14px;
          line-height: 1.65;
          font-size: 14px;
          position: relative;
        }
        .bubble.user {
          background: var(--user-bg);
          border: 1px solid var(--user-border);
          color: #d4d4f0;
          border-bottom-right-radius: 4px;
        }
        .bubble.assistant {
          background: var(--ai-bg);
          border: 1px solid var(--ai-border);
          color: var(--text);
          border-bottom-left-radius: 4px;
        }

        /* Markdown */
        .bubble.assistant p { margin: 0 0 10px; }
        .bubble.assistant p:last-child { margin-bottom: 0; }
        .bubble.assistant h1,.bubble.assistant h2,.bubble.assistant h3 {
          font-family: var(--font-ui);
          font-weight: 700;
          margin: 16px 0 8px;
          color: var(--text);
        }
        .bubble.assistant h1 { font-size: 18px; }
        .bubble.assistant h2 { font-size: 15px; }
        .bubble.assistant h3 { font-size: 13px; letter-spacing: 0.04em; }
        .bubble.assistant ul, .bubble.assistant ol {
          padding-left: 20px;
          margin: 8px 0;
        }
        .bubble.assistant li { margin: 4px 0; }
        .bubble.assistant code {
          font-family: var(--font-mono);
          font-size: 12px;
          background: rgba(0,229,255,0.07);
          border: 1px solid rgba(0,229,255,0.15);
          padding: 1px 5px;
          border-radius: 4px;
          color: var(--accent);
        }
        .bubble.assistant pre {
          background: #08080f;
          border: 1px solid var(--border-bright);
          border-radius: 10px;
          padding: 16px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .bubble.assistant pre code {
          background: none;
          border: none;
          padding: 0;
          color: #a8d8f0;
          font-size: 12.5px;
          line-height: 1.6;
        }
        .bubble.assistant a {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .bubble.assistant blockquote {
          border-left: 2px solid var(--accent);
          padding-left: 12px;
          color: var(--text-muted);
          font-style: italic;
          margin: 8px 0;
        }
        .bubble.assistant table {
          border-collapse: collapse;
          font-size: 13px;
          width: 100%;
          margin: 10px 0;
        }
        .bubble.assistant th, .bubble.assistant td {
          border: 1px solid var(--border-bright);
          padding: 7px 12px;
          text-align: left;
        }
        .bubble.assistant th {
          background: rgba(0,229,255,0.06);
          font-weight: 600;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
        }

        /* Thinking dots */
        .thinking {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          animation: fadeUp 0.2s ease both;
        }
        .thinking-label {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .dots {
          display: flex;
          gap: 5px;
          padding: 14px 18px;
          background: var(--ai-bg);
          border: 1px solid var(--ai-border);
          border-radius: 14px;
          border-bottom-left-radius: 4px;
        }
        .dot {
          width: 6px; height: 6px;
          background: var(--accent);
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse 1.2s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        /* Input area */
        .input-area {
          padding: 16px 28px 20px;
          border-top: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
        }
        .input-box {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: var(--surface2);
          border: 1px solid var(--border-bright);
          border-radius: 14px;
          padding: 10px 10px 10px 16px;
          transition: border-color 0.2s;
        }
        .input-box:focus-within {
          border-color: rgba(0,229,255,0.35);
          box-shadow: 0 0 0 3px rgba(0,229,255,0.05);
        }
        .input-box textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: var(--font-ui);
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          min-height: 24px;
          max-height: 160px;
          padding: 2px 0;
        }
        .input-box textarea::placeholder { color: var(--text-muted); }
        .send-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          box-shadow: 0 0 16px rgba(0,229,255,0.15);
        }
        .send-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 0 22px rgba(0,229,255,0.3);
        }
        .send-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none;
        }
        .send-btn svg { width: 16px; height: 16px; color: #fff; }
        .input-hint {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          margin-top: 8px;
          padding: 0 4px;
          letter-spacing: 0.05em;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>

      <div className="shell">
        {/* Header */}
        <header className="header">
          <div className="header-icon">⬡</div>
          <div>
            <div className="header-title">Next.js Docs AI</div>
            <div className="header-sub">RAG · App Router · Groq</div>
          </div>
          <span className="header-badge">LOCAL</span>
        </header>

        {/* Messages */}
        <div className="messages">
          {chat.length === 0 && !loading && (
            <div className="empty">
              <div className="empty-glyph">⬡</div>
              <div className="empty-title">Ask anything about Next.js</div>
              <div className="empty-desc">
                Powered by your local docs index.<br />
                Paste broken code or ask a question.
              </div>
              <div className="empty-pills">
                {[
                  "Fix my useEffect",
                  "App Router vs Pages Router",
                  "Server Actions example",
                  "next/image usage",
                  "Middleware setup",
                ].map(q => (
                  <button key={q} className="empty-pill" onClick={() => setMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((msg, i) => (
            <div key={i} className={`bubble-wrap ${msg.role}`}>
              <div className="bubble-label">
                {msg.role === "user" ? "YOU" : "AI"}
              </div>
              <div className={`bubble ${msg.role}`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="thinking">
              <div>
                <div className="thinking-label">AI</div>
                <div className="dots">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Next.js or paste your code…"
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading || !message.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="input-hint">↵ send · shift+↵ newline</div>
        </div>
      </div>
    </>
  )
}