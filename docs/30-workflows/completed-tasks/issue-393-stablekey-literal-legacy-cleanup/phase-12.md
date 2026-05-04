[実装区分: 実装仕様書]

# Phase 12: ドキュメント・未タスク検出・スキルフィードバック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント・未タスク検出・スキルフィードバック |
| 作成日 | 2026-05-03 |
| 前 Phase | 11 (NON_VISUAL evidence) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #393 (CLOSED) |
| workflow_state | strict_ready（legacy cleanup 実装完了 / strict CI gate 昇格は別 wave） |

## 目的

skill `task-specification-creator` の Phase 12 必須 5 タスク（Task 12-1〜12-5）+ Task 6（compliance check）= **計 7 ファイル**を `outputs/phase-12/` 配下に揃え、
`aiworkflow-requirements` 正本仕様への反映 / 親 03a workflow の AC-7 同期 diff 計画 / 不変条件 #1・#2・#4 の整合確認を行う。

本タスク仕様書は「14 ファイル・148 件の literal cleanup 実装完了」と evidence 同期を成果とし、
strict CI gate 昇格自体は **別 wave** に予約する（`workflow_state = strict_ready` を維持）。

## 7 必須成果物（Task 12-1〜12-5 + Task 6）

| # | ファイル | 由来 Task | 役割 | 欠落時 |
| - | --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体 | Phase 12 全体サマリ + 7 ファイル index | FAIL |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 | Part 1 中学生レベル + Part 2 技術者レベル | FAIL |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 | aiworkflow-requirements 反映 / 不変条件 #1 / #2 / #4 補強 | FAIL |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 | ドキュメント更新履歴 | FAIL |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4 | 未タスク検出（**0 件でも出力必須**） | FAIL |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5 | task-specification-creator skill への feedback（**改善点なしでも出力必須**） | FAIL |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 6 | 7 ファイル実体存在確認 + parity 検査 | FAIL |

> 7 ファイルが 1 つでも欠落した場合、Task 6 の判定を `FAIL` とし blocker を列挙する。`PASS` 断言禁止。

## Task 12-1: implementation-guide.md（Part 1 / Part 2）

### Part 1（中学生レベル）必須要素チェックリスト 5 項目

| # | チェック項目 | 不合格時の対処 |
| --- | --- | --- |
| 1 | 日常生活の例え話が **1 つ以上** 本文中に登場 | 例え話を追加してから次へ |
| 2 | 専門用語セルフチェック表に **5 用語以上** | 用語を追加 |
| 3 | 本文の語彙が学校生活レベル | 「lint」「import」「allow-list」等を括弧書き言い換え |
| 4 | 「なぜ必要か」が「何をするか」より先に書かれている | 段落順を入れ替え |
| 5 | phase-12.md ドラフト本文との 逐語一致 or 軽微差 | drift があればドラフトに戻す |

### Part 1 ドラフト（implementation-guide.md へ逐語コピー対象）

> 学校で教科書を作るとき、「校章」のロゴ画像は「校章ファイル」1 個だけに保管して、各ページからはそのファイルを参照します。もし各ページが勝手に「校章っぽい絵」を描き直したら、ページごとに校章が微妙に違ってしまい、後で校章を変更したときに全ページを直す羽目になります。
>
> 本タスクが解消するのもこれと同じ問題です。フォーム項目の「合言葉」（stableKey という名前）が、これまで 14 個のファイルで個別に直書きされていました。1 か所だけ「正本ファイル」に置き、各所からはそれを名前で参照するように直します。これで合言葉が変わっても 1 か所の修正で全部に反映されます。
>
> さらに、自動チェック係（lint）が「直書きしている人」を見つけてくれる仕組み（親タスクで作成済み）を、いま「警告止まり」から「不合格にする」モードに上げられる準備が整います。

### Part 1 専門用語セルフチェック表（5 用語以上必須）

| 専門用語 | 日常語への言い換え |
| --- | --- |
| stableKey | 「フォームの項目を識別する変わらない合言葉」 |
| 正本 supply module | 「校章ファイルにあたる、合言葉を 1 か所に集めた正式なファイル」 |
| named import | 「正本ファイルから合言葉を名前指定で借りてくる書き方」 |
| literal（リテラル） | 「コードに直接書かれた文字列のかたまり」 |
| strict CI gate | 「PR 提出時に自動で動く、絶対に通さない検査」 |
| family（A〜G） | 「変更箇所をグルーピングして、1 グループずつ安全に進める単位」 |

### Part 2（技術者レベル）

- 正本 supply module 構成: `packages/shared/src/zod/field.ts` の `FieldByStableKeyZ` / `STABLE_KEY_LIST` / `STABLE_KEY` + `packages/integrations/google/src/forms/mapper.ts` の mapping table
- 置換パターン: `'fullName'` → `STABLE_KEY.fullName` のような typed key map 参照
- family 別実装手順（Phase 5 runbook 参照）と family commit 順（G → A → B → D → C → E → F）
- AC × evidence × 不変条件 トレース（Phase 11 から転記）
- やってはいけないこと:
  - `// eslint-disable-next-line` で violation を suppress する
  - テンプレートリテラル `` `field_${name}` `` で動的合成して strict lint を bypass する
  - 配列 `join('_')` で literal 合成回避を狙う
- 後続 strict CI gate 昇格 wave の予約事項（`.github/workflows/*.yml` の修正）

## Task 12-2: system-spec-update-summary.md（aiworkflow-requirements 反映）

| Step | 内容 |
| --- | --- |
| Step 1-A | `task-workflow-active.md` 相当の current workflow inventory に本 workflow を `strict_ready / implementation / NON_VISUAL` として追記 |
| Step 1-B | 実装状況テーブルを、本 workflow の 14 ファイル置換完了・strict lint 0 として記録 |
| Step 1-C | 親 03a workflow の AC-7 を「legacy cleanup blocker resolved / strict CI gate remains separate follow-up」として扱う |
| Step 1-H | `skill-feedback-report.md` の各 item を Promote / Defer / Reject へ routing |
| Step 2（条件付き） | 不変条件 #1 / #2 / #4 補強記述: 「stableKey は正本 supply module 経由参照のみ。app/packages 配下での literal 直書きは strict lint で検知」を `references/` に追記 |

### Step 2 N/A 判定（記載必須テンプレ準拠）

> 本タスクは TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の **新規追加なし**（既存 export を named import で参照するのみ）。
> 不変条件 #1 / #2 / #4 の strenghening は文書側で記録すべきため、`references/lessons-learned-*.md` および current facts に「stableKey literal cleanup 完了」エントリを追加する形で対応する。
> 新規 API / 型 / IPC 契約は別タスク（runtime guard 検討、strict CI gate 昇格 wave）でスコープ化済み。

## Task 12-3: documentation-changelog.md

`scripts/generate-documentation-changelog.js`（存在する場合）を実行、または手動で以下を記録:

- 親 03a workflow `outputs/phase-12/implementation-guide.md` の AC-7 表記更新計画追記（実装 evidence 取得後に適用）
- aiworkflow-requirements の不変条件 #1 / #2 / #4 補強記述
- `task-workflow-active.md` への本 workflow 追記
- 14 ファイル一覧と family 別 commit hash の記録（実装 wave 完了後に追記）

## Task 12-4: unassigned-task-detection.md（0 件でも出力必須）

| ソース | 確認項目 | 検出有無 |
| --- | --- | --- |
| 元タスク仕様書 | スコープ外: strict CI gate 昇格 PR | あり（後続 wave で実施） |
| Phase 11 代替 evidence | runtime dynamic literal（template literal 合成） | あり（runtime guard 検討タスク） |
| Phase 10 merge 順序 | `.github/workflows/*.yml` での `--strict` blocking 化 | あり（後続 wave） |
| コードコメント | TODO / FIXME（実装後 grep 再走査） | 後続確認 |

未タスクテンプレ必須セクション 4 種（「苦戦箇所【記入必須】」「リスクと対策」「検証方法」「スコープ（含む/含まない）」）を必ず含める。

検出 0 件の場合でも本ファイルは作成し、「該当なし」を明示する。

## Task 12-5: skill-feedback-report.md（改善点なしでも出力必須）

| 観点 | 記録内容（候補） |
| --- | --- |
| テンプレート改善 | family 別 commit 構成の記述パターン化（grouping table の標準セクション化） |
| ワークフロー改善 | 親 workflow との AC 引継ぎ（AC-7 sync）における diff 計画フォーマット化 |
| ドキュメント改善 | 「実装区分: 実装仕様書」マーカーの index.md からの可視化 |

改善点なしでも「無し」を明記する。各 item は Promote / Defer / Reject へ routing し、`system-spec-update-summary.md` Step 1-H に反映。

## Task 6: phase12-task-spec-compliance-check.md

| 項目 | 検査 | 期待結果 |
| --- | --- | --- |
| 7 ファイル実体存在 | `ls outputs/phase-12/` | 7 件揃う |
| root `artifacts.json` parity | jq で workflow_state 確認 | `strict_ready` |
| `outputs/artifacts.json` parity | root と outputs の差分なしを確認 | 両方存在し一致 |
| Phase 1〜11 status 正当性 | jq | Phase 1〜12 completed、Phase 13 blocked_until_user_approval |
| docs-only / NON_VISUAL 該当性 | metadata.taskType / visualEvidence | implementation / NON_VISUAL を確認 |
| 親 03a AC-7 同期予約済み | grep | Phase 10 AC-7 更新 diff 計画存在 |
| Phase 11 evidence 5 件存在 | `ls outputs/phase-11/evidence/` | 5 件揃う |

### `outputs/artifacts.json` parity 文言

> root `artifacts.json` と `outputs/artifacts.json` は両方存在する。両者の内容が一致することを parity 条件とし、差分なしを PASS とする。

## 親 03a `outputs/phase-12/implementation-guide.md` AC-7 更新手順

1. ファイル: `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md`
2. AC-7 の現状記述（「規約 + 単体テストで担保（lint 未導入は legacy literal 残存）」）を `legacy literal cleanup 完了、strict CI gate 昇格可能 state` に置換
3. 関連 evidence 参照に `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/lint-strict-after.txt` を追加
4. 実装 evidence 取得後の同 commit で本 workflow `metadata.workflow_state` を `strict_ready` または `implementation_completed` に確定（strict CI gate 昇格 wave で `completed` 昇格）
5. `index.md` AC マトリクスにも反映、LOGS.md に row 追加

> 本仕様書 PR 時点では AC-7 表記更新を完了扱いにしない。原則として実装 wave 完了確認後の同 wave 内で実施する。

## 不変条件 #1 / #2 / #4 整合確認

| 不変条件 | 整合確認内容 | 検査方法 |
| --- | --- | --- |
| #1 schema 固定しすぎない | 14 ファイルから literal 散在が除去された | `lint-strict-after.txt` = 0 |
| #2 consent キーは publicConsent / rulesConsent 統一 | family G (`packages/shared/src/utils/consent.ts`) で正本経由参照に統一 | `git grep -n 'publicConsent\|rulesConsent' packages/shared/src/utils/consent.ts` |
| #4 Google Form schema 外は admin-managed data として分離 | family C (admin routes) で admin-managed key も正本経由 | family C の typecheck PASS（E3） |

## root / outputs `artifacts.json` parity

- root `artifacts.json` の `metadata.workflow_state`: `strict_ready`
- `outputs/artifacts.json` は存在し、root と同一内容であることを PASS 判定
- 後続 strict CI gate 昇格 wave で `completed` 昇格

## 実行タスク

- [ ] 7 ファイル作成（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md）
- [ ] Part 1 必須要素チェックリスト 5 項目すべて PASS
- [ ] aiworkflow-requirements 不変条件 #1 / #2 / #4 補強記述追加
- [ ] 親 03a workflow AC-7 更新 diff 計画固定
- [x] root `artifacts.json` parity 確認（`strict_ready`）

## 完了条件

- [ ] 7 ファイル実体存在
- [ ] Part 1 5 項目チェックリスト全 PASS
- [x] root `artifacts.json` parity（`strict_ready`）
- [ ] AC-7 同期 diff 計画固定
- [ ] 不変条件 #1 / #2 / #4 整合確認 PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 12 を completed
- [ ] 7 ファイル parity PASS

## 次 Phase

- 次: Phase 13 (PR 作成)
- 引き継ぎ: 7 ファイル成果物 + change-summary 入力 / AC-7 更新 diff 案

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 strict output filenames |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | Task 12-1〜12-6 guide |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | stableKey current facts |
| 必須 | `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md` | AC-7 更新対象 |

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
