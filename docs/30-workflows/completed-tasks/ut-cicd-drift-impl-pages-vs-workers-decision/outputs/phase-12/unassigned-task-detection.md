# Phase 12 成果物: unassigned-task-detection

[FB-CANCEL-004-2] 対応で current / baseline 分離 + 関連タスク差分確認を必須記載。0 件でも本ファイルは出力する（spec ルール）。

## current（即時起票推奨）— base case = cutover

| # | 課題 | 起票形態 |
| --- | --- | --- |
| C-1 | `.github/workflows/web-cd.yml` の `command: pages deploy .next ...` → `command: deploy --env <env>` 置換（staging / production 両 job） | `task-impl-opennext-workers-migration-001`（既起票 unassigned）に **吸収可能 → 新規起票省略**。同タスク内で Phase 5 stub-1 / stub-2 を実施 |
| C-2 | Cloudflare ダッシュボード上の Pages project (`CLOUDFLARE_PAGES_PROJECT`) → Workers script への切替手動 runbook | `task-impl-opennext-workers-migration-001` に **吸収済み**。同タスクの AC-6 / スコープ / 成果物へ Cloudflare side 切替 runbook を明記したため、新規起票省略 |
| C-3 | `deployment-cloudflare.md` 判定表「現状 / 将来 / 根拠リンク / 更新日」反映 | **本タスク Phase 12 documentation-changelog Step 2** で同 wave 反映（→ 別タスク起票不要） |

## baseline（将来再評価）

| # | 課題 | 起票トリガ |
| --- | --- | --- |
| B-1 | `@opennextjs/cloudflare` メジャーバージョン（v2.x+）リリース時の互換性再評価 | v2.0 リリース検知時 |
| B-2 | rollback 手順 runbook（cutover 後問題発生で Pages 形式へ戻す手順） | 万一 cutover 後 production 障害発生時に即時起票 |

## 関連タスク差分確認 [FB-CANCEL-004-2]

| タスク | 状態 | 本 ADR との重複 | 判定 |
| --- | --- | --- | --- |
| `task-impl-opennext-workers-migration-001` | unassigned-task として既起票（2026-04-28） | 実 cutover 責務 ↔ 本 ADR は決定根拠責務 | **重複なし**。blocks 関係維持。C-1 を本タスクに吸収 |
| `UT-GOV-006-web-deploy-target-canonical-sync` | completed-tasks として記録 | canonical sync ガバナンス責務 ↔ 本 ADR は決定文書 | **重複なし**。related。本 ADR-0001 を sync 対象 list に 1 行追加 |

## 件数集計

| 区分 | 件数 |
| --- | --- |
| current（新規起票推奨） | **0**（C-1 / C-2 = 既存タスク吸収、C-3 = 本タスク内で吸収） |
| baseline（将来再評価） | 2（B-1 / B-2） |
| 関連タスク重複 | 0 |

## 完了確認

- [x] current / baseline 分離
- [x] 関連タスク差分確認（重複 0）
- [x] current 新規起票 0 件でも出力必須ルール遵守
