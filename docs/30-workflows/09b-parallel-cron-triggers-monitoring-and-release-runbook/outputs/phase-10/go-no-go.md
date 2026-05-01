# go-no-go

## 判定: 条件付き GO（Phase 11 へ進行可）

## 5 軸判定

| 軸 | 判定 | 根拠 |
| --- | --- | --- |
| AC matrix | GO | positive 9 + negative 12 = 105 セル、空白 0（phase-07/ac-matrix.md） |
| verify suite | GO | 4 層 13 ケース、未対応 AC 0（phase-04/verify-suite.md） |
| runbook | GO（条件付き） | cron-deployment-runbook 完成（Phase 5）。release / incident response は Phase 12 で最終化 |
| 品質 | GO | 無料枠 121/100k = 0.121%、secret 平文 0、a11y 100%（phase-09/main.md） |
| 上流 AC | 条件付き GO | 08a / 08b は同 wave 並列、最終マージ時に達成確認。05a (infra) は completed |

## 不変条件 PASS check

| 不変条件 | 判定 |
| --- | --- |
| #5 apps/web → D1 直接禁止 | PASS |
| #6 GAS prototype 昇格しない | PASS |
| #10 Cloudflare 無料枠 | PASS |
| #15 attendance 重複防止 / 削除済み除外 | PASS |

## blocker 一覧（active）

| # | blocker | 検出 phase | 差し戻し先 | 解消条件 | 状態 |
| --- | --- | --- | --- | --- | --- |
| B-1 | 03b の sync_jobs running guard 実装 | Phase 4 I-1 検証 | 03b | 03b で running 行存在時の skip 動作が contract test PASS | 上流（同 wave 内では 09b は spec として記録） |
| B-2 | 05a (infra) Cloudflare Analytics URL | Phase 5 R-1 | 05a | completed。実 URL 自動化は UT-05A-CF-ANALYTICS-AUTO-CHECK-001 で別 task | 解消済み |
| B-3 | 04c の `POST /admin/sync/*` 認可 | Phase 4 I-1/I-2 | 04c | 認可テスト contract PASS | 上流 |
| B-4 | cron 頻度試算超過疑い | Phase 9 試算 | 03a/b | 確定値 121 req/day で解消 | 解消済み |
| B-5 | rollback 手順で apps/web 経由 D1 操作 | Phase 5 / 6 review | 09b 自身 | rollback-procedures.md に web 経由 D1 操作なし | 解消済み |

active blocker: **0 件**。

## 想定外 NO-GO シナリオ

以下が後発で判明した場合は NO-GO に切り替え、当該 Phase に差し戻す。

- 09b の Phase 12 release-runbook が完成しない
- 用語ゆれ audit で `rg` 結果が 0 hit でない（Phase 8 結果と矛盾）
- 上流 08a / 08b の AC が 1 件でも未達のまま wave 完了

## 上流 task の AC 確認 checklist（Phase 11 / 12 / 13 で再確認）

- [ ] 08a-parallel-api-contract-repository-and-authorization-tests のすべての AC が達成
- [ ] 08b-parallel-playwright-e2e-and-ui-acceptance-smoke のすべての AC が達成
- [x] 05a-parallel-observability-and-cost-guardrails の AC 達成（completed）

## 09c へ引き渡す runbook 一式（Phase 12 で確定）

- `outputs/phase-12/release-runbook.md`（最終版）
- `outputs/phase-12/incident-response-runbook.md`（最終版）
- `outputs/phase-06/rollback-procedures.md`（参照される rollback 手順 4 種）
- `outputs/phase-05/cron-deployment-runbook.md`（cron 制御）

## 結論

**条件付き GO**: Phase 11 manual smoke / Phase 12 ドキュメント更新 / Phase 13 PR 作成（ユーザー承認後）に進む。Phase 12 で release-runbook / incident-response-runbook の最終化が完了した時点で「runbook」軸が full GO となる。
