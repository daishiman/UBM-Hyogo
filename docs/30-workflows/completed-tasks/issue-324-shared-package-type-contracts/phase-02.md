# Phase 02: スコープ確定

[実装区分: 実装仕様書]

## 目的

Phase 01 で確定した AC-1..AC-5 を実装する範囲を明確化し、Include / Exclude / 影響範囲を固定する。

## 入力

- `phase-01.md`（AC-1..AC-5 リスト）
- `packages/shared/src/` 全体構成

## Include（本タスクで触る）

| 種別 | パス | 操作 |
| --- | --- | --- |
| 新規 | `packages/shared/src/__tests__/type-contracts.spec.ts` | 新規作成（AC-1..AC-5 を 5+ describe ブロックで実装） |
| 参照 | `packages/shared/src/branded/index.ts` | type only import |
| 参照 | `packages/shared/src/types/ids.ts` | type only import（再 export 経路の動作確認も兼ねる） |
| 参照 | `packages/shared/src/zod/viewmodel.ts` | type only import + zod schema import |
| 参照 | `packages/shared/src/schemas/admin/admin-request-resolve.ts` | type only import |

## Exclude（本タスクで触らない）

- `packages/shared/src/types/ids.spec.ts`（既存テストは無改変。EX-1 / EX-2 既カバー）
- `packages/shared/src/branded/index.ts`（実装側の改変なし）
- `packages/shared/src/zod/viewmodel.ts`（schema 自体は無改変）
- `apps/api/src/__tests__/brand-type.test.ts`（08a で完了済 runtime test）
- `vitest.config.ts`（既存 include glob `packages/**/src/**/*.spec.{ts,tsx}` で自動収集されるため変更不要）
- `vitest.d1.config.ts`（D1 binding 不要のため使用しない）
- `package.json` の dev dependencies（`tsd` 等の追加なし）

## 影響範囲

| レイヤ | 影響 | 内容 |
| --- | --- | --- |
| `packages/shared` runtime | なし | runtime コード変更なし |
| `packages/shared` test | あり（追加のみ） | test 件数 +8〜12 |
| `apps/api` | なし | shared の export surface 不変 |
| `apps/web` | なし | 同上 |
| CI typecheck | わずか | tsc 対象に 1 ファイル追加（数百ms オーダー） |
| CI test | わずか | vitest run に 1 file 追加（< 1s 想定、type assertion は実行コストほぼゼロ） |

## 出力

- 本 phase 仕様書のみ。

## 完了条件 (DoD)

- [ ] Include / Exclude が表で固定されている。
- [ ] 影響範囲が apps / packages / CI ごとに整理されている。
- [x] `vitest.config.ts` 改変不要であることが既存 include glob と照合済。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 既存 spec ファイルの誤改変 | Exclude 表に明示し、phase-05 手順で touch 対象を 1 ファイルに限定 |
| `vitest.config.ts` を誤って書き換える | Exclude に明記、phase-05 ステップに「config 改変不要」を強調 |
