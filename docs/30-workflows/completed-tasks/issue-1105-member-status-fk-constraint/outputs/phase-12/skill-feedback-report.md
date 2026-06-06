# Skill フィードバックレポート — issue-1105 member_status FK 制約導入

> 区分: 実装仕様書 / NON_VISUAL / new ／ status: `implemented_local_evidence_captured`
> task_id: `issue-1105-member-status-fk-constraint`

テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で、本タスクで得た知見を記録する。改善点が無い観点も「該当なし」と明記する。local実装と close-out review で再利用価値を確認したため、横断テンプレ promotion は同一 wave で `task-specification-creator` へ反映済み。

---

## 知見（同一 wave promotion 済み）

### 知見 1 — issue 番号陳腐化の現行 grep 再スコープ手順

- **観点**: ワークフロー改善 / テンプレート改善
- **内容**: issue body は backfill を `0024_backfill_member_status.sql` と記述していたが、現行コードでは 0024 prefix は `0024_member_photos_variants.sql` が占有し、backfill は実際には **`0025_backfill_member_status.sql`** だった。新 FK migration は次番 **`0026`** となる。issue の固定番号を鵜呑みにせず、`ls apps/api/migrations/*.sql` + `grep -rn` で現行 prefix 占有状況を再スコープしてから採番した。
- **promotion 先**: `task-specification-creator/references/phase-template-phase1.md` の「D1 migration 前提の現行再スコープ」gate。
- **判定**: 反映済み（`task-specification-creator/SKILL.md` v2026.06.06-issue1105-d1-migration-rescope-gate）。

### 知見 2 — 抽象 NOTE を現行コードの具体 INDEX 再作成へ具体化し AC を追加

- **観点**: テンプレート改善 / ドキュメント改善
- **内容**: issue §5.2 NOTE は「INDEX/VIEW 棚卸し」という抽象記述だった。テーブル再構築（DROP/RENAME）では `0002` L81-82 の `idx_member_status_public`（`(public_consent, publish_state, is_deleted)`）が消失するため、FK migration 末尾で **同一定義の INDEX 再作成が必須** と具体化し、これを **AC-9** として明文化した。抽象 NOTE を現行コードの具体識別子に紐付けて AC へ昇格させる判断パターン。
- **promotion 先**: `task-specification-creator/references/phase-template-phase1.md` の「D1 migration 前提の現行再スコープ」gate（`rebuild dependent objects` と AC 昇格ルール）。
- **判定**: 反映済み。

### 知見 3 — FK 前例ゼロの確認が D1 PRAGMA 検証スコープを補強

- **観点**: ワークフロー改善
- **内容**: `grep -rn "FOREIGN KEY\|REFERENCES" apps/api/migrations/*.sql` および `PRAGMA foreign_keys` が **migrations 全体で 0 件** と確認できたことで、FK 導入が本リポジトリ初の構造パターンだと判明した。これにより「FK はスキーマ宣言だけでは強制されず接続単位 `PRAGMA foreign_keys = ON` が必要」という SQLite/D1 特性の検証（AC-6: D1 上の PRAGMA 実効性検証・runbook 記録）をスコープに **補強** する根拠となった。前例ゼロの確認が検証深度を決める例。
- **promotion 先**: `task-specification-creator/references/phase-template-phase1.md` の「D1 migration 前提の現行再スコープ」gate（`repository precedent` と local / remote 境界分離）。
- **判定**: 反映済み。

---

## 観点別サマリ

| 観点 | 結果 |
|------|------|
| テンプレート改善 | 知見 1（migration 番号再スコープ gate）/ 知見 2（再構築時の消失 INDEX 再作成 AC 化）を反映済み |
| ワークフロー改善 | 知見 1（現行 grep 再スコープ）/ 知見 3（前例ゼロ確認 → 検証深度補強）を反映済み |
| ドキュメント改善 | 知見 2（抽象 NOTE → 具体識別子への落とし込み）を反映済み |
| design-tokens / API schema 系 | **該当なし**（色・apps/api endpoint 契約に非関与） |

> 3 知見はいずれも `task-specification-creator` へ promotion 済み。対象 workflow と aiworkflow ledger への反映も同一 wave で完了。
