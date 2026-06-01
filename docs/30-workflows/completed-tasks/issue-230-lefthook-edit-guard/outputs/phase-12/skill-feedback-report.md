# スキルフィードバックレポート — issue-230-lefthook-edit-guard

> 3 観点固定（テンプレ改善 / ワークフロー改善 / ドキュメント改善）で記録する。改善点が無い観点は
> 「なし」と明記する。

## テンプレ改善（task-specification-creator）

本タスク特有の知見として、以下の最適化パターンを記録する。

- **AC の CI literal が技術的に観測不能な場合の写像最適化**: Issue #230 の AC-1
  「`.git/hooks/` 配下の手書き追加で **CI fail**」は、最新コードの実態では**構造的に実行不可能**で
  ある。`.git/` ディレクトリは git の管理対象外でリポジトリに含まれず、CI runner の checkout には
  local `.git/hooks/` のカスタムファイルが一切現れないため、「CI で観測する」literal 解釈は成立しない。
  これに対し、AC を**観測可能な enforcement 面へ写像**して 1 サイクルで完了させる最適化を採った:
  - local 観測面（`.git/hooks` を見られる唯一の地点）= **pre-commit guard**
  - CI 観測面 = 「`lefthook.yml` 参照スクリプトの実在 + tracked stray hook 不在 + `min_version` 健全性」
    という repo 上で観測可能な SSOT 整合
  - これは「先送り / スコープ分割」ではなく、**目的（hook 正本逸脱の検知）を維持したまま手段を
    観測可能面へ写像する CONST_007 準拠の最適化**である。テンプレに「AC の literal が物理的・構造的に
    観測不能なとき、目的を保ったまま観測可能 enforcement 面へ 1:1 写像し 1 サイクルで完了させる」
    判断パターンを `.claude/skills/task-specification-creator/references/patterns-validation-and-audit.md`
    の「観測不能 AC の enforcement 面写像」へ反映済み。
- **同一 wave で実装状態へ再分類する表現**: 仕様書作成後に同じ branch / 同じサイクルで実装差分が入った場合、
  `spec_created` の文言を残さず `implemented_local_runtime_pending` に揃える。Phase 11/12、artifact inventory、
  aiworkflow active ledger、system spec summary を同時に更新し、state の取り違えを防ぐ。

## ワークフロー改善（aiworkflow-requirements）

- **worktree 前提の guard 設計の注意点を明文化**: 本リポジトリは `.worktrees/` で並列開発するため、
  git-hook を扱う guard は `git rev-parse --git-dir` ではなく **`--git-common-dir`** で共有 hooks を
  解決しないと検知漏れ・誤検知を起こす。git-hook / `.git` 構造を扱うタスクの設計レビュー観点として
  「worktree での common-dir 解決」を `technology-devops-core.md` の Issue #230 guard 節へ反映済み。
- **implemented-local の discoverability 同期**: canonical workflow root / state / evidence boundary は
  `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / artifact inventory へ同一 wave 同期済み。

## ドキュメント改善

- `CLAUDE.md` / `lefthook-operations.md` の実運用追記は、guard script と CI script の最終 interface に
  合わせて本サイクルで完了済み。aiworkflow-requirements 側の正本導線と task-specification-creator 側の
  汎化ルールも同一 wave で反映済み。
