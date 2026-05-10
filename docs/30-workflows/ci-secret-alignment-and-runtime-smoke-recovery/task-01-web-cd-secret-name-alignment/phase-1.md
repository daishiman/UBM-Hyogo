# Phase 1: 要件定義（task-01 — web-cd workflow secret 名整合）

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-09 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| feature branch（想定） | `fix/web-cd-secret-name-alignment` |
| 実装区分 | 実装仕様書（YAML 編集） |
| visualEvidence | NON_VISUAL |

---

## 1. 背景

PR #648 (`fix/ci-pipeline-recovery-web-cd-runtime-smoke`) の `dev` マージ直後の run #374 で、`web-cd / deploy-staging` が以下のエラーで失敗した。

```
[cf.sh] 1Password CLI (op) が見つかりません
```

CI runner には `op` が未インストール。本来 `scripts/cf.sh:21-23` の `CF_SH_SKIP_WITH_ENV=1` 分岐（env `CLOUDFLARE_API_TOKEN` が既に存在する場合 op を skip）に乗るはずだが、env が空文字のため到達できず exit 1 となった。

### 根本原因（コード読解結果）

| 項目 | 観測値 |
|---|---|
| `.github/workflows/web-cd.yml:22` の参照 | `CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}` |
| `.github/workflows/web-cd.yml:56` の参照 | `CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}` |
| 実 Environment `staging` の secret 一覧 | `CLOUDFLARE_API_TOKEN` のみ |
| 実 Environment `production` の secret 一覧 | `CLOUDFLARE_API_TOKEN` のみ |
| その他 `CF_TOKEN_WORKERS_*` 参照 | `grep -rn "CF_TOKEN_WORKERS" .github/` で本ファイル以外なし |

`secrets.CF_TOKEN_WORKERS_STAGING` は GitHub 側で undefined → env 空文字 → `cf.sh` が op fallback に進み fail。

---

## 2. 目的

`.github/workflows/web-cd.yml` の secret 参照名を実 Environment 登録名 `CLOUDFLARE_API_TOKEN` に整合させ、CI runner 上で `op` 不使用のまま Cloudflare deploy を成功させる。あわせて env が空時の早期 fail step を追加し、再発時の根本原因を runner ログ上で即座に特定可能にする。

---

## 3. P50 pre-check（事前確認サマリ）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| 実 GitHub Environment の secret | `staging` / `production` ともに `CLOUDFLARE_API_TOKEN` のみ登録済み | `gh api repos/daishiman/UBM-Hyogo/environments/{staging,production}/secrets` |
| Repo Variable | `CLOUDFLARE_ACCOUNT_ID` 登録済み | `gh variable list --env staging` |
| `scripts/cf.sh` の op skip 分岐 | `cf.sh:21-23` で `CLOUDFLARE_API_TOKEN` が空でなければ `CF_SH_SKIP_WITH_ENV=1` となり op を呼ばない | コード読解 |
| 旧 secret 名の他参照 | `grep -rn "CF_TOKEN_WORKERS" .github/` で `web-cd.yml` 以外なし | grep |
| 新 secret 名の他参照 | `backend-ci.yml` 等が既に `secrets.CLOUDFLARE_API_TOKEN` を参照しており名前衝突なし | grep |

---

## 4. scope

| in scope | out of scope |
|----------|-------------|
| `web-cd.yml` の secret 名整合（line 22 / 56） | `runtime-smoke-staging.yml` の readiness gate（task-02） |
| 両 deploy job への `Verify CF token is present` step 追加 | `scripts/cf.sh` のロジック改変 |
| YAML 構文 / grep gate の静的検証 | CI runner への `op` インストール |
| `dev` push 後の `gh run watch` による統合検証 | secret 実値の登録・ローテーション（ユーザー操作） |

---

## 5. pre-conditions

- 実 Environment `staging` / `production` に `CLOUDFLARE_API_TOKEN` が**既に登録されている**こと（確認済）。
- Repo Variable `CLOUDFLARE_ACCOUNT_ID` が登録されていること（確認済）。
- `mise install` 済（Node 24.15.0 / pnpm 10.33.2）でローカル静的検証が実行可能。

---

## 6. acceptance criteria

| # | 内容 |
|---|------|
| AC-01 | `web-cd.yml` から `CF_TOKEN_WORKERS_*` 文字列が完全に消えている |
| AC-02 | `secrets.CLOUDFLARE_API_TOKEN` が 2 箇所参照されている |
| AC-03 | `Verify CF token is present` step が両 job に存在する |
| AC-04 | `dev` push 後の `web-cd / deploy-staging` run で op 不在エラーが出ない |
| AC-05 | `Deploy to Cloudflare Workers (staging)` step が exit 0 |
| AC-06 | secret 実値が commit / PR / コードに残らない |

---

## 7. 成功基準（DoD と直結）

- 上記 AC-01..AC-06 のすべてが満たされる。
- `dev` push 後の `web-cd` workflow run が green。
- `production` 側も同じ修正済（次回 `dev → main` リリース時に同様の症状を防ぐ）。

---

## 8. open questions

| # | 質問 | 暫定方針 |
|---|------|----------|
| Q-01 | `production` Environment の `CLOUDFLARE_API_TOKEN` の token scope が `staging` と同等か | 現状同一 token を想定（要確認）。差異がある場合はユーザー操作で値を更新（リスクと緩和に記載） |
| Q-02 | `Verify CF token is present` の配置位置 | mise-action の **後**、Install dependencies の **前**（不変条件 6） |

---

## 9. exit criteria

| # | 条件 |
|---|------|
| EX-01 | inventory 1 件（`web-cd.yml`）が確定 |
| EX-02 | AC-01..AC-06 が機械検証可能な形式で列挙されている |
| EX-03 | `Verify CF token is present` の step 配置位置が確定 |
