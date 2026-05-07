# 09g. 画面ブループリント — 管理層

> 本書は `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`（658 行）を正本として、管理層画面の構造・JSX・データ contract・インタラクション・状態・a11y・コピーを画面単位で固定する。
>
> - 掲載 5 画面（`/admin`, `/admin/members`, `/admin/tags`, `/admin/requests`, `/admin/schema`）は prototype の構造を JSX inline で完全再現する。`/admin/requests` は prototype `pages-admin.jsx` には未定義であるが、`docs/00-getting-started-manual/specs/11-admin-management.md`（申請受付）で定義された必須運用画面のため、Members 画面の `FilterBar + Table + Drawer` 語彙に厳密に準拠して掲載扱いで記述する。
> - 未掲載 3 派生画面（`/admin/meetings`, `/admin/identity-conflicts`, `/admin/audit`）は §3 派生ルールに従い、共通 admin layout 部品の組み合わせとして blueprint 化する。
> - OKLch token / 余白 / shadow / typography は dashboard / members の語彙だけを語彙集として再利用する（新規 token は導入しない）。

---

## 0. 対象画面

| # | ルート | 画面名 | 出典 | レイアウト主形 |
|---|--------|--------|------|----------------|
| 1 | `/(admin)/admin` | 管理ダッシュボード | `pages-admin.jsx` `AdminDashboardPage` (L4–L159) | Alert + KPI Grid + 2-col + Shortcut Grid |
| 2 | `/(admin)/admin/members` | 会員管理 | `pages-admin.jsx` `AdminMembersPage` (L161–L366) | FilterBar + Table + Drawer |
| 3 | `/(admin)/admin/tags` | タグ割当キュー | `pages-admin.jsx` `AdminTagsPage` (L368–L505) | Side-by-side（Queue / Editor） |
| 4 | `/(admin)/admin/meetings` | 開催日 ※未掲載派生 | 派生（spec 11） | Table + Modal Form |
| 5 | `/(admin)/admin/requests` | 申請管理 | spec 11 + Members 派生 | FilterBar + Table + Drawer |
| 6 | `/(admin)/admin/schema` | スキーマ差分レビュー | `pages-admin.jsx` `SchemaDiffPage` (L507–L656) | Revision Header + Diff List + 2-col History |
| 7 | `/(admin)/admin/identity-conflicts` | 同一人物コンフリクト ※未掲載派生 | 派生（spec 11） | 2-col Side-by-side Compare + 行内 inline form |
| 8 | `/(admin)/admin/audit` | 監査ログ ※未掲載派生 | 派生（spec 11） | FilterBar + Timeline |

## 共通設計前提

- `app.jsx` `Sidebar` (L119–L163) で `admin-dashboard` / `admin-members` / `admin-tags` / `schema-diff` の 4 ルートを正本登録。本書で定義する `meetings` / `requests` / `identity-conflicts` / `audit` は `Sidebar` の `admin` グループに段階追加することを前提とする（§1.1）。
- すべてのページ ルートは `<div className="page-enter ...">` で開始し、`page-head` に `eyebrow` + `h-page` + `muted` 説明 + `btn-row` を配置する。
- データ取得 contract は `apps/api/` の `/admin/*` エンドポイントとし、`apps/web/` から D1 直接アクセスは禁止する（CLAUDE.md 不変条件 5）。
- 各画面の OKLch token は `var(--accent)` / `var(--ok)` / `var(--warn)` / `var(--danger)` / `var(--info)` / `var(--text)` / `var(--text-2)` / `var(--text-3)` / `var(--bg)` を語彙とする。

---

## 1. 共通レイアウト

### 1.1 AdminSidebar 構造（task-15 責務集約）

`app.jsx` `Sidebar` (L119–L163) を起点に、admin グループを以下の構造で固定する。

```jsx
// AdminSidebar — admin 層レイアウトの責務集約点
// 出典: app.jsx L119-L163 を admin スコープに拡張
const AdminSidebar = ({ route, nav, badges }) => {
  const groups = [
    {
      key: "admin",
      label: "Admin",
      items: [
        { key: "admin-dashboard",        icon: "barChart",   label: "ダッシュボード" },
        { key: "admin-members",          icon: "users",      label: "メンバー管理" },
        { key: "admin-tags",             icon: "tag",        label: "タグ割当", badge: badges?.untagged },
        { key: "admin-meetings",         icon: "calendar",   label: "開催日" },
        { key: "admin-requests",         icon: "inbox",      label: "申請管理", badge: badges?.requestsPending },
        { key: "schema-diff",            icon: "gitCompare", label: "スキーマ差分", badge: badges?.schemaUnresolved },
        { key: "admin-identity",         icon: "userCheck",  label: "同一人物コンフリクト", badge: badges?.conflicts },
        { key: "admin-audit",            icon: "fileText",   label: "監査ログ" },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">兵</div>
        <div className="brand-title">
          <span className="jp">UBM兵庫支部会</span>
          <span className="en">Admin Console</span>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.key} className="nav-section">
          <div className="nav-label">{g.label}</div>
          {g.items.map((it) => (
            <button
              key={it.key}
              className={"nav-item" + (route.name === it.key ? " active" : "")}
              onClick={() => nav(it.key)}
              aria-current={route.name === it.key ? "page" : undefined}
            >
              <Icon name={it.icon} size={16} className="nav-icon"/>
              <span>{it.label}</span>
              {it.badge > 0 && (
                <Chip size="sm" tone="warn" style={{ marginLeft: "auto" }}>{it.badge}</Chip>
              )}
            </button>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="user-chip">
          <Avatar name="管理者" size="sm" hue={0}/>
          <div className="user-chip-body">
            <div className="user-chip-name">管理者</div>
            <div className="user-chip-email">admin@example.com</div>
          </div>
        </div>
        <button className="nav-item" onClick={() => nav("login")}>
          <Icon name="logOut" size={14} className="nav-icon"/><span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
};
```

**active 表現**:
- `nav-item.active` は背景に `color-mix(in oklch, var(--accent) 12%, transparent)`、文字色を `var(--text)`、左 2px の `var(--accent)` インディケータを付与する（`styles.css` 準拠）。
- `aria-current="page"` を必ず付与する。

**collapsible 表現**:
- 既定は常時展開。狭幅（`max-width: 1024px`）では `aside.sidebar` が drawer 化し、`<button class="btn btn-ghost btn-icon" data-toggle="sidebar">` でトグルする。
- アイコンのみ表示モード（`.sidebar.collapsed`）では `.nav-item span` が `display: none`、`badge` は `right: 4px` の `dot` 表現に縮退する。

**badge 仕様**:
- `tags` は未タグ件数、`requests` は `pending` 件数、`schema-diff` は `unresolved + added` 件数、`identity-conflicts` は未解決コンフリクト件数。
- 0 件の場合は描画しない（`it.badge > 0` ガード）。

### 1.2 ヘッダ / breadcrumbs / page-title / actions 領域

すべての admin 画面は以下の `page-head` パターンを共通化する。

```jsx
// Common page-head pattern — admin layer
<div className="page-head">
  <div>
    <div className="eyebrow">ADMIN / {SECTION}</div>     {/* breadcrumbs 相当 */}
    <h1 className="h-page">{画面タイトル}</h1>          {/* page-title */}
    <p className="muted">{1 行説明}</p>                  {/* sub copy */}
  </div>
  <div className="btn-row">
    {/* actions: ghost (secondary) → primary の順、最大 3 個 */}
  </div>
</div>
```

- `eyebrow` は `text-transform: uppercase`、`letter-spacing: 0.08em`、色 `var(--text-3)`、サイズ 11px。
- `h-page` は 24px / `font-weight: 700` / `letter-spacing: -0.01em` / 色 `var(--text)`。
- `muted` は 13.5px / 色 `var(--text-2)` / `line-height: 1.6`。
- `btn-row` は右寄せ flex、`gap: 8px`、最終要素のみ `variant="primary"`。

### 1.3 共通 admin layout 部品の語彙

| 部品 | クラス | 用途 |
|------|--------|------|
| KPI Grid | `.grid-4` + `.card.stat` | 4 指標横並び |
| 2-col Grid | `.grid-2` | 分布 / アクティビティ等 2 カード横並び |
| Shortcut Grid | `.grid-3` + `.card-hover` | 主要画面への遷移カード |
| FilterBar | `.card.card-pad` + `Field`/`Search`/`pill-nav` | フィルタ + 件数 |
| Table | `.tbl` | 行クリックで Drawer / Modal |
| Drawer | `<Drawer open onClose>` | 右寄せ 480px、`drawer-head` / `drawer-body` / `drawer-foot` |
| Modal | `<Modal open onClose>` (派生で使用) | 中央 560px |
| Side-by-side | `.grid-2` + `position: sticky; top: 20` 右ペイン | Queue + Editor |
| Timeline | `.timeline` + `.tl-row` (`.tl-date`) | アクティビティ・監査ログ |
| Inline Form | `<Input>` + `<Button size="sm">` の `.row` | unresolved 行内編集 |

---

## 2. 画面別ブループリント

### 2.1 `/(admin)/admin` — 管理ダッシュボード

#### 2.1.1 ルート・認可

- ルート: `/(admin)/admin`
- 認可: `role === "admin"`。`role !== "admin"` は `/(member)/my` に 302 リダイレクト。
- Sidebar active: `admin-dashboard`。

#### 2.1.2 レイアウトパターン

`Alert(条件付き) + KPI Grid(.grid-4) + 2-col(.grid-2) + Shortcut Grid(.grid-3)`。
ルート: `<div className="page-enter stack-lg">`（縦間隔 `--space-lg`）。

#### 2.1.3 セクション分解 + 完全 JSX

prototype `pages-admin.jsx` L4–L159 を一次転記する。

```jsx
const AdminDashboardPage = ({ nav }) => {
  const { MEMBERS, MEETINGS, SCHEMA_DIFF } = window.UBM;
  const visible = MEMBERS.filter((m) => !m.isDeleted);
  const pending = SCHEMA_DIFF.filter((d) => d.type === "unresolved" || d.type === "added").length;
  const byZone = ["0→1", "1→10", "10→100"].map((z) => ({ z, n: visible.filter((m) => m.ubmZone === z).length }));
  const byStatus = ["会員", "アカデミー生", "非会員"].map((s) => ({ s, n: visible.filter((m) => m.ubmMembershipType === s).length }));
  const untagged = visible.filter((m) => !m.tags || m.tags.length === 0);
  const notPublic = visible.filter((m) => !m.isPublic);

  return (
    <div className="page-enter stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1 className="h-page">管理ダッシュボード</h1>
          <p className="muted">フォーム回答・スキーマ・メンバーの健全性を一画面で把握できます。</p>
        </div>
        <div className="btn-row">
          <span className="badge-sync"><span className="dot"/>Google Forms と同期中</span>
          <Button variant="ghost" icon="refresh">今すぐ同期</Button>
        </div>
      </div>

      {/* Alerts */}
      {pending > 0 && (
        <div className="card card-pad" style={{ background: "var(--warn-soft)", borderColor: "color-mix(in oklch, var(--warn) 20%, transparent)" }}>
          <div className="row-between">
            <div className="row" style={{ gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--warn)", color: "#fff", display: "grid", placeItems: "center" }}>
                <Icon name="alertTriangle" size={18}/>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "oklch(0.35 0.12 75)" }}>フォームスキーマに未解決の変更があります</div>
                <div className="small" style={{ color: "oklch(0.40 0.10 75)" }}>{pending}件の項目をレビューしてください。stableKey の割り当てが必要な項目があります。</div>
              </div>
            </div>
            <Button variant="ghost" iconRight="arrowRight" onClick={() => nav("schema-diff")}>差分をレビュー</Button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid-4">
        <div className="card stat">
          <div className="stat-label">Total members</div>
          <div className="stat-value">{visible.length}</div>
          <div className="stat-sub">退会: {MEMBERS.length - visible.length}名</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Public on site</div>
          <div className="stat-value">{visible.filter((m) => m.isPublic).length}</div>
          <div className="stat-sub">非公開: {notPublic.length}名</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Untagged</div>
          <div className="stat-value" style={{ color: untagged.length > 0 ? "var(--warn)" : undefined }}>{untagged.length}</div>
          <div className="stat-sub">タグ割当が必要</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Schema issues</div>
          <div className="stat-value" style={{ color: pending > 0 ? "var(--warn)" : "var(--ok)" }}>{pending}</div>
          <div className="stat-sub">未解決の変更</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Zone distribution */}
        <div className="card card-pad-lg">
          <div className="row-between">
            <div>
              <div className="eyebrow">DISTRIBUTION</div>
              <h2 className="h-section" style={{ marginTop: 8 }}>UBM区画の分布</h2>
            </div>
            <Icon name="barChart" size={18} style={{ color: "var(--text-3)" }}/>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            {byZone.map((r) => (
              <div key={r.z}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Chip tone={zoneTone(r.z)} dot>{r.z}</Chip>
                    <span className="small" style={{ color: "var(--text-2)", fontWeight: 500 }}>{r.z === "0→1" ? "立ち上げ" : r.z === "1→10" ? "拡大" : "組織化"}</span>
                  </div>
                  <span className="mono" style={{ fontWeight: 600 }}>{r.n}名</span>
                </div>
                <div style={{ height: 8, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(r.n / visible.length) * 100}%`, background: `var(--${r.z === "0→1" ? "info" : r.z === "1→10" ? "accent" : "ok"})`, borderRadius: 4 }}/>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" style={{ margin: "20px 0" }}/>
          <div className="stack-sm">
            <div className="eyebrow">BY STATUS</div>
            <div className="row-wrap">
              {byStatus.map((r) => (
                <div key={r.s} className="card-flat" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <div className="small">{r.s}</div>
                  <div className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{r.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="card card-pad-lg">
          <div className="row-between">
            <div>
              <div className="eyebrow">ACTIVITY</div>
              <h2 className="h-section" style={{ marginTop: 8 }}>最近の支部会と出席</h2>
            </div>
            <Icon name="activity" size={18} style={{ color: "var(--text-3)" }}/>
          </div>
          <div className="timeline" style={{ marginTop: 10 }}>
            {MEETINGS.slice(0, 5).map((mt) => (
              <div key={mt.id} className="tl-row">
                <div className="tl-date">
                  <div className="tl-y">{mt.date.slice(0, 7)}</div>
                  <div>{mt.date.slice(8)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{mt.label}</div>
                  <div className="small">{mt.note}</div>
                </div>
                <Chip tone="ok">{mt.attendees}名</Chip>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="grid-3">
        <div className="card card-pad card-hover" onClick={() => nav("admin-members")} style={{ cursor: "pointer" }}>
          <Icon name="users" size={22} style={{ color: "var(--accent)" }}/>
          <h3 className="h-card" style={{ marginTop: 10 }}>メンバー管理</h3>
          <div className="small" style={{ marginTop: 4 }}>公開可否・編集・論理削除</div>
          <Icon name="arrowRight" size={14} style={{ color: "var(--text-3)", marginTop: 8 }}/>
        </div>
        <div className="card card-pad card-hover" onClick={() => nav("admin-tags")} style={{ cursor: "pointer" }}>
          <Icon name="tag" size={22} style={{ color: "var(--accent)" }}/>
          <h3 className="h-card" style={{ marginTop: 10 }}>タグ割当</h3>
          <div className="small" style={{ marginTop: 4 }}>未タグ付け: <b style={{ color: "var(--text)" }}>{untagged.length}名</b></div>
          <Icon name="arrowRight" size={14} style={{ color: "var(--text-3)", marginTop: 8 }}/>
        </div>
        <div className="card card-pad card-hover" onClick={() => nav("schema-diff")} style={{ cursor: "pointer" }}>
          <Icon name="gitCompare" size={22} style={{ color: "var(--accent)" }}/>
          <h3 className="h-card" style={{ marginTop: 10 }}>スキーマ差分</h3>
          <div className="small" style={{ marginTop: 4 }}>未解決: <b style={{ color: "var(--warn)" }}>{pending}件</b></div>
          <Icon name="arrowRight" size={14} style={{ color: "var(--text-3)", marginTop: 8 }}/>
        </div>
      </div>
    </div>
  );
};
```

#### 2.1.4 データ contract（API endpoint）

| endpoint | method | response | 用途 |
|----------|--------|----------|------|
| `/admin/dashboard` | GET | `{ totals: {members, public, untagged}, schema: {unresolved, added}, byZone, byStatus, recentMeetings }` | 画面起動時の集計取得 |
| `/admin/sync/forms` | POST | `{ jobId, startedAt }` | 「今すぐ同期」 |
| `/admin/dashboard/sync-status` | GET | `{ status: "syncing"\|"idle", lastSyncedAt }` | `badge-sync` の表示状態 |

集計はサーバ側で確定値を返す。クライアント側の `MEMBERS.filter` は prototype 互換のフォールバック表現に限定する。

#### 2.1.5 インタラクション

- `今すぐ同期`: `POST /admin/sync/forms` 発火 → `badge-sync` の `dot` をパルスアニメ → 完了 toast `Forms から同期しました`。
- `差分をレビュー`: `nav("schema-diff")`。Alert カードの右ボタン全体がクリック可能。
- `Shortcut Grid` カード: 全領域クリックで遷移、`card-hover` で `transform: translateY(-2px)` + shadow 強調。

#### 2.1.6 状態（loading / error / empty / data）

| 状態 | 表現 |
|------|------|
| loading | KPI 4 枚を `<Skeleton h="64px"/>`、`grid-2` を `<Skeleton h="280px"/>` 2 枚 |
| error | ページ先頭に `tone=danger` の `card-pad`、`再試行` ボタン |
| empty (members 0) | KPI は `0` 表示、`grid-2` 内 timeline は `empty-state`（`Icon=calendar`, "支部会がまだ登録されていません"） |
| data | 上記 prototype JSX |

#### 2.1.7 a11y

- `<h1>` は 1 つ、`<h2 className="h-section">` を各カードに 1 つずつ。
- Alert カードに `role="alert"` を付与（pending > 0 の動的描画）。
- KPI `stat-value` の数値は `<span aria-label="{label}: {value} 名">` でスクリーンリーダ向け補助。
- Shortcut Grid カードはクリッカブル div ではなく `<button>` に置き換える、または `role="link" tabIndex={0}` + `onKeyDown(Enter/Space)` を必須付与。
- `sync` ボタンは処理中 `aria-busy="true"` を付与。

#### 2.1.8 コピー（原文）

- eyebrow: `ADMIN`
- h1: `管理ダッシュボード`
- muted: `フォーム回答・スキーマ・メンバーの健全性を一画面で把握できます。`
- badge: `Google Forms と同期中`
- ghost button: `今すぐ同期`
- alert title: `フォームスキーマに未解決の変更があります`
- alert sub: `{n}件の項目をレビューしてください。stableKey の割り当てが必要な項目があります。`
- alert action: `差分をレビュー`
- KPI labels: `Total members` / `Public on site` / `Untagged` / `Schema issues`
- KPI subs: `退会: {n}名` / `非公開: {n}名` / `タグ割当が必要` / `未解決の変更`
- section eyebrows: `DISTRIBUTION` / `BY STATUS` / `ACTIVITY`
- section titles: `UBM区画の分布` / `最近の支部会と出席`
- zone label suffix: `0→1` → `立ち上げ` / `1→10` → `拡大` / `10→100` → `組織化`
- shortcut titles: `メンバー管理` / `タグ割当` / `スキーマ差分`
- shortcut subs: `公開可否・編集・論理削除` / `未タグ付け: {n}名` / `未解決: {n}件`

#### 2.1.9 prototype 出典 / 未掲載派生ルール

- 出典: `pages-admin.jsx` L4–L159（`AdminDashboardPage`）。
- 派生なし（dashboard は完全に prototype 準拠）。

---

### 2.2 `/(admin)/admin/members` — 会員管理

#### 2.2.1 ルート・認可

- ルート: `/(admin)/admin/members`
- 認可: `role === "admin"`。
- Sidebar active: `admin-members`。

#### 2.2.2 レイアウトパターン

`page-head + FilterBar(.card.card-pad) + Table(.tbl) + Drawer`。
ルート: `<div className="page-enter">`。

#### 2.2.3 セクション分解 + 完全 JSX

prototype `pages-admin.jsx` L161–L366 を一次転記する。

```jsx
const AdminMembersPage = ({ nav }) => {
  const { MEMBERS, ALL_TAGS } = window.UBM;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [selected, setSelected] = useState(null);
  const [local, setLocal] = useState(MEMBERS);

  const rows = local.filter((m) => {
    if (filterState === "public" && !m.isPublic) return false;
    if (filterState === "private" && m.isPublic) return false;
    if (filterState === "deleted" && !m.isDeleted) return false;
    if (filterState !== "deleted" && m.isDeleted) return false;
    if (q) {
      const hay = [m.fullName, m.email, m.occupation].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const toggleVisibility = (id) => {
    setLocal((l) => l.map((m) => m.id === id ? { ...m, isPublic: !m.isPublic } : m));
    toast("公開ステータスを更新しました", "ok");
  };

  const member = selected ? local.find((m) => m.id === selected) : null;
  const updateMember = (patch) => setLocal((l) => l.map((m) => m.id === selected ? { ...m, ...patch } : m));

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / MEMBERS</div>
          <h1 className="h-page">メンバー管理</h1>
          <p className="muted">回答データ・公開フラグ・タグ付けをここから操作します。</p>
        </div>
        <div className="btn-row">
          <Button variant="ghost" icon="upload">CSV エクスポート</Button>
          <Button variant="primary" icon="refresh">Forms から取り込み</Button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "end" }}>
          <Field label="検索"><Search value={q} onChange={setQ} placeholder="名前・メール・職業..."/></Field>
          <Field label="状態">
            <div className="pill-nav">
              {[
                { v: "all", l: "すべて" },
                { v: "public", l: "公開中" },
                { v: "private", l: "非公開" },
                { v: "deleted", l: "退会済み" },
              ].map((o) => (
                <button key={o.v} className={filterState === o.v ? "active" : ""} onClick={() => setFilterState(o.v)}>{o.l}</button>
              ))}
            </div>
          </Field>
          <div className="small" style={{ paddingBottom: 10 }}>{rows.length}件</div>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            <th>メンバー</th>
            <th>メール</th>
            <th>区画 / ステータス</th>
            <th>タグ</th>
            <th>最終更新</th>
            <th style={{ width: 140 }}>公開</th>
            <th style={{ width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} onClick={() => setSelected(m.id)}>
              <td><Avatar name={m.fullName} size="sm" hue={m.hue} id={m.id}/></td>
              <td>
                <div style={{ fontWeight: 600 }}>{m.fullName}</div>
                <div className="small">{m.occupation}</div>
              </td>
              <td className="mono small">{m.email}</td>
              <td>
                <div className="chip-row">
                  <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
                  <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
                </div>
              </td>
              <td>
                {(m.tags || []).length ? (
                  <div className="chip-row">
                    {(m.tags || []).slice(0, 2).map((t) => <Chip key={t}>{t}</Chip>)}
                    {m.tags.length > 2 && <Chip>+{m.tags.length - 2}</Chip>}
                  </div>
                ) : <Chip tone="warn" dot>未タグ</Chip>}
              </td>
              <td className="small mono">{m.updatedAt}</td>
              <td onClick={(e) => e.stopPropagation()}>
                {m.isDeleted ? (
                  <Chip tone="danger">退会</Chip>
                ) : (
                  <div className="row" style={{ gap: 8 }}>
                    <Switch on={m.isPublic} onToggle={() => toggleVisibility(m.id)}/>
                    <span className="small">{m.isPublic ? "公開" : "非公開"}</span>
                  </div>
                )}
              </td>
              <td onClick={(e) => { e.stopPropagation(); setSelected(m.id); }}>
                <Button variant="ghost" size="sm" icon="edit"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {member && (
          <>
            <div className="drawer-head">
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={member.fullName} hue={member.hue} id={member.id}/>
                <div>
                  <div className="h-section" style={{ fontSize: 16 }}>{member.fullName}</div>
                  <div className="small mono">{member.email} · {member.responseId}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}><Icon name="x"/></button>
            </div>
            <div className="drawer-body">
              <div>
                <div className="eyebrow">VISIBILITY</div>
                <div className="card-flat" style={{ padding: 14, marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="row-between">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>サイト公開</div>
                      <div className="small">メンバー一覧や詳細ページに掲載</div>
                    </div>
                    <Switch on={member.isPublic} onToggle={() => updateMember({ isPublic: !member.isPublic })}/>
                  </div>
                  <div className="divider"/>
                  <div className="row-between">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>管理者メモ</div>
                      <div className="small">本人には見えません</div>
                    </div>
                  </div>
                  <Textarea rows={3} placeholder="管理者用メモ..." defaultValue=""/>
                </div>
              </div>

              <div>
                <div className="eyebrow">TAGS</div>
                <div className="card-flat" style={{ padding: 14, marginTop: 8 }}>
                  <div className="row-wrap">
                    {ALL_TAGS.slice(0, 14).map((t) => {
                      const on = (member.tags || []).includes(t);
                      return (
                        <button key={t} className={"tag-pill" + (on ? " selected" : "")} onClick={() => {
                          const cur = member.tags || [];
                          updateMember({ tags: on ? cur.filter((x) => x !== t) : [...cur, t] });
                        }}>
                          {on && <Icon name="check" size={11}/>}{t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="eyebrow">FORM RESPONSE</div>
                <KVList rows={[
                  { k: "回答ID", v: member.responseId },
                  { k: "送信日時", v: member.submittedAt },
                  { k: "UBM区画", v: member.ubmZone },
                  { k: "ステータス", v: member.ubmMembershipType },
                  { k: "お住まい", v: member.location },
                  { k: "職業", v: member.occupation },
                  { k: "ビジネス概要", v: member.businessOverview },
                ]}/>
              </div>

              {member.isDeleted && (
                <div className="card-flat" style={{ padding: 14, background: "var(--danger-soft)", borderColor: "color-mix(in oklch, var(--danger) 18%, transparent)" }}>
                  <div className="eyebrow" style={{ color: "var(--danger)" }}>DELETED</div>
                  <div className="small" style={{ marginTop: 6, color: "var(--text-2)" }}>
                    退会日: {member.deletedAt} · 理由: {member.deletedReason}
                  </div>
                  <Button variant="ghost" size="sm" icon="undo" style={{ marginTop: 10 }}>復元する</Button>
                </div>
              )}
            </div>
            <div className="drawer-foot">
              {!member.isDeleted && <Button variant="danger" icon="trash">退会処理（論理削除）</Button>}
              <div style={{ flex: 1 }}/>
              <Button variant="ghost" onClick={() => setSelected(null)}>閉じる</Button>
              <Button variant="primary" icon="check" onClick={() => { toast("保存しました", "ok"); setSelected(null); }}>保存</Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};
```

#### 2.2.4 データ contract（API endpoint）

| endpoint | method | request | response | 用途 |
|----------|--------|---------|----------|------|
| `/admin/members` | GET | `?q=&state=all\|public\|private\|deleted&page=` | `{ rows: Member[], total }` | 一覧取得 |
| `/admin/members/:id` | GET | — | `Member`（全 form 項目 + tags + deleted meta） | Drawer 起動時 |
| `/admin/members/:id/visibility` | PATCH | `{ isPublic: boolean }` | `{ ok, updatedAt }` | Switch トグル / Drawer 内トグル |
| `/admin/members/:id/tags` | PUT | `{ tags: string[] }` | `{ ok, updatedAt }` | tag-pill 編集 |
| `/admin/members/:id/note` | PUT | `{ note: string }` | `{ ok, updatedAt }` | 管理者メモ |
| `/admin/members/:id` | PATCH | `{ ...patch }` | `{ ok, updatedAt }` | Drawer 「保存」 |
| `/admin/members/:id` | DELETE | `{ reason: string }` | `{ ok, deletedAt }` | 論理削除 |
| `/admin/members/:id/restore` | POST | — | `{ ok }` | 「復元する」 |
| `/admin/members/export.csv` | GET | `?state=` | CSV stream | 「CSV エクスポート」 |
| `/admin/sync/forms` | POST | — | `{ jobId }` | 「Forms から取り込み」 |

`Member` 型は `data.jsx` `MEMBERS` の構造（spec 04 参照）に準拠する。

#### 2.2.5 インタラクション

**フィルタ**:
- `Search`: 入力で 250ms debounce、`fullName` / `email` / `occupation` を case-insensitive 部分一致。
- `pill-nav`: `all` / `public` / `private` / `deleted` 排他。`deleted` を選んだ時のみ `isDeleted=true` 行が現れる。

**ソート**: prototype は未指定。MVP は `updatedAt DESC` 固定。表ヘッダ `最終更新` を将来拡張点として残す。

**bulk action 手順**:
1. 表先頭に `<th><Checkbox/></th>` を追加（全選択）。
2. 各行先頭の Avatar セルを `Checkbox + Avatar` の `.row` に置き換える。
3. 選択 0 件時はヘッダ右の `btn-row` を通常表示、1 件以上選択時は `<div className="bulk-bar">` を `position: sticky; top: 0` で表示する。`bulk-bar` の構成:
   - 左: `Chip tone="accent">{n}件選択</Chip>` + `クリア` ボタン。
   - 右: `公開する` / `非公開にする` / `タグ追加…` / `退会処理` の 4 ボタン。
4. `公開する` / `非公開にする` → `PATCH /admin/members:bulk-visibility`、結果を toast。
5. `タグ追加…` → `<Modal>` で `tag-pill` 選択 → `PUT /admin/members:bulk-tags`。
6. `退会処理` → `<Modal>` 確認（理由テキストエリア必須）→ `DELETE /admin/members:bulk-delete`。

**drawer 手順**:
1. 行クリック（`onClick={() => setSelected(m.id)}`）または編集ボタンで `Drawer` を 480px 幅で右からスライドイン。
2. `drawer-head`: アバター + 氏名 + email + responseId + 閉じる x ボタン。
3. `drawer-body` 4 セクション: VISIBILITY / TAGS / FORM RESPONSE / DELETED（条件）。
4. `drawer-foot`: 左に `退会処理（論理削除）` の danger、右に `閉じる` ghost + `保存` primary。
5. `保存` → `PATCH /admin/members/:id` → toast `保存しました` → drawer 閉。
6. 公開トグルは Drawer 内即時反映 + 楽観 UI、失敗時はロールバックして `tone=danger` toast。

**modal**: bulk action の確認 / タグ追加で使用。中央 560px、`backdrop` クリックで閉じる。

#### 2.2.6 状態（loading / error / empty / data）

| 状態 | 表現 |
|------|------|
| loading | FilterBar 表示済、Table 内に `<tr>` × 8 の Skeleton（行高 56px） |
| error | Table の代わりに `card card-pad` で `tone=danger`、`再読み込み` ボタン |
| empty (rows=0, q='', state='all') | `<div className="empty-state">` に `Icon=users`、`まだメンバーがいません`、`Forms から取り込み` ボタン |
| empty (rows=0, with filters) | `<div className="empty-state">`、`該当するメンバーがいません`、`フィルタをクリア` ghost button |
| data | 上記 prototype JSX |

#### 2.2.7 a11y

- `<table className="tbl">` には `<caption className="sr-only">メンバー一覧</caption>` を付与。
- 行クリックで Drawer を開く `<tr onClick>` は `role="button" tabIndex={0}` + `onKeyDown` で `Enter` / `Space` 対応必須。
- `Switch` には `role="switch" aria-checked` を必須付与し、`aria-label="{member.fullName} のサイト公開"` を併記。
- `Drawer` は `role="dialog" aria-modal="true" aria-labelledby="drawer-title"`。`Esc` キーで閉じる。フォーカストラップ必須。
- `tag-pill` は `<button aria-pressed={on}>`。

#### 2.2.8 コピー（原文）

- eyebrow: `ADMIN / MEMBERS`
- h1: `メンバー管理`
- muted: `回答データ・公開フラグ・タグ付けをここから操作します。`
- actions: `CSV エクスポート` / `Forms から取り込み`
- field labels: `検索` / `状態`
- pill-nav: `すべて` / `公開中` / `非公開` / `退会済み`
- table headers: `メンバー` / `メール` / `区画 / ステータス` / `タグ` / `最終更新` / `公開`
- chip: `未タグ` / `退会`
- switch suffix: `公開` / `非公開`
- drawer eyebrow: `VISIBILITY` / `TAGS` / `FORM RESPONSE` / `DELETED`
- drawer labels: `サイト公開` / `メンバー一覧や詳細ページに掲載` / `管理者メモ` / `本人には見えません`
- KV labels: `回答ID` / `送信日時` / `UBM区画` / `ステータス` / `お住まい` / `職業` / `ビジネス概要`
- deleted meta: `退会日: {x} · 理由: {x}` / `復元する`
- footer buttons: `退会処理（論理削除）` / `閉じる` / `保存`
- toasts: `公開ステータスを更新しました` / `保存しました`

#### 2.2.9 prototype 出典 / 未掲載派生ルール

- 出典: `pages-admin.jsx` L161–L366（`AdminMembersPage`）。
- bulk action は prototype 未実装。Drawer 語彙と `pill-nav` 語彙のみで構成（新規 token なし）。

---

### 2.3 `/(admin)/admin/tags` — タグ割当キュー

#### 2.3.1 ルート・認可

- ルート: `/(admin)/admin/tags`
- 認可: `role === "admin"`。
- Sidebar active: `admin-tags`。

#### 2.3.2 レイアウトパターン

`page-head + Side-by-side(.grid-2: Queue card / Editor card)`。
右ペイン Editor は `position: sticky; top: 20`。
ルート: `<div className="page-enter">`。

#### 2.3.3 セクション分解 + 完全 JSX

prototype `pages-admin.jsx` L368–L505 を一次転記する。

```jsx
const AdminTagsPage = ({ nav }) => {
  const { MEMBERS, TAG_CATALOG, ALL_TAGS } = window.UBM;
  const toast = useToast();
  const [local, setLocal] = useState(MEMBERS);
  const [focus, setFocus] = useState(null);

  const untagged = local.filter((m) => !m.isDeleted && (!m.tags || m.tags.length === 0));
  const tagged = local.filter((m) => !m.isDeleted && m.tags && m.tags.length > 0);

  const setTags = (id, tags) => setLocal((l) => l.map((m) => m.id === id ? { ...m, tags } : m));

  const member = focus ? local.find((m) => m.id === focus) : null;

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / TAGS</div>
          <h1 className="h-page">タグ割当</h1>
          <p className="muted">フォーム項目ではなく、管理者だけがタグを割り当てます。メンバー自身は選びません。</p>
        </div>
        <div className="btn-row">
          <Chip tone="warn" dot>未タグ {untagged.length}名</Chip>
          <Chip tone="ok">タグ済み {tagged.length}名</Chip>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "flex-start" }}>
        {/* Left: queue */}
        <div className="card card-pad-lg">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h2 className="h-section">割当キュー</h2>
            <Chip tone="accent">{untagged.length}件</Chip>
          </div>
          <div className="stack-sm">
            {untagged.length === 0 ? (
              <div className="empty-state">
                <Icon name="checkCircle" size={28} style={{ color: "var(--ok)" }}/>
                <div style={{ marginTop: 10, fontSize: 14, color: "var(--text-2)" }}>未タグ付けのメンバーはいません</div>
              </div>
            ) : untagged.map((m) => (
              <div key={m.id} className={"schema-field-card" + (focus === m.id ? " " : "")} onClick={() => setFocus(m.id)} style={{ cursor: "pointer", borderColor: focus === m.id ? "var(--accent)" : undefined }}>
                <div className="row" style={{ gap: 12 }}>
                  <Avatar name={m.fullName} size="sm" hue={m.hue} id={m.id}/>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</div>
                    <div className="small">{m.occupation}</div>
                  </div>
                </div>
                <Icon name="chevronRight" size={14} style={{ color: "var(--text-3)" }}/>
              </div>
            ))}
          </div>
          {tagged.length > 0 && (
            <>
              <div className="divider" style={{ margin: "20px 0" }}/>
              <div className="eyebrow">TAGGED</div>
              <div className="stack-sm" style={{ marginTop: 10, opacity: 0.7 }}>
                {tagged.slice(0, 4).map((m) => (
                  <div key={m.id} className="row" style={{ padding: "6px 0", cursor: "pointer" }} onClick={() => setFocus(m.id)}>
                    <Avatar name={m.fullName} size="sm" hue={m.hue} id={m.id}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.fullName}</div>
                      <div className="chip-row" style={{ marginTop: 4 }}>
                        {m.tags.slice(0, 3).map((t) => <Chip key={t}>{t}</Chip>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: editor */}
        {member ? (
          <div className="card card-pad-lg" style={{ position: "sticky", top: 20 }}>
            <div className="row" style={{ gap: 14, marginBottom: 14 }}>
              <Avatar name={member.fullName} size="lg" hue={member.hue} id={member.id}/>
              <div>
                <div className="h-card" style={{ fontSize: 18 }}>{member.fullName}</div>
                <div className="small">{member.occupation} · {member.location}</div>
                <div className="chip-row" style={{ marginTop: 8 }}>
                  <Chip tone={zoneTone(member.ubmZone)} dot>{member.ubmZone}</Chip>
                  <Chip tone={statusTone(member.ubmMembershipType)}>{member.ubmMembershipType}</Chip>
                </div>
              </div>
            </div>

            <div className="card-flat" style={{ padding: 14 }}>
              <div className="eyebrow">BUSINESS</div>
              <p className="small" style={{ color: "var(--text-2)", marginTop: 6, lineHeight: 1.7 }}>{member.businessOverview}</p>
              {member.skills && <><div className="eyebrow" style={{ marginTop: 10 }}>SKILLS</div>
                <p className="small" style={{ color: "var(--text-2)", marginTop: 4 }}>{member.skills}</p></>}
            </div>

            <div className="divider" style={{ margin: "20px 0" }}/>

            <div className="eyebrow">ASSIGN TAGS</div>
            <div className="stack" style={{ marginTop: 12 }}>
              {TAG_CATALOG.map((g) => (
                <div key={g.category}>
                  <div className="small" style={{ fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>{g.category}</div>
                  <div className="row-wrap">
                    {g.tags.map((t) => {
                      const on = (member.tags || []).includes(t);
                      return (
                        <button key={t} className={"tag-pill" + (on ? " selected" : "")}
                          onClick={() => setTags(member.id, on ? member.tags.filter((x) => x !== t) : [...(member.tags||[]), t])}>
                          {on && <Icon name="check" size={11}/>}{t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="row-between" style={{ marginTop: 20 }}>
              <div className="small">選択中: <b style={{ color: "var(--text)" }}>{(member.tags || []).length}</b>件</div>
              <Button variant="primary" icon="check" onClick={() => { toast(`${member.fullName}のタグを保存しました`, "ok"); setFocus(null); }}>
                保存して次へ
              </Button>
            </div>
          </div>
        ) : (
          <div className="card card-pad-lg" style={{ position: "sticky", top: 20 }}>
            <div className="empty-state">
              <Icon name="tag" size={28} style={{ color: "var(--text-3)" }}/>
              <div style={{ marginTop: 10, fontSize: 14 }}>左のキューからメンバーを選択してください</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 2.3.4 データ contract（API endpoint）

| endpoint | method | request | response | 用途 |
|----------|--------|---------|----------|------|
| `/admin/tags-queue` | GET | — | `{ untagged: Member[], tagged: Member[] }` | キュー初期取得 |
| `/admin/tags/catalog` | GET | — | `TagGroup[]`（`data.jsx` `TAG_CATALOG`） | カタログ取得 |
| `/admin/members/:id/tags` | PUT | `{ tags: string[] }` | `{ ok, updatedAt }` | 「保存して次へ」 |

#### 2.3.5 インタラクション

- 左キュー行クリックで `setFocus(id)`、右ペイン Editor を切替。`schema-field-card` の border が `var(--accent)` に。
- `tag-pill` クリックで楽観 UI（local state 即時反映）、`保存して次へ` で `PUT /admin/members/:id/tags` 発火、成功で toast `{name}のタグを保存しました` + `setFocus(null)` でキュー画面に戻る。
- TAGGED 下部の最大 4 件は `opacity: 0.7` で表示し、クリックで再編集できる。
- bulk action: 派生として `<Checkbox/>` をキュー行に付与し、`一括タグ追加…` Modal を開く（Members と同形式）。MVP では未実装、語彙だけ予約。

#### 2.3.6 状態

| 状態 | 表現 |
|------|------|
| loading | 左キュー Skeleton × 5、右 Editor は `empty-state`（メッセージ `読み込み中...`） |
| error | `tone=danger` の `card-pad`、`再読み込み` ボタン |
| empty (untagged 0) | 左キュー: `Icon=checkCircle` (`--ok`) + `未タグ付けのメンバーはいません` |
| empty (no focus) | 右 Editor: `Icon=tag` (`--text-3`) + `左のキューからメンバーを選択してください` |
| data | 上記 prototype JSX |

#### 2.3.7 a11y

- 左キュー行は `<button>` または `role="button" tabIndex={0}` + `aria-selected={focus===m.id}`。
- `tag-pill` は `<button aria-pressed={on} aria-label="タグ {t}">`。
- 右 Editor の選択数表示は `aria-live="polite"`。

#### 2.3.8 コピー（原文）

- eyebrow: `ADMIN / TAGS`
- h1: `タグ割当`
- muted: `フォーム項目ではなく、管理者だけがタグを割り当てます。メンバー自身は選びません。`
- chips: `未タグ {n}名` / `タグ済み {n}名`
- left section: `割当キュー` / `{n}件` / `TAGGED`
- empty (untagged 0): `未タグ付けのメンバーはいません`
- empty (no focus): `左のキューからメンバーを選択してください`
- right eyebrows: `BUSINESS` / `SKILLS` / `ASSIGN TAGS`
- footer: `選択中: {n}件` / `保存して次へ`
- toast: `{name}のタグを保存しました`

#### 2.3.9 prototype 出典 / 未掲載派生ルール

- 出典: `pages-admin.jsx` L368–L505（`AdminTagsPage`）。
- カタログ構造は `data.jsx` `TAG_CATALOG` (L77–L84) に厳密準拠。

---

### 2.4 `/(admin)/admin/requests` — 申請管理

> prototype `pages-admin.jsx` には未定義。`docs/00-getting-started-manual/specs/11-admin-management.md` の申請受付責務に基づき、Members 画面の `FilterBar + Table + Drawer` 語彙を厳密踏襲して定義する。新規 token は一切導入しない。

#### 2.4.1 ルート・認可

- ルート: `/(admin)/admin/requests`
- 認可: `role === "admin"`。
- Sidebar active: `admin-requests`。

#### 2.4.2 レイアウトパターン

`page-head + FilterBar(.card.card-pad) + Table(.tbl) + Drawer`。Members 画面の同形を厳格踏襲。

#### 2.4.3 セクション分解 + 完全 JSX

```jsx
const AdminRequestsPage = ({ nav }) => {
  const { REQUESTS = [] } = window.UBM;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [state, setState] = useState("pending");  // pending / approved / rejected / all
  const [selected, setSelected] = useState(null);
  const [local, setLocal] = useState(REQUESTS);

  const rows = local.filter((r) => {
    if (state !== "all" && r.state !== state) return false;
    if (q) {
      const hay = [r.fullName, r.email, r.kind, r.summary].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const decide = (id, next, reason) => {
    setLocal((l) => l.map((r) => r.id === id ? { ...r, state: next, decidedAt: new Date().toISOString(), reason } : r));
    toast(next === "approved" ? "申請を承認しました" : "申請を却下しました", "ok");
    setSelected(null);
  };

  const req = selected ? local.find((r) => r.id === selected) : null;

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / REQUESTS</div>
          <h1 className="h-page">申請管理</h1>
          <p className="muted">退会・公開停止・問い合わせなど、本人および管理者操作待ちの申請を確認します。</p>
        </div>
        <div className="btn-row">
          <Button variant="ghost" icon="upload">CSV エクスポート</Button>
          <Button variant="primary" icon="refresh">最新化</Button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "end" }}>
          <Field label="検索"><Search value={q} onChange={setQ} placeholder="名前・メール・種別・内容..."/></Field>
          <Field label="状態">
            <div className="pill-nav">
              {[
                { v: "pending",  l: "保留中" },
                { v: "approved", l: "承認済み" },
                { v: "rejected", l: "却下" },
                { v: "all",      l: "すべて" },
              ].map((o) => (
                <button key={o.v} className={state === o.v ? "active" : ""} onClick={() => setState(o.v)}>{o.l}</button>
              ))}
            </div>
          </Field>
          <div className="small" style={{ paddingBottom: 10 }}>{rows.length}件</div>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            <th>申請者</th>
            <th>種別</th>
            <th>内容</th>
            <th>提出日時</th>
            <th style={{ width: 120 }}>状態</th>
            <th style={{ width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => setSelected(r.id)}>
              <td><Avatar name={r.fullName} size="sm" hue={r.hue} id={r.memberId}/></td>
              <td>
                <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                <div className="small mono">{r.email}</div>
              </td>
              <td><Chip tone={r.kind === "withdraw" ? "danger" : r.kind === "unpublish" ? "warn" : "info"} dot>{r.kindLabel}</Chip></td>
              <td className="small" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.summary}</td>
              <td className="small mono">{r.submittedAt}</td>
              <td>
                {r.state === "pending"  && <Chip tone="warn"   dot>保留中</Chip>}
                {r.state === "approved" && <Chip tone="ok"     dot>承認済み</Chip>}
                {r.state === "rejected" && <Chip tone="danger" dot>却下</Chip>}
              </td>
              <td onClick={(e) => { e.stopPropagation(); setSelected(r.id); }}>
                <Button variant="ghost" size="sm" icon="edit"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {req && (
          <>
            <div className="drawer-head">
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={req.fullName} hue={req.hue} id={req.memberId}/>
                <div>
                  <div className="h-section" style={{ fontSize: 16 }}>{req.fullName}</div>
                  <div className="small mono">{req.email} · {req.id}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}><Icon name="x"/></button>
            </div>
            <div className="drawer-body">
              <div>
                <div className="eyebrow">REQUEST</div>
                <KVList rows={[
                  { k: "種別", v: req.kindLabel },
                  { k: "提出日時", v: req.submittedAt },
                  { k: "状態", v: req.state === "pending" ? "保留中" : req.state === "approved" ? "承認済み" : "却下" },
                  { k: "本人理由", v: req.summary },
                ]}/>
              </div>

              <div>
                <div className="eyebrow">ADMIN NOTE</div>
                <div className="card-flat" style={{ padding: 14, marginTop: 8 }}>
                  <Textarea rows={3} placeholder="判断理由・社内メモ..." defaultValue={req.adminNote || ""}/>
                </div>
              </div>

              {req.kind === "withdraw" && (
                <div className="card-flat" style={{ padding: 14, background: "var(--danger-soft)", borderColor: "color-mix(in oklch, var(--danger) 18%, transparent)" }}>
                  <div className="eyebrow" style={{ color: "var(--danger)" }}>IMPACT</div>
                  <div className="small" style={{ marginTop: 6, color: "var(--text-2)" }}>承認すると論理削除（isDeleted=true）が実行されます。復元は管理画面から可能です。</div>
                </div>
              )}
            </div>
            <div className="drawer-foot">
              {req.state === "pending" && <Button variant="danger" icon="x" onClick={() => decide(req.id, "rejected", "")}>却下</Button>}
              <div style={{ flex: 1 }}/>
              <Button variant="ghost" onClick={() => setSelected(null)}>閉じる</Button>
              {req.state === "pending" && <Button variant="primary" icon="check" onClick={() => decide(req.id, "approved", "")}>承認</Button>}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};
```

#### 2.4.4 データ contract（API endpoint）

| endpoint | method | request | response | 用途 |
|----------|--------|---------|----------|------|
| `/admin/requests` | GET | `?state=pending\|approved\|rejected\|all&q=` | `{ rows: Request[], total }` | 一覧 |
| `/admin/requests/:id` | GET | — | `Request` | Drawer |
| `/admin/requests/:id/approve` | POST | `{ adminNote? }` | `{ ok, decidedAt }` | 承認 |
| `/admin/requests/:id/reject` | POST | `{ adminNote? }` | `{ ok, decidedAt }` | 却下 |
| `/admin/requests/export.csv` | GET | `?state=` | CSV stream | エクスポート |

`Request` 型: `{ id, memberId, fullName, email, hue, kind: "withdraw"\|"unpublish"\|"contact"\|..., kindLabel, summary, submittedAt, state, decidedAt?, adminNote? }`。

#### 2.4.5 インタラクション

**フィルタ**: `pill-nav` で `pending`（既定）/ `approved` / `rejected` / `all`。`Search` は 250ms debounce。

**ソート**: 既定 `submittedAt DESC`。

**bulk action**: Members と同形式の `bulk-bar` 構成。`まとめて承認` / `まとめて却下` の 2 ボタン。確認 Modal で `判断理由` 必須。

**drawer**:
1. 行クリックで Drawer。
2. `承認` → `POST /admin/requests/:id/approve` → toast `申請を承認しました` → drawer 閉。
3. `却下` → `POST /admin/requests/:id/reject` → toast `申請を却下しました` → drawer 閉。
4. `withdraw` 種別の Drawer は IMPACT ブロック（`var(--danger-soft)`）を表示し、論理削除が連動することを明示する。

**modal**: bulk 承認/却下の確認のみ。

#### 2.4.6 状態

| 状態 | 表現 |
|------|------|
| loading | Members と同等の Skeleton 行 × 8 |
| error | `tone=danger` `card-pad` |
| empty (pending=0) | `Icon=checkCircle` (`--ok`) + `保留中の申請はありません` |
| empty (with filter) | `該当する申請はありません` + `フィルタをクリア` |
| data | 上記 JSX |

#### 2.4.7 a11y

- Members に準拠。Drawer の `承認` / `却下` ボタンは破壊的操作含むため `aria-describedby` で IMPACT ブロックを参照。

#### 2.4.8 コピー（原文）

- eyebrow: `ADMIN / REQUESTS`
- h1: `申請管理`
- muted: `退会・公開停止・問い合わせなど、本人および管理者操作待ちの申請を確認します。`
- actions: `CSV エクスポート` / `最新化`
- pill-nav: `保留中` / `承認済み` / `却下` / `すべて`
- table headers: `申請者` / `種別` / `内容` / `提出日時` / `状態`
- chips: `保留中` / `承認済み` / `却下`
- drawer eyebrows: `REQUEST` / `ADMIN NOTE` / `IMPACT`
- KV labels: `種別` / `提出日時` / `状態` / `本人理由`
- impact: `承認すると論理削除（isDeleted=true）が実行されます。復元は管理画面から可能です。`
- footer: `却下` / `閉じる` / `承認`
- toasts: `申請を承認しました` / `申請を却下しました`

#### 2.4.9 prototype 出典 / 未掲載派生ルール

- prototype `pages-admin.jsx` 未掲載。Members 画面（§2.2）の語彙のみで構成。
- 新規 token / 新規 layout primitive は導入しない（KVList / Drawer / pill-nav / Chip tone のみ）。

---

### 2.5 `/(admin)/admin/schema` — スキーマ差分レビュー

#### 2.5.1 ルート・認可

- ルート: `/(admin)/admin/schema`（旧 prototype `schema-diff` ルートのリネーム想定）。
- 認可: `role === "admin"`。
- Sidebar active: `schema-diff`（`AdminSidebar` の key）。

#### 2.5.2 レイアウトパターン

`page-head + Revision Header(.card.card-pad-lg) + Diff List(.card.card-pad-lg) + 2-col History(.grid-2)`。
ルート: `<div className="page-enter stack-lg">`。

#### 2.5.3 セクション分解 + 完全 JSX

prototype `pages-admin.jsx` L507–L656 を一次転記する（`className` 重複箇所は原文のまま記録し、実装時に解消する旨を §2.5.9 に注記）。

```jsx
const SchemaDiffPage = ({ nav }) => {
  const { SCHEMA_DIFF, SCHEMA_VERSIONS, ALIAS_HISTORY } = window.UBM;
  const toast = useToast();
  const [unresolvedKey, setUnresolvedKey] = useState("");

  const unresolved = SCHEMA_DIFF.filter((d) => d.type === "unresolved");
  const added = SCHEMA_DIFF.filter((d) => d.type === "added");
  const changed = SCHEMA_DIFF.filter((d) => d.type === "changed");
  const removed = SCHEMA_DIFF.filter((d) => d.type === "removed");

  return (
    <div className="page-enter stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / SCHEMA</div>
          <h1 className="h-page">スキーマ差分のレビュー</h1>
          <p className="muted">Googleフォームの設問が変更されたとき、この画面で新旧スキーマを照合し、stableKey を割り当てます。</p>
        </div>
        <Button variant="ghost" icon="refresh">スキーマを再取得</Button>
      </div>

      {/* Revision header */}
      <div className="card card-pad-lg">
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="eyebrow">CURRENT REVISION</div>
            <div className="row" style={{ gap: 10, marginTop: 8, alignItems: "baseline" }}>
              <h2 className="h-section" style={{ fontSize: 20 }} className="mono">{SCHEMA_VERSIONS[0].revisionId}</h2>
              <Chip tone="ok" dot>active</Chip>
            </div>
            <div className="small mono" style={{ marginTop: 4 }}>hash: {SCHEMA_VERSIONS[0].schemaHash} · 取得: {SCHEMA_VERSIONS[0].date}</div>
          </div>
          <div className="btn-row">
            <Button variant="ghost" icon="gitCompare">前バージョンと比較</Button>
            <Button variant="primary" icon="check" onClick={() => toast("全差分を承認しました", "ok")}>すべて承認</Button>
          </div>
        </div>

        <div className="grid-4">
          <div className="card-flat stat">
            <div className="stat-label">Unresolved</div>
            <div className="stat-value" style={{ color: unresolved.length > 0 ? "var(--warn)" : "var(--ok)" }}>{unresolved.length}</div>
            <div className="stat-sub">stableKey 未割当</div>
          </div>
          <div className="card-flat stat">
            <div className="stat-label">Added</div>
            <div className="stat-value" style={{ color: "var(--ok)" }}>{added.length}</div>
            <div className="stat-sub">新規設問</div>
          </div>
          <div className="card-flat stat">
            <div className="stat-label">Changed</div>
            <div className="stat-value" style={{ color: "var(--warn)" }}>{changed.length}</div>
            <div className="stat-sub">文言や型の変更</div>
          </div>
          <div className="card-flat stat">
            <div className="stat-label">Removed</div>
            <div className="stat-value" style={{ color: "var(--danger)" }}>{removed.length}</div>
            <div className="stat-sub">削除された設問</div>
          </div>
        </div>
      </div>

      {/* Diff list */}
      <div className="card card-pad-lg">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2 className="h-section">項目別の差分</h2>
          <Segmented value="all" onChange={() => {}} options={[
            { value: "all", label: "すべて" }, { value: "unresolved", label: "要対応" },
          ]}/>
        </div>

        <div className="stack-sm">
          {SCHEMA_DIFF.map((d) => (
            <div key={d.questionId} className={"schema-field-card diff-" + d.type}>
              <div>
                <div className="row" style={{ gap: 10, marginBottom: 4 }}>
                  {d.type === "added" && <Chip tone="ok" dot>Added</Chip>}
                  {d.type === "changed" && <Chip tone="warn" dot>Changed</Chip>}
                  {d.type === "removed" && <Chip tone="danger" dot>Removed</Chip>}
                  {d.type === "unresolved" && <Chip tone="info" dot>Unresolved</Chip>}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{d.label}</span>
                </div>
                <div className="small">{d.note}</div>
                <div className="small mono" style={{ marginTop: 6, color: "var(--text-3)" }}>
                  questionId: {d.questionId}
                  {d.stableKey && <> · stableKey: <b style={{ color: "var(--text)" }}>{d.stableKey}</b></>}
                  {!d.stableKey && d.type !== "removed" && <> · stableKey: <span style={{ color: "var(--warn)" }}>未割当</span></>}
                </div>
                {d.type === "unresolved" && (
                  <div className="row" style={{ marginTop: 10, gap: 8 }}>
                    <Input placeholder="stableKey を入力（例: businessCard）" value={unresolvedKey} onChange={(e) => setUnresolvedKey(e.target.value)}/>
                    <Button variant="primary" size="sm" icon="link" onClick={() => { toast("stableKey を紐付けました", "ok"); setUnresolvedKey(""); }}>紐付け</Button>
                  </div>
                )}
              </div>
              <div className="btn-row">
                {d.type === "unresolved" && <Button variant="soft" size="sm">既存と統合</Button>}
                {d.type !== "unresolved" && <Button variant="soft" size="sm" icon="check">承認</Button>}
                <Button variant="ghost" size="sm" icon="moreH"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad-lg">
          <div className="eyebrow">REVISIONS</div>
          <h2 className="h-section" style={{ marginTop: 8 }}>バージョン履歴</h2>
          <div className="stack-sm" style={{ marginTop: 14 }}>
            {SCHEMA_VERSIONS.map((v) => (
              <div key={v.revisionId} className="schema-field-card">
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="mono" style={{ fontWeight: 600 }}>{v.revisionId}</span>
                    {v.state === "active" ? <Chip tone="ok" dot>active</Chip> : <Chip>superseded</Chip>}
                  </div>
                  <div className="small mono" style={{ marginTop: 4 }}>hash: {v.schemaHash} · {v.fieldCount} fields · {v.unknownCount} unknown</div>
                  <div className="small" style={{ marginTop: 2 }}>{v.date}</div>
                </div>
                <Button variant="ghost" size="sm" icon="eye">開く</Button>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad-lg">
          <div className="eyebrow">ALIAS HISTORY</div>
          <h2 className="h-section" style={{ marginTop: 8 }}>紐付け履歴</h2>
          <div className="stack-sm" style={{ marginTop: 14 }}>
            {ALIAS_HISTORY.map((a, i) => (
              <div key={i} className="card-flat" style={{ padding: 12 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="link" size={13} style={{ color: "var(--accent)" }}/>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{a.stableKey}</span>
                </div>
                <div className="small mono" style={{ marginTop: 6, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span>{a.oldQuestionId}</span>
                  <Icon name="arrowRight" size={10}/>
                  <span style={{ color: "var(--text-2)" }}>{a.newQuestionId}</span>
                </div>
                <div className="small" style={{ marginTop: 4 }}>{a.resolvedAt} · {a.resolvedBy}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 2.5.4 データ contract（API endpoint）

| endpoint | method | request | response | 用途 |
|----------|--------|---------|----------|------|
| `/admin/schema/current` | GET | — | `{ revisionId, schemaHash, date, state, fieldCount, unknownCount }` | Revision Header |
| `/admin/schema/diff` | GET | `?revisionId=` | `SchemaDiff[]`（`{type, stableKey, questionId, label, note}`） | Diff List |
| `/admin/schema/versions` | GET | — | `SchemaVersion[]` | バージョン履歴 |
| `/admin/schema/alias-history` | GET | — | `Alias[]` | 紐付け履歴 |
| `/admin/schema/sync` | POST | — | `{ jobId }` | 「スキーマを再取得」 |
| `/admin/schema/diff/:questionId/link` | POST | `{ stableKey }` | `{ ok }` | unresolved の `紐付け` |
| `/admin/schema/diff/:questionId/merge` | POST | `{ targetStableKey }` | `{ ok }` | `既存と統合` |
| `/admin/schema/diff/:questionId/approve` | POST | — | `{ ok }` | 個別 `承認` |
| `/admin/schema/diff/approve-all` | POST | `?revisionId=` | `{ ok, count }` | `すべて承認` |

#### 2.5.5 インタラクション

**フィルタ**: Diff List の `Segmented`（`すべて` / `要対応`）。`要対応` は `type === "unresolved"` のみ抽出。

**ソート**: prototype は固定順。MVP は `unresolved → added → changed → removed` の優先順固定。

**bulk action `すべて承認`**:
1. ヘッダ右の primary ボタン。
2. クリックで `<Modal>` 確認 → `POST /admin/schema/diff/approve-all`。
3. 成功で toast `全差分を承認しました`。`unresolved` がある場合は Modal で警告し、unresolved を除外承認するか中断するかを選択（`既存と統合` 推奨）。

**inline form 手順（unresolved 行）**:
1. `<Input>` に stableKey を入力（例: `businessCard`）。
2. `紐付け` (primary, size=sm) クリックで `POST /admin/schema/diff/:qid/link` 発火。
3. 成功で toast `stableKey を紐付けました` + 行が `diff-changed` に変化（楽観 UI）。
4. `既存と統合` (soft, size=sm) → `<Modal>` で既存 stableKey を `<Search>` から選択 → `POST :merge`。

**modal**:
- `すべて承認` 確認: `unresolved {n}件は承認できません。先に紐付けまたは統合してください。` を警告。
- `既存と統合`: 中央 560px、既存 stableKey 一覧から選択。

**drawer**: 本画面では未使用（Diff List は inline 編集で完結）。

#### 2.5.6 状態

| 状態 | 表現 |
|------|------|
| loading | Revision Header / KPI / Diff List をすべて Skeleton 化 |
| error | `tone=danger` `card-pad`、`再取得` ボタン |
| empty (`SCHEMA_DIFF=[]`) | Diff List 内に `Icon=checkCircle` (`--ok`) + `差分はありません` + サブコピー `現在のフォームスキーマは正本と一致しています` |
| data | 上記 prototype JSX |

#### 2.5.7 a11y

- Diff List 各行は `<article aria-labelledby="diff-{qid}">`、Chip+ラベルを `<h3 id="diff-{qid}">` 化推奨。
- inline `<Input>` は `<label>stableKey<input/></label>` 構造で `aria-describedby` に `note` を関連付ける。
- `Segmented` は `role="tablist"` + 各 button `role="tab" aria-selected`。
- `すべて承認` は破壊的影響を持つため `aria-haspopup="dialog"` で確認 Modal を予告。

#### 2.5.8 コピー（原文）

- eyebrow: `ADMIN / SCHEMA`
- h1: `スキーマ差分のレビュー`
- muted: `Googleフォームの設問が変更されたとき、この画面で新旧スキーマを照合し、stableKey を割り当てます。`
- actions: `スキーマを再取得` / `前バージョンと比較` / `すべて承認`
- revision header: `CURRENT REVISION` / `active` / `hash: {h} · 取得: {d}`
- KPI labels: `Unresolved` / `Added` / `Changed` / `Removed`
- KPI subs: `stableKey 未割当` / `新規設問` / `文言や型の変更` / `削除された設問`
- diff list: `項目別の差分` / `すべて` / `要対応`
- chips: `Added` / `Changed` / `Removed` / `Unresolved`
- meta line: `questionId: {q} · stableKey: {k}` / `stableKey: 未割当`
- inline form: placeholder `stableKey を入力（例: businessCard）` / button `紐付け`
- row buttons: `既存と統合` / `承認`
- 2-col headings: `REVISIONS` / `バージョン履歴` / `ALIAS HISTORY` / `紐付け履歴`
- version chips: `active` / `superseded`
- toasts: `全差分を承認しました` / `stableKey を紐付けました`

#### 2.5.9 prototype 出典 / 未掲載派生ルール

- 出典: `pages-admin.jsx` L507–L656（`SchemaDiffPage`）。
- prototype L535 に `className="h-section"` と `className="mono"` の重複指定があるため、実装時は `<h2 className="h-section mono">` に統合する。
- `Segmented` の `onChange={() => {}}` は prototype のスタブ。実装時は `useState` で `view = "all"|"unresolved"` を管理し、`SCHEMA_DIFF.filter` に反映する。
- bulk action / Modal は prototype 未実装。Members の Modal 語彙を踏襲する。

---

## 3. 派生ルール（未掲載 3 画面）

派生 3 画面は §1 の共通 layout 部品語彙のみで構成し、新規 token / 新規 primitive を導入しない。

### 3.1 `/(admin)/admin/meetings` — 開催日 ※未掲載派生

**層責務**: `data.jsx` `MEETINGS` (L88–L94) を CRUD する管理画面。`data.jsx` 構造は spec 04 で正規化されている前提。

**レイアウトパターン**: `Table + Modal Form`（Members の Drawer ではなく Modal）。

**構成（blueprint）**:

```jsx
const AdminMeetingsPage = ({ nav }) => {
  const { MEETINGS } = window.UBM;
  const [open, setOpen] = useState(false);   // modal open
  const [edit, setEdit] = useState(null);    // editing meeting
  const rows = MEETINGS;

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / MEETINGS</div>
          <h1 className="h-page">開催日</h1>
          <p className="muted">支部会の開催回・出席実績・メモを管理します。</p>
        </div>
        <div className="btn-row">
          <Button variant="ghost" icon="upload">CSV エクスポート</Button>
          <Button variant="primary" icon="plus" onClick={() => { setEdit(null); setOpen(true); }}>新規追加</Button>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>開催日</th><th>タイトル</th><th>メモ</th>
            <th style={{ width: 100 }}>出席</th>
            <th style={{ width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} onClick={() => { setEdit(m); setOpen(true); }}>
              <td className="mono small">{m.date}</td>
              <td><div style={{ fontWeight: 600 }}>{m.label}</div></td>
              <td className="small">{m.note}</td>
              <td><Chip tone="ok">{m.attendees}名</Chip></td>
              <td onClick={(e) => { e.stopPropagation(); setEdit(m); setOpen(true); }}>
                <Button variant="ghost" size="sm" icon="edit"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "開催日を編集" : "新規開催日"}>
        <div className="stack" style={{ padding: 20 }}>
          <Field label="開催日"><Input type="date" defaultValue={edit?.date}/></Field>
          <Field label="タイトル"><Input defaultValue={edit?.label} placeholder="2026年X月支部会"/></Field>
          <Field label="メモ"><Textarea rows={3} defaultValue={edit?.note}/></Field>
          <Field label="出席実績"><Input type="number" defaultValue={edit?.attendees ?? 0}/></Field>
        </div>
        <div className="modal-foot">
          {edit && <Button variant="danger" icon="trash">削除</Button>}
          <div style={{ flex: 1 }}/>
          <Button variant="ghost" onClick={() => setOpen(false)}>閉じる</Button>
          <Button variant="primary" icon="check" onClick={() => setOpen(false)}>保存</Button>
        </div>
      </Modal>
    </div>
  );
};
```

**データ contract**:
- `GET /admin/meetings` → `Meeting[]`
- `POST /admin/meetings` `{ date, label, note, attendees }` → `Meeting`
- `PATCH /admin/meetings/:id` → `Meeting`
- `DELETE /admin/meetings/:id` → `{ ok }`
- `GET /admin/meetings/:id/attendees` → `MemberRef[]`（出席者一覧、将来拡張）

**インタラクション**:
- 行クリックで Modal 起動（編集）。`新規追加` で空 Modal。
- `削除` は `<Modal>` 内で破壊的、確認サブ Modal で `本当に削除しますか？` を必須。
- 出席実績は手入力。将来 `attendance` 配列との整合チェックを CI で行う。

**状態**: loading/error/empty は §2.2 と同形式。empty は `Icon=calendar` + `開催日がまだ登録されていません`。

**a11y**: Modal は `role="dialog" aria-modal="true" aria-labelledby="meeting-modal-title"`。

**コピー**: eyebrow `ADMIN / MEETINGS` / h1 `開催日` / muted `支部会の開催回・出席実績・メモを管理します。` / actions `CSV エクスポート` / `新規追加` / Modal title `開催日を編集` or `新規開催日` / Field labels `開催日` / `タイトル` / `メモ` / `出席実績` / footer `削除` / `閉じる` / `保存`。

### 3.2 `/(admin)/admin/identity-conflicts` — 同一人物コンフリクト ※未掲載派生

**層責務**: 同一メールまたは同一氏名 + 居住地で複数 responseId が紐づく可能性のあるレコードを左右並べて統合判定する。CLAUDE.md 不変条件 4（admin-managed data 分離）の運用画面。

**レイアウトパターン**: `Queue list + 2-col Side-by-side Compare + 行内 inline form`。Tags 画面の Side-by-side 語彙をベースに、右ペインを `grid-2` に分割して左右比較を行う。

**構成（blueprint）**:

```jsx
const AdminIdentityConflictsPage = ({ nav }) => {
  const { CONFLICTS = [] } = window.UBM;
  const [focus, setFocus] = useState(null);
  const conflict = focus ? CONFLICTS.find((c) => c.id === focus) : null;

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / IDENTITY</div>
          <h1 className="h-page">同一人物コンフリクト</h1>
          <p className="muted">複数の回答が同一人物の可能性がある場合、ここで統合またはエイリアスを設定します。</p>
        </div>
        <div className="btn-row">
          <Chip tone="warn" dot>未解決 {CONFLICTS.filter((c) => c.state === "open").length}件</Chip>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "flex-start" }}>
        {/* Queue */}
        <div className="card card-pad-lg">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h2 className="h-section">コンフリクトキュー</h2>
            <Chip tone="accent">{CONFLICTS.length}件</Chip>
          </div>
          <div className="stack-sm">
            {CONFLICTS.map((c) => (
              <div key={c.id} className="schema-field-card" onClick={() => setFocus(c.id)} style={{ cursor: "pointer", borderColor: focus === c.id ? "var(--accent)" : undefined }}>
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    {c.state === "open" ? <Chip tone="warn" dot>未解決</Chip> : <Chip tone="ok" dot>解決済み</Chip>}
                    <span style={{ fontWeight: 600 }}>{c.matchKey}</span>
                  </div>
                  <div className="small mono" style={{ marginTop: 4, color: "var(--text-3)" }}>
                    {c.candidates.length}件の候補 · 検出: {c.detectedAt}
                  </div>
                </div>
                <Icon name="chevronRight" size={14} style={{ color: "var(--text-3)" }}/>
              </div>
            ))}
          </div>
        </div>

        {/* Compare */}
        {conflict ? (
          <div className="card card-pad-lg" style={{ position: "sticky", top: 20 }}>
            <div className="eyebrow">SIDE-BY-SIDE COMPARE</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>{conflict.matchKey}</h2>

            <div className="grid-2" style={{ marginTop: 16, gap: 12 }}>
              {conflict.candidates.map((cand, i) => (
                <div key={cand.responseId} className="card-flat" style={{ padding: 14 }}>
                  <div className="row-between">
                    <Chip tone={i === 0 ? "info" : "accent"} dot>候補 {String.fromCharCode(65 + i)}</Chip>
                    <span className="small mono" style={{ color: "var(--text-3)" }}>{cand.responseId}</span>
                  </div>
                  <KVList rows={[
                    { k: "氏名", v: cand.fullName },
                    { k: "メール", v: cand.email },
                    { k: "提出日時", v: cand.submittedAt },
                    { k: "お住まい", v: cand.location },
                    { k: "職業", v: cand.occupation },
                    { k: "区画 / ステータス", v: `${cand.ubmZone} / ${cand.ubmMembershipType}` },
                  ]}/>
                  <div className="row" style={{ marginTop: 10, gap: 8 }}>
                    <Button variant="soft" size="sm" icon="check">これを正本に</Button>
                    <Button variant="ghost" size="sm" icon="trash">破棄</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" style={{ margin: "20px 0" }}/>

            {/* Inline resolution form */}
            <div className="eyebrow">RESOLUTION</div>
            <div className="stack-sm" style={{ marginTop: 10 }}>
              <div className="row" style={{ gap: 8 }}>
                <Field label="正本にする責任者ID" style={{ flex: 1 }}>
                  <Input placeholder="resp-001" defaultValue={conflict.candidates[0]?.responseId}/>
                </Field>
                <Field label="エイリアス追加" style={{ flex: 1 }}>
                  <Input placeholder="resp-002, resp-003"/>
                </Field>
              </div>
              <Field label="判断メモ"><Textarea rows={2} placeholder="なぜこの判断にしたか..."/></Field>
              <div className="row-between">
                <div className="small">候補 {conflict.candidates.length}件</div>
                <div className="btn-row">
                  <Button variant="ghost" icon="link">エイリアスとして紐付け</Button>
                  <Button variant="primary" icon="check">統合して解決</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-pad-lg" style={{ position: "sticky", top: 20 }}>
            <div className="empty-state">
              <Icon name="userCheck" size={28} style={{ color: "var(--text-3)" }}/>
              <div style={{ marginTop: 10, fontSize: 14 }}>左のキューからコンフリクトを選択してください</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

**データ contract**:
- `GET /admin/identity-conflicts` → `Conflict[]`（`{id, matchKey, candidates: ResponseRef[], state, detectedAt}`）
- `GET /admin/identity-conflicts/:id` → `Conflict`
- `POST /admin/identity-conflicts/:id/merge` `{ canonicalResponseId, aliases: string[], note }` → `{ ok }`
- `POST /admin/identity-conflicts/:id/dismiss` `{ note }` → `{ ok }`（誤検知）

**インタラクション**:
- 左キュー行クリックで右 Compare ペイン切替。
- 左右候補カードの `これを正本に` でフォームの `canonicalResponseId` を更新。
- `破棄` は対象 `responseId` を `discarded` 配列に追加（実 DB 削除はしない）。
- 行内 inline form で `エイリアスとして紐付け` または `統合して解決` を実行。
- bulk action: 派生未対応（個別解決を優先）。

**状態**: empty は `Icon=userCheck` + `コンフリクトはありません`。

**a11y**: 左右候補カードは `role="region" aria-label="候補 A"` / `候補 B`。inline form は `<form aria-labelledby="resolution-title">`。

**コピー**: eyebrow `ADMIN / IDENTITY` / h1 `同一人物コンフリクト` / muted `複数の回答が同一人物の可能性がある場合、ここで統合またはエイリアスを設定します。` / 左 `コンフリクトキュー` / 右 eyebrow `SIDE-BY-SIDE COMPARE` / `RESOLUTION` / chips `候補 A` / `候補 B` / `未解決` / `解決済み` / Field labels `正本にする責任者ID` / `エイリアス追加` / `判断メモ` / buttons `これを正本に` / `破棄` / `エイリアスとして紐付け` / `統合して解決`。

### 3.3 `/(admin)/admin/audit` — 監査ログ ※未掲載派生

**層責務**: 管理操作・スキーマ承認・申請判断などの監査イベントを時系列表示する。

**レイアウトパターン**: `FilterBar(.card.card-pad) + Timeline(.timeline)`。Dashboard の Activity タイムライン語彙を本画面メインに昇格。

**構成（blueprint）**:

```jsx
const AdminAuditPage = ({ nav }) => {
  const { AUDIT_LOG = [] } = window.UBM;
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [kind, setKind] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = AUDIT_LOG.filter((e) => {
    if (actor !== "all" && e.actor !== actor) return false;
    if (kind  !== "all" && e.kind  !== kind ) return false;
    if (from && e.at < from) return false;
    if (to   && e.at > to  ) return false;
    if (q) {
      const hay = [e.actor, e.kind, e.target, e.summary].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="page-enter stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / AUDIT</div>
          <h1 className="h-page">監査ログ</h1>
          <p className="muted">管理操作・スキーマ承認・申請判断の履歴を時系列で確認します。</p>
        </div>
        <div className="btn-row">
          <Button variant="ghost" icon="upload">CSV エクスポート</Button>
        </div>
      </div>

      <div className="card card-pad">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 12, alignItems: "end" }}>
          <Field label="検索"><Search value={q} onChange={setQ} placeholder="操作者・対象・概要..."/></Field>
          <Field label="操作者">
            <select className="input" value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="all">すべて</option>
              <option value="system">system</option>
              <option value="admin@example.com">admin@example.com</option>
            </select>
          </Field>
          <Field label="種別">
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">すべて</option>
              <option value="member.update">member.update</option>
              <option value="member.delete">member.delete</option>
              <option value="schema.approve">schema.approve</option>
              <option value="schema.link">schema.link</option>
              <option value="request.approve">request.approve</option>
              <option value="request.reject">request.reject</option>
            </select>
          </Field>
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)}/></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)}/></Field>
        </div>
      </div>

      <div className="card card-pad-lg">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2 className="h-section">タイムライン</h2>
          <Chip tone="accent">{rows.length}件</Chip>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <Icon name="fileText" size={28} style={{ color: "var(--text-3)" }}/>
            <div style={{ marginTop: 10, fontSize: 14 }}>該当する監査イベントはありません</div>
          </div>
        ) : (
          <div className="timeline">
            {rows.map((e) => (
              <div key={e.id} className="tl-row">
                <div className="tl-date">
                  <div className="tl-y">{e.at.slice(0, 7)}</div>
                  <div>{e.at.slice(8, 10)}</div>
                </div>
                <div>
                  <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                    <Chip tone={
                      e.kind.startsWith("member.delete") || e.kind.endsWith(".reject") ? "danger" :
                      e.kind.startsWith("schema") ? "info" :
                      e.kind.endsWith(".approve") ? "ok" : "accent"
                    } dot>{e.kind}</Chip>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{e.summary}</span>
                  </div>
                  <div className="small mono" style={{ color: "var(--text-3)" }}>
                    actor: {e.actor} · target: {e.target}
                  </div>
                </div>
                <Button variant="ghost" size="sm" icon="eye">詳細</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

**データ contract**:
- `GET /admin/audit?q=&actor=&kind=&from=&to=&page=` → `{ rows: AuditEvent[], total }`
- `GET /admin/audit/:id` → `AuditEvent`（詳細・差分 JSON 含む）
- `GET /admin/audit/export.csv?...` → CSV stream

`AuditEvent` 型: `{ id, at, actor, kind, target, summary, diff?: object }`。

**インタラクション**:
- フィルタ 5 軸（検索 / 操作者 / 種別 / From / To）すべて即時反映、`q` のみ 250ms debounce。
- 行 `詳細` クリックで Drawer 起動（diff JSON を `<KVList>` + `<pre className="mono small">` で表示）。
- bulk action は派生として未実装（読み取り専用画面）。
- 監査ログは追記のみで編集不可。

**状態**: empty は `Icon=fileText` + `該当する監査イベントはありません`。

**a11y**: タイムラインは `<ol role="feed" aria-busy={loading}>` に置換推奨。各行 `<li role="article">`。

**コピー**: eyebrow `ADMIN / AUDIT` / h1 `監査ログ` / muted `管理操作・スキーマ承認・申請判断の履歴を時系列で確認します。` / actions `CSV エクスポート` / Field labels `検索` / `操作者` / `種別` / `From` / `To` / section `タイムライン` / chip `{n}件` / empty `該当する監査イベントはありません` / button `詳細`。

---

## 4. 実装ノート

- 本書の JSX は prototype が `window.UBM` グローバルから fixture を取得する形式である。`apps/web/` 実装では `app/(admin)/admin/<page>/page.tsx` に Server Component で API fetch、`use client` ロジックを `_components/` に分離する想定（spec 05 / spec 11 を参照）。
- `Chip` / `Button` / `Drawer` / `Modal` / `Search` / `Input` / `Field` / `Switch` / `Textarea` / `KVList` / `Avatar` / `Icon` / `Segmented` / `Toast` の primitive は `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` の正本に準拠する。
- OKLch token `--accent` / `--ok` / `--warn` / `--danger` / `--info` / `--text` / `--text-2` / `--text-3` / `--bg` / `--warn-soft` / `--danger-soft` および utility class（`stack` / `stack-sm` / `stack-lg` / `row` / `row-between` / `row-wrap` / `grid-2` / `grid-3` / `grid-4` / `card` / `card-flat` / `card-pad` / `card-pad-lg` / `card-hover` / `chip-row` / `pill-nav` / `tag-pill` / `schema-field-card` / `tbl` / `mono` / `small` / `muted` / `eyebrow` / `h-page` / `h-section` / `h-card` / `stat` / `stat-label` / `stat-value` / `stat-sub` / `divider` / `empty-state` / `timeline` / `tl-row` / `tl-date` / `tl-y` / `drawer-head` / `drawer-body` / `drawer-foot` / `modal-foot` / `btn-row` / `badge-sync` / `dot` / `page-head` / `page-enter` / `input` / `nav-section` / `nav-item` / `nav-icon` / `nav-label` / `sidebar` / `sidebar-footer` / `user-chip` / `brand` / `brand-mark` / `brand-title`）は新規追加なし。
- スキーマ差分の prototype L535 重複 `className` は実装時に統合する（§2.5.9）。
- 派生 3 画面の fixture（`REQUESTS` / `CONFLICTS` / `AUDIT_LOG`）は `data.jsx` 拡張時に追加する想定で、本書の JSX は `window.UBM.REQUESTS` 等の参照名のみ予約する。

---

## 5. 出典マッピング

| 画面 | prototype 出典 | 行範囲 |
|------|----------------|--------|
| ダッシュボード | `pages-admin.jsx` `AdminDashboardPage` | L4–L159 |
| メンバー管理 | `pages-admin.jsx` `AdminMembersPage` | L161–L366 |
| タグ割当 | `pages-admin.jsx` `AdminTagsPage` | L368–L505 |
| スキーマ差分 | `pages-admin.jsx` `SchemaDiffPage` | L507–L656 |
| AdminSidebar | `app.jsx` `Sidebar` | L119–L163 |
| ROUTES 登録 | `app.jsx` `ROUTES` | L11–L22 |
| MEMBERS / MEETINGS / SCHEMA_DIFF / SCHEMA_VERSIONS / ALIAS_HISTORY / TAG_CATALOG / ALL_TAGS | `data.jsx` | L77–L334 |
| 申請管理 | 派生（spec 11 + Members 語彙） | — |
| 開催日 | 派生（spec 11） | — |
| 同一人物コンフリクト | 派生（CLAUDE.md 不変条件 4） | — |
| 監査ログ | 派生（spec 11） | — |
