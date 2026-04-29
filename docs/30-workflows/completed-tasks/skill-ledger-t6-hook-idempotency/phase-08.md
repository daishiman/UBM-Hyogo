# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | template_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 5〜7 で固定した hook ガード、部分 JSON リカバリ、二段 smoke の重複を取り除き、同じ判定ロジックを複数箇所へ散らさない。

## 実行タスク

1. 禁止コマンド検査、派生物存在スキップ、JSON パース検査を共通関数または共通 runbook 節へ集約する。
2. 2 worktree / 4 worktree smoke の差分を `WORKTREE_COUNT` 相当の変数に畳む。
3. Phase 7 AC マトリクスの参照先を DRY 化後の単一責務へ更新する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-05.md | 実装ランブック |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-07.md | AC トレース |
| 必須 | .claude/skills/task-specification-creator/references/phase-templates.md | Phase 8 境界 |

## 実行手順

1. 重複箇所を grep で列挙する。
2. 共通化しても AC-1〜AC-11 のトレースが失われないことを確認する。
3. 変更後の runbook を Phase 9 の検証入力へ渡す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化後のコマンドと AC トレースを検証 |
| Phase 11 | smoke 手順の変数化を実走ログへ反映 |

## 多角的チェック観点（AIが判断）

- 共通化で A-2 gate や AC-1 の禁止コマンド検査が曖昧になっていないか。
- 2 worktree と 4 worktree の違いが count 以外に増えていないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 重複検出 | pending | Phase 5〜7 後に実施 |
| 2 | 共通化 | pending | 最小差分 |
| 3 | AC トレース更新 | pending | Phase 7 と同期 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| DRY 化記録 | outputs/phase-08/main.md | 重複除去結果と残した重複の理由 |

## 完了条件

- [ ] 重複除去対象と非対象が明記されている
- [ ] AC-1〜AC-11 の参照先が失われていない
- [ ] Phase 9 の検証コマンドが更新済み

## タスク100%実行確認【必須】

- [ ] 全実行タスク（3 件）が completed
- [ ] 成果物が `outputs/phase-08/main.md` に配置済み

## 次Phase

- 次 Phase: 9 (品質保証)
