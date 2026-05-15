# Implementation Guide

## Part 1: 中学生レベル概念

今までは、家の全部屋で同じ鍵を持ち歩く状態だった。今回の変更では、鍵を使う必要がある部屋だけに鍵を置く。GitHub Actions では `CLOUDFLARE_API_TOKEN` を deploy や analytics collection の step だけに渡し、install や build の step には渡さない。

| 用語 | 中学生向けの意味 | このタスクでの意味 |
|---|---|---|
| step | 作業の 1 手順 | GitHub Actions の install / build / deploy などの 1 手順 |
| token | 鍵 | Cloudflare を操作するための API 資格情報 |
| step-scoped | 必要な手順だけが鍵を持つ | deploy step だけが `CLOUDFLARE_API_TOKEN` を受け取る |
| redaction | 見せてはいけない文字を隠す | log に token や Account ID が出ていないか検査する |
| runtime pending | 実地確認待ち | staging / production の本番相当 workflow 実行はユーザー承認後に行う |

セルフチェック: install や build が鍵を持たず、deploy だけが鍵を持つ。log 検査は鍵の値を新たに表示せず、取得済み log を読むだけにする。

## Part 2: 技術詳細

- `.github/workflows/web-cd.yml` の job-level `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` を削除し、`CLOUDFLARE_API_TOKEN` は deploy step だけに限定した。
- `.github/workflows/post-release-dashboard.yml` の analytics read token も verify/collect step に限定した。
- `scripts/redaction-check.sh` は取得済み log/artifact に対する補助検査として追加した。`web-cd.yml` の deploy log 検査では `--account-id "$CLOUDFLARE_ACCOUNT_ID"` も渡す。
- `scripts/__tests__/workflow-env-scope.test.sh` が静的な主ゲートで、job-level token 再導入を検出する。

## Phase 11 Evidence

This is `NON_VISUAL`; screenshots are not required because no UI route, component, or renderer changed. Phase 11 evidence is text-based:

- `outputs/phase-11/manual-test-result.md`
- `bash scripts/__tests__/redaction-check.test.sh` -> exit 0, 12 assertions
- `bash scripts/__tests__/workflow-env-scope.test.sh` -> exit 0
- runtime staging/production deploy logs -> pending user approval

## Runtime Boundary

Remote staging/production deploy execution, old token revocation, and full OIDC migration remain user-gated. Those are not executed by this local cycle.
