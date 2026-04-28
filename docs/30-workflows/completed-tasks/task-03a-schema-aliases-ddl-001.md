# task-03a-schema-aliases-ddl-001

## Metadata

| Field | Value |
| --- | --- |
| Source | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Status | unassigned |
| Priority | High |
| Owner candidate | 07b-parallel-schema-diff-alias-assignment-workflow |

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | task-03a-schema-aliases-ddl-001 |
| タスク名     | schema_aliases テーブル DDL の整備と 07b への引き渡し |
| 分類         | 要件（req） |
| 対象機能     | D1 schema / alias resolution |
| 優先度       | 高 |
| 見積もり規模 | 中規模 |
| ステータス   | 未実施 |
| 発見元       | Phase 12（unassigned-task-detection） |
| 発見日       | 2026-04-28 |

## Problem

03a can preserve a known `stable_key` by reading previous `schema_questions.question_id`, but the dedicated `schema_aliases` table assumed by the alias assignment workflow is not present in current D1 migrations.

## Required Work

- Add a D1 migration for `schema_aliases`.
- Add repository contract tests for alias lookup / insert / update.
- Wire 07b alias resolution to write the alias source of truth.
- Keep 03a compatible with existing `schema_questions` fallback during migration.

## Acceptance Criteria

- `schema_aliases` exists in local D1 setup and staging migration plan.
- 07b can resolve an unresolved diff into a stableKey without editing historical `schema_questions` rows directly.
- 03a next sync reduces queued unresolved rows for the resolved question.

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03a は schema sync 時に `schema_questions.question_id` を fallback として stableKey を保全しているが、本来 alias 解決の正本となるべき `schema_aliases` テーブルが D1 migrations に存在しない。07b（alias assignment workflow）はこのテーブルが存在する前提で設計されている。

### 1.2 問題点・課題

- `schema_aliases` 不在のため、07b が unresolved diff を stableKey に解決した結果を保存する正規の場所がない。
- 暫定で `schema_questions` 行を直接書き換えると履歴が破壊される。

### 1.3 放置した場合の影響

- 07b 実装着手時に migration 衝突が発生する。
- alias 履歴を保持できず、再同期で stableKey が揺らぐリスク。

## 2. 何を達成するか（What）

### 2.1 目的

`schema_aliases` を D1 の正本テーブルとして導入し、07b が破壊的編集なしに alias 解決結果を保存できるようにする。

### 2.2 最終ゴール

03a の sync が `schema_aliases` を参照してもなお既存 `schema_questions` fallback と整合しつつ、07b が alias 解決を append できる状態。

### 2.3 スコープ

- 含む: D1 migration、repository contract tests、03a 側の参照経路追加（fallback 互換）
- 含まない: 07b の UI 実装、過去 response の back-fill（07b スコープ）

### 2.4 成果物

- `apps/api` 配下の新規 D1 migration（`schema_aliases`）
- repository contract tests（lookup / insert / update）
- 03a sync の `schema_aliases` 優先参照ロジック

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03a 完了済み（本タスクで合意済み）
- 07b 設計案が確定していること

### 3.2 依存タスク

- 03a-parallel-forms-schema-sync-and-stablekey-alias-queue（完了）

### 3.3 必要な知識

- Cloudflare D1 migrations 運用
- `apps/api` の repository 層と vitest 契約テスト

### 3.4 推奨アプローチ

新規 migration を最小列（`question_id`, `stable_key`, `resolved_at`, `resolved_by`）で追加 → repository を実装 → 03a の参照順を `schema_aliases` → `schema_questions` の優先順に変更。

## 4. 実行手順

1. `schema_aliases` の DDL を migration に追加。
2. repository インターフェースに lookup/insert/update を追加し、契約テストを追加。
3. 03a の stableKey 解決経路を `schema_aliases` 優先に変更。
4. staging migration plan に追記。

## 5. 完了条件チェックリスト

- [ ] `schema_aliases` 含む migration が local D1 と staging plan に存在
- [ ] repository contract tests が PASS
- [ ] 03a sync で resolved 行が unresolved queue から減少することを確認
- [ ] 07b が `schema_questions` を直接編集せず alias 解決を保存できる

## 6. 検証方法

- `pnpm --filter @apps/api test` で contract tests PASS
- 03a sync を local で再実行し queue 件数の減少を確認

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| migration 衝突 | 中 | 中 | 07b 着手前に本タスクを完了 |
| fallback 経路の二重実装 | 中 | 中 | 03a 側で feature flag 化し段階移行 |

## 8. 参照情報

- `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md`（Part 2 アーキテクチャ）

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 03a 実装中、`schema_aliases` 前提のコードが書けず、`schema_questions.question_id` を fallback として再利用する設計に倒した。 |
| 原因 | alias の正本テーブルが migration に存在せず、07b 設計と 03a 実装のタイミングがずれていた。 |
| 対応 | 03a は fallback で完結させ、本未タスクとして 07b 引き継ぎ事項を明示。 |
| 再発防止 | 並列 wave で共有テーブルを使う場合、index.md の dependency matrix に「共有モジュール / テーブル owner」列を入れて先に owner を確定する（skill-feedback 3.1）。 |

### 補足事項

- skill-feedback-report 3.1 と整合。
- 元 detection 行: `unassigned-task-detection.md` 表 1 行目。
