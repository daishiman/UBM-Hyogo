# Phase 2 設計成果物 — 選択肢 A / B 比較マトリクス

正本仕様: `../../phase-02.md` / `../../index.md`
タスク ID: task-ut09-direction-reconciliation-001
作成日: 2026-04-29
実行種別: docs-only / direction-reconciliation / NON_VISUAL
推奨方針: **A — current Forms 分割方針へ寄せる**（B 選択は要ユーザー承認）
AC トレース: AC-1 / AC-10

---

## 0. 比較対象の正本語彙

| 略号 | 正本 |
| --- | --- |
| A（推奨） | **Forms 分割方針**: `forms.get` / `forms.responses.list` を上流とし、`POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 endpoint と `sync_jobs` ledger に責務分割（task-sync-forms-d1-legacy-umbrella-001 起点） |
| B（要承認） | **Sheets 直接実装方針**: Google Sheets API v4 を上流とし、単一 `POST /admin/sync` と `sync_locks` + `sync_job_logs` の 2 ledger を採用（旧 ut-09-sheets-to-d1-cron-sync-job 系） |

---

## 1. 4 条件 + 5 観点 比較マトリクス（AC-1 / 9 行 × 2 列・空セルゼロ）

| # | 観点 | 選択肢 A: Forms 分割方針へ寄せる（推奨） | 選択肢 B: Sheets 採用方針 |
| --- | --- | --- | --- |
| 1 | **価値性** | PASS — current 方針と整合し、後続 4 タスク（03a / 03b / 04c / 09b）が無変更で前進可能。stale contract の誤参照を構造的に防げる。 | PASS — Sheets 直接実装で短期実装コストは低い。ただし正本広範囲更新を要するため中長期コストは高い。 |
| 2 | **実現性** | PASS — 撤回（コード / migration）+ 03a / 03b / 09b への品質要件移植のみ。docs-only 境界に収まる。 | MINOR — legacy umbrella + 03a / 03b / 04c / 09b + aiworkflow-requirements references（4 件）+ topic-map / LOGS を same-wave 更新。広範囲。 |
| 3 | **整合性（不変条件 #1 / #4 / #5 / #6）** | PASS — schema は mapper.ts に閉じる方針維持。GAS prototype 本番昇格回避（#6）も current のまま。 | MINOR — 不変条件 #6（GAS prototype 延長扱い）に対する再検証手順が追加で必要。 |
| 4 | **整合性（current facts）** | PASS — legacy umbrella 維持で正本変更なし。 | **MAJOR** — current 方針（旧 UT-09 を direct implementation にしない）の更新が必須。 |
| 5 | **運用性** | PASS — 運用変更なし。`scripts/cf.sh` 経由の wrangler / 1Password 参照（`op://Employee/ubm-hyogo-env/<FIELD>`）は維持。 | MINOR — references 更新後の運用見直しが必要。staging smoke 再走行（UT-26）も切替。 |
| 6 | **API 契約** | `POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 endpoint（04c と整合）。middleware 挿入点 `app.use('/admin/sync*', adminAuth)`。 | 単一 `POST /admin/sync`（04c 正本との競合を解消する same-wave 更新が必要）。middleware 挿入点は同じ。 |
| 7 | **D1 ledger** | `sync_jobs` 単一（current 維持）。status / started_at / finished_at / error を一括取得。 | `sync_locks` + `sync_job_logs` の 2 ledger を正式採用（database-schema.md の更新が必要）。lock TTL と log retention を分離管理。 |
| 8 | **Secret 名** | 共通: `SYNC_ADMIN_TOKEN` / `ADMIN_ROLE_EMAILS`。<br/>採用時のみ: `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`。<br/>廃止候補: `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`。 | 共通: `SYNC_ADMIN_TOKEN` / `ADMIN_ROLE_EMAILS`。<br/>採用時のみ: `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`。<br/>不要: `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`。 |
| 9 | **Cron runbook** | 09b の `/admin/sync/schema` → `/admin/sync/responses` 2 経路を順序付きで呼び出す runbook を維持。M5 二重起動防止を強化。 | 09b を `/admin/sync` 単一経路前提に再設計。scheduled handler を単一 sync 経路へ書換。 |
| 10 | **監査ログ連携** | `sync_jobs` row を audit 源として継続。outbox 不要。 | `sync_job_logs` を audit 源として正式採用。outbox 設計を別途検討。 |

> マトリクス備考: A は **MAJOR ゼロ・MINOR ゼロ**。B は **MAJOR 1（#4 current facts）/ MINOR 3（#2 実現性 / #3 不変条件 #6 / #5 運用性）**。Phase 3 の 30 種思考法レビューで MAJOR の解消可否を判定する。

---

## 2. 4 条件評価サマリー（AC-12 入力）

| 条件 | A 判定 | B 判定 | 採用方針共通の根拠 |
| --- | --- | --- | --- |
| 価値性 | PASS | PASS | 両案ともに reconciliation 完了で後続 PR 経路が解放される |
| 実現性 | PASS | MINOR | A は docs-only 内で完結 / B は references 同期が広範囲 |
| 整合性 | PASS | MINOR + MAJOR | 不変条件 #1 / #4 / #5 / #6 + current facts |
| 運用性 | PASS | MINOR | A は運用変更なし / B は smoke 再走行と references 運用見直し |

---

## 3. 採用方針 B（Sheets）選択時の前提条件（AC-10）

B を最終採用する場合、**必ずユーザー承認**を取得した上で、以下のすべてを別タスクで same-wave 更新する。本 reconciliation タスク（docs-only）はこれらを **実施せず、リスト化までで完結**する。

### 3.1 仕様書（5 文書）

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` — current 方針（direct implementation 禁止）を撤回
- `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` — Sheets 前提へ責務再設計
- `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` — Sheets 前提へ責務再設計
- `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` — `/admin/sync*` を単一 endpoint に書換
- `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` — scheduled handler を単一 sync 経路に書換

### 3.2 aiworkflow-requirements references（4 件）

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` — `/admin/sync*` 単一登録
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` — `sync_locks` + `sync_job_logs` 正本登録
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md` — `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` 登録
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` — Sheets SA JSON 注入経路を正本化

### 3.3 indexes / 下流

- `.claude/skills/aiworkflow-requirements/indexes/topic-map.json` / `LOGS` — `pnpm indexes:rebuild` 必須
- `docs/30-workflows/UT-26-staging-deploy-smoke/` — smoke シナリオを Sheets 経路に切替
- `wrangler.toml` の `[triggers]` — Sheets 単一経路前提に schedule 再設計

### 3.4 承認ゲート

- ユーザー承認が **取得できない場合**、Mermaid（reconciliation-design.md §1）`FallbackA` 経路で **自動的に A へフォールバック** する。
- 承認取得後も、本 reconciliation タスクは docs-only であるため、上記 3.1〜3.3 の実施は **別タスク**として個別に起票する。

---

## 4. 推奨判断（Phase 3 入力）

- **推奨 = A（Forms 分割方針）**。
- 推奨理由（3 軸）:
  1. **current 整合**: legacy umbrella を撤回せず、二重正本問題を最小コストで解消できる。
  2. **same-wave 更新コスト**: B は仕様 5 + references 4 + indexes + 下流の同時更新が必要。A は同コストゼロ。
  3. **03a〜09b 影響範囲**: A は 03a / 03b / 09b に「品質要件追記」のみ（D1 contention 知見 M1〜M5）。04c は無変更。B は 4 タスクすべて責務再設計。

---

## 5. AC トレース

| AC | 充足箇所 |
| --- | --- |
| AC-1 | §1 マトリクス（4 条件 + 5 観点 = 9 行 × 2 列、空セルゼロ） |
| AC-10 | §3 B 採用時の正本広範囲更新リスト + ユーザー承認前提 + フォールバック経路 |

---

状態: spec_created → completed
