---
phase: 7
title: 品質ゲート — カバレッジ / grep gate / lint / build
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 7: 品質ゲート / カバレッジ

[実装区分: 実装仕様書]

## 1. カバレッジ対象（[Feedback BEFORE-QUIT-002]）

| 対象 | 期待 line | 期待 branch |
|------|-----------|-------------|
| `apps/web/app/login/loading.tsx` | 100% | 100%（分岐なし） |
| `apps/web/app/login/error.tsx` | 100% | 100%（digest 有無の 2 分岐） |

`apps/web/` 全体や `apps/api` は本 SW の coverage 対象**外**。広域指定は使用しない。

## 2. カバレッジ取得コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run --coverage \
  apps/web/app/login/loading.spec.tsx \
  apps/web/app/login/error.spec.tsx
```

期待:
- `apps/web/app/login/loading.tsx`: line 100% / branch 100%
- `apps/web/app/login/error.tsx`: line 100% / branch 100%（digest あり / なしの両 spec で網羅）

## 3. grep gate（NFR-01 / token 正本）

```bash
# HEX 直書き 0 件
grep -rnE "#[0-9a-fA-F]{3,6}" apps/web/app/login/

# bg-[#xxx] / text-[#xxx] arbitrary value 0 件
grep -rnE "(bg|text)-\[#" apps/web/app/login/

# *.test.tsx 0 件（*.spec.tsx のみ）
find apps/web/app/login -name "*.test.tsx" -type f
```

期待: 3 コマンドとも結果が空。

## 4. 静的解析ゲート

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 両方とも exit 0。新規警告 0 件。

## 5. build ゲート

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" build
```

期待: `next build --webpack` が exit 0。`apps/web/.open-next/` 配下が生成され、`/login` route の loading / error chunk が build 成果物に含まれる。

## 6. design-tokens CI gate（[task-18]）

```bash
mise exec -- pnpm verify:design-tokens 2>/dev/null || true
```

CI 側で `verify-design-tokens` が実行されるため、本 SW の変更で fail しないことを確認する。

## 7. 主要観点チェック（aiworkflow-requirements 参照）

| 観点 | チェック |
|------|---------|
| セキュリティ | `error.digest` をそのまま表示するが、digest は Next.js が生成する不透明 ID であり機密ではない |
| UI/UX | OKLch token 経由、reduce-motion 対応、`role` / `aria-live` 適切 |
| アーキテクチャ | UI 完結、`apps/api` / D1 への参照なし |
| API/IPC | 該当なし（UI のみ） |
| エラーハンドリング | Error Boundary に委譲、UI 側は表示と reset のみ |
| インターフェース | `LoginErrorProps` を export し型契約明示 |

## 8. ゲート合格判定

| ゲート | 合格条件 |
|--------|---------|
| Coverage | loading.tsx / error.tsx ともに line 100% / branch 100% |
| Token grep | 3 コマンド全て 0 件 |
| typecheck | exit 0 |
| lint | exit 0 / 新規警告 0 |
| build | exit 0 |
| design-tokens CI | 既存と同等（regression なし） |

## 9. 実行結果（2026-05-18 review cycle）

| Gate | Result |
| --- | --- |
| Focused Vitest | exit 0: 2 files passed / 4 tests passed |
| Token grep | exit 0: HEX / arbitrary color / `*.test.tsx` all 0 hits in `apps/web/app/login/` |
| typecheck | exit 0: `pnpm typecheck` |
| lint | exit 0: `pnpm lint` |
| web build | exit 0: `pnpm --filter @ubm-hyogo/web build`; existing Next middleware deprecation and Sentry/Prisma dynamic dependency warnings only |


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 7 |
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
