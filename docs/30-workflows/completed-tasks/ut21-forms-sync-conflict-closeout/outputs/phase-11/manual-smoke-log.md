# Phase 11 Output: Manual Smoke Log

## 共通メタ

| 項目 | 値 |
| --- | --- |
| 実行日時 (UTC) | 2026-04-30T08:13:52Z |
| 実行ホスト | Darwin 25.3.0 / mise (Node 24.15.0 / pnpm 10.33.2) |
| 作業ディレクトリ | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-154504-wt-3` |
| Token / API Key | 出現せず（参照のみで実行しないため、原則 hit 不要） |

> 各セクションは「コマンド」「期待値」「stdout 抜粋」「件数」「判定」を記載する。

---

## §1. AC-3 / AC-10 — 新設禁止方針 rg（impl / refs）

### コマンド

```bash
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
   docs/30-workflows/02-application-implementation \
   .claude/skills/aiworkflow-requirements/references
```

### 期待値

- 単一 `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` を「新設前提」として記述する hit が **0 件**。
- 出現する hit はすべて
  - (a) prefix 形 `POST /admin/sync/schema` / `POST /admin/sync/responses`（03a / 03b 正本）、または
  - (b) `task-workflow.md` 9 行目の「単一 …、…、…、… は新設しない」明記文脈
  のいずれか。

### stdout 抜粋（全 40 件、抜粋表示）

```
.claude/skills/aiworkflow-requirements/references/api-endpoints.md:72:`POST /admin/sync/responses` は `fullSync=true` と `cursor=<submittedAt|responseId>` を query として受け付ける。
.claude/skills/aiworkflow-requirements/references/api-endpoints.md:270:| 2.6.0   | 2026-04-29 | 03b: `POST /admin/sync/responses` 管理同期 API を追加 |
.claude/skills/aiworkflow-requirements/references/lessons-learned-03a-parallel-forms-schema-sync.md:5:03a-...（POST /admin/sync/schema、cron ...）
.claude/skills/aiworkflow-requirements/references/lessons-learned-03b-response-sync-2026-04.md:51:**苦戦箇所**: cron と手動 `POST /admin/sync/responses` が同時起動して ...
.claude/skills/aiworkflow-requirements/references/task-workflow.md:9:... 単一 `POST /admin/sync`、`GET /admin/sync/audit`、`sync_audit_logs`、`sync_audit_outbox` は新設しない。...
docs/30-workflows/02-application-implementation/_design/phase-2-design.md:166:- **scope in**: ... `POST /admin/sync/schema` の job 関数
docs/30-workflows/02-application-implementation/_design/phase-2-design.md:172:- **scope in**: ... `POST /admin/sync/responses` の job 関数
docs/30-workflows/02-application-implementation/_design/phase-2-design.md:190:- **scope in**: `GET /admin/dashboard`、... `POST /admin/sync/schema` + `POST /admin/sync/responses`
docs/30-workflows/02-application-implementation/07c-.../phase-05.md:170:| POST /admin/sync/schema | sync.schema.run | sync_job |
docs/30-workflows/02-application-implementation/07c-.../phase-05.md:171:| POST /admin/sync/responses | sync.responses.run | sync_job |
docs/30-workflows/02-application-implementation/07c-.../phase-06.md:49:| 12 | sync 失敗 (Forms API) | `POST /admin/sync/responses` 中に外部失敗 ...
docs/30-workflows/02-application-implementation/07c-.../index.md:28:- 既存 admin endpoint への audit hook 注入（... `POST /admin/sync/*`）
docs/30-workflows/02-application-implementation/08a-.../artifacts.json:245:    "POST /admin/sync/schema",
docs/30-workflows/02-application-implementation/08a-.../artifacts.json:246:    "POST /admin/sync/responses"
docs/30-workflows/02-application-implementation/09a-.../artifacts.json:214:    "POST /admin/sync/schema",
docs/30-workflows/02-application-implementation/09a-.../artifacts.json:215:    "POST /admin/sync/responses",
docs/30-workflows/02-application-implementation/09a-.../phase-02.md:34: ... `POST /admin/sync/*` の仕様
docs/30-workflows/02-application-implementation/09a-.../phase-02.md:125:  Eng->>API: POST /admin/sync/schema (admin auth)
docs/30-workflows/02-application-implementation/09a-.../phase-02.md:129:  Eng->>API: POST /admin/sync/responses (admin auth)
docs/30-workflows/02-application-implementation/09a-.../phase-06.md:104:| F-4 | sync 401 | `POST /admin/sync/schema` が 401 ...
docs/30-workflows/02-application-implementation/09a-.../phase-08.md:105:| endpoint | `POST /admin/sync/schema`, `/admin/sync/responses` ...
docs/30-workflows/02-application-implementation/09a-.../phase-11.md:143:| `POST /admin/sync/schema` | 200 + sync_jobs.success | schema_versions 更新 |
docs/30-workflows/02-application-implementation/09a-.../phase-11.md:144:| `POST /admin/sync/responses` | 200 + sync_jobs.success | member_responses 更新 |
docs/30-workflows/02-application-implementation/09a-.../phase-13.md:162:- staging で `POST /admin/sync/schema` + `POST /admin/sync/responses` を手動実行 ...
docs/30-workflows/02-application-implementation/09b-.../artifacts.json:214:    "POST /admin/sync/schema",
docs/30-workflows/02-application-implementation/09b-.../artifacts.json:215:    "POST /admin/sync/responses"
docs/30-workflows/02-application-implementation/09b-.../index.md:60: ... `POST /admin/sync/*` 仕様
docs/30-workflows/02-application-implementation/09b-.../phase-05.md:207:- 手動実行: `POST /admin/sync/schema`, `POST /admin/sync/responses`
docs/30-workflows/02-application-implementation/09b-.../phase-10.md:119:- B-3: 04c の `POST /admin/sync/*` 認可漏れ → 04c へ
docs/30-workflows/02-application-implementation/09b-.../phase-12.md:131:6. 手動 sync 実行（`POST /admin/sync/*`）
docs/30-workflows/02-application-implementation/09c-.../artifacts.json:214:    "POST /admin/sync/schema",
docs/30-workflows/02-application-implementation/09c-.../artifacts.json:215:    "POST /admin/sync/responses",
docs/30-workflows/02-application-implementation/09c-.../index.md:65:- AC-5: production で `POST /admin/sync/schema` + `POST /admin/sync/responses` ...
docs/30-workflows/02-application-implementation/09c-.../phase-01.md:157:| AC-5 | production で `POST /admin/sync/*` success ...
docs/30-workflows/02-application-implementation/09c-.../phase-02.md:125:    SyncTrigger["POST /admin/sync/*\nmanual trigger"]
docs/30-workflows/02-application-implementation/09c-.../phase-02.md:152:| 10 | manual sync trigger | `POST /admin/sync/schema` + `POST /admin/sync/responses` ...
docs/30-workflows/02-application-implementation/09c-.../phase-04.md:127:| S-5 | `POST /admin/sync/schema` + `POST /admin/sync/responses` が 200 ...
docs/30-workflows/02-application-implementation/09c-.../phase-07.md:125:| AC-5 | production で `POST /admin/sync/*` success ...
docs/30-workflows/02-application-implementation/09c-.../phase-08.md:120:| endpoint | `POST /admin/sync/schema` を curl 例ごとに full URL ...
docs/30-workflows/02-application-implementation/09c-.../phase-10.md:147:  - production D1 への手動 sync trigger（POST /admin/sync/*）が発生
```

### 集計

| 区分 | hits |
| --- | --- |
| impl / refs 全体 | 40 |
| (a) prefix 形 `POST /admin/sync/{schema,responses}` または `POST /admin/sync/*` | 39 |
| (b) `task-workflow.md` 「新設しない」明記文 | 1 |
| **新設前提** hits（単一 endpoint / audit table を新規追加する記述） | **0** |
| `GET /admin/sync/audit` | 0 |
| `sync_audit_logs` | 0（task-workflow.md の禁止文中での参照のみ＝(b) と重複カウント） |
| `sync_audit_outbox` | 0（同上） |

### 判定

- **PASS**: 新設前提 hit 0 件。impl / refs 配下に「単一 `POST /admin/sync` を新設」「`GET /admin/sync/audit` 公開 endpoint を追加」「`sync_audit_logs` / `sync_audit_outbox` テーブル DDL を追加」の指示が残っていないことを確認。
- 注: (b) の `task-workflow.md:9` は「新設しない」明記文であり、no-new-endpoint-policy と整合。新設前提ではなく禁止文として AC-3 を満たす。

---

## §2. AC-1 — UT-21 legacy 仕様書の状態欄

### コマンド

```bash
rg -nC3 "状態|close-out|Forms sync が正本|legacy" \
   docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | head -40
```

### stdout 抜粋（行 8〜14）

```
8-| タスク名 | Sheets→D1 sync endpoint 実装と audit logging |
9-| 優先度 | HIGH |
10-| 推奨Wave | Wave 1 |
11:| 状態 | legacy / close-out 済（`task-ut21-forms-sync-conflict-closeout-001` により現行 Forms sync 正本へ吸収。単一 `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` は本タスクで新設しない） |
12-| 作成日 | 2026-04-26 |
13-| 既存タスク組み込み | 03a / 03b / 04c / 09b（有効品質要件のみ移植。Sheets direct implementation としては進めない） |
14-| 組み込み先 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/` |
```

### 判定

- **PASS**: 状態欄に
  - `legacy / close-out 済` ✓
  - `現行 Forms sync 正本へ吸収` ✓
  - `単一 POST /admin/sync / GET /admin/sync/audit / sync_audit_logs / sync_audit_outbox は本タスクで新設しない` ✓
  の 3 文言を確認。

---

## §3. AC-5 — 後続 U02 / U04 / U05 の存在

### コマンド

```bash
for f in \
  docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md \
  docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md \
  docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md; do
  test -e "$f" && echo "OK $f" || echo "MISSING $f"
done
```

### stdout

```
OK docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md
OK docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md
OK docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md
```

### 判定

- **PASS**: 3 ファイルすべて存在（U02 / U04 / U05）。

---

## §4. AC-7 — aiworkflow-requirements current facts 整合（外形のみ）

### コマンド

```bash
rg -n "UT-21|sync_jobs|forms\.get|forms\.responses\.list|sync-forms-responses" \
   .claude/skills/aiworkflow-requirements/references/task-workflow.md | head -10
```

### stdout 抜粋

```
.claude/skills/aiworkflow-requirements/references/task-workflow.md:9:2026-04-30 時点で `UT-21`（Sheets→D1 sync endpoint 実装と audit logging）は legacy umbrella として close-out 済み。現行正本は Forms sync（`forms.get` / `forms.responses.list`、`POST /admin/sync/schema` / `POST /admin/sync/responses`、`sync_jobs` ledger、`apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`）であり、単一 `POST /admin/sync`、`GET /admin/sync/audit`、`sync_audit_logs`、`sync_audit_outbox` は新設しない。
```

### 判定

- **PASS**: 同期元 = Forms API、ledger = `sync_jobs`、実装パス = `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` の 3 軸が一致。詳細は `spec-integrity-check.md` 参照。

---

## §5. AC-9 — 不変条件 #5 違反検出

### コマンド

```bash
rg -n "apps/web.*D1|D1.*apps/web|Sheets API.*direct|spreadsheets\.values\.get" \
   docs/30-workflows/ut21-forms-sync-conflict-closeout/
```

### 集計

| 区分 | hits |
| --- | --- |
| 全 hit 数 | 33 |
| 「禁止」「排除」「ゼロ」「Sheets 経路への復帰なし」「混入していないか」文脈 | 33 |
| **不変条件 #5 違反前提**（`apps/web` から D1 直接アクセスを誘導 / Sheets API direct を正本化 する記述） | **0** |

### 代表的 hit 文脈（すべて禁止文脈）

```
phase-09/main.md:69: | #5 | D1 直接アクセスは `apps/api` に閉じる | `apps/web` から D1 直接アクセス示唆記述なし、新設 endpoint 言及も `apps/api` 内のみ | 0 ...
phase-08/main.md:33: | `spreadsheets.values.get` | Phase 1 §5 stale 前提表 / Phase 2 migration-matrix / ... | 引用文脈のみ残置 | UT-21 legacy 由来の Before 表記 |
phase-08/main.md:60: | 同期元 API | `spreadsheets.values.get` | `forms.get` / `forms.responses.list` | 03a / 03b 正本 |
phase-02/migration-matrix-design.md:53: | 1 | 同期元 = Google Sheets API v4 (`spreadsheets.values.get`) | Google Forms API ... | Sheets 経路への復帰なし。
phase-05/implementation-runbook.md:51: + AC-Z: middleware は `apps/api` 内に閉じ、`apps/web` から D1 / Secret に直接アクセスしない（不変条件 #5）
```

### 判定

- **PASS**: 違反 0 件。`spreadsheets.values.get` は Before 列（UT-21 legacy 由来の引用）または「Sheets 経路への復帰なし」文脈でのみ出現。`apps/web→D1` は「アクセスしない」否定文脈でのみ出現。

---

## §6. AC-11 — GitHub Issue #234 状態確認

### コマンド

```bash
gh issue view 234 --json state,title,url
```

### stdout

```json
{"state":"CLOSED","title":"[task-ut21-forms-sync-conflict-closeout-001] UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out","url":"https://github.com/daishiman/UBM-Hyogo/issues/234"}
```

### 判定

- **PASS**: `state == CLOSED`。原典指示通り CLOSED のまま維持し、再オープンしない。

---

## §7. 補助検証 — artifacts.json 構文 / 作業ツリー clean

### コマンド

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/ut21-forms-sync-conflict-closeout/artifacts.json','utf8')); console.log('OK')"
git status --short apps packages .github/workflows apps/web/wrangler.toml apps/api/wrangler.toml
```

### stdout

```
OK
（git status: 変更なし）
```

### 判定

- **PASS**: artifacts.json 構文 OK、`apps/` / `packages/` / `.github/workflows` / wrangler.toml に未コミット変更なし（docs-only 整合）。

---

## 注記

- 単一 `POST /admin/sync` 文字列は、本仕様書空間および `task-workflow.md:9` の「禁止方針」説明、ならびに `POST /admin/sync/schema` / `POST /admin/sync/responses` の **prefix** として出現するのみ。**単一 endpoint 新設の指示はゼロ**である。
- `rg -n "POST /admin/sync\b" ...` の `\b` は単語境界であり、`POST /admin/sync/schema` のように直後が `/`（非単語文字）の場合もマッチする。そのため hit 件数を「prefix 形 vs 単独形」で目視分類する必要がある（本ログの集計表を参照）。
- 実 secrets / 実 D1 環境 smoke は `UT21-U04`（`task-ut21-phase11-smoke-rerun-real-env-001`）に委譲。本 Phase は docs-only smoke のみ。
