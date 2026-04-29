# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制 (coverage-80-enforcement) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（AC × test type マトリクス / coverage-guard.sh 単体 / vitest 自己検証 / CI dry-run / lefthook 検証 / 3 段階 PR テスト範囲） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending（仕様化のみ完了 / 実走は Phase 5 / 6 / 11 / 13） |
| タスク種別 | implementation / NON_VISUAL / quality_governance |

## 目的

Phase 3 で PASS（with notes R-1〜R-4）が確定した採用案（全 package 一律 80% / 3 段階 PR / `scripts/coverage-guard.sh` 新設）に対し、**Phase 5 着手前に「何を満たせば Green か」を AC-1〜AC-14 と test type のマトリクス（T1〜T10）として確定**する。本 Phase はテストの実走ではなく、Phase 5 ランブック / Phase 6 異常系 / Phase 11 smoke が参照する **検証コマンド系列の正本** として固定する。

> **本 Phase は仕様化のみ**。実 CI merge / branch protection 適用 / 実 PR 発行は Phase 13 ユーザー承認後の別オペレーション。本 Phase ではコマンドを記述するが**実行は禁止**。

## 真の論点（再確認）

5 リスク同時封じ（鶏卵 / monorepo 集計 / Edge runtime exclude / soft→hard 切替忘却 / codecov.yml 二重正本）が Phase 4 のテスト群でも検証可能であること。特に T1〜T3 で「仕組みそのものの自己検証」、T4〜T6 で「3 段階 PR の段階別 Green 条件」、T7〜T10 で「異常系基盤」までを切れ目なく扱う。

## 依存タスク順序（前提確認）

- Phase 1〜3 が `completed` であること（artifacts.json と一致）。
- 親タスク `aiworkflow-requirements/quality-requirements-advanced.md` の現状値（desktop 80% / shared 65%）が読み取り済み（Phase 12 で同期予定）。
- UT-GOV-001 / UT-GOV-004 完了は **PR③ hard gate 化時点** での前提条件であり、本 Phase（仕様化）の着手ゲートには含めない。ただし PR③ の Green 条件として T6 / T8 で UT-GOV-004 contexts 同期を再確認する。

## 実行タスク

- タスク1: AC-1〜AC-14 と test type（unit / contract / integration / E2E-like / regression）のマトリクスを構築する。
- タスク2: T1〜T10 の対象スコープ / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けを表化する。
- タスク3: 3 段階 PR（PR① / PR② / PR③）の各段階で実行すべき T のサブセットを明示する。
- タスク4: int-test-skill との互換（統合テストが coverage に寄与する経路）を T9 として定義する。
- タスク5: 実走を Phase 5 / 6 / 11 / 13 に委譲する境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-02.md | トポロジ / coverage-guard.sh I/O / vitest config / CI / lefthook / 3 段階 PR |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-03.md | 採用案 PASS 判定 / NO-GO 条件 / R-1〜R-4 |
| 必須 | docs/30-workflows/coverage-80-enforcement/index.md | AC-1〜AC-14 / 苦戦想定 1〜7 |
| 必須 | .claude/skills/task-specification-creator/references/coverage-standards.md | Phase 6/7 検証テンプレ |
| 必須 | .claude/skills/task-specification-creator/references/patterns-testing.md | カバレッジ免除判定 / TDD パターン |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-04.md | テスト戦略フォーマット参照元 |
| 参考 | https://vitest.dev/guide/coverage | Vitest v8 coverage provider 仕様 |

## AC × test type マトリクス

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
| AC-13 | 4 条件（価値 / 実現 / 整合 / 運用）PASS | Phase 1/3 で確定 | - | review gate |
| AC-14 | Phase 1〜13 が artifacts.json と完全一致 | Phase 12 で確定 | - | review gate |

## テスト一覧（happy path / T1〜T10）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点での現状値 / **対応 lane** = Phase 2 トポロジ上の位置

### T1: coverage-guard.sh のユニット検証（exit code / 出力フォーマット / `--changed`）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 | `scripts/coverage-guard.sh` 本体 / lane: developer local + CI |
| 検証コマンド | (1) full mode: `mise exec -- bash scripts/coverage-guard.sh` / (2) `--changed`: `mise exec -- bash scripts/coverage-guard.sh --changed` / (3) `--package <name>`: 単一 package のみ計測 / (4) `--threshold 90` で閾値上書き / (5) Red 仕掛け: 意図的に小 fixture coverage-summary.json を渡し exit 1 を確認 |
| 期待値 | (a) 全 package 80% 以上 → exit 0 / (b) いずれか未達 → exit 1 + stderr に `[coverage-guard] FAIL: <pkg> <metric>=<pct>% (< 80%)` と Top10 不足ファイル + 対応する `{src}/{file}.test.ts` 雛形パス / (c) jq 未インストール / vitest 失敗 → exit 2 / (d) `--changed` 時に `git diff origin/main...HEAD` で touched package のみ計測 |
| Red 状態 | exit code が常に 0 / stderr 出力フォーマットが Phase 2 §scripts/coverage-guard.sh I/O 仕様と乖離 / Top10 順序が lines pct 昇順でない / `--changed` で全 package を実行してしまう |
| 失敗時切り分け | (a) jq query path 誤り（lines/branches/functions/statements の `pct` 抽出） / (b) 配列 sort key 違い / (c) `git diff` の base ref 取得失敗（detached HEAD） / (d) test 雛形パス生成の `{src}` → `{src}/<file>.test.ts` 置換誤り |

### T2: vitest config 自己検証（threshold が効くか / exclude が効くか）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 | `vitest.config.ts` の `coverage` セクション |
| 検証コマンド | (1) `mise exec -- pnpm test:coverage` をダミー fixture（80% 未満になる小 src + test）で走らせ exit ≠ 0 を確認 / (2) `apps/web/src/app/**/page.tsx` 等の exclude 対象に意図的にテスト不能ファイルを置き coverage 計上から外れることを確認 / (3) `coverage/coverage-summary.json` に `total` が出力され `pct` が 4 metrics（lines/branches/functions/statements）すべて含むことを確認 |
| 期待値 | (a) thresholds.lines/branches/functions/statements がいずれも 80 で固定 / (b) exclude リスト（`**/.open-next/**` / `apps/web/src/app/**/page.tsx` 等）に該当するファイルは `coverage/coverage-final.json` の key に出現しない / (c) `reporter` に `json-summary` が含まれ `coverage-guard.sh` が読める |
| Red 状態 | 閾値が 65% のまま残存（旧正本写し） / exclude が効かず Edge runtime ファイルでカバレッジが 0% 計上 / reporter に `json-summary` が無く `coverage-guard.sh` が summary を読めない |
| 失敗時切り分け | (a) `perFile: true` で file 単位閾値が暴発 / (b) `include` glob が package 配下を捕捉できていない / (c) v8 provider 未インストール（`@vitest/coverage-v8` 依存欠落） |

### T3: 各 package の test / test:coverage script 統一（contract）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 | `apps/web/package.json` / `apps/api/package.json` / `packages/shared/package.json` / `packages/integrations/package.json` / `packages/integrations/google/package.json` / ルート `package.json` |
| 検証コマンド | (1) `jq -e '.scripts.test' <pkg>/package.json` × 5 package が exit 0 / (2) `jq -e '.scripts["test:coverage"]'` × 5 package が exit 0 / (3) `mise exec -- pnpm -r test:coverage` がすべての package で `coverage/coverage-summary.json` を生成 / (4) ルート `package.json` に `coverage:guard: bash scripts/coverage-guard.sh` が定義 |
| 期待値 | 5 package すべてに `test` / `test:coverage` が統一フォーマット（Phase 2 §各 package script 統一仕様）で定義され、ルートから `pnpm -r test:coverage` で全 package の summary が出揃う |
| Red 状態 | 一部 package で script 名が `vitest` 直叩き / `--coverage` 抜け / `--config` パス相対誤り / ルート `coverage:guard` script 未定義 |
| 失敗時切り分け | (a) workspace `--root` 相対パス誤り / (b) 個別 package が独自 vitest config を上書きし root config を無視 / (c) `pnpm -r --workspace-concurrency=1` が抜けて parallel 暴発で coverage-summary.json 競合 |

### T4: CI workflow dry-run 検証（soft gate / `coverage-gate` job）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 | `.github/workflows/ci.yml` の `coverage-gate` job |
| 検証コマンド | (1) `act` で `coverage-gate` job をローカル実行（または PR① の draft PR で GitHub Actions 上で確認） / (2) `gh workflow view ci.yml` で job 一覧に `coverage-gate` が出現 / (3) PR① 段階では `continue-on-error: true` のため意図的に 80% 未満の状態でも CI 全体は green / (4) artifact `coverage-report` が `apps/*/coverage/` と `packages/*/coverage/` を含む形で upload される |
| 期待値 | PR① 段階: warning のみ表示 / 既存 typecheck / lint が通れば mergeable / artifact upload 成功 / `mise exec --` 経由で Node 24 が固定 |
| Red 状態 | `continue-on-error` 抜けで PR① が落ちる（鶏卵問題発火） / artifact upload が `if: always()` 抜けで失敗時に成果物喪失 / `mise-action` 未利用で Node バージョンが actions runner default に巻き取られる |
| 失敗時切り分け | (a) `needs: [setup]` の依存 job 名誤り / (b) `pnpm install --frozen-lockfile` が lockfile 不整合で fail / (c) `CI: 'true'` env 未設定で coverage-guard.sh の挙動が local モードで動く |

### T5: lefthook pre-push 挙動検証（skip 抜け道なし）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 | `lefthook.yml` の `pre-push.commands.coverage-guard` |
| 検証コマンド | (1) `mise exec -- lefthook run pre-push` で coverage-guard が起動 / (2) 意図的に 80% 未達状態で `git push` を試行し exit 1 で push が block / (3) `--no-verify` での bypass 試行 → ローカル hook は skip されるが CI 側 coverage-gate（PR③ では required）で再 block / (4) `LEFTHOOK=0 git push` の挙動を観測（緊急時のみ許容、CI で再 block） / (5) `pre-push.commands.coverage-guard.run` が `bash scripts/coverage-guard.sh --changed` で起動し、`parallel: false` で順次実行 |
| 期待値 | push 前に coverage-guard が走り未達なら exit 1 で push 不能 / `--no-verify` 抜け道は CI hard gate（PR③ 後）で必ず再 block / pre-push の所要時間が `--changed` モードで通常 30 秒以内 |
| Red 状態 | hook 自体が登録されない（`pnpm install` で `lefthook install` が走らない / `prepare` script 抜け） / `skip: [merge, rebase]` 抜けで rebase 中に過剰起動 / `parallel: true` で他 hook と coverage-summary.json を取り合う競合 |
| 失敗時切り分け | (a) `lefthook.yml` の YAML 構文エラー / (b) PATH に bash / jq が無い（mise 経由で解決必須） / (c) `.git/hooks/*` の手書き残存（CLAUDE.md の方針で禁止） |

### T6: 3 段階 PR の段階別 Green 条件 / soft → hard 切替検証

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 対象 | PR① soft gate / PR② テスト追加 / PR③ hard gate 化の段階遷移 |
| 検証コマンド | (1) PR①: `gh pr checks <PR1>` で `coverage-gate` が `neutral` または `success` (continue-on-error: true) で表示 / (2) PR② 各 sub PR: warning が消えるまで（all package 80% 達成）テスト追加が必要 / (3) PR③: `continue-on-error` 削除 diff の確認 + `gh api repos/{owner}/{repo}/branches/{branch}/protection \| jq '.required_status_checks.contexts'` に `coverage-gate` が含まれることを確認（UT-GOV-001 / UT-GOV-004 連携） / (4) PR③ merge 後、80% 未満の意図的破壊 PR を作って必ず block されることを確認 |
| 期待値 | PR① / PR② / PR③ のすべての merge 前提条件（CI 挙動 / branch protection 設定状態）が Phase 5 §3 段階 PR 段取り表と一致 |
| Red 状態 | PR① で hard gate が暴発（鶏卵問題） / PR③ で `continue-on-error` 削除を忘却（soft 永続化）/ branch protection contexts に `coverage-gate` 未登録のまま hard 化 |
| 失敗時切り分け | (a) PR③ の diff レビューで `continue-on-error` 残存に気付かない → Phase 12 unassigned-task で切替期限を可視化 / (b) UT-GOV-004 未完了で contexts 登録不能 → 案 D 相当の 2 段階適用に切替 / (c) Phase 11 smoke で破壊 PR を試走しないまま完了宣言 |

### T7: coverage-summary.json 異常時の自己防衛（contract）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 対象 | `scripts/coverage-guard.sh` の異常系入力ハンドリング |
| 検証コマンド | (1) coverage-summary.json 欠損（vitest 実行失敗）→ exit 2 / (2) 空 JSON `{}` → exit 1 + 「集計不可 package」を stderr に列挙 / (3) `total.lines.pct` が string 型で混入 → exit 2 + jq parse error 表示 / (4) 一部 package のみ summary 生成（apps/api のみ）→ 欠損 package を「未測定」として stderr に明示 + exit 1 |
| 期待値 | 異常入力ですべて exit 0 にならない / 復旧手順がメッセージで誘導される（「`pnpm -r test:coverage` を再実行してください」「`@vitest/coverage-v8` の依存を確認してください」等） |
| Red 状態 | 異常入力で silently exit 0（無検出） / stderr に何も出ず開発者が原因不明 / jq エラーで script 全体が SIGPIPE 中断 |
| 失敗時切り分け | (a) `set -euo pipefail` 抜けでエラー無視 / (b) summary 不在判定（`test -f` チェック）抜け / (c) jq の `--exit-status` 不使用で false 値も 0 終了 |

### T8: lefthook bypass / `--no-verify` 防御層検証

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 対象 | hook bypass × CI hard gate の二重防御 |
| 検証コマンド | (1) PR③ merge 後の状態で 80% 未満の dummy 破壊 PR を作成 → ローカル `git push --no-verify` で push 成功 → CI 側で `coverage-gate` が hard fail し PR の merge button が disable / (2) `LEFTHOOK=0 git push` でも CI 側 block を確認 / (3) branch protection の `enforce_admins=true` 状態で admin 自身も bypass 不能を確認（UT-GOV-001 連携） |
| 期待値 | ローカル bypass はあくまで CI の reality check までの応急処置にしかならず、最終的な merge は CI hard gate でしか通らない |
| Red 状態 | CI hard gate が `continue-on-error: true` のまま残存（PR③ の切替忘却） / branch protection contexts に `coverage-gate` 未登録 / `enforce_admins=false` で admin が直 push 可能 |
| 失敗時切り分け | (a) Phase 12 unassigned-task-detection で切替期限が可視化されていない / (b) UT-GOV-004 未同期 contexts で hard gate 未登録 / (c) admin override の運用許可がドキュメントに混入 |

### T9: int-test-skill 互換（統合テストが coverage に寄与する経路）

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 対象 | `packages/shared` の Mock provider を使う統合テストが coverage に計上されるか |
| 検証コマンド | (1) int-test-skill が生成する `*.int.test.ts` が vitest の `include` glob に含まれることを確認（`include: ['apps/**/src/**/*.{ts,tsx}', 'packages/**/src/**/*.{ts,tsx}']` の素通り経路 + test の自動 discovery） / (2) Mock provider 経由で実装 src 行が coverage に計上されることを `coverage/coverage-final.json` の per-file `s` カウンタで確認 / (3) int-test の実行時間が pre-push の `--changed` モードに収まる（30 秒以内） |
| 期待値 | int-test の Mock 経由で `packages/shared/src/**` の coverage が unit test と同等に計上され、unit と int-test の合計で 80% を満たせる |
| Red 状態 | int-test が別 vitest config / 別 reporter で動き coverage に合算されない / Mock provider が src 実装を bypass して coverage 計上が 0 / int-test 単独実行時間が pre-push を超過 |
| 失敗時切り分け | (a) `vitest.workspace` 未利用で int-test 用 config が分離している / (b) Mock provider が `vi.mock` で実装ごと差し替え / (c) int-test の `setup` で `process.exit` が走り coverage report 生成前に終了 |

### T10: 正本同期 dry-run（quality-requirements-advanced.md / coverage-standards.md / codecov.yml）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 対象 | Phase 12 で実施する正本同期の Phase 4 時点の dry-run |
| 検証コマンド | (1) `rg "85%\|65%" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` で旧閾値の出現箇所を列挙 / (2) `rg "coverage-guard\.sh" .claude/skills/task-specification-creator/references/coverage-standards.md` が現状 0 件であることを確認 / (3) `rg "target.*65%\|target.*85%" codecov.yml` で旧 target 値を列挙 / (4) Phase 12 system-spec-update-summary.md に書く差分が想定通り（旧 desktop=80%/shared=65% → 一律 80%）になることを Phase 4 時点で確認 |
| 期待値 | 旧閾値の出現箇所が Phase 12 で全件置換されるリストとして確定 / 二重正本（codecov.yml ↔ vitest.config.ts）が Phase 12 同期で解消される計画が確定 |
| Red 状態 | 旧閾値が想定外の場所（README / docs/00-getting-started-manual 配下）に潜伏 / codecov.yml の patch.target が project.target と乖離 / coverage-standards.md に既に旧形式の coverage-guard 言及が混入 |
| 失敗時切り分け | (a) `rg` の対象 path 不足（doc 全域を grep してない） / (b) codecov.yml の patch / project が別ファイル / (c) Phase 12 unassigned-task に同期ジョブが起票されていない |

## テストカバレッジ目標（仕様レベル）

| スコープ | 対象 | 100% 被覆を担う T |
| --- | --- | --- |
| coverage-guard.sh の I/O 仕様（exit 0/1/2 + stderr フォーマット + flag） | `scripts/coverage-guard.sh` | T1 + T7 |
| vitest config の `coverage` セクション 全フィールド | `vitest.config.ts` | T2 |
| 各 package の test / test:coverage script 統一 | 5 package + ルート package.json | T3 |
| CI `coverage-gate` job（soft → hard 切替） | `.github/workflows/ci.yml` | T4 + T6 |
| lefthook pre-push 統合（skip 抜け道なし） | `lefthook.yml` | T5 + T8 |
| 3 段階 PR 段取り（PR① / PR② / PR③） | Phase 5 / Phase 13 ランブック | T6 |
| int-test-skill 互換（coverage 寄与） | `packages/shared` int-test | T9 |
| 正本同期（aiworkflow-requirements / coverage-standards / codecov.yml） | Phase 12 同期対象ファイル群 | T10 |

> 「全ファイル一律 X%」表記は仕様文書整備層では **禁止**（apps/* / packages/* には影響しない）。スコープ 8 件で line / branch 100% を要求する。

## 3 段階 PR ごとのテストサブセット

| PR | スコープ | 必須 T | 補助 T |
| --- | --- | --- | --- |
| PR① | T0 baseline + T1 vitest config + T2 coverage-guard.sh + T3 package script + T4 CI soft gate | T1 / T2 / T3 / T4 / T7 | T6（PR① 段階の挙動確認） |
| PR② | T5 package 別 80% 達成テスト追加（package×metric 単位の sub PR 群） | T2（thresholds 維持） / T6（warning が消えるまでの段階確認） | T9（int-test 寄与確認） |
| PR③ | T6 lefthook 統合 + T7 hard gate 化 + T8 正本同期 | T5 / T6 / T8 / T10 | T1 / T4（hard 切替後の挙動再確認） |

## 実走計画（本 Phase 範囲外）

| 実走 Phase | 対象 T | 備考 |
| --- | --- | --- |
| Phase 5 ランブック実走 | T1 / T2 / T3 / T4 / T7 | T0 baseline 計測と PR① 仕組み導入までは実 merge を伴わず実行可能 |
| Phase 6 異常系 | T1 / T7 / T8 の Red 系 + 苦戦想定 1〜7 | summary 欠損 / OS 依存 / 切替忘却 / 二重正本 |
| Phase 11 smoke | T1 / T4 / T5 / T6 / T9 | baseline 計測 / coverage-guard 実走 / soft→hard 切替リハーサル |
| Phase 13 PR + ユーザー承認後 merge | 全 T | PR① / PR② / PR③ の merge 前後で T6 / T8 を再走 |

## 統合テスト連携

T1〜T10 は別オペレーション側で Phase 5（実装ランブック）/ Phase 6（異常系）/ Phase 11（手動 smoke）/ Phase 13（ユーザー承認後 merge）の gate として実走する。本 Phase はテスト仕様の正本化のみを行う。int-test-skill との互換は T9 で先行的に確認し、Phase 5 / 11 で再走する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T10 のテスト一覧 / AC マトリクス / 検証コマンド / 期待値 / 失敗時切り分け |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] AC-1〜AC-14 と T1〜T10 のマトリクスが `outputs/phase-04/main.md` に表化されている
- [ ] T1〜T10 の各テストに ID / 対象 / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けが記述されている
- [ ] 3 段階 PR（PR① / PR② / PR③）ごとのテストサブセットが明記されている
- [ ] coverage-guard.sh の exit code 0/1/2 と stderr フォーマットが T1 / T7 で被覆されている
- [ ] vitest config の自己検証（thresholds / exclude / reporter）が T2 で被覆されている
- [ ] CI dry-run（`act` または PR 上）の検証手順が T4 / T6 で記述されている
- [ ] lefthook pre-push と CI hard gate の二重防御が T5 / T8 で被覆されている
- [ ] int-test-skill 互換が T9 で被覆されている
- [ ] 正本同期 dry-run が T10 で被覆されている
- [ ] 実テスト走行は Phase 5 / 6 / 11 / 13 に委ねる旨が明示されている
- [ ] 本 Phase で実 CI merge / branch protection 適用を行っていない（仕様化のみ）

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
# 仕様の存在確認のみ（実テストは走らせない）
test -f docs/30-workflows/coverage-80-enforcement/outputs/phase-04/main.md
rg -c "^### T(10|[1-9]):" docs/30-workflows/coverage-80-enforcement/outputs/phase-04/main.md
# => 10
rg -c "AC-1[0-4]\|AC-[1-9]" docs/30-workflows/coverage-80-enforcement/outputs/phase-04/main.md
# => 14 以上
```

## 苦戦防止メモ

1. **T1 の `--changed` モードは git base ref が detached HEAD で破綻する**: CI / pre-push 双方で `origin/main` が fetch 済みであることを前提化。Phase 5 Step T2 で `git fetch origin main --depth=1` を冒頭に置く。
2. **T2 の vitest 自己検証は dummy fixture が必要**: 実 src を壊して 80% 未達を作るのは PR を汚すため、`__fixtures__/coverage-guard/` 配下に dummy package を置き Phase 5 で T1 / T2 のローカル検証に流用する設計を Phase 5 で確定する。
3. **T4 の `act` 利用は OS 依存**: Apple Silicon で docker image 解決が失敗する場合は draft PR 経由の確認に切替。`act` 必須化は避け「`act` または draft PR」と並記する。
4. **T5 の lefthook 検証で `pre-push` が `prepare-commit-msg` 等と競合**: `parallel: false` で順次実行を維持。Phase 5 Step T6 で yaml 構造を再確認。
5. **T6 の soft→hard 切替は Phase 12 unassigned-task との連携必須**: PR③ を出さないと永遠に warning。期限明記を Phase 12 で必ず起票（苦戦想定 5）。
6. **T9 の int-test は vitest workspace 化と相性問題が出やすい**: 現状 monorepo 単一 root config 前提で T9 を組み、workspace 化は将来移行候補（Phase 12 unassigned-task）として隔離。
7. **本 Phase は実走しない**: T1〜T10 の Red 確認は Phase 5 着手直前 / Phase 11 smoke / Phase 13 ユーザー承認後の merge で行う。仕様化のみで Phase 5 へ進む。

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T10 を Phase 5 ランブック T0〜T8 サブタスクの Green 条件として参照
  - T1（coverage-guard.sh ユニット）/ T2（vitest 自己検証）の検証コマンドを Phase 5 各 T の確認コマンドに転記
  - T4（CI dry-run）/ T5（lefthook）/ T6（3 段階 PR 切替）は Phase 11 smoke の主要ケース
  - 実走は Phase 13 ユーザー承認後（user_approval_required: true）
- ブロック条件:
  - AC-1〜AC-14 と T1〜T10 のマトリクスに欠落がある
  - 3 段階 PR の段階別テストサブセットが Phase 5 / 13 と整合しない
  - int-test-skill 互換（T9）が未検証で Phase 5 へ進む
  - coverage-guard.sh の exit code 0/1/2 と stderr フォーマットのいずれかが T1 / T7 で被覆漏れ
