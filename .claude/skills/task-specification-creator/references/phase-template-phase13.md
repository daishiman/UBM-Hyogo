# Phase Template Phase13

## 対象

Phase 13 の PR 作成。

## ルール

1. user の明示承認がない限り blocked のままにする。
2. ローカル確認を省略しない。
3. commit / PR を自動で作らない。

## quick-summary（Phase 13 必須成果物 4 点）

| 必須成果物 | 役割 |
| --- | --- |
| `outputs/phase-13/local-check-result.md` | **必須**: typecheck / lint / build などローカル検証ログを記録 |
| `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前にユーザーに提示） |
| `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI 結果 |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |

> **`local-check-result.md` は見落としやすい必須成果物**。Phase 13 着手時の最初のチェックリストに含めること。

## 最低限の記録

- なぜ blocked か
- user approval の有無
- Phase 12 までの完了根拠
- local check の結果要約（→ `outputs/phase-13/local-check-result.md` に必ず記録）
- `outputs/phase-13/local-check-result.md` と `outputs/phase-13/change-summary.md` の作成有無
- `pr-info.md` / `pr-creation-result.md` を作成できる状態か

## approval-gated NON_VISUAL implementation パターン（追加）

> 適用条件: `taskType=implementation` かつ `visualEvidence=NON_VISUAL` で、不可逆 API（branch protection PUT / Cloudflare deploy / D1 migration apply 等）を Phase 13 で実行する場合。
> 実例: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md`（UT-GOV-001 second-stage reapply）。

### 三役ゲート（user 承認 / 実 PUT 実行 / push & PR）

Phase 13 は以下 3 つのゲートを **同一 Phase 内で直列に** 通す。各ゲートは独立しており、前段が PASS しない限り次段を実行しない。

| # | ゲート | 通過条件 | Claude が実行可か |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | change-summary + 実行 plan + rollback location を提示し、user の **明示文言** で承認取得 | 承認取得まで実行禁止 |
| 2 | 実 PUT / deploy / migration apply ゲート | ゲート 1 PASS 後、適用前 GET → 不可逆 API → 適用後 GET → 集合一致確認 | ゲート 1 後にのみ実行 |
| 3 | push / PR 作成ゲート | ゲート 2 PASS 後、コミット粒度ごとに commit → push → `gh pr create` | ゲート 2 後にのみ実行 |

> 曖昧な合意（「いいよ」程度）では実行しない。`change-summary.md` を提示した上での明示指示を要件とする。

### rollback payload 上書き禁止（merge前 / merge後で別ファイル分離）

- 上流タスク（first stage）で生成した `outputs/phase-05/rollback-payload-{branch}.json` は **再利用のみ・上書き禁止**。
- 本タスクの second-stage 用 rollback が必要な場合は別ファイル名で保存する（例: `outputs/phase-05/rollback-payload-second-stage-{branch}.json`）。
- PR merge **前** rollback と merge **後** rollback は判断基準が異なるため、それぞれ別 section として `rollback-judgement.md` に記述する。
- payload を branch 別に分離（dev / main を 1 ファイルに統合しない）し、片側失敗時に他方を独立 rollback 可能にする。

### コミット粒度 5 単位

不可逆 governance / infra タスクの PR は、レビュー / revert を branch 別に容易にするため、以下 5 単位で粒度を分離する。

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | spec（仕様書本体） | `docs/30-workflows/<task>/phase-*.md` / `index.md` / `artifacts.json` |
| 2 | outputs（設計 / runbook / drift 等の生成物） | `outputs/phase-01〜phase-12/` |
| 3 | impl evidence（実 API 応答の証跡） | `outputs/phase-13/branch-protection-{current,applied}-{dev,main}.json` 等 |
| 4 | docs / skill sync（同 wave 同期） | `.claude/skills/**/SKILL.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` |
| 5 | LOGS row（完了行追記） | `docs/30-workflows/LOGS.md` |

> impl 系（test / config 等）が独立して存在する一般タスクでは「spec / config / impl / test / docs」の 5 単位に読み替える。本パターンの本質は **revert 単位 = commit 単位** を保つこと。

### Phase 13 fresh GET を applied evidence として採用

- Phase 5 / Phase 11 で採取した GET は **設計 / 事前検証** の証跡。Phase 13 の applied evidence にしない。
- Phase 13 で実 PUT 直後に取得し直した fresh GET（`outputs/phase-13/branch-protection-applied-{dev,main}.json`）を **唯一の applied evidence** とする。
- 集合一致は `outputs/phase-02/expected-contexts-{dev,main}.json` と Phase 13 fresh GET を `jq -S '.|sort'` 比較する。

### Issue 参照は `Refs #<issue>` を採用、`Closes` は禁止

- 上流 Issue が CLOSED のまま運用されているケース（後追い適用 / second-stage reapply）では、`Closes #<n>` を使うと Issue が誤って再 close 試行される。
- 本パターンでは PR body / commit message ともに `Refs #<issue>` のみ使用する。
- Issue クローズアウトは `gh issue comment` の二段階（Phase 12 = 仕様書化完了 / Phase 13 = 実 PUT 完了）で行う。

## G1-G4 multi-stage approval gate（staging deploy smoke 系）

> 起源: 09a-A staging deploy smoke execution 仕様書策定（2026-05-05）。staging 環境への deploy /
> external API mutation（Forms sync）/ DB schema apply / commit-push-PR の 4 種類の不可逆操作を
> 1 phase 内で扱うため、三役ゲートを **4 段独立承認** に拡張する。各 gate は前段の PASS を前提とし、
> user 承認は gate ごとに個別取得する（合算承認禁止）。

### 適用条件

- `taskType=implementation` または `runbook` で staging deploy + Forms sync + D1 apply + PR を含む
- `visualEvidence=VISUAL_ON_EXECUTION` で Phase 11 main.md が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
  に到達済（[phase-template-phase11.md](phase-template-phase11.md) §`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）
- 三役ゲート（user 承認 / 実行 / push&PR）では粒度が粗く、各 runtime 操作で個別 rollback / 観測が必要

### 4 段独立承認 gate の概要

| Gate | 対象操作 | ブロックする上流条件 | user 承認の取り方 | approval 後の post-actions |
| --- | --- | --- | --- | --- |
| **G1** | runtime deploy（staging Pages / Workers deploy） | Phase 11 spec contract 完了 / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 到達 / staging secret 配備済 | deploy command / target env / rollback version ID を提示し、明示文言「G1 approve」取得 | `bash scripts/cf.sh deploy --env staging` 実行、deploy version ID を `outputs/phase-13/g1-deploy-{env}.log` に記録、staging URL の HTTP 200 / health check 取得 |
| **G2** | Forms sync execution（Google Forms API → D1 sync 実行） | G1 PASS / staging deploy URL の health check OK / Forms API token 配備確認 | sync 対象 form ID / 想定 row count / D1 target table / dry-run 結果を提示し、「G2 approve」取得 | sync 実行、`outputs/phase-13/g2-forms-sync.log` に before/after row count、API response shape（PII redact）、duration 記録 |
| **G3** | D1 migration apply（staging or production） | G2 PASS（sync 後の schema 整合性確認）/ `outputs/phase-11/d1-applied-pending-count.md` で pending migration 確定 | 対象 migration file / target DB / staging vs production 区分 / rollback SQL を提示し、「G3 approve」取得 | `bash scripts/cf.sh d1 migrations apply <db> --env <env>` 実行、`outputs/phase-13/g3-d1-applied-fresh-{env}.log` に fresh GET 結果記録、Phase 11 parity 表との差分 0 件確認 |
| **G4** | commit / push / PR 作成 | G1-G3 全 PASS / runtime evidence 全取得 / Phase 11 helper artifacts 同期完了 | change-summary（commit 粒度・含めるファイル一覧・PR title/body）を提示し、「G4 approve」取得 | コミット粒度ごとに commit → push → `gh pr create`、PR URL を `outputs/phase-13/pr-info.md` に記録 |

### 各 Gate の詳細

#### G1: runtime deploy approval

- **ブロックする上流条件**:
  - Phase 11 main.md が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` または `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL`
  - staging 環境の secret / variable / D1 binding が provisioning 済（`bash scripts/cf.sh secret list --env staging` で key 名のみ確認）
  - rollback target version ID が事前取得済（`wrangler deployments list --env staging` の最新 stable ID を `outputs/phase-13/g1-rollback-pointer.md` に記録）
- **user 承認の取り方**:
  - change-summary に deploy command（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`）、target URL、rollback ID、想定 downtime（無）を提示
  - 曖昧な合意（「いいよ」）では実行しない。「G1 approve」または同等の明示文言を要件とする
- **approval 取得後の post-actions**:
  - deploy 実行
  - `outputs/phase-13/g1-deploy-staging.log` に deploy version ID / duration / build log の主要行（secret redact）を記録
  - `curl -I https://<staging-url>/healthz` の HTTP status を `outputs/phase-13/g1-staging-curl.log` に保存
  - 失敗時は即時 rollback（`bash scripts/cf.sh rollback <version-id> --env staging`）を実行し、G2 へ進まない

#### G2: Forms sync execution approval

- **ブロックする上流条件**:
  - G1 PASS / staging deploy URL の health check OK
  - Google Forms API token / OAuth refresh token が staging secret に配備済（key 名のみ確認）
  - dry-run（`--dry-run` flag 付き sync）で対象 form ID / 想定 row count を確認済
- **user 承認の取り方**:
  - change-summary に form ID（`119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`）、対象 D1 table（`responses` 等）、想定 insert/update 件数、dry-run 結果サマリを提示
  - 「G2 approve」取得
- **approval 取得後の post-actions**:
  - sync 実行（`bash scripts/cf.sh deploy --env staging` 配下のスケジューラ手動 trigger、または curl で sync endpoint POST）
  - `outputs/phase-13/g2-forms-sync.log` に sync 実行コマンド、before row count、after row count、duration、エラー件数を記録（PII redact）
  - 失敗時は D1 への部分書き込みを rollback（手動 DELETE / restore from backup）し、G3 へ進まない

#### G3: D1 migration apply approval

- **ブロックする上流条件**:
  - G2 PASS / sync 後の schema 整合性確認済
  - `outputs/phase-11/d1-applied-pending-count.md` の pending migration が確定
  - rollback SQL（DROP TABLE / ALTER 戻し）が `outputs/phase-13/g3-rollback-sql.sql` に準備済
- **user 承認の取り方**:
  - change-summary に対象 migration file path、target DB（staging or production）、rollback SQL、想定影響範囲（table / row count）を提示
  - production への apply は別途「G3-prod approve」として **追加承認** を取得（staging G3 approve では production を実行しない）
- **approval 取得後の post-actions**:
  - `bash scripts/cf.sh d1 migrations apply <db> --env <env>` 実行
  - apply 直後に fresh GET（`bash scripts/cf.sh d1 migrations list <db> --env <env>`）を取得し、`outputs/phase-13/g3-d1-applied-fresh-{env}.log` に保存
  - Phase 11 の `d1-applied-pending-count.md` と比較して applied 数が +1 されていることを確認
  - `outputs/phase-13/g3-schema-parity-postapply.md` で staging vs production schema の再 parity 検証
  - 失敗時は rollback SQL 実行、G4 へ進まない

#### G4: commit / push / PR 作成 approval

- **ブロックする上流条件**:
  - G1-G3 全 PASS / runtime evidence ファイル全取得
  - Phase 11 helper artifacts（manual-test-result / discovered-issues / d1-schema-parity）が runtime state に同期済
  - Phase 12 compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）で 7 ファイル実体確認済
- **user 承認の取り方**:
  - change-summary にコミット粒度（spec / outputs / impl evidence / docs sync / LOGS row の 5 単位、または task 固有粒度）、各 commit 含めるファイル一覧、PR title、PR body 概要を提示
  - 「G4 approve」取得
- **approval 取得後の post-actions**:
  - コミット粒度ごとに `git add` → `git commit` → `git push`
  - `gh pr create --title ... --body ...` で PR 作成
  - `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / Issue 参照（`Refs #<issue>`）を記録
  - `outputs/phase-13/pr-creation-result.md` に実行ログ（commit SHA list / push 結果 / PR creation API response）を保存

### Gate 間の独立性ルール

- **合算承認禁止**: 「G1-G4 全部 approve」のような一括承認は受け付けない。各 gate ごとに individual な明示文言が必要
- **逆順実行禁止**: G1 PASS せずに G3 を実行しない（例: deploy 失敗時に migration apply で先行回復を試みない）
- **partial PASS の扱い**: G1 PASS / G2 失敗 / G3 G4 未実行 の場合、Phase 11 main.md を `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` に戻し、unassigned-task で G2 リトライタスクを発行
- **production 拡張時の追加承認**: G1 / G3 で staging の次に production を実行する場合、`G1-prod approve` / `G3-prod approve` のような production 専用承認を別途取得

### Phase 12 compliance check との連動

`outputs/phase-12/phase12-task-spec-compliance-check.md` には G1-G4 別の status 表を含める:

```markdown
| Gate | 操作 | status | evidence path |
| --- | --- | --- | --- |
| G1 | staging deploy | PASS / PENDING / FAIL | `outputs/phase-13/g1-deploy-staging.log` |
| G2 | Forms sync | PASS / PENDING / FAIL | `outputs/phase-13/g2-forms-sync.log` |
| G3 | D1 apply (staging) | PASS / PENDING / FAIL | `outputs/phase-13/g3-d1-applied-fresh-staging.log` |
| G3-prod | D1 apply (production) | PENDING / N/A | `outputs/phase-13/g3-d1-applied-fresh-production.log` |
| G4 | commit / push / PR | PASS / PENDING / FAIL | `outputs/phase-13/pr-info.md` |
```

PENDING のままでも Phase 12 は close できるが、root workflow state を `completed` に昇格しない。
全 gate PASS で初めて runtime PASS と判定する。

## 関連ガイド

- [review-gate-criteria.md](review-gate-criteria.md)
- [commands.md](commands.md)
- [phase-template-phase13-detail.md](phase-template-phase13-detail.md) — 詳細テンプレ + approval-gated 詳細手順
- [phase-12-spec.md](phase-12-spec.md) — Phase 12 必須 7 成果物 + same-wave sync
- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) — NON_VISUAL 代替証跡 + D1 schema parity
- [phase-template-phase11.md](phase-template-phase11.md) — `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態語彙
- [quality-gates.md](quality-gates.md) — 承認ゲート / 検証コマンド
- 実例: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md`
- G1-G4 適用元: `docs/30-workflows/09a-A-staging-deploy-smoke-execution-task-spec/`
