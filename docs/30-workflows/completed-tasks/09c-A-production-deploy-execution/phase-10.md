# Phase 10: 最終レビュー — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 10 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | spec_created |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke / 実測 evidence) |
| 承認 | **reviewer 承認必須（production deploy 直前 1 段目 gate）** |

## 目的

Phase 1-9 の成果物を統合し、Phase 11 で実 production mutation（D1 migration apply / API deploy / Web deploy / release tag push）を着手してよいかを **GO / NO-GO 判定** する。本タスクは completed-tasks の 09c serial と異なり、実 mutation を伴う follow-up gate のため:

- spec 完成度だけでなく、**runtime evidence の取得経路**（24h Cloudflare metrics 等の外部依存）の妥当性も判定対象
- solo dev でも reviewer sign-off を skip しない（self-review として明示記録）
- Phase 11 の 4 段 mutation approval（D1 apply / API / Web / release tag push）と Phase 13 の user approval（dev→main merge）の前提整合を確認

NO-GO の場合は blocker と差し戻し先を明示し Phase 11 に進めない。条件付き GO（PASS_WITH_BLOCKER）は本タスクでは原則不採用（後述）。

## 実行タスク

1. Phase 1-9 成果物のチェックリスト確認。完了条件: 9 phases × 主要成果物が `outputs/phase-{N}/main.md` に揃う。
2. AC マトリクス（Phase 7）の最終確認。完了条件: AC-1〜AC-5 と evidence path の 1:1 対応が崩れていない。
3. Phase 5 runbook の各 step に user approval gate が正しく配置されているか確認。完了条件: 自走禁止操作 4 種すべてに approval section が割り当てられている。
4. rollback 手順の妥当性確認。完了条件: Phase 6 異常系 / Phase 2 §4 の rollback 8 ケースが Phase 5 runbook と整合。
5. 24h verification の外部依存確認。完了条件: Cloudflare Analytics / D1 metrics / `sync_jobs` SQL の取得経路が runbook 上 citable。
6. **GO / NO-GO 判定 5 条件**で最終評価。完了条件: 5 条件の境界（GO / 条件付き GO / NO-GO）が outputs/phase-10/main.md で一意に判定される。
7. reviewer sign-off の記録。完了条件: `outputs/phase-10/main.md` に reviewer 名・日時・self-review 区分が記載される。
8. 次 Phase 11 へ実行順序を確定して引き渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-01/main.md 〜 outputs/phase-09/main.md | Phase 1-9 全成果物 |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/index.md | AC / 上流依存 |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/artifacts.json | phase 状態 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | infrastructure 正本 |
| 参考 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-10.md | 完了済み 09c serial の最終レビュー |

## 実行手順

### ステップ 1: Phase 1-9 成果物チェックリスト

`outputs/phase-{N}/main.md` (N=1〜9) の各ファイルが「具体内容入り」であることを確認。テンプレ flat な spec_created のままなら NO-GO。

### ステップ 2: AC マトリクス最終確認

Phase 1 §3 / Phase 7 の 5 AC × evidence path mapping が崩れていないかを diff で確認。

### ステップ 3: runbook の approval gate 配置確認

Phase 5 runbook の 13 steps × Phase 2 §2 の依存 matrix で次 4 mutation step に approval gate が記載されているか:

- step 6 (D1 apply) → Phase 11 approval
- step 9 (API deploy) → Phase 11 approval
- step 11 (Web deploy) → Phase 11 approval
- step 13 (release tag push) → Phase 11 approval

加えて step 1 (main_merge) → Phase 13 approval、step 0 → Phase 10 approval。

### ステップ 4: rollback 妥当性

Phase 2 §4 の 8 rollback ケースが Phase 5 runbook で参照可能か。`apps/web` から D1 を直接操作する rollback が **#6 違反として禁止** されていることを再確認。

### ステップ 5: 24h verification 外部依存確認

| 取得対象 | 経路 | 自動化 | runbook 内 citation |
| --- | --- | --- | --- |
| Workers requests / errors | Cloudflare Dashboard 目視 + screenshot | 手動 | あり |
| D1 read/write rows | Cloudflare Dashboard 目視 + screenshot | 手動 | あり |
| `sync_jobs` 状況 | `bash scripts/cf.sh d1 execute ... --command "SELECT status, COUNT(*) FROM sync_jobs GROUP BY status"` | 半自動 | あり |
| Sentry / Slack | 09b-A 経由通知 | 半自動 | あり |

外部依存が citable で経路が固定されていることを確認。

### ステップ 6: GO / NO-GO 判定 5 条件

後述 §3 の 5 条件すべて PASS で **GO**、1 件でも NO-GO で停止。

### ステップ 7: reviewer sign-off

`outputs/phase-10/main.md` に次を記載:

```md
## Reviewer Sign-off

- reviewer: <name>（solo dev のため self-review）
- reviewed_at: <YYYY-MM-DDThh:mmZ>
- judgment: GO / NO-GO
- next_phase: 11
```

### ステップ 8: Phase 11 への引き渡し

GO の場合、Phase 11 step 順序を確定し、user approval を取得する point（4 段）を `user-approval-log.md` のテンプレに展開する。

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定 + 4 段 user approval テンプレ |
| Phase 13 | dev → main PR 昇格時の user approval（最終 gate） |
| 上流 09a-A / 09b-A / 09b-B | green 状態の最終確認 |
| Phase 12（ドキュメント更新） | infrastructure-runbook と本 outputs の cross-link 整合 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: AC-4 smoke 3 ファイル（public / member / admin）が独立 evidence
- 不変条件 #6: rollback 経路で `apps/web` から D1 操作が含まれない
- 不変条件 #14: 24h verification の閾値が free-tier 上限内
- 未実装/未実測を PASS と扱わない: Phase 11 着手前は **runtime evidence は pending_user_approval**
- 条件付き GO（PASS_WITH_BLOCKER）の境界: 後述 §3 で明確化

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 1-9 成果物確認 | 10 | pending | 9 ファイル |
| 2 | AC マトリクス確認 | 10 | pending | 5 AC × evidence |
| 3 | approval gate 配置確認 | 10 | pending | 4 mutation + Phase 10 + Phase 13 |
| 4 | rollback 妥当性 | 10 | pending | 8 ケース |
| 5 | 24h verification 経路 | 10 | pending | 外部依存 |
| 6 | GO/NO-GO 判定 | 10 | pending | 5 条件 |
| 7 | reviewer sign-off | 10 | pending | self-review 明示 |
| 8 | Phase 11 引き渡し | 10 | pending | step 順序 + user approval |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 1-9 統合サマリ + GO/NO-GO 判定 + reviewer sign-off + Phase 11 step 順序 |

## 完了条件

- [ ] Phase 1-9 各 outputs が具体内容入りで揃っている
- [ ] AC × evidence path の 1:1 対応確認
- [ ] runbook の approval gate 配置確認（4 mutation + Phase 10 + Phase 13）
- [ ] rollback 8 ケース妥当性確認
- [ ] 24h verification 外部依存経路 citable
- [ ] GO/NO-GO 判定 5 条件で最終結論
- [ ] reviewer sign-off 記載

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、次を渡す:
- GO 判定書（または NO-GO blocker 一覧）
- reviewer sign-off 記録
- 4 段 user approval テンプレ（D1 apply / API / Web / release tag push）
- 13 ステップ実行順序の最終確定
- 24h verification 取得経路の citable 一覧
