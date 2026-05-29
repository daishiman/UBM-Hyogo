# Phase 6: エラーハンドリング設計

## 6.1 エラーケースと挙動

| ケース                                                                      | 挙動                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| D1 read エラー（`findAutoLinkCandidateByEmail` SELECT が throw）            | session-resolve は catch せず Hono error-handler に委譲。500 を返し `apps/web` 側 fetchSessionResolve は unregistered fallback |
| D1 write エラー（`backfillIdentityFromCandidate` INSERT が throw）         | 同上。auto-link は失敗扱い、unregistered に倒れる（fail-closed / 不変条件 #11）                                  |
| UNIQUE 違反（concurrent sign-in での race）                                 | `INSERT OR IGNORE` で吸収。直後の `findIdentityByEmail` 再 SELECT で hit するためエラーにならない                |
| candidate なし                                                              | auto-link 結果 null → 既存 unregistered 経路に合流                                                                |
| candidate 発見 → INSERT 後の再 SELECT が null（理論上発生せず）            | 防衛的に null を返し unregistered 経路へ。log に warn 出力                                                        |

## 6.2 不変条件チェック

- C5: auto-link helper 内で `INSERT OR IGNORE` を使うため、既存 member_identities row を物理的に上書きできない（schema 制約で担保）
- C3: backfill SQL は `INSERT OR IGNORE` + `WHERE NOT EXISTS` の二重防衛で冪等性を担保
- C6: helper 内で `LOWER(TRIM(...))` 正規化を統一適用

## 6.3 log 出力

| 事象                                       | level | code                            | フィールド                                    |
| ------------------------------------------ | ----- | ------------------------------- | --------------------------------------------- |
| auto-link 成功                             | info  | `UBM-AUTH-AUTOLINK-OK`         | email_hash, member_id                         |
| auto-link 候補なし                         | info  | `UBM-AUTH-AUTOLINK-NO-CAND`    | email_hash                                    |
| auto-link 多重 member_id 検出（MIN 採用） | warn  | `UBM-AUTH-AUTOLINK-MULTI-MID`  | email_hash, picked_member_id, candidate_count |
| backfill 後の再 SELECT null               | warn  | `UBM-AUTH-AUTOLINK-RESELECT-NIL` | email_hash                                    |

`email_hash` は PII 防止のため SHA-256 8 byte prefix を採用（既存 logger に hash helper があればそれを再利用、無ければ identities.ts 内に inline）。

## 6.4 既存 error path への影響

- `apps/api/src/middleware/error-handler.ts` への変更は不要
- `apps/web/src/lib/auth.ts:162` の `catch { return unregistered }` で 5xx は既に握り込まれているため、API 側で 500 を返しても sign-in flow には影響なし
