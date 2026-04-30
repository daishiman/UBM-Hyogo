# UT-08A-05: packages/shared 側 type test (`@ts-expect-error`) 整備

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-08A-05 |
| タスク名 | packages/shared 側 type test (`@ts-expect-error`) 整備 |
| 分類 | implementation / NON_VISUAL |
| 対象機能 | `packages/shared` (view-model schema / brand 型) |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | 08a Phase 11 §4 シナリオ 3 / Phase 12 unassigned-task-detection §5 |
| 発見日 | 2026-04-30 |
| 検出元ファイル | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` |
| 推奨割当 | 別 PR（packages/shared 担当 task） |

## 概要

`packages/shared` 配下の view-model schema / brand 型に対して、誤った型代入が compile-time に弾かれることを `@ts-expect-error` 観測テストで明示し、消費側 (`apps/api` / `apps/web`) からの利用契約を回帰テストとして固定する。

## 概要（補足）

08a の brand 型テスト (`apps/api/src/__tests__/brand-type.test.ts`) は **runtime コンストラクタの健全性**のみを検証し、誤用 (`asResponseId(emailString)` のような取り違え) が型エラーとして検出されることは確認していない。`@ts-expect-error` を使った compile-time 観測テストは `packages/shared` のスコープで実施するのが正しく、08a では N/A 判定された。

## 背景

brand 型 (`responseId` / `responseEmail` 等) は単なる `string` のままだと取り違えのコンパイル検出ができないため tagged type で保護している。しかし「誤用が確かに型エラーになる」ことを test として固定しなければ、将来の型定義変更で保護が外れていても気付けない。同様に zod schema の出力型が consumer に正しく流れているかも `@ts-expect-error` で固定するのが確実。

## 受入条件

- `packages/shared/src/__tests__/type-contracts.test-d.ts`（または同等）を新規作成し、以下を最低 5 件カバーする:
  - `responseId` に `responseEmail` を代入すると型エラーになる
  - view-model output の必須 field 欠落で型エラーになる
  - zod parse の入力型と推論型が一致する
  - public schema と admin schema が混入できない
  - brand 解除 (`asResponseId`) を経由しないと plain string から brand 型に代入できない
- `tsd` / `vitest` のいずれかで CI に組み込む。
- 既存 442 件 (`apps/api`) と independent に走り、regression が他 suite に伝播しないこと。

## 苦戦箇所【記入必須】

- 対象: `packages/shared` 側の type-only test 実行環境
- 症状: 08a は `apps/api` 単独スコープのため、`@ts-expect-error` を `apps/api` 配下に置いても shared の型変更には追従しない。`packages/shared` 側に test runner を導入する場合、tsd と vitest type-checking のどちらが monorepo の既存 turbo cache と相性が良いか未検証で、08a で先行導入するとスコープが膨らむ判断点があった。
- 参照: `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §5

## リスクと対策

| リスク | 対策 |
| --- | --- |
| tsd / vitest type-test の選定で monorepo 全体のテスト戦略が分裂する | Phase 1 で既存 `pnpm turbo` cache との互換性を確認し、最も追加コストの低いほうを選ぶ |
| `@ts-expect-error` で意図と違う型エラーを掴む | エラーメッセージ snapshot ではなく特定箇所での弾きを assert する形にする |
| shared 変更が `apps/api` / `apps/web` 双方を倒す | `pnpm --filter '...^@ubm-hyogo/shared'` のような依存逆引き CI を整備する（別タスクでも可） |

## 検証方法

### 要件検証

```bash
ls packages/shared/src 2>/dev/null
rg "@ts-expect-error" packages/shared 2>/dev/null
```

期待: 現行 `packages/shared` に type test が無いことを確認する。

### 試験導入確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test 2>&1 | head -20
```

期待: shared に test script が無い場合は本タスクで追加する。

## スコープ

### 含む

- `packages/shared` 直下の type test suite 新設
- tsd or vitest type-check の選定 ADR
- CI 組み込み

### 含まない

- `apps/api` の brand-type runtime test（08a 完了済）
- shared schema 自体の改変

## 関連

- `apps/api/src/__tests__/brand-type.test.ts`
- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md`
