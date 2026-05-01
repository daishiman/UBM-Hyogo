# runbook-diff-plan

09b 成果物を「same-wave で反映する範囲」「09c へ引き渡す範囲」「UT21-U05 に委譲する legacy cron 撤回範囲」に分けて記録する。

## 1. same-wave（09a へ取り込み）

| 項目 | 反映先 | 反映方法 | タイミング |
| --- | --- | --- | --- |
| dashboard URL env var 命名規則 | 09a `outputs/phase-08/` | env var 一覧を共有（09a 側で同一表記） | 09a Phase 8 完了時 |
| staging URL（実 URL） | 本タスク `release-runbook.md` § 2 | 09a の deploy 後、`<account>` placeholder を実値に書き換える candidate（実値は git 管理しない、Cloudflare Secrets 経由） | 09a Phase 11 完了後 |
| sync_jobs id（manual evidence の sample） | 本タスク `manual-smoke-log.md` § 3 | 09a の Phase 11 で得た id を本テンプレに書き込む | 09a Phase 11 完了後 |
| 用語ゆれ audit | 09a / 09b 双方 | DRY 化の用語表（Phase 8）を相互参照 | Phase 8 完了時 |

## 2. downstream（09c production deploy で参照）

| 成果物 | 09c での使い方 |
| --- | --- |
| `release-runbook.md` | 09c Phase 1（前提確認）で読み込み、Phase 5（production deploy 実施）の手順スクリプトとして利用 |
| `incident-response-runbook.md` | 09c Phase 5 以降の障害発生時に参照、Phase 11 で postmortem template を運用ドキュメントへ昇格 |
| `rollback-procedures.md` | 09c Phase 5 で rollback 必要時に直接転記 |
| `cron-deployment-runbook.md` | 09c Phase 5 で cron triggers 確認に使用 |
| `ac-matrix.md` | 09c Phase 7 / 10 GO/NO-GO で AC-1〜9 を継承 |
| `link-checklist.md` | 09c Phase 11 manual smoke で dashboard URL を埋める |

## 3. UT21-U05 へ委譲（legacy cron 撤回）

`0 * * * *` は legacy Sheets sync の cron。撤回は別 task `task-ut21-impl-path-boundary-realignment-001`（UT21-U05）で実施する。

| 委譲項目 | 理由 |
| --- | --- |
| `crons` から `0 * * * *` の削除 | 09b は cron schedule 正本記録に scope を限定。撤回は impl-path-boundary-realignment の責務 |
| legacy Sheets sync handler 削除（apps/api 内） | 09b は docs-only / spec_created。コード変更は 03b 以降 / UT21 で |
| legacy 監視ノイズ抑制 | UT21 で legacy 行を撤去後、本 runbook の cron 一覧を 2 件に更新（改訂履歴に記録） |

## 4. references/ への昇格 candidate（system-spec-update-summary.md と連携）

| 提案 | 対象 | タイミング |
| --- | --- | --- |
| cron `[triggers]` current facts | `references/deployment-cloudflare.md` | 09b 完了後、別 PR で提案 |
| sync_jobs running guard SQL | `references/api-endpoints.md` | 03b 完了に合わせて再確認 |
| dashboard URL placeholder 命名規則 | `references/deployment-cloudflare.md` | 09b 完了後 |
| Workers Cron Triggers 限定（GAS apps script trigger 不採用） | `references/architecture.md` 等 | 09b 完了後 |

## 5. 反映タイミング表

| 時点 | 反映内容 |
| --- | --- |
| 09a Phase 8 完了 | 用語 / URL env var を 09b と一致 |
| 09a Phase 11 完了 | 09b runbook の placeholder に staging URL / sync_jobs id を書き込み（実 URL は内部 share、git にはコミットしない） |
| 09b Phase 12 完了（本 Phase） | `release-runbook.md` / `incident-response-runbook.md` 最終版 |
| 09c Phase 1 起動 | release-runbook.md を入力 |
| 09c Phase 11 完了 | postmortem template を運用ドキュメント化（必要なら） |
| UT21-U05 完了 | legacy `0 * * * *` 撤回後、本 runbook を改訂（改訂履歴に追記） |

## 6. 不変条件への対応

- #6: legacy cron 撤回は「Workers Cron Triggers 内」で行い、GAS apps script trigger には絶対戻らない
- #10: legacy 撤去で 121 → 97 req/day に減り、無料枠余裕が増える（試算更新を Phase 9 改訂で）
- #5/#15: 撤回作業中も rollback で apps/web 経由 D1 操作なし、attendance 整合性確認 SQL を継続実行
