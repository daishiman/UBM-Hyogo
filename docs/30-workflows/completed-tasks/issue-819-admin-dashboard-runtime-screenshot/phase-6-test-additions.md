# Phase 6: テスト追加

## 6.1 結論: 新規テスト追加なし

本タスクはコードに恒久的変更を加えないため、新規 unit / integration / e2e テスト追加は **不要**。

## 6.2 理由（CONST_007 例外なし）

- `StatusDistribution.tsx` のロジックは不変（不変条件 5）。component の振る舞いは既存 `StatusDistribution.spec.tsx` で網羅済み
- caller (admin page) も最終的に revert されるため、新規 spec を追加すると未参照コードのテストになる
- Phase 11 で取得する PNG 自体は人間が AC-1〜AC-3 で目視検査するため、自動テスト対象外
- visual regression baseline 化 (Playwright snapshot 比較等) は task-18 / task-22 スコープであり本タスク範囲外

## 6.3 既存テストの非劣化確認

Phase 5 §5.7 で実行する vitest が pre-existing 結果と同一であることを確認する:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/components/_dashboard/StatusDistribution.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/admin/dashboard-ui.spec.ts
```

## 6.4 ドキュメント test (記述整合性)

人手レビューで以下を確認:

- 親 workflow `outputs/phase-11/main.md` の screenshot 行が確実に `runtime_completed` に変わっている
- `outputs/phase-12/unassigned-task-detection.md` の追記が表構造を壊していない
- unassigned-task spec の status 更新がメタ情報テーブルを壊していない
## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

新規テスト追加の要否を判断し、既存 focused test で足りる範囲を明示する。

## 実行タスク

- `StatusDistribution.spec.tsx` の coverage を確認する。
- 新規テスト追加が過剰設計にならないか判断する。

## 参照資料

- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx`
- `phase-4-test-plan.md`

## 成果物

- テスト追加判断
- focused test 実行方針

## 完了条件

新規テスト追加なしでも AC-1〜AC-8 を検証できることが説明されている。

- [ ] 新規テスト追加なしでも AC-1〜AC-8 を検証できる根拠が記録されている

## 統合テスト連携

Phase 11 で focused component test を実行する。
