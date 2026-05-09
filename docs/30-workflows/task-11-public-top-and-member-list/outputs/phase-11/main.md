# Phase 11: 手動 smoke / 実測 evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

local PASS 5 点 + Playwright runtime + 主要画面 screenshot + axe critical=0 を `outputs/phase-11/evidence/` 配下に正本配置する。

## 実行タスク

- [ ] evidence canonical path に 13 種類の artifact を配置する
- [ ] runtime 未取得なら `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を明記する

## 参照資料

- Phase 9 §local PASS 5 点
- `.claude/skills/task-specification-creator/references/phase-11-guide.md`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 統合テスト連携

- Phase 9 の local PASS 5 点、Playwright smoke、screenshot、axe、coverage を同一 evidence root に保存する。
- 未実行の場合は `PENDING_RUNTIME_EVIDENCE` として記録し、PASS 単独表記にしない。

## evidence canonical path

repo root から実行し、`docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/` 配下に以下を配置する。短縮した相対 `tee` path の使用は禁止。

| file | 取得方法 |
| --- | --- |
| `typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/typecheck.log` |
| `lint.log` | `mise exec -- pnpm lint 2>&1 \| tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/lint.log` |
| `test.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test src/components/public src/lib/url src/lib/api/public 2>&1 \| tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/test.log` |
| `build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/build.log` |
| `grep-gate.log` | Phase 9 §grep gate の 7 コマンドを連結し記録 |
| `coverage.txt` | `mise exec -- pnpm --filter @ubm-hyogo/web test --coverage 2>&1 \| tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/coverage.txt` |
| `e2e.log` | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts --project=desktop-chromium 2>&1 \| tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/e2e.log` |
| `e2e-skip-count.txt` | `rg -n 'test\.describe\.skip\|test\.skip\(true\|it\.skip' apps/web/playwright/tests/public-top-and-list.spec.ts > docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/e2e-skip-count.txt; test ! -s docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/e2e-skip-count.txt` |
| `runner-version.txt` | `pnpm --filter @ubm-hyogo/web exec playwright --version` |
| `coverage/e2e/coverage-summary.json` | E2E coverage summary。total と task-touched modules の `lines.pct >= 80` |
| `playwright-report/` | Playwright HTML report ディレクトリ |
| `axe.json` | axe-core violations の JSON 出力（critical=0 確認） |
| `home-screenshot.png` | `/` 画面 screenshot（Hero + Stats + ZoneIntro + Timeline 範囲） |
| `members-comfy-screenshot.png` | `/members?density=comfy` |
| `members-list-screenshot.png` | `/members?density=list` |
| `members-empty-screenshot.png` | `/members?q=zzz_no_match_zzz` |

## 実行手順

```bash
# 1. local PASS 5 点
mise exec -- pnpm typecheck 2>&1 | tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint 2>&1 | tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/lint.log
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/public src/lib/url src/lib/api/public 2>&1 | tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/test.log
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/build.log

# 2. grep gate（Phase 9 §grep gate コマンド群を実行し log 集約）
bash -lc 'set -e
! rg -n "#[0-9a-fA-F]{3,8}" apps/web/src/components/public apps/web/app/page.tsx "apps/web/app/(public)"
! rg -n "bg-\\[#|text-\\[#" apps/web/src/components/public apps/web/app/page.tsx "apps/web/app/(public)"
! rg -n "D1Database|@cloudflare/workers-types" apps/web/src apps/web/app
! rg -n "from \"@sentry/" apps/web/src/components/public apps/web/app/page.tsx "apps/web/app/(public)"
rg -n "process\\.env\\." apps/web/src/components/public apps/web/app/page.tsx "apps/web/app/(public)" apps/web/src/lib/api | (! grep .)
! rg -n "test\\.describe\\.skip|test\\.skip\\(true|it\\.skip" apps/web/playwright/tests/public-top-and-list.spec.ts
rg -n "revalidate\\s*=\\s*60" apps/web/app/page.tsx
rg -n "revalidate\\s*=\\s*30" "apps/web/app/(public)/members/page.tsx"
' 2>&1 | tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/grep-gate.log

# 3. Playwright（local dev server 起動の上で）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts --project=desktop-chromium \
  --reporter=html,line 2>&1 \
  | tee docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/e2e.log

# 4. screenshot
# `public-top-and-list.spec.ts` が 4 PNG を evidence root に保存する。
```

## 期待 evidence

- 5 ケース（TC-E-01〜05）すべて pass
- 各画面で axe critical=0
- `<h1>` 一意 / Stats `data-stat` 4 種 / `[data-page="home"]` / `[data-page="members"]` anchor が DOM に存在
- screenshot 4 枚（home / members-comfy / members-list / members-empty）

## 状態語彙

- `outputs/phase-11/main.md` の status は次のいずれかで close-out する:
  - local PASS 5 点 + Playwright PASS + screenshot 揃い → `completed` 候補
  - local PASS のみで Playwright 未実行 → `IMPLEMENTED_LOCAL_RUNTIME_PENDING`（合算 PASS 表記禁止）
  - Spec のみ生成・実装未着手 → `spec_created`（本仕様書出力時のデフォルト）

## 完了条件

- [ ] evidence 16 種類が canonical path に配置（runtime 取得時）
- [ ] runtime 未取得なら `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 状態と再取得計画を明記
- [ ] `e2e-skip-count.txt` が 0 件
- [ ] `coverage/e2e/coverage-summary.json` の lines pct 80% 以上
- [ ] axe critical violations が 5 ケース全てで 0
