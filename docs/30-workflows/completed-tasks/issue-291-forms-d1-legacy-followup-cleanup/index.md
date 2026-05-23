# Issue #291 — Forms D1 legacy follow-up cleanup

[実装区分: ドキュメントのみ]

**判定根拠**: 対象は `.claude/skills/aiworkflow-requirements/references/*.md` の stale current guidance の分類・更新であり、`apps/` / `packages/` の runtime code、`apps/api/db/migrations/`、Cloudflare Secret のいずれにも変更を伴わない。仕様掃除タスク。

---

## 概要

| 項目 | 内容 |
|------|------|
| Issue | #291（CLOSED） |
| Issue 参照方式 | `Refs #291` のみ（`Closes #291` 禁止 — 自動再 close を避ける） |
| Workflow ID | `issue-291-forms-d1-legacy-followup-cleanup` |
| Recovery Pattern | `closed-issue-canonical-workflow-recovery` |
| Recovered From | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md` |
| 上流 | `task-sync-forms-d1-legacy-umbrella-001`（CLOSED） |
| 実装区分 | ドキュメントのみ |
| タスク種別 | docs-only |
| 視覚証跡 | NON_VISUAL |
| visualEvidence | NON_VISUAL |
| Workflow State | `implemented_local` |
| 規模 | 中（references 5 ファイル + backlog 1 ファイル + 3 物理タスク + 2 ledger fallback への逆リンク） |

---

## 背景

`task-sync-forms-d1-legacy-umbrella-001` で旧 UT-09（単一 `/admin/sync` + `sync_audit` + Google Sheets API）を legacy として閉じ、Forms API + `/admin/sync/schema` + `/admin/sync/responses` + `sync_jobs` を current として固定した。しかし `.claude/skills/aiworkflow-requirements/references/` には Sheets API・単一 `/admin/sync`・`sync_audit` を current guidance として記述したままの行が残存しており、新規実装者が誤って legacy 経路を current 仕様として読む構造的リスクが存在する。

実態調査（`rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" .claude/skills/aiworkflow-requirements/references`）で確認された stale hit を **current drift（要更新）** / **historical（残す）** / **superseded backlog** の 3 区分で分類整理する。

---

## スコープ

### 含むもの

- 下記 5 references の current drift 行の修正方針策定（Phase 5 ランブックで file:line 単位の編集手順）
  - `api-endpoints.md` L69-74
  - `environment-variables.md` L55, L65, L436, L442, L443
  - `deployment-cloudflare.md` L293
  - `deployment-secrets-management.md` L86
  - `architecture-overview-core.md` L243
- `task-workflow-backlog.md` L349, L350（UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001）を `status: superseded` に変更する手順
- 03a / 03b / 04c / 09b / 02c から legacy umbrella (`task-sync-forms-d1-legacy-umbrella-001`) への逆リンク追記手順
- skill indexes 再生成（`pnpm indexes:rebuild`）
- regression scan（rg / conflict marker / index drift）

### 含まないもの

- runtime code 変更（`apps/` / `packages/`）
- D1 migration 追加・変更
- Cloudflare Secrets 投入
- commit / push / PR 作成（PR 作成は Phase 13 で user 明示承認後のみ）
- historical lessons-learned の本文削除

---

## 正本順位

1. 本 workflow root（`docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/`）
2. `task-sync-forms-d1-legacy-umbrella-001` の Phase 12 close-out 成果物
3. `.claude/skills/aiworkflow-requirements/references/` の current guidance（更新後）
4. unassigned-task 原文（履歴のみ・consumed 済み）

衝突時は上位を優先。

---

## 不変条件

| # | 条件 | 適用箇所 |
|---|------|---------|
| 1 | schema 過剰固定回避 | references の current guidance を正本性高めすぎない |
| 5 | `apps/web` → D1 直接アクセス禁止 | 既存条件継続 |
| 7 | MVP では Google Form 再回答を本人更新の正式経路 | Forms API current を維持 |

タスク固有の不変条件:

- runtime code（`apps/` / `packages/`）変更なし
- D1 migration 追加なし
- Cloudflare Secret 投入なし
- commit / push / PR 作成は Phase 13 で user 明示承認後のみ
- historical lessons / completed task 記録の本文は削除しない（注記または分類のみ）
- 単一 `/admin/sync` / `sync_audit` / Google Sheets API のいずれも current guidance として誤読されない状態にする

---

## Phase 構成

| Phase | 名称 | Status | 主要成果物 |
|-------|------|--------|-----------|
| 1 | 要件定義 | pending | stale hit inventory（実測 rg 出力ベース） |
| 2 | 設計 | pending | current drift / historical / superseded 分類基準、逆リンク戦略 |
| 3 | 設計レビュー | pending | umbrella close-out / 08-free-database / 13-mvp-auth との整合確認 |
| 4 | テスト戦略 | pending | rg regression scan / conflict marker / index drift コマンド一式 |
| 5 | 実装ランブック | pending | file:line 単位の編集手順、逆リンク追記手順、indexes 再生成手順 |
| 6 | 異常系検証 | pending | 誤削除・current drift 残存・逆リンク欠落の検出手順 |
| 7 | AC マトリクス | pending | DoD（CONST_007: 全件 1 サイクル完了） |
| 8 | DRY 化 | pending | 共通テンプレ化（stale 表現の reusable パターン） |
| 9 | 品質保証 | pending | `pnpm indexes:rebuild` / `verify:phase12-compliance` / 0 drift current |
| 10 | 最終レビュー | pending | go/no-go |
| 11 | 手動 smoke | pending | NON_VISUAL evidence: rg before/after 比較 |
| 12 | ドキュメント更新 | pending | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check |
| 13 | PR 作成 | pending（user 承認後） | base=dev, `Refs #291`、`Closes` 禁止 |

---

## 関連タスク（逆リンク追記対象）

| タスク | リンク先 |
|--------|----------|
| 03a parallel-forms-schema-sync-and-stablekey-alias-queue | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` |
| 03b parallel-forms-response-sync-and-current-response-resolver | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/` |
| 04c parallel-admin-backoffice-api-endpoints | 物理 root が現 worktree に存在しないため、`task-workflow-active.md` の 04c row を ledger fallback として更新対象にする |
| 09b parallel-cron-triggers-monitoring-and-release-runbook | 物理 root が現 worktree に存在しないため、`task-workflow-active.md` の 09b row を ledger fallback として更新対象にする |
| 02c parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/` |

---

## 参照

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md`（consumed）
- `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/`
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
- `CLAUDE.md` § ブランチ戦略 / 不変条件
