# Phase 4: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | completed |

## 目的

Phase 2 設計を、単一責務で実装可能なタスク単位に分解する。

## タスク一覧

| ID | タスク | 対象ファイル | 推定行数 | 依存 |
| --- | --- | --- | --- | --- |
| T1 | `MeAttendancePageResponse` / 関連型を追加 | `apps/web/src/lib/api/me-types.ts` | ~15 | なし |
| T2 | `AttendanceList` Client Component を新規作成 | `apps/web/app/profile/_components/AttendanceList.tsx` | ~120 | T1 |
| T3 | `profile/page.tsx` に props 受け渡しを追加 | `apps/web/app/profile/page.tsx` | ~10 | T2 |
| T4 | unit test を新規作成 | `apps/web/app/profile/_components/AttendanceList.spec.tsx` | ~150 | T2 |
| T5 | profile smoke test の確認・必要なら更新 | `apps/web/app/profile/page.spec.tsx`（既存） | ~5 | T3 |

## クリティカルパス

```
T1 ──> T2 ──> T3 ──> T5
            └─> T4
```

T4 は T2 完了後に T3 と並列実行可能。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | タスク分解結果 |

## 完了条件

- [x] 5 タスクが SRP で分解
- [x] 依存関係とクリティカルパスが図示

## 次 Phase

- 次: 5 (実装計画)
- 引き継ぎ事項: T1→T2→{T3,T4}→T5 の順序で実行。
