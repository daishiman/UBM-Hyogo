# Phase 12: ドキュメント更新 — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 12 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装済み coverage hardening タスクとして Phase 12 strict 7 files を実体化し、Phase 11 の実測 coverage evidence と正本仕様を同期する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/00-overview.md
- docs/00-getting-started-manual/claude-design-prototype/

## CONST_005 必須項目

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | outputs/phase-12/{implementation-guide,documentation-changelog,phase12-task-spec-compliance-check,system-spec-update-summary,unassigned-task-detection,skill-feedback-report}.md, outputs/phase-12/main.md |
| シグネチャ | Markdown ヘッダ階層 H1→H2→H3、表形式で metric を記載 |
| 入出力 | 入力: phase-09/10/11 の結果。出力: 6 種 markdown |
| テスト | N/A |
| コマンド | `ls docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-12/` |
| DoD | 6 ファイルが placeholder ではなく実値で埋まっている |

## 標準 6 サブ成果物の作成手順とテンプレ

### 1. implementation-guide.md

- Part 1（中学生レベル）と Part 2（技術者レベル）の 2 部構成。
- Part 2 に「対象ファイル一覧」「テストケース表（component × happy/empty/variant）」「使用 mock 一覧」「実行コマンド」「実測前 coverage delta 予約欄」を記載。

### 2. documentation-changelog.md

- 以下の表形式で記録:
  | 日付 | 変更ファイル | 変更内容 | 影響範囲 |
- 追加した test ファイル群、threshold 関連の vitest config 変更、本仕様書の Phase 9-13 更新を列挙。

### 3. phase12-task-spec-compliance-check.md

- AC 4 項目 / 不変条件 #2 #5 #6 / CONST_005 6 項目を checklist として列挙し、実装・実測済み項目は Phase 11 evidence と紐付けて PASS と記録。

### 4. system-spec-update-summary.md

- 仕様変更の有無を明記。component 仕様自体は変更しないため「コード仕様変更なし。テスト仕様のみ追加」を記載し、既存 spec ドキュメントへの加筆有無を表で示す。

### 5. unassigned-task-detection.md

- 検出方法（差分 grep / coverage gap / TODO コメント）を明記し、検出件数を表で示す。0 件の場合は「scope 内 unassigned 0 件」と明記。

### 6. skill-feedback-report.md

- 利用した skill（task-specification-creator / int-test-skill 等）と、運用で改善したい点・うまく機能した点を bullet で記載。

## 実行手順

- Phase 11 evidence を読み込み、6 ファイルを上記テンプレに従って実値で更新する。
- 各 file の冒頭に H1 タイトルとメタ表（task name / phase / 作成日）を残す。
- main.md は 6 ファイルへの index と要約を記載する。

## 統合テスト連携

- 上流: phase-11 evidence
- 下流: phase-13 PR 作成準備

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない
- Phase 11 の実測 evidence を Phase 12 / Phase 13 / 正本索引へ反映する

## サブタスク管理

- [ ] implementation-guide.md を実値で更新
- [ ] documentation-changelog.md に変更履歴を追記
- [ ] phase12-task-spec-compliance-check.md を全項目埋める
- [ ] system-spec-update-summary.md を更新
- [ ] unassigned-task-detection.md に検出結果を記載
- [ ] skill-feedback-report.md を埋める
- [ ] outputs/phase-12/main.md を更新

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md

## 完了条件

- 6 標準ファイルが placeholder を脱し実値で埋まっている
- main.md が 6 ファイルを索引している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ user approval gate と measured coverage evidence を渡す。
