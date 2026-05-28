# Phase 2: 設計

> workflow: admin-audit-prototype-alignment

## 2.1 アーキテクチャ概要

```
[Browser]
   ↓ GET /admin/audit?...
[apps/web Workers]  ← (admin)/admin/audit/page.tsx (Server Component)
   ├─ AdminPageHeader (new wiring)
   ├─ AuditLogPanel (Card + Filter grid + tbl, tokenized)
   └─ safeServerFetch → fetchAdmin → INTERNAL_API_BASE_URL + /admin/audit
                                          ↓ x-internal-auth
                                     [apps/api Workers]
                                          ├─ app.route("/admin", adminAuditRoute)
                                          └─ requireAdmin → auditLogProvider.listFiltered
                                                          ↓
                                                       [D1: audit_log]
```

## 2.2 design language の正本トレース

| プロトタイプ要素（pages-admin.jsx） | 採用対象 | apps/web 実装 |
|------------------------------------|---------|----------------|
| `.page-head` + `.eyebrow` + `.h-page` + `.muted` + `.btn-row` (L191-204) | page 直下のヘッダ | `AdminPageHeader` 1 個に集約。`description` に「監査ログの操作履歴を action / actor / 期間で絞り込みできます。」を入れる |
| `.card.card-pad` + grid filter (L205-221) | filter 領域 | `<Card>` + `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">` の中に `FormField` + `Input` / `Select` |
| `.tbl` (L223-260) | 一覧 table | `tbl` クラス（既存 admin で使用済）+ `<thead>` + `<tbody>` 構造を維持。border / spacing は token |
| Filter 検索 / リセットボタン | filter action 行 | `<Button type="submit" variant="primary">検索</Button>` + `<Link className={buttonVariants({ variant: "ghost", size: "md" })} href="/admin/audit">リセット</Link>`。現行 `Button` は polymorphic link rendering props 非対応のため、`buttonVariants` を正本 API とする。 |
| EmptyState (`未タグ` 等) | items 0 | 既存 `EmptyState` primitive を使用 |

## 2.3 コンポーネント設計

### 2.3.1 `apps/web/app/(admin)/admin/audit/page.tsx`

責務: searchParams → AuditSearchValues 構造化 / `safeServerFetch` で API 取得 / 結果を `AuditLogPanel` に渡す。

変更点:

- `<Breadcrumb items=...>` の単独配置を削除し、`AdminPageHeader breadcrumbs=...` に統合
- `<section className="flex flex-col gap-4">` を `<section className="stack-lg">` 相当（admin の他 page と統一）か、既存の Tailwind utility のままにする（既存 admin pages を grep して採用形式を合わせる）
- error の場合に `AuditLogPanel` が `error` prop で recovery hint を出すという既存 API は変更しない

### 2.3.2 `apps/web/src/components/admin/AuditLogPanel.tsx`

責務: filter form + table + pagination + error 表示。

変更点（既存 export はすべて保持）:

| 既存 | 変更後 |
|------|--------|
| `<header><h1>監査ログ</h1></header>` | 撤去（page.tsx 側 `AdminPageHeader` へ集約） |
| `<form className="admin-audit-filter">` + `FormField` x6 + raw `<label>limit<select>` + raw `<button>` / `<Link data-role="reset">` | `<Card><form aria-label="監査ログフィルター" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end"><FormField/>×6 + `<FormField name="limit"><Select>...</Select></FormField>` + `<div className="col-span-full flex justify-end gap-2"><Button type="submit">検索</Button><Link className={buttonVariants({ variant: "ghost", size: "md" })} href="/admin/audit">リセット</Link></div></form></Card>` |
| raw `<table className="admin-audit-table">` | `<table className="tbl">`（admin 共通クラス）+ `<thead>` + `<tbody>` 維持 |
| `<JsonDisclosure>` (`<details>`) | semantic は維持（before / after diff の disclosure）。`<summary>` / `<pre>` に token クラス（`text-sm text-[var(--ubm-color-text-secondary)]`）を付与 |
| `error` 表示の `<p role="alert">監査ログを読み込めませんでした: {error}</p>` | `<Banner tone="warning">監査ログを読み込めませんでした: {error}</Banner>`（現行 `Banner` primitive は `warning` / `danger`）+ 404 reason が含まれる場合「ネットワーク疎通・admin 認可・staging deploy 状態を確認してください」の補助 hint を 1 行添える |

エクスポート不変:

- `maskAuditJson`, `summarizeAuditJson`, `formatJst`, `maskAuditText`, `buildAuditHref`, `AuditLogPanel`, type `AuditSearchValues`

### 2.3.3 `apps/web/src/lib/admin/safe-server-fetch.ts` (Task B 関連)

責務: `fetchAdmin` を `SafeResult` で包む薄い helper。

変更点:

- 既に `codePrefix: "ADMIN_FETCH"` で 4xx/5xx を `ADMIN_FETCH_{status}` reason に分岐する `commonSafeServerFetch` を使っている。**コード変更は基本不要**。
- ただし `fetchAdmin` 側で 404 を `Error("admin api ${path} failed: 404")` のメッセージ文字列にしている。`commonSafeServerFetch` がこのメッセージから status を取り出せているかを `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` で再確認し、できていなければ `fetchAdmin` で status を構造化エラー（`AdminFetchError { status: number }` 等）として throw するよう最小修正する。

### 2.3.4 `apps/api/src/index.ts` (Task B 関連)

責務: 全 route の root mount。

検証＋必要なら修正:

- `app.route("/admin", adminAuditRoute)` (L278) と `app.notFound(notFoundHandler)` (L191) の登録順序
- Hono は `notFound` の登録位置に関わらず全 route 未マッチ時のみ実行されるが、`app.route("/admin", adminDashboardRoute)` 系の sub-router が `*` matcher を内部で持っていないかを確認（持っていれば audit が奪われる）。実コードでは各 sub-router が明示パスでマッチしているので問題は薄いが、`createAdminAuditRoute()` の `app.use("*", ...)` は middleware のみで route ではないため安全。

### 2.3.5 staging env 検証手順 (Task B 関連)

```bash
# 1) staging 値の存在確認
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging | grep -i INTERNAL_AUTH_SECRET
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep -i INTERNAL_AUTH_SECRET

# 2) apps/web の vars 値（INTERNAL_API_BASE_URL）確認
grep -A20 "\[env.staging.vars\]" apps/web/wrangler.toml

# 3) staging API へ直接 curl（admin 認証セッション cookie + x-internal-auth）
#    実値はユーザー手元の op run 経由でのみ。Claude Code 側では echo しない。
#    Bash テンプレ。curl 対象 URL は Step 1 で確認した staging web Worker の
#    INTERNAL_API_BASE_URL と一致させる（ローカル .env の値だけで H1 を否定しない）。
# curl -sS -i "$INTERNAL_API_BASE_URL/admin/audit?limit=1" \
#   -H "x-internal-auth: $INTERNAL_AUTH_SECRET" \
#   -H "cookie: <staging-admin-session>"
```

`200` → H1/H2/H3 否定。`404` → H1 (path mismatch) or H3 (deploy stale)。`401/403` → H4 で auth path 確認。

## 2.4 状態管理

- searchParams は URL 正本（既存維持）
- Cursor は base64url JSON（既存維持）
- フィルタ送信は `<form action="/admin/audit" method="GET">`（既存維持）

## 2.5 エラーハンドリング

- API throw → `safeServerFetch` で `SafeResult.ok=false` → `AuditLogPanel` に `error` prop
- 404 → `ADMIN_FETCH_404` reason → `Banner tone="warning"` + recovery hint 1 行
- 5xx → `ADMIN_FETCH_5xx` reason → `Banner tone="danger"` + 「時間をおいて再試行してください」

## 2.6 トークン使用方針（CLAUDE.md 不変条件2）

- 色は `apps/web/src/styles/tokens.css` の OKLch 経由のみ
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` で gate）
- spacing / radius / shadow も既存 admin pages と同じユーティリティクラス
