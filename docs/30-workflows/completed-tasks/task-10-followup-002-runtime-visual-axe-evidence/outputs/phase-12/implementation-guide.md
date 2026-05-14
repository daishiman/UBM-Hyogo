# Implementation Guide

## Part 1: 中学生レベルの説明

ボタンやカードなどの部品は、工作で使う道具箱のようなものです。道具がそろっていても、実際に机の上に並べて見ないと、形が崩れていないか、使いにくくないかは分かりません。

このタスクでは、11 個の画面部品をブラウザに並べて写真を撮ります。さらに axe という自動チェックで、画面を読み上げる人にも困りにくい作りか確認します。写真とチェック結果は、あとから見返せる証拠として保存します。

| 用語 | 日常語での言い換え |
| --- | --- |
| primitive | 画面を作る小さな部品 |
| screenshot | 画面の写真 |
| axe | 使いやすさを調べる点検道具 |
| harness | 部品を並べる作業台 |
| evidence | あとで確認できる証拠 |

## Part 2: 技術者向け

追加した harness / test 実装は `apps/web/app/(dev)/primitives-harness/page.tsx`、`apps/web/app/(dev)/layout.tsx`、`apps/web/playwright/tests/ui-primitives-visual.spec.ts`、`apps/web/playwright.config.ts` に閉じる。axe で検出した HTML 意味論の不整合は `apps/web/src/components/ui/Stat.tsx` と `apps/web/src/components/ui/Sidebar.tsx` の後方互換な最小修正で解消する。

`/(dev)` layout は production で `ENABLE_PRIMITIVES_HARNESS=1` が無い場合に `notFound()` を返す。Playwright は `PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002` で evidence dir を `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence` へ向ける。

代表 variant は 37 件で、Playwright 実行結果は 38 passed（37 screenshot + 1 axe）。axe violations は 0。allowlist が必要な場合は `id / selector / reason / follow-up or same-cycle fix` を記録する。
