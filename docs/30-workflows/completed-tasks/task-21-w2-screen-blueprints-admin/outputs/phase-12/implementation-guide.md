# implementation-guide.md — task-15/16/17 が 09g を正本に着手するためのガイド

本ガイドは `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`（906 行 / 視覚値 0 件 / AdminSidebar 集約済 / AC-1〜9 全 PASS）を blueprint 正本として、admin 8 routes の実装に着手するための要点をまとめる。task-15 / task-16 / task-17 の各実装担当が最初に読むべき文書。

## 0. 中学生レベル概念説明（3 トピック必須）

### 0.1 AdminSidebar とは何か

AdminSidebar は「管理画面で常に画面の左に出ている共通メニュー」のこと。`/admin` 配下のページを開いたとき、どのページでも同じメニュー（dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit）が表示される。これによりユーザーはどのページにいても次の画面へすぐ移動できる。

09g では §1 にだけ AdminSidebar の仕様を書いている。各画面（§2〜§9）には書かない。理由は、もし各画面で同じことを書くと、後で「dashboard リンクの順番を変えよう」と思ったときに 8 箇所を全部修正しないといけなくなり、修正漏れで「ページ A だけ古い順番」のような不整合（drift と呼ぶ）が必ず起きるから。

ルール: 実装でも `apps/web/src/app/(admin)/layout.tsx` の中に AdminSidebar コンポーネントを 1 回だけ呼び出し、各 page では呼ばない。

### 0.2 派生ルールとは何か

派生ルールとは「プロトタイプ（=デザインの叩き台）に絵が無い画面を、既に決まっている部品の組み合わせで作るための決まり」のこと。

UBM 兵庫の admin 画面 8 個のうち 4 個（dashboard / members / tags / schema）はプロトタイプ `pages-admin.jsx` に構造が書かれているので、構造・copy・状態 contract を転記する。視覚値や prototype-only class は転記しない。残り 4 個（meetings / requests / identity-conflicts / audit）はプロトタイプに絵が無い。だからといって新しい部品を勝手に作ると、見た目がバラバラになり「同じ admin なのに画面ごとに雰囲気が違う」状態になる。

そこで `phase-3 §3 §5.3〜§5.7` に「未掲載画面はこのパターンの組合せで作る」という決まり（=派生ルール）を書いてある。09g ではその決まりを正本転記し、各派生画面の冒頭に `> 派生元: phase-3 §3 §5.x` と明記している。

実装側のルール: 09c primitive（task-19 の責務）以外の新 primitive を作らない。例えば「特別なテーブルが欲しい」と思っても、既存の DataTable primitive をオプションで切り替える方向で解決する。

### 0.3 視覚値 0 件とはなぜ重要か

視覚値とは、HEX コード（色の生値）、OKLch 直値、ピクセル値、Tailwind 任意値クラス記法の 4 種を指す。これらを仕様書（09g）にそのまま書いてしまうと、token（`--ubm-color-primary` など）と「同じ色を表す情報が 2 箇所」に存在することになる。

これがなぜ困るかというと、デザイナーが「primary 色を少し青寄りにしたい」と決めた時、token を変える人と仕様書の HEX を変える人が別だと、片方だけ更新されて drift が発生する。drift が起きると「token を変えたのに仕様書のスクショや HEX とずれている」という事故が始まり、誰も真の正解を判断できなくなる。

だから 09g には `--ubm-*` という token 名（=参照）だけを書き、視覚値そのものは書かない。これは AC-5 で grep gate（HEX / OKLch / ピクセル / 任意値クラス記法 の 4 パターン）を 0 件として強制している。実装でも同じ考え方で、任意値クラスを書かず `bg-primary`（token-bound class）を使う。

## 1. 09g § ↔ 実装ファイル対応マップ

09g は仕様書なので、実装時は次のように `apps/web/src/app/` 配下のファイルにマッピングする。

| 09g § | 実装ファイル（推定） | 担当 task |
| --- | --- | --- |
| §1 AdminSidebar | `apps/web/src/app/(admin)/layout.tsx` + `apps/web/src/components/layout/AdminSidebar.tsx` | task-15（admin shell） |
| §2 dashboard | `apps/web/src/app/(admin)/admin/page.tsx` | task-15 |
| §3 members | `apps/web/src/app/(admin)/admin/members/page.tsx` | task-16 |
| §4 tags | `apps/web/src/app/(admin)/admin/tags/page.tsx` | task-16 |
| §5 meetings | `apps/web/src/app/(admin)/admin/meetings/page.tsx` | task-17 |
| §6 schema | `apps/web/src/app/(admin)/admin/schema/page.tsx` | task-17 |
| §7 requests | `apps/web/src/app/(admin)/admin/requests/page.tsx` | task-17 |
| §8 identity-conflicts | `apps/web/src/app/(admin)/admin/identity-conflicts/page.tsx` | task-17 |
| §9 audit | `apps/web/src/app/(admin)/admin/audit/page.tsx` | task-17 |
| §99 不採用 | （実装しない / 参照禁止） | — |

### 補助実装

| 役割 | 実装ファイル（推定） |
| --- | --- |
| AdminSidebar 本体 | `apps/web/src/components/layout/AdminSidebar.tsx`（既存実装を維持し、出席分析補助 route を削除しない） |
| confirm Modal | 09c primitive `Modal` を再利用（新規 primitive 禁止） |
| API client | `apps/web/src/lib/api/admin/*` で `apps/api/src/routes/` 既存 endpoint のみ呼ぶ |

## 2. a11y / confirm Modal 実装注意点

09g §X.6 で必須記述している 4 文字列は、実装でも同等の振る舞いを満たさなければならない。

| 文字列 | 実装上の意味 | 検証手段 |
| --- | --- | --- |
| `role="dialog"` | Modal ルートに `role="dialog"` 属性 | playwright a11y check |
| `aria-modal="true"` | 背後コンテンツを支援技術から隠す | 同上 |
| focus trap | 開いた瞬間に Modal 内へフォーカス、Tab 巡回が外に出ない | キーボード手動 + e2e |
| Esc close | Esc キーで閉じる、フォーカスは元の trigger に戻す | キーボード手動 + e2e |

該当画面: members（bulk-action）/ tags（delete）/ meetings（cancel）/ schema（apply）/ requests（approve, reject）/ identity-conflicts（merge）。dashboard / audit は read-only のため confirm Modal 不要。

## 3. schema-apply 二段確認パターン（§6 / 6.3 mermaid + 6.7 操作手順）

schema 画面は他と異なり「変更内容を proposalize → 差分プレビュー → apply 確認 → 適用」の 4 段階の状態を持つ。09g §6.3 mermaid に下記のキーパスが必須:

```
diff --> confirming: apply requested
confirming --> applied: apply success
applied --> loading: refresh
```

実装上の手順:
1. ユーザーが入力 → サーバー側で diff を生成
2. UI に diff plan を表示（適用前なので副作用なし）
3. apply ボタン押下 → confirm Modal（`role="dialog"` ほか 4 文字列必須）
4. 確定 → POST /admin/schema/apply → applied
5. applied になったら一覧を再 fetch（loading）

途中で離脱した場合、proposal は破棄して再開時は最初から（中間状態を永続化しない）。

## 4. API 表（§X.4）の使い方

09g §X.4 は phase-3 §2 admin block と完全一致するように作られている（AC-6 で行 diff 0 を強制）。実装側で API client を書くときは:

- `apps/api/src/routes/` 配下の既存 endpoint だけを呼ぶ
- 新 endpoint 追加は本タスクのスコープ外（不変条件 1）
- 期待 shape と UI 期待 shape が乖離したら adapter 層を `apps/web/src/lib/api/admin/adapters/*` に置く（API を変えない）

## 5. 凍結 prototype 構造 転記の遵守

§2 / §3 / §4 / §6 は `pages-admin.jsx`（凍結正本）の構造・copy・状態 contract を転記している。実装では:

- DOM 構造を 09g の JSX に揃える
- class は token-bound class で表現（任意値クラス禁止）
- 動的部分（state / handler）は React で実装するが、構造そのものは保持
- 既存補助 route `/admin/dashboard/attendance` は UT-02A の既存成果物として AdminSidebar に残す

## 6. 派生 4 画面の遵守事項

§5 / §7 / §8 / §9 は派生注記（`> 派生元: phase-3 §3 §5.x`）が必須。実装でも:

- 新 primitive を作らない（既存 09c primitive のみ組合せ）
- 既存 patternに当てはまらない要望が出た場合は task-19（primitive）側へエスカレーションする
- D1 直接アクセス禁止（CLAUDE.md 不変条件 5）

## 7. 着手前チェックリスト

実装担当が PR 作成前に確認:

- [ ] 09g §X.4 の API と `apps/api/src/routes/` 既存 endpoint が完全一致している
- [ ] confirm Modal 関連画面で 4 a11y 文字列を満たすコンポーネントを使っている
- [ ] schema 画面で 4 段階状態遷移を実装している
- [ ] HEX / OKLch / ピクセル値 / 任意値クラスを実装ファイルに書いていない（CI gate `verify-design-tokens` 通過）
- [ ] AdminSidebar を `(admin)/layout.tsx` に 1 箇所だけ置き、各 page で再記述していない
- [ ] 派生 4 画面で新 primitive を作っていない（09c の組合せのみ）

## 8. 参考リンク

| 種別 | パス |
| --- | --- |
| blueprint 正本 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| 親 workflow phase-3 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` |
| primitive 仕様 | 09c（task-19 担当） |
| token 仕様 | 09a（task-08 担当）/ `apps/web/src/styles/tokens.css` |
| icon 仕様 | task-22 |
| 凍結 prototype 構造 | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` |
