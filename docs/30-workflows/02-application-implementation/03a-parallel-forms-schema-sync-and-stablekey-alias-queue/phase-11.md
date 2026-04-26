# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | pending |

## 目的

curl / wrangler / forms.get の手動実行で sync の動作を人が確認する。evidence を outputs/phase-11/ に保存し、Wave 9a staging smoke の素材にする。

## 実行タスク

1. local dev で `POST /admin/sync/schema` を 1 度呼ぶ。
2. wrangler d1 execute で `schema_versions` / `schema_questions` / `schema_diff_queue` の row を確認。
3. 同種 job 排他（429 Conflict）を試す。
4. evidence を outputs/phase-11/manual-evidence.md に保存。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/sync-runbook.md | 手順 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 操作 |
| 参考 | outputs/phase-06/failure-cases.md | 異常系再現 |

## 実行手順

### ステップ 1: local 起動
- `pnpm --filter @ubm/api dev`
- `wrangler d1 migrations apply ubm_hyogo_staging --local`

### ステップ 2: 同期実行
- `curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer dev-admin'`
- 期待: `{ "jobId": "...", "status": "succeeded" }`

### ステップ 3: row 確認
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_questions"` → 31
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_versions"` → 1（初回）
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_diff_queue WHERE status='open'"` → 0（既知 31 項目のみのとき）

### ステップ 4: 排他確認
- 並列に 2 リクエスト
- 期待: 1 つ目 200、2 つ目 409 Conflict

### ステップ 5: evidence 保存
- 後述「manual evidence template」を outputs/phase-11/manual-evidence.md にコピー、実値を埋める。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke evidence をドキュメント changelog に反映 |
| Wave 9a | staging で同手順を実行し staging evidence を outputs に追加 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| schema 集約 | #14 | 同期後 `/admin/schema` で diff が見える |
| 排他 | sync_jobs | 409 を実機確認 |
| 無料枠 | #10 | 1 sync で D1 write 約 35 row 内 |
| stableKey 直書き禁止 | #1 | resolveStableKey 経路で 31 件解決 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local 起動 | 11 | pending | wrangler dev |
| 2 | 同期実行 | 11 | pending | curl |
| 3 | row 確認 | 11 | pending | 31 / 1 / 0 |
| 4 | 排他確認 | 11 | pending | 並列 2 req |
| 5 | evidence 保存 | 11 | pending | manual-evidence.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke サマリ |
| ドキュメント | outputs/phase-11/manual-evidence.md | curl / wrangler 出力 |
| メタ | artifacts.json | phase 11 を `completed` に更新 |

## 完了条件

- [ ] 同期成功の curl response が evidence に貼られている
- [ ] row count 3 種が evidence に貼られている
- [ ] 409 Conflict が evidence に貼られている

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] evidence に 3 種の row count
- [ ] 409 例
- [ ] artifacts.json の phase 11 が `completed`

## 次 Phase

- 次: 12（ドキュメント更新）
- 引き継ぎ事項: smoke 結果
- ブロック条件: smoke 失敗 → Phase 5 / 6 へ戻る

## manual evidence template

```markdown
# 手動 smoke evidence — 03a-parallel-forms-schema-sync-and-stablekey-alias-queue

## 実行日時
- 2026-MM-DD HH:MM JST

## 実行者
- <name>

## 1. 同期実行
```bash
curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer dev-admin'
```

response:
```json
{ "jobId": "<uuid>", "status": "succeeded" }
```

## 2. row count
```bash
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_questions"
# → 31
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_versions"
# → 1
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_diff_queue WHERE status='open'"
# → 0
```

## 3. 排他
```bash
# 並列で 2 回実行
curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer dev-admin' &
curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer dev-admin' &
```

response:
- 1 つ目: 200 succeeded
- 2 つ目: 409 Conflict

## 4. 結論
- 全項目 PASS / FAIL: PASS
- 残課題: なし
```
