# U-05 D1 migration SQL 実体作成 - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | U-05                                                                |
| タスク名     | D1 migration SQL 実体作成                                           |
| 分類         | 改善 / 実装                                                         |
| 対象機能     | `apps/api/migrations/0001_init.sql`                                 |
| 優先度       | 中 (MEDIUM)                                                         |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | Phase 12 / unassigned-task-detection.md (U-05)                      |
| 発見日       | 2026-04-23                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

タスク `03-serial-data-source-and-storage-contract` で D1 migration の契約（テーブル `member_responses` / `member_identities` / `member_status` / `sync_audit` の DDL 仕様）を確定したが、`apps/api/migrations/0001_init.sql` 自体は未作成である。

### 1.2 問題点・課題

- migration SQL が存在しないため、D1 を実 environment（staging / production）に適用できない。
- DB 適用タイミングは Cloudflare 権限と secrets 配置（04-cicd-secrets）と連動するため、本 contract task のスコープでは実装できない。

### 1.3 放置した場合の影響

- downstream で D1 binding を使う実装（U-04 含む）が起動できない。
- staging deploy の smoke readiness（05b）に到達できない。

---

## 2. 何を達成するか（What）

### 2.1 目的

Phase 05 で contract 化した D1 schema を `apps/api/migrations/0001_init.sql` として実体化し、`wrangler d1 migrations apply` で staging / production に適用可能な状態にする。

### 2.2 最終ゴール

- `apps/api/migrations/0001_init.sql` が配備されている。
- staging D1 への適用が成功する。
- Phase 05 の `outputs/phase-05/d1-bootstrap-runbook.md` の手順がそのまま実行できる。

### 2.3 スコープ

#### 含むもの

- `member_responses` / `member_identities` / `member_status` / `sync_audit` の DDL 実装
- インデックス / 制約の実装
- migration 適用手順への追記

#### 含まないもの

- sync 実装（U-04）
- 本番権限・secrets 配置（04-cicd-secrets）

### 2.4 成果物

- `apps/api/migrations/0001_init.sql`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Phase 05 D1 bootstrap runbook が確定済み。
- Cloudflare account / D1 binding が利用可能。

### 3.2 依存タスク

- 04-serial-cicd-secrets-and-environment-sync（D1 binding と secrets 配置）

### 3.3 必要な知識

- Cloudflare D1 / wrangler d1 migrations
- SQLite DDL（D1 は SQLite ベース）

### 3.4 推奨アプローチ

1. Phase 05 runbook の DDL 仕様をそのまま `0001_init.sql` に転記。
2. `wrangler d1 migrations apply --local` でローカル検証。
3. staging へ適用、`wrangler d1 execute` でテーブル存在確認。

---

## 4. 完了条件

- [ ] `apps/api/migrations/0001_init.sql` が配備されている
- [ ] 4 テーブル（`member_responses` / `member_identities` / `member_status` / `sync_audit`）が DDL 通りに作成される
- [ ] staging D1 への migration 適用が成功する
- [ ] Phase 05 runbook と差分ゼロ

---

## 5. 関連仕様書リンク

- `doc/03-serial-data-source-and-storage-contract/outputs/phase-05/d1-bootstrap-runbook.md`
- `doc/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md`
- `doc/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md` (U-05 出典)
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md`

---

## 6. 引き継ぎ先

`04-serial-cicd-secrets-and-environment-sync` の実装タスクとして取り込む。U-04 の前提タスク。
