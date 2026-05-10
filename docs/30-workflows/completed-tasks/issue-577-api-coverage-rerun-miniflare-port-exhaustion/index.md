# タスク仕様書: Issue #577 — `@ubm-hyogo/api` full coverage rerun & Miniflare port exhaustion triage

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-issue-577-api-full-coverage-rerun-miniflare-port-exhaustion-001 |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/532（CLOSED 据え置き / 再オープン操作は本仕様書では行わない） |
| 本タスク Issue | https://github.com/daishiman/UBM-Hyogo/issues/577（CLOSED: 2026-05-08T21:36:04Z・本タスクで state 変更は行わない） |
| GitHub Issue labels current | `priority:medium`, `type:improvement`, `unassigned`, `scale:small`, `status:unassigned`, `area:testing`（2026-05-09 確認。Issue label mutation は本タスクでは実行しない） |
| 起票元 source | Issue #577 本文 + Issue #532 Phase 11 evidence の follow-up |
| 配置先 | `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/` |
| 作成日 | 2026-05-09 |
| artifacts | `artifacts.json` |
| 状態 | implemented_local_pending_pr |
| workflow_state | implemented_local_pending_pr |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| outputs artifacts parity | root `artifacts.json` と `outputs/artifacts.json` は同値。Phase 12 strict 7 は実測結果で上書き済み。 |
| 実装区分 | **[実装区分: 実装仕様書]** — baseline rerun 3 回で `EADDRNOTAVAIL` が再現したため、軸 B（`--maxWorkers=1 --minWorkers=1`）を採用し、`apps/api/package.json` の `test:coverage` script を最小差分で更新済み。 |
| 親 Issue 状態維持 | **CLOSED のまま据え置き**。本仕様書 Phase 9 で Issue #532 の Phase 11 / Phase 12 outputs に evidence を追記するが、Issue 本体の reopen / close 操作は行わない。 |
| 本タスク Issue 状態維持 | Issue #577 は GitHub 上で CLOSED 済み。本サイクルでは state 変更を行わず、Phase 13 で PR base=dev に対して implementation PR を作成するのみ。 |
| 優先度 | 中（`priority:medium`） |
| 規模 | 小（`scale:small`） |
| ラベル | `priority:medium`, `type:improvement`, `scale:small`, `area:testing` |
| 想定 PR 数 | 1（仕様書 + 必要時 vitest config / helper script + Issue #532 evidence sync） |
| coverage AC | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` が PASS、または EADDRNOTAVAIL 再発時の再現条件と暫定回避策を `outputs/phase-11/evidence/full-coverage-rerun.log` と `outputs/phase-11/evidence/triage-summary.md` に固定し、Issue #532 Phase 11 evidence へ same-wave sync 済み |

## GitHub label / tag（Claude Code / Codex 共有用）

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `Refs: #577` を PR 本文必須。親 `Refs: #532` も併記 |
| GitHub Issue labels（継承） | `priority:medium`, `type:improvement`, `scale:small`, `area:testing` |
| PR に付与する labels | `priority:medium`, `type:improvement`, `scale:small`, `area:testing` |
| `gh pr create` 引数 | `--label priority:medium --label type:improvement --label scale:small --label area:testing` |
| ブランチ名 | `docs/issue-577-api-coverage-rerun-task-spec`（既存ブランチを継続利用。commit / push / PR は user gate 後） |
| PR タイトル | `fix(api): stabilize issue-577 full coverage rerun under miniflare` |
| 親タスク参照 | Issue #532 完了タスク（`docs/30-workflows/completed-tasks/` 配下に Issue #532 ワークフローが存在する場合の Phase 11 / 12 evidence 追記先） |
| PR base | `dev`（CLAUDE.md「既定 PR base は dev」整合） |

## 目的

Issue #532 で発生した `@ubm-hyogo/api` full coverage 実行時の Miniflare/undici `EADDRNOTAVAIL` port exhaustion を、本サイクルで以下のいずれかの確定状態に持っていく:

1. **再実行で PASS**: 同一 host / 同一 Node 24 / 同一 vitest 設定で `pnpm --filter @ubm-hyogo/api test:coverage` を実行し、green に戻ることを evidence として固定する。
2. **再発時の triage 確定**: 再現条件（並列度 / Miniflare instance 数 / D1 binding 数）、root cause hypothesis（undici socket pool / ephemeral port range / TIME_WAIT 蓄積）、暫定回避策（`--maxWorkers` / `--minWorkers` 制限、`pool=forks`、test shard 分割、D1 test grouping）を確定し、Issue #532 Phase 11 evidence の follow-up として固定する。

いずれの確定状態でも、evidence は `outputs/phase-11/evidence/` に canonical path で保存し、Issue #532 のワークフロー Phase 11/12 へ same-wave sync する。

## スコープ

### 含む

- `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` の rerun（最低 3 回）と log 保存
- EADDRNOTAVAIL 再発時の triage（並列度・pool・shard・D1 grouping の各軸で 1 因子ずつ切り分け）
- 暫定回避策候補の検証（vitest `--maxWorkers` / `--minWorkers` / `pool=forks` / `--shard` / `--no-file-parallelism`）
- `outputs/phase-11/evidence/` への evidence log 保存
- Issue #532 Phase 11 / Phase 12 outputs への same-wave sync（追記のみ）
- triage 結果を採用する場合の最小差分 patch（原則 `scripts/api-coverage-rerun.sh` 単独。恒久採用が必要な場合のみ `vitest.config.ts` / `apps/api/package.json`）

### 含まない

- Issue #532 の provider 実装変更（D1 provider / R2 provider / KV provider のロジック変更は別 Issue 責務）
- D1 schema 変更（migration 追加・列追加・index 追加は別 Issue）
- production deploy（本タスクはローカルのみ。`scripts/cf.sh deploy` は呼ばない）
- coverage 閾値変更（`coverage.thresholds` の引き下げ / 引き上げはスコープ外。閾値起因 fail が出た場合は Issue を別建て）
- commit / push / PR 作成（Phase 13 で user approval gate 後にのみ実施）

> **CONST_007 整合**: 上記「含まない」は「provider ロジック / schema / production deploy / 閾値」と本タスクの目的（rerun PASS or triage 固定）が独立スコープであることに基づく。「分量が多い」「念のため切り出す」は理由に採用していない。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #532（CLOSED） | `@ubm-hyogo/api` full coverage の Phase 11 evidence にて EADDRNOTAVAIL を起票元として参照 |
| 上流 | Node 24.15.0 / pnpm 10.33.2（mise 固定） | rerun 環境の同一性確保 |
| 上流 | `vitest` / `@vitest/coverage-v8` / `miniflare` / `undici` の現行バージョン | port exhaustion 再現要因の hash として固定 |
| 上流 | `apps/api/package.json` の `test:coverage` script | rerun コマンドの正本 |
| 上流 | `vitest.config.ts`（root） | pool / poolOptions / coverage 設定の正本 |
| 下流 | `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/` | Issue #532 ワークフロー Phase 11 / Phase 12 evidence 追記先 |
| 下流 | `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` | 本 workflow へ consumed trace を追記する元未タスク |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| Node 24 / pnpm 10 が使用可能 | `mise exec -- node -v && mise exec -- pnpm -v` |
| Issue #577 が CLOSED である | `gh issue view 577 --json state,closedAt -q '{state,closedAt}'` |
| Issue #532 のワークフローディレクトリが特定可能 | `test -d docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers` |
| `apps/api/package.json` の `test:coverage` script が存在 | `jq -r '.scripts["test:coverage"]' apps/api/package.json` |
| root `vitest.config.ts` が存在 | `test -f vitest.config.ts` |
| ローカル ephemeral port 状況確認可能 | `sysctl net.inet.ip.portrange.first net.inet.ip.portrange.last`（macOS） |

## 想定変更ファイル（実装が発生する場合のみ・docs-only 確定時は新規 patch なし）

| パス | 種別 | 役割 |
| --- | --- | --- |
| `vitest.config.ts` | 編集（条件付） | 恒久採用が必要な場合のみ、既存 `test` object を保持したまま `pool` / worker 上限を merge |
| `scripts/api-coverage-rerun.sh` | 新規（条件付） | rerun helper（`mise exec --` ラップ + log redirect + triage matrix 実行） |
| `apps/api/package.json` | 編集（条件付） | `test:coverage` script に `--pool=forks` 等の flag を追加する場合のみ |
| `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/main.md` | 追記のみ | `full-coverage-rerun.log` / `triage-summary.md` への参照を follow-up evidence として same-wave sync |
| `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-12/{documentation-changelog.md,implementation-guide.md}` | 追記のみ | follow-up entry / rerun 手順 / triage 採用結果を追加 |
| `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` | 追記のみ | `consumed_by: issue-577-api-coverage-rerun-miniflare-port-exhaustion` trace |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / GO 判定 / triage 判断フレームワーク（しきい値・evidence 種別・no-code verification 条件） | completed |
| [2](phase-02.md) | evidence 取得設計 / canonical path（`outputs/phase-11/evidence/*`）/ log フォーマット | completed |
| [3](phase-03.md) | vitest 並列度制御 / pool / shard 設計（matrix 軸の 1 因子切り分け方針） | completed |
| [4](phase-04.md) | 統合テスト設計（rerun 手順 / triage 再実行手順 / matrix シナリオ） | completed |
| [5](phase-05.md) | （該当時）`vitest.config.ts` patch 実装スケルトン | completed |
| [6](phase-06.md) | （該当時）`scripts/api-coverage-rerun.sh` ヘルパスクリプト実装 | completed |
| [7](phase-07.md) | workflow 層: rerun → triage → grouping の自動化スクリプト連携 | completed |
| [8](phase-08.md) | runbook / Phase 11 evidence manifest / 30day-contract / 失敗率 gate | completed |
| [9](phase-09.md) | SSOT 反映: Issue #532 完了タスク Phase 11 / 12 への evidence 追記 | completed |
| [10](phase-10.md) | 単体テスト（rerun スクリプト自体の smoke test） | completed |
| [11](phase-11.md) | runtime evidence 取得（rerun 実行・log 保存・triage 実施） | completed |
| [12](phase-12.md) | implementation-guide / 採用判断記録 / unassigned 検出 / skill feedback / compliance（strict 7） | completed |
| [13](phase-13.md) | commit / push / PR 作成（user gate） | blocked_pending_user_approval |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/main.md` |
| 3 | `outputs/phase-03/main.md` |
| 4 | `outputs/phase-04/main.md` |
| 5 | `outputs/phase-05/main.md` |
| 6 | `outputs/phase-06/main.md` |
| 7 | `outputs/phase-07/main.md` |
| 8 | `outputs/phase-08/main.md` |
| 9 | `outputs/phase-09/main.md` |
| 10 | `outputs/phase-10/main.md` |
| 11 | `outputs/phase-11/main.md` + `outputs/phase-11/evidence/full-coverage-rerun.log` + `outputs/phase-11/evidence/triage-summary.md` |
| 12 | `outputs/phase-12/main.md` + strict 7 outputs |
| 13 | `outputs/phase-13/phase-13.md` |

## 完了条件（DoD: workflow spec close-out）

- [x] Phase 1〜13 の実装仕様書 13 本が root に揃っている。
- [x] root `artifacts.json` と `outputs/artifacts.json` に `taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=implemented_local_pending_pr` / `claudeCodeContext` が同値で記録されている。
- [x] Phase 12 strict 7 outputs は実測結果で上書き済み。
- [x] aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / LOGS に implemented-local / runtime completed 登録済み。
- [x] CLAUDE.md「既定 PR base は dev」整合の branch / PR 設定が `claudeCodeContext` に記録されている。
- [x] Phase 13 の commit / push / PR / runtime mutation は user approval gate 後に限定している。

## 完了条件（DoD: implementation wave）

- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` は baseline rerun 3 回で EADDRNOTAVAIL を再現し、triage matrix 軸 B 採用後に PASS（133/133、0 EADDRNOTAVAIL）。
- [x] `outputs/phase-11/evidence/full-coverage-rerun.log` と `outputs/phase-11/evidence/triage-summary.md` が canonical path で保存されている。
- [x] Issue #532 のワークフロー Phase 11 / Phase 12 outputs に follow-up entry が same-wave sync されている。
- [x] triage 結果として `apps/api/package.json` の `test:coverage` script に `--maxWorkers=1 --minWorkers=1` を追加済み。`scripts/api-coverage-rerun.sh` / `vitest.config.ts` / `scripts/coverage-guard.sh` は編集しない。
- [ ] PR に `priority:medium` / `type:improvement` / `scale:small` / `area:testing` label が付与され、本文に `Refs: #577` と `Refs: #532` を含む。

## 参照情報

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/532（CLOSED）
- 本タスク Issue: https://github.com/daishiman/UBM-Hyogo/issues/577（CLOSED: 2026-05-08T21:36:04Z）
- vitest pool docs: https://vitest.dev/config/#pool
- Miniflare docs: https://miniflare.dev/
- undici socket pool: https://github.com/nodejs/undici
- Node ephemeral port range（macOS / Linux）: `sysctl net.inet.ip.portrange.*` / `/proc/sys/net/ipv4/ip_local_port_range`
- CLAUDE.md（PR base=dev / mise exec ルール）: `/CLAUDE.md`
