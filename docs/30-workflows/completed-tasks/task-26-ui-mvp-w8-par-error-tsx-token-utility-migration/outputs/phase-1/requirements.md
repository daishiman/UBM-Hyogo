# Phase 1 — 要件定義

## P50 チェック（前提確認）

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に error.tsx 実装が存在する | Yes（`apps/web/app/error.tsx`） | 現行 App Router topology で実装する |
| upstream（task-05）が完了済み | Yes（task-05 完了報告あり） | 差分確認モード |
| 前提タスク（task-08 / task-09）が完了済み | Yes | utility bridge 利用前提で進める |

`implementation_mode: "verify_existing"`（既存実装の token utility 置換 = pure rename / 命名齟齬解消）

## タスク分類

- **UI task**: 表示色の表現を変えるため UI layer の変更
- **VISUAL 判定**: VISUAL。className literal の置換だが実 UI surface（error / not-found / loading）を変更するため、Phase 11 で local screenshot と deterministic tests を証跡化する
- 広域 visual regression は downstream task-18 の `playwright-smoke / visual` に委譲する

## 受入条件

1. `apps/web/app/error.tsx` 内に `text-\[var\(` / `bg-\[var\(` / `border-\[var\(` の Tailwind arbitrary value が 0 件
2. `apps/web/app/error.tsx` 内に `--ubm-color-fg-muted` 参照が 0 件
3. `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web lint` completed
4. `pnpm --filter @ubm-hyogo/web verify-design-tokens` completed（design-tokens.md SSOT との整合）
5. focused component test completed
6. task-18 `playwright-smoke / visual` は downstream broad regression gate として維持
7. `global-error.tsx` / `not-found.tsx` / `loading.tsx` に同パターンが存在する場合は同 wave で移行（存在しなければ Phase 12 で記録）

## 命名規則確認

- token SSOT: `--ubm-color-<group>-<role>`（task-08）
- bridge utility: `@theme inline` 内 `--color-<bridge-name>: var(--ubm-color-*)`（task-09）
- Tailwind utility 名: `text-<bridge-name>` / `bg-<bridge-name>` / `border-<bridge-name>`

## 既存コード調査結果（事前 inventory）

`apps/web/src/styles/globals.css` `@theme inline` で利用可能な utility 名:

- text: `text-text`, `text-text-2`, `text-text-3`
- surface: `bg-surface`, `bg-surface-2`, `bg-panel`, `bg-panel-2`
- accent: `text-accent`, `bg-accent`, `bg-accent-soft`, `text-accent-ink`
- status: `text-ok`/`bg-ok-soft`, `text-warn`/`bg-warn-soft`, `text-danger`/`bg-danger-soft`, `text-info`/`bg-info-soft`
- zone: `text-zone-a..e`
- border: `border-border`, `border-border-2`

## scope out / 関連観測

- `apps/web/src/features/admin/**` の同種 arbitrary valueは task-24 invariant audit / task-18 broad token gate の領域。task-26 の未完了には含めない
- `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` 等の色マップ object は admin dashboard refactor の論点。task-26 の対象外

## carry-over 確認

- task-05（error boundary）完了済み。本 task は token 表現のみを対象
- task-23 / task-24 / task-25（W8 par 並列）と独立。共有ファイルなし
