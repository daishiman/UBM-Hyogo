# Phase 9: QA / local PASS 5 点セット

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 9 / 13 |
| 目的 | local PASS 5 点セットを取得し、Phase 10 final-review に必要な evidence を整える |
| 依存 | Phase 8 |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## local PASS 5 点セット

| evidence | コマンド | 保存先 |
|----------|----------|--------|
| typecheck | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-9/typecheck.log` | `outputs/phase-9/typecheck.log` |
| lint | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-9/lint.log` | `outputs/phase-9/lint.log` |
| test | `mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 \| tee outputs/phase-9/test.log` | `outputs/phase-9/test.log` |
| build | `mise exec -- pnpm build 2>&1 \| tee outputs/phase-9/build.log` | `outputs/phase-9/build.log` |
| grep-gate | Phase 8 §redaction grep gate 2 連 + exit code 記録 | `outputs/phase-9/grep-gate.log` |

## QA チェックリスト

| ID | 項目 | 判定 |
|----|------|------|
| Q-1 | 5 点セット全 GREEN | TBD |
| Q-2 | migration `0018_*` apply pending である（staging で `migrations list` 確認） | TBD |
| Q-3 | wrangler.toml に `UBM_AUDIT_APP_COLD_STORAGE` が 3 環境分存在 | TBD |
| Q-4 | GitHub Actions `audit-log-cold-storage.yml` syntax 妥当（`gh workflow view` で parse OK） | TBD |
| Q-5 | runbook `audit-log-retention-runbook.md` 6 セクション存在 | TBD |
| Q-6 | export script dry-run でローカル成功（R2 PUT skip / D1 read のみ） | TBD |

## 検証コマンド

```bash
gh workflow view audit-log-cold-storage.yml --repo daishiman/UBM-Hyogo || true
# ローカル D1 (Miniflare) で dry-run
mise exec -- pnpm tsx scripts/audit-log/export-to-r2.ts --env staging --dry-run --target-date 2026-05-17
```

## 成果物

- `outputs/phase-9/qa-checklist.md`
- `outputs/phase-9/local-pass-5-set.md`（typecheck/lint/test/build/grep-gate それぞれの exit code 0 を表で記録）
- 5 evidence .log ファイル

## 完了条件

- [ ] 5 点セット全 GREEN
- [ ] Q-1..Q-6 全 PASS

## 参照資料

- Phase 8 grep gate
- `.claude/skills/task-specification-creator/references/quality-gates.md`
