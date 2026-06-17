# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 5（実装）/ Phase 6（テスト拡充） |
| 下流 | Phase 8（リファクタリング） |
| 状態 | spec_created |

## 目的

Phase 5 の実装と Phase 4/6 のテストに対し、**変更したファイルに限定したカバレッジ**を確認し、AC-1〜AC-10 が漏れなくテストケース（T-NN / TC-RXX / TC-E-XX）または機械検証（gate / grep）にトレースされていることを確認する。本タスクは文字列置換中心で新規ロジックがほぼ無いため、計測の焦点は「変更した文言が回帰テストで固定されているか」「英語・専門語残存 0 が grep で保証されているか」「DOM contract 不変が既存テストの pass 維持で担保されているか」である。全体一律のカバレッジ閾値ではなく、**本タスクで変更した attendance feature 配下のテスト pass 状況と AC トレースを証跡に残す**ことを正本とする（[Feedback BEFORE-QUIT-002]）。

## 実行タスク

1. **計測対象範囲の限定（[Feedback BEFORE-QUIT-002]）**: 計測 / 確認対象を `apps/web/src/features/admin/attendance/` 配下の **本タスクで変更したファイルのみ**に限定する。全体一律 `--coverage` 指定はしない。
2. **`format-attendance.ts` の変更ブロック確認**: `formatDelta`（単位）/ `PERIOD_PRESETS`（label）/ `ZONE_HELP`（定数）の各変更が回帰 TC（TC-R01/R06/R07）で実行されることを確認する。`formatDelta` の符号分岐（↑/↓/→）と null 分岐が既存 + 回帰テストで網羅されていることを記録する。
3. **AC × テスト × 実装ファイルのトレーサビリティ表作成**: `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 を行、検証（T-NN / TC-RXX / TC-E-XX / gate）と実装ファイルを列とする 1:1 対応表を作り、**未カバー AC が 0 件**であることを確認する。
4. **担保区分の明示**: 各 AC を [TEST]（vitest）/ [GATE]（verify-design-tokens / shared diff / 残存 grep）/ [VISUAL]（Phase 11 screenshot）に区別する。
5. **確認コマンドと期待値の確定**: `outputs/phase-07/main.md` に focused vitest + 残存 grep + verify:tokens + shared diff のコマンドと期待値（PASS / 0 件 / 空）を定義する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-10 の正本 |
| 必須 | outputs/phase-02/change-map.md | 変更ファイル / 行アンカー |
| 必須 | outputs/phase-04/test-plan.md | T-NN / TC-RXX |
| 必須 | outputs/phase-06/regression-cases.md | TC-E-XX（残存ゼロ / degrade / skip） |
| 必須 | _shared-context.md | AC 正本 / §8 検証コマンド |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | カバレッジ範囲限定・変更ブロック実測の方針 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | primitive 非追加（AC-6）裏取り |

### 実コード anchor（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| 計測対象 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | formatDelta 分岐 / PRESETS / ZONE_HELP |
| 計測対象 | `apps/web/src/features/admin/attendance/components/*.tsx`（変更分） | 文言置換の DOM 確認 |
| テスト | `apps/web/src/features/admin/attendance/__tests__/*` | 追従 + 回帰 |

## 実行手順

### ステップ 1: 対象限定の確認（全体一律禁止）

- 確認は attendance feature 配下のみに限定する。focused vitest は `--root=. --config=vitest.config.ts apps/web/...` を用いる（既知の罠）。
- カバレッジ数値が必要な場合のみ `--coverage.include='apps/web/src/features/admin/attendance/**'` で限定する（全体一律閾値は適用しない）。

### ステップ 2: `format-attendance.ts` の変更ブロック確認

- `formatDelta` の 3 分岐（↑ / ↓ / →）+ null 分岐が TC-R06/R06b/R06c + 既存テストで実行されることを確認し記録する。
- `PERIOD_PRESETS` の label 3 件が TC-R01 で、`ZONE_HELP` が TC-R07 / T-06 で実行されることを確認する。

### ステップ 3: AC マトリクスの作成と未カバー 0 件確認

- `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 × 検証 × 実装ファイルの 1:1 対応表を作る。
- **未カバー AC が 0 件**であることを最終行で宣言する。AC ごとに [TEST] / [GATE] / [VISUAL] を区別する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | T-NN / TC-RXX 定義をトレースの起点として参照する |
| Phase 6 | TC-E-XX（残存ゼロ / degrade / skip）をトレースに合算 |
| Phase 8 | 未カバー 0 件・残存 0 を前提にリファクタへ進む |
| Phase 9 | トレース証跡を品質保証の入力にする |
| Phase 10 | GO/NO-GO 判定の根拠（AC 全カバー） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / Feedback | 確認内容 |
| --- | --- | --- |
| 範囲限定 | [Feedback BEFORE-QUIT-002] | 確認 / 計測が attendance feature 配下のみに限定され、全体一律指定でないこと |
| 文言固定の網羅 | AC-1/2/3 | 変更文言が回帰 TC で固定 + 残存 grep 0 件で面ガード |
| formatDelta 分岐 | AC-3 | ↑/↓/→ + null の 4 経路が TC で実行されること |
| DOM 不変 | AC-8 | 既存テストの testid / role / href 取得が pass し続けること |
| degrade 不変 | AC-10 | degrade 経路が新文言で TC-E に現れること |
| 未カバー AC ゼロ | AC-1〜AC-10 | ac-matrix で全 AC が TEST / GATE にマップされ空セルが無いこと |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 範囲限定確認 | 7 | spec_created | attendance feature 配下のみ |
| 2 | format-attendance 変更ブロック確認 | 7 | spec_created | formatDelta 分岐 / PRESETS / ZONE_HELP |
| 3 | AC × テスト × 実装ファイル マトリクス | 7 | spec_created | ac-matrix.md |
| 4 | 担保区分（TEST/GATE/VISUAL）明示 | 7 | spec_created | ac-matrix.md |
| 5 | 未カバー AC 0 件確認 | 7 | spec_created | main.md 最終宣言 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | カバレッジ方針・範囲限定コマンド・変更ブロック確認記録欄 |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜AC-10 × 検証 × 実装ファイル 1:1 トレーサビリティ表 |
| メタ | artifacts.json | Phase 7 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-07/main.md` に確認範囲限定方針（attendance feature 配下・変更ファイルのみ）が書かれている
- [ ] 確認 / 計測コマンドが対象限定されており、全体一律指定でない（[Feedback BEFORE-QUIT-002]）
- [ ] `formatDelta` の分岐（↑/↓/→ + null）が回帰 + 既存 TC で網羅される記録欄がある
- [ ] `PERIOD_PRESETS` / `ZONE_HELP` の変更が TC で実行される記録欄がある
- [ ] `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 × 検証 × 実装ファイルの 1:1 対応表が完成している
- [ ] ac-matrix.md で未カバー AC が 0 件であることが宣言されている
- [ ] 各 AC が [TEST] / [GATE] / [VISUAL] のいずれかに区別されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-07/{main,ac-matrix}.md` が配置済み
- [ ] 確認対象が変更ファイルに限定され、全体一律指定でない（[Feedback BEFORE-QUIT-002]）
- [ ] AC-1〜AC-10 すべてが TEST または GATE にマップされ、未カバーが 0 件である
- [ ] AC-5（HEX 0）/ AC-7（shared diff 空）が GATE として明示されている
- [ ] artifacts.json の Phase 7 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 8（リファクタリング）
- 引き継ぎ事項: AC マトリクス（全 AC カバー）/ 変更ブロック確認 / 残存 0 / DOM 不変
- ブロック条件: 未カバー AC が 1 件でも残る、または残存 grep が非 0 の場合は Phase 4/5 に戻る
