# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 4 (followup, serial) |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed |

## 目的

Phase 1 で確定した AC 11 件を、Phase 4 検証手段 / Phase 5 実装箇所 / Phase 6 異常系 / 不変条件にそれぞれトレースし、各 AC に「http status / DB 事後状態 / helper 戻り値」のトリプルを quantitative に紐付ける。Phase 10 / 13 のゲート判定の一次資料として機能する。

## 実行タスク

1. AC 11 件 × 検証 × 実装 × 異常系の 4 列マトリクス作成
2. 各 AC に「http status / DB 事後状態 / helper 戻り値」のトリプル付与
3. 不変条件 #4 / #5 / #11 と AC の対応マッピング
4. 抜け漏れチェック（全 AC に検証手段・実装位置・トリプルがあるか）
5. Phase 10 ゲート判定への入力整理

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | AC 11 件の正本 |
| 必須 | phase-01.md | AC quantitative 定義 |
| 必須 | phase-04.md | 検証手段 14 件 |
| 必須 | phase-05.md | 実装箇所（migration / repository / route） |
| 必須 | phase-06.md | failure case 14 件 |
| 参考 | docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/phase-07.md | マトリクス体裁 |

## AC マトリクス（11 行 × 4 列）

| AC | 内容 | 検証 (Phase 4) | 実装 (Phase 5) | 異常系 (Phase 6) | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 3 列追加 + general 行 NULL 維持 | E2E `migration.0007.general_row_nulls_preserved` + `PRAGMA table_info` | `migrations/0007_admin_member_notes_request_status.sql` の `ALTER TABLE` 3 行 + helper の `WHERE request_status='pending'` | case 10 (ALTER 失敗) / case 8 (general 行) | #4 |
| AC-2 | 既存 request 行 全て pending に backfill | E2E `migration.0007.backfill_no_orphan` (`COUNT WHERE IS NULL`=0) | migration 0007 の `UPDATE ... WHERE IS NULL` | case 11 (backfill 部分失敗) | #4 |
| AC-3 | `hasPendingRequest` が pending 限定 true | unit `hasPendingRequest_returns_true_when_pending_exists`, `_false_when_only_resolved`, `_false_when_only_rejected` | `repository/adminNotes.ts::hasPendingRequest` の `WHERE request_status='pending'` | - | #4 |
| AC-4 | `markResolved` で resolved + メタ更新 / general は null | unit `markResolved_updates_pending_row`, `_returns_null_for_general_row` | `repository/adminNotes.ts::markResolved` | case 8 (general 行) / case 13 (adminId) | #11 |
| AC-5 | `markRejected` で rejected + reason 追記 | unit `markRejected_appends_reason_to_body` | `repository/adminNotes.ts::markRejected` | case 7 (reason 空) | #11 |
| AC-6 | 状態遷移単方向（pending のみ更新可） | unit `markResolved_rejects_already_resolved`, `_already_rejected` | 全 helper の `WHERE request_status='pending'` 述語 | case 5 / case 6 / case 14 (競合) | #11 |
| AC-7 | resolved のみの状態で再申請 → 202 | contract `me.request.reapply_after_resolved_returns_202` | `routes/me/services.ts::memberSelfRequestQueue`（透過的） | - | - |
| AC-8 | pending 既存で再申請 → 409 | contract `me.request.duplicate_pending_returns_409` | `routes/me/services.ts::memberSelfRequestQueue`（透過的） | case 4 | - |
| AC-9 | partial index 作成 + EXPLAIN で hit | E2E `migration.0007.partial_index_hit` | migration 0007 の `CREATE INDEX IF NOT EXISTS idx_admin_notes_pending_requests` | case 12 | #5 |
| AC-10 | typecheck / lint / vitest 全件 green | CI（Phase 9） | 全実装ファイル | case 9 (D1 5xx) | - |
| AC-11 | spec 07 に状態遷移節追記 | docs lint（手動目視） | `docs/00-getting-started-manual/specs/07-edit-delete.md` | - | #4 / #11 |

## AC × トリプル（http status / DB 事後状態 / helper 戻り値）

| AC | http status | DB 事後状態 | helper 戻り値 |
| --- | --- | --- | --- |
| AC-1 | -（migration） | `admin_member_notes` に 3 列追加、general 行は migration 後も 3 列とも NULL。helper 経由では request 状態へ遷移しない | - |
| AC-2 | -（migration） | request 行は全て `request_status='pending'`、`COUNT WHERE IS NULL=0` | - |
| AC-3 | -（helper） | 不変 | pending 行 1 件以上 → `true` / それ以外 → `false` |
| AC-4 | -（helper） | pending → `request_status='resolved'` / `resolved_at=Date.now()` / `resolved_by_admin_id=adminId` / `updated_at`=ISO / `updated_by`=adminId | pending 対象 → `noteId` / それ以外 → `null` |
| AC-5 | -（helper） | pending → `request_status='rejected'` / `body` 末尾に `[rejected <iso>] <reason>` 追記 / メタ列同上 | pending 対象 → `noteId` / それ以外 → `null` |
| AC-6 | -（helper） | resolved/rejected/general 行は **不変**（UPDATE 0 件） | `null` |
| AC-7 | 202 Accepted | resolved 行は不変、新規 `pending` 行 1 件 INSERT | - |
| AC-8 | 409 Conflict (DUPLICATE_PENDING_REQUEST) | DB 不変、INSERT なし | `hasPendingRequest=true` |
| AC-9 | -（DDL） | `idx_admin_notes_pending_requests` が `sqlite_master` に存在 / EXPLAIN 出力に index 名を含む | - |
| AC-10 | -（CI） | - | typecheck/lint/vitest 終了コード 0 |
| AC-11 | -（docs） | - | spec 07 に Mermaid + `request_status` 値定義あり |

## 不変条件 → AC マッピング

| 不変条件 | 対応 AC | 担保 |
| --- | --- | --- |
| #4 (response_fields 不変 / 申請別テーブル化) | AC-1, AC-2, AC-3, AC-11 | DDL 対象が `admin_member_notes` のみ、`hasPendingRequest` は note 行を読むのみ |
| #5 (apps/api 完結) | AC-9, AC-10 | migration / repository / index 全て apps/api 配下、wrangler 直接実行禁止 |
| #11 (member 本文 admin 直接編集禁止) | AC-4, AC-5, AC-6, AC-11 | `markResolved` / `markRejected` は `admin_member_notes` のみ UPDATE、`member_responses` 不変 |

## 抜け漏れチェック

- [x] 全 AC 11 件に検証手段が紐付く
- [x] 全 AC 11 件に実装位置（ファイル / 関数 / SQL ブロック）が紐付く
- [x] 全 AC 11 件にトリプル（http / DB / 戻り値）が記載されている
- [x] 不変条件 #4 / #5 / #11 すべてに対応 AC が存在
- [x] failure case 14 件のうち、AC が直接関与する 8 件（case 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11）が対応 AC にトレース済み
- [x] AC-7 (resolved → 再申請 202) と AC-8 (pending → 409) が contract test で個別に検証

## ゲート判定への入力（Phase 10 / 13）

| ゲート項目 | 入力 |
| --- | --- |
| 全 AC PASS | 上記マトリクスのトリプルと検証結果 |
| 不変条件 PASS | #4 / #5 / #11 対応 AC の green |
| migration 適用 | AC-1 / AC-2 / AC-9 の E2E 結果 |
| helper contract | AC-3 / AC-4 / AC-5 / AC-6 の unit 結果 |
| route 透過的成立 | AC-7 / AC-8 の contract 結果 |
| 文書整合 | AC-11 の spec 追記 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | AC が同一 module（adminNotes.ts）に集中している箇所を DRY 化候補に |
| Phase 9 | typecheck / lint / vitest gate の対象 |
| Phase 10 | GO/NO-GO 判定の一次資料 |
| Phase 13 | PR description の AC チェックリストに反映 |

## 多角的チェック観点

| 観点 | チェック | 結果 |
| --- | --- | --- |
| 不変条件 #4 | AC-1/2/3/11 でカバー | OK |
| 不変条件 #5 | AC-9/10 でカバー | OK |
| 不変条件 #11 | AC-4/5/6/11 でカバー | OK |
| 認可境界 | helper 契約に `adminId` 必須 | OK（呼出側責務、本タスク範囲外） |
| 無料枠 | partial index は pending 行のみ | OK |
| 構造的拒否 | AC-6 で WHERE 述語による拒否を担保 | OK |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス 4 列 | 7 | pending | 11 行 |
| 2 | トリプル付与 | 7 | pending | 11 行 |
| 3 | 不変条件 → AC マッピング | 7 | pending | #4/#5/#11 |
| 4 | 抜け漏れチェック | 7 | pending | 6 項目 |
| 5 | ゲート入力整理 | 7 | pending | Phase 10/13 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | 4 列マトリクス + トリプル |
| メタ | artifacts.json | Phase 7 を completed |

## 完了条件

- [ ] AC 11 件 × 4 列（検証 / 実装 / 異常系 / 不変条件）のマトリクスが完成
- [ ] 各 AC にトリプル（http / DB / 戻り値）が quantitative に記載
- [ ] 不変条件 #4 / #5 / #11 すべてに対応 AC が存在
- [ ] 抜け漏れチェック 6 項目が全て OK
- [ ] Phase 10 / 13 ゲート判定への入力が整理されている

## タスク100%実行確認

- [ ] 全実行タスク 5 件 completed
- [ ] artifacts.json で phase 7 を completed
- [ ] outputs/phase-07/ac-matrix.md が Phase 10 / 13 で参照可能

## 次 Phase への引き渡し

- 次: 8 (DRY 化)
- 引き継ぎ: AC が同一 module に集中する箇所（adminNotes.ts の helper 群）を共通化候補として抽出
- ブロック条件: AC × 検証 / AC × 実装 / AC × トリプル のいずれかに穴がある場合は Phase 7 へ差し戻し
