# Phase 1: Inventory + AC + spec-extraction-map 確定

## メタ情報

| key | value |
|-----|-------|
| Phase | 1 |
| Phase Name | Inventory + AC + spec-extraction-map 確定 |
| 作成日 | 2026-05-14 |
| 前 Phase | なし |
| 次 Phase | 2 |
| visualEvidence | NON_VISUAL |

## 目的

`packages/contracts/` 新設 + `scripts/e2e-mock-api.mjs` 拡張 + 契約テスト追加 + e2e-tests.yml 健全化のスコープを inventory レベルで確定し、AC-1..AC-7 を本文に列挙する。aiworkflow-requirements 正本と current code anchor の対応を `outputs/phase-1/spec-extraction-map.md` に固定する。

## Step 0: P50 既実装チェック（必須）

| 対象 | 既実装の有無 | 確認コマンド | 結果 |
|------|-------------|-------------|------|
| `scripts/e2e-mock-api.mjs` | 既実装（463 行・最小） | `wc -l scripts/e2e-mock-api.mjs` | 既存 workaround の hardening 対象 |
| `packages/contracts/` | 不在 | `ls packages/` | greenfield 新設 |
| `scripts/__tests__/` | 不在 | `find scripts -name "*.spec.*"` | greenfield 新設 |
| `.github/workflows/e2e-tests.yml` mock 起動 | L42-43 既存 / readiness wait・log upload 不在 | `grep -n "e2e-mock-api\|curl\|upload-artifact" .github/workflows/e2e-tests.yml` | 既存 patch 対象 |

分類: **既存 workaround の hardening / formalize 系 follow-up タスク**。Phase 3 ラベルは `existing-hardening`（greenfield ではない）。

## 実行タスク

1. `apps/api/src/routes/**` の endpoint surface を inventory 化し、`apps/web` E2E が叩くパスを抽出
2. 各 endpoint について「現在の mock 対応」「不足項目」「正本 zod schema 出所」を表化
3. AC-1..AC-7 を本文に列挙
4. `outputs/phase-1/spec-extraction-map.md` に aiworkflow 正本 ↔ current code anchor 対応を固定
5. Phase 1-3 完了前に Phase 4 へ進まない gate を本文に明記

## 参照資料

- 元 unassigned task: `docs/30-workflows/unassigned-task/task-e2e-stage3b-mock-api-fixture-coverage-001.md`
- Lessons learned: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md`
- 現 mock 実装: `scripts/e2e-mock-api.mjs`
- 現 E2E workflow: `.github/workflows/e2e-tests.yml`
- API 実装: `apps/api/src/routes/{admin,public,me,auth,audit-correlation,internal}/`
- 既存 shared zod: `packages/shared/src/zod/`

## 実行手順

### 1. endpoint inventory（apps/api 側）

```bash
find apps/api/src/routes -name "*.ts" -not -name "*.spec.*" | xargs grep -nE "\.(get|post|patch|delete|put)\(" > /tmp/api-routes.txt
```

### 2. apps/web 側 fetch 経路 inventory

```bash
grep -rn "fetch(\|api/" apps/web/src/lib/fetch apps/web/src/lib/admin apps/web/src/app 2>/dev/null > /tmp/web-fetches.txt
```

### 3. 現 mock 対応 inventory

```bash
grep -n "pathname ===\|pathname.startsWith" scripts/e2e-mock-api.mjs > /tmp/mock-current.txt
```

### 4. inventory matrix を `outputs/phase-1/endpoint-inventory.md` に出力

| Method | API path (canonical) | apps/web 経由 | 現 mock 対応 | 正本 zod schema 出所 |
|--------|---------------------|--------------|-------------|---------------------|
| GET | `/me` | server-fetch | ✅ | 新設 `packages/contracts/src/me.mjs` |
| GET | `/me/profile` | server-fetch | ✅ | 同上 |
| POST | `/me/visibility-request` | browser-fetch | ✅ | 同上 |
| POST | `/me/delete-request` | browser-fetch | ✅ | 同上 |
| GET | `/public/stats` | server-fetch | ✅ | `packages/contracts/src/public.mjs` |
| GET | `/public/members` | server-fetch | ✅ | 同上 |
| GET | `/public/members/:id` | server-fetch | ✅ (m-1 のみ) | 同上 |
| GET | `/public/form-preview` | server-fetch | ✅ | 同上 |
| GET | `/admin/dashboard` | server-fetch | ✅ | `packages/contracts/src/admin.mjs` |
| GET | `/admin/members` | server-fetch | ✅ | 同上 |
| GET | `/admin/members/:id` | server-fetch | ✅ | 同上 |
| PATCH/POST | `/admin/members/:id` | browser-fetch | ⚠️ fallthrough | 同上 |
| GET | `/admin/tags/queue` | server-fetch | ✅ (空配列のみ) | 同上 |
| GET | `/admin/schema` / `/admin/schema/diff` | server-fetch | ✅ | 同上 |
| GET | `/admin/meetings` | server-fetch | ✅ | 同上 |
| GET | `/admin/meetings/:id` | server-fetch | ✅ | 同上 |
| POST | `/admin/meetings/:id/attendance` | browser-fetch | ✅ | 同上 |
| GET | `/admin/requests` | server-fetch | ✅ | 同上 |
| POST | `/admin/requests/:id/resolve` | browser-fetch | ✅ | 同上 |
| GET | `/admin/identity-conflicts` | server-fetch | stub（空配列のみ） | `packages/contracts/src/identity-conflicts.mjs`（contracts SSOT。shared 依存禁止） |
| POST | `/admin/identity-conflicts/:id/merge` | browser-fetch | ❌ 未対応 | 同上 |
| POST | `/admin/identity-conflicts/:id/dismiss` | browser-fetch | ❌ 未対応 | 同上 |
| GET | `/admin/audit` | server-fetch | ⚠️ 空配列 stub | `packages/contracts/src/admin.mjs` |
| GET | `/health` | mock 専用 | ✅ | 新設（contract test 用） |

### 5. acceptance criteria 列挙

- AC-1 (AC-MOCK-01): 上記 inventory 内の全 endpoint を mock が網羅。`{ok:true}` fallthrough 廃止。
- AC-2 (AC-MOCK-02): `packages/contracts/` SSOT。mock 側 `schema.parse()` 必須。parse 失敗 = HTTP 500 + body `{ zodIssues }`。
- AC-3 (AC-MOCK-03): `scripts/__tests__/e2e-mock-api.contract.spec.ts` 新設。Vitest。`.github/workflows/ci.yml` test job または root `pnpm test` 経路から実行。
- AC-4 (AC-MOCK-04): seed = member 3 / zone 2 / membership 2 / negative case / tag facet 2。`packages/contracts/src/fixtures.mjs` 集約。
- AC-5 (AC-MOCK-05): e2e-tests.yml に `curl --retry 5 --retry-delay 1 .../health` + `actions/upload-artifact@v4` (retention 7d) 追加。
- AC-6: 既存 E2E spec の green 維持。
- AC-7: typecheck / lint PASS。coverage ≥80%。`bash scripts/coverage-guard.sh` exit 0。

### 6. spec-extraction-map.md 作成

```
outputs/phase-1/spec-extraction-map.md
- 各 AC → current code anchor → 改修方針 の 3-tuple を全 AC について固定
```

## 統合テスト連携

- 後続 Phase 4 のテスト計画は本 phase の `endpoint-inventory.md` を入力とする
- contract test の対象 endpoint 数は inventory 行数と一致させる（drift gate）

## 多角的チェック観点（AI が判断）

- [ ] inventory に列挙された全 endpoint が `apps/api/src/routes/**` に実在するか（dangling 仕様の排除）
- [ ] AC-1..AC-7 がすべて measurable（grep / coverage / curl / exit code で検証可能）か
- [ ] `existing-hardening` ラベルの根拠が明示されているか
- [ ] Phase 4 開始 gate（Phase 1-3 完走）が本文と Phase 2 / Phase 3 の 3 箇所で重複明記されているか

## サブタスク管理

- なし（単一 phase 内完結）

## 成果物

- `outputs/phase-1/endpoint-inventory.md`
- `outputs/phase-1/spec-extraction-map.md`
- `outputs/phase-1/acceptance-criteria.md`（AC-1..AC-7 を再掲）

## 完了条件

- [ ] endpoint inventory が `apps/api/src/routes/**` の grep 結果と数値整合
- [ ] AC-1..AC-7 が本文と `outputs/phase-1/acceptance-criteria.md` に列挙
- [ ] spec-extraction-map に全 AC が anchor 付きで対応
- [ ] Phase 4 開始 gate が本 phase / Phase 2 / Phase 3 に重複明記
- [ ] visualEvidence = `NON_VISUAL` を `artifacts.json.metadata` で確認

## タスク100%実行確認【必須】

- [ ] Step 0 P50 チェック完了
- [ ] 実行タスク 1-5 全完了
- [ ] 成果物 3 ファイル作成済み

## 次 Phase

Phase 2: 設計（topology / validation matrix / dependency matrix / 派生ルール）
