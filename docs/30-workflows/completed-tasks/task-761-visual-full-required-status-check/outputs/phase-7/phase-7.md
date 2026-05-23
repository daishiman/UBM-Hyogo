[実装区分: 実装仕様書]

# Phase 7 — カバレッジ確認

| 項目 | 値 |
|------|------|
| phase | 7 |
| 名称 | カバレッジ確認 |
| status | completed |
| 完了条件 | branch protection 変更項目および対象ブランチの網羅性確認 |

## 1. 対象ブランチ網羅

| branch | 対象 | 確認 |
|--------|------|------|
| dev | YES | Phase 5 step 5 |
| main | YES | Phase 5 step 9 |
| feature/* | NO（保護対象外） | — |

## 2. context 追加網羅

| viewport | 追加 | 確認 evidence |
|----------|------|--------------|
| desktop | YES | dev-protection-after.json.md / main-protection-after.json.md |
| tablet | YES | 同 |
| mobile | YES | 同 |

## 3. 不変条件カバレッジ

Phase 6 §4 の grep が以下 5 項目を網羅:

- `required_pull_request_reviews == null`
- `enforce_admins.enabled == true`
- `lock_branch.enabled == false`
- `required_linear_history.enabled == true`
- `required_conversation_resolution.enabled == true`

## 4. シナリオ網羅

| シナリオ | 対応 Phase |
|---------|-----------|
| 正常追加 | Phase 5 |
| 重複防止（既に追加済） | Phase 2 §5, Phase 6 §3 |
| rollback | Phase 5 §3, Phase 6 §1 |
| drift 検知 | Phase 6 §2 |
| check run name 確定不能 | Phase 4 §5 |

## 5. 未カバー領域（受容）

| 領域 | 理由 |
|------|------|
| 自動 audit 化 | UT-GOV-001 系の別タスクで対応 |
| 通知（Slack 等） | 本タスクスコープ外 |
| context 名変更追従 | workflow yaml 改名時の検知は別タスク |
