# Phase 1 要件定義 主成果物

正本仕様: `../../phase-01.md` / `../../index.md`
タスクID: task-ut09-direction-reconciliation-001
作成日: 2026-04-29
実行種別: docs-only / direction-reconciliation / NON_VISUAL
状態: spec_created

---

## 0. 本タスクの位置づけ（先頭固定）

本タスクは「**code / spec / 未タスク / aiworkflow-requirements 正本を 1 つの方向へ揃える reconciliation を、PR 化前に決定可能な形で文書化する**」ための docs-only タスクである。コード変更・migration 撤回・PR 作成は本タスクのスコープ外であり、別タスクで実施する。

推奨方針は **A（current Forms 分割方針へ寄せる）**。Sheets 採用（B）は legacy umbrella と 03a / 03b / 04c / 09b を same-wave 更新する代償が大きく、ユーザー承認を前提とする。

---

## 1. 真の論点（true issue）

### 1.1 主論点

「**どちらの方針を採るか**」ではない。本質は次のとおり。

> code（apps/api 実装）/ spec（5 文書: legacy umbrella / 03a / 03b / 04c / 09b）/ 未タスク（unassigned-task）/ aiworkflow-requirements 正本（api-endpoints / database-schema / environment-variables / deployment-cloudflare）を **1 方向へ reconcile する手順を、PR 化前に docs-only で文書化** することが本タスクの本質である。

本タスクの完了は「方針決定」ではなく「reconciliation を一意に進められる入力（true issue / Ownership 宣言 / 依存境界 / 4 条件 / 既存契約チェックリスト / AC マッピング）の確定」である。

### 1.2 副次的論点（reconciliation で必ず一意化すべき項目）

| # | 副次論点 | 衝突対象 |
| --- | --- | --- |
| S1 | 二重正本の解消 | legacy umbrella spec（A）と Sheets 直接実装（B）の双方が「正本」として参照されている |
| S2 | 二重 ledger | `sync_jobs`（current）と `sync_locks` + `sync_job_logs`（旧 UT-09 系）の D1 migration が並存 |
| S3 | endpoint 認可境界の競合 | `/admin/sync` 単一 vs `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint |
| S4 | Secret 名の競合 | `GOOGLE_SHEETS_SA_JSON` vs `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` |
| S5 | D1 contention mitigation 知見の保存 | A 採用時に retry/backoff・短い transaction・batch-size 制限の知見が消失するリスク |
| S6 | staging smoke pending と PASS の混同 | 旧 UT-09 系で smoke 未走行を「PASS」と誤記した痕跡がある |
| S7 | unrelated verification-report 削除の混入 | reconciliation PR に無関係差分が混入する運用リスク |

---

## 2. Schema / 共有コード Ownership 宣言（v2026.04.29）

reconciliation の構造的再発防止として、Phase 1 で以下 5 対象の Owner を固定する。Ownership 衝突が検知された時点で reconciliation タスクを起票する運用とする（本タスクが第 1 号）。

| 対象 | Owner（採用方針共通） | 配置先 | 染み出し禁止先 |
| --- | --- | --- | --- |
| Forms schema 定義 | Forms 分割方針タスク（03a / 03b） | `apps/api/src/sync/forms-mapper.ts` 相当（採用 A 時） | `worker.ts` / `index.ts` / `apps/web` |
| Sheets schema 定義 | 旧 UT-09 系（採用 B 時のみ有効） | `apps/api/src/sync/mapper.ts` の `COL` 定数 | `worker.ts` / `index.ts` |
| admin endpoint 命名 | 04c-parallel-admin-backoffice-api-endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 重複登録禁止 |
| D1 ledger schema | UT-04 / UT-22 | `database-schema.md` の `sync_jobs` / `sync_locks` + `sync_job_logs` | 重複定義禁止 |
| `runSync` 共通関数 | 採用方針の代表 application_implementation タスク | `apps/api/src/sync/worker.ts` | scheduled / manual の重複実装禁止 |

**運用ルール**: いずれかの Owner が衝突した時点で reconciliation タスクを起票する。同一 Owner が code と spec で別方向に進んだ場合は、reconciliation 完了まで PR をマージしない。

---

## 3. 依存境界（採用方針別の影響付き）

| 種別 | 対象 | 受け取る前提 | A 採用時の影響 | B 採用時の影響 |
| --- | --- | --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | current 方針正本（旧 UT-09 を direct implementation にしない / Forms API 分割 / `sync_jobs` ledger / 2 endpoint） | 維持 | 「直接実装しない」方針を撤回し same-wave 更新 |
| 上流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | Forms schema sync 正本 | 無変更（D1 contention 知見のみ追記） | 責務再設計（Sheets 単一同期へ統合） |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | Forms response sync 正本 | 無変更（D1 contention 知見のみ追記） | 責務再設計（Sheets 単一同期へ統合） |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | admin endpoint 契約（2 endpoint） | 無変更 | `/admin/sync` 単一に再定義 |
| 上流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | cron / runbook 正本 | 無変更（pause/resume 手順のみ強化） | scheduled handler を単一 sync 経路へ書換 |
| 並列 | ut-09-sheets-to-d1-cron-sync-job | 旧 UT-09 root | legacy umbrella 参照に戻す（撤回） | direct implementation 化（採用） |
| 並列 | ut-21-sheets-d1-sync-endpoint-and-audit-implementation | 同様に blocked な Sheets 系 | 結論を共有（Phase 9 同期チェックで参照） | 結論を共有（同採用） |
| 下流 | UT-26 staging-deploy-smoke | reconciliation 完了後の実機 smoke | Forms 分割経路の smoke | 単一 `/admin/sync` の smoke |
| 下流 | aiworkflow-requirements references | api-endpoints / database-schema / deployment-secrets-management | 無変更（差分マッピングのみ） | same-wave で正本書換（別タスク化） |

---

## 4. 4 条件評価（全 PASS で固定）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 二重正本の解消により、後続 4 タスク（03a / 03b / 04c / 09b）の判断面が安定化し、stale contract の誤参照を構造的に防げる。reconciliation 未実施で PR 化すると後続が連鎖的に blocked 化するため、本タスク完了が PR 経路の必須前提となる。 |
| 実現性 | PASS | docs-only でコード変更を伴わない。原典 spec（213 行）と上流 5 文書、aiworkflow-requirements 4 references から reconciliation 設計が一意に導ける。中規模の文書作業に収まる。 |
| 整合性 | PASS | 不変条件 #1（schema を mapper.ts に閉じる）/ #4（admin-managed data 専用テーブル分離）/ #5（D1 binding は `apps/api` 内のみ）/ #6（GAS prototype を本番昇格しない）すべてに適合する設計を Phase 2 で固定する。Ownership 宣言（§2）が再発防止の構造保証となる。 |
| 運用性 | PASS | 推奨 A 採用時は current 方針維持で運用変更なし。Sheets 採用 B 時はユーザー承認を前提とする運用ルールを Phase 3 で明記する。`scripts/cf.sh` 経由の wrangler 運用・1Password 参照（`op://Employee/ubm-hyogo-env/<FIELD>`）は採用方針共通で維持される。 |

> AC-12 トレース: 4 条件すべて PASS、根拠記載済み。最終判定は Phase 3 / Phase 10 で再確認する。

---

## 5. 既存契約・命名規則チェックリスト（Phase 2 への引き渡し）

Phase 2 設計に着手する前に、以下 5 観点で current 正本登録と実装差分を抽出すること。差分はすべて Phase 2 の「撤回 / 移植マッピング」へ反映する。

| # | 観点 | 確認対象 | 期待される現行規則 |
| --- | --- | --- | --- |
| C1 | current 方針 spec | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | Forms API 分割 / 2 endpoint / `sync_jobs` ledger / 旧 UT-09 を direct implementation にしない |
| C2 | 旧 UT-09 root | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | A 採用 = legacy umbrella 参照に戻す / B 採用 = direct implementation 化 |
| C3 | api-endpoints 正本 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/admin/sync*` の現行登録（単一 or 2 endpoint）と Bearer 認可境界を抽出 |
| C4 | database-schema 正本 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_jobs` / `sync_locks` / `sync_job_logs` のいずれが登録されているかを抽出 |
| C5 | secrets / env 正本 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` / `deployment-cloudflare.md` | `GOOGLE_SHEETS_SA_JSON` / `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `SHEETS_SPREADSHEET_ID` / `SYNC_ADMIN_TOKEN` / `ADMIN_ROLE_EMAILS` の登録状況を抽出 |

**1Password 参照形式の再掲**: `op://Employee/ubm-hyogo-env/<FIELD>` 固定。`.env` には実値を書かず、参照のみを記述する。Cloudflare 系 CLI は `bash scripts/cf.sh ...` 経由のみ（`wrangler` 直接実行禁止）。

---

## 6. スコープ境界（docs-only 原則）

### 6.1 含む

- 真の論点・Ownership 宣言・依存境界・4 条件評価・既存契約チェックリストの確定
- 採用方針 A / B 比較への入力提供（Phase 2）
- 5 文書同期チェック（legacy umbrella / 03a / 03b / 04c / 09b）の起点定義
- 推奨方針（A）と Sheets 採用（B）のユーザー承認前提の明文化

### 6.2 含まない（別タスク化）

- 実コードの撤回・追加（`apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/src/routes/admin/sync.ts` 等）
- D1 migration の up/down 実行（`sync_locks` / `sync_job_logs` の撤回または採用）
- aiworkflow-requirements references の書換
- `wrangler.toml` の `[triggers]` 変更
- staging 実機 smoke（UT-26 へ）
- commit / push / PR 作成
- unrelated verification-report 削除

---

## 7. 不変条件 touched

| # | 不変条件 | 本 Phase での扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | Forms / Sheets 双方の schema 定義を mapper.ts / 定数に閉じ、`worker.ts` / `index.ts` / `apps/web` への染み出しを禁止する Ownership 宣言（§2）で担保 |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | `sync_jobs` / `sync_locks` / `sync_job_logs` / audit / outbox は admin-managed data 専用テーブル。reconciliation で ledger 一意化を Phase 2 に渡す |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 採用方針に関わらず D1 binding は `apps/api` 内のみ。`apps/web` からの直接アクセスは禁止 |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 旧 UT-09 系 Sheets 直接実装を GAS prototype の延長として本番昇格させない。B 採用時は本条件との整合を別途検証する旨を Phase 3 へ引き継ぐ |

---

## 8. AC（受入条件）— index.md と完全一致

本タスク全体（13 Phase）の AC を Phase 1 で固定し、各 AC を Phase / 多角的チェック / 副次論点へトレースする。

| AC | 内容 | 主担当 Phase | Phase 1 担当 | トレース先 |
| --- | --- | --- | --- | --- |
| AC-1 | 4 条件 + 5 観点比較表（API 契約 / D1 ledger / Secret 名 / Cron runbook / 監査ログ連携）が完成 | Phase 2 | 入力提供（§5） | C1〜C5 |
| AC-2 | 採用方針が 1 つに決定され、決定理由が「current 整合 / same-wave 更新コスト / 03a-09b 影響範囲」の 3 軸で文書化 | Phase 1〜3 | 推奨 A 明示・3 軸を §1 / §3 / §4 で定義 | §0, §1.1, §3, §4 価値性 |
| AC-3 | 撤回対象 / 移植対象（D1 contention 知見）の差分マッピング | Phase 2 | 入力提供（S5） | §1.2 S5 |
| AC-4 | `/admin/sync` 単一 vs 2 endpoint の認可境界比較・04c 整合確認 | Phase 2 / 3 | 入力提供（S3 / C3） | §1.2 S3, §5 C3 |
| AC-5 | D1 ledger 一意化（`sync_jobs` または `sync_locks`+`sync_job_logs`） | Phase 2 / 3 | 入力提供（S2 / C4） | §1.2 S2, §5 C4 |
| AC-6 | 5 文書同期チェック手順定義（Phase 9 で実施） | Phase 2 | 起点定義（§6.1） | §6.1 |
| AC-7 | Phase 12 compliance が PASS / FAIL を実態どおりに示す判定ルール | Phase 3〜 | — | §1.2 S6 |
| AC-8 | aiworkflow-requirements 正本へ stale contract を登録しない運用ルール | Phase 3 | Ownership 宣言（§2）で構造保証 | §2 |
| AC-9 | unassigned-task-detection への登録手順 | 後続 Phase | — | — |
| AC-10 | B 採用時の正本広範囲更新リスト + ユーザー承認前提 | Phase 2 / 3 | 推奨 A・B はユーザー承認前提（§0） | §0, §3 |
| AC-11 | 30 種思考法レビューで PASS/MINOR/MAJOR が代替案ごとに付与・MAJOR=0 | Phase 3 | 4 条件 PASS を比較軸に渡す（§4） | §4 |
| AC-12 | 4 条件最終判定 PASS + 根拠記述 | Phase 1 / 3 / 10 | **本 Phase で確定**（§4） | §4 |
| AC-13 | staging smoke pending を PASS と誤記しない運用ルール | Phase 3 / 12 | 入力提供（S6） | §1.2 S6 |
| AC-14 | unrelated verification-report 削除を本 PR に混ぜない方針 | Phase 3 | 入力提供（S7 / §6.2） | §1.2 S7, §6.2 |

> AC-2 / AC-12 は Phase 1 で確定済み。残り AC は Phase 2 以降で記述・検証される。

---

## 9. 多角的チェック観点（要件レベル）

| 観点 | 確認内容 | Phase 1 での状態 |
| --- | --- | --- |
| 不変条件 #1 | schema を mapper.ts に閉じる宣言 | §2, §7 で固定 |
| 不変条件 #4 | admin-managed data 分離 | §7 で固定（ledger 一意化は Phase 2） |
| 不変条件 #5 | D1 binding は `apps/api` 内のみ | §7 で固定 |
| 不変条件 #6 | GAS prototype 本番昇格禁止 | §7 で固定（B 採用時の追加検証は Phase 3） |
| 二重正本 | legacy umbrella / Sheets 直接実装の双方を「正本」と表現していない | §1.1 で論点化 |
| 二重 ledger | `sync_jobs` と `sync_locks` + `sync_job_logs` 同時採用なし | S2 で論点化、Phase 2 で一意化 |
| endpoint 認可 | `/admin/sync` 単一 vs 2 endpoint と 04c 整合 | S3 / C3 で論点化、Phase 2 で結論 |
| Secret hygiene | Forms / Sheets Secret 一意化 | S4 / C5 で論点化、Phase 2 で結論 |
| 運用ルール | staging pending 誤記禁止 / unrelated 削除混入禁止 | S6 / S7 / §6.2 で論点化 |
| docs-only 境界 | コード変更・migration 撤回・PR 作成を含まない | §0 / §6.2 で固定 |

---

## 10. 苦戦箇所 → 再発防止マッピング（原典 8 件 + Ownership 宣言）

| # | 苦戦箇所 | 再発防止策 | 反映先 |
| --- | --- | --- | --- |
| 1 | current 方針が legacy umbrella 形式で閉じられていた | 実装着手前に legacy umbrella タスク該当性を確認する運用 | §5 C1, AC-8 |
| 2 | 二重 ledger 化のリスク | Phase 2 で ledger 一意化、Ownership 宣言（D1 ledger） | §2, AC-5 |
| 3 | endpoint 認可境界の競合 | 04c との整合確認を Phase 2 で実施、Ownership 宣言（admin endpoint 命名） | §2, AC-4 |
| 4 | D1 contention 知見の保存 | A 採用時に 03a / 03b / 09b へ品質要件として移植 | AC-3, §1.2 S5 |
| 5 | staging smoke pending を PASS と誤記 | 「実機未走行 = pending」「合否 = PASS/FAIL」を区別する運用ルール | AC-13, §1.2 S6 |
| 6 | unrelated verification-report の混入 | 別タスク化を §6.2 / AC-14 で明文化 | §6.2, AC-14 |
| 7 | Schema / 共有コード Ownership 宣言（v2026.04.29 追加） | 5 対象の Owner を Phase 1 で固定、衝突時に reconciliation タスク起票 | §2 |
| 8 | 別ワークツリーで先行実装 | Ownership 衝突検知ルールで構造的に防止 | §2 運用ルール |

---

## 11. 次 Phase への引き渡し

- **次 Phase**: Phase 2（設計 / reconciliation 設計 / 選択肢比較）
- **引き継ぎ事項**:
  1. 真の論点 = reconciliation の docs-only 文書化（§0, §1.1）
  2. Schema / 共有コード Ownership 宣言 5 対象（§2）
  3. 依存境界（上流 5 / 並列 2 / 下流 2）+ 採用方針別影響（§3）
  4. 4 条件評価（全 PASS）の根拠（§4）
  5. 既存契約・命名規則チェック 5 観点（C1〜C5）（§5）
  6. 推奨方針 = A、Sheets 採用（B）はユーザー承認前提（§0, §3）
  7. 5 文書同期チェック対象: legacy umbrella / 03a / 03b / 04c / 09b（§6.1, AC-6）
  8. 1Password 参照形式 `op://Employee/ubm-hyogo-env/<FIELD>` 固定（§5）
  9. 副次論点 S1〜S7 を Phase 2 比較軸へ（§1.2）
- **ブロック条件**:
  - 原典 spec / 上流 5 文書のいずれかが未読
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-14 が index.md と乖離
  - Ownership 宣言が 5 対象未満

---

## 12. 完了確認

- [x] 真の論点が「reconciliation の docs-only 文書化」に再定義されている（§0, §1.1）
- [x] 4 条件評価が全 PASS で確定し、根拠記載（§4）
- [x] 依存境界表に上流 5 / 並列 2 / 下流 2 + 採用方針別影響を記載（§3）
- [x] Schema / 共有コード Ownership 宣言が 5 対象で固定（§2）
- [x] AC-1〜AC-14 が index.md と完全一致（§8）
- [x] 既存契約・命名規則チェック 5 観点を固定（§5）
- [x] 不変条件 #1 / #4 / #5 / #6 を全て touched（§7）
- [x] docs-only 境界を明記（§0, §6.2）
- [x] AC-2 / AC-12 を Phase 1 で確定（§4, §8）

---

状態: spec_created → completed
