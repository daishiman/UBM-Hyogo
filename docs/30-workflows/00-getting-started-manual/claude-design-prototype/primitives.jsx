// Shared UI primitives

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- Chip ----------
const Chip = ({ children, tone = "default", dot, outline, onClick, size }) => {
  const cls = ["chip", tone !== "default" ? tone : "", outline ? "outline" : "", size === "sm" ? "chip-sm" : ""].filter(Boolean).join(" ");
  return (
    <span className={cls} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
};

// ---------- Avatar (with pluggable photo store) ----------
const AvatarStoreCtx = React.createContext({ photos: {}, setPhoto: () => {}, removePhoto: () => {} });
const useAvatarStore = () => React.useContext(AvatarStoreCtx);

const AvatarStoreProvider = ({ children }) => {
  const [photos, setPhotos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ubm-photos") || "{}"); } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem("ubm-photos", JSON.stringify(photos)); } catch {} }, [photos]);
  const setPhoto = useCallback((id, dataUrl) => setPhotos((p) => ({ ...p, [id]: dataUrl })), []);
  const removePhoto = useCallback((id) => setPhotos((p) => { const n = { ...p }; delete n[id]; return n; }), []);
  return <AvatarStoreCtx.Provider value={{ photos, setPhoto, removePhoto }}>{children}</AvatarStoreCtx.Provider>;
};

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});

const Avatar = ({ name, size = "md", hue = 0, id, editable, onPhotoChange }) => {
  const initial = (name || "?").trim().charAt(0);
  const { photos, setPhoto, removePhoto } = useAvatarStore();
  const photo = id ? photos[id] : null;
  const toast = useToast();
  const inputRef = useRef(null);
  const cls = "avatar " + (size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : size === "xl" ? "avatar-xl" : "");

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast?.("画像ファイルを選択してください", "warn"); return; }
    if (file.size > 5 * 1024 * 1024) { toast?.("5MB以下の画像を選択してください", "warn"); return; }
    const dataUrl = await readFileAsDataURL(file);
    if (id) setPhoto(id, dataUrl);
    onPhotoChange?.(dataUrl);
    toast?.("画像をアップロードしました", "ok");
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (id) removePhoto(id);
    onPhotoChange?.(null);
    toast?.("画像を削除しました", "ok");
  };

  const content = photo
    ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
    : initial;

  if (!editable) {
    return <div className={cls} data-hue={hue % 8}>{content}</div>;
  }

  const iconSize = size === "sm" ? 11 : size === "lg" ? 15 : size === "xl" ? 18 : 13;

  return (
    <div className={cls + " avatar-editable"} data-hue={hue % 8} style={{ position: "relative", cursor: "pointer" }}
         onClick={() => inputRef.current?.click()}
         title="クリックして画像をアップロード">
      {content}
      <div className="avatar-overlay">
        <Icon name="camera" size={iconSize}/>
      </div>
      {photo && (
        <button className="avatar-remove" onClick={handleRemove} title="画像を削除">
          <Icon name="x" size={10}/>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
             onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}/>
    </div>
  );
};

// ---------- Button ----------
const Button = ({ children, variant = "ghost", size, icon, iconRight, block, onClick, disabled, type = "button", title }) => {
  const cls = [
    "btn",
    variant === "primary" ? "btn-primary" : "",
    variant === "accent" ? "btn-accent" : "",
    variant === "ghost" ? "btn-ghost" : "",
    variant === "soft" ? "btn-soft" : "",
    variant === "danger" ? "btn-danger" : "",
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "",
    block ? "btn-block" : "",
  ].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} title={title}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 13 : 14} />}
    </button>
  );
};

// ---------- Switch ----------
const Switch = ({ on, onToggle }) => (
  <button className={"switch" + (on ? " on" : "")} onClick={onToggle} aria-pressed={on} />
);

// ---------- Segmented ----------
const Segmented = ({ options, value, onChange }) => (
  <div className="segmented">
    {options.map((o) => (
      <button key={o.value} className={value === o.value ? "active" : ""} onClick={() => onChange(o.value)}>
        {o.label}
      </button>
    ))}
  </div>
);

// ---------- Field ----------
const Field = ({ label, required, optional, hint, error, children, badge }) => (
  <div className="field-group">
    {label && (
      <div className="label">
        {label}
        {required && <span className="req">*必須</span>}
        {optional && <span className="opt">任意</span>}
        {badge}
      </div>
    )}
    {children}
    {hint && !error && <div className="small">{hint}</div>}
    {error && <div className="small" style={{ color: "var(--danger)" }}>{error}</div>}
  </div>
);

const Input = (props) => <input className={"field " + (props.lg ? "field-lg " : "") + (props.className || "")} {...props} lg={undefined} />;
const Textarea = (props) => <textarea className={"field " + (props.className || "")} {...props} />;
const Select = ({ children, ...p }) => <select className={"field " + (p.className || "")} {...p}>{children}</select>;

// ---------- Search ----------
const Search = ({ value, onChange, placeholder }) => (
  <div className="search-shell">
    <Icon name="search" size={16} className="search-icon" />
    <input className="field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

// ---------- Drawer ----------
const Drawer = ({ open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog">
        {children}
      </div>
    </>
  );
};

// ---------- Modal ----------
const Modal = ({ open, onClose, children, maxWidth }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal-wrap" onClick={onClose}>
        <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </>
  );
};

// ---------- Toast ----------
const ToastCtx = React.createContext(() => {});
const useToast = () => React.useContext(ToastCtx);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, tone = "default") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.tone}>
            {t.tone === "ok" && <Icon name="checkCircle" size={14} />}
            {t.tone === "warn" && <Icon name="alertTriangle" size={14} />}
            {t.tone === "danger" && <Icon name="alertTriangle" size={14} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

// ---------- Key-Value list ----------
const KVList = ({ rows }) => (
  <div className="kv">
    {rows.map((r, i) => (
      <div key={i} className="kv-row">
        <div className="kv-k">{r.k}</div>
        <div className={"kv-v" + (r.v ? "" : " empty")}>{r.v || "—"}</div>
      </div>
    ))}
  </div>
);

// ---------- External link row ----------
const LINK_ICONS = {
  urlWebsite: "external", urlX: "external", urlInstagram: "external",
  urlFacebook: "external", urlLinkedin: "external", urlNote: "external",
  urlYoutube: "external", urlThreads: "external", urlTiktok: "external",
};
const LINK_LABELS = {
  urlWebsite: "Web", urlX: "X", urlInstagram: "Instagram", urlFacebook: "Facebook",
  urlLinkedin: "LinkedIn", urlNote: "note", urlYoutube: "YouTube", urlThreads: "Threads", urlTiktok: "TikTok",
};

const LinkPills = ({ member }) => {
  const keys = Object.keys(LINK_LABELS).filter((k) => member[k]);
  if (!keys.length) return <div className="small muted">リンクは未登録です</div>;
  return (
    <div className="row-wrap">
      {keys.map((k) => (
        <a key={k} className="link-ext" href={member[k]} target="_blank" rel="noreferrer">
          <Icon name="link" size={13} className="link-icon" />
          <span>{LINK_LABELS[k]}</span>
          <Icon name="external" size={11} className="link-icon" />
        </a>
      ))}
    </div>
  );
};

// ---------- zone / status chip helpers ----------
const zoneTone = (z) => z === "0→1" ? "info" : z === "1→10" ? "accent" : "ok";
const statusTone = (s) => s === "会員" ? "ok" : s === "アカデミー生" ? "accent" : "default";

Object.assign(window, {
  Chip, Avatar, Button, Switch, Segmented, Field, Input, Textarea, Select,
  Search, Drawer, Modal, ToastCtx, useToast, ToastProvider, KVList, LinkPills,
  LINK_LABELS, zoneTone, statusTone, AvatarStoreProvider, useAvatarStore, readFileAsDataURL,
});
