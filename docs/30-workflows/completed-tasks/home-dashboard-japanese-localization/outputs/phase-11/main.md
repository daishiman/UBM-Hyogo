# Phase 11 main — 手動テスト方針（VISUAL implemented_local_evidence_captured）

> 正本: `_shared-context.md` §5 視覚証跡の扱い / §1 マッピング。

## 方針

本タスクは VISUAL（ホーム画面の見た目が変わる）だが、workflow_state=implemented_local_evidence_captured（ローカル実装・証跡取得済み）のため、
本サイクルでは **ローカル実スクリーンショットを取得済み**。capture-metadata の `status=local_fullpage_present_staging_pending` を正とし、
手動テストは local Playwright screenshots と DOM verification を主証跡として記述する（local evidence・local PASS）。

## 証跡の主ソース

- 主ソース = local evidence（`screenshots/home-localized-full.png` / `screenshots/home-localized-stats.png` / `screenshots/home-localized-about.png` / `phase11-capture-metadata.json`）。実 PNG は 3 件。
- ローカル実スクリーンショットは取得済み。staging 反映と追加 staging capture は user-gated。
- ローカル実画像のみを置き、staging 画像は捏造しない（SSOT §5）。

## 評価の構成

ローカル実装後に 3 層（Semantic / Visual / AI UX）で確認する。詳細は `manual-test-result.md`、
実施チェックリストは `manual-test-checklist.md`、VISUAL 宣言と UI sanity 観点は `ui-sanity-visual-review.md`。

## 計画スクリーンショット

| name | 状態 |
| --- | --- |
| home-localized-full.png | local_fullpage_present_staging_pending |
| home-localized-stats.png | present-local |
| home-localized-about.png | present-local |
