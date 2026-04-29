# Phase 11 manual-smoke-log — dev push smoke（NOT EXECUTED）

> 本ログは Phase 13 ユーザー明示承認後に実走する smoke 手順の仕様固定であり、現時点では実行していない。

## STEP 0: 前提確認

| 確認 | コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- |
| UT-05 merged | `gh pr list --search "UT-05" --state merged` | CI/CD workflow の secret / variable 参照キーが確定済み | NOT EXECUTED |
| UT-28 project | `bash scripts/cf.sh pages project list` | `CLOUDFLARE_PAGES_PROJECT` の値が確定済み | NOT EXECUTED |
| 01b bootstrap | `op item get "Cloudflare" --vault UBM-Hyogo > /dev/null` | API Token / Account ID の正本が 1Password に存在 | NOT EXECUTED |
| GitHub auth | `gh auth status` | actions:write / administration:write 相当の権限確認 | NOT EXECUTED |

## STEP 1: dev 空コミット push

```bash
git switch dev
git pull --ff-only origin dev
git commit --allow-empty -m "chore(cd): trigger deploy-staging smoke [UT-27]"
git push origin dev
```

- 状態: NOT EXECUTED
- 期待結果: dev push で `backend-ci.yml` / `web-cd.yml` がトリガーされる。

## STEP 2: CD green 確認

```bash
gh run list --branch dev --limit 5
gh run watch
gh run view <run-id> --log | rg -nE "401|403|404|Unauthorized|invalid token" || echo "secret error なし"
```

- 状態: NOT EXECUTED
- 期待結果: `deploy-staging` が green。401 / 403 / 404 / invalid token が出ない。

## STEP 3: Discord 通知 / 未設定耐性

| ケース | 確認 | 期待結果 | 状態 |
| --- | --- | --- | --- |
| 通常通知 | Discord チャンネル目視 | commit SHA / job 名 / 結果が通知される | NOT EXECUTED |
| 未設定耐性 | `DISCORD_WEBHOOK_URL` 空相当 | 通知 step が early-return し CI 全体は成功 | NOT EXECUTED |
| workflow 実装 | env で受けて shell 空文字判定 | `if: secrets.X != ''` 依存が残っていない | NOT EXECUTED |

## STEP 4: 1Password Last-Updated メモ

- 状態: NOT EXECUTED
- 期待結果: 1Password Item Notes に同期日だけを記録する。値ハッシュや secret 値は記録しない。
