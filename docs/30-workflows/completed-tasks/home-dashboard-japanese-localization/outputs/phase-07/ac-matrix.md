# Phase 7 — 受入条件マトリクス（AC-1〜AC-8）

> SSOT: `../../_shared-context.md` §1 / §2 / §4。各 AC は SSOT の正本マッピングに対応する。

## AC 定義 × 検証方法

| AC | 受入条件 | 対応 SSOT | 検証方法 | jsdom 評価 |
| --- | --- | --- | --- | --- |
| AC-1 | 統計 4 ラベルが日本語（公開メンバー / 事業フェーズ / 年間の支部会 / 最終データ更新） | §1.A | T1: `[data-stat=…] [data-role="label"]` のテキスト assert（4 件） | 可（DOM テキスト） |
| AC-2 | 同期バッジが「自動で最新化」 | §1.B | T1: `[data-role="badge-sync"]` のテキスト `toContain("自動で最新化")` | 可 |
| AC-3 | eyebrow 6 箇所が削除されている | §1.C | T2（about 2件 0 件）/ T3（timeline）/ T4（cta）の eyebrow 不在 assert + 英語残存 grep（page.tsx の Hero prop / FEATURED MEMBERS） | 一部可（DOM）+ grep |
| AC-4 | dead CSS（eyebrow ルール 4 件）が削除されている | §1.D | 構造 grep（`legacy-public.css` から 4 セレクタ消滅）+ Hero ルール保持 grep + Phase 11 視覚確認 | 不可（CSS）→ 構造検証限定 |
| AC-5 | テスト（T1–T4）が新文言・eyebrow 不在を assert し全 PASS | §1.E | focused vitest（SSOT §4-1）4 spec + page.spec PASS | 可 |
| AC-6 | 英語残存 0 | §4-4 | 英語残存 grep ヒット 0 | grep |
| AC-7 | apps/api + packages/shared diff 空 | §2-1 / §4-5 | `git diff dev -- apps/api packages/shared` 空 | git diff |
| AC-8 | HEX 0・OKLch トークン正本維持 | §2-4 | `verify-design-tokens` 緑（HEX 0 / 色追加 0） | gate |

## 検証コマンド対応（SSOT §4 再掲）

```bash
# AC-1/AC-2/AC-3(DOM)/AC-5: focused vitest
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/public/__tests__/Stats.component.spec.tsx \
  src/components/public/__tests__/AboutUbm.component.spec.tsx \
  src/components/public/__tests__/Timeline.component.spec.tsx \
  src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  app/(public)/page.spec.tsx

# AC-3(grep)/AC-6: 英語残存 grep（ヒット 0 を期待）
grep -RnE 'CHAPTER SITE|FEATURED MEMBERS|RECENT MEETINGS|FOR MEMBERS|>ABOUT<|THREE ZONES|Members<|Zones<|Meetings / yr|Last sync|Forms 同期中' \
  apps/web/app/'(public)' apps/web/src/components/public

# AC-4: dead CSS 削除の構造確認（4 セレクタが消え、Hero セレクタは残る）
grep -n 'data-role="eyebrow"' apps/web/src/styles/legacy-public.css
# 期待: hero[data-variant="card"] のルールのみ残存

# AC-7: API 非接触
git diff dev -- apps/api packages/shared   # 空

# AC-8: デザイントークン gate
mise exec -- pnpm verify:design-tokens
```

## jsdom 制約の明記

- **CSS は jsdom が評価しない**。AC-4 はコンポーネントテストでは検証できず、**構造検証（grep で dead rule 消滅を確認）+ Phase 11 視覚証跡（user-gated）** に限定する。
- それ以外（AC-1/2/3 の DOM 部分・AC-5）は jsdom で DOM テキスト・要素数を検証できる。
- AC-7/AC-8 はテスト外（git diff / gate）で検証する。
