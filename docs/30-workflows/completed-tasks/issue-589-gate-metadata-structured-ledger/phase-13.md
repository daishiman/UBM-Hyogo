# Phase 13: PR 作成 / Base `dev` / Labels / Refs

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| Source | `outputs/phase-13/phase-13.md` |
| 区分 | リリース（PR 作成のみ。merge は user 承認後） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 5-12 の成果を 1 つの PR として `dev` base に提出し、CI status check（typecheck / lint / vitest / `verify-gate-metadata` / `verify-indexes-up-to-date`）green を確認する。merge は user 承認後。

## 実行タスク

- ブランチ同期手順を確認する。
- PR 作成コマンドを user approval 後の手順として固定する。
- PR 作成後の status check 確認手順を固定する。
- merge 前 user approval gate を明記する。
- `outputs/phase-13/phase-13.md` に未実行境界を記録する。

### 13.1 ブランチ確認 / 同期

```bash
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout feat/issue-589-gate-metadata-structured-ledger
git merge dev   # コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従い解決
```

本 PR は implemented-local の schema / validator / CI workflow / #549 backfill / Phase 12 sync をまとめて提出する。

### 13.2 PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --title "feat(governance): issue-589 gate metadata structured ledger schema + validator" \
  --label priority:low \
  --label scale:small \
  --label type:improvement \
  --body "$(cat <<'EOF'
## Summary

Issue #589（CLOSED）で起票された「Gate metadata structured ledger」を実装。
親 #549 で自由文配列だった `gateConditions[]` を、機械検証可能な `metadata.gates[]` 構造化 schema に置き換え、CLI validator と CI gate を追加した。

## Refs

- Refs: #589
- Refs: #549

## 変更内容

### 新規

- `packages/shared/src/gate-metadata/schema.ts` — zod schema (`GateEntrySchema` / `GatesArraySchema`)
- `packages/shared/src/gate-metadata/index.ts` — barrel
- `packages/shared/src/gate-metadata/__tests__/schema.test.ts` — TC-1..TC-12
- `scripts/gate-metadata/validate.ts` — CLI validator
- `scripts/gate-metadata/__tests__/walk.test.ts` — TC-13..TC-20
- `.github/workflows/verify-gate-metadata.yml` — CI gate
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` — SSOT
- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/**` — Phase 1-13 仕様書

### 編集

- `packages/shared/src/index.ts` — gate-metadata export 追加
- `package.json` — `gate-metadata:validate` script
- `docs/30-workflows/completed-tasks/issue-549-.../artifacts.json` × 2 — `gates[]` 4 件 backfill / `gateConditions` → `gateConditions_legacy`
- `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md` — gate-metadata 必須化
- `.claude/skills/aiworkflow-requirements/indexes/*` — keyword 追加 + rebuild

## Acceptance Criteria 達成

- AC-1..AC-3: TC-1..TC-12 GREEN
- AC-4..AC-5: TC-13..TC-20 GREEN
- AC-6: actionlint clean / paths trigger 設計通り
- AC-7: Issue #549 backfill 完了 / validator exit 0

## Test Plan

- [ ] CI: typecheck green
- [ ] CI: lint green
- [ ] CI: vitest green（新規 TC 含む）
- [ ] CI: `verify-gate-metadata / validate` green
- [ ] CI: `verify-indexes-up-to-date` green
- [ ] coverage Statements/Branches/Functions/Lines >= 80%

## 後続作業（user approval gate）

- branch protection の `required_status_checks.contexts` に `verify-gate-metadata / validate` を追加（merge 後）
- 親 Issue #589 / #549 の状態は CLOSED のまま据え置き（再 open しない）
- historical artifacts.json への `gates[]` 一括 backfill は初期 rollout 対象外（WARN/skip 互換を維持）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 13.3 PR 作成後のチェック

```bash
gh pr view --json number,url,state
gh pr checks --watch
```

| 期待 status check | 想定状態 |
| --- | --- |
| typecheck | success |
| lint | success |
| test | success |
| verify-gate-metadata / validate | success |
| verify-indexes-up-to-date | success |

### 13.4 user approval gate（merge 前）

| 項目 | gate |
| --- | --- |
| merge | user 明示承認後のみ実施 |
| branch protection 反映 | merge 後 user 明示承認のもと `gh api -X PUT` を実行 |
| Issue #589 / #549 の re-open | 行わない（CLOSED 据え置き） |

### 13.5 PR 本文に含める link

- Phase 12 implementation-guide.md
- Phase 11 link checklist
- Issue #589 / #549 / 起票元 unassigned-task

## 変更対象ファイル

PR 作成自体ではファイル変更なし。`outputs/phase-13/phase-13.md` に PR URL / status check 結果を追記。

## 入出力・副作用

- 入力: Phase 5-12 全成果物 + commit 群。
- 出力: GitHub PR + `outputs/phase-13/phase-13.md`。
- 副作用: GitHub Actions workflow 群が PR で発火。

## テスト方針

CI 上で全テスト green。新規追加なし。

## ローカル実行・検証コマンド

§13.1 / §13.2 / §13.3 のコマンドをすべて実行。

## 統合テスト連携

- CI `verify-gate-metadata` が本 PR で初回発火。
- CI `verify-indexes-up-to-date` が skill indexes rebuild 結果を確認。

## 多角的チェック観点（AIが判断）

- **base = dev 厳守**: CLAUDE.md「既定の PR base ブランチは `dev`」に整合。
- **labels 継承**: Issue #589 の `priority:low` / `type:improvement` を継承し `scale:small` を追加。
- **Issue 据え置き**: Issue 状態は CLOSED のまま。再 open しない。

## サブタスク管理

- ST-1: branch 同期 / dev merge
- ST-2: gh pr create
- ST-3: CI status check 確認
- ST-4: PR URL を outputs/phase-13/phase-13.md に記録
- ST-5: user approval gate 仕様明記

## 成果物

- GitHub PR + `outputs/phase-13/phase-13.md`。

## 完了条件（DoD）

- [ ] PR が `dev` base で作成済み。
- [ ] labels 3 種付与済み。
- [ ] PR 本文に `Refs: #589` / `Refs: #549` を含む。
- [ ] CI 全 status check green。
- [ ] merge 前 user approval gate が明記されている。
- [ ] Issue #589 / #549 は CLOSED のまま据え置き。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] PR URL 記録済み
- [ ] CI 全 green 確認済み

## 次Phase

なし（最終 Phase）。merge は user 承認後。

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
- Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 outputs and decisions
