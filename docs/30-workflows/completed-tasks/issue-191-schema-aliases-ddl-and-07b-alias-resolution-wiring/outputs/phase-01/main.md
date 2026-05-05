# Phase 1 出力: 要件定義（issue-191）

## 状態

- workflow_state: `spec_created`（docs_only）
- visualEvidence: `NON_VISUAL`
- GitHub Issue: #191（CLOSED のまま運用）

## true issue（真の論点）

03a sync は live schema を D1 に同期し未解決 question を `schema_diff_queue` に積むが、07b（alias assignment workflow）が解決済 alias を書き込む正本テーブルが存在しない。代替案として 07b が `schema_questions.stable_key` を直接 UPDATE する path は以下の構造問題を抱える。

- 03a の冪等性破壊: 次回 sync 上書きで alias が消える可能性
- 出自追跡不可: 誰がいつどの diff queue 行から確定したか記録できない
- 不変条件 #1 逸脱: schema 値のコード結合を強める

→ 解決策: alias 正本テーブル `schema_aliases` を新設し、03a 側 lookup fallback で構造的に分離する。

## scope

| 区分 | 内容 |
| --- | --- |
| in | `schema_aliases` D1 マイグレーション、`schemaAliasesRepository` 契約、07b 書き込み先切替、03a lookup fallback |
| out | 03a sync 本体ロジック改修、07b 管理 UI 画面、自動 alias 推定、`schema_questions` DDL 大改修、`apps/web` からの D1 直接アクセス |

## 依存境界

| 境界 | 内容 |
| --- | --- |
| 上流（読む） | `schema_diff_queue` 未解決行、`schema_questions.question_id` |
| 下流（書く） | 07b → `schema_aliases` INSERT、03a 次回 sync で READ |
| 触らない | `schema_questions` DDL（fallback 用に `stable_key` カラムは保持） |
| 触らない | `apps/web` からの D1 直接アクセス（不変条件 #5） |

## Schema / 共有コード Ownership

| 対象 | Ownership |
| --- | --- |
| `schema_aliases` テーブル DDL | 本タスク（issue-191） |
| `schemaAliasesRepository`（apps/api） | 本タスク |
| 03a 側 fallback lookup ロジック | 本タスク（read 経路追加のみ） |
| 07b 側書き込み先切替 | 本タスク（書き込み先 path 変更のみ） |
| `schema_questions.stable_key` | 03a 既存所有のまま、DDL 変更なし |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 03a/07b 双方の冪等性と出自追跡を成立 |
| 実現性 | PASS | DDL 1 本 + repository 1 個 + 配線 patch |
| 整合性 | PASS | 不変条件 #1/#5/#14 を維持し、03a AC-3 を構造的に支える |
| 運用性 | PASS-MINOR | 移行期間の二重 source は lookup 順序固定で吸収（要文書化） |

## AC（quantitative）

- AC-1: `schema_aliases` DDL マイグレーションが `apps/api/migrations/` に存在し、`bash scripts/cf.sh d1 migrations apply <db> --local` で apply 成功
- AC-2: staging migration plan に DDL が反映され、`bash scripts/cf.sh d1 migrations list <db> --env staging` で `not applied` 検出可能（apply runbook を Phase 12 に記録）
- AC-3: `schemaAliasesRepository` の lookup / insert / update 3 関数の契約テストが `apps/api/test/` に存在し `pnpm --filter @ubm/api test` で green
- AC-4: 07b alias 解決 path が `schema_questions` 直接 UPDATE を含まない（リポジトリ全体への `rg "UPDATE\s+schema_questions\s+SET\s+stable_key"` が 0 件）
- AC-5: 03a 次回 sync で対象 question の `schema_diff_queue.status` が `unresolved → resolved` に遷移し unresolved 件数が事前比 1 件以上減少（fixture E2E で計測）
- AC-6: `schema_aliases` に該当行が無い question は従来通り `schema_questions.stable_key` の値が利用される（fallback 動作テストで検証）

## 移行期間 lookup 順序ルール

```
resolveStableKey(questionId):
  1. schema_aliases.lookup(questionId) → hit なら採用（source: aliases）
  2. schema_questions.findStableKeyById(questionId) → hit なら採用（source: questions_fallback）
  3. miss → null（caller が schema_diff_queue に unresolved enqueue）
```

両方 hit 時は **aliases を優先**。移行終端条件は Phase 12 にて「fallback 廃止予告」を記載。

## 不変条件適合

- #1: alias を専用テーブルに分離、コード側に stableKey を直書きしない
- #5: 全 repository / migration / type が `apps/api/` 配下に閉じる
- #14: 書き込み経路は既存契約互換の `POST /admin/schema/aliases` に集約（07b 専用）

## 参照

- index.md / artifacts.json
- docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md
- docs/30-workflows/02-application-implementation/07b-parallel-schema-diff-alias-assignment-workflow/

## 次 Phase（2: 設計）への引き渡し

- 確定事項: scope in/out、AC quantitative、`schema_aliases` カラム要件、lookup 順序ルール、Ownership
- open question: 移行期間の終端条件（fallback 廃止タイミング）→ Phase 12 で運用判断
