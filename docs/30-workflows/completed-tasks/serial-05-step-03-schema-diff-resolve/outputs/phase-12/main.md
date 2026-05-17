**[実装区分: 実装仕様書]**

# Phase 12 — メインサマリー (serial-05-step-03-schema-diff-resolve)

## 1. 実装区分

- **タスク種別**: implementation
- **visualEvidence**: VISUAL
- **workflow_state**: `implemented-local-runtime-pending`
- **implementation_mode**: `existing-schema-diff-panel-hardening`
- **直列順序**: 3 / 5 (`serial-05-admin-mutation-ui`)

## 2. 状態語彙

| Key | Value |
| --- | --- |
| `workflow_state` | `implemented-local-runtime-pending` |
| `implementation_status` | `IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| `evidence_state` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| `phase_status (1-10,12)` | `completed` |
| `phase_status (11)` | `runtime_pending`（local 5 点 PASS、runtime screenshots pending） |
| `phase_status (13)` | `pending_user_approval` |
| `governance_mutation_user_gate` | `false`（PR 作成時のみ user 明示承認で `true`） |
| `runtime_evidence` | local 5 点 evidence captured。runtime screenshots は Cloudflare Workers + auth + D1 前提のため pending |

## 3. Phase 12 必須 7 ファイル所在

| # | ファイル | 絶対パス |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md`（本ファイル） |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 4 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 5 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 6 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |
| 7 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |

## 3.1 artifacts parity

`artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。

## 4. 各 DoD 結果リンク

| Phase | 成果物 | リンク |
| --- | --- | --- |
| 09 受け入れ基準 | acceptance.md | `../phase-09/acceptance.md` |
| 10 リファクタ要点 | refactor-summary.md | `../phase-10/refactor-summary.md` |
| 11 エビデンス計画 | evidence.md | `../phase-11/evidence.md` |
| 12 実装ガイド | implementation-guide.md | `./implementation-guide.md` |
| 13 PR ドラフト | pr-summary.md | `../phase-13/pr-summary.md` |

## 5. スコープ概要

- 既存 component: `SchemaDiffPanel`
- 実装 delta: stableKey regex client validation、table semantics、form focus、409/422 payload detail 表示、status 日本語化、validation alert `aria-describedby` 紐付け
- 既存 server fetch: `fetchAdmin("/admin/schema/diff")`
- API: browser proxy `/api/admin/schema/*` + Worker `/admin/schema/*`（実在確認済 2026-05-15）
- 前提: step-01 `useAdminMutation` hook 確立済 / `parallel-08` shared foundation 完了

## 6. 制約

- 既存 API endpoint surface のみ使用（D1 schema / Form schema 変更禁止）
- design token: OKLch のみ（HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止）
- env access は `getEnv()` / `getPublicEnv()` 経由（`process.env.*` 直接禁止）
- test file は `*.spec.tsx` 固定（`*.test.tsx` 禁止）
