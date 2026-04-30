# Phase 6 出力: 異常系検証（issue-191）

Phase 4 verify suite を補完し、`schema_aliases` 経路の異常系（401 / 403 / 404 / 409 / 422 / 5xx / sync 部分失敗 / 移行期間矛盾）を網羅する。

## failure cases

### F-401: 未認証

| 項目 | 内容 |
| --- | --- |
| 操作 | `POST /admin/schema/aliases` を Cookie / Authorization なしで呼ぶ |
| 期待 | 401 Unauthorized、generic error JSON |
| 副作用 | `schema_aliases` / `schema_diff_queue` 共に変化なし |
| 観測 | レスポンスステータス + D1 row 数差分 0 |

### F-403: 認証済だが非 admin

| 項目 | 内容 |
| --- | --- |
| 操作 | role=member token で同 endpoint POST |
| 期待 | 403 Forbidden、DB 変化なし |
| 関連 | 不変条件 #14 |

### F-404: 存在しない question_id

| 項目 | 内容 |
| --- | --- |
| 操作 | admin token、`aliasQuestionId` が queue にも questions にも未存在 |
| 期待 | 404 Not Found、INSERT しない |
| 理由 | 出自不明 alias 防止（不変条件 #1） |

### F-409: UNIQUE violation（同 alias_question_id 重複 INSERT）

| 項目 | 内容 |
| --- | --- |
| 操作 | 同 `aliasQuestionId` で 2 回 resolve |
| 期待 | 1 回目 200、2 回目 409 Conflict（または「update API を使え」誘導） |
| 副作用 | 1 回目の row のみ残存、2 回目は追加 INSERT なし |
| 観測 | repository で `ConflictError` throw、handler で 409 マップ |

### F-422: stableKey 不正

| 項目 | 内容 |
| --- | --- |
| 操作 | `stableKey` が 31 項目仕様（`docs/specs/01-api-schema.md`）に存在しない |
| 期待 | 422 Unprocessable Entity、INSERT しない |
| 検証 | handler で stableKey allow-list バリデーション |

### F-5xx: D1 一時失敗

| 項目 | 内容 |
| --- | --- |
| 操作 | `schemaAliasesRepository.insert` が transient error |
| 期待 | 500（または 503）、queue.status は unresolved 据え置き |
| 副作用 | partial commit を作らない（同一 tx or compensation） |
| sync 失敗時 | 03a も同様、`sync_jobs.status='failed'`、次回 sync で retry |

### F-PARTIAL: 03a sync 中の aliases lookup 失敗

aliases lookup の transient error は fallback しない。`schema_questions.stable_key` が古い可能性を正として扱わないため、sync を `failed` に倒し、次回 `sync_jobs` retry で回復させる。

| 項目 | 内容 |
| --- | --- |
| 操作 | sync 実行中 lookup transient error |
| 期待 | aliases lookup の transient error は **sync 失敗扱い**（部分的な誤った解決を避ける）。retry を sync_jobs 経由 |
| 整合 | Phase 4 F5 と整合 |

### F-MIGRATION-CONFLICT: aliases と schema_questions の値矛盾

| 項目 | 内容 |
| --- | --- |
| 状況 | 同 `aliasQuestionId` に対し aliases.stable_key="X"、questions.stable_key="Y" |
| 期待 | `resolveStableKey` は **aliases 優先**で "X" を返す（Phase 2 lookup 順序） |
| ロギング | `logger.warn('alias_questions_fallback_mismatch', { questionId, aliasesValue, fallbackValue })` を Phase 5 実装に含める |
| 監視 | warn 回数を Phase 9 観測対象に追加 |

## DB 整合性異常

| ケース | 期待 |
| --- | --- |
| `schema_aliases.alias_question_id` 重複 | F-409 |
| `schema_aliases.id` 重複 | PRIMARY KEY 違反 → 5xx |
| 当該 question の queue 行が無い状態で resolve | F-404 同等 |

## 認可境界の追加検証

| 観点 | 検証 |
| --- | --- |
| CSRF | 既存 admin endpoint 対策に準拠 |
| audit | `resolved_by` に admin user id が必ず格納（null 不可） |

## 不変条件マッピング

| # | 異常系での担保 |
| --- | --- |
| #1 | F-422（allow-list）+ F-MIGRATION-CONFLICT（aliases 優先固定） |
| #5 | 異常系テストも apps/api 内完結 |
| #14 | F-401 / F-403 で admin 境界保護 |

## 次 Phase（7: AC マトリクス）への引き渡し

- 8 失敗ケース（401 / 403 / 404 / 409 / 422 / 5xx / partial / migration-conflict）
- observability 要件 / 移行期間矛盾の優先順位
