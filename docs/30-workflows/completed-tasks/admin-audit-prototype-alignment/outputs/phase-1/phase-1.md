# Phase 1: 要件定義

> workflow: admin-audit-prototype-alignment
> implementation_mode: `existing-ui-alignment-plus-api-recovery`
> taskType: `implementation` / VISUAL

## 1.1 タスク分類

| 項目 | 値 |
|------|----|
| タスク種別 | UI task (VISUAL) + API recovery task |
| Phase 11 | VISUAL（screenshot 必須・admin-staging-visual 経由）/ API 側は curl + tail evidence |
| docs-only か | No（コード変更を伴う実装仕様書） |

## 1.2 上位ゴール

`/admin/audit` を他の admin 画面と一貫した prototype 由来の design language（`AdminPageHeader` + Card + Filter grid + tokenized `tbl`）に整え、staging で発生している `/admin/audit?limit=50 → 404` を解消する。`apps/api` の `/admin/audit` route の response shape / zod schema / 認可は一切変更しない。

## 1.3 carry-over 確認（前タスク棚卸し）

`git log --oneline -5`:
```
a5948394b feat(issue-255): coverage threshold 3-source drift lint (#962)
7c6ac7525 chore(dev-snapshot): housekeeping snapshot before origin/dev sync (#978)
4b3ac78fc feat(issue-275): MagicLinkForm 429 Retry-After server-truth countdown (#961)
7df1d3688 feat(issue-247): apps/web OpenNext config regression tests (#966)
dfdbf0574 feat(google-form-reflection-diagnostics): admin diagnostics pipeline + member diagnosis + skill sync (#960)
```

直近の前提:

- `admin-meetings-prototype-alignment`（completed）: meetings 画面で `AdminPageHeader` + Card + tbl pattern が確立済み。今 task はその pattern を audit 画面へ展開する。
- `admin-tag-queue-ui-and-404-recovery`（completed）: `safeServerFetch` の 404/4xx/5xx recovery hint pattern が確立済み。今 task は同じ pattern で audit の 404 を可視化＋切り分ける。
- `serial-05`: `/(admin)/admin/audit` blueprint は L841-940 で bind 済み（page.tsx 1 ファイル）。今 task で再構成する。

## 1.4 関係者と入力

| 関係者 / 入力 | 内容 |
|--------------|------|
| ユーザー（admin） | staging で audit データを閲覧したい。filter で範囲を絞りたい。 |
| プロトタイプ（pages-admin.jsx） | audit page そのものは未収録。同 admin 群の design language（page-head/Card/tbl）が正本。 |
| `apps/api/src/routes/admin/audit.ts` | `GET /admin/audit` を `requireAdmin` 経由で提供。クエリ: action / actorEmail / targetType / targetId / from / to / limit / cursor。response: `AdminAuditListResponseZ`。 |
| `apps/web/src/lib/admin/server-fetch.ts` | `fetchAdmin(path)` が `${INTERNAL_API_BASE_URL}${path}` を `x-internal-auth` ヘッダ付きで叩く。404 は `Error` として throw、`safeServerFetch` が `SafeResult` に包む。 |

## 1.4.1 aiworkflow-requirements 正本トレース

| 正本 | 参照 / 更新方針 |
|------|-----------------|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow を `spec_created / implementation / VISUAL` として登録する。 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `/admin/audit` UI alignment + API 404 recovery の入口を追加する。 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 初回参照対象（workflow root / artifacts / Task A/B / artifact inventory）を登録する。 |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-audit-prototype-alignment-artifact-inventory.md` | artifacts / Phase 1-13 / implementation targets / user-gated evidence boundary を物理台帳化する。 |
| `.claude/skills/aiworkflow-requirements/changelog/20260527-admin-audit-prototype-alignment.md` | 同一 wave の正本同期履歴を残す。 |

## 1.5 受け入れ条件 (AC)

### Task A — UI prototype alignment

- AC-A1: `/admin/audit` page.tsx は `<AdminPageHeader title="監査ログ" description=... breadcrumbs=...>` を使用し、独自 `<header><h1>` を持たない。
- AC-A2: filter 領域は `<Card>` 内に grid layout（responsive: mobile 1 col / tablet 2 col / desktop 4 col）で配置され、`FormField` + `Input` / `Select` / `Button` primitives を使う。raw `<select>` / `<button>` は撤去される。
- AC-A3: table 領域は admin 共通の `tbl` クラス（または既存 admin 表 primitive）を使い、tokenized border / spacing で他 admin 画面と視覚的に一致する。
- AC-A4: HEX 直書き / `bg-[#...]` / `text-[#...]` は 0 件（`verify-design-tokens` gate green）。色は OKLch token 経由。
- AC-A5: 「リセット」リンクは `Button variant="ghost"` または同等 primitive に置換される（raw `<Link data-role="reset">` の見た目調整は許容するが、他 admin の reset 動線と統一）。
- AC-A6: モバイル幅で table は横スクロール領域（既存 `admin-audit-table-scroll` 相当）で破綻しない。
- AC-A7: Playwright `admin-staging-visual` プロジェクトに audit 用 screenshot spec が存在し、desktop/tablet/mobile 3 サイズで Linux baseline を保持できる構造である（baseline 取得自体は user-gated）。
- AC-A8: `<AuditLogPanel>` の表示テスト（`AuditLogPanel.component.spec.tsx`）は既存 PII マスキング / cursor 表示の振る舞いを保持し、追加した primitive 周りの a11y label / role を確認するケースを含む。

### Task B — API 404 切り分け + 修復

- AC-B1: staging `/admin/audit` 画面で `admin api /admin/audit?... failed: 404` が再発しない（admin 認証セッションで 200 が返る）。
- AC-B2: `safeServerFetch` 側で 404 を受けた場合に「endpoint not found / route mount missing」と判別できる `ADMIN_FETCH_404` reason が `AuditLogPanel` の error 表示に出る（既存 recovery hint pattern と同様）。
- AC-B3: `apps/api/src/index.ts` の admin route mount で `/admin/audit` が `notFoundHandler` に到達しない順序であることが回帰テスト（既存 contract spec の延長 or `apps/api/src/index.spec.ts` 追加 spec）で保証される。
- AC-B4: `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` の staging 設定検証手順が `tasks/task-B-api-404-recovery.md` に明文化され、`bash scripts/cf.sh` 経由のコマンドで再現可能。
- AC-B5: `apps/api` 側に `/admin/audit` の smoke contract spec（list 200 + cursor round-trip + 認証 401）を追加または既存 spec を保持し、`pnpm --filter api test` で green。
- AC-B6: 真因が判明した時点で本仕様書に「確定原因（H1〜H5 のいずれか）」と「適用した修復」を追記する（実装 phase での記載）。

## 1.6 非機能要件

- セキュリティ: 監査ログ payload の PII マスキング（既存 `redactAuditPayload` / `maskAuditJson`）を絶対に弱化しない。
- パフォーマンス: 既存 cursor pagination を維持。limit 50 がデフォルト、最大 100。
- a11y: `<table>` に `<caption>` または `aria-labelledby`、`<th scope="col">` を保持。filter form に `aria-label="監査ログフィルター"` を維持。
- 観測性: `safeServerFetch` の 404 ログに request path + status を含める（既存 helper の挙動を維持）。

## 1.7 制約

- CLAUDE.md 不変条件 #5（D1 直接アクセス禁止）/ #11（auth boundary fail-closed）。
- 新規 primitive 追加禁止（既存 `apps/web/src/components/ui/` で完結）。
- API response shape 変更禁止。
- `*.test.tsx` 禁止、新規 spec は `*.spec.tsx`。

## 1.8 不確実性 / 仮説

| ID | 仮説 | 判定方法 |
|----|------|----------|
| H1 | `INTERNAL_API_BASE_URL` の staging 設定が `/admin` を含む URL 末尾になっていて二重 prefix で 404 | staging Secrets / vars 値を `bash scripts/cf.sh` で確認。`fetchAdmin` の `resolveApiBase()` 値を 1 度だけログ出力する debug 経路で検証 |
| H2 | Hono sub-router mount 順序で `/admin/audit` より前に他の `/admin/*` route が matching し audit を奪っている | `apps/api/src/index.ts` の `app.route("/admin", ...)` 列挙順を spec 化、`createAdminAuditRoute()` 単体 + `app` 全体の両方で 200 を確認 |
| H3 | staging deploy が古く `adminAuditRoute` を含まない | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` の最終 build artifact に `audit` が含まれることを `wrangler tail` + smoke で検証 |
| H4 | `requireAdmin` が 404 を返す変則ケース | コード上は 401/403。実コードの読み直しで除外可能 |
| H5 | `INTERNAL_AUTH_SECRET` 不一致で gateway / DO が 404 を返す構成 | API 単体に `x-internal-auth: <staging>` を付けて `curl` で叩き、200/401/404 のいずれかを切り分け |
