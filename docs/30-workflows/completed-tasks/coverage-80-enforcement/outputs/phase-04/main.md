# Phase 4 成果物 — テスト戦略

## 1. テスト戦略サマリ

coverage-80-enforcement の採用案（全 package 一律 80% / 3 段階 PR / `scripts/coverage-guard.sh` 新設 / vitest v8 + lefthook + CI 二重防御）に対し、**T1〜T10 の 10 ケース**と **AC-1〜AC-14 マトリクス**を Phase 5 着手前の Green 条件として固定する。実走は Phase 5 / Phase 6 / Phase 11 / Phase 13（ユーザー承認後 merge）に委譲し、本 Phase はコマンド系列・期待値・Red 状態の正本化のみを行う。実 CI merge / branch protection 適用 / 実 PR 発行は本 Phase で実行しない。

## 2. 前提条件（NO-GO ゲート再確認）

- Phase 1〜3 が `completed`（artifacts.json と一致）。
- 親タスク `aiworkflow-requirements/quality-requirements-advanced.md` の現状値（desktop 80% / shared 65%）が読み取り済み。
- UT-GOV-001 / UT-GOV-004 完了は **PR③ hard gate 化時点** での前提条件であり、本 Phase（仕様化）の着手ゲートには含めない。ただし PR③ の Green 条件として T6 / T8 で UT-GOV-004 contexts 同期を再確認する。
- Phase 13 のユーザー承認（user_approval_required: true）が未完了の状態では、本テストの **実走は禁止**（仕様確認のみ）。

## 3. AC × test type マトリクス

| AC | 観点 | 主担当 T | 補助 T | test type |
| --- | --- | --- | --- | --- |
| AC-1 | vitest config に閾値 80% 固定 | T2 | T1 | unit / config-self-check |
| AC-2 | coverage-guard.sh が summary を集計し未達で exit 1 | T1 | T7 | unit (shell) |
| AC-3 | 未達時 stderr に top10 + テスト雛形 | T1 | T7 | unit (output format) |
| AC-4 | 各 package に test / test:coverage script | T3 | T2 | contract |
| AC-5 | CI に coverage-gate job 追加（soft → hard 2 段階） | T4 | T6 | integration (CI dry-run) |
| AC-6 | lefthook pre-push 統合（skip 抜け道なし） | T5 | T8 | integration (hook) |
| AC-7 | T0 baseline 計測手順の仕様化 | T6 | T9 | regression |
| AC-8 | 3 段階 PR 段取り（PR①/②/③）の merge 前提 | T6 | T4 / T5 | regression |
| AC-9 | hard gate 化時 contexts 登録手順（UT-GOV-004 連携） | T6 | T4 | regression |
| AC-10 | quality-requirements-advanced.md 同期差分 | T10 | - | regression (doc sync) |
| AC-11 | coverage-standards.md に coverage-guard.sh 参照追記 | T10 | - | regression (doc sync) |
| AC-12 | apps/web / packages/* の不足が baseline で可視化 | T6 | T1 | regression |
| AC-13 | 4 条件 PASS | Phase 1/3 で確定 | - | review gate |
| AC-14 | Phase 1〜13 が artifacts.json と完全一致 | Phase 12 で確定 | - | review gate |

## 4. T1: coverage-guard.sh のユニット検証

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 | `scripts/coverage-guard.sh`（lane: developer local + CI） |
| 検証コマンド | (1) full mode `mise exec -- bash scripts/coverage-guard.sh` / (2) `--changed` / (3) `--package <name>` / (4) `--threshold 90` / (5) Red 仕掛け fixture で exit 1 確認 |
| 期待値 | 全 package 80% 以上 → exit 0 / 未達 → exit 1 + stderr に `[coverage-guard] FAIL: <pkg> <metric>=<pct>%` と Top10 不足ファイル + `{src}/{file}.test.ts` 雛形 / jq 未インストール / vitest 失敗 → exit 2 |
| Red 状態 | exit code 常に 0 / stderr 出力フォーマット乖離 / Top10 順序が lines pct 昇順でない / `--changed` で全 package 実行 |
| 失敗時切り分け | (a) jq query path 誤り / (b) sort key 違い / (c) `git diff` base ref 不在 / (d) test 雛形パス置換誤り |

## 5. T2: vitest config 自己検証

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 | `vitest.config.ts` の `coverage` セクション |
| 検証コマンド | (1) dummy fixture で `pnpm test:coverage` を走らせ exit ≠ 0 / (2) exclude 対象に意図的にテスト不能ファイルを置き coverage から外れることを確認 / (3) `coverage/coverage-summary.json` に `total` が出力され `pct` が 4 metrics すべて含む |
| 期待値 | thresholds.lines/branches/functions/statements がいずれも 80 / exclude リストが効く（`**/.open-next/**` / `apps/web/src/app/**/page.tsx` 等） / reporter に `json-summary` 含有 |
| Red 状態 | 閾値 65% 残存 / exclude 効かず Edge runtime ファイルがカバレッジ 0% 計上 / reporter 不足で coverage-guard.sh が summary を読めない |
| 失敗時切り分け | (a) `perFile: true` 暴発 / (b) `include` glob が package を捕捉できない / (c) `@vitest/coverage-v8` 依存欠落 |

## 6. T3: 各 package script 統一（contract）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 | 5 package + ルート `package.json` |
| 検証コマンド | (1) `jq -e '.scripts.test'` × 5 / (2) `jq -e '.scripts["test:coverage"]'` × 5 / (3) `pnpm -r test:coverage` で全 package summary 生成 / (4) ルートに `coverage:guard` script 定義 |
| 期待値 | 5 package すべてに統一フォーマット / ルートから `pnpm -r test:coverage` で全 summary が出揃う |
| Red 状態 | 一部で `vitest` 直叩き / `--coverage` 抜け / `--config` パス相対誤り / ルート `coverage:guard` 未定義 |
| 失敗時切り分け | (a) `--root` 相対パス誤り / (b) 個別 package が独自 vitest config 上書き / (c) `--workspace-concurrency=1` 抜けで summary 競合 |

## 7. T4: CI workflow dry-run 検証（soft gate）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 | `.github/workflows/ci.yml` の `coverage-gate` job |
| 検証コマンド | (1) `act` ローカル実行 or PR① draft PR 上で確認 / (2) `gh workflow view ci.yml` に `coverage-gate` 出現 / (3) PR① 段階で `continue-on-error: true` のため意図的 80% 未満でも CI 全体は green / (4) artifact `coverage-report` upload |
| 期待値 | PR① で warning のみ / 既存 typecheck / lint が通れば mergeable / artifact upload 成功 / `mise exec --` 経由で Node 24 固定 |
| Red 状態 | `continue-on-error` 抜けで PR① が落ちる / artifact upload `if: always()` 抜け / `mise-action` 未利用で Node デフォルト |
| 失敗時切り分け | (a) `needs: [setup]` 依存 job 名誤り / (b) `pnpm install --frozen-lockfile` 失敗 / (c) `CI: 'true'` 未設定で local モード化 |

## 8. T5: lefthook pre-push 挙動検証

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 | `lefthook.yml` の `pre-push.commands.coverage-guard` |
| 検証コマンド | (1) `lefthook run pre-push` で coverage-guard 起動 / (2) 80% 未達状態で `git push` が exit 1 で block / (3) `--no-verify` bypass → CI 側 coverage-gate（PR③ 後）で再 block / (4) `LEFTHOOK=0 git push` 挙動観測 / (5) `--changed` モードで通常 30 秒以内 |
| 期待値 | push 前に coverage-guard 起動 / `--no-verify` は CI hard gate で必ず再 block / `parallel: false` で順次実行 |
| Red 状態 | hook 未登録（`prepare` script 抜け） / `skip: [merge, rebase]` 抜けで rebase 中起動 / `parallel: true` で summary 競合 |
| 失敗時切り分け | (a) `lefthook.yml` YAML 構文エラー / (b) PATH に bash / jq 不在 / (c) `.git/hooks/*` 手書き残存 |

## 9. T6: 3 段階 PR の段階別 Green 条件 / soft → hard 切替

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 対象 | PR① soft / PR② テスト追加 / PR③ hard gate 化 |
| 検証コマンド | (1) PR①: `gh pr checks <PR1>` で `coverage-gate` neutral / success / (2) PR② sub PR 群: warning が消えるまで段階確認 / (3) PR③: `continue-on-error` 削除 diff + `gh api repos/{owner}/{repo}/branches/{branch}/protection \| jq '.required_status_checks.contexts'` に `coverage-gate` 含有 / (4) PR③ merge 後、80% 未満破壊 PR で必ず block |
| 期待値 | PR① / PR② / PR③ の merge 前提条件が Phase 5 §3 段階 PR 段取り表と一致 |
| Red 状態 | PR① で hard gate 暴発 / PR③ で `continue-on-error` 削除忘却 / contexts 未登録のまま hard 化 |
| 失敗時切り分け | (a) Phase 12 unassigned-task で切替期限可視化漏れ / (b) UT-GOV-004 未完了 → 案 D 切替 / (c) Phase 11 smoke で破壊 PR 試走しないまま完了 |

## 10. T7: coverage-summary.json 異常時の自己防衛

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 対象 | `scripts/coverage-guard.sh` の異常入力ハンドリング |
| 検証コマンド | (1) summary 欠損 → exit 2 / (2) 空 JSON `{}` → exit 1 + 集計不可 package を stderr 列挙 / (3) `total.lines.pct` が string 型混入 → exit 2 + jq parse error / (4) 一部 package のみ summary（apps/api のみ）→ 欠損 package を未測定として stderr 明示 + exit 1 |
| 期待値 | 異常入力で exit 0 にならない / 復旧手順がメッセージで誘導される |
| Red 状態 | 異常入力で silently exit 0 / stderr 無出力 / jq エラーで SIGPIPE 中断 |
| 失敗時切り分け | (a) `set -euo pipefail` 抜け / (b) `test -f` summary 不在判定抜け / (c) jq `--exit-status` 不使用 |

## 11. T8: lefthook bypass × CI hard gate 二重防御

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 対象 | hook bypass × CI hard gate の二重防御 |
| 検証コマンド | (1) PR③ 後 80% 未満 dummy 破壊 PR + `git push --no-verify` で push 成功 → CI 側 `coverage-gate` hard fail で merge 不能 / (2) `LEFTHOOK=0 git push` でも CI 側 block / (3) `enforce_admins=true` で admin も bypass 不能（UT-GOV-001 連携） |
| 期待値 | ローカル bypass は応急処置のみ。最終 merge は CI hard gate でしか通らない |
| Red 状態 | CI hard gate が `continue-on-error: true` 残存 / contexts に `coverage-gate` 未登録 / `enforce_admins=false` で admin 直 push |
| 失敗時切り分け | (a) Phase 12 切替期限可視化漏れ / (b) UT-GOV-004 未同期 / (c) admin override がドキュメントに混入 |

## 12. T9: int-test-skill 互換（統合テスト coverage 寄与）

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 対象 | `packages/shared` の Mock provider を使う統合テスト |
| 検証コマンド | (1) `*.int.test.ts` が vitest `include` glob 内で discovery される / (2) Mock provider 経由で実装 src 行が `coverage/coverage-final.json` の per-file `s` カウンタに計上 / (3) int-test 実行時間が pre-push の `--changed` モード（30 秒以内）に収まる |
| 期待値 | unit + int-test 合算で 80% 達成可能 |
| Red 状態 | int-test が別 vitest config / 別 reporter で coverage 合算されない / Mock が src を bypass / int-test 単独で pre-push 超過 |
| 失敗時切り分け | (a) `vitest.workspace` 未利用で int-test 用 config 分離 / (b) `vi.mock` で実装ごと差し替え / (c) `setup` で `process.exit` |

## 13. T10: 正本同期 dry-run

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 対象 | Phase 12 で実施する正本同期の Phase 4 時点 dry-run |
| 検証コマンド | (1) `rg "85%\|65%" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` / (2) `rg "coverage-guard\.sh" .claude/skills/task-specification-creator/references/coverage-standards.md`（現状 0 件） / (3) `rg "target.*65%\|target.*85%" codecov.yml` / (4) Phase 12 system-spec-update-summary.md の差分が想定通り |
| 期待値 | 旧閾値出現箇所が Phase 12 で全件置換されるリスト確定 / 二重正本（codecov.yml ↔ vitest.config.ts）が Phase 12 同期で解消 |
| Red 状態 | 旧閾値が想定外の場所（README / docs/00-getting-started-manual 配下）に潜伏 / codecov.yml の patch.target ≠ project.target / coverage-standards.md に既存の旧形式言及 |
| 失敗時切り分け | (a) `rg` 対象 path 不足 / (b) codecov.yml 構造把握漏れ / (c) Phase 12 unassigned-task 起票漏れ |

## 14. テストカバレッジ目標（変更ブロック 100%）

| スコープ | 対象 | 100% 被覆を担う T |
| --- | --- | --- |
| coverage-guard.sh の I/O 仕様（exit 0/1/2 + stderr フォーマット + flag） | `scripts/coverage-guard.sh` | T1 + T7 |
| vitest config の `coverage` セクション 全フィールド | `vitest.config.ts` | T2 |
| 各 package script 統一 | 5 package + ルート | T3 |
| CI `coverage-gate` job（soft → hard） | `.github/workflows/ci.yml` | T4 + T6 |
| lefthook pre-push 統合 | `lefthook.yml` | T5 + T8 |
| 3 段階 PR 段取り | Phase 5 / Phase 13 ランブック | T6 |
| int-test-skill 互換 | `packages/shared` int-test | T9 |
| 正本同期 | aiworkflow-requirements / coverage-standards / codecov.yml | T10 |

> 「全ファイル一律 X%」表記は仕様文書整備層では **禁止**。スコープ 8 件で line / branch 100% を要求。

## 15. 3 段階 PR ごとのテストサブセット

| PR | スコープ | 必須 T | 補助 T |
| --- | --- | --- | --- |
| PR① | T0 baseline + T1 vitest config + T2 coverage-guard.sh + T3 package script + T4 CI soft gate | T1 / T2 / T3 / T4 / T7 | T6（PR① 段階の挙動） |
| PR② | T5 package 別 80% 達成テスト追加（package×metric 単位の sub PR 群） | T2（thresholds 維持） / T6（warning 消化段階） | T9（int-test 寄与） |
| PR③ | T6 lefthook 統合 + T7 hard gate 化 + T8 正本同期 | T5 / T6 / T8 / T10 | T1 / T4（hard 切替後再確認） |

## 16. 実走計画（本 Phase 範囲外）

| 実走 Phase | 対象 T | 備考 |
| --- | --- | --- |
| Phase 5 ランブック実走 | T1 / T2 / T3 / T4 / T7 | T0 baseline / PR① 仕組み導入は実 merge を伴わず実行可能 |
| Phase 6 異常系 | T1 / T7 / T8 の Red 系 + 苦戦想定 1〜7 | summary 欠損 / OS 依存 / 切替忘却 / 二重正本 |
| Phase 11 smoke | T1 / T4 / T5 / T6 / T9 | baseline / coverage-guard 実走 / soft→hard リハーサル |
| Phase 13 PR + ユーザー承認後 merge | 全 T | PR① / PR② / PR③ merge 前後で T6 / T8 を再走 |

## 17. 引き渡し（Phase 5 へ）

- T1〜T10 を Phase 5 ランブック T0〜T8 サブタスクの Green 条件として転記
- T1（coverage-guard.sh ユニット）/ T2（vitest 自己検証）の検証コマンドを Phase 5 各 T の確認コマンドへ転記
- T5（lefthook）/ T6（3 段階 PR 切替）/ T8（二重防御）を Phase 11 smoke / Phase 13 完了条件に組み込む
- T9 int-test-skill 互換は Phase 5 / 11 で再走
- T10 正本同期 dry-run の差分リストを Phase 12 system-spec-update-summary.md の入力として渡す
- 実走は本ワークフロー外 / 本 Phase で実 CI merge / branch protection 適用を実行しない
