# task-15: admin-dashboard-and-members

> 責務 dir: `07-screens-admin`
> 担当画面: `/admin`（ダッシュボード）, `/admin/members`（会員管理テーブル）
> 依存: task-09 (`tailwind-v4-setup`), task-10 (`ui-primitives`)
> 並列: task-16 / task-17 と完全並列可（`apps/web/src/app/(admin)/layout.tsx` の確定だけ task-15 で先行）
> 改訂日: 2026-05-07

---

## §0. 自己完結コンテキスト

> 本セクションは task-15 を **単独で読み解くために必要な情報** をすべて inline で展開する自己完結ブロック。`outputs/phase-1..3` や `CLAUDE.md`、`task-08/10` を都度開かなくても、ここを読めば実装着手できることを目的とする。150〜250 行を厚めに使い、admin 8 画面のうち本 task が担当する 2 画面（`/admin` / `/admin/members`）を完全に閉じる。

### §0.1 上位ゴール（why this task exists）

UBM 兵庫支部会 admin バックオフィスの **入口 2 画面**（KPI ダッシュボード + 会員管理テーブル）を、`claude-design-prototype/pages-admin.jsx` の `AdminDashboardPage` / `AdminMembersPage` に忠実な OKLch tokens ベース UI として再構築する。本 task は同時に admin 群 (task-15/16/17) **共通の `(admin)/layout.tsx` を確定する責任** を持ち、後続 task-16/17 はこの layout を読み取り専用で import する。phase-1 §3.3 で API endpoint surface は確定済みのため、`apps/api` 側の追加実装はゼロ。phase-2 §5.2 の見積では 1.25 人日。task-18（Playwright smoke + verify-design-tokens）が後続 gate。

### §0.2 DAG 座標

```
task-09 (tailwind v4 + tokens) ─┐
                                ├──► task-15 (dashboard + members + layout 確定)
task-10 (ui primitives 11 種) ──┘            │
                                              ├─► task-16 (tags / meetings / requests)  ┐
                                              ├─► task-17 (schema / conflicts / audit)  ├─► task-18 (regression)
                                              └──────────────────────────────────────────┘
```

- 直接依存元: task-09（Tailwind v4 + `@theme` tokens）、task-10（Button / Card / Badge / Input / Select / Sidebar / Stat / EmptyState / Avatar / Field / Banner の 11 primitive）。
- 並列可: task-16, task-17（**ただし task-15 が `(admin)/layout.tsx` を main にマージするまで両者は着手しない**）。
- 直接依存先: task-18（Playwright smoke / `verify-design-tokens` / a11y regression）。
- 本 task は admin sub-route 群の **layout を最初に置く** ため、layout 完成前に task-16/17 が同ファイルへ書き込むと merge conflict 確定。§0.10 を参照。

### §0.3 触れるファイル群（M=Modify / C=Create / R=Read-only）

| 区分 | path | 役割 |
|------|------|------|
| M | `apps/web/src/app/(admin)/layout.tsx` | **task-15 確定担当**。`AdminSidebar`（8 nav 既存）+ `PageHeader` + `<slot/>` + `requireAdmin` server guard |
| M | `apps/web/src/app/(admin)/admin/page.tsx` | dashboard server fetch + Section 構成 |
| M | `apps/web/src/app/(admin)/admin/members/page.tsx` | members server fetch + client table へ受け渡し |
| C | `apps/web/src/features/admin/components/_dashboard/*.tsx` | KpiCard / KpiGrid / ZoneDistribution / StatusDistribution / RecentActions |
| C | `apps/web/src/features/admin/components/_members/*.tsx` | MembersTable / MembersFilterBar / MembersBulkActionBar / MemberDetailDrawer |
| C | `apps/web/src/lib/api/admin.ts` | base client + admin namespace **雛形を確定**（後続 task-16/17 は関数追記のみ） |
| R | `apps/web/src/components/layout/AdminSidebar.tsx` | 既存 8 nav 構成（編集禁止） |
| R | `apps/web/src/components/ui/*` | task-10 完成 primitive を import のみ |
| R | `apps/api/src/routes/admin/dashboard.ts` / `members.ts` / `member-status.ts` / `member-delete.ts` | endpoint 仕様の正本（変更禁止） |

### §0.4 既存 API（不変 surface — `apps/api/src/routes/admin/` を変更しない）

- `GET /admin/dashboard` (`dashboard.ts:26`) — KPI 集計 + zone 分布 + status 分布 + recent actions を 1 回で返す。
- `GET /admin/members` (`members.ts:198`) — 一覧。query: `zone` `status` `publication` `q` `cursor` `pageSize` （pageSize=50 固定）。
- `GET /admin/members/:memberId` (`members.ts:291`) — 詳細（drawer 用）。identity / answers / audit 抜粋 / notes を返す。
- `PATCH /admin/members/:memberId/status` (`member-status.ts:29`) — status 変更（active / paused / archived）。bulk 時はクライアント側で逐次呼び出し。
- `POST /admin/members/:memberId/delete` (`member-delete.ts:44`) — delete request enqueue（actual delete は task-17 audit / requests 経由）。
- `POST /admin/members/:memberId/restore` (`member-delete.ts:121`) — 取消（rollback）。bulk action 表示の Undo に紐付け。

### §0.5 不変条件（CLAUDE.md + phase-1 整合）

1. **D1 直アクセス禁止**: `apps/web` は `apps/api` 経由のみ。`adminClient` (`apps/web/src/lib/api/admin.ts`) は `fetch` ラッパに限定し、D1 binding を import しない。
2. **OKLch tokens 専用**: `bg-accent` `text-info` 等の Tailwind utility 経由のみ。HEX 直書き 0 件、`#`16進直書きは `verify-design-tokens` が fail する。
3. **consent キー固定**: `publicConsent` / `rulesConsent`（admin 表示でも別名禁止）。
4. **`responseEmail` は system field**: フォーム項目として並べない（detail drawer の identity ブロックで明示分離）。
5. **GAS prototype は本番仕様に昇格させない**: `gas-prototype/` は参考用のみ。`pages-admin.jsx` の `AdminDashboardPage` / `AdminMembersPage` を UI 正本として参照。
6. **Google Form 再回答が本人更新の正式経路**: members 画面では `/admin/members/:id` の answers ブロックは read-only。編集 UI は出さない。
7. **新 endpoint 追加禁止**: `apps/api/src/routes/admin/` の app.\* 行を増やさない（変更が必要なら別 task として切り出す）。

### §0.6 上流シグネチャ（本 task が呼び出す API — 1 行サマリ）

| method | path | request | response | source |
|--------|------|---------|----------|--------|
| GET | `/admin/dashboard` | （無） | `{ kpis: { total, active, paused, archived }, zones: Array<{zone, count}>, statuses: Array<{status, count}>, recentActions: Array<{at, actor, action, target}> }` | `dashboard.ts` |
| GET | `/admin/members` | query: `zone? / status? / publication? / q? / cursor? / pageSize=50` | `{ items: Member[], nextCursor: string \| null }` | `members.ts:198` |
| GET | `/admin/members/:memberId` | path: `memberId` | `{ identity, answers, audit, notes }` | `members.ts:291` |
| PATCH | `/admin/members/:memberId/status` | body: `{ status: 'active'\|'paused'\|'archived', reason? }` | `{ ok: true, memberId, status }` | `member-status.ts` |
| POST | `/admin/members/:memberId/delete` | body: `{ reason }` | `{ ok: true, requestId }` | `member-delete.ts:44` |
| POST | `/admin/members/:memberId/restore` | body: `{ reason? }` | `{ ok: true, memberId }` | `member-delete.ts:121` |

### §0.7 下流シグネチャ（task-15 が後続に提供する surface）

- `apps/web/src/app/(admin)/layout.tsx` — default export RSC。`children: ReactNode` を受ける。`requireAdmin()` (auth helper) を await し、未認証は `/sign-in?next=/admin` へ redirect。task-16/17 の page.tsx は **この layout を import せず Next.js の自動 nesting に委ねる**（変更しない）。
- `apps/web/src/lib/api/admin.ts` — `export const adminClient = { dashboard: { get }, members: { list, get, patchStatus, requestDelete, restore } }`。task-16 は `tags / meetings / requests` を、task-17 は `schema / identityConflicts / audit` を **同 object に追記** する（barrel 形式・関数追加のみ・既存削除禁止）。
- `apps/web/src/features/admin/components/index.ts` — barrel export。本 task は `_dashboard/*` と `_members/*` のみ追加。
- `(admin)/layout.tsx` 確定後の **8 nav 順序**: ダッシュボード / 会員管理 / タグキュー / schema / 開催日 / 依頼キュー / Identity 重複 / 監査ログ（`AdminSidebar.tsx` 既存配列に従う・並べ替え禁止）。

### §0.8 用語（admin 文脈で頻出）

| 用語 | 定義 |
|------|------|
| KPI | total / active / paused / archived の 4 メトリクス（`/admin/dashboard.kpis`） |
| Zone | 兵庫県の地域分類（神戸 / 阪神 / 播磨 / 但馬 / 丹波 / 淡路）。Google Form の zone 項目から派生 |
| Publication | `publicConsent` の真偽。会員ディレクトリへの掲載可否 |
| Status | member.status (`active` / `paused` / `archived`)。Publication と独立 |
| Recent Actions | audit log のうち直近 N 件を dashboard に inline 表示する subset |
| Bulk Action | 選択行に対する一括操作（公開 / 非公開 / 削除申請キュー化）。実装はクライアント側 fan-out（API 1 件ずつ） |
| Drawer | members 行クリックで右から slide-in する詳細 panel。Modal とは別 primitive |

### §0.9 画面の概念（layout pattern）

- **`/admin`（ダッシュボード）**: pattern = **KPI Grid + Distribution Charts + Recent Actions**。上段に KPI 4 枚（`Stat` primitive を `KpiCard` でラップ、grid-cols-4）、中段左に Zone 分布バーチャート（軽量 SVG または `recharts`）、中段右に Status 分布チップ群（`Badge` primitive で tone 切替）、下段に Recent Actions テーブル（最新 10 件、`/admin/audit?actor=...` への row click 遷移は `<Link>` のみ・フィルタ反映は task-17 担当）。
- **`/admin/members`（会員管理）**: pattern = **FilterBar + Table + Drawer + BulkActionBar**。上に FilterBar（zone / status / publication / 自由検索）、中央に DataTable（pageSize=50 通常 pagination・sort: 最終回答日時 / 公開状態 / フルネーム）、行選択時に下固定で BulkActionBar が slide-up（公開 / 非公開 / 削除申請キュー化 / Undo restore）、行クリックで右からスライドする MemberDetailDrawer（identity / answers / audit log / notes の 4 タブ・answers は read-only）。
- **プロトタイプ反映**: `pages-admin.jsx:4` `AdminDashboardPage` / `:162` `AdminMembersPage` の DOM 構造と class 命名（`card card-pad card-hover` 等）を OKLch tokens + Tailwind utility に置換しつつ、見出し階層・要素順序は忠実に保持する。CSV エクスポートは MVP 範囲外なので button は `disabled` + tooltip "Coming soon"。

### §0.10 競合回避（共通 layout 確定担当）

> **task-15 が `(admin)/layout.tsx` を確定するまで、task-16 / task-17 は admin sub-route の page.tsx 着手を保留する**。layout が main に着いた後に sub-route を切る。

| ファイル | task-15 | task-16 | task-17 | 解決方針 |
|---------|--------|---------|---------|---------|
| `apps/web/src/app/(admin)/layout.tsx` | **M（確定担当・W5 で先行マージ）** | R（import のみ） | R（import のみ） | **task-16/17 は本ファイルを編集しない**。merge conflict 出たら task-15 側を正とし、task-16/17 が rebase で吸収 |
| `apps/web/src/lib/api/admin.ts` | C（base + admin namespace 雛形） | M（tags / meetings / requests を追記） | M（schema / conflicts / audit を追記） | object literal の **key 追加のみ**。既存 key 編集禁止 |
| `apps/web/src/features/admin/components/index.ts` | M（`_dashboard/*` `_members/*` 追記） | M（`_tags/*` `_meetings/*` `_requests/*` 追記） | M（`_schema/*` `_conflicts/*` `_audit/*` 追記） | barrel export の **行追記のみ**。再ソート禁止 |
| OKLch tokens（`@theme`） | R | R | R | task-09 で確定済み。本 task 群では編集しない |

警告: layout 完成前に task-16/17 を着手すると `(admin)/layout.tsx` の path 解決と AdminSidebar `aria-current` 判定で破綻する。task-15 W5（layout merge）以降に task-16/17 を fan-out する。

### §0.11 W（Wave）分割と layout merge の位置

| Wave | 内容 | 後続 task への影響 |
|------|------|-------------------|
| W1 | `apps/web/src/lib/api/admin.ts` の base client 雛形（fetch helper + 共通 error mapping） | task-16/17 の adminClient.\* 追記の前提 |
| W2 | `_dashboard/*` primitive 組み立て（Stat / Badge / Card 合成）+ KpiGrid のみ最小実装 | dashboard SSR 200 確認用の足場 |
| W3 | `_members/*` primitive 組み立て（Table / FilterBar / BulkActionBar / Drawer）+ adminClient.members.\* 接続 | members 行クリックで Drawer が開くこと |
| W4 | `(admin)/admin/page.tsx` / `(admin)/admin/members/page.tsx` のサーバーフェッチ確定 | dashboard / members 双方の SSR 完成 |
| **W5** | **`apps/web/src/app/(admin)/layout.tsx` 確定 + main マージ** | **ここを通過するまで task-16/17 着手不可** |
| W6 | jest-axe / vitest / 手動 smoke の通過確認 | task-18 への引き継ぎ |

### §0.12 a11y / i18n / token の現場ルール

- **テーブル**: `<table>` には `<caption class="sr-only">` で要約、`<th scope="col">` 必須。row click は `<button>` で wrap し Drawer を開く（`<tr onClick>` のみは禁止）。
- **Drawer**: `role="dialog"` + `aria-labelledby` + ESC キー閉じ、focus trap は task-10 の Drawer primitive 任せ（無ければ最小実装）。
- **BulkActionBar**: 表示時に `role="region"` + `aria-label="一括操作"`。`aria-live="polite"` で件数表示。
- **チャート**: バーチャートには `role="img" aria-label="zone 別人数 N 件のうち最大は神戸 M 件"` のような summary を必ず付与。色だけでの情報表現は禁止（数値ラベル併記）。
- **Tooltip**: "Coming soon" は `aria-disabled="true"` + `title` ではなく Radix Tooltip primitive 経由で。
- **JST 表示**: dashboard の Recent Actions 時刻は `Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' })`。
- **token**: `bg-surface` `text-text-strong` `border-border` `bg-accent-soft` `text-accent` 等を CVA variant 経由で使用。`text-[#xxx]` は `verify-design-tokens` が fail。

### §0.13 想定エラーパターン（dashboard / members）

| 症状 | 想定原因 | 対処 |
|------|---------|------|
| dashboard が 401 | `requireAdmin` 未マージ / cookie 切れ | layout の guard を確認、`/sign-in?next=/admin` に redirect |
| members が空 | API filter が too strict / cursor 不整合 | FilterBar の reset で再フェッチ、`q` 空文字を送らない |
| Drawer が開かない | row click が `<a>` と競合 | row 全体を `<button>` 化、Link 列は `e.stopPropagation()` |
| HEX 直書き fail | utility の hardcode | `bg-[#...]` を `bg-accent` 等に置換、tokens.css 側で対応色がない場合は task-08 へ feedback |
| Recent Actions の遷移先が無効 | task-17 audit page 未マージ | 一時的に Link を `disabled` 表示。task-17 完了後に有効化（dashboard 側変更不要） |
| BulkActionBar が他画面に滲む | layout の z-index 管理 | `z-banner < z-bulkbar < z-drawer < z-modal` を tokens で定義、Bulkbar は `z-30` で固定 |

### §0.14 phase-1..3 / CLAUDE.md からの根拠引用

- phase-1 §3.3: `/admin` 配下 8 画面のうち本 task は `/admin` `/admin/members` を担当。endpoint は dashboard.ts / members.ts / member-status.ts / member-delete.ts に閉じる。
- phase-2 §5.2: 工数 1.25 人日。並列性は task-16/17 と独立だが layout merge を gate とする。
- phase-3 §2.3: KPI / Zone 分布 / Status 分布 / Recent Actions の 4 セクション構成。Recent Actions row click は `/admin/audit?actor=...` への単純遷移。
- phase-3 §3.2: bulk action は accept/reject 系ではなく "公開 / 非公開 / 削除申請キュー化"。
- CLAUDE.md「重要な不変条件」§5: D1 直アクセスは `apps/api` 限定。`adminClient` は fetch wrapper 専用。
- CLAUDE.md「重要な不変条件」§6: GAS prototype は本番仕様に昇格させない。`gas-prototype/` を import しない。

### §0.15 セキュリティ前提

- **`requireAdmin` server guard**: `(admin)/layout.tsx` の冒頭で `await requireAdmin()` を呼び、未認証は `/sign-in?next=/admin`、admin role 不所持は `/forbidden` へ。
- **CSRF**: state-changing endpoint（status patch / delete request / restore）は API 側で `Origin` チェック済み。client は credentials: 'include' のみ。
- **PII 表示**: members detail drawer の `responseEmail` / 電話番号は `aria-label` のみ全文、表示は masked（`a***@example.com` / `090-****-1234`）。コピー Button は audit log に actor 記録。
- **OAuth/Magic Link 切替**: 本 task では認証分岐を扱わない。auth helper の戻り値型のみ依存。

---

## 0. ヘッダー

| 項目 | 値 |
|------|-----|
| task ID | task-15 |
| task name | admin-dashboard-and-members |
| 責務 dir | `07-screens-admin` |
| 工数見積 | 1.25 人日（phase-2 §5.2） |
| 主担当 | Frontend |
| 主要 deliverable | `/admin` + `/admin/members` の刷新（layout 確定 + KPI / chart / DataTable / Drawer） |
| 直接依存 | task-09 (Tailwind v4 + tokens), task-10 (primitives 13 件) |
| 並列可 | task-16, task-17（admin sub-route 群） |
| 後続 | task-18（regression / Playwright smoke） |
| 関連 spec | `docs/00-getting-started-manual/specs/11-admin-management.md`, phase-3 §2.3, §3.2 |

### 0.1 直近上位 phase との接続

- phase-1 §3.3 で `/admin` `/admin/members` の API endpoint をマップ済み（`/admin/dashboard` / `/admin/members` / `/admin/member-status` / `/admin/member-delete` / `/admin/member-notes/:id`）。本 task は新 endpoint を追加しない。
- phase-2 §1 で task-15 は「KPI + chart + DataTable + drawer」を 1.25 人日で完了する見込みと記載。
- phase-3 §1.2 で想定変更ファイル俯瞰を提示済み。本仕様書はそれを実装レベルまで落とし込む。

### 0.2 並列実行時の競合対策

| ファイル | task-15 | task-16 | task-17 | 解決方針 |
|---------|--------|---------|---------|---------|
| `apps/web/src/app/(admin)/layout.tsx` | M（確定担当） | R | R | task-15 で W5 開始時に先行マージ。task-16/17 は import のみ |
| `apps/web/src/lib/api/admin.ts` | C（雛形） | M（追加） | M（追加） | task-15 で base client + admin namespace を確定、後続は関数追加のみ |
| `apps/web/src/features/admin/components/index.ts` | C | M | M | barrel export を追記方式 |

---

## 1. ゴール / 非ゴール

### 1.1 ゴール（Definition of Done）

| ID | 条件 | 検証方法 |
|----|------|---------|
| G-01 | `/admin` が SSR 200 を返し、KPI 4 / Zone 分布 / Status 分布 / Recent Actions が描画される | Playwright smoke（task-18） |
| G-02 | `/admin/members` が SSR 200 を返し、テーブル + フィルタ + bulk action が描画される | Playwright smoke |
| G-03 | `(admin)/layout.tsx` に `AdminSidebar`（8 nav items 確定）+ `PageHeader` + `<slot/>` の固定構成が反映される | 目視 + scrollshot |
| G-04 | `apps/api` の `/admin/dashboard` `/admin/members` `/admin/member-status` `/admin/member-delete` を adapter 経由で接続 | unit test (vitest) で client mock + 手動 smoke |
| G-05 | OKLch tokens のみ使用、HEX 直書き 0 件 | `pnpm verify-design-tokens`（task-18） |
| G-06 | jest-axe critical 0 件、role / aria-label が table / button / chart に付与 | jest-axe テスト |
| G-07 | sort（最終回答日時 / 公開状態 / フルネーム）と filter（zone / status / 公開状態 / 自由検索）が client state で動作 | vitest コンポーネントテスト |
| G-08 | bulk action（公開 / 非公開 / 削除申請キュー化）が選択行に対して action bar から起動できる | vitest + manual |
| G-09 | drawer で 1 会員の詳細（identity, answers, audit log, notes）を確認できる | vitest |
| G-10 | `verify-design-tokens` / `pnpm typecheck` / `pnpm lint` が green | CI |

### 1.2 非ゴール

- 新規 admin endpoint の追加（`apps/api` 側に変更を加えない / phase-1 §1.2）
- chart ライブラリの自前実装（`recharts` 採用 or 軽量 SVG。`recharts` を入れる場合は task-09 で tailwind v4 互換確認済み）
- D1 schema 変更（一切なし）
- pagination の virtual scroll 化（pageSize=50 固定の通常 pagination）
- CSV エクスポート機能の実装（プロトタイプには CTA があるが MVP 範囲外。disable button + tooltip "Coming soon"）
- 監査ログ画面（task-17 担当）への直接遷移ロジック（dashboard の RecentActions から `/admin/audit?actor=...` で遷移するだけで、フィルタ反映は task-17 側で実装）

---

## 2. 変更対象ファイル表

| 区分 | path | 役割 |
|------|------|------|
| M | `apps/web/src/app/(admin)/layout.tsx` | Sidebar + PageHeader 固定構成、`requireAdmin` server guard の確定 |
| M | `apps/web/src/app/(admin)/admin/page.tsx` | dashboard のサーバーフェッチ + Section 構成 |
| M | `apps/web/src/app/(admin)/admin/members/page.tsx` | members サーバーフェッチ + クライアントテーブルへ受け渡し |
| C | `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` | KPI セル 1 枚 |
| C | `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | KPI 4 枚を grid-4 で配置 |
| C | `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | Zone 分布バーチャート |
| C | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | Status 分布チップ群 |
| C | `apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx` | recentActions の DataTable |
| C | `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | unresolvedSchema > 0 時のアラートカード |
| C | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | テーブル本体（sort / select / row action） |
| C | `apps/web/src/features/admin/components/_members/MembersFilters.tsx` | zone / status / publishState / q の Filter Bar |
| C | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | 選択行に対する一括 action |
| C | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | row 詳細 drawer（identity / answers / notes） |
| C | `apps/web/src/features/admin/components/_members/MembersClientShell.tsx` | URLSearchParams 同期の client state container |
| C | `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | breadcrumb + title + action slot |
| C | `apps/web/src/lib/api/admin.ts` | admin endpoint client（base URL + auth header + zod parse） |
| C | `apps/web/src/lib/api/admin-types.ts` | response 型（`@ubm-hyogo/shared` の re-export + UI 用 mapper） |
| C | `apps/web/src/features/admin/components/__tests__/KpiGrid.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/MembersTable.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/MembersFilters.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/RecentActionsTable.test.tsx` | vitest |
| R | `apps/web/src/components/layout/AdminSidebar.tsx` | task-09/10 で確定済み。再利用のみ |
| R | `apps/api/src/routes/admin/dashboard.ts` | response shape の正本 |
| R | `apps/api/src/routes/admin/members.ts` | search / filter parameter の正本 |
| R | `packages/shared/src/zod/viewmodel.ts` | `AdminDashboardViewZ` / `AdminMemberListViewZ` / `AdminMemberDetailViewZ` |

> 既存 `apps/web/app/(admin)/admin/page.tsx` 等の旧実装は、本 task で再構成する。`apps/web/src/components/admin/` 配下の既存コンポーネント（`MembersClient.tsx` など）は段階的に `features/admin/components/_members/` 配下へ移行し、最終的に旧 dir を削除する（task-18 で残骸 0 件を verify）。

---

## 3. 共通レイアウト（task-15 で確定）

### 3.1 `(admin)/layout.tsx`

```tsx
// apps/web/src/app/(admin)/layout.tsx
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // requireAdmin: session を `apps/api` の /auth/session-resolve で検証。
  //   - active+role=admin -> pass
  //   - それ以外 -> redirect("/login?from=/admin")
  await requireAdmin();

  return (
    <div className="ubm-admin-shell grid min-h-screen grid-cols-[240px_1fr] bg-[var(--ubm-color-bg)] text-[var(--ubm-color-text)]">
      <aside className="border-r border-[var(--ubm-color-border)]">
        <AdminSidebar />
      </aside>
      <main className="flex flex-col">{children}</main>
    </div>
  );
}
```

- `AdminSidebar` の nav 8 件は task-09/10 段階で次の順序に確定済み: ダッシュボード / 会員管理 / タグキュー / 開催日 / schema / 依頼キュー / Identity 重複 / 監査ログ。
- `requireAdmin` は `apps/web/src/lib/auth/require-admin.ts`（task-13 で確定）を再利用。本 task では新規追加しない。
- `force-dynamic`: dashboard の `recentActions` が 1 リクエスト毎に最新化される必要があるため明示的に dynamic 化。

### 3.2 `AdminPageHeader`

```tsx
// apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx
import type { ReactNode } from "react";

export interface AdminPageHeaderProps {
  eyebrow: string;          // 例: "ADMIN" / "ADMIN / MEMBERS"
  title: string;            // 例: "管理ダッシュボード"
  description?: string;     // 1-2 行の補足
  actions?: ReactNode;      // 右肩の Button 群（任意）
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-2 border-b border-[var(--ubm-color-border)] px-8 py-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ubm-color-text-3)]">
          {eyebrow}
        </span>
        <h1 className="text-2xl font-semibold leading-tight text-[var(--ubm-color-text)]">{title}</h1>
        {description ? (
          <p className="text-sm text-[var(--ubm-color-text-2)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
```

---

## 4. 画面 1: `/admin`（管理ダッシュボード）

### 4.1 構成

プロトタイプ `pages-admin.jsx` `AdminDashboardPage` に準拠する。section レイアウトは以下:

```
[AdminPageHeader: "ADMIN" / "管理ダッシュボード"]
[SchemaAlertCard]                     ← unresolvedSchema > 0 のときのみ
[KpiGrid (4 セル)]
[grid-2]
  [ZoneDistribution]
  [RecentActionsTable]                ← prototype の "最近の支部会と出席" を audit log に置換
[StatusDistribution]                  ← prototype では Zone カード内にあったが分離
[Shortcuts (Members / Tags / Schema)] ← Card x 3、各 nav item へ遷移
```

### 4.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/page.tsx
import { Suspense } from "react";
import { fetchAdminDashboard } from "@/lib/api/admin";
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { KpiGrid } from "@/features/admin/components/_dashboard/KpiGrid";
import { ZoneDistribution } from "@/features/admin/components/_dashboard/ZoneDistribution";
import { StatusDistribution } from "@/features/admin/components/_dashboard/StatusDistribution";
import { RecentActionsTable } from "@/features/admin/components/_dashboard/RecentActionsTable";
import { SchemaAlertCard } from "@/features/admin/components/_dashboard/SchemaAlertCard";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const view = await fetchAdminDashboard();

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN"
        title="管理ダッシュボード"
        description="フォーム回答・スキーマ・メンバーの健全性を一画面で把握できます。"
      />
      <div className="flex flex-col gap-6 px-8 py-6">
        {view.totals.unresolvedSchema > 0 ? (
          <SchemaAlertCard count={view.totals.unresolvedSchema} />
        ) : null}

        <KpiGrid totals={view.totals} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ZoneDistribution totals={view.totals} />
          <Suspense fallback={<Skeleton className="h-[320px]" />}>
            <RecentActionsTable items={view.recentActions} />
          </Suspense>
        </div>

        <StatusDistribution totals={view.totals} />
      </div>
    </div>
  );
}
```

### 4.3 KPI 4 枚

`AdminDashboardViewZ.totals` に従い 4 枚固定:

| id | label | source field | 警告色閾値 |
|----|-------|-------------|----------|
| total | Total members | `totalMembers` | なし |
| public | Public on site | `publicMembers` | `publicMembers === 0` で warning |
| untagged | Untagged | `untaggedMembers` | `untaggedMembers > 0` で warning |
| schema | Schema issues | `unresolvedSchema` | `unresolvedSchema > 0` で danger / `=== 0` で success |

```tsx
// apps/web/src/features/admin/components/_dashboard/KpiCard.tsx
import { cn } from "@/lib/utils/cn";

export type KpiTone = "neutral" | "success" | "warning" | "danger";

export interface KpiCardProps {
  label: string;
  value: number;
  sub?: string;
  tone?: KpiTone;
}

const toneClass: Record<KpiTone, string> = {
  neutral: "text-[var(--ubm-color-text)]",
  success: "text-[var(--ubm-color-success)]",
  warning: "text-[var(--ubm-color-warning)]",
  danger:  "text-[var(--ubm-color-danger)]",
};

export function KpiCard({ label, value, sub, tone = "neutral" }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-5",
        "shadow-[var(--ubm-shadow-card)]",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-[var(--ubm-color-text-3)]">
        {label}
      </div>
      <div className={cn("mt-2 font-mono text-3xl font-semibold tabular-nums", toneClass[tone])}>
        {value.toLocaleString("ja-JP")}
      </div>
      {sub ? <div className="mt-1 text-xs text-[var(--ubm-color-text-2)]">{sub}</div> : null}
    </div>
  );
}
```

```tsx
// apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx
import { KpiCard } from "./KpiCard";
import type { AdminDashboardView } from "@/lib/api/admin-types";

export interface KpiGridProps {
  totals: AdminDashboardView["totals"];
}

export function KpiGrid({ totals }: KpiGridProps) {
  const hidden = totals.totalMembers - totals.publicMembers;
  return (
    <section
      aria-label="ダッシュボード KPI"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <KpiCard label="Total members" value={totals.totalMembers} sub={`非公開: ${hidden} 名`} />
      <KpiCard
        label="Public on site"
        value={totals.publicMembers}
        sub={totals.publicMembers === 0 ? "公開中ゼロ" : "公開中"}
        tone={totals.publicMembers === 0 ? "warning" : "neutral"}
      />
      <KpiCard
        label="Untagged"
        value={totals.untaggedMembers}
        sub="タグ割当が必要"
        tone={totals.untaggedMembers > 0 ? "warning" : "neutral"}
      />
      <KpiCard
        label="Schema issues"
        value={totals.unresolvedSchema}
        sub="未解決の差分"
        tone={totals.unresolvedSchema > 0 ? "danger" : "success"}
      />
    </section>
  );
}
```

### 4.4 ZoneDistribution（バーチャート）

`/admin/dashboard` の現行 endpoint は zone 別の数値を返さない（`totals` のみ）。プロトタイプは MEMBERS 側集計だが、本 task では追加 endpoint を生やさず、**既存 `/admin/members?zone=...` を 3 回ならびに status を 3 回叩いて分布を作る**方式は禁止（N+1）。代替として:

1. `apps/api/src/routes/admin/dashboard.ts` の response に `byZone` `byStatus` を後日追加する余地を空けるが、本 task では UI 側で **`AdminDashboardView` に optional の `byZone` / `byStatus` を生やし、サーバー値が無い場合は "（集計データ未対応）" の placeholder を出す**方針とする。
2. `byZone` / `byStatus` は `viewmodel.ts` の `AdminDashboardViewZ` を `extend` した UI 専用 schema (`AdminDashboardUiViewZ`) を `apps/web/src/lib/api/admin-types.ts` に置く（`shared` には触らない）。
3. UI 側では `byZone` 未提供時に **`null` レンダリング + a11y 通知**（`<p role="status">分布データは現在集計対象外です</p>`）。

```ts
// apps/web/src/lib/api/admin-types.ts
import { z } from "zod";
import { AdminDashboardViewZ } from "@ubm-hyogo/shared";

export const AdminDashboardUiViewZ = AdminDashboardViewZ.extend({
  byZone: z
    .array(
      z.object({
        zoneId: z.enum(["zone_0_1", "zone_1_10", "zone_10_100"]),
        label: z.string(),
        count: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  byStatus: z
    .array(
      z.object({
        statusId: z.string(),
        label: z.string(),
        count: z.number().int().nonnegative(),
      }),
    )
    .optional(),
});

export type AdminDashboardView = z.infer<typeof AdminDashboardUiViewZ>;
```

```tsx
// apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx
import type { AdminDashboardView } from "@/lib/api/admin-types";

export interface ZoneDistributionProps {
  totals: AdminDashboardView["totals"];
  byZone?: AdminDashboardView["byZone"];
}

const zoneColor: Record<string, string> = {
  zone_0_1:    "var(--ubm-color-zone-a)",
  zone_1_10:   "var(--ubm-color-zone-b)",
  zone_10_100: "var(--ubm-color-zone-c)",
};

export function ZoneDistribution({ totals, byZone }: ZoneDistributionProps) {
  if (!byZone || byZone.length === 0) {
    return (
      <section className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6">
        <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-3)]">
          DISTRIBUTION
        </header>
        <h2 className="text-lg font-semibold">UBM 区画の分布</h2>
        <p role="status" className="mt-3 text-sm text-[var(--ubm-color-text-2)]">
          分布データは現在集計対象外です。
        </p>
      </section>
    );
  }

  const total = Math.max(totals.totalMembers, 1);

  return (
    <section
      aria-label="UBM 区画分布"
      className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6"
    >
      <header className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-3)]">
          DISTRIBUTION
        </span>
      </header>
      <h2 className="mb-4 text-lg font-semibold">UBM 区画の分布</h2>

      <ul className="flex flex-col gap-3">
        {byZone.map((row) => (
          <li key={row.zoneId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{row.label}</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{row.count} 名</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--ubm-color-bg)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.count / total) * 100}%`,
                  background: zoneColor[row.zoneId] ?? "var(--ubm-color-primary)",
                }}
                aria-hidden
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### 4.5 StatusDistribution（チップ群）

```tsx
// apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx
import type { AdminDashboardView } from "@/lib/api/admin-types";

export interface StatusDistributionProps {
  totals: AdminDashboardView["totals"];
  byStatus?: AdminDashboardView["byStatus"];
}

export function StatusDistribution({ byStatus }: StatusDistributionProps) {
  if (!byStatus || byStatus.length === 0) return null;
  return (
    <section
      aria-label="メンバー状態分布"
      className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6"
    >
      <header className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-3)]">
        BY STATUS
      </header>
      <ul className="flex flex-wrap gap-2">
        {byStatus.map((s) => (
          <li
            key={s.statusId}
            className="flex flex-col rounded-lg border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-4 py-2"
          >
            <span className="text-xs text-[var(--ubm-color-text-2)]">{s.label}</span>
            <span className="font-mono text-base font-semibold tabular-nums">{s.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### 4.6 RecentActionsTable

```tsx
// apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx
import Link from "next/link";
import type { AdminDashboardView } from "@/lib/api/admin-types";
import { formatJstDateTime } from "@/lib/format/datetime";

export interface RecentActionsTableProps {
  items: AdminDashboardView["recentActions"];
}

export function RecentActionsTable({ items }: RecentActionsTableProps) {
  return (
    <section
      aria-label="直近の管理操作"
      className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">直近のアクション</h2>
        <Link
          href="/admin/audit"
          className="text-xs font-medium text-[var(--ubm-color-primary)] hover:underline"
        >
          監査ログを開く →
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--ubm-color-text-2)]">直近 7 日のアクションはありません。</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-[var(--ubm-color-text-3)]">
            <tr>
              <th className="py-2 text-left font-medium">日時</th>
              <th className="py-2 text-left font-medium">操作者</th>
              <th className="py-2 text-left font-medium">アクション</th>
              <th className="py-2 text-left font-medium">対象</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.auditId} className="border-t border-[var(--ubm-color-border)]">
                <td className="py-2 font-mono text-xs text-[var(--ubm-color-text-2)]">
                  {formatJstDateTime(row.createdAt)}
                </td>
                <td className="py-2">{row.actorEmail ?? "system"}</td>
                <td className="py-2 font-mono text-xs">{row.action}</td>
                <td className="py-2">
                  <span className="text-[var(--ubm-color-text-2)]">{row.targetType}</span>
                  {row.targetId ? (
                    <span className="ml-1 font-mono text-xs">/ {row.targetId.slice(0, 8)}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

### 4.7 SchemaAlertCard

```tsx
// apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx
import Link from "next/link";

export interface SchemaAlertCardProps {
  count: number;
}

export function SchemaAlertCard({ count }: SchemaAlertCardProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between rounded-xl border p-5"
      style={{
        background: "color-mix(in oklch, var(--ubm-color-warning) 8%, transparent)",
        borderColor: "color-mix(in oklch, var(--ubm-color-warning) 30%, transparent)",
      }}
    >
      <div className="flex flex-col gap-1">
        <strong className="text-sm font-semibold text-[var(--ubm-color-warning-strong)]">
          フォームスキーマに未解決の変更があります
        </strong>
        <span className="text-xs text-[var(--ubm-color-text-2)]">
          {count} 件の項目をレビューしてください。stableKey の割当が必要な項目があります。
        </span>
      </div>
      <Link
        href="/admin/schema"
        className="text-sm font-medium text-[var(--ubm-color-warning-strong)] hover:underline"
      >
        差分をレビュー →
      </Link>
    </div>
  );
}
```

---

## 5. 画面 2: `/admin/members`（会員管理）

### 5.1 構成

```
[AdminPageHeader: "ADMIN / MEMBERS" / "メンバー管理"]
[MembersFilters]                       ← zone / status / publishState / 自由検索
[BulkActionBar]                        ← 選択行が 1 つ以上で活性
[MembersTable]                         ← sort + checkbox + row action
[Pagination]
[MemberDrawer]                         ← row click で右から slide-in
```

### 5.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/members/page.tsx
import { fetchAdminMembers } from "@/lib/api/admin";
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { MembersClientShell } from "@/features/admin/components/_members/MembersClientShell";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export interface AdminMembersPageProps {
  searchParams: Promise<{
    q?: string;
    zone?: string;
    tag?: string | string[];
    sort?: string;
    density?: string;
    page?: string;
    filter?: string;
  }>;
}

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const sp = await searchParams;
  const initial = await fetchAdminMembers(sp);

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN / MEMBERS"
        title="メンバー管理"
        description="回答データ・公開フラグ・タグ付けをここから操作します。"
        actions={
          <Button variant="ghost" disabled title="MVP 範囲外">
            CSV エクスポート
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-8 py-6">
        <MembersClientShell initial={initial} initialQuery={sp} />
      </div>
    </div>
  );
}
```

### 5.3 MembersClientShell（client）

```tsx
// apps/web/src/features/admin/components/_members/MembersClientShell.tsx
"use client";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MembersFilters } from "./MembersFilters";
import { MembersTable } from "./MembersTable";
import { BulkActionBar } from "./BulkActionBar";
import { MemberDrawer } from "./MemberDrawer";
import type { AdminMemberListView } from "@/lib/api/admin-types";

export interface MembersClientShellProps {
  initial: AdminMemberListView;
  initialQuery: Record<string, string | string[] | undefined>;
}

export function MembersClientShell({ initial, initialQuery }: MembersClientShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  const updateQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      // page は filter 変更時にリセット
      if (Object.keys(patch).some((k) => k !== "page")) next.delete("page");
      startTransition(() => router.replace(`/admin/members?${next.toString()}`));
    },
    [router, searchParams],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const memo = useMemo(() => ({ items: initial.members, total: initial.total }), [initial]);

  return (
    <>
      <MembersFilters
        value={{
          q:     (searchParams.get("q") ?? "") || undefined,
          zone:  searchParams.get("zone") ?? undefined,
          filter: searchParams.get("filter") ?? undefined,
          sort:  searchParams.get("sort") ?? undefined,
        }}
        onChange={updateQuery}
        loading={pending}
      />

      <BulkActionBar
        selectedIds={Array.from(selected)}
        onClear={() => setSelected(new Set())}
        onComplete={() => {
          setSelected(new Set());
          router.refresh();
        }}
      />

      <MembersTable
        items={memo.items}
        total={memo.total}
        page={initial.page ?? 1}
        pageSize={initial.pageSize ?? 50}
        selected={selected}
        onToggleSelect={toggleSelect}
        onOpenRow={(id) => setOpenMemberId(id)}
        onPageChange={(p) => updateQuery({ page: String(p) })}
      />

      {openMemberId ? (
        <MemberDrawer
          memberId={openMemberId}
          onClose={() => setOpenMemberId(null)}
          onMutated={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
```

### 5.4 MembersFilters

```tsx
// apps/web/src/features/admin/components/_members/MembersFilters.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type MembersFilterValue = {
  q?: string;
  zone?: string;
  filter?: string; // published | hidden | deleted
  sort?: string;   // recent | name | publish_state
};

export interface MembersFiltersProps {
  value: MembersFilterValue;
  onChange: (patch: Partial<MembersFilterValue>) => void;
  loading?: boolean;
}

const ZONE_OPTIONS = [
  { value: "",            label: "すべて" },
  { value: "zone_0_1",    label: "0 → 1" },
  { value: "zone_1_10",   label: "1 → 10" },
  { value: "zone_10_100", label: "10 → 100" },
];

const FILTER_OPTIONS = [
  { value: "",          label: "すべて" },
  { value: "published", label: "公開中" },
  { value: "hidden",    label: "非公開" },
  { value: "deleted",   label: "削除済" },
];

const SORT_OPTIONS = [
  { value: "recent",        label: "最終回答が新しい順" },
  { value: "name",          label: "氏名順" },
  { value: "publish_state", label: "公開状態順" },
];

export function MembersFilters({ value, onChange, loading }: MembersFiltersProps) {
  return (
    <form
      role="search"
      aria-label="会員検索"
      className="flex flex-wrap gap-3 rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <Input
        name="q"
        type="search"
        placeholder="氏名 / メール / 職業で検索"
        defaultValue={value.q ?? ""}
        className="w-64"
        aria-label="自由検索"
        onBlur={(e) => onChange({ q: e.currentTarget.value })}
      />
      <Select
        aria-label="UBM 区画"
        value={value.zone ?? ""}
        options={ZONE_OPTIONS}
        onChange={(v) => onChange({ zone: v })}
      />
      <Select
        aria-label="公開状態"
        value={value.filter ?? ""}
        options={FILTER_OPTIONS}
        onChange={(v) => onChange({ filter: v })}
      />
      <Select
        aria-label="並び順"
        value={value.sort ?? "recent"}
        options={SORT_OPTIONS}
        onChange={(v) => onChange({ sort: v })}
      />
      {loading ? (
        <span className="self-center text-xs text-[var(--ubm-color-text-2)]" role="status">
          更新中…
        </span>
      ) : null}
    </form>
  );
}
```

### 5.5 MembersTable

```tsx
// apps/web/src/features/admin/components/_members/MembersTable.tsx
"use client";
import type { AdminMemberListItem } from "@/lib/api/admin-types";
import { Badge } from "@/components/ui/badge";

export interface MembersTableProps {
  items: AdminMemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenRow: (id: string) => void;
  onPageChange: (page: number) => void;
}

const publishBadge = (s: AdminMemberListItem["publishState"]) => {
  if (s === "public")      return <Badge tone="success">公開</Badge>;
  if (s === "member_only") return <Badge tone="info">会員限定</Badge>;
  if (s === "hidden")      return <Badge tone="neutral">非公開</Badge>;
  return <Badge tone="neutral">{s}</Badge>;
};

export function MembersTable(props: MembersTableProps) {
  const { items, total, page, pageSize, selected, onToggleSelect, onOpenRow, onPageChange } = props;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--ubm-color-border)] text-xs uppercase text-[var(--ubm-color-text-3)]">
            <th className="w-12 p-3" scope="col" aria-label="選択" />
            <th className="p-3 text-left">氏名</th>
            <th className="p-3 text-left">メール</th>
            <th className="p-3 text-left">公開状態</th>
            <th className="p-3 text-left">最終回答</th>
            <th className="w-24 p-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-sm text-[var(--ubm-color-text-2)]">
                該当する会員はいません。
              </td>
            </tr>
          ) : (
            items.map((m) => (
              <tr
                key={m.memberId}
                className="border-b border-[var(--ubm-color-border)] last:border-b-0 hover:bg-[var(--ubm-color-bg)]"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`${m.fullName} を選択`}
                    checked={selected.has(m.memberId)}
                    onChange={() => onToggleSelect(m.memberId)}
                  />
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    className="text-left font-medium text-[var(--ubm-color-primary)] hover:underline"
                    onClick={() => onOpenRow(m.memberId)}
                  >
                    {m.fullName || "(氏名未登録)"}
                  </button>
                </td>
                <td className="p-3 font-mono text-xs">{m.responseEmail}</td>
                <td className="p-3">{publishBadge(m.publishState)}</td>
                <td className="p-3 font-mono text-xs">{m.lastSubmittedAt}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className="text-xs font-medium text-[var(--ubm-color-primary)] hover:underline"
                    onClick={() => onOpenRow(m.memberId)}
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <nav
        aria-label="ページ送り"
        className="flex items-center justify-between border-t border-[var(--ubm-color-border)] px-4 py-3 text-xs"
      >
        <span>
          {total} 件中 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} 件
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            前へ
          </button>
          <span aria-current="page">{page} / {lastPage}</span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            次へ
          </button>
        </div>
      </nav>
    </section>
  );
}
```

### 5.6 BulkActionBar

```tsx
// apps/web/src/features/admin/components/_members/BulkActionBar.tsx
"use client";
import { useState } from "react";
import { adminClient } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";

export interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  onComplete: () => void;
}

type Action = "publish" | "hide" | "soft-delete";

export function BulkActionBar({ selectedIds, onClear, onComplete }: BulkActionBarProps) {
  const [busy, setBusy] = useState<Action | null>(null);

  const run = async (action: Action) => {
    if (selectedIds.length === 0) return;
    setBusy(action);
    try {
      // 既存 endpoint に bulk が無いため、シリアル実行で吸収（adapter）。
      for (const memberId of selectedIds) {
        if (action === "publish") {
          await adminClient.updateMemberStatus(memberId, { publishState: "public" });
        } else if (action === "hide") {
          await adminClient.updateMemberStatus(memberId, { publishState: "hidden" });
        } else if (action === "soft-delete") {
          await adminClient.deleteMember(memberId);
        }
      }
      onComplete();
    } finally {
      setBusy(null);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="一括操作"
      className="flex items-center justify-between rounded-lg border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-4 py-3 text-sm"
    >
      <span>{selectedIds.length} 件を選択中</span>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={busy !== null} onClick={() => run("publish")}>
          {busy === "publish" ? "適用中…" : "公開"}
        </Button>
        <Button variant="ghost" disabled={busy !== null} onClick={() => run("hide")}>
          {busy === "hide" ? "適用中…" : "非公開"}
        </Button>
        <Button variant="danger" disabled={busy !== null} onClick={() => run("soft-delete")}>
          {busy === "soft-delete" ? "適用中…" : "論理削除"}
        </Button>
        <Button variant="ghost" onClick={onClear}>
          選択解除
        </Button>
      </div>
    </div>
  );
}
```

### 5.7 MemberDrawer

`Drawer` primitive（task-10）の上に詳細を載せる。data fetch は `/admin/members/:memberId` (= 既存 `apps/api/src/routes/admin/members.ts` の detail endpoint) と `/admin/member-notes/:memberId`。

```tsx
// apps/web/src/features/admin/components/_members/MemberDrawer.tsx
"use client";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { adminClient } from "@/lib/api/admin";
import type { AdminMemberDetailView } from "@/lib/api/admin-types";

export interface MemberDrawerProps {
  memberId: string;
  onClose: () => void;
  onMutated: () => void;
}

export function MemberDrawer({ memberId, onClose, onMutated }: MemberDrawerProps) {
  const [data, setData] = useState<AdminMemberDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    adminClient
      .getMember(memberId)
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [memberId]);

  return (
    <Drawer open onClose={onClose} ariaLabel="会員詳細">
      <header className="flex items-center justify-between border-b border-[var(--ubm-color-border)] px-6 py-4">
        <h2 className="text-base font-semibold">会員詳細</h2>
        <button type="button" onClick={onClose} aria-label="閉じる">×</button>
      </header>
      <div className="flex flex-col gap-6 px-6 py-5">
        {error ? (
          <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">{error}</p>
        ) : !data ? (
          <Skeleton className="h-72" />
        ) : (
          <>
            <section>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--ubm-color-text-3)]">
                IDENTITY
              </h3>
              <dl className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                <dt>memberId</dt><dd className="font-mono">{data.identityMemberId}</dd>
                <dt>email</dt><dd className="font-mono">{data.identityEmail}</dd>
              </dl>
            </section>
            {/* answers / notes / audit のセクションは既存 features/admin と同等 */}
          </>
        )}
      </div>
    </Drawer>
  );
}
```

---

## 6. データフロー（API response の TypeScript 表現）

### 6.1 API client

```ts
// apps/web/src/lib/api/admin.ts
import { z } from "zod";
import {
  AdminDashboardViewZ,
  AdminMemberListViewZ,
  AdminMemberDetailViewZ,
} from "@ubm-hyogo/shared";
import { AdminDashboardUiViewZ } from "./admin-types";
import { authedFetch } from "./_authed-fetch";
import { env } from "@/lib/env";

const apiBase = () => env.API_BASE_URL;

export const adminClient = {
  async dashboard() {
    const res = await authedFetch(`${apiBase()}/admin/dashboard`, { cache: "no-store" });
    if (!res.ok) throw new Error(`admin/dashboard ${res.status}`);
    const json: unknown = await res.json();
    return AdminDashboardUiViewZ.parse(json);
  },

  async listMembers(query: Record<string, string | string[] | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
      else sp.set(k, v);
    }
    const res = await authedFetch(`${apiBase()}/admin/members?${sp.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`admin/members ${res.status}`);
    return AdminMemberListViewZ.parse(await res.json());
  },

  async getMember(memberId: string) {
    const res = await authedFetch(`${apiBase()}/admin/members/${encodeURIComponent(memberId)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`admin/members/:id ${res.status}`);
    return AdminMemberDetailViewZ.parse(await res.json());
  },

  async updateMemberStatus(memberId: string, body: { publishState: "public" | "hidden" | "member_only" }) {
    const res = await authedFetch(`${apiBase()}/admin/member-status`, {
      method: "POST",
      body: JSON.stringify({ memberId, ...body }),
      headers: { "content-type": "application/json" },
    });
    if (!res.ok) throw new Error(`admin/member-status ${res.status}`);
    return z.object({ ok: z.literal(true) }).parse(await res.json());
  },

  async deleteMember(memberId: string) {
    const res = await authedFetch(`${apiBase()}/admin/member-delete`, {
      method: "POST",
      body: JSON.stringify({ memberId }),
      headers: { "content-type": "application/json" },
    });
    if (!res.ok) throw new Error(`admin/member-delete ${res.status}`);
    return z.object({ ok: z.literal(true) }).parse(await res.json());
  },
};

// Server Component から呼ぶ薄いラッパ（Suspense friendly）
export const fetchAdminDashboard = () => adminClient.dashboard();
export const fetchAdminMembers = (q: Record<string, string | string[] | undefined>) =>
  adminClient.listMembers(q);
```

### 6.2 型エイリアス

```ts
// apps/web/src/lib/api/admin-types.ts (続き)
import type {
  AdminMemberListView as SharedAdminMemberListView,
  AdminMemberListItem as SharedAdminMemberListItem,
  AdminMemberDetailView as SharedAdminMemberDetailView,
} from "@ubm-hyogo/shared";

export type AdminMemberListView = SharedAdminMemberListView;
export type AdminMemberListItem = SharedAdminMemberListItem;
export type AdminMemberDetailView = SharedAdminMemberDetailView;
```

### 6.3 サーバーサイドの auth 注入

`authedFetch` は `cookies()` から `auth.session-token` を抜き取って `Cookie` header を転送する（`apps/web/src/lib/api/_authed-fetch.ts`、task-13 で確定済み）。本 task では新規追加せず、参照のみ。

---

## 7. プロトタイプ未掲載要素の派生ルール

本 task で扱う 2 画面は以下の点でプロトタイプを補強する:

| 派生要素 | 由来 | ルール |
|---------|------|--------|
| dashboard の `RecentActions` | プロトタイプは "最近の支部会と出席"（meetings ベース） | 本実装では `audit_log` の最新 20 件（dashboard.view 除外）に置換。理由: API response (`recentActions`) が audit ベースであり、より管理用途に合致する。プロトタイプの timeline UI 構造（左 date / 右 description / 右肩 chip）を踏襲 |
| dashboard の `byZone` / `byStatus` | プロトタイプは MEMBERS から計算 | 現行 `/admin/dashboard` は `totals` のみ返す。UI 側で `byZone` / `byStatus` optional を `AdminDashboardUiViewZ` に持ち、サーバー側未提供時は placeholder メッセージを表示。**追加 endpoint を生やさない** |
| members table の `bulk action` | プロトタイプ単独 row 操作のみ | 既存 `/admin/member-status` `/admin/member-delete` をシリアル呼出する adapter を `BulkActionBar` に閉じ込め、API surface は触らない |
| members の `MemberDrawer` 内 `audit log` セクション | プロトタイプには無い | `apps/api/src/routes/admin/members.ts` detail endpoint が `audit` を含むため再利用 |
| `(admin)/layout.tsx` の grid | プロトタイプは sidebar + content の 2 カラム | 240px sidebar 固定 + content 流体。breakpoint sm 以下では sidebar を `hidden` + Drawer 化（task-10 の `Sidebar` primitive responsive variant を利用） |

すべて OKLch トークンのみを使用し、`bg-[#...]` `text-[#...]` の任意 HEX は禁止。chart の bar 色は `--ubm-color-zone-{a..e}` のみ。

---

## 8. テスト方針

### 8.1 vitest（コンポーネント）

| ファイル | 検証内容 |
|---------|---------|
| `KpiGrid.test.tsx` | 4 セルが描画される / `unresolvedSchema=0` で danger tone がつかない / `untaggedMembers>0` で warning tone がつく |
| `MembersFilters.test.tsx` | zone / filter / sort 変更で `onChange` が `{key:value}` 形式で発火 / 自由検索は `onBlur` で確定 |
| `MembersTable.test.tsx` | items=[] で empty 表示 / checkbox トグルで `onToggleSelect` が呼ばれる / row click で `onOpenRow` |
| `RecentActionsTable.test.tsx` | items=[] で「直近 7 日のアクションはありません」/ items 非空で table 行数一致 |
| `BulkActionBar.test.tsx` | selectedIds=[] で render しない / publish クリックで `adminClient.updateMemberStatus` が選択数だけ呼ばれる（mock） |

### 8.2 Playwright（task-18 で実装、本仕様は smoke 観点を提供）

| ID | ステップ | 期待 |
|----|---------|------|
| P-15-01 | admin ログイン → `/admin` 訪問 | 200、`text=管理ダッシュボード` 可視、KPI 4 枚見える |
| P-15-02 | `/admin/members` 訪問 | 200、テーブルヘッダー（氏名 / メール / 公開状態 / 最終回答）見える |
| P-15-03 | フィルタで `公開状態=公開中` 選択 | URL に `?filter=published` が反映、テーブルが再描画 |
| P-15-04 | row 1 つチェック | BulkActionBar が出現、ラベル「1 件を選択中」 |
| P-15-05 | row の氏名クリック | Drawer が右からスライドイン、`role="dialog"` 取得可 |

### 8.3 a11y（jest-axe）

- `KpiGrid` / `MembersTable` / `MembersFilters` / `RecentActionsTable` / `BulkActionBar` / `MemberDrawer` をそれぞれ `axe(container)` し violations.length=0 を assert。
- icon-only button は `aria-label` 必須（× ボタン、選択 checkbox など）。

---

## 9. ローカル実行コマンド

```bash
# 依存導入（mise exec 経由で Node 24 を確実に使う）
mise exec -- pnpm install

# 型チェック / lint / build
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/web lint
mise exec -- pnpm -F @ubm-hyogo/web build

# 単体テスト（task-15 範囲のみ）
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/features/admin/components/__tests__/KpiGrid.test.tsx \
  src/features/admin/components/__tests__/MembersTable.test.tsx \
  src/features/admin/components/__tests__/MembersFilters.test.tsx \
  src/features/admin/components/__tests__/RecentActionsTable.test.tsx

# dev server（admin にアクセス）
mise exec -- pnpm -F @ubm-hyogo/web dev
# -> http://localhost:3000/admin
# -> http://localhost:3000/admin/members?filter=published

# OKLch 検証（task-18 ジョブ単体実行）
mise exec -- pnpm verify-design-tokens

# Playwright smoke（task-18 完成後）
mise exec -- pnpm -F @ubm-hyogo/web e2e -- --grep "P-15"
```

---

## 10. Definition of Done（チェックリスト）

- [ ] D-01: `/admin` が SSR 200、KPI 4 / Zone / Status / RecentActions / SchemaAlert（条件付き）が描画
- [ ] D-02: `/admin/members` が SSR 200、テーブル + フィルタ + bulk + drawer が一通り動作
- [ ] D-03: `(admin)/layout.tsx` に `AdminSidebar` 8 nav items / `AdminPageHeader` / 2 カラム grid が確定
- [ ] D-04: `/admin/dashboard` `/admin/members` `/admin/member-status` `/admin/member-delete` を adapter 経由で接続済み（新 endpoint なし）
- [ ] D-05: `verify-design-tokens` green（HEX 直書き 0 件）
- [ ] D-06: jest-axe critical violations 0 件
- [ ] D-07: vitest テスト（§8.1 の 5 ファイル）が green
- [ ] D-08: AdminSidebar の active 表示が `/admin` `/admin/members` で正しく当たる
- [ ] D-09: `pnpm typecheck` / `pnpm lint` が green
- [ ] D-10: 既存の `apps/web/app/(admin)/admin/page.tsx` 等の旧実装が新構成に置き換わり、`apps/web/src/components/admin/` の旧 component 残骸が `task-18` の `verify-no-orphan` で警告 0
- [ ] D-11: `apps/api` 側に変更 0 行（`git diff main -- apps/api` が空）
- [ ] D-12: 8 admin 画面のうち task-15 担当 2 画面が auth gate 越え → 200 を Playwright で確認

---

## 11. 参考資料

- phase-1 §3.3 / phase-2 §1, §5.2 / phase-3 §1.2, §2.3, §3.2
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`（`AdminDashboardPage` / `AdminMembersPage`）
- `apps/api/src/routes/admin/dashboard.ts` / `members.ts` / `member-status.ts` / `member-delete.ts`
- `packages/shared/src/zod/viewmodel.ts`（`AdminDashboardViewZ` / `AdminMemberListViewZ` / `AdminMemberDetailViewZ`）
- `apps/web/src/components/layout/AdminSidebar.tsx`（task-09/10 確定済み）


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
