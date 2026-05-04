# `.env` op 参照キー存在確認 evidence

実行日: 2026-05-04
方式: `scripts/cf.sh` / `scripts/with-env.sh` 側からの key 名逆引き（`.env` 値は読まない）

## 逆引き結果（`grep -nE 'CLOUDFLARE_[A-Z_]+' scripts/cf.sh scripts/with-env.sh`）

```
scripts/cf.sh:67:        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}" \
scripts/cf.sh:75:        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}" \
```

要求 env key: `CLOUDFLARE_API_TOKEN`

## 存在確認

| 確認項目 | 結果 |
| --- | --- |
| `.env` に `CLOUDFLARE_API_TOKEN` op 参照キーが存在 | PASS（`bash scripts/cf.sh whoami` exit 0 で間接確認 — env 注入が成功している） |
| 1Password item の存在 | PASS（同上、`op run --env-file=.env` が token を解決できているため） |
| 値そのものの記録 | NO（記録しない） |
| 実 vault 名 / 実 item 名 | NO（記録しない） |

`bash scripts/cf.sh whoami` exit 0 + identity 取得が成立しているため、`.env` op 参照 → 1Password item → CLOUDFLARE_API_TOKEN 注入経路は健全。AC-3 PASS。
