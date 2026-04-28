# system spec 更新差分の要約 — forms-schema-sync-and-stablekey-alias-queue

## 1. 結論

**specs/ への変更: あり**。`POST /admin/sync/schema`、schema sync cron、Google Forms service account env、`schema_diff_queue.type='unresolved'` を正本仕様へ同期した。

## 2. 参照した spec ファイルと整合性チェック結果

| spec ファイル | 反映箇所 | 整合性 | 備考 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references-hyogo-hyogo/api-endpoints.md` | `POST /admin/sync/schema` | OK | 200 / 401 / 403 / 409 / 500 contract を追加 |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | D1 schema sync contract | OK | `unresolved` diff type と `unknown_field_count` を追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Workers cron | OK | `0 18 * * *` UTC = 03:00 JST を schema sync として明記 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | env / secrets | OK | `GOOGLE_FORM_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` を追加 |

## 3. 不変条件への適合

| # | 不変条件 | 適合状況 |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | OK（resolveStableKey + alias 経由） |
| 5 | D1 への直接アクセスは apps/api に閉じる | OK（sync は apps/api/src/sync/schema 配下のみ） |
| 6 | GAS prototype を本番仕様に昇格させない | OK（Forms API 直叩き、GAS 経由なし） |
| 7 | responseId と memberId を混同しない | OK（本タスクは responseId に触れない） |
| 10 | Cloudflare 無料枠 | OK（1 日 1 回 cron、retry なし） |
| 14 | schema 変更は `/admin/schema` に集約 | OK（diff_queue 起点を本タスクが提供） |

## 4. 後続タスクで spec 追記が必要になりうる項目

| 項目 | 追記候補先 | 必要性 |
| --- | --- | --- |
| `schema_aliases` テーブル DDL | 07b alias workflow | 必須（未タスク化済み） |
| stableKey 直書き禁止の lint rule | wave 8b lint config | 要追加（AC-7 静的検証） |

## 5. spec 変更を行わなかった理由

- 実装後レビューで「変更なし」判定は不十分と判明したため、正本仕様へ最小差分を追記した。
- 詳細な運用手順は `outputs/phase-12/implementation-guide.md` に残し、正本仕様には契約・env・cron・D1意味論だけを置く。
