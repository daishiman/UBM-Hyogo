# Phase 2: 設計

## メタ情報

- phase: 2 / design
- prev: phase-1-requirements
- next: phase-3-design-review

## 目的

legacy token 失効を deploy 経路の中断なく完了させるための「read-only inventory → 新 token/value 確認 → backend workflow rename → runtime green → user-approved revocation」の順序を確定し、影響範囲を設計する。

## 設計方針

### 1. Secret 命名規約

| 対象 | 正本 secret 名 | 方針 |
|------|------|------|
| backend D1 migration staging | `CF_TOKEN_D1_STAGING` | 既存正本名へ切替 |
| backend D1 migration production | `CF_TOKEN_D1_PRODUCTION` | 既存正本名へ切替 |
| backend Workers deploy staging | `CF_TOKEN_WORKERS_STAGING` | 既存正本名へ切替 |
| backend Workers deploy production | `CF_TOKEN_WORKERS_PRODUCTION` | 既存正本名へ切替 |
| web-cd staging / production | `CLOUDFLARE_API_TOKEN` | 正本上 current runtime 名のため維持。legacy token value ではないことを operator-only evidence で確認 |

> 新規 `CLOUDFLARE_API_TOKEN_DEPLOY_*` family は導入しない。正本の既存 `CF_TOKEN_*` family と conflict するため、命名体系を増やさない。

### 2. コード変更計画（実装仕様）

#### 2.1 `.github/workflows/web-cd.yml`

```diff
@@ staging deploy step (around L44) @@
-          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
+          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

```diff
@@ production deploy step (around L89) @@
-          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
+          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

`web-cd.yml` は Issue #718 では rename しない。Phase 11 で `CLOUDFLARE_API_TOKEN` environment secret の値 provenance を operator-only に確認し、legacy value が使われている場合は revocation を NO-GO にする。

#### 2.2 `.github/workflows/backend-ci.yml`

L41, L52, L96, L107 の 4 箇所を step 名ごとに exact mapping で置換する。

| step | 変更後 |
| --- | --- |
| staging `Apply D1 migrations` | `apiToken: ${{ secrets.CF_TOKEN_D1_STAGING }}` |
| staging `Deploy Workers app` | `apiToken: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}` |
| production `Apply D1 migrations` | `apiToken: ${{ secrets.CF_TOKEN_D1_PRODUCTION }}` |
| production `Deploy Workers app` | `apiToken: ${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}` |

#### 2.3 `scripts/__tests__/workflow-env-scope.test.sh`

backend deploy step に legacy `secrets.CLOUDFLARE_API_TOKEN` が残らないこと、かつ step 名ごとの期待 secret 名が一致することを検証する gate を追加する。

```bash
# 追加する検証セクション（疑似コード）
grep -A10 'name: Apply D1 migrations' "$BACKEND_CI" | grep -q 'secrets.CF_TOKEN_D1_STAGING'
grep -A10 'name: Deploy Workers app' "$BACKEND_CI" | grep -q 'secrets.CF_TOKEN_WORKERS_STAGING'
grep -A60 'deploy-production:' "$BACKEND_CI" | grep -A10 'name: Apply D1 migrations' | grep -q 'secrets.CF_TOKEN_D1_PRODUCTION'
grep -A60 'deploy-production:' "$BACKEND_CI" | grep -A10 'name: Deploy Workers app' | grep -q 'secrets.CF_TOKEN_WORKERS_PRODUCTION'
! grep -nE 'apiToken: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}' "$BACKEND_CI"
```

`web-cd.yml` の `secrets.CLOUDFLARE_API_TOKEN` は正本上の current runtime 名として許可する。ただし Phase 11 で value provenance が legacy なら revocation は NO-GO。

#### 2.4 `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

inventory 表に以下を追記:
- backend-ci が `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` を current runtime とすること
- web-cd の `CLOUDFLARE_API_TOKEN` は environment-scoped current runtime 名として残るが、legacy account-scoped value は revocation 済みであること
- revocation evidence は token id / suffix / account id / value hash を含まないこと

### 3. 実行順序（運用シーケンス）

```
[T0] read-only inventory を取得し、backend / web / manual path を分類
[T1] backend 用 `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` と web 用 `CLOUDFLARE_API_TOKEN` の value provenance を operator-only に確認
[T2] 必要なら user-approved secret set で current value を補正（値・URI・hash は記録禁止）
[T3] PR で backend workflow rename + exact step gate 追加 → dev へマージ
[T4] staging deploy が新 secret で green になることを確認
[T5] production deploy が新 secret で green になることを確認
[T6] operator approval marker を保存し、Cloudflare dashboard で legacy token を revoke
[T7] GitHub Secrets から legacy value の active surface が消えていることを name-only inventory で確認
[T8] 1Password の旧 item を revoked 注釈付きで保持または削除
[T9] inventory 正本 (`deployment-secrets-management.md`) を更新
```

T3-T5 が本仕様書のコード実装範囲。T0-T2 / T6-T9 は Phase 11（手動運用）で扱う。

## 影響範囲

- GitHub Actions: `web-cd.yml`、`backend-ci.yml`（rename のみ・logic 変更なし）
- 検証 script: `scripts/__tests__/workflow-env-scope.test.sh`
- 正本ドキュメント: `deployment-secrets-management.md`
- Cloudflare dashboard / GitHub Secrets / 1Password（手動 surface）

## NO-GO 条件

- Issue #640 staging/production evidence が green でない
- 新 secret が GitHub Environments に未投入の状態で workflow rename PR をマージしようとした場合
- deploy 以外の path（`scripts/cf.sh` 経由の手動 D1 / audit）が legacy token に依存していることが判明した場合

## 成果物

- `outputs/phase-2/secret-rename-plan.md`
- `outputs/phase-2/workflow-diff-plan.md`
- `outputs/phase-2/run-sequence.md`

## 完了条件

- [ ] secret 命名規約と rename diff が確定
- [ ] 実行順序 T0-T9 が明文化
- [ ] NO-GO 条件が列挙されている

## タスク100%実行確認【必須】

- [ ] 成果物 3 ファイル作成
- [ ] 影響範囲が `outputs/phase-1/legacy-token-reference-inventory.md` と整合

## 次Phase

phase-3-design-review.md
