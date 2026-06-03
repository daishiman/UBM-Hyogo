# 実装ガイド — admin-attendance-dashboard-ux

本ガイドは「出席ダッシュボード UI/UX 是正」タスクの実装ガイドである。Part 1（初学者・中学生レベル）と
Part 2（開発者・技術者レベル）の 2 部構成で記す。本タスクは `implemented_local_runtime_pending` であり、
apps/web の実コード差分、local focused evidence、local fixture screenshot evidence は存在する。staging runtime screenshot は user-gated のため未取得である。
Part 2 末尾の検証コマンドは本改善サイクルで実行した。

---

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に「困りごと」から）

学校で、クラスのみんなの「出席の記録」を一覧にして見せる掲示板があるとします。本来なら、出席率や出席した人数が
カードのようにきれいに並んでいて、「誰がよく来ているか」のランキングや、「何回くらい来ている人が多いか」の
棒グラフがパッと見て分かるはずです。ところが今の画面は、その掲示物がのり付けされずにバラバラに机へ積み上がった
ような状態で、どれが何の情報なのかが分かりません。これではせっかくのデータが「読み取れない」ので、まず見た目を
整え、言葉の意味を分かるようにする必要があります。

### 何が壊れているか（4 つの困りごと）

1. **整理されていない**: カードや枠や余白が効いていないので、全部の文字がただ縦に並ぶだけ。料理でいえば、
   お皿に盛り付けずに材料を全部まな板の上に置いたような状態です。
2. **棒グラフがつぶれて見える**: 横棒グラフのはずが、縦にびよーんと伸びて「ふくらんだ楕円（だ円＝細長い丸）」に
   見えてしまいます。ゴムを縦に引っぱって変形させたような状態です。
3. **言葉の意味が分からない**: 「区画（0→1／1→10／10→100）」という見出しがありますが、これが実は
   「その人がこれまで何回出席したか（出席回数の帯）」を表していると、画面のどこにも書いてありません。
4. **数字の説明がずれている**: 「期間内出席者数」という札（ふだ＝ラベル）の下に「ちがう人を数えた数」と
   書いてあるのに、本当は「出席した回数を全部足した数（延べ＝のべ）」でした。札の説明が中身と食いちがっています。

### 何をするか（掲示板を整える例え）

文化祭でポスターを貼るとき、台紙（だいし）に枠を引いて、写真や説明を枠の中にそろえて貼ると、ぐっと見やすく
なりますよね。このタスクでやるのは、まさにその「台紙と枠を用意して、中身をそろえて貼り直す」作業です。

- **枠と余白をつける**: それぞれの情報をカード（小さな枠）に入れて、きれいに並べます。
- **棒グラフの高さを決める**: 棒の太さ（高さ）を「これくらい」と決めて、つぶれて楕円にならないようにします。
- **言葉を言いかえる**: 「区画」という分かりにくい言葉を「出席回数帯（しゅっせきかいすうたい＝何回来たかの仲間分け）」に
  言いかえ、「これは累計（るいけい＝今までの合計）の出席回数で人を仲間分けしたものです」という一言の説明（凡例＝はんれい）を
  そえます。
- **札の説明を直す**: 「期間内出席者数」の説明を、本当の中身どおり「延べ出席数（出席記録の合計）」に直し、
  どのカードにも「これは何の数か」が分かる短い説明を付けます。

### どこまでやるか（やること・やらないこと）

今回やるのは、あくまで「見た目を整える・言葉を分かりやすくする」ところまでです。計算そのもの（出席率の出し方や、
何回ごとに仲間分けするかの区切り）が本当に正しいかどうかの見直しは、まちがえると他のところに影響が出やすい
（＝こわれやすい）ので、別の宿題（別タスク）として切り分けてあります。だから今回は「いまの計算のとおりに、
正しく説明する」ことに集中します。

### 専門用語セルフチェック

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| レイアウト | 「画面のものの並べ方・配置」 |
| カードグリッド | 「枠（カード）を方眼のように整列させた並べ方」 |
| KPI | 「いちばん見たい大事な数字（出席率など）」 |
| 凡例（はんれい） | 「グラフの見方を説明する一言メモ」 |
| 延べ（のべ） | 「同じ人を何回でも数えた合計」 |
| トークン（デザイントークン） | 「色や余白を決める『共通の色見本・物差し』」 |

---

## Part 2: 技術詳細（開発者レベル）

### 全体方針

- **`apps/web` 完結の UI/UX 是正**。新しい API endpoint / D1 schema / Google Form schema / fetch URL は一切追加・変更しない（不変条件 #1 #5、AC-7）。
- 崩れの根本原因は 2 つ: (a) コンポーネントが参照する `.attendance-*` セマンティッククラスが `globals.css` に未定義、
  (b) バー `<svg>` に CSS 寸法がなく replaced 要素デフォルト高（≈150px）で縦伸びし `rx` 角丸が楕円化。
- 既存 `.attendance-status-pill`（globals.css）と同じ「セマンティック component class」方式を踏襲し、新トークン / 新 primitive は生やさない（不変条件 #2 #3）。
- 色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規追加なし（AC-6、`verify:design-tokens` gate）。
- 計算意味論（境界・出席率定義・延べ vs unique 集計）は変更しない。UI ラベルは現行境界に忠実に振り、是正は別タスク（AC-9）へ分離する。

### 変更 10 ファイルの Before → After 要約

| # | ファイル | 種別 | Before | After |
| --- | --- | --- | --- | --- |
| 1 | `apps/web/src/styles/globals.css` | 編集 | `.attendance-status-pill` 系のみ定義。レイアウト系 `.attendance-*` は未定義で素のブロック積み上げ | `@layer components` 末尾に `=== attendance dashboard ===` ブロックを追加。KPI グリッド / フィルタバー / 2 カラムチャート / 区画分布 / Top10 / テーブル / フォローアップ / 空状態を定義。バーは `inline-size:100%; block-size:0.5rem; display:block; overflow:hidden`（AC-1/2/5/6） |
| 2 | `AttendanceZoneDistributionChart.tsx` | 編集 | `<rect width={Math.max(2, row.rate*100)} …>` で 0% でも 2 単位幅の角丸ブロブ。凡例なし | `width={Math.max(0, row.rate*100)}` へ（0% は 0 幅）。先頭に `ZONE_HELP` を `<p className="attendance-zone-legend">` で描画（AC-2/3） |
| 3 | `AttendanceTop10Ranking.tsx` | 編集 | バー `<svg>` に CSS 寸法なしで楕円潰れ | CSS（`.attendance-top10-bar` `block-size:0.5rem`）で高さ固定。TSX は最小修正（必要時 0 許容ガード）（AC-2） |
| 4 | `format-attendance.ts` | 編集 | `ZONE_LABEL = { "0→1":"0→1 区画", … }`。凡例文なし | `ZONE_LABEL` を回数表記（`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上`）へ。`ZONE_HELP` 凡例定数を追加 export。境界（`zoneFromCount`）は不変（AC-3） |
| 5 | `KpiPanel.tsx` | 編集 | 「期間内出席者数」hint が「unique 出席者」だが実値は延べ | hint を「全セッションの出席記録の合計（延べ）」へ整合。4 KPI すべてに用途が分かる説明を付与。"unique" 表記撤去（AC-4） |
| 6 | `AttendanceFilterBar.tsx` | 編集 | `<legend>区画</legend>` | `<legend>出席回数帯</legend>` + フィルタ 1 行説明（`aria-describedby`）。zone query key（"0→1" 等）は不変（AC-3/5） |
| 7 | `AttendanceAnalyticsPage.tsx` | 編集 | 見方ガイド・空状態スタイルなし | 冒頭に `.attendance-page-guide`、各 `<h2>` 直後に `.attendance-section-intro` の 1 行説明、空状態に `.attendance-zone-empty` 等スタイル付与（AC-5） |
| 8 | `__tests__/format-attendance.spec.ts` | 編集 | 旧 `ZONE_LABEL` 値を検証 | 新値（回数表記）を検証（AC-3） |
| 9 | `__tests__/AttendanceZoneDistributionChart.spec.tsx` | 新規 | （不在） | 0% バーが 0 幅、凡例キャプション描画を検証（AC-2/3） |
| 10 | `__tests__/KpiPanel.spec.tsx` | 更新 | 既存 spec | KPI ラベル/説明の延べ整合を検証（AC-4） |

### CSS 配置（globals.css `@layer components` 末尾追加）

- 配置: `apps/web/src/styles/globals.css` の `@layer components { … }` 内、末尾の `focus-visible / reduced-motion` グローバル block の **前**。
- バー楕円潰れの本質的対処は `.attendance-zone-bar` / `.attendance-top10-bar` に `block-size: 0.5rem`（8px）を CSS で固定すること。
  これにより replaced 要素デフォルト高が解消し、`viewBox="0 0 100 8"` + `preserveAspectRatio="none"` でも縦に伸びない（横比率は維持、縦は CSS 高さで固定）。
- グリッドは `repeat(auto-fit, minmax(13rem,1fr))`（KPI）/ `minmax(20rem,1fr)`（チャート）で狭幅は 1 カラム fallback。
- セレクタは全て `.attendance-*` 名前空間に限定し、グローバル要素セレクタ（`button` 等）は親限定（`.attendance-period-filter button`）で使う。CSS 詳細ブロックは [`phase-2-design.md`](../../phase-2-design.md) を正本とする。

### トークン使用例（HEX 直書き禁止）

```css
.attendance-kpi-card {
  padding: var(--ubm-space-4);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-lg);
  background: var(--ubm-color-surface-panel);
  box-shadow: var(--ubm-shadow-xs);
}
.attendance-period-filter button[data-active="true"] {
  background: var(--ubm-color-accent);
  border-color: var(--ubm-color-accent);
  color: var(--ubm-color-surface-panel);
}
```

色・余白・角丸・影は全て `var(--ubm-*)` 経由。`oklch(...)` / `#rrggbb` / `bg-[#...]` を新規に書かない（不変条件 #2、AC-6）。

### ラベル設計（format-attendance.ts）

```ts
// 現行境界（apps/api zoneFromCount: count<=0→"0→1", <=9→"1→10", <=99→"10→100", else unknown）に忠実な表記。
// 境界そのものは変更しない（別タスク AC-9 で再検討）。
export const ZONE_LABEL: Record<AttendanceZone, string> = {
  "0→1": "0 回（未出席）",
  "1→10": "1〜9 回",
  "10→100": "10〜99 回",
  unknown: "100 回以上",
};
export const ZONE_HELP =
  "各メンバーの累計出席回数で分類した人数分布です。バーは各回数帯に属するメンバーの割合を示します。";
```

### エッジケース・既知制限

| ケース | 挙動 / 制限 |
| --- | --- |
| 0% バー | `Math.max(0, rate*100)` で幅 0。角丸ブロブを出さない |
| 極狭幅 viewport | `auto-fit minmax` で 1 カラム fallback。Phase 11 の local fixture screenshot で確認済み（staging runtime evidence は user-gated） |
| fieldset legend のブラウザ差 | `legend { width:100% }` でブロック化し period/zone を下段に折り返す堅牢設計 |
| 計算意味論（境界・出席率定義・延べ vs unique） | **本タスクのスコープ外**。UI は現行境界に忠実なラベルに留め、是正は AC-9 別タスクへ分離 |
| KPI の真の unique 値 | API 集計変更が必要なため非対応。本タスクはラベルを実値（延べ）に整合させるのみ |

### 検証コマンド（本改善サイクルで実行）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
# 注: vitest 設定はリポジトリルートの vitest.config.ts が正本（vitest.config.ts は不在。下記 documentation-changelog の drift 観察参照）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
# API 非変更（AC-7）
git diff --name-only -- apps/api   # 空であること
```

> 本タスクは `implemented_local_runtime_pending`。focused vitest は本改善サイクルで実行済みで、結果を Phase 11 evidence と documentation-changelog へ転記した。
> local fixture screenshot は `outputs/phase-11/screenshots/` に保存済み。staging screenshot は user-gated runtime artifact のため生成していない。
> `manual-test-result.md` は local evidence と staging runtime pending 境界の記録として存在する。
