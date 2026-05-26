# Lessons learned: Issue #842 admin mutation reliability policy

`useAdminMutation` に timeout / idempotent-only retry / idempotency-key / 404 success-relaxation policy / abort を実装し、`useConfirmDialog` に dialog close 時の mutation cancel 連携を追加、legacy `apps/web/src/lib/useAdminMutation.ts` を物理削除したサイクルの苦戦箇所と知見。

## L-I842-001: retry は idempotent method 限定。TS overload で型レベル強制する

retry を全 method に開放すると、非冪等な POST/PATCH の二重実行リスクが生まれる。`useAdminMutation` は overload を 2 本に分け、`IdempotentMethod = "PUT" | "DELETE"` の signature のみ `retry` を受け、`"POST" | "PATCH"` signature では `retry` を渡すと型エラーになる構造にした。retry の安全性を runtime check ではなく型で担保するのがポイント。POST/PATCH caller は既存 shape のまま無変更で動く。

## L-I842-002: AbortError は jsdom / Cloudflare Workers で DOMException となり `instanceof Error` が false

abort 検出を `e instanceof Error` で書くと jsdom / Workers ランタイムでは `DOMException` のため判定が漏れる。`(e as { name?: unknown })?.name === "AbortError"` の name 一致で判定する。AbortError は「意図的キャンセル」なので **silent**（failure toast なし・`onError` 呼ばない・retry しない）に扱い、timeout abort も同様にキャンセル扱いで retry 対象外とする。real error（5xx / network）との区別がこの policy の核心。

## L-I842-003: `treat404AsSuccess` の 3-value policy は用意するが default は `false`。現行 caller を強制移行しない

`Treat404AsSuccess = false | "silent" | { readonly toast: string }` を future の DELETE-like race のために定義したが、default は `false`（404 = real failure）。`MeetingAttendancePanel.tsx` は現状 POST-only で、かつての DELETE-404 前提は stale なため、policy 基盤だけ整備し caller migration は強制しない。「将来必要になる policy を先に置きつつ、現行コードを壊さない」境界を Phase 12 で明文化する。

## L-I842-004: `mutationFn` path は fetch signal を受けられない。timeout/retry/abort は non-applicable と明記する

`mutationFn`（任意の async 関数）経路には fetch `signal` を渡せないため、timeout / retry / abort signal の挙動は適用外。これを暗黙にせず implementation-guide の「エッジケース」に non-applicable と明記し、caller が hidden cancellation を期待しないようにする。後方互換のための明示的な仕様の穴埋め。

## L-I842-005: legacy hook 物理削除は grep で 0 caller を確認してから。barrel を新基盤へ re-point

`apps/web/src/lib/useAdminMutation.ts` と専用テストの削除前に、production 参照 0 件を `rg -n "lib/useAdminMutation" apps/` で確認（dead code 確定）。barrel（`features/admin/hooks/index.ts`）と全 caller が新基盤 `@/features/admin/hooks/useAdminMutation` のみを参照する状態にしてから削除する。CLAUDE.md 不変条件 10（legacy `@/lib/useAdminMutation` への新規参照を増やさない）の最終形が「legacy 物理削除」。

## L-I842-006: reference / changelog 追加後は同一 wave で `pnpm indexes:rebuild` を回す

aiworkflow-requirements に新規 `references/*-artifact-inventory.md` や `changelog/*.md` を追加した後 `indexes:rebuild` を回さないと、`indexes/topic-map.md` と `indexes/keywords.json` が drift し、CI `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）が fail する。本サイクルでは reference 追加後の rebuild が後追いになり drift が残っていた。同一 wave sync の締めに `pnpm indexes:rebuild` → `git status indexes/` で差分が新規ファイル索引化のみであることを確認する。[[feedback_prepush_ci_guards]] の pre-push hook でも先回り検出される。

## L-I842-007: flat workflow の Phase 12 は strict 7 outputs を着手時に placeholder 生成する

Phase 12 を instruction-only file のまま残すと、`outputs/phase-12/` strict 7（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と aiworkflow indexes / quick-reference / artifact inventory が後追い同期になり drift が出る。issue-277 の L-I277-005 と同一教訓の再発。workflow 着手時に空 placeholder を一括生成し Phase 進行とともに埋める運用を徹底する。前身 one-pager（`docs/30-workflows/completed-tasks/admin-mutation-timeout-policy.md`）は `consumed_by_canonical_workflow` に更新し、stale な実行ソースに着地させない。
