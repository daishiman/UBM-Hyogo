# Lessons Learned: UT-07B-FU-04 Production Migration Already-Applied Verification

| Item | Value |
| --- | --- |
| Task ID | UT-07B-FU-04 |
| Date | 2026-05-04 |
| Workflow | `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/` |
| Inventory | `references/workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md` |
| Related | `references/lessons-learned-ut07b-fu03-production-migration-runbook-2026-05.md`, `references/database-schema.md` |

## L-UT07B-FU04-001: Duplicate apply 禁止 / canonical ledger fact 優先

- コンテキスト: FU-04 起票時は「FU-03 runbook を消費して production apply を実行する」前提で構成されていた。
- 何が起きた: `references/database-schema.md` の production D1 ledger に `0008_schema_alias_hardening.sql` が `2026-05-01 08:21:04 UTC` 適用済み fact として既に記録されていたが、Phase 0 / 1 でこの不整合を検出できず、Phase 11 まで apply 前提の placeholder evidence が残存した。
- 学び: production migration 系タスクは Phase 0 で必ず canonical ledger fact（`database-schema.md` 等）を fetch し、apply 前提と既適用状態の差分を検証する。ledger fact が apply 済みなら起票前提を破棄し verification boundary に reframe する。
- 適用ルール: production D1 / production worker の状態変更タスクは、起票 spec と canonical ledger fact が衝突した場合 ledger fact を正本扱いし、duplicate apply を禁止して verification + duplicate-apply prohibition workflow に再構成する。

## L-UT07B-FU04-002: preflight `--expect pending|applied` 二モード切替

- コンテキスト: FU-03 apply path では preflight は `pending` を期待し、未適用ならば apply に進む。FU-04 verification path では既適用 fact を確認するため `applied` を期待する。
- 何が起きた: 同一スクリプトを単一モードで使い回すと、FU-04 の preflight が FU-03 と同じ判定基準で FAIL を返し、本来の verification 成立条件と PASS/FAIL が反転する状態になりかけた。
- 学び: apply path と verification path は preflight の期待状態が論理的に反転するため、`--expect pending` / `--expect applied` の二モードに分離して呼び分ける必要がある。
- 適用ルール: production migration 系 preflight は `--expect pending|applied` を必須引数化し、apply path / verification path で明示切替する。runbook と verification spec の双方に呼び出し例を記載する。

## L-UT07B-FU04-003: post-check scope を hardening migration 所有 column のみに縮約

- コンテキスト: `0008_schema_alias_hardening.sql` の post-check で、過去 migration 側の `schema_aliases` 表本体や UNIQUE indexes まで PASS 条件に含めた初稿があった。
- 何が起きた: `schema_aliases` table と UNIQUE indexes は `0008_create_schema_aliases.sql` 側の責務で、hardening migration とは無関係。これを post-check に含めると別 migration の状態変動で FU-04 verification が誤って FAIL になる。
- 学び: migration 単位 verification の post-check は、その migration が新規追加するオブジェクトのみに scope を絞る。隣接 migration の所有物まで含めると false negative の温床になる。
- 適用ルール: FU-04 post-check scope は `schema_diff_queue.backfill_cursor` / `schema_diff_queue.backfill_status` の 2 column のみ。`schema_aliases` 表 / index は対象外と inventory にも明記する。

## L-UT07B-FU04-004: placeholder evidence + user-gate runtime（spec PASS / runtime PENDING 分離）

- コンテキスト: FU-04 は production D1 への read-only verification を含むが、Cloudflare runtime 実行は user 明示承認まで blocked にする運用ポリシー。
- 何が起きた: Phase 11 evidence を「実行待ち」のまま空欄にすると Phase 12 strict 7 files の整合チェックが通らない一方、ダミーの runtime 結果を書くと canonical ledger fact と乖離するリスクがあった。
- 学び: spec compliance 上の PASS と runtime 実行の PENDING は別軸として明示分離する。placeholder evidence ファイルには canonical ledger fact 引用と「runtime は user approval まで未実行」である旨を明記し、apply.log は `FORBIDDEN / not_run_duplicate_apply_prohibited` 文言で no-op 禁止 evidence として残す。
- 適用ルール: user-gate 付き production verification タスクは、`outputs/phase-11/` に placeholder + canonical fact 引用 + user-approval-record を必ず materialize し、Phase 12 spec compliance は PASS、runtime 状態は `completed_boundary_runtime_pending` / `blocked_until_user_approval` として artifact inventory と active workflow status の両方に記録する。
