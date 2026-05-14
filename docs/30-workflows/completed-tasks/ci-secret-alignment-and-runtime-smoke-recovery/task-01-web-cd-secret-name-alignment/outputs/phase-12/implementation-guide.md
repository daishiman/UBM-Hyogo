# Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

学校の職員室に「体育館の鍵」があるとします。先生が鍵を借りるとき、棚には「体育館」という名前で置いてあるのに、メモには「大ホールの鍵をください」と書いてあったら、係の人は正しい鍵を渡せません。今回の失敗も同じで、GitHub Actions が呼ぶ秘密の鍵の名前と、GitHub に置かれている秘密の鍵の名前がずれていました。

### 何をしたか

棚にある名前に合わせて、ワークフロー側の呼び名を `CLOUDFLARE_API_TOKEN` にそろえました。鍵の中身は変えていません。さらに、鍵が空だった場合はすぐに「鍵が空です」と分かるように、確認ステップを追加しました。

### 用語セルフチェック

| 用語 | 日常語での言い換え |
|---|---|
| GitHub Actions | 自動で作業をする係 |
| workflow | 作業手順書 |
| secret | 秘密の鍵 |
| Environment | 鍵を置く棚 |
| token | サービスに入るための合い鍵 |
| deploy | 作ったものを公開場所へ置くこと |

## Part 2: 技術者向け実装詳細

### Contract

```ts
type WebCdEnvironment = "staging" | "production";

interface WebCdDeployEnv {
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
}
```

### YAML contract

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

### Early-fail step

```bash
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "::error::CLOUDFLARE_API_TOKEN is empty. Confirm GitHub Environment '<env>' has CLOUDFLARE_API_TOKEN registered."
  exit 1
fi
```

### Error Handling / Edge Cases

| case | behavior |
|---|---|
| Secret missing | `Verify CF token is present` exits 1 before install/build/deploy |
| Account ID missing | existing deploy step fails through `scripts/cf.sh` / wrangler path |
| `dev` push | only staging job runs |
| `main` push | only production job runs |
| local deploy | `scripts/cf.sh` local 1Password path remains unchanged |

### Settings

| setting | source | required |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | GitHub Environment Secret (`staging` / `production`) | yes |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Variable | yes |
| `CF_SH_SKIP_WITH_ENV` | internal `scripts/cf.sh` behavior when token env exists | derived |
