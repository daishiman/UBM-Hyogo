# 実装ガイド — ホーム画面の英語表記を非エンジニア向け日本語へ整える

> 正本: `_shared-context.md`（SSOT）§1 マッピング / §3 変更ファイル / §4 検証。
> 本タスクは implemented_local_evidence_captured（ローカル実装・証跡取得済み）。本ガイドは後続実装者がそのまま着手するための手引き。

---

## Part 1 — なぜ必要か / 何をするか（専門用語なしの説明）

### 背景（なぜ必要か）

UBM 兵庫支部会のホーム画面（トップページ）には、いくつかの「英語の小さな見出しやラベル」が残っています。
たとえば数字の上に「Members（メンバー）」「Last sync（最終同期）」と英語で書かれていたり、
各ブロックの見出しの上に「ABOUT」「FOR MEMBERS」といった英語の飾り文字が乗っていたりします。

このサイトを使うのは、エンジニアではなく、ふだんシステムに詳しくない会員のみなさんです。
英語のラベルは、料理のメニューに知らない外国語が混じっているようなもので、
「これは何のことだろう？」と一瞬とまどわせてしまいます。すぐ下に日本語の見出しがあるのに、
その上に英語の飾りが乗っていると、かえって読みづらく感じます。

### 何をするか（要約）

やることは大きく 2 つだけです。むずかしい仕組みは足しません。

1. **数字につく英語ラベルを日本語に直す。**
   - 「Members」→「公開メンバー」、「Zones」→「事業フェーズ」、
     「Meetings / yr」→「年間の支部会」、「Last sync」→「最終データ更新」。
   - データが自動で新しくなることを示すバッジ「Forms 同期中」→「自動で最新化」。
   - 数字そのものや、その下の小さな説明文（「公開中のメンバー」など）は **そのまま** にします。

2. **見出しの上に乗っている英語の飾り文字（6 個）を消す。**
   - すぐ下に日本語の見出しがあって意味が重複しているので、英語の飾りだけを取り除き、
     日本語の見出しだけを残します。例えるなら、看板の上に貼られた英語のシールをはがして、
     日本語の看板だけをきれいに見せるイメージです。

ホバー（マウスを乗せると開く）のような動く仕掛けは入れません（利用者の希望）。
あくまで「読んだだけで意味がわかる」静かな画面にします。

### 実装ステップ（やさしい順序）

1. 数字ラベル 4 つとバッジ文言を日本語に書き換える。
2. 英語の飾り文字 6 個を、それぞれの部品から取り除く。
3. 飾り文字が消えたあとに残ってしまう「使われない見た目の設定（CSS）」を片付け、
   見出しのすき間が変にならないよう余白を整える。
4. 「ちゃんと日本語になったか」「飾り文字が消えたか」を自動チェック（テスト）で確かめる。

### 検証コマンド（このタスクが完了したかの確かめ方）

実装が終わったら、SSOT §4 の検証コマンドを実行します。具体的には
「日本語ラベルになっているかのテスト」「英語が残っていないかの検索」「他の場所を壊していないかの確認」を行います。
詳しいコマンドは Part 2 に載せています。

### 既知の制限（このタスクでやらないこと）

- データの取り方や保存の仕組みは一切変えません（見た目の文字だけ）。
- 画面の色やレイアウトの大きな作り直しはしません。色も増やしません。
- 他のページ（会員ページ・管理画面など）には影響しません。ホーム画面だけの変更です。

---

## Part 2 — 技術詳細（実装者向け）

### 背景

公開トップ `/`（`apps/web/app/(public)/page.tsx` が構成する 6 セクション）の表現層のみを変更する。
データ取得（`/public/stats` 経由）・型（`PublicStatsView`）・DOM contract（`data-component` / `data-stat` /
`data-role`（eyebrow 除く）/ `aria-*` / `id` / href / testid）は不変。新規 component / primitive は作らない。

### 要約

- 文字列置換: 統計4ラベル（A）+ 同期バッジ（B）。
- 要素削除: 英語 overline（eyebrow）6 箇所（C）。
- CSS 削除: dead eyebrow ルール 4 件 + CTA heading 余白調整（D）。
- public members 旧 shape 補完: `topTags` 欠落時に `[]` を補完し、featured members error panel を防ぐ（E）。
- テスト更新: T1〜T6。

### 変更ファイル（F1〜F7）

| # | パス | 変更概要 |
| --- | --- | --- |
| F1 | `apps/web/app/(public)/page.tsx` | Hero `eyebrow` prop 削除（C-1）+ FEATURED MEMBERS overline 削除（C-2） |
| F2 | `apps/web/src/components/public/Stats.tsx` | ラベル4件日本語化（A）+ 同期バッジ文言（B） |
| F3 | `apps/web/src/components/public/AboutUbm.tsx` | ABOUT / THREE ZONES overline 削除（C-3, C-4） |
| F4 | `apps/web/src/components/public/Timeline.tsx` | RECENT MEETINGS overline 削除（C-5） |
| F5 | `apps/web/src/components/public/CallToActionCTA.tsx` | FOR MEMBERS overline 削除（C-6） |
| F6 | `apps/web/src/styles/legacy-public.css` | dead eyebrow ルール4件削除 + CTA heading margin-top 調整（D） |
| F7 | `apps/web/src/lib/api/public.ts` | `/public/members` 旧/部分レスポンスの `topTags` 欠落を `[]` に補完 |

### テスト（T1〜T6）

| # | パス | 変更概要 |
| --- | --- | --- |
| T1 | `__tests__/Stats.component.spec.tsx` | バッジ assert を「自動で最新化」に変更 + 4 ラベル日本語の新規 it（`[data-stat] [data-role="label"]`） |
| T2 | `__tests__/AboutUbm.component.spec.tsx` | eyebrow 0 件 + section-heading 日本語の assert に置換 |
| T3 | `__tests__/Timeline.component.spec.tsx` | eyebrow assert 削除 + header section-heading（最近の支部会）assert |
| T4 | `__tests__/CallToActionCTA.component.spec.tsx` | eyebrow `FOR MEMBERS` it 削除 + `[data-role="eyebrow"]` を `.toBeNull()` に |
| T5 | `__tests__/Hero.component.spec.tsx` | Hero optional eyebrow contract は保持し、サンプル文言を `兵庫支部会サイト` に更新 |
| T6 | `src/lib/api/__tests__/public.spec.ts` | `topTags` 欠落時の `[]` 補完を assert |

### 文字列マッピング表（旧 → 新）

#### A. 統計ラベル（`Stats.tsx` `data-stat` 別・`data-role="label"`）

| data-stat | 旧 | 新 |
| --- | --- | --- |
| `members` | `Members` | `公開メンバー` |
| `zones` | `Zones` | `事業フェーズ` |
| `meetings` | `Meetings / yr` | `年間の支部会` |
| `sync` | `Last sync` | `最終データ更新` |

> 値（`data-role="value"`）・サブ行（`data-role="sub"`）・点滅ドット（`data-role="dot"`）は不変。

#### B. 同期バッジ（`Stats.tsx` `data-role="badge-sync"` 内テキスト）

| 旧 | 新 |
| --- | --- |
| `Forms 同期中` | `自動で最新化` |

#### C. 英語 overline 削除（`data-role="eyebrow"`・6 箇所）

| # | ファイル | 旧 | 残る日本語見出し |
| --- | --- | --- | --- |
| C-1 | `page.tsx` | `eyebrow="UBM HYOGO · CHAPTER SITE"`（Hero prop） | 兵庫で、事業を育てる人のつながりを可視化する。 |
| C-2 | `page.tsx` | `<p data-role="eyebrow">FEATURED MEMBERS</p>` | 参加している事業者たち |
| C-3 | `AboutUbm.tsx` | `<p data-role="eyebrow">ABOUT</p>` | 事業支援コミュニティ「UBM」 |
| C-4 | `AboutUbm.tsx` | `<p data-role="eyebrow">THREE ZONES</p>` | UBM区画 |
| C-5 | `Timeline.tsx` | `<p data-role="eyebrow">RECENT MEETINGS</p>` | 最近の支部会 |
| C-6 | `CallToActionCTA.tsx` | `<p data-role="eyebrow">FOR MEMBERS</p>` | メンバー情報の掲載をお願いします |

> C-1 は Hero 本体（`eyebrow ? <p data-role="eyebrow">…</p> : null`）を変えず、`page.tsx` から prop を渡さないだけ。Hero は汎用のため eyebrow prop を保持する。

#### D. dead CSS（`legacy-public.css`・セレクタ文字列で特定）

| セレクタ | 処理 |
| --- | --- |
| `[data-component="call-to-action-cta"] [data-role="eyebrow"]` | 削除 |
| `[data-component="about-ubm"] [data-role="eyebrow"]` | 削除 |
| `[data-component="featured-members"] [data-role="eyebrow"]` | 削除 |
| `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]` | 削除 |
| `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]` | **保持**（Hero は prop 経由で eyebrow を依然サポート） |
| `[data-component="call-to-action-cta"] [data-role="heading"]` の `margin-top` | `var(--ubm-space-2)` → `0`（eyebrow 削除後の余白整理） |

> CSS は上から削除すると行番号がズレるため、**セレクタ文字列で特定して編集**する（行番号は参考値）。

### 検証コマンド（SSOT §4）

```bash
# 1) focused vitest（ルートからフルパス）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/public/__tests__/Stats.component.spec.tsx \
  src/components/public/__tests__/AboutUbm.component.spec.tsx \
  src/components/public/__tests__/Timeline.component.spec.tsx \
  src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  app/(public)/page.spec.tsx

# 2) 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3) デザイントークン gate（HEX 0 維持）
mise exec -- pnpm verify:design-tokens

# 4) 英語残存 grep（ヒット 0 を期待）
grep -RnE 'CHAPTER SITE|FEATURED MEMBERS|RECENT MEETINGS|FOR MEMBERS|>ABOUT<|THREE ZONES|Members<|Zones<|Meetings / yr|Last sync|Forms 同期中' \
  apps/web/app/'(public)' apps/web/src/components/public

# 5) API 非接触
git diff dev -- apps/api packages/shared   # 空を期待
```

### エラー / エッジケース

- **eyebrow を要素ごと残してテキストだけ消す誤実装**: `<p data-role="eyebrow"></p>` の空要素を残すと CSS の dead rule も残り、AC-3/AC-4 が満たせない。**要素ごと削除**する。
- **Hero の eyebrow ルールを誤削除**: Hero は prop 経由で eyebrow を依然サポートするため、`hero` セレクタの CSS は **保持**する（削除すると Hero 利用箇所が将来 eyebrow を渡したとき崩れる）。
- **値・サブ行の巻き込み**: 置換対象は `data-role="label"` のテキストのみ。`value` / `sub` / `dot` を触ると AC-5 違反。
- **CTA 余白の見落とし**: eyebrow 削除後、heading の `margin-top` が残ると copy 先頭に空きが出る。`0` にするか Phase 11 で余白を確認する。
- **CSS 行番号ズレ**: 上から削除すると後続がズレるため、セレクタ文字列で特定する。
- **旧 `/public/members` shape**: `topTags` が欠ける旧/部分レスポンスでは featured members が error panel になる。shared contract は維持し、web 境界で `topTags: []` のみ補完する。

### 既知制限

- jsdom は CSS を評価しないため、F6（CSS 削除・余白）はコンポーネントテストでは構造検証限定。視覚的妥当性は Phase 11 の local fullpage screenshot で確認済み。
- 追加 staging 反映・staging/crop capture・commit/push/PR は user-gated（本サイクルでは未実施）。

---

## 視覚証跡

- 本タスクは **VISUAL**（ホーム画面の見た目が変わる）。ただし **workflow_state=implemented_local_evidence_captured（ローカル実装・証跡取得済み）** のため、Phase 11 capture は **local_fullpage_present_staging_pending**（実 PNG 3 件）。
- 計画キャプチャ: `home-localized-full.png` / `home-localized-stats.png` / `home-localized-about.png` は local present。追加 staging capture は user-gated。
  詳細は `outputs/phase-11/screenshot-plan.json` と `outputs/phase-11/phase11-capture-metadata.json` を参照。
- 実スクリーンショットは `outputs/phase-11/screenshots/` 配下に 3 件配置済み。staging 画像は未取得であり、捏造しない。
