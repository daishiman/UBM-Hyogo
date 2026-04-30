# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 3（post-03a follow-up） |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（実装ランブック） |
| 状態 | spec_created |

## 目的

Phase 1 の AC-1〜AC-6 を verify suite（unit / contract / E2E / authorization）で完全カバーするテスト戦略を確定する。03a 互換 path（`schema_aliases` 優先 + `schema_questions` fallback）と 07b 書込 path（`schema_aliases` への INSERT のみ）の双方を検証し、`UPDATE schema_questions SET stable_key` の出現が 0 件であることを静的検査で保証する。

## verify suite（4 レイヤ設計）

| レイヤ | ツール | 対象 | 判定 |
| --- | --- | --- | --- |
| unit | Vitest（`apps/api`） | `schemaAliasesRepository` の lookup / insert / update / unique violation | repository 単体の I/O 契約 |
| contract | Vitest + Miniflare D1 | 07b alias resolve handler / 03a `resolveStableKey` service | endpoint と service の協調動作 |
| E2E | Vitest + Miniflare（fixture seed） | `schema_diff_queue` → 07b resolve → 03a 次回 sync | unresolved 件数遷移の通し検証 |
| authorization | Vitest + auth fixture | 07b alias resolve endpoint の admin 認可 | 401 / 403 / 200 の 3 状態 |
| static check | ripgrep / lint rule | `UPDATE schema_questions SET stable_key` の grep 0 件 | AC-4 の構造的保証 |

## テストレイヤごとの責務分割

### unit（`apps/api/test/repositories/schemaAliases.contract.test.ts`）

| ケース | 期待 |
| --- | --- |
| `lookup(alias_question_id)` ヒット | row（stable_key / source / resolved_by 付き）を返す |
| `lookup(alias_question_id)` ミス | `null` を返す（throw しない） |
| `insert(row)` 正常 | 1 行 INSERT され、`findByQuestionId` で取得可能 |
| `insert(row)` 重複 alias_question_id | UNIQUE violation を ConflictError として throw |
| `update(id, patch)` 正常 | `resolved_at` / `source` を更新可能、`alias_question_id` は immutable |
| `findByQuestionId(qid)` | repository 内 helper の戻り値が lookup と一致 |

### contract（service / handler 層）

| ケース | 期待 | カバー AC |
| --- | --- | --- |
| `POST /admin/schema/aliases` を valid body で呼ぶ | `schema_aliases` に 1 行 INSERT、`schema_diff_queue.status='resolved'` 遷移 | AC-4 |
| 同 endpoint 実行後に `schema_questions` の SELECT を取り、`stable_key` が unchanged | 直接 UPDATE が発生していない | AC-4 |
| `resolveStableKey(questionId)` で aliases hit | `{ stableKey, source: 'aliases' }` を返す | AC-6（順序） |
| `resolveStableKey(questionId)` で aliases miss + questions hit | `{ stableKey, source: 'questions_fallback' }` を返す | AC-6 |
| `resolveStableKey(questionId)` で両方 miss | `null` を返し caller が enqueue 経路へ | AC-5 前提 |
| aliases / questions 両方 hit（移行期間） | aliases 優先で返る | AC-6 / Phase 6 と整合 |

### E2E（`apps/api/test/e2e/alias-resolution.e2e.test.ts`）

| ステップ | 期待 |
| --- | --- |
| 1. fixture: `schema_diff_queue` に unresolved 行 N 件 seed | 初期状態 N 件 |
| 2. 07b handler を 1 件分 invoke | `schema_aliases` に 1 行 INSERT |
| 3. 03a sync を再実行 | 該当 question で `resolveStableKey` が aliases hit |
| 4. `schema_diff_queue` の unresolved を再カウント | 件数が事前比 -1 以上 |

これにより AC-5 を quantitative にカバー。

### authorization

| 状態 | 期待 |
| --- | --- |
| 未認証 | `401 Unauthorized` |
| 認証済 / role≠admin | `403 Forbidden` |
| 認証済 / role=admin | `200 OK`、INSERT 成立 |

不変条件 #14（schema 変更は /admin/schema 集約）の境界を endpoint レベルで担保する。

## `UPDATE schema_questions SET stable_key` grep 0 件チェック

| 手段 | 実装 |
| --- | --- |
| CI ステップ | `rg -n "UPDATE\\s+schema_questions\\s+SET\\s+stable_key" apps/ --glob '!**/migrations/**'` を実行し、ヒット 1 件以上で fail |
| 配置 | `pnpm` script `lint:no-direct-stablekey-update`、CI workflow に追加 |
| 例外 | `apps/api/migrations/` 配下（過去マイグレーション）は除外 |

AC-4 の「lint or AST 検証」要件を満たす最低実装。Phase 9 で grep の漏れ条件を評価し、ESLint custom rule への昇格要否を判定する。

## fallback 動作のテスト設計

| シナリオ | 入力 | 期待 |
| --- | --- | --- |
| F1: alias 未登録 / `schema_questions.stable_key` 値あり | aliases 0 件、questions に row | fallback 値を返す |
| F2: alias 登録済 / questions にも値あり | 両方 hit | aliases 優先 |
| F3: alias 登録済 / questions に値なし | aliases hit のみ | aliases 値を返す |
| F4: 両方 miss | 0 / 0 | `null` を返し enqueue へ |
| F5: aliases lookup が D1 一時失敗 | aliases throw | Phase 6 の異常系で sync failed + 次回 retry として扱う。fallback しない |

## 不変条件マッピング

| 不変条件 | テスト保証手段 |
| --- | --- |
| #1 | F1〜F4 fallback テスト + grep 0 件で「コードに stableKey 直書き / 直更新」を排除 |
| #5 | テストはすべて `apps/api` 配下、`apps/web` から D1 アクセスするテストは作らない |
| #14 | authorization テストで /admin/schema 集約境界を保証 |

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 成果物

- `outputs/phase-04/main.md`
- root `artifacts.json` と `outputs/artifacts.json` の parity

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] unit / contract / E2E / authorization の 4 レイヤで AC-1〜AC-6 がトレース可能
- [ ] `UPDATE schema_questions SET stable_key` grep 0 件チェックの実装手段が確定
- [ ] fallback 5 シナリオ（F1〜F5）が記載されている
- [ ] 不変条件 #1 / #5 / #14 のテスト保証手段が明記
- [ ] artifacts.json の phase 4 が `spec_created`

## 参照資料

- 依存 Phase: Phase 2 / Phase 3
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/30-workflows/02-application-implementation/07b-parallel-schema-diff-alias-assignment-workflow/`
- `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/`

## 次 Phase への引き渡し

- 引き継ぎ事項: 4 レイヤ verify suite / grep ルール / fallback 5 シナリオ
- ブロック条件: AC のいずれかがレイヤ未割当、grep 手段未確定
- open question: ESLint custom rule 化の要否（Phase 9 で再評価）
