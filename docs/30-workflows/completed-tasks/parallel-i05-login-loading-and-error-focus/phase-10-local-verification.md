---
phase: 10
title: ローカル検証 — dev server / screen reader / 最終レビュー
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 10: ローカル検証 / 最終レビュー

[実装区分: 実装仕様書]

## 1. 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run login
mise exec -- pnpm -F "@ubm-hyogo/web" build
```

期待: 全コマンド exit 0。

## 2. dev server 起動と動作確認

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" dev
# -> http://localhost:3000/login にアクセス
```

### 2.1 loading 状態の確認

- DevTools Network タブで throttling を「Slow 3G」に設定
- `/login` へ navigation すると skeleton が表示されることを確認
- DevTools Accessibility ツリーで `role=status` / `aria-busy=true` を確認
- macOS VoiceOver / NVDA で「ログイン画面を読み込み中」アナウンスを確認

### 2.2 error 状態の確認

`apps/web/app/login/page.tsx` に一時的に `throw new Error("test error")` を追加してエラーを発生させ、以下を確認:

- `<section role="alert" aria-live="assertive">` 構造
- h1 に focus が当たっている（DevTools `document.activeElement` で確認）
- `error.digest` がある場合 `<code>error id: xxx</code>` が表示される
- 「再読み込み」button click で boundary が reset される

確認後、一時的な `throw` を必ず revert する。

## 3. 最終レビューチェックリスト（acceptance criteria）

| ID | 受け入れ条件 | 確認方法 | 結果 |
|----|-------------|---------|------|
| AC-01 | loading 要素に `role="status"` | DevTools Inspector | |
| AC-02 | loading 要素に `aria-busy="true"` | DevTools Inspector | |
| AC-03 | loading 要素に `aria-live="polite"` | DevTools Inspector | |
| AC-04 | sr-only テキスト存在 | DevTools / VoiceOver | |
| AC-05 | error h1 自動 focus | DevTools `document.activeElement` | |
| AC-06 | section `aria-live="assertive"` | DevTools Inspector | |
| AC-07 | digest 条件 render | digest あり / なし両方確認 | |
| AC-08 | reset button 動作 | click 後の boundary reset | |
| AC-09 | HEX 直書きなし | `grep` 0 件 | |
| AC-10 | `*.test.tsx` なし | `find` 0 件 | |

## 4. MINOR 指摘の扱い（Phase 10）

レビュー中に発見した MINOR 指摘は、unassigned-task-detection.md（Phase 12 Task 12-4）に必ず登録する。「機能に影響なし」を理由に却下しない。

## 5. blocker 判定

| 種別 | 判定 |
|------|------|
| ビルド fail | blocker |
| typecheck / lint fail | blocker |
| TC-LE-01〜05 / TC-LL-01〜02 のいずれか fail | blocker |
| MINOR a11y 指摘 | 未タスク化（blocker でない） |
| Card primitive 未採用 | blocker でない（best-effort） |

## 6. 完了サイン

Phase 7 / 8 のゲートが全 PASS | 4 tests（TC-LL-01..02 + TC-LE-01..05 を 7 assertions で網羅）かつ §3 acceptance 全 OK の場合、Phase 11 へ進む。

## 7. 実行結果（2026-05-18 review cycle）

| Check | Result |
| --- | --- |
| Focused Vitest | exit 0: 2 files passed / 4 tests passed |
| token grep | exit 0: login route HEX / arbitrary color / `*.test.tsx` 0 hits |
| typecheck | exit 0 |
| lint | exit 0 |
| web build | exit 0 with existing framework/Sentry warnings |
| runtime browser screenshot | pending runtime capture; placeholder PNG files removed from evidence |


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 10 |
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
