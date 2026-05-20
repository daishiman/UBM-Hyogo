---
phase: 11
title: 視覚証跡 — screenshot plan / capture metadata
workflow_id: parallel-i05-login-loading-and-error-focus
status: local_evidence_captured_runtime_visual_pending
visualEvidence: VISUAL
---

# Phase 11: 証跡インベントリ

[実装区分: 実装仕様書]

## 1. タスク種別判定（[Feedback 3] / [Feedback W1-02b-1]）

- 種別: **VISUAL / UI task**
- 根拠: `/login` route の DOM 構造・skeleton 表示・error UI が変化する
- Phase 1 で記録した分類と同一であることを確認

## 2. screenshot 計画

| ID | screenshot 名 | 状態 | viewport | dark mode |
|----|---------------|------|----------|-----------|
| TC-01 | `login-loading-skeleton.png` | `/login` route transition 中の skeleton 表示 | 1280x800 | light |
| TC-02 | `login-error-default.png` | `/login` で error 発生（digest なし） | 1280x800 | light |
| TC-03 | `login-error-with-digest.png` | `/login` で error 発生（digest あり） | 1280x800 | light |
| TC-04 | `login-error-focused-heading.png` | h1 に focus リングが当たった状態（DevTools `:focus` 強制） | 1280x800 | light |

screenshot ファイルは `outputs/phase-11/screenshots/` 配下に置き、命名は canonical（`<component>-<state>.png`）で固定（[FB-LLM-MOD-05-001]）。現時点では runtime screenshot は未取得であり、1x1 placeholder PNG は実画面証跡として扱わない。

## 3. capture metadata

`outputs/phase-11/phase11-capture-metadata.json` 例:

```json
{
  "taskId": "parallel-i05-login-loading-and-error-focus",
  "mode": "VISUAL",
  "viewport": { "width": 1280, "height": 800 },
  "browser": "chromium",
  "captures": [
    { "tc": "TC-01", "file": "screenshots/login-loading-skeleton.png", "route": "/login", "state": "loading" },
    { "tc": "TC-02", "file": "screenshots/login-error-default.png", "route": "/login", "state": "error", "digest": null },
    { "tc": "TC-03", "file": "screenshots/login-error-with-digest.png", "route": "/login", "state": "error", "digest": "abc123" },
    { "tc": "TC-04", "file": "screenshots/login-error-focused-heading.png", "route": "/login", "state": "error-focused", "digest": null }
  ]
}
```

## 4. screenshot-plan.json

`outputs/phase-11/screenshot-plan.json`:

```json
{
  "mode": "VISUAL",
  "viewports": [{ "width": 1280, "height": 800 }],
  "scenarios": [
    { "id": "TC-01", "name": "login loading skeleton", "route": "/login", "trigger": "slow-network-throttle" },
    { "id": "TC-02", "name": "login error default", "route": "/login", "trigger": "force-throw" },
    { "id": "TC-03", "name": "login error with digest", "route": "/login", "trigger": "force-throw-with-digest" },
    { "id": "TC-04", "name": "login error focused heading", "route": "/login", "trigger": "force-throw-and-focus-ring" }
  ]
}
```

## 5. capture スクリプト雛形（[FB-MSO-003]）

```ts
// scripts/capture-i05-evidence.mjs（任意・ローカル用）
import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  // TC-01..TC-04 を順次キャプチャ
  // ...
} finally {
  await browser.close();
}
```

`try { ... } finally { browser.close() }` パターンで port 解放を保証する。

## 6. manual test result（Phase 11 evidence）

`outputs/phase-11/manual-test-result.md` に以下を記録:

- タスク種別: VISUAL
- 証跡主ソース: focused Vitest 4 件 PASS（loading/error contract assertions）
- runtime screenshot: pending_user_approval（TC-01〜TC-04 は未取得）
- 確認環境: Vitest + jsdom
- 既知制限: browser runtime / VoiceOver / screenshot visual QA は未取得

## 7. evidence parity

| ファイル | 同一 wave 更新 |
|---------|---------------|
| `outputs/phase-11/screenshots/*.png` | pending_user_approval（runtime screenshot は未取得。1x1 placeholder は証跡から除外） |
| `outputs/phase-11/phase11-capture-metadata.json` | present |
| `outputs/phase-11/screenshot-plan.json` | present |
| `outputs/phase-11/manual-test-result.md` | present |
| `outputs/phase-12/implementation-guide.md` の screenshot 参照 | present（runtime screenshot は pending と明記） |
| `artifacts.json` outputs[].phase_11 | present |

## 8. ui-sanity-visual-review.md

VISUAL タスクのため、`outputs/phase-11/ui-sanity-visual-review.md` を作成し、Apple HIG 観点（contrast / focus ring 視認性 / motion safety）を 1-2 行でレビューする。


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 11 |
| status | local_evidence_captured_runtime_visual_pending |
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
- Phase 12 compliance check が local deterministic evidence と runtime visual pending を分離している。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が local deterministic scope で completed。

## 統合テスト連携

Focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx`。Runtime screenshot は user-gated evidence として Phase 13 境界に残す。
