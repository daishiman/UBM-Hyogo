# Phase 12 — 正本同期 main

## Status: runtime_pending (implemented_local_evidence_captured / Phase 13 blocked_pending_user_approval)

## Summary

`parallel-10-auth-session-handling` の Phase 1〜12 を本サイクル内で完遂した。

- `apps/web/src/features/admin/hooks/useAdminMutation.ts` を新規実装し、same-origin `/api/admin/*` の 401 → `toLoginRedirect(currentPath)` redirect、403 → alert toast + error state、その他 → error state の 3 経路を catch する mutation 共通 hook を提供。
- `apps/web/src/components/ui/Toast.tsx` を後方互換に `variant: "alert" | "status"` で拡張、`aria-live="assertive"` 領域を追加。
- hook spec / Toast spec を新規追加し、`isLoading=true` 中間状態、ToastProvider 未配置 fallback、401/403/500/generic error を固定。`toLoginRedirect` spec には `/login?redirect=...` loop 防止を追加。
- silent refresh は MVP 不採用と決定（`auth-session-policy.md`）。
- 全 evidence (typecheck / lint / test / build) exit 0。
- `docs/00-getting-started-manual/specs/02-auth.md` に「Client 401 / 403 ハンドリング」セクションを追記。

## PASS/FAIL Verdict

**runtime_pending (implemented_local_evidence_captured)** — AC-1〜AC-9 の local boundary は充足、Phase 11 evidence 4 ログ exit 0、Phase 12 必須 7 ファイル生成済み。Phase 13 の commit / push / PR は user gate。

## Evidence Ledger

| evidence | path | exit |
| --- | --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.txt` | 0 |
| lint | `outputs/phase-11/evidence/lint.txt` | 0 |
| test | `outputs/phase-11/evidence/test.txt` | 0 |
| build | `outputs/phase-11/evidence/build.txt` | 0 |
| visual skip | `outputs/phase-11/visual-verification-skip.md` | NON_VISUAL 根拠 |

## Boundary

- ローカル検証境界: typecheck / lint / vitest / `next build --webpack` の 4 つを `mise exec -- pnpm ...` 経由で実行済み。
- Runtime ゲート: e2e (Playwright) での 401 redirect 観測は上位 runtime gate で扱う。本タスクは NON_VISUAL の local hook / a11y contract。
- `.claude/skills/aiworkflow-requirements` の quick-reference / resource-map / task-workflow-active を same-wave 同期済み。
- commit / push / PR 作成はユーザー指示後に実施（本実装プロンプトの禁止事項）。
