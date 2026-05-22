# Phase 8: エラーハンドリング / 命名衝突 / glob 漏れ / git mv 競合

## 目的

132 件の `git mv` rename + 4 種 config 同期で発生し得る失敗パターンを列挙し、それぞれを **致命 / 非致命** に分類する。すべて `--no-verify` で逃げず、根本原因を fix した上で再実行する方針を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 1. 想定エラー一覧

| # | エラー | 兆候 | 重大度 | 対処 |
| --- | --- | --- | --- | --- |
| E-1 | 命名衝突 | `git mv` で `destination already exists` | 致命 | Phase 2 fixed list を再点検。中間 suffix ありの既存 `*.contract.test.ts` の new path が既存 `*.contract.spec.ts` と重複していないか確認。`stripTrailing` 正規化を再適用 |
| E-2 | glob 漏れ（rename 後 test 件数減） | `Test Files X` が rename 前より小さい | 致命 | vitest include glob を §Phase 7 §2 で再点検。`apps/api/**/src/**/*.spec.{ts,tsx}` 行を追加 |
| E-3 | test 件数差異 | `Tests Y` 行が rename 前後で不一致 | 致命 | reporter ログを diff し、原因が glob か import path か切り分け。rename は同 dirname のため import path 影響なしが正常 |
| E-4 | `git mv` 競合（並行 PR） | branch sync 中に他 PR が同 path を rename | 致命 | rebase で衝突解消し、CSV 再生成 → 再実行。並行 rename PR は本タスク先行を原則とする |
| E-5 | hook block | lefthook が大量 rename を reject | 致命 | hook 設計の不具合として `scripts/hooks/staged-task-dir-guard.sh` 側を修正。`--no-verify` で逃げない |
| E-6 | CI で test job が静かに skip | rename 後 CI 緑だが job log で `Test Files 0` | 致命 | CI workflow の glob を最優先で修正。`backend-ci.yml` / `pr-build-test.yml` の test step を Phase 7 §4 で grep 確認 |
| E-7 | coverage delta != 0 | reporter で line/branch/func/stmt 値が変動 | 致命 | rename だけで coverage が変わるはずがない。include/exclude の追従漏れか、`coverage.include` の glob が `*.test.ts` を src として誤拾いしている可能性を疑う |
| E-8 | typecheck 失敗 | `pnpm typecheck` が rename 後に fail | 致命 | tsconfig include / `vitest/globals` types 参照を確認。rename は同 dirname のため import path 失敗は通常起きない。`tsconfig.json` の `include` に `*.test.ts` リテラルがあれば `*.{test,spec}.ts` に追従 |
| E-9 | lint 失敗 | `pnpm lint` が rename 後に fail | 致命 | `.eslintrc` / `.eslintrc.cjs` / `eslint.config.*` の `overrides[].files` glob に `*.test.ts` リテラルがあれば追従 |
| E-10 | rename mapping CSV と physical 状態の乖離 | CSV old_path のファイルが既に存在しない | 致命 | rebase 後に CSV を再生成。Phase 2 の正規化アルゴリズムを再適用 |
| E-11 | スクリプト改行コード混入で `git mv` が無効 path | `git mv: bad source` | 致命 | CSV を LF 統一で再保存。`tr -d '\r'` を while ループに挿入 |
| E-12 | `coverage-guard` が rename PR で fail | pre-push hook が coverage 低下と誤検出 | 非致命 | rename は内容変更ゼロ → coverage 不変。`scripts/coverage-guard.sh --changed` の判定が新 suffix を無視している場合は同期、それでも誤検出するなら CLAUDE.md の sync-merge ポリシーに準じて hook 側を改善 |
| E-13 | `staged-task-dir-guard` が 132 ファイルを「無関係 task」と誤検出 | pre-commit がブロック | 非致命 | 本 PR の `docs/30-workflows/issue-325-test-suffix-rename-migration/` と無関係に見えるため。`scripts/hooks/staged-task-dir-guard.sh` の許可 path に `apps/api/src/**` を rename-only モードで明示するか、guard の rename detection を改善 |
| E-14 | secret leakage grep ヒット | rename 後 grep で dummy ではない値検出 | 致命 | rename で値は変わらないので、既存資産の問題。Issue 化して別 PR で対応。本 PR は rename のみで進める |
| E-15 | rename 後 `find` 件数が 132 と乖離 | §2.3 件数 assert で fail | 致命 | CSV と physical state の乖離。E-10 と同じ |

## 2. fallback / リカバリ手順

### 2.1 rename 完全 rollback

3 commit 戦略のため、rename commit のみ revert 可能:

```bash
git revert --no-edit <rename-commit-sha>
git revert --no-edit <config-sync-commit-sha>
# ADR commit はそのまま残してもよい（ドキュメントのため）
```

### 2.2 部分復旧（CSV と physical 乖離時）

```bash
git checkout HEAD -- apps/api/src
# CSV を再生成（Phase 2 の正規化アルゴリズムを再実行）
# CSV regenerate → §2.2 の while ループ再実行
```

### 2.3 hook 誤検出時の改善ループ

1. hook 出力を控える
2. CLAUDE.md「sync-merge 時の hook 挙動」セクションのポリシーに沿って hook 自体を fix
3. fix を **同 PR に含める**（hook 改善も rename 移行に必要なため）
4. それでも block する場合、評価を Phase 13 PR レビューに委ね、`--no-verify` は使わない

## 3. ログ方針

- `git mv` 失敗時は STDERR をそのまま `outputs/phase-11/git-mv-error.log` に保存
- 件数 assert 失敗時は `outputs/phase-11/assert-failure.log` に件数 snapshot を保存
- secret 値・token 値は **絶対にログに出さない**（grep ヒット時はファイル名と行番号のみ記録）

## 4. 致命 / 非致命 区別

| カテゴリ | 該当 | PR 進行 |
| --- | --- | --- |
| 致命 | E-1〜E-11, E-14, E-15 | fix までマージ不可 |
| 非致命 | E-12, E-13 | hook 改善を同 PR で完了させた上でマージ |

> 非致命に分類した E-12 / E-13 も `--no-verify` 回避を理由に hook 側を必ず触る。マージ時点で hook がクリーンに通ることが DoD。

## 5. secret leakage 防止フック

本タスクは内容変更ゼロのため、新規 secret 流入経路はない。ただし「rename PR にどさくさで何か混入していないか」を確認するため、Phase 11 で以下を実行:

```bash
rg -n "(apikey|secret|token|password)\\s*=" apps/api/src --glob '*.spec.ts' \
  > outputs/phase-11/secret-grep-after-rename.log || true
git diff main...HEAD --stat -- 'apps/api/src/**/*.spec.ts' \
  > outputs/phase-11/spec-diff-stat.txt
# 期待: rename 行のみ。+/- 行数 0
```

検出時は **PR をブロック**して該当ファイルを確認、必要なら別 PR で remediation。

## 完了条件チェック

- [ ] E-1〜E-15 のエラーパターンを §1 で列挙
- [ ] 各エラーに対する対処を確定
- [ ] 致命 / 非致命 の区別を §4 で確定
- [ ] rollback / 部分復旧 / hook 改善ループを §2 で確定
- [ ] secret leakage 防止フックを §5 で確定
- [ ] `--no-verify` 不使用を全エラーで貫徹

## 出力

- `phase-08.md`

## 参照資料

- `index.md`
- `phase-06.md`（rename 実行手順）
- `phase-07.md`（整合性検証）
- CLAUDE.md「sync-merge 時の hook 挙動」セクション

## 統合テスト連携

- Phase 9 で E-2 / E-3 / E-6 / E-7 の検出条件を CI 必須 step として組み込む
- Phase 11 で §3 のログ群を evidence として保存

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 の成果物を上流契約として参照する。
