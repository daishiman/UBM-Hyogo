# Phase 1 main: 要件定義 + user approval gate 設計

## 親 09c (docs-only) との境界

| 観点 | 親 09c (docs-only) | 本タスク (execution-only) |
| --- | --- | --- |
| 状態 | spec_created（mutation なし） | applied（実 production mutation を伴う） |
| 成果物 | runbook / template / compliance check | preflight / migration / deploy / tag / smoke / 24h evidence |
| Issue | docs PR 経由 | `Refs #353`（既に CLOSED） |
| rollback | 不要 | `bash scripts/cf.sh rollback` を Phase 3 で事前確定 |
| user approval | 不要 | Phase 1 / 5 / 10 の三段ゲート必須 |

> 親 09c が docs-only として spec_created で完了済であっても、それは **「production deploy が実行された」ことを意味しない**。本タスクが実行 evidence を出力するまで、production への適用は完了していないものとして扱う。

## AC-1〜AC-13 1:1 根拠

| AC | 内容 | 達成根拠 (evidence ファイル) | 検証コマンド | 担当 Phase | 失敗時分岐 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | user 承認 evidence (G1/G2/G3) | `outputs/phase-01/user-approval-log.md`, `outputs/phase-05/user-approval-log.md`, `outputs/phase-10/user-approval-log.md` | 文字列に GO/NO-GO + timestamp が含まれること | 1, 5, 10 | NO-GO で停止 |
| AC-2 | `git rev-parse origin/main` と deploy 対象一致 | `outputs/phase-05/main-merge-evidence.md` | `git rev-parse origin/main` / `git log -1 origin/main` | 5 | 中止して main 同期 |
| AC-3 | Cloudflare account identity 一致 | `outputs/phase-05/cf-whoami.md` | `bash scripts/cf.sh whoami` | 5 | 中止して 1Password 確認 |
| AC-4 | D1 migration が全 Applied | `outputs/phase-06/d1-migration-evidence.md` | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml` | 6 | rollback (D1 restore) |
| AC-5 | 必須 7 種 secrets 存在 | `outputs/phase-05/secrets-list.md` | `bash scripts/cf.sh secret list` + Pages secret list | 5 | 中止して provisioning |
| AC-6 | api/web deploy exit 0 | `outputs/phase-07/{api,web}-deploy-evidence.md` | `pnpm --filter @ubm/api deploy:production`, `pnpm --filter @ubm/web deploy:production` | 7 | rollback (`cf.sh rollback`) |
| AC-7 | 10 ページ + 認可境界 smoke PASS | `outputs/phase-09/smoke-evidence.md` | curl 10 件 + 認可境界 | 9 | rollback or hotfix |
| AC-8 | release tag 付与 + push | `outputs/phase-08/release-tag-evidence.md` | `git tag vYYYYMMDD-HHMM && git push --tags` | 8 | tag 削除 + 再付与 |
| AC-9 | incident runbook 共有 evidence | `outputs/phase-11/share-evidence.md` | Slack/Email 送信ログの保存 | 11 | 再送 |
| AC-10 | 24h Workers req < 5k/day, D1 無料枠 10% 以下 | `outputs/phase-11/24h-metrics.md` | Cloudflare Analytics dashboard | 11 | incident path |
| AC-11 | 不変条件 #4/#5/#10/#11/#15 production 再確認 | `outputs/phase-09/smoke-evidence.md`, `outputs/phase-11/24h-metrics.md` | smoke 手動 + SQL + bundle grep | 9, 11 | 不一致で rollback |
| AC-12 | 異常時 rollback or 「異常なし」 evidence | `outputs/phase-XX/rollback-evidence.md` または「異常なし」記載 | 文書として存在 | 6/7/9/11 | 監査残し |
| AC-13 | Cloudflare CLI は全て `bash scripts/cf.sh` 経由 | grep 結果 in `outputs/phase-12/wrapper-grep.md` | `grep -RnE '^\s*wrangler\s' outputs/` = 0 | 12 | 違反箇所修正 |

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | docs-only と execution-only の分離で「未実行 deploy が完了済みに見える」事故を防げるか | PASS |
| 実現性 | 13 Phase + user 三段ゲートで 1 営業日 + 24h で完了できるか | PASS |
| 整合性 | AC 13 件 / 不変条件 5 件 / wrapper 強制が矛盾なく満たせるか | PASS |
| 運用性 | rollback / incident 分岐が事前確定し、誰でも実行可能か | TBD（Phase 3 で rollback コマンド列確定後 PASS 昇格） |

## open question

- Q1: G2 preflight 失敗時の戻り先 → **Phase 3 で確定**（Phase 5 内 retry 1 回まで、2 回失敗で Phase 2 に戻す）
- Q2: 24h verify 中の hotfix 承認手順 → **Phase 3 で確定**（親 09b incident runbook P0 経路、本タスク追加承認不要）
- Q3: release tag HHMM の TZ 基準 → **Phase 3 で確定**（JST、`TZ=Asia/Tokyo date +%Y%m%d-%H%M`）

## 不変条件 production 再確認 Phase 割当

| 不変条件 | 内容 | 担当 Phase | 検証手段 |
| --- | --- | --- | --- |
| #4 | 本人本文 D1 override しない | 9 | `/profile` smoke 手動 (編集 form 不在確認) |
| #5 | apps/web から D1 直接アクセス禁止 | 7, 11 | bundle 内 `D1Database` import 0 件 |
| #10 | 無料枠 10% 以下 | 11 | 24h Cloudflare Analytics |
| #11 | admin が本人本文編集不可 | 9 | `/admin/members` smoke 手動 (編集 form 不在確認) |
| #15 | attendance 重複 0 / 削除済み除外 | 9 | production D1 SELECT |

## Cloudflare wrapper 強制方針

- 本タスクで実行する Cloudflare 系コマンドは **すべて `bash scripts/cf.sh ...`**
- `wrangler` 直実行 / `~/.wrangler` OAuth 保持は禁止（CLAUDE.md 禁止事項）
- Phase 12 で AC-13 evidence として下記 grep を実行:
  ```bash
  grep -RnE '^\s*wrangler\s' docs/30-workflows/09c-production-deploy-execution-001/outputs/ || echo OK
  git diff main...HEAD -- 'docs/30-workflows/09c-production-deploy-execution-001/**' | grep -E '^\+\s*wrangler\s' || echo OK
  ```
  両方 `OK` で PASS。
