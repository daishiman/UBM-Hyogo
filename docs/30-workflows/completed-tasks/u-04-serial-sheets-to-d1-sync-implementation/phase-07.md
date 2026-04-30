# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (品質保証) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

AC-1〜AC-12 と Phase 4 test ID（U-A / U-M / C-D / C-F / I / S）、Phase 5 runbook step、Phase 6 failure case（F / B / A）、Phase 3 TECH-M-01〜04 を一対多で紐付け、未トレース 0 を確認する。NON_VISUAL タスクのため evidence は **local dev ログ + `scripts/cf.sh d1 execute` 結果 JSON** を最終証拠とする。

## 実行タスク

1. AC × test ID × runbook × failure × TECH-M の対応表
2. 未トレース AC 検出
3. 重複 / 漏れ排除
4. NON_VISUAL evidence 形式の確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-05/runbook.md | runbook step |
| 必須 | outputs/phase-06/main.md | failure case |
| 必須 | outputs/phase-03/main.md | TECH-M-01〜04 |

## 実行手順

### ステップ 1: AC matrix

| AC | 内容 | unit | contract | integration | static | runbook | failure | TECH-M |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | `apps/api/src/sync/` に manual / scheduled / backfill / audit 4 ファイル配備 | - | - | - | S-03 | step 1, 6, 7, 8 | - | - |
| AC-2 | `POST /admin/sync/run` `SYNC_ADMIN_TOKEN` Bearer 下で 200 + `audit_id` | - | C-F-01 | I-01, I-02 | - | step 6 | F-05 | - |
| AC-3 | `scheduled` handler が Cron Trigger から起動、全件 upsert sync | - | C-F-02 | I-03 | - | step 7, 9 | F-15 | TECH-M-02 |
| AC-4 | backfill が D1 batch、admin 列（publish_state / is_deleted / meeting_sessions）に touch なし | - | C-F-03 | I-04 | S-05 | step 8 | F-11, B-01〜B-04 | - |
| AC-5 | 全 sync 経路で sync_audit row が作成 / finalize | U-A-01〜U-A-08 | C-F-05 | I-01, I-03, I-04, I-09 | - | step 1, 4 | F-01, F-03, F-10, F-12 | TECH-M-03 |
| AC-6 | 同 responseId 再実行で副作用なし（upsert 冪等） | upsert unit | - | I-05 | - | step 3 | F-10 | - |
| AC-7 | running 中の新規 sync 拒否（mutex） | mutex unit | - | I-06 | - | step 4, 6, 7, 8 | F-05, F-06, F-13, F-15 | TECH-M-01 |
| AC-8 | data-contract.md mapping table contract test 差分ゼロ | U-M-01〜U-M-12 | C-D-01〜C-D-31 | - | S-04 | step 2 | F-04 | - |
| AC-9 | apps/web から D1 / sync コードへ直接アクセス禁止 | - | - | - | S-03 | - | - | - |
| AC-10 | `googleapis` / `node:` Workers 非互換依存禁止 | - | - | - | S-01, S-02 | step 5 | F-03 | - |
| AC-11 | consent は `publicConsent` / `rulesConsent` のみ受理、その他は正規化または unmapped | U-M-08〜U-M-10, U-M-12 | C-D-30, C-D-31 | - | - | step 2 | F-04, F-08, F-09 | - |
| AC-12 | rate limit 時に exponential backoff（最大 3 回）、超過時 failed | sheets-client unit | - | I-08, I-09 | - | step 5 | F-01, F-02 | TECH-M-03 |

### ステップ 2: 未トレース 検出

- AC-1〜AC-12 全て対応済み
- TECH-M-01 / TECH-M-02 / TECH-M-03 は AC-7 / AC-3 / AC-5 / AC-12 で吸収
- TECH-M-04（shared 化検討）は Phase 12 持ち越し（AC 化対象外、運用判断）

### ステップ 3: 重複 / 漏れ排除

- AC-5 と AC-7 は audit / mutex の二側面（finalize ⊂ AC-5、排他取得 ⊂ AC-7）
- AC-8 と AC-11 は mapping の上位 / 個別（contract 全体 ⊂ AC-8、consent 個別 ⊂ AC-11）
- AC-9 と AC-10 は static check の二系統（境界 ⊂ AC-9、依存 ⊂ AC-10）
- 漏れなし

### ステップ 4: NON_VISUAL evidence 形式

screenshot は不要。以下を `outputs/phase-11/` に配置:

| 種別 | ファイル | 内容 |
| --- | --- | --- |
| log | `local-dev.log` | `mise exec -- pnpm --filter @ubm/api dev` の起動ログ + scheduled 登録 |
| log | `manual-curl.log` | `curl -X POST .../admin/sync/run` の HTTP 200 + body |
| log | `mutex-conflict.log` | 連続 POST の 2 回目 409 evidence |
| sql | `audit-rows.sql.json` | `bash scripts/cf.sh d1 execute ... "SELECT * FROM sync_audit ORDER BY started_at DESC LIMIT 5"` の JSON 出力 |
| sql | `admin-columns-pre.sql.json` | backfill 前 `member_status` snapshot |
| sql | `admin-columns-post.sql.json` | backfill 後 `member_status` snapshot（diff 0 を主張） |
| log | `scheduled-trigger.log` | package script 経由の test-scheduled dev server で `__scheduled` を curl したログ |
| log | `backoff-trace.log` | rate limit 模擬時の backoff 3 回 + failed_reason="sheets_rate_limit" |

すべての evidence は実値秘匿（access_token / SA private_key / response_email PII を mask）。

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | AC trace を品質保証メトリクスに利用 |
| Phase 10 | GO/NO-GO の根拠 |
| Phase 11 | NON_VISUAL evidence を本表に従い収集 |
| 下流 09b | failed_reason / mutex 衝突カウントを監視へ展開 |
| 下流 05b | manual endpoint の挙動確認結果を smoke 起点として共有 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| AC トレース率 | 100% | TBD |
| 未トレース数 | 0 件 | TBD |
| TECH-M 解決確認 | 100% | TBD |

## 多角的チェック観点

- 不変条件 #1: AC-8 / AC-11 でコード固定阻止
- 不変条件 #2: AC-11 で consent 正規化
- 不変条件 #3: AC-11 / AC-8 で responseEmail system field 化
- 不変条件 #4: AC-4 で admin 列保護
- 不変条件 #5: AC-9 で D1 アクセス境界
- 不変条件 #6: AC-10 で Workers 互換
- 不変条件 #7: AC-4 / AC-3 で Sheets を真とした sync 経路

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix | 7 | pending | 12 行 |
| 2 | 未トレース | 7 | pending | 0 件 |
| 3 | 重複排除 | 7 | pending | - |
| 4 | NON_VISUAL evidence 形式 | 7 | pending | 8 ファイル |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × test × runbook × failure × TECH-M |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC-1〜AC-12 全て対応
- [ ] 未トレース 0 件
- [ ] 重複なし
- [ ] NON_VISUAL evidence 形式（8 ファイル）が確定
- [ ] TECH-M-01〜03 解決確認が AC 経由で吸収
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #1〜#7 が紐付け
- 次 Phase へ品質保証対象を引継ぎ（特に audit deps / sheets-client backoff / D1 batch builder）
- artifacts.json の phase 7 を completed に更新

## 次 Phase

- 次: 8 (品質保証)
- 引き継ぎ事項:
  - 9 ファイル中で重複する `Deps` 構築 / `withSyncMutex` 呼び出しパターン / `loadAliases` を共通化候補として抽出
  - audit writer の packages/shared 切り出しは TECH-M-04 として Phase 12 で再評価（YAGNI 維持）
- ブロック条件: 未トレース AC があれば進まない / NON_VISUAL evidence 形式が未確定なら進まない
