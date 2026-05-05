# Phase 10 成果物: レビュー findings（区分別記録）

> **方針**: MINOR 軽視禁止。「機能に影響なし」では unassigned 化を省略しない。task-specification-creator skill 漏れパターン対策。

## MAJOR ブロッカー

なし。

## MINOR 指摘（Phase 12 unassigned-task-detection.md 格下げ対象）

なし。

## 残課題（既知制限・current 候補 = 即時起票推奨）

base case = cutover 採択につき以下を Phase 12 `unassigned-task-detection.md` の **current** セクションへ計上：

| # | 課題 | 統合先 |
| --- | --- | --- |
| C-1 | `.github/workflows/web-cd.yml` の `command: pages deploy .next ...` → `command: deploy --env <env>` 置換（staging/production 両 job） | `task-impl-opennext-workers-migration-001`（既起票済 unassigned-task）に **吸収可能 → 起票省略**。同タスク内で Phase 5 stub-1 / stub-2 を実施 |
| C-2 | Cloudflare ダッシュボード上の Pages project (`CLOUDFLARE_PAGES_PROJECT`) → Workers script への切替手動 runbook | `task-impl-opennext-workers-migration-001` に吸収済み。Cloudflare side cutover runbook / route / custom domain / rollback 確認を同タスクの AC に含める |
| C-3 | `deployment-cloudflare.md` 判定表「現状 (2026-04-29 → 2026-05-01) / 将来 / 根拠リンク / 更新日」反映 | **本タスク Phase 12 documentation-changelog Step 2** で同 wave 反映 |

## baseline 候補（将来再評価）

| # | 課題 | 起票タイミング |
| --- | --- | --- |
| B-1 | `@opennextjs/cloudflare` メジャーバージョンアップ（v2.x+）リリース時の互換性再評価 | v2.0 リリース検知時 |
| B-2 | rollback 手順 runbook（cutover 後問題発生で Pages 形式へ戻す手順） | 万一 cutover 後 production 障害発生時に即時起票 |

## current vs baseline 区分の根拠

| 区分 | 起票推奨度 |
| --- | --- |
| **current** | 本タスク完了直後 ～ 1 wave 内に起票推奨。cutover 残作業の実体化に必要 |
| **baseline** | 特定トリガ（バージョンアップ / 障害）発生時に起票。常時待機 |

## 完了確認

- [x] MAJOR 0 件
- [x] MINOR 0 件
- [x] 残課題 3 件（current 候補）すべてに統合先を明示
- [x] baseline 候補 2 件
- [x] MINOR 軽視禁止方針の冒頭宣言
