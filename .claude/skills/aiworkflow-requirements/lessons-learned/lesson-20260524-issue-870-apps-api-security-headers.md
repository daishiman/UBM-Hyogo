# Lesson: issue-870 apps/api security headers 実装での苦戦点

- date: 2026-05-24
- workflow: `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/`
- workflow_state: implemented_local_evidence_captured

## L-SECHDR-001: CORS 設計の二択を明示する

**事象**: 当初 `hono/cors` ライブラリ前提の文章と「手書き deny-by-default middleware」前提の実装が混在し、Phase 3 レビューで矛盾が発覚。

**根本原因**: Phase 1/2 で「CORS allowlist」とのみ表現し、ライブラリ採用可否を確定させていなかった。

**再発防止**:
- API security 系仕様では Phase 2 で「library (`hono/cors` 等) を使うか / 手書きするか」を二択明示し、Phase 3 で実装と一致させる。
- 本タスクでは **手書き deny-by-default middleware** を採用（`Access-Control-Allow-Origin` 未付与で deny を表現、`credentials: true` 固定）。
- `security-api.md` reference にもこの方針を明記済み。

## L-SECHDR-002: `pnpm --filter <pkg> vitest ...` は無効

**事象**: focused Vitest 実行に `pnpm --filter api vitest run src/middleware/__tests__/security-headers.spec.ts` を案内したが、`apps/api/package.json` に `vitest` script がないため `command not found` で失敗。

**根本原因**: workspace の `--filter` は `package.json` の script 名解決のみで、CLI bin の直接呼び出しは行わない。

**再発防止**:
- 既存 script (`pnpm --filter api test`) を優先する。
- focused 実行が必要な場合は `pnpm exec vitest run <path>` または `pnpm --filter api exec vitest run <path>` を使う。
- task-specification-creator の Phase 4/6/9 テンプレに上記コマンド例を反映する。

## L-SECHDR-003: Phase 12 strict 7 に `main.md` を含める

**事象**: 初回生成時に `main.md` を作らず 6 ファイルで提出したところ、`verify:phase12-compliance` 関連の inventory チェックで「main.md 不在」を検知。

**再発防止**:
- strict 7 = `main.md` + `implementation-guide.md` + `system-spec-update-summary.md` + `documentation-changelog.md` + `unassigned-task-detection.md` + `skill-feedback-report.md` + `phase12-task-spec-compliance-check.md` の **7 ファイル固定**を周知。
- skill-feedback-report.md にも反映済み。

## L-SECHDR-004: phase12-task-spec-compliance-check の見出しは逐語 SSOT

**事象**: `## 1. Summary Verdict`（Title Case）で記述したところ `verify:phase12-compliance` が `missing-heading` で fail。

**根本原因**: canonical heading SSOT (`task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections) は lowercase で固定されており、CI gate が逐語一致を要求する。

**再発防止**:
- 9 見出しを **逐語コピー**する（`Summary verdict` / `Changed-files classification` / `workflow_state and phase status consistency` / `Phase 11 evidence file inventory` / `Phase 12 strict 7 file inventory` / `Skill/reference/system spec same-wave sync` / `Runtime or user-gated boundary` / `Archive/delete stale-reference gate` / `Four-condition verdict`）。
- pre-push hook `scripts/hooks/phase12-compliance-guard.sh` がローカルでも block するので push 前に必ず通す。

## L-SECHDR-005: ALLOWED_ORIGINS env は実装・wrangler・spec・test の 4 同期が必要

**事象**: 環境変数を `Env` 型に足し忘れて typecheck が fail。

**再発防止**:
- 新 env を入れる際は **`apps/api/src/env.ts` の型 + `apps/api/wrangler.toml` の `[env.staging.vars]`/`[env.production.vars]` + spec/skill references + Vitest fixture** の 4 箇所同時更新を artifact-inventory にチェック項目として記録する。
