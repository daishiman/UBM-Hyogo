# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL 代替 evidence) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

skill `task-specification-creator` Phase 12 必須 5 + Task 6（compliance check）+ Task 12-5（skill feedback promotion）= **計 7 ファイル**を作成し、`aiworkflow-requirements` skill 正本仕様への反映を行う。本 Phase は **2 path** を明確に分ける。`spec formalization path` では本仕様書の作成・正本同期・Phase 12 の 7 ファイル実体化までを行い、root `workflow_state=spec_created` を据え置く。`implementation path` では Phase 1〜11 の実装 evidence 取得後に同じ 7 ファイルを実測値で更新し、Phase 13 の user 承認後に PR を作成する。

> 重要: 本 Phase は **0 件でも 7 ファイル全てを必ず物理的に出力する**（unassigned-task-detection.md / skill-feedback-report.md は内容が「該当なし / 改善点なし」でも空ファイル不可。明示的に「該当なし」を本文に記述する）。

## 依存境界

- 上流: `spec formalization path` では Phase 1〜13 仕様骨格が作成済みであること。`implementation path` では Phase 11 で 4 NON_VISUAL evidence と manual-test-result.md が取得済みであること
- 下流: Phase 13 で本 Phase の 7 ファイルを change-summary.md に列挙

## 実行タスク

- [ ] Task 12-1: implementation-guide.md 作成（Part 1 中学生レベル + Part 2 技術者レベル）
- [ ] Task 12-2: system-spec-update-summary.md 作成（specs/01-api-schema.md / specs/00-overview.md 反映差分）
- [ ] Task 12-3: documentation-changelog.md 作成
- [ ] Task 12-4: unassigned-task-detection.md 作成（0 件でも出力必須）
- [ ] Task 12-5: skill-feedback-report.md 作成（promotion routing 明記、改善なしでも出力必須）
- [ ] Task 12-6: phase12-task-spec-compliance-check.md 作成（root / outputs `artifacts.json` parity + Phase status parity + 7 ファイル実体確認）
- [ ] Task 12-7: main.md 作成（Phase 12 全体サマリ）
- [ ] Task 12-8: artifacts.json の phase 12 status を completed に更新（implementation evidence path では root workflow_state を `verified` に更新）

## 7 必須成果物

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | outputs/phase-12/main.md | Phase 12 全体サマリ |
| 2 | outputs/phase-12/implementation-guide.md | Part 1 中学生レベル + Part 2 技術者レベル / metadata 注入の使用例 / 03a・04a・04b 契約引き渡し |
| 3 | outputs/phase-12/system-spec-update-summary.md | specs/01-api-schema.md / specs/00-overview.md 反映差分 |
| 4 | outputs/phase-12/documentation-changelog.md | 更新履歴 |
| 5 | outputs/phase-12/unassigned-task-detection.md | 残課題（0 件でも出力必須） |
| 6 | outputs/phase-12/skill-feedback-report.md | task-specification-creator skill への feedback + promotion routing |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | 7 ファイル実体 + artifacts.json parity + Phase status parity |

## implementation-guide.md 構成

### Part 1（中学生レベル）

中学生レベル化の必須要素 5 項目を全て満たすこと:

1. **日常生活の例え話**: 「学校の名簿で『出席番号』だけを書いた紙を渡されても、それが誰か分からない。だから出席番号と名前と学年を結びつけた "正本台帳" を 1 冊だけ用意して、名簿を見せる人 (public / member / admin) は全員その台帳を引きながら表示する」
2. **専門用語セルフチェック表（5 用語以上）**:
   | 専門用語 | 中学生レベルの言い換え |
   | --- | --- |
   | canonical schema | 正本となる "答え合わせの台帳" |
   | resolver | 台帳を引く "係の人" |
   | stableKey | フォーム項目につけた "出席番号のような ID" |
   | field_kind | 項目の "種類タグ"（テキスト / 選択肢 / 同意ボタン など） |
   | section_key | 項目が所属する "章のラベル" |
   | drift | 台帳と実物が "ズレた" 状態 |
   | fallback | 台帳が無いときの "間に合わせ判定" |
3. **学校生活レベルの語彙**: 「fallback」を「間に合わせ判定」、「3 view」を「3 種類の見せ方の画面」、「parity」を「3 つの画面で同じ見え方になる状態」のように言い換える
4. **「なぜ」先行**: 「なぜこれをやるのか → 3 つの画面で同じ field が違う見え方をすると運用が混乱するから → だから台帳を 1 つに揃える」の順で説明
5. **ドラフト逐語一致**: Part 2 の技術仕様と Part 1 の説明が同じ事象を指していること（例: Part 1 の「同意ボタン」は Part 2 の `field_kind=consent` と 1 対 1 対応）

### Part 2（技術者レベル）

- `MetadataResolver` interface の使用例（コード断片）
- builder.ts 呼び出し側への注入例
- 03a への引き渡し: StableKey alias queue interface の呼び出しフック契約
- 04a への引き渡し: `/public/*` view contract と resolver 出力の整合保証
- 04b への引き渡し: `/me/*` view contract と resolver 出力の整合保証
- D1 migration 採用時の `bash scripts/cf.sh` 経由運用ルール
- drift 検知の通知方式（`Result.err(unknownStableKey)` or 例外）の選定理由

## system-spec-update-summary.md（specs 反映差分）

| 対象ファイル | 更新内容 | 反映理由 |
| --- | --- | --- |
| docs/00-getting-started-manual/specs/01-api-schema.md | `response_fields` の `section_key` / `field_kind` カラム（採用方式に応じて）を schema 表に追記、または resolver 経由解決である旨を注記 | canonical schema の正本化 |
| docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 / #2 / #3 の運用境界に「resolver 経由」を明記 | 運用ルール固定 |
| docs/00-getting-started-manual/specs/08-free-database.md | migration 採用時のみ migration 番号を追記 | D1 構成記録 |

aiworkflow-requirements skill 正本仕様への反映が必要な場合は、Step 1-A/B/C + 条件付き Step 2 を本ファイルで管理する。

## unassigned-task-detection.md（0 件でも出力必須）

検出時:
- 既存 `docs/30-workflows/unassigned-task/` 配下に新規 stub を作成 or formalize path に昇格
- ファイル名 / 検出理由 / 関連 issue / 推奨優先度を記録

検出 0 件:
- 「該当なし」を本文に明記
- 探索対象（builder.ts 残債 / 03a interface drift / 04a / 04b 契約 drift）を明示し、各 0 件であることを記録

## skill-feedback-report.md（改善点なしでも出力必須、promotion routing 明記）

苦戦箇所の skill-feedback への promotion routing 必須要素:

| 項目 | 内容 |
| --- | --- |
| promotion target | `.claude/skills/task-specification-creator/references/` 配下の該当 reference |
| no-op reason | 改善点なしの場合、「現テンプレで NON_VISUAL implementation タスクの代替 evidence パターンが充足したため」など具体的に記述 |
| evidence path | 苦戦箇所を裏付ける evidence ファイルへのパス（Phase 11 の drift-detection-log.md など） |

改善点が無い場合も「無し（理由: 〜）」を明記する。

## phase12-task-spec-compliance-check.md

| 検査項目 | 検査コマンド | 期待値 | 結果 |
| --- | --- | --- | --- |
| 7 ファイル実体存在 | `ls outputs/phase-12/` | 7 件 | □ |
| root artifacts.json と outputs 実体 parity | `jq -r '.phases[].outputs[]?' artifacts.json | while read f; do test -e "$f" || echo "missing $f"; done` | missing 0 件 | □ |
| outputs/artifacts.json 不在宣言 | compliance 本文 | root `artifacts.json` が唯一正本 | □ |
| Phase 1〜11 status parity | `jq '.phases[].status' artifacts.json` | spec formalization path では pending 維持可 / implementation path では 1〜11 completed | □ |
| outputs/phase-11 evidence 6 件確認 | `ls outputs/phase-11/` | 6 件 | □ |
| secret hygiene 再 grep | `grep -iE '(token\|cookie\|authorization\|bearer\|secret)' outputs/phase-11/*` | 0 hit | □ |
| docs-only 該当性 | `jq '.metadata.taskType' artifacts.json` | implementation を確認 | □ |
| visualEvidence 区分 | `jq '.metadata.visualEvidence' artifacts.json` | NON_VISUAL を確認 | □ |
| workflow_state | `jq '.metadata.workflow_state' artifacts.json` | implementation path は `verified` / spec formalization path は `spec_created` | □ |

## workflow_state 運用

- spec formalization path では root の `metadata.workflow_state` は **`spec_created` のまま据え置き**
- implementation path では Phase 11 evidence 取得後に `verified` へ進め、Phase 13 で PR merged になった段階で初めて `completed` に更新する
- 中間状態（implementing / verified）は artifacts.json の lifecycle states 表に従う

## 統合テスト連携

- implementation-guide.md は Phase 7 AC マトリクスの AC-1 / AC-7 / AC-10 と整合
- system-spec-update-summary.md は不変条件 #1 / #2 / #3 / #5 と 1 対 1 でトレース可能
- compliance-check は Phase 11 の evidence index と Phase 13 の change-summary を結ぶ hub

## 多角的チェック観点

- **完全性**: 7 ファイル全てが物理的に存在（0 件出力でも本文記述あり）
- **整合性**: root artifacts.json と outputs ディレクトリの parity が一致
- **遷移整合**: workflow_state が path と整合している（本タスクの実装 evidence path は `verified`）
- **再現性**: implementation-guide Part 1 と Part 2 の用語が逐語一致
- **promotion**: skill-feedback の promotion routing が明確（target / reason / evidence path）

## サブタスク管理

- Task 12-1〜12-5 は並列実行可能
- Task 12-6 (compliance-check) は 12-1〜12-5 完了後に実行
- Task 12-7 (main.md) は最後にサマリとして集約
- Task 12-8 は最後に artifacts.json を更新

## 完了条件

- [ ] 7 ファイル実体存在（0 件出力でも本文記述あり）
- [ ] root artifacts.json の outputs 宣言と outputs 実体が一致
- [ ] `outputs/artifacts.json` 不在時は root 単独正本文言を compliance-check に逐語記載
- [ ] Phase status が path と整合（spec formalization path は pending 維持、implementation path は 1〜11 completed）
- [ ] specs 反映差分が system-spec-update-summary.md に明示
- [ ] skill-feedback の promotion routing が記載
- [ ] workflow_state は path と整合（本タスクの実装 evidence path は `verified`）

## タスク100%実行確認【必須】

- [ ] 全実行タスク (12-1〜12-8) completed
- [ ] artifacts.json の phase 12 status を completed に更新
- [ ] root metadata.workflow_state は implementation evidence path として `verified`

## 次 Phase

- 次: Phase 13 (PR 作成)
- 引き継ぎ: 7 ファイル成果物 + change-summary 入力 + compliance-check 結果
