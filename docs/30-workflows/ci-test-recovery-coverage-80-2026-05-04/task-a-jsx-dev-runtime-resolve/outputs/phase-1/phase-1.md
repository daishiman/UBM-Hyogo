# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流ブロッカー | なし（wave-1 起点） |

## 目的

apps/web の vitest 36 件 test file が `Failed to resolve import "react/jsx-dev-runtime"` で停止している事象の根本原因（root devDependencies に `react` 不在）を要件として固定し、修復の Acceptance Criteria を Phase 2 設計の入力として確定する。

## 実行タスク

- タスク 1: 失敗事象の baseline 取得（CI run log 引用 + ローカル再現コマンドの記録）
- タスク 2: 根本原因（root devDep 不在 + pnpm hoist 差異 + vitest --root=../.. の resolve path）の整理
- タスク 3: AC-A1〜AC-A6 の番号付き定義
- タスク 4: scope inventory（変更対象ファイルの確定）
- タスク 5: 案 2（vitest deps optimizer 経路）を Phase 2 で評価する旨と、本タスクが NON_VISUAL であることの artifacts.json への反映確認

## 参照資料

| 参照資料 | パス |
| --- | --- |
| 親 wave Phase 1 | `../../../outputs/phase-1/phase-1-requirements.md` |
| 親 wave Phase 2 | `../../../outputs/phase-2/phase-2-design.md` |
| root package.json | `package.json` |
| apps/web package.json | `apps/web/package.json` |
| root vitest config | `vitest.config.ts` |
| CI workflow | `.github/workflows/ci.yml` |

## 実行手順

### ステップ 1: baseline 取得

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee outputs/phase-1/web-test-baseline.log
grep -c 'Failed to resolve import "react/jsx-dev-runtime"' outputs/phase-1/web-test-baseline.log
```

### ステップ 2: dependency 状況の grep 証跡取得

```bash
node -e "console.log(JSON.stringify({rootDev: require('./package.json').devDependencies, webDeps: require('./apps/web/package.json').dependencies, webDev: require('./apps/web/package.json').devDependencies}, null, 2))" \
  | tee outputs/phase-1/dep-snapshot.json
```

### ステップ 3: AC を Phase 1 成果物に列挙

## Acceptance Criteria

| ID | 内容 | 検証方法 |
| --- | --- | --- |
| AC-A1 | `pnpm --filter @ubm-hyogo/web test` 実行で `Failed to resolve import "react/jsx-dev-runtime"` が 0 件 | log grep |
| AC-A2 | apps/web の vitest が test file を 1 件以上 collect できる（環境エラーで全件 unresolved にならない） | vitest reporter 出力 |
| AC-A3 | root `package.json#devDependencies` に `react` `react-dom` `@types/react` `@types/react-dom` が存在し apps/web と version 完全一致 | `node -e` での比較 |
| AC-A4 | `pnpm install --frozen-lockfile` exit 0 | shell exit code |
| AC-A5 | `pnpm --filter @ubm-hyogo/web build` exit 0（regression なし） | shell exit code |
| AC-A6 | `bash scripts/coverage-guard.sh --package apps/web` が coverage 集計まで到達する（threshold 判定の合否は Task C スコープ） | shell 出力 |

## scope inventory

| ファイル | 変更内容 |
| --- | --- |
| `package.json` | devDependencies へ react / react-dom / 型 4 dep 追加 |
| `pnpm-lock.yaml` | `pnpm install` で再生成 |
| `vitest.config.ts` | Fallback 採用時のみ `test.server.deps.inline` / `test.deps.optimizer.web.include` 追記 |

## 統合テスト連携

本 Task は環境修復が主体のため、新規統合テストは作らない。後続 Task C の coverage 計測が成立すること（Phase 6 で確認）が統合テスト連携の代替成果物となる。

## 多角的チェック観点（AI が判断）

- システム系: CI Linux と macOS の pnpm hoist 差。CI で必ず再現確認。
- 戦略系: case 1（root devDep 追加）が最小スコープであることの再確認。
- 問題解決系: vitest `--root=../..` 経路を維持したまま解決できる選択肢か。

## サブタスク管理

| サブタスク | owner | 完了条件 |
| --- | --- | --- |
| baseline log 取得 | Task A | `outputs/phase-1/web-test-baseline.log` に grep 結果 |
| AC 列挙 | Task A | 本ファイルの AC 表 |
| dep snapshot 取得 | Task A | `outputs/phase-1/dep-snapshot.json` |

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル）
- `outputs/phase-1/web-test-baseline.log`
- `outputs/phase-1/dep-snapshot.json`

## 完了条件

- [ ] AC-A1〜AC-A6 を本書に列挙
- [ ] scope inventory 完了
- [ ] baseline log と dep snapshot を実体取得
- [ ] artifacts.json.metadata.visualEvidence = NON_VISUAL 確定
- [ ] coverage Statements/Branches/Functions/Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）を最終 wave 完了時に達成する旨を AC として明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 を最終 wave 完了時の検証経路として明記

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（タスク 1-5）完了
- [ ] 全成果物実体確認
- [ ] 後続 Phase の input が揃った

## 次 Phase

Phase 2（設計）— 案 1 採用の最終確認、Fallback 案（vitest deps optimizer / inline）の評価結果記録、validation matrix。
