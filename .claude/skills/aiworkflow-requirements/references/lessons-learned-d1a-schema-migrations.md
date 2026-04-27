# Lessons Learned: 01a-parallel D1 schema migrations and tag seed

> 親ファイル: [lessons-learned-current-2026-04.md](lessons-learned-current-2026-04.md)
> 関連 references: [database-schema.md](database-schema.md) / [deployment-cloudflare.md](deployment-cloudflare.md) / [legacy-ordinal-family-register.md](legacy-ordinal-family-register.md)

01a-parallel-d1-database-schema-migrations-and-tag-seed（Wave 1 並列タスク）で `apps/api/migrations/0001_init.sql`〜`0004_seed_tags.sql` の 4 ファイル（20 物理テーブル + `members` view + tag seed 41 行）を 2026-04-27 に確定した際に得た知見をまとめる。

---

## L-D1A-001: source task 別の current facts 表分割（contract と implementation の併存運用）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 03-serial（Phase 1〜12 contract）で固定した 4 テーブル早見表（`member_responses` / `member_identities` / `member_status` / `sync_audit`）と、01a で実装した 20 物理テーブルが `quick-reference.md` 上で相互上書きされ、契約と実装の差異が読み手に見えなくなる |
| 原因 | `quick-reference.md` を「最新の事実」一枚で管理する単一ソース運用は、契約 → 実装の段階を踏むタスクで「契約時点の事実」を消してしまう。後段から見ると初期契約の数値根拠が辿れなくなり、レビューが網羅性を失う |
| 解決 | `quick-reference.md` に **source task 別**の早見表を併存させる。今回は `### 03-serial-data-source-and-storage-contract D1 Schema 早見（contract）`（4テーブル契約）と `### 01a-parallel-d1-database-schema-migrations-and-tag-seed D1 Schema 早見（implementation）`（20 物理テーブル + view + seed）を共存させ、両者の関係（contract → implementation）を 1 行で明記 |
| 再発防止 | 同一スキーマに対して契約タスクと実装タスクが直列・並列で走る場合、各タスク完了時に `quick-reference.md` へ source task 単位の小見出し付き表を追加する。後段で前段表を**書き換えない**（appended-only）。差異は `legacy-ordinal-family-register.md` または lessons-learned で表記揺れ（`audit_logs` ↔ `audit_log` 等）を吸収する |

## L-D1A-002: DDL 専属タスクにおける Phase 11 NON_VISUAL evidence の代替方針

| 項目 | 内容 |
| ---- | ---- |
| 症状 | DB-only タスクでは UI/UX が変わらないため、Phase 11 の screenshot-plan.json / metadata JSON / coverage.md / 実 PNG / validate PASS のハードゲート 5 点を物理的に満たせない。FB-UT-UIUX-001-A の運用ルールに合致せず、Phase 12 close-out 判定が宙に浮く |
| 原因 | `task-specification-creator` の Phase 11 テンプレが「視覚的証跡」を前提としており、DDL/CLI 専属タスクの「非視覚的証跡」モードを正式化していなかった |
| 解決 | Phase 11 を NON_VISUAL モードとして扱う宣言を `outputs/phase-11/main.md` 冒頭と `phase12-task-spec-compliance-check.md` に明示し、**代替証跡**として以下を採用: (1) `outputs/phase-11/manual-smoke-log.md`（`wrangler d1 execute --local` の DDL inspect 結果）、(2) `outputs/phase-11/discovered-issues.md`（レビュー中の解消項目）、(3) `artifacts.json` × `outputs/phase-12/` 7 ファイル存在性を JS validator の代替パス検証として採用 |
| 再発防止 | DDL/CLI 専属タスクの Phase 11 設計時点で `mode: NON_VISUAL` を明示し、`Screenshot Reference: N/A` の根拠を implementation-guide / compliance-check / unassigned-task-detection に書く。task-specification-creator 側の `phase-12-completion-checklist.md` に「artifacts.json と phase-NN.md state の同期チェック」を追補する |

## L-D1A-003: artifacts.json と phase-NN.md state の同期盲点（pending 残置）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | `phases.12.status=completed` と `outputs/phase-12/` 7 ファイル実在を満たした状態でも、`phase-12.md` メタ情報の `状態 \| pending` 行と完了条件チェックボックス `- [ ]` が**取り残される** drift が発生する |
| 原因 | Phase 12 close-out 時に `artifacts.json` と `outputs/` だけを「成果物」として更新する習慣があり、root の `phase-NN.md`（仕様書）の状態欄を「現状」と分けて管理していたため。仕様書側の状態同期は完了条件チェックリストに含まれていない |
| 解決 | `task-specification-creator/references/phase-12-completion-checklist.md` の末尾に「### artifacts.json と phase-NN.md 状態同期チェック」セクションを追加し、close-out 時に必ず以下 3 点を同期確認: (1) `phase-NN.md` メタ表 `状態` 列が `completed`、(2) 完了条件チェックボックス `[x]`、(3) `artifacts.json.phases.NN.status` 一致 |
| 再発防止 | Phase 12 close-out コマンドに `phase-NN.md` 状態欄の grep チェックを追加する。`grep -E "状態.*pending" phase-12.md` が hit したら未同期として detect する。close-out バッチで `[ ]` → `[x]` 一括置換を行うか、JS validator で hit 時 FAIL とする |

---

## 関連リンク

- 01a タスク仕様書: `docs/30-workflows/01a-parallel-d1-database-schema-migrations-and-tag-seed/`
- Phase 12 成果物: `docs/30-workflows/01a-parallel-d1-database-schema-migrations-and-tag-seed/outputs/phase-12/`
- D1 migrations: `apps/api/migrations/0001_init.sql` / `0002_admin_managed.sql` / `0003_auth_support.sql` / `0004_seed_tags.sql`
- D1 binding 設定: `apps/api/wrangler.toml`
