# Phase 4: テスト作成（TDD RED 設計）

## 0. 前提・命名整合チェック（着手前）

| 確認項目 | 内容 |
| --- | --- |
| 命名規則整合 | Phase 1「既存コードの命名規則分析」を参照。新規 SQL 列は `snake_case`（`batch_id` / `correlation_id`）、index は `idx_audit_log_<col>`。repository 関数は新設せず既存 `listFiltered` を改修。 |
| 依存整合（FB-MSO-002） | テスト実行前に `mise exec -- pnpm install` を実行し esbuild darwin バイナリ mismatch を解消する（worktree 直後は必須）。 |
| private/SQL テスト方針 | `listFiltered` は **public 関数**。SQL（where 句・index 走査）は private method ではないため、`listFiltered` の public 呼び出し経由でブラックボックス検証する。SQL 文字列を直接 assert しない（実装差し替え耐性のため、結果集合と EXPLAIN QUERY PLAN を観測する）。 |
| 方式分岐 | Phase 2 spike の決定（方式A=VIRTUAL generated column / 方式B=plain `correlation_id` + backfill）により、追加ケース TC-05 の要否が変わる。RED 設計は両方式に耐えるよう「結果集合 contract（AC-3/AC-4/AC-5）」と「方式依存ケース（AC-2 index 走査 / 方式B write-path）」を分離する。 |

## 1. TDD RED の command suite と expected result

D1 group は `vitest.d1.config.ts`（`pool: forks` / `singleFork`）で実行する。targeted run（全件 `pnpm test` は SIGKILL リスクのため使わない＝FB-UI-02-2）。

```bash
# repository 非退化 + 新規ケース（主検証ファイル）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts

# route 契約 非退化
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts

# migration 単体（新規・方式A index 走査 / 列存在）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts
```

### RED 段階の expected result

| 段階 | 期待 |
| --- | --- |
| migration `0027` 未作成・repository 未改修 | 新規 TC-01（index 走査）/ TC-02（後方互換）/ 方式B時の TC-05（write-path）が **FAIL**。既存 batchId 3 ケース（`:122-235`）は現行 `json_extract` 実装で **PASS**（=退化していないことの基準線）。 |
| migration `0027` のみ作成・repository 未切替 | TC-01 が方式により分岐（方式A: generated column 経由でも `json_extract` SQL は index を使わないため FAIL のまま。方式B: 同上）。TC-02（既存行）は方式A=PASS／方式B=backfill が効くため PASS。 |
| migration + repository 切替 後（GREEN 目標） | 全ケース **PASS**。 |

> RED の核心: 「index を実際に走査しているか」は SQL を `json_extract` から `batch_id = ?` に切り替えない限り達成できない。TC-01 が GREEN 化条件を駆動する。

## 2. 非退化テスト（AC-5・最優先）

既存 `auditLog.repository.spec.ts:122-235` の batchId 3 ケースが、SQL 切替後も **無改修で緑** であることを AC-5 の合格条件とする。これらは新規に書かず、既存テストを保持し回帰検出に使う。

| 既存ケース | 行 | 検証内容 | 切替後の期待 |
| --- | --- | --- | --- |
| batchId は after_json と before_json の両方を検索する | `:122-166` | `after.batchId` 由来・`before.batchId` 由来の両方がヒット。壊れた JSON 行（`'{broken'`）が誤ヒットしない。 | PASS（COALESCE が after/before 両方を吸収・不正 JSON は列値 NULL で除外） |
| batchId と action は AND 結合される | `:168-196` | `batchId` + `action` の AND。 | PASS（`add()` 経由で `WHERE ... AND batch_id = ?`） |
| batchId と cursor pagination を併用できる | `:198-233` | `batchId` + cursor の併用ページング（`m_bulk_1` → `m_bulk_2`）。 | PASS（cursor 句と batch_id 句が AND） |

> 注意: 既存ケース `:152` は raw INSERT で 9 列（`audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at` の 8 値）を入れる壊れ JSON 行を作る。方式A（generated VIRTUAL column）採用時、`batch_id` は列定義に含めず DDL で算出されるため、この raw INSERT 文は **修正不要**。方式B（plain `correlation_id`）採用時も列を明示指定する INSERT のため `correlation_id` 未指定＝NULL となり誤ヒットせず、修正不要。

## 3. 新規テストケース設計

ファイル割り当て:
- TC-01 / TC-01b（EXPLAIN QUERY PLAN）→ `apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts`（新規。`0025_backfill_member_status.spec.ts` を構造の先例とする）
- TC-02 / TC-03 / TC-04 / TC-05 → `apps/api/src/repository/__tests__/auditLog.repository.spec.ts`（既存末尾に追記）

| ID | 目的（AC） | 入力 | 期待値 |
| --- | --- | --- | --- |
| **TC-01** | index 走査確認（AC-2） | migration 適用後の空〜数行の `audit_log` に対し `EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id = 'x'`（方式B時は `correlation_id`） | 返却プランの `detail` が `USING INDEX idx_audit_log_batch_id`（方式B: `idx_audit_log_correlation_id`）を含む。`SCAN audit_log`（full scan）を含まない。 |
| **TC-01b** | 列・index の存在（AC-1） | `PRAGMA table_info(audit_log)` と `PRAGMA index_list(audit_log)` | `batch_id`（方式B: `correlation_id`）列が存在し、`idx_audit_log_batch_id`（方式B: `idx_audit_log_correlation_id`）index が存在する。 |
| **TC-02** | 既存行（migration 前に存在した行相当）も batchId 検索に乗る（AC-4） | migration 適用後に raw INSERT で「列を明示せず after_json に batchId を持つ行」を投入（=既存行を模擬。方式B時は backfill 対象になるよう `correlation_id` を入れない）→ `listFiltered({ batchId, limit })` | 当該行がヒットする。方式A=generated column が自動算出、方式B=`0027` の backfill UPDATE で `correlation_id` が埋まる前提（migration 適用後に検索可能）。 |
| **TC-03** | after_json 由来 / before_json 由来の両方が同一 batchId で拾える（AC-3） | `append({ after: { batchId: "b-x" } })` と `append({ before: { batchId: "b-x" } })` を投入 → `listFiltered({ batchId: "b-x", limit: 10 })` | 2 件ともヒット（順序は created_at DESC）。COALESCE(after, before) の両方向吸収を確認。 |
| **TC-04** | NULL batchId 行が誤ヒットしない（sparse 確認） | `append({ after: { tagId: "t" } })`（batchId なし）と `append({ after: { batchId: "b-y" } })` を投入 → `listFiltered({ batchId: "b-y", limit: 10 })` | batchId 付き 1 件のみヒット。batchId なし行は除外（`batch_id IS NULL` は `= ?` にマッチしない）。 |
| **TC-05** | （方式B採用時のみ）append 後に correlation_id 列が書かれる write-path | 方式B採用時: `append({ after: { batchId: "b-z" } })` 実行後に raw `SELECT correlation_id FROM audit_log WHERE audit_id = ?` | `correlation_id = "b-z"`。`append` の INSERT に `correlation_id` 列が追加され `e.after?.batchId ?? e.before?.batchId ?? null` が書かれていること。方式A採用時は **N/A**（generated column のため write 不要）として spec にスキップ理由を明記。 |

## 4. テスト実装ガイド

- **EXPLAIN QUERY PLAN の取得**（TC-01）: D1 `db.prepare("EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id = ?1").bind("x").all()` の `results` 各行の `detail` 文字列を検査する。Miniflare D1（SQLite）はプランを返す。`expect(details.some(d => d.includes("idx_audit_log_batch_id"))).toBe(true)` / `expect(details.some(d => /SCAN audit_log\b/.test(d))).toBe(false)`。
- **fixture**: 既存テストの `setupD1()` + `auditLog.append()` を再利用する。TC-02 の「既存行模擬」は `env.db.prepare("INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, after_json, created_at) VALUES (...)").run()` で列を明示しない（方式B backfill のテストを成立させる）。
- **方式分岐の表現**: 列名定数（`const CORR_COL = "batch_id"` 等）を spec 冒頭に置き、Phase 2 決定に合わせて 1 箇所変更で済むようにする。
- migration spec は `_setup.ts` が全 migration を sort 順適用するため、`0027` は自動で乗る。spec 内で個別 DDL を流す必要はない。

## 5. ローカル実行コマンド（再掲・コピー用）

```bash
mise exec -- pnpm install
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts \
  apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts
```

## 6. RED 完了の DoD

- [ ] 新規 TC-01 / TC-01b / TC-02 / TC-03 / TC-04（+方式B時 TC-05）が RED 段階で FAIL することを確認した。
- [ ] 既存 batchId 3 ケース（`:122-235`）は RED 段階でも PASS（退化基準線）であることを確認した。
- [ ] 方式依存ケース（TC-01 index 走査・TC-05 write-path）が方式 A/B のどちらでどう変化するか spec コメントに明記した。
