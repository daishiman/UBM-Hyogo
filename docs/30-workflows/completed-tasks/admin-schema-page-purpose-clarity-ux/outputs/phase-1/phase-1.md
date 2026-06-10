# Phase 1 — 要件定義

[実装区分: 実装仕様書]（CONST_004: 「直感的にわかる UI/UX にしてほしい」は表示コンポーネント・コピー・CSS の追加/編集を伴うため実装仕様書。docs-only ではない）

> SSOT: [`../../_shared-context.md`](../../_shared-context.md) を正本とする。本 Phase はその §1〜§4 を要件として固定する。

## 1.1 タスク分類

- タスク種別: **UI task / VISUAL**（管理画面の表現層改善。スクリーンショット証跡対象）
- implementation_mode: `new`（implemented_local_evidence_captured。staging visual / commit / PR は user-gated）
- 関連 Issue: なし（staging 観察起点）

## 1.2 主問題（1文固定）

`/admin/schema` は機能完成済みだが、**目的・操作の流れ・得られる結果が伝わらず**、専門用語が説明なしで露出しているため、管理者が「何をするページか／この先何ができるか／何が得られるか」を理解できない。

## 1.3 why now / why this way

- why now: staging 実機で管理者本人が「何をするページか分からない」と明示。会員データ正規化運用の起点画面で理解断絶は運用停止リスク。
- why this way: 真因は表現層（コピー・情報設計・用語）に閉じる（§2 裏取り）。API/D1/Form は正しく動作しており触らない。表現層に説明導線・やさしい用語・結果プレビューを足すのが最小・最整合の解。

## 1.4 受入条件（AC）

| AC | 内容 | 検証 |
| --- | --- | --- |
| AC-1 | ページ上部に目的説明（できること＋3ステップ流れ図＋結果プレビュー＋用語集）が常時表示される | vitest（SchemaPurposeExplainer）, 視覚 |
| AC-2 | header description が流れ・成果の伝わる文へ更新される | vitest（page.spec） |
| AC-3 | 統計4枚の label/hint が平易日本語＋次アクション示唆へ更新（技術名は補助併記） | vitest（page.spec） |
| AC-4 | 履歴2枚の見出しが「対応づけ履歴」等の平易表記＋技術名併記へ更新 | vitest（page.spec） |
| AC-5 | SchemaDiffPanel が各カテゴリ説明・割り当てアウトカム・平易ステータス・0件 empty コピーを表示 | vitest（SchemaDiffPanel.component.spec） |
| AC-6 | 用語の言い換えは `schemaGlossary.ts` 純モジュールに集約され単体テストされる | vitest（schemaGlossary.spec） |
| AC-7 | 既存の操作ロジック・API 呼び出し・フォーム送信は不変 | コードレビュー＋`git diff -- apps/api packages/shared` 空 |
| AC-8 | 新規 HEX 0・OKLch トークンのみ | `verify-design-tokens` |
| AC-9 | typecheck / lint clean | 各コマンド |

## 1.5 既存命名規則の分析（FB-01 / FB-SDK-07-4）

- コンポーネント: PascalCase `.tsx`（例 `SchemaDiffPanel`, `SchemaDiffHistoryPanel`）。新規 `SchemaPurposeExplainer` はこれに整合。
- 純データ/ユーティリティ: camelCase `.ts`（例 `schemaAliasValidation.ts`）。新規 `schemaGlossary.ts` はこれに整合。
- テスト: コンポーネントは `*.component.spec.tsx`（既存 `SchemaDiffPanel.component.spec.tsx`）、ユーティリティは `*.spec.ts`、ページは `page.spec.tsx`（既存）。**`*.test.*` 禁止（CLAUDE.md 不変条件8）**。
- CSS クラス: kebab-case `.schema-*`（既存 `.schema-grid` / `.schema-field-card` / `.schema-alert-card`）。新規も `.schema-*` 接頭辞に整合。

## 1.6 carry-over 確認

- 直近 `git log --oneline -5`: audit batchId index / visual baseline 横展開 / cf token / bulk tag / sentry filter。本タスクと重複・依存なし。
- 本タスクは独立した新規 workflow root。先行実装は存在しない（current branch 実装なし → 通常 spec 作成 + 実装は user-gated）。

## 1.7 既存テスト全件実行リスク（FB-UI-02-2）

- 全件 `pnpm test` は重い。Phase 4 で focused run の対象ファイルを事前列挙する（SSOT §7）。

## 1.8 スコープ

- 含む: 表現層の説明導線・やさしい用語・結果プレビュー・CSS（§5 の3レーン）。
- 含まない: API/D1/Form 変更、`useAdminMutation` 改変、ガイド付きフルウィザード（OOS）。

## 完了条件

- [x] タスク分類（UI/VISUAL）記録
- [x] 主問題1文固定
- [x] AC 9件定義
- [x] 既存命名規則分析
- [x] スコープ確定（SSOT §5/§6 と整合）
