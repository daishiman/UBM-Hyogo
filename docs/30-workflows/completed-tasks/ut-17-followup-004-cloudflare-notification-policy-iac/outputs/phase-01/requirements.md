# Phase 1 成果物: 要件定義

Phase 1 spec: `../../phase-01.md`

## 確定内容

- スコープ: Cloudflare Notification Policy 4 category / 5 policy + 1 webhook destination の IaC 化
- 親 workflow との関係: UT-17 (`docs/30-workflows/ut-17-cloudflare-analytics-alerts/`) で Dashboard 手動構築されていたものを宣言的 IaC に置換
- 受け入れ基準: artifacts.json `acceptanceCriteria` AC-1〜AC-12 を採用 (本タスクスコープ)
- 不変条件: artifacts.json `invariants` を採用 (wrangler 直接禁止 / op:// 参照のみ / scope 分離 / read-only CI / name 参照 / quota-base × 係数 / 冪等 / app コード非影響)

## 確定した実装範囲

| 区分 | 対象 |
| --- | --- |
| 新規ディレクトリ | `infra/cloudflare-alerts/`, `infra/cloudflare-alerts/lib/` (機能は `infra/cloudflare-alerts/lib/` に集約済み) |
| 新規ファイル | quota-base.json, 5 policy JSON, 1 webhook JSON, 3 Schema, 7 Node .ts (canonicalize/diff/resolve/quota-base/load/api-client/cli + types), 5 vitest test, 1 integration test, CI workflow, README |
| 変更ファイル | `scripts/cf.sh` (alerts case 追加), `.env.example` (op:// 参照 2 件追加), `vitest.config.ts` (include 拡張), `package.json` (scripts 追加), `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` (Step 4 を `cf:alerts:diff` に差し替え), 親 UT-17 implementation-guide.md (リンク追記) |

## トレーサビリティ

- 元 unassigned-task: `docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md`
- Refs: GitHub Issue #636 (CLOSED — 親 UT-17 完了で close 済み、本タスクは fol low-up)

## 状態

- 状態: planning state → completed
- 確定日: 2026-05-14
