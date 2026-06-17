# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 4（テスト作成・追従 + 回帰設計） |
| 下流 | Phase 6（テスト拡充） |
| 状態 | spec_created |

## 目的

Phase 2 の change-map（11 ファイル + テスト 5 本）を唯一の正として、出席ダッシュボードの英語表記とエンジニア専門語を平易な日本語へ置換する。変更は文字列置換中心 + 軽微 CSS（U-03）+ 既存テスト追従。**API / D1 / Google Form / `packages/shared` 型は一切変更しない（AC-7）。新規 primitive / component / util / 型ゼロ（AC-6）。HEX 直書きゼロ（AC-5）。testid / role / `data-*` / `href` の DOM contract は不変（AC-8）。** 本 Phase の手順は `outputs/phase-05/runbook.md` に記述し、本サイクルで実コードへ反映済み。

## 実行タスク

1. **実装方針概要の確定**: `outputs/phase-05/main.md` に CONST_005（変更対象ファイル / 入出力・副作用 / テスト方針 / 実行コマンド / DoD）を集約する。
2. **runbook 作成**: `outputs/phase-05/runbook.md` に「編集ファイル一覧テーブル（新規/編集の別を明記・[Feedback RT-03]）」「ファイル別の行アンカー付き置換手順（change-map 転記）」「契約保持箇所（`formatDelta` / `PERIOD_PRESETS` / `ZONE_HELP`）の置換例」「U-03 軽微 CSS（必要時のみ・token 準拠）」「テスト追従（T-01〜T-06）+ 回帰追加手順」「挙動不変温存の確認手順」「ローカル検証コマンド」を書く。
3. **新規ゼロの確認**: 新規ファイル（component / primitive / util / 型 / CSS クラス）を一切作らないことを runbook で明記する。全て既存ファイルの編集（文字列置換中心）。
4. **挙動不変温存の確認手順**: フィルタ（期間プリセット / 出席回数チェック）/ 書き出し（href 不変）/ ドリルダウン modal / DetailTabs 排他 / SafeResult degrade が挙動不変であることの確認手順を runbook に書く。
5. **検証コマンドの確定**: typecheck / lint / focused vitest / `verify:tokens` / `git diff -- apps/api packages/shared`（空）/ 英語・専門語残存 grep（0 件）を runbook に書く。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/change-map.md | **唯一の正**：ファイル別 行アンカー付き Before/After |
| 必須 | outputs/phase-01/rename-map.md | R/S/J/U の逐語 |
| 必須 | outputs/phase-04/test-plan.md | T-01〜T-06 追従 + 回帰 TC-XX |
| 必須 | outputs/phase-03/main.md | GO 判定 / MINOR M-1〜M-4 |
| 必須 | _shared-context.md | AC-1〜AC-10 / §8 検証コマンド |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX design principles | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 文言・ラベルの分かりやすさ実装原則 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | ダッシュボード情報設計の実装指針 |
| 実装パターン | `.claude/skills/aiworkflow-requirements/references/architecture-implementation-patterns-core.md` | client/server component 境界（DetailTabs は client・据置） |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止・AC-7） |

## 実行手順

### ステップ 1: 実装方針概要（main.md）

- `outputs/phase-05/main.md` に変更対象ファイル一覧・入出力副作用（文字列のみ・契約不変）・テスト方針・検証コマンド・DoD を集約する。

### ステップ 2: runbook（runbook.md）

- 編集ファイルテーブル → 各ファイル行アンカー付き置換手順 → 契約保持箇所の置換例 → U-03 CSS → テスト追従 + 回帰 → 挙動不変温存 → 検証コマンド の順で書く。

### ステップ 3: 後続実装者の着手保証

- runbook 単体で「どのファイルのどの行を何に変えるか」が自明であること（change-map 転記 + grep 再確認手順）を確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | T-01〜T-06 追従 + 回帰 TC-XX を Green 化する置換単位を runbook の各ファイルにマップ |
| Phase 6 | 英語 / 専門語残存 0 の grep ガード（TC-E-XX）の前提を提供 |
| Phase 9 | typecheck / lint / vitest / verify:tokens / 残存 grep を実行 |
| Phase 11 | VISUAL タスクの screenshot 取得 + visual baseline 再取得（M-2） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| API/D1/shared 不変 | AC-7 / invariant #5 | `apps/api/**` / `packages/shared/**` / `fetch-attendance.ts` の diff がゼロ。新規型ゼロ |
| 新規追加ゼロ | AC-6 / invariant #3 | 新規 component / primitive / util / CSS クラス追加なし。全て既存編集 |
| HEX ゼロ | AC-5 / invariant #2 | U-03 の globals.css 追加分が全て `var(--ubm-color-*)`。HEX / `bg-[#xxx]` / `text-[#xxx]` なし |
| DOM contract 不変 | AC-8 | testid / role / `data-*` / `href` を変えない。aria-label 文言変更（J-01/04/09）は属性キー維持 |
| internal state | [VSCPKR-03] | DetailTabs の label 変更が `value` / `useState` に波及しない |
| 契約保持 | — | `formatDelta` / `PERIOD_PRESETS` / `ZONE_HELP` の単位・ラベル・定数文字列のみ変更 |
| 挙動不変温存 | AC-10 | フィルタ / 書き出し / modal / 排他 / degrade が不変 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装方針概要 + CONST_005 | 5 | spec_created | main.md |
| 2 | 編集ファイルテーブル（新規/編集の別） | 5 | spec_created | runbook |
| 3 | ファイル別 行アンカー付き置換手順 | 5 | spec_created | change-map 転記 |
| 4 | 契約保持箇所の置換例（formatDelta/PRESETS/ZONE_HELP） | 5 | spec_created | runbook |
| 5 | U-03 軽微 CSS（必要時のみ・token） | 5 | spec_created | HEX ゼロ |
| 6 | テスト追従 + 回帰追加手順 | 5 | spec_created | T-01〜T-06 + TC-XX |
| 7 | 挙動不変温存 + 検証コマンド | 5 | spec_created | runbook |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 実装方針概要 + CONST_005 集約 |
| ドキュメント | outputs/phase-05/runbook.md | 後続実装者向け実装手順書（編集ファイル / 行アンカー置換 / CSS / テスト / 検証） |
| メタ | artifacts.json | Phase 5 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-05/main.md` に CONST_005（変更対象ファイル / 入出力副作用 / テスト方針 / 実行コマンド / DoD）が集約されている
- [ ] `outputs/phase-05/runbook.md` に「編集ファイル一覧テーブル」（パス + 新規/編集の別）が記載されている
- [ ] 各ファイルの行アンカー付き置換手順（change-map 転記）が記載されている
- [ ] 契約保持箇所（`formatDelta` 単位 / `PERIOD_PRESETS` ラベル / `ZONE_HELP` 定数）の置換例が記載され、入出力契約が不変であることが明記されている
- [ ] U-03 軽微 CSS が（必要時のみ）`var(--ubm-color-*)` で記述され HEX 直書きゼロである（AC-5）
- [ ] 新規 component / primitive / util / 型 / CSS クラス追加ゼロ（AC-6）が runbook で明記されている
- [ ] テスト追従（T-01〜T-06）+ 回帰追加（TC-XX）手順が記載されている
- [ ] 挙動不変温存（フィルタ / 書き出し href / modal / 排他 / degrade）の確認手順が記載されている
- [ ] ローカル検証コマンド（typecheck / lint / focused vitest / verify:tokens / shared diff 空 / 残存 grep 0）が記載されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-05/{main,runbook}.md` が配置済み
- [ ] runbook が後続実装者の着手保証粒度（行アンカー + grep 再確認）を満たしている
- [ ] AC-5 / AC-6 / AC-7 が runbook 上で機械検証可能（HEX grep / 新規追加なし / shared diff 空）になっている
- [ ] Phase 4 の全 T-NN / TC-XX が runbook のどのファイル置換で Green になるか対応づけられている
- [ ] artifacts.json の Phase 5 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 6（テスト拡充）
- 引き継ぎ事項: runbook の置換ファイル / 残存 grep ガード / 検証コマンド / visual baseline 再取得（M-2）
- ブロック条件: AC-5/6/7/8 のいずれかが runbook で保証できない場合は Phase 2（設計）に戻る
