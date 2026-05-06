# issue-351-09c-post-release-dashboard-automation

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | issue-351 |
| mode | serial |
| owner | - |
| 作成日 | 2026-05-05 |
| 改訂日 | 2026-05-05 |
| 状態 | implemented-local / NON_VISUAL / implementation |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| workflow_state | implemented-local |
| GitHub Issue | #351（CLOSED 状態のまま扱う。reopen 禁止 / `Refs #351` のみ使用 / `Closes #351` 禁止） |
| 親タスク | 09c-serial-production-deploy-and-post-release-verification（CLOSED） |
| 起票元 unassigned | `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md` |
| destructiveOperation | false |

## 実装区分

`[実装区分: 実装仕様書]`

本タスクは **コード/設定変更を伴う実装仕様書**である。Issue #351 はラベル上「operations」で「workflow を仕様化する」と書かれているが、目的（24h post-release metrics を毎リリース後に手動収集している運用を GitHub Actions schedule / manual workflow で自動収集し artifact 化する）の達成には次の実体的変更が必須であり、CONST_004 に従い実装仕様書として作成する:

- `.github/workflows/post-release-dashboard.yml` の新規追加（`schedule` + `workflow_dispatch`）
- `scripts/post-release-dashboard/collect.sh`（collector ラッパー）と `scripts/post-release-dashboard/lib/*.sh`（Cloudflare GraphQL Analytics / D1 reads・writes / cron status / Workers req・error 取得）の新規追加
- read-only Cloudflare API token を保管する新規 secret `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`（既存 `CLOUDFLARE_API_TOKEN` とは scope を分離）
- artifact path 規約 `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` の固定
- `aiworkflow-requirements` skill references の `deployment-gha.md` / `deployment-cloudflare-opennext-workers.md` への post-release dashboard 章追記

ユーザー指定が「workflow を仕様化する」だったとしても、目的（取り忘れ・属人化防止 / 比較可能な証跡の自動取得）はコード/設定変更なしでは達成不可能。したがって本仕様書は CONST_005 必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト・実行コマンド・DoD）をすべて充足する形で作成する。

2026-05-05 のレビュー改善サイクルで、実態優先（docs-only / spec-only ラベルより目的達成を優先）の原則に従い、`.github/workflows/post-release-dashboard.yml` と `scripts/post-release-dashboard/` のローカル実装を追加した。コミット・push・PR 作成・実 `workflow_dispatch` / schedule 実行はユーザー承認まで行わない。

## purpose

09c post-release verification の 24h metrics 収集を **手動運用から GitHub Actions による自動取得 + artifact 保存に置き換える**。具体的には次を満たすこと:

1. production release 後の Workers requests / D1 reads / D1 writes / cron status / Workers error rate を **read-only Cloudflare API token** で取得する shell collector を整備する
2. GitHub Actions の `schedule`（1 日 1 回 UTC 00:00）と `workflow_dispatch`（手動 trigger）で起動する workflow を整備する
3. dashboard artifact path を `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` に固定し、09c の 24h threshold（`< 5k req/day` / `<= 50k D1 reads/day` / `<= 10k D1 writes/day`）と指標名を揃える
4. token scope を `Account.Account Analytics:Read` + `Workers Scripts:Read` + `D1:Read` の read-only に限定し、production deploy 用 `CLOUDFLARE_API_TOKEN` とは別 secret に分離する
5. dry-run 1 回で artifact が期待スキーマで生成されることを確認する手順を仕様化する

## scope in / out

### Scope In

- `.github/workflows/post-release-dashboard.yml` の input 定義 / schedule / job step / artifact upload 設計
- `scripts/post-release-dashboard/collect.sh` と `lib/cf-graphql.sh` / `lib/d1-metrics.sh` / `lib/cron-status.sh` / `lib/format-dashboard.sh` の関数シグネチャと入出力
- artifact JSON schema（`metric_id` / `value` / `unit` / `threshold` / `judgment` / `source_endpoint` / `collected_at_utc`）と Markdown 表形式
- read-only Cloudflare API token secret 名 / scope / GitHub Variables 配置
- redaction grep gate（`rg -i "(token|bearer|secret|CLOUDFLARE_API_TOKEN|Authorization)" outputs/post-release-dashboard/`）
- 09c Phase 11 の手動 metrics 名 / threshold との naming 一致確認
- `aiworkflow-requirements` skill references への post-release dashboard 章追記 diff 計画
- 1 dry-run 実行手順と artifact 検証コマンド

### Scope Out

- production deploy / route cutover の実行（09c 親仕様で完了）
- 有料監視基盤（Datadog / Grafana Cloud / Sentry monitors 等）の導入
- 24h 経過後の人間レビュー / 障害判定の自動化（artifact は集計・保存のみ。判定は人手）
- Logpush / Workers Analytics Engine の有効化（別 wave）
- 本仕様書サイクル内での実 schedule 起動 / production analytics への real call / commit / push / PR

## dependencies

### Depends On

- 親仕様（CLOSED）: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/`
- 起票元 unassigned: `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md`
- `bash scripts/cf.sh` ラッパーが稼働していること（`scripts/cf.sh whoami` / `api-get` 補助を活用）
- 1Password vault に新規 read-only token を保管する Item slot が確保できること

### Blocks

- 09c の 24h post-release verification 運用の属人化解消
- 1 week / 1 month / periodic フォローアップ観測（`post-release-summary.md` 表参照）の前提となる継続データ収集

## 苦戦箇所 / Lessons Learned

- **L-09c-EV-001 由来**: 09c Phase 11 の `post-release-summary.md` は手動証跡として設計されており、Workers requests / D1 reads / D1 writes が `TBD at execution` のままで、人間が release 後に dashboard を開いて転記する運用になっていた。
- **L-CF-TOKEN-002 由来**: `CLOUDFLARE_API_TOKEN`（既存）は production deploy 用に `Workers Scripts:Edit` 等の write scope を含む。analytics 用には別 token に分離しないと free-tier 圏外の事故リスクが残る。
- **L-FREE-TIER-003 由来**: schedule を高頻度（毎時など）で回すと Workers free-tier の `100,000 requests/day` を analytics 取得自体で消費する懸念がある。1 日 1 回固定とする。
- **再発防止**: artifact 出力先に token / Bearer / Authorization が混入しないよう `redaction-check.md` を Phase 11 evidence の必須要素にする。

## phase 一覧

| Phase | Title | File |
| --- | --- | --- |
| 01 | 要件定義 | [phase-01.md](phase-01.md) |
| 02 | 設計（workflow / collector / artifact schema / token scope） | [phase-02.md](phase-02.md) |
| 03 | 設計レビュー | [phase-03.md](phase-03.md) |
| 04 | テスト戦略 | [phase-04.md](phase-04.md) |
| 05 | 実装ランブック | [phase-05.md](phase-05.md) |
| 06 | 異常系検証 | [phase-06.md](phase-06.md) |
| 07 | AC マトリクス | [phase-07.md](phase-07.md) |
| 08 | DRY 化 | [phase-08.md](phase-08.md) |
| 09 | 品質保証 | [phase-09.md](phase-09.md) |
| 10 | 最終レビュー | [phase-10.md](phase-10.md) |
| 11 | dry-run 実行 + dashboard evidence 取得 | [phase-11.md](phase-11.md) |
| 12 | ドキュメント更新（aiworkflow-requirements 反映 / unassigned 検出 / skill feedback） | [phase-12.md](phase-12.md) |
| 13 | PR 作成 | [phase-13.md](phase-13.md) |

## acceptance criteria（AC サマリ）

| ID | 内容 | 検証手段 |
| --- | --- | --- |
| AC-1 | `.github/workflows/post-release-dashboard.yml` が `schedule`（`0 0 * * *` UTC）と `workflow_dispatch` で起動可能 | `gh workflow list` / `yamllint` / `actionlint` |
| AC-2 | Cloudflare API token は `secrets.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` を参照し、既存 `secrets.CLOUDFLARE_API_TOKEN` を**参照していない** | 正参照: `rg -c "secrets\\.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY" .github/workflows/post-release-dashboard.yml` / 負参照: `! rg "secrets\\.CLOUDFLARE_API_TOKEN(\\W|$)" .github/workflows/post-release-dashboard.yml` |
| AC-3 | dashboard artifact path が `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` に固定されている | `actions/upload-artifact` の `path:` 値 grep |
| AC-4 | metric 名と threshold が 09c `post-release-summary.md` と一致（`Workers requests / D1 reads / D1 writes`） | naming-mapping table（phase-07）が両仕様参照を引用 |
| AC-5 | dry-run の artifact から token / Bearer / Authorization が grep で 0 件である | `rg -i "(token\|bearer\|authorization)" outputs/post-release-dashboard/` |
| AC-6 | `aiworkflow-requirements/references/deployment-gha.md` に post-release dashboard 章が追記される（diff 計画が phase-12 に記述される） | phase-12 の Step 1-A diff plan |
| AC-7 | schedule 頻度が 1 日 1 回以下に固定されている | `cron:` 値の string match |
| AC-8 | Phase 11 dry-run evidence に `dashboard.json` 構造（`metrics[].metric_id` 等）が schema-conformant であることが記録されている | phase-11 evidence schema check |

## directory structure

```
docs/30-workflows/issue-351-09c-post-release-dashboard-automation/
├── index.md                  # 本ファイル
├── artifacts.json            # phases メタ
├── phase-01.md ... phase-13.md
└── outputs/
    ├── phase-01/  ...  phase-13/   # phase ごとの実体成果物（仕様書サイクルでは template / 計画のみ）
```

実装フェーズで生成される artifact は以下の path 規約に従う（仕様書サイクルでは作成しない）:

```
outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/
├── dashboard.json            # collector 出力（schema は phase-02）
├── dashboard.md              # 人間可読の Markdown 表
└── redaction-check.md        # token grep 結果（0 件であることを記録）
```
