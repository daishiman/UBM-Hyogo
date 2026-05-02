# Phase 8: DRY 化 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 8 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

09a evidence contract を変更せずに、本タスクの runbook / artifacts.json / blocker 更新
手順が 09c production deploy や将来の同型 staging smoke タスクで再利用できる形に
整理されているか確認する。

## 実行タスク

1. runbook ステップで 09a `phase-11.md` と重複している記述は参照に置換する。
2. artifacts.json 更新差分テンプレを 09a 側の記述形式と完全一致させる。
3. redaction / cf.sh wrapper の手順は scripts 側に集約済みか確認する（個別記述しない）。
4. 09c production deploy 用ランブックで同型に流用できる構造になっているか確認する。

## 参照資料

- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md
- docs/30-workflows/ut-09a-exec-staging-smoke-001/phase-05.md
- scripts/cf.sh

## 統合テスト連携

- 08b / U-04 の既存実装契約を再記述せず参照する
- Phase 11 evidence bundle と 09c blocker 更新の重複を避ける

## DRY 観点

| 重複候補 | 対処 |
| --- | --- |
| Playwright 起動手順 | 08b runbook を参照、ここでは差分のみ書く |
| sync endpoint 仕様 | apps/api 実体と U-04 を参照、ここで再記述しない |
| cf.sh / op 経由 | scripts/cf.sh / scripts/with-env.sh を参照 |
| 09a evidence path | 09a `implementation-guide.md` を参照、ここでは一覧化のみ |
| artifacts parity 検証 | task-specification-creator scripts を参照 |

## 多角的チェック観点

- DRY 化により仕様の正本が 09a / scripts / 08b に保たれていること
- 本タスク独自要素（実 staging 実行 evidence の置換）だけが固有の記述になっていること

## サブタスク管理

- [ ] 重複箇所を参照に置換
- [ ] artifacts.json テンプレを 09a 形式に揃える
- [ ] 流用可能な構造であることを確認
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- 重複が参照化されており、本タスク固有要素が明確に分離されている
- 09c production smoke で流用可能な構造である

## タスク100%実行確認

- [ ] 同一仕様を 2 箇所以上に書いていない
- [ ] 09a 正本を改変する記述が含まれていない

## 次 Phase への引き渡し

Phase 9 へ、参照化済の runbook と固有要素一覧を渡す。
