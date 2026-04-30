# Phase 1: 要件定義 — 成果物

## 1. 上流 wave 提供物 index

| 上流 | 提供物 | 確認 |
| --- | --- | --- |
| 04c | `GET /admin/dashboard`, `GET /admin/members[?filter]`, `GET /admin/members/:id`, `PATCH /admin/members/:id/status`, `POST/PATCH /admin/members/:id/notes[/:noteId]`, `DELETE /admin/members/:id`, `GET /admin/tags/queue[?status]`, `POST /admin/tags/queue/:queueId/resolve`, `GET /admin/schema/diff`, `POST /admin/schema/aliases`, `GET/POST /admin/meetings`, `POST/DELETE /admin/meetings/:sessionId/attendance[/:memberId]` | 全 endpoint 実装済み (`apps/api/src/routes/admin/*`) |
| 05a | `auth()` + `session.user.isAdmin` | `apps/web/src/lib/auth.ts`, `apps/web/src/lib/session.ts` |
| 05b | 未認証 redirect 経路 (`/login?gate=...`) | session 取得が null の場合に redirect |
| 00 | UI primitives: `Drawer / Switch / Modal / Toast / Field / Input / Textarea / Select / Search / KVList / Chip / Button / Segmented / LinkPills` | `apps/web/src/components/ui/` に揃う |

## 2. 5 画面 scope 表

| 画面 | data 入力 (GET) | mutation | 表示 component | scope out (持ち込まない) |
| --- | --- | --- | --- | --- |
| `/admin` | `GET /admin/dashboard` | なし | KPI カード×4 + 最近の提出 + schema 状態バッジ | 個別 member 編集、tag/schema 解消フォーム |
| `/admin/members` | `GET /admin/members[?filter]`, `GET /admin/members/:id` | `PATCH /admin/members/:id/status`, `POST/PATCH /admin/members/:id/notes`, `DELETE /admin/members/:id` | 一覧テーブル + フィルタ Segmented + MemberDrawer (status / notes / tags 導線 / editResponseUrl) | profile 本文 input、tag 直接編集、admin 管理 UI、物理削除 UI |
| `/admin/tags` | `GET /admin/tags/queue[?status]` | `POST /admin/tags/queue/:queueId/resolve` | 左 queue list + 右 review panel | tag 辞書編集、新規 tag 作成 |
| `/admin/schema` | `GET /admin/schema/diff` | `POST /admin/schema/aliases` | 4 ペイン (added/changed/removed/unresolved) + alias 割当 form | schema diff の他画面表示 |
| `/admin/meetings` | `GET /admin/meetings`, `GET /admin/members?filter=published` | `POST /admin/meetings`, `POST/DELETE /admin/meetings/:sessionId/attendance[/:memberId]` | 開催追加 form + 開催日一覧 + attendance Combobox | 削除済み会員候補化、重複 POST、attendance 直接 SQL |

## 3. 不変条件 anti-pattern

1. **#4** 違反: ドロワーに `<textarea name="businessOverview">` を出して保存ボタンを設置する → 禁止。本人本文は Form 再回答のみ
2. **#5** 違反: web から `@repo/api/repository/*` import や `cloudflare:*` import を直接行う → ESLint で禁止
3. **#11** 違反: 管理者ドロワーから profile 本文編集 endpoint (存在しない) を叩こうとする → そもそも UI 上に存在させない
4. **#12** 違反: 管理メモを `/members/[id]` の view model に乗せる → `/admin/members` ドロワーのみ
5. **#13** 違反: ドロワー内に `<input>` で tag 名を入力して即時 PATCH → 禁止。`/admin/tags?memberId=` への遷移ボタンのみ
6. **#14** 違反: ダッシュボードや members 画面に「schema 解消する」ボタンを出す → 禁止。schema は `/admin/schema` のみ
7. **#15** 違反: attendance Combobox に `isDeleted=true` 会員が混ざる、同一会員を 2 回 POST → 禁止 (UI filter + disabled + 422 toast)

## 4. AC 測定方法

| AC | 測定 |
| --- | --- |
| AC-1 | Playwright: ドロワー DOM に `[name=businessOverview]` 等の input が無いこと |
| AC-2 | Playwright: ドロワーに `[data-testid=tag-direct-edit]` が無く、`a[href^="/admin/tags?memberId="]` のみ |
| AC-3 | grep: `SchemaDiffPanel` の import が `app/admin/schema/page.tsx` のみ |
| AC-4 | unit: `attendance.filterCandidates(members)` が `isDeleted=true` を除外 |
| AC-5 | Playwright: 重複候補の Combobox option が `disabled`、422 受信時に Toast 表示 |
| AC-6 | ESLint `no-restricted-imports`: `apps/web` から `**/repository/**`, `cloudflare:*`, `wrangler` を error |
| AC-7 | Playwright: 未認証で `/admin` にアクセスして `/login` redirect |
| AC-8 | network 監視: dashboard ページで `GET /admin/dashboard` 1 リクエストのみ |
| AC-9 | grep: `admin_member_notes` 系 fetch が `/admin/members` 配下のみ |
| AC-10 | Playwright: ドロワーに `editResponseUrl` link が表示 |

## 5. 真の論点（priority 付き）

1. **[P0]** `/admin/members` ドロワーでの「タグ表示」と「タグ編集」の視覚分離: タグは Chip で表示のみ、`/admin/tags?memberId=...` への明示的な「タグキューで編集」ボタンに集約。
2. **[P0]** dashboard 1-fetch 集約: `GET /admin/dashboard` が KPI 4種 + 最近提出 + schema 状態を返すため、UI 側は他 endpoint を呼ばない。
3. **[P1]** schema dry-run 結果表示: 07b の workflow が完成するまで、`/admin/schema` は alias 割当のみ提供し dry-run UI は将来差し込み枠だけ確保。

## 6. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 管理者が処理待ちタスク（未タグ / schema 未解決）を一画面で把握 |
| 実現性 | PASS | 全 endpoint が 04c で稼働、UI primitives も揃う |
| 整合性 | PASS | 不変条件 #4/#5/#11/#12/#13/#14/#15 が UI 設計レベルで遮断される |
| 運用性 | PASS | 07a/b/c workflow に handoff 経路明示 (resolve POST / aliases POST / attendance POST) |
