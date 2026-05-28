# Phase 4 — テスト作成

> Task A（API regression）と Task B（Playwright visual）の test を **RED から書く**。コマンド suite と expected result を確定する。

---

## 1. Task A — `apps/api/src/routes/admin/requests.spec.ts`

### 1.1 ファイル状態

| 状態 | 対応 |
|------|------|
| 既存ファイルあり | 末尾に describe ブロックを追記 |
| 存在しない | 新規作成（harness は `apps/api/src/routes/admin/members.spec.ts` を参考） |

Phase 5 開始時に `ls apps/api/src/routes/admin/requests.spec.ts` で確定。

### 1.2 命名規則確認

- ファイル: `requests.spec.ts`（`*.spec.ts` — 不変条件 #8 OK）
- describe: 英語ケバブ風 or 日本語自由
- test case 関数: camelCase

### 1.3 test cases（RED 期待）

| # | 名称 | 入力 | 期待 |
|---|------|------|------|
| TC-A-01 | GET /admin/requests with admin JWT returns 200 | header `x-internal-auth` or Bearer admin JWT, query `?type=visibility_request` | `200`, body `{ ok: true, items: [], nextCursor: null, appliedFilters: { status: "pending", type: "visibility_request" } }` |
| TC-A-02 | GET /admin/requests without auth returns 401 | no header | `401` |
| TC-A-03 | GET /admin/requests with non-admin JWT returns 403 | Bearer non-admin JWT | `403` |
| TC-A-04 | GET /admin/requests with invalid type returns 400 | `?type=invalid_kind` | `400` |
| TC-A-05 | GET /admin/requests with delete_request returns 200 | `?type=delete_request` | `200`, `appliedFilters.type === "delete_request"` |
| TC-A-06 | route mount check: app dispatch includes /admin/requests | `app.fetch(new Request(".../admin/requests?..."))` | `res.status !== 404`（mount drift gate） |

### 1.4 実行コマンド

```bash
mise exec -- pnpm --filter @repo/api test -- requests
```

期待: 新規 6 ケースを含めて green。

---

## 2. Task B — `apps/web/playwright/tests/visual/admin-staging.spec.ts`

### 2.1 test case

| # | 名称 | アクション | 期待 |
|---|------|-----------|------|
| TC-B-01 | /admin/requests visibility_request 既定表示 | `goto("/admin/requests")` → wait load | `.page-head h1` テキスト = `依頼キュー`、screenshot `admin-requests-visibility-empty.png` |
| TC-B-02 | /admin/requests delete_request タブ | `goto("/admin/requests?type=delete_request")` | screenshot `admin-requests-delete-empty.png` |
| TC-B-03 | primitive 検証 | DOM | `.page-enter.stack-lg`, `.page-head`, `.card.card-pad-lg`, `.btn-row` が存在 |

### 2.2 baseline ルール

- 正本: `*-linux.png`（aiworkflow lessons L-I902-002）
- 取得経路: CI（`admin-staging-visual` project）
- `EVIDENCE_DIR` 経由で local macOS 取得時は `.tmp/evidence/` に退避（baseline 不変）

### 2.3 実行コマンド

```bash
# local（macOS）— EVIDENCE_DIR モード
EVIDENCE_DIR=.tmp/evidence/admin-requests \
  mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual tests/visual/admin-staging.spec.ts

# CI — baseline 採取
mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual tests/visual/admin-staging.spec.ts \
  --update-snapshots
```

---

## 3. RED 確認手順

1. Phase 5 実装着手前に上記 spec をすべて **fail させた状態** で commit ready にする。
2. Task A の TC-A-06 は現在 staging で 404 が出る → RED 確認になる。
3. Task B は primitive 未適用なので `.page-head` セレクタ不在 → RED 確認になる。

---

## 4. 補助 command

```bash
# Hono test harness 動作確認
mise exec -- pnpm --filter @repo/api test -- requests --reporter=verbose

# Playwright dry-run
mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual --list
```
