# Phase 1: 要件定義

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| Implementation Mode | `new`（spec 1 ファイル新規） |
| Tier | standard |

## 1. 目的

`/admin/members` の **削除（soft delete）フロー** を E2E でカバーし、二段確認 UI・reason 必須 validation・audit 連動・3 ロール認可を 1 spec ファイルで担保する。

## 2. 前提条件

| # | 前提 | 根拠 |
|---|------|------|
| 1 | `apps/web/playwright/fixtures/auth.ts:18-66` の `adminPage` / `memberPage` / `anonymousPage` が活性化済み | Stage 1 完了 |
| 2 | `POST /admin/members/:id/delete` が実装済（`DeleteBodyZ` 必須 validation 含む） | `apps/api/src/routes/admin/member-delete.ts:44` |
| 3 | `GET /admin/audit` が実装済 | `apps/api/src/routes/admin/audit.ts:144` |
| 4 | UI route `/admin/members` が実在（既存 `admin-pages.spec.ts` smoke でカバー済） | `apps/web/app/(admin)/admin/members/` |
| 5 | cascade preview API は **未実装**。Stage 3 持越し | grep `delete-preview\|deletePreview\|cascade.*preview` → 0 件 |

## 3. 対象シナリオ（6 ケース）

| # | シナリオ | 期待挙動 | 状態 |
|---|---------|---------|------|
| 1 | 成功系: 詳細 drawer → 二段確認 → 削除（reason 入力） | drawer で reason 入力 → 200 → drawer close / `POST` body 検証 | active |
| 2 | cascade preview | API 未実装のため `test.skip()` + `// TODO(stage-3)` コメント | **skip（唯一の例外）** |
| 3 | 失敗系: reason 空 | `削除実行` disabled により API 到達 0（API 422 は backend contract 側で担保） | active |
| 4 | audit log entry 連動 | 削除成功後 `GET /admin/audit` mock で `action='admin.member.deleted'` 表示 | active |
| 5 | 認可: member は login forbidden gate | admin layout が `/login?gate=forbidden` に redirect。delete button 非表示 | active |
| 6 | 認可: anonymous は `/login` redirect | `page.url()` が `/login` を含む | active |

## 4. 受け入れ基準（観測可能な形）

| # | 基準 | 検証手段 |
|---|------|---------|
| AC1 | 5 test green + 1 skip で完了 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium` exit 0 |
| AC2 | reason 必須 validation を UI でカバーし API 到達を抑止 | spec 内 #3 に disabled assertion + route call count 0 |
| AC3 | 認可 3 ロール（admin/member/anonymous）を 3 test に分岐 | `adminPage` / `memberPage` / `anonymousPage` 出現確認 |
| AC4 | Server Component 初期 fetch は fixture gate、Client mutation は `page.route()`。spec 内 `fetch()` 直接呼び出しなし | `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` / `page.route(` ≥ 1 / `fetch(` = 0 |
| AC5 | skip は cascade preview の 1 件のみ | `test.skip` 出現 = 1, `test.fixme` = 0 |
| AC6 | 新 fixture を追加していない | `apps/web/playwright/fixtures/` に diff なし |

## 5. スコープ外

- API 側コード変更（既存 endpoint をそのまま利用）
- 新 fixture 追加
- mock helper の `apps/web/playwright/helpers/admin-mocks.ts` への抽出（Phase 8 別タスク）
- cascade preview の active test 化（Stage 3 持越し）

## 6. P50 pre-check

| 観点 | 判定 |
|------|------|
| 既存 fixture で 3 ロールをカバーできるか | OK（auth.ts:18-66） |
| 対象 endpoint 実在 | OK（`member-delete.ts:44` / `audit.ts:144`） |
| UI route 実在 | OK |
| D1 直接アクセスを避けられるか | OK（SSR fixture gate + `page.route()`） |
| spec ファイル名衝突 | なし（`apps/web/playwright/tests/` に同名なし） |
