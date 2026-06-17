# Phase 6 — テスト拡充（新文言・eyebrow 不在・英語残存 0 の回帰ガード）

> 本 Phase は `_shared-context.md`（SSOT）§1.E テスト更新表・§4 検証コマンドを正本として参照する。

## 目的

Phase 5 の実装が「日本語化された」「eyebrow を完全に削除した」「英語表記が残っていない」ことを
テストで固定し、回帰（将来の再英語化・eyebrow 復活）を防ぐ。
新規テストファイルは作らず、既存 4 spec（T1–T4）を編集する（SSOT §3 テスト表）。
fail path（assert が新文言・eyebrow 不在を確実に検出する経路）と回帰ガード（grep gate）を整える。

## 成果物

### 編集テスト（T1–T4・SSOT §1.E 準拠）
| # | パス | 変更 |
| --- | --- | --- |
| T1 | `apps/web/src/components/public/__tests__/Stats.component.spec.tsx` | L69 `toContain("Forms 同期中")` → `toContain("自動で最新化")`。新規 it: 4 ラベルが日本語（公開メンバー/事業フェーズ/年間の支部会/最終データ更新）であることを `[data-stat=…] [data-role="label"]` で assert |
| T2 | `apps/web/src/components/public/__tests__/AboutUbm.component.spec.tsx` | L33-39「renders both eyebrows ABOUT and THREE ZONES」を置換: `[data-role="eyebrow"]` が **0 件**であること + `section-heading` が「事業支援コミュニティ「UBM」」「UBM区画」であることを assert |
| T3 | `apps/web/src/components/public/__tests__/Timeline.component.spec.tsx` | L23-25 eyebrow `RECENT MEETINGS` の assert 削除。L36「header still rendered」を `[data-role="eyebrow"]` truthy → `[data-role="section-heading"]`（「最近の支部会」）truthy に変更 |
| T4 | `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` | L80-83「eyebrow text 'FOR MEMBERS'」it を削除。L91 `[data-role="eyebrow"]` `.not.toBeNull()` → `.toBeNull()`。L85 の data-role 列挙文言から `eyebrow` を除外 |

> 変更不要: `app/(public)/page.spec.tsx`（全セクション stub 済・FEATURED MEMBERS overline は未 assert）、
> `Hero.component.spec.tsx`（Hero は eyebrow prop を保持。home が prop を渡さないだけ）。

### 回帰ガード（grep gate）
- **英語残存 grep**（SSOT §4-4）— ヒット 0 を期待:
  ```bash
  grep -RnE 'CHAPTER SITE|FEATURED MEMBERS|RECENT MEETINGS|FOR MEMBERS|>ABOUT<|THREE ZONES|Members<|Zones<|Meetings / yr|Last sync|Forms 同期中' \
    apps/web/app/'(public)' apps/web/src/components/public
  ```
- **eyebrow 完全削除の確認** — home 系コンポーネントで `data-role="eyebrow"` が `Hero.tsx` の 2 箇所（JSX 描画行 + CSS 非対象）のみに収束すること:
  ```bash
  grep -rn 'data-role="eyebrow"' apps/web/src/components/public apps/web/app/'(public)'
  # 期待: Hero.tsx の eyebrow 条件描画箇所のみ（page.tsx / AboutUbm / Timeline / CallToActionCTA から消えている）
  ```
- **API 非接触 grep**（SSOT §4-5）— 空を期待: `git diff dev -- apps/api packages/shared`

## 統合テスト連携

- T1–T4 を編集後、SSOT §4-1 の focused vitest（ルートからフルパス指定）で 4 spec + page.spec が全 PASS することを確認する。
- fail path 検証: 各 assert が「もし Phase 5 の置換が漏れたら fail する」ことを担保する。
  - T1 のラベル assert は旧英語ラベルが残ると `toContain("公開メンバー")` 等が fail する。
  - T2/T3/T4 の eyebrow 不在 assert は eyebrow が復活すると `toBeNull()` / 0 件 assert が fail する。
- grep gate は CI でなく DoD ローカル検証に組み込む（SSOT §4）。英語残存 0・eyebrow 収束を回帰ガードとして明記する。

## 完了条件

- [ ] T1: 同期バッジ assert を「自動で最新化」に更新し、4 ラベル日本語の新規 it を追加した
- [ ] T2: eyebrow 0 件 assert + section-heading 日本語 assert に置換した
- [ ] T3: RECENT MEETINGS eyebrow assert を削除し、header 存在確認を section-heading truthy に変更した
- [ ] T4: FOR MEMBERS eyebrow it を削除し、eyebrow `.toBeNull()` に変更、data-role 列挙から eyebrow を除外した
- [ ] focused vitest（SSOT §4-1）が 4 spec + page.spec で全 PASS する
- [ ] 英語残存 grep（SSOT §4-4）がヒット 0
- [ ] `data-role="eyebrow"` の grep が home 系で Hero.tsx の描画箇所のみに収束している
- [ ] `git diff dev -- apps/api packages/shared` が空
