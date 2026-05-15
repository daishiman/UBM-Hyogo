# Phase 4: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | completed |

## 目的

Phase 3 GO 判定に基づき、実装単位を 5 サブタスクに分解し critical path を明示する。

## 4-1. サブタスク一覧

| # | サブタスク | 対象ファイル | 種別 | 行数見積 | 依存 |
| --- | --- | --- | --- | --- | --- |
| ST-1 | VisibilityRequestDialog onSubmit に router.refresh 追加 | apps/web/app/profile/_components/VisibilityRequestDialog.tsx | 修正 | +4 行 / -0 行 | なし |
| ST-2 | DeleteRequestDialog onSubmit に router.refresh 追加 | apps/web/app/profile/_components/DeleteRequestDialog.tsx | 修正 | +4 行 / -0 行 | なし（ST-1 と並列可） |
| ST-3 | VisibilityRequestDialog spec に router.refresh 検証ケース追加 | apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx | 追加 | +30 行 | ST-1 |
| ST-4 | DeleteRequestDialog spec に router.refresh 検証ケース追加 | apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx | 追加 | +30 行 | ST-2 |
| ST-5 | 既存テスト non-regression 確認 | RequestActionPanel.component.spec.tsx + 上記 2 spec | 確認 | 0 行 | ST-3 / ST-4 |

## 4-2. Critical path

```
ST-1 (Visibility dialog 修正) ─┐
                              ├─→ ST-3 (Visibility spec 追加) ─┐
ST-2 (Delete dialog 修正) ─────┤                              ├─→ ST-5 (non-regression)
                              └─→ ST-4 (Delete spec 追加) ────┘
```

- ST-1 / ST-2 は完全並列実行可能
- ST-3 / ST-4 は対応する dialog 修正後に着手
- ST-5 は ST-3 / ST-4 完了後の最終確認

## 4-3. サブタスクごとの DoD

| # | DoD |
| --- | --- |
| ST-1 | `useRouter` import 追加 / `const router = useRouter()` 宣言 / success branch line 77-79 に `router.refresh()` を先頭追加 |
| ST-2 | `useRouter` import 追加 / `const router = useRouter()` 宣言 / success branch line 68-70 に `router.refresh()` を先頭追加 |
| ST-3 | `useRouter` mock 追加 / `router.refresh` spy セットアップ / 「TC-U-08x: 202 → router.refresh が 1 回呼ばれる」テスト追加 / vitest run で新ケース green |
| ST-4 | 同様のテスト追加 / vitest run で新ケース green |
| ST-5 | 既存 6 ケース（VisibilityRequestDialog） + Delete 既存ケース + RequestActionPanel ケースが green |

## 4-4. リスクと並列化方針

| リスク | 緩和策 |
| --- | --- |
| ST-1 / ST-2 の同時編集で merge conflict | ファイルが別なので発生しない |
| ST-3 / ST-4 で `useRouter` mock のグローバル汚染 | 各 spec で `vi.mock("next/navigation")` を file-scope に閉じる |
| ST-5 で既存テストが flaky だった場合 | Phase 7 テスト計画で対象テストの安定性を再評価 |

## 実行タスク

- [ ] 5 サブタスクを明示する
- [ ] critical path を ASCII 図化する
- [ ] サブタスクごとの DoD を記録する
- [ ] `outputs/phase-04/task-breakdown.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | 5 サブタスク + critical path + DoD |

## 完了条件

- [ ] 5 サブタスクが文書化されている
- [ ] critical path が図示されている
- [ ] サブタスクごとの DoD が記録されている

## 次 Phase

- 次: 5 (実装計画)
- 引き継ぎ事項: 5 サブタスクの順序と並列化方針
