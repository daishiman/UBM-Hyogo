# スキルフィードバックレポート — issue-1128 audit_log batchId index 最適化

workflow_state: `implemented_local_evidence_captured` / 更新日: 2026-06-07 / related issue: #1128（CLOSED 維持）

本 wave で観察したテンプレート / ワークフロー / ドキュメント改善候補を記録する。改善点なしでも本レポートは出力必須のため、
各 item に観点・evidence・promotion target（昇格先）/ no-op reason を明記する。

## 観察事項

| # | 観点 | 観察内容 | evidence | routing |
| --- | --- | --- | --- | --- |
| SF-1 | ドキュメント改善（DB migration 落とし穴の知見化） | SQLite の `ALTER TABLE ... ADD COLUMN` は **STORED generated column を追加できず VIRTUAL のみ可**（STORED は既存行再計算＝テーブル再構築が必要）。元 Issue #1128 が「STORED 第一候補」としていたが現行 SQLite/D1 実態では成立せず、VIRTUAL 第一候補へ最適化補正が必要だった。これは D1 migration 設計タスクで頻出の落とし穴である | `phase-2-design.md`「方式 C: STORED generated column → ALTER ADD 不可（テーブル再構築必要）」/ `apps/api/migrations/0027_audit_log_batchid_index.sql` / focused D1 test | **Applied**。promotion target = `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` の D1 JSON search pattern に追記済み。changelog = `.claude/skills/task-specification-creator/SKILL-changelog.md` |
| SF-2 | ワークフロー改善（実測ゲート設計パターンの再利用） | 「D1 が VIRTUAL generated column の index を許すか」という不確実性を、Miniflare D1（D1 と同一 SQLite エンジン）+ `EXPLAIN QUERY PLAN` で実測してから方式（A/B）を確定する設計ゲートは、他の D1 schema 最適化タスクでも再利用価値がある | `phase-2-design.md`「実測検証手順（Phase 2 で実施 / Phase 5 実装前に確定）」+ 判定基準（`USING INDEX ...` なら方式A / full scan なら方式B fallback） | **no-op（owning skill 非変更）**。本タスク固有の Phase 2 設計に既に組み込み済み。汎用ルール化するほどの再発頻度はまだ無く、SF-1 の落とし穴知見化に内包できる。横断 reference 化は需要顕在化時に再検討 |
| SF-3 | テンプレート改善（NON_VISUAL evidence の証跡境界） | NON_VISUAL では screenshot を恒久 `n/a` とし、主証跡を focused test + query plan assertion に置く。今回の `outputs/phase-11/manual-test-result.md` は `present` として扱えるため、template 欠陥はない | `outputs/phase-11/manual-test-result.md` / `outputs/phase-12/phase12-task-spec-compliance-check.md` | **reject（反映しない）**。canonical template（Phase 11 evidence 3 値）に準拠して表現可能であり、skill 更新は不要 |

## promotion gate 判定

| 判定 | item | 根拠 |
| --- | --- | --- |
| Applied | SF-1 | DB migration 設計の頻出落とし穴（STORED generated column の ALTER ADD 不可）を task-specification-creator reference / changelog へ同一サイクルで昇格 |
| No-op | SF-2 | 本タスク Phase 2 に組み込み済み。横断ルール化は需要未顕在 |
| Reject | SF-3 | canonical template に逐語準拠で表現可能。テンプレ欠陥なし |

## まとめ

本タスクで検出した観察は 3 件。SF-1（SQLite generated column の ALTER ADD 制約）は task-specification-creator の
DB migration 系 reference へ同一サイクルで昇格済み。SF-2 は本タスク内に組み込み済みで no-op、
SF-3 は canonical SSOT 準拠で reject。改善点なしでも出力必須の要件に従い、観点（テンプレート / ワークフロー / ドキュメント）と
各 item の evidence / promotion target / no-op reason を上記に明記した。
