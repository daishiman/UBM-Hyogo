# Skill フィードバック — Issue #325

## テンプレート改善

- rename-only workflow では、Phase 11 の実測 evidence と `spec_created` 時点の evidence manifest が混同されやすい。実コード差分が入った同一サイクルでは root `artifacts.json` / Phase 12 / aiworkflow を `implementation_completed` へ再分類する運用をテンプレート化するとよい。

## ワークフロー改善

- follow-up 昇格時は、親 unassigned task を `consumed_by_<successor>` として親 artifact inventory に同一 wave で追記する。今回は `UT-08A-06` を Issue #325 successor として登録した。
- `apps/web` / `packages` のような親 issue 責務外の任意拡張は、未タスク検出に自動追加しない。CONST_005 の「検出改善は今回完了」を守るため、scope-out 棚卸しと未タスク 0 件を分離する。

## ドキュメント改善

- ADR が実装完了前に `Accepted` になる場合は、物理状態との矛盾を避けるため「本ADRは実装PRの目標状態であり、現行 tree では未適用」と明記するのがよい。今回の Issue #325 は実 rename まで完了したため、ADR / Phase 12 / aiworkflow を実装完了境界へ更新した。
