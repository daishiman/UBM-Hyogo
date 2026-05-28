# Phase 5 — 実装

> Task A / Task B の実装計画。並列 lane で Lane-A（API）/ Lane-B1, B2（UI）/ Lane-B3（visual baseline）。詳細実装は `tasks/task-A-api-404-fix.md` と `tasks/task-B-ui-prototype-alignment.md` を参照する。

---

## 1. 実装順序

```
[並列] Lane-A: tasks/task-A-api-404-fix.md
[並列] Lane-B1: tasks/task-B-ui-prototype-alignment.md §1（page.tsx + RequestQueuePanel.tsx）
[並列] Lane-B2: tasks/task-B-ui-prototype-alignment.md §2（RequestQueueDetail.tsx + RequestConfirmDialog.tsx）
        ↓ B1/B2 完了
[直列] Lane-B3: tasks/task-B-ui-prototype-alignment.md §3（Playwright admin-staging-visual baseline）
```

---

## 2. 新規 / 修正ファイル一覧（feedback RT-03 必須記載）

### 新規

| パス | 用途 |
|------|------|
| `apps/api/src/routes/admin/requests.spec.ts`（既存 0 行ならば新規 / 既存ありなら追記） | TC-A-01〜06 |

### 修正

| パス | 内容 |
|------|------|
| `apps/web/app/(admin)/admin/requests/page.tsx` | `page-enter stack-lg` + `page-head` wrapper |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | `card / card-pad-lg / h-section / btn-row` 適用、h1 → h2 降格 |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | `card card-pad-lg` 化 + `h-card` + `btn-row` |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | `btn-row` 適用 |
| `apps/web/playwright/tests/visual/admin-staging.spec.ts` | TC-B-01〜03 追加 |
| `apps/api/src/index.ts`（条件付） | mount 順 / URL drift 修正発生時のみ |
| `apps/web/wrangler.toml`（条件付） | `INTERNAL_API_BASE_URL` drift 検出時のみ |

---

## 3. Phase 5 実行手順

### Step 1 — Lane-A 並列開始
- `tasks/task-A-api-404-fix.md` の §3 staging 切り分けを `bash scripts/cf.sh deploy` 等の手前まで実行（curl による 404 再現 / deployments list / wrangler tail）。
- 結論によって code 変更 / deploy のみ / URL fix に分岐。

### Step 2 — Lane-B1 / B2 並列開始
- `tasks/task-B-ui-prototype-alignment.md` の §1 / §2 を別 commit 候補で開発。
- typecheck / lint を都度 green に保つ。

### Step 3 — RED 確認 → GREEN
- Phase 4 で書いた spec を実行し RED → 実装で GREEN にする。

### Step 4 — Lane-B3 visual baseline
- B1/B2 完了後に admin-staging-visual で baseline 採取。

---

## 4. 実行コマンド suite

```bash
# 共通
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Lane-A 検証
mise exec -- pnpm --filter @repo/api test -- requests

# Lane-B build 確認
mise exec -- pnpm --filter web build

# Lane-B3 visual
mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual tests/visual/admin-staging.spec.ts
```

---

## 5. DoD（Phase 5 完了条件）

- [ ] TC-A-01〜06 全て green。
- [ ] TC-B-01〜03 が primitive selector を満たし baseline 採取済み。
- [ ] `pnpm typecheck` / `pnpm lint` green。
- [ ] staging で `curl /admin/requests?type=visibility_request` が 200（admin JWT 付き）。
- [ ] `git diff dev...HEAD --name-only` が §2 の一覧と一致。
- [ ] CONST_002: commit / push / PR は user 明示承認後。
