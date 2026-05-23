# serial-05-step-03-schema-diff-resolve — Workflow Entry

## メタ情報

| Key | Value |
| --- | --- |
| workflow_state | `implemented-local-runtime-pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `existing-schema-diff-panel-hardening` |
| 直列順序 | 3 / 5 (`serial-05-admin-mutation-ui`) |
| 前提 | `serial-05-step-01-*`（useAdminMutation hook 確立）/ `parallel-08`（shared foundation） |
| PR base | `dev` |

## 実装区分

実装仕様書（既存 admin/schema 画面の `SchemaDiffPanel` と alias resolve UI を hardening する VISUAL implementation タスク）。本 cycle では `SchemaDiffPanel` の stableKey client validation と focused test を実装済み。ローカル 5 点 evidence は PASS、Cloudflare Workers + auth + D1 前提の runtime screenshots は pending。

## 概要

`apps/web/app/(admin)/admin/schema/` には既に `SchemaDiffPanel` が存在する。本タスクは greenfield 追加ではなく、既存 `SchemaDiffPanel` / `postSchemaAlias` / server fetch 経路を現行 API contract（Worker: `/admin/schema/*`、browser proxy: `/api/admin/schema/*`）へ揃えて hardening する。design token は OKLch のみ。

## 13 Phase 成果物リンク表

| Phase | 区分 | 成果物 | パス |
| --- | --- | --- | --- |
| 01 | 要件整理 | requirements | `phase-01-requirements.md` / `outputs/phase-01/requirements.md` |
| 02 | 設計 | design | `phase-02-design.md` / `outputs/phase-02/design.md` |
| 03 | 設計レビュー | design-review | `phase-03-design-review.md` / `outputs/phase-03/design-review.md` |
| 04 | タスク分解 | test-creation | `phase-04-test-creation.md` / `outputs/phase-04/task-breakdown.md` |
| 05 | 実装計画 | implementation | `phase-05-implementation.md` / `outputs/phase-05/implementation-plan.md` |
| 06 | 実装手順 | test-expansion | `phase-06-test-expansion.md` / `outputs/phase-06/implementation-steps.md` |
| 07 | テスト方針 | coverage-check | `phase-07-coverage-check.md` / `outputs/phase-07/test-plan.md` |
| 08 | ドキュメント更新 | refactoring | `phase-08-refactoring.md` / `outputs/phase-08/docs-updates.md` |
| 09 | 受け入れ基準 | quality-assurance | `phase-09-quality-assurance.md` / `outputs/phase-09/acceptance.md` |
| 10 | リファクタ要点 | final-review | `phase-10-final-review.md` / `outputs/phase-10/refactor-summary.md` |
| 11 | エビデンス計画 | manual-test | `phase-11-manual-test.md` / `outputs/phase-11/evidence.md` |
| 12 | 実装ガイド + strict 7 | documentation | `phase-12-documentation.md` / `outputs/phase-12/` |
| 13 | PR ドラフト | pr-creation | `phase-13-pr-creation.md` / `outputs/phase-13/pr-summary.md` |

## 前提・依存関係

| 前提 | 内容 |
| --- | --- |
| step-01 useAdminMutation | hook の export 構造 + toast contract が確立済。ただし現行 `SchemaDiffPanel` は `apps/web/src/lib/admin/api.ts` の `postSchemaAlias` 経由なので、本 step は既存 helper を維持するか hook へ寄せるかを Phase 5 で明示判断する |
| parallel-08 shared foundation | ToastProvider 配置 / useAdminMutation 共通契約 |
| parallel-09 UX primitives | FormField / Icon / Pagination の再利用 |
| serial-05-step-02 pattern | 既存 component の責務分離を踏襲し、`SchemaDiffPanel` を無理に `SchemaDiffList` / `SchemaDiffResolveForm` へ分割しない |

## 不変条件

1. 既存 API endpoint surface のみ使用（D1 schema / Google Form schema / API route 変更禁止）
2. design token は OKLch のみ。HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止
3. env access は `getEnv()` / `getPublicEnv()` 経由（`process.env.*` 直接禁止）
4. test file は `*.spec.tsx` 固定（`*.test.tsx` 禁止）
5. `useAdminMutation` 本体は改変しない

## 関連リンク

- 親ワークフロー: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/`
- artifacts manifest: `artifacts.json`（root 正本） / `outputs/artifacts.json`（Phase evidence mirror。同一内容）
