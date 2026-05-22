# Phase 7: 静的検証

## 検証項目

| 項目 | コマンド | 期待 |
|------|---------|------|
| JSON 構文 (dev) | `jq -e . .github/branch-protection/dev.json` | exit 0 |
| JSON 構文 (main) | `jq -e . .github/branch-protection/main.json` | exit 0 |
| manifest schema | `jq -e 'has("contexts") and (.contexts|type=="array") and has("strict") and (.strict|type=="boolean")' .github/branch-protection/{dev,main}.json` | exit 0 |
| bash 構文 (apply) | `bash -n .github/branch-protection/apply.sh` | exit 0 |
| bash 構文 (verify) | `bash -n scripts/verify-branch-protection.sh` | exit 0 |
| yml 構文 | `pnpm dlx yaml-lint .github/workflows/lighthouse.yml`（または `actionlint`） | exit 0 |
| typecheck（不要） | — | コード非対象のためスキップ |
| lint（不要） | — | 同上 |

## 実行コマンド

```bash
# JSON
jq -e . .github/branch-protection/dev.json > /dev/null
jq -e . .github/branch-protection/main.json > /dev/null
jq -e 'has("contexts") and (.contexts|type=="array") and has("strict") and (.strict|type=="boolean")' \
  .github/branch-protection/dev.json > /dev/null
jq -e 'has("contexts") and (.contexts|type=="array") and has("strict") and (.strict|type=="boolean")' \
  .github/branch-protection/main.json > /dev/null

# bash
bash -n .github/branch-protection/apply.sh
bash -n scripts/verify-branch-protection.sh

# yml (actionlint があれば)
which actionlint && actionlint .github/workflows/lighthouse.yml || true
```

## 検査内容

- secrets 値（`CLOUDFLARE_API_TOKEN` 等）の混入が無いか `grep -rE '(ghp_|sk-|cf_)' .github/branch-protection/ scripts/verify-branch-protection.sh` で確認
- `wrangler login` 経由の OAuth token 痕跡が無いか確認

## 期待結果

全項目 exit 0。違反があれば実装フェーズ（Phase 6）に差し戻し。
