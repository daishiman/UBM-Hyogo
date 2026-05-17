# Phase 12: ドキュメント（中学生レベル概念説明含む）

## 1. 中学生レベルでの概念説明

### loading boundary って何？

Webサイトでマイページを開くとき、サーバーが「あなたの会員情報」を取りに行く時間がかかります。その間、画面に「何も無い真っ白」だと「壊れたのかな？」と心配になりますよね。

そこで Next.js には **「ローディング画面」を自動で挟む仕組み** があります。`loading.tsx` というファイルを置いておくと、本体のページが用意できるまでの間、そこに書いた「読み込み中の見た目」を勝手に表示してくれます。これが **loading boundary** です。

### 「スケルトン」って何？

「読み込み中…」という文字だけ出すのは古いやり方です。最近の Web では、本物のページの「形」だけを灰色のブロックで先に表示しておきます。これが **skeleton（骸骨）** という考え方です。

たとえばマイページなら:
- 丸い円 → アバター画像が来る場所
- 横長の太いバー → 名前見出しが来る場所
- 横長の細いバー × 4 → 住所・電話番号などの項目

こうすると、本体が表示されたときに「あ、思ったところに思ったものが出てきた」となり、ガクッと配置が動かない（これを **CLS = Cumulative Layout Shift** と言います）。

### `role="status"` って何？

画面を見ない人（目の不自由な人など）のために、「ここは状態を伝える場所だよ」と教える HTML 属性です。これがあると、スクリーンリーダー（画面を読み上げるソフト）が「マイページを読み込み中」と読んでくれます。

### `motion-safe:animate-pulse` って何？

skeleton のブロックがフワッと点滅すると「動いてる感じ」が出ます。でも、視差効果が苦手な人 (`prefers-reduced-motion: reduce` 設定の人) には逆効果。`motion-safe:` を付けると「視差効果 OK の人だけ」点滅するようになります。やさしい設計です。

### `bg-surface-2` って何？

色を直接 `#cccccc` のように書くのではなく、「surface-2 という名前の色」を使う方式です。プロジェクト全体で色名を統一して、後からテーマを変えやすくする仕組み（**デザイントークン**）です。OKLch という色空間の値で定義されていて、目に優しい一定の明るさを保てます。

## 2. ドキュメント更新リスト

| ファイル | 更新内容 |
|---|---|
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md` | `スコープ確定ノート` の `status: pending` → `implemented_local_runtime_pending`、canonical workflow pointer 追加 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` | i07 行を `implemented_local_runtime_pending` |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md` DoD §4.5 | Issue #770 local 実装済み / runtime visual evidence pending として消し込み |

> `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md` は削除せず、`status: consumed` と canonical workflow pointer を追記して履歴参照を保存する。

## 3. user 向け影響

- 視覚的影響: `/profile` 遷移時の placeholder が文字列から skeleton ブロック群に変化
- a11y 影響: スクリーンリーダー利用者にロード状態が明示的に通知される
- 性能影響: なし（同等の SSR fallback、追加 JS なし）

## 4. 開発者向け申し送り

- 同様の loading boundary を他 route に追加する際は本タスクの `loading.tsx` を参照雛形にする
- 共通化（primitive 抽出）は i05/i06/i07 merge 後に別 PR で検討
- `data-page="*-loading"` 命名は E2E 識別子として尊重する
