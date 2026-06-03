# Phase 11 — 手動テスト（3層評価計画）

> **実装区分: 実装仕様書**。visualEvidence = `VISUAL_ON_EXECUTION`。
> 本タスクは **spec 作成のみ（implementation_mode=new / status=spec_created）** であり、
> 実装は未実行。よって Phase 11 のスクリーンショットは **未撮影（status=pending）** とする。
> 実撮影は **実装 + staging deploy 後の user-gated 証跡**。本フェーズでは実 PNG を作らない。

## 0. VISUAL_ON_EXECUTION 宣言

| 項目 | 内容 |
|------|------|
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 視覚変更点（実装後に発生） | ① admin avatar（list 行 / drawer header）が `photoThumbUrl`(thumb 96px webp) を消費 ② `PhotoUploadAffordance` が client-side Canvas で display/thumb を生成しアップロード ③ lg 表示は `photoUrl`(display) を維持 ④ thumb 欠落時 display → hue placeholder へ多段 fallback |
| screenshot 現状 | **pending（未撮影）** |
| 撮影が pending な理由 | 実装が未実行（spec_created）のため、撮影対象の UI が staging に存在しない |
| 撮影タイミング | 実装完了 → migration 0023 apply → staging deploy 後（**user-gated**） |

## 1. 3層評価フレーム（実装後に実施）

| 層 | 観点 | 本タスクでの評価対象 |
|----|------|----------------------|
| Semantic（意味） | 機能契約・データ整合 | thumb 配信が正しい variant を返すか / 後方互換（旧 client・既存行）/ fallback 段階遷移 |
| Visual（見た目） | レイアウト・解像度・状態表現 | thumb の縦横比 / 拡大時 display の鮮明さ / アップロード進捗 / placeholder の一貫性 |
| AI UX（体験） | Apple HIG 観点の操作快適性 | 表示の即時性（thumb で帯域削減）/ degrade 時に破綻しないか / loading の納得感 |

## 2. 撮影予定の状態一覧（実装後に撮影 / 現状 pending）

| name | state | 撮影目的 | status |
|------|-------|----------|--------|
| `member-avatar-thumb-list` | members list 行の小 avatar が thumb を表示 | sm/md が `photoThumbUrl` を消費（AC-4） | pending |
| `avatar-display-large` | drawer 拡大表示が display を表示 | lg が `photoUrl`(display) を維持 | pending |
| `upload-progress` | `PhotoUploadAffordance` のアップロード進捗 | Canvas 生成→multipart 送信中の UI | pending |
| `thumb-fallback-to-display` | thumb 欠落（original_fallback 行）→ display 表示 | 2段目 fallback（AC-5） | pending |
| `placeholder-fallback` | display も欠落 → hue placeholder | 3段目 fallback（AC-5・既存 `<img onError>` 挙動維持） | pending |

> 上記は実装 + staging deploy 後に撮影し、`outputs/phase-11/screenshots/` へ保存する。
> 本フェーズ時点では実 PNG を作らず、撮影計画（[screenshot-plan.json](outputs/phase-11/screenshot-plan.json)）のみを記録する。

## 3. 代替証跡（spec 段階の主ソース）

実 UI 証跡が撮れない spec 段階では、以下を品質根拠とする。

- **Phase 4 / Phase 6 の自動テスト結果**: contract test（`member-photo.contract.spec.ts` 拡張）/ repository test / `image-resize.spec.ts`（Canvas fallback）/ `MemberAvatar.spec.tsx`（variant 選択・3段 fallback）。
- **Phase 10 の final review**: 後方互換（旧 client・既存行 NULL）/ 無料枠 invariant / fallback チェーンの整合確認。
- これらは [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) に TC-ID として「実装後に検証」状態で列挙する。

## 完了条件（Phase 11）

- [x] VISUAL_ON_EXECUTION 宣言（screenshot pending・撮影 user-gated）
- [x] 3層評価フレームと撮影予定状態一覧を計画として記録
- [x] 代替証跡（Phase 4/6 自動テスト + Phase 10 final review）を明示
- [x] 出力: [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) / [screenshot-plan.json](outputs/phase-11/screenshot-plan.json) / [ui-sanity-visual-review.md](outputs/phase-11/ui-sanity-visual-review.md)
