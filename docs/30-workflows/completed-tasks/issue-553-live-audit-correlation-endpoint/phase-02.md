# Phase 2: アーキテクチャ設計 / モジュール配置 / データフロー / env binding 整理

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| Source | `outputs/phase-2/phase-2.md` |
| 区分 | 設計（Hono route / scheduled handler / orchestration / persist / notify-slack の物理配置とデータフロー確定） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 1 で確定した SSOT（D1 永続化 / scheduled handler 制約 / internal token authz / salt rotation）を前提に、`apps/api/src/routes/audit-correlation/`、`apps/api/src/audit-correlation/`、`apps/api/wrangler.toml`、`apps/api/migrations/` の物理配置・データフロー・env binding を確定する。Phase 3 詳細設計と Phase 5 実装が同じ配置に収束するように契約として固定する。

## 実行タスク

1. **モジュール配置**

   ```
   apps/api/
   ├── src/
   │   ├── routes/audit-correlation/
   │   │   ├── index.ts            # 新規: barrel + Hono router export
   │   │   └── run.ts              # 新規: POST /internal/audit-correlation/run + internal token authz
   │   ├── audit-correlation/
   │   │   ├── correlate.ts        # 既存（#516）
   │   │   ├── github-fetch.ts     # 既存（#516）
   │   │   ├── redact.ts           # 既存（#516）
   │   │   ├── types.ts            # 既存（#516）/ 必要なら型追加
   │   │   ├── errors.ts           # 既存（#516）/ 必要なら型追加
   │   │   ├── scheduled.ts        # 新規: Worker `scheduled` event handler の薄い entry
   │   │   ├── run-correlation.ts  # 新規: route と scheduled の共通 orchestration
   │   │   ├── persist.ts          # 新規: D1 redact-safe insert
   │   │   ├── notify-slack.ts     # 新規: Slack incoming webhook 投稿（HIGH のみ）
   │   │   ├── runbook-url.ts      # 新規: finding 種別 → runbook anchor URL 純関数
   │   │   └── __tests__/          # 新規追加テスト群（Phase 4 で確定）
   │   └── index.ts                # 編集: route mount + scheduled export
   ├── migrations/
   │   └── NNNN_audit_correlation_findings.sql  # 新規: D1 schema
   └── wrangler.toml               # 編集: [triggers] crons + secrets binding
   ```

2. **データフロー（live wiring）**

   ```
   [trigger entry]
     ├─ POST /internal/audit-correlation/run
     │     └─ internal token authz → runCorrelation()
     └─ scheduled (cron */15)
           └─ ctx.waitUntil(runCorrelation())

   [runCorrelation() = run-correlation.ts]
     1. getEnv(c)   → { AUDIT_CORRELATION_SALT, GITHUB_AUDIT_PAT, SLACK_AUDIT_INCIDENT_WEBHOOK_URL,
                       AUDIT_CORRELATION_INTERNAL_TOKEN, DB(D1Database), ENVIRONMENT }
     2. fetchGitHubAuditEvents(opts)  ← github-fetch.ts (#516 既存)
     3. (Cloudflare 側 finding は本タスクでは「過去 cron で永続化済 D1 row」または既存 #408 出力を入力。
         本 Phase では SSOT として「Cloudflare 側入力は D1 から SELECT」を確定する)
     4. redactGitHub() / redactCloudflare()  ← redact.ts (#516 既存)
     5. correlate() → CorrelatedFinding[]    ← correlate.ts (#516 既存)
     6. persist(findings, env.DB)            ← persist.ts (新規)
     7. for HIGH finding: notify-slack.ts → Slack incoming webhook (redact-safe payload + runbook URL)
   ```

   - **GitHub fetch → 永続化 → 通知** の順序を厳守し、Slack 通知失敗が D1 永続化を阻害しないように `notify-slack` は best-effort（throw せずログのみ）に設計する。
   - `runCorrelation()` は冪等性を持たせるため、D1 insert 時に `(fingerprint_hash_prefix, occurred_at)` UNIQUE 制約で重複 row を弾く（Phase 3 で SQL 確定）。

3. **外部 API 接続点**

   | 接続先 | 経路 | secret 名 |
   | --- | --- | --- |
   | GitHub `/orgs/{org}/audit-log` | `fetchGitHubAuditEvents` | `GITHUB_AUDIT_PAT` |
   | Slack incoming webhook | `notify-slack.ts` | `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` |
   | D1 (`audit_correlation_findings`) | `env.DB` binding | binding `DB` (既存) |
   | internal token authz | request header vs `AUDIT_CORRELATION_INTERNAL_TOKEN` | `AUDIT_CORRELATION_INTERNAL_TOKEN` |

4. **`apps/api/wrangler.toml` env binding 整理**

   ```toml
   # ルートの [triggers]（dev / staging / production 共通の cron 既定）
   [triggers]
   crons = ["*/15 * * * *"]

   # D1 binding は既存（task-02 wrangler-env-injection で確定済）
   # secrets は wrangler.toml に値を書かず bash scripts/cf.sh secret put で per-env 投入する
   #   - GITHUB_AUDIT_PAT
   #   - SLACK_AUDIT_INCIDENT_WEBHOOK_URL
   #   - AUDIT_CORRELATION_SALT
   #   - AUDIT_CORRELATION_INTERNAL_TOKEN

   [env.staging.triggers]
   crons = ["*/15 * * * *"]

   [env.production.triggers]
   crons = ["*/15 * * * *"]
   ```

   - 非機密 vars（`AUDIT_CORRELATION_RUNBOOK_BASE_URL` 等）は `[vars]` / `[env.<env>.vars]` に置く。
   - secret 値は wrangler.toml に **絶対に書かない**（CLAUDE.md「平文 .env はリポジトリにコミットしない」遵守）。
   - env 参照は `apps/api` 配下では `getEnv()` 経由のみ（`process.env.*` 直接参照禁止）。

5. **`getEnv()` schema 拡張（Phase 3 で zod schema 確定）**

   - 追加対象: `GITHUB_AUDIT_PAT` / `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_INTERNAL_TOKEN` / `AUDIT_CORRELATION_RUNBOOK_BASE_URL` / `AUDIT_CORRELATION_GITHUB_ORG`。
   - 全て `z.string().min(1)`、ただし local dev で値未設定でも boot 阻害しない設計とするため `getEnv()` は parse 失敗時 throw、`runCorrelation()` 入口で catch して 503 を返す（boot 自体は止めない）。

6. **モジュール責務の境界**

   | モジュール | 純関数 / 副作用 | 依存 |
   | --- | --- | --- |
   | `runbook-url.ts` | 純関数 | なし |
   | `redact.ts` / `correlate.ts` | 純関数（既存） | なし |
   | `github-fetch.ts` | 副作用（fetch） | global `fetch` |
   | `persist.ts` | 副作用（D1 write） | `env.DB` |
   | `notify-slack.ts` | 副作用（fetch） | `env.SLACK_AUDIT_INCIDENT_WEBHOOK_URL` + global `fetch` |
   | `run-correlation.ts` | orchestration | 上記すべて |
   | `routes/audit-correlation/run.ts` | Hono handler + authz | `getEnv` + `runCorrelation` |
   | `audit-correlation/scheduled.ts` | Worker scheduled entry | `runCorrelation` + `ctx.waitUntil` |

7. **`.github/workflows/*.yml` 衝突確認 gate**
   - 既存 `audit-correlation-verify.yml` を編集（新規追加ではなく live mode grep gate ジョブを増やす）。
   - 名前衝突なしを `ls .github/workflows/` で確認する旨を outputs に記録。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/src/routes/audit-correlation/index.ts` | 新規 | barrel + Hono router export |
| `apps/api/src/routes/audit-correlation/run.ts` | 新規 | `POST /internal/audit-correlation/run` + internal token authz |
| `apps/api/src/audit-correlation/scheduled.ts` | 新規 | Worker `scheduled` event handler entry |
| `apps/api/src/audit-correlation/run-correlation.ts` | 新規 | route と scheduled の共通 orchestration |
| `apps/api/src/audit-correlation/persist.ts` | 新規 | D1 redact-safe insert |
| `apps/api/src/audit-correlation/notify-slack.ts` | 新規 | Slack incoming webhook 投稿 |
| `apps/api/src/audit-correlation/runbook-url.ts` | 新規 | runbook anchor URL 純関数 |
| `apps/api/src/index.ts` | 編集 | router mount + `scheduled` export |
| `apps/api/src/lib/env.ts` | 編集 | `getEnv()` schema に live wiring 用 var / secret 追加 |
| `apps/api/wrangler.toml` | 編集 | `[triggers] crons` 追加 / 非機密 vars 追加 |
| `apps/api/migrations/NNNN_audit_correlation_findings.sql` | 新規 | D1 schema migration |

## 関数・型シグネチャ案（境界の概略・詳細は Phase 3）

```ts
// run-correlation.ts
export interface RunCorrelationDeps {
  readonly env: AuditCorrelationEnv;
  readonly now?: () => Date;
}
export interface RunCorrelationResult {
  readonly fetched: number;
  readonly persisted: number;
  readonly notifiedHigh: number;
}
export function runCorrelation(deps: RunCorrelationDeps): Promise<RunCorrelationResult>;

// scheduled.ts
export function scheduled(event: ScheduledEvent, env: AuditCorrelationEnv, ctx: ExecutionContext): void;
```

## 入出力・副作用

| 境界 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `routes/audit-correlation/run.ts` | HTTP request (`Authorization: Bearer ...`) | 200 / 401 / 503 JSON | `runCorrelation` 経由で D1 / Slack |
| `audit-correlation/scheduled.ts` | `ScheduledEvent` | void | `ctx.waitUntil(runCorrelation(...))` |
| `run-correlation.ts` | `env` + `now` | `RunCorrelationResult` | GitHub fetch / D1 write / Slack POST |
| `persist.ts` | `findings[]` + `env.DB` | persisted 件数 | D1 INSERT（UNIQUE 競合は無視 = 冪等） |
| `notify-slack.ts` | `finding` + `env` | void（best-effort） | Slack POST。失敗は throw せずログのみ |

## テスト方針

本 Phase はテスト追加なし。Phase 4 で以下契約を vitest / bats 化:
- route authz（401 / 200 / 503）
- persist redact-safe insert + UNIQUE 競合冪等
- notify-slack payload 検証 + best-effort（webhook 失敗で orchestration 止まらない）
- orchestration mock（fetch + D1 + Slack をすべて mock）
- bats live mode dry-run

## ローカル実行・検証コマンド

```bash
# 既存ワークフロー名衝突確認
ls .github/workflows/ | grep audit-correlation

# 親実装 module の存在確認
test -f apps/api/src/audit-correlation/correlate.ts
test -f apps/api/src/audit-correlation/github-fetch.ts
test -f apps/api/src/audit-correlation/types.ts

# wrangler.toml の現状確認（cron 未設定であること）
grep -n "triggers" apps/api/wrangler.toml || echo "no triggers yet (expected)"

# Cloudflare 疎通
bash scripts/cf.sh whoami
```

## 統合テスト連携

- Phase 3 は本 Phase のモジュール配置に対し型 / SQL DDL / Slack payload schema を確定する。
- Phase 4 は本 Phase のデータフローに対し vitest / bats 契約テストを設計する。
- Phase 5 実装は本 Phase の責務境界（純関数 vs 副作用）を逸脱しない。
- Phase 7 CI gate は本 Phase の workflow 名衝突なし確認結果を入力とする。

## 参照資料

- Phase 1 outputs（SSOT）
- 親 Phase 2: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-02.md`
- CLAUDE.md「主要ディレクトリ」「重要な不変条件 5（D1 直接アクセスは apps/api に閉じる）」
- CLAUDE.md「`apps/api` env アクセス不変条件」
- Cloudflare Workers Cron Triggers / `scheduled` handler / `ctx.waitUntil`

## 成果物

- `outputs/phase-2/phase-2.md`
  - モジュール配置 ASCII 図
  - データフロー図（trigger → orchestration → persist → notify）
  - 外部 API 接続点一覧（PAT / webhook / D1 / internal token）
  - wrangler.toml の `[triggers]` 配置設計
  - getEnv schema 拡張対象 6 var / secret 一覧
  - 純関数 vs 副作用モジュールの責務境界表
  - 既存ワークフロー名衝突なしの確認結果

## 完了条件（DoD）

- [ ] `apps/api/src/routes/audit-correlation/{index,run}.ts` と `apps/api/src/audit-correlation/{scheduled,run-correlation,persist,notify-slack,runbook-url}.ts` の 7 拠点配置が確定。
- [ ] データフローが Phase 1 SSOT と整合（GitHub fetch → redact → correlate → persist → notify の順 / Slack は best-effort）。
- [ ] `apps/api/wrangler.toml` の `[triggers]` および `[env.staging.triggers]` / `[env.production.triggers]` の cron 配置が決定。
- [ ] `getEnv()` schema に追加する 6 var / secret（`GITHUB_AUDIT_PAT` / `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_INTERNAL_TOKEN` / `AUDIT_CORRELATION_RUNBOOK_BASE_URL` / `AUDIT_CORRELATION_GITHUB_ORG`）が確定。
- [ ] 純関数 / 副作用モジュールの責務境界が表で明示されている。
- [ ] D1 migration ファイル（`NNNN_audit_correlation_findings.sql`）の配置先が確定（DDL 内容は Phase 3）。
- [ ] `.github/workflows/audit-correlation-verify.yml` 名衝突なしが確認されている。
