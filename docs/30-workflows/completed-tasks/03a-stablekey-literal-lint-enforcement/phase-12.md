# Phase 12: ドキュメント・未タスク検出・スキルフィードバック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント・未タスク検出・スキルフィードバック |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (NON_VISUAL evidence) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | enforced_dry_run（warning-mode 実装ドラフト / strict CI gate は後続） |

## 目的

skill `task-specification-creator` の Phase 12 必須 5 タスク（Task 12-1〜12-5）+ Task 6（compliance check）= **計 7 ファイル**を `outputs/phase-12/` 配下に揃え、`aiworkflow-requirements` 正本仕様への反映と legacy stub の同期を行う。

本タスクはレビュー改善で `enforced_dry_run` へ再分類済み。workflow root state は **`completed` ではなく `enforced_dry_run` を維持**し、legacy literal cleanup と strict CI gate 完了後に `enforced` / `completed` へ昇格させる。

## 7 必須成果物（Task 12-1〜12-5 + Task 6）

| # | ファイル | 由来 Task | 役割 | 欠落時 |
| - | --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体 | Phase 12 全体サマリ + 7 ファイル index | FAIL |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 | Part 1 中学生レベル + Part 2 技術者レベル | FAIL |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 | aiworkflow-requirements 反映 / 不変条件 #1 補強 | FAIL |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 | ドキュメント更新履歴（generate-documentation-changelog.js 出力相当） | FAIL |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4 | 未タスク検出（**0 件でも出力必須**） | FAIL |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5 | task-specification-creator skill への feedback（**改善点なしでも出力必須**） | FAIL |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 6 | 7 ファイル実体存在確認 + parity 検査（root evidence） | FAIL |

> 7 ファイルが 1 つでも欠落した場合、Task 6 compliance check の判定を `FAIL` とし、blocker を列挙する。`PASS` 断言禁止。

## Task 12-1: implementation-guide.md（Part 1 / Part 2）

### Part 1（中学生レベル）必須要素チェックリスト 5 項目

| # | チェック項目 | 不合格時の対処 |
| --- | --- | --- |
| 1 | 日常生活の例え話が **1 つ以上** 本文中に登場（料理 / 図書館 / 学校 / 郵便 / 店舗） | 例え話を追加してから次へ |
| 2 | 専門用語セルフチェック表に **5 用語以上** を載せ、各用語に日常語の言い換えを併記 | 5 用語未満なら本文を読み直し、説明なしで使った用語を抽出して表へ追加 |
| 3 | 本文の語彙が **学校生活レベル**（中学 2 年生が読んで止まらない）に収まっている | 「lint」「AST」「リテラル」「allow-list」等が括弧書き言い換えなしで残っていないか確認 |
| 4 | 「なぜ必要か」が「何をするか」より先に書かれている | 段落順を入れ替える |
| 5 | phase-12.md にドラフトがある場合、そのドラフト本文との **逐語一致 or 句読点レベルの軽微差** に収まっている | drift があれば phase-12.md ドラフトに戻す |

### Part 1 ドラフト（本仕様書を逐語コピー対象とする）

> 学校で配るプリントには「正式な決まった書き方」があります。クラス全員が自分の好きな書き方で書き始めると、先生が集計するときにバラバラになって混乱します。本タスクは「stableKey という決まった名前を、決められたファイル以外で勝手に書かないようにする見張り役」を仕組みとして導入します。
>
> 今までは「規約として書かないでね」とお願いベースでした。でも、お願いだけだと忘れたり間違えたりします。だから「先生が自動で見つけてくれる仕組み」（lint = 自動チェック係）を入れて、間違って書いた人が PR を出したら CI（共通の自動テスト）が赤く（不合格に）なるようにします。

### Part 1 専門用語セルフチェック表（5 用語以上必須）

| 専門用語 | 日常語への言い換え |
| --- | --- |
| stableKey | 「フォームの項目を識別する変わらない合言葉（名前）」 |
| ESLint custom rule | 「コードを自動で読んで、ダメな書き方を見つける見張り役」 |
| allow-list | 「これはここにだけ書いて OK、というファイルの一覧表」 |
| AST（抽象構文木） | 「コードを文章として分解した木の図」 |
| CI gate | 「PR を出したときに自動で動く合否テスト」 |
| lint enforced | 「お願いベースではなく、自動チェックで強制している状態」 |

### Part 2（技術者レベル）

- ESLint custom rule の実装方針（`@typescript-eslint/utils` の `Literal` ノード走査）
- allow-list 適用方式（ファイルパス match / glob 設計）
- 例外ポリシー（`__tests__/**` `**/__fixtures__/**` `seed/**` を override）
- AC × evidence × 不変条件 トレース（Phase 11 から転記）
- やってはいけないこと（`eslint-disable` で suppress / runtime 動的合成への過信）

## Task 12-2: system-spec-update-summary.md（aiworkflow-requirements 反映）

| Step | 内容 |
| --- | --- |
| Step 1-A | `task-workflow-completed.md` / `task-workflow-active.md` に本 workflow を追記、LOGS.md ×2 + topic-map 同期 |
| Step 1-B | 実装状況テーブルを更新: 本 workflow を `enforced_dry_run` で記録（**`completed` / `fully enforced` ではない**） |
| Step 1-C | 関連タスクテーブル（03a 仕様書 AC-7 / legacy stub）のステータスを current facts へ更新 |
| Step 1-H | `skill-feedback-report.md` の各 item を Promote / Defer / Reject へ routing |
| Step 2（条件付き） | 不変条件 #1 補強: 「stableKey 直書き禁止は ESLint custom rule で fully enforced」を `references/` に追記。新規インターフェース追加なしのため Step 2 は **N/A 寄り**だが、不変条件強化のため記述追加あり |

### Step 2 N/A 判定例（記載必須テンプレ準拠）

> 本タスクは ESLint custom rule の追加であり、TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の **新規追加なし**。
> 不変条件 #1 の strenghening は文書側で記録すべきため、`references/lessons-learned-*.md` に「stableKey lint enforcement」エントリを追加する形で対応する。
> 新規 API / 型 / IPC 契約は別タスク（runtime guard 検討、03b 側展開）でスコープ化済み。

## Task 12-3: documentation-changelog.md

`scripts/generate-documentation-changelog.js`（存在する場合）を実行、または手動で以下を記録:

- 03a workflow `outputs/phase-12/implementation-guide.md` の AC-7 表記更新（段階 ③ 適用時）
- 03a legacy stub `docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md` への canonical 参照追加
- aiworkflow-requirements の不変条件 #1 補強記述

## Task 12-4: unassigned-task-detection.md（0 件でも出力必須）

| ソース | 確認項目 | 検出有無 |
| --- | --- | --- |
| 元タスク仕様書 | スコープ外: ランタイム検証、03b 側展開 | あり |
| Phase 11 代替 evidence | runtime dynamic literal（template literal 合成） | あり（runtime guard 検討） |
| Phase 3/10 レビュー | MINOR 判定 | （Phase 3/10 で記録） |
| コードコメント | TODO / FIXME（実装タスク wave 後に再走査） | 後続 wave で確認 |

未タスクテンプレ必須セクション（4 種）: 「苦戦箇所【記入必須】」「リスクと対策」「検証方法」「スコープ（含む / 含まない）」を必ず含める。

検出 0 件の場合でも本ファイルは作成し、「該当なし」を明示する。

## Task 12-5: skill-feedback-report.md（改善点なしでも出力必須）

| 観点 | 記録内容（候補） |
| --- | --- |
| テンプレート改善 | NON_VISUAL × CI gate task における L4 evidence 取得手順の明文化 |
| ワークフロー改善 | spec_created → implementation 別 wave 移行時の root state 維持ルール |
| ドキュメント改善 | 03a / 03b の AC 横断 enforcement 表の共通化 |

改善点なしでも「無し」を明記する。各 item は Promote / Defer / Reject に routing し、`system-spec-update-summary.md` Step 1-H に反映。

## Task 6: phase12-task-spec-compliance-check.md

| 項目 | 検査 | 期待結果 |
| --- | --- | --- |
| 7 ファイル実体存在 | `ls outputs/phase-12/` | 7 件揃う |
| root `artifacts.json` parity | jq で workflow_state 確認 | `enforced_dry_run` を維持（strict CI gate 後に `completed`） |
| `outputs/artifacts.json` parity | root と outputs の差分なしを確認 | 両方存在する |
| Phase 1〜11 status 正当性 | jq | すべて completed |
| docs-only / NON_VISUAL 該当性 | metadata.taskType / visualEvidence | implementation / NON_VISUAL を確認 |
| 03a AC-7 同期予約済み | grep | Phase 10 changelog draft 存在 |
| legacy stub 整合 | ls | `docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md` 存在 + canonical 参照 |

### `outputs/artifacts.json` parity 文言

> root `artifacts.json` と `outputs/artifacts.json` は両方存在する。両者の内容が一致することを parity 条件とし、差分なしを PASS とする。

## 03a `outputs/phase-12/implementation-guide.md` AC-7 更新手順

1. ファイルを編集対象として開く: `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md`
2. AC-7 の現状記述（「規約 + ユニットテスト」）を `ESLint custom rule "stableKey 直書き禁止" で fully enforced` に置換
3. 同 commit で本 workflow `metadata.workflow_state` を `completed` に昇格（**Phase 10 段階 ③ 適用後にのみ実施**）
4. `index.md` AC マトリクスにも反映、LOGS.md に row 追加

> 本仕様書 PR 時点では AC-7 表記は変更しない。実装 wave + 段階 ③ 適用 wave で実施する旨を本 phase-12.md と Phase 10 changelog-draft で予約しておく。

## Legacy stub: completed-tasks/task-03a-stablekey-literal-lint-001.md

3 ステップ legacy stub 配置ルールに準拠:

1. **配置場所**: `docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md`（既存）
2. **`## Canonical Status` 追記**: 冒頭に追加
   - canonical 絶対参照: `docs/30-workflows/03a-stablekey-literal-lint-enforcement/index.md`
   - 併記必須文言: `Current canonical state is enforced_dry_run; do not treat as completed or fully enforced CI evidence.`（state が `completed` 昇格時に撤去）
3. **register 登録**: aiworkflow-requirements skill `references/legacy-ordinal-family-register.md` に mapping エントリ追加
   - legacy path / canonical path / 昇格日（本 PR merge 日）/ canonical state（`enforced_dry_run`）

## root / outputs `artifacts.json` parity（enforced_dry_run なので workflow root は completed に上げない）

- root `artifacts.json` の `metadata.workflow_state`: `enforced_dry_run`
- `outputs/artifacts.json` は存在し、root と同一内容であることを PASS 判定にする
- 後続 implementation wave の Phase 12 で `completed` 昇格、AC-7 同期、legacy stub 警告文撤去を **同一 wave** で実施

## 実行タスク

- [ ] 7 ファイル作成（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md）
- [ ] Part 1 必須要素チェックリスト 5 項目すべて PASS
- [ ] aiworkflow-requirements 不変条件 #1 補強記述追加
- [ ] legacy stub に canonical 参照 + enforced_dry_run 警告文を追加
- [ ] `legacy-ordinal-family-register.md` mapping 追加
- [ ] root `artifacts.json` parity 確認（`enforced_dry_run` 維持）

## 完了条件

- [ ] 7 ファイル実体存在
- [ ] Part 1 5 項目チェックリスト全 PASS
- [ ] root `artifacts.json` parity（enforced_dry_run 据え置き）
- [ ] legacy stub 同期完了
- [ ] AC-7 同期手順が後続 wave 用に予約済み

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 12 を completed
- [ ] 7 ファイル parity PASS

## 次 Phase

- 次: Phase 13 (PR 作成)
- 引き継ぎ: 7 ファイル成果物 + change-summary 入力

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 strict output filenames |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Task 12-1〜12-6 guide |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | stableKey / schema_aliases current facts |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 index |
| `outputs/phase-12/implementation-guide.md` | Part 1 / Part 2 guide |
| `outputs/phase-12/system-spec-update-summary.md` | system spec sync summary |
| `outputs/phase-12/documentation-changelog.md` | changelog |
| `outputs/phase-12/unassigned-task-detection.md` | follow-up detection |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback routing |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | final compliance check |
