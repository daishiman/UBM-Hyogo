# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | completed |

## 目的

Phase 4 で分解した 5 サブタスクをファイル別に diff 単位で計画し、コード変更の最終形を確定する。

## 5-1. ファイル別 diff 方針

### VisibilityRequestDialog.tsx (ST-1)

| 変更箇所 | 行 | 変更内容 |
| --- | --- | --- |
| import | 6-12 周辺 | `import { useRouter } from "next/navigation";` を追加 |
| 関数冒頭 | 38 周辺（`const titleId = useId();` の直後） | `const router = useRouter();` を追加 |
| onSubmit success branch | 77 周辺 | `router.refresh();` を `onSubmitted(res.accepted);` の直前に追加 |

差分量: +3 行（import 1 / 宣言 1 / refresh 呼び出し 1）

### DeleteRequestDialog.tsx (ST-2)

| 変更箇所 | 行 | 変更内容 |
| --- | --- | --- |
| import | 6-12 周辺 | `import { useRouter } from "next/navigation";` を追加 |
| 関数冒頭 | 35 周辺（`const titleId = useId();` の直後） | `const router = useRouter();` を追加 |
| onSubmit success branch | 68 周辺 | `router.refresh();` を `onSubmitted(res.accepted);` の直前に追加 |

差分量: +3 行

### VisibilityRequestDialog.component.spec.tsx (ST-3)

| 変更箇所 | 行 | 変更内容 |
| --- | --- | --- |
| import | 先頭 | `vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));` を file-scope に追加 |
| import | 先頭 | `import { useRouter } from "next/navigation";` を追加 |
| 新規 it ブロック | describe 末尾 | 「202 → router.refresh が 1 回呼ばれる」テスト追加 |

差分量: +約 30 行

### DeleteRequestDialog.component.spec.tsx (ST-4)

VisibilityRequestDialog.component.spec.tsx と同パターン。差分量 +約 30 行。

## 5-2. 実装方針

| 項目 | 方針 |
| --- | --- |
| useRouter import 元 | `next/navigation`（既存 RequestActionPanel.tsx:8 と同一） |
| router 宣言位置 | 関数冒頭の `useId` 群の直後（既存変数宣言と同じスコープ） |
| refresh 呼び出し位置 | success branch (`if (res.ok) {}`) の先頭 |
| failure path | 変更なし。`else` / `catch` には refresh を追加しない |
| 既存 `RequestActionPanel.tsx` の `router.refresh()` | Phase 10 で削除し、accepted response bridge state に再構成 |
| useRouter mock 戦略 | spec ファイル file-scope で `vi.mock("next/navigation", ...)` を一度宣言。各テストで `vi.mocked(useRouter).mockReturnValue({ refresh: vi.fn() })` |

## 5-3. ローカル検証順序

| # | コマンド | 期待 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm typecheck` | 実行後に completed/runtime_pending を記録 |
| 2 | `mise exec -- pnpm lint` | 実行後に completed/runtime_pending を記録 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- VisibilityRequestDialog` | 新ケース含め green |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- DeleteRequestDialog` | 新ケース含め green |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- RequestActionPanel` | non-regression green |
| 6 | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile`（Phase 11 で実施） | Playwright screenshot 取得 |

## 5-4. 想定変更行数（合計）

| ファイル | 追加 | 削除 |
| --- | --- | --- |
| VisibilityRequestDialog.tsx | 3 | 0 |
| DeleteRequestDialog.tsx | 3 | 0 |
| VisibilityRequestDialog.component.spec.tsx | 30 | 0 |
| DeleteRequestDialog.component.spec.tsx | 30 | 0 |
| **合計** | **66** | **0** |

## 実行タスク

- [ ] 4 ファイル分の diff 方針を表化する
- [ ] 実装方針 6 項目を明記する
- [ ] ローカル検証順序を 6 ステップで記録する
- [ ] `outputs/phase-05/implementation-plan.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | ファイル別 diff 方針 + 検証順序 |

## 完了条件

- [ ] 4 ファイル分の変更箇所と行が表化されている
- [ ] 検証順序が記録されている

## 次 Phase

- 次: 6 (実装手順)
- 引き継ぎ事項: diff 方針 / 検証コマンド 6 ステップ
