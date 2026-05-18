# Skill feedback report

| 観点 | 記録 |
|------|------|
| テンプレート改善 | issue が CLOSED でも未実装の場合、台帳同期が機能していない → `completed` 判定の auto-check を CI に入れる候補 |
| ワークフロー改善 | parent spec が in-place fix で完結予定だったが台帳に登録されないまま CLOSED → spec_created → completed の状態遷移を必須記録するルール候補 |
| ドキュメント改善 | issue 本文と実装の同期チェック手順を `references/` に追加候補 |
| 仕様書 token 名 | phase-2.md の CSS が tokens.css の実 prefix（`--ubm-*`）と乖離していた。spec_creator に「CSS 変数は実 tokens.css から grep して prefix を確認するステップ」追加候補 |

## 今回サイクルでの扱い

既存 `task-specification-creator` には closed issue canonical workflow recovery / Phase 12 dirty implementation gate / docs-only-to-code 再判定が既に含まれるため、スキル本体の即時変更は不要と判断した。今回検出した運用漏れは、親 spec・未タスク・artifact parity・Phase 11 screenshot を同一 wave で実ファイル更新して解消済み。
