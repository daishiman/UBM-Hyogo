---
phase: 7
title: Quality Gates
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 7 — Quality Gates

[実装区分: 実装仕様書]

## 1. local 必須 gate

| # | gate | コマンド | 期待 |
|---|---|---|---|
| L-01 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| L-02 | lint | `mise exec -- pnpm lint` | exit 0 |
| L-03 | unit (mint CLI) | `mise exec -- pnpm --filter @ubm-hyogo/web test -- playwright/scripts/__tests__/mint-staging-storage-state.spec.ts` | exit 0 / 11 case pass |
| L-04 | gate-metadata | `mise exec -- pnpm gate-metadata:validate` | exit 0 |
| L-05 | verify-phase12-compliance | `mise exec -- pnpm verify:phase12-compliance` | exit 0 |
| L-06 | indexes drift | `mise exec -- pnpm indexes:rebuild` 後の git diff 0 | clean |
| L-07 | PR pre-flight | `bash scripts/verify-pr-ready.sh` | exit 0 |
| L-08 | cookie/token 漏洩 grep | `bash scripts/lib/grep-no-auth-leak.sh`（実装済み・後述 §3） | 0 hit |

## 2. CI 必須 status check（required 候補）

| job | workflow file | 役割 |
|---|---|---|
| `web-unit / unit` | 既存 `web-ci.yml` | mint CLI unit test 含む |
| `playwright-staging-visual-authenticated / authenticated (chromium)` | 新設 `.github/workflows/playwright-staging-visual-authenticated.yml` | 認証後 baseline 取得 + diff 比較 |
| `verify-no-auth-secret-leak / grep` | 同 workflow 内 | cookie 値 / token 値の混入 0 hit |
| `verify-phase12-compliance / verify` | 既存 `verify-phase12-compliance.yml` | strict 7 outputs + canonical 9 headings |
| `verify-gate-metadata / verify` | 既存 `verify-gate-metadata.yml` | artifacts.json zod schema |
| `verify-indexes-up-to-date / verify` | 既存 `verify-indexes.yml` | indexes drift |

`dev` / `main` branch protection への required 追加は user 明示承認待ち（governance mutation）。本タスク Phase 13 で候補列挙のみ。

## 3. grep gate スクリプト（実装済み）

```bash
#!/usr/bin/env bash
# scripts/lib/grep-no-auth-leak.sh（実装済み）
set -euo pipefail
HITS=0
# 1) JWT 形式（eyJ で始まる base64url）が tracked file に存在しないこと
if git ls-files | xargs grep -l -E 'eyJ[A-Za-z0-9_-]{20,}\.' 2>/dev/null; then HITS=$((HITS+1)); fi
# 2) authjs.session-token の value が露出していないこと（name のみ言及は OK）
if git ls-files | xargs grep -nE "authjs\.session-token=[A-Za-z0-9_.-]+" 2>/dev/null; then HITS=$((HITS+1)); fi
# 3) STAGING_AUTH_SECRET の value 露出
if git ls-files | xargs grep -nE "STAGING_AUTH_SECRET=[^\"'\\s]+" 2>/dev/null; then HITS=$((HITS+1)); fi
[ "$HITS" -eq 0 ] || { echo "FAIL: auth leak detected"; exit 1; }
echo "OK: no auth leak"
```

## 4. ロールバック gate

| 条件 | アクション |
|---|---|
| visual diff > 5% かつ design 変更を含まない | `--update-snapshots` で baseline 更新 → 空コミットで required check 再トリガー |
| storageState mint fail | secrets 値を 1Password で再確認 → CI re-run |
| staging Worker 401 | `bash scripts/cf.sh d1 ...` で admin_users.active 確認 + AUTH_SECRET 一致確認 |

## 5. 不変条件遵守チェック

| 不変条件 (index.md §3) | gate |
|---|---|
| 新規 endpoint / D1 schema 0 件 | code diff scope review（Phase 13 §3 で明示） |
| OKLch トークン | `verify-design-tokens` gate |
| env 参照 `getAuthEnv()` 経由 | grep gate（`process.env.AUTH_SECRET` 0 hit） |
| storageState git 非コミット | `.gitignore` + L-08 grep |
| CLI は `scripts/cf.sh` 経由 | review |
| `*.spec.ts` のみ | lefthook `block-test-suffix` |

## 6. 参照

- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- 親 phase-07: `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-07-quality-gates.md`
