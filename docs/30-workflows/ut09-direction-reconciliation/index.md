# ut09-direction-reconciliation - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ut09-direction-reconciliation-001 |
| タスク名 | UT-09 direction reconciliation（Forms vs Sheets 同期方針統一） |
| ディレクトリ | docs/30-workflows/ut09-direction-reconciliation |
| Wave | reconciliation（PR blocker 解消） |
| 実行種別 | docs-only（serial。03a / 03b / 04c / 09b の正本仕様と現実装の衝突解消が目的） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created（reconciliation 仕様は作成済み。runtime/code の二重正本解消は B-01〜B-10 が未完了のため blocked_context として継続） |
| タスク種別 | docs-only / direction-reconciliation / NON_VISUAL（仕様書・方針決定メモのみ。コード実装は伴わない） |
| taskType | docs-only |
| docsOnly | true |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | あり（task-sync-forms-d1-legacy-umbrella-001 の current 方針へ揃えるか、09b / 04c / 03a / 03b を Sheets 方針へ揃え直すかの reconciliation） |
| 組み込み先 | docs/30-workflows/02-application-implementation/{03a,03b,04c}/, docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/, docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/ |
| GitHub Issue | #94 (CLOSED — ユーザー指示によりクローズドのままタスク仕様書化) |
| 検出元 | UT-09 Phase 12 review（30種思考法）— Sheets API 直接実装と Forms 分割方針の衝突を PR blocker として formalize |

## 正本語彙

この workflow では、以下を正本語彙として全 Phase で固定する。Phase 本文に異なる表現が出た場合は、この表を優先して修正する。

| 項目 | 正本 |
| --- | --- |
| current 方針 (A) | Forms 分割方針: `forms.get` / `forms.responses.list` を上流とし、`POST /admin/sync/schema` / `POST /admin/sync/responses` の 2 endpoint と `sync_jobs` ledger に責務分割（task-sync-forms-d1-legacy-umbrella-001 起点） |
| 競合方針 (B) | Sheets 直接実装方針: Google Sheets API v4 を上流とし、単一 `POST /admin/sync` と `sync_locks` / `sync_job_logs` の 2 ledger を採用（旧 ut-09-sheets-to-d1-cron-sync-job 系・本ワークツリーで `apps/api` に追加された実装） |
| reconciliation 結論 | 推奨 = 選択肢 A（current Forms 分割方針へ寄せる）。Sheets 採用は legacy umbrella と 03a/03b/04c/09b を same-wave 更新する代償が大きいため要ユーザー承認 |
| 撤回対象（推奨 A） | `apps/api/src/jobs/sync-sheets-to-d1.ts` 系、`apps/api/src/routes/admin/sync.ts`（単一 endpoint）、`sync_locks` / `sync_job_logs` migration、旧 UT-09 workflow root の direct implementation 化 |
| 移植対象（推奨 A） | D1 contention mitigation（retry/backoff・短い transaction・batch-size 制限）を 03a / 03b / 09b の品質要件として保存 |
| Service Account secret | `GOOGLE_SHEETS_SA_JSON`（Sheets 採用時のみ。Forms 採用時は `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` 系へ） |
| 仕様状態 | `blocked` は方針未統一を意味する。reconciliation 完了で `spec_created`／関連タスクへ反映後 `merged` |
| 同期チェック対象 | 5 文書: legacy umbrella spec / 03a index / 03b index / 04c index / 09b index |

## 目的

`task-sync-forms-d1-legacy-umbrella-001` で確定した「旧 UT-09 を direct implementation にせず、Forms API 分割方針へ寄せる」current 方針と、本ワークツリーに追加された Sheets API 直接実装の衝突を解消する。PR 化前に code / spec / 未タスク / aiworkflow-requirements 正本を 1 つの方向へ揃え、後続 03a / 03b / 04c / 09b の判断面を安定化させる。本タスク自身は **docs-only**（reconciliation 設計と決定メモの作成のみ）であり、コード変更・migration 撤回・PR 作成は含まない。

## スコープ

### 含む

- 選択肢 A（Forms 分割方針）と選択肢 B（Sheets 採用方針）の trade-off 比較設計
- 撤回対象 / 移植対象の差分マッピング（ファイル / endpoint / table / Secret 単位）
- 03a（forms-schema-sync）/ 03b（forms-response-sync）/ 04c（admin-backoffice）/ 09b（cron triggers / runbook）/ legacy umbrella の 5 点同期チェック方法定義
- D1 ledger を `sync_jobs` に統一するか `sync_locks` + `sync_job_logs` に統一するかの判定基準
- `/admin/sync` 単一 endpoint vs `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint の認可境界比較
- Phase 12 compliance / unassigned-task-detection 再判定方針
- staging smoke pending を PASS と誤記しないための運用ルール

### 含まない

- 方針決定後の実コード撤回・追加（別タスク化）
- D1 migration の up/down 実行（別タスク化）
- aiworkflow-requirements references の書き換え（別タスク化、本タスクは reference の差分マッピングまで）
- `wrangler.toml` の `[triggers]` 変更
- staging 実機 smoke（UT-26）
- commit / push / PR 作成
- unrelated verification-report 削除（別タスク化）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | current 方針の正本（旧 UT-09 を legacy umbrella として閉じる方針） |
| 上流 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/ | Forms schema sync 正本 |
| 上流 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/ | Forms response sync 正本 |
| 上流 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/ | admin endpoint 契約の正本 |
| 上流 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | cron / runbook の正本 |
| 並列 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/ | 撤回 or 採用の判定対象（旧 UT-09 root） |
| 並列 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/ | Sheets 系設計の参考（同じく blocked） |
| 下流 | UT-26 staging-deploy-smoke | reconciliation 完了後の実機 smoke 証跡 |
| 下流 | aiworkflow-requirements references | api-endpoints / database-schema / deployment-secrets-management の同期更新 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md | 原典 unassigned-task spec（全 213 行） |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針の正本 |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | Forms schema sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | Forms response sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | admin endpoint 正本 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 撤回 or 採用の対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 命名・認可 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` / `sync_locks` / `sync_job_logs` の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Forms / Sheets Service Account secret 名規約 |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md | 同様に blocked になった Sheets 系タスクの先行例 |
| 参考 | CLAUDE.md | 不変条件 #1/#4/#5 / scripts/cf.sh 運用 |

## 受入条件 (AC)

- AC-1: 現行 Forms 分割方針（A）と Sheets 採用方針（B）の比較表が 4条件 + 5 観点（API 契約 / D1 ledger / Secret 名 / Cron runbook / 監査ログ連携）で完成している（Phase 2）。
- AC-2: 採用方針が 1 つに決定され、決定理由が「current 方針との整合性 / same-wave 更新コスト / 03a-09b への影響範囲」の 3 軸で文書化されている（Phase 1〜3）。
- AC-3: 推奨方針（A）採用時の撤回対象（コード / migration / endpoint / Secret）と移植対象（D1 contention mitigation 知見）が差分マッピング表で明示されている（Phase 2）。
- AC-4: `/admin/sync` 単一 endpoint と `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint の認可境界比較が記述され、04c との矛盾が無いことが確認されている（Phase 2 / Phase 3）。
- AC-5: D1 ledger の統一方針が `sync_jobs` / `sync_locks` + `sync_job_logs` のどちらか一意に決まっている（Phase 2 / Phase 3）。
- AC-6: 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）の同期チェック手順が定義され、Phase 9 で実施される前提が記述されている（Phase 2）。
- AC-7: Phase 12 compliance が PASS / FAIL を実態どおりに示せる判定ルールが記述されている（Phase 3 / 後続 Phase）。
- AC-8: aiworkflow-requirements 正本へ stale contract を登録しない運用ルールが明文化されている（Phase 3）。
- AC-9: unassigned-task-detection への登録手順が記述されている（後続 Phase）。
- AC-10: 採用方針 B（Sheets）を選ぶ場合の正本仕様広範囲更新リストと、ユーザー承認が前提であることが明記されている（Phase 2 / Phase 3）。
- AC-11: 30種思考法レビューで PASS / MINOR / MAJOR 判定が代替案ごとに付与され、MAJOR が解消された状態で着手可否ゲートを通る（Phase 3）。
- AC-12: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS であり、根拠が記述されている（Phase 1 / Phase 3 / Phase 10）。
- AC-13: staging smoke pending を PASS と誤記しないための運用ルールが記述されている（Phase 3 / Phase 12）。
- AC-14: unrelated verification-report 削除を本 reconciliation の PR に混ぜない方針が明文化されている（Phase 3）。

> 注: 本タスクは **docs-only / blocked**。AC は仕様書記述レベルでの完了条件であり、code 反映は別タスクで実施する。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（reconciliation 設計 / 選択肢比較） | phase-02.md | spec_created | outputs/phase-02/reconciliation-design.md, outputs/phase-02/option-comparison.md |
| 3 | 設計レビュー（30種思考法 / GO/NO-GO） | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md, outputs/phase-04/scan-checklist.md |
| 5 | 実装ランブック（撤回 / 移植手順） | phase-05.md | spec_created | outputs/phase-05/reconciliation-runbook.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証（5 点同期チェック） | phase-09.md | spec_created | outputs/phase-09/main.md, outputs/phase-09/contract-sync-check.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke / 検証 | phase-11.md | spec_created | outputs/phase-11/main.md, outputs/phase-11/manual-smoke-log.md, outputs/phase-11/link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md, outputs/phase-12/implementation-guide.md |
| 13 | PR作成 | phase-13.md | spec_created | outputs/phase-13/local-check-result.md |

> 本タスクは Phase 1〜3 を先行作成する。Phase 4〜13 は方針決定後に確定する。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・true issue・Schema/共有コード Ownership 宣言） |
| 設計 | outputs/phase-02/reconciliation-design.md | reconciliation 設計（撤回 / 移植マッピング・5 点同期チェック） |
| 設計 | outputs/phase-02/option-comparison.md | 選択肢 A / B 比較（4条件 + 5 観点） |
| レビュー | outputs/phase-03/main.md | 代替案比較・30 種思考法・PASS/MINOR/MAJOR 判定・GO/NO-GO ゲート |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13（先行は 1〜3） | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api ランタイム / Cron Triggers | 無料枠 |
| Cloudflare D1 | 同期 ledger（`sync_jobs` or `sync_locks`+`sync_job_logs`） | 無料枠 |
| Cloudflare Secrets | Service Account secret 格納 | 無料 |
| Google Forms API | 採用 A 時の上流 | 無料枠 |
| Google Sheets API v4 | 採用 B 時の上流 | 無料（300 req/min/project） |

## Secrets 一覧（このタスクで言及・差分マッピング対象）

| Secret 名 | 用途 | 注入経路 | 1Password 参照 | 採用方針での扱い |
| --- | --- | --- | --- | --- |
| `GOOGLE_SHEETS_SA_JSON` | Sheets API SA JSON | Cloudflare Secret | `op://Employee/ubm-hyogo-env/GOOGLE_SHEETS_SA_JSON` | A: 廃止候補 / B: 正本採用 |
| `GOOGLE_FORM_ID` | Forms API 対象フォーム ID | Cloudflare Variable | `op://Employee/ubm-hyogo-env/GOOGLE_FORM_ID` | A: 正本採用 / B: 不要 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Forms API service account email | Cloudflare Secret | `op://Employee/ubm-hyogo-env/GOOGLE_SERVICE_ACCOUNT_EMAIL` | A: 正本採用 / B: 不要 |
| `GOOGLE_PRIVATE_KEY` | Forms API JWT 署名用 private key | Cloudflare Secret | `op://Employee/ubm-hyogo-env/GOOGLE_PRIVATE_KEY` | A: 正本採用 / B: 不要 |
| `SHEETS_SPREADSHEET_ID` | Sheets 採用時のシート ID | Cloudflare Variable | `op://Employee/ubm-hyogo-env/SHEETS_SPREADSHEET_ID` | A: 廃止 / B: 正本採用 |
| `SYNC_ADMIN_TOKEN` | admin endpoint Bearer | Cloudflare Secret | `op://Employee/ubm-hyogo-env/SYNC_ADMIN_TOKEN` | A / B 共通 |
| `ADMIN_ROLE_EMAILS` | admin role allowlist | Cloudflare Variable | `op://Employee/ubm-hyogo-env/ADMIN_ROLE_EMAILS` | A / B 共通 |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | reconciliation 設計内で「mapper.ts / schema 定義に schema を閉じ、worker / endpoint に染み出さない」を採用方針共通の前提として明記 |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | `sync_jobs` 系 ledger / audit / outbox は admin-managed data 専用テーブルとして分離。reconciliation で table 統一方針を決定する |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 採用方針に関わらず D1 binding は `apps/api` 内のみ。`apps/web` から呼ぶ設計は禁止 |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 旧 UT-09 系の Sheets 直接実装は GAS prototype の延長として扱わず、reconciliation で扱いを明示 |

## 完了判定

- Phase 1〜3 の状態が `artifacts.json` と一致する
- AC-1〜AC-14 の Phase 1〜3 関連項目が記述・トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS（Phase 1 / 3 / 10）
- 30種思考法レビューで MAJOR が 0 件（Phase 3）
- 5 点同期チェック手順が Phase 2 で定義されている
- Phase 13 はユーザー承認なしでは実行しない（本タスクは PR 化を含まない）

## 苦戦箇所・知見

**1. current 方針が legacy umbrella 形式で閉じられていた**
`task-sync-forms-d1-legacy-umbrella-001` は旧 UT-09 を direct implementation にしない方針を確定していたが、別ワークツリーで Sheets API 直接実装が進められたため、Phase 12 review まで衝突が表面化しなかった。

**2. 二重 ledger 化のリスク**
`sync_jobs`（current）と `sync_locks` / `sync_job_logs`（旧 UT-09 系）が同時に migration として存在すると、admin endpoint と cron handler のどちらが正本かが不安定化する。reconciliation で必ず一意化する必要がある。

**3. endpoint 認可境界の競合**
`/admin/sync` 単一 endpoint と `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint が共存すると、Bearer middleware の挿入点（`app.use('/admin/sync*', ...)`）は同じでも、ルート単位の認可仕様が分岐する。04c との同期が必須。

**4. D1 contention mitigation 知見の保存**
旧 UT-09 系で蓄積された WAL 非前提 / retry-backoff / short transaction / batch-size 制限の知見は、A 採用時に Sheets 実装ごと撤回されると失われる。03a / 03b / 09b に品質要件として移植する手順を仕様書化する必要がある。

**5. staging smoke pending と PASS の混同**
旧 UT-09 系で staging smoke が pending のまま「PASS」表記された痕跡があったため、reconciliation で「実機未走行 = pending」と「合否判定 = PASS/FAIL」を区別する運用ルールを明文化する。

**6. unrelated verification-report 削除の混入**
本ワークツリーには unrelated verification-report の削除差分も含まれていたため、reconciliation PR には含めない方針を明記する（別タスク化）。

**7. Schema / 共有コードの Ownership 宣言（v2026.04.29 追加）**
Phase 1 で「Sheets schema / Forms schema は mapper.ts / schema 定義に閉じる」「`apps/api` 共有コード（middleware / db client）の owner は当該 reconciliation 後の current 方針タスク」を Ownership 宣言として固定する。これにより同種衝突の再発を構造的に防ぐ。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/94 (CLOSED)
- 原典 unassigned-task: ../unassigned-task/task-ut09-direction-reconciliation-001.md
- current 方針正本: ../unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
- 並列タスク: ../ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md, ../ut-09-sheets-to-d1-cron-sync-job/index.md
