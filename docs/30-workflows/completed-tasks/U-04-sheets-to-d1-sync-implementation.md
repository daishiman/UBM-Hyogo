# U-04 Sheets → D1 sync implementation formalize - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | U-04                                                                |
| タスク名     | Sheets → D1 sync implementation formalize                           |
| 分類         | 改善 / 実装                                                         |
| 対象機能     | `apps/api/src/sync/*` / manual endpoint / scheduled handler / audit writer |
| 優先度       | 高 (HIGH)                                                           |
| 見積もり規模 | 中規模                                                              |
| ステータス   | 完了（`docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/` Phase 1-12 completed / Phase 13 pending） |
| 発見元       | Phase 12 / unassigned-task-detection.md (U-04)                      |
| 発見日       | 2026-04-23                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

タスク `03-serial-data-source-and-storage-contract` は contract-only / docs-only としてスコープを閉じた。Sheets を正本受付、D1 を canonical 台帳とする sync flow（manual / scheduled / backfill 三系統）の契約は確定しているが、実体実装は未着手である。

### 1.2 問題点・課題

- `apps/api/src/sync/*` 配下の sync 実装が必要だった（u-04 で完了）。
- manual endpoint（運用者トリガ）、scheduled handler（Cron 起動）、audit writer（論理 `sync_audit`、物理 `sync_job_logs` への記録）の各実装が必要だった。
- 本タスクで対応すると docs-only contract task の境界を超えるため、後続実装タスクとして切り出す必要がある。

### 1.3 放置した場合の影響

- downstream タスク `04-serial-cicd-secrets-and-environment-sync` および `05b-parallel-smoke-readiness-and-handoff` が依存実装を持たないまま smoke readiness に進めない。
- contract と実装の drift が発生し、`sync_audit` の運用観測が立ち上がらない。

---

## 2. 何を達成するか（What）

### 2.1 目的

Sheets → D1 sync の 3 系統（manual / scheduled / backfill）を `apps/api` 上に実装し、契約済み D1 schema (`member_responses` / `member_identities` / `member_status` / `sync_audit`) に整合する形で運用可能な状態にする。

### 2.2 最終ゴール

- manual endpoint が Cloudflare Workers の Hono ルートとして配備済み。
- scheduled handler が Cron Trigger として登録済み。
- audit writer が全 sync 実行で論理 `sync_audit`（物理 `sync_job_logs`）レコードを必ず書く。
- Phase 02 の `outputs/phase-02/data-contract.md` / `outputs/phase-02/sync-flow.md` と実装の差分ゼロ。

### 2.3 スコープ

#### 含むもの

- `apps/api/src/sync/*` の実装（manual / scheduled / backfill ハンドラ）
- audit writer 実装と `sync_audit` への書き込み
- 失敗時のリトライ / バックオフポリシー実装

#### 含まないもの

- D1 migration SQL の作成（U-05 で対応）
- observability metrics の本番チューニング（U-02 / 05a で対応）

### 2.4 成果物

- `apps/api/src/sync/manual.ts`
- `apps/api/src/sync/scheduled.ts`
- `apps/api/src/sync/backfill.ts`
- `apps/api/src/sync/audit.ts`
- 単体テストおよび契約テスト

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Phase 02 contract（data-contract.md / sync-flow.md）が確定済み。
- Phase 05 の D1 bootstrap runbook が利用可能。
- U-05（D1 migration SQL 実体作成）が完了し D1 binding が利用可能。

### 3.2 依存タスク

- U-05 (D1 migration SQL 実体作成)
- 04-serial-cicd-secrets-and-environment-sync（secrets 配置）

### 3.3 必要な知識

- Cloudflare Workers / Hono / D1 binding
- Google Forms API / Sheets 連携
- Cron Triggers

### 3.4 推奨アプローチ

1. audit writer を最初に実装し、全 sync 経路から呼び出し可能にする。
2. manual endpoint → scheduled handler → backfill の順で薄く実装。
3. 各経路で contract test を `outputs/phase-02/data-contract.md` に対して実行。

---

## 4. 完了条件

- [ ] `apps/api/src/sync/*` の 4 ファイルが配備されている
- [ ] manual endpoint / scheduled handler / backfill の 3 系統が動作する
- [ ] 全経路で `sync_audit` への書き込みが行われる
- [ ] Phase 02 契約との差分ゼロが contract test で証明されている
- [ ] downstream タスク 05b の smoke readiness に渡せる状態になっている

---

## 5. 関連仕様書リンク

- `doc/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md`
- `doc/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md`
- `doc/03-serial-data-source-and-storage-contract/outputs/phase-05/d1-bootstrap-runbook.md`
- `doc/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md` (U-04 出典)
- `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`

---

## 6. 引き継ぎ先

`04-serial-cicd-secrets-and-environment-sync` および `05b-parallel-smoke-readiness-and-handoff` の前段に配置される実装タスクとして切り出す。
