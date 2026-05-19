---
phase: 8
title: DoD / リファクタリング判定
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 8: DoD（Definition of Done）

[実装区分: 実装仕様書]

## 1. 機能 DoD

- [ ] `apps/web/app/login/loading.tsx` が新規作成され、default export `LoginLoading` を持つ
- [ ] loading 要素が `role="status"` / `aria-busy="true"` / `aria-live="polite"` を持つ
- [ ] sr-only テキスト「ログイン画面を読み込み中」が存在する
- [ ] skeleton が OKLch token utility（`bg-surface-2`）を使用、HEX 直書きなし
- [ ] `apps/web/app/login/error.tsx` の h1 に `useRef` が bind され、`useEffect` で `focus({ preventScroll: true })` が呼ばれる
- [ ] section に `aria-live="assertive"` が追加されている
- [ ] `error.digest` が truthy のときのみ `<code>error id: {digest}</code>` が render される
- [ ] `reset` button click で `reset()` が呼ばれる
- [ ] `LoginErrorProps` interface が export されている

## 2. テスト DoD

- [ ] `loading.spec.tsx` の TC-LL-01 / TC-LL-02 が PASS
- [ ] `error.spec.tsx` の TC-LE-01〜TC-LE-05 が PASS
- [ ] テストファイル名は `*.spec.tsx`（`*.test.tsx` なし）
- [ ] 対象 2 ファイルの line / branch coverage 100%

## 3. 品質ゲート DoD

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0（新規警告なし）
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" build` exit 0
- [ ] `grep -rnE "#[0-9a-fA-F]{3,6}" apps/web/app/login/` 0 件
- [ ] `grep -rnE "(bg|text)-\[#" apps/web/app/login/` 0 件
- [ ] `find apps/web/app/login -name "*.test.tsx"` 0 件

## 4. 親 SW DoD への寄与

- [ ] `parallel-07-auth-and-shared` spec §4.1（loading.tsx）達成
- [ ] `parallel-07-auth-and-shared` spec §4.2（error focus / aria-live）達成
- [ ] p-07 DoD line 141, 142 達成

## 5. リファクタリング（Phase 8 軽量化）

本 SW では新規 2-3 ファイルの追加・修正に留まるため、独立した refactor wave は不要。
ただし以下を Phase 5 内で同時実施する:

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `error.tsx` props 型 | inline / 暗黙 | `LoginErrorProps` interface 化 + export | 再利用と型契約明示 |
| `error.tsx` useEffect | console.error のみ | console.error + focus 移譲 | a11y |
| `error.tsx` section attrs | `role="alert"` | + `aria-live="assertive"` + `data-page` | SR / E2E selector |

## 6. 完了確認スクリプト

```bash
# 機能 DoD
test -f apps/web/app/login/loading.tsx
test -f apps/web/app/login/error.tsx
test -f apps/web/app/login/loading.spec.tsx
test -f apps/web/app/login/error.spec.tsx

# テスト DoD
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run login

# 品質ゲート DoD
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" build
grep -rnE "#[0-9a-fA-F]{3,6}" apps/web/app/login/ && echo "FAIL: HEX found"
grep -rnE "(bg|text)-\[#" apps/web/app/login/ && echo "FAIL: arbitrary value found"
find apps/web/app/login -name "*.test.tsx" -type f
```


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 8 |
| status | completed |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。

## 統合テスト連携

Focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx`。Runtime screenshot は user-gated evidence として Phase 13 境界に残す。
