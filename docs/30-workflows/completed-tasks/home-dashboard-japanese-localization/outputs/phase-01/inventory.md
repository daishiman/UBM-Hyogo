# Phase 1 成果物 — inventory（マッピング表 + 変更ファイル一覧）

> 正本: [`../../_shared-context.md`](../../_shared-context.md) §1・§3。本書はその要点転記。

## §1 マッピング表

### A. 統計カードラベル（`apps/web/src/components/public/Stats.tsx`）

`data-role="value"` / `data-role="sub"` は **現状維持**。`data-role="label"` の文言のみ変更。

| data-stat | 行 | 旧（英語） | 新（日本語） | サブ行（不変） |
| --- | --- | --- | --- | --- |
| `members` | 44 | `Members` | `公開メンバー` | 公開中のメンバー |
| `zones` | 49 | `Zones` | `事業フェーズ` | 0→1 / 1→10 / 10→100 |
| `meetings` | 54 | `Meetings / yr` | `年間の支部会` | 毎月の支部会 |
| `sync` | 59 | `Last sync` | `最終データ更新` | （バッジ）下記 B |

### B. 同期バッジ（`Stats.tsx:64` `data-role="badge-sync"` 内テキスト）

| 行 | 旧 | 新 |
| --- | --- | --- |
| 64 | `Forms 同期中` | `自動で最新化` |

> `data-role="dot"`（点滅ドット要素）は不変。テキストノードのみ差し替える。

### C. 英語 overline（eyebrow）削除 — 6 箇所

各 overline は直下に日本語見出しがあり意味が重複するため要素ごと削除する。

| # | ファイル | 行 | 旧 | 削除後に残る日本語見出し |
| --- | --- | --- | --- | --- |
| C-1 | `apps/web/app/(public)/page.tsx` | 75 | `eyebrow="UBM HYOGO · CHAPTER SITE"`（Hero への prop） | （ヒーロー）兵庫で、事業を育てる人のつながりを可視化する。 |
| C-2 | `apps/web/app/(public)/page.tsx` | 94 | `<p data-role="eyebrow">FEATURED MEMBERS</p>` | 参加している事業者たち |
| C-3 | `apps/web/src/components/public/AboutUbm.tsx` | 50 | `<p data-role="eyebrow">ABOUT</p>` | 事業支援コミュニティ「UBM」 |
| C-4 | `apps/web/src/components/public/AboutUbm.tsx` | 56 | `<p data-role="eyebrow">THREE ZONES</p>` | UBM区画 |
| C-5 | `apps/web/src/components/public/Timeline.tsx` | 51 | `<p data-role="eyebrow">RECENT MEETINGS</p>` | 最近の支部会 |
| C-6 | `apps/web/src/components/public/CallToActionCTA.tsx` | 24 | `<p data-role="eyebrow">FOR MEMBERS</p>` | メンバー情報の掲載をお願いします |

> **C-1 の方式**: `Hero` は `eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null`（Hero.tsx:48）で条件描画。`page.tsx` の `<Hero>` から `eyebrow` prop を**渡さない**だけでよい。`Hero` 本体は eyebrow prop を残す（汎用コンポーネント・既存テスト互換）。

## §3 変更ファイル一覧

### 実装（apps/web・6 ファイル）

| # | パス | 種別 | 変更概要 |
| --- | --- | --- | --- |
| F1 | `apps/web/app/(public)/page.tsx` | 編集 | Hero `eyebrow` prop 削除（C-1）+ FEATURED MEMBERS overline 削除（C-2） |
| F2 | `apps/web/src/components/public/Stats.tsx` | 編集 | ラベル4件日本語化（A）+ 同期バッジ文言（B） |
| F3 | `apps/web/src/components/public/AboutUbm.tsx` | 編集 | ABOUT / THREE ZONES overline 削除（C-3, C-4） |
| F4 | `apps/web/src/components/public/Timeline.tsx` | 編集 | RECENT MEETINGS overline 削除（C-5） |
| F5 | `apps/web/src/components/public/CallToActionCTA.tsx` | 編集 | FOR MEMBERS overline 削除（C-6） |
| F6 | `apps/web/src/styles/legacy-public.css` | 編集 | dead eyebrow ルール4件削除 + CTA heading margin-top 調整（D） |

### テスト（apps/web・4 ファイル編集）

| # | パス | 種別 |
| --- | --- | --- |
| T1 | `apps/web/src/components/public/__tests__/Stats.component.spec.tsx` | 編集 |
| T2 | `apps/web/src/components/public/__tests__/AboutUbm.component.spec.tsx` | 編集 |
| T3 | `apps/web/src/components/public/__tests__/Timeline.component.spec.tsx` | 編集 |
| T4 | `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` | 編集 |

> apps/api・packages/shared・D1 migration・Google Form 関連の変更は **無し**。

## 実装モード

`implementation_mode = "new"`（新規 workflow・carry-over 無し）。
