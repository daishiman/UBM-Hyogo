# Phase 8: リファクタリング

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL

---

## 1. リファクタリング判定

本 cycle では repository workflow / application code を変更しないため、コードリファクタリング対象はない。実施した改善は、unsupported OIDC 判定を正本仕様・Phase outputs・follow-up task に反映するドキュメント整合化。

| 対象 | 判定 | 理由 |
|---|---|---|
| `.github/workflows/web-cd.yml` | no change | supported OIDC deploy path 未確認 |
| `scripts/cf.sh` | no change | current `CLOUDFLARE_API_TOKEN` env contract を維持 |
| `.claude/skills/aiworkflow-requirements` | update | no-code decision と current secret boundary を正本化 |
| future OIDC design snippets | appendix/future only | executable claim として扱わない |

## 2. 削除対象

なし。既存 runtime path は rollback-capable baseline として維持する。

## 3. DoD

- [x] no-code 判定下で不要な abstraction を追加していない
- [x] future design と current executable state を分離している
- [x] current secret boundary を壊していない
