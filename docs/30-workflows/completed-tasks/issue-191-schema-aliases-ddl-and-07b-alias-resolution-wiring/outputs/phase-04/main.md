# Phase 4 出力: テスト戦略（issue-191）

Phase 1 の AC-1〜AC-6 を verify suite で完全カバーする戦略を確定する。03a 互換 path（aliases 優先 + questions fallback）と 07b 書込 path（INSERT のみ）の双方を検証し、`UPDATE schema_questions SET stable_key` の出現が 0 件であることを静的検査で保証する。

## verify suite（4 レイヤ + static check）

| レイヤ | ツール | 対象 | 判定 |
| --- | --- | --- | --- |
| unit | Vitest（apps/api） | `schemaAliasesRepository` lookup/insert/update/UNIQUE violation | repository 単体 I/O 契約 |
| contract | Vitest + Miniflare D1 | 07b alias resolve handler / 03a `resolveStableKey` service | endpoint と service 協調 |
| E2E | Vitest + Miniflare（fixture seed） | `schema_diff_queue` → 07b resolve → 03a 次回 sync | unresolved 件数遷移 |
| authorization | Vitest + auth fixture | 07b alias resolve endpoint admin 認可 | 401 / 403 / 200 |
| static | ripgrep / lint | `UPDATE schema_questions SET stable_key` grep 0 件 | AC-4 構造保証 |

## レイヤ別ケース

### unit（`apps/api/test/repositories/schemaAliases.contract.test.ts`）

| ケース | 期待 |
| --- | --- |
| `lookup(qid)` ヒット | row（stable_key / source / resolved_by 付き）を返す |
| `lookup(qid)` ミス | `null` を返す（throw しない） |
| `insert(row)` 正常 | 1 行 INSERT、`findByQuestionId` で取得可 |
| `insert(row)` 重複 alias_question_id | UNIQUE violation を `ConflictError` として throw |
| `update(id, patch)` 正常 | resolved_at / source 更新、alias_question_id は immutable |
| `findByQuestionId(qid)` | lookup と一致 |

### contract（service / handler）

| ケース | カバー AC |
| --- | --- |
| `POST /admin/schema/aliases` valid body | AC-4: 1 行 INSERT、queue.status='resolved' |
| 同 endpoint 後の schema_questions 不変検証 | AC-4 |
| `resolveStableKey` aliases hit | AC-6（順序）`{stableKey, source: 'aliases'}` |
| aliases miss + questions hit | AC-6 `{stableKey, source: 'questions_fallback'}` |
| 両 miss | AC-5 前提: null（caller が enqueue） |
| 両 hit | aliases 優先（移行期間） |

### E2E（`apps/api/test/e2e/alias-resolution.e2e.test.ts`）

| ステップ | 期待 |
| --- | --- |
| 1. fixture: queue に unresolved N 件 seed | 初期 N 件 |
| 2. 07b handler 1 件 invoke | aliases に 1 行 INSERT |
| 3. 03a sync 再実行 | 該当で aliases hit |
| 4. queue unresolved 再カウント | 件数 -1 以上（AC-5） |

### authorization

| 状態 | 期待 |
| --- | --- |
| 未認証 | 401 |
| 認証済 / role≠admin | 403 |
| 認証済 / role=admin | 200、INSERT 成立 |

不変条件 #14 の境界を endpoint レベルで担保。

## fallback 動作 5 シナリオ

| ID | 入力 | 期待 |
| --- | --- | --- |
| F1 | aliases 0 / questions 値あり | fallback 値 |
| F5 | aliases lookup が D1 一時失敗 | fallback せず sync failed + 次回 retry |
| F2 | 両方 hit | aliases 優先 |
| F3 | aliases hit / questions 無 | aliases 値 |
| F4 | 両方 miss | null（enqueue へ） |
| F5 | aliases lookup transient error | Phase 6 異常系で扱う（sync_jobs failed → retry） |

## `UPDATE schema_questions SET stable_key` grep 0 件チェック

| 手段 | 実装 |
| --- | --- |
| CI ステップ | `rg -n "UPDATE\s+schema_questions\s+SET\s+stable_key" apps/ --glob '!**/migrations/**'` ヒット 1 件以上で fail |
| 配置 | pnpm script `lint:no-direct-stablekey-update` を CI workflow に追加 |
| 例外 | `apps/api/migrations/` 配下は除外 |

Phase 9 で漏れ条件を再評価し ESLint custom rule 化要否を判定。

## 不変条件マッピング

| 不変条件 | テスト保証手段 |
| --- | --- |
| #1 | F1〜F4 fallback テスト + grep 0 件 |
| #5 | テストはすべて apps/api 配下（apps/web から D1 アクセスするテストを作らない） |
| #14 | authorization テストで /admin/schema 集約境界を保証 |

## 次 Phase（5: 実装ランブック）への引き渡し

- 4 レイヤ verify suite + grep ルール + fallback 5 シナリオ
- open: ESLint custom rule 化要否は Phase 9 で再評価
