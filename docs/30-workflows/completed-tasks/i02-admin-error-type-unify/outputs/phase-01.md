# Phase 1: 要件・前提整理

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 目的 | 既存実装の error class topology を実測し、統合後の acceptance criteria を固定する |
| 入力 | `parallel-i02` spec.md, `apps/web/src/lib/fetch/authed.ts`, `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| 出力 | acceptance criteria（AC-1..AC-7）, spec-extraction-map |

## 目的

`useAdminMutation` 独自の `AdminMutationHttpError` と `@/lib/fetch/authed` 系
（`AuthRequiredError` / `FetchAuthedError`）の **2 系統 error class** が並立している現状を
1 系統に統合するための要件を確定する。p-10 が catch 対象としている class は後者であり、
本 Phase はその interop ギャップを acceptance criteria として明文化する。

## 実行タスク

1. spec.md の「変更対象ファイル」表と「設計」セクションの差分仕様を抽出
2. `apps/web/src/lib/fetch/authed.ts` を Read し `AuthRequiredError` / `FetchAuthedError` の現行 signature を確認
3. `apps/web/src/features/admin/hooks/useAdminMutation.ts` の throw / instanceof 箇所（spec 内引用: L58, L106-110, L144, L148）の現行コードを Read で確認
4. `rg "AdminMutationHttpError" apps/web` で外部 import が無いことを再確認
5. acceptance criteria AC-1..AC-7 を確定

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md`
- `apps/web/src/lib/fetch/authed.ts`（現行 class 正本）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（変更前 baseline）
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
- `apps/web/src/features/admin/hooks/index.ts`

## 実行手順

1. Read で 4 ファイル（authed.ts / useAdminMutation.ts / spec / index）の現行行番号を確定
2. `rg "AdminMutationHttpError" apps/web/src -n` を実行し caller を全件列挙
3. spec.md L102-106 の挙動マトリクスを AC-3..AC-5 として写経
4. acceptance criteria を本 Phase 末尾に番号付きで固定

## 統合テスト連携

本 Phase は仕様確定のみで実装変更を含まない。統合テストとの連携は Phase 5 以降で
`pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation` をローカル focused test として実行する。

## 多角的チェック観点

- 型の互換: `AdminMutationResult.error: Error | null` は外形不変か（AC-1）
- redirect interop: p-10 redirect logic が catch する class と一致するか（AC-3）
- 破壊回避: 外部 import 件数が spec 想定（hook + spec の 2 箇所）と乖離しないか（AC-7）

## サブタスク管理

| ID | 内容 | 状態 |
| --- | --- | --- |
| 1-1 | spec.md 全文確認 | done |
| 1-2 | authed.ts 現行 signature 抽出 | pending（Phase 4 で実施） |
| 1-3 | rg で外部 import 再確認 | pending（Phase 4 で実施） |
| 1-4 | AC-1..AC-7 固定 | done |

## 成果物

### Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | `useAdminMutation` の戻り値型 `AdminMutationResult` の public surface（`error: Error \| null` 含む）が変更されない |
| AC-2 | `useAdminMutation.ts` 内で `AdminMutationHttpError` の class 定義 / export / 参照がゼロ件である |
| AC-3 | HTTP status 401 の応答に対し `throw new AuthRequiredError()` が発火する（p-10 redirect logic と interop 可能） |
| AC-4 | HTTP status が 401 以外の非 2xx の応答に対し `throw new FetchAuthedError(status, text)` が発火する |
| AC-5 | hook 内 catch 分岐が `e instanceof AuthRequiredError`（401 系）および `e instanceof FetchAuthedError && e.status === 403`（403 系）に切替済 |
| AC-6 | `useAdminMutation.spec.ts` の assertion が新 class（`AuthRequiredError` / `FetchAuthedError`）で PASS |
| AC-7 | `apps/web/src/features/admin/hooks/index.ts` から `AdminMutationHttpError` の export が削除されている（または `@deprecated` alias re-export のみ） |

### spec-extraction-map

| 出典（spec.md） | 抽出先（本 Phase） |
| --- | --- |
| L21-25「含む」3 項目 | Scope.含む（index.md） |
| L26-29「含まない」3 項目 | Scope.含まない（index.md） |
| L33-37 変更対象ファイル表 | Phase 3 変更対象ファイルマップ |
| L40-77 設計 1/2 | AC-2..AC-5 |
| L80-89 破壊回避 | AC-7 |
| L100-106 入出力マトリクス | AC-3..AC-5 + Phase 3 挙動表 |
| L110-130 テスト方針 | AC-6 + Phase 2 依存設計 |
| L143-149 DoD | index.md DoD |

## 完了条件

- AC-1..AC-7 が確定し本 Phase 文書に記載されている
- spec-extraction-map が spec.md 全 DoD 項目をカバーしている

## タスク100%実行確認【必須】

- [x] spec.md を全文 Read 済
- [x] AC-1..AC-7 を番号付き定義
- [x] spec-extraction-map 完成
- [x] Phase 2 への引き継ぎ事項を明確化（依存設計と CI gate）

## 次Phase

Phase 2: 依存・順序設計。p-08 / p-10 との実行順関係と、ファイル間依存（throw 側 / catch 側 / 型 export 側）の整理を行う。
