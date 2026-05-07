# issue-494-09a-A-exec-staging-smoke-runtime

> **本タスクは「実行サイクル（runtime evidence acquisition）」専用の独立仕様**である。
> `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/` が current canonical root である。
> Phase 1-13 と outputs はこのディレクトリ内で完結し、G1-G4 multi-stage approval gate のもと runtime evidence を取得する。
> historical `09a-A-staging-deploy-smoke-execution` root は現ブランチでは正本にしない。

## task identity

| 項目 | 値 |
| --- | --- |
| task_id | UT-09A-A-EXEC-STAGING-SMOKE-001 |
| issue | #494 |
| spec PR | #493 |

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 9a-fu |
| mode | sequential（G1→G2→G3→G4 の独立承認制） |
| owner | - |
| 状態 | spec_completed_runtime_pending |
| visualEvidence | VISUAL_ON_EXECUTION |
| priority | HIGH |
| scale | 中規模 |
| taskType | implementation / runtime-evidence-acquisition |

## purpose

09a-A spec の Phase 11 evidence root に**実 staging runtime evidence** を保存し、Phase 12 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `runtime_evidence_captured` 相当へ昇格させる。各 G1-G4 gate を独立承認のもと逐次実行し、09c blocker を実測結果に基づいて更新する。

## why this is an independent runtime task

- 本 workflow は **Phase 1-10 / 12 contract 完了**だが、Phase 11 actual evidence は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のまま。
- 実 Cloudflare staging 環境への deploy 実行 / D1 migration apply / Forms quota 消費 / wrangler tail 取得には、user 明示承認下での副作用を伴うため、spec 改訂と分離した「実行サイクル」を別タスクで定義する必要がある。
- Cloudflare auth blocker は **2026-05-06 時点で解消済**（`bash scripts/cf.sh whoami` で Account ID 取得確認）。本タスクの blocker からは除外する。

## scope in / out

### Scope In

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
- G4 PR 作成

### Scope Out

- production deploy（09c の専用タスク）
- 親 `09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` directory restoration（別タスク）
- 新規 UI / API 機能追加・bugfix（staging で発覚したバグは `unassigned-task/` に切り出す）
- Secret 値の文書化（redaction 必須）
- ユーザー明示承認なしの commit / push / PR / sync 実行
- 09a-A spec 本体（`phase-01.md`〜`phase-10.md` / `phase-12.md`）の再設計

## dependencies

### Depends On

- Cloudflare staging secrets（1Password vault → `.env` op:// 参照）
- staging Workers target: `ubm-hyogo-api-staging` / `ubm-hyogo-web-staging`
- staging D1: `ubm-hyogo-db-staging`（id `990e5d6c-51eb-4826-9c13-c0ae007d5f46`）
- 1Password CLI / op run

### Blocks

- 09c production deploy execution（本タスクの evidence が production gate の前提）

## refs

- spec dir: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/`
- spec phase-11: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-11.md`
- spec phase-12 implementation-guide: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/implementation-guide.md`
- spec phase-13: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-13.md`
- GitHub Issue: #494
- spec 確定 PR: #493
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（D1 / Worker 対応表 / Rollback / Incident Severity）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 schema 正本）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`（G1-G4 multi-stage approval gate）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `CLAUDE.md`（cf.sh ラッパー必須・branch 戦略・solo 運用ポリシー）

## AC（Acceptance Criteria）

- [ ] G1 完了: staging API/Web Worker deploy が成功し、`deploy-{api,web}-staging.log` に version id が記録されている
- [ ] G2 完了: D1 migration list 差分 0、または pending 行がある場合は理由 evidence と TODO が残っている
- [ ] G3 完了: Forms schema / responses sync が staging で 1 サイクル成功し、`sync_jobs` / `audit_log` 行増分が dump として保存されている
- [ ] G4 完了: 取得 evidence が commit / push / PR に反映され、09c blocker 状態が更新されている
- [ ] Cloudflare auth: `bash scripts/cf.sh whoami` PASS evidence が `evidence/preflight/cf-whoami.log` に保存されている
- [ ] D1 schema parity (staging vs production) 差分 0、または差分時に production 側 migration TODO が `unassigned-task/` に発行されている
- [ ] Playwright report + 4 staging screenshots（public-members / login / me / admin）が保存されている
- [ ] `wrangler-tail/api-30min.log` が取得されているか、取得不能理由が同パスに明記されている
- [ ] secret 値・PII の redaction が完了している（`grep` で Authorization / Cookie / token / 実 PII が evidence に残っていない）
- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` の `NOT_EXECUTED` 全置換が完了している
- [ ] `artifacts.json` ↔ `outputs/artifacts.json` parity が維持されている
- [ ] `references/task-workflow-active.md` 09a-A 行が `runtime_evidence_captured` に昇格している
- [ ] G1-G4 各 gate の承認証跡が `outputs/phase-13/main.md` に user 発言 timestamp 付きで記録されている

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義（runtime acquisition 観点）
- [phase-02.md](phase-02.md) — 設計（G1-G4 gate / evidence path / redaction policy）
- [phase-03.md](phase-03.md) — 設計レビュー（不変条件 / G1-G4 独立承認制 / spec 整合差分）
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

> **本タスクの仕様書は Phase 1-13 すべてを current canonical root 内に保持する**。削除済み historical root へ実行手順・outputs・evidence を分散させない。

## outputs

- `outputs/phase-01/main.md`
- `outputs/phase-02/main.md`
- `outputs/phase-03/main.md`
- `outputs/phase-11/evidence/`
- `outputs/phase-12/` strict 7 files
- `outputs/phase-13/` required 4 files + main
- `outputs/phase-13/main.md`（G1-G4 承認 timestamp 含む）

## invariants touched

- #5 public/member/admin boundary（curl 401/403 と Playwright role smoke で確認）
- #6 apps/web D1 direct access forbidden（smoke は `apps/api` 経由のみ観測）
- #14 Cloudflare free-tier（Workers requests / D1 reads / Forms quota が free-tier 内）

## completion definition

- 全 13 phase の実行成果物（特に G1-G4 evidence）が必須証跡パスに保存され、redaction が完了している
- `outputs/phase-11/main.md` から `NOT_EXECUTED` runtime placeholder が消えている
- 09c production deploy execution task の blocker 状態が実測結果で更新されている
- G1-G4 各 gate の承認 timestamp が `outputs/phase-13/main.md` に記録され、合算承認・逆順実行が無いことが文書上検証可能
- G4 PR が作成され、本タスクのスコープが完結している（CONST_007: 「Phase XX で対応」「将来タスク」「別 PR」等の先送り記述なし）
