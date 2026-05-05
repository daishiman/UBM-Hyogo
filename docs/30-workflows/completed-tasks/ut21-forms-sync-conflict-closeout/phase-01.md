# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| Wave | 1 |
| 実行種別 | parallel（03a / 03b / 04c / 09b 並走中に着手可能） |
| 前 Phase | なし |
| 次 Phase | 2（設計：移植マトリクス設計 + no-new-endpoint-policy） |
| 状態 | spec_created |
| タスク種別 | docs-only / specification-cleanup（legacy umbrella close-out） |
| visualEvidence | NON_VISUAL |
| priority | HIGH |
| GitHub Issue | #234 (CLOSED) |
| scope | UT-21 当初 Sheets 仕様の有効品質要件のみを 03a / 03b / 04c / 09b に吸収。新規 endpoint・新規 audit table・新規 sync 実装コードはすべて含まない |
| workflow_state | spec_created |

> Phase 1 必須入力: `artifacts.json.metadata.taskType=docs-only`、`visualEvidence=NON_VISUAL`、`scope`、`workflow_state=spec_created` を本 Phase で確定する。

## 目的

UT-21（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）を Sheets→D1 direct implementation として直接実装するのではなく、すでに 03a / 03b / 04c / 09b に分解済みの Forms sync 現行正本へ「有効な品質要件のみ」を吸収する legacy umbrella close-out として閉じる。本 Phase では、`POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針、`sync_audit_logs` / `sync_audit_outbox` の新設を U02 判定まで保留する方針、UT-21 の stale 前提 5 項目と現行正本の差分認識、の 3 軸を Phase 2 設計の入力として固定する。

## 真の論点 (true issue)

- 「UT-21 を実装すること」ではなく、「UT-21 当初仕様を direct implementation に昇格させずに、有効な品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）のみを既存 4 タスク（03a / 03b / 04c / 09b）の受入条件に吸収しつつ、Sheets sync 系の新規実装誘惑を仕様書側でロックする」ことが本タスクの本質。
- 副次的論点として、`sync_audit_logs` / `sync_audit_outbox` を即新設するのか `sync_jobs` ledger だけで足りるかの判断は本タスクでは行わず、UT21-U02 へ委譲する境界を Phase 1 で明示する。
- もう 1 つの副次的論点として、UT-21 が想定する `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 一式と現行 `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` の境界整理は UT21-U05 へ委譲する。

## 因果と境界

| 観点 | 内容 |
| --- | --- |
| 原因 | UT-21 起票時点では Sheets API v4 が同期元想定。その後 `task-sync-forms-d1-legacy-umbrella-001` の流れで Forms sync が現行正本に昇格し、03a / 03b / 04c / 09b に分解された |
| 結果（放置時） | 実装者が UT-21 仕様書だけを読み、Sheets API クライアント・`sync_audit_logs/outbox`・単一 `POST /admin/sync` を二重正本化として実装してしまうリスク |
| 境界（本タスクが扱う） | 仕様書の差分明文化・移植マトリクス・new-endpoint 禁止方針・派生タスク（U02/U04/U05）リンクのみ |
| 境界（本タスクが扱わない） | 03a/03b/04c/09b の受入条件への実 patch 適用、sync 実装コード追加、UT-21 仕様書本体の編集・削除 |

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | 旧 UT-09 close-out 形式 | 同形式の close-out として本タスクを構造化 |
| 上流 | aiworkflow-requirements skill `task-workflow.md` | D1 / sync_jobs / deployment current facts | 本仕様書内の差分根拠として参照 |
| 並列 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | `forms.get` / `POST /admin/sync/schema` 正本 | 409 排他 / D1 retry の受入条件 patch 案 |
| 並列 | 03b-parallel-forms-response-sync-and-current-response-resolver | `forms.responses.list` / `POST /admin/sync/responses` 正本 | 409 排他 / D1 retry の受入条件 patch 案 |
| 並列 | 04c-parallel-admin-backoffice-api-endpoints | Bearer guard / admin endpoint expose 正本 | Bearer guard middleware の受入条件 patch 案 |
| 並列 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | cron / runbook / smoke 正本 | manual smoke runbook の受入条件 patch 案 |
| 下流 | UT21-U02 / U04 / U05 派生タスク | 本タスクから委譲する境界 | 別ファイル化された後続タスクへリンク |

## 価値とコスト

- 価値: 03a / 03b / 04c / 09b の受入条件に「UT-21 由来の品質要件」を明示的に取り込むことで、Forms sync 経路の本番品質（認可境界 / 排他 / retry / 実環境 smoke）を担保しつつ、Sheets sync 経路の二重正本化を構造的に防止する。`POST /admin/sync` を新設しない方針が文書化されることで、後段の実装者が「単一エンドポイント統合」誘惑に流れない。
- コスト: docs-only タスクのため CI / Cloudflare 利用増加はゼロ。Phase 1〜13 のドキュメント作成工数のみ。実 patch 適用は 03a / 03b / 04c / 09b の Phase 内で行われるため本タスク内には発生しない。
- 機会コスト: close-out しないまま放置すると、実装者が UT-21 を direct implementation として扱い、`apps/api/src/sync/*` 一式を新設してしまうことで `apps/api/src/jobs/sync-forms-responses.ts` と二重実装が走るリスク。実装後の reconcile コストは本タスク 13 Phase 分の docs-only 作業より遥かに大きい。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 二重正本化リスクを構造的に排除し、03a / 03b / 04c / 09b の品質要件を一意に固定する |
| 実現性 | PASS | docs-only / 既存仕様参照のみで完結。新規 Secret / 新規実装 / 新規テーブルは不要 |
| 整合性 | PASS | 不変条件 #1 / #4 / #5 / #7 を侵さず、`POST /admin/sync` / `GET /admin/sync/audit` 新設禁止と `sync_audit_logs/outbox` 新設保留が明示されている |
| 運用性 | PASS | 後続タスク UT21-U02 / U04 / U05 が別ファイル化済みで、派生スコープの引き継ぎ経路が明確 |

## 改善優先順位

1. 最優先: `POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針の Phase 2 明文化（Sheets sync 経路を完全にロック）
2. 高: 有効品質要件 4 種 → 03a / 03b / 04c / 09b の移植マトリクス Phase 2 確定
3. 中: UT-21 stale 前提 5 項目の差分表 Phase 2 固定
4. 低: U02 / U04 / U05 派生タスクのリンク維持（既に別ファイル化済みのため確認のみ）

## 既存規約・既存記述の確認

| 観点 | 確認対象 | 期待される現状把握 |
| --- | --- | --- |
| 同期実装正本 | `apps/api/src/jobs/sync-forms-responses.ts` | Forms response sync 正本実装が存在する |
| schema 同期正本 | `apps/api/src/sync/schema/` | `forms.get` 結果を schema_questions / schema_versions / schema_diff_queue へ反映する正本実装 |
| 監査台帳正本 | `sync_jobs` ledger（02c） | `status` / `job_kind` / `metrics_json` を正本管理 |
| Bearer guard 想定先 | 04c admin backoffice api endpoints | `SYNC_ADMIN_TOKEN` middleware 想定 |
| current facts | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | D1 / sync_jobs / deployment の正本情報 |
| 旧仕様 | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | legacy として残す（編集・削除しない） |

## Schema / 共有コード Ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | なし（D1 schema / Zod schema / `packages/shared` / `_shared/` は編集しない） |
| 本タスクが ownership を持つか | no（docs-only / legacy umbrella close-out。実 patch は 03a/03b/04c/09b の Phase に委譲） |
| 他 wave への影響 | 03a / 03b / 04c / 09b の受入条件 patch 案を Phase 5 で提示するのみ。実適用は各タスクの Phase で実施 |
| 競合リスク | UT21-U02 / U04 / U05 と本タスクが同時並行する場合、派生タスク側の境界が変わらないことを Phase 12 cross-link で確認 |
| migration 番号 / exports 改名の予約 | N/A |

## 実行タスク

1. UT-21 stale 前提 5 項目（同期元 / 単一 endpoint / `GET /admin/sync/audit` / audit table（`sync_audit_logs` + `sync_audit_outbox`） / 実装パス）と現行正本の差分認識を表に固定する（完了条件: index.md AC-1 と一致）。
2. 有効品質要件 4 種 → 03a / 03b / 04c / 09b の移植先割当を一意に確定する（完了条件: index.md AC-2 と一致）。
3. `POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針を本仕様書 / Phase 2 設計書 / UT-21 仕様書状態欄に反映する旨を明記する（完了条件: index.md AC-3 と一致）。
4. `sync_audit_logs` / `sync_audit_outbox` の新設は U02 判定まで保留する旨を記述する（完了条件: index.md AC-4 と一致）。
5. 後続タスク UT21-U02 / U04 / U05 が `unassigned-task/` 配下に存在しリンク済みであることを確認する（完了条件: index.md AC-5 と一致）。
6. 4条件評価を全 PASS で確定する（完了条件: 各観点に PASS 判定と根拠が記載）。
7. AC-1〜AC-11 を index.md と同期する（完了条件: AC 文言の差分ゼロ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | AC-1〜11・Phase 一覧の正本 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md | 原典 close-out スペック |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 当初仕様（legacy） |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 旧 UT-09 close-out の参考フォーマット |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | D1 / sync_jobs / deployment current facts |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | Forms response sync 正本実装 |
| 必須 | apps/api/src/sync/schema/ | schema 同期正本実装 |
| 参考 | docs/00-getting-started-manual/specs/01-api-schema.md | フォーム schema と項目定義 |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | stale 前提 5 項目・有効品質要件 4 種・new-endpoint 禁止方針を設計入力として渡す |
| Phase 3 | 4条件評価の根拠を代替案 PASS/MINOR/MAJOR 判定の比較軸に再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象に渡す |
| Phase 5 | 03a/03b/04c/09b の受入条件 patch 案の入力として移植マトリクスを渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 12 | 派生タスク UT21-U02 / U04 / U05 への cross-link を unassigned-task-detection.md に出力 |

## 多角的チェック観点（AIが判断）

- 不変条件 #5: 本仕様書内に `apps/web` から D1 直接アクセスを示唆する記述が混入していないか
- 不変条件 #1 / #7: Sheets 経路を正本へ復活させる記述が混入していないか
- close-out 境界: 本タスクが direct implementation を一切含まず、impl 必要差分はすべて 03a/03b/04c/09b の Phase に委譲されているか
- CLOSED Issue: GitHub Issue #234 を再オープンせず仕様書側に番号のみ記録しているか
- 派生タスク方針: U02 / U04 / U05 が別ファイルとして既に存在し、本仕様書からリンクされているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「legacy umbrella close-out」として再定義 | 1 | spec_created | main.md 冒頭 |
| 2 | 依存境界（上流 2 / 並列 4 / 下流 1）の固定 | 1 | spec_created | 03a/03b/04c/09b interface 明示 |
| 3 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | 不変条件 #1 / #4 / #5 / #7 touched 確認 | 1 | spec_created | index.md と同期 |
| 5 | AC-1〜AC-11 確定 | 1 | spec_created | index.md と完全一致 |
| 6 | stale 前提 5 項目の事前棚卸し | 1 | spec_created | Phase 2 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件・真の論点・因果と境界・依存境界） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件チェックリスト

- [ ] 真の論点が「legacy umbrella close-out」として再定義されている
- [ ] 4条件評価が全 PASS で確定し根拠が記載されている
- [ ] 依存境界表に上流 2・並列 4・下流 1 すべてが前提と出力付きで記述されている
- [ ] AC-1〜AC-11 が index.md と完全一致している
- [ ] stale 前提 5 項目（同期元・単一 endpoint・`GET /admin/sync/audit`・audit table（`sync_audit_logs` + `sync_audit_outbox`）・実装パス）が確認指示として固定されている
- [ ] 不変条件 #1 / #4 / #5 / #7 のいずれにも違反する想定が混入していない
- [ ] GitHub Issue #234 が CLOSED のまま、仕様書内に番号のみ記録されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置予定
- 苦戦想定（同期元差異・audit table 判定難・実装パスずれ・API 境界衝突・CLOSED Issue・legacy umbrella 再発防止）の 6 件が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き継ぎ

- 次 Phase: 2（設計：移植マトリクス設計 + no-new-endpoint-policy）
- 引き継ぎ事項:
  - 真の論点 = legacy umbrella close-out（direct impl への昇格を構造的に阻止）
  - 4条件評価 全 PASS の根拠
  - stale 前提 5 項目の差分認識
  - 有効品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）
  - 派生タスク UT21-U02 / U04 / U05 の境界
  - CLOSED Issue #234 の取り扱い方針
- ブロック条件:
  - 4条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-11 が index.md と乖離
  - stale 前提 5 項目の認識が空欄
  - direct implementation を本タスク内で行う方針が混入している
