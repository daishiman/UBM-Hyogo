# Phase 12 Implementation Guide

## Part 1: 中学生レベル

タグキューは、先生が確認する「提出箱」のようなものです。箱の中には「この会員にはこのタグが合いそう」という候補が入っています。管理者は drawer を開いて、「このタグでOK」なら confirmed、「違う」なら理由を書いて rejected にします。

この task は新しい提出箱を作るのではなく、すでにある `TagQueuePanel` の確認部分を drawer として分け、押し間違い・二重送信・画面読み上げの困りごとを減らすための実装仕様です。

## Part 2: 技術者向け

`TagQueuePanel` は list / filter / selected item の責務に縮約し、resolve form は `TagsQueueResolveDrawer` に分離する。mutation は `resolveTagQueue` helper 直接呼び出しではなく `useAdminMutation<TagQueueResolveResponse>` 経由に統一する。

`tagQueueResolveBodySchema` は `@ubm-hyogo/shared` root export から import する。`packages/shared/package.json` は root export だけを公開しているため deep import は使わない。

`useAdminMutation` は `successMessage?: string | ((data: T) => string)` へ後方互換拡張し、`idempotent: true` の response だけ「既に処理済です」を表示できるようにする。`TagsQueueResolveDrawer` は submit 直前の action を ref へ同期し、React state の遅延で rejected submit が confirmed toast になる stale closure を防ぐ。

## Evidence Handoff

VISUAL 証跡は `outputs/phase-11.md` に定義した 5 screenshot と logs を `outputs/phase-11/` 配下へ保存済み。`apps/web/playwright/tests/admin-tags-resolve-drawer.spec.ts` と DLQ fixture により drawer closed / confirmed / rejected / validation error / terminal disabled を capture し、`outputs/phase-11/logs/axe.json` は violations 0。Phase 13 は user approval 待ち。
