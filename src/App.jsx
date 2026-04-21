import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, getDoc, getDocs
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

// ─── Default Config ───────────────────────────────────────────────────────────
const DEFAULT_COLUMNS = ["Backlog", "In Progress", "Review", "Done"];
const DEFAULT_COLORS = ["#F87171","#FB923C","#FBBF24","#34D399","#60A5FA","#A78BFA","#F472B6","#94A3B8"];
const PRIORITY_CONFIG = {
  Low:      { color: "#34D399", icon: "▽" },
  Medium:   { color: "#FBBF24", icon: "◇" },
  High:     { color: "#F97316", icon: "△" },
  Critical: { color: "#F87171", icon: "▲" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", background: "#0D111C", border: "1px solid #2A3045",
  borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 14,
  marginBottom: 14, boxSizing: "border-box", outline: "none",
  fontFamily: "'DM Sans', sans-serif",
};
const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#64748B",
  letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
  fontFamily: "'DM Mono', monospace",
};
const btnStyle = (bg, color, border = "transparent") => ({
  padding: "9px 18px", borderRadius: 8, border: `1px solid ${border}`,
  cursor: "pointer", fontSize: 13, fontWeight: 600, background: bg, color,
  fontFamily: "'DM Sans', sans-serif",
});

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = 26 }) {
  if (photo) return (
    <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", objectFit: "cover" }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "#4F6EF7",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, color: "#fff", flexShrink: 0,
      border: "2px solid rgba(255,255,255,0.15)",
    }}>{name?.[0]?.toUpperCase() || "?"}</div>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
function Tag({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace",
    }}>{label}</span>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, error }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0D111C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#161B27", border: "1px solid #2A3045", borderRadius: 20, padding: "48px 52px", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", maxWidth: 380, width: "90vw" }}>
        <div style={{ width: 58, height: 58, borderRadius: 14, background: "#4F6EF720", border: "1px solid #4F6EF740", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", fontSize: 28 }}>⬡</div>
        <h2 style={{ color: "#E2E8F0", margin: "0 0 8px", fontSize: 24, fontWeight: 700 }}>Team Kanban</h2>
        <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 32px", lineHeight: 1.6 }}>
          Sign in with your Google account to access your team's shared board.
        </p>
        {error && <p style={{ color: "#F87171", fontSize: 13, marginBottom: 16 }}>{error}</p>}
        <button
          onClick={onLogin}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            background: "#fff", border: "none", borderRadius: 10, padding: "13px 24px",
            cursor: "pointer", width: "100%", fontSize: 15, fontWeight: 600, color: "#1a1a1a",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ config, onClose, onSave }) {
  const [columns, setColumns] = useState([...config.columns]);
  const [boardName, setBoardName] = useState(config.boardName || "Team Kanban");
  const [newCol, setNewCol] = useState("");

  const addCol = () => {
    if (newCol.trim() && !columns.includes(newCol.trim())) {
      setColumns([...columns, newCol.trim()]);
      setNewCol("");
    }
  };
  const removeCol = (i) => setColumns(columns.filter((_, idx) => idx !== i));
  const moveCol = (i, dir) => {
    const arr = [...columns];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setColumns(arr);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161B27", border: "1px solid #2A3045", borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", fontFamily: "'DM Sans', sans-serif", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, color: "#E2E8F0", fontSize: 16, fontWeight: 700 }}>⚙ Board Settings</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        <label style={labelStyle}>Board Name</label>
        <input value={boardName} onChange={e => setBoardName(e.target.value)} style={inputStyle} placeholder="e.g. Product Team Board" />

        <label style={labelStyle}>Columns</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {columns.map((col, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0D111C", border: "1px solid #2A3045", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ flex: 1, color: "#E2E8F0", fontSize: 14 }}>{col}</span>
              <button onClick={() => moveCol(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>↑</button>
              <button onClick={() => moveCol(i, 1)} disabled={i === columns.length - 1} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>↓</button>
              <button onClick={() => removeCol(i)} style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input value={newCol} onChange={e => setNewCol(e.target.value)} onKeyDown={e => e.key === "Enter" && addCol()} placeholder="Add column..." style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
          <button onClick={addCol} style={{ ...btnStyle("#4F6EF720", "#4F6EF7", "#4F6EF740"), padding: "9px 14px" }}>+ Add</button>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnStyle("#2A3045", "#94A3B8")}>Cancel</button>
          <button onClick={() => onSave({ boardName, columns })} style={btnStyle("#4F6EF7", "#fff")}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

// ─── Card Modal ───────────────────────────────────────────────────────────────
function CardModal({ card, onClose, onSave, onDelete, columns, user }) {
  const [title, setTitle]     = useState(card?.title || "");
  const [desc, setDesc]       = useState(card?.description || "");
  const [assignee, setAssignee] = useState(card?.assignee || "");
  const [tag, setTag]         = useState(card?.tag || "");
  const [tagColor, setTagColor] = useState(card?.tagColor || DEFAULT_COLORS[0]);
  const [priority, setPriority] = useState(card?.priority || "Medium");
  const [column, setColumn]   = useState(card?.column || columns[0]);
  const isNew = !card?.id;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161B27", border: "1px solid #2A3045", borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", fontFamily: "'DM Sans', sans-serif", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#E2E8F0", fontSize: 16, fontWeight: 700 }}>{isNew ? "New Card" : "Edit Card"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <label style={labelStyle}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Card title..." style={inputStyle} autoFocus />

        <label style={labelStyle}>Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add details..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
          <div>
            <label style={labelStyle}>Column</label>
            <select value={column} onChange={e => setColumn(e.target.value)} style={inputStyle}>
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
              {["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <label style={labelStyle}>Assignee (email or name)</label>
        <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="e.g. alex@company.com" style={inputStyle} />

        <label style={labelStyle}>Tag Label</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <input value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. Bug, Feature..." style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {DEFAULT_COLORS.slice(0, 6).map(c => (
              <div key={c} onClick={() => setTagColor(c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer", border: tagColor === c ? "2px solid #fff" : "2px solid transparent" }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 8 }}>
          {!isNew && <button onClick={() => onDelete(card.id)} style={btnStyle("#FF444420", "#FF4444", "#FF444440")}>Delete</button>}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button onClick={onClose} style={btnStyle("#2A3045", "#94A3B8")}>Cancel</button>
            <button
              onClick={() => {
                if (!title.trim()) return;
                onSave({ id: card?.id || generateId(), title: title.trim(), description: desc.trim(), assignee, tag: tag.trim(), tagColor, priority, column, createdBy: user.email, createdAt: card?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
              }}
              style={btnStyle("#4F6EF7", "#fff")}
            >{isNew ? "Create Card" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ card, onEdit, isDragging, onDragStart, onDragEnd }) {
  const p = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.Medium;
  return (
    <div
      draggable onDragStart={() => onDragStart(card)} onDragEnd={onDragEnd} onClick={() => onEdit(card)}
      style={{ background: "#161B27", border: "1px solid #2A3045", borderRadius: 10, padding: "13px 14px", cursor: "grab", opacity: isDragging ? 0.4 : 1, transition: "transform 0.12s, box-shadow 0.12s", boxShadow: isDragging ? "none" : "0 2px 8px rgba(0,0,0,0.3)", userSelect: "none" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <span style={{ color: p.color, fontSize: 11, marginTop: 2, flexShrink: 0 }}>{p.icon}</span>
        <p style={{ margin: 0, color: "#E2E8F0", fontSize: 13, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{card.title}</p>
      </div>
      {card.description && <p style={{ margin: "0 0 10px", color: "#64748B", fontSize: 12, lineHeight: 1.5 }}>{card.description.length > 80 ? card.description.slice(0, 80) + "…" : card.description}</p>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
        {card.tag && <Tag label={card.tag} color={card.tagColor || DEFAULT_COLORS[0]} />}
        {card.assignee && (
          <span style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Mono', monospace", marginLeft: "auto" }}>
            {card.assignee.includes("@") ? card.assignee.split("@")[0] : card.assignee}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [cards, setCards]       = useState([]);
  const [config, setConfig]     = useState({ boardName: "Team Kanban", columns: DEFAULT_COLUMNS });
  const [modal, setModal]       = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dragCard, setDragCard] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [filter, setFilter]     = useState("");

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  // Firestore listener for cards
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "cards"), snap => {
      setCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  // Firestore listener for config
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "config", "board"), snap => {
      if (snap.exists()) setConfig(snap.data());
    });
    return unsub;
  }, [user]);

  const login = async () => {
    try {
      setAuthError("");
      await signInWithPopup(auth, provider);
    } catch (e) {
      setAuthError("Sign-in failed. Please try again.");
    }
  };

  const handleSaveCard = async (card) => {
    await setDoc(doc(db, "cards", card.id), card);
    setModal(null);
  };

  const handleDeleteCard = async (id) => {
    await deleteDoc(doc(db, "cards", id));
    setModal(null);
  };

  const handleDrop = async (col) => {
    if (!dragCard || dragCard.column === col) return;
    await updateDoc(doc(db, "cards", dragCard.id), { column: col, updatedAt: new Date().toISOString() });
    setDragCard(null);
    setDragOverCol(null);
  };

  const handleSaveConfig = async (newConfig) => {
    await setDoc(doc(db, "config", "board"), newConfig);
    setShowSettings(false);
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#0D111C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Loading…</div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={login} error={authError} />;

  const filtered = filter
    ? cards.filter(c => c.title?.toLowerCase().includes(filter.toLowerCase()) || (c.assignee || "").toLowerCase().includes(filter.toLowerCase()) || (c.tag || "").toLowerCase().includes(filter.toLowerCase()))
    : cards;

  return (
    <div style={{ minHeight: "100vh", background: "#0D111C", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#161B27", borderBottom: "1px solid #2A3045", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ width: 32, height: 32, background: "#4F6EF720", border: "1px solid #4F6EF740", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⬡</div>
          <span style={{ color: "#E2E8F0", fontWeight: 700, fontSize: 16 }}>{config.boardName}</span>
          <span style={{ color: "#4F6EF7", background: "#4F6EF720", padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{cards.length} cards</span>
        </div>

        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search cards…" style={{ background: "#0D111C", border: "1px solid #2A3045", borderRadius: 8, padding: "7px 14px", color: "#E2E8F0", fontSize: 13, width: 200, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />

        <button onClick={() => setShowSettings(true)} style={{ background: "#2A3045", border: "1px solid #3A4060", borderRadius: 8, color: "#94A3B8", cursor: "pointer", padding: "7px 13px", fontSize: 13, fontWeight: 600 }}>⚙ Settings</button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={user.displayName} photo={user.photoURL} size={30} />
          <span style={{ color: "#94A3B8", fontSize: 13, fontFamily: "'DM Mono', monospace", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName?.split(" ")[0]}</span>
          <button onClick={() => signOut(auth)} style={{ background: "none", border: "1px solid #2A3045", borderRadius: 6, color: "#64748B", cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      {/* Board */}
      <div style={{ display: "flex", gap: 16, padding: "24px", overflowX: "auto", minHeight: "calc(100vh - 65px)" }}>
        {config.columns.map(col => {
          const colCards = filtered.filter(c => c.column === col);
          const isOver = dragOverCol === col;
          return (
            <div
              key={col}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col); }}
              onDrop={() => handleDrop(col)}
              onDragLeave={() => setDragOverCol(null)}
              style={{ flex: "0 0 280px", minWidth: 280, background: isOver ? "#1A2236" : "#111623", border: `1px solid ${isOver ? "#4F6EF7" : "#1E2640"}`, borderRadius: 14, padding: 14, transition: "border-color 0.2s, background 0.2s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#E2E8F0", fontWeight: 700, fontSize: 13 }}>{col}</span>
                  <span style={{ background: "#2A3045", color: "#64748B", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{colCards.length}</span>
                </div>
                <button onClick={() => setModal({ card: { column: col }, isNew: true })} style={{ background: "#4F6EF720", border: "1px solid #4F6EF740", borderRadius: 6, color: "#4F6EF7", cursor: "pointer", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {colCards.length === 0
                  ? <div style={{ border: "1px dashed #2A3045", borderRadius: 10, padding: "24px 0", textAlign: "center", color: "#2A3045", fontSize: 12 }}>Drop cards here</div>
                  : colCards.map(card => (
                    <KanbanCard
                      key={card.id} card={card}
                      onEdit={c => setModal({ card: c, isNew: false })}
                      isDragging={dragCard?.id === card.id}
                      onDragStart={setDragCard}
                      onDragEnd={() => { setDragCard(null); setDragOverCol(null); }}
                    />
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modal && (
        <CardModal
          card={modal.card} user={user} columns={config.columns}
          onClose={() => setModal(null)}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
        />
      )}
      {showSettings && (
        <SettingsModal config={config} onClose={() => setShowSettings(false)} onSave={handleSaveConfig} />
      )}
    </div>
  );
}
