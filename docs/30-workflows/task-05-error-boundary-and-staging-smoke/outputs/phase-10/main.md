# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-10/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## レビュー観点チェックリスト

### コード品質

- [ ] `error.tsx` の `useEffect` 依存配列が `[error]` のみ（reset を入れない）
- [ ] `"use client"` directive が `error.tsx` / `global-error.tsx` の冒頭にある
- [ ] `next/link` を `not-found.tsx` で使用している（生 `<a>` は外部 URL のみ）
- [ ] aria 属性: `error.tsx` `role="alert" aria-live="assertive"` / `loading.tsx` `aria-busy="true" aria-live="polite"`
- [ ] token 直書き禁止（grep gate pass）

### 不変条件

- [ ] D1 直接アクセスなし（`apps/web` 配下に D1 binding 参照なし）
- [ ] 既存 API endpoint surface への変更なし
- [ ] Google Form schema 関連の変更なし
- [ ] Sentry SDK 直 import なし（logger 経由）

### 上流契約整合

- [ ] `@/lib/logger`（task-04）の API のみ使用
- [ ] `getEnv()` 経由の env 参照（playwright config の `process.env.STAGING_BASE_URL` を除く）
- [ ] event string が task-04 予約 union と一致

### Diff scope 規律（SCOPE.md §6）

- [ ] `git diff --name-only main...HEAD` が以下に限定:
  - `apps/web/app/error.tsx`
  - `apps/web/app/global-error.tsx`
  - `apps/web/app/not-found.tsx`
  - `apps/web/app/loading.tsx`
  - `apps/web/app/__tests__/error.test.tsx`
  - `apps/web/app/(public)/members/__broken__/page.tsx`（任意 fixture）
  - `apps/web/tests/e2e/staging-smoke.spec.ts`
  - `apps/web/playwright.config.ts`
  - `apps/web/package.json`
  - `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
  - `docs/30-workflows/task-05-error-boundary-and-staging-smoke/**`

### Phase 11 evidence 準備

- [ ] `outputs/phase-11/evidence/` directory が作成可能
- [ ] Sentry dashboard へのアクセス権限を所持している

## 完了条件

- [ ] 上記チェックリストが全て [x]
- [ ] 残課題（task-15 / task-18 への引き継ぎ）が index.md に明記
