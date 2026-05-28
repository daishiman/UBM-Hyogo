# Phase 12 — compliance / 未タスク検出

## 12.1 canonical 9 headings 整合

| # | heading | 該当ファイル |
|---|---------|--------------|
| 1 | Phase 01 Requirements | phase-01-requirements.md |
| 2 | Phase 02 Architecture | phase-02-architecture.md |
| 3 | Phase 03 Task Breakdown | phase-03-task-breakdown.md |
| 4 | Phase 04 Data Contract | phase-04-data-contract.md |
| 5 | Phase 05 Implementation Guide | phase-05-implementation-guide.md |
| 6 | Phase 06 Test Strategy | phase-06-test-strategy.md |
| 7 | Phase 07 Quality Gates | phase-07-quality-gates.md |
| 8 | Phase 08 DoD | phase-08-dod.md |
| 9 | Phase 09 Risks | phase-09-risks.md |
| (+10) | Phase 10 Local Verification | phase-10-local-verification.md |
| (+11) | Phase 11 Evidence Inventory | phase-11-evidence-inventory.md |
| (+12) | Phase 12 Compliance | 本ファイル |
| (+13) | Phase 13 Commit / PR Draft | phase-13-commit-pr-draft.md |

## 12.2 CONST 整合

| CONST | 内容 | 整合 |
|-------|------|------|
| CLAUDE.md #5 | D1 直接アクセスは apps/api に閉じる | 維持 (本タスクはコード変更無) |
| CLAUDE.md #11 | 認証境界 fail-closed | 維持 (secrets readiness false 時に fallback 許可せず) |
| CLAUDE.md #1 | Form schema 過剰固定の回避 | 維持 |
| Cloudflare CLI ルール | `cf.sh` 経由必須 | Phase 05 / 07 で強制 |
| 平文 secrets 禁止 | docs / code / commit に転記しない | Phase 07 G-SECRET / Phase 11 redact ルールで強制 |
| CONST_008 (本プロンプト) | 検出漏れは原則今回サイクル内で修正。未タスク化は例外 | 現時点で観測済みの未修正漏れは 0 件。Phase 03 §3.3 の候補は production 観測後に初めて確定するため、推測では formalize しない。観測時は本タスクを完了扱いにせずユーザーへエスカレーション |
| CONST_009 (本プロンプト) | docs-only ラベルより実態優先 | `apps/api` の diagnostics / cron / sync-lock / classifier は親 workflow で実装済み。今回の目的は production secrets / D1 / cron tail の runtime ops 境界固定であり、追加コード変更は不要 |
| CONST_010 (本プロンプト) | テスト・ローカル実行コマンド確認 | code-test 新規追加なし。Phase 10 の docs gate は commit 前に `git diff --check` / `bash scripts/verify-pr-ready.sh` で確認する |

## 12.3 未タスク検出 (unassigned-task-detection)

候補 grep 結果:

| 候補 | 判定 | 理由 |
|------|------|------|
| sync-lock TTL tuning (`SYNC_LOCK_TTL_MS` 適正値) | 未作成 | production 観測で stale lock 再発が確認された場合のみエスカレーション。未観測のため推測 formalize しない |
| sheets-auth-classifier reason 拡張 | 未作成 | unknown reason が production log で観測された場合のみエスカレーション。未観測のため推測 formalize しない |
| Forms API quota / SA governance (Issue #265) | 既存照合 | quota / governance 兆候が観測された場合に Issue #265 と照合し、不足があればユーザー判断で formalize |
| H2/H3/H4 修復 | 既存 followup-002/003/004 | 親 workflow で個別管理 |
| stale-lock 自動回収 (sync_jobs 側) | 未作成 | 1 回の手動 reset で足りるか、繰り返し必要かは production evidence 未取得。繰り返しが観測された場合のみエスカレーション |

→ 本タスク内 unassigned: 0 件。上記候補は未観測の条件分岐であり、CONST_008 の例外として backlog 送りにしたものではない。runtime execution cycle で実際に観測した場合は、ユーザー判断なしに「別 PR」へ送らない。

## 12.4 system-spec drift

本タスクは Cloudflare Secrets 投入のみで、`docs/00-getting-started-manual/specs/` 配下の仕様変更を伴わない。drift なし。

## 12.5 documentation changelog

| 日 | 変更 |
|----|------|
| 2026-05-27 | Phase 1-13 spec set 新規作成。Issue #956 (CLOSED) を refs として runtime ops を実行する手順を確定 |
