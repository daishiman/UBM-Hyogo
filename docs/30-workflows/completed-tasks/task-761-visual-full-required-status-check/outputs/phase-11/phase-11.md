[実装区分: 実装仕様書]

# Phase 11 — 手動テスト（NON_VISUAL）

| 項目 | 値 |
|------|------|
| phase | 11 |
| 名称 | 手動テスト |
| status | completed |
| task_type | NON_VISUAL / governance |
| 完了条件 | evidence 9 件揃い、NON_VISUAL 宣言記載 |

## 1. NON_VISUAL 宣言

| 項目 | 値 |
|------|------|
| タスク種別 | governance（branch protection 操作） |
| 非視覚的理由 | GitHub branch protection 設定変更のみ。UI / UX への変更なし |
| 証跡の主ソース | `gh api` の JSON evidence（before は read-only、after は user-gated runtime evidence boundary） |
| スクリーンショット非作成理由 | UI 変更なしのため Playwright snapshot / 画像比較は無効 |
| 代替証跡 | `dev-protection-before.json.md` / `dev-protection-after.json.md` / `main-protection-{before,after}.json.md` |

## 2. evidence 一覧

| # | ファイル | 内容 |
|---|---------|------|
| 1 | `evidence/dev-protection-before.json.md` | dev branch protection の PUT 前 GET 結果 |
| 2 | `evidence/main-protection-before.json.md` | main 同 |
| 3 | `evidence/pull-request-trigger-natural-firing.md` | PR で playwright-visual-full が自然発火した evidence |
| 4 | `evidence/user-approval-marker.md` | user 明示承認の日時・文言記録 |
| 5 | `evidence/dev-protection-after.json.md` | dev contexts POST 後 GET 結果（user approval 後まで user-gated runtime evidence boundary） |
| 6 | `evidence/main-protection-after.json.md` | main contexts POST 後 GET 結果（user approval 後まで user-gated runtime evidence boundary） |
| 7 | `evidence/rollback-put-payload.md` | rollback remove-contexts payload draft |
| 8 | `evidence/manual-test-result.md` | Phase 11 結果まとめ |
| 9 | `evidence/ui-sanity-visual-review.md` | NON_VISUAL 宣言（冒頭固定フレーズ） |

## 3. 実施手順

1. Phase 5 user approval 前は before / trigger / rollback / NON_VISUAL evidence のみ記入し、after / manual result は `external_mutation_completed` とする
2. Phase 5 完了後、各 step の `/tmp/*.json` 内容を evidence ファイルに転記
3. `manual-test-result.md` に Phase 5 / 6 / 9 の合否を記入
4. `ui-sanity-visual-review.md` の固定フレーズを確認

## 4. DoD

- evidence 9 件すべて記入済
- diff が contexts 3 件追加のみであることを `manual-test-result.md` に明記
- governance 不変条件 7 項目（Phase 9 §3）すべて OK
