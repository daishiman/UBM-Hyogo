# Phase 10: デプロイ手順 / CI gate 配線

## 10.1 デプロイ対象

| 対象 | 操作 |
| --- | --- |
| Cloudflare Workers | なし（本タスクは無関係） |
| D1 migrations | なし |
| GitHub Actions | `coverage-threshold-lint` workflow を追加 |
| Branch protection | required status check に追加（後続 user 承認後） |

## 10.2 CI workflow 配線手順

1. `.github/workflows/coverage-threshold-lint.yml` を Phase 6 の擬似コードに従って配置
2. PR で本 workflow が走ることを確認
3. main / dev branch protection の `required_status_checks` に `coverage-threshold-lint` を追加する PR (governance) を別途出す（**本タスクのスコープ外 / user 承認後の別 wave**）

## 10.3 リリース順序

| 段 | 操作 | 状態 |
| --- | --- | --- |
| 1 | `feat/issue-255-coverage-threshold-sync-lint` を PR で `dev` にマージ | user 承認後 |
| 2 | dev 上で `coverage-threshold-lint` job が緑になることを観測 | 自動 |
| 3 | required status check 追加 PR（別 wave） | 任意 |
| 4 | `dev → main` リリース PR で main にも届く | 通常の dev → main フローに乗る |

## 10.4 rollback target

| 対象 | 起点 |
| --- | --- |
| script | git revert で `scripts/coverage-threshold-lint.ts` 追加コミットを取り消す |
| CI workflow | `.github/workflows/coverage-threshold-lint.yml` を削除する revert PR |
| package.json | `lint:coverage-threshold` script 行を削除する revert PR |

Cloudflare runtime / D1 / secrets には触れないため runtime rollback は不要。

## 10.5 dry-run 観測手順

| 手順 | 検証 |
| --- | --- |
| PR 上で `coverage-threshold-lint` job が triggered | main / dev 宛 PR で走る |
| `quality-requirements-advanced.md` の `80` の 1 つを `70` に書き換えた dry PR | job が exit 1 / red になる |
| 元に戻した PR | job が exit 0 / green になる |
| `codecov.yml` を一時的に追加した PR | sources.length=3 で OK 行が出る |

## 10.6 観測点

| 観測 | 手段 |
| --- | --- |
| dev / main の job 履歴 | `gh run list --workflow=coverage-threshold-lint.yml --branch=dev` |
| job 内 stderr | `gh run view --log` |
| branch filter の hit miss | main / dev 以外の branch target では発火しない |

## 10.7 緊急停止

| 状態 | 手順 |
| --- | --- |
| script が他 PR をブロックして開発停止 | `.github/workflows/coverage-threshold-lint.yml` の `jobs.coverage-threshold-lint.if: false` を即時 PR で merge し、原因調査後に再 enable |
| required status check に登録済みで PR が merge できない | branch protection 設定で当該 check を一時的に外す（governance 操作 / user 承認必須） |
