# Phase 6 成果物: コードレビュー観点 / 異常系検証設計

> 後続実装タスク（受け側 PR）が route inventory script を実装するときの **review checklist** と **異常系検証** を固定する。
> Phase 2 の `InventoryReport` schema と Phase 3 NO-GO 条件（NG-1〜NG-5）を **唯一の判定基準** とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13（コードレビュー観点 / 異常系検証設計） |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## レビュー観点（review checklist）

| 観点 | PASS 条件 | 連動 NG / test |
| --- | --- | --- |
| API 境界 | Phase 2 §2 の **GET allowlist のみ** を呼ぶ | NG-1 / ST-02 / UT-02 |
| wrapper 境界 | 外部入口は `bash scripts/cf.sh route-inventory ...` 相当の repository-controlled command に閉じる | NG-2 / ST-03 / UT-01 |
| schema | 出力は `InventoryReport`。`workerName` 等の competing schema を正本化しない | NG-4 / CT-01〜CT-04 |
| mismatch | `mismatches = entries.filter(e => e.targetWorker !== expectedWorker)` の契約を保つ | UT-03 / UT-04 |
| secret hygiene | token / Bearer / OAuth prefix / `.env` 実値を output / log に出さない | NG-3 / ST-01 / UT-07 |
| production safety | deploy / route update / secret put / Worker delete を一切含まない | NG-5 |

## security セクション昇格（Phase 4 safety guard 3 種を再掲）

| ID | 観点 | fail 条件 |
| --- | --- | --- |
| ST-01 | output (JSON / Markdown / log) に secret pattern 混入なし | `(?i)(api[_-]?token\|secret\|bearer\s\|authorization:\s\|password\|cf[_-]?api[_-]?key)` マッチで fail |
| ST-02 | mutation HTTP method 呼び出しなし | `POST` / `PUT` / `PATCH` / `DELETE` 発行で fail |
| ST-03 | `wrangler` 直叩きの混入なし | `grep -nE 'wrangler\s+(deploy\|secret\|tail\|d1\|kv\|r2\|publish)'` allowlist 外で fail |

## 実装観点（受け側 PR で目視レビューするポイント）

- 擬似コード骨格 5 関数（`main` / `fetchRoutes` / `fetchCustomDomains` / `buildInventoryReport` / `writeOutput`）が分離されているか
- HTTP method allowlist が API call layer のひとつ手前に存在するか（API call 直前で method 検証）
- token 値が CLI 引数・env dump・error message のいずれにも現れないか
- `cf.sh` 経由以外の Cloudflare CLI / API client（`wrangler` / 生 `curl` for `api.cloudflare.com`）が存在しないか
- output writer の secret mask layer が JSON / Markdown / log の 3 経路すべてに掛かっているか
- 親 UT-06 runbook の 3 節（節 0 / 節 2 / 突合手順前段）への追記が反映されているか

## 異常系（abnormal cases / EX-1〜EX-5）

| ID | 入力 | 期待挙動 |
| --- | --- | --- |
| EX-1 | Cloudflare API 401 / 403 | 出力を生成せず auth error として fail（exit code 2）|
| EX-2 | Cloudflare API 429 | retry storm を起こさず fail-fast（exit code 2）|
| EX-3 | target Worker が存在しない | `mismatches` ではなく setup error として fail（exit code 2）|
| EX-4 | response shape が想定外 | parser error として fail（exit code 2、診断情報出力 / secret 値は含めない）|
| EX-5 | secret pattern が output に混入 | output を破棄し exit code 非 0（NG-3 違反）|

## 統合テスト連動（Phase 7）

| 異常系 ID | Phase 7 TC | 連動内容 |
| --- | --- | --- |
| EX-1 | TC-INT-05 | API mock が 401 を返す場合の auth error 伝播 |
| EX-2 | TC-INT-06 | API mock が 429 を返す場合の rate-limit error 伝播 |
| EX-3 | TC-INT-04 | `ubm-hyogo-web-production` が workers list 不在で error |
| EX-4 | TC-INT-04 派生 | response shape mismatch / parser error |
| EX-5 | secret-leak grep | output に secret 混入時の破棄経路 |

## レビュー手順（受け側 PR）

1. PR diff を読み、本 checklist の 6 観点 × 6 実装観点で目視レビュー。
2. ST-01〜ST-03 を CI / pre-commit で機械 gate 化されているか確認。
3. EX-1〜EX-5 の test ケースが unit / integration に存在するか確認。
4. 親 UT-06 runbook 追記 diff が含まれるか確認。
5. PR 説明に `bash scripts/cf.sh route-inventory ...` の実行 evidence（mask 済 JSON / Markdown 抜粋）が添付されているか確認。

## NO-GO 条件（再掲）

| NG | 内容 |
| --- | --- |
| NG-1 | mutation endpoint が API call layer に現れる |
| NG-2 | `wrangler` 直接実行が script / runbook に現れる |
| NG-3 | output / log に secret / Bearer / OAuth prefix |
| NG-4 | `InventoryReport` 以外の competing schema を正本化 |
| NG-5 | production deploy / DNS / route update / Worker delete を本タスクで実行 |

## 完了条件

- [x] Phase 2 schema と Phase 3 NO-GO 条件（NG-1〜NG-5）に接続している
- [x] 異常系 5 件（EX-1〜EX-5）が定義されている
- [x] 後続実装タスクの review checklist として再利用可能な粒度
- [x] safety guard 3 種が security セクションに昇格
- [x] 実装観点 6 件が列挙されている

## 次 Phase への引き渡し

- Phase 7: EX-1〜EX-5 を TC-INT-04〜06 と紐付け、AC-1〜AC-5 マトリクスに wire-in
- 受け側 PR: 本 checklist をそのまま PR review template として使用
