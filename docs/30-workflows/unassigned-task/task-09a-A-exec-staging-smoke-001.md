# UT-09A-A-EXEC-STAGING-SMOKE-001: Execute 09a-A staging deploy smoke under G1-G4 approval gates

## メタ情報

```yaml
task_id: UT-09A-A-EXEC-STAGING-SMOKE-001
task_name: Execute 09a-A staging deploy smoke under G1-G4 approval gates
category: 改善
target_feature: 09a-A staging deploy smoke (runtime evidence acquisition)
priority: 高
scale: 中規模
status: 未実施
source_phase: Phase 12
source_workflow: docs/30-workflows/09a-A-staging-deploy-smoke-execution/
created_date: 2026-05-06
dependencies:
  - task-09a-canonical-directory-restoration-001
spec_path: docs/30-workflows/unassigned-task/task-09a-A-exec-staging-smoke-001.md
parent_spec_pr: https://github.com/daishiman/UBM-Hyogo/pull/493
```

| 項目 | 値 |
| --- | --- |
| ID | UT-09A-A-EXEC-STAGING-SMOKE-001 |
| タスク名 | Execute 09a-A staging deploy smoke under G1-G4 approval gates |
| 優先度 | HIGH |
| 推奨Wave | Wave 9a-fu |
| 状態 | open |
| 作成日 | 2026-05-06 |
| 検出元 | docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-12/unassigned-task-detection.md |
| 親タスク | docs/30-workflows/09a-A-staging-deploy-smoke-execution/ |
| taskType | implementation / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |

## 1. なぜこのタスクが必要か（Why）

### 背景

09a-A staging deploy smoke execution の Phase 1-10 / 12 spec contract は PR #493 で確定したが、Phase 11 actual evidence は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のままで、実 staging 環境の deploy / visual smoke / Forms sync / D1 schema parity 取得は未実行である。spec 自体は実行コマンド・evidence path・redaction ルール・G1-G4 multi-stage approval gate を確定しており、runtime 実行を別タスクとして分離する境界が固定されている。

### 直近の前提変化（2026-05-06 時点）

- **Cloudflare auth blocker は解消済み**: `bash scripts/cf.sh whoami` が Account ID を返す状態を確認（API Token + 1Password 注入）。`task-09a-cloudflare-auth-token-injection-recovery-001` は実質完了。
- **親 09a-parallel canonical directory は不在のまま**: `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` は現 worktree に存在しないため、09a-A は successor として独立完結する経路でのみ実行できる。restoration task の完了を待たず 09a-A 側で閉じる場合は、親 mirror update を skip する旨を Phase 11 evidence に明記する。
- **09a-A spec 自身が G1-G4 独立承認を必須化**: 合算承認禁止・逆順実行禁止・production 拡張時は追加承認。

### 問題点

09a-A spec が Phase 11 evidence path を確定済みでも、user 明示承認なしに staging Workers deploy / D1 migration apply / Forms API quota 消費 / wrangler tail を実行できない。各 gate を分離して承認するための単一責務タスクが必要。

### 放置時の影響

09c production deploy が staging 実測 evidence なしに進行可能となり、認証境界・admin UI gate・Forms sync の問題を本番で初めて検出するリスクが残る。

## 2. 何を達成するか（What）

### 目的

09a-A spec の Phase 11 evidence root に **実 staging runtime evidence** を保存し、Phase 12 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `runtime_evidence_captured` 相当に昇格させる。各 G1-G4 gate を独立承認のもと逐次実行し、09c blocker を実測結果に基づき更新する。

### ゴール

| Gate | 完了条件 |
| --- | --- |
| G1 | staging API Worker / Web Worker deploy が成功し、deploy log と version id が evidence に保存されている |
| G2 | staging D1 migration apply（pending 行があれば）が完了し、`migrations list` 差分 0 が evidence に保存されている |
| G3 | Forms schema / responses sync が staging で完了し、`sync_jobs` と audit dump が保存されている |
| G4 | 取得 evidence が commit / push / PR に反映され、09c blocker 状態が更新されている |

## スコープ

### 含む

- 09a-A spec `phase-11.md` の手順に沿った staging smoke 実行（G1-G4 各 gate を独立 user 承認下で）
- staging API/Web deploy: `bash scripts/cf.sh deploy --config apps/{api,web}/wrangler.toml --env staging`
- 公開 / ログイン / `/me` profile / admin UI / authz 境界の Playwright + screenshot evidence 取得
- Forms schema / responses sync 実行と `sync_jobs` / audit dump 取得
- D1 migration list と staging ↔ production schema parity（`PRAGMA table_info`）evidence 取得
- `wrangler tail ubm-hyogo-api-staging --env staging` 30 分相当の redacted log 取得
- `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の `NOT_EXECUTED` placeholder を実測結果に置換
- 取得 evidence を反映した Phase 12 update（`implementation-guide.md` runtime status / `phase12-task-spec-compliance-check.md` / `documentation-changelog.md`）
- `artifacts.json` と `outputs/artifacts.json` の parity 維持
- `references/task-workflow-active.md` の 09a-A 行更新と 09c blocker 状態更新

### 含まない

- production deploy（09c の専用タスク）
- 親 `09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` directory restoration（別タスク）
- 新規 UI / API 機能追加
- Secret 値の文書化（redaction 必須）
- ユーザー明示承認なしの commit / push / PR / sync 実行

## 3. どのように実行するか（How）

### 前提条件

| 前提 | 確認方法 | 状態 |
| --- | --- | --- |
| Cloudflare auth | `bash scripts/cf.sh whoami` が Account ID を返す | ✅ 解消済（2026-05-06） |
| 1Password CLI / .env | `op run --env-file=.env -- env \| grep CLOUDFLARE_API_TOKEN` で 1Password 参照確認（値は出力しない） | 要確認 |
| staging Workers target | `apps/{api,web}/wrangler.toml` の `[env.staging]` 設定が最新であること | 要確認 |
| staging D1 binding | `database_name = ubm-hyogo-db-staging` / `database_id = 990e5d6c-51eb-4826-9c13-c0ae007d5f46` | ✅ 設定済 |
| staging secrets | 必須 secrets 名のみ確認（値は記録しない） | 要確認 |
| 親 09a directory | `docs/30-workflows/09a-parallel-...-validation/` の有無 | ❌ 不在（restoration task 待ち） |

### 推奨アプローチ

1. **Pre-G1 read-only evidence**（user 承認不要・write なし）
   - `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging`
   - `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production`
   - `PRAGMA table_info` を staging / production 両方で取得し schema parity を比較
   - 各 staging Worker `*.workers.dev` URL の HEAD curl で到達性確認
2. **G1 承認待ち** → API/Web deploy → version id / deploy log 保存
3. **G2 承認待ち** → pending migration があれば apply（無ければ skip 理由を evidence 化）
4. **G3 承認待ち** → Forms schema/responses sync → `sync_jobs` dump
5. **Playwright staging visual smoke**（G1 完了後）→ screenshots / report / trace
6. **wrangler tail 30 min**（G1-G3 完了後）→ redacted log
7. **G4 承認待ち** → Phase 11/12 update + commit + push + PR + 09c blocker 更新

各 gate 間で直前 evidence の redaction（API Token / OAuth token / email / member PII）を必ず確認する。

### G1-G4 multi-stage approval gate 制約（spec 由来）

- 合算承認禁止（"G1〜G4 まとめて承認" は task spec 違反）
- 逆順実行禁止（G4 を先に commit するなど不可）
- production 拡張時は追加承認必須
- 各 gate の承認証跡を `outputs/phase-13/main.md` に user 発言 timestamp 付きで記録

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 (resolved) | `task-09a-cloudflare-auth-token-injection-recovery-001` | Cloudflare auth blocker 解消済 |
| 上流 (open) | `task-09a-canonical-directory-restoration-001` | 親 09a directory 不在を最終的に閉じる |
| 上流 | `08b-A-playwright-e2e-full-execution` | Playwright config / staging fixture |
| 上流 | `ut-27-github-secrets-variables-deployment` | Cloudflare secrets availability |
| 下流 | `09c-serial-production-deploy-and-post-release-verification` | production deploy GO 判定の前提 |

## 4. 実行手順（Detailed）

### Step 0: Pre-G1 read-only evidence（write なし、即実行可）

| # | コマンド | 出力先 |
| --- | --- | --- |
| 0-1 | `bash scripts/cf.sh whoami` | `outputs/phase-11/evidence/preflight/cf-whoami.log`（Account ID のみ） |
| 0-2 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | `outputs/phase-11/evidence/d1/d1-migrations-staging.log` |
| 0-3 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | `outputs/phase-11/evidence/d1/d1-migrations-prod.log` |
| 0-4 | staging / production の `PRAGMA table_info` 比較 | `outputs/phase-11/evidence/d1/d1-schema-parity.json` |
| 0-5 | secret 名一覧確認（値は出力しない） | `outputs/phase-11/evidence/preflight/secret-list-check.md` |

### Step 1: G1 staging deploy（user 承認後）

| # | コマンド | 出力先 |
| --- | --- | --- |
| 1-1 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | `outputs/phase-11/evidence/deploy/deploy-api-staging.log`（version id 抽出） |
| 1-2 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | `outputs/phase-11/evidence/deploy/deploy-web-staging.log`（version id 抽出） |

### Step 2: G2 D1 apply（user 承認後・pending 0 なら skip 理由を記録）

| # | コマンド | 出力先 |
| --- | --- | --- |
| 2-1 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | `outputs/phase-11/evidence/d1/d1-apply-staging.log` |
| 2-2 | apply 後の `migrations list` で差分 0 確認 | `outputs/phase-11/evidence/d1/d1-migrations-staging-post.log` |

### Step 3: G3 Forms sync（user 承認後）

operator auth で staging admin sync endpoint を実行。

| # | 操作 | 出力先 |
| --- | --- | --- |
| 3-1 | Forms schema sync 実行 | `outputs/phase-11/evidence/forms/forms-schema-sync.log` |
| 3-2 | Forms responses sync 実行 | `outputs/phase-11/evidence/forms/forms-responses-sync.log` |
| 3-3 | `sync_jobs` dump | `outputs/phase-11/evidence/forms/sync-jobs-staging.json` |
| 3-4 | `audit_log` dump | `outputs/phase-11/evidence/forms/audit-log-staging.json` |

### Step 4: Playwright + visual smoke（G1 完了後・evidence 集約）

| # | コマンド | 出力先 |
| --- | --- | --- |
| 4-1 | `pnpm --filter @ubm-hyogo/web exec playwright test --config=playwright.staging.config.ts --reporter=html,list` | `outputs/phase-11/evidence/playwright/{report,trace}/` |
| 4-2 | screenshots（public-members / login / me / admin） | `outputs/phase-11/evidence/screenshots/{public-members,login,me,admin}-staging.png` |
| 4-3 | manual smoke log 補足 | `outputs/phase-11/manual-smoke-log.md` |

### Step 5: wrangler tail（G1-G3 完了後）

| # | コマンド | 出力先 |
| --- | --- | --- |
| 5-1 | `bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty`（30 min 相当・redaction） | `outputs/phase-11/evidence/wrangler-tail/api-30min.log` |

### Step 6: G4 commit-push-PR（user 承認後）

1. `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` を実測 evidence で更新
2. `outputs/phase-12/implementation-guide.md` runtime status と `phase12-task-spec-compliance-check.md` を更新
3. `artifacts.json` / `outputs/artifacts.json` の parity 確認
4. `references/task-workflow-active.md` の 09a-A 行を `runtime_evidence_captured` に更新
5. 09c blocker 状態（`docs/30-workflows/completed-tasks/09c-...-verification/` 内 blocker entry）を実測結果で更新
6. `pnpm install --force && pnpm typecheck && pnpm lint` PASS
7. commit + push + PR 作成（`.claude/commands/ai/diff-to-pr.md` 経由）

## 5. 完了条件チェックリスト

- [ ] Cloudflare auth: `bash scripts/cf.sh whoami` PASS evidence 保存
- [ ] D1 migration list（staging/prod）と schema parity evidence 保存
- [ ] G1 deploy 完了: API/Web Worker version id が deploy log に記録
- [ ] G2 D1 apply 完了 or pending 0 skip 理由記録
- [ ] G3 Forms sync 完了: `sync_jobs` / `audit_log` dump 保存
- [ ] Playwright report + 4 staging screenshots 保存
- [ ] `wrangler-tail/api-30min.log` 取得または取得不能理由保存
- [ ] secret 値・PII の redaction 確認
- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` の `NOT_EXECUTED` 全置換
- [ ] `artifacts.json` ↔ `outputs/artifacts.json` parity
- [ ] `references/task-workflow-active.md` 09a-A 行 `runtime_evidence_captured` 昇格
- [ ] 09c blocker 状態を実測結果で更新
- [ ] G4 PR 作成完了

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-11.md`
- 症状: spec contract PASS と runtime PASS を区別する `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態が要求されるため、Phase 11 を `completed` と書きたい誘惑に対し境界を維持する必要がある。
- 対策: `outputs/phase-11/main.md` 冒頭に状態行を必ず置き、runtime evidence 反映後に `runtime_evidence_captured` へ昇格させる。

- 対象: 親 `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/`
- 症状: 現 worktree に不在で、09a-A successor として閉じる経路と、restoration task 完了後に親 mirror を更新する経路の 2 通りがある。
- 対策: 本タスク完了時の親 mirror update は restoration task 完了の後に必ず実施し、evidence path を 09a-A root と親の双方に置く。

- 対象: G1-G4 multi-stage approval gate
- 症状: 「進めて」など包括承認に解釈できる発言で全 gate を一気に実行すると spec 違反。
- 対策: 各 gate 直前で対象操作・影響範囲・rollback 手段を提示し、独立承認を確認したうえでのみ次に進む。承認 timestamp を `outputs/phase-13/main.md` に追記する。

## 6. 検証方法

### 単体検証

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/09a-A-staging-deploy-smoke-execution
```

期待: artifacts parity / Phase 12 strict 7 files / outputs mirror PASS。

### 統合検証

1. Pre-G1 read-only evidence 5 点が `outputs/phase-11/evidence/preflight/` 配下に揃っている
2. G1-G3 evidence が各 `evidence/{deploy,d1,forms,playwright,screenshots,wrangler-tail}/` に揃っている
3. `outputs/phase-12/implementation-guide.md` の runtime status が `runtime_evidence_captured` に更新されている
4. `pnpm install --force && pnpm typecheck && pnpm lint` PASS
5. PR 作成完了

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| staging deploy で worker 上書き | deploy 直前の version id を記録し、`bash scripts/cf.sh rollback <VERSION_ID> --env staging` を備える |
| D1 apply の不可逆性 | apply 前に migrations list で対象 SQL を読み、staging のみで apply（production 拡張は別 gate） |
| Forms API quota 消費 | sync 実行は最小回数。429 時は evidence に記録し再実行判断 |
| screenshot に PII 混入 | staging fixture / redaction を使い、必要なら画像をマスク |
| secret 値の log 混入 | `bash scripts/cf.sh` wrapper の redaction を信頼しつつ、保存前に grep `(token|secret|password)` で再確認 |
| 包括承認による spec 違反 | 各 gate 独立承認を技術的にも分離（コマンド実行を gate ごとに切る） |

## 必須証跡パス

| パス | 内容 |
| --- | --- |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/preflight/cf-whoami.log` | Cloudflare auth |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/d1/d1-migrations-{staging,prod}.log` | D1 migration list |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/d1/d1-schema-parity.json` | schema parity |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/deploy/deploy-{api,web}-staging.log` | deploy + version id |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/forms/{forms-schema-sync,forms-responses-sync,sync-jobs-staging,audit-log-staging}.{log,json}` | Forms sync |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/playwright/` | Playwright report / trace |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/screenshots/{public-members,login,me,admin}-staging.png` | 4 visual smoke |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/wrangler-tail/api-30min.log` | wrangler tail |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-13/main.md` | G1-G4 承認 timestamp |
| `docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json` / `outputs/artifacts.json` | parity |

## 8. 参照情報

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-11.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`（G1-G4 multi-stage approval gate）
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`（D1 schema parity verification evidence）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- PR #493（09a-A spec 確定）

## 9. 備考

- 本タスクは production deploy を実行しない。09c は本タスクで staging 実測 evidence が揃い、blocker 状態が更新された後に判断する。
- Cloudflare auth recovery は 2026-05-06 時点で実質完了しているため、本タスクの blocker から除外する。`task-09a-cloudflare-auth-token-injection-recovery-001` は完了処理を別途行う。
- 親 `09a-parallel-...` directory restoration が完了していない場合でも、09a-A 自身は successor として完結可能。restoration 後に親 mirror を update する手順を Step 6 に含める。
