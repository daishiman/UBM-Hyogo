# Phase 3: 設計レビュー（4-condition gate）

| 項目 | 値 |
|------|-----|
| レビュー日 | 2026-05-10 |

## 4-condition gate

| # | 条件 | 判定 | 根拠 |
|---|------|------|------|
| C1 | 単一責務（CONST_007） | OK | 7 describe が「endpoint × IO 種別（query / request body / response）」で直交。重複なし。2a/2b/2c とも import 依存なしで独立 |
| C2 | 不変条件遵守 | OK | 新 endpoint 0 / 新 D1 schema 0 / DB / binding / FS / network 触れない / `apps/web` import 禁止 / `z.object(` 0 件（schema 重複禁止） |
| C3 | 受け入れ基準が観測可能 | OK | `parse()` 成功/throw、`expectTypeOf` の type-level 同型、`grep -c 'z\\.object('` 0、`wc -l` 251、すべて機械検証可能 |
| C4 | 依存（shared schema / route inline schema）が明示 | OK | phase-2 §2 import map に exhaustive に列挙 |

## skip ゲート

| 項目 | 内容 |
|------|------|
| 対象 | **なし** |
| 根拠 | 本 spec は pure unit。外部依存なし。後続 Stage 持越しなし |
| `test.skip` / `it.skip` / `describe.skip` | 0 件（強制） |

> 2c 側で許容される cascade preview skip は本 spec とは独立であり、2d 側に持ち込まない。

## risk register

| risk | mitigation |
|------|-----------|
| route の inline `ListQueryZ` / `QueryZ` を named export 化したことで、route 内部で別 symbol を参照していた箇所が壊れる | route 内部で当該 const を参照する用途は schema 定義時のみ。`export` 付与は識別子の参照箇所を変えないため壊れない（`const` → `export const` の 1 字句追加）。Phase 7 の typecheck で再確認 |
| `MergeIdentityResponseZ` の shared 実体 shape が変わる（`auditId` フィールドが optional 化など） | shared schema を正本とし、本 spec は import で常に最新 shape に追従 |
| zod 未 export な response shape（`/admin/requests` items / `/admin/audit` items / `/admin/members/:id/delete` response）の同型確認 | `expectTypeOf` で type-level 同型に置換。runtime parse は不要（contract drift 検知に十分） |
| `DeleteBodyZ` の min/max 境界が変わる | `min(1)` / `max(500)` に依存した失敗系 assertion は実 schema を正本とし、本 spec の境界値（空 / 501 文字）は schema 仕様の現状に追従 |
| 2a/2b/2c 側 fixture が `archivedSourceMemberId` を欠落させたまま緑になる | 本 contract test が最初に red になる設計。CI 上で integration が block される |

## GO / NO-GO

| 観点 | 判定 |
|------|------|
| shared schema 実在 + 正本確定 | OK（phase-1 §2 / phase-2 §3） |
| route 3 ファイルの named export 化が小差分（各 +1 字句） | OK |
| `z.object(` 0 件で 7 describe を構成可能 | OK（type-level 同型で代替） |
| `apps/web` 完全非依存 | OK |
| **判定** | **GO** |
