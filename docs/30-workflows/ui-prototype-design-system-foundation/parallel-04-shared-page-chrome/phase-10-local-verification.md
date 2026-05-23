---
phase: 10
title: ローカル検証コマンド
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 10 — ローカル検証コマンド

[実装区分: 実装仕様書]

すべて `mise exec --` 経由で実行する（Node 24 を保証 / CLAUDE.md 開発環境ルール）。

## 1. 事前準備

```bash
cd <repo-root>
mise exec -- pnpm install
```

## 2. 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 3. ユニットテスト（本サブワークフロー範囲）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__
# 個別:
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/__tests__/layout.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/__tests__/error.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/__tests__/not-found.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/__tests__/loading.spec.tsx
```

## 4. デザイントークン / テスト suffix gate

```bash
mise exec -- pnpm verify:tokens
test -z "$(find apps/web -name '*.test.*' -print -quit)"
```

## 5. ビルド検証（Cloudflare Workers 互換）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

> CLAUDE.md：`apps/web` の production build は OpenNext Workers 互換のため `next build --webpack` を正本とする。`pnpm --filter @ubm-hyogo/web build` の script がこれを呼び出す前提。

## 6. dev サーバ起動（手動目視確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# ブラウザで以下を確認:
# - http://localhost:3000/                         (root layout が描画される)
# - http://localhost:3000/__not_exist_route_xyz   (not-found.tsx 描画)
# - http://localhost:3000/__smoke__/loading-state (既存 smoke route で loading.tsx 描画)
# - http://localhost:3000/__smoke__/error-state   (既存スモークがあれば error.tsx 描画)
```

> 既存の smoke route が見当たらない場合、開発時のみ意図的に `throw new Error("smoke")` する RSC を作成して確認する。本サブワークフローでは smoke route 自体を成果物に含めない。

## 7. ToastProvider 単一配置 grep

```bash
find apps/web/app -path '*/__tests__/*' -prune -o -type f \( -name '*.tsx' -o -name '*.ts' \) -print | xargs rg -n "ToastProvider"
# 期待出力: apps/web/app/layout.tsx の import / render のみ
```

## 8. HEX 直書き grep（補助）

```bash
grep -rEn "#[0-9a-fA-F]{3,8}\b" apps/web/app/layout.tsx apps/web/app/error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx
# 期待出力: 0 件
```

## 9. PR pre-flight

```bash
bash scripts/verify-pr-ready.sh
```

失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照する。

## 10. data-theme cascade 目視確認

dev server 起動後、ブラウザ devtools の Elements パネルで以下を確認:

- `<html>` に `data-theme="warm"` が付いている
- `:root` の OKLch CSS 変数（`--ubm-color-*`）が解決済み
- body の `background-color` が `var(--ubm-color-surface-bg)` 由来の値になっている（parallel-01 完了後）

## 11. 検証順序サマリ

1. install
2. typecheck → lint
3. unit test
4. token / suffix gate
5. build
6. （任意）dev server 目視
7. grep 補助
8. verify-pr-ready

すべて green になったら PR 作成フェーズ（Phase 13）に進む。
