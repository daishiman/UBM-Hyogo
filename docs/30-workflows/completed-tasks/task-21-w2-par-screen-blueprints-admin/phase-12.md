# Phase 12: 完了処理（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 12 / 13（完了処理） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 11 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` / `spec_created` |
| 必須 outputs | 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |

> 本 Phase は phase-template-phase12.md に準拠。docs-only タスクのため Step 2 は **N/A**（09g 自体が「正本登録」のため二重登録不要）。

---

## 0. 自己完結コンテキスト

task-21（09g 新規作成）の最終ドキュメント整備として、Phase 12 strict 7 outputs を生成する。docs-only / spec_created モードで Part 1（中学生レベル）/ Part 2（技術者レベル）の双方を作成し、後続 task-15 / 16 / 17 が 09g を正しく参照できる状態を保証する。

---

## 1. 目的

Phase 11 evidence 完了後、7 必須成果物を生成して Phase 13 user approval gate に必要な docs を全て揃える。

---

## 2. 必須成果物（7 ファイル）

| # | ファイル | 役割 | 必須セクション |
|---|---------|------|--------------|
| 1 | `outputs/phase-12/main.md` | Phase 12 index / strict 7 files manifest | 判定 / 7 ファイル一覧 / same-wave sync 状態 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル） | アナロジー / 型定義相当 / API 相当 / 使用例 / エラー処理相当 / 設定値相当 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1 結果 + Step 2 N/A 理由 | Step 1-A〜G / Step 2 = **N/A** |
| 4 | `outputs/phase-12/documentation-changelog.md` | 変更ファイル一覧 / validator 結果 / current/baseline | 09g 新規作成 diff サマリ |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも summary 残す | SF-03 4 パターン照合結果 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への観察事項 | 改善点 or 「なし」 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 全完了確認 | spec_created 専用項目（計画系 wording 残無し / Step 2 = N/A 妥当） |

---

## 3. implementation-guide.md 要件

### 3.1 Part 1（中学生レベル / アナロジー）

> 「中学生レベル」とは、専門用語なしで概念を伝える。例えば「screen blueprint」は「家を建てる前の設計図」のように比喩する。

必須要素:

- 何のタスクか: 「サイトの管理画面 8 つ分の設計図（どこに何を置くか・押すとどうなるか）を 1 つの紙にまとめる作業」
- なぜ必要か: 「あとで実際に画面を作る人が、文字や色や順番を毎回考えなくて済むため」
- 結果どうなるか: 「8 画面 + 共通サイドバーの設計図がそろい、誰が作っても同じ見た目になる」
- 比喩: 「ファミレスのメニュー表に書き方ルールを 1 冊にまとめておくのと同じ」

### 3.2 Part 2（技術者レベル / docs-only ブランチ）

phase-template-phase12.md `## Part 2 必須5項目チェック対応表` の docs-only 代替判定に従う:

| # | docs-only 代替記述 | 本タスクでの記述 |
|---|-------------------|----------------|
| C12P2-1 | 型定義 = YAML/JSON スキーマ / メタフィールド型 | 09g §X 共通 8 サブセクション構造（X.1 prototype / X.2 copy / X.3 mermaid / X.4 API / X.5 props / X.6 a11y / X.7 操作 / X.8 link） |
| C12P2-2 | API 相当 = SKILL.md セクション参照経路 / 発火条件式 | 各画面 §X.4 で current admin API contract endpoint と一致 |
| C12P2-3 | 使用例 = タスク仕様書テンプレ実例 | task-15 / 16 / 17 が 09g §2..§9 を参照して admin 画面実装する例 |
| C12P2-4 | エラー処理相当 = NO-GO 条件 / 差戻しルール | Phase 06 R-01..R-21 / Phase 07 T-01..T-17 / Phase 09 D-01..D-11 |
| C12P2-5 | 設定値相当 = artifacts.json metadata 必須フィールド | `visualEvidence=NON_VISUAL` / `taskType=docs-only` / `state=spec_created` / `parallelGroup=W2-par` |

---

## 4. system-spec-update-summary.md 要件

### 4.1 Step 1（実コマンド実行結果）

| Step | コマンド | 結果記録先 |
|------|---------|----------|
| 1-A | `test -f docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | manual-smoke-log.md |
| 1-B | `wc -l docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | 行数 700〜1200 |
| 1-C | `grep -cE '^## [0-9]+\. ' specs/09g-...` | 10 |
| 1-D | `grep -c '^```mermaid$' specs/09g-...` | 8+ |
| 1-E | `grep -c '> 派生元: phase-3' specs/09g-...` | 4 |
| 1-F | 視覚値 0 件確認 | 4 種 grep all 0 |
| 1-G | `mise exec -- pnpm lint:md` | error 0 |

### 4.2 Step 2 = N/A 理由

> task-21 の primary deliverable は **09g 本体そのもの**であり、09g が specs/ 配下の正本ファイルとして登録される時点で「正本登録」が完了する。INDEX 系への二重登録は不要。Phase 10 で INDEX が存在する場合のみ link 追加するが、これは Step 2 の重複登録には該当しない。

---

## 5. unassigned-task-detection.md 要件

SF-03 4 パターンで照合:

| パターン | 該当 |
|---------|------|
| 仕様乖離 | なし（source §0..§10 完全準拠） |
| 未着手項目 | なし（10 ステップ全実行） |
| 並列 task 起因 task | task-22（W7 統合）で link 先 anchor 最終確認 |
| 後続 task 派生 | task-15/16/17 が 09g を入力として実装着手 |

---

## 6. skill-feedback-report.md 要件

`task-specification-creator` skill への観察事項:

- 観察 1: docs-only / NON_VISUAL タスクで Phase 12 Step 2 = N/A の判定基準が明確（spec_created モードの恩恵）
- 観察 2: 派生ルール（phase-3 §3 §5.x 準拠）の表現が source §4.5 で表化されており、Phase 03 設計が機械的に分解できた
- 改善点: 並列 task との link 先 spec 不在時の WARN 扱いルールを skill template に取り込めると良い（本 task では Phase 08 §4 で運用化）

---

## 7. phase12-task-spec-compliance-check.md 要件

Task 12-1〜12-6 全完了確認:

| Task | 確認項目 | 結果 |
|------|---------|------|
| 12-1 | 7 必須成果物全て配置 | — |
| 12-2 | implementation-guide Part 1 / Part 2 双方記述 | — |
| 12-3 | system-spec-update-summary Step 1 全コマンド結果記録 | — |
| 12-4 | Step 2 = N/A 妥当性根拠記載 | — |
| 12-5 | 計画系 wording（「予定」「次は」等）が成果物に残っていない | — |
| 12-6 | spec_created モードに整合 | — |

---

## 8. 完了条件（Phase 13 へ進む gate）

- [ ] 7 必須成果物全て `outputs/phase-12/` に配置
- [ ] implementation-guide が Part 1（アナロジー）+ Part 2（5 項目）揃う
- [ ] system-spec-update-summary に Step 1 全結果 + Step 2 N/A 理由
- [ ] documentation-changelog で 09g 新規 1 ファイル diff 確認
- [ ] unassigned-task-detection 4 パターン照合済
- [ ] skill-feedback-report 観察事項記載
- [ ] phase12-task-spec-compliance-check Task 12-1..6 全 PASS

---

## 9. プロトタイプ参照表

本 Phase は完了処理のため prototype 直接参照なし（implementation-guide 内で 09g 本体を参照する）。

---

## 10. リスク / 注意

| リスク | 緩和 |
|-------|------|
| Step 2 = N/A の根拠が薄い | §4.2 で「09g 自体が正本登録」を明示 |
| Part 1 が技術用語混入 | レビュー時に専門用語禁止チェック |
| 7 ファイルのいずれか欠落 | §8 完了条件チェックリストで網羅 |

---

## 11. 次 Phase への引き渡し

Phase 13（PR 作成）は本 Phase の 7 必須成果物 + 09g 本体を変更ファイルセットとし、PR title / body を作成する。

## 実行タスク

- 7 必須成果物を順次生成し配置する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| phase-template-phase12 | skill `task-specification-creator` references/ | Phase 12 strict 7 outputs 仕様 |
| Phase 09 結果 | `outputs/phase-09/acceptance-test.md` | DoD 結果引用元 |
| 09g 本体 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | implementation-guide 参照対象 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 7 ファイル | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | strict 7 outputs |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-12.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] 7 ファイル全配置 / Task 12-1..6 全 PASS。

## 目的

- task-21 完了処理を skill 準拠で完了し、Phase 13 PR 作成の前提を整える。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。Phase 07 grep / Phase 08 link / Phase 09 DoD / Phase 11 walkthrough を統合証跡として implementation-guide で参照する。
