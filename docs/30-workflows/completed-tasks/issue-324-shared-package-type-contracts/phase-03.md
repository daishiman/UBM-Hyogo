# Phase 03: 設計

[実装区分: 実装仕様書]

## 目的

Phase 02 で確定した Include 範囲に対して、テストファイル構成・assertion 戦略・CI 統合方式を設計する。

## 入力

- `phase-02.md`（Include / Exclude）
- `packages/shared/src/types/ids.spec.ts`（既存 expectTypeOf パターンの参照）
- `packages/shared/src/zod/viewmodel.ts`（対象 schema 一覧）
- `vitest.config.ts`（既存 include glob 確認）

## 設計

### 3.1 テストファイル配置

```
packages/shared/src/__tests__/type-contracts.spec.ts
```

- `__tests__/` 配下に置くことで「runtime 機能テスト」(`zod/*.spec.ts` / `types/ids.spec.ts`) と区別。
- vitest は `packages/**/src/**/*.spec.{ts,tsx}` を再帰収集するため設定変更不要。
- ファイル名 `type-contracts.spec.ts` は文字列「type-contracts」で grep 可能（CI 監査時に検索しやすい）。

### 3.2 describe 構造（5 ブロック）

| Block | AC | 説明 |
| --- | --- | --- |
| `ResponseId / ResponseEmail mutual exclusion` | AC-1 | 双方向 `not.toMatchTypeOf` |
| `view-model required field omission` | AC-2 | `@ts-expect-error` + 不完全 literal |
| `zod input/output type parity` | AC-3 | `z.input` ≡ `z.output` ≡ `z.infer` を `toEqualTypeOf` |
| `public/admin schema mutual exclusion` | AC-4 | `PublicMemberListView` ↔ `AdminMemberListView` の `not.toMatchTypeOf` |
| `test suite independence (meta)` | AC-5 | runtime 副作用ゼロ assertion / 実行時に zod schema を 1 件だけ instantiate して shared が単独 import で動くことを示す |

### 3.3 assertion 戦略

| パターン | 用途 | 例 |
| --- | --- | --- |
| `expectTypeOf<A>().not.toMatchTypeOf<B>()` | brand 相互排他 | AC-1 / AC-4 |
| `expectTypeOf<A>().toEqualTypeOf<B>()` | 型等価 | AC-3 |
| `// @ts-expect-error: <理由>` | 必須 field 欠落の compile error 固定 | AC-2 |
| `expectTypeOf(value).toBeString()` 等 | 副作用ゼロ実行 | AC-5 meta |

`@ts-expect-error` は理由コメントを必ず付け、tsc 実行時に「実際にエラーが出る行のみ」に付与する（不要箇所に付くと tsc 自体が `Unused @ts-expect-error directive` で fail する性質を逆に regression 検知に利用）。

### 3.4 view-model schema 選定（AC-2 / AC-3 / AC-4）

| schema | 用途 | 由来 |
| --- | --- | --- |
| `MemberProfileZ` | AC-2 必須 field 欠落（`memberId` 抜き）+ AC-3 input/output parity | `zod/viewmodel.ts` L53 |
| `PublicMemberListViewZ` | AC-4 public 側代表 | `zod/viewmodel.ts` L127 |
| `AdminMemberListViewZ` | AC-4 admin 側代表 | `zod/viewmodel.ts` L246 |
| `AdminMemberDetailViewZ` | AC-3 nested object のparity 検証 | `zod/viewmodel.ts` L256 |
| `adminRequestResolveBodySchema` | AC-4 admin schema (form body) | `schemas/admin/admin-request-resolve.ts` |

### 3.5 CI 統合方式

- 既存 `pnpm test` と `pnpm typecheck` の双方で自動的に対象化される。
  - `pnpm test` → vitest が `*.spec.ts` glob で収集。
  - `pnpm typecheck` → `tsc --noEmit` が `.spec.ts` を含めて検査するため `@ts-expect-error` 違反は型エラーとして失敗する。
- 専用 CI workflow / package.json script 追加は不要。
- AC-5 の独立性は「`@ubm-hyogo/shared` を `--filter` 単独で実行可能」であることをもって担保（既存設定で実現済）。

### 3.6 不採用案と理由

| 案 | 不採用理由 |
| --- | --- |
| `tsd` 導入 | dev dep 追加 / 既存 expectTypeOf 資産との分裂 / turbo cache 構成の二重化 |
| vitest typecheck mode (`test.typecheck.enabled`) | 既存 `pnpm typecheck` で `.spec.ts` 検査済 / 起動コスト二重化 |
| `*.test-d.ts` 命名 | 不変条件 #8 違反（lefthook `block-test-suffix` で reject） |
| `vitest.d1.config.ts` 配下に置く | D1 binding 不要 / scope 不一致 |

## 出力

- 本 phase 仕様書のみ。

## 完了条件 (DoD)

- [ ] テストファイルパスが 1 つに確定。
- [ ] 5 describe ブロック構造が AC と紐付いている。
- [ ] assertion 戦略 4 パターンが文書化。
- [ ] schema 選定 5 件と由来行が表化。
- [ ] CI 統合方式（既存 glob 利用）と不採用案の根拠が残る。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `@ts-expect-error` の意図しない誤抑制 | 理由コメント必須化 + `Unused @ts-expect-error directive` 自動 fail を活用 |
| view-model schema 改変時に test がずれる | 必須 field 欠落 assertion は最小 field（`memberId`）のみ抜く形にして影響面を局所化 |
