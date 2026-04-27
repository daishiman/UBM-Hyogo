# Skill フィードバックレポート（Phase 12 Task 12-5 成果物）

## skill 別フィードバック

| skill | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | NON_VISUAL タスクの Phase 11 運用が UBM-002/003 / Feedback BEFORE-QUIT-001 に沿って明文化できた。phase-11.md テンプレートに「(a) 自動 smoke 結果 + (b) 既知制限リスト + screenshot-plan.json (mode=NON_VISUAL)」の 3 点セットが正式採用されており、本タスクで実用性を確認 | NON_VISUAL タスクの自動 smoke が「設計レベル代替（vitest 未導入時）」になるケースを公式パターンとして追加し、`manual-smoke-log.md` に CONDITIONAL PASS の判定ルールを明記すると、テストインフラ未整備のフェーズ移行時にブレが減る |
| aiworkflow-requirements | エラーハンドリング正本（`error-handling.md`）が未整備だった。本タスクで `apps/api/docs/error-handling.md` を新規作成し、雛形を `outputs/phase-12/implementation-guide.md` Part 2 に集約済み | 本タスクで `references/error-handling.md` へ UT-10 入口を追加し、`references/interfaces-shared.md`・`references/interfaces-api.md` を新規追加済み。今後は API エラー標準を変更した wave で topic-map 再生成まで同時に実施する |
| github-issue-manager | Issue #12 と Phase 13 PR の双方向リンクが 1 経路（PR 本文 → Issue 番号参照）で十分。本タスクでは追加運用なし | 改善点なし（現行運用維持） |
| int-test-skill | `withRetry` / `runWithCompensation` の契約テスト方針を Phase 4 / Phase 6 で策定（27 ケース + 異常系 7 ケース + 回帰 6 ケース + security 5 ケース）。vitest 未導入のため設計レベル止まり | Mock プロバイダーで「リトライ枯渇」「補償処理発火」「sanitize の REDACT」「toClientJSON ホワイトリスト」の不変条件を網羅するテンプレを int-test-skill 側に追加検討。vitest 導入後に Phase 4/6 設計を実装に変換するためのテンプレ整備が望まれる |

## 共通フィードバック

- vitest 未導入の状況下で Phase 4/6/9 を遂行する際、「設計仕様 + 型レベル契約 + 机上検証」の三層代替アプローチが機能した。これを将来同様の状況で再利用可能なパターンとして skill リファレンスに追加すると、後続タスクで判断コストが下がる
- subpath export（`@ubm-hyogo/shared/errors` 等）と root barrel re-export の併用が本タスクで初導入された。Phase 8 で consumer side の subpath 統一を実施したが、root barrel は legacy 互換のため残置とした。この判断ルール（「livre import がゼロでも legacy 互換のため残置」）を skill ドキュメントに追記すると、今後の同様パターンで判断ブレを防げる

## 改善点なしの skill 行扱い

`github-issue-manager` のみ改善点なし。空ファイルにはせず「改善点なし（現行運用維持）」と明示。

## まとめ

| 区分 | 件数 |
| --- | --- |
| 改善提案あり | 3 件（task-specification-creator, aiworkflow-requirements, int-test-skill）|
| 改善点なし | 1 件（github-issue-manager）|
| 共通フィードバック | 2 件 |

## 完了条件

- [x] 関連 4 skill すべてに行を割り当て
- [x] 改善点なしの skill も明示記載（空ファイル回避）
- [x] 改善提案がある場合、具体的な反映方法を記述
