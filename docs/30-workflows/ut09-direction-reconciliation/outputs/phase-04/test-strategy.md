# Phase 4 主成果物 — テスト戦略（docs-only 文書整合性検証）

正本仕様: `../../phase-04.md` / `../../index.md`
タスク ID: task-ut09-direction-reconciliation-001
作成日: 2026-04-29
実行種別: docs-only / direction-reconciliation / NON_VISUAL
前 Phase: 3（設計レビュー / GO 判定） / 次 Phase: 5（reconciliation 実行ランブック）
base case: 案 a（採用 A — current Forms 分割方針へ寄せる）
AC トレース: AC-1 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 / AC-8 / AC-10 / AC-13 / AC-14

---

## 0. docs-only 境界（先頭固定）

本 Phase は **docs-only / NON_VISUAL** であり、Vitest unit / integration / Playwright E2E のような実行可能テストを **追加しない**。代わりに「正本仕様文書（5 文書）と aiworkflow-requirements references / コード遺物の整合性」を **`rg`（ripgrep）スキャン + 手動 review** で検証する戦略を定義する。`scripts/` 配下にスキャン用シェルを追加することも禁止する。検証コマンドは本書および `scan-checklist.md` の bash 1-liner を直接コピーして使う。

検証は Phase 5（reconciliation 実行ランブック）の実行 **前 / 後** に同じスキャンを 2 回回し、差分を Phase 9 で `outputs/phase-09/` に保存して比較する運用を正本とする。

---

## 1. 検証対象と非対象

### 1.1 検証対象（4 種類のスキャン）

| # | スキャン分類 | 目的 | base case（A 採用）期待結果 |
| --- | --- | --- | --- |
| S1 | 5 文書同期スキャン | legacy umbrella / 03a / 03b / 04c / 09b の 5 文書が Forms 分割方針で揃っているか | 5 文書とも Sheets 直接実装に書換されていない |
| S2 | 撤回対象スキャン（Sheets 残骸検出） | Sheets 系遺物（コード・migration・Secret 名）が「正本扱い」されていないか | 仕様書 / references で正本登録ゼロ。撤回前提の言及のみ許容 |
| S3 | 移植対象スキャン（D1 contention mitigation 知見保存） | retry/backoff / short tx / batch-size / WAL 非前提 / 二重起動防止 が 03a / 03b / 09b に AC として記述されているか | 5 知見すべての記述あり |
| S4 | aiworkflow-requirements drift スキャン | references 4 文書と indexes が採用 A と整合しているか | `pnpm indexes:rebuild` 実行差分ゼロ / `verify-indexes-up-to-date` PASS |

### 1.2 非対象

- コードの実行（Vitest / Playwright / `tsc --noEmit` 等の追加）
- migration の up/down 実行
- 1Password から secret 値の実体取得
- `wrangler` 直接実行（必要時は `bash scripts/cf.sh` 経由のみ）
- staging 実機 smoke（UT-26 別タスク）
- PR 作成 / push（本タスクは PR 化を含まない）

---

## 2. 5 文書同期スキャン（S1 / AC-6）

採用 A の正本である 5 文書がすべて Forms 分割方針で揃っているかを確認する。**1 文書でも Sheets 直接実装方針に揺らいでいたら blocker**。

| # | 文書 | スキャン観点 | 期待結果（A 時） | 危険信号 |
| --- | --- | --- | --- | --- |
| D1 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 「旧 UT-09 を direct implementation にしない」方針記述の存続 | 1 件以上ヒット、削除なし | 0 件 = 方針撤回事故 |
| D2 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | `forms.get` 上流 / Forms schema sync 責務境界 | Forms API 言及あり / Sheets API 言及なし | Sheets 言及あり = 二重正本化 |
| D3 | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | `forms.responses.list` 上流 | Forms API 言及あり / Sheets API 言及なし | 同上 |
| D4 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint 記述 | 2 endpoint がすべて記述 / 単一 `/admin/sync` を正本としない | 単一 endpoint のみ = 04c 退行 |
| D5 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | scheduled handler が schema + responses の 2 経路を呼ぶ runbook | 2 経路記述あり | 単一 sync 経路のみ = 09b 退行 |

> 実行コマンドは `scan-checklist.md` の §3 を参照。

---

## 3. 撤回対象スキャン（S2 / AC-3 / Sheets 残骸検出）

Phase 2 §2.1 で列挙した 9 軸の撤回対象が、仕様書 / references で「正本」として参照されていないことを確認する。コード実体の削除は別タスクだが、**「仕様書側で正本扱いされているか」は本 Phase で必ず検出する**。

| # | 撤回対象 | スキャン場所 | 期待結果（A 時 / reconciliation 後） | 危険信号 |
| --- | --- | --- | --- | --- |
| W1 | `apps/api/src/jobs/sync-sheets-to-d1.ts` 系 | `docs/`, `.claude/skills/aiworkflow-requirements/references/` | 仕様書側で「正本」として参照される箇所ゼロ。本タスク・ut-21・旧 UT-09 root の撤回対象記述としての言及のみ許容 | references / 03a / 03b / 04c / 09b にヒット = 違反 |
| W2 | `apps/api/src/routes/admin/sync.ts`（単一 endpoint） | 04c / 09b / `api-endpoints.md` | 「単一 `/admin/sync` を採用」記述ゼロ | 04c の正本記述に出現 = 違反 |
| W3 | `POST /admin/sync`（単一） | 04c / 09b / `api-endpoints.md` / legacy umbrella | 旧 UT-09 root の撤回前提言及以外で 0 件 | 04c / 09b / api-endpoints.md にヒット = 違反 |
| W4 | `sync_locks` テーブル | `database-schema.md`, migrations 言及 | 「採用 A 時の正本」と記述しない（廃止候補のみ） | 正本登録あり = 二重 ledger |
| W5 | `sync_job_logs` テーブル | 同上 | 同上 | 同上 |
| W6 | `GOOGLE_SHEETS_SA_JSON` | `environment-variables.md`, `deployment-cloudflare.md`, `wrangler.toml` 言及, `.env` 参照 | 「廃止候補」「採用 B 時のみ」コンテキストでのみ言及 | references で正本登録 = 違反 |
| W7 | `SHEETS_SPREADSHEET_ID` | 同上 | 同上 | 同上 |
| W8 | 旧 UT-09 root の direct implementation 化記述 | `ut-09-sheets-to-d1-cron-sync-job/index.md` | legacy umbrella 参照に戻す方針が記述（または保留状態） | direct implementation 化のままなら違反 |
| W9 | `wrangler.toml` の Sheets 前提 cron schedule | `apps/api/wrangler.toml` 言及 | 09b の 2 経路 schedule に整合する記述 | Sheets 単一 schedule = 違反 |

> Phase 2 §2.1 の 9 軸と 1:1 対応。

---

## 4. 移植対象スキャン（S3 / AC-3）

Phase 2 §2.2 で列挙した D1 contention mitigation 5 知見が、03a / 03b / 09b に AC として保存されているかを確認する。**A 採用で Sheets 実装ごと撤回された結果、知見が失われていないか**を構造的に検証する。

| # | 知見 | 移植先文書 | 期待結果 | 危険信号 |
| --- | --- | --- | --- | --- |
| M1 | WAL 非前提 | `03a/index.md`, `03b/index.md` | 「D1 のロック特性に依存しない設計」を AC として記述 | 記述なし = 知見喪失 |
| M2 | retry/backoff | `03a/index.md`, `03b/index.md`, `09b/index.md` | exponential backoff / 最大試行回数の記述 | 同上 |
| M3 | short transaction | `03a/index.md`, `03b/index.md` | 1 transaction の処理量上限 AC | 同上 |
| M4 | batch-size 制限 | `03a/index.md`, `03b/index.md`, `09b/index.md` | 1 sync あたり処理件数上限の記述 | 同上 |
| M5 | 二重起動防止 | `09b/index.md` | scheduled / manual 同時起動時の lock or idempotency 戦略 | 同上 |

---

## 5. aiworkflow-requirements drift スキャン（S4 / AC-8）

| # | 観点 | 検証コマンド | 期待結果 | 危険信号 |
| --- | --- | --- | --- | --- |
| R1 | indexes 再生成差分 | `mise exec -- pnpm indexes:rebuild && git status` | `.claude/skills/aiworkflow-requirements/indexes/` に未コミット差分ゼロ | 差分あり = stale contract |
| R2 | CI gate 整合 | `.github/workflows/verify-indexes.yml` 内 `verify-indexes-up-to-date` job 確認 | local check で job が成功する状態 | drift 検出 = 違反 |
| R3 | `api-endpoints.md` 正本一致 | `rg '/admin/sync' .claude/skills/aiworkflow-requirements/references/api-endpoints.md` | A 時: `/admin/sync/schema` + `/admin/sync/responses` のみが正本登録 | 単一 `/admin/sync` 正本登録 = 違反 |
| R4 | `database-schema.md` 正本一致 | `rg 'sync_jobs\|sync_locks\|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md` | A 時: `sync_jobs` のみ正本登録、`sync_locks` / `sync_job_logs` は未登録または「廃止候補」 | `sync_locks` / `sync_job_logs` が正本登録 = 違反 |
| R5 | secret 名正本一致 | `rg 'GOOGLE_SHEETS_SA_JSON\|GOOGLE_FORM_ID\|GOOGLE_SERVICE_ACCOUNT_EMAIL\|GOOGLE_PRIVATE_KEY' .claude/skills/aiworkflow-requirements/references/environment-variables.md .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | A 時: Forms 系 3 secret が正本登録、Sheets 系は未登録または「廃止候補」 | Sheets 系正本登録 = 違反 |
| R6 | stale contract 非登録ルール | references 4 文書全文に Sheets 系正本登録がないか目視 | 採用 A 確定後に Sheets 系 contract は登録されない | 事前登録あり = AC-8 違反 |

---

## 6. Forms 採用方針への整合性検証手順（横串）

採用 A（Forms 分割方針）の正本性を、以下の横串で確認する。

| # | 整合性観点 | 検証手順 | 期待結果 |
| --- | --- | --- | --- |
| F1 | 用語一意性 | `rg -c 'Forms\s*(API\s*)?分割方針' docs/30-workflows/` | legacy umbrella / 03a / 03b / 04c / 09b / 本タスクで 6 件以上ヒット |
| F2 | 上流 API 一意性 | 03a で `forms.get`、03b で `forms.responses.list` のみ参照 | Sheets API v4 言及なし |
| F3 | endpoint 認可境界（AC-4） | `rg '/admin/sync(/schema\|/responses)?' docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/ docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/ .claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 2 endpoint が一貫してヒット、単一 `/admin/sync` の正本登録なし |
| F4 | D1 ledger 一意性（AC-5） | `rg 'sync_jobs' .claude/skills/aiworkflow-requirements/references/database-schema.md` で `sync_jobs` 正本登録、`sync_locks` / `sync_job_logs` は廃止候補のみ | 二重 ledger 化なし |
| F5 | 不変条件 #1 整合 | `rg 'mapper\.ts\|schema\s*定義' docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/ docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/` | schema を mapper / schema 定義に閉じる方針が記述 |
| F6 | 不変条件 #5 整合 | `rg 'D1Database\|d1\.' apps/web/` | `apps/web` 配下に D1 binding 直接アクセスがゼロ |
| F7 | 不変条件 #6 整合 | 旧 UT-09 root が legacy umbrella 参照に戻る方針記述 | direct implementation 化記述なし、または撤回前提コンテキスト |

---

## 7. AC マッピング（本 Phase 起点・経由）

| AC# | 検証手順（本 Phase 内） | 参照 |
| --- | --- | --- |
| AC-1 | 4 条件 + 5 観点比較表が現存 | `rg '価値性\|実現性\|整合性\|運用性' docs/30-workflows/ut09-direction-reconciliation/phase-02.md` |
| AC-3 | 撤回対象 9 軸 / 移植対象 5 知見が検証マトリクスにマッピング | §3 / §4 |
| AC-4 | endpoint 認可境界が 04c と矛盾なし | F3 |
| AC-5 | D1 ledger 統一方針が一意 | F4 / R4 |
| AC-6 | 5 文書同期チェック手順が定義済 | §2 |
| AC-7 | Phase 12 compliance PASS / FAIL / pending 3 値判定 | staging smoke 表記スキャン: `rg 'pending\|PASS\|FAIL' outputs/` |
| AC-8 | aiworkflow-requirements stale contract 不登録ルール | §5 |
| AC-10 | 採用 B 時 same-wave 更新リスト存続 | `rg 'same-wave' docs/30-workflows/ut09-direction-reconciliation/phase-02.md docs/30-workflows/ut09-direction-reconciliation/phase-03.md` |
| AC-13 | staging smoke pending vs PASS 区別ルール | `rg 'pending\b' docs/30-workflows/ut09-direction-reconciliation/phase-03.md` |
| AC-14 | unrelated verification-report 削除分離方針 | `rg 'unrelated\|verification-report' docs/30-workflows/ut09-direction-reconciliation/phase-03.md` |

> AC-2 / AC-9 / AC-11 / AC-12 は Phase 1 / 3 / 10 主担当のため本 Phase は素通り。AC マトリクス全体トレースは Phase 7 で実施。

---

## 8. 軽量運用ルール（docs-only タスク特有）

- **シェルスクリプト追加禁止**: `scripts/` 配下にスキャン用シェルを追加しない。検証コマンドは本書 / `scan-checklist.md` 内の bash 1-liner 直書き運用とする。
- **Vitest / Playwright 追加禁止**: `apps/api/test/` / `apps/web/test/` にテストファイルを追加しない。
- **scan 結果の保存先**: Phase 9 で実行した scan 結果（`rg` 出力）は `outputs/phase-09/` に保存する。本 Phase ではコマンド定義までに留め、結果保存は行わない。
- **`bash scripts/cf.sh` 経由**: もし D1 schema 確認が必要な場合は CLAUDE.md ルールに従い `bash scripts/cf.sh d1 ...` 経由で実行する。`wrangler` 直接実行は禁止。
- **1Password 参照**: secret 値の実体取得は本 Phase で不要。secret 名 (`GOOGLE_SHEETS_SA_JSON` 等) のみを正本確認する。`.env` の中身を `cat` / `Read` / `grep` で読み取らない。
- **2 回実行運用**: Phase 5 reconciliation runbook の実行前 / 実行後に同じスキャンを 2 回回し、差分を Phase 9 で diff として保存する。

---

## 9. Phase 連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 5 | reconciliation runbook の sanity check（実行前 / 実行後）として 4 種スキャンを再利用 |
| Phase 6 | 異常系 5 ケース（撤回漏れ / 移植漏れ / unrelated 削除混入 / ledger 二重化 / secret 名不一致）に対応するスキャン項目を提供 |
| Phase 7 | AC マトリクスの「検証コマンド」列に本 Phase の `rg` 1-liner を流し込み |
| Phase 9 | 5 文書同期チェックの実施。scan 結果を `outputs/phase-09/` に保存 |
| Phase 11 | 手動 smoke として scan 結果を目視 review |

---

## 10. 完了確認

- [x] 4 種類スキャン（S1 / S2 / S3 / S4）が分類記述され各 5 行以上のチェック対象を持つ（§2 / §3 / §4 / §5）
- [x] Forms 採用方針への整合性検証手順 7 観点（F1〜F7）が記述（§6）
- [x] 撤回対象 9 軸（W1〜W9）と移植対象 5 知見（M1〜M5）が Phase 2 表と 1:1 対応（§3 / §4）
- [x] aiworkflow-requirements indexes drift 検証手順が `pnpm indexes:rebuild` + CI gate `verify-indexes-up-to-date` を含む（§5）
- [x] AC-1 / AC-3〜AC-8 / AC-10 / AC-13 / AC-14 の 10 件に検証手順が割当（§7）
- [x] シェルスクリプト / Vitest / Playwright 追加禁止の docs-only 運用ルールが明記（§8）
- [x] 成果物 2 ファイル分離（test-strategy.md / scan-checklist.md）

---

状態: spec_created
