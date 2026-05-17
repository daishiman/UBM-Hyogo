# Implementation Guide

## Part 1: 中学生レベルの説明

### OIDC とは何か

OIDC は「その場で作る短時間だけ有効な入館証」のようなものです。GitHub Actions が Cloudflare に「この workflow は本物です」と証明し、Cloudflare が短時間だけ deploy できる credential を返す仕組みです。

### 今回なぜコード変更しないのか

Cloudflare Workers の公式 GitHub Actions 手順は、現時点では API token を GitHub Secrets に入れて `wrangler-action` に渡す方法を説明しています。`wrangler-action` の README も `apiToken` を使う手順を示しており、OIDC 用の入力は確認できません。

つまり、まだ入口が公式に案内されていない状態です。入口がない建物に無理やり入ろうとすると危険なので、今回はドアが公式に用意されるまで待つ判断にしました。

### 今の安全策

Issue #640 で、`CLOUDFLARE_API_TOKEN` は workflow 全体ではなく deploy step だけに渡す形へ絞っています。これは「マスターキーを校内に置きっぱなしにしないで、必要な部屋の前だけで使う」安全策です。

## Part 2: 技術者向け

### Current Contract

- `.github/workflows/web-cd.yml` は environment-scoped `secrets.CLOUDFLARE_API_TOKEN` を deploy step scope で使う。
- `scripts/cf.sh` は `CLOUDFLARE_API_TOKEN` を env var として読むため、secret name は維持する。
- `id-token: write` は今回追加しない。
- Cloudflare trust policy / principal 作成 / token exchange endpoint の実 mutation は行わない。

### Conditional Implementation Gate

OIDC 実装へ進める条件:

1. Cloudflare Workers GitHub Actions docs または wrangler-action docs が OIDC / workload federation deploy auth を公式に示す。
2. 入力名、audience、claim pin、exchange endpoint、rollback path が一次情報で確定する。
3. staging proof が user-approved PR 上で取得できる。
4. legacy token revocation は production cutover と observation 完了後に限る。

### Why This Is Elegant

仮 endpoint や推測 action input を作らず、現在の安全な step-scoped contract を維持する。複雑な暫定実装を入れないため、失敗時の rollback path と正本仕様が単純に保たれる。
