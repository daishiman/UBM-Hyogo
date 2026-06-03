# Phase 11 — 手動テスト結果

> **2026-06-01 実装レビュー追記**: 初回作成時は spec 作成段階の未実測記録だったが、現在のワークツリーには実装差分が存在する。ローカル visual harness で avatar variant / fallback のスクリーンショットを保存し、authenticated staging 撮影は deploy 後の user-gated 外部操作として残す。

## 証跡メタ

| 項目 | 値 |
|------|-----|
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 実行状態 | ローカル実装レビュー中 |
| 証跡の主ソース | 自動テスト（Phase 4/6）+ local visual harness screenshot |
| screenshot status | local harness screenshot を `outputs/phase-11/screenshots/` に保存。authenticated staging screenshot は pending |
| 撮影/検証の前提 | local harness は実施可能。migration 0023 apply → staging deploy → authenticated 実データ撮影は **user-gated** |

## TC-ID 一覧（実装後に検証）

| TC-ID | 検証内容 | 層 | 期待結果 | 状態 |
|-------|----------|----|----------|------|
| TC-01 | thumb 配信: thumb 有 row の detail が `photoThumbUrl` を返し、list/drawer の sm/md avatar が thumb を表示 | Semantic + Visual | sm/md が thumb(≤64KB webp) を消費（AC-4） | component test + local visual harness |
| TC-02 | display 拡大: drawer の lg 表示が `photoUrl`(display ≤512px) を表示 | Visual | lg は display を維持し鮮明（AC-4） | local visual harness |
| TC-03 | fallback: thumb 欠落(original_fallback) → display → display も欠落 → hue placeholder の 3 段 | Semantic + Visual | 各段で破綻なく degrade（AC-5） | component test + local visual harness |
| TC-04 | 旧 client 後方互換: `display` 不在 + 旧 `file` 単一フィールド upload を 503/破壊なく受理（thumb null / processing_status=original_fallback） | Semantic | 旧 client が成功・既存行 NULL も detail 200 維持 | API contract test |
| TC-05 | placeholder: 写真未登録 member の avatar が hue placeholder を表示 | Visual + AI UX | 既存 `Avatar` placeholder 挙動を維持 | component test + local visual harness |

## 代替証跡（spec 段階の品質根拠）

- Phase 4 / Phase 6 自動テスト計画: contract test 拡張 / repository test / `image-resize.spec.ts`（Canvas fallback）/ `MemberAvatar.spec.tsx`（variant 選択・3段 fallback）。
- Phase 10 final review: 後方互換・無料枠 invariant・fallback チェーンの整合確認。

## スクリーンショット出力

| 種別 | Path | 状態 |
|------|------|------|
| local visual harness | `outputs/phase-11/screenshots/member-avatar-variant-fallback-local.png` | 保存対象 |
| authenticated staging | `outputs/phase-11/screenshots/member-avatar-thumb-list.png` ほか | deploy 後 user-gated |
