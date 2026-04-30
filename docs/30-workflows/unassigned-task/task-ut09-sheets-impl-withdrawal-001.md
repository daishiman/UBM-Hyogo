# UT-09 Sheets 実装撤回 PR - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-ut09-sheets-impl-withdrawal-001 |
| タスク名 | Sheets 実装撤回 PR |
| 分類 | 撤回（コード削除） |
| 対象機能 | Sheets to D1 sync（撤回対象） |
| 優先度 | 高（次 wave） |
| 見積もり規模 | 小〜中規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 direction reconciliation（B-01） |
| 発見日 | 2026-04-29 |
| 種別 | 実作業（コード削除） |
| 推奨対応 | reconciliation の base case = 案 a（現行 Forms 分割方針）に従い撤回 |
| 関連 blocker | B-01 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-ut09-direction-reconciliation-001` により、UT-09 の同期方針を選択肢 A（現行 Forms 分割方針）へ統一することが決定された。これは `task-sync-forms-d1-legacy-umbrella-001` が定める「旧 UT-09 を direct implementation にしない」方針に準拠する。

一方、別ワークツリーで追加された以下の実装は Google Sheets API v4 / 単一 `POST /admin/sync` を前提とし、Forms 分割方針と直接衝突している。

- `apps/api/src/jobs/sync-sheets-to-d1.ts` 系（Sheets API 呼び出し・行 upsert ロジック）
- `apps/api/src/routes/admin/sync.ts`（単一 endpoint）

### 1.2 問題点・課題

上記の stale 実装をそのまま PR に含めると次の問題が発生する。

- `POST /admin/sync` と `POST /admin/sync/schema` / `POST /admin/sync/responses`（04c 正本）の認可境界が競合する
- `sync_locks` / `sync_job_logs` テーブルと現行 `sync_jobs` の二重 ledger が残存する
- aiworkflow-requirements 正本（`api-endpoints.md` / `database-schema.md`）に stale Sheets 契約が登録されるリスクがある
- 後続タスク（03a / 03b / 04c / 09b）が誤った API contract を参照する

### 1.3 放置した場合の影響

- Forms API 前提で設計された current response / consent snapshot ロジックと、Sheets 行 upsert ロジックが同一コードベースに混在し、責務境界が崩壊する
- `sync_locks` / `sync_job_logs` migration が残存したまま B-02（migration 撤回）をブロックし続ける
- stale Secrets 参照（`GOOGLE_SHEETS_SA_JSON` 等）が正本仕様に残り、後続 Secret 棚卸しを汚染する

---

## 2. 何を達成するか（What）

### 2.1 目的

Sheets API 実装・単一 `/admin/sync` endpoint・関連ファイルを PR 前に完全に削除し、コードベースを現行 Forms 分割方針（案 a）と一致させる。

### 2.2 最終ゴール

| 確認項目 | 期待状態 |
| --- | --- |
| `sync-sheets-to-d1.ts` 系ファイル | 削除済み |
| `apps/api/src/routes/admin/sync.ts`（単一 endpoint） | 削除済み |
| `api-endpoints.md` の Sheets 系記述 | 撤回済み・Forms 分割方針に整合 |
| `database-schema.md` の `sync_locks` / `sync_job_logs` 記述 | 撤回済み（`sync_jobs` に統一） |
| `deployment-cloudflare.md` の Sheets 系 Secret 参照 | 撤回済み |
| `environment-variables.md` の Sheets 系変数 | 撤回済み |
| stale 参照（ripgrep） | 0 件 |
| typecheck | PASS |
| api テスト | PASS |

### 2.3 スコープ

#### 含むもの

- `apps/api/src/jobs/sync-sheets-to-d1.ts` 系ファイルの削除
- `apps/api/src/routes/admin/sync.ts`（単一 endpoint 版）の削除
- 上記ファイルを import・参照するコードの削除または置換
- aiworkflow-requirements 正本仕様（`api-endpoints.md` / `database-schema.md` / `deployment-cloudflare.md` / `environment-variables.md`）の Sheets 系 stale 記述の撤回
- typecheck / api テスト / ripgrep 検証の実施

#### 含まないもの

- commit、push、PR 作成
- `sync_locks` / `sync_job_logs` の D1 migration 撤回（B-02 で別途実施）
- B-10（runtime kill-switch）の実装（先行完了が前提）
- 03a / 03b / 04c / 09b の新規実装（別タスクで扱う）
- staging 実機 smoke（UT-26 で扱う）

### 2.4 成果物

- stale ファイルを削除したコード差分
- aiworkflow-requirements 正本の Sheets 系撤回差分
- ripgrep ゼロ件確認ログ
- typecheck / api テスト PASS 確認ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- B-10（runtime kill-switch）が完了していること
- B-02（`sync_locks` / `sync_job_logs` migration 撤回）と同 wave で連動実施すること
- `task-ut09-direction-reconciliation-001` の方針決定（案 a 採用）が記録されていること
- `task-sync-forms-d1-legacy-umbrella-001` を読み、current facts を確認していること

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | B-10 runtime kill-switch | kill-switch 経由で Sheets 実装を無効化してから削除する |
| 上流（必須） | task-ut09-direction-reconciliation-001 | 撤回方針（案 a）の確定 |
| 同 wave（連動） | B-02 migration 撤回 | `sync_locks` / `sync_job_logs` を同 wave で撤回 |
| 下流 | 03a / 03b / 04c / 09b | Forms 分割方針による正式実装 |
| 下流 | UT-26 staging-deploy-smoke | 撤回後の実機 smoke 証跡 |

### 3.3 必要な知識

- Cloudflare Workers の module graph（未使用 import も typecheck 対象）
- D1 migration の apply / rollback フロー
- aiworkflow-requirements references の正本更新ルール
- ripgrep による stale 参照検出方法

### 3.4 推奨アプローチ

1. 削除対象ファイルを列挙してから一括削除する（部分削除だと import エラーが残る）
2. 削除後すぐに typecheck を実行し、未解消の依存関係を確認する
3. 正本仕様の撤回は削除コードと同一 PR に含める（stale 仕様が後続タスクに見えないようにする）

---

## 4. 実行手順

### Phase 1: 削除対象の列挙

1. `git status` / `git diff` で追加済みの Sheets 系ファイルを確認する。
2. `rg -rn "sync-sheets-to-d1\|GOOGLE_SHEETS_SA_JSON\|sync_locks\|sync_job_logs\|/admin/sync" apps/api/src` で参照箇所を列挙する。
3. 削除対象ファイル・修正対象行を一覧化する。

### Phase 2: コード削除

1. `apps/api/src/jobs/sync-sheets-to-d1.ts` 系ファイルを削除する。
2. `apps/api/src/routes/admin/sync.ts`（単一 endpoint 版）を削除する。
3. 上記を import・register するコード（`apps/api/src/index.ts` 等）から該当行を除去する。

### Phase 3: typecheck / テスト確認

1. `pnpm --filter @ubm-hyogo/api typecheck` を実行し PASS を確認する。
2. `pnpm test apps/api/src` を実行し PASS を確認する。

### Phase 4: stale 参照の ripgrep 検証

1. `rg -n "sync-sheets-to-d1\|GOOGLE_SHEETS_SA_JSON\|/admin/sync[^/]" apps .claude/skills/aiworkflow-requirements/references` を実行し 0 件を確認する。
2. 残存があればすべて除去または置換してから再実行する。

### Phase 5: 正本仕様の撤回

1. `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` から `POST /admin/sync`（単一 endpoint 版）の記述を撤回し、Forms 分割方針（`/admin/sync/schema` / `/admin/sync/responses`）に整合した記述に更新する。
2. `.claude/skills/aiworkflow-requirements/references/database-schema.md` から `sync_locks` / `sync_job_logs` の記述を撤回し、`sync_jobs` に統一した記述に更新する。
3. `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` から Sheets 系 Secret 参照（`GOOGLE_SHEETS_SA_JSON` 等）を撤回する。
4. `.claude/skills/aiworkflow-requirements/references/environment-variables.md` から Sheets 系変数を撤回する。

### Phase 6: index 再生成

1. `pnpm indexes:rebuild` を実行し、topic-map への stale エントリが消えていることを確認する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/api/src/jobs/sync-sheets-to-d1.ts` 系ファイルが削除されている
- [ ] `apps/api/src/routes/admin/sync.ts`（単一 endpoint 版）が削除されている
- [ ] 削除ファイルへの import 参照がコードに残っていない
- [ ] API endpoint 契約が 04c（Forms 分割方針）と矛盾していない

### 品質要件

- [ ] `pnpm --filter @ubm-hyogo/api typecheck` が PASS
- [ ] `pnpm test apps/api/src` が PASS
- [ ] `rg -n "sync-sheets-to-d1\|GOOGLE_SHEETS_SA_JSON\|/admin/sync[^/]"` が 0 件

### ドキュメント要件

- [ ] `api-endpoints.md` の `POST /admin/sync`（単一版）が撤回され Forms 分割方針に整合している
- [ ] `database-schema.md` の `sync_locks` / `sync_job_logs` が撤回され `sync_jobs` に統一されている
- [ ] `deployment-cloudflare.md` の Sheets 系 Secret 参照が撤回されている
- [ ] `environment-variables.md` の Sheets 系変数が撤回されている
- [ ] `pnpm indexes:rebuild` 後の topic-map に stale Sheets エントリが残っていない

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| ファイル削除確認 | `git status` で Sheets 系ファイルが deleted 表示 | 削除済み |
| stale 参照スキャン | `rg -n "sync-sheets-to-d1\|GOOGLE_SHEETS_SA_JSON\|/admin/sync[^/]" apps .claude/skills/aiworkflow-requirements/references` | 0 件 |
| endpoint 整合確認 | `api-endpoints.md` を目視確認 | `POST /admin/sync`（単一版）が存在しない |
| D1 schema 整合確認 | `database-schema.md` を目視確認 | `sync_locks` / `sync_job_logs` が存在しない |
| typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| api テスト | `pnpm test apps/api/src` | PASS |
| index 整合確認 | `pnpm indexes:rebuild` 後の topic-map | Sheets 系エントリなし |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| Sheets 系コードが import graph 経由で残存し typecheck が通らない | 高 | 中 | Phase 2 削除後すぐに typecheck を実行し、残存依存を追跡する |
| 正本仕様の撤回が不完全で後続タスクが stale contract を参照する | 高 | 中 | ripgrep を references 対象に含め、Phase 5 後に再スキャンする |
| B-02 migration 撤回と連動せず `sync_locks` / `sync_job_logs` が D1 に残る | 中 | 中 | 同 wave で B-02 を必ず実施し、migration 撤回を完了条件に含める |
| B-10（kill-switch）未完了のまま削除を進め production で参照エラーが発生する | 高 | 低 | B-10 完了を本タスクの前提条件として明記し、kill-switch 無効化後に削除着手する |
| D1 contention mitigation の知見が一緒に失われる | 中 | 低 | retry/backoff / short transaction / batch-size 制限の知見を 03a / 03b / 09b へ移植メモとして残す |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | 方針決定（案 a 採用）の根拠 |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | current facts の起点 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 撤回対象の正本仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 撤回対象の正本仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 撤回対象の正本仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 撤回対象の正本仕様 |
| 参考 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | 撤回後の正式実装方針 |
| 参考 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | admin endpoint 正本（案 a 整合先） |
| 参考 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | cron runbook 正本 |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | 別ワークツリーで Sheets API 実装（`sync-sheets-to-d1.ts` / 単一 `/admin/sync`）を進めてしまい、Forms 分割方針（legacy umbrella タスク）と衝突した。Phase 12 review の 30 種思考法で衝突を検出するまで表面化しなかった |
| 原因 | `task-sync-forms-d1-legacy-umbrella-001` で旧 UT-09 を legacy umbrella として閉じる方針を定めたにもかかわらず、その current facts を確認せずに旧 UT-09 の Sheets API 直接実装を着手してしまった |
| 対応 | Phase 12 review の 30 種思考法で衝突を検出し、PR blocker（B-01）として formalize。`task-ut09-direction-reconciliation-001` で案 a（Forms 分割方針）への統一を決定し、本タスクを撤回実作業として分離した |
| 再発防止 | 実装開始前に `task-sync-forms-d1-legacy-umbrella-001` と aiworkflow-requirements の current facts を照合し、legacy umbrella タスクに該当しないかを確認する。特に新規 job ファイル・endpoint ファイルを作成する際は、04c / 03a / 03b / 09b の正本 index で責務が重複しないか事前チェックを必須化する |

### 作業ログ

- 2026-04-29: UT-09 Phase 12 direction reconciliation で B-01 として formalize。task-ut09-sheets-impl-withdrawal-001 を未タスクとして起票。

### 補足事項

- 本タスクはコード削除と正本仕様撤回が目的であり、commit / push / PR 作成は含まない。
- B-02（`sync_locks` / `sync_job_logs` migration 撤回）と同 wave での実施を強く推奨する（分離すると一時的に schema と実装が不整合になる）。
- B-10（runtime kill-switch）完了後に着手することで、production 環境での削除リスクを最小化する。
- D1 contention mitigation の知見（retry/backoff・short transaction・batch-size 制限）は削除前に 03a / 03b / 09b への移植メモを作成すること。
