# Phase 3: 設計レビュー

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 対象: [phase-2-design.md](phase-2-design.md)
- 判定: Phase 4 へ進めるか。

## 目的

Phase 2 設計が不変条件・AC・責務境界に整合し、Phase 4 以降へ進める品質かを判定する。

## 実行タスク（レビュー観点）

### 不変条件適合レビュー（CLAUDE.md / UI prototype alignment）

| 不変条件 | 適合 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ・新 endpoint 禁止 | OK | CSS / breakpoint / 属性のみ。API 非接触 |
| #2 OKLch トークン正本・HEX 禁止 | OK | 新規色なし。`clamp()`/`minmax()`/breakpoint のみ。`verify:tokens` 対象外の寸法変更 |
| #3 新規 primitive を生やさない | OK | 既存クラス・Tailwind utility の範囲。新 component 0 |
| #4 `apps/web` から D1 禁止 | OK | 表現層のみ |
| #5 D1/Form schema 非変更 | OK | `git diff -- apps/api` 空を AC-9 で保証 |
| #8 `*.spec.*` のみ | OK | 新規テストは `.spec.ts(x)` |

### 設計判断レビュー

| 判断 | 評価 | 備考 |
| --- | --- | --- |
| `max-width: 900px` → `1023.98px` 寄せ | 妥当 | タブレット帯(768-1024)の詰まりを `lg` 未満単カラムで根治。非標準境界を排除し RC-1 を解消 |
| `minmax(18rem,…)` → `minmax(0,…)` | 妥当 | 最小値が親幅を超えるはみ出し(RC-2)の直接原因を除去。視覚は md/lg で 2 カラム復元 |
| テーブル mobile カード化（`data-label` additive） | 妥当 | content の隠れ(RC-3)を解消。列構造・testid・href 不変で既存テスト非破壊 |
| drawer `w-[min(17rem,88vw)]` | 妥当 | 小型携帯でバックドロップ tap 領域を確保しつつ desktop 幅維持 |
| breakpoint 変数は「ドキュメント目的」 | 妥当 | CSS メディアクエリは変数展開不可のため px 直書き + コメント規約が現実解。誤解を避ける注記あり |

### リスクと緩和

| リスク | 緩和 |
| --- | --- |
| テーブルカード化が大規模テーブルで visual 退行 | per-table 判断（Phase 5）。過剰な場合は sticky 見出し + `min-width` 横スクロールに留める |
| `data-label` 追加で既存 spec の query 破壊 | Phase 6 で `*.spec.tsx` を回し、追加属性が既存 query を壊さないことを確認 |
| breakpoint 統一で desktop visual が変化 | Playwright desktop baseline を回帰確認（非破壊が原則。意図的変更のみ baseline 更新） |
| `clamp()` 非対応ブラウザ | 対象は近代ブラウザ（Cloudflare Workers + Next.js）。`clamp` は広くサポート済 |

### トレーサビリティ（AC → 変更点）

| AC | 変更点 | Phase 2 セクション |
| --- | --- | --- |
| AC-1 | breakpoint 変数 + 境界統一 | ブレークポイント設計 |
| AC-2,3,6 | grid 流体化 / main 幅 clamp / auth padding | グリッド流体化・共通画面 |
| AC-4,7 | テーブル可視性 + サイドバー | テーブル可視性・オーバーレイ |
| AC-5 | error/not-found/loading 中央寄せ | 共通画面 |
| AC-8 | drawer/popover/tooltip 収納 | オーバーレイ収納 |
| AC-9 | HEX 禁止・apps/api 非変更 | 設計原則 |
| AC-10 | Playwright visual spec | テストレーン |

## レビュー判定

**PASS** — 不変条件・AC・責務境界に矛盾なし。固定幅はみ出し / 非標準境界 / テーブル隠れ / オーバーレイはみ出しの 4 大要因に直接対応し、1 サイクルで完結する。Phase 4 へ進む。

## 参照資料

- [phase-1-requirements.md](phase-1-requirements.md), [phase-2-design.md](phase-2-design.md), [shared-context.md](shared-context.md)

## 成果物

- 本ファイル（設計レビュー）。PASS 判定とトレーサビリティ。

## 統合テスト連携

- Phase 4 がトレーサビリティ表の各 AC をテストケースに 1:1 対応付ける。

## 完了条件

不変条件適合・AC トレーサビリティ・リスク緩和が記録され、Phase 4 進行可の判定が下されていること。
