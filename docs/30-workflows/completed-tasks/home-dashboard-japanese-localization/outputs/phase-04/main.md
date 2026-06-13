# Phase 4 成果物 — テスト作成 main

> 正本: [`../../_shared-context.md`](../../_shared-context.md) §1E。TDD 観点でのテスト更新方針。

## 1. テスト操作対象（props か内部 state か）

- 本タスクのテストはすべて **component の静的レンダリング DOM 構造 assertion**。
- 入力は **props 経由**（内部 state ではない）。`Stats` は `stats: PublicStatsView` props を渡し、`AboutUbm` / `Timeline` / `CallToActionCTA` は固定構造を render。
- eyebrow の有無は DOM 上の `[data-role="eyebrow"]` 要素数（0 件 / null）で判定する。文言は対象要素の `textContent` で判定する。

## 2. T1–T4 更新方針

### T1 `Stats.component.spec.tsx`

- L69 `toContain("Forms 同期中")` → `toContain("自動で最新化")`。
- 新規 `it`: 4 ラベルが日本語であることを `[data-stat=…] [data-role="label"]` で assert。
  - `members → 公開メンバー` / `zones → 事業フェーズ` / `meetings → 年間の支部会` / `sync → 最終データ更新`。
- `value` / `sub` の assertion は不変（現状維持）。

### T2 `AboutUbm.component.spec.tsx`

- L33-39「renders both eyebrows ABOUT and THREE ZONES」を置換:
  - `container.querySelectorAll('[data-role="eyebrow"]')` の length が **0** であること。
  - `section-heading` が `事業支援コミュニティ「UBM」` / `UBM区画` であること。

### T3 `Timeline.component.spec.tsx`

- L23-25 eyebrow `RECENT MEETINGS` の assert を削除。
- L36「header still rendered」を `[data-role="eyebrow"]` truthy → `[data-role="section-heading"]`（`最近の支部会`）truthy に変更。

### T4 `CallToActionCTA.component.spec.tsx`

- L80-83「eyebrow text 'FOR MEMBERS'」の `it` を削除。
- L91 `[data-role="eyebrow"]` `.not.toBeNull()` → `.toBeNull()`。
- L85 の data-role 列挙文言から `eyebrow` を除外。

## 3. 変更不要のテスト

| ファイル | 理由 |
| --- | --- |
| `app/(public)/page.spec.tsx` | 全セクション stub 済・FEATURED MEMBERS overline は未 assert（SSOT §1E） |
| `Hero.component.spec.tsx` | Hero は eyebrow prop を保持。サンプル文言のみ日本語へ更新（SSOT §1E） |

## 4. 命名規則整合

- T1–T4 はすべて `*.component.spec.tsx`（`*.spec.{ts,tsx}` 規約）。新規ファイル作成は無し（既存編集のみ）。
- CLAUDE.md 不変条件 #8（`*.test.{ts,tsx}` 禁止・lefthook `block-test-suffix` / CI `verify-test-suffix` で reject）に抵触しない。

## 5. 新文言・eyebrow 不在 assertion 一覧

| 種別 | 期待値 |
| --- | --- |
| ラベル | `公開メンバー` / `事業フェーズ` / `年間の支部会` / `最終データ更新` |
| 同期バッジ | `自動で最新化` |
| eyebrow 不在 | AboutUbm: 0 件 / Timeline: section-heading truthy / CTA: eyebrow null |
| section-heading | `事業支援コミュニティ「UBM」` / `UBM区画` / `最近の支部会` |

詳細な旧/新 assertion 表は [`test-plan.md`](./test-plan.md) を正とする。
