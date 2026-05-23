[実装区分: 実装仕様書]

# Phase 12: ドキュメント

## 1. 中学生にも分かる概念説明（必須セクション）

### この修正は何をしているの？

このプロジェクトには「**色のルール表（デザイントークン）**」があって、画面の色は全部このルール表に登録された名前（例: `--color-primary`）で書く決まりになっています。「`#1e3a8a` のような **生の色コード（HEX）を直接書くのは禁止**」というルールです。

このルールを守れているかを CI（GitHub Actions の自動チェック）で確認するスクリプトがあって、それが「`verify-design-tokens`」です。今このスクリプトが「HEX が直書きされてる！ダメ！」とエラーを出していて、PR が通らなくなっています。

### なぜ普通は HEX を直書きしちゃダメなの？

3 つ理由があります。

1. **色を変えたいとき、ルール表 1 か所を直すだけで全部の画面に反映できる**。HEX を直書きすると、全画面のファイルを 1 個ずつ書き換える羽目になります
2. **ダークモードや色テーマ切替が簡単になる**。`--color-primary` という名前なら、ダークモードのときに別の色に切り替えるだけで済みます
3. **デザイナーとエンジニアの会話がスムーズになる**。「primary をちょっと暗く」と言えば話が通じますが、「#1e3a8a を…」だと毎回値を確認することになります

### じゃあ今回はなぜ HEX 直書きを許すの？

「**OG 画像**（SNS で URL を貼ったときに出るカード画像）」を作るためのプログラム（`next/og` の `ImageResponse`、中身は「**satori**」というツール）には **技術的な制限** があります。

satori は HTML と CSS を読んで PNG 画像を作るのですが、**`--color-primary` のような CSS 変数を理解できません**。CSS 変数はブラウザが画面を表示するときに値を解決する仕組みですが、satori は「ブラウザの外」で動いているため、変数の中身を取り出せないのです。

つまり、OG 画像を作るファイル（`opengraph-image/route.tsx` など）では、**仕方なく HEX を直書きするしかない**。これを技術用語で「satori 制約」と呼びます。

### じゃあ何を直すの？

CI チェックのスクリプト（`scripts/verify-design-tokens.ts`）には「**このファイルは HEX 直書きを許す**」という除外リストがあります。

すでに `opengraph-image.tsx`（ファイル形式）は除外されていたのですが、最近追加された `opengraph-image/route.tsx`（フォルダ + route 形式）が除外漏れになっていました。今回はこの **除外リストに 4 行追加するだけ** の修正です。

つまり「HEX 禁止のルールは変えない、satori でどうしても HEX が必要な特定の 4 種類のファイルだけ除外する」という最小限の修正です。

## 2. システム仕様書更新サマリ

| 仕様ファイル | 更新内容 |
|---|---|
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | （変更なし — トークン定義に変更なし） |
| `docs/00-getting-started-manual/specs/design-tokens.md` | （変更なし — 設計原則に変更なし） |
| `CLAUDE.md` §UI prototype alignment §不変条件 2 | （変更なし — HEX 直書き禁止原則は維持） |
| `docs/30-workflows/completed-tasks/fix-verify-design-tokens-og-route-exclude/index.md` | 本仕様書として正本 |
| `scripts/verify-design-tokens.ts` comment | satori 制約による exclude である旨を 1 行追記（実装時） |

## 3. 関連ドキュメント更新

- `docs/30-workflows/issue-806-dynamic-member-og-image/` （parent workflow）
  → 本 fix workflow は aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory へ同期済み。parent workflow 本体の追記は PR merge 後の履歴整理に留め、今回の完了条件には含めない。
- 既存 `docs/30-workflows/completed-tasks/issue-274-public-pages-ogp-sitemap-robots/` は破壊的書き換えなし

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
| 完了条件 (DoD) | phase-5-implementation.md §DoD |
| リスクと対策 | phase-3-design-review.md |
| ロールバック | phase-10-final-review.md §4 |
| 中学生にも分かる概念説明 | phase-12-documentation.md §1 |

## 5. Phase 11 evidence 表

| TC | evidence path |
|---|---|
| TC-1 (local verify:tokens exit 0) | `outputs/phase-11/verify-tokens-local.txt` |
| TC-2 (CI verify-design-tokens green) | `outputs/phase-11/gh-pr-checks.txt`（PR 作成後の user-gated evidence） |
| TC-3 (drift canary fail) | `outputs/phase-11/drift-canary-fail.txt` |
| TC-4 (境界誤マッチなし) | `outputs/phase-11/canary-non-og-route.txt` |

## 6. 未タスク検出（Phase 12 必須）

| ID | 内容 | 判定 |
|---|---|---|
| FU-001 | `colorLiteralExcludes` を satori 制約専用バケットへ分離（comment 付き） | 起票しない。現状 8 件で論理同一バケット。新 convention 追加 or 件数 10 超で再評価（Phase 8 §2 参照） |
| FU-002 | Next.js Metadata Files convention の全 file/route 形を generator で機械生成 | 起票しない。可読性 > メタプログラミング cost。callsite 増加時に再評価 |
| FU-003 | `scripts/verify-design-tokens.ts` exclude 配列の根拠 comment を 1 行追記 | 本 PR 内で同時実施（追加タスク化不要） |

新規未タスクは 0 件。検出結果は `outputs/phase-12/unassigned-task-detection.md` にも展開済み。
