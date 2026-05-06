# 未タスク検出レポート — Issue #402

## サマリ

| 項目 | 値 |
| --- | --- |
| 検出件数 | 4（spec_created として別エージェントが起票） |
| 検出日 | 2026-05-06 |
| 状態 | spec_created（runtime apply pending / follow-up specs queued） |
| 配置先 | `docs/30-workflows/unassigned-task/` |

> 当初 Phase-12 では「runtime evidence の取得は本 workflow の Phase 11 / Phase 13 user 承認内で扱う」として 0 件宣言していたが、spec close-out の境界（コード/SSOT 反映の完了）と runtime apply の境界（staging/production 実機反映）を混同しないため、runtime evidence 取得・production apply・周辺フォローアップを **scope out から spec_created 起票へ昇格** させる。これにより本タスクは spec close-out をもって完了とし、runtime 系は別タスクとしてトラッキングする。

## 新規未タスク（4 件）

| ファイル名 | 一行サマリ |
| --- | --- |
| `staging-runtime-evidence-001.md` | staging で `RETENTION_PURGE_MODE=dry-run` を有効化し、cron 実行ログ・対象件数・audit_log 行を Phase 11 evidence として取得する |
| `production-apply-enable-001.md` | user approval 後、production の `RETENTION_PURGE_MODE` を `dry-run` → `apply` に切替え、初回 apply の差分・runbook 手順を確定する |
| `audit-log-retention-followup-001.md` | `audit_log` テーブル自体の retention（本タスクスコープ外）を `data-retention-policy.md` の future TODO から正式タスクへ昇格させる |
| `approve-email-template-001.md` | approve 時に user へ送付する mail / マイページ表示テンプレに `retentionPurgeScheduledAt`（180 日後の物理削除予定日）を反映する |

各タスク仕様書は `docs/30-workflows/unassigned-task/` 配下に上記ファイル名で配置する。

## 検出ルール適用結果

| ルール | 結果 | 備考 |
| --- | --- | --- |
| 本タスクの DoD で未満たし | 0 件 | spec / 実装 / SSOT は本 workflow 内で完了。runtime apply は別タスクへ分離 |
| 既存 admin request flow への drift | 0 件 | approve handler は既存 `deleted_at` 記録を維持。deadline 列は追加しない |
| 子テーブル 連鎖削除漏れ | 0 件 | 対象 3 子テーブル (`member_responses`, `member_identities`, `member_status`) を Phase 5 で網羅 |
| audit_log table への retention 適用 | spec_created へ昇格 | `audit-log-retention-followup-001` として別タスク化 |
| SSOT 反映漏れ | 0 件 | `data-retention-policy.md` を新規 SSOT として実体配置し、Phase 12 system-spec-update-summary に明記 |
| skill-feedback-report の提案 | 0 件 | 提案は今回 workflow 内で反映 / no-op 仕分け済み |
| runtime evidence / production apply | spec_created へ昇格 | `staging-runtime-evidence-001` / `production-apply-enable-001` として別タスク化 |
| approve 通知文言 | spec_created へ昇格 | `approve-email-template-001` として別タスク化 |

## Follow-up 候補

実装着手後の Phase 11 runtime で以下が観測された場合は、上記 4 件とは別に追加 follow-up を起票する:

- dry-run と apply の対象 ID が不一致
- 子テーブル row が残存
- audit_log 差分行に PII が混入

## 親 Issue との関係

Issue #402 は CLOSED 状態だが、本タスクは spec 化により retention purge 実装の正式 workflow として再起動した。runtime apply / 周辺フォローアップは上記 4 件の別タスクへ移管したため、Issue #402 の re-open は不要（必要なら Phase 13 PR comment から各 follow-up タスクへリンクする）。
