# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 09 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |


## 目的

実装前に必要な静的品質ゲートと実装後に必要な runtime gate を分離する。


## 実行タスク

- 既存本文の該当 Phase 内容を確認する。
- artifacts.json の phase status と outputs 宣言に矛盾がないことを確認する。
- 後続実装が必要な項目は user gate と evidence path を明示する。


## 参照資料

- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/index.md`
- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`


## 成果物

- `phase-09.md`
- `outputs/phase-09/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. 静的検証チェックリスト

### 1.1 yaml / actionlint

| check | command | 期待 |
| --- | --- | --- |
| yaml syntax | `yamllint .github/workflows/post-release-dashboard.yml` | exit 0 |
| Actions schema | `actionlint .github/workflows/post-release-dashboard.yml` | exit 0 |
| cron 1 日 1 回 | `rg -c "cron: '0 0 \\* \\* \\*'" .github/workflows/post-release-dashboard.yml` | 1 |
| 高頻度 cron 不在 | `! rg "cron: '\\*/" .github/workflows/post-release-dashboard.yml` | exit 0（hit なし） |
| `_READONLY` token 参照 | `rg -c "CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY" .github/workflows/post-release-dashboard.yml` | >= 1 |
| 既存 token 不参照 | `! rg "secrets\\.CLOUDFLARE_API_TOKEN(\\W|$)" .github/workflows/post-release-dashboard.yml` | exit 0 |
| artifact path 固定 | `rg -c "outputs/post-release-dashboard/" .github/workflows/post-release-dashboard.yml` | >= 1 |

### 1.2 shell quality

| check | command | 期待 |
| --- | --- | --- |
| set -euo pipefail | `rg -L "set -euo pipefail" scripts/post-release-dashboard/` | hit なし（全 .sh が含む） |
| shellcheck | `find scripts/post-release-dashboard -name "*.sh" -print0 \| xargs -0 shellcheck -x` | exit 0 |
| `wrangler` 不使用 | `! rg "wrangler" scripts/post-release-dashboard/` | exit 0 |

### 1.3 metric naming consistency

```bash
rg -F "Workers requests" scripts/post-release-dashboard/lib/format-dashboard.sh
rg -F "Workers requests" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md
```
両方で hit すること。`D1 reads` / `D1 writes` も同様。

### 1.4 typecheck / lint

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
両 0 で抜けること。本タスクは bash 中心だが、`package.json` 編集の妥当性確認のため必須。

### 1.5 unit test

```bash
bash scripts/post-release-dashboard/__tests__/run-all.sh
```
全テスト pass。

## 2. coverage 観点

| 領域 | 影響 |
| --- | --- |
| `apps/web` / `apps/api` Vitest coverage | なし |
| Playwright | なし |
| coverage gate（`scripts/coverage-guard.sh`） | なし |

bash collector は coverage 計測対象外。代わりに **「主要関数のテストファイルが存在する」** を Phase 09 の checklist で担保（§1.5）。

## 3. lessons learned 反映確認

| L-ID | 反映先 |
| --- | --- |
| L-09c-EV-001（手動転記運用） | 本仕様の存在自体が解消手段 |
| L-CF-TOKEN-002（write scope 流用回避） | NFR-1 / NFR-2 / phase-05 §6 / AC-2 |
| L-FREE-TIER-003（高頻度 cron 回避） | NFR-3 / AC-7 / phase-08 §5 |

## 4. 不変条件レビュー（CLAUDE.md「重要な不変条件」）

| # | 条件 | 影響 |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | 影響なし |
| 2 | consent キー (`publicConsent` / `rulesConsent`) | 影響なし |
| 3 | `responseEmail` は system field | 影響なし |
| 4 | admin-managed data の分離 | 影響なし |
| 5 | apps/web から D1 直アクセス禁止 | 影響なし（本 workflow は CI 上 / D1 は GraphQL analytics 経由のみ） |
| 6 | GAS prototype を本番に昇格させない | 影響なし |
| 7 | MVP では Google Form 再回答が本人更新 | 影響なし |

## 5. governance チェック

| 観点 | 判定 |
| --- | --- |
| ブランチ運用（feature → dev → main） | OK（実装は `feat/issue-351-...` で開始） |
| CODEOWNERS（`.github/workflows/**`） | OK（既存 owner が `@daishiman`） |
| solo 開発・solo review 不要 | OK |
| `--no-verify` 不使用 | OK |

## 6. 完了条件

- [x] 静的検証コマンドが網羅
- [x] coverage 影響「なし」が確認
- [x] lessons learned 反映が確認
- [x] 不変条件レビュー済み

## outputs

- `outputs/phase-09/qa-checklist.md`
