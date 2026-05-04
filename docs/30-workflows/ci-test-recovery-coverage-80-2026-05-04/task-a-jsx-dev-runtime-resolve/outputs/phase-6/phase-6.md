# Phase 6: テスト実行・カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-05-04 |
| 依存 Phase | Phase 5 |

## 目的

Phase 5 の実装後、apps/web の vitest が全 test file を unblock した状態であることを実測検証し、`bash scripts/coverage-guard.sh` が apps/web で coverage 集計まで到達することを確認する。

## 実行タスク

- タスク 1: `pnpm --filter @ubm-hyogo/web test` 実行と log 取得
- タスク 2: jsx-dev-runtime 失敗 grep が 0 件であることの検証
- タスク 3: `bash scripts/coverage-guard.sh --package apps/web` 実行と coverage-summary.json 生成確認
- タスク 4: coverage 集計値の記録（threshold 判定不問・後続 Task C への引継ぎ用 baseline）
- タスク 5: regression（apps/api / packages/*）が出ていないことの再確認

## 参照資料

| 参照資料 | パス |
| --- | --- |
| Phase 4 検証 suite | `../phase-4/phase-4.md` |
| Phase 5 実装ログ | `../phase-5/*.log` |
| coverage-guard | `scripts/coverage-guard.sh` |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` |

## 実行手順

### ステップ 1: vitest 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee outputs/phase-6/web-test-recovery.log
echo "JSX_DEV_RUNTIME_ERRORS=$(grep -c 'Failed to resolve import "react/jsx-dev-runtime"' outputs/phase-6/web-test-recovery.log)" | tee -a outputs/phase-6/web-test-recovery.log
```

### ステップ 2: 失敗 grep 検証

| 指標 | 期待値 | 実測値（Phase 6 実行時に記入） |
| --- | --- | --- |
| `Failed to resolve import "react/jsx-dev-runtime"` 出現数 | 0 | Phase 11 実測で記録 |
| collected test files 数 | 61（apps/web 全数） | Phase 11 実測で記録 |
| pass 数 | Phase 11 実測で記録（assertion 失敗は Task C スコープのため記録のみ） | Phase 11 実測で記録 |
| fail 数 | Phase 11 実測で記録（環境エラー以外は不問） | Phase 11 実測で記録 |

### ステップ 3: coverage-guard 実行

```bash
bash scripts/coverage-guard.sh --package apps/web 2>&1 | tee outputs/phase-6/coverage-guard.log
ls -la apps/web/coverage/coverage-summary.json | tee -a outputs/phase-6/coverage-guard.log
```

`apps/web/coverage/coverage-summary.json` が生成されていれば集計到達 = 本 Task DoD 達成。閾値判定（≥80%）の合否は Task C のスコープ。

### ステップ 4: coverage baseline 記録

```bash
node -e "const j=require('./apps/web/coverage/coverage-summary.json'); console.log(JSON.stringify(j.total, null, 2))" \
  | tee outputs/phase-6/web-coverage-baseline.json
```

### ステップ 5: regression 再確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tail -20 | tee outputs/phase-6/web-build.log
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tail -20 | tee outputs/phase-6/web-typecheck.log
```

## 統合テスト連携

apps/web の test collect 成立 + coverage 集計到達 = 後続 Task C / E への handoff 完了の必要条件。

## 多角的チェック観点（AI が判断）

- システム系: CI Linux（GitHub Actions ubuntu-latest）でも同じ結果になるか → Phase 11 で再確認
- 戦略系: 個別 test の assertion failure は **記録のみ** とし、修復は Task C へ委譲（CONST_007 違反ではない / 責務分離）
- 問題解決系: jsx-dev-runtime 0 件にできない場合 → Phase 2 へ戻り Fallback（vitest config 編集）採用

## サブタスク管理

| サブタスク | owner | 完了条件 |
| --- | --- | --- |
| 失敗 grep 0 件確認 | Task A | `JSX_DEV_RUNTIME_ERRORS=0` |
| coverage-summary 生成 | Task A | `apps/web/coverage/coverage-summary.json` 実体 |
| baseline 記録 | Task A | `web-coverage-baseline.json` 配置 |

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）
- `outputs/phase-6/web-test-recovery.log`
- `outputs/phase-6/coverage-guard.log`
- `outputs/phase-6/web-coverage-baseline.json`
- `outputs/phase-6/web-build.log`
- `outputs/phase-6/web-typecheck.log`

## 完了条件

- [ ] `JSX_DEV_RUNTIME_ERRORS=0` が記録されている
- [ ] `apps/web/coverage/coverage-summary.json` が生成されている
- [ ] `web-coverage-baseline.json` が配置されている
- [ ] `pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] coverage Statements/Branches/Functions/Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）を最終 wave 完了時の AC として再掲
- [ ] `bash scripts/coverage-guard.sh` exit 0 を最終 wave 完了時の検証経路として再掲（本 Phase では `--package apps/web` の集計到達まで）

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（タスク 1-5）完了
- [ ] 成果物実体配置

## 次 Phase

Phase 7（テストカバレッジ確認）— Phase 6 baseline をもとにカバレッジレポートの整合性を確認。
