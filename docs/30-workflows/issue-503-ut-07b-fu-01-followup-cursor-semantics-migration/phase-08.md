# Phase 8: aiworkflow-requirements 反映 / runbook 設計

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-8/phase-8.md` |
| 実装区分 | runbook / SSOT 反映仕様書 |

## 目的
`.claude/skills/aiworkflow-requirements/references/database-schema.md` と `references/database-operations.md` に cursor mode 切替手順 / rollback 手順 / 採用判断レコードを書き込む仕様を確定する。`indexes/keywords.json` への追加キーと drift 確認手順も含める。

## 実行タスク
詳細は `outputs/phase-8/phase-8.md` を正本とする。本 Phase は既存正本ファイルへの追記を前提とし、新規 runbook を増やす場合は Phase 12 の SSOT 反映ログで根拠と索引更新を明記する。

## 統合テスト連携
- `mise exec -- pnpm indexes:rebuild` 実行後 `git status .claude/skills/aiworkflow-requirements/indexes/` で drift 無し確認する。
- CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）に整合させる。

## 参照資料
- `outputs/phase-8/phase-8.md`
- `.claude/skills/aiworkflow-requirements/references/`（既存 runbook 群）
- 起票元 §4 Phase 5 / §5 ドキュメント要件 / §6 skill index drift 確認

## 成果物
- `outputs/phase-8/phase-8.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` / `references/database-operations.md` への追記仕様
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` への追記キー仕様

## 完了条件
- cursor mode 切替手順（staging で `BACKFILL_CURSOR_MODE=cursor` を Cloudflare Workers env に設定する `bash scripts/cf.sh` コマンド）が確定。
- rollback 手順（env を `remaining-scan` に戻す）が確定。
- 追記キー (`cursor-mode` / `BACKFILL_CURSOR_MODE` / `last_processed_id`) が列挙されている。
- `pnpm indexes:rebuild` の drift 無し確認方針が明記されている。
