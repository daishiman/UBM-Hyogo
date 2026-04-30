# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | reconciliation |
| 実行種別 | docs-only（serial。方針統一のための reconciliation 設計） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | docs-only / direction-reconciliation（コード実装は伴わない方針決定タスク） |

## 目的

`task-sync-forms-d1-legacy-umbrella-001` で確定した「旧 UT-09 を direct implementation にせず Forms API 分割方針へ寄せる」current 方針と、本ワークツリーに追加された Sheets API 直接実装の二重正本を解消するための「真の論点」を確定させる。reconciliation の設計フェーズ（Phase 2）が選択肢 A / B の比較表・撤回 / 移植マッピング・5 点同期チェックの定義を一意に決められる入力を作る。本タスクは **docs-only**（仕様書のみ）であり、コード変更・migration 撤回・PR 作成は含まない。

## 真の論点 (true issue)

- 「どちらの方針を採るか」ではなく、「**code / spec / 未タスク / aiworkflow-requirements 正本を 1 つの方向へ揃える reconciliation を、PR 化前に決定可能な形で文書化する**」ことが本質。
- 副次的論点：
  - **二重正本の解消**: legacy umbrella spec（A）と Sheets 直接実装（B）の両方が同時に「正本」として参照されており、後続 03a / 03b / 04c / 09b の判断が分岐する。
  - **二重 ledger**: `sync_jobs`（current）と `sync_locks` + `sync_job_logs`（旧 UT-09 系）の D1 migration が並存すると、admin endpoint と cron handler の正本が不安定化する。
  - **endpoint 認可境界の競合**: `/admin/sync` 単一 endpoint と `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint の認可仕様が分岐する。
  - **Secret 名の競合**: `GOOGLE_SHEETS_SA_JSON` と `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` の正本がどちらかに統一されていない。
  - **D1 contention mitigation 知見の保存**: 旧 UT-09 系で蓄積された retry/backoff・短い transaction・batch-size 制限の知見を、A 採用時に失わないよう 03a / 03b / 09b へ移植する手順が必要。
- 推奨方針は選択肢 A（current Forms 分割方針へ寄せる）。理由は current facts と後続タスク整合を優先するため。Sheets 採用（B）は legacy umbrella と 03a / 03b / 04c / 09b を same-wave 更新する代償が大きく、ユーザー承認が前提。

## Schema / 共有コード Ownership 宣言（v2026.04.29 追加）

reconciliation を構造的に再発防止するため、以下を Phase 1 で固定する。

| 対象 | Owner（採用方針共通） | 配置先 | 染み出し禁止先 |
| --- | --- | --- | --- |
| Forms schema 定義 | Forms 分割方針タスク（03a / 03b） | `apps/api/src/sync/forms-mapper.ts`（採用 A 時）相当 | `worker.ts` / `index.ts` / `apps/web` |
| Sheets schema 定義 | Sheets 採用方針タスク（旧 UT-09 系。採用 B 時のみ有効） | `apps/api/src/sync/mapper.ts` の `COL` 定数 | `worker.ts` / `index.ts` |
| admin endpoint 命名 | 04c-parallel-admin-backoffice-api-endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 重複登録禁止 |
| D1 ledger schema | UT-04 / UT-22 | `database-schema.md` の `sync_jobs` / `sync_locks` + `sync_job_logs` | 重複定義禁止 |
| `runSync` 共通関数 | 採用方針の代表 application_implementation タスク | `apps/api/src/sync/worker.ts` | scheduled / manual の重複実装禁止 |

> Ownership が衝突した時点で reconciliation タスクを起票する運用とする。本タスクはその第 1 号。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | current 方針（旧 UT-09 を direct implementation にしない / Forms API 分割 / `sync_jobs` ledger / 2 endpoint） | reconciliation 結論で current を維持するか更新するかを決定 |
| 上流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | Forms schema sync 正本 | A 採用時は無変更、B 採用時は same-wave 更新対象 |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | Forms response sync 正本 | A 採用時は無変更、B 採用時は same-wave 更新対象 |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | admin endpoint 契約 | endpoint 数 / 認可境界の整合確認軸 |
| 上流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | cron / runbook 正本 | scheduled handler の呼び出し対象（A: schema + responses 2 経路 / B: 単一 sync）の整合確認軸 |
| 並列 | ut-09-sheets-to-d1-cron-sync-job | 撤回 or 採用の対象 root | A 採用時 = legacy umbrella 参照に戻す / B 採用時 = direct implementation 化 |
| 並列 | ut-21-sheets-d1-sync-endpoint-and-audit-implementation | 同様に blocked。本タスクの結論を共有 | 結論を Phase 9 同期チェックで参照 |
| 下流 | UT-26 staging-deploy-smoke | reconciliation 完了後の実機 smoke 証跡 | 採用方針に基づく smoke シナリオを引き継ぐ |
| 下流 | aiworkflow-requirements references | api-endpoints / database-schema / deployment-secrets-management の同期 | reconciliation 結論を反映する別タスクへ引き継ぐ |

## 価値とコスト

- 価値: 二重正本を 1 つに統一することで、PR 化後の 03a / 03b / 04c / 09b の判断面が安定化し、後続タスクが誤った contract を参照しなくなる。stale 仕様 / stale 実装 / stale ledger の同時存在を構造的に解消する。
- コスト: 仕様書作成のみ（docs-only）。コード撤回・migration 削除・PR 作成は別タスク化するため、本タスク自身は中規模の文書作業に収まる。
- 機会コスト: reconciliation を行わずに PR 化すると、03a / 03b / 04c / 09b の正本が壊れ、後続タスクが連鎖的に blocked 化する。本タスク完了が PR 経路の必須前提。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 二重正本解消により後続 4 タスク（03a / 03b / 04c / 09b）の判断面が安定化し、stale contract の誤参照を構造的に防げる |
| 実現性 | PASS | docs-only でコード変更を伴わない。原典 spec（213 行）と参照 5 文書から reconciliation 設計が一意に導ける |
| 整合性 | PASS | 不変条件 #1（schema を mapper に閉じる）/ #4（admin-managed data 専用テーブル分離）/ #5（D1 access は apps/api 内）/ #6（GAS prototype を本番昇格しない）すべてに適合する設計を Phase 2 で固定する |
| 運用性 | PASS | 推奨 A 採用時は current 方針維持で運用変更なし。Sheets 採用 B 時はユーザー承認を前提とする運用ルールを Phase 3 で明記する |

## 既存契約・命名規則の確認

Phase 2 設計の前に、現状の正本と実装差分を確認すること。

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| current 方針 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | Forms API 分割 / 2 endpoint / `sync_jobs` ledger |
| 旧 UT-09 root | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | A 採用時は legacy umbrella 参照に戻す / B 採用時は direct implementation 化 |
| api-endpoints 正本 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/admin/sync*` の現行登録内容を確認し、reconciliation 結論との差分を Phase 2 でマッピング |
| database-schema 正本 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_jobs` / `sync_locks` / `sync_job_logs` のどれが正本登録されているか確認 |
| deployment-secrets-management 正本 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | `GOOGLE_SHEETS_SA_JSON` / `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` のどちらが正本登録されているか確認 |

## 実行タスク

1. 原典 spec（task-ut09-direction-reconciliation-001.md・213 行）の全章を Phase 1 へ写経・整理する（背景・問題点・影響・選択肢 A/B・スコープ・成果物・依存・苦戦箇所 8 件）。
2. 真の論点を「**code / spec / 未タスク / 正本を 1 方向へ揃える reconciliation の文書化**」に再定義する。
3. 依存境界（上流 5 / 並列 2 / 下流 2）を「採用方針別の影響」付きで記述する。
4. 4条件評価を全 PASS で固定し、根拠を「current facts 整合 / docs-only / 不変条件 4 件 / 推奨 A 維持で運用変更なし」で記述する。
5. Schema / 共有コード Ownership 宣言（v2026.04.29 追加）を 5 対象で固定し、Phase 2 設計入力に渡す。
6. 既存契約・命名規則チェックリスト 5 観点を Phase 2 への引き渡しとして固定する。
7. AC-1〜AC-14 を index.md と差分ゼロで揃える。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md | 原典 unassigned-task spec |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本 |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | Forms schema sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | Forms response sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | admin endpoint 正本 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 撤回 or 採用の対象 root |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 命名・認可境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | ledger 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Service Account secret 名規約 |
| 必須 | CLAUDE.md | 不変条件 #1/#4/#5/#6・solo 運用ポリシー |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-01.md | 同様に blocked 化した先行事例 |

## 実行手順

### ステップ 1: 上流前提の確認（要件レビュー思考法 系統①）

- 原典 spec（task-ut09-direction-reconciliation-001.md）213 行を全文読む。
- task-sync-forms-d1-legacy-umbrella-001 / 03a / 03b / 04c / 09b の index.md / spec を読み、current の正本記述を抽出する。
- aiworkflow-requirements references の `api-endpoints.md` / `database-schema.md` / `environment-variables.md / deployment-cloudflare.md` の現行登録を抽出する。
- 上流不足があれば Phase 2 へ進まず原典 spec の依存表を更新する。

### ステップ 2: 真の論点と reconciliation 範囲の確定（要件レビュー思考法 系統②）

- 「どちらの方針を採るか」ではなく「reconciliation を docs-only で文書化する」ことが本質である旨を `outputs/phase-01/main.md` 冒頭に明記。
- reconciliation 対象 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）と reconciliation 影響範囲（コード / migration / Secret / Cron schedule / runbook）を一覧化する。

### ステップ 3: Schema / 共有コード Ownership 宣言の固定（要件レビュー思考法 系統③）

- 5 対象（Forms schema / Sheets schema / admin endpoint / D1 ledger / `runSync` 共通関数）の Owner を表形式で固定する。
- Ownership 衝突時に reconciliation タスクを起票する運用ルールを明記する。

### ステップ 4: 4条件評価と AC のロック

- 4条件すべてが PASS で固定されていることを確認する。
- AC-1〜AC-14 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる。

### ステップ 5: 命名規則と secrets 規約の引き渡し

- aiworkflow-requirements references の現行登録を Phase 2 で再確認するチェックリストとして main.md に書き出す。
- 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 固定形式であることを再掲する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・Ownership 宣言・依存境界・4条件・命名規則チェックリストを設計入力として渡す |
| Phase 3 | 4条件評価の根拠を代替案 PASS/MINOR/MAJOR 判定の比較軸に再利用 |
| Phase 4 | AC-1〜AC-14 をテスト戦略のトレース対象に渡す（特に 5 点同期チェック / 4条件） |
| Phase 7 | AC matrix の左軸として AC-1〜AC-14 を使用 |
| Phase 9 | 5 点同期チェックの起点 |
| Phase 10 | 4条件最終判定の起点として再評価 |

## 多角的チェック観点（AIが判断）

- 不変条件 #1: Forms / Sheets schema を mapper.ts / schema 定義に閉じる宣言が含まれるか。
- 不変条件 #4: `sync_jobs` / `sync_locks` / `sync_job_logs` / audit / outbox が admin-managed data 専用テーブルとして分離されているか。
- 不変条件 #5: D1 binding が `apps/api/src` 内のみで、`apps/web` から直接呼ぶ設計が含まれていないか。
- 不変条件 #6: 旧 UT-09 系の Sheets 直接実装を GAS prototype の延長として本番昇格させていないか（採用 B 時はこの条件と矛盾しないか別途検証する）。
- 二重正本: legacy umbrella と Sheets 直接実装の両方を「正本」と表現する箇所が残っていないか。
- 二重 ledger: `sync_jobs` と `sync_locks` + `sync_job_logs` を同時採用していないか。
- endpoint 認可: `/admin/sync` 単一 vs `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint の認可境界が 04c と矛盾していないか。
- Secret hygiene: `GOOGLE_SHEETS_SA_JSON` と `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` のどちらが正本かを採用方針に応じて一意化しているか。
- 運用ルール: staging smoke pending を PASS と誤記しない、unrelated verification-report を本 PR に混ぜないルールが含まれるか。
- docs-only 境界: コード変更・migration 撤回・PR 作成を本タスクに含めない原則が記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「reconciliation の文書化」に再定義 | 1 | spec_created | main.md 冒頭に記載 |
| 2 | 依存境界（上流 5・並列 2・下流 2）の固定 | 1 | spec_created | 採用方針別の影響を付与 |
| 3 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | Schema / 共有コード Ownership 宣言 5 対象固定 | 1 | spec_created | v2026.04.29 追加 |
| 5 | 既存契約・命名規則チェック 5 観点 | 1 | spec_created | Phase 2 入力 |
| 6 | AC-1〜AC-14 の確定 | 1 | spec_created | index.md と完全一致 |
| 7 | 苦戦箇所 7 件（原典 8 件 + Ownership 宣言）を AC / 多角的チェックへマッピング | 1 | spec_created | 再発防止軸 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件評価・true issue・Ownership 宣言・依存境界） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件

Acceptance Criteria for this Phase:

- [ ] 真の論点が「reconciliation の docs-only 文書化」に再定義されている
- [ ] 4条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 5 / 並列 2 / 下流 2 すべてが採用方針別の影響付きで記述されている
- [ ] Schema / 共有コード Ownership 宣言が 5 対象で固定されている
- [ ] AC-1〜AC-14 が index.md と完全一致している
- [ ] 既存契約・命名規則チェック項目が 5 観点で固定されている
- [ ] 不変条件 #1/#4/#5/#6 のいずれにも違反しない範囲で要件が定義されている
- [ ] docs-only 境界（コード変更・migration 撤回・PR 作成を含めない）が記述されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 原典 spec の苦戦箇所 8 件すべてが AC または多角的チェックに対応
- 異常系（二重正本 / 二重 ledger / endpoint 競合 / Secret 名競合 / D1 contention 知見喪失 / staging pending 誤記 / unrelated verification-report 混入）の論点が要件レベルで提示されている
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = reconciliation の docs-only 文書化
  - 4条件評価 (全 PASS) の根拠
  - Schema / 共有コード Ownership 宣言（5 対象）
  - 既存契約・命名規則チェック 5 観点
  - 推奨方針 = A（current Forms 分割方針へ寄せる）。B 採用時はユーザー承認前提
  - 5 文書同期チェック対象（legacy umbrella / 03a / 03b / 04c / 09b）
  - 1Password 参照形式 `op://Employee/ubm-hyogo-env/<FIELD>` の再掲
- ブロック条件:
  - 原典 spec / 5 参照文書のいずれかが未読
  - 4条件のいずれかが MINOR/MAJOR
  - AC-1〜AC-14 が index.md と乖離
  - Ownership 宣言が 5 対象未満
