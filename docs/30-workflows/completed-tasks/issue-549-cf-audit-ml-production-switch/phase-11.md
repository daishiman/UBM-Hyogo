# Phase 11: 実行 evidence（NON_VISUAL / implemented-local boundary）

## 目的

`visualEvidence: NON_VISUAL` のため screenshot は生成しない（false green 防止）。本サイクルでは observation scripts / fallback alert / leakage grep CLI を local 実装し、focused test と skeleton dry-run evidence を取得する。production env switch、model artifact 配布、hourly workflow post-step 組み込み、7 日観測は Gate 後の実装サイクルまで未実行として分離する。

## 前 Phase 依存

- `phase-01.md`: 要件定義 / Gate-A〜D / 苦戦箇所
- `phase-02.md`: 既存実装調査（Issue #515 成果物 / workflow / runbook）
- `phase-03.md`: 設計（env 切替 / artifact 配布 / 7 日観測 / rollback）

## 発火条件（機械判定）

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/issue-549-cf-audit-ml-production-switch/artifacts.json
# => NON_VISUAL なので、screenshot は生成しない
```

## 必須 outputs（implemented-local / NON_VISUAL）

| ファイル | 役割 | 最小フォーマット |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL / local script evidence）/ 必須 outputs 一覧 / canonical evidence path 予約 / 状態語彙 |
| `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / forward-safe rollback 確認の実行記録 | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| `outputs/phase-11/link-checklist.md` | 仕様書 → 親タスク #515 / SSOT / aiworkflow-requirements / 実装ファイル参照のリンクチェック | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |

> screenshot は `NON_VISUAL` のため生成禁止。VISUAL 用 outputs（`manual-test-checklist.md` / `manual-test-result.md` / `discovered-issues.md` / `screenshot-plan.json`）は本ワークフローでは作らない。

## 状態語彙

| state | 意味 | 本サイクルでの扱い |
| --- | --- | --- |
| `spec_created` | 仕様書作成済み（実装未着手・runtime evidence 未取得） | 本サイクルでは採用しない。コード差分が存在するため false green 防止として昇格済み |
| `implemented_local_runtime_pending` | local code / focused test / leakage grep が pass、production runtime は pending | **本サイクル**で採用 |
| `pass_boundary_synced_runtime_pending` | staging artifact 配布完了 + 7 日観測サンプル取得済み + production env 切替 pending | Gate-A〜C 通過後の実装サイクルで採用 |
| `pass_runtime_synced` | production env `CF_AUDIT_CLASSIFIER=ml` 切替済 + 7 日 hourly run 全件取得 + leakage grep clean | 7 日観測完走後の close-out で採用 |

`PASS` 単独表記は禁止。boundary suffix（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 等）を必ず付ける。

## canonical evidence path（実装サイクルで取得する 5 点セット予約）

local 実装 evidence と Gate 後に取得する evidence は、以下の path に固定して配置する。global typecheck / lint は既存 `@sentry/*` dependency missing で exit 1 のため known-failure として記録し、Issue #549 由来エラー 0 件を確認する。

| # | evidence | 取得コマンド（実装サイクル） | 保存先 |
| --- | --- | --- | --- |
| 1 | typecheck known-failure boundary | `mise exec -- pnpm typecheck \| tee outputs/phase-11/evidence/typecheck.log` | `outputs/phase-11/evidence/typecheck.log` |
| 2 | lint known-failure boundary | `mise exec -- pnpm lint \| tee outputs/phase-11/evidence/lint.log` | `outputs/phase-11/evidence/lint.log` |
| 3 | focused vitest local pass | `mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__ scripts/cf-audit-log/__tests__/evaluation.test.ts --reporter=verbose \| tee outputs/phase-11/evidence/test.log` | `outputs/phase-11/evidence/test.log` |
| 4 | build pending | `mise exec -- pnpm build \| tee outputs/phase-11/evidence/build.log` | Gate 後 |
| 5 | secret leakage grep gate clean | `mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts outputs/phase-11/evidence/ --exit-on-detect; echo $?` → `0`（Token / IP / UA / API Key の生値 0 件） | `outputs/phase-11/evidence/grep-gate.log` |

### 7 日 hourly observation evidence（Phase 12 close-out 時に追記）

| 取得対象 | 取得タイミング | 保存先 |
| --- | --- | --- |
| 7 日分の hourly run URL（GitHub Actions） | production env 切替 merge 後 7 日 | `outputs/phase-11/evidence/hourly-run-7day.md`（run URL 一覧 + 各 hourly の `post-switch-monitor.ts` JSON 出力 path 参照） |
| fallback rate sample | hourly post-step | `outputs/phase-11/evidence/fallback-rate-7day.json` |
| p95 latency sample | hourly post-step | `outputs/phase-11/evidence/p95-latency-7day.json` |
| Issue 起票数 baseline 比較 | 7 日完走時 | `outputs/phase-11/evidence/issue-rate-comparison.md` |

## AC ↔ evidence 対応表（`outputs/phase-11/main.md` 必須セクション）

| AC | 評価 evidence | 取得サイクル |
| --- | --- | --- |
| AC-1（workflow env 切替 PR） | 該当 PR diff の URL（Phase 13 で取得） | 実装サイクル |
| AC-2（`bash scripts/cf.sh` ラップ） | grep で `wrangler ` 直接実行 0 件 | 実装サイクル `evidence/grep-gate.log` 内 |
| AC-3（observation JSON 必須 field） | focused test で field 検証 | `evidence/test.log` |
| AC-4（fallback rate alert） | focused test で 3 hour 連続超条件。workflow step 組み込みは Gate 後 | `evidence/test.log` |
| AC-5（leakage grep post-step） | CLI positive fixture / directory scan は local pass。hourly post-step 設定の workflow YAML 確認は Gate 後 | `evidence/grep-gate.log` |
| AC-6（rollback runbook 3 step） | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 該当節 | spec walkthrough（`manual-smoke-log.md`） |
| AC-7（D1 列 forward-safe） | staging migration list の前後 diff（破壊変更なし） | `evidence/migrations-staging.log`（実装サイクル） |
| AC-8（typecheck / lint / focused test） | focused test pass、global typecheck/lint は既存 Sentry missing known-failure | 本サイクル |
| AC-9（SSOT 3 ファイル更新） | spec walkthrough で参照リンク確認 | `link-checklist.md` |
| AC-10（dry-run 動作確認） | skeleton snapshot dry-run + Issue 0 件起票。実 ML artifact load は Gate 後 | `evidence/dry-run-ml.log` |
| AC-11（PR `Refs #549`） | PR body 確認 | Phase 13 |
| AC-12（未タスク formalize） | `outputs/phase-12/unassigned-task-detection.md` | Phase 12 |

## secret leakage grep gate（NON_VISUAL 必須）

evidence ファイル / log には以下の生値を含めない（grep gate で検出時 fail）:

- Cloudflare API Token / OAuth token
- IP アドレス（v4 / v6）
- User-Agent 文字列
- 任意の `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照の解決値
- model artifact の署名・URL signing 値

確認コマンド: `mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts outputs/phase-11/evidence/`

## OIDC / deploy auth migration NON_VISUAL evidence matrix（参考）

| Axis | 本タスクでの記載 |
| --- | --- |
| provider | GitHub Actions（hourly） + Cloudflare R2 / Workers AI（model artifact） |
| workflow inventory | `.github/workflows/cf-audit-log-monitor.yml`（既存）。新規 workflow 追加なし |
| evidence count | canonical 5 点（typecheck / lint / test / build / grep）+ 7 日 hourly observation |
| G1-G4 | G1 = workflow env PR merge 承認 / G2 = model artifact 配布完了 / G3 = post-switch 7 日 hourly run の途中状況 / G4 = 7 日完走後 close-out |
| runtime boundary | implemented-local サイクルでは workflow env merge / artifact 配布 / hourly observation の 3 つすべて未実行であることを明記 |

## 完了条件（本サイクル / implemented-local）

- [ ] `outputs/phase-11/main.md` を implemented-local 状態で配置（テスト方式 / 必須 outputs / canonical evidence path 予約 / 状態語彙 / AC 対応表を含む）
- [ ] `outputs/phase-11/manual-smoke-log.md` で spec walkthrough（index.md / phase-01〜13.md の参照リンクと forward-safe rollback の文書整合）を実行記録
- [ ] `outputs/phase-11/link-checklist.md` で 親タスク #515 の `outputs/phase-12/implementation-guide.md` / SSOT 3 ファイル / aiworkflow-requirements references / `.github/workflows/cf-audit-log-monitor.yml` への参照が OK
- [ ] local script runtime evidence（focused test / skeleton dry-run / grep gate）を取得し、production runtime evidence は Gate 後に取得する旨を明記する
- [ ] PASS 単独表記が `outputs/phase-11/` 内に存在しない（boundary suffix 必須を grep で確認）

## 出力

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## Handoff（→ Phase 12）

- 本サイクルでは workflow_state を `implemented-local` に昇格し、production runtime boundary は pending のまま据え置く。
- Gate 後の実装サイクル（feat ブランチ）に渡す Phase 11 contract: workflow YAML / model artifact / 7 日 hourly observation path を canonical 固定。
- secret leakage grep gate を hourly post-step に組み込む AC-5 / AC-10 の検証は、実装サイクルの Phase 11 で `evidence/grep-gate.log` として取得する。
- Phase 12 entry checklist へ: placeholder token grep 0 件 / `§99` 必須項目 content check / dirty-code gate を引き継ぐ。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 11-1 | NON_VISUAL 3 files を実体配置する |
| 11-2 | runtime evidence path を予約し、実測成功と混同しない |

## 参照資料

- `index.md`
- `phase-01.md`〜`phase-10.md`
- `outputs/phase-11/main.md`

## 成果物/実行手順

`outputs/phase-11/main.md`、`manual-smoke-log.md`、`link-checklist.md` を配置する。runtime evidence は実装サイクルで取得する。

## 統合テスト連携

本 Phase では integration test を実行しない。実装サイクルで focused Vitest と leakage grep を取得する。
