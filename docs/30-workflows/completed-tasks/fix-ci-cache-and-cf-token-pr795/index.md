# fix-ci-cache-and-cf-token-pr795

PR #795 で残存する 2 件の CI failure を解消するための workflow パッケージ。

## ステータス

| Phase | 状態 | 成果物 |
| ----- | ---- | ------ |
| Phase 1 (要件定義)   | 完了 | `outputs/phase-1/phase-1.md` |
| Phase 2 (設計)       | 完了 | `outputs/phase-2/phase-2.md` |
| Phase 3 (設計レビュー) | 完了 | `outputs/phase-3/phase-3.md` |
| Phase 4-10           | 完了 | `tasks/task-01-*/phase-4..10.md`, `tasks/task-02-*/phase-4..10.md` |
| Phase 11 (NON_VISUAL evidence) | runtime_pending | `outputs/phase-11/evidence.md` |
| Phase 12 (正本同期) | 完了 | `outputs/phase-12/` strict 7 |
| Phase 13 (PR作成) | blocked | commit / push / PR user-gated |

## タスク一覧

| Task ID | タイトル | 実装区分 | 並列可 | パス |
| ------- | -------- | -------- | ------ | ---- |
| task-01 | shell-lint cache fix         | 実装仕様書 | ✅     | `tasks/task-01-shell-lint-cache-fix/` |
| task-02 | CF API token staging secret  | 実装仕様書 | ✅     | `tasks/task-02-cf-api-token-staging-secret-fix/` |

両タスクは独立しており、後続実装プロンプト1サイクルで同一 PR 内に同梱可能。

## 実装状態

`implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

実コード差分は `.github/actions/setup-project/action.yml`, `.github/workflows/ci.yml`, `.github/workflows/backend-ci.yml`, `scripts/__tests__/workflow-env-scope.test.sh` に反映済み。GitHub Actions runtime evidence、secret 存在確認、commit / push / PR は user-gated。

## 関連ドキュメント

- [SCOPE.md](./SCOPE.md)
- [outputs/phase-1/phase-1.md](./outputs/phase-1/phase-1.md)
- [outputs/phase-2/phase-2.md](./outputs/phase-2/phase-2.md)
- [outputs/phase-3/phase-3.md](./outputs/phase-3/phase-3.md)
- [outputs/phase-11/evidence.md](./outputs/phase-11/evidence.md)
- [outputs/phase-12/implementation-guide.md](./outputs/phase-12/implementation-guide.md)
- [outputs/phase-12/phase12-task-spec-compliance-check.md](./outputs/phase-12/phase12-task-spec-compliance-check.md)

## 参照する system spec

- `CLAUDE.md` §シークレット管理 / §Cloudflare 系 CLI 実行ルール
- `.github/actions/setup-project/action.yml`
- `.github/workflows/ci.yml` / `.github/workflows/backend-ci.yml`
