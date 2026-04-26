# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 5（実装ランブック） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | pending |

## 目的

401 / 403 / 404 / 422 / 5xx / sync 失敗 / 部分失敗 / 二重起動 / quota 超過 / stableKey 取りこぼし 等の failure case を網羅し、検証手順と期待挙動を固定する。

## 実行タスク

1. failure case を 12 ケース以上列挙し、検出手段 / 期待挙動 / runbook 追記を整理する。
2. Phase 3 のリスク登録（R-1〜R-6）と対応付ける。
3. sync_jobs のエラー記録形を確定する（error code / message / payload）。
4. Forms API quota / 5xx / network timeout の retry 戦略を明文化する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-03/main.md | リスク登録 |
| 必須 | outputs/phase-04/main.md | test 戦略 |
| 必須 | outputs/phase-05/main.md | runbook |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | sync 運用方針 |

## 実行手順

### ステップ 1: failure case 列挙
- 後述「failure cases」を参照、outputs/phase-06/failure-cases.md に独立保存。

### ステップ 2: リスク → case 対応
- R-1（quota） → FC-7
- R-2（鍵漏洩） → FC-2
- R-3（同時実行） → FC-6
- R-4（二重 upsert） → FC-9
- R-5（stableKey 取りこぼし） → FC-10
- R-6（unresolved 漏れ） → FC-11

### ステップ 3: error 形確定
- `sync_jobs.error` 列に `{ code: string, message: string, payload?: object }` の JSON 文字列で保存。

### ステップ 4: retry 戦略
- Forms API 5xx / 429: 3 回まで exponential backoff（1s / 2s / 4s）、最終失敗で `failed`
- network timeout（10s）: retry 1 回まで
- D1 write 失敗: 即時 failed、cron 次回で再試行（job 内 retry なし）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case が AC matrix に出現すること |
| Phase 9 | 無料枠と secret hygiene チェックに反映 |
| Phase 11 | 手動 smoke で failure case の一部を再現 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| schema 集約 | #14 | unresolved の漏れは admin 側で見える化 |
| 無料枠 | #10 | retry の上限を厳格に |
| 排他 | sync_jobs | FC-6 で同時実行 reject |
| stableKey 直書き禁止 | #1 | FC-10 を unit test で検出 |
| GAS 排除 | #6 | failure 時に GAS 経由 fallback を作らない |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 列挙 | 6 | pending | 12+ 件 |
| 2 | リスク対応付け | 6 | pending | R-1〜R-6 |
| 3 | sync_jobs error 形 | 6 | pending | JSON 構造 |
| 4 | retry 戦略 | 6 | pending | exponential backoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | サマリ |
| ドキュメント | outputs/phase-06/failure-cases.md | failure cases 表 |
| メタ | artifacts.json | phase 6 を `completed` に更新 |

## 完了条件

- [ ] failure case 12 件以上
- [ ] リスク登録 6 件すべて case にマップ
- [ ] error 形が JSON で固定
- [ ] retry 戦略が無料枠と整合

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] failure-cases.md に 12 行以上
- [ ] R-1〜R-6 すべて mapping 済み
- [ ] retry 戦略が cron schedule と矛盾しない
- [ ] artifacts.json の phase 6 が `completed`

## 次 Phase

- 次: 7（AC マトリクス）
- 引き継ぎ事項: failure case → AC への影響、追加 AC が条件を満たす場合は Phase 7 で吸収
- ブロック条件: failure case が 12 件未満、retry 戦略未定

## failure cases

| ID | ケース | 検出手段 | 期待挙動 | HTTP | sync_jobs.status |
| --- | --- | --- | --- | --- | --- |
| FC-1 | 未ログインで `POST /admin/sync/schema` | authz unit | 401 | 401 | - |
| FC-2 | 一般会員から呼び出し（admin_users 未登録） | authz unit | 403 | 403 | - |
| FC-3 | サービスアカウント鍵不正 | runSchemaSync 例外 | failed + error.code='AUTH_FAIL' | 500 | failed |
| FC-4 | Forms API 401（鍵失効） | googleFormsClient 例外 | failed + error.code='FORMS_AUTH' | 502 | failed |
| FC-5 | Forms API 5xx | retry 3 回 → failed | retry 後 failed | 502 | failed |
| FC-6 | 同種 job 既に running | sync_jobs lock | 409 Conflict | 409 | - |
| FC-7 | Forms API 429 quota | retry 3 回 → failed | failed + error.code='QUOTA' | 502 | failed |
| FC-8 | section count != 6 | runSchemaSync assertion | failed + error.code='SECTION_MISMATCH' | 500 | failed |
| FC-9 | 同 revisionId 再実行 | upsert no-op | succeeded（差分 0） | 200 | succeeded |
| FC-10 | 既知 stableKey の取りこぼし | unit test (resolve) | unit test 落ちる | - | - |
| FC-11 | 不明 question を queue 投入忘れ | diff queue 件数検査 | failed + error.code='QUEUE_MISS' | 500 | failed |
| FC-12 | item count != 31 | runSchemaSync assertion | failed + error.code='ITEM_MISMATCH' | 500 | failed |
| FC-13 | D1 write timeout | catch 例外 | failed + error.code='DB_TIMEOUT' | 500 | failed |
| FC-14 | Forms API timeout 10s | retry 1 回 → failed | failed + error.code='FORMS_TIMEOUT' | 502 | failed |
| FC-15 | unresolved の status='open' を再度 enqueue | upsertOpen で no-op | 0 件追加（重複なし） | 200 | succeeded |

## sync_jobs.error 構造

```json
{
  "code": "FORMS_AUTH",
  "message": "Google Forms API returned 401",
  "payload": { "formId": "119ec...", "attempt": 1 }
}
```

## retry 戦略

| 層 | 回数 | 間隔 | 失敗後 |
| --- | --- | --- | --- |
| Forms API 5xx / 429 | 3 | 1s / 2s / 4s | failed → 次 cron で再試行 |
| Forms API timeout | 1 | - | failed → 次 cron |
| D1 write 失敗 | 0 | - | 即 failed |
| ledger 書き込み失敗 | 1 | 200ms | 失敗時は console.error のみ（job 自体は完了扱い） |
