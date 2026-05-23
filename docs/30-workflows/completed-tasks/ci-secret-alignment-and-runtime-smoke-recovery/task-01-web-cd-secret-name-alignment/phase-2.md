# Phase 2: 設計（task-01 — web-cd workflow secret 名整合）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` 完了 |
| 出力 | 設計判断 D1〜D3、env contract、不変条件チェック表 |

---

## 1. 設計判断

### D1. CF token は GitHub Environment Secret 直接注入

| 案 | 採否 | 理由 |
|---|---|---|
| A. workflow を `secrets.CLOUDFLARE_API_TOKEN` 参照に統一 | ✅ 採用 | 既存 Environment 登録と一致。改修箇所は YAML 2 行のみ。op 経路は CI で skip される既存分岐 (`cf.sh:21-23`) に乗る |
| B. Environment secret を `CF_TOKEN_WORKERS_STAGING` 等にリネーム | ✗ | 影響箇所多数（ユーザー操作必須）、secret 削除は不可逆。価値なし |
| C. `op` を CI runner にインストール | ✗ | ユーザー方針「CI では op 不使用」に反する |

### D2. env 空時の早期 fail step

| 案 | 採否 | 理由 |
|---|---|---|
| A. `cf.sh` 任せ（既存挙動） | ✗ | ログが「op 不在」で出てしまい根本原因（env 空）が分かりにくい |
| B. workflow に明示的 `Verify CF token is present` step を追加 | ✅ 採用 | `::error::` で env 空を runner ログに先頭表示。secret 名 drift の再発を即時検知可能 |
| C. `if: env.CLOUDFLARE_API_TOKEN == ''` で skip | ✗ | 「PASS のように見える」誤検知リスク |

### D3. cf.sh 改変の有無

非対象（CONST）。`cf.sh:21-23` の `CF_SH_SKIP_WITH_ENV` 分岐がそのまま機能するため、CI 側で env を渡すだけで成立する。

---

## 2. workflow contract（変更後の正規形）

### 2.1 deploy-staging job env

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}   # Environment scoped (staging)
  CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}    # Repo variable
```

### 2.2 deploy-production job env

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}   # Environment scoped (production)
  CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}    # Repo variable
```

### 2.3 新設 step（両 job 共通）

```yaml
- name: Verify CF token is present
  run: |
    if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
      echo "::error::CLOUDFLARE_API_TOKEN is empty. Confirm GitHub Environment '<env>' has CLOUDFLARE_API_TOKEN registered."
      exit 1
    fi
```

`<env>` は `staging` / `production` の job ごとに置き換える。

### 2.4 step 配置順

```
1. actions/checkout@v4
2. jdx/mise-action@v2
3. Verify CF token is present   ← NEW
4. Install dependencies (pnpm install)
5. Deploy to Cloudflare Workers (cf.sh deploy)
```

不変条件 6（mise-action の後 / Install dependencies の前）に従う。

---

## 3. 不変条件チェック

| 不変条件 | 満たし方 |
|---|---|
| CI で op 不使用 | `CLOUDFLARE_API_TOKEN` を env 注入することで `cf.sh:21-23` の skip 分岐に到達 |
| ローカル op 経路維持 | `cf.sh` 自体は無変更 |
| readiness 不足を黙殺しない | `Verify CF token is present` が `::error::` で明示 fail |
| secret 値の docs 残留禁止 | 本仕様書には secret 名のみ記載・実値ゼロ |
| production も同期 | `deploy-production` 側も同じ差分を適用 |

---

## 4. 影響範囲（参照グラフ）

```
.github/workflows/web-cd.yml
  ├─ deploy-staging
  │   ├─ env CLOUDFLARE_API_TOKEN ←── secrets.CLOUDFLARE_API_TOKEN（staging env）
  │   └─ steps: checkout → mise → [Verify CF token] → install → cf.sh deploy
  └─ deploy-production
      ├─ env CLOUDFLARE_API_TOKEN ←── secrets.CLOUDFLARE_API_TOKEN（production env）
      └─ steps: checkout → mise → [Verify CF token] → install → cf.sh deploy
```

`scripts/cf.sh` は無変更。`backend-ci.yml` 他 workflow への影響なし（既に `secrets.CLOUDFLARE_API_TOKEN` を参照済で名前衝突なし）。

---

## 5. exit criteria

| # | 条件 |
|---|------|
| EX-01 | D1〜D3 の採用案・棄却案・理由が表で固定されている |
| EX-02 | 2.1 / 2.2 / 2.3 の YAML contract が逐語で確定している |
| EX-03 | step 配置順が 2.4 の 5 ステップで確定している |
| EX-04 | 不変条件 5 件すべての満たし方が記述されている |
