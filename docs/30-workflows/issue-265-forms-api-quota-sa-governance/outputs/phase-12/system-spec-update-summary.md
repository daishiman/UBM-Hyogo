---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 12
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 12 — System spec update summary

## 結論

CLAUDE.md および `docs/00-getting-started-manual/specs/` 配下を **更新しない**。本 spec は standalone governance doc として完結する。

## 判断根拠

| 観点 | 判断 | 理由 |
| --- | --- | --- |
| CLAUDE.md「フォーム固定値」 | 不変 | Form ID `119ec539...` は既掲載で本 spec も同値を引用するのみ |
| CLAUDE.md「重要な不変条件」 | 不変 | 11 項目すべて本 spec の前提と整合 |
| CLAUDE.md「シークレット管理」 | 不変 | op 参照 / `scripts/cf.sh` ルールに完全準拠 |
| CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | 不変 | 本 spec runbook が同ルールを再掲する形 |
| `specs/00-overview.md` | 不変 | システム全体概要を変更しない |
| `specs/01-api-schema.md` | 不変 | Forms API schema 変更なし |
| `specs/02-auth.md` | 不変 | Auth.js / OAuth 設計変更なし |
| `specs/08-free-database.md` | 不変 | D1 構成変更なし |
| `specs/13-mvp-auth.md` | 不変 | MVP 認証方針変更なし |

## 本 spec が新規導入するもの

- governance / runbook 文書 1 セット（`docs/30-workflows/issue-265-forms-api-quota-sa-governance/`）。
- 旧 unassigned-task `U-UT01-06-*.md` への `consumed: true` 追記（Phase 13 実施）。

## 既存 spec への参照追加（提案 / 実施なし）

- `aiworkflow-requirements/references/deployment-secrets-management.md` から本 spec への cross-link 提案（`skill-feedback-report.md` 参照）。

## 影響範囲

- 既存 doc / コード: 影響なし。
- 新規追加 docs: 24 ファイル（本 spec 配下のみ）。
- 既存 CI gate: `gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` で検証可能。drift なし。
