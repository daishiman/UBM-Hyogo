# Phase 2: branch protection / Environments 設計

## 設計方針

ランブック (`01a/phase-05/repository-settings-runbook.md`) の設定値をそのまま採用し、`gh api PUT` で適用する。Environments は既存設定が runbook と一致しているため新規作成不要、検証のみ。

## main branch protection

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| `required_status_checks.strict` | `true` | 最新 base に対する rebase 後のみマージ可（main は厳格） |
| `required_status_checks.contexts` | `["ci", "Validate Build"]` | UT-05 が公開する 2 つの context |
| `enforce_admins` | `false` | 個人開発の admin override 経路を残す |
| `required_pull_request_reviews.required_approving_review_count` | `0` | 個人開発・承認不要 |
| `required_pull_request_reviews.dismiss_stale_reviews` | `false` | 承認不要のため意味なし |
| `required_pull_request_reviews.require_code_owner_reviews` | `false` | code owners 強制不採用 |
| `restrictions` | `null` | push 制限なし（admin が自由に push 可） |
| `allow_force_pushes` | `false` | 履歴改竄禁止 |
| `allow_deletions` | `false` | branch 削除禁止 |

## dev branch protection

main との差分のみ記述。

| 項目 | 値 | main との差分 |
| --- | --- | --- |
| `required_status_checks.strict` | `false` | dev は staging で頻繁に push されるため非厳格 |
| その他 | main と同一 | — |

## Environments 設計

| Env | deployment_branch_policy | branch policy | required_reviewers |
| --- | --- | --- | --- |
| production | `{protected_branches: false, custom_branch_policies: true}` | `main` のみ | 0 |
| staging | `{protected_branches: false, custom_branch_policies: true}` | `dev` のみ | 0 |

## 設計判断ポイント

1. **`strict: true` を main のみに適用**: main は base-of-truth で base 古いままの merge を防ぎたい。dev は merge 待ちの混雑を避けるため非厳格。
2. **`enforce_admins: false`**: 個人開発の admin（自分）が緊急修正できなくなるリスクを回避。
3. **`required_approving_review_count: 0`**: 個人開発で自分自身を承認者にできない仕様回避。
4. **`require_last_push_approval` 未指定**: API のデフォルト `false` を採用。
5. **`required_conversation_resolution`**: API デフォルト動作に委ねる（未明示指定）。

## 適用順序

1. before snapshot（main / dev / environments）
2. main protection PUT
3. dev protection PUT
4. environments は既存確認のみ（policy 適合済）
5. after snapshot
6. sanity check（runbook §7）
