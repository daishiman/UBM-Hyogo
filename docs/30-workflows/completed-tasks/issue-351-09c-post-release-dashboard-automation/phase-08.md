# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |


## 目的

collector と workflow の責務重複を減らし、再利用可能な shell lib 境界を固定する。


## 実行タスク

- 既存本文の該当 Phase 内容を確認する。
- artifacts.json の phase status と outputs 宣言に矛盾がないことを確認する。
- 後続実装が必要な項目は user gate と evidence path を明示する。


## 参照資料

- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/index.md`
- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`


## 成果物

- `phase-08.md`
- `outputs/phase-08/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. 既存資産の再利用

| 既存 | 再利用箇所 |
| --- | --- |
| `bash scripts/cf.sh` | `cf.sh api-post` を curl 直叩きの代替として利用可能（NFR-6 への適合）。本仕様では token 注入の最薄ラッパーとしてのみ active 化 |
| `vars.CLOUDFLARE_ACCOUNT_ID` | 既存 GH variable をそのまま参照 |
| `secrets.GITHUB_TOKEN` | 既存。`GH_TOKEN` env として `gh run list` に渡す |
| `actions/checkout@v4` / `actions/setup-node@v4` / `pnpm/action-setup@v4` | 既存 workflow と同 version で固定し drift を生まない |
| `actions/upload-artifact@v4` | 既存 workflow と同 version |
| `mise` の Node 24 / pnpm 10.33.2 | 既存 `.mise.toml` を参照（runner 上は `pnpm/action-setup` で同期） |

## 2. 重複回避

| 重複候補 | 重複しないことの確認 |
| --- | --- |
| 既存 `web-cd.yml` / `backend-ci.yml` の analytics 取得 | 既存 workflow に analytics 取得は無い。本タスクが初出 |
| 既存 cron schedule | 既存 `.github/workflows/*.yml` に schedule 句なし（要確認: phase-09 §2 で grep 検証） |
| 09c `post-release-summary.md` の metric 定義 | phase-02 §4.2 の naming 一致表で参照のみ。値の上書きはしない |

## 3. 共通化対象

| 共通化候補 | 判定 |
| --- | --- |
| `_cf_graphql_post` を別 wave の analytics タスクと共有 | 現状 1 タスクのみ。先回り共通化は CONST_007 違反（YAGNI）。今回は `lib/cf-graphql.sh` 内に閉じる |
| metric 判定ロジック (`PASS/WARN/FAIL/UNKNOWN`) | `format_dashboard` 内 jq に統合済み。別 sh への抽出は単機能化を超える |
| redaction-check の grep パターン | `lib/redaction-check.sh` に集約。他 workflow から sourcing 可能な形にしておく（接尾辞 `()` 関数 + standalone 起動の両対応） |

## 4. 命名規約

| 種別 | 規約 |
| --- | --- |
| secret | `CLOUDFLARE_API_TOKEN_<purpose>_<scope>`。read-only は `_READONLY` 接尾辞必須 |
| script ファイル | `scripts/post-release-dashboard/lib/<resource>.sh`、関数名は `<verb>_<noun>` |
| metric_id | snake_case 固定（`workers_requests` / `d1_reads`） |
| artifact path | `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` |
| GitHub Actions step id | `kebab-case`（`resolve-utc-date` 等） |

## 5. アンチパターンの回避

| アンチパターン | 回避策 |
| --- | --- |
| token を一時ファイルに書き出す | curl の `-H` に直渡しのみ |
| `set +e` でエラーを握り潰す | 全 sh で `set -euo pipefail` |
| `wrangler` 直接実行 | NFR-6 で禁止。analytics は GraphQL に限定 |
| `*/n * * * *` 高頻度 cron | NFR-3。schedule 1 日 1 回固定 |
| `outputs/post-release-dashboard/` を git に commit | `.gitignore` 追加（phase-06 §4） |

## 6. 完了条件

- [x] 既存資産の再利用と重複回避が整理
- [x] 共通化判定が YAGNI 観点で妥当
- [x] 命名規約が文書化

## outputs

- `outputs/phase-08/dry-review.md`
