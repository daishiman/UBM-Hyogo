# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | completed |

## 目的

Phase 4 の T1-T5 を実装する順序・ブランチ運用・コミット粒度を決定する。

## ブランチ

- 既定ブランチ: `dev`
- 作業ブランチ: `feat/attendance-paging-ui`（または同等の `feat/*`）

## 実装順序

1. **T1**: 型定義追加（破壊的変更なし）
2. **T2**: AttendanceList 新規作成（T1 で追加した型を import）
3. **T3**: profile/page.tsx 編集（T2 を import）
4. **T4**: spec を T2 と並列で書く（actual と一緒に commit）
5. **T5**: smoke test を読んで必要に応じて assertion 追加

## コミット粒度

| 順 | コミット | 含むタスク |
| --- | --- | --- |
| 1 | `feat(profile): add MeAttendancePageResponse types` | T1 |
| 2 | `feat(profile): add AttendanceList paging client component` | T2 + T4 |
| 3 | `feat(profile): wire AttendanceList into profile page` | T3 + T5 |

## ローカル検証順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList
mise exec -- pnpm --filter @ubm-hyogo/web test -- profile
```

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | 実装計画 |

## 完了条件

- [x] ブランチ運用・実装順序・コミット粒度・検証順が確定

## 次 Phase

- 次: 6 (実装手順)
