# Unassigned Task Detection — ut-09a-cloudflare-auth-token-injection-recovery-001

## Summary

runtime close-out 段階での未タスク検出。新規 follow-up タスクの起票判定と、既存 unassigned-task source stub の扱いを記録する。**0 件であっても本ファイルは出力必須**。

## Decisions

| item | status | formalize decision | path | 根拠 |
| --- | --- | --- | --- | --- |
| 本タスクの正式化 | existing | already promoted to workflow root | `docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/` | 既存 unassigned `task-09a-cloudflare-auth-token-injection-recovery-001.md` を本 workflow root へ promote 済み |
| `unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md` | consumed | source stub updated | `docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md` | Phase 11 PASS 済み。削除・移動は task history の追跡性を落とすため行わず、source stub を `consumed_by_workflow / runtime_evidence_captured` に更新 |
| 親タスク `ut-09a-exec-staging-smoke-001` | existing | no new task | `docs/30-workflows/ut-09a-exec-staging-smoke-001/` | 本タスク Phase 11 PASS で親タスク Phase 11 を unblock。新規起票不要 |
| production 認証経路改修 | out-of-scope | no new task | — | 本タスクは staging 復旧 SOP に閉じる。production は同経路で副次的に復旧する想定 |
| `wrangler login` 残置除去 | conditional | 個別タスク化不要 | 本タスク Phase 11 内で対処 | 残置検知 + user 明示指示後の除去を本タスク Phase 11 で完結させる |
| Cloudflare 認証復旧 SOP の skill promote | conditional | Phase 12 skill-feedback で記録 | `outputs/phase-12/skill-feedback-report.md` | 本サイクル内で skill 側 SOP テンプレに promote する候補。新規タスク起票不要 |
| token 再発行 | conditional | user 明示指示後にのみ実行 | 本タスク Phase 11 内 | token 失効が確認された場合、user 明示指示後に 1Password 上で更新。新規タスク起票不要 |

## Result

- runtime close-out 段階で**新規起票が必要な未タスクは 0 件**
- 既存 unassigned ファイル 1 件は source stub として維持し、canonical workflow root への誘導と Phase 11 PASS を明記済み

## 後続レビュー条件

Phase 11 で BLOCKED / FAIL が発生した場合は、原因に応じて以下の起票を再検討する:

- token 失効が頻発する場合: token rotation SOP の独立タスク化
- `op signin` 環境セットアップが頻発する場合: 1Password CLI セットアップ手順の独立タスク化
- `wrangler login` 残置が他の開発者にも発生する場合: hook / lefthook 側で残置検知する自動化タスクの起票
