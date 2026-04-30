# Phase 11 Link Checklist — 内部リンク・参照パス到達性

> 採取日時 (UTC): 2026-04-29T07:10:11Z
> 対象: Phase 1〜10 outputs / phase-XX.md / index.md / artifacts.json で参照されている内部リンク・ファイルパス
> 検査方法: ファイルシステム上の `test -f` / `test -d` 相当（path 存在確認）。HTTP リンクは GitHub Issue #94（CLOSED でも 200 OK）のみ対象。
> NON_VISUAL のため screenshot は対象外。

---

## §A. 5 同期チェック対象文書（index.md §正本語彙 / 同期チェック対象）

| # | 参照記述（仕様書側のパス） | 実体パス | 存在 | 備考 |
| --- | --- | --- | --- | --- |
| A-1 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | （該当 path に index.md なし） | **MISS** | 03a ディレクトリ自体が現リポジトリに未配置。legacy umbrella / 03b 経由で間接参照されている。Phase 12 で「03a 直接 path 参照を legacy umbrella 経由参照へ補正する」改善対象に登録 |
| A-2 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | 同左 | OK | 正本実在 |
| A-3 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 同左 | OK | admin endpoint 正本実在（`POST /admin/sync/schema` + `POST /admin/sync/responses`） |
| A-4 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | **MISS（path 揺れ）** | 実体は `02-application-implementation/` 配下に存在。仕様書側で root 直下を指している箇所あり → Phase 12 で path 表記を補正対象に登録 |
| A-5 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 同左 | OK | 撤回 or 採用の判定対象（旧 UT-09 root） |

> 表記揺れ（A-1 / A-4）は **本タスクで内容を書き換えない**（docs-only / 本タスクの編集スコープ外）。Phase 12 documentation-changelog で正本パス表記補正タスクとして blocker B-04（仕様修正）に追加。

## §B. aiworkflow-requirements references（Skill reference path）

| # | 参照 path | 存在 | 備考 |
| --- | --- | --- | --- |
| B-1 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | OK | `/admin/sync/responses` 正本登録 |
| B-2 | .claude/skills/aiworkflow-requirements/references/database-schema.md | OK | `sync_jobs` 正本登録 |
| B-3 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | OK | Secret hygiene 正本 |
| B-4 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | OK | Forms 系 Secret 正本登録 |
| B-5 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | OK | Cloudflare 注入経路 |

## §C. 原典 unassigned-task / current 方針正本（index.md §関連リンク）

| # | 参照 path | 存在 | 備考 |
| --- | --- | --- | --- |
| C-1 | docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md | OK | 原典 unassigned-task spec |
| C-2 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | OK | current 方針正本 |

## §D. governance / CI 系参照

| # | 参照 path | 存在 | 備考 |
| --- | --- | --- | --- |
| D-1 | .github/workflows/verify-indexes.yml | OK | verify-indexes job 定義 |
| D-2 | CLAUDE.md | OK | 不変条件 #1/#4/#5/#6 / scripts/cf.sh 運用 |

## §E. Phase outputs 内部相対参照（`../../phase-XX.md` / `../phase-XX.md` 等）

| # | 参照元 | 参照先 | 存在 | 備考 |
| --- | --- | --- | --- | --- |
| E-1 | outputs/phase-{01..13}/*.md | `../../phase-XX.md` | OK | 全 phase-XX.md 実在 |
| E-2 | outputs/phase-09/main.md | `./contract-sync-check.md` | OK | 同 directory 内 |
| E-3 | outputs/phase-02/* | `./reconciliation-design.md` / `./option-comparison.md` | OK | 同 directory 内 |
| E-4 | outputs/phase-04/* | `./test-strategy.md` / `./scan-checklist.md` | OK | 同 directory 内 |
| E-5 | outputs/phase-11/main.md | `./manual-smoke-log.md` / `./link-checklist.md` | OK | 本 Phase 出力 |
| E-6 | index.md | `./phase-{01..13}.md` | OK | 13 ファイル実在（artifacts.json と一致） |
| E-7 | index.md §関連リンク | `../README.md` | OK | docs/30-workflows/README.md 実在 |
| E-8 | index.md §関連リンク | `../_templates/phase-template-app.md` | OK | docs/30-workflows/_templates/phase-template-app.md 実在 |
| E-9 | index.md §関連リンク | `../unassigned-task/task-ut09-direction-reconciliation-001.md` | OK | C-1 と同一 |
| E-10 | index.md §関連リンク | `../unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | OK | C-2 と同一 |
| E-11 | index.md §関連リンク | `../ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md` | OK | 並列タスク実在 |
| E-12 | index.md §関連リンク | `../ut-09-sheets-to-d1-cron-sync-job/index.md` | OK | A-5 と同一 |

## §F. 外部リンク（GitHub Issue）

| # | URL | 期待 | 結果 | 備考 |
| --- | --- | --- | --- | --- |
| F-1 | https://github.com/daishiman/UBM-Hyogo/issues/94 | CLOSED でも 200 OK | 仕様書上の表記確認済（実 HTTP は本タスクで叩かない） | NON_VISUAL / docs-only 境界。HTTP 叩きは UT-26 / B-06 で実施可能 |

---

## §G. 集計

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| OK（path 実在） | 25 | A-2 / A-3 / A-5 / B-1〜B-5 / C-1 / C-2 / D-1 / D-2 / E-1〜E-12 |
| MISS / 表記揺れ | 2 | A-1（03a ディレクトリ未配置）/ A-4（09b は `02-application-implementation/` 配下に実在 → root 直下表記の補正必要） |
| 外部リンク | 1 | F-1（実 HTTP 叩きは別タスク） |

## §H. 補正方針（Phase 12 引き継ぎ）

| 項目 | 補正内容 | 委譲先 |
| --- | --- | --- |
| A-1 | 03a 直接参照を legacy umbrella 経由 / 03b 経由参照へ書き換え、または 03a directory の正本配置タスクを追加 | Phase 12 documentation-changelog → blocker B-04 |
| A-4 | `docs/30-workflows/09b-...` 表記を `docs/30-workflows/02-application-implementation/09b-...` へ統一 | Phase 12 documentation-changelog → blocker B-04 |
| F-1 | Issue #94 が CLOSED 維持で 200 OK であることの実 HTTP 確認 | UT-26 staging-deploy-smoke / B-06 |

> 本 link-checklist は **dead link 0** とは厳密には言えない（A-1 / A-4 の表記揺れあり）が、いずれも実体は legacy umbrella / `02-application-implementation/` 配下に存在し、reconciliation 結論（採用 = 案 a）への影響はない。Phase 12 で正本記述を補正することを申し送り。

状態: spec_created
