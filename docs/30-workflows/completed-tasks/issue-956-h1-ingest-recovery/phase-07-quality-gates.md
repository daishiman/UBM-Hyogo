# Phase 07 — 品質ゲート

## 7.1 ハード gate (失敗時タスク中止)

| gate | 条件 | 失敗時の処置 |
|------|------|--------------|
| G-CFSH | `wrangler` 直叩き 0 件 | 履歴 grep で違反検出時、再投入 & `cf.sh` 経由でやり直し |
| G-SECRET | secret 実値が docs / log / commit / chat に転記されていない | 該当ファイル即削除 & `git reflog` / log rotation 確認 |
| G-D1-SCOPE | D1 操作は `SELECT` / `UPDATE sync_jobs.status` のみ | 他 DML 検出時タスク中止 |
| G-SCHEMA | D1 schema 変更ゼロ | `cf.sh d1 migrations list` で drift 無確認 |
| G-CONST5 | `apps/web` から D1 binding 参照を追加していない | コード変更なしのため自動 pass |

## 7.2 ソフト gate (達成推奨)

| gate | 条件 | 未達時の処置 |
|------|------|--------------|
| G-OBS | cron tail を 16 分以上観測し scheduled 発火 1 行以上記録 | 短かった場合は再観測 |
| G-REASON | 失敗 run の reason code を sheets-auth-classifier カテゴリにマッピング | 観測無で追加 cycle 待機 |
| G-AC | Phase 01 AC-1〜AC-6 全達成 | 未達 AC を `outputs/phase-12/main.md` に明記 |

## 7.3 evidence gate

- `outputs/phase-11/snapshot-before.json` / `snapshot-after.json` の secrets 値が常に bool で payload 内に実値が含まれないこと (snapshot schema 上 zod で boolean 強制済み = 自動 pass)
- `cf-secret-list.txt` の各行が key 名のみで value を含まないこと (`cf.sh secret list` 仕様で自動)

## 7.4 docs gate (CI)

- `bash scripts/verify-pr-ready.sh` の `verify:phase12-compliance` で本 workflow の canonical 9 headings (Phase 1-13 + index + outputs) が揃うこと
- `gate-metadata:validate` で `artifacts.json` の zod schema を満たすこと
- `indexes:rebuild` の drift が出ないこと
