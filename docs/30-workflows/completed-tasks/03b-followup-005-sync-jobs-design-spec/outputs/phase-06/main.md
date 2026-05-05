# Phase 6: `_design/sync-jobs-spec.md` 初版作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 6 / 13 |
| Phase 名称 | `_design/sync-jobs-spec.md` 初版作成 |
| 作成日 | 2026-05-02 |
| 前 Phase | 5 (既存定義棚卸し) |
| 次 Phase | 7 (03a / 03b task spec の参照差し替え) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #198（CLOSED, クローズドのまま docs 整備） |

## 目的

Phase 5 で抽出した 3 面差分マトリクスを基に、`docs/30-workflows/_design/sync-jobs-spec.md` を **`sync_jobs` の正本仕様**として新規作成する。03a / 03b の双方が中立に参照できる形で、`job_type` enum / `metrics_json` schema / lock TTL / 不変条件を 1 ファイルに集約する。

> **注**: 本 Phase 仕様書は `_design/sync-jobs-spec.md` の作成方針のみを定義する。実体ファイルは本タスク Phase 6 実行時に作成する。

## 実行タスク

1. `docs/30-workflows/_design/sync-jobs-spec.md` の章立てを確定
2. `job_type` enum 正本一覧（表形式）を執筆
3. `metrics_json` 共通 schema（zod 例 + 必須 / 任意）を執筆
4. job_type 別 metrics 拡張 schema を執筆
5. lock 制御（TTL 10 分・stuck 時の取り扱い）を執筆
6. 不変条件（PII 不可 / DDL 不変 / マイグレーション追加なし）を執筆
7. 各 sync task spec / database-schema.md からの参照ルールを執筆

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/inventory-matrix.md | 3 面差分マトリクス |
| 必須 | outputs/phase-05/impl-values.md | 実装側の正本値（特に lock TTL 10 分 / cursor 形式） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | 実装一致確認 |

## 実行手順（ステップ別）

### ステップ 1: 章立ての確定

`docs/30-workflows/_design/sync-jobs-spec.md` を以下 9 章構成で作成する:

| 章 | 章タイトル | 内容 |
| --- | --- | --- |
| 1 | 概要 / スコープ / 適用範囲 | 03a / 03b 共通 ledger としての位置付け、本ドキュメントが正本である宣言 |
| 2 | `job_type` enum 正本一覧 | 表形式（値 / 用途 / 担当 wave / 追加時の更新先） |
| 3 | `metrics_json` 共通 schema | zod 例 + 必須 / 任意 key 一覧 |
| 4 | job_type 別 metrics 拡張 schema | `response_sync` は `cursor` 必須 / `schema_sync` は `write_count` 必須 |
| 5 | lock 制御 | `lock_acquired_at` 基準 / TTL 10 分 / stuck 時の取り扱い |
| 6 | 不変条件 | PII 不可 / DDL 不変 / マイグレーション追加なし |
| 7 | 参照ルール | 各 sync task spec / database-schema.md からの参照方針 |
| 8 | 更新時チェックリスト | enum 追加 / metrics 拡張時の更新先 |
| 9 | 変更履歴 | 日付 / 変更内容 / 根拠 task |

### ステップ 2: `job_type` enum 正本一覧

最低限以下を含む:

| `job_type` 値 | 用途 | 担当 wave | 追加時に更新するファイル |
| --- | --- | --- | --- |
| `response_sync` | Google Forms 回答同期 | 03b | `_design/sync-jobs-spec.md` + 各 sync task spec |
| `schema_sync` | Google Forms schema 同期 | 03a | 同上 |

### ステップ 3: `metrics_json` 共通 schema

zod 表現の例（`@repo/shared` 命名規約に準拠）:

```ts
const metricsJsonBaseSchema = z.object({
  cursor: z.string().optional(),
  processed_count: z.number().int().nonnegative().optional(),
  write_count: z.number().int().nonnegative().optional(),
  error_count: z.number().int().nonnegative().optional(),
  lock_acquired_at: z.string().datetime().optional(),
}).strict();
```

### ステップ 4: job_type 別拡張 schema

| `job_type` | 代表 key | 説明 |
| --- | --- | --- |
| `response_sync` | `cursor?: string` | `submittedAt\|responseId` の high-water mark。skipped / failed / running の `{}` 互換を維持するため optional |
| `schema_sync` | `write_count?: number` | schema 反映件数 |

### ステップ 5: lock 制御

- `lock_acquired_at` を `sync_jobs` 行に書き込む
- TTL は **10 分**（実装値正本）
- stuck 検出: `lock_acquired_at` が現在時刻から TTL を超過した行は再取得対象
- 強制解除手順は `_design/sync-jobs-spec.md` 内に節を切って明記

### ステップ 6: 不変条件

1. `metrics_json` に PII（メール / 氏名 / Forms 回答本文等）を含めない
2. `sync_jobs` テーブルの DDL は本タスクで変更しない
3. D1 マイグレーションを本タスクで追加しない

### ステップ 7: 参照ルール

- 各 sync task spec は本ファイルを「正本」として 1 行リンクで参照する
- 重複定義は禁止（`job_type` enum や lock TTL を task spec 側に再記述しない）
- `database-schema.md` の `sync_jobs` 節も同様に本ファイル参照に置き換える

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | docs/30-workflows/_design/sync-jobs-spec.md | 正本仕様（本 Phase で新規作成） |
| ドキュメント | outputs/phase-06/main.md | 作成方針・章ごとの根拠リンク |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] `docs/30-workflows/_design/sync-jobs-spec.md` が新規作成されている
- [ ] 7 章構成すべてが埋まっている
- [ ] `job_type` enum 表に最低 2 値（`response_sync` / `schema_sync`）が記載されている
- [ ] `metrics_json` 共通 / 拡張 schema が両方記述されている
- [ ] lock TTL = 10 分が明記されている
- [ ] 不変条件 3 件が明記されている
- [ ] 03a / 03b 双方の sync 仕様が同ファイルから読める

## DoD（implementation / NON_VISUAL）

- ファイル `docs/30-workflows/_design/sync-jobs-spec.md` 存在
- 内部リンク有効（`database-schema.md` / `apps/api/src/jobs/...` 等への相対参照）
- indexes drift なし（`_design/` 配下は indexes 対象外、または rebuild 後差分なし）

## 次 Phase

- 次: 7 (03a / 03b task spec の参照差し替え)
- 引き継ぎ事項: `_design/sync-jobs-spec.md` の正本パス、参照ルール
- ブロック条件: 章のいずれかが空 / job_type 表に重複や欠落 / lock TTL 値が impl と不一致
