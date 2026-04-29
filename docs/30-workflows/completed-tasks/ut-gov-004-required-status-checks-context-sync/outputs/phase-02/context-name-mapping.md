# context-name-mapping.md — 草案 8 contexts と実在 context 名のマッピング

> 作成日: 2026-04-29
> Phase: 2 (設計)
> 入力: Phase 1 main.md / `.github/workflows/*.yml` / `gh api check-runs`

## 1. 実在 workflow / job 一覧（走査結果）

`.github/workflows/` 配下を全走査した結果、現時点で実在する workflow と job、および GitHub 上で報告される最終 context 名は以下のとおり。

| # | workflow ファイル | top-level `name:` | job key | job `name:` | matrix | 最終 context 名 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci.yml` | `ci` | `ci` | `ci` | なし | `ci` |
| 2 | `validate-build.yml` | `Validate Build` | `validate-build` | `Validate Build` | なし | `Validate Build` |
| 3 | `verify-indexes.yml` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` | なし | `verify-indexes-up-to-date` |
| 4 | `backend-ci.yml` | `backend-ci` | `deploy-staging` | （未指定→キー名） | なし | `backend-ci / deploy-staging` |
| 5 | `backend-ci.yml` | `backend-ci` | `deploy-production` | （未指定→キー名） | なし | `backend-ci / deploy-production` |
| 6 | `web-cd.yml` | `web-cd` | `deploy-staging` | （未指定→キー名） | なし | `web-cd / deploy-staging` |
| 7 | `web-cd.yml` | `web-cd` | `deploy-production` | （未指定→キー名） | なし | `web-cd / deploy-production` |

> 注: `backend-ci` / `web-cd` は `if: github.ref_name == 'dev' or 'main'` 条件付きで feature ブランチでは job が起動しない。pull_request トリガも持たないため PR check-run としては発生せず、branch protection の status check 投入候補としては不適切。

## 2. 草案 8 contexts のマッピング

| # | 草案名 | 経路 | 実在 context（フルパス） | 直近成功実績 (date / sha) | UT-GOV-001 投入 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | typecheck | rename | `ci` | 2026-04-28T21:46:33Z / `f4fb3baa` (main) | YES | `ci` job 内 `pnpm typecheck` ステップを内包 |
| 2 | lint | rename | `ci` | 2026-04-28T21:46:33Z / `f4fb3baa` (main) | YES（`ci` で重複） | 同 job 内 `pnpm lint` ステップ。投入文字列は `ci` 一本で済むため重複登録しない |
| 3 | unit-test | exclude | -（実在 workflow なし） | n/a | NO | UT-GOV-005 で test workflow 新設後に後追い投入 |
| 4 | integration-test | exclude | -（実在 workflow なし） | n/a | NO | UT-GOV-005 リレー |
| 5 | build | rename | `Validate Build` | 2026-04-28T21:46:33Z / `f4fb3baa` (main) | YES | `validate-build.yml` の job を直接対応 |
| 6 | security-scan | exclude | -（実在 workflow なし） | n/a | NO | UT-GOV-005 リレー（CodeQL / 依存脆弱性スキャン等） |
| 7 | docs-link-check | exclude | -（実在 workflow なし） | n/a | NO | UT-GOV-005 リレー |
| 8 | phase-spec-validate | rename | `verify-indexes-up-to-date` | 2026-04-28T21:46:27Z / `f4fb3baa` (main) | YES | skill indexes drift 検出として「Phase 仕様書の整合検証」に類する役割を担う近接代替 |

> 草案 #2 (`lint`) は #1 (`typecheck`) と同 job のため context 重複となる。`required_status_checks.contexts` には文字列重複を持たせず `ci` 一本で代表させる。

## 3. 確定 context リスト（UT-GOV-001 入力 — Phase 8 confirmed-contexts.yml と一致）

```yaml
# UT-GOV-004 が確定した required_status_checks.contexts（フェーズ 1 投入対象）
required_status_checks:
  contexts:
    - "ci"
    - "Validate Build"
    - "verify-indexes-up-to-date"
  strict:
    dev: false
    main: true
```

> Phase 3 の代替案レビューで上記が base case として比較される。Phase 8 で `confirmed-contexts.yml` に機械可読形で正本化する。

## 4. 除外 context と UT-GOV-005 リレー候補

| 草案名 | 除外理由 | UT-GOV-005 リレー時の最低条件 |
| --- | --- | --- |
| unit-test | 該当 workflow なし | vitest 系 workflow 新設 → main / dev で 1 回以上 `conclusion=success` を確認後に追加投入 |
| integration-test | 同上 | 統合テスト workflow 新設 → 同条件 |
| security-scan | 同上 | CodeQL 等 workflow 新設 → 同条件 |
| docs-link-check | 同上 | lychee / markdown-link-check workflow 新設 → 同条件 |

後追い投入条件は `staged-rollout-plan.md` §フェーズ 2 で詳細化。

## 5. 実績確認証跡

`gh api repos/daishiman/UBM-Hyogo/commits/main --jq '.sha'` → `f4fb3ba6d018075db0e2292542c90a899d3c2dd7` (取得日: 2026-04-29)

`gh api repos/daishiman/UBM-Hyogo/commits/f4fb3baa/check-runs --paginate`:

```json
{"completed_at":"2026-04-28T21:46:33Z","conclusion":"success","name":"Validate Build"}
{"completed_at":"2026-04-28T21:46:27Z","conclusion":"success","name":"verify-indexes-up-to-date"}
{"completed_at":"2026-04-28T21:46:33Z","conclusion":"success","name":"ci"}
```

過去 50 件の `actions/runs` でも `ci` / `Validate Build` / `verify-indexes-up-to-date` の `conclusion=success` を main / feature 両方で多数確認。`backend-ci` / `web-cd` は feature ブランチで `failure` 多数（条件付き jobs のため job 起動せず workflow が空 conclusion 状態になる）→ branch protection 候補から自動除外。

## 6. AC 充足

- AC-1: §1 表で全 workflow / job / matrix 後の最終 context 名一覧化 ✅
- AC-2: §2 表で 8 件すべて rename / exclude 確定 ✅
- AC-3: §5 で過去 30 日以内 success 証跡確認 ✅
- AC-8: §1 / §2 で `<workflow>/<job>` フルパス記載規約遵守 ✅
