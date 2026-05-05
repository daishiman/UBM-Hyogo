# Phase 11 NON_VISUAL Main Evidence

Status: `runtime_evidence_collected` (2026-05-05)

## サマリー

`coverage-gate` が `main` / `dev` 両ブランチの `required_status_checks.contexts` に登録済であることを fresh GET evidence で確認した。Gate A 承認は本タスク外で消化済（PR #477 周辺で外部適用）であり、本フェーズでは read-only fresh GET による事後 evidence 収集と invariant 検証を行った。

## DoD 達成状況

| # | DoD | 状態 | 根拠 |
| --- | --- | --- | --- |
| 1 | main contexts に `coverage-gate` 含まれる | ✅ | `main-protection-after-full.json` / `contexts-preserved.log` |
| 2 | dev contexts に `coverage-gate` 含まれる | ✅ | `dev-protection-after-full.json` / `contexts-preserved.log` |
| 3 | Issue #475 起因の solo invariant drift なし | ✅ | `invariant-check.log` — main 完全一致 / dev は out-of-scope `required_pull_request_reviews` drift のみ（solo policy 方向、Issue #475 append-only 変更ではない） |
| 4 | 既存 contexts (`ci` / `Validate Build`) 保持 | ✅ | `contexts-preserved.log` — missing=[] |
| 5 | SSOT current applied 表更新 | ✅ | Phase 12 `system-spec-update-summary.md` / `ssot-diff.log` |
| 6 | coverage 未達 PR で merge button disabled 挙動 | △ 構造的確認のみ | `merge-gate-behavior.md` — 実 PR 観測は Gate B 後に先送り |

## 収集ファイル一覧

| ファイル | 内容 |
| --- | --- |
| `main-protection-after-full.json` | main fresh GET 完全 body |
| `dev-protection-after-full.json` | dev fresh GET 完全 body |
| `main-protection-after-normalized.json` | normalized projection（baseline 比較用） |
| `dev-protection-after-normalized.json` | 同上 |
| `main-drift.diff` | baseline 2026-05-01 → after 2026-05-05 unified diff（main） |
| `dev-drift.diff` | 同上（dev） |
| `invariant-check.log` | non-target fields 不変条件検査結果 |
| `contexts-preserved.log` | 既存 contexts 維持 + `coverage-gate` 1件追加の確認 |
| `merge-gate-behavior.md` | 構造的 merge gate 確認（実 PR 観測は Gate B 後） |
| `ssot-diff.log` | `deployment-branch-strategy.md` SSOT 更新 git diff |
| `manual-smoke-log.md` | 手動 smoke 実行ログ（fresh GET / jq 検証） |
| `link-checklist.md` | リンク存在確認 |

## Gate A / Gate B 取扱い

- **Gate A**: external GitHub PUT 承認は本タスク外で既に消化（PR #477 周辺の外部適用）。本フェーズでは追加 PUT は実行せず、read-only GET のみ。
- **Gate B**: commit / push / PR 作成は本サイクルで未実施（Phase 13 blocked）。throwaway 検証 PR は Gate B 取得後に実施する。
