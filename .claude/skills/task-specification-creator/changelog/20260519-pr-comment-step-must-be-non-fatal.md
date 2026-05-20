# PR コメント投稿ステップは fail-soft にする (2026-05-19)

CI gate を含むタスク仕様書を作成する際の不変条件として、PR コメント投稿系ステップは **gate 本体を fail させない設計** を必須とする。

## 不変条件
タスク仕様書で CI workflow を新規追加する際、PR コメント投稿を含むなら以下を必ず満たすこと:

1. `permissions:` に `pull-requests: write` と `issues: write` を両方明示
2. コメント投稿ステップに `continue-on-error: true` を付ける
3. スクリプト内で try/catch し、失敗時は `core.warning` に降格

## 背景
`verify-coverage-exclude-ratio.yml` (issue-256) で、403 `Resource not accessible by integration` により measurement gate 全体が fail し、PR が blocking された。コメント投稿は副次目的（観測用）であり、measurement の成否とは独立すべき。詳細: `aiworkflow-requirements/changelog/20260519-pr-comment-step-must-be-non-fatal.md`

## 適用範囲
- 新規 CI gate workflow を含むタスク仕様書（Phase 12 / Phase 13）
- 既存 workflow の改修タスク仕様書
