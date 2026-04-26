// Main app: routing, sidebar, tweaks

const TWEAK_DEFAULS = /*EDITMODE-BEGIN*/{
  "theme": "stone",
  "nav": "sidebar",
  "density": "comfy",
  "detailLayout": "hero",
  "editMode": false
}/*EDITMODE-END*/;

const ROUTES = {
  landing: { label: "トップ", icon: "home", group: "public" },
  members: { label: "メンバー一覧", icon: "users", group: "public" },
  member: { label: "メンバー詳細", icon: "user", group: "public", hidden: true },
  "member-form": { label: "メンバー登録", icon: "edit", group: "public" },
  login: { label: "ログイン", icon: "key", group: "public", hidden: true },
  my: { label: "マイページ", icon: "user", group: "member" },
  "admin-dashboard": { label: "ダッシュボード", icon: "barChart", group: "admin" },
  "admin-members": { label: "メンバー管理", icon: "users", group: "admin" },
  "admin-tags": { label: "タグ割当", icon: "tag", group: "admin" },
  "schema-diff": { label: "スキーマ差分", icon: "gitCompare", group: "admin" },
};

const App = () => {
  const [route, setRoute] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ubm-route") || "null");
      if (saved && ROUTES[saved.name]) return saved;
    } catch {}
    return { name: "landing", params: {} };
  });
  const [tweaks, setTweaks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ubm-tweaks") || "null");
      return { ...TWEAK_DEFAULS, ...(saved || {}) };
    } catch { return TWEAK_DEFAULS; }
  });

  useEffect(() => {
    localStorage.setItem("ubm-route", JSON.stringify(route));
    window.scrollTo({ top: 0 });
  }, [route]);

  useEffect(() => {
    localStorage.setItem("ubm-tweaks", JSON.stringify(tweaks));
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks]);

  // Edit mode (Tweaks toggle) contract
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweaks((t) => ({ ...t, editMode: true }));
      if (e.data?.type === "__deactivate_edit_mode") setTweaks((t) => ({ ...t, editMode: false }));
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  const nav = useCallback((name, params = {}) => setRoute({ name, params }), []);

  const updateTweak = (k, v) => {
    setTweaks((t) => ({ ...t, [k]: v }));
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [k]: v } }, "*");
  };

  const Page = useMemo(() => {
    const map = {
      landing: LandingPage,
      members: MemberListPage,
      member: MemberDetailPage,
      "member-form": MemberFormPage,
      login: LoginPage,
      my: MyProfilePage,
      "admin-dashboard": AdminDashboardPage,
      "admin-members": AdminMembersPage,
      "admin-tags": AdminTagsPage,
      "schema-diff": SchemaDiffPage,
    };
    return map[route.name] || LandingPage;
  }, [route.name]);

  // login/form use their own full-page shell (no nav chrome)
  const isBare = route.name === "login";

  if (isBare) {
    return (
      <ToastProvider>
        <AvatarStoreProvider>
          <Page nav={nav} params={route.params} tweaks={tweaks}/>
          {tweaks.editMode && <TweaksPanel tweaks={tweaks} update={updateTweak}/>}
        </AvatarStoreProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AvatarStoreProvider>
      <div className={"app"}>
        <div className={"app-grid nav-" + tweaks.nav}>
          {tweaks.nav === "sidebar" && <Sidebar route={route} nav={nav}/>}
          <div>
            {tweaks.nav === "topbar" && <Topbar route={route} nav={nav}/>}
            {tweaks.nav === "minimal" && <MinimalBar route={route} nav={nav}/>}
            <div className="content-area">
              <Page nav={nav} params={route.params} tweaks={tweaks}/>
            </div>
          </div>
        </div>
        {tweaks.editMode && <TweaksPanel tweaks={tweaks} update={updateTweak}/>}
      </div>
      </AvatarStoreProvider>
    </ToastProvider>
  );
};

// ---------- Sidebar ----------
const Sidebar = ({ route, nav }) => {
  const groups = [
    { key: "public", label: "Public", items: ["landing", "members", "member-form"] },
    { key: "member", label: "Members", items: ["my"] },
    { key: "admin", label: "Admin", items: ["admin-dashboard", "admin-members", "admin-tags", "schema-diff"] },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">兵</div>
        <div className="brand-title">
          <span className="jp">UBM兵庫支部会</span>
          <span className="en">Member Portal</span>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.key} className="nav-section">
          <div className="nav-label">{g.label}</div>
          {g.items.map((key) => (
            <button key={key} className={"nav-item" + (route.name === key ? " active" : "")} onClick={() => nav(key)}>
              <Icon name={ROUTES[key].icon} size={16} className="nav-icon"/>
              <span>{ROUTES[key].label}</span>
              {key === "schema-diff" && <Chip size="sm" tone="warn" style={{ marginLeft: "auto" }}>2</Chip>}
            </button>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="user-chip">
          <Avatar name="山田 太郎" size="sm" hue={0}/>
          <div className="user-chip-body">
            <div className="user-chip-name">山田 太郎</div>
            <div className="user-chip-email">taro@example.com</div>
          </div>
        </div>
        <button className="nav-item" onClick={() => nav("login")}>
          <Icon name="logOut" size={14} className="nav-icon"/><span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
};

// ---------- Topbar ----------
const Topbar = ({ route, nav }) => {
  const items = ["landing", "members", "member-form", "my", "admin-dashboard", "admin-members", "admin-tags", "schema-diff"];
  return (
    <div className="topbar">
      <div className="brand" style={{ borderBottom: 0, padding: 0 }}>
        <div className="brand-mark">兵</div>
        <div className="brand-title">
          <span className="jp">UBM兵庫支部会</span>
        </div>
      </div>
      <div className="topbar-nav" style={{ flex: 1, overflow: "auto" }}>
        {items.map((key) => (
          <button key={key} className={"nav-item" + (route.name === key ? " active" : "")} onClick={() => nav(key)}>
            <Icon name={ROUTES[key].icon} size={13} className="nav-icon"/>
            <span>{ROUTES[key].label}</span>
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 10 }}>
        <Button variant="ghost" size="sm" icon="bell"/>
        <Avatar name="山田 太郎" size="sm" hue={0}/>
      </div>
    </div>
  );
};

// ---------- MinimalBar ----------
const MinimalBar = ({ route, nav }) => (
  <div style={{ padding: "20px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div className="brand" style={{ borderBottom: 0, padding: 0, cursor: "pointer" }} onClick={() => nav("landing")}>
      <div className="brand-mark">兵</div>
      <div className="brand-title">
        <span className="jp">UBM兵庫支部会</span>
        <span className="en">Member Portal</span>
      </div>
    </div>
    <div className="row" style={{ gap: 6 }}>
      <Button variant={route.name === "landing" ? "soft" : "ghost"} size="sm" onClick={() => nav("landing")}>Top</Button>
      <Button variant={route.name === "members" ? "soft" : "ghost"} size="sm" onClick={() => nav("members")}>メンバー</Button>
      <Button variant={route.name === "my" ? "soft" : "ghost"} size="sm" onClick={() => nav("my")}>マイページ</Button>
      <Button variant={route.name === "admin-dashboard" ? "soft" : "ghost"} size="sm" onClick={() => nav("admin-dashboard")}>管理</Button>
      <Avatar name="山田 太郎" size="sm" hue={0}/>
    </div>
  </div>
);

// ---------- Tweaks panel ----------
const TweaksPanel = ({ tweaks, update }) => (
  <div className="tweaks">
    <div className="tweaks-head">
      <div className="row" style={{ gap: 8 }}>
        <Icon name="sliders" size={14} style={{ color: "var(--accent)" }}/>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Tweaks</span>
      </div>
      <Chip tone="accent" dot>LIVE</Chip>
    </div>
    <div className="tweaks-body">
      <div className="stack-sm">
        <div className="tweak-group-label">Theme</div>
        <Segmented value={tweaks.theme} onChange={(v) => update("theme", v)} options={[
          { value: "stone", label: "Stone" }, { value: "warm", label: "Warm" }, { value: "cool", label: "Cool" },
        ]}/>
      </div>
      <div className="stack-sm">
        <div className="tweak-group-label">Navigation</div>
        <Segmented value={tweaks.nav} onChange={(v) => update("nav", v)} options={[
          { value: "sidebar", label: "Side" }, { value: "topbar", label: "Top" }, { value: "minimal", label: "Min" },
        ]}/>
      </div>
      <div className="stack-sm">
        <div className="tweak-group-label">Card density</div>
        <Segmented value={tweaks.density} onChange={(v) => update("density", v)} options={[
          { value: "comfy", label: "ゆったり" }, { value: "dense", label: "密" }, { value: "list", label: "リスト" },
        ]}/>
      </div>
      <div className="stack-sm">
        <div className="tweak-group-label">Profile hero layout</div>
        <Segmented value={tweaks.detailLayout} onChange={(v) => update("detailLayout", v)} options={[
          { value: "hero", label: "Split" }, { value: "vertical", label: "Center" }, { value: "split2", label: "2-col" },
        ]}/>
      </div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
