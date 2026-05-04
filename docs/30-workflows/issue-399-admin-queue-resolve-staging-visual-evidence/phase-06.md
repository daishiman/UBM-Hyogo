# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 06 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## 異常系シナリオ

| ID | シナリオ | 期待動作 | 検証 |
| --- | --- | --- | --- |
| E-01 | `CLOUDFLARE_ENV=production` で seed 投入 | exit 1 / production binding 不実行 | T-01 |
| E-02 | `CLOUDFLARE_ENV` 未設定 | exit 1 | T-01 |
| E-03 | seed SQL 構文エラー | wrangler d1 execute が non-zero exit | T-03 |
| E-04 | cleanup を 2 回連続実行 | 2 回目も exit 0、count=0 のまま | T-04 |
| E-05 | cleanup 後に残存行あり | exit 1 / 明示エラーメッセージ | cleanup script 自体に検証 |
| E-06 | admin 認証 cookie 期限切れ中の screenshot 取得 | runbook が手動 re-login を案内 | runbook.md |
| E-07 | 409 toast 再現失敗（同時操作 timing） | runbook に「再試行 OK」と明記 | runbook.md |
| E-08 | 実 member PII が seed に混入 | redaction-check で検出 | Phase 11 redaction-check.md |

## fail-safe 確認

- seed / cleanup script は env guard 後に必ず実行ログを stdout に残す
- cleanup の verify 段階で count != 0 の場合、明示的に「manual cleanup required」と stderr 出力
- Playwright script は admin storageState を `~/.local/share/ubm-issue-399/` に保存し、リポジトリにコミットしない（`.gitignore` 確認）

## 完了条件

- [ ] - E-01〜E-08 の確認結果が `outputs/phase-06/main.md` に記録されていること
- `.gitignore` に `outputs/phase-11/.auth-state/` 等のローカル auth state パスが追加されていること

## 目的

Phase 06 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 06 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-06/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
