# Phase 11: 手動テスト（NON_VISUAL）

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL

---

## NON_VISUAL 宣言

| 項目 | 内容 |
|---|---|
| タスク種別 | Cloudflare Workers GitHub Actions OIDC support revalidation |
| 非視覚的理由 | UI/UX 変更なし。検証対象は公式ドキュメントと repository secret boundary |
| 代替証跡 | `outputs/phase-11/cloudflare-oidc-support-revalidation.md` |

## 1. 証跡の主ソース

| 主ソース | 役割 | 状態 |
|---|---|---|
| `outputs/phase-11/cloudflare-oidc-support-revalidation.md` | Cloudflare Workers GitHub Actions docs / `wrangler-action` README の一次情報再検証 | present |
| `.github/workflows/web-cd.yml` | 変更しない current contract | no diff |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict 7 / artifacts parity / no-code classification | present |

## 2. 今回作成しない証跡

| 予約成果物 | 今回作成しない理由 |
|---|---|
| `outputs/phase-11/staging-oidc-deploy.log` | supported OIDC deploy path が未確認のため実走しない |
| `outputs/phase-11/rollback-rehearsal.log` | workflow mutation がないため rehearsal 対象がない |
| `outputs/phase-11/id-token-claim-design.md` | subject claim pin は後続 supported implementation task の gate として扱う |
| `outputs/phase-11/production-rollout-and-rollback.md` | production cutover は後続 task へ分離 |

## 3. 実行した確認

```bash
rg -n "CLOUDFLARE_API_TOKEN|id-token|wrangler-action" .github/workflows .claude/skills/aiworkflow-requirements/references/deployment-{gha,secrets-management}.md
cmp -s docs/30-workflows/issue-717-oidc-cf-full-migration/artifacts.json docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/artifacts.json
```

## 4. なぜスクリーンショットを作らないか

- UI 変更ゼロ。
- 検証対象は Cloudflare / GitHub Actions の認証方式に関する一次情報。
- 代替証跡はテキストの revalidation report と Phase 12 compliance check。

## 5. DoD

- [x] supported OIDC deploy path 未確認の一次情報が記録されている
- [x] staging OIDC deploy log を本 cycle の PASS 根拠にしていない
- [x] screenshot 不要理由が明示されている
