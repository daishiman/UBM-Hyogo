# Phase 5: 実装ランブック（03a / 03b / 04c / 09b 受入条件 patch 案）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（受入条件 patch 案の提示） |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略：docs-only 整合性検証) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（patch 案提示・実適用は各タスク内 Phase に委譲） |

## 目的

UT-21 から抽出した有効な品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）を、03a / 03b / 04c / 09b の受入条件へ移植するための **patch 案** を本 Phase で提示する。
本タスクは docs-only / legacy umbrella close-out であり、03a/03b/04c/09b の実ファイル（`docs/30-workflows/<task>/index.md` 等）を本 Phase 内で書き換えてはならない。実 patch の適用は受入先タスクの担当 Phase（典型的には各タスクの Phase 1〜2 受入条件確定 or Phase 12 ドキュメント更新）で実施する。
本 Phase の成果物は「移植先見出し」「patch 案（diff 形式 or 列挙）」「責任分界（誰がいつ適用するか）」の 3 点を 4 タスク × 4 品質要件で完結させることに尽きる。

## 実行タスク

1. patch 案ヘッダ書式を確定する（完了条件: 「移植先タスク」「移植先見出しパス」「patch 種別 (補強 / 新規追記 / 文言調整)」「適用 Phase」「責任分界」の 5 フィールドが定義）。
2. 04c-parallel-admin-backoffice-api-endpoints への Bearer guard patch 案を作成する（完了条件: 401 / 403 / 200 / 409 の 4 状態境界が AC レベルで明記）。
3. 03a / 03b への 409 排他 patch 案を作成する（完了条件: `sync_jobs.status='running'` 同種 job 検出 → 409 Conflict 返却がそれぞれの受入条件として明記）。
4. 03a / 03b への D1 retry / `SQLITE_BUSY` backoff / 短い transaction / batch-size 制限 patch 案を作成する（完了条件: 4 観点が AC として明記）。
5. 09b への manual smoke patch 案を作成する（完了条件: 実 secrets / 実 D1 環境での smoke 実行手順と NON_VISUAL 証跡保存先が明記）。
6. 「新設しない方針」の patch 案を本仕様書および UT-21 当初仕様書の状態欄に明記する手順を確定する（完了条件: `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` / `apps/api/src/sync/{core,manual,scheduled,audit}.ts` の 5 項目すべてに対する禁止文言案が記述）。
7. canUseTool 適用範囲を明記する（完了条件: 本 Phase 内では Edit / Write は本タスクの outputs/ 配下のみに限定）。
8. sanity check コマンド（patch 案文書の存在 / 4 タスク網羅 / 5 禁止項目網羅）を整備する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | AC-2 / AC-3 / AC-6 原典 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-02.md | 移植マトリクス |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-04.md | 整合性 grep の結果（補強 / 新規追記 分類根拠） |
| 必須 | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/ | 移植先 (schema sync) |
| 必須 | docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/ | 移植先 (response sync) |
| 必須 | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/ | 移植先 (admin endpoints) |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | 移植先 (cron / runbook / smoke) |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | 当初仕様（状態欄に「legacy / superseded」を明記する patch 対象） |
| 参考 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-05.md | docs-only runbook 形式の参考 |

## patch 案ヘッダ書式

各 patch 案は以下フィールドで開始する。

```
- 移植先タスク: <ディレクトリ名>
- 移植先見出しパス: <相対 md パス>::<セクション名>
- patch 種別: 補強 / 新規追記 / 文言調整 / 状態欄追記
- 適用 Phase: 受入先タスクの Phase X（典型は Phase 1 受入条件確定 or Phase 12 ドキュメント更新）
- 責任分界: 本タスクは案の提示まで、実適用は受入先タスクの owner
```

## patch 案 1: 04c → Bearer guard

- 移植先タスク: 04c-parallel-admin-backoffice-api-endpoints
- 移植先見出しパス: `index.md`::`受入条件 (AC)`
- patch 種別: 補強（既述があれば文言整理）/ 新規追記（既述なければ追加）
- 適用 Phase: 04c Phase 1（受入条件確定）
- 責任分界: 案提示=本タスク、実適用=04c owner

```diff
+ AC-X: `/admin/sync/schema` および `/admin/sync/responses` の Bearer guard が以下 4 状態を返すことが integration test で検証されている
+   - 401 Unauthorized: `Authorization` ヘッダ欠落
+   - 403 Forbidden: `Authorization: Bearer <値>` が `SYNC_ADMIN_TOKEN` と不一致
+   - 200 OK: 一致 かつ 該当 job_kind が idle
+   - 409 Conflict: 一致 かつ 該当 job_kind の `sync_jobs.status='running'` が存在
+ AC-Y: middleware は `apps/api/src/middleware/` 配下に配置し、ルート定義側の手書きチェックを禁止する（DRY 化）
```

整合性 grep 結果（Phase 4）で `SYNC_ADMIN_TOKEN` / `Bearer` 既述が確認できれば patch 種別は「補強」、未確認なら「新規追記」とする。

## patch 案 2: 03a / 03b → 409 排他

- 移植先タスク: 03a-parallel-forms-schema-sync-and-stablekey-alias-queue / 03b-parallel-forms-response-sync-and-current-response-resolver
- 移植先見出しパス: それぞれの `index.md`::`受入条件 (AC)`
- patch 種別: 補強 or 新規追記
- 適用 Phase: 各タスクの Phase 1
- 責任分界: 案提示=本タスク、実適用=03a / 03b owner

```diff
+ AC-X (03a): `POST /admin/sync/schema` 起動時、`sync_jobs` に `job_kind='schema_sync'` かつ `status='running'` の行が存在する場合は 409 Conflict を返し、新規 job を起動しない
+ AC-X (03b): `POST /admin/sync/responses` 起動時、`sync_jobs` に `job_kind='response_sync'` かつ `status='running'` の行が存在する場合は 409 Conflict を返し、新規 job を起動しない
+ AC-Y: 同種 job 排他は `job_kind` 単位で評価し、異種 job_kind の同時実行は許容する（単一 `job_kind='sync'` への退化を禁止）
```

## patch 案 3: 03a / 03b → D1 retry / SQLITE_BUSY backoff / 短い transaction / batch-size

- 移植先タスク: 03a / 03b
- 移植先見出しパス: 各 `index.md`::`受入条件 (AC)` および `phase-02.md`::設計
- patch 種別: 補強
- 適用 Phase: 各タスクの Phase 1（AC）+ Phase 2（設計）
- 責任分界: 案提示=本タスク、実適用=03a / 03b owner

```diff
+ AC-X: D1 への書き込みは「1 transaction = 1 batch（最大 N 件）」に制限し、N の上限は実装時に決定する（暫定: schema=50 / response=100）
+ AC-Y: `SQLITE_BUSY` を検知した場合は最大 3 回の指数バックオフ（100ms / 400ms / 1600ms）でリトライし、失敗時は `sync_jobs.status='failed'` + `metrics_json.last_error` に記録する
+ AC-Z: 1 transaction の wall-clock 上限を実装目安として 3 秒以内に収め、長時間ロックを発生させない
```

## patch 案 4: 09b → manual smoke

- 移植先タスク: 09b-parallel-cron-triggers-monitoring-and-release-runbook
- 移植先見出しパス: `index.md`::`受入条件 (AC)` および `phase-11.md`::手動 smoke
- patch 種別: 補強
- 適用 Phase: 09b Phase 1 / Phase 11
- 責任分界: 案提示=本タスク、実適用=09b owner

```diff
+ AC-X: release 前に実 `SYNC_ADMIN_TOKEN` / 実 `GOOGLE_FORMS_API_KEY` / 実 D1 (production / staging) を用いた manual smoke を 1 回以上実行し、以下を NON_VISUAL 証跡として `outputs/phase-11/` に保存する
+   - `POST /admin/sync/schema` の 401 / 403 / 200 / 409 4 状態
+   - `POST /admin/sync/responses` の 401 / 403 / 200 / 409 4 状態
+   - `sync_jobs` への `started_at` / `finished_at` / `metrics_json` 記録
+ AC-Y: 異常時の cron pause / resume 手順を runbook に明記する
```

## patch 案 5: 「新設しない方針」の状態欄追記

- 移植先 1: `docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md` 本体（既に AC-3 / AC-4 として記載済。本 Phase で追加変更なし、再確認のみ）
- 移植先 2: `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`::メタ情報
- patch 種別: 状態欄追記
- 適用 Phase: 本タスク Phase 12
- 責任分界: 案提示=本 Phase、実適用=本タスク Phase 12

```diff
  | 状態 | 未実施 |
+ | superseded by | task-ut21-forms-sync-conflict-closeout-001 (legacy umbrella close-out) |
+ | 直接実装 | 禁止（POST /admin/sync / GET /admin/sync/audit / sync_audit_logs / sync_audit_outbox / apps/api/src/sync/{core,manual,scheduled,audit}.ts は新設しない）|
```

## 責任分界サマリ

| patch 案 | 案提示 (本タスク Phase) | 実適用 (移植先タスク Phase) |
| --- | --- | --- |
| 1: 04c Bearer guard | Phase 5 | 04c Phase 1 |
| 2: 03a/03b 409 排他 | Phase 5 | 03a Phase 1 / 03b Phase 1 |
| 3: 03a/03b D1 retry | Phase 5 | 03a Phase 1+2 / 03b Phase 1+2 |
| 4: 09b manual smoke | Phase 5 | 09b Phase 1 / Phase 11 |
| 5: legacy 状態欄 | Phase 5 | 本タスク Phase 12 |

## canUseTool 適用範囲

- 本 Phase 内で許可される編集: 本タスクの `outputs/phase-05/implementation-runbook.md` のみ。
- 禁止: 03a / 03b / 04c / 09b の `index.md` / `phase-XX.md` の編集、UT-21 当初仕様書の編集（後者は本タスク Phase 12 で実施）。
- 外部 CLI（`wrangler` / `gh issue`）は本タスク内で不要。Issue #234 は CLOSED のまま据え置き、再オープン禁止。
- canUseTool 推奨: Edit / Write のみ。

## sanity check

```bash
# patch 案網羅性: 4 移植先タスクすべての言及があるか
rg -nc "03a-parallel-forms-schema-sync\|03b-parallel-forms-response-sync\|04c-parallel-admin-backoffice\|09b-parallel-cron-triggers" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md

# 5 禁止項目の網羅: POST /admin/sync / GET /admin/sync/audit / sync_audit_logs / sync_audit_outbox / apps/api/src/sync/{core,manual,scheduled,audit}.ts
rg -n "POST /admin/sync\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox\|apps/api/src/sync/(core\|manual\|scheduled\|audit)" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md

# 04c の Bearer guard 既述確認（patch 種別判定根拠）
rg -n "SYNC_ADMIN_TOKEN\|Bearer" docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | patch 案の例外パス（移植漏れ / 重複定義 / job_kind 単一退化）を failure case に転換 |
| Phase 7 | 各 patch 案を AC マトリクスの「成果物パス」「担当 Phase」列に紐付け |
| Phase 9 | sanity check の rg 出力を品質保証ログに記録 |
| Phase 11 | patch 案 4（manual smoke）の手順を NON_VISUAL smoke の参照に予約 |
| Phase 12 | patch 案 5 の状態欄追記を実適用 |

## 多角的チェック観点

- 価値性: 4 タスク × 4 品質要件が漏れなく patch 案化されているか。
- 実現性: 受入先タスク owner が案を読んで適用可能な粒度か。
- 整合性: 03a/03b/04c/09b の現行受入条件と矛盾しないか（重複は「補強」、空白は「新規追記」と分類）。
- 運用性: 適用 Phase が一意に指定されているか。
- 認可境界: Bearer guard が `apps/api` middleware に閉じ、`apps/web` 側に漏出しないか。
- 不変条件: #5 違反となるパス（`apps/web` から D1 直接アクセス）を patch 案に含めていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | patch 案ヘッダ書式 | spec_created |
| 2 | 04c Bearer guard patch 案 | spec_created |
| 3 | 03a / 03b 409 排他 patch 案 | spec_created |
| 4 | 03a / 03b D1 retry patch 案 | spec_created |
| 5 | 09b manual smoke patch 案 | spec_created |
| 6 | 「新設しない」状態欄 patch 案 | spec_created |
| 7 | canUseTool 範囲 | spec_created |
| 8 | sanity check | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | patch 案 5 件 + 責任分界 + sanity check |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] patch 案ヘッダ書式 5 フィールドが定義
- [ ] 4 移植先タスク（03a / 03b / 04c / 09b）すべてに patch 案が 1 件以上
- [ ] 4 品質要件（Bearer guard / 409 / D1 retry / manual smoke）すべてに patch 案
- [ ] 5 禁止項目の状態欄追記 patch 案
- [ ] 責任分界サマリで案提示と実適用 Phase が一意
- [ ] canUseTool 範囲が「outputs/phase-05/ のみ」と明記
- [ ] sanity check の rg コマンドが記述

## タスク100%実行確認【必須】

- 実行タスク 8 件すべて `spec_created`
- 成果物が `outputs/phase-05/implementation-runbook.md` に配置予定
- 03a / 03b / 04c / 09b の実体ファイルを本 Phase で編集しないことが明記
- 不変条件 #5 違反 patch 案が含まれないことを確認

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - patch 案 5 件 → Phase 6 failure case の入力（移植漏れ / 重複 / job_kind 単一退化）
  - 責任分界サマリ → Phase 7 AC マトリクスの「担当 Phase」列
  - sanity check → Phase 9 品質保証ログ
- ブロック条件:
  - patch 案が 4 移植先のいずれかに欠落
  - 実適用 Phase が「本タスク Phase 5 内」と誤記される
  - 03a/03b/04c/09b の実体ファイルを本 Phase で編集してしまう
