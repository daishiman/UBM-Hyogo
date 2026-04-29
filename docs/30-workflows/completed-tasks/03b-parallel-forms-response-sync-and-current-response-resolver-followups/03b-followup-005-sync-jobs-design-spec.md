# sync_jobs job_type enum と metrics_json schema を `_design/sync-jobs-spec.md` に集約 - タスク指示書

## メタ情報

```yaml
issue_number: TBD
```


## メタ情報

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | 03b-followup-005-sync-jobs-design-spec                                                     |
| タスク名     | sync_jobs job_type enum と metrics_json schema を `_design/sync-jobs-spec.md` に集約       |
| 分類         | 仕様整備                                                                                   |
| 対象機能     | 03a / 03b 共有 sync ledger（`sync_jobs` テーブル）の正本仕様                               |
| 優先度       | 中                                                                                         |
| 見積もり規模 | 中規模                                                                                     |
| ステータス   | 未実施                                                                                     |
| 発見元       | 03b Phase 12                                                                               |
| 発見日       | 2026-04-28                                                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`sync_jobs` テーブルは Google Forms の schema sync（03a）と response sync（03b）の双方が共通で使う ledger である。`job_type` 列の enum、`metrics_json` 列の schema、ロック制御（`lock_acquired_at` ベースの 10 分 TTL）は 03a / 03b の両 task spec で個別に定義されており、タスクごとに微妙に違う形で扱われている。

### 1.2 問題点・課題

- 03a と 03b の task spec で `job_type` enum が独立して列挙されており、新しい sync wave を追加するたびに両方を同期更新する必要がある
- `metrics_json` の schema が 03b 実装では `cursor` 中心、03a 想定では `write_count` 中心と統一できておらず、observability（メトリクス基盤）に乗せる際の構造が揃わない
- lock TTL が「03b で 10 分」と決まっているが、03a 側でも同値であることを保証する正本が存在しない
- spec ドリフトが発生すると、ledger に書き込まれる JSON が job_type 別に異なる形になり、ダッシュボード／リカバリ runbook 側で破綻する

### 1.3 放置した場合の影響

- 並列 wave で job_type を増やすたびに 03a / 03b 両方の task spec を編集する必要があり、片方更新漏れで enum 不整合が発生する
- `metrics_json` に書く key が job ごとに揺れ、メトリクス集計・モニタリングが ad-hoc になる
- lock TTL の値が分散すると、03a が 5 分・03b が 10 分のような不整合になり、stuck lock のリカバリ手順が組めない

---

## 2. 何を達成するか（What）

### 2.1 目的

`sync_jobs` テーブルの正本仕様を `docs/30-workflows/_design/sync-jobs-spec.md` に集約し、03a / 03b の各 task spec はそこを差分参照のみで進められる状態にする。

### 2.2 最終ゴール

- `_design/sync-jobs-spec.md` が `job_type` enum / `metrics_json` schema / lock TTL の正本になっている
- 03a / 03b の task spec が `_design/sync-jobs-spec.md` を参照する記述だけを持ち、定義の重複が解消されている
- `apps/api/src/jobs/sync-forms-responses.ts` の実装が `_design/sync-jobs-spec.md` の schema と一致している
- `database-schema.md` の `sync_jobs` 節も `_design/sync-jobs-spec.md` を参照する形に更新されている

### 2.3 スコープ

#### 含むもの

- `docs/30-workflows/_design/sync-jobs-spec.md` の新規作成
- `job_type` enum の正本一覧（少なくとも `forms_response_sync` / `forms_schema_sync`）
- `metrics_json` の zod または JSON Schema 定義（`cursor` / `processed_count` / `write_count` / `error_count` / `lock_acquired_at` 等）
- lock TTL（10 分）の正本明記
- 03a / 03b 既存 task spec への差分参照リンク追加
- `database-schema.md` の `sync_jobs` 節からの参照リンク追加

#### 含まないもの

- `sync_jobs` テーブルの DDL 変更（既存スキーマ準拠）
- D1 マイグレーションの新規追加
- 既存実装コードのリファクタ（schema と現状実装の差分が出た場合は別タスク化）
- observability（メトリクス可視化）基盤そのものの構築

### 2.4 成果物

- `docs/30-workflows/_design/sync-jobs-spec.md`
- 03a / 03b task spec の差分参照差分
- `database-schema.md` の参照差分
- schema と現状実装の差分一覧（あれば別タスクへ分離）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03b Phase 12 の `unassigned-task-detection.md` #7 / `skill-feedback-report.md` 1.4 節で `_design/` 化の方針が確定している
- `apps/api/src/jobs/sync-forms-responses.ts` が 03b 実装値（lock TTL 10 分、`metrics_json.cursor` の high-water mark 仕様）の根拠として参照可能

### 3.2 依存タスク

- 03b マージ済み（`sync-forms-responses.ts` の現状値を正本に取り込むため）
- 03a 取り込み（schema sync の job_type と metrics 形を確定するため、可能なら同時、不可なら 03a 側を後追い差分で取り込む）

### 3.3 必要な知識

- D1 / SQLite における JSON 列の運用
- zod または JSON Schema の記述法
- Cloudflare Workers Cron Triggers における ledger ベースのロック設計
- 03b の `sync_jobs` ledger 利用箇所（`apps/api/src/jobs/sync-forms-responses.ts`）

### 3.4 推奨アプローチ

`_design/sync-jobs-spec.md` には以下を含める。

1. `job_type` enum 一覧（テーブル形式・値・用途・追加時の更新先一覧）
2. `metrics_json` の共通 schema（zod 推奨。`@repo/shared` 配下の既存 zod 表現に合わせる）
3. job_type 別の `metrics_json` 拡張 schema（例: `forms_response_sync` は `cursor` 必須、`forms_schema_sync` は `write_count` 必須など）
4. lock 制御（`lock_acquired_at` 基準・TTL 10 分・stuck 時の取り扱い）
5. 各 sync task spec からの参照ルール（`_design/sync-jobs-spec.md` を差分参照のみで使う旨）

---

## 4. 実行手順

### Phase構成

1. 既存定義の棚卸し
2. `_design/sync-jobs-spec.md` の初版作成
3. 03a / 03b task spec への参照差し替え
4. database-schema.md との整合確認

### Phase 1: 既存定義の棚卸し

#### 目的

03a / 03b の task spec と実装に散在する `job_type` / `metrics_json` / lock TTL の現行値を全件抽出する。

#### 手順

1. `rg "sync_jobs" docs/30-workflows .claude/skills` で参照箇所列挙
2. `apps/api/src/jobs/sync-forms-responses.ts` の現行値を抽出
3. 03a 側 task spec（schema sync）の想定値を抽出
4. 差分一覧を作成

#### 成果物

`job_type` / `metrics_json` / lock TTL の現行差分一覧

#### 完了条件

03a / 03b / 実装の3面で差分が把握できている

### Phase 2: `_design/sync-jobs-spec.md` の初版作成

#### 目的

正本仕様を 1 ファイルに集約する。

#### 手順

1. `docs/30-workflows/_design/sync-jobs-spec.md` を新規作成
2. `job_type` enum を表形式で列挙（`forms_response_sync` / `forms_schema_sync` 等）
3. `metrics_json` の共通 schema を zod で定義（`cursor` / `processed_count` / `write_count` / `error_count` / `lock_acquired_at` 等）
4. job_type 別の拡張 schema を併記
5. lock TTL を 10 分と明記し、`lock_acquired_at` の運用ルールを記述

#### 成果物

`_design/sync-jobs-spec.md`

#### 完了条件

03a / 03b 双方の sync 仕様が同ファイルから読める

### Phase 3: 03a / 03b task spec への参照差し替え

#### 目的

各 task spec を `_design/` への差分参照に置き換える。

#### 手順

1. 03b の task spec から `job_type` / `metrics_json` / lock TTL の重複定義を削除
2. 03a 側 task spec も同様に差し替え（取り込み済みの場合）
3. 各 spec に「正本は `_design/sync-jobs-spec.md`」のリンクを追加

#### 成果物

03a / 03b task spec の差分

#### 完了条件

定義の重複がなく、各 task spec から `_design/` を辿って正本に到達できる

### Phase 4: database-schema.md との整合確認

#### 目的

`.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節を `_design/` 参照に更新する。

#### 手順

1. `database-schema.md` の `sync_jobs` 節を確認
2. `metrics_json` 説明を `_design/sync-jobs-spec.md` を参照する形に書き換え
3. `pnpm indexes:rebuild` を実行し indexes drift を解消

#### 成果物

`database-schema.md` の差分と indexes 再生成結果

#### 完了条件

CI の `verify-indexes-up-to-date` gate が通る

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `docs/30-workflows/_design/sync-jobs-spec.md` が存在する
- [ ] `job_type` enum 正本一覧が記載されている
- [ ] `metrics_json` schema（zod or JSON Schema）が記載されている
- [ ] lock TTL（10 分）が正本として記載されている
- [ ] 03a / 03b task spec が `_design/` を参照する形に置き換わっている

### 品質要件

- [ ] schema と現状実装（`sync-forms-responses.ts`）の値が一致している
- [ ] `mise exec -- pnpm indexes:rebuild` 成功
- [ ] `verify-indexes-up-to-date` CI gate が通る

### ドキュメント要件

- [ ] `database-schema.md` の `sync_jobs` 節から `_design/sync-jobs-spec.md` への参照が張られている
- [ ] 各 task spec の重複定義が削除されている

---

## 6. 検証方法

### テストケース

- `_design/sync-jobs-spec.md` に記載された `metrics_json` schema が、`sync-forms-responses.ts` で書き込まれる JSON を validate できる
- `job_type` enum が 03a / 03b の各実装で参照されている値と一致する

### 検証手順

```bash
rg -n "job_type|metrics_json" docs/30-workflows .claude/skills apps/api/src/jobs
mise exec -- pnpm indexes:rebuild
mise exec -- pnpm typecheck
```

---

## 7. リスクと対策

| リスク                                                         | 影響度 | 発生確率 | 対策                                                                              |
| -------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------- |
| 03a 取り込み前に `_design/` を切ると schema が 03b 寄りになる  | 中     | 中       | 03a 想定値も Phase 1 で抽出し、両 wave 中立な共通 schema にする                   |
| 既存実装と schema が乖離                                       | 高     | 中       | Phase 1 で差分一覧を作り、乖離が出た場合は別 follow-up タスクとして分離           |
| `metrics_json` に PII を入れる実装が混入                       | 高     | 低       | `_design/` 内で「PII を含めない」を不変条件として明示                             |
| lock TTL の値変更が `_design/` と実装で同期しない              | 中     | 低       | `_design/` を正本とし、実装側コメントから `_design/` への参照リンクを張る         |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` #7
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/skill-feedback-report.md` 1.4 節
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`（`sync_jobs` 節）
- `apps/api/src/jobs/sync-forms-responses.ts`
- `apps/api/src/jobs/sync-lock.ts`
- `apps/api/src/jobs/cursor-store.ts`

### 参考資料

- 03b 実装での lock TTL 正本値（10 分）
- `metrics_json.cursor` の `submittedAt|responseId` high-water mark 仕様（`database-schema.md` L58）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 03a / 03b の task spec で `job_type` enum と `metrics_json` schema が独立して定義されており、enum を増やすたびに両 spec を同期更新する必要があった                                |
| 原因     | sync 系の正本仕様を集約する `_design/` 配下のファイルが存在せず、各 task spec が個別に定義していた                                                                                |
| 対応     | 03b 実装中は `metrics_json.cursor` 最小形でとりあえず通したが、03a 側の `write_count` 表現と統一できておらず、observability 設計に支障が出ると判断し follow-up タスクとして識別 |
| 再発防止 | `_design/sync-jobs-spec.md` を正本にし、各 sync task spec はそこを差分参照のみで使うルールを 03b Phase 12 `skill-feedback-report.md` 1.4 節で記録                                 |

### レビュー指摘の原文（該当する場合）

```
03b Phase 12 unassigned-task-detection.md #7:
sync_jobs `job_type` enum / `metrics_json` schema の集約 → 03a / 03b 共同 spec（`_design/` 配下）
並列 wave で job_type を増やすたびに整合性が崩れるリスク

skill-feedback-report.md 1.4 節:
現状: 03a / 03b ともに `sync_jobs` を使うが、`job_type` enum / `metrics_json` schema / lock TTL を各タスクが微妙に違う形で扱う。
提案: `_design/sync-jobs-spec.md` を切り、`job_type` enum, `metrics_json schema (zod or JSON Schema)`, lock TTL の正本を共有する。
```

### 補足事項

- 引き取り候補は 03a / 03b 共有 spec、配置先は `docs/30-workflows/_design/sync-jobs-spec.md`
- 03a 取り込み完了直後に着手するのが、schema を中立に保ちつつ最小コストで集約できるタイミング
- `metrics_json` には PII を含めない不変条件を `_design/` 側で明文化すること
