# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |


## 目的

workflow / shell collector / redaction / schema check の検証戦略を定義する。


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

- `phase-04.md`
- `outputs/phase-04/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. テスト方針

本タスクは **GitHub Actions workflow + bash collector** が成果物。E2E は `workflow_dispatch` の dry-run（Phase 11）で行うため、本 Phase では **静的検証 + 単体検証** を中心に組む。

| 区分 | 目的 | 実行場所 |
| --- | --- | --- |
| 静的検証 | yaml syntax / schema / cron 仕様 / shell quoting | local + CI |
| 単体検証 | format-dashboard / redaction-check / judgment 判定の純関数挙動 | local（fixture-based） |
| 結合検証 | collector ↔ Cloudflare GraphQL の通信仕様（mock vs real） | local（mock fixture）+ Phase 11 dry-run（real） |
| evidence 検証 | artifact path / schema 適合 / redaction 0 件 | Phase 11 |

## 2. 追加するテストファイル

| path | 目的 | 実行 |
| --- | --- | --- |
| `scripts/post-release-dashboard/__tests__/format-dashboard.test.sh` | `format_dashboard` / `format_dashboard_markdown` の入出力 fixture テスト | `bash` 直実行 |
| `scripts/post-release-dashboard/__tests__/judgment.test.sh` | judgment ロジック（`<` / `<=` / `in` / WARN / UNKNOWN）の境界値 | `bash` 直実行 |
| `scripts/post-release-dashboard/__tests__/redaction-check.test.sh` | token / Bearer / Authorization 含有時 fail / 含まない時 pass | `bash` 直実行 |
| `scripts/post-release-dashboard/__tests__/fixtures/workers-req.json` | GraphQL レスポンス fixture | テストデータ |
| `scripts/post-release-dashboard/__tests__/fixtures/d1-metrics.json` | 同上 | テストデータ |
| `scripts/post-release-dashboard/__tests__/fixtures/cron-status.json` | 同上 | テストデータ |
| `scripts/post-release-dashboard/__tests__/run-all.sh` | 上記 3 テストを順次実行 | `pnpm post-release-dashboard:test` から呼ぶ |

> Vitest 等の TypeScript テストランナーは利用しない（本 collector は bash で完結）。`set -e` + `assert` 関数を test ファイル内に小規模に定義する。

## 3. 主要テストケース（境界値）

### 3.1 judgment ロジック

| metric | value | threshold | expected judgment |
| --- | --- | --- | --- |
| workers_requests | 4999 | `<` 5000 | PASS |
| workers_requests | 5000 | `<` 5000 | FAIL |
| workers_requests | 4001 | `<` 5000 | WARN（80% threshold = 4000 を超過）|
| workers_requests | 4000 | `<` 5000 | PASS（exactly 80%。> 4000 を WARN 条件） |
| d1_reads | 50000 | `<=` 50000 | PASS |
| d1_reads | 50001 | `<=` 50000 | FAIL |
| cron_status | "success" | `in` ["success","skipped"] | PASS |
| cron_status | "failure" | 同上 | FAIL |
| any | null | any | UNKNOWN |

### 3.2 redaction-check

| 入力 | 期待結果 |
| --- | --- |
| `dashboard.json` に `Bearer xxx` 文字列なし | exit 0 |
| `dashboard.json` に `"Authorization":"Bearer xxx"` を混入させた fixture | exit 1（fail） |
| `dashboard.md` に token らしき hex 40 文字列を混入 | exit 1（fail） |

### 3.3 format-dashboard

| fixture 入力 | 期待 stdout JSON |
| --- | --- |
| Workers req=1234 / errors=0 / D1 reads=0 / writes=0 / cron=success | `metrics[0].metric_id="workers_requests"` / `metrics[*].judgment in {PASS,WARN,FAIL,UNKNOWN}` / `schema_version="1"` |

### 3.4 yaml / cron 静的検証

| 検証 | コマンド |
| --- | --- |
| yaml syntax | `yamllint .github/workflows/post-release-dashboard.yml` |
| GitHub Actions schema | `actionlint .github/workflows/post-release-dashboard.yml` |
| cron 値固定 | `rg -n "cron: '0 0 \* \* \*'" .github/workflows/post-release-dashboard.yml` で 1 件 |
| 既存 token 不参照 | `! rg "secrets\\.CLOUDFLARE_API_TOKEN(\\W|$)" .github/workflows/post-release-dashboard.yml`（`_READONLY` でない `secrets.CLOUDFLARE_API_TOKEN` 参照が存在しないこと） |

## 4. mock vs real

- 単体テストはすべて mock fixture で行う（`curl` を `_curl_mock()` 関数で override）。
- real Cloudflare GraphQL を叩くのは Phase 11 の `workflow_dispatch` dry-run のみ。

## 5. coverage 観点

bash collector は coverage 数値計測の対象外（`apps/web` / `apps/api` の coverage gate には影響しない）。代わりに **「主要関数のテストファイルが存在する」を Phase 09 QA checklist に組み込む**。

## 6. 既存テストへの影響

| 既存 | 影響 |
| --- | --- |
| `apps/api` Vitest | なし |
| `apps/web` Vitest | なし |
| Playwright e2e | なし |
| backend-ci.yml | なし（本 workflow は別ファイル） |
| coverage gate | なし |

## 7. 完了条件

- [x] テスト区分とファイル一覧が確定
- [x] 主要テストケース（境界値含む）が確定
- [x] mock 戦略が確定
- [x] 既存テストへの影響が「なし」と確認できている

## outputs

- `outputs/phase-04/test-strategy.md`
