# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 4 (followup, serial) |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |

## 目的

Phase 1 で確定した AC 11 件と Phase 3 で確定した採用案 C（列追加 + repository guard + partial index）を、unit / contract / E2E / authorization の 4 軸 verify suite に分解する。`hasPendingRequest` の挙動移行（最新行存在 → `request_status='pending'` 限定）と state transition の構造的強制を、Phase 5 実装の assertion 文言に直接対応させるテスト計画として固定する。

## 実行タスク

1. verify suite の 4 軸（unit / contract / E2E / authorization）の責務分担と実行ツールの確定
2. AC 11 件 × 検証手段マトリクスの作成（行 = AC、列 = layer）
3. 主要テストケース 12 件以上の test name / 入力 / 期待値の確定
4. state transition 構造的拒否テスト（resolved → resolved / rejected → resolved / general → resolved）の網羅
5. partial index hit を `EXPLAIN QUERY PLAN` で検証する手順の確定
6. backfill 完了確認の検証 SQL（取りこぼし 0 件）の test 化
7. 不変条件 #4 / #5 / #11 へのテスト観点の紐付け
8. テスト fixture 戦略（既存 `admin_member_notes` fixture との整合）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | AC 11 件・状態遷移表 |
| 必須 | phase-02.md | repository helper interface・DDL 草案・partial index |
| 必須 | phase-03.md | 採用案 C のリスク 5 件（テストでカバー） |
| 必須 | apps/api/src/repository/__tests__/adminNotes.test.ts | 既存 test と fixture の体裁 |
| 必須 | apps/api/src/routes/me/index.test.ts | 04b の route test 体裁 |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | queue 状態遷移の正本 |
| 参考 | docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/phase-04.md | 5 層 verify suite の体裁参考 |

## verify suite 設計

| layer | tool | scope | 主な担保 AC |
| --- | --- | --- | --- |
| unit (repository) | vitest + miniflare D1 | `hasPendingRequest` / `markResolved` / `markRejected` の挙動・SQL 実行結果 | AC-3 / AC-4 / AC-5 / AC-6 |
| contract (route) | vitest + Hono test client | `POST /me/visibility-request` / `POST /me/delete-request` の status / response shape | AC-7 / AC-8 |
| E2E (migration smoke) | `bash scripts/cf.sh d1 migrations apply` + 検証 SQL | migration 0007 適用後の DB 構造・backfill 結果・partial index 存在 | AC-1 / AC-2 / AC-9 |
| authorization | vitest + Hono test client | `markResolved` / `markRejected` 自体は admin context 前提だが、本タスクでは route の admin gate 経路を間接検証 | AC（呼出側責務、本タスクは helper 受け入れ前提のみ） |

> **本タスクのスコープ確認**: 07a / 07c の admin route 自体は別タスク。本 Phase では「helper が admin_id 引数を必須に取る contract」「helper が admin context 外で呼ばれてもガードしないが state transition で誤更新しない」までを保証する。

## AC × 検証手段マトリクス

| AC | 概要 | unit | contract | E2E | authz |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 3 列追加 + general 行 NULL 維持 | - | - | migration smoke + `PRAGMA table_info` | - |
| AC-2 | 既存 request 行を全て pending に backfill | - | - | 検証 SQL (`COUNT WHERE request_status IS NULL`) | - |
| AC-3 | `hasPendingRequest` が pending 限定 true | `adminNotes.hasPendingRequest_*` | - | - | - |
| AC-4 | `markResolved` で resolved + メタ更新 / general は null | `adminNotes.markResolved_*` | - | - | - |
| AC-5 | `markRejected` で rejected + reason 追記 | `adminNotes.markRejected_*` | - | - | - |
| AC-6 | 状態遷移単方向（pending のみ更新可） | `adminNotes.markResolved_rejects_*` | - | - | - |
| AC-7 | resolved のみの状態で再申請 → 202 | - | `me.request.reapply_after_resolved` | - | - |
| AC-8 | pending 既存で再申請 → 409 | - | `me.request.duplicate_pending_409` | - | - |
| AC-9 | partial index 作成 + EXPLAIN で hit | - | - | `EXPLAIN QUERY PLAN` | - |
| AC-10 | typecheck / lint / vitest green | - | - | CI スクリプト | - |
| AC-11 | spec 07 に状態遷移節追記 | - | - | docs lint（手動目視） | - |

## 主要テストケース

| # | test name | layer | 入力 | 期待 |
| --- | --- | --- | --- | --- |
| 1 | `adminNotes.hasPendingRequest_returns_true_when_pending_exists` | unit | pending 行 1 件 + (member, type) | `true` |
| 2 | `adminNotes.hasPendingRequest_returns_false_when_only_resolved` | unit | resolved 行のみ | `false`（再申請可能を担保 / AC-3） |
| 3 | `adminNotes.hasPendingRequest_returns_false_when_only_rejected` | unit | rejected 行のみ | `false` |
| 4 | `adminNotes.markResolved_updates_pending_row` | unit | pending 行 + adminId | 戻り値 = noteId、`request_status='resolved'`、`resolved_at` 設定、`resolved_by_admin_id=adminId` |
| 5 | `adminNotes.markResolved_returns_null_for_general_row` | unit | general 行 | 戻り値 = `null`、UPDATE 0 件 |
| 6 | `adminNotes.markResolved_rejects_already_resolved` | unit | 既に resolved 行 | 戻り値 = `null`、UPDATE 0 件（構造的拒否 / AC-6） |
| 7 | `adminNotes.markResolved_rejects_already_rejected` | unit | rejected 行 | 戻り値 = `null`、UPDATE 0 件 |
| 8 | `adminNotes.markRejected_appends_reason_to_body` | unit | pending 行 + reason | body 末尾に reason 追記、`request_status='rejected'` |
| 9 | `adminNotes.markRejected_validates_admin_id` | unit | adminId 空文字 | 呼出側責務だが helper は noteId 引数で UPDATE 実行、`resolved_by_admin_id` 列に空文字が入らないことを呼出契約として明示（zod は 07a/07c 側） |
| 10 | `me.request.reapply_after_resolved_returns_202` | contract | resolved 行のみ持つ member が POST | 202 + 新規 pending 行 INSERT（AC-7） |
| 11 | `me.request.duplicate_pending_returns_409` | contract | pending 行存在中の同 member 再 POST | 409 DUPLICATE_PENDING_REQUEST（AC-8） |
| 12 | `migration.0007.backfill_no_orphan` | E2E | 既存 request 行が混在する D1 | `SELECT COUNT(*) WHERE note_type IN (...) AND request_status IS NULL` = 0（AC-2） |
| 13 | `migration.0007.partial_index_hit` | E2E | EXPLAIN QUERY PLAN | `USING INDEX idx_admin_notes_pending_requests` を含む（AC-9） |
| 14 | `migration.0007.general_row_nulls_preserved` | E2E | general 行存在 | `request_status` / `resolved_at` / `resolved_by_admin_id` が全て NULL（AC-1） |

## state transition 構造的拒否テスト（重要）

採用案 C のキーは「`UPDATE ... WHERE request_status='pending'` で誤遷移を 0 件更新で防ぐ」点。下記を unit test で網羅する。

| from | 呼出 | 期待 |
| --- | --- | --- |
| pending | markResolved | UPDATE 1 件 / 戻り値 noteId |
| pending | markRejected | UPDATE 1 件 / 戻り値 noteId |
| resolved | markResolved | UPDATE 0 件 / 戻り値 null |
| resolved | markRejected | UPDATE 0 件 / 戻り値 null |
| rejected | markResolved | UPDATE 0 件 / 戻り値 null |
| rejected | markRejected | UPDATE 0 件 / 戻り値 null |
| general (NULL) | markResolved | UPDATE 0 件 / 戻り値 null |
| general (NULL) | markRejected | UPDATE 0 件 / 戻り値 null |
| 不存在 noteId | markResolved | UPDATE 0 件 / 戻り値 null |

## partial index 検証手順（E2E）

```sql
-- 適用後に local D1 で実行
EXPLAIN QUERY PLAN
SELECT 1 FROM admin_member_notes
 WHERE member_id = 'mem_test_01'
   AND note_type = 'visibility_request'
   AND request_status = 'pending'
 LIMIT 1;
-- 期待: SEARCH ... USING INDEX idx_admin_notes_pending_requests
```

## fixture 戦略

| fixture | 用途 | 配置 |
| --- | --- | --- |
| `pendingVisibilityRequest` | AC-3 / AC-6 の前提 | `apps/api/src/repository/__tests__/fixtures/adminNotes.ts` |
| `resolvedVisibilityRequest` | AC-3 / AC-7 の前提 | 同上 |
| `rejectedDeleteRequest` | AC-6 の前提 | 同上 |
| `generalNote` | AC-4 の null 戻り値検証 | 同上 |

既存 fixture（04b で導入）に `requestStatus` / `resolvedAt` / `resolvedByAdminId` フィールドを追加し、後方互換のため省略時は NULL とする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | テスト計画 14 件を assertion 文言に変換し、実装ランブックの sanity check に組込み |
| Phase 6 | failure case のうち unit / contract で確認するものをここで定義済み（401 / 403 / 422 / 5xx） |
| Phase 7 | AC × 検証マトリクスをトレース表のソースに |
| Phase 9 | typecheck / lint / vitest 全件 green を gate 化 |

## 多角的チェック観点

| 不変条件 | テスト観点 | 検証方法 |
| --- | --- | --- |
| #4 | `member_responses` への書き込みが test 中に発生しないこと | unit test 後の `member_responses` row 数 unchanged |
| #5 | テストは `apps/api` 配下からのみ D1 操作 | test ファイル配置 grep |
| #11 | `markResolved` / `markRejected` 後に member 本文（`response_fields`）が unchanged | 別 fixture の確認 SELECT |
| 認可 | helper は `adminId` 引数を必須にする contract | unit test の引数 type で担保 |
| 無料枠 | partial index 範囲が pending 行のみ | E2E `EXPLAIN QUERY PLAN` で hit 確認 |
| backfill 整合 | request 行に NULL 残らない | E2E 検証 SQL |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 軸 verify suite 設計 | 4 | pending | unit/contract/E2E/authz |
| 2 | AC × 検証マトリクス | 4 | pending | 11 行 |
| 3 | 主要テストケース | 4 | pending | 14 件 |
| 4 | state transition 拒否テスト | 4 | pending | 9 行 |
| 5 | partial index 検証手順 | 4 | pending | EXPLAIN |
| 6 | fixture 戦略 | 4 | pending | 4 fixture |
| 7 | 不変条件テスト紐付 | 4 | pending | #4/#5/#11 |
| 8 | backfill 検証 SQL | 4 | pending | 0 件確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略サマリ |
| ドキュメント | outputs/phase-04/test-strategy.md | 4 軸 + AC マトリクス + 14 ケース |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] verify suite 4 軸が責務とツールで明確化
- [ ] AC 11 件すべてに検証手段が割り当て
- [ ] 主要テストケース 14 件以上に test name / 入力 / 期待値
- [ ] state transition 拒否テストが 9 行（pending/resolved/rejected/general × markResolved/markRejected の組合せ）
- [ ] partial index 検証手順が `EXPLAIN QUERY PLAN` で記述
- [ ] 不変条件 #4 / #5 / #11 にテスト観点が紐付く

## タスク100%実行確認

- [ ] 全実行タスク 8 件 completed
- [ ] artifacts.json で phase 4 を completed
- [ ] outputs/phase-04/test-strategy.md が Phase 5 実装ランブックの assertion 文言として参照可能

## 次 Phase への引き渡し

- 次: 5 (実装ランブック)
- 引き継ぎ: テスト計画 14 件 → 実装の擬似コードに対する assertion / sanity check の入力
- ブロック条件: AC × 検証手段の対応漏れがある / state transition 拒否テストが 9 行未満 / partial index 検証手順未確定 のいずれかが残る場合は Phase 4 へ差し戻し
