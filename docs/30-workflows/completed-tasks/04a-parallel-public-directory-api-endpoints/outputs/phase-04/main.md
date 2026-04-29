# Phase 4 主成果物 — テスト戦略

## suite 構成

| suite | 場所 | 範囲 |
| --- | --- | --- |
| unit | `apps/api/src/_shared/__tests__/` / `apps/api/src/view-models/public/__tests__/` | 8 spec |
| contract | `apps/api/tests/public/contract.test.ts` | 4 endpoint zod parse |
| leak（独立） | `apps/api/tests/public/leak.test.ts` | 不適格 6 種 + key 漏出 |
| authorization | `apps/api/tests/public/authz.test.ts` | 未認証 200 / 認証 200 |
| search | `apps/api/tests/public/search.test.ts` | tag AND / fallback / clamp |

## fixture

```
apps/api/tests/fixtures/public/
├── members.json           # 10 member (適格 6 + declined 2 + hidden 1 + deleted 1)
├── sync-jobs.json         # 直近 schema_sync / response_sync
└── schema-questions.json  # 31 行 / 6 セクション
```

## verify 一覧

### unit
- `public-filter`: WHERE param object 生成（`{ publicConsent:'consented', publishState:'public', isDeleted:0 }`）
- `search-query-parser`: 不正値 → default fallback
- `pagination`: `buildPaginationMeta({ total, page, limit })`、limit clamp、totalPages 算出
- `visibility-filter`: `visibility !== 'public'` 除外
- `to-public-stats` / `to-public-member-list` / `to-public-member-profile` / `to-form-preview`

### contract
- 4 endpoint で `Public*ViewZ.parse(response)` PASS
- `members` items[] / profile に `responseEmail` / `rulesConsent` / `adminNotes` の key 不在
- form-preview: `fields.length === 31`、`distinct sectionKey count === 6`

### leak（独立 suite）
| ケース | 期待 |
| --- | --- |
| `/public/members` で declined / hidden / deleted 含まず | items.length=6 |
| `/public/members/m_declined` | 404 / `code=UBM-1404` |
| `/public/members/m_hidden` | 404 |
| `/public/members/m_deleted` | 404 |
| 適格 member 詳細 | sections[].fields[].visibility 全て `public` |
| 適格 member 詳細 | response payload に `responseEmail` / `rulesConsent` / `adminNotes` 0 件 |

### authorization
| ケース | 期待 |
| --- | --- |
| 未ログイン (cookie なし) | 200 |
| 認証 cookie あり | 200（同 response） |

### search
| ケース | 期待 |
| --- | --- |
| `?tag=ai&tag=dx` | AND filter |
| `?zone=invalid` | fallback `'all'` |
| `?sort=invalid` | fallback `'recent'` |
| `?density=anything` | server filter 不適用 |
| `?q=`（空） | 全件 |
| `?limit=200` | clamp 100 |
