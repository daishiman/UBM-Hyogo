# Phase 11: 実行 evidence（NON_VISUAL / 2 段 evidence: local 5 点 + 7 日完走 4 点）

## 目的

`visualEvidence: NON_VISUAL` のため screenshot は生成しない（false green 防止）。本サイクルでは workflow YAML 改修 + SSOT 同期 + 7day summary workflow 新規追加に対する **local 5 点 evidence**（typecheck / lint / focused test / build / grep-gate）を取得し、production hourly run 168 件分の evidence は **D+7 close-out コミットで 4 ファイル追加** する 2 段構成とする。

## 前 Phase 依存

- `phase-01.md`: 要件定義 / 4 Gate / 4 観測軸
- `phase-02.md`: 既存実装調査
- `phase-03.md`: 設計
- `phase-05.md`: I/O 契約
- `phase-06.md`: 実装手順
- `phase-09.md`: observability
- `phase-10.md`: DoD

## 発火条件（機械判定）

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/issue-586-post-switch-7day-close-out/artifacts.json
# => NON_VISUAL なので、screenshot は生成しない
```

## 必須 outputs（NON_VISUAL）

| ファイル | 役割 | 最小フォーマット |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL / local script + production hourly run）/ 必須 outputs 一覧 / canonical evidence path 予約 / 状態語彙 / AC 対応表 |
| `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / forward-safe rollback 確認の実行記録 | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| `outputs/phase-11/link-checklist.md` | 仕様書 → 親タスク #549 / SSOT / aiworkflow-requirements / 実装ファイル参照のリンクチェック | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |

> screenshot は `NON_VISUAL` のため生成禁止。VISUAL 用 outputs（`manual-test-checklist.md` 等）は本ワークフローでは作らない。

## 状態語彙

| state | 意味 | 本サイクルでの扱い |
| --- | --- | --- |
| `spec_created` | 仕様書作成済み（実装未着手） | 本サイクル PR open 直前まで |
| `implemented_local_runtime_pending` | local 5 点 evidence 取得済み・production runtime 未到達 | 本サイクル PR merge 直前 |
| `pass_boundary_synced_runtime_pending` | workflow YAML merge 済 + 7day summary YAML merge 済 + 168h 蓄積中 | D+0〜D+6 |
| `pass_runtime_synced` | 168 hourly snapshots 完備 + leakage 7 日連続 clean + fallback rate ≤ 5% + Issue 起票数 baseline 比較 OK | D+7 close-out 時に昇格 |

`PASS` 単独表記は禁止。boundary suffix（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 等）を必ず付ける。

## canonical evidence path

### 本サイクル merge 時（local 5 点）

| # | evidence | 取得コマンド | 保存先 |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm typecheck \| tee outputs/phase-11/evidence/typecheck.log` | `outputs/phase-11/evidence/typecheck.log` |
| 2 | lint | `mise exec -- pnpm lint \| tee outputs/phase-11/evidence/lint.log` | `outputs/phase-11/evidence/lint.log` |
| 3 | focused vitest | `mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__ scripts/cf-audit-log/__tests__/evaluation.test.ts --reporter=verbose \| tee outputs/phase-11/evidence/test.log` | `outputs/phase-11/evidence/test.log` |
| 4 | build | `mise exec -- pnpm build \| tee outputs/phase-11/evidence/build.log` | `outputs/phase-11/evidence/build.log` |
| 5 | secret leakage grep gate clean | `mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts outputs/phase-11/evidence/ --exit-on-detect; echo $?` → `0` | `outputs/phase-11/evidence/grep-gate.log` |

### D+7 close-out コミット時（7 日 hourly observation 4 点）

| 取得対象 | 取得タイミング | 保存先 |
| --- | --- | --- |
| 7 日分の hourly run URL（GitHub Actions）+ 集計サマリ | 7day summary workflow が起票する evidence PR 内 | `outputs/phase-11/evidence/hourly-run-7day.md` |
| 168 hourly snapshots aggregation 出力 | 同上 | `outputs/phase-11/evidence/hourly-run-7day-summary.json` |
| 168 hour leakage grep 集約（7 日連続 clean 確認） | 同上 | `outputs/phase-11/evidence/leakage-grep-7day.log` |
| Issue 起票数 baseline 比較（threshold 期 vs ml 期） | 同上 | `outputs/phase-11/evidence/issue-rate-comparison.md` |

### Daily check（D+1 / D+3 / D+5・任意）

| 取得対象 | 保存先 |
| --- | --- |
| 24h / 72h / 120h 時点の hourly run 一覧 + leakage 0 件確認 | `outputs/phase-11/evidence/hourly-run-daily-check.md`（任意・運用補助）|

## AC ↔ evidence 対応表

| AC | 評価 evidence | 取得サイクル |
| --- | --- | --- |
| AC-1（`vars.CF_AUDIT_CLASSIFIER=ml`） | `outputs/phase-11/evidence/gh-variable-list.log`（実値マスク） | 本サイクル |
| AC-2（artifact upload retention-days: 8） | workflow YAML diff + hourly run 1 回目の artifact 確認 | 本サイクル D+0 |
| AC-3（leakage grep `--exit-on-detect`） | `evidence/test.log` + `evidence/grep-gate.log` | 本サイクル |
| AC-4（fallback alert `--threshold 0.05 --consecutive-hours 3`） | `evidence/test.log`（focused test） | 本サイクル |
| AC-5（7day summary workflow） | YAML diff + workflow_dispatch dry-run の run URL | 本サイクル D+0 |
| AC-6（`expectedSnapshots: 168` 件数検証） | `evidence/test.log` の aggregation focused test | 本サイクル |
| AC-7（leakage 7 日連続 clean） | `evidence/leakage-grep-7day.log` | D+7 |
| AC-8（Issue 起票数 baseline 比較） | `evidence/issue-rate-comparison.md` | D+7 |
| AC-9（SSOT 4 ファイル更新） | spec walkthrough（`manual-smoke-log.md`） | 本サイクル + D+7 |
| AC-10（Phase 12 strict 7 outputs） | `outputs/phase-12/` ls 確認 | 本サイクル |
| AC-11（PR `Refs #549, Refs #586`） | PR body 確認 | Phase 13 |
| AC-12（focused vitest pass） | `evidence/test.log` | 本サイクル |
| AC-13（typecheck / lint） | `evidence/typecheck.log` / `lint.log` | 本サイクル |
| AC-14（local 5 点） | 5 ファイル揃い | 本サイクル |
| AC-15（D+7 close-out 4 ファイル） | 4 ファイル追加 | D+7 |

## secret leakage grep gate（NON_VISUAL 必須）

evidence ファイル / log には以下の生値を含めない（grep gate で検出時 fail）:

- Cloudflare API Token / OAuth token
- IP アドレス（v4 / v6）
- User-Agent 文字列
- `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` の解決値
- `gh variable list` 出力の生値（マスク表示で記録）

確認コマンド: `mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts outputs/phase-11/evidence/ --exit-on-detect`

## OIDC / deploy auth migration NON_VISUAL evidence matrix（参考）

| Axis | 本タスクでの記載 |
| --- | --- |
| provider | GitHub Actions（hourly + 7day summary） |
| workflow inventory | `.github/workflows/cf-audit-log-monitor.yml`（編集）+ `.github/workflows/cf-audit-log-7day-summary.yml`（新規） |
| evidence count | 本サイクル 5 点 + D+7 4 点 = 計 9 点 + daily check 任意 |
| G1-G4 | G1 = local 5 点 / G2 = workflow YAML PR merge / G3 = 7day evidence PR merge / G4 = SSOT `pass_runtime_synced` 反映 PR merge |
| runtime boundary | 本サイクルでは `pass_boundary_synced_runtime_pending` まで。`pass_runtime_synced` は D+7 close-out 時 |

## 完了条件

- [ ] `outputs/phase-11/main.md` を `pass_boundary_synced_runtime_pending`（merge 直後）/ `implemented_local_runtime_pending`（merge 前）状態で配置
- [ ] `outputs/phase-11/manual-smoke-log.md` で spec walkthrough を実行記録
- [ ] `outputs/phase-11/link-checklist.md` で 親タスク #549 の `outputs/phase-12/implementation-guide.md` / SSOT 4 ファイル / aiworkflow-requirements references / `.github/workflows/cf-audit-log-monitor.yml` 参照が OK
- [ ] local 5 点 evidence（typecheck / lint / test / build / grep-gate）が `outputs/phase-11/evidence/` に揃う
- [ ] PASS 単独表記が `outputs/phase-11/` 内に存在しない（boundary suffix 必須を grep で確認）
- [ ] D+7 close-out で 4 ファイル追加 + SSOT 4 ファイルの `pass_runtime_synced` 反映 PR を起票

## 出力

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log`
- D+7: `outputs/phase-11/evidence/{hourly-run-7day.md,hourly-run-7day-summary.json,leakage-grep-7day.log,issue-rate-comparison.md}`

## Handoff（→ Phase 12）

- 本サイクル workflow_state を `pass_boundary_synced_runtime_pending` に昇格（merge 後）
- D+7 完走で `pass_runtime_synced` に最終昇格 + legacy stub 注記撤去
- Phase 12 entry checklist へ: placeholder token grep 0 件 / `§99` 必須項目 content check / dirty-code gate を引き継ぐ

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending（merge 前）→ pass_boundary_synced_runtime_pending（merge 後）→ pass_runtime_synced（D+7） |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 11-1 | NON_VISUAL 3 file（main / manual-smoke-log / link-checklist）を実体配置 |
| 11-2 | local 5 点 evidence を `outputs/phase-11/evidence/` に取得 |
| 11-3 | D+7 close-out で 4 evidence ファイルを追加し SSOT を `pass_runtime_synced` に反映 |

## 参照資料

- `index.md`
- `phase-01.md`〜`phase-10.md`
- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md`
