# 異常系・境界条件一覧

## FR-01 境界条件

| ケース | 期待動作 | 実装 |
|-------|---------|------|
| 存在しない member_id | null を返す | findMemberById → null |
| 空の ids 配列 | 空配列を返す | listMembersByIds → [] |
| upsert で既存 member_id | UPDATE 分岐で更新 | ON CONFLICT DO UPDATE |

## FR-02 境界条件

| ケース | 期待動作 | 実装 |
|-------|---------|------|
| 存在しない member_id | null を返す | getStatus → null |
| setDeleted で既に削除済み | 冪等に再設定 | ON CONFLICT DO UPDATE |

## FR-03 境界条件

| ケース | 期待動作 | 実装 |
|-------|---------|------|
| 存在しない response_id | null を返す | findResponseById → null |
| 現在回答なし member_id | null を返す | findCurrentResponse → null |
| pagination で offset が範囲外 | 空配列を返す | LIMIT/OFFSET |
| upsert で既存 response_id | 全フィールド更新 | ON CONFLICT DO UPDATE |

## FR-07 ビュー組み立て境界条件

| ケース | 期待動作 | 実装 |
|-------|---------|------|
| is_deleted=1 | null | buildPublicMemberProfile → null |
| public_consent != 'consented' | null | buildPublicMemberProfile → null |
| publish_state != 'public' | null | buildPublicMemberProfile → null |
| identity なし | null | identity check → null |
| status なし | null | status check → null |
| response なし | null | response check → null |
| visibility='admin' フィールド | 公開プロフィールから除外 | allowedVisibilities フィルタ |
| visibility='member' フィールド | 公開プロフィールから除外 | allowedVisibilities フィルタ |

## 非機能境界条件

| ケース | 期待動作 | 実装 |
|-------|---------|------|
| answers_json が不正な JSON | デフォルト値を使用 | try/catch でデフォルト |
| value_json が不正な JSON | null を使用 | try/catch で null |
| memberIds が空配列 | 空配列を返す | 早期 return |
