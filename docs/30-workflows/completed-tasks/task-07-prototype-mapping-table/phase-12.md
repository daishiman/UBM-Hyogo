# Phase 12: ドキュメント完了処理 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 12 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

task-specification-creator の Phase 12 規定に従い、6 必須タスクを完遂する。aiworkflow-requirements skill の `references/` に `09a-prototype-map.md` を新規 reference として登録し、quick-reference / resource-map / task-workflow-active / changelog へ同一 wave で同期する。

## 必須 6 タスク

| # | タスク | 出力 |
|---|--------|------|
| 1 | 実装ガイド（中学生レベル概念説明含む） | `outputs/phase-12/implementation-guide.md` |
| 2 | システム仕様書更新サマリ | `outputs/phase-12/system-spec-update-summary.md` |
| 3 | 更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 4 | 未割当タスク検出 | `outputs/phase-12/unassigned-task-detection.md` |
| 5 | skill フィードバック | `outputs/phase-12/skill-feedback-report.md` |
| 6 | task spec コンプライアンスチェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 1. 実装ガイド

`09a-prototype-map.md` が「prototype 行範囲を実装時に逆引きするための 1 ファイル目次」であることを中学生レベルで説明。具体例: 「task-12 の人が公開 members 画面を作るときは §3 の `/(public)/members` 行を見て `pages-public.jsx L208-L338` を読む」。

## 2. システム仕様書更新サマリ

- `docs/00-getting-started-manual/specs/09a-prototype-map.md` 新規追加 (360+ 行)
- `docs/00-getting-started-manual/specs/09-ui-ux.md` から 09a への link 追加（task-06 が担当）
- aiworkflow-requirements `references/ui-ux-prototype-map.md` に `09a-prototype-map.md` reference を新規登録
- `indexes/quick-reference.md` / `indexes/resource-map.md` / `indexes/topic-map.md` / `indexes/keywords.json` / `references/task-workflow-active.md` / `LOGS/_legacy.md` / `changelog/20260507-ui-prototype-scope-gate.md` に prototype-mapping トピックを追加

## 3. 更新履歴

`documentation-changelog.md` に以下を記録:

- 2026-05-07: task-07 prototype-mapping-table 仕様書 13 phase 作成
- 2026-05-07: 09a-prototype-map.md 新規作成 (360+ 行)
- 2026-05-07: scripts/verify-09a-prototype-line-ranges.sh 新規作成

## 4. 未割当タスク検出

検出観点:

- 09c..09h（primitives / icons / screen-blueprints-public/member/admin / shell-and-fixtures）の本体作成は task-19..22 に既に割当済み
- prototype 凍結ポリシー違反監視（lint）は未割当化しない。上位不変条件と local verifier 強化で今回 scope は閉じる
- `09a-prototype-map.md` 行範囲ドリフト検出の CI 化は未割当化しない。今回 task は local verifier 作成・強化までを完了条件とし、CI 化は後続実装 task の実測需要が出た時点で再判断する

## 5. skill フィードバック

aiworkflow-requirements skill に対して:

- `09a-prototype-map.md` を新 reference として登録済み
- prototype 凍結正本 / 行範囲規約のキーワード（`L<start>-L<end>` / 派生ルール / 不採用）を `indexes/keywords.json` 再生成で同期する

## 6. task spec コンプライアンスチェック

- [ ] taskType: docs-only / visualEvidence: NON_VISUAL の整合
- [ ] 全 phase に [実装区分: ドキュメントのみ] 注記が含まれる
- [ ] DoD 11 項目が task-07 §8 と一字一致
- [ ] §3 routes 19 exactly / §6 25+ / 派生ルール 8 / 不採用 4+ の閾値が phase 横断で一貫
- [ ] artifacts.json と outputs ディレクトリの parity

## 参照資料

- task-specification-creator skill 仕様
- aiworkflow-requirements skill `references/` 構造

## 依存 Phase 成果物参照

- Phase 11 受け入れ accepted ログ

## 多角的チェック観点

- 6 タスクすべてが outputs/phase-12/ 配下に成果物として実体存在
- aiworkflow-requirements の indexes 再生成 (`pnpm indexes:rebuild`) が必要なら明記
- system-spec-update-summary が 09-ui-ux.md / 09b-design-tokens.md との責務境界を逆侵食しないこと

## サブタスク管理

- [ ] implementation-guide.md 執筆
- [ ] system-spec-update-summary.md 執筆
- [ ] documentation-changelog.md 執筆
- [ ] unassigned-task-detection.md 執筆
- [ ] skill-feedback-report.md 執筆
- [ ] phase12-task-spec-compliance-check.md 執筆
- [ ] outputs/phase-12/main.md に 6 タスク完了サマリ

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 完了条件

- [ ] 6 必須タスクすべての成果物が存在
- [ ] aiworkflow-requirements に reference 登録と index 同期が記録
- [ ] artifacts.json と outputs/ の parity が確認

## 次 Phase への引き渡し

Phase 13 へ、ドキュメント完了処理済みの全成果物を PR 作成入力として渡す。
