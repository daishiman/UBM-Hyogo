# Phase 6: テスト追加

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL

---

## 1. 判定

本 cycle では OIDC workflow 実装を行わないため、追加 shell test / redaction test / CI step は作成しない。current gate は次の 2 点:

- `outputs/phase-11/cloudflare-oidc-support-revalidation.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 2. Future Test Scope

公式 support が確認された後続 task で staging proof を実装する場合、以下を新規テスト対象にする:

- `id-token: write` scope grep。
- subject claim mismatch rejection。
- OIDC deploy log redaction。
- step-scoped token fallback rehearsal。

## 3. DoD

- [x] 本 cycle で追加テストを作らない理由が明記されている
- [x] future test scope が後続 task へ分離されている
