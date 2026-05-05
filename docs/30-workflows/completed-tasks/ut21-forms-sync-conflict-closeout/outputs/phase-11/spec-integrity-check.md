# Phase 11 Output: Spec Integrity Check

## メタ

| 項目 | 値 |
| --- | --- |
| 検証対象 | `index.md` ↔ `artifacts.json` ↔ `phase-01〜13.md` ↔ `outputs/phase-XX/*` の三角整合 + aiworkflow-requirements `task-workflow.md` current facts との対応 |
| 実行日時 (UTC) | 2026-04-30T08:13:52Z |
| 期待 | 矛盾 0 件 |
| 結果 | **矛盾 0 件 / PASS** |

---

## §1. index.md ↔ artifacts.json 整合

| 項目 | index.md 値 | artifacts.json 値 | 整合 |
| --- | --- | --- | --- |
| ID | `task-ut21-forms-sync-conflict-closeout-001` | `task-ut21-forms-sync-conflict-closeout-001` | OK |
| ディレクトリ | `docs/30-workflows/ut21-forms-sync-conflict-closeout` | `docs/30-workflows/ut21-forms-sync-conflict-closeout` | OK |
| Wave | 1 | 1 | OK |
| 実行種別 | parallel | parallel | OK |
| 状態 | spec_created | spec_created | OK |
| タスク種別 | docs-only / specification-cleanup | docs-only / specification-cleanup | OK |
| visualEvidence | NON_VISUAL | NON_VISUAL | OK |
| priority | HIGH | HIGH | OK |
| GitHub Issue | #234 (CLOSED) | `{ number: 234, state: "CLOSED" }` | OK |
| AC 件数 | 11（AC-1〜AC-11） | 11 | OK |
| 派生タスク | U02 / U04 / U05 | `downstreamDerivedTasks` 3 件 | OK |
| invariantsTouched | #1 / #4 / #5 / #7 | `[1, 4, 5, 7]` | OK |

> 全 12 項目整合。

## §2. artifacts.json ↔ phase-XX.md ↔ outputs/phase-XX/* 整合（phases[]）

| Phase | file（artifacts.json） | 実体 phase-XX.md | primaryArtifact（artifacts.json） | 実体 outputs/* |
| --- | --- | --- | --- | --- |
| 1 | phase-01.md | OK | outputs/phase-01/main.md | OK |
| 2 | phase-02.md | OK | outputs/phase-02/migration-matrix-design.md | OK |
| 3 | phase-03.md | OK | outputs/phase-03/main.md | OK |
| 4 | phase-04.md | OK | outputs/phase-04/test-strategy.md | OK |
| 5 | phase-05.md | OK | outputs/phase-05/implementation-runbook.md | OK |
| 6 | phase-06.md | OK | outputs/phase-06/failure-cases.md | OK |
| 7 | phase-07.md | OK | outputs/phase-07/ac-matrix.md | OK |
| 8 | phase-08.md | OK | outputs/phase-08/main.md | OK |
| 9 | phase-09.md | OK | outputs/phase-09/main.md | OK |
| 10 | phase-10.md | OK | outputs/phase-10/go-no-go.md | OK |
| 11 | phase-11.md | OK | outputs/phase-11/main.md | OK（本ファイル群） |
| 12 | phase-12.md | OK | outputs/phase-12/main.md | OK（既存） |
| 13 | phase-13.md | OK | outputs/phase-13/pr-info.md | OK（既存） |

> 13 phases × 2 列（file / primaryArtifact）= 26 件すべて存在・整合。

## §3. AC（受入条件）の双方向整合

| AC | artifacts.json 記載 | index.md / phase-XX.md での扱い | 整合 |
| --- | --- | --- | --- |
| AC-1 | UT-21 stale 前提 5 項目を差分表として固定 | phase-01.md / phase-02.md / phase-08.md SSOT で 5 項目固定 | OK |
| AC-2 | 有効品質要件 4 種を 03a/03b/04c/09b に一意割当 | phase-02 migration-matrix-design.md §有効品質要件 | OK |
| AC-3 | POST /admin/sync / GET /admin/sync/audit を新設しない方針が双方明記 | phase-02 no-new-endpoint-policy.md / UT-21 legacy 状態欄 | OK |
| AC-4 | sync_audit_logs / sync_audit_outbox は U02 判定後まで保留 | phase-02 no-new-endpoint-policy.md §保留方針 / U02 (`task-ut21-sync-audit-tables-necessity-judgement-001`) | OK |
| AC-5 | 後続 U02/U04/U05 が別ファイルでリンク | unassigned-task/ 配下 3 件存在（manual-smoke-log §3） | OK |
| AC-6 | 03a/03b/04c/09b 受入条件への patch 案が Phase 5 で提示 | phase-05/implementation-runbook.md §04c §09b 等 | OK |
| AC-7 | aiworkflow-requirements current facts との矛盾なし | 本ファイル §4（後段の対応表） | OK |
| AC-8 | 4 条件最終判定 PASS | phase-09 main.md / phase-10 go-no-go.md | OK |
| AC-9 | 不変条件 #5 違反なし | manual-smoke-log §5（hit 33 件すべて禁止文脈） | OK |
| AC-10 | 検証コマンド出力根拠が記録 | manual-smoke-log §1〜§7 | OK |
| AC-11 | GitHub Issue #234 CLOSED 維持 | manual-smoke-log §6（state=CLOSED） | OK |

> 11 AC すべて整合。Phase 7 ac-matrix.md とも一致。

## §4. aiworkflow-requirements `task-workflow.md` current facts ↔ 本仕様書の差分表対応

`task-workflow.md:9` の文言:

> 2026-04-30 時点で `UT-21`（Sheets→D1 sync endpoint 実装と audit logging）は legacy umbrella として close-out 済み。現行正本は Forms sync（`forms.get` / `forms.responses.list`、`POST /admin/sync/schema` / `POST /admin/sync/responses`、`sync_jobs` ledger、`apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`）であり、単一 `POST /admin/sync`、`GET /admin/sync/audit`、`sync_audit_logs`、`sync_audit_outbox` は新設しない。UT-21 由来の有効品質要件は 03a / 03b / 04c / 09b へ移植し、audit table 要否・実環境 smoke・実装パス境界は UT21-U02 / U04 / U05 に分離する。

| 軸 | task-workflow.md の current fact | 本仕様書の差分表（After / SSOT） | 整合 |
| --- | --- | --- | --- |
| 同期元 | Forms API（`forms.get` / `forms.responses.list`） | phase-08 §SSOT「同期元 = Google Forms API（`forms.get` / `forms.responses.list`）」 | OK |
| endpoint | `POST /admin/sync/schema` / `POST /admin/sync/responses`（2 系統） | phase-02 migration-matrix §endpoint「単一 `POST /admin/sync` を新設しない」「03a / 03b の 2 系統」 | OK |
| ledger | `sync_jobs` | phase-08 §SSOT「`sync_jobs` ledger」/ phase-02 §audit | OK |
| 実装パス | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` | phase-08 §SSOT 同記述 / phase-01 §5 stale 前提表 | OK |
| 新設しない対象 | 単一 `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` | phase-02 no-new-endpoint-policy §禁止対象 4 項目 | OK |
| 有効品質要件移植先 | 03a / 03b / 04c / 09b | phase-02 migration-matrix-design §移植マトリクス（4 種 × 移植先 4） | OK |
| 派生タスク | UT21-U02 / U04 / U05 | index.md / artifacts.json `downstreamDerivedTasks` / unassigned-task/ 3 件 | OK |

> 7 軸すべて矛盾 0。Phase 12 の system-spec-update-summary Step 1-A の「skill facts への close-out 済追記」は既に適用済み（task-workflow.md:9）であることを再確認。

## §5. UT-21 legacy 仕様書 ↔ 本仕様書 整合

| 軸 | UT-21 legacy（行 11） | 本仕様書 | 整合 |
| --- | --- | --- | --- |
| 状態 | `legacy / close-out 済` | index.md「legacy umbrella close-out」 | OK |
| 吸収先 | `task-ut21-forms-sync-conflict-closeout-001` | 本タスク ID と一致 | OK |
| 新設しない対象 | 単一 `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` | phase-02 no-new-endpoint-policy §禁止対象 と完全一致 | OK |
| 移植先 | 03a / 03b / 04c / 09b | index.md「組み込み先」と一致 | OK |
| 組み込み先パス | `docs/30-workflows/ut21-forms-sync-conflict-closeout/` | 本ディレクトリと一致 | OK |

> 5 軸すべて整合。

## §6. 不変条件 touch 整合

| 不変条件 | artifacts.json `invariantsTouched` | 本仕様書での扱い | 整合 |
| --- | --- | --- | --- |
| #1（schema 固定しすぎない） | 1 | phase-01 / phase-09 で抵触 0 確認 | OK |
| #4（admin-managed data 分離） | 4 | phase-02 migration-matrix で Sheets 経路排除 | OK |
| #5（D1 直接アクセスは apps/api 限定） | 5 | manual-smoke-log §5 で違反 0 確認 | OK |
| #7（Forms 再回答が本人更新の正式経路） | 7 | phase-09 / phase-10 で確認 | OK |

## 総合判定

| 検証 | 結果 |
| --- | --- |
| index.md ↔ artifacts.json 整合 | PASS（12 項目） |
| artifacts.json ↔ phase-XX.md ↔ outputs/* 整合 | PASS（13 phases × 2 列） |
| AC（11 件）双方向整合 | PASS |
| aiworkflow-requirements current facts 対応（7 軸） | PASS |
| UT-21 legacy 整合（5 軸） | PASS |
| 不変条件 touch（4 項目） | PASS |
| **総合** | **PASS / 矛盾 0** |

> Phase 12（ドキュメント更新）への引き継ぎ：本 §3 の AC 整合表と §4 の current facts 対応表を `outputs/phase-12/system-spec-update-summary.md` の検証根拠としてリンクする。
