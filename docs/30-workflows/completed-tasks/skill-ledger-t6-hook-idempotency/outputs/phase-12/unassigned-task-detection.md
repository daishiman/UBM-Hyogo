# unassigned-task-detection — T-6 仕様書整備で検出された未タスク

> Phase 12 必須出力（task-specification-creator 規定）。0 件でも必須出力。

## 1. 検出方針

仕様書整備の過程で次の観点から未タスクを検出する:

1. T-6 の AC-1〜AC-11 を満たすために必要だが、本ワークフローで扱っていない作業。
2. A-1 / A-2 / B-1 の境界を補強する作業。
3. CI / lint / 観測の自動化で、現状ガード不足な作業。
4. Issue #130 状態検査の自動化（hook 実装 PR の事前 gate）。

## 2. 検出された未タスク

| # | 候補タイトル | 種別 | 優先度 | 起点 | 概要 |
| --- | --- | --- | --- | --- | --- |
| U-1 | T-6 hook 実装と 4 worktree smoke 実走 | implementation | HIGH | Phase 5 / Phase 11 / Phase 12 review | `docs/30-workflows/unassigned-task/task-skill-ledger-t6-implementation.md` として正式化。hook 実装、部分 JSON リカバリ、2→4 worktree smoke 実走、Phase 11 実値更新を担当 |
| U-2 | hook 実装 PR 用の Issue #130 / #129 状態検査スクリプト CI 化 | infra / CI | MEDIUM | Phase 1 / Phase 2 / Phase 11 | T-6 の AC-5 gate（A-2 / A-1 完了の前提）を CI で機械的に検査する小スクリプトを `.github/workflows/` 配下に追加。Phase 5 着手前の事故防止に有効 |
| U-3 | 案 C（hook 廃止 + アプリ側完全静的化）の影響範囲調査 | research | LOW | Phase 3 代替案評価 | 中長期で hook 自体を廃止しスクリプト直叩き運用へ移行する案。本 PR では PASS（with notes）の base case D を採用したが、運用ノイズが増えれば再評価する |
| U-4 | 4 worktree smoke を CI で疑似再現する matrix job 化 | infra / CI | LOW | Phase 11 / D-2 | I/O 飽和を再現できないが、`unmerged=0` の最低限ガードを CI matrix で常時走らせる構想。NON_VISUAL タスクの evidence 自動化に資する |
| U-5 | `pnpm indexes:rebuild` の部分失敗を非ゼロ exit で確実に終了させる安全装置 | tooling | MEDIUM | Phase 2 / Phase 6 | 現状中断時の挙動が skill ごとに異なる可能性。`set -euo pipefail` 相当の保証を script 層で固定する |
| U-6 | `lefthook.yml` 直編集禁止を grep / pre-commit でガードする | infra / governance | LOW | CLAUDE.md hook 方針 | 直書きが偶発的に発生したら即座に検知する仕組み。任意項目だが governance 強化に資する |

## 3. 各候補の起票方針

- 起票先は `docs/30-workflows/unassigned-task/` 配下に Markdown を追加し、必要に応じて GitHub Issue 化する。
- U-1 は実装未完了を曖昧にしないため、本 PR で `docs/30-workflows/unassigned-task/task-skill-ledger-t6-implementation.md` として formalize する。
- U-2〜U-6 は本 PR では起票しない（仕様書整備のみのスコープを保つ）。
- 後続の `ai:close-task` 実行時に本ファイルから候補を起票する流れを想定。

## 4. 0 件ではない理由（説明責任）

T-6 は merge-conflict 0 化の最後のループだが、実装本体と運用負債（CI / governance / safety net）が周辺に残ることが Phase 1〜11 の検討で確認できた。0 件レポートにせず U-1〜U-6 を明示することで close-out 後のフォローアップを次の `ai:close-task` 実行に橋渡しする。
