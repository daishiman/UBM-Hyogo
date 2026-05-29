# Phase 12: Documentation

## Part 1: 概念説明（中学生レベル）

「タグキュー」は、Google フォームから届いた会員プロフィールに対し、管理者が「兵庫」「神戸」「経営者」などのタグを割り当てる作業箱です。

- **箱の中身**: まだタグが付いていない人 / もう付け終わった人 / 失敗した人（DLQ）が並んでいます
- **画面の役割**: 左側に「これからタグを付ける人の列」、右側に「いま選んだ人のプロフィールとタグ候補」を並べて、見比べながら割り当てる
- **今回の問題**:
  1. 画面が殺風景で、プロトタイプ（設計図）と全然違う見た目
  2. 一覧 API が「見つかりません（404）」を返してきて、そもそも箱の中身が出てこない
- **今回の対応**:
  1. 設計図どおりに左右 2 ペインの整った画面に作り変える（タスク B）
  2. 「404 だった」を「設定が違う？ ログイン切れ？ 権限不足？」と画面に出して、直す場所が分かるようにする（タスク A）
  3. 直ったところを staging で写真に撮って残す（タスク C）

## Part 2: 技術詳細

### 変更のキモ

`/admin/tags` は Next.js の Server Component で、`safeServerFetch('/admin/tags/queue')` で `apps/api` を叩く。叩いた先で 404 が返ったとき、これまでは `ADMIN_FETCH_404` というコードだけが画面に表示され、原因が分からなかった。

今回:

- `AdminSectionErrorClient` を「コードごとの復旧ヒント」表示にする
- dev / staging のときだけ、404 時に `INTERNAL_API_BASE_URL` の host を `console.warn` に出す（cookie / 秘密鍵は出さない）
- `TagQueuePanel` を page-head + grid-2 + sticky 右ペイン + Avatar / Chip / EmptyState の構造に作り直す
- ステータス filter chip / focusMemberId / Drawer 接続の既存 contract は壊さない

### Verification Commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- TagQueuePanel AdminSectionErrorClient server-fetch
mise exec -- pnpm --filter web exec playwright test \
  --project=staging-visual-authenticated \
  apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts
bash scripts/verify-pr-ready.sh
```

### Visual Evidence

`outputs/phase-11/admin-tags-empty.png` / `outputs/phase-11/admin-tags-items.png` を PR 本文に貼る。spec は Playwright snapshot とは別にこの 2 PNG を `outputs/phase-11/` へ直接保存する。staging URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/tags`。

### Implementation Guide

実装エージェント向けの導線は `outputs/phase-12/implementation-guide.md`（PR 作成時に自動生成）。
