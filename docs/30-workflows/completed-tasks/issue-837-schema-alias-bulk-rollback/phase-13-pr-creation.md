# Phase 13: PR Creation

> ## ⚠️ 実行ゲート（最重要）
>
> **PR 作成・`git commit`・`git push` は、ユーザーの明示承認後のみ実行する。**
> 本仕様書（phase-13）作成プロンプトでは PR 作成・commit・push を一切実行しない。
> 本ファイルは PR 作成手順・本文骨子・CI gate チェックリストを**確定する計画文書**であり、実行はユーザーが「PR 作成」「PR 出して」等と明示した時点で `status: pending_user_approval` から進行する。

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-09-quality-assurance.md` / `phase-10-final-review.md`（ゲート PASS）/ `phase-11-manual-test.md`（evidence 計画）/ `outputs/phase-12/implementation-guide.md` |
| status | `pending_user_approval`（`artifacts.json` と整合）|
| **PR base** | **`dev`**（CLAUDE.md「既定ブランチは dev」原則。production リリース時のみ `main`） |
| ブランチ命名提案 | `feat/issue-837-schema-alias-bulk-rollback` |
| source issue | **#837 は CLOSED のまま**（再オープンしない。PR では `Refs #837` で参照し、`Closes` は使わない＝既に closed のため） |

---

## PR メタ情報

- **base**: `dev`
- **head**: `feat/issue-837-schema-alias-bulk-rollback`（または同等の自律生成名）
- **title 案**: `feat(admin-schema): bulk alias rollback UI for SchemaDiffPanel (Refs #837)`
- **labels（提案）**: `area:admin-ui`, `type:feature`, `scale:medium`, `priority:low`

---

## PR 本文骨子

```markdown
## 概要

Issue #837 (closed) で記録されていた SchemaDiffPanel HistoryPane の bulk alias rollback UI を実装。
単体 rollback（#778）と bulk resolve（#776）が揃った現行コードに対し、その**対称機能**となる
複数 alias 一括 rollback を client-side bounded fan-out で追加する。

## 背景

- Google Form の section 単位 rename を誤って一括 resolve した場合、取り消しも section 全体（最大 30 件規模）になるが、
  現状の単体 rollback（#778）は 1 件ずつ confirm modal を介すため 10 分以上のリードタイムが発生していた。
- bulk **resolve**（#776）は既に client-side bounded fan-out（concurrency 8）で実装済み。bulk **rollback** はその対称機能だが未実装だった。
- 本 PR は #778 単体 rollback と #776 bulk resolve の構造テンプレートを踏襲し、API/D1 変更なしの client-only 拡張で実装する。

## 主な変更（変更ファイル一覧）

- `apps/web/src/lib/admin/api.ts`（編集）: `rollbackSchemaAliasBulk` helper + 型 3 種（`SchemaAliasRollbackBulkRow` / `...RowResult` / `...Options`）+ `BULK_ROLLBACK_MAX_ROWS` 定数。既存 `rollbackSchemaAlias` / `runWithConcurrency` を再利用（SSOT）
- `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts`（新規）: selection state machine + submit 進捗 hook
- `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx`（新規）: confirm / progress / summary modal
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`（編集）: HistoryPane に bulk rollback mode トグル / checkbox / select-all / 選択件数バッジ / 50 件上限 alert / modal 条件 mount
- `docs/00-getting-started-manual/specs/11-admin-management.md`（編集）: bulk rollback 仕様追記
- spec 4 件（`api.spec.ts` 編集 / `SchemaDiffBulkRollbackModal.component.spec.tsx` 新規 / `useSchemaDiffBulkRollbackSelection.spec.tsx` 新規 / `SchemaDiffPanel.component.spec.tsx` 編集）
- `playwright/tests/issue837-schema-bulk-rollback.spec.ts`（新規 E2E）
- **API 側は無変更**（CLAUDE.md 不変条件1・2）

## 設計判断

- bulk rollback endpoint 新設は**却下**。全件 atomic は web 層から D1 binding 横断 transaction を張れないため、**per-alias 独立 commit** を client-side fan-out で積み上げる（理由は phase-02 / index.md アーキ決定表）
- audit log は per-alias `schema_alias.rollback`（既存単体 endpoint が emit）を正本とする。batch parent-child audit は API/D1 変更を要するためスコープ外
- 楽観ロック検証は既存 `rollbackSchemaAlias`（`If-Match: version=<N>`）を再利用し SSOT 化

## AC チェックリスト

- [ ] AC-1: bulk rollback mode で複数選択 → confirm modal → 一括取消
- [ ] AC-2: 1 件 version_mismatch 時、成功分確定・失敗分のみ理由付きで残留（per-alias 独立 commit）
- [ ] AC-3: per-alias `schema_alias.rollback` audit log（既存 endpoint が emit）
- [ ] AC-4: 全成功 / 部分成功 / 全失敗を区別表示（`data-role="bulk-rollback-summary"`）
- [ ] AC-5: 50 件超で confirm 抑止 + 分割実行 alert
- [ ] AC-6: 既存 single rollback / undo / bulk resolve 経路が回帰なし
- [ ] AC-7: 楽観ロック検証 SSOT（`rollbackSchemaAlias` 再利用 / `If-Match` 1 箇所）
- [ ] AC-8: spec test が partial failure / all-fail / all-success / 50 件上限を網羅し green
- [ ] AC-9: design token 違反 0（OKLch のみ / `verify-design-tokens` green）

## Screenshot / Evidence（phase-11 evidence 参照）

`outputs/phase-11/` 配下:

- `bulk-rollback-select-desktop-1280.png`
- `bulk-rollback-modal-desktop-1280.png`
- `bulk-rollback-partial-failure-desktop-1280.png`
- `bulk-rollback-success-desktop-1280.png`
- `bulk-rollback-select-mobile-375.png`
- `bulk-rollback-modal-mobile-375.png`
- `perf-30rows.md`（NFR-5: 30 件 / 30 秒以内）
- `a11y-manual-check.md`（checkbox aria-label / role=dialog / focus trap / Escape / キーボード操作）

## テスト結果

- typecheck / lint / build green
- spec test（RBLK / MOD / HOOK / PANEL-BR）全件 green
- jest-axe violations 0
- 既存 single rollback / undo / bulk resolve spec 回帰なし
- `verify-design-tokens` gate green

## 仕様書更新

- `docs/00-getting-started-manual/specs/11-admin-management.md`（bulk rollback 仕様追記）

Refs #837（既に closed のため、`Closes` keyword は使わない。reopen は行わない）
```

---

## マージ前 CI gate チェックリスト

| Gate | 実行コマンド | 期待結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0（違反 0） |
| `verify-design-tokens` | `mise exec -- pnpm verify-design-tokens` | PASS（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0） |
| `verify:phase12-compliance` | `mise exec -- pnpm verify:phase12-compliance` | PASS（canonical 9 headings / Phase 11 evidence 表 / workflow root scan） |
| `playwright-smoke` | CI の `playwright-smoke / smoke (chromium)` / `visual (chromium)` | green |
| test | `mise exec -- pnpm --filter @ubm-hyogo/web test -- SchemaDiffBulkRollbackModal useSchemaDiffBulkRollbackSelection SchemaDiffPanel api.spec` | 全件 green |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0（Cloudflare Workers 互換ビルド） |

---

## pre-flight（PR 作成前の必須実行）

CLAUDE.md「PR作成の完全自律フロー」に従い、PR 作成前に以下を実行する。

```bash
git fetch origin dev
# ローカル dev を origin/dev に fast-forward 同期 → 作業ブランチへ dev を merge
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh   # docs-only gate pre-flight: gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift を一括検証
git status --porcelain            # 空であること
git diff dev...HEAD --name-only   # PR に含めるファイル一覧（漏れなし確認）
```

`bash scripts/verify-pr-ready.sh` が失敗した場合は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照し、`gate-metadata:validate` → `verify:phase12-compliance` → `indexes:rebuild` drift の順で切り分ける。

---

## PR 作成コマンド（ユーザー明示承認後のみ）

```bash
gh pr create --base dev \
  --title "feat(admin-schema): bulk alias rollback UI for SchemaDiffPanel (Refs #837)" \
  --body "$(cat <<'EOF'
...（上記 PR 本文骨子）...
EOF
)"
```

> production リリース時のみ `--base main` を明示する。本タスクは feature 統合のため `--base dev` 固定。

---

## source issue #837 の扱い

- Issue #837 は **CLOSED のまま**とし、本 PR で**再オープンしない**。
- PR 本文末尾は `Refs #837` で参照する。`Closes #837` / `Fixes #837` の close keyword は使わない（既に closed のため、merge 時に状態変更が発生しないようにする）。

---

## 完了条件

- [ ] ユーザーの明示承認を得た（承認前は実行しない）
- [ ] PR が `dev` ベースで作成された
- [ ] マージ前 CI gate（typecheck / lint / verify-design-tokens / verify:phase12-compliance / playwright-smoke / test / build）全件 green
- [ ] PR 本文に AC チェックリスト・変更ファイル一覧・phase-11 evidence 参照・テスト結果欄が含まれる
- [ ] `Refs #837`（`Closes` 不使用 / reopen なし）
- [ ] merge 後に本 workflow を `docs/30-workflows/completed-tasks/` へ移動
