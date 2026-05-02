import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { aiSearchQuery, IS_GEMINI } from "../../api/aiApi";

function highlight(text, query) {
  if (!query) return text;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const str = String(text);
  return (
    <>
      {str.slice(0, idx)}
      <mark style={{ background: "rgba(79,70,229,0.18)", color: "var(--brand)", padding: "0 1px", borderRadius: 2 }}>
        {str.slice(idx, idx + query.length)}
      </mark>
      {str.slice(idx + query.length)}
    </>
  );
}

const TYPE_COLOR = { Product: "#4f46e5", Order: "#10b981", User: "#f59e0b" };

export default function GlobalSearchModal({ show, onHide }) {
  const { products, orders, users } = useApp();
  const [tab, setTab]       = useState("quick");
  const [query, setQuery]   = useState("");
  const [active, setActive] = useState(0);
  const navigate            = useNavigate();
  const inputRef            = useRef(null);

  // AI Search state
  const [aiQuery, setAiQuery]         = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiFilter, setAiFilter]       = useState(null);
  const [aiError, setAiError]         = useState(null);
  const aiInputRef                    = useRef(null);

  useEffect(() => {
    if (show) {
      setQuery("");
      setAiQuery("");
      setAiFilter(null);
      setAiError(null);
      setActive(0);
      const tgt = tab === "quick" ? inputRef : aiInputRef;
      setTimeout(() => tgt.current?.focus(), 60);
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (show) {
      const tgt = tab === "quick" ? inputRef : aiInputRef;
      setTimeout(() => tgt.current?.focus(), 60);
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out = [];

    (products || []).forEach((p) => {
      if (String(p.name || p.title || "").toLowerCase().includes(q) ||
          String(p.category || "").toLowerCase().includes(q)) {
        out.push({ type: "Product", label: p.name || p.title, sub: p.category, path: "/products" });
      }
    });

    (orders || []).forEach((o) => {
      if (String(o.id || "").toLowerCase().includes(q) ||
          String(o.customerName || "").toLowerCase().includes(q) ||
          String(o.productName || "").toLowerCase().includes(q)) {
        out.push({ type: "Order", label: o.id, sub: o.customerName, path: "/orders" });
      }
    });

    (users || []).forEach((u) => {
      if (String(u.name || `${u.firstName} ${u.lastName}` || "").toLowerCase().includes(q) ||
          String(u.email || "").toLowerCase().includes(q)) {
        const label = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim();
        out.push({ type: "User", label, sub: u.email, path: "/users" });
      }
    });

    return out.slice(0, 12);
  }, [query, products, orders, users]);

  // AI filtered products
  const aiResults = useMemo(() => {
    if (!aiFilter) return [];
    return (products || []).filter((p) => {
      const name = (p.name || p.title || "").toLowerCase();
      const cat  = (p.category || "").toLowerCase();
      if (aiFilter.category && !cat.includes(aiFilter.category.toLowerCase())) return false;
      if (aiFilter.maxPrice != null && p.price > aiFilter.maxPrice) return false;
      if (aiFilter.minPrice != null && p.price < aiFilter.minPrice) return false;
      if (aiFilter.stockStatus === "outofstock" && p.stock > 0) return false;
      if (aiFilter.stockStatus === "instock" && p.stock === 0) return false;
      if (aiFilter.searchTerm) {
        const q = aiFilter.searchTerm.toLowerCase();
        if (!name.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    }).slice(0, 15);
  }, [aiFilter, products]);

  function go(item) { navigate(item.path); onHide(); }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results[active]) { go(results[active]); }
    else if (e.key === "Escape") { onHide(); }
  }

  async function runAISearch() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiFilter(null);
    setAiError(null);
    try {
      const filter = await aiSearchQuery({ query: aiQuery, products: products || [] });
      setAiFilter(filter);
    } catch (e) {
      setAiError(e.message || "AI search failed");
    } finally {
      setAiLoading(false);
    }
  }

  const tabStyle = (t) => ({
    border: "none", background: "none", cursor: "pointer",
    padding: "7px 14px", fontSize: "0.8125rem", fontWeight: 600,
    color: tab === t ? "#4f46e5" : "var(--text-muted)",
    borderBottom: tab === t ? "2px solid #4f46e5" : "2px solid transparent",
    marginBottom: -1, transition: "all 0.15s",
  });

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Body style={{ padding: "0" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
          <button style={tabStyle("quick")} onClick={() => setTab("quick")}>
            <i className="bi bi-search me-1" style={{ fontSize: "0.75rem" }} />Quick Search
          </button>
          <button style={tabStyle("ai")} onClick={() => setTab("ai")}>
            <i className="bi bi-stars me-1" style={{ fontSize: "0.75rem" }} />AI Search
          </button>
          <button
            onClick={onHide}
            style={{
              marginLeft: "auto", border: "none", background: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: "1.25rem", lineHeight: 1,
              padding: "4px 6px", borderRadius: 6, display: "flex", alignItems: "center",
            }}
            title="Close (Esc)"
            aria-label="Close search"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div style={{ padding: "14px 16px" }}>
          {/* ── Quick Search ── */}
          {tab === "quick" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <i className="bi bi-search" style={{ color: "var(--text-muted)", fontSize: "1.05rem", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                  onKeyDown={onKeyDown}
                  placeholder="Search products, orders, users…"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "1rem", color: "var(--text-primary)" }}
                />
                {query && (
                  <button onClick={() => setQuery("")} style={{ border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                    <i className="bi bi-x-circle-fill" />
                  </button>
                )}
              </div>
              <hr style={{ margin: "0 0 10px", borderColor: "var(--border)" }} />
              {!query.trim() && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", margin: "20px 0" }}>
                  Start typing to search across all data…
                </p>
              )}
              {query.trim() && results.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", margin: "20px 0" }}>
                  No results found for <strong>"{query}"</strong>
                </p>
              )}
              {results.map((item, i) => (
                <div
                  key={i}
                  className={`search-result-item${i === active ? " active" : ""}`}
                  onClick={() => go(item)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="search-result-type" style={{ background: TYPE_COLOR[item.type] + "22", color: TYPE_COLOR[item.type] }}>
                    {item.type}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{highlight(item.label, query)}</span>
                    {item.sub && (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: 6 }}>
                        {highlight(item.sub, query)}
                      </span>
                    )}
                  </span>
                  <i className="bi bi-arrow-return-left" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }} />
                </div>
              ))}
              {results.length > 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
                  ↑↓ navigate &nbsp;·&nbsp; Enter to open &nbsp;·&nbsp; Esc to close
                </p>
              )}
            </>
          )}

          {/* ── AI Search ── */}
          {tab === "ai" && (
            <>
              {!IS_GEMINI && (
                <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.35)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                  <i className="bi bi-key me-2" />
                  <strong>Gemini API key not configured.</strong> AI Search is running in mock mode.
                  Set <code>VITE_GEMINI_API_KEY</code> in your <code>.env</code> file for real AI results.
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 12px" }}>
                  <i className="bi bi-stars" style={{ color: "#7c3aed", fontSize: "0.9rem", flexShrink: 0 }} />
                  <input
                    ref={aiInputRef}
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") runAISearch(); else if (e.key === "Escape") onHide(); }}
                    placeholder='e.g. "electronics under $50" or "out of stock clothing"'
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.9rem", color: "var(--text-primary)" }}
                  />
                  {aiQuery && (
                    <button onClick={() => { setAiQuery(""); setAiFilter(null); }} style={{ border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                      <i className="bi bi-x-circle-fill" />
                    </button>
                  )}
                </div>
                <button
                  className="btn btn-brand btn-sm"
                  onClick={runAISearch}
                  disabled={aiLoading || !aiQuery.trim()}
                  style={{ borderRadius: 8, padding: "0 14px", flexShrink: 0 }}
                >
                  {aiLoading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
                </button>
              </div>

              {aiError && (
                <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "8px 0" }}><i className="bi bi-exclamation-circle me-1" />{aiError}</p>
              )}

              {aiFilter && !aiLoading && (
                <div style={{ background: "var(--table-stripe)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Filters applied:</span>
                  {aiFilter.category && <span style={{ background: "rgba(79,70,229,0.12)", color: "#4f46e5", borderRadius: 4, padding: "1px 6px" }}>{aiFilter.category}</span>}
                  {aiFilter.maxPrice != null && <span style={{ background: "rgba(22,163,74,0.12)", color: "#166534", borderRadius: 4, padding: "1px 6px" }}>≤ ${aiFilter.maxPrice}</span>}
                  {aiFilter.minPrice != null && <span style={{ background: "rgba(22,163,74,0.12)", color: "#166534", borderRadius: 4, padding: "1px 6px" }}>≥ ${aiFilter.minPrice}</span>}
                  {aiFilter.stockStatus && <span style={{ background: aiFilter.stockStatus === "instock" ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)", color: aiFilter.stockStatus === "instock" ? "#166534" : "#991b1b", borderRadius: 4, padding: "1px 6px" }}>{aiFilter.stockStatus}</span>}
                  <span style={{ marginLeft: "auto" }}>{aiResults.length} product{aiResults.length !== 1 ? "s" : ""} found</span>
                </div>
              )}

              {!aiFilter && !aiLoading && (
                <div style={{ padding: "16px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <i className="bi bi-stars" style={{ fontSize: "1.5rem", display: "block", marginBottom: 8, color: "#7c3aed" }} />
                  Ask in natural language — AI will filter products for you
                  <div style={{ fontSize: "0.78rem", marginTop: 8, color: "var(--text-muted)" }}>
                    Try: "cheap electronics in stock" · "clothing above $100" · "out of stock items"
                  </div>
                </div>
              )}

              {aiResults.map((p, i) => (
                <div
                  key={p.id}
                  className="search-result-item"
                  onClick={() => { navigate("/products"); onHide(); }}
                  style={{ cursor: "pointer" }}
                >
                  <span className="search-result-type" style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}>Product</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{p.name || p.title}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: 6 }}>{p.category}</span>
                  </span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#16a34a", flexShrink: 0 }}>
                    ${p.price}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: p.stock === 0 ? "#dc2626" : "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
                    {p.stock === 0 ? "Out" : `${p.stock} in stock`}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
