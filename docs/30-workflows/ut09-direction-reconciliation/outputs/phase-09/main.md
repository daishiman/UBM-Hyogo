# Phase 9 Main — 品質保証 / 5 点同期チェック サマリー

正本: `../../phase-09.md`
詳細マトリクス: `./contract-sync-check.md`
タスク種別: docs-only / direction-reconciliation / NON_VISUAL
AC トレース: AC-6（5 文書同期手順の Phase 9 実施）

## 1. 検証範囲

採用 base case = **案 A（Forms 分割方針）** に対する 5 文書 contract 同期チェックを実施した。実検証として下記 5 文書を Read し、reconciliation 結論との整合性を観点別に判定した。

| # | 文書 | 実 path | Read 済み |
| --- | --- | --- | --- |
| 1 | legacy umbrella spec | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | YES |
| 2 | 03a Forms schema sync | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | YES |
| 3 | 03b Forms response sync | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | YES |
| 4 | 04c admin endpoints | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | YES |
| 5 | 09b cron / runbook | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | YES |

## 2. 観点別 PASS / drift サマリー

| 観点 | 期待（案 A） | 5 文書での実態 | 判定 |
| --- | --- | --- | --- |
| Forms 分割方針 | `forms.get` + `forms.responses.list` の上流 / 2 endpoint への分割 | 03a が `forms.get`、03b が `forms.responses.list`、04c が 2 endpoint expose、09b が 2 endpoint を順次叩く cron 設計、legacy umbrella が「分解済み」と明記 | PASS |
| Sheets 残骸 | 5 文書すべてに Sheets 採用記述・`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `sync_locks` / `sync_job_logs` の正本記述が無いこと | 03a / 03b / 04c / 09b に Sheets 系記述ゼロ。legacy umbrella は「stale 前提として撤回」文脈のみで言及（正本としての Sheets 採用なし） | PASS |
| endpoint 名 | `POST /admin/sync/schema` + `POST /admin/sync/responses`（2 endpoint） | 03a: `POST /admin/sync/schema` / 03b: `POST /admin/sync/responses` / 04c: 両方 expose（admin gate）/ 09b: 2 endpoint 参照 / legacy umbrella: 同表記 | PASS |
| ledger 名 | `sync_jobs` 単一 | 5 文書すべて `sync_jobs` を使用。`sync_locks` / `sync_job_logs` の登場なし | PASS |
| Secret 名 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID`（Forms 系）+ `SYNC_ADMIN_TOKEN` / `ADMIN_ROLE_EMAILS`（共通） | 03a / 03b: Forms 系 3 件を Cloudflare Secrets に明記 / 04c: secret 新規導入なし（05a/05b に委譲）/ 09b: SENTRY_DSN placeholder のみ / legacy umbrella: Forms 系 3 件を依存に明記 | PASS |
| Cron 設定 | response sync `*/15 * * * *` / schema sync 1 日 1 回 | 03b: cron 15 分毎 / 03a: 1 日 1 回 / 09b: `*/15 * * * *` + `0 3 * * *` を `[triggers]` 正本に固定 | PASS |
| responsibility 分割 | schema=03a / response=03b / endpoint=04c / cron+runbook=09b | 5 文書すべて同一の責務分割を保持 | PASS |
| 旧 UT-09 direct implementation | 撤回（legacy umbrella 化） | legacy umbrella が「direct implementation にしない」と明記、03a/03b/04c/09b には Sheets 直接実装記述なし | PASS |

## 3. drift 一覧（参考）

正本 contract レベルの drift は 0 件。ただし参照 path 表記に以下の差分を検出（contract に影響しない軽微な差分）。

| # | 差分 | 観測 path | 仕様書記載 path | 影響 | 対応 |
| --- | --- | --- | --- | --- | --- |
| 1 | 03a の親ディレクトリ | `completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` | `02-application-implementation/03a-...`（Phase 9 仕様書 / index.md 参照） | path 参照のみ。endpoint / ledger / Secret / Cron / responsibility 一切未変更 | path 更新 PR を別タスクで実施（本タスク docs-only 境界外） |
| 2 | 09b の親ディレクトリ | `02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | `09b-parallel-cron-triggers-monitoring-and-release-runbook/`（index.md / Phase 9 spec の一部参照で省略形混在） | 参照表記の混在のみ | 別タスクで参照統一 |

> 上記 2 件は contract 一致判定（PASS）に影響しない。本 reconciliation の方針合意（案 A）は完全に保たれる。

## 4. 3 点一致確認（ledger / Secret / endpoint）

| 軸 | reconciliation 結論（案 A） | 5 文書での実態 | 一致 / 不一致 |
| --- | --- | --- | --- |
| ledger | `sync_jobs` 単一 | 5 文書すべて `sync_jobs` 単一 | 一致 |
| endpoint | `POST /admin/sync/schema` + `POST /admin/sync/responses` 2 endpoint | 5 文書すべて 2 endpoint | 一致 |
| Secret | Forms 系 3 件 + 共通 2 件 / Sheets 系は廃止候補 | 03a / 03b / legacy umbrella が Forms 系 3 件、04c は admin secret なし、09b は placeholder のみ。Sheets 系の正本登録なし | 一致 |

不一致 0 件。別タスク化キュー登録対象なし。

## 5. legacy umbrella タスクとの整合検証

| 観点 | legacy umbrella spec | 本 reconciliation 結論 | 整合判定 |
| --- | --- | --- | --- |
| 旧 UT-09 の扱い | direct implementation にしない | direct implementation 化を撤回 | 一致 |
| 上流 API | Forms API（`forms.get` / `forms.responses.list`） | Forms API | 一致 |
| endpoint 数 | 2 endpoint（schema / responses） | 2 endpoint | 一致 |
| ledger | `sync_jobs` | `sync_jobs` | 一致 |
| 撤回対象 | Sheets 系実装 | Sheets 系実装 | 一致 |
| 移植対象 | D1 contention mitigation 知見 | retry/backoff・短い transaction・batch-size 制限 | 一致 |

6 観点すべて一致。Phase 10 GO 条件 #6（current facts 5 文書からの逸脱 0 件）を満たす。

## 6. 対象外宣言

| 観点 | 対象外理由 |
| --- | --- |
| a11y（WCAG） | 本タスクは reconciliation の docs-only。UI を持たないため WCAG 観点は対象外。admin UI 側の a11y は 04c / 別 UT で扱う。 |
| 無料枠見積もり | 仕様書のみ。Workers / D1 / API quota への新規負荷は発生しない。Sheets 系撤回 / Forms 系維持の負荷試算は 03a / 03b / 09b の品質要件に既収録。 |
| coverage 閾値 | コード変更を伴わないため Vitest / coverage 閾値は対象外。実装着手時のテスト戦略は 03a / 03b 実装フェーズで扱う。 |

## 7. aiworkflow-requirements 5 同期点

| # | 同期対象 | 本 Phase での扱い | 備考 |
| --- | --- | --- | --- |
| 1 | topic-map.md | drift 検出のみ | 更新 PR は別タスク |
| 2 | quick-reference.md | drift 検出のみ | 更新 PR は別タスク |
| 3 | resource-map.md | drift 検出のみ（03a path 更新は別タスクで反映） | 更新 PR は別タスク |
| 4 | keywords.md | drift 検出のみ | 更新 PR は別タスク |
| 5 | indexes/ | 本タスクで `pnpm indexes:rebuild` は未実施（docs-only 境界） | drift 検出時のみ別タスクで rebuild |

> SKILL.md / topic-map / quick-reference / resource-map / keywords / indexes の **実更新は別タスク**。本 Phase は差分マッピングまで。

## 8. line budget / link 検証

| チェック | 結果 |
| --- | --- |
| Phase 9 本文 line budget（100-300 行） | PASS（254 行） |
| outputs path 整合 | PASS（main.md / contract-sync-check.md 両方が `outputs/phase-09/` 配下） |
| 5 文書 path 実在 | PASS（5 件すべて Read 成功） |
| 03a path drift（completed-tasks 配下） | 注記済み（contract 影響なし） |

## 9. CI ゲート（本タスク該当分）

| Gate | 状態 |
| --- | --- |
| verify-indexes | indexes 直接更新なし → 既存 green を維持 |
| typecheck / lint / vitest / build | コード変更なし → 既存 green を維持 |

## 10. docs-only 境界

- references / indexes の実 PR は **別タスク**
- 03a / 09b の path 表記統一 PR も **別タスク**
- 本タスクは drift 検出 / 差分マッピングまでで完結

## 11. 判定

5 観点（Forms 分割方針 / Sheets 残骸 / endpoint 名 / ledger 名 / Secret 名 / Cron 設定 / responsibility）すべて **PASS**。drift は path 表記の軽微な 2 件のみで、contract レベルの drift 0 件。Phase 10 GO/NO-GO ゲートへ「contract sync 全 PASS」として引き渡す。

状態: spec_created
