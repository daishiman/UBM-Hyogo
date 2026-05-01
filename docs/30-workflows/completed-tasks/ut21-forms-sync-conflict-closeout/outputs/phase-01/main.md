# Phase 1 Output: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 1 / 13（要件定義） |
| taskType | docs-only / specification-cleanup（legacy umbrella close-out） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| GitHub Issue | #234（CLOSED のまま、再オープンしない） |
| 作成日 | 2026-04-30 |

## 1. scope（最終確定）

UT-21（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）を Sheets→D1 direct implementation として進めず、有効な品質要件のみを 03a / 03b / 04c / 09b の 4 タスクへ吸収する legacy umbrella close-out として閉じる。

### 含む

- UT-21 stale 前提 5 項目（同期元 / 単一 endpoint / `GET /admin/sync/audit` / audit table（`sync_audit_logs` + `sync_audit_outbox`） / 実装パス）と現行正本の差分認識
- 有効品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）の 03a / 03b / 04c / 09b への移植先割当
- `POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針の明文化
- `sync_audit_logs` / `sync_audit_outbox` の新設を UT21-U02 判定まで保留する旨の記述
- 03a / 03b / 04c / 09b の受入条件 patch 案の提示（Phase 5。実適用は各タスクの Phase）
- aiworkflow-requirements skill `task-workflow.md` の current facts との整合確認
- UT21-U02 / U04 / U05 後続タスクの cross-link 確認

### 含まない

- Google Sheets API v4 の正本仕様への復活
- `sync_audit_logs` / `sync_audit_outbox` の新設（U02 判定まで保留）
- `POST /admin/sync` / `GET /admin/sync/audit` の新設
- 新規 sync 実装コード追加（実装は 03a / 03b / 04c / 09b の各 Phase で実施）
- UT-21 仕様書本体（legacy）の削除・改編
- commit / push / PR 作成（Phase 13 で user 承認後にのみ実施）

## 2. 真の論点（true issue）

「UT-21 を実装すること」ではなく、**UT-21 当初仕様を direct implementation に昇格させずに、有効な品質要件 4 種のみを既存 4 タスク（03a / 03b / 04c / 09b）の受入条件に吸収しつつ、Sheets sync 系の新規実装誘惑を仕様書側でロックする** ことが本タスクの本質。

副次的論点:

1. `sync_audit_logs` / `sync_audit_outbox` を即新設するか、`sync_jobs` ledger だけで足りるかの判断は本タスクでは行わず、UT21-U02 へ委譲する境界を Phase 1 で明示する。
2. UT-21 が想定する `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 一式と現行 `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` の境界整理は UT21-U05 へ委譲する。
3. CLOSED Issue #234 を再オープンせず、仕様書側に番号のみを記録する運用を確立する。

## 3. 因果と境界

| 観点 | 内容 |
| --- | --- |
| 原因 | UT-21 起票時点では Sheets API v4 が同期元想定。その後 `task-sync-forms-d1-legacy-umbrella-001` の流れで Forms sync が現行正本に昇格し、03a / 03b / 04c / 09b に分解された |
| 結果（放置時） | 実装者が UT-21 仕様書だけを読み、Sheets API クライアント / `sync_audit_logs` + `sync_audit_outbox` / 単一 `POST /admin/sync` を二重正本化として実装してしまうリスク |
| 境界（本タスクが扱う） | 仕様書の差分明文化 / 移植マトリクス / no-new-endpoint-policy / 派生タスク（U02 / U04 / U05）リンクのみ |
| 境界（本タスクが扱わない） | 03a / 03b / 04c / 09b の受入条件への実 patch 適用、sync 実装コード追加、UT-21 仕様書本体の編集・削除 |

## 4. 依存境界（上流 2 / 並列 4 / 下流 1）

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | 旧 UT-09 close-out 形式 | 同形式の close-out として本タスクを構造化 |
| 上流 | aiworkflow-requirements skill `task-workflow.md` | D1 / sync_jobs / deployment current facts | 本仕様書内の差分根拠として参照（差分なしを Phase 2 で確認） |
| 並列 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | `forms.get` / `POST /admin/sync/schema` 正本 | 409 排他 / D1 retry の受入条件 patch 案 |
| 並列 | 03b-parallel-forms-response-sync-and-current-response-resolver | `forms.responses.list` / `POST /admin/sync/responses` 正本 | 409 排他 / D1 retry の受入条件 patch 案 |
| 並列 | 04c-parallel-admin-backoffice-api-endpoints | Bearer guard / admin endpoint expose 正本 | Bearer guard middleware の受入条件 patch 案 |
| 並列 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | cron / runbook / smoke 正本 | manual smoke runbook の受入条件 patch 案 |
| 下流 | UT21-U02 / UT21-U04 / UT21-U05 派生タスク | 本タスクから委譲する境界 | 別ファイル化された後続タスクへ cross-link |

## 5. UT-21 stale 前提 5 項目（事前棚卸し / Phase 2 入力）

| # | UT-21 stale 前提 | 現行正本（Phase 1 認識） |
| --- | --- | --- |
| 1 | 同期元 = Google Sheets API v4 (`spreadsheets.values.get`) | Google Forms API (`forms.get` / `forms.responses.list`) |
| 2 | 単一 `POST /admin/sync` endpoint | `POST /admin/sync/schema`（03a） + `POST /admin/sync/responses`（03b）の 2 系統 |
| 3 | `GET /admin/sync/audit` 公開 endpoint | `sync_jobs` ledger を admin UI 経由で内部参照（公開 endpoint なし） |
| 4 | `sync_audit_logs` / `sync_audit_outbox` 二段監査テーブル | `sync_jobs` ledger（`status` / `job_kind` / `metrics_json` / `started_at` / `finished_at`） |
| 5 | 実装パス `apps/api/src/sync/{core,manual,scheduled,audit}.ts` | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` |

> 上記 5 項目の差分要因と取り扱い方針は Phase 2 `migration-matrix-design.md` で「stale 前提 / 現行正本 / 差分要因 / 取り扱い」の 4 列に固定する。

## 6. 有効品質要件 4 種（Phase 2 移植マトリクス入力）

| 要件 | UT-21 由来観点 | 移植先タスク（Phase 1 確定） |
| --- | --- | --- |
| Bearer guard | 401 / 403 / 200 認可境界 | 04c-parallel-admin-backoffice-api-endpoints |
| 409 排他 | `sync_jobs.status='running'` 同種 job 衝突 | 03a / 03b（job_kind ごとに排他） |
| D1 retry | `SQLITE_BUSY` backoff / 短い transaction / batch-size 制限 | 03a / 03b |
| manual smoke | 実 secrets / 実 D1 環境での実行 | 09b runbook + 09a / 09c smoke |

## 7. 4条件評価（全 PASS）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 二重正本化リスクを構造的に排除し、03a / 03b / 04c / 09b の品質要件を一意に固定する。Sheets 経路への復帰誘惑を no-new-endpoint-policy で構造的にロックする |
| 実現性 | PASS | docs-only / 既存仕様参照のみで完結。新規 Secret / 新規実装 / 新規テーブル / 新規 endpoint は不要。CI / Cloudflare 利用増加ゼロ |
| 整合性 | PASS | 不変条件 #1 / #4 / #5 / #7 を侵さず、`POST /admin/sync` / `GET /admin/sync/audit` 新設禁止と `sync_audit_logs` / `sync_audit_outbox` 新設保留が明示されている。姉妹 close-out `task-sync-forms-d1-legacy-umbrella-001` と同形式 |
| 運用性 | PASS | 後続タスク UT21-U02 / U04 / U05 が別ファイル化済みで派生スコープの引き継ぎ経路が明確。CLOSED Issue #234 を再オープンせず仕様書 cross-link で運用 |

## 8. 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | UT-21 の Sheets 列インデックス前提を排除し、Forms `responseId` ベース冪等キーを正本として固定 |
| #4 | Form schema 外データは admin-managed として分離 | `sync_jobs` ledger の admin-managed 性質を再確認 |
| #5 | D1 直接アクセスは `apps/api` に閉じる | UT-21 の `apps/api/src/sync/*` 想定を排除し、現行 `apps/api/src/jobs/*` + `apps/api/src/sync/schema/*` を正本確認。`apps/web` から D1 への直接アクセス言及はゼロ |
| #7 | MVP では Google Form 再回答を本人更新の正式経路とする | sync 経路が Forms→D1 一方向であることを再確認 |

## 9. AC-1〜AC-11 トレース（index.md と同期）

| AC | 内容 | Phase 1 での位置 |
| --- | --- | --- |
| AC-1 | UT-21 stale 前提 5 項目が差分表として固定されている | §5（Phase 2 で 4 列差分表へ拡張） |
| AC-2 | 有効品質要件 4 種の移植先が 03a/03b/04c/09b に一意割当 | §6（Phase 2 で 8 列マトリクスへ拡張） |
| AC-3 | `POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針 | §1 含まない / §3 境界 / §10 検証コマンド |
| AC-4 | `sync_audit_logs` / `sync_audit_outbox` の新設は U02 判定まで保留 | §1 含まない / §10 検証コマンド |
| AC-5 | UT21-U02 / U04 / U05 が `unassigned-task/` に存在し本仕様書からリンク | §11 派生タスクリンク |
| AC-6 | 03a/03b/04c/09b 受入条件への移植 patch 案 | Phase 5 へ委譲（本 Phase は最小フィールド要件を §6 で予告） |
| AC-7 | aiworkflow-requirements `task-workflow.md` current facts と矛盾なし | §10 で確認結果を記録 |
| AC-8 | 4条件最終判定が PASS | §7 |
| AC-9 | 不変条件 #5 違反なし | §8 |
| AC-10 | 検証コマンド出力に基づく差分根拠が記録されている | §10 |
| AC-11 | GitHub Issue #234 が CLOSED 状態のまま参照可能 | §11 / メタ情報 |

## 10. AC-10 検証コマンド実行ログ

実行コマンド:

```bash
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows/02-application-implementation \
  .claude/skills/aiworkflow-requirements/references
```

実行結果サマリー（2026-04-30 実行）:

| パターン | ヒット箇所種別 | 解釈 |
| --- | --- | --- |
| `POST /admin/sync\b` | `02-application-implementation/{08a,09a,09b,09c,07c}/...` および `_design/phase-2-design.md`、`api-endpoints.md`、`lessons-learned-03b-...md` 内のヒットはすべて **`POST /admin/sync/schema` / `POST /admin/sync/responses` の分割 endpoint** への参照（後続にスラッシュが続く）。`task-workflow.md:9` に「単一 `POST /admin/sync` を新設しない」旨の close-out 注記あり | 単一 `POST /admin/sync` を「新設すべき」とする記述は **0 件**。AC-3 整合 |
| `GET /admin/sync/audit` | `task-workflow.md:9` の close-out 注記内（「新設しない」文脈）のみ | 公開 audit endpoint を新設すべきとする記述は **0 件**。AC-3 整合 |
| `sync_audit_logs` | `task-workflow.md:9` の close-out 注記内のみ | テーブル新設を要求する記述は **0 件**。AC-4 整合 |
| `sync_audit_outbox` | `task-workflow.md:9` の close-out 注記内のみ | テーブル新設を要求する記述は **0 件**。AC-4 整合 |

差分根拠:

- 03a / 03b / 04c / 09a / 09b / 09c / 07c / 08a の正本仕様は **すべて分割 endpoint** (`POST /admin/sync/schema` / `POST /admin/sync/responses`) を参照しており、単一 `POST /admin/sync` への昇格圧力は仕様書空間に存在しない。
- `task-workflow.md` の current facts は本タスクの方針（単一 endpoint・公開 audit endpoint・audit テーブルを新設しない）と完全一致。AC-7 PASS。
- `lessons-learned-03b-response-sync-2026-04.md:51` は cron と分割 endpoint の同時起動による update 順序問題を扱っており、Sheets sync 仕様への回帰圧ではない。

## 11. 派生タスクおよび関連リンク（AC-5 / AC-11）

| リンク種別 | パス / URL |
| --- | --- |
| 上位 index | `docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md` |
| 原典 close-out spec | `docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md` |
| 原典 UT-21 当初仕様（legacy） | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` |
| 姉妹 close-out | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` |
| UT21-U02（audit 必要性判定） | `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md` |
| UT21-U04（実環境 smoke 再実行） | `docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md` |
| UT21-U05（実装パス境界整理） | `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md` |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/234（CLOSED、再オープンしない） |

## 12. 次 Phase への引き継ぎ

- 真の論点 = legacy umbrella close-out（direct impl への昇格を構造的に阻止）
- 4条件評価 全 PASS の根拠（§7）
- stale 前提 5 項目の差分認識（§5）
- 有効品質要件 4 種（§6）
- 派生タスク UT21-U02 / U04 / U05 の境界（§11）
- AC-10 検証コマンド出力（§10）
- ブロック条件: 4条件のいずれかが MINOR/MAJOR、AC-1〜AC-11 が index.md と乖離、stale 前提 5 項目の認識が空欄、direct implementation を本タスク内で行う方針が混入している
