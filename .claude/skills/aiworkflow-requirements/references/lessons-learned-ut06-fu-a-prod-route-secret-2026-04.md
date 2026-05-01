# Lessons Learned: UT-06-FU-A-PROD-ROUTE-SECRET-001（2026-04）

## 概要

UT-06-FU-A-PROD-ROUTE-SECRET-001 は OpenNext Workers production cutover 前の route / custom domain / secret key / observability target の split-brain 防止 runbook を docs-only / NON_VISUAL / `spec_created` で確定し、Phase 12 close-out で `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` 配下へ移動した。実際の Cloudflare 状態 mutation・production deploy・DNS 切替・旧 Worker 削除はすべて別承認に分離している。

## 教訓

### L-UT06FUA-001: Phase 12 canonical filename drift（`system-spec-update.md` ↔ `system-spec-update-summary.md`）

- 苦戦箇所: Phase 12 出力に `system-spec-update.md` と `system-spec-update-summary.md` の表記が混在し、どちらが canonical かが review wave で特定しづらかった。
- 再発防止: Phase 12 では `system-spec-update-summary.md` を canonical として固定し、`task-specification-creator` skill 側のテンプレ・チェックリスト・filename strict check に反映する。`system-spec-update.md` は alias として記録するか、撤去する。

### L-UT06FUA-002: NON_VISUAL infrastructure verification の Phase 11 境界

- 苦戦箇所: Phase 11 evidence template（`manual-verification-log.md` / `route-snapshot.md` / `secret-keys-snapshot.md` / `tail-sample.md` / `legacy-worker-disposition.md` / `runbook-walkthrough.md` / `grep-integrity.md`）が完了したことを「production 実測 PASS」と読み違えやすい。
- 再発防止: Phase 11 完了は「runbook と evidence template の format / 構造 PASS」のみを意味し、production 実測 PASS は別承認 operation である旨を runbook と Phase 12 implementation guide に明記する。`VerificationResult` 型に `TBD_APPROVED_VERIFICATION` を残し、未実測領域を fail-closed に表現する。

### L-UT06FUA-003: completed-tasks 配置タイミングと skill index のパス drift

- 苦戦箇所: workflow root を `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` で起票したまま、close-out で `docs/30-workflows/completed-tasks/` 配下へ移動したため、`SKILL.md` / `quick-reference.md` / `resource-map.md` / `deployment-cloudflare-opennext-workers.md` / `task-workflow-active.md` の 5 ファイルにパス drift が残存した。
- 再発防止: 完了タスクを `completed-tasks/` 配下へ移動する wave では `rg -n "30-workflows/<workflow-id>"` を `.claude/skills/aiworkflow-requirements/{indexes,references,SKILL.md}` に対して必ず実行し、grep ヒットが 0 件になるまで同一 wave で補正する。原典 unassigned ファイルも同時に `completed-tasks/` 直下へ移動するなら同様にパス grep を再走させる。

### L-UT06FUA-004: secret 値非記録 / `bash scripts/cf.sh` ラッパー強制

- 苦戦箇所: route / secret / observability の preflight では production 値（API Token / OAuth client secret / cookie secret 等）の確認需要が発生するが、ログ・スクリーンショット・コミットに実値が混入する事故を起こしやすい。
- 再発防止: secret は **key 名のみ** を記録し、値は記録しない。Cloudflare 操作はすべて `bash scripts/cf.sh` ラッパー経由とし、`wrangler` 直叩きを runbook / Phase 12 implementation guide / lessons-learned で禁止する。`wrangler login` の persistent OAuth は使用禁止、1Password 経由 op run 注入を一本化する。

### L-UT06FUA-005: runbook walkthrough のみで PASS にしない

- 苦戦箇所: `runbook-walkthrough.md` evidence は「runbook を読んだ」だけでも生成可能で、production 実測なしに PASS と勘違いしやすい。
- 再発防止: runbook walkthrough は「runbook 自体が production cutover の意思決定境界を網羅しているか」の structural check であり、route / secret / observability の実測 PASS は `manual-verification-log.md` 側に承認付きで記録する。Phase 12 ステータスは `runbook walkthrough PASS` 単独で `completed` に昇格させない。

### L-UT06FUA-006: route mismatch 検出時の deploy block

- 苦戦箇所: `[env.production].name = "ubm-hyogo-web-production"` を使う cutover では、route / custom domain が旧 Worker（Pages 含む）を指したまま deploy すると split-brain になる。「とりあえず deploy して切り戻し」は許容できない。
- 再発防止: route / custom domain が新 Worker (`ubm-hyogo-web-production`) を指していない場合は、preflight 段階で deploy 承認を block する。runbook の error handling table に「route mismatch」「missing secret key」「secret value visible」「old Worker deletion requested」を明示し、いずれも deploy block / redact / 別承認に分岐させる。

### L-UT06FUA-007: legacy worker 削除は別承認

- 苦戦箇所: cutover 完了後の旧 Pages project / 旧 Worker 削除の判断を、本タスクの runbook 内で完結させてしまう誘惑が発生する。
- 再発防止: `legacy-worker-disposition.md` は `retain` / `separate-approval-required` の 2 値のみを記録対象とし、削除実行・rollback 経路の閉塞は本タスクで実施しない。削除は別タスク（route inventory script / Logpush target diff script の follow-up とは独立）で起票する。

## 関連リソース

- `references/deployment-cloudflare-opennext-workers.md`
- `references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md`
- `references/task-workflow-active.md`
- `indexes/quick-reference.md`（§UT-06-FU-A Production Worker Preflight）
- `indexes/resource-map.md`（OpenNext Workers production cutover preflight 行）
- `LOGS/20260430-ut06-fu-a-prod-route-secret-close-out.md`
- workflow root: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`
- runbook: `outputs/phase-05/runbook.md`
- Phase 12 出力: `outputs/phase-12/{system-spec-update-summary.md, implementation-guide.md, documentation-changelog.md, skill-feedback-report.md}`
