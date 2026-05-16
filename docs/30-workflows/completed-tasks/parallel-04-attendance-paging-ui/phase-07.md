# Phase 7: テスト計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | completed |

## 目的

実装に対する自動テストの責務分割・カバレッジ・実行コマンドを決定する。

## テスト責務マトリクス

| レイヤ | ファイル | 責務 |
| --- | --- | --- |
| Unit | `AttendanceList.spec.tsx` | state 遷移・fetch mock・error UI・empty UI |
| Smoke | `profile/page.spec.tsx`（既存） | profile page で AttendanceList が render |
| Contract | `apps/api/src/routes/me/index.contract.spec.ts`（既存） | API 側 cursor encode/decode |
| E2E | playwright-smoke（既存 task-18） | profile ページ訪問時の visual regression |

## Unit ケース詳細

| # | ケース | 期待 |
| --- | --- | --- |
| U1 | 初期 props (default 50件, hasMore=true, nextCursor="abc") | 50件 render / button 表示 |
| U2 | button click | fetch が `/api/me/attendance?cursor=abc` で呼ばれる |
| U3 | fetch 200 + records×10 | items=30、cursor 更新 |
| U4 | fetch 200 + nextCursor=null | button が DOM から消える |
| U5 | fetch 500 | role="alert" message 表示、button 再 enable |
| U6 | fetch 中 | button disabled / text="読み込み中…" |
| U7 | items=[] | empty message |
| U8 | cursor に特殊文字 `?&=` | `encodeURIComponent` が適用 |

## 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList
mise exec -- pnpm --filter @ubm-hyogo/web test -- profile
```

## テスト常時実行可能性 DoD（quality-gates.md §7）

| # | 必須項目 | 本タスクでの固定 |
| --- | --- | --- |
| 1 | 対象 spec ファイル列挙 | `apps/web/app/profile/_components/AttendanceList.spec.tsx` |
| 2 | 1 行実行コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList` |
| 3 | 実行前提と自動化 path | `vitest.config.ts` の `apps/**/app/**/*.spec.{ts,tsx}` include / `apps/web/package.json#scripts.test` |
| 4 | un-skip 不変条件 | `AttendanceList.spec.tsx` に `it.skip` / `test.skip` / `it.todo` / `test.todo` を置かない |
| 5 | browser binary 自動 install | Unit test のため対象外。E2E は task-18 系 Playwright workflow に委譲 |
| 6 | dev server 自動起動 | Unit test のため不要。Server Component visual smoke は task-18 系で扱う |
| 7 | CI gate 化 | `pnpm -r test` / apps web test suite の対象。PR CI 実行は Phase 13 後 |
| 8 | E2E lines coverage >= 80% | 本タスクは focused unit UI test。E2E coverage は task-18 visual/regression suite の責務 |

## カバレッジ目標

- branch coverage ≥ 90%（state 遷移を全て網羅）
- line coverage ≥ 95%

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/test-plan.md | テスト計画 |

## 完了条件

- [x] テスト責務マトリクスが確定
- [x] Unit ケース U1-U8 が定義
- [x] 実行コマンドとカバレッジ目標が確定

## 次 Phase

- 次: 8 (ドキュメント更新)
