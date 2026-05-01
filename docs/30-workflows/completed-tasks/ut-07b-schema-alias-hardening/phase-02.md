# Phase 2: 設計（DB 制約 + 再開可能 back-fill + retryable contract）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（DB 制約 + 再開可能 back-fill + retryable contract） |
| 作成日 | 2026-05-01 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビューゲート） |
| 状態 | spec_created |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した「alias 確定 / back-fill 継続の責務分離 + 各層に適した防御」要件を、(1) **DB constraint design**（partial UNIQUE index + 既存衝突検出 SQL + rollback）、(2) **resumable back-fill design**（state 設計 / idempotent 条件 / cursor 管理）、(3) **retryable HTTP contract design**（status / body / `backfill_cpu_budget_exhausted`）、(4) **large-scale measurement plan**（10,000 行 fixture + Workers CPU budget 計測）の 4 成果物に分解する。Phase 3 が代替案比較で結論を出せる粒度で設計入力を作成する。

## Write Target Decision（正本優先）

**採択: `schema_aliases` INSERT を主 write target とする。**

aiworkflow-requirements の issue-191 正本は、07b `POST /admin/schema/aliases` の write target replacement を `schema_questions.stable_key` direct update から `schema_aliases` INSERT へ差し替える。UT-07B はこの正本に従い、以下の責務分離で設計する。

| 層 | 採用方針 |
| --- | --- |
| alias 確定 | `schema_aliases` INSERT を主経路にする |
| fallback 互換 | `schema_questions.stable_key` は alias miss 時の fallback 読み取りと既存 back-fill 入力に限定 |
| DB collision 防御 | 第一候補は `schema_aliases` 側の UNIQUE index。`schema_questions` partial UNIQUE は fallback retirement 前の互換制約として別枠評価 |
| back-fill | alias table 確定後に `response_fields` の `__extra__:<questionId>` を確定 stableKey へ再開可能に処理 |

## 設計判断（base case）

### 判断 1: DB constraint = `schema_aliases` UNIQUE index（base case）

```sql
-- 確定済 stableKey のみに UNIQUE 制約。__extra__:* / unknown / NULL は除外
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_aliases_revision_stablekey_unique
  ON schema_aliases (revision_id, stable_key)
  WHERE stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '\_\_extra\_\_:%' ESCAPE '\\';
```

**採択理由**:
- alias 確定済の stableKey は **revision 内で一意** であるべきだが、未確定 (`unknown`) や questionId 由来の暫定キー (`__extra__:<questionId>`) は仕様上重複しうる（同じ未確定 question が複数行存在することは許容）。
- 全行に UNIQUE を貼ると既存 `unknown` 行が衝突し migration が失敗する。partial unique であれば既存暫定行を温存しつつ確定済キーだけを物理的に守れる。
- D1 (SQLite) は partial index をサポートしている。`CREATE UNIQUE INDEX ... WHERE` 構文で実現可能。

**代替案**:
- **案 A**: 全行 UNIQUE。`unknown` 重複で migration が失敗。NG。
- **案 B**: trigger による INSERT/UPDATE 時 collision 検証。SQLite では trigger は存在するが、複雑性が増し partial unique と同等のパフォーマンスを得るのが難しい。MINOR。
- **案 C**: アプリ層 pre-check のみ継続（現状維持）。race 残存。MAJOR。

### 判断 2: alias 確定 / back-fill 継続の責務分離（base case）

| 段階 | 責務 | 状態の格納先 | 失敗時挙動 |
| --- | --- | --- | --- |
| Stage 1: alias 確定 | `schema_aliases` INSERT + `audit_log` 記録 + `schema_diff_queue.status='resolved'` | DB transaction（即時 commit） | rollback。collision は 409 で返す |
| Stage 2: back-fill 継続 | `response_fields` の `__extra__:<questionId>` キー → 確定 stableKey への UPDATE をバッチ実行 | `schema_diff_queue` に `backfill_cursor` (TEXT) と `backfill_status` (`pending`/`in_progress`/`completed`/`exhausted`/`failed`) を追加 | 部分成功で commit。次回 retry で残件のみ処理 |

**採択理由**:
- Stage 1 を確実に完結させることで「alias 自体は確定したが back-fill 半端」状態を「正常 / 継続中」として表現できる（中間状態が病的 inconsistency ではなく、運用上想定された継続状態となる）。
- Stage 2 は cursor + status を `schema_diff_queue` に持たせることで、別 request での再実行・cron からの自動再実行どちらでも残件処理が成立する。
- back-fill は idempotent: `UPDATE response_fields SET key = '<新stableKey>' WHERE key = '__extra__:<questionId>' AND id > <cursor> LIMIT <batch>` を繰り返す。`id > cursor` で残件のみ走査。

**代替案**:
- 案 X: Stage 1 + Stage 2 を同一 transaction（現状）。CPU budget 超過で全 rollback、進捗が消える。NG。
- 案 Y: Stage 2 を完全に Workers Queue / Cron に移譲。実装規模増。本タスクスコープを超える可能性。Phase 11 実測で必要性が出たら follow-up 起票。

### 判断 3: retryable HTTP contract（base case）

`POST /admin/schema/aliases?dryRun=false` の応答に下記を追加する。

| 状態 | HTTP status | response body 抜粋 | 意味 |
| --- | --- | --- | --- |
| 完全成功 | 200 | `{ "alias": {...}, "backfill": { "status": "completed", "updated": <count> } }` | Stage 1 + Stage 2 両方完了 |
| alias 確定 + back-fill 継続中 | 202 | `{ "alias": {...}, "backfill": { "status": "in_progress", "cursor": "<id>", "updated": <count>, "remaining_estimate": <n> } }` | Stage 1 完了、Stage 2 は次回 retry が必要 |
| alias 確定 + CPU budget 枯渇 | 202 | `{ "alias": {...}, "backfill": { "status": "exhausted", "cursor": "<id>", "updated": <count>, "code": "backfill_cpu_budget_exhausted", "retryable": true } }` | retry を促す |
| collision | 409 | `{ "code": "stable_key_collision", "revision_id": "...", "stable_key": "..." }` | DB UNIQUE 違反 / pre-check 拒否 |
| validation エラー | 422 | `{ "code": "invalid_request", "details": [...] }` | 入力不正 |

**採択理由**:
- 202 + `retryable: true` で「同じ payload で再実行すれば残件処理が進む」契約を明示。クライアント（管理 UI / cron）はこのフラグを見て自動 retry できる。
- 409 と 202 を分けることで、衝突（リカバリ手段が異なる）と継続（同じリクエストを再投すれば良い）を区別する。

**代替案**:
- 案 P: 全部 200 で `backfill.status` だけで判別。HTTP semantic を弱めるためダウンストリームの監視 / retry 機構と相性悪。MINOR。
- 案 Q: 202 ではなく 503 で retry 指示。意味論ねじれ（クライアント / インフラエラーと混同）。NG。

### 判断 4: large-scale measurement plan（base case）

| 計測軸 | fixture | 手順 |
| --- | --- | --- |
| 規模 | 10,000 行 / 50,000 行 / 100,000 行 の `response_fields`（`__extra__:Q###` 分布、`deleted_members` JOIN を 5% 含む） | scripts で生成し `scripts/cf.sh d1 execute` で staging 投入 |
| 計測値 | dryRun 応答時間 / apply 応答時間 / batch 数 / 1 batch あたり UPDATE 行数 / Workers CPU time / retry 回数 / `backfill.status` 推移 | curl で apply を `retryable=true` の間繰り返し、各回の wallclock + response body を Phase 11 evidence に記録 |
| batch サイズ | 初期 500 行 / batch、CPU 時間で動的調整可能な余地（実測後に Phase 11 で結論） | workflow 内で `BACKFILL_BATCH_SIZE` 定数化 |
| 判断分岐 | 100,000 行で 3 回以下の retry に収束: PASS / 5 回以上 or `failed` 多発: queue / cron 分割を follow-up 起票 | Phase 10 ゲートで判定 |

## 成果物別の中身詳細

### outputs/phase-02/db-constraint-design.md

- partial UNIQUE index DDL（上記 SQL）と migration 順序
- 既存衝突検出 SQL（migration 適用前に重複確定 stableKey が存在しないか検証）:
  ```sql
  SELECT revision_id, stable_key, COUNT(*) AS dup_count
  FROM schema_questions
  WHERE stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '__extra__:%'
  GROUP BY revision_id, stable_key
  HAVING COUNT(*) > 1;
  ```
- 衝突検出時の rollback 手順（手動マージ / `audit_log` に経緯記録 / 該当 alias の `unknown` 戻し）
- migration ファイル命名（次番号、例: `apps/api/migrations/00NN_schema_questions_partial_unique.sql`）
- UT-04 と本 migration の順序関係（本 migration は単独適用可。UT-04 schema 変更との衝突なし）

### outputs/phase-02/resumable-backfill-design.md

- `schema_diff_queue` への `backfill_cursor TEXT NULL` / `backfill_status TEXT NULL` カラム追加 migration
- back-fill workflow の擬似コード:
  ```ts
  // Stage 2 entry: 既存キューから cursor を取得し、残件のみ処理
  while (cpuTimeBudgetRemaining()) {
    const updated = await db.run(
      `UPDATE response_fields SET key = ?
       WHERE key = ? AND id > ? AND member_id NOT IN (SELECT id FROM deleted_members)
       ORDER BY id LIMIT ?`,
      [newStableKey, `__extra__:${questionId}`, cursor, BATCH_SIZE]
    );
    cursor = lastId(updated);
    if (updated.changes === 0) { mark('completed'); break; }
  }
  if (cursor !== completed) mark('exhausted');
  ```
- idempotent 性証明（`id > cursor` により同じ行の二重 UPDATE は発生しない）
- retry シナリオ表（初回 / 2 回目 / 3 回目で `cursor` がどう進むか）

### outputs/phase-02/retryable-contract-design.md

- 上記 HTTP contract 表の拡張版
- `aiworkflow-requirements/references/api-endpoints.md` への差分スニペット
- route test 観点列挙（200 / 202 in_progress / 202 exhausted / 409 / 422）

### outputs/phase-02/large-scale-measurement-plan.md

- fixture 生成 script の入出力定義（Node script / wrangler d1 execute）
- 実測表テンプレート（行数 × retry 回数 × CPU 時間）
- 結果に応じた分岐判断（queue / cron 分離 follow-up 起票条件）

## Schema / 共有コード Ownership 宣言

| 物理位置 | ownership | reader | writer |
| --- | --- | --- | --- |
| `apps/api/migrations/00NN_schema_questions_partial_unique.sql`（新規） | UT-07B 本タスク | apps/api（runner） | UT-07B のみ |
| `apps/api/migrations/00NN_schema_diff_queue_backfill_cursor.sql`（新規） | UT-07B 本タスク | apps/api（runner） | UT-07B のみ |
| `apps/api/src/repository/schemaQuestions.ts`（pre-check ロジック維持 + 二段防御コメント追記） | UT-07B（本タスクで更新） | apps/api workflow | UT-07B のみ |
| `apps/api/src/workflows/schemaAliasAssign.ts`（Stage 1 / Stage 2 分離） | UT-07B（本タスクで更新） | apps/api route | UT-07B のみ |
| `apps/api/src/routes/admin/schema.ts`（202 / retryable 応答） | UT-07B（本タスクで更新） | admin UI client | UT-07B のみ |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | aiworkflow-requirements（本タスクで同期更新） | 全 task spec | 同期 PR で本タスクが更新 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | aiworkflow-requirements（本タスクで同期更新） | 全 task spec | 同期 PR で本タスクが更新 |

## 仕様語 ↔ 実装語対応表

| 仕様語 | TS 実装語 | SQL リテラル |
| --- | --- | --- |
| backfill_status: pending | `'pending'` | `'pending'` |
| backfill_status: in_progress | `'in_progress'` | `'in_progress'` |
| backfill_status: completed | `'completed'` | `'completed'` |
| backfill_status: exhausted | `'exhausted'` | `'exhausted'` |
| backfill_status: failed | `'failed'` | `'failed'` |
| failure code: backfill_cpu_budget_exhausted | `'backfill_cpu_budget_exhausted'` | - |
| failure code: stable_key_collision | `'stable_key_collision'` | - |

## 実行タスク

1. `outputs/phase-02/db-constraint-design.md` を作成し、partial UNIQUE index DDL / 既存衝突検出 SQL / rollback 手順 / migration 順序を確定する（完了条件: DDL + 検出 SQL + rollback 手順 + UT-04 順序関係が表で確定）。
2. `outputs/phase-02/resumable-backfill-design.md` を作成し、`backfill_cursor` / `backfill_status` カラム追加 + workflow 擬似コード + idempotent 性証明 + retry シナリオ表を記述する（完了条件: cursor 進行表 + 二重 UPDATE 不発生証明）。
3. `outputs/phase-02/retryable-contract-design.md` を作成し、HTTP status / response body / failure code を確定する（完了条件: 200 / 202 in_progress / 202 exhausted / 409 / 422 の 5 ケースが network log レベルで定義）。
4. `outputs/phase-02/large-scale-measurement-plan.md` を作成し、fixture 生成 script + 計測表テンプレート + 分岐判断条件を記述する（完了条件: 10,000 / 50,000 / 100,000 行の手順 + 分離 follow-up 起票条件）。
5. Schema / 共有コード Ownership 宣言を `db-constraint-design.md` 末尾に含める。
6. 仕様語 ↔ 実装語対応表を `retryable-contract-design.md` に含める。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-01.md | 真の論点 / 苦戦箇所 / 既存差分前提 |
| 必須 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 起票仕様（背景 / リスク / AC） |
| 必須 | docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md | 実 DB と仕様書差分の吸収根拠 |
| 必須 | apps/api/migrations/*.sql | 既存物理スキーマ（Read のみ） |
| 必須 | apps/api/src/repository/schemaQuestions.ts | 既存 pre-check 実装（更新対象） |
| 必須 | apps/api/src/workflows/schemaAliasAssign.ts | 既存 workflow 実装（Stage 1 / Stage 2 分離対象） |
| 必須 | apps/api/src/routes/admin/schema.ts | route 実装（retryable 応答追加対象） |
| 参考 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API contract 同期更新対象 |
| 参考 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 同期更新対象 |

## 完了条件チェックリスト

- [ ] partial UNIQUE index DDL が `db-constraint-design.md` に記述（既存衝突検出 SQL + rollback 手順含む）
- [ ] `backfill_cursor` / `backfill_status` 設計と idempotent 性証明が `resumable-backfill-design.md` に存在
- [ ] HTTP 200 / 202 in_progress / 202 exhausted / 409 / 422 の 5 ケースが `retryable-contract-design.md` で確定
- [ ] 10,000 / 50,000 / 100,000 行の measurement plan + 分岐判断が `large-scale-measurement-plan.md` に記述
- [ ] Schema / 共有コード Ownership 宣言が含まれる
- [ ] 仕様語 ↔ 実装語対応表が含まれる
- [ ] 不変条件 #5 への影響方針が明示
- [ ] 代替案が DB constraint / 責務分離 / HTTP contract 各軸で 2 案以上比較

## 多角的チェック観点

- **代替案網羅**: DB constraint は 全行 UNIQUE / partial / trigger / app pre-check のみ の 4 案比較。責務分離は 単一 transaction / Stage 分離 / Queue 移譲 の 3 案比較。HTTP contract は 200 一本化 / 202 + retryable / 503 retry の 3 案比較。
- **不変条件 #5**: migration / repository / workflow / route すべて apps/api 内で完結する設計。
- **2 段階 migration 順序**: 衝突検出 SQL → 衝突解消（手動マージ） → partial UNIQUE index 適用 の順序が固定されているか。
- **idempotent 性**: back-fill 再実行で同じ行を二重 UPDATE しないことが cursor 進行表で証明されているか。
- **大規模実測の判断分岐**: queue / cron 分離を本タスクで実装するか follow-up 起票するかの条件が明示されているか。
- **`__extra__:<questionId>` / `unknown` の取り扱い**: partial UNIQUE で除外され、暫定状態の自由度を保てているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `db-constraint-design.md` 起草 | 2 | pending | partial UNIQUE + 衝突検出 SQL + rollback |
| 2 | `resumable-backfill-design.md` 起草 | 2 | pending | cursor + status + 擬似コード + idempotent 証明 |
| 3 | `retryable-contract-design.md` 起草 | 2 | pending | 5 ケース HTTP contract |
| 4 | `large-scale-measurement-plan.md` 起草 | 2 | pending | fixture + 計測表 + 分岐条件 |
| 5 | 代替案比較（DB constraint / 責務分離 / HTTP contract） | 2 | pending | Phase 3 入力 |
| 6 | 不変条件 #5 への影響方針記述 | 2 | pending | apps/api 境界 |
| 7 | UT-04 との migration 順序関係明示 | 2 | pending | 単独適用可の前提 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/db-constraint-design.md | partial UNIQUE index DDL / 既存衝突検出 SQL / rollback / migration 順序 / Ownership 宣言 |
| ドキュメント | outputs/phase-02/resumable-backfill-design.md | `backfill_cursor` / `backfill_status` 設計 / workflow 擬似コード / idempotent 証明 / retry シナリオ |
| ドキュメント | outputs/phase-02/retryable-contract-design.md | HTTP 5 ケース contract / failure code / 仕様語実装語対応表 |
| ドキュメント | outputs/phase-02/large-scale-measurement-plan.md | fixture 生成 script / 計測表テンプレート / 分岐判断条件 |
| メタ | artifacts.json | Phase 2 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- 全成果物 4 ファイルが `outputs/phase-02/` 配下に配置済み
- 代替案比較が DB constraint / 責務分離 / HTTP contract 各軸で 2 案以上
- 不変条件 #5 を侵さない設計
- artifacts.json の `phases[1].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート）
- 引き継ぎ事項:
  - DB constraint base case = partial UNIQUE index + 既存衝突検出 SQL + rollback
  - 責務分離 base case = Stage 1（alias 確定 / 即時 commit）+ Stage 2（back-fill / cursor 管理 / 再開可能）
  - HTTP contract base case = 200 / 202 in_progress / 202 exhausted / 409 / 422 の 5 ケース
  - measurement plan = 10,000 / 50,000 / 100,000 行 fixture + queue / cron 分離 follow-up 条件
  - 不変条件 #5 への影響方針
- ブロック条件:
  - 代替案比較が 2 案未満の軸が存在
  - rollback 手順が migration 適用前検出 SQL を欠く
  - idempotent 証明が cursor 進行表で示されていない
  - 大規模実測の分岐判断条件が曖昧

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration test に接続する。
- D1 物理制約、`schema_aliases` write target、back-fill retry、NON_VISUAL evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
