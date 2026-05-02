# 09c-production-deploy-execution-001 - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-09c-production-deploy-execution-001 |
| タスク名 | 09c production deploy / smoke / 24h verification 実行 |
| ディレクトリ | docs/30-workflows/09c-production-deploy-execution-001 |
| Issue | #353 (CLOSED, 2026-05-02 — クローズドのまま仕様書整備) |
| 親タスク | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification |
| 発見元 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md |
| 起票元 unassigned | docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md |
| Wave | 9 (Wave 9 最終 serial の execution 半身) |
| 実行種別 | serial（最終 / production mutation） |
| 担当 | release-production |
| 作成日 | 2026-05-02 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL |
| user_approval | REQUIRED（Phase 1 で固定 / Phase 5 / Phase 10 でゲート） |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ（`wrangler` 直実行禁止） |

## 目的

09c 親ワークフロー（docs-only / spec_created）が整備した production deploy runbook を、`main` 昇格後に **実 production 環境で実行** する。production D1 migration 適用、API/Web Workers deploy、release tag 付与、production smoke、24h post-release verification を、**user 明示承認ゲート** と Cloudflare wrapper（`bash scripts/cf.sh`）の両輪で実行する。

docs-only 仕様作成と production mutation を同じ完了扱いにすると、未実行の deploy が完了済みに見えるため、本タスクは親ワークフローと**完全に分離した execution-only タスク**として整備する。

## スコープ

### 含む

- `main` 昇格 evidence（merge commit / `git rev-parse origin/main`）の取得
- user 明示承認ログの保存（Phase 1 / Phase 5 / Phase 10 ゲート）
- Cloudflare account identity 確認（`bash scripts/cf.sh whoami`）
- production D1 migration list（dry-run）と apply 実行
- production secrets list 確認（必須 7 種）
- API / Web の production deploy（`pnpm --filter @ubm/api deploy:production` / `pnpm --filter @ubm/web deploy:production`）
- production smoke（10 ページ + 認可境界 + 公開導線）
- release tag 付与（`vYYYYMMDD-HHMM`）と `git push --tags`
- incident response runbook（09b 成果物）の関係者共有 evidence
- post-release 24h Cloudflare Analytics 観測（Workers req / D1 reads / writes）
- rollback / incident 分岐（異常時のみ）

### 含まない

- 09c 親ワークフローの docs-only 再設計（既に spec_created で完了済）
- 新規機能開発・Cloudflare secret 値の登録/rotation
- staging deploy（09a）/ cron triggers 追加変更（09b）
- semver / Slack bot 自動通知 / 24h 自動 alert（後続 task）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 09c-serial-production-deploy-and-post-release-verification（親 docs-only） | runbook / evidence template / approval gate の正本 |
| 上流 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | staging green が production deploy の前提 |
| 上流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | release runbook + incident runbook |
| 下流 | なし（24 タスクの最終ゲートの execution 半身） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/implementation-guide.md | 親 runbook 本体 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/phase12-task-spec-compliance-check.md | 親 compliance 表 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/index.md | 親 AC / scope |
| 必須 | docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md | 起票元 unassigned |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | deploy spec |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CI gate |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | production deploy / D1 / secrets 正本 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠と production 構成 |
| 必須 | scripts/cf.sh | Cloudflare CLI wrapper（直 wrangler 禁止） |

## 受入条件 (AC)

- AC-1: user approval evidence（Phase 1 / 5 / 10）が `outputs/phase-XX/user-approval-log.md` に保存されている
- AC-2: `git rev-parse origin/main` の commit と production deploy 対象 commit が一致している evidence が保存されている
- AC-3: `bash scripts/cf.sh whoami` の Cloudflare account identity が production 操作対象と一致する evidence が保存されている
- AC-4: `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml` で全 migration が `Applied`
- AC-5: `bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml` および Pages production secrets で必須 7 種が存在
- AC-6: `pnpm --filter @ubm/api deploy:production` および `pnpm --filter @ubm/web deploy:production` がそれぞれ exit 0
- AC-7: production URL（api / web）に対する 10 ページ + 認可境界 smoke が PASS
- AC-8: release tag (`vYYYYMMDD-HHMM`) が `main` 最新 commit に付与され `git push --tags` 反映
- AC-9: incident response runbook（09b 成果物）が関係者へ共有された evidence が `outputs/phase-11/share-evidence.md` に保存
- AC-10: 24h Cloudflare Analytics で Workers req < 5k/day、D1 reads / writes が無料枠 10% 以下、実測値が `outputs/phase-11/24h-metrics.md` に保存
- AC-11: 不変条件 #4 / #5 / #10 / #11 / #15 が production で再確認され evidence 保存
- AC-12: 異常時は rollback / incident 分岐の実行記録 or「異常なし」evidence のいずれかが保存
- AC-13: Cloudflare CLI 操作は **すべて `bash scripts/cf.sh` 経由**で実行（`wrangler` 直実行 0 件 grep evidence）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 + user approval gate 設計 | phase-01.md | spec_created | outputs/phase-01/main.md, user-approval-gate.md |
| 2 | 設計（実行フロー + evidence 設計） | phase-02.md | spec_created | outputs/phase-02/main.md, production-deploy-flow.md |
| 3 | 実装計画（コマンド列 + rollback 分岐） | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | verify suite 設計 | phase-04.md | spec_created | outputs/phase-04/main.md |
| 5 | preflight 実行 + user 承認 1 回目 | phase-05.md | spec_created | outputs/phase-05/preflight-evidence.md |
| 6 | production D1 migration 適用 | phase-06.md | spec_created | outputs/phase-06/d1-migration-evidence.md |
| 7 | production deploy 実行（API / Web） | phase-07.md | spec_created | outputs/phase-07/deploy-evidence.md |
| 8 | release tag 付与 + push | phase-08.md | spec_created | outputs/phase-08/release-tag-evidence.md |
| 9 | production smoke + 認可境界検証 | phase-09.md | spec_created | outputs/phase-09/smoke-evidence.md |
| 10 | GO/NO-GO 判定（user 承認 2 回目） | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 24h post-release 検証 + 共有 | phase-11.md | spec_created | outputs/phase-11/24h-metrics.md, share-evidence.md, screenshots/ |
| 12 | 実装ガイド + 仕様書同期 + 未タスク検出 | phase-12.md | spec_created | outputs/phase-12/ 7 ファイル |
| 13 | PR 作成（`Refs #353`） | phase-13.md | spec_created | outputs/phase-13/pr-body.md |

## 実行原則

- **user 明示承認なしでは production mutation を実行しない**（Phase 1 / 5 / 10 の三段ゲート）
- **Cloudflare 操作は `bash scripts/cf.sh` のみ**（`wrangler` 直実行禁止 / `~/.wrangler` OAuth トークン保持禁止）
- **`Refs #353` を採用、`Closes` は使用しない**（issue は既に CLOSED、実 deploy 完了は別軸）
- **rollback payload は merge 前/後を分離保存**し、上書き禁止
- **24h 検証中は新規 deploy を凍結**（incident hotfix 例外のみ）

## 苦戦箇所【親 09c から引き継ぎ】

- 対象: 親 09c の Phase 5 で docs-only 仕様作成 PR と production 実行手順が同一 lifecycle に混在し、Phase 13 PR 作成前に production deploy 済みと読める時系列になっていた
- 対策: 本タスクは execution-only に分離し、親の docs-only 完了後に **別 PR / 別 issue / 別 task spec** として整備する
- 参照: 親 `outputs/phase-12/skill-feedback-report.md` / `outputs/phase-12/phase12-task-spec-compliance-check.md`
