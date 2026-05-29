# issue-956 — H1 ingest 未稼働解消 (Google Forms sync secrets/cron production 投入)

[実装区分: ドキュメントのみ / runtime ops 手順書]

> 判定根拠 (CONST_004 例外):
> - 関連コード surface（diagnostics endpoint / cron handler / sync-lock TTL / sheets-auth-classifier）は親 workflow `google-form-reflection-diagnostics` (PR #960) で実装済み・dev merge 済み。
> - 本タスクは production Cloudflare Secrets 投入 + cron 起動観測 + D1 `sync_jobs` 滞留 row 手動 reset の **runtime ops のみ**。新規コード変更を含意する目的は無い。
> - したがってコード変更は伴わず、Phase 11 evidence は runtime snapshot / cron log / `cf.sh secret list` 出力で構成する。

## メタ

| 項目 | 内容 |
|------|------|
| タスクID | issue-956-h1-ingest-recovery |
| 親 workflow | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` (Spec-A) |
| 元 Issue | https://github.com/daishiman/UBM-Hyogo/issues/956 (CLOSED, refs 運用) |
| 元 spec | `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/unassigned-task-specs/google-form-reflection-diagnostics-followup-001-h1-ingest-recovery.md` |
| 優先度 | high (パイプライン根本断絶) |
| 規模 | medium |
| ステータス | spec_created / runtime_pending_user_approval |
| 区分 | docs-only / NON_VISUAL / runtime ops |
| artifacts | `artifacts.json` / `outputs/artifacts.json` |
| Phase 12 strict 7 | `outputs/phase-12/` |

## Phase index

| Phase | ファイル | 概要 |
|-------|----------|------|
| 01 | phase-01-requirements.md | 要件・H1 仮説・成功基準 |
| 02 | phase-02-architecture.md | runtime surfaces / 影響範囲 |
| 03 | phase-03-task-breakdown.md | 単一責務原則での分解 |
| 04 | phase-04-data-contract.md | snapshot JSON / D1 row 構造 |
| 05 | phase-05-implementation-guide.md | runtime ops 実行手順 |
| 06 | phase-06-test-strategy.md | 検証手順 (code-test なし、runtime check のみ) |
| 07 | phase-07-quality-gates.md | gate (cf.sh 経由必須 / secret 値非開示) |
| 08 | phase-08-dod.md | Definition of Done |
| 09 | phase-09-risks.md | リスクと対策 |
| 10 | phase-10-local-verification.md | local-verification 該当なし (production-only) |
| 11 | phase-11-evidence-inventory.md | snapshot / log / cf.sh 出力の保存先 |
| 12 | phase-12-compliance.md | 未タスク検出・CONST 整合 |
| 13 | phase-13-commit-pr-draft.md | docs commit & PR (runtime ops は別 commit/PR 不要) |

## 不変条件 (CLAUDE.md)

- CONST #5: D1 直接アクセスは `apps/api` に閉じる
- CONST #11: 認証境界 fail-closed (secrets readiness false 時に fallback 許可しない)
- Cloudflare CLI: `scripts/cf.sh` 経由必須 (`wrangler` 直叩き禁止)
- 平文 secrets 禁止: 値は 1Password に保管。docs / code / commit / log への転記禁止

## Runtime boundary

- 本 wave は canonical spec / Phase 12 strict 7 / 正本索引同期まで完了。
- production secrets 投入、production D1 SELECT/UPDATE、authenticated snapshot 取得、cron tail、commit、push、PR はユーザー明示承認後に実施する。
- runtime PASS は `outputs/phase-11/snapshot-after.json` と `outputs/phase-11/snapshot-diff.md` が揃うまで主張しない。
