# SCOPE — fix-ci-cache-and-cf-token-pr795

PR #795 で残存する 2 件の CI failure を解消するためのワークフローパッケージ。

## 対象 failure

| ID         | Workflow / Job                            | 症状                                                                        | ファイル                              |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| Failure A  | `ci.yml` / `workflow-shell-lint`          | `Path Validation Error: Path(s) specified in the action for caching ...`    | `.github/workflows/ci.yml` (line 14-) |
|            |                                           |                                                                             | `.github/actions/setup-project/action.yml` |
| Failure B  | `backend-ci.yml` / `deploy-staging`       | `CLOUDFLARE_API_TOKEN environment variable` 必須エラーで wrangler が exit 1 | `.github/workflows/backend-ci.yml` (line 14-67) |

## タスク分解（並列実装可能）

- `task-01-shell-lint-cache-fix`: `actions/setup-node@v4` の `cache: pnpm` を `install` モード依存に切り替え、`install: 'false'` 時は cache を無効化する。
- `task-02-cf-api-token-staging-secret-fix`: `staging` environment の `CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING` secret が未登録 / rotation で名前変更されている可能性を排除し、`wrangler-action` 入力経路を堅牢化する。

## 不変条件

1. `.github/workflows/*.yml` の他 job (typecheck / lint / test 等) に副作用を出さない
2. `actions/setup-node@v4` 以降のメジャー固定 SHA を破壊しない
3. `wrangler-action@v3` の version 固定 (`4.85.0`) を維持する
4. Cloudflare account / secret 値は **コード/ドキュメントに転記しない**（CLAUDE.md セキュリティ規約）
5. solo dev policy: PR レビューは不要、CI gate で品質担保

## 正本順位

1. `outputs/phase-1/phase-1.md`（要件定義）
2. `outputs/phase-2/phase-2.md`（設計）
3. `outputs/phase-3/phase-3.md`（設計レビュー）
4. 各 task 配下の `index.md` / `phase-*.md`

## スコープ外（先送り禁止だが、明示的に対象外）

- `deploy-production` job (`backend-ci.yml` line 69-122): main マージ時にしか走らないため別 release タスクで検証
- 他ワークフローの cache 設定一般化: 今サイクルでは `workflow-shell-lint` の `install: 'false'` 経路のみ対象
