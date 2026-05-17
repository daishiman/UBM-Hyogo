# Phase 2: 設計

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL

---

## 1. Current Design Decision

2026-05-16 時点では Cloudflare Workers GitHub Actions docs / `cloudflare/wrangler-action` README が supported OIDC deploy exchange を案内していない。したがって本 cycle の設計は **no-code verification package** とする。

| 項目 | 現 cycle の設計 |
|---|---|
| `.github/workflows/web-cd.yml` | 変更しない |
| GitHub OIDC permission | 追加しない |
| Cloudflare token exchange endpoint | 推測実装しない |
| current credential | Issue #640 step-scoped `CLOUDFLARE_API_TOKEN` を維持 |
| evidence | primary-source revalidation + Phase 12 strict outputs |

## 2. Future Supported Path Gate

公式 support が確認された場合だけ、後続 task で次の設計を具体化する。

| Gate | 内容 |
|---|---|
| G1 | Cloudflare docs / action release notes が input 名、audience、exchange endpoint、permission を明示 |
| G2 | staging proof を取得し、redacted log と no-leak check を保存 |
| G3 | production cutover を別 PR で実行 |
| G4 | observation 完了後に legacy token revocation を検討 |

## 3. Four-Condition Check

| 条件 | 判定 |
|---|---|
| 矛盾なし | unsupported OIDC を current implementation として扱わない |
| 漏れなし | future staging proof / production cutover / revocation / 1Password cleanup を follow-up 化 |
| 整合性あり | `verified_current_no_code_change_pending_pr` / `conditional` に統一 |
| 依存関係整合 | official support → staging proof → production cutover → revocation の順に固定 |
