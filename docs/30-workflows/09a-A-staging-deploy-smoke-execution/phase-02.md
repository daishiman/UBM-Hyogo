# Phase 2: 設計 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 1 の DoD を実 staging 環境で達成するための実行アーキテクチャ・コマンド契約・evidence データ構造・rollback 手順を確定する。設計対象に Cloudflare Workers / D1 / Forms quota への副作用が含まれるため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 2 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1 で固定した 13 evidence と 4 approval gate を、(a) 実行アーキテクチャ、(b) コマンド契約、(c) 入出力データ構造、(d) エラーハンドリング、(e) rollback 手順 として設計し、Phase 5 ランブックと Phase 11 実測がそのまま追従できる粒度に落とす。

## 実行アーキテクチャ

```
[operator + Claude Code]
        │ (G1〜G4 approval gates)
        ▼
   bash scripts/cf.sh ...
        │ (op run --env-file=.env で 1Password から CLOUDFLARE_API_TOKEN 注入)
        │ (mise exec -- node_modules/.bin/wrangler 経由)
        ▼
┌──────────────────────────────────────────┐
│ Cloudflare staging                        │
│  ├ Workers: ubm-hyogo-api-staging         │
│  ├ Workers: ubm-hyogo-web-staging         │
│  └ D1     : ubm-hyogo-db-staging          │
│             (id 990e5d6c-51eb-...)        │
└──────────────────────────────────────────┘
        │   ▲                    │
        │   │ wrangler tail       │
        ▼   │                    ▼
   curl smoke / Playwright    Forms API (Google)
        │                          │
        ▼                          ▼
    outputs/phase-11/evidence/   sync_jobs / audit_log
```

実行は全てローカル端末（Node 24 / pnpm 10 / mise）から `bash scripts/cf.sh` 経由。CI（GitHub Actions）からの実行は本タスクでは採用しない（理由は Phase 3 代替案で詳述）。

## 変更対象ファイル一覧

### 新規作成（evidence）

`docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/` 配下:

| パス | 形式 | 取得元コマンド |
| --- | --- | --- |
| `deploy-api-staging.log` | text | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` |
| `deploy-web-staging.log` | text | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |
| `curl-public-healthz.log` | text | `curl -sSi https://<api-staging>/healthz` |
| `curl-public-members-base.log` | text | `curl -sSi 'https://<api-staging>/public/members'` |
| `curl-public-members-q.log` | text | `curl -sSi 'https://<api-staging>/public/members?q=...'` |
| `curl-public-members-zone.log` | text | `?zone=<value>` |
| `curl-public-members-status.log` | text | `?status=<value>` |
| `curl-public-members-tag.log` | text | `?tag=<value>` |
| `curl-public-members-sort.log` | text | `?sort=<value>` |
| `curl-public-members-density.log` | text | 08a-B Phase 11 contract の density runtime evidence と整合 |
| `curl-authz-me-unauth.log` | text | `curl -sSi https://<api-staging>/me`（401 期待） |
| `curl-authz-admin-unauth.log` | text | `curl -sSi https://<api-staging>/admin/members`（401/403 期待） |
| `curl-authz-admin-member-role.log` | text | member role セッションで `/admin/*`（403 期待） |
| `screenshots/public-members-staging.png` | png | Playwright |
| `screenshots/login-staging.png` | png | Playwright |
| `screenshots/me-staging.png` | png | Playwright |
| `screenshots/admin-staging.png` | png | Playwright |
| `playwright-staging/` | dir | `pnpm --filter web playwright test --config=...staging.ts --reporter=html` |
| `forms-schema-sync.log` | text | api 側 admin endpoint POST（Phase 5 で確定） |
| `forms-responses-sync.log` | text | 同上 |
| `sync-jobs-staging.json` | json | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20"` |
| `audit-log-staging.json` | json | 同上で `audit_log` |
| `wrangler-tail.log` | text | `bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty`（30 分相当 / redact 済み） |
| `d1-migrations-staging.log` | text | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` |
| `d1-schema-parity.json` | json | 後述スキーマ |

### 更新（既存ドキュメント）

| パス | 更新内容 |
| --- | --- |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/main.md` | 各 evidence への相対参照と PASS/FAIL 判定 |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-12/main.md` | サマリ・残課題・09c 引き渡し条件 |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/main.md` | `NOT_EXECUTED` 行を本タスク evidence への参照リンクで置換 |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/manual-smoke-log.md` | 実測結果サマリへ更新 |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/sync-jobs-staging.json` | 親タスク側にもミラー（または参照リンク） |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/wrangler-tail.log` | 同上 |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json` | 親タスク側 phase state を実測完了に更新 |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/artifacts.json` | parity 維持 |
| `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` | blocker 状態 / 残課題 / 09a-A evidence へのリンク |
| `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` | status を実施済み（または 09a-A への移譲完了）に更新 |

## コマンド契約

### 認証 / 事前確認

```
bash scripts/cf.sh whoami
# 期待: account_id / token scope に Workers Scripts:Edit / D1:Edit / Pages:Edit を含む
```

### Deploy（G1）

```
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \
  | tee outputs/phase-11/evidence/deploy-api-staging.log
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  | tee outputs/phase-11/evidence/deploy-web-staging.log
```

期待: ログに `Deployed ubm-hyogo-{api,web}-staging` と version ID / URL。

### D1 migration（G2）

```
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-11/evidence/d1-migrations-staging.log
# pending=0 でなければ user 承認後:
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```

### D1 schema parity 取得

```
for t in member_responses member_identities member_status deleted_members \
         sync_jobs audit_log magic_tokens tag_assignment_queue \
         meeting_sessions member_attendance admin_member_notes tag_assignment_queue; do
  bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
    --command "PRAGMA table_info($t)" > /tmp/staging-$t.json
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod    --env production --json \
    --command "PRAGMA table_info($t)" > /tmp/prod-$t.json
done
# 整形して d1-schema-parity.json に集約（後述スキーマ）
```

production 側 D1 への read-only クエリ（`PRAGMA` / `SELECT`）は parity 検証目的に限り許容。`migrations apply` / `INSERT` / `UPDATE` / `DELETE` は本タスクで production に対して実行禁止。

### curl smoke

```
curl -sSi 'https://<api-staging>/public/members?q=foo&zone=A&status=active&tag=t1&sort=name' \
  | tee outputs/phase-11/evidence/curl-public-members-q.log
```

08a-B Phase 11 contract の `q` / `zone` / `status` / `tag` / `sort` / density combination を網羅する。

### Playwright UI smoke

```
pnpm --filter web exec playwright test \
  --config=playwright.staging.config.ts \
  --reporter=html,list \
  --output=docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/playwright-staging
```

target URL は staging Workers URL。テストアカウント（`manjumoto.daishi@senpai-lab.com` / `manju.manju.03.28@gmail.com`）は op secret で注入。

### Forms sync（G3）

api 側の admin sync endpoint を operator 認証で叩き、log を tee。`sync_jobs` / `audit_log` の増分行を D1 query で抽出。

### wrangler tail

```
bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \
  | scripts/lib/redact.sh \
  | tee outputs/phase-11/evidence/wrangler-tail.log
```

redact 対象: Authorization header / Cookie / email / token / IP。`scripts/lib/redact.sh` が未存在の場合は Phase 5 で `sed` ベースの inline redact を runbook に明記する。

## 入出力データ構造

### `d1-schema-parity.json`

```jsonc
{
  "generatedAt": "2026-05-05T...Z",
  "stagingDatabase": "ubm-hyogo-db-staging",
  "productionDatabase": "ubm-hyogo-db-prod",
  "tables": [
    {
      "name": "member_responses",
      "stagingColumns": [{ "name": "id", "type": "TEXT", "notnull": 1, "pk": 1 }, ...],
      "productionColumns": [...],
      "diff": { "missingInStaging": [], "missingInProduction": [], "typeMismatch": [] }
    },
    ...
  ],
  "indexes": [
    { "name": "idx_admin_notes_member_type", "stagingExists": true, "productionExists": true }
  ],
  "summary": { "diffCount": 0, "productionMigrationTodo": null }
}
```

`diffCount > 0` の場合 `productionMigrationTodo` に `unassigned-task` の起票パスを記録。

### `sync-jobs-staging.json`

```jsonc
{
  "queryAt": "2026-05-05T...Z",
  "rows": [
    { "id": 123, "kind": "schema|responses", "status": "succeeded|failed",
      "started_at": "...", "finished_at": "...", "error": null, "stats": {...} }
  ]
}
```

### `audit-log-staging.json`

直近 sync 関連のみ抽出（PII カラムは redact 後に保存）。

## エラーハンドリング

| 事象 | 検知 | 対応 |
| --- | --- | --- |
| `cf.sh whoami` 失敗 | exit != 0 | 1Password / op 認証を再確認。値は記録しない |
| api/web deploy 失敗 | `Deployed` 文字列なし / exit != 0 | ログを `deploy-*-staging.log` に保存し、原因（build error / binding 不整合）を `outputs/phase-11/main.md` に記録、修正は `unassigned-task/` 起票で先送りせず処理境界を明示 |
| D1 pending migration 検出 | `migrations list` に `[ ]` 行 | G2 ゲートで user 承認 → apply。承認得られない場合は理由を evidence に記録し pending のまま停止（CONST_007 例外条件: production 直前の pending は 09c blocker で扱う） |
| D1 schema parity 差分 | `d1-schema-parity.json.diffCount > 0` | production 側 migration TODO を `docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md`（仮）として起票 |
| curl smoke 4xx/5xx（期待外） | status code 比較 | レスポンス全文を log に保存、Workers 側ログ（wrangler tail）と突き合わせ |
| Playwright timeout | reporter で fail | trace を保存、再実行は最大 2 回まで（flaky 切り分け） |
| Forms sync 409（多重実行） | response body | evidence として保存、lock 解放後再実行 |
| Forms quota 枯渇 | 429 / quota error | 翌日リトライをスケジュール、`outputs/phase-11/main.md` に翌日対応 TODO を残し本 Phase は他 evidence のみで完了させない |
| wrangler tail 取得不能 | exit != 0 / token scope 不足 | 不能理由を `wrangler-tail.log` に明記（CONST_007 例外: ログ取得不能は AC により許容） |

## セキュリティ

- secret 値は `op://Vault/Item/Field` 参照のみ。`.env` に実値を書かない。
- `wrangler tail` / curl レスポンスに含まれる Authorization / Cookie / email / token / IP は保存前に redact。
- D1 dump（`sync-jobs-staging.json` / `audit-log-staging.json`）は PII カラムを除外または masked で保存。
- screenshot に PII（実会員氏名 / メール）が映る場合はテスト用 fixture アカウントに差し替えるか blur 処理。
- production D1 へは read-only `PRAGMA` / `SELECT` のみ。`apply` / mutation 系は禁止（apps/web から D1 直アクセス禁止 invariants #6 と整合）。
- `wrangler login` の OAuth トークン保持禁止（CLAUDE.md）。

## Rollback 手順

| 事象 | コマンド |
| --- | --- |
| api deploy 後に staging 不整合 | `bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env staging` |
| web deploy 後に staging 不整合 | `bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env staging` |
| D1 migration apply で破壊的変更 | `bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output backup-pre-rollback.sql` で snapshot → 影響範囲を `outputs/phase-11/main.md` に記録 → schema 復旧は `unassigned-task/` で別途扱う（D1 には migration rollback CLI がないため再 migration を起票） |

deploy 直前に `bash scripts/cf.sh deployments list --config apps/{api,web}/wrangler.toml --env staging` で旧 version ID を控えておく（Phase 5 runbook に明記）。

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-01.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（D1 / Worker 対応表、Rollback 基準、Incident Severity）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 schema 正本）
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- `scripts/cf.sh`
- 親タスク: `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md`
- 後続: `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`

## 統合テスト連携

- 上流: 08a coverage gate, 08a-B `/members` search/filter contract, 08b Playwright E2E evidence
- 下流: 09c production deploy execution（本 Phase で確定する evidence path をそのまま 09c の参照源にする）

## 多角的チェック観点

- evidence と placeholder が物理パスで分離されている
- secret / PII が evidence に混入しない設計になっている
- production への副作用が read-only に限定されている
- approval gate が wrangler コマンド単位で停止できる粒度になっている
- D1 schema parity の差分が必ず後続 task に流せる構造（diff JSON + unassigned-task 起票）になっている

## サブタスク管理

- [ ] 13 evidence のコマンド契約を確定
- [ ] `d1-schema-parity.json` スキーマを確定
- [ ] redact 手順（`scripts/lib/redact.sh` または inline sed）を Phase 5 へ引き渡し
- [ ] rollback 用 version ID 取得手順を Phase 5 runbook に組み込む指示を残す
- [ ] `outputs/phase-02/main.md` を作成

## 成果物

- `outputs/phase-02/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 13 evidence ごとに「コマンド・保存先・期待出力」が一意に定義されている
- 4 approval gate の停止位置がコマンド単位で確定している
- production への副作用が read-only と明記されている
- rollback 手順が deploy / D1 で個別に定義されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] アプリケーションコード変更・実 deploy・commit・push・PR を本 Phase で実行していない
- [ ] CONST_007 に従い、未確定事項は Phase 3 / Phase 5 への引き渡し条件として明示している

## 次 Phase への引き渡し

Phase 3 へ:
- 設計案（コマンド契約 / データ構造 / rollback）と CONST_007 例外対象（pending migration / wrangler tail 取得不能 / Forms quota 枯渇）
- リスク候補（Phase 3 でマトリクス化する元ネタ）: secret 漏洩 / D1 schema drift / staging 環境枯渇 / wrangler tail 取得不能 / Forms quota 枯渇 / production read-only 範囲超過 / PII 漏洩
- 代替案候補: GitHub Actions 実行 vs ローカル + user approval

## 実行タスク

- [ ] phase-02 の既存セクションに記載した手順・検証・成果物作成を実行する。
