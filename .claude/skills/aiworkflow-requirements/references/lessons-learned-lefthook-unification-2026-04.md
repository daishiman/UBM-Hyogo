# Lessons Learned — Git Hook 統一 / post-merge indexes 再生成廃止（2026-04-28）

> task-git-hooks-lefthook-and-post-merge（implementation / NON_VISUAL）の Phase 1〜12 完了に伴う苦戦箇所と再発防止知見。
> 関連正本: `references/technology-devops-core.md`（§Git hook 運用正本 L351-365）
> Wave 同期: `indexes/resource-map.md` / `indexes/quick-reference.md` / `LOGS.md` / `indexes/topic-map.md` / `indexes/keywords.json`

## 教訓一覧

### L-LH-001: post-merge での自動 indexes 再生成は「無関係 diff の発生源」となる

- **状況**: 旧 `.git/hooks/post-merge` で `aiworkflow-requirements/indexes/*.json` / `topic-map.md` を毎回再生成していたため、merge 直後に開発者の作業と無関係な generated diff が PR に混入し、レビュー混乱・誤 approve の温床となっていた。
- **原因**: 「自動化＝善」と捉え、副作用ありの再生成を hook に置いた。worktree 横断で他ブランチ作業が反映され、自分の差分と判別できなくなる。
- **教訓 / How to apply**:
  1. **副作用のある再生成は hook に乗せず、明示コマンドへ昇格**する（`pnpm indexes:rebuild` 等）。
  2. `post-merge` lane は read-only 通知のみ（例: stale worktree notice）に限定する。
  3. 「忘れて古いまま PR」リスクは CI 側の drift 検証 job で塞ぐ（`task-verify-indexes-up-to-date-ci.md`）。

### L-LH-002: lefthook を採用するなら「単一正本化」を仕様で明示する

- **状況**: Phase 2 design.md で lefthook 採用判定は行ったものの、`.git/hooks/*` の手書きを禁ずる旨と、`generate-index.js` 呼び出しを post-merge から削除する旨の仕様化が不十分で、Phase 3 design review で MINOR 指摘 M-04 として顕在化。
- **教訓 / How to apply**:
  - hook 関連の仕様書では「正本 = lefthook.yml」「派生物 = `.git/hooks/*`」を冒頭で宣言する。
  - 仕様文に「禁止事項（`.git/hooks/*` の手書きを正本化しない）」を 1 行で明記する。
  - 「自動 → 明示」への転換は、必ず痛み事例（例: 過去の無関係 diff 混入）を併記して動機を残す。

### L-LH-003: lefthook の supported hook schema を version で事前確認する

- **状況**: `post-fetch` lane を定義しようとしたが、lefthook `min_version: 1.6.0` 制約で `post-fetch` は supported hook schema 外（Phase 11 discovered-issue P0-01）。実装段階で発覚し、設計を修正。
- **教訓 / How to apply**:
  - Phase 2 設計時点で lefthook docs（https://lefthook.dev/configuration/）の supported hook 一覧を版指定（`min_version`）と突合する。
  - サポート外の hook が必要な場合は GitHub Actions / 別の明示コマンドへ責務を逃がす設計に切り替える。

### L-LH-004: branch slug と staged task-dir の整合は token overlap で動的判定する

- **状況**: `staged-task-dir-guard.sh` で「ブランチと無関係なタスクディレクトリの混入」を検出する際、固定ホワイトリスト方式だとブランチ名の揺れ（`feat/` / `feature/` / hyphen vs underscore）で誤判定が頻発した。
- **教訓 / How to apply**:
  - branch slug を「`/` 以降を hyphen 区切り token 化」して、staged path の token と overlap 判定するアルゴリズムを採る。
  - 1 token でも overlap すれば pass、0 token なら fail（意図的混入は `git commit --no-verify`）。
  - hook 失敗時の `fail_text` には bypass 手順 (`--no-verify`) と除外手順 (`git restore --staged`) を併記する。

### L-LH-005: 運用ガイドは「集約場所」と「優先順位」を仕様化する

- **状況**: post-merge 廃止に伴う周知が `CLAUDE.md` / `doc/00-getting-started-manual/lefthook-operations.md` / skill `LOGS.md` / `references/technology-devops-core.md` に分散し、開発者が「どこを見ればよいか」迷う状態を残した（skill-feedback-report.md 観点）。
- **教訓 / How to apply**:
  - 集約場所の優先順位を仕様で固定する: (1) `CLAUDE.md`（最初に開く） → (2) `doc/00-getting-started-manual/lefthook-operations.md`（運用詳細） → (3) `references/technology-devops-core.md`（システム仕様正本）。
  - skill `LOGS.md` は履歴台帳。検索性は `indexes/quick-reference.md` の早見表で担保する（本ドキュメント wave 同期の根拠）。

## 申し送り（open / baseline 未タスク）

- **C-1**（unassigned 配置済み）: CI `verify-indexes-up-to-date` job 新設 — `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md`
- **B-1**（formalize 完了 / 2026-04-28）: 既存 worktree 群への lefthook 再インストール runbook 運用化は `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook/`（spec_created）で formalize。固有教訓は `references/lessons-learned-lefthook-mwr-runbook-2026-04.md` に分離（L-MWR-001〜006）。
- **B-2**（baseline）: `husky` 不採用判断の ADR 化（リポジトリ ADR 集約化が前提）
