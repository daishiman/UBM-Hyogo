# 要件定義書 — issue-1030 member photo variant pipeline

## 目的

admin 登録 member photo を、無料枠を維持したまま表示用 variant（display/thumb）配信へ移行し、フル解像度 1 枚配信の帯域非効率を解消する。

## 機能要件

1. admin アップロード時に client（Canvas）で `display`(≤512px webp) と `thumb`(96×96 webp) を生成する。
2. API は display/thumb を R2 へ保存し、`member_photos` に variant 識別メタ（thumb key / content hash / processing status）を記録する。
3. detail API は display(`photoUrl`) と thumb(`photoThumbUrl`) の presigned URL を返す。
4. admin avatar（list / drawer の小サイズ）は thumb を、拡大表示は display を消費する。
5. 全段で安全 fallback（thumb→display→hue placeholder）。

## 非機能要件

- 無料枠維持（サーバ/外部の有料画像処理を使わない）。
- 後方互換（既存 key / 既存行 / 旧 client を破壊しない）。
- invariant #4（admin-managed 分離）/ #5（R2/D1 は apps/api に閉じる）。

## 制約

- Google Form schema 不変。新 endpoint の新設はせず既存 `POST/GET /admin/members/:id[/photo]` を拡張。
- 公開表示は #1029、self upload は #1031 の責務（本タスク scope 外）。

詳細は [../../phase-1.md](../../phase-1.md) / [../../phase-2.md](../../phase-2.md) を参照。
