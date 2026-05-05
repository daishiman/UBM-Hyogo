# Phase 12 implementation guide

## Part 1: 中学生レベル

apps/api のテストが 13 個失敗していて coverage（テストがコードのどこを通っているかの数字）が出せませんでした。
このタスクでは、失敗していたテストを直し、523 個全部のテストが通るようにして、coverage の数字も出せるようにしました。
新しい機能を作ったわけではなく、テスト用の偽データベース（FakeD1）に足りなかった部分を 1 ファイルだけ書き足しました。

## Part 2: 技術者レベル

### 修復対象と分類

Phase 1 で固定した 13 件 (F01-F13) のうち、本ブランチ取込時点で残っていたのは F01-F04 の 4 件（すべて `apps/api/src/jobs/sync-forms-responses.test.ts`）。F05-F13 は先行コミットで解消済みのため、この task では再度の修正をしない。

| ID | symptom | root cause | 分類 | fix |
| --- | --- | --- | --- | --- |
| F01 (AC-4) | `result.status` が `failed` | `processResponse` が `enqueueTagCandidate` を呼び `tag_assignment_queue` への INSERT/SELECT を行うが FakeD1 が未対応 → throw → status=failed | fixture drift | FakeD1 に tag_assignment_queue 経路を追加 |
| F02 (AC-1) | `current_response_id` が `r-old` のまま | 1 件目の処理が throw する前に identity だけ作成され、2 件目以降が走らないため | fixture drift | 同上 |
| F03 (AC-5) | `processedCount=0` | 1 件目の processResponse が throw → ループ break | fixture drift | 同上 |
| F04 (AC-10) | `result.status='failed'` | 同上 | fixture drift | 同上 |

### 適用された差分（runtime production code 影響なし）

`apps/api/src/jobs/__fixtures__/d1-fake.ts` のみ:

1. `FakeD1` クラスに `tagQueue: FakeRow[] = []` を追加。
2. `runFirst` に 3 経路を追加:
   - `SELECT 1 FROM member_tags WHERE member_id = ?` → null（member_tags 不在を擬似）
   - `SELECT ... FROM tag_assignment_queue WHERE idempotency_key = ?` → 既存 row or null
   - `SELECT queue_id FROM tag_assignment_queue WHERE member_id = ? AND status IN ('queued','reviewing')` → null
3. `runMutation` に `INSERT INTO tag_assignment_queue (... idempotency_key)` 経路を追加。idempotency_key 衝突時は migration 0009 の `idx_tag_queue_idempotency` 仕様に合わせて UNIQUE constraint 風に throw。

これにより、`processResponse` の最終ステップである `enqueueTagCandidate(...)` が成功するようになり、`runResponseSync` 全体が `succeeded` を返すようになる。runtime production code、apps/web、packages/* は無編集で、変更は `apps/api/src/jobs/__fixtures__/d1-fake.ts` の test fixture に限定される。

### Phase 11 evidence 実測（2026-05-01）

| 項目 | command | result |
| --- | --- | --- |
| 全 test | `cd apps/api && pnpm test` | **523 passed (523)** |
| coverage 生成 | `cd apps/api && pnpm test:coverage` | exit 0、`apps/api/coverage/coverage-summary.json` 生成 |
| coverage-guard | `bash scripts/coverage-guard.sh --no-run --package apps/api` | **PASS** (threshold 80) |

apps/api coverage 実測値:

- Statements 84.20% / Branches 83.44% / Functions 84.04% / Lines 84.20%

precondition gate（80% 一律 + summary 生成 + guard exit 0）を全部 PASS。upgrade gate（>=85%）は本タスクの scope out であり、`ut-08a-01-public-use-case-coverage-hardening` に委譲する。

### 不変条件 / 仕様整合

- 不変条件 #1 / #2 / #5 / #6 に対する runtime production code 編集なし。
- `docs/00-getting-started-manual/specs/02-auth.md`、`03-data-fetching.md` と矛盾なし。
- aiworkflow-requirements の workflow inventory / quick-reference / resource-map 同期は `system-spec-update-summary.md` に集約。

### Phase 13 (PR) ゲート

Phase 13 は user approval gate。本ドキュメント時点では commit / push / PR を実行していない。
