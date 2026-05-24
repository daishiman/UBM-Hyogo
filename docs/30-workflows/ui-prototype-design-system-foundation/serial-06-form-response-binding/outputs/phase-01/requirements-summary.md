# Phase 1 — 要件定義サマリ

仕様 `phase-01-requirements.md` を確認し、以下の要件を本実装で満たす:

- FR-01..FR-09: API fetch → adapter → primitive 描画の bridge 層
- NFR-01..NFR-09: OKLch トークン正本性 / D1 直接アクセス禁止 / 既存 endpoint surface / 既存 primitive props 維持 / test suffix `*.spec.ts`

不変条件:
1. 既存 API endpoint のみ接続
2. OKLch トークン正本化
3. プロトタイプ正本順位（claude-design-prototype/pages-public.jsx）
4. D1 直接アクセス禁止
5. visibility filter 二重防御
6. adapter は pure function
7. unknown kind は silent skip

受け入れ条件:
1. fixture（6 sections × visibility 混在）で描画確認 ✅
2. visibility=member / admin が DOM に出ない ✅ (adapter unit spec ケース 3-4)
3. unknown kind で画面壊れない ✅ (adapter unit spec ケース 5)
4. 既存 API endpoint shape 変更なし ✅ (`apps/api/` 無変更)
5. typecheck / lint green ✅
