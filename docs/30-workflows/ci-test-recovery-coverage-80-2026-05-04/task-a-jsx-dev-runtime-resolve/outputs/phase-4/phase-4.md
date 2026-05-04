# Phase 4: テスト方針

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-04 |
| 依存 Phase | Phase 1-3 |

## 目的

本 Task は環境修復（dependency 追加）であり、新規テストコードの作成は不要。**既存 36 件 test file が unblock されること**を検証する command suite を確定する。

## 実行タスク

- タスク 1: 「新規テスト不要」の根拠を記録（変更対象が test runner の dep のみ）
- タスク 2: 検証 command suite の確定
- タスク 3: 期待結果（before / after）の比較表
- タスク 4: 副作用境界（既存 test の挙動変化が無いことの確認方法）

## 参照資料

| 参照資料 | パス |
| --- | --- |
| Phase 1 baseline | `../phase-1/web-test-baseline.log` |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` |

## 実行手順

### ステップ 1: 新規テスト不要の根拠

| 観点 | 内容 |
| --- | --- |
| 変更対象 | `package.json#devDependencies` への 4 dep 追加 + `pnpm-lock.yaml` 再生成 |
| 既存テストへの影響 | apps/web の vitest が test file を resolve できるようになる（unblock）。test 自身の assertion ロジックは変えない |
| 新規追加テスト | なし（新規 test 追加が必要なケースは Task C スコープ） |
| Phase 4 事前確認: 副作用境界 | `package.json` の変更は import 副作用なし。lockfile は run-time に load されない |

### ステップ 2: 検証 command suite

```bash
# 環境準備
mise exec -- pnpm install

# unblock 確認
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee outputs/phase-6/web-test-recovery.log
grep -c 'Failed to resolve import "react/jsx-dev-runtime"' outputs/phase-6/web-test-recovery.log

# regression 確認
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee outputs/phase-6/web-build.log
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee outputs/phase-6/web-typecheck.log

# coverage 集計到達確認
bash scripts/coverage-guard.sh --package apps/web 2>&1 | tee outputs/phase-6/coverage-guard.log
```

### ステップ 3: before / after 比較

| 指標 | before（Phase 1 baseline） | after（Phase 6 期待） |
| --- | --- | --- |
| `Failed to resolve import "react/jsx-dev-runtime"` 出現数 | 36 件以上 | 0 件 |
| collected test files | 0 件（ほぼ全件 unresolved） | 61 件（apps/web の test 全数） |
| coverage-summary.json | 生成不能 | 生成成立（threshold 判定は不問） |

### ステップ 4: 副作用境界

- D1 binding / Cloudflare Workers runtime / Auth.js cookie / Google Forms API への副作用なし
- 既存 test の assertion 結果（pass / fail）は dep 追加で変わらないことが期待される。fail が新規発生した場合は Task C / 他タスクで吸収

## 統合テスト連携

`pnpm --filter @ubm-hyogo/web test` の全件 collect 成立 = 統合テスト連携の代替成果物。

## 多角的チェック観点（AI が判断）

- システム系: lockfile 再生成で他 dep version が drift しないこと（`git diff pnpm-lock.yaml | head -200` で確認）
- 問題解決系: 新規 test を作りたい誘惑（dep 追加の単体テスト等）に乗らない（Task A 単独 PR の clean さを優先）

## サブタスク管理

| サブタスク | owner | 完了条件 |
| --- | --- | --- |
| 検証 command suite 確定 | Task A | 本セクション |
| before/after 表 | Task A | 本セクション |

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）

## 完了条件

- [ ] 新規テスト不要の根拠が記載
- [ ] 検証 command suite が記載
- [ ] before / after 表が記載
- [ ] coverage Statements/Branches/Functions/Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）を AC として明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 を検証経路として明記

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（タスク 1-4）完了

## 次 Phase

Phase 5（実装）— `package.json` 編集 + `pnpm install` 実行 + lockfile commit 用の最初の検証。
