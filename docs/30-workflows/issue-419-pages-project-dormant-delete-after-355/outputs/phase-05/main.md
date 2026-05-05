# Phase 05 — 実装ランブック (実行結果)

[実装区分: 実装仕様書]

## 状態

`PENDING_RUNTIME_EXECUTION` — 本タスクは spec_created 段階。runtime cycle（user 明示承認付き）で
Step 1〜8 を実行し、本ファイルを実行結果で更新する。

## 実装サマリ（spec_created 時点）

| 種別 | パス | 概要 |
| --- | --- | --- |
| runbook | `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/runbook.md` | Step 1〜8 の手順書（Phase 5 で作成） |
| pre-flight skeleton | `outputs/phase-11/preflight-ac1-ac2.md` | AC-1 / AC-2 確認テンプレ |
| pre-version-id skeleton | `outputs/phase-11/workers-pre-version-id.md` | rollback 戻り先 1段目記録 |
| dormant log skeleton | `outputs/phase-11/dormant-period-log.md` | 観察期間ログ |
| user approval skeleton | `outputs/phase-11/user-approval-record.md` | AC-4 承認文言 |
| deletion evidence skeleton | `outputs/phase-11/deletion-evidence.md` | 削除コマンド出力 |
| post smoke skeleton | `outputs/phase-11/post-deletion-smoke.md` | Workers 200 OK 確認 |
| redaction skeleton | `outputs/phase-11/redaction-check.md` | redaction grep 結果 |

## scripts/cf.sh 変更状況

- 既存 `scripts/cf.sh` の wrangler 引数 passthrough 設計を維持（破壊的変更なし）
- `bash scripts/cf.sh pages project list` / `bash scripts/cf.sh pages project delete <NAME>` は追加実装なしで動作
- helper 関数は今回追加しない（Phase 8 の DRY 採否判断と整合）

## ローカル検証結果（spec_created 時点）

```
mise exec -- pnpm typecheck   # PENDING (本サイクル末で実行)
mise exec -- pnpm lint        # PENDING
mise exec -- pnpm sync:check  # PENDING
```

## 後続 (runtime cycle) で実施

- Step 1: AC-1 / AC-2 pre-flight
- Step 2: Workers 前 VERSION_ID 取得
- Step 3: dormant 観察期間運用（≥2 週間）
- Step 4: user 明示承認取得
- Step 5: 削除コマンド実行
- Step 6: post-deletion smoke
- Step 7: redaction check
- Step 8: aiworkflow-requirements 更新

## 残課題

- runtime cycle 着手の前提条件（Workers cutover 完了）が満たされた時点で本ファイルを更新する
- destructive 操作のため `bypassPermissions` モードでも単独実行禁止
