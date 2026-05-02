import { useState, useEffect, useRef, useCallback } from "react";
import "./AIAssistantWidget.css";
import { useApp } from "../../context/AppContext";
import { askAIQuestion, AI_MODE_LABEL, IS_GEMINI } from "../../api/aiApi";

const WELCOME_TEXT =
  "Hi! I'm the SmartERP AI Assistant. Ask me anything about your business — inventory, orders, revenue, or users.";

const SUGGESTIONS = [
  "What should I focus on today?",
  "How is revenue performing?",
  "Any low stock alerts?",
  "Pending orders status?",
];

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function AIAssistantWidget() {
  const { products, orders, users, loading } = useApp();

  const [open, setOpen]         = useState(false);
  const [showTip, setShowTip]   = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [initialized, setInit]  = useState(false);
  const [unread, setUnread]     = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Show welcome message on first open
  useEffect(() => {
    if (open && !initialized && !loading) {
      setMessages([{ id: "welcome", role: "ai", text: WELCOME_TEXT, time: new Date() }]);
      setInit(true);
      setUnread(0);
    }
    if (open) setUnread(0);
  }, [open, initialized, loading]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const addMessage = useCallback((role, text) => {
    const msg = { id: Date.now() + Math.random(), role, text, time: new Date() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const send = useCallback(async (text) => {
    const q = text.trim();
    if (!q || thinking) return;

    addMessage("user", q);
    setInput("");
    setThinking(true);

    try {
      const res = await askAIQuestion({ question: q, products, orders, users });
      addMessage("ai", res.answer);
    } catch {
      addMessage("ai", "Sorry, I ran into an issue. Please try again.");
    } finally {
      setThinking(false);
    }
  }, [thinking, addMessage, products, orders, users]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handleSuggestion = (text) => send(text);

  const clearChat = () => {
    setMessages([{ id: "welcome-2", role: "ai", text: WELCOME_TEXT, time: new Date() }]);
    setInput("");
  };

  // Show suggestions only after welcome message and no user messages yet
  const showSuggestions =
    messages.length === 1 && messages[0].role === "ai" && !thinking;

  return (
    <div className="ai-fab-wrap">
      {/* Chat Panel */}
      <div className={`ai-chat-panel ${open ? "panel-visible" : "panel-hidden"}`} aria-hidden={!open}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-avatar">
            <i className="bi bi-stars" style={{ color: "white", fontSize: "1.1rem" }} />
          </div>
          <div className="flex-1">
            <div className="ai-panel-title">SmartERP AI Assistant</div>
            <div className="ai-panel-subtitle">AI-powered business insights</div>
          </div>
          <span className={`ai-panel-badge${IS_GEMINI ? " gemini-badge" : ""}`}>
            {IS_GEMINI && <i className="bi bi-stars me-1" style={{ fontSize: "0.6rem" }} />}
            {AI_MODE_LABEL}
          </span>
          <button className="ai-panel-close" onClick={() => setOpen(false)} title="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg ${msg.role === "user" ? "ai-msg-user" : ""}`}>
              <div className={`ai-msg-avatar ${msg.role === "ai" ? "bot" : "user"}`}>
                {msg.role === "ai"
                  ? <i className="bi bi-robot" />
                  : <i className="bi bi-person" />
                }
              </div>
              <div>
                <div className={`ai-msg-bubble ${msg.role === "ai" ? "bot" : "user"}`}>
                  {msg.text}
                </div>
                <div className="ai-msg-time">{formatTime(msg.time)}</div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {thinking && (
            <div className="ai-typing">
              <div className="ai-msg-avatar bot">
                <i className="bi bi-robot" />
              </div>
              <div className="ai-typing-bubble">
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {showSuggestions && (
          <div className="ai-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="ai-suggestion-chip" onClick={() => handleSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="ai-input-row">
          <textarea
            ref={inputRef}
            className="ai-input"
            rows={1}
            placeholder="Ask anything about your ERP data…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={thinking}
          />
          <button
            className="ai-send-btn"
            onClick={() => send(input)}
            disabled={!input.trim() || thinking}
            title="Send"
          >
            {thinking
              ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : <i className="bi bi-send-fill" />
            }
          </button>
        </div>

        {/* Clear chat */}
        {messages.length > 1 && (
          <div style={{ textAlign: "center", padding: "0 12px 10px" }}>
            <button className="ai-clear-btn" onClick={clearChat}>
              <i className="bi bi-arrow-counterclockwise me-1" />Clear conversation
            </button>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTip && !open && (
        <div className="ai-fab-tooltip">Ask the AI Assistant</div>
      )}

      {/* FAB Button */}
      <button
        className={`ai-fab-btn ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        title="SmartERP AI Assistant"
        aria-label="Open AI Assistant"
      >
        {/* Pulse ring — only when closed */}
        {!open && <span className="ai-fab-pulse" />}

        {/* Unread badge */}
        {unread > 0 && !open && (
          <span className="ai-fab-badge">{unread}</span>
        )}

        <i className={`bi ${open ? "bi-x-lg" : "bi-stars"} ai-fab-icon`} />
      </button>
    </div>
  );
}
