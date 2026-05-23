# Phase 5: 実装手順（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` 完了 |
| 出力 | `.github/workflows/web-cd.yml` への逐語 before/after 差分 |

---

## 1. 編集前の現状（参照）

`.github/workflows/web-cd.yml` 該当行:

- line 22 付近: `deploy-staging` job の env `CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}`
- line 56 付近: `deploy-production` job の env `CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}`

---

## 2. 5.1 deploy-staging job 差分

### before（line 14-46 周辺）

```yaml
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2
```

### after

```yaml
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2

      - name: Verify CF token is present
        run: |
          if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
            echo "::error::CLOUDFLARE_API_TOKEN is empty. Confirm GitHub Environment 'staging' has CLOUDFLARE_API_TOKEN registered."
            exit 1
          fi
```

---

## 3. 5.2 deploy-production job 差分

### before（line 48-80 周辺）

```yaml
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2
```

### after

```yaml
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2

      - name: Verify CF token is present
        run: |
          if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
            echo "::error::CLOUDFLARE_API_TOKEN is empty. Confirm GitHub Environment 'production' has CLOUDFLARE_API_TOKEN registered."
            exit 1
          fi
```

---

## 4. 編集手順

1. `git checkout -b fix/web-cd-secret-name-alignment`（PR base: `dev`）
2. `.github/workflows/web-cd.yml` を上記 §2 §3 の after に従って編集
3. `git diff .github/workflows/web-cd.yml` で差分を目視確認（+12 / -2 想定）
4. Phase 6 の静的検証コマンドを順に実行
5. 全 PASS で `git add .github/workflows/web-cd.yml`
6. commit message: `fix(ci): align web-cd secret refs to existing CLOUDFLARE_API_TOKEN env secret`
7. `git push -u origin fix/web-cd-secret-name-alignment`

---

## 5. 編集中の禁止事項

- `scripts/cf.sh` を変更しない
- `actions/checkout@v4` / `jdx/mise-action@v2` の major version を変更しない
- 既存 `Install dependencies` step / `Deploy to Cloudflare Workers` step のロジックに触れない
- secret 実値を commit message / コードコメントに書かない

---

## 6. exit criteria

| # | 条件 |
|---|------|
| EX-01 | §2 / §3 の after YAML が逐語で確定 |
| EX-02 | 編集手順が 1〜7 で確定 |
| EX-03 | 禁止事項が明示されている |
