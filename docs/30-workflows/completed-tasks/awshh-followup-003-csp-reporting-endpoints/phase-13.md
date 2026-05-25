# Phase 13: PR 作成

## 前提: user 明示承認後のみ実行（CONST_002）

本フェーズは user が明示承認するまで `blocked`。AI は自律的に commit / push / PR 作成しない。

## 実行内容（承認後）

1. base = `dev`（既定ブランチ。production リリース時のみ main）
2. 作業ブランチ: `feat/awshh-followup-003-csp-reporting-endpoints`
3. PR 本文: `outputs/phase-12/implementation-guide.md` を反映
4. Issue #868 は **CLOSED のまま**（再オープンしない）。実装 PR は CLOSED issue を参照する形で作成する

## PR 含めるファイル

- `apps/web/src/lib/security-headers.ts`
- `apps/web/src/lib/env.ts`
- `apps/web/middleware.ts`
- `apps/web/src/lib/security-headers.spec.ts`
- `apps/web/src/lib/__tests__/env.spec.ts`
- `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/` 一式

## 完了条件

- [ ] user 承認取得
- [ ] typecheck / lint / 単体テスト green
- [ ] PR 作成（base=dev）
- [ ] Issue #868 CLOSED 維持（再オープンしない）
