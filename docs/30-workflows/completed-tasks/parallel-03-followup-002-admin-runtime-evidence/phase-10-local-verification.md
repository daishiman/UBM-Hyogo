---
phase: 10
title: 最終レビュー — ローカル検証コマンド集と受入判定
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 10 — 最終レビュー & ローカル検証

[実装区分: 実装仕様書]

## 1. ローカル検証コマンド（実装時に上から順に実行）

```bash
# 0) Node 24 / 依存整合（worktree 直後の esbuild darwin mismatch 予防）
mise exec -- pnpm install

# 1) scrape spec 実行 → EV-12 evidence 生成
cd apps/web
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium --reporter=line
cd -

# 2) evidence 存在 + 契約属性 hit を確認
test -s docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt
grep -E 'data-(theme|route-group|route|shell|testid)=' \
  docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt

# 3) HEX 直書き非混入（OKLch 不変条件）
! grep -E '#[0-9a-fA-F]{3,6}\b' \
  docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt

# 4) gate / 型 / lint
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 2. 受入判定（Phase 1 AC との対応）

| AC | 検証コマンド | 合格条件 |
|----|--------------|----------|
| AC-1 | step 1 | spec が pass し `dom-scrape-admin.txt` 生成 |
| AC-2 | step 2 | grep が `data-theme=` / `data-route-group=` / `data-route=` を各 1 件以上 hit |
| AC-3 | 目視 + diff | 親 EV-12 Status=`present`、取得手順が current grep に最適化済み |
| AC-4 | 目視 | 親台帳に EV-13/15/16 の委譲先・理由を明記 |
| AC-5 | step 4 | `verify:phase12-compliance` が 0 fail（status 語彙 valid 含む） |
| AC-6 | step 3 + TC-07 | HEX 非混入 + 既存 API / プロトタイプ正本 / D1 直接アクセス禁止を維持 |

## 3. blocker 判定

- production code 無変更のため build blocker は想定しない。
- 唯一の blocker 候補は「mock API が admin shell を SSR しない」場合（R-01）。その際は fixture の mock route（`/admin/dashboard` 等）が shell 描画に十分なデータを返すか確認し、不足時は fixture 側 mock を最小拡張する（production runtime には影響しない）。

## 4. 出力（自 workflow outputs/phase-10）

実装実行時に `outputs/phase-10/final-review-result.md` へ上記コマンドの実行結果（pass/fail）を記録する。本 spec 段階では未生成。
