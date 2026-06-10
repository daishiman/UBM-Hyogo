# Phase 1: 要件定義

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)

## 背景

ユーザー報告（staging スクリーンショット + DevTools、2026-06-09 19:38）。対象画面 `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema/history`（「alias resolve 履歴」）で:

1. 「この画面は何をするところか分からない。何を解決・解消した結果を見るのか。フォームスキーマの履歴を探るのか用途が不明瞭」
2. 「レイアウトが崩れている」
3. 「絞り込みっていうところで JSON データが下部に配置されている」
   → 「絞り込み」ボタン押下後、画面下部に次が raw 表示:
   `[ { "code": "unrecognized_keys", "keys": [ "batchId" ], "path": [ "appliedFilters" ], "message": "Unrecognized key: \"batchId\"" } ]`

調査により、3 問題すべてが **apps/web 表現層 / adapter 層**に起因し、`apps/api`・D1・Google Form は無罪であることを確定した（[`shared-context.md` §2](./shared-context.md)）。

## タスク分類

- **UI task（VISUAL）**: admin UI の挙動・表示を変更する。local implementation evidence は取得済みで、staging screenshot 証跡は user-gated として Phase 11 に残す。
- docs-only task ではない（コード変更が目的達成に必須）。

## 命名規則（既存コードベース分析）

- React component: PascalCase（`SchemaDiffHistoryPanel`, `AdminPageHeader`）。新規 `SchemaHistoryPurposeExplainer`。
- lib module / 純関数: camelCase（`fetchSchemaAliasHistory`, `formatSchemaHistoryError`）。
- 純データ export: camelCase（`schemaHistoryGlossary`, `schemaHistoryPurposeSteps`）。
- zod schema: PascalCase + `Z` suffix（`AppliedFiltersZ`, `SchemaAliasHistoryResponseZ`）— 既存に整合。
- test ファイル: `*.spec.{ts,tsx}`（不変条件 #8。`*.test.*` 禁止）。component spec は `*.component.spec.tsx` 慣行。

## ゴール

| ID | ゴール | 検証 |
|----|-------|------|
| G1 | 「絞り込み」で `batchId` ZodError が出ず履歴 parse が成功する | Lane A + 回帰 spec（AC-1/AC-2） |
| G2 | 取得失敗時に raw JSON でなく日本語メッセージが OKLch スタイルで表示される | Lane B（AC-3/AC-4） |
| G3 | 画面冒頭に「何の画面か・流れ・用語集」を示す目的説明UIが表示される | Lane C（AC-5/AC-6） |
| G4 | 履歴がプロトタイプ ALIAS HISTORY 準拠のカード形式で表示される | Lane D（AC-7） |
| G5 | 上記すべてが回帰テストで保護される | Lane E（AC-2/AC-3/AC-5/AC-7/AC-10） |

## 非ゴール（Out of Scope）

- 新規 API endpoint の追加（不変条件 #1 違反）
- D1 schema 変更 / migration 追加（不変条件 #1 違反）
- Google Form 仕様変更
- 履歴画面フィルタへの batchId 入力欄追加（AskUser Q3 = 足さない・受理のみ）
- `apps/api` の audit endpoint・appliedFilters 仕様変更（API 無罪・非接触）
- `/admin/schema` 本体 page の構造変更（history からのリンクのみ。本体は別タスク `admin-schema-page-prototype-alignment-and-diff-fetch-fix` で対応済み）

## 不変条件（CLAUDE.md / UI prototype alignment より継承）

1. 既存 API surface のみ利用（`GET /admin/audit?action=schema_diff.alias_assigned` を再利用）
2. OKLch tokens 正本化 — `apps/web/src/styles/tokens.css` を参照、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止
3. プロトタイプ primitives 正本順位 — `pages-admin.jsx` `SchemaDiffPage` ALIAS HISTORY を表示形式の正本とし、新 primitive を生やさない
4. D1 直接アクセス禁止 — `apps/web` は API helper 経由のみ
5. apps/api 非接触 — `git diff origin/dev...HEAD -- apps/api apps/api/migrations` が空
6. 新規 test ファイルは `*.spec.{ts,tsx}` のみ

## 受け入れ基準（AC）

[`shared-context.md` §8](./shared-context.md) を正本とする。要約:

- AC-1: 「絞り込み」で `unrecognized_keys` / `batchId` の ZodError が発生せず parse 成功（Lane A）
- AC-2: `SchemaAliasHistoryResponseZ.parse` が `appliedFilters.batchId`（string / null 両方）を受理する回帰 spec PASS（Lane A/E）
- AC-3: 取得失敗時に raw JSON でなく日本語メッセージ表示（Lane B）
- AC-4: error 表示要素に `.schema-history-error` クラス + OKLch token スタイル（Lane B）
- AC-5: 目的説明パネル（`data-testid="schema-history-purpose-explainer"`）+ 流れ 3 ステップ + 用語集が描画される（Lane C）
- AC-6: page title「設問の紐付け履歴」/ description 平易化（Lane C）
- AC-7: 履歴が `.schema-history-card` カード形式で stableKey / 旧→新 / question / 日時・操作者を描画（Lane D）
- AC-8: 当該 page/panel/explainer/globals.css に HEX 直書き 0 件（不変条件 #2）
- AC-9: `apps/api` diff 空（不変条件 #5）
- AC-10: `typecheck` / `lint` / web 対象 spec 群が全 PASS（Lane E）

## ステークホルダー

- 単一オーナー: daishiman（solo 開発）
- 利用者: 管理者ロール（schema diff resolve 担当）

## carry-over 確認

直近コミット（`git log --oneline -5`）:
- `c073c59b8` 会員データソース3層プレシデンス（無関係）
- `c4b48aa44` / `963e7e914` = audit_log batchId 関連 → **本タスクの batchId 混入の上流**。これらは API 側の正当な機能追加であり、本タスクは web 側 zod を追従させる（API は変更しない）。

## 中学生レベル概念説明

この画面は「設問の紐付け履歴」を見る画面。Google フォームの質問は、ときどき文言が変わったり新しく増えたりする。そのとき管理者が「この新しい質問は、前のあの質問と同じものだよ」と紐付ける（これを alias resolve = エイリアス解決という）。その「いつ・誰が・どの質問を・どう紐付けたか」の作業記録が、この画面に並ぶ。

今は 3 つの困りごとがある:
1. 「絞り込み」ボタンを押すと、エラーの中身（プログラムのメモ書きのような文字列）がそのまま画面の下にベタッと出てしまう。これは、サーバーが送ってくる箱の中に `batchId` という新しい荷札が増えたのに、受け取る側がその荷札を知らずに「知らない荷札だ！」と拒否しているのが原因。受け取る側に荷札を 1 つ教えてあげれば直る。
2. そのエラー表示が、飾り付け（スタイル）が無いので不格好。読みやすい日本語のメッセージに置き換えて、枠で囲って見やすくする。
3. そもそも「何の画面か」が書いていない。画面の最初に「この画面でできること」の説明と、言葉の意味（用語集）を足す。
4. 履歴の並びを、デザイナーのお手本どおりの「カード」の形に整える。

この 4 つを 1 回の実装でまとめて終わらせる。
