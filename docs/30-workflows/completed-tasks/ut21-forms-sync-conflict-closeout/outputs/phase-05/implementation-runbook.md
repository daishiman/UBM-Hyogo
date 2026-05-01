# Phase 5 Output: Implementation Runbook（03a / 03b / 04c / 09b 受入条件 patch 案）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 5 / 13（実装ランブック：受入条件 patch 案） |
| taskType | docs-only / specification-cleanup（patch 案提示・実適用は各タスク内 Phase に委譲） |
| 前 Phase | 4（テスト戦略） |
| 次 Phase | 6（異常系検証） |
| AC トレース | AC-2 / AC-3 / AC-6（主）+ AC-4 / AC-7 / AC-9（副） |

## 0. スコープ宣言

- 本 Phase は **patch 案** を提示する文書である。03a / 03b / 04c / 09b の `index.md` / `phase-XX.md` は **本 Phase 内で一切編集しない**。
- 実 patch 適用は受入先タスクの owner が該当 Phase（典型: 各タスクの Phase 1 受入条件確定 or Phase 12 ドキュメント更新）で実施する。
- 本 Phase の成果物は「移植先見出し」「patch 案 (diff 形式 or 列挙)」「責任分界」の 3 点を 4 タスク × 4 品質要件で完結させる。
- AC-6（patch 案提示）の根拠ファイルとして本ファイルが参照される。

## 1. patch 案ヘッダ書式（5 フィールド）

各 patch 案は以下 5 フィールドで開始する。

```
- 移植先タスク: <ディレクトリ slug>
- 移植先見出しパス: <相対 md パス>::<セクション名>
- patch 種別: 補強 / 新規追記 / 文言調整 / 状態欄追記
- 適用 Phase: 受入先タスクの Phase X
- 責任分界: 案提示=本タスク Phase 5、実適用=受入先 owner（誰がいつ）
```

patch 種別の判定根拠は Phase 4 スイート 3（S3-01〜S3-04）の grep 結果に従う。
既述あり=「補強」、既述なし=「新規追記」、既述あるが文言不揃い=「文言調整」。

## 2. patch 案 1: 04c → Bearer guard（MIG-01）

- 移植先タスク: `04c-parallel-admin-backoffice-api-endpoints`
- 移植先見出しパス: `index.md`::`受入条件 (AC)` および `phase-02.md`::middleware 設計
- patch 種別: 補強（既述があれば文言整理）/ 新規追記（既述がなければ追加）。判定は S3-01 の出力に依存
- 適用 Phase: 04c の Phase 1（受入条件確定）+ Phase 2（middleware 設計）
- 責任分界: 案提示=本タスク Phase 5、実適用=04c owner

```diff
+ AC-X: `/admin/sync/schema` および `/admin/sync/responses` の Bearer guard が以下 4 状態を返すことが integration test で検証されている
+   - 401 Unauthorized: `Authorization` ヘッダ欠落
+   - 403 Forbidden: `Authorization: Bearer <値>` が Cloudflare Secret `SYNC_ADMIN_TOKEN` と不一致
+   - 200 OK: 一致 かつ 該当 `job_kind` が idle（`sync_jobs` に `status='running'` 行なし）
+   - 409 Conflict: 一致 かつ 該当 `job_kind` の `sync_jobs.status='running'` 行が存在
+ AC-Y: 上記 guard は `apps/api/src/middleware/` 配下に集約し、ルート定義側の手書きチェックを禁止する（DRY 化）
+ AC-Z: middleware は `apps/api` 内に閉じ、`apps/web` から D1 / Secret に直接アクセスしない（不変条件 #5）
```

検証方針: Vitest int test（middleware 単体）+ 04c の phase-04 テスト戦略へ追記 + 09a smoke で 401 / 403 / 200 / 409 のうち 401 ケースを 1 件含める。

## 3. patch 案 2: 03a / 03b → 409 排他（MIG-02）

- 移植先タスク: `03a-parallel-forms-schema-sync-and-stablekey-alias-queue` / `03b-parallel-forms-response-sync-and-current-response-resolver`
- 移植先見出しパス: 各 `index.md`::`受入条件 (AC)`
- patch 種別: 補強 or 新規追記（S3-02 結果に依存）
- 適用 Phase: 各タスクの Phase 1
- 責任分界: 案提示=本タスク Phase 5、実適用=03a / 03b owner

```diff
+ AC-X (03a): `POST /admin/sync/schema` 起動時、`sync_jobs` に `job_kind='schema_sync'` かつ `status='running'` の行が存在する場合は 409 Conflict を返却し、新規 job を起動しない
+ AC-X (03b): `POST /admin/sync/responses` 起動時、`sync_jobs` に `job_kind='response_sync'` かつ `status='running'` の行が存在する場合は 409 Conflict を返却し、新規 job を起動しない
+ AC-Y: 同種 job 排他は `job_kind` 単位で評価する。`schema_sync` と `response_sync` の同時実行は許容（単一 `job_kind='sync'` への退化を禁止）
+ AC-Z: 409 応答 body には既存 running job の `job_id` / `started_at` / `job_kind` を含める
```

検証方針: Vitest int test（`sync_jobs` repository + handler）+ 03a / 03b の phase-04 テスト戦略へ追記。

## 4. patch 案 3: 03a / 03b → D1 retry / SQLITE_BUSY backoff / 短い transaction / batch-size（MIG-03）

- 移植先タスク: 03a / 03b
- 移植先見出しパス: 各 `index.md`::`受入条件 (AC)` および `phase-02.md`::設計
- patch 種別: 補強（S3-03 結果に依存）
- 適用 Phase: 各タスクの Phase 1（AC）+ Phase 2（設計）
- 責任分界: 案提示=本タスク Phase 5、実適用=03a / 03b owner

```diff
+ AC-X: D1 への書き込みは「1 transaction = 1 batch（最大 N 件）」に制限し、N の上限は実装時に決定する
+   - 暫定値: schema_sync = 50 件 / response_sync = 100 件
+   - batch 区切りで commit し、長時間ロックを避ける
+ AC-Y: `SQLITE_BUSY` を検知した場合は最大 3 回の指数バックオフ（100ms / 400ms / 1600ms）でリトライし、失敗時は `sync_jobs.status='failed'` + `metrics_json.last_error` に記録
+ AC-Z: 1 transaction の wall-clock 上限を実装目安として 3 秒以内に収め、cursor 再開性（次 batch から再実行可能）を担保
+ AC-W: `metrics_json` に `batch_count` / `retry_count` / `total_rows_written` / `last_error` を記録
```

検証方針: Vitest int test（D1 mock retry / batch boundary）+ 03a / 03b の phase-04 / phase-09 へ追記。

## 5. patch 案 4: 09b → manual smoke（MIG-04）

- 移植先タスク: `09b-parallel-cron-triggers-monitoring-and-release-runbook`
- 移植先見出しパス: `index.md`::`受入条件 (AC)` および `phase-11.md`::手動 smoke セクション
- patch 種別: 補強（S3-04 結果に依存）
- 適用 Phase: 09b の Phase 1（AC）+ Phase 11（smoke 実行）
- 責任分界: 案提示=本タスク Phase 5、実適用=09b owner（および 09a / 09c smoke の責任分界に従う）

```diff
+ AC-X: release 前に実 `SYNC_ADMIN_TOKEN` / 実 `GOOGLE_FORMS_API_KEY` / 実 D1 (production / staging) を用いた manual smoke を 1 回以上実行し、以下を NON_VISUAL 証跡として `outputs/phase-11/` 配下に保存する
+   - `POST /admin/sync/schema` の 401 / 403 / 200 / 409 4 状態
+   - `POST /admin/sync/responses` の 401 / 403 / 200 / 409 4 状態
+   - `sync_jobs` への `started_at` / `finished_at` / `metrics_json` 記録
+ AC-Y: 異常時の cron pause / resume 手順を runbook に明記し、`bash scripts/cf.sh` 経由で実行可能とする
+ AC-Z: smoke 実行は UT21-U04（`task-ut21-phase11-smoke-rerun-real-env-001`）の手順に整合させる
```

検証方針: Cloudflare Workers 実環境で `bash scripts/cf.sh` 経由で実行。ログを `outputs/phase-11/main.md` 同形式で記録。

## 6. patch 案 5: 「新設しない方針」の状態欄追記

- 移植先 1: 本タスク `index.md`（既に AC-3 / AC-4 として記載済み。本 Phase で追加変更なし、再確認のみ）
- 移植先 2: `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`::メタ情報
- patch 種別: 状態欄追記
- 適用 Phase: 本タスク Phase 12（実適用は 12 で行う）
- 責任分界: 案提示=本 Phase、実適用=本タスク Phase 12

```diff
  | 状態 | 未実施 |
+ | superseded by | task-ut21-forms-sync-conflict-closeout-001 (legacy umbrella close-out) |
+ | 直接実装 | 禁止 |
+ | 禁止項目 | POST /admin/sync / GET /admin/sync/audit / sync_audit_logs / sync_audit_outbox / apps/api/src/sync/{core,manual,scheduled,audit}.ts は新設しない |
+ | 派生タスク | UT21-U02（audit table 必要性判定） / UT21-U04（実環境 smoke 再実行） / UT21-U05（impl path 境界整理） |
```

5 禁止項目すべての禁止文言案を含むこと（AC-3 / AC-4 完成条件）。

## 7. 責任分界サマリ（一意割当）

| patch 案 | 案提示 (本タスク Phase) | 実適用 (移植先タスク Phase) | 検証スイート (Phase 4) | 関連 failure case (Phase 6) |
| --- | --- | --- | --- | --- |
| 1: 04c Bearer guard (MIG-01) | Phase 5 | 04c Phase 1 + Phase 2 | S3-01 + M-01 | #1, #11 |
| 2: 03a/03b 409 排他 (MIG-02) | Phase 5 | 03a Phase 1 / 03b Phase 1 | S3-02 + M-01 | #2, #10 |
| 3: 03a/03b D1 retry (MIG-03) | Phase 5 | 03a Phase 1+2 / 03b Phase 1+2 | S3-03 | #3 |
| 4: 09b manual smoke (MIG-04) | Phase 5 | 09b Phase 1 / Phase 11 | S3-04 | #4, #12 |
| 5: legacy 状態欄 | Phase 5 | 本タスク Phase 12 | S1-01〜S1-03 + M-05 | #5, #6, #7, #17 |

## 8. AC-6 トレース（patch 案 = 成果物パス）

| AC-6 サブ要件 | patch 案 | 本ファイル内位置 | 実適用 Phase |
| --- | --- | --- | --- |
| 03a への patch 案存在 | patch 案 2 / 3 | §3, §4 | 03a Phase 1+2 |
| 03b への patch 案存在 | patch 案 2 / 3 | §3, §4 | 03b Phase 1+2 |
| 04c への patch 案存在 | patch 案 1 | §2 | 04c Phase 1+2 |
| 09b への patch 案存在 | patch 案 4 | §5 | 09b Phase 1 / Phase 11 |
| 「実適用は各タスクの Phase 内」明記 | §0 / §7 | §0 スコープ宣言、§7 責任分界サマリ | - |

4 移植先 × 4 品質要件 + 1 状態欄 = 計 5 件の patch 案で AC-6 を完全に成立させる。

## 9. canUseTool 適用範囲

- 本 Phase 内で許可される編集: `outputs/phase-05/implementation-runbook.md` のみ
- 禁止: 03a / 03b / 04c / 09b の `index.md` / `phase-XX.md` の編集（実適用は受入先タスク内）
- 禁止: UT-21 当初仕様書の編集（後者は本タスク Phase 12 で実施）
- 外部 CLI（`wrangler` / `gh issue`）は本 Phase 内で不要
- Issue #234 は CLOSED のまま据え置き、再オープン禁止
- canUseTool 推奨: Edit / Write のみ

## 10. sanity check（Phase 9 で実測）

```bash
# (1) patch 案網羅性: 4 移植先タスクすべての言及があるか
for slug in 03a-parallel-forms-schema-sync 03b-parallel-forms-response-sync 04c-parallel-admin-backoffice 09b-parallel-cron-triggers; do
  count=$(rg -c "${slug}" docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md)
  echo "${slug}: ${count}"
done
# 期待: 各 slug で 1 hit 以上

# (2) 5 禁止項目の網羅
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox|apps/api/src/sync/(core|manual|scheduled|audit)" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md
# 期待: 5 項目すべて 1 hit 以上（禁止文脈として記載されていることを確認）

# (3) 04c の Bearer guard 既述確認（patch 種別判定根拠 = S3-01）
rg -n "SYNC_ADMIN_TOKEN|Bearer" docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints

# (4) 03a/03b の 409 既述確認（S3-02）
rg -n "sync_jobs\.status\s*=\s*'running'|409\s*Conflict" \
  docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver
```

## 11. 統合テスト連携（次 Phase 引き渡し）

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | patch 案の例外パス（移植漏れ / 重複定義 / job_kind 単一退化）を failure case に転換 |
| Phase 7 | 各 patch 案を AC マトリクス「成果物パス」「担当 Phase」列に紐付け（AC-2 / AC-6 主） |
| Phase 9 | sanity check の rg 出力を品質保証ログに記録 |
| Phase 11 | patch 案 4（manual smoke）の手順を NON_VISUAL smoke の参照に予約 |
| Phase 12 | patch 案 5（legacy 状態欄）を実適用 |

## 12. 多角的チェック観点

- 価値性: 4 タスク × 4 品質要件 + 1 状態欄が漏れなく patch 案化されているか
- 実現性: 受入先 owner が読んで実 patch 適用可能な粒度か（diff 形式 or AC 文言まで具体化済み）
- 整合性: 03a/03b/04c/09b の現行受入条件と矛盾しないか（重複は「補強」、空白は「新規追記」）
- 運用性: 適用 Phase が一意に指定されているか（§7 責任分界サマリ）
- 認可境界: Bearer guard が `apps/api` middleware に閉じ、`apps/web` 側に漏出しないか（patch 案 1 AC-Z）
- 不変条件: #5 違反 patch（`apps/web` から D1 直接アクセス）が含まれていないか

## 13. 完了条件チェック

- [x] patch 案ヘッダ書式 5 フィールドが定義（§1）
- [x] 4 移植先タスクすべてに patch 案が 1 件以上（§2 / §3 / §4 / §5）
- [x] 4 品質要件（Bearer guard / 409 / D1 retry / manual smoke）すべてに patch 案
- [x] 5 禁止項目の状態欄追記 patch 案（§6）
- [x] 責任分界サマリで案提示と実適用 Phase が一意（§7）
- [x] canUseTool 範囲が「outputs/phase-05/ のみ」と明記（§9）
- [x] sanity check の rg コマンドが記述（§10）
