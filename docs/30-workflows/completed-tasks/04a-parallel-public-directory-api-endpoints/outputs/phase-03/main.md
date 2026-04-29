# Phase 3 主成果物 — 設計レビュー

## 判定

- **PASS**: 採用設計 A + 部分 E（stats / form-preview のみ 60s cache）
- **MINOR**: form-preview の整合は 06a の client 側 refresh で吸収。ETag は Phase 9 / 09a。
- **MAJOR**: なし

## Alternative 比較

| 案 | 内容 | 価値 | コスト | 採否 |
| --- | --- | --- | --- | --- |
| A | router → use-case → repository → view（leak 二重チェック） | 責務明確 / test 容易 | 中（ファイル数） | 採用 |
| B | handler 直 SQL | simple | leak チェックが分散して退行しやすい | 不採用 |
| C | GraphQL | flexible | MVP 過剰 | 不採用 |
| D | apps/web から D1 直 | 1 hop 削減 | 不変条件 #5 違反 | 不採用 |
| E | Edge cache 60s 全 endpoint | 高速 | admin sync 反映遅延 | 部分採用（stats / form-preview のみ） |

## trade-off

| 項目 | A（採用） | B | E |
| --- | --- | --- | --- |
| leak 防止 | 二重 | 単重 | 単重 |
| 性能 | 中 | 高 | 高 |
| test 容易性 | 高 | 中 | 高 |
| 保守 | 高 | 低 | 中 |

## leak 二重チェック

| 層 | 役割 |
| --- | --- |
| repository | SQL where に `public_consent='consented' AND publish_state='public' AND is_deleted=0` |
| use-case | `findByIdPublic` 不在時 → `ApiError(UBM-1404)` |
| view converter | `status` 再判定 → 不適格は `UBM-1404` で 404 |
| view converter | `field.visibility !== 'public'` を filter |
| view converter | `responseEmail` / `rulesConsent` / `adminNotes` runtime delete + zod parse |
| zod schema | `.strict()` で未知 key を reject |

## リスク

| ID | 内容 | 緩和 |
| --- | --- | --- |
| R-1 | SQL where 漏れで leak | view 二重 + leak 独立 suite |
| R-2 | N+1（profile / list） | 詳細 endpoint は join 1 回 / list は member_id batch |
| R-3 | LIKE スキャン性能 | MVP 数百で許容、INDEX 後付検討 |
| R-4 | form-preview と admin sync 不整合 | client refresh、ETag は Phase 9 |
| R-5 | pagination 暴走 | `limit` 上限 100 で clamp |
| R-6 | 不正 query | zod safeParse + default fallback |
| R-7 | sync_jobs 取り違え | `kind ∈ {schema_sync, response_sync}` whitelist |
| R-8 | adminNotes 混入 | converter で runtime delete + zod schema 除外 |
