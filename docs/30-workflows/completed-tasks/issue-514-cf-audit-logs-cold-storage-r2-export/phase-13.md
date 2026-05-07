# Phase 13: コミット・PR 作成（G1-G4 multi-stage approval gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 親タスク | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/index.md` |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| close-out 状態 | `blocked_pending_user_approval` |
| 適用パターン | [phase-template-phase13.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase13.md) §「G1-G4 multi-stage approval gate」 |

## 目的

Issue #514 cold storage / R2 export を production へ適用する不可逆操作（R2 binding 登録 / Secret 配備 / D1 migration apply / 初回日次 export / commit-push-PR）を **G1-G4 4 段独立承認** で直列実行するための仕様を確定する。本仕様書策定タスクでは **PR 作成を実行しない**。close-out 状態は `blocked_pending_user_approval` とし、各 Gate の user 明示承認後に後続フローで実行する。

> **重要**: 本タスクの責務は「G1-G4 ゲート設計 + PR draft 雛形配置」までである。実 deploy / 実 migration apply / 実 PUT / 実 PR 作成は user の明示文言（`G1 approve` / `G2 approve` / `G3-prod approve` / `G4 approve`）取得後に行う。**合算承認禁止**、**逆順実行禁止**。manifest table が存在しない状態で export しないため、G2（D1 migration apply）は G3-prod（初回 export）より前に固定する。

## 必須 outputs

| # | ファイル | 役割 | 状態 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-13/local-check-result.md` | typecheck / lint / build などローカル検証ログ | 仕様書配置時点で実行済み記録（PASS） |
| 2 | `outputs/phase-13/change-summary.md` | 変更サマリー（user に提示する change-summary 雛形 / G1-G4 各 Gate 提示内容含む） | spec で実体配置 |
| 3 | `outputs/phase-13/pr-draft.md` | PR title / body 雛形（`Refs #514` 採用 / `Closes` 禁止） | spec で実体配置 |
| 4 | `outputs/phase-13/g1-rollback-pointer.md` | G1 rollback target version ID 取得手順 + 記録枠 | spec で実体配置 |
| 5 | `outputs/phase-13/g3-rollback-sql.sql` | G3-prod migration rollback SQL（DROP TABLE / ALTER 戻し） | spec で実体配置 |
| 6 | `outputs/phase-13/pr-info.md` | PR URL / CI 結果 / `Refs #514` | G4 後追加（本タスクでは雛形のみ） |
| 7 | `outputs/phase-13/pr-creation-result.md` | PR 作成プロセス実行ログ（commit SHA / push / API response） | G4 後追加（本タスクでは雛形のみ） |
| 8 | `outputs/phase-13/g1-deploy-production.log` | G1 後追い: R2 binding 登録 deploy log | PENDING |
| 9 | `outputs/phase-13/g2-d1-applied-fresh-production.log` | G2 後追い: D1 migration apply fresh GET | PENDING |
| 10 | `outputs/phase-13/g3-export-first-run.log` | G3-prod 後追い: 初回日次 export + restore drill log | PENDING |

---

## G1-G4 Gate 設計（本タスクで定義 / 実行は user 承認後）

### G1: runtime deploy approval（R2 binding 登録 + Secret 配備）

| 項目 | 値 |
| --- | --- |
| 対象操作 | (a) `apps/api/wrangler.toml` の R2 binding `UBM_AUDIT_COLD_STORAGE` を production env に登録した state を deploy / (b) `CF_AUDIT_R2_TOKEN_PROD` を 1Password + GitHub Secrets に配備（key 名のみ確認、値 read 禁止）|
| ブロックする上流条件 | Phase 11 main.md = `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / Phase 12 7 outputs 配置済 / `bash scripts/cf.sh secret list --env production` で既存 secret key 名取得済 / rollback target version ID 取得済 |
| user 承認の取り方 | `change-summary.md` に deploy command（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`）/ R2 bucket 作成手順 / Secret 配備手順 / rollback ID を提示し、明示文言「**G1 approve**」を要件とする |
| approval 後 post-actions | (1) R2 bucket 作成（`bash scripts/cf.sh ...`）(2) lifecycle policy 設定（Standard → Infrequent Access のみ、auto-delete なし）(3) wrangler deploy 実行 (4) `outputs/phase-13/g1-deploy-production.log` に version ID / duration / build log 主要行（secret redact）記録 (5) `bash scripts/cf.sh secret list --env production` で `CF_AUDIT_R2_TOKEN_PROD` key 名のみ確認 |
| 失敗時 | `bash scripts/cf.sh rollback <version-id> --config apps/api/wrangler.toml --env production` 実行、G2 へ進まない、Phase 11 main.md を `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` へ戻す |

### G2: D1 migration apply approval（production）

| 項目 | 値 |
| --- | --- |
| 対象操作 | `apps/api/migrations/0015_add_audit_export_manifest.sql` の production apply |
| ブロックする上流条件 | G1 PASS / `outputs/phase-13/g3-rollback-sql.sql` 準備済 / staging で同 migration apply 検証済 |
| user 承認の取り方 | `change-summary.md` に migration file path / target DB（`ubm-hyogo-db-prod`）/ rollback SQL / 影響範囲（`cf_audit_log_export_manifest` 新規 1 table、既存 table 変更なし）を提示し、明示文言「**G2 approve**」を要件とする |
| approval 後 post-actions | (1) `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` (2) fresh GET（`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production`）取得 → `outputs/phase-13/g2-d1-applied-fresh-production.log` 保存 (3) `0015_add_audit_export_manifest.sql` が applied 一覧に出現することを確認 (4) Phase 11 `runtime-evidence-pending.md` の RP-3 を PASS へ昇格 |
| 失敗時 | `outputs/phase-13/g3-rollback-sql.sql` を `bash scripts/cf.sh d1 execute` で実行、G3-prod へ進まない |

### G3-prod: 初回日次 export / restore drill approval（production）

| 項目 | 値 |
| --- | --- |
| 対象操作 | `.github/workflows/cf-audit-log-cold-storage.yml` の `workflow_dispatch` trigger による初回 export（`scripts/cf-audit-log/export-to-r2.ts` 実行）+ 任意 1 object の restore drill |
| ブロックする上流条件 | G2 PASS / R2 bucket 存在確認 / manifest table applied fresh GET / staging fixture run で manifest 2-phase commit が確認済 / dry-run で対象 row count 確認済 |
| user 承認の取り方 | `change-summary.md` に対象期間（26〜29 日 window）/ 想定 row count / 想定 R2 object 数（最大 4）/ redaction policy version / dry-run サマリを提示し、**production 専用文言**「**G3-prod approve**」を要件とする |
| approval 後 post-actions | (1) workflow_dispatch trigger (2) `outputs/phase-13/g3-export-first-run.log` に manifest row（pending → completed の 2-phase）/ R2 object key list（`audit/v1/yyyy=YYYY/mm=MM/dd=DD/...`）/ row count / hash / duration / restore drill result を記録（PII redact）(3) redaction grep ヒット時は fail-closed で manifest failed 化し、R2 PUT を実行しない |
| 失敗時 | manifest 行を failed にし、R2 PUT 済み object は `If-None-Match` 重複防止により次回再実行で上書きされない設計を確認、G4 へ進まない |

### G4: commit / push / PR 作成 approval

| 項目 | 値 |
| --- | --- |
| 対象操作 | コミット粒度ごとに commit → push → `gh pr create` |
| ブロックする上流条件 | G1 / G2 / G3-prod 全 PASS / Phase 11 helper artifacts 同期済 / Phase 12 7 outputs 実体確認済 / `outputs/phase-12/phase12-task-spec-compliance-check.md` 総合判定行 = `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| user 承認の取り方 | `change-summary.md` に下記 5 単位コミット粒度 / 各 commit 含めるファイル一覧 / PR title / PR body draft を提示し、「**G4 approve**」取得 |
| approval 後 post-actions | (1) コミット粒度ごとに `git add` → `git commit` → `git push`（`--no-verify` 禁止）(2) `gh pr create --title ... --body ...` で PR 作成（`Refs #514` 採用、`Closes #514` 禁止）(3) `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / Issue 参照 (4) `outputs/phase-13/pr-creation-result.md` に commit SHA list / push 結果 / PR creation API response 保存 |

---

## コミット粒度 5 単位（G4 で適用）

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | spec（仕様書本体） | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/phase-*.md` / `index.md` / `artifacts.json` |
| 2 | outputs（設計 / runbook / fixture / drift 等） | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-01〜phase-12/` |
| 3 | impl（コード / 設定 / migration / workflow） | `apps/api/wrangler.toml` / `apps/api/migrations/0015_add_audit_export_manifest.sql` / `scripts/cf-audit-log/export-to-r2.ts` / `scripts/cf-audit-log/restore-drill.ts` / `.github/workflows/cf-audit-log-cold-storage.yml` / `scripts/cf.sh`（r2 export / restore subcommand 追補） |
| 4 | docs / skill sync（same wave 同期） | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` / `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` / `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` |
| 5 | LOGS row（完了行追記） | `docs/30-workflows/LOGS.md` / `.claude/skills/aiworkflow-requirements/LOGS.md` |

> 各 commit は単独で revert 可能であること。impl evidence（G1/G2/G3-prod 後追い log）は粒度 3 ではなく `outputs/phase-13/` に置き、PR には含めるが revert 単位は `outputs/` 粒度で扱う。

---

## PR draft 雛形（`outputs/phase-13/pr-draft.md` 配置内容）

```markdown
# PR Title

feat(observability): Cloudflare Audit Logs cold storage / R2 export (Refs #514)

# PR Body

## Summary

- Cloudflare Audit Logs を D1 30 日 TTL の前に R2 へ日次 export する基盤を追加
- R2 binding `UBM_AUDIT_COLD_STORAGE` / D1 migration `0015_add_audit_export_manifest.sql` / `scripts/cf-audit-log/export-to-r2.ts` / `scripts/cf-audit-log/restore-drill.ts` / `.github/workflows/cf-audit-log-cold-storage.yml` を導入
- 30 日境界を契約として固定 / redaction 二重化 / manifest 2-phase commit / 半期 restore drill / lifecycle Standard → Infrequent Access（auto-delete なし）

## Refs

Refs #514

## Test plan

- [ ] focused test: `scripts/cf-audit-log/export-to-r2.test.ts` PASS
- [ ] focused test: `scripts/cf-audit-log/restore-drill.test.ts` PASS
- [ ] G1: production R2 binding 登録 / Secret 配備（log: `outputs/phase-13/g1-deploy-production.log`）
- [ ] G2: D1 migration apply（log: `outputs/phase-13/g2-d1-applied-fresh-production.log`）
- [ ] G3-prod: 初回日次 export + restore drill（log: `outputs/phase-13/g3-export-first-run.log`）
- [ ] secret hygiene grep ヒット 0 件（log: `outputs/phase-11/secret-hygiene-grep.log`）

## SSOT 同期

- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
```

---

## ローカル検証コマンド（`local-check-result.md` 記録対象）

| # | コマンド | 期待 |
| --- | --- | --- |
| L-1 | `mise exec -- pnpm install` | exit 0 |
| L-2 | `mise exec -- pnpm typecheck` | exit 0 |
| L-3 | `mise exec -- pnpm lint` | exit 0 |
| L-4 | `mise exec -- pnpm --filter @repo/api test:run` | focused test PASS |
| L-5 | `rg -n 'Closes #514' outputs/phase-13/pr-draft.md` | match 0 件（`Refs #514` のみ採用） |

## Gate 間の独立性ルール（再掲）

- **合算承認禁止**: 「G1-G4 全部 approve」は受け付けない。各 gate 個別の明示文言が必要
- **逆順実行禁止**: G1 PASS せずに G2 実行不可。G2 PASS せずに G3-prod 実行不可
- **Issue 参照**: PR body / commit message ともに `Refs #514` のみ。`Closes #514` は禁止（後追い適用 / Issue 既 CLOSED の誤動作回避）
- **partial PASS**: 任意 gate で FAIL 時は `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` に戻し、`unassigned-task-detection.md` で retry タスク発行

## 入力 / 出力 / 副作用

| 区分 | 内容 |
| --- | --- |
| 入力 | Phase 11 / Phase 12 outputs 全件 / Phase 1-10 spec |
| 出力 | 上記 outputs 1-7（雛形 + local check）。8-10 は G1/G2/G3-prod 実行後に追加 |
| 副作用 | **本タスクでは production / R2 / D1 / Secrets / GitHub PR に一切触れない**。実 mutation は user 承認後に後続フローで実施 |

## DoD（本仕様書配置タスクの完了条件）

- [ ] `outputs/phase-13/local-check-result.md` に L-1〜L-5 結果記録
- [ ] `outputs/phase-13/change-summary.md` に G1-G4 各 Gate の提示内容雛形配置
- [ ] `outputs/phase-13/pr-draft.md` に PR title / body（`Refs #514` 採用）配置
- [ ] `outputs/phase-13/g1-rollback-pointer.md` に rollback target version ID 取得手順 + 記録枠
- [ ] `outputs/phase-13/g3-rollback-sql.sql` に migration rollback SQL 配置
- [ ] `outputs/phase-13/pr-info.md` / `pr-creation-result.md` を PENDING placeholder で配置（G4 後に内容追加）
- [ ] close-out 状態が `blocked_pending_user_approval` で記録されている
- [ ] G1-G4 各 Gate に「明示文言要件 / 合算承認禁止 / 逆順実行禁止」が明記
- [ ] PR 作成を本タスクで実行しないことが明記
- [ ] `Closes #514` が outputs / spec のいずれにも存在しない（`rg` で確認）

## 関連参照

- [phase-template-phase13.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase13.md) §G1-G4
- [phase-template-phase11.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase11.md) §`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- [phase-12-spec.md](../../../.claude/skills/task-specification-creator/references/phase-12-spec.md)
- [index.md](./index.md)
- [phase-11.md](./phase-11.md)
- [phase-12.md](./phase-12.md)
- 実例参考: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md`
- 実例参考: `docs/30-workflows/09a-A-staging-deploy-smoke-execution-task-spec/`
