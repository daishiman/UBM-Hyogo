# system-spec-update-summary

09b 完了に伴う `references/*` および `specs/*` への同期状態を記録する。quick-reference / resource-map / task-workflow-active / legacy ordinal register には同 wave で 09b の workflow root と NON_VISUAL Phase 11 / Phase 12 成果物を登録済み。詳細 spec 本文へ昇格する項目は、runtime 変更を伴わない範囲だけ本 wave で固定し、09c 実運用後に確定すべき項目は follow-up として残す。

## 同期済み / follow-up 一覧

| # | 状態 | 内容 | 対象 spec | 理由 |
| --- | --- | --- | --- | --- |
| 1 | 同期済み | `[triggers]` current facts 3 件を runbook に固定 | `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` | `apps/api/wrangler.toml` と運用 runbook の cron 表記を一致させる |
| 2 | 09b成果物内で固定 | sync_jobs running guard SQL 例追記 | `outputs/phase-05/cron-deployment-runbook.md` / `outputs/phase-12/release-runbook.md` | 03b 実装者と運用者が同じ SQL を参照できる |
| 3 | 09b成果物内で固定 | dashboard URL を `placeholder` 表記で統一 | `outputs/phase-12/release-runbook.md` | account id を埋めやすく、placeholder 規則を repo 共通化 |
| 4 | 09b成果物内で固定 | env var 命名規則（`ANALYTICS_URL_*`, `STAGING_*`, `PRODUCTION_*`） | `outputs/phase-12/release-runbook.md` | 09a / 09b / 09c で統一参照 |
| 5 | 同期済み | rollback 4 種（worker / pages / D1 migration / cron）の基準を新規 spec に格上げ | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 09b runbook の再利用先を dead target にしない |
| 6 | 同期済み | incident response の重大度定義（P0/P1/P2） | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 障害時の分類基準を spec として fix |
| 7 | follow-up | postmortem template | 同上 | 形式の標準化 |
| 8 | 同期済み | legacy Sheets cron 撤回は UT21-U05 へ委譲 | `references/task-workflow-active.md` / `legacy-ordinal-family-register.md` | 09b は spec_created で runtime 設定を変更しないため、撤回は別 task 化 |
| 9 | 09b成果物内で固定 | Workers Cron Triggers 限定の方針（GAS apps script trigger 不採用） | `outputs/phase-04/verify-suite.md` / `outputs/phase-12/phase12-task-spec-compliance-check.md` | 不変条件 #6 を明文化 |
| 10 | 09b成果物内で固定 | cron 頻度試算 121 req/day（cron のみ） | `outputs/phase-09/main.md` / `outputs/phase-12/release-runbook.md` | 無料枠遵守の数値を残す |

## 反映タイミング

| 対象 | タイミング |
| --- | --- |
| 1, 2, 3, 4, 8, 9, 10 | 09b Phase 12 / 本レビューで同期・明確化済み |
| 7 | 09c 完了後（実運用で 1 回以上 incident を経験してから） |
| 8 | UT21-U05 の Phase 1 で legacy 撤回計画を確定したとき |

## 不変条件との関係

- #5: 提案 5（rollback 4 種）に「rollback 手順内で apps/web 経由 D1 操作禁止」を spec として明文化
- #6: 提案 9 で「GAS apps script trigger 不採用」を spec 化
- #10: 提案 10 で 121 req/day の数値を spec に残す
- #15: 提案 5 の rollback spec 内で attendance 整合性 SQL を必須項目にする
