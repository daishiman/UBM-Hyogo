# UI Sanity / Visual Review（Apple HIG 観点・事前チェックリスト）

## VISUAL_ON_EXECUTION 宣言

| 項目 | 内容 |
|------|------|
| タスク種別 | 実装仕様書（implementation_mode=new / status=spec_created） |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 視覚変更点 | ① admin avatar（list 行 / drawer header）が `photoThumbUrl`(thumb 96px webp) を消費 ② `PhotoUploadAffordance` が client-side Canvas で display/thumb を生成 ③ lg は `photoUrl`(display) を維持 ④ thumb → display → hue placeholder の多段 fallback |
| 撮影が pending な理由 | 実装が未実行（spec_created）。撮影対象 UI が staging に未配置。実撮影は実装 + staging deploy 後の **user-gated** 証跡 |

> 本ファイルは **実装後に検証する事前チェックリスト**。spec 段階では実 PNG を作らず、観点のみ固定する。

## Apple HIG 観点 事前チェックリスト（実装後検証項目）

### 1. avatar の縦横比・クロップ
- [ ] thumb は 96×96 の cover（中心クロップ）で正方表示され、歪み（aspect 崩れ）がない
- [ ] display(lg) は長辺 512px 縮小で元 aspect を保持し、引き伸ばしがない
- [ ] list/drawer の avatar 枠（円形/角丸）に対し thumb が枠内で破綻なく収まる

### 2. thumb 解像度・鮮明さ
- [ ] thumb(≤64KB webp) が sm/md サイズでにじみ・ブロックノイズなく表示される
- [ ] 高 DPI（retina）でも sm/md の表示サイズに対し thumb 解像度が十分（96px は 2x 想定の本タスク scope 外＝過度な高精細は求めない）
- [ ] lg では display を使い、thumb の引き伸ばし表示が起きない（variant 選択が size に正しく追従）

### 3. loading 状態
- [ ] アップロード中（Canvas 生成 + multipart 送信）に進捗/待機表現があり、操作不能の無反応に見えない
- [ ] 画像ロード中の avatar が layout shift を起こさない（枠サイズ予約）
- [ ] Canvas 生成失敗時（original_fallback）も UI が固まらず display 送信へ進む

### 4. fallback の一貫性
- [ ] thumb 欠落 → display 表示への切替が視覚的に自然（同一枠・同一形状）
- [ ] display 欠落 → hue placeholder への切替が既存 `Avatar` 挙動と一貫（色相生成ルール不変）
- [ ] 3 段 fallback のいずれの段でも枠サイズ・角丸・余白が一定で、段階間の見た目ジャンプがない

## 代替証跡参照

- 自動テスト（Phase 4/6）: `image-resize.spec.ts` / `MemberAvatar.spec.tsx` / contract test。
- Phase 10 final review: 後方互換・無料枠・fallback 整合。

> 上記チェックは実装 + staging deploy 後に [screenshot-plan.json](screenshot-plan.json) の各 state を撮影しながら検証する（user-gated）。
