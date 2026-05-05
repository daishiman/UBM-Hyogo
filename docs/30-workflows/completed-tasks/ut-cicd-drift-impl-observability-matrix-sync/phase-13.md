# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 前 Phase | 12 (ドキュメント更新) |
| 状態 | pending_user_approval |
| タスク種別 | docs-only / NON_VISUAL |

## 重要警告

> **user の明示承認 (`commit して PR まで作成して` 等の明示指示) を受領した後にのみ実行**すること。Phase 11 / 12 が完了していても、user 承認なしに `git commit` / `git push` / `gh pr create` を行ってはならない。
>
> **Issue #286 はクローズ済みのまま維持**し reopen しない。本タスクは #286 のクローズアウト後に検出された SSOT 同期改修であり、新規修正は `Refs #286` で参照のみ行う（`Closes #286` は使わない）。

## 着手前提条件

| 前提 | 確認方法 |
| --- | --- |
| Phase 1-12 仕様成果物 | `outputs/phase-01`〜`outputs/phase-12` と `outputs/artifacts.json` が存在すること |
| outputs/phase-12/ 6 ファイル揃い | `ls outputs/phase-12/*.md` で 6 ファイル確認 |
| skill indexes 再生成 | Phase 13 承認後 close-out wave で実行し、drift がないこと |
| user 明示承認 | 会話ログで「PR 作成して」「commit して push して PR」等の指示を受領 |

## 手順

### Step 1: 変更確認

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-061526-wt-2
git status
git diff --stat
git diff
```

期待: 変更が `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` (Phase 5 patch) と `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/` 配下、および skill indexes (Phase 12 で再生成) に閉じていること。

### Step 2: ブランチ確認

```bash
git branch --show-current
```

期待値: `feat/issue-286-ut-cicd-drift-impl-observability-matrix-sync`

異なる場合は user に確認のうえブランチ切替を行う。

### Step 3: commit

Conventional Commits / docs scope を採用。

```bash
git add docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
git add docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/
git add .claude/skills/aiworkflow-requirements/indexes
git add .claude/skills/task-specification-creator/indexes

git commit -m "$(cat <<'EOF'
docs(observability): sync observability-matrix to 5 current workflows (#286)

- Update SSOT (observability-matrix.md) to enumerate ci.yml / backend-ci.yml /
  validate-build.yml / verify-indexes.yml / web-cd.yml
- Add 4-column mapping table (workflow file / display name / job id / required status context)
- Note Discord/Slack notification is unimplemented (current facts)
- Replace stale `docs/05a-` path references

Refs #286

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Step 4: push

```bash
git push origin feat/issue-286-ut-cicd-drift-impl-observability-matrix-sync
```

### Step 5: PR 作成

```bash
gh pr create --base main --title "docs(observability): sync observability-matrix to 5 current workflows" \
  --body "$(cat <<'EOF'
## 概要

`observability-matrix.md` (SSOT) を `.github/workflows/` 実体 5 本（`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`）と同期する docs-only 改修。

Refs #286 (closed-as-completed のため `Closes` ではなく `Refs` で参照)

## 変更点

- SSOT に 5 workflow を全件列挙（環境別観測対象表 dev / main 両方を更新）
- 4 列分離 mapping 表（workflow file / display name / job id / required status context）を新設
- Discord/Slack 通知未実装の current facts 注記を追加
- 旧 path (`docs/05a-...`) を新 path (`docs/30-workflows/completed-tasks/05a-...`) に置換

## AC 達成

- AC-1: 5 workflow 全件列挙 → 達成
- AC-2: trigger / job 構造記述 → 達成
- AC-3: Discord 通知 current facts 注記 → 達成
- AC-4: documentation-changelog 同期記録 → 達成 (Phase 12)
- AC-5: 4 列分離 mapping 表 → 達成

## 影響範囲

- docs-only / NON_VISUAL
- アプリケーションコード (`apps/api` / `apps/web`)、CI workflow 実体 (`.github/workflows/`) の変更なし
- DB schema / API contract / 認証 / セキュリティ への影響なし

## Test plan

- [x] Phase 11 manual-test-result.md の bash 検証 5 手順すべて期待値どおり
- [x] `rg` による drift 検出 0 件
- [x] `grep -iE "discord|webhook|notif"` 0 件と SSOT current facts 注記の整合
- [x] UT-GOV-001 (`required_status_checks.contexts`) 整合
- [x] CI gate 通過: ci / backend-ci / validate-build / verify-indexes / web-cd

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 6: CI gate 通過確認

```bash
gh pr checks --watch
```

確認対象 5 gate:
- `ci`
- `backend-ci`
- `validate-build`
- `verify-indexes`
- `web-cd`

すべて green になるまで監視。fail 発生時は CI ログを確認し、必要なら新規 commit で修正（`--amend` は使わず NEW commit で対応）。

## closeout

PR が merge 可能状態に達したら、以下スラッシュコマンドで完了処理を行う（user 承認後）。

- `ai:close-task` — 完了タスクのクローズアウト処理（未タスク仕様書作成 / 苦戦箇所記録 / completed ledger 移動）
- `ai:diff-to-pr` — リモート同期 / 品質検証 / PR 作成までの統合フロー（次回タスク以降の参照）

> Issue #286 は本 PR で reopen しない。closeout 内で「Refs #286 / closed-as-completed」状態を維持する記録を残す。

## 成果物

- PR URL（実行時のみ生成）
- merge 後: `docs/30-workflows/completed-tasks/` 配下への移動記録（closeout で対応）

## 完了条件

- user 明示承認を受領済み
- commit / push / PR 作成完了
- CI gate 5 件すべて green
- PR description に AC-1〜AC-5 達成記録が含まれる
- Issue #286 はクローズ済みのまま維持（reopen していない）
