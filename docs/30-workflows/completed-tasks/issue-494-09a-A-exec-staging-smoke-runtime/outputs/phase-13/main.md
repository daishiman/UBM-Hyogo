# Phase 13 outputs — issue-494-09a-A-exec-staging-smoke-runtime

## status

`pending`（G1-G4 user approval 取得待ち / PR 未作成）

実行完了時に `pr_created (pr_url: <URL>, ci_status: <green|fail>)` へ更新する。

## G1-G4 user approval timestamp 記録

| Gate | approved_at (UTC) | approved_by | user 発言原文（PII redacted）| command_executed | evidence_paths |
| --- | --- | --- | --- | --- | --- |
| G1 (api/web staging deploy) | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` / `…apps/web/wrangler.toml…` | `…/outputs/phase-11/evidence/deploy/` |
| G2 (D1 migration apply) | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`（または `N/A pending=0`）| `…/outputs/phase-11/evidence/d1/` |
| G3 (Forms sync) | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | `curl POST /admin/forms/sync/{schema,responses}` | `…/outputs/phase-11/evidence/forms/` |
| G4 (blocker update commit & PR) | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | PENDING_RUNTIME_EVIDENCE | `git commit` (5 commits) / `gh pr create` | (PR URL) |

## 自己監査チェック（spec 制約）

- [ ] 合算承認なし（各 gate 直前で個別 approve を取得した）
- [ ] 逆順実行なし（G1 → G2 → G3 → G4 の順序を保った）
- [ ] production 拡張時の追加承認: 該当なし（staging 限定） / 該当あり: PENDING_RUNTIME_EVIDENCE
- [ ] redaction grep 0 件確認済（Phase 11 main.md と一致）
- [ ] `--no-verify` 未使用
- [ ] branch protection 違反なし（force-push / `--admin merge` 未使用）

## commit 単位記録

| # | commit SHA | message | files (主要) |
| --- | --- | --- | --- |
| 1 | PENDING_RUNTIME_EVIDENCE | `feat(09a-A): staging runtime evidence 13件取得 (Issue #494)` | `outputs/phase-11/evidence/**` |
| 2 | PENDING_RUNTIME_EVIDENCE | `docs(09a-A): outputs/phase-11/main.md を実測値で全置換` | `outputs/phase-11/main.md` |
| 3 | PENDING_RUNTIME_EVIDENCE | `docs(09a-A): phase-12 implementation-guide / compliance-check / changelog 更新` | `outputs/phase-12/*.md` |
| 4 | PENDING_RUNTIME_EVIDENCE | `chore(09a-A): artifacts.json parity 同期 (evidence=13)` | `artifacts.json`, `outputs/artifacts.json` |
| 5 | PENDING_RUNTIME_EVIDENCE | `docs(09c): blocker を 09a-A 完了で更新 + skill index 昇格` | `task-09c-…001.md`, `task-workflow-active.md` |

## PR URL

PENDING_RUNTIME_EVIDENCE（`gh pr create` 出力で置換）

## CI gate 結果

PENDING_RUNTIME_EVIDENCE（`gh pr checks <N> --watch` 最終出力を貼付）

## 完了条件チェックリスト（Issue #494 本文 13 項目）

- [ ] Cloudflare auth: `bash scripts/cf.sh whoami` PASS evidence 保存
- [ ] D1 migration list（staging/prod）と schema parity evidence 保存
- [ ] G1 deploy 完了: API/Web Worker version id が deploy log に記録
- [ ] G2 D1 apply 完了 or pending 0 skip 理由記録
- [ ] G3 Forms sync 完了: `sync_jobs` / `audit_log` dump 保存
- [ ] Playwright report + 4 staging screenshots 保存
- [ ] `wrangler-tail/api-30min.log` 取得または取得不能理由保存
- [ ] secret 値・PII の redaction 確認
- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` の `PENDING_RUNTIME_EVIDENCE` 全置換
- [ ] `artifacts.json` ↔ `outputs/artifacts.json` parity
- [ ] `references/task-workflow-active.md` 09a-A 行 `runtime_evidence_captured` 昇格
- [ ] 09c blocker 状態を実測結果で更新
- [ ] G4 PR 作成完了
