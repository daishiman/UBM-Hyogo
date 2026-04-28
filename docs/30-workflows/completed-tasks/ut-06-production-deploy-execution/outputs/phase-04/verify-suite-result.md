# Phase 4: 事前検証 verify suite 結果

> **ステータス: NOT EXECUTED (本番アクセス系コマンド)**
> 本タスクは docs-only モード。実行時は本テンプレに沿って結果を記録する。

## 1. verify suite 一覧

| # | コマンド | 目的 | 期待結果 | 結果 |
| --- | --- | --- | --- | --- |
| V-1 | `bash scripts/cf.sh --version` | CLI 確認 | package/lockfile と一致 | TBD (package/lockfile と一致確認) |
| V-2 | `bash scripts/cf.sh whoami` | アカウント確認 | UBM 兵庫アカウント | TBD |
| V-3 | `bash scripts/cf.sh d1 list` | D1 リソース存在確認 | `ubm-hyogo-db-prod` 含む | TBD |
| V-4 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | 未適用件数確認 | 1 件 pending | TBD |
| V-5 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` | API Secrets 配置確認 | 必要 secret 全件 | TBD |
| V-6 | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` | Web Secrets 配置確認 | 必要 secret 全件 | TBD |
| V-7 | `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production` | API 履歴確認 | 取得可能 | TBD |
| V-8 | `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production` | Web 履歴確認 | 取得可能 | TBD |
| V-9 | `mise exec -- pnpm typecheck` | 型整合 | exit 0 | TBD |
| V-10 | `mise exec -- pnpm --filter @ubm-hyogo/api build` | API ビルド | exit 0 | TBD |
| V-11 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | Web OpenNext ビルド | exit 0 | TBD |

## 2. 出力ログ保管

各コマンドの stdout/stderr は `outputs/phase-04/verify-logs/` 配下に `<id>.log` として保管する想定 (実行時に作成)。

## 3. 上流タスク handoff 確認

| 上流 | 確認項目 | 結果 |
| --- | --- | --- |
| 04-serial CI/CD secrets | 本番 Secrets 配置完了 | TBD (V-5 / V-6 と整合確認) |
| 05b-parallel handoff | readiness checklist PASS | TBD |
| 03-serial D1 runbook | マイグレーション適用手順整合 | DONE (Phase 2 deploy-design.md と整合確認済) |

## 4. 失敗時の扱い

- いずれか FAIL → Phase 5 進行不可。FAIL 内容を `outputs/phase-04/preflight-checklist.md` の不合格項目に転記
- 認証・binding 系 FAIL → Phase 4 内で再試行可能
- ビルド系 FAIL → 該当タスク (apps/api / apps/web) で修正後 verify suite 再実行

## 5. AC への寄与

- AC-3 / AC-7: V-3 / V-4 で前提確認
- AC-1 / AC-2: V-10 / V-11 でビルド成功確認
- AC-8: rollback コマンドが V-7 / V-8 で履歴取得可能か確認 (rollback-runbook.md §1 W-1 の前提)
