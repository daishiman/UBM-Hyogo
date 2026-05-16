# Phase 11 — runtime evidence（NON_VISUAL 縮約テンプレ）

> visualEvidence=NON_VISUAL のため screenshot は対象外。`.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` の縮約テンプレを適用する。
> 親 workflow: `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/`
> 対象成果物: `packages/contracts/`（新設）/ `scripts/e2e-mock-api.mjs`（拡張）/ `scripts/__tests__/e2e-mock-api.contract.spec.ts`（新規）/ `.github/workflows/e2e-tests.yml`（readiness wait + log artifact upload）

## メタ情報

| key | value |
|-----|-------|
| Phase | 11 |
| Phase Name | runtime evidence（NON_VISUAL alternative） |
| 作成日 | 2026-05-14 |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（strict 7 outputs + system spec 同期） |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| 適用テンプレ | `phase-11-non-visual-alternative-evidence.md`（縮約） |
| evidence 取得経路 | local runtime（typecheck / lint / vitest / curl / grep / coverage / playwright） |
| CI runtime evidence | PR 作成後に取得（IMPLEMENTED_LOCAL_RUNTIME_PENDING） |

## 目的

UI 差分のない mock API / contracts package / workflow patch task について、Phase 11 を screenshot ではなく **runtime evidence 8 ファイル** の物理生成によってクローズアウトする。Local PASS と CI runtime PASS を vocabulary 上で分離し、Phase 12 strict 7 outputs での compliance check に橋渡しする。

L-E2EQU3B-004 の知見: 「local PASS は `runtime_pending` のサブカテゴリ `IMPLEMENTED_LOCAL_RUNTIME_PENDING` に留め、CI runtime PASS 後にのみ `completed` へ昇格する」を厳格適用する。

## evidence canonical path

実コード生成後、`mkdir -p outputs/phase-11/evidence` を実行し、以下 8 ファイルを `outputs/phase-11/evidence/` 配下に物理生成する。

| # | path | 内容 | 取得コマンド |
|---|------|------|-------------|
| 1 | `outputs/phase-11/evidence/typecheck.log` | typecheck 出力 + exit code | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.log; echo "exit=$?" >> outputs/phase-11/evidence/typecheck.log` |
| 2 | `outputs/phase-11/evidence/lint.log` | lint 出力 + exit code | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/evidence/lint.log; echo "exit=$?" >> outputs/phase-11/evidence/lint.log` |
| 3 | `outputs/phase-11/evidence/contracts-test.log` | `@ubm-hyogo/contracts` Vitest 出力 | `mise exec -- pnpm --filter @ubm-hyogo/contracts test 2>&1 \| tee outputs/phase-11/evidence/contracts-test.log` |
| 4 | `outputs/phase-11/evidence/contract-spec.log` | `scripts/__tests__/e2e-mock-api.contract.spec.ts` Vitest 出力 | `mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts 2>&1 \| tee outputs/phase-11/evidence/contract-spec.log` |
| 5 | `outputs/phase-11/evidence/mock-health-200.txt` | `/health` 200 確認 | `node scripts/e2e-mock-api.mjs > /tmp/mock-health.log 2>&1 & sleep 2; curl -i http://127.0.0.1:8787/health > outputs/phase-11/evidence/mock-health-200.txt; kill %1` |
| 6 | `outputs/phase-11/evidence/dispatcher-grep.txt` | 実 dispatcher 数の grep 結果 | `grep -nE "pathname ===\|pathname.startsWith" scripts/e2e-mock-api.mjs > outputs/phase-11/evidence/dispatcher-grep.txt; wc -l outputs/phase-11/evidence/dispatcher-grep.txt >> outputs/phase-11/evidence/dispatcher-grep.txt` |
| 7 | `outputs/phase-11/evidence/coverage-summary.json` | Vitest coverage 抜粋 | `mise exec -- pnpm vitest run --coverage scripts/__tests__/e2e-mock-api.contract.spec.ts packages/contracts && cp coverage/coverage-summary.json outputs/phase-11/evidence/coverage-summary.json` |
| 8 | `outputs/phase-11/evidence/e2e-chromium.log` | E2E regression（desktop-chromium） | `mise exec -- pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium 2>&1 \| tee outputs/phase-11/evidence/e2e-chromium.log` |

## 代替 evidence 差分表（NON_VISUAL 必須）

| Phase 11 シナリオ | 元前提（visual 系） | 代替手段 | カバー範囲 | 申し送り先 |
|-------------------|---------------------|----------|------------|------------|
| S-1 endpoint 網羅 | UI 画面の表示確認 | dispatcher-grep.txt × endpoint-inventory.md の行数一致 | AC-1 measurable | （Phase 12 compliance check で再確認） |
| S-2 contract SSOT | UI からの API 呼出し screenshot | contract-spec.log で `schema.parse()` PASS | AC-2 / AC-3 | runtime CI に同 spec を組込 |
| S-3 seed canonical | seed 投入結果の UI 画面 | contracts-test.log + fixtures.ts grep | AC-4 | （Phase 12 compliance check） |
| S-4 readiness wait | CI 上の Playwright 起動確認 | mock-health-200.txt × `.github/workflows/e2e-tests.yml` の patch diff | AC-5 | PR 作成後に CI runtime で確認 |
| S-5 regression 不在 | UI 画面の screenshot 比較 | e2e-chromium.log（既存 spec 6 件 green） | AC-6 | runtime CI で firefox / webkit / staging matrix |
| S-6 型・lint・coverage | — | typecheck.log / lint.log / coverage-summary.json | AC-7 | coverage-guard.sh は Phase 11 内で実行 |
| S-7 意図的 violation | dep-cruiser 等の RED 確認 | contract-spec.log 内で zod parse 失敗ケースが期待通り 500 を返す assertion（spec 内） | RED 確認 | （contract-spec.log で吸収済） |

## 評価項目（DoD）

- [ ] `typecheck.log` exit=0
- [ ] `lint.log` exit=0
- [ ] `contracts-test.log` で `@ubm-hyogo/contracts` の Vitest が `PASS`（exit 0）
- [ ] `contract-spec.log` で `scripts/__tests__/e2e-mock-api.contract.spec.ts` が `PASS`（exit 0、skip 0）
- [ ] `mock-health-200.txt` の冒頭が `HTTP/1.1 200`
- [ ] `dispatcher-grep.txt` の行数が `outputs/phase-1/endpoint-inventory.md` の endpoint 行数と数値整合（AC-1 measurable gate）
- [ ] `coverage-summary.json` の `total.statements.pct` / `branches.pct` / `functions.pct` / `lines.pct` が全て **≥ 80%**（packages/contracts / scripts 追加分）
- [ ] `bash scripts/coverage-guard.sh` exit 0（Phase 11 内で実行・ログ別途）
- [ ] `e2e-chromium.log` で desktop-chromium 既存 spec 全件 PASS（regression 不在）
- [ ] 上記 8 ファイルすべて物理存在（`ls outputs/phase-11/evidence/` で 8 件確認）

## 状態語彙（CONST 整合）

| ステータス | 条件 | 本 phase での扱い |
|-----------|------|-------------------|
| `spec_created` | 仕様書のみ。コード差分なし | Phase 5 着手前まで |
| `runtime_pending`（サブ: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`） | 実コード生成済み / local 8 evidence 取得済み / CI runtime（GitHub Actions e2e-tests.yml 全 matrix）未実行 | **Phase 11 close-out 時点の正式状態** |
| `completed` | 上記 + CI runtime PASS（`ci.yml` test job / e2e-tests matrix 全 PASS）が artifact ログとして取得済み | Phase 13 PR merge 後の CI 完了で昇格 |

> ⚠️ runtime CI 実行前に `completed` を貼らない。`PASS` 単独表記禁止。本 phase の `main.md` 総合判定行は必ず `IMPLEMENTED_LOCAL_RUNTIME_PENDING` suffix を併記する。

## boundary state

実コード生成 + ローカル 8 evidence 取得時点 → **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`**（同義: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`）

CI runtime（PR 作成後の GitHub Actions `ci.yml` test job + `e2e-tests.yml` 全 matrix）が exit 0 で完了 + artifact log 取得後にのみ → `completed`。

## 実行手順（縮約）

1. `mkdir -p outputs/phase-11/evidence` を実行
2. 「evidence canonical path」表の #1 → #8 の順にコマンドを実行し、各ログを `tee` で保存
3. 8 件すべての存在を `ls outputs/phase-11/evidence/ \| wc -l` で確認（期待値 8）
4. 「評価項目」の各チェックボックスを `main.md` に転記し、PASS / FAIL を機械可読にマーク
5. CI runtime evidence は **本 phase では取得しない**。Phase 13 G3 ゲート後の PR 作成 → GitHub Actions 実行ログを別 evidence として後段で取得する

## 成果物

| 成果物 | パス | 必須 |
|--------|------|------|
| Phase 11 main | `outputs/phase-11/main.md` | 必須 |
| 8 evidence file | `outputs/phase-11/evidence/{1..8}` | 必須 |
| 代替 evidence 差分表 | `main.md` 内に inline 記述（または `outputs/phase-11/alternative-evidence-diff.md`） | 必須 |
| 申し送り（CI runtime pending） | `main.md` 末尾に `unassigned-task-detection.md` 候補として申し送り line | 必須 |

## 完了条件

- [ ] evidence 8 ファイルすべて物理存在 + 評価項目 9 件すべて PASS
- [ ] `main.md` の総合判定行が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（または `IMPLEMENTED_LOCAL_RUNTIME_PENDING`）
- [ ] CI runtime evidence pending を「Phase 13 PR 作成後に取得」として明示申し送り
- [ ] L-E2EQU3B-004 の vocabulary 分離（local PASS vs CI PASS）を `main.md` に明記
- [ ] visualEvidence = `NON_VISUAL` を `artifacts.json.metadata` で確認

## やってはいけないこと（pitfall 回避）

- 「local 5 点 PASS だから `completed`」と書く（L-E2EQU3B-004 違反）
- evidence file に exit code 行を残さない（PASS 断言不能になる）
- `coverage-summary.json` を本 evidence path 配下に物理コピーせず、`coverage/coverage-summary.json` の参照リンクで済ませる（drift の温床）
- `dispatcher-grep.txt` の行数と `endpoint-inventory.md` の行数 drift を放置（AC-1 measurable gate 破綻）
- screenshot を撮らないことの根拠（NON_VISUAL）を `main.md` に明記しない

## タスク 100% 実行確認【必須】

- [ ] evidence 8 ファイル取得済み
- [ ] 評価項目 9 件すべてマーク済み
- [ ] 状態語彙 / boundary state を `main.md` に転記済み
- [ ] CI runtime pending を申し送り

## 次 Phase

Phase 12: strict 7 outputs + aiworkflow-requirements 正本同期 + unassigned task formalize
