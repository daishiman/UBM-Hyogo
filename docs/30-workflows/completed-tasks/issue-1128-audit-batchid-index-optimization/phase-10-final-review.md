# Phase 10: 最終レビュー（Gate-C 前の AC 充足判定）

Phase 9（Gate-B）通過後、AC-1〜AC-7 の充足を機械的に確認し blocker の有無を判定する。
全 AC 充足かつ blocker 0 で Gate-C（Phase 11 / 13）へ進む。

## AC 充足チェックリスト

| AC | 受け入れ基準 | 検証方法 | 状態 |
| --- | --- | --- | --- |
| AC-1 | batchId 相関列が `0027` migration で追加される | `apps/api/migrations/0027_audit_log_batchid_index.sql` に `ALTER TABLE audit_log ADD COLUMN batch_id ... GENERATED ALWAYS AS (...) VIRTUAL` が存在。`apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts` が `PRAGMA table_xinfo(audit_log)` で generated `batch_id`（hidden=2）を assert | PASS |
| AC-2 | index 付与 + batchId 検索が index 列走査になる | migration に `idx_audit_log_batch_id ON audit_log(batch_id, created_at DESC, audit_id DESC) WHERE batch_id IS NOT NULL` が存在。migration spec / repository spec が `EXPLAIN QUERY PLAN ... WHERE batch_id = ?` に `idx_audit_log_batch_id` を含み `SCAN audit_log` を含まないことを assert | PASS |
| AC-3 | assign(after_json) / unassign(before_json) 双方の batchId を 1 列で拾う | generated expression は `json_valid` guard 付きで `after_json.$.batchId` と `before_json.$.batchId` を `COALESCE` する。migration spec と repository spec が after_json 由来行 / before_json 由来行の同一 batchId hit を assert | PASS |
| AC-4 | 既存 audit 行も検索に乗る | 方式 A（VIRTUAL generated column）採用により backfill UPDATE なしで既存行へ算出が波及する。migration spec が列を明示しない raw INSERT 後に `batch_id` 検索で hit することを assert | PASS |
| AC-5 | batchId フィルタ返却が切替前と同一（非退化） | `auditLog.repository.spec.ts` の batchId after/before hit、action AND、cursor pagination、破損 JSON 混在ケースが PASS。`audit.contract.spec.ts` も focused D1 run に含め、public query / response shape 不変を確認 | PASS |
| AC-6 | rollback 手順が用意される | migration 末尾に `DROP INDEX IF EXISTS idx_audit_log_batch_id;` + `ALTER TABLE audit_log DROP COLUMN batch_id;` を rollback コメントとして併記 | PASS |
| AC-7 | append-only 不変条件を破らない | `auditLog.ts` の `append` write path / exported API に UPDATE / DELETE を追加していない。方式 A 採用のため migration 内 backfill UPDATE も不要。type-level append-only 不在 test は継続 PASS | PASS |

## blocker 判定

| 区分 | 条件 | 扱い |
| --- | --- | --- |
| **blocker** | AC-1〜AC-7 のいずれか未充足 / Gate-B（Phase 9）赤 / VIRTUAL 列 index が D1 で不可かつ方式 B fallback も未着地 | Gate-C へ進めない。Phase 5/6/2 へ差し戻す |
| **非 blocker（MINOR）** | 機能 AC は全充足だが軽微な改善余地（例: spec のケース名整理、コメント補強、EXPLAIN 出力の assertion 文言改善） | 後述の「MINOR → 未タスク化」方針で Phase 12 に記録。本タスクの完了は妨げない |

## MINOR 指摘の扱い（FB: Phase10 MINOR → 未タスク化）

- MINOR と判定した指摘は、本サイクルでは修正せず **Phase 12 で未タスク（baseline / followup）として起票判断**する。
- silent drop は禁止。Phase 12 の未タスク化セクションに「指摘内容・除外/起票理由・rule of three / YAGNI 判定」を明記する。
- MINOR が見つからない場合も「MINOR: なし」と Phase 12 に明記する。

## 不要判定の禁止事項

- 本タスクは NON_VISUAL（API/DB）だが、「機能影響なし」「UI 変更なし」を理由に AC 検証や Phase 11 証跡を省略しない。
- AC-2（index 走査）/ AC-3（COALESCE 両方）/ AC-5（非退化）は自動テスト + `EXPLAIN QUERY PLAN` で必ず実証する。
- 「performance ラベルだから docs-only」とは判定しない（index.md の実装区分判定どおりコード変更必須タスク）。

## Gate-C 前判定

AC-1〜AC-7 は全充足、blocker 0。Phase 11 NON_VISUAL 証跡と Phase 12 文書化は完了済み。
Phase 13 の PR 作成、staging / production D1 migration apply、deploy、commit、push は user-gated のため未実行のまま保持する。
