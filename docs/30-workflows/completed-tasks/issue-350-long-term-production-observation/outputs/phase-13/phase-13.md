# Phase 13 — PR 作成（多段承認ゲート）

**[実装区分: 実装仕様書]**

> **本 cycle 内では PR は作成しない**（CONST_002 / CLAUDE.md 「PR作成の完全自律フロー」はユーザー指示があった時のみ）。本仕様書はあくまで Phase 13 の手順記述である。

## 1. 承認ゲート（G1〜G4）

skill v2026.05.05-09a-A の **G1-G4 multi-stage approval gate** に従う。本タスクは production runtime に直接触れないため、G2 / G3 は **N/A** で skip し、G1 / G4 のみを通過させる。

| Gate | 内容 | 本タスクでの対応 |
| --- | --- | --- |
| G1 | コード/runbook/SSOT 反映の spec contract gate | local 検証（actionlint / shellcheck / unit test / indexes:rebuild / typecheck / lint）が PASS することで通過 |
| G2 | runtime deploy gate | **N/A**（Cloudflare deploy 不変。GitHub Actions は merge で自動配置のみ） |
| G3 | Forms sync / D1 apply gate | **N/A**（D1 / Forms 変更なし） |
| G4 | commit / push / PR 作成 gate | ユーザー明示指示後に実施。`pnpm install --force && pnpm typecheck && pnpm lint` 後に branch push → `gh pr create` |

合算承認禁止。各 gate ごとに切り出して通過記録を残す。

## 2. PR タイトル / body 雛形

```
title: docs+chore: issue-350 long-term production observation (D+7 / D+30) spec & reminder workflow

body:
## Summary
- Add D+7 / D+30 post-release observation reminder via GitHub Actions schedule
- Add observation runbook + SSOT mirror in aiworkflow-requirements
- Trace 09c Phase 12 unassigned task as consumed

## Spec
docs/30-workflows/issue-350-long-term-production-observation/

## Implementation
- .github/workflows/post-release-observation-reminder.yml
- scripts/observation/{create-reminder-issue.sh,reminder-issue-template.md,check-thresholds.md}
- scripts/observation/test/test-create-reminder-issue.sh
- docs/runbooks/post-release-long-term-observation.md
- .claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md
- .claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map}.md
- .claude/skills/aiworkflow-requirements/indexes/keywords.json

## Verification
- YAML parse / Prettier / bash syntax PASS
- unit test PASS (13 assertions)
- actionlint / shellcheck は local 未導入のため UT-350-FU-01 で CI gate 化
- pnpm indexes:rebuild PASS
- pnpm typecheck / pnpm lint PASS
- runtime evidence: PENDING_RUNTIME_EVIDENCE (post-merge `gh workflow run` で取得 — UT-350-FU-02)

## Test plan
- [ ] reviewer: actionlint をローカルで再実行し PASS 確認
- [ ] reviewer: `bash scripts/observation/test/test-create-reminder-issue.sh` 実行
- [ ] post-merge: `gh workflow run post-release-observation-reminder.yml -f release_date=<latest> -f offset_days=7` で実 issue 起票確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 3. 親 Issue 状態

Issue #350 は **CLOSED のまま**（ユーザー指示）。PR body に `Refs #350` のみ。`Closes #350` は使わない（既に CLOSED）。

## 4. CLAUDE.md PR 作成フロー準拠チェック

- [ ] `git fetch origin main` → ローカル `main` を fast-forward 同期
- [ ] 作業ブランチに main を merge（コンフリクト解消）
- [ ] `pnpm install --force` / `pnpm typecheck` / `pnpm lint` が PASS
- [ ] `git status --porcelain` 空
- [ ] `git diff main...HEAD --name-only` が想定変更ファイル一覧と整合
- [ ] スクリーンショット: NON_VISUAL のため body にセクションを作らない（CLAUDE.md PR 作成前チェック準拠）

## 5. 完了条件

- [ ] G1（local 検証）PASS
- [ ] G2 / G3 N/A 明示
- [ ] G4 通過 → PR URL を最終レポートで報告
- [ ] Phase 13 closeout 後、Phase 11 状態は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のまま（runtime evidence は UT-350-FU-02 で post-merge 補完）
