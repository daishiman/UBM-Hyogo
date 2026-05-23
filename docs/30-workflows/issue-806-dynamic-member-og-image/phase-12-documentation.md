# Phase 12: ドキュメント

## 1. 中学生にも分かる概念説明（必須セクション）

### この機能は何をしているの？

ホームページのリンクを LINE や Twitter（X）で誰かに送ると、リンクの下に画像とタイトルが「カード」のように表示されますよね。あの **カードに使われる画像** のことを **OG 画像（OGP 画像）** と言います。

これまで、メンバー一人ひとりのプロフィールページ（例: `/members/田中太郎`）を SNS でシェアしても、誰のページをシェアしても **同じ「UBM 兵庫支部会」のロゴ画像** が表示されていました。これだと「誰のページ？」が一目で分からなくて損です。

この変更では、メンバーごとに **その人の名前と肩書きが入った OG 画像を自動で生成** するようにします。たとえば「山田 太郎（エンジニア）」のページをシェアすると、カード画像に「山田 太郎 / エンジニア」と書かれた画像が出るようになります。

### どうやって実現するの？

Next.js には「**画像を返すための route handler**」を置けます。今回は `opengraph-image/route.tsx` をページのフォルダに置き、`/members/[id]/opengraph-image` へアクセスされたときに会員専用の PNG を返します。

中身は「HTML と CSS で見た目を書く → Next.js が裏で PNG に変換する」というシンプルなものです。データベースから「この人の名前」を取ってきて、画像の中に文字として埋め込みます。

### なぜわざわざ別ファイル？

メンバー詳細ページ本体（`page.tsx`）は「HTML を表示する」役割で、OG 画像は「PNG を返す」役割。**役割が違うので別ファイルにする**のが Next.js の流儀です。

## 2. システム仕様書更新サマリ

| 仕様ファイル | 更新内容 |
|---|---|
| `docs/00-getting-started-manual/specs/00-overview.md` | （変更なし） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | （変更なし — API 変更なし） |
| `docs/30-workflows/issue-806-dynamic-member-og-image/index.md` | 本仕様書として正本 |

## 3. 関連ドキュメント更新

- `docs/30-workflows/unassigned-task/task-issue-274-followup-001-dynamic-member-og-image.md`
  → 本仕様書のリンクを冒頭に追記し、ステータスを `consumed / canonical spec created` に更新済み
- `docs/30-workflows/completed-tasks/issue-274-public-pages-ogp-sitemap-robots/` は実行済み evidence の破壊的書き換えを避け、本仕様書から parent link で依存を明示する

## 4. canonical 9 headings（task-specification-creator gate 互換）

1. 概要
2. 不変条件
3. 変更対象ファイル
4. テスト方針
5. 実装手順
6. 完了条件 (DoD)
7. リスクと対策
8. ロールバック
9. 中学生にも分かる概念説明

これらはそれぞれ次の Phase ファイルで詳細化済み:

| 見出し | Phase |
|---|---|
| 概要 | index.md / phase-1-requirements.md |
| 不変条件 | index.md §不変条件 |
| 変更対象ファイル | index.md §変更対象ファイル |
| テスト方針 | phase-4-test-plan.md |
| 実装手順 | phase-5-implementation.md |
| 完了条件 (DoD) | phase-5-implementation.md §11 |
| リスクと対策 | phase-3-design-review.md §2 |
| ロールバック | phase-10-final-review.md §3 |
| 中学生にも分かる概念説明 | phase-12-documentation.md §1 |

## 5. Phase 11 evidence 表

| TC | evidence path |
|---|---|
| TC-1 (PNG 200) | `outputs/phase-11/manual-test-result.md` |
| TC-2 (meta path) | `outputs/phase-11/screenshots/og-image-meta-grep.txt` |
| TC-3 (404) | `outputs/phase-11/manual-test-result.md` |
| TC-4 (目視) | `outputs/phase-11/screenshots/og-image-seeded.png` |
| TC-5 / TC-6 (regression) | `outputs/phase-11/manual-test-result.md` |

## 6. 未タスク検出（Phase 12 必須）

| ID | 内容 | 判定 |
|---|---|---|
| FU-001 | 日本語フォント埋め込み（Noto Sans JP 等）で OG 画像の glyph 安定化 | 起票しない。TC-4 で tofu が出た場合は同一実装サイクル内で修正し、技術的に破綻する場合のみエスカレーション |
| FU-002 | `fetchProfile(id)` 共通 helper 化 | 起票しない。2 callsite では抽象化コストが勝るため、callsite が 3 以上に増えた時点で再評価 |

新規未タスクは 0 件。検出結果は `outputs/phase-12/unassigned-task-detection.md` に反映済み。
