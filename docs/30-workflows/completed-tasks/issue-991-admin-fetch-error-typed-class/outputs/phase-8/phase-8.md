# Phase 8: リファクタリング — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## 1. 方針

Phase 5 の実装で `AdminFetchError` class と `statusFromError` helper を導入することそのものが、
本タスクのリファクタリング目的（message 生成責務の単一化・status 抽出の関心分離）を達成する。
本 Phase は「リファクタリング観点での Before/After 妥当性」と「重複・drift がないこと」を確定する。

## 2. リファクタリング対象（FB-RT-03: 対象/Before/After/理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `apps/web/src/lib/admin/server-fetch.ts`（error path message 組み立て） | error path（line 510-513, 530）で `bodySnippet` 文字列を手組みし、`throw new Error(\`admin api ${path} failed: ${res.status}${bodySnippet}\`)` で message を inline 生成 | 生 `rawBody` を取得して `AdminFetchError({ path, status, responseBody })` に渡すのみ。message 文字列の組み立て（` body=${slice(0,256)}` suffix 含む）は **`AdminFetchError` constructor 内に集約** | message 生成責務を 1 箇所（constructor）に単一化。呼び出し側は「失敗の事実とコンテキスト」を渡すだけになり、format 変更時の修正点が constructor に閉じる |
| `apps/web/src/lib/server-fetch/safe-fetch.ts`（status 抽出） | `normalizeError` 内に `STATUS_FROM_MESSAGE` 正規表現マッチを inline 記述（message 文字列 parse のみ） | `statusFromError(err)` helper 関数に抽出。**構造化 `status` フィールド（数値・`Number.isInteger` 防御）を優先**し、未提供時に既存正規表現 fallback を行う 2 段構造 | 関心分離（status 抽出ロジックを `normalizeError` から切り出し）とテスタビリティ向上。helper を単体検証でき、構造化優先 / 正規表現 fallback の各分岐を独立に assert できる |

## 3. リファクタリングで守る不変条件

- **message byte-identical**: After の constructor が生成する message は Before と完全一致（` body=${rawBody.slice(0,256)}` suffix 込み・body 不在時 suffix なし）。`server-fetch.binding.spec.ts:89/101` の assertion を満たす。
- **read 回数不変**: `res.text()` は error path で 1 回のみ。`Response.clone()` を導入しない（二重 read は構造的に発生しない）。
- **責務境界**: `safe-fetch.ts`（generic 共通層）は `AdminFetchError` を import しない。`statusFromError` は duck typing（`(err as { status?: unknown }).status`）で構造化 status を読む。admin 固有依存を共通層へ持ち込まない。
- **consumer 不変**: `safe-server-fetch.ts` の `ADMIN_FETCH_404` 分岐は変更しない（status 構造化後も同一 code を経由）。

## 4. duplicate / navigation drift 確認

| 確認項目 | 方法 | 期待 |
| --- | --- | --- |
| message 組み立ての重複が残っていないこと | `grep -n "admin api " apps/web/src/lib/admin/server-fetch.ts` | 出現は `AdminFetchError` constructor の 1 箇所のみ。error path に手組み `bodySnippet` が残らない |
| `safe-fetch.ts` に admin import 混入なし | `grep -n "AdminFetchError\|admin/server-fetch" apps/web/src/lib/server-fetch/safe-fetch.ts` | 0 件 |
| 既存 export surface の navigation drift なし | `fetchAdmin` / `AdminFetchOptions` の export シグネチャを変更しない | 既存 import 元（`safe-server-fetch.ts` 等）の参照が壊れない |
| status 抽出ロジックの重複なし | `normalizeError` 内に正規表現 inline が二重に残らない | 正規表現参照は `statusFromError` 内の 1 箇所 |

## 5. 完了条件（Phase 8）

- [ ] message 生成が `AdminFetchError` constructor に集約され、error path の手組み `bodySnippet` が除去されている
- [ ] status 抽出が `statusFromError` helper に分離され、構造化優先 → 正規表現 fallback の 2 段構造になっている
- [ ] `safe-fetch.ts` に `AdminFetchError` の import が無い（responsibility 境界維持）
- [ ] message byte-identical / read 回数不変 / consumer 不変の 3 不変条件が崩れていない
- [ ] duplicate / navigation drift の 4 確認すべて期待通り
