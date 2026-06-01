# Phase 12 — 未タスク検出（unassigned-task-detection）

> 本ワークフロー自体が `U-UT01-02-cron-interval-staging-measurement.md` の**再スコープ実体**である点が前提。
> 検出は「本タスク完了に必要な follow-up が新規 Issue 起票を要するか」を判定する。

## 検出サマリ

| 候補 | 判定 | 新規 Issue | サイクル |
| --- | --- | --- | --- |
| (1) guard test の実装（`wrangler-cron-schedule.guard.spec.ts`） | 既に本 spec が指示済み | 不要 | 本サイクル |
| (2) `U-UT01-02` の supersession 処理（削除/status 編集） | 記録のみ | 不要 | 本サイクル |
| (3) `deployment-cloudflare.md` back-link 追記 | 申し送り済み | 不要 | 本サイクル |
| (4) `U-UT01-06` gcp-quota 配分設計 | 本タスク射程外 | 不要 | — |

## (1) guard test 実装

- 実体は本ワークフローの phase-04..05 と `implementation-guide.md` に**実装可能粒度で記述済み**。
- 1 サイクルで完了可能なスコープ（CONST_007）であり、新規 Issue 起票は不要。実装着手は user-gated。

## (2) `U-UT01-02-cron-interval-staging-measurement.md` の supersession 記録

- 原 unassigned task「Sheets→D1 cron を 6h/1h/5min で 24h staging 実測」は、Sheets→Forms 移行および
  free-plan 3-cron 確定により **obsolete**。本ワークフローが supersede する（`artifacts.json.metadata.supersedes`）。
- ファイル削除 / status 編集は live unassigned-task ledger を破壊しないため**本サイクルでは行わず**、
  user-gated に実施する。ここでは supersession を記録するに留める。

## (3) `deployment-cloudflare.md` back-link 追記

- guard test 追加後、free-plan 3-cron 記述（L85-89 付近）から guard test への back-link を 1 行追記する申し送り。
- system-spec-update-summary.md に記録済み。本サイクルで実施。新規 Issue 不要。

## (4) `U-UT01-06` gcp-quota（射程外）

- Forms API quota（`*/15` で ≤96 calls/日）は trivial で、free 枠に対し配分設計を要するボリュームではない。
- 本タスク（cron schedule free-tier guard）の射程外であり、独立 follow-up としても起票不要（解析的予算で吸収済み）。

## 先送り理由 / 新規 Issue 判定

- **先送り理由なし**: 本サイクルは spec で完結し、実装は 1 サイクルで完了可能なスコープ（CONST_007）。
- **新規 Issue 起票 = 不要**: follow-up はすべて (a) 本 spec が指示済み、(b) 既存ファイルへの申し送り、
  (c) 射程外で配分設計不要、のいずれかであり、独立タスク化を要する未割当作業は存在しない。
- issue #264 は **CLOSED のまま**（GitHub mutation なし）。
