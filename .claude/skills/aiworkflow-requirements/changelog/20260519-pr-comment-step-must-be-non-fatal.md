# PR コメント投稿ステップは fail-soft にする (2026-05-19)

`verify-coverage-exclude-ratio.yml` の `measure` job が 403 `Resource not accessible by integration` で fail し、PR #810 の CI を blocking。

## 原因
- workflow-level `permissions: { issues: write, pull-requests: read }` を設定済みだが、`actions/github-script@v7` の `issues.createComment` 呼び出しが 403 で reject された
- レスポンスヘッダ `x-accepted-github-permissions: issues=write; pull_requests=write` から、PR (issue) コメント endpoint は `pull-requests: write` も期待する
- さらに、組織/リポジトリ設定で GITHUB_TOKEN のデフォルト書込み権限が制限されている場合、workflow-level の `permissions:` 拡張が反映されない事象が発生し得る

## 対処（採用した解）
1. `pull-requests: read` → `pull-requests: write` に格上げ
2. `actions/github-script@v7` ステップに `continue-on-error: true` を追加
3. スクリプト本体を `try/catch` で囲み、失敗時は `core.warning` で記録するのみ

これにより、観測用コメント投稿が失敗しても **ゲート本体（測定とアーティファクト upload）は green** を維持する。

## 不変条件（PR コメント系ステップ全般に適用）
- **PR コメント投稿は副次目的**。一次目的（measurement / gate 判定）を失敗させてはならない
- すべての `actions/github-script` / `peter-evans/create-or-update-comment` 等のコメント系ステップは:
  - `continue-on-error: true` を付ける、または
  - スクリプト内で try/catch して `core.warning` に降格する
- 必要 permissions は `pull-requests: write` + `issues: write` を両方付ける（API は issue endpoint 経由でも PR コメントとして書き込まれるため）

## 適用先
- `task-specification-creator` skill: タスク仕様書の CI gate 設計で同様の方針を明示するため並列 changelog を追加
- 既存 PR コメント系 workflow の点検は scope 外（必要時に別タスク化）
