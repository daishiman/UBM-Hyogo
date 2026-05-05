# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 3 |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 5（実装ランブック） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |

## 目的

Phase 4 の verify suite を補完し、本タスクで導入される `schema_aliases` 経路の異常系（401 / 403 / 404 / 409 / 422 / 5xx / sync 部分失敗 / 移行期間矛盾）を網羅する。各ケースに HTTP / DB 観測点と期待挙動を確定する。

## failure cases

### F-401: 未認証アクセス

| 項目 | 内容 |
| --- | --- |
| 操作 | `POST /admin/schema/aliases` を Cookie / Authorization なしで呼ぶ |
| 期待 | `401 Unauthorized`、body は generic error JSON |
| 副作用 | `schema_aliases` / `schema_diff_queue` 共に変化なし |
| 観測 | レスポンスステータス + D1 row 数差分 0 |

### F-403: 認証済だが非 admin

| 項目 | 内容 |
| --- | --- |
| 操作 | role=member の token で同 endpoint を POST |
| 期待 | `403 Forbidden` |
| 副作用 | DB 変化なし |
| 関連 | 不変条件 #14（schema 変更は admin 集約） |

### F-404: 存在しない question_id

| 項目 | 内容 |
| --- | --- |
| 操作 | admin token、body の `aliasQuestionId` が `schema_diff_queue` にも `schema_questions` にも未存在 |
| 期待 | `404 Not Found`、INSERT は実行しない |
| 理由 | 出自不明 alias を作らない（不変条件 #1） |

### F-409: UNIQUE violation（同 alias_question_id 重複 INSERT）

| 項目 | 内容 |
| --- | --- |
| 操作 | 同一 `aliasQuestionId` で 2 回 resolve を呼ぶ |
| 期待 | 1 回目 200、2 回目 `409 Conflict`（または明示的に「update API を使え」誘導） |
| 副作用 | 1 回目の row のみが残る、2 回目では追加 INSERT なし |
| 観測 | repository 層で `ConflictError` を throw、handler で 409 にマップ |

### F-422: 不正な stable_key（schema_questions にも aliases にも該当なし）

| 項目 | 内容 |
| --- | --- |
| 操作 | body の `stableKey` が 31 項目仕様（`docs/specs/01-api-schema.md`）に存在しない値 |
| 期待 | `422 Unprocessable Entity`、INSERT 実行しない |
| 検証 | handler で stableKey の allow-list バリデーション（schema spec 由来） |

### F-5xx: D1 一時的失敗

| 項目 | 内容 |
| --- | --- |
| 操作 | `schemaAliasesRepository.insert` が D1 から transient error |
| 期待 | `500 Internal Server Error`（または 503）、`schema_diff_queue.status` は `unresolved` のまま据え置き |
| 副作用 | partial commit を作らない（同一トランザクション or compensation） |
| sync 失敗時 | 03a 側で同様に D1 失敗 → `sync_jobs.status='failed'` 遷移、次回 sync で retry |

### F-PARTIAL: 03a sync 中に aliases lookup 失敗

| 項目 | 内容 |
| --- | --- |
| 操作 | 03a sync 実行中、`schemaAliasesRepository.lookup` が D1 transient error |
| 期待 | `schema_questions.findStableKeyById` fallback へ進まず、明示的に再 throw して sync を `failed` に倒す |
| 理由 | aliases lookup の transient error 時に fallback すると古い `schema_questions.stable_key` を正として扱う危険がある。retry は `sync_jobs` 経由で行う |

### F-MIGRATION-CONFLICT: aliases と schema_questions の値が矛盾

| 項目 | 内容 |
| --- | --- |
| 状況 | 同一 `aliasQuestionId` に対し `schema_aliases.stable_key` = "X"、`schema_questions.stable_key` = "Y" |
| 期待 | `resolveStableKey` は **aliases を優先**して "X" を返す（移行期間ルール、Phase 2 lookup 順序） |
| ロギング | `logger.warn('alias_questions_fallback_mismatch', { questionId, aliasesValue, fallbackValue })` を Phase 5 実装に含める |
| 監視 | warn 回数を Phase 9 で観測対象に追加 |

## DB 整合性異常

| ケース | 期待 |
| --- | --- |
| `schema_aliases.alias_question_id` 重複（DDL の UNIQUE 違反） | INSERT 失敗（F-409） |
| `schema_aliases.id` 重複 | PRIMARY KEY 違反として 5xx |
| 当該 question の `schema_diff_queue` 行が無い状態で resolve 呼び出し | F-404 と同等扱い |

## 認可境界の追加検証

| 観点 | 検証 |
| --- | --- |
| CSRF | 既存 admin endpoint の CSRF 対策に準拠（追加実装不要） |
| audit | `resolved_by` カラムに admin user id が必ず格納される（null 不可） |

## 不変条件マッピング

| 不変条件 | 異常系での担保 |
| --- | --- |
| #1 | F-422 で stableKey allow-list、F-MIGRATION-CONFLICT で aliases 優先固定 |
| #5 | 異常系テストも `apps/api` 内で完結 |
| #14 | F-401 / F-403 で admin 境界保護 |

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 成果物

- `outputs/phase-06/main.md`
- root `artifacts.json` と `outputs/artifacts.json` の parity

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] 401 / 403 / 404 / 409 / 422 / 5xx / partial / migration-conflict の 8 ケースが記載
- [ ] 各ケースで HTTP / DB / ログの観測点が明示
- [ ] aliases 優先のロギング warn が Phase 5 実装に reflect されている
- [ ] artifacts.json の phase 6 が `spec_created`

## 参照資料

- Phase 4 / Phase 5
- `docs/00-getting-started-manual/specs/01-api-schema.md`（stableKey allow-list）
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`

## 次 Phase への引き渡し

- 引き継ぎ事項: 8 失敗ケース / observability 要件 / 移行期間矛盾の優先順位
- ブロック条件: 認可ケース未記載、UNIQUE violation 経路未記載
