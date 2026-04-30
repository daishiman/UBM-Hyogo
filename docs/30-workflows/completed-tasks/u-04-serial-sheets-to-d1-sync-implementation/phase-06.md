# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

manual / scheduled / backfill / audit GET の 4 経路に対し、Sheets API rate limit / 認証失敗 / mutex 衝突 / consent 異常 / unknown questionId / D1 transaction 失敗 / Cron 重複起動 / scheduled handler 中断などの異常系を網羅し、`sync_audit` row が必ず `success` または `failed` のいずれかで finalize されることを担保する。**TECH-M-01〜03（mutex race / 同秒取りこぼし / running 漏れ）の解決確認はここで行う。**

## 実行タスク

1. Sheets 系異常（rate limit / 認証 / schema diff）
2. mutex / 排他系異常
3. mapping / consent 異常
4. D1 transaction 異常
5. scheduled / Cron 異常
6. backfill 異常（admin 列保護）
7. audit row finalize 漏れ検証

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | I-XX 基底 |
| 必須 | outputs/phase-05/runbook.md | 正常系手順 |
| 必須 | outputs/phase-03/main.md | TECH-M-01〜04 |
| 参考 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md` | recovery flow |

## 実行手順

### ステップ 1: failure cases

| ID | 入力 | 期待動作 | sync_audit 終端 | AC / 不変条件 |
| --- | --- | --- | --- | --- |
| F-01 | Sheets API 429 連続 4 回 | backoff 3 回（500ms→2s→8s）後 fail | status='failed', failed_reason='sheets_rate_limit' | AC-12, TECH-M-03 |
| F-02 | Sheets API 500 単発 | backoff 1 回で復帰 | status='success' | AC-12 |
| F-03 | Service Account JWT 署名失敗（private_key 不正） | 起動直後に fail | running row 作成 → failed | AC-5, TECH-M-03 |
| F-04 | Sheets schema diff（未知 questionId 出現） | 該当列を `extra_fields_json` / `unmapped_question_ids_json` へ退避、success | status='success', diff_summary に unmapped 記録 | 不変条件 #1, AC-11 |
| F-05 | manual 連続 POST（mutex 衝突） | 2 回目は 409 + `error="sync_in_progress"` | 1 回目のみ row 作成 | AC-7, TECH-M-01 |
| F-06 | scheduled 起動中に manual POST | manual 409 / scheduled は継続 | scheduled row のみ | AC-7 |
| F-07 | scheduled 同秒 `submittedAt` 2 件 | 両件 upsert（`>=` + responseId 排除） | status='success', inserted=2 | TECH-M-02 |
| F-08 | mapConsent に未知値（"YES"） | "unknown" 扱い、mapping 段で正規化 | status='success', warnings あり | 不変条件 #2 |
| F-09 | publicConsent / rulesConsent 列名揺れ（"Public Consent"） | aliases に登録あれば正規化、なければ unmapped | status='success' | 不変条件 #2 |
| F-10 | D1 batch 中の statement 1 件失敗 | 全 rollback、failRun | status='failed', failed_reason='d1_batch_failed' | AC-5, AC-6 |
| F-11 | backfill 中に admin 列を SET しようとするコード変更 | ESLint / unit test で阻止 | （test 段階で fail） | 不変条件 #4, AC-4 |
| F-12 | scheduled handler 内で uncaught exception | `try/finally` で `failRun` 実行 | status='failed' | TECH-M-03, AC-5 |
| F-13 | mutex 取得失敗時の audit row | `acquired=false` で row 作成しない（startRun 仕様） | row 0 件 | AC-7 |
| F-14 | `audit.ts` の `failRun` 呼び出し漏れ（withSyncMutex バイパス） | code review / static check で阻止 | （review 段階で fail） | TECH-M-03 |
| F-15 | Cron 二重起動（直前実行が >1h） | mutex で 2 回目 skip | scheduled row 1 件 | AC-7 |
| F-16 | Sheets API 認証 token 期限切れ（1h） | 各 invocation で再発行（cache しない） | status='success' | Q3 |
| F-17 | backfill 中に CPU time 50ms 超過の兆候 | D1 batch サイズ実測、超過時は分割 batch 設計に切替 | （Phase 5 実測で判断） | Q2 |
| F-18 | Sheets row が 0 件（空シート） | `inserted=0, updated=0, skipped=0` で success | status='success' | AC-5 |
| F-19 | response_email 重複（同一 email で異なる responseId） | `member_identities` 上書き、`member_responses` は両 row | status='success' | データ契約 |
| F-20 | normalizeEmail で空文字 | row skip + warnings | status='success', skipped+1 | 不変条件 #3 |

### ステップ 2: TECH-M 解決確認

| ID | 検証 case | 解決確認 |
| --- | --- | --- |
| TECH-M-01 | F-05 / F-06 / F-15 | mutex が manual / scheduled / Cron 全面で機能 |
| TECH-M-02 | F-07 | `>=` + responseId upsert で取りこぼしなし |
| TECH-M-03 | F-01 / F-03 / F-10 / F-12 / F-14 | 全 fail 経路で sync_audit が finalize |
| TECH-M-04 | （Phase 12 で再評価） | shared 化判断は YAGNI 維持を確認 |

### ステップ 3: audit row finalize 全網羅

`withSyncMutex` を経由しない sync コードを禁止する。確認手順:

| # | 手順 | 期待 |
| --- | --- | --- |
| A-01 | `grep -rE "fetchSheetRows\|upsertResponses" apps/api/src/sync/` で呼出元を列挙 | manual / scheduled / backfill 3 経路のみ |
| A-02 | 各経路が `withSyncMutex` または `startRun` で audit row を作っているか | 3 経路すべて該当 |
| A-03 | `withSyncMutex` の `try/catch` が `failRun` を呼ぶか | コードレビューで確認 |

### ステップ 4: backfill admin 列保護検証

| # | 手順 | 期待 |
| --- | --- | --- |
| B-01 | backfill 前に `SELECT response_email, publish_state, is_deleted FROM member_status` をスナップショット | 値 X |
| B-02 | `POST /admin/sync/backfill` 実行 | success |
| B-03 | 同 SELECT を再実行 | 値 X と完全一致（diff 0） |
| B-04 | `member_status.public_consent` / `rules_consent` のみ Sheets 値で上書き | 上書き確認 |

### ステップ 5: 異常系の `sync_audit` ログ要件

すべての failed row が以下を含むこと:

- `audit_id`（UUID）
- `trigger`（manual / scheduled / backfill）
- `started_at` / `finished_at`（ISO8601）
- `failed_reason`（snake_case の固定 enum: `sheets_rate_limit` / `sheets_auth_failed` / `d1_batch_failed` / `mapping_error` / `unknown_error`）

`failed_reason` の固定 enum リストを `outputs/phase-06/main.md` に列挙し、Phase 9 / 09b の監視タグに利用する。

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-XX を AC × test ID に組み込む |
| Phase 9 | failed_reason enum を品質メトリクスへ |
| 下流 09b | failed_reason / mutex skip カウントを監視ベースライン化 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| 異常系網羅率 | 80%+ | TBD |
| TECH-M 解決確認 | 100% | TBD |
| audit finalize 漏れ | 0 件 | TBD |

## 多角的チェック観点

- 不変条件 #1: F-04 で未知 questionId を `extra_fields_json` に退避（コード固定化阻止）
- 不変条件 #2: F-08 / F-09 で consent 表記揺れに耐性
- 不変条件 #3: F-20 で空 email の skip
- 不変条件 #4: F-11 / B-01〜B-04 で admin 列保護
- 不変条件 #5: 全 case で sync コードが apps/api 内のみ
- 不変条件 #6: F-03 で fetch ベース JWT 失敗時の挙動を確認、googleapis 復活なし
- 不変条件 #7: F-10 後の recovery で次回 backfill / scheduled が Sheets を真として再走行
- 認可境界: F-05 は `requireSyncAdmin` 通過後の mutex 衝突、F-06 で外部公開なしを再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Sheets 系異常（F-01〜F-04, F-16, F-18） | 6 | pending | rate limit / 認証 / schema diff |
| 2 | mutex / 排他系（F-05, F-06, F-13, F-15） | 6 | pending | TECH-M-01 |
| 3 | mapping / consent 異常（F-04, F-07〜F-09, F-19, F-20） | 6 | pending | 不変条件 #1〜#3 |
| 4 | D1 transaction 異常（F-10, F-17） | 6 | pending | batch / CPU |
| 5 | scheduled / Cron 異常（F-12, F-15） | 6 | pending | running 漏れ |
| 6 | backfill admin 列保護（F-11, B-01〜B-04） | 6 | pending | 不変条件 #4 |
| 7 | audit finalize 全網羅（A-01〜A-03, F-14） | 6 | pending | TECH-M-03 |
| 8 | failed_reason enum 列挙 | 6 | pending | 監視タグ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases + 対策 + failed_reason enum |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] F-01〜F-20 が網羅
- [ ] 各 case に期待動作 / `sync_audit` 終端 / 関連 AC が明記
- [ ] TECH-M-01 / TECH-M-02 / TECH-M-03 が解決確認
- [ ] backfill が admin 列に touch しないことを B-01〜B-04 で証明
- [ ] `failed_reason` の固定 enum が列挙されている
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 8 サブタスクが completed
- outputs/phase-06/main.md 配置
- 不変条件 #1〜#7 への対応が明記
- 次 Phase へ failure ID を引継ぎ
- artifacts.json の phase 6 を completed に更新

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: F-01〜F-20 を AC × test ID と紐付け
- ブロック条件: TECH-M-01〜03 の解決確認が未完 / audit finalize 漏れがあれば進まない
