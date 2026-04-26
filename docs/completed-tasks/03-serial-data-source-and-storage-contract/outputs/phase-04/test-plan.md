# Phase 4 / test-plan.md

Sheets→D1 一方向 sync の事前検証用テスト計画。NON_VISUAL（CLI / curl / SQL ベース）。

## 1. テストカテゴリ

| ID | カテゴリ | 検証対象 | 不変条件 |
| --- | --- | --- | --- |
| C1 | 接続性 | Sheets API / D1 binding | 5 |
| C2 | mapping | Sheets 1 row → D1 row | 2, 3, 4 |
| C3 | 冪等性 | responseId 重複投入 | AC-1 / AC-4 |
| C4 | 異常系 | rate limit / tx fail / partial / drift | AC-4 |

## 2. fixture（mapping 単体）

### F-01 通常 row（consent 両方 yes）

```
responseId        = "RID-0001"
publicConsent     = "公開する"
rulesConsent      = "同意する"
responseEmail     = "system-set@example.org"  # system field（form 入力外）
displayName       = "山田太郎"
```

期待 D1 row:

```sql
INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES ('RID-0001', 1, 1, 'system-set@example.org', '山田太郎', '<json>', '<sync_ts>');
```

### F-02 consent no（公開拒否）

| Sheets | 期待 D1 |
| --- | --- |
| publicConsent="公開しない" | public_consent=0 |
| rulesConsent="同意する" | rules_consent=1 |

### F-03 responseEmail 欠損

- form 側にはそもそも該当項目なし → system field として `responseEmail = NULL` を許容（不変条件 3）
- mapping は `null` で D1 に投入。

### F-04 admin_* 列混入確認

- Sheets 側に admin_* 列が来ない（不変条件 4）
- D1 `member_status.publish_state` / `is_deleted` / `hidden_reason` への admin update は sync 経路では起きない（admin UI 経由のみ）。

### F-05 schema drift（未知列追加）

- Sheets に `extra_col` が増える → mapping は無視し audit 警告 reason='SCHEMA_DRIFT_IGNORED'。

## 3. 冪等性ケース

| ID | 操作 | 期待 |
| --- | --- | --- |
| I-01 | F-01 を 1 回 insert | `select count(*) where response_id='RID-0001'` → 1 |
| I-02 | F-01 を再投入 | UPSERT 動作で 1 のまま |
| I-03 | backfill (truncate-and-reload) で F-01〜F-10 → 再 backfill | 件数 = source 件数 |

## 4. 異常系ケース

| ID | 異常 | 期待 |
| --- | --- | --- |
| E-01 | Sheets 429 | exp backoff 1s/2s/4s, 最大 3 回 → 失敗で reason='SHEETS_RATE_LIMIT' |
| E-02 | Sheets 5xx | 同上 → reason='SHEETS_5XX' |
| E-03 | service account 401 | 即停止 reason='SHEETS_AUTH' |
| E-04 | D1 batch insert 部分失敗 | 全件 rollback / reason='D1_TX_FAIL' |
| E-05 | mapping 不整合 | row skip + reason='MAPPING_INVALID' |
| E-06 | backfill 中断 | resume_from で再開 |
| E-07 | schema drift | 既知列のみ反映 reason='SCHEMA_DRIFT_IGNORED' |

## 5. 不変条件チェック観点

- 不変条件 2: consent キーが `public_consent` / `rules_consent` のみであること
- 不変条件 3: responseEmail は system field 列に入る
- 不変条件 4: admin-managed columns は sync 対象の `member_responses` ではなく `member_status` / 後続 admin tables 側
- 不変条件 5: 検証は apps/api 経由（apps/web から D1 直接 SQL を発行しない）
- 不変条件 7: 本人更新は Form 再回答経由（D1 直接 UPDATE を sync 経路から行わない）

## 6. PASS 条件

- 全 fixture が期待 D1 row と一致
- I-01〜I-03 が件数一致
- 異常系 E-01〜E-07 で audit reason が enum に一致
