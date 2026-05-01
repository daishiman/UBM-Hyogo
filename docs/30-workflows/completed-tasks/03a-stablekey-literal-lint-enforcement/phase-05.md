# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

ESLint custom rule（または ts-morph 静的検査）で **stableKey リテラル直書きを CI で fail させる** ための再現可能な手順を `outputs/phase-05/runbook.md` に確定する。
本仕様書は **手順記述のみ** であり、rule 実装そのものは別タスク（実装フェーズ）で行う。本書はそのための owner / 想定時間 / rollback / スコープ境界を固定する責務を持つ。

## ランブック全体構成（`outputs/phase-05/runbook.md`）

| Step | 名称 | owner | 想定時間 | rollback 手段 |
| --- | --- | --- | --- | --- |
| ① | rule 雛形作成（package 配置 + entry 定義） | wave 8b lint config | 0.5 h | branch 破棄 |
| ② | AST マッチャー実装（Literal / TemplateLiteral） | wave 8b lint config | 1.5 h | rule entry を `disabled` に切替 |
| ③ | allow-list 設定（正本モジュールパス） | wave 8b lint config | 0.5 h | allow-list を空配列に戻す |
| ④ | override 設定（tests / fixtures / seed の例外） | wave 8b lint config | 0.5 h | override を削除（全件 error 化） |
| ⑤ | snapshot test 追加（フィクスチャ 3 種） | wave 8b lint config | 1.0 h | フィクスチャ削除 |
| ⑥ | CI 組み込み（`pnpm lint` ジョブで実行） | wave 8b lint config | 0.5 h | workflow から step を撤去 |
| ⑦ | 03a workflow の AC-7 ステータス更新 | 03a owner | 0.25 h | implementation-guide.md を revert |

合計想定時間: 約 4.75 h（実装担当者ベース、レビュー時間別途）。

## Step 詳細

### Step ① rule 雛形作成

- 配置先候補: `packages/eslint-config/src/rules/no-stablekey-literal/`（wave 8b で確定する monorepo lint 基盤に従属）
- meta 情報: `type: 'problem'`、`messageId: 'no-stablekey-literal'`、`fixable: undefined`（自動修正は提供しない）
- export entry を共通 ESLint config に登録できる形にする
- **本仕様書ではコードを記載しない**。配置先・命名・meta 構造の規約のみ定義する。

### Step ② AST マッチャー実装

- 対象 AST 種別: `Literal`（string）、`TemplateLiteral`（quasis 単一・式なし）
- マッチ条件: 値が「stableKey 命名規則（例: `^[a-z][a-z0-9_]+$` かつ既知 prefix セット）」に一致
- 既知 prefix セットは allow-list モジュール（`packages/shared/src/zod/field.ts` 等）を **走査して動的に算出** し、ハードコードを避ける
- TS parser は `@typescript-eslint/parser` を採用（既存 monorepo 設定と整合）

### Step ③ allow-list 設定

正本モジュール候補（最終確定は実装時の grep 結果に依存）:

| パス | 役割 |
| --- | --- |
| `packages/shared/src/zod/field.ts` | stableKey の zod schema 正本 |
| `packages/integrations/google/src/forms/mapper.ts` | Google Form 取得時のキー mapping |
| （追加候補） `packages/shared/src/forms/stablekey-registry.ts` 等 | 03a 内で正本化される場合 |

allow-list は ESLint rule オプション（または `lint.config.ts` の `settings`）として外部化し、コードに直接書かない。

### Step ④ override（例外パス）設定

| 例外パターン | 根拠 |
| --- | --- |
| `**/*.test.ts` / `**/*.spec.ts` | ユニットテストはリテラルでアサート可能とする |
| `**/__fixtures__/**` | フィクスチャは固定 string が前提 |
| `apps/api/migrations/**` / `**/seed/**` | migration / seed は当時の literal を保存 |
| `**/*.snap` | snapshot 生成物 |

override は ESLint flat config の `files` フィールドで宣言する（legacy `.eslintrc` 併存時の方針は Phase 6 異常系で扱う）。

### Step ⑤ snapshot test 追加

Phase 4 で定義した 3 フィクスチャ（violation / allowed / edge）を入力に、rule 出力を snapshot 化する。
snapshot は `__snapshots__/no-stablekey-literal.snap` に集約する。

### Step ⑥ CI 組み込み

- `.github/workflows/*.yml` のうち lint ジョブで `pnpm lint` を実行している箇所に **追加 step は不要**
- ただし「rule が実際に動いていること」を担保するため、CI 上で `pnpm --filter <lint-package> test` を **必須 status check** に追加することを推奨
- `required_status_checks` への登録は branch protection 側の作業（本タスクでは申請のみ）

### Step ⑦ 03a workflow の AC-7 ステータス更新

- `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md` の AC-7 行を「規約のみ」→「lint enforced」に更新
- 同 workflow の `artifacts.json` で AC-7 関連 evidence 参照先を本タスクの `outputs/phase-11/` に追記

## スコープ外（明示）

- ランタイム検証（実行時に stableKey を validate する仕組み）
- 03b 同期側の追加対応（共通 lint 基盤に乗る場合は自動適用、明示的な 03b 改修はスコープ外）
- 既存違反コードの mass refactor（本タスク開始時点で既存 03a 実装は clean 想定。違反検出時は別 issue）
- ESLint custom rule 基盤そのものの整備（wave 8b の責務）

## 実装は別タスクで行う旨の明記

本仕様書はあくまで **手順・基準** を定めるものである。
rule 本体の TypeScript / JavaScript ソースコード、CI workflow YAML の追記、`packages/eslint-config/` のファイル追加等の **コード変更** は、Phase 11 を起点に別タスク（実装担当）が実行する。
本仕様書を Write / Edit する作業者は、コードを生成・追加・修正してはならない。

## 実行タスク

- [ ] `outputs/phase-05/main.md` 配置（ランブック概要）
- [ ] `runbook.md` を Step ①〜⑦ で配置
- [ ] 各 Step の owner / 想定時間 / rollback を明示
- [ ] スコープ外の項目を明示
- [ ] 実装は別タスクで行う旨を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/evidence-checklist.md | test 戦略 |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md | 元仕様 |
| 推奨 | packages/shared/src/zod/field.ts | allow-list 候補 |
| 推奨 | packages/integrations/google/src/forms/mapper.ts | allow-list 候補 |

## 完了条件

- [ ] 7 Step の表（owner / 時間 / rollback）配置
- [ ] allow-list 候補と override パターン明示
- [ ] スコープ外と「実装は別タスク」明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: ランブック実行で発生し得る failure case の列挙、override 不足時の recovery

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-05/main.md` | 実装ランブック要約 |
| `outputs/phase-05/runbook.md` | lint topology discovery から evidence 取得までの手順 |

## 統合テスト連携

Phase 7 は本 Phase の runbook で実装した rule/config を対象に、全 workspace lint と intentional violation を確認する。
