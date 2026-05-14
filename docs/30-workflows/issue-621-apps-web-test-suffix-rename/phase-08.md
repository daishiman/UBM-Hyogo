# Phase 8: エラーハンドリング / 命名衝突 / glob 漏れ / git mv 競合 / `.tsx` 拾い漏れ

## 目的

70 件の `git mv` rename + 1 点 config 同期で発生し得る失敗パターンを列挙し、それぞれを **致命 / 非致命** に分類する。すべて `--no-verify` で逃げず、根本原因を fix した上で再実行する方針を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. 想定エラー一覧

| # | エラー | 兆候 | 重大度 | 対処 |
| --- | --- | --- | --- | --- |
| E-1 | 命名衝突 | `git mv` で `destination already exists` | 致命 | Phase 2 fixed list を再点検。重複した new path がある場合は分類ロジックを再適用。`apps/web/src` 配下に既存 `*.spec.ts(x)` が存在する場合は本 PR 着手前に別 PR で削除 |
| E-2 | glob 漏れ（rename 後 test 件数減） | `Test Files X` が rename 前より小さい | 致命 | root `vitest.config.ts` の include を Phase 7 §2.1 で再点検。両許容 glob `*.{test,spec}.{ts,tsx}` のままであることを確認 |
| E-3 | test 件数差異 | `Tests Y` 行が rename 前後で不一致 | 致命 | reporter ログを diff し、原因が glob か import path か切り分け。rename は同 dirname のため import path 影響なしが正常 |
| E-4 | `git mv` 競合（並行 PR） | branch sync 中に他 PR が同 path を rename | 致命 | rebase で衝突解消し、CSV 再生成 → 再実行。並行 rename PR は本タスク先行を原則とする |
| E-5 | hook block | lefthook が大量 rename を reject | 致命 | hook 設計の不具合として `scripts/hooks/staged-task-dir-guard.sh` 側を修正。`--no-verify` で逃げない |
| E-6 | CI で test job が静かに skip | rename 後 CI 緑だが job log で `Test Files 0` | 致命 | CI workflow の glob を最優先で修正。`.github/workflows/ci.yml` の test step を Phase 7 §5 で grep 確認 |
| E-7 | coverage delta != 0 | reporter で line/branch/func/stmt 値が変動 | 致命 | rename だけで coverage が変わるはずがない。include/exclude の追従漏れか、`coverage.include` の glob が `*.test.ts` を src として誤拾いしている可能性を疑う |
| E-8 | typecheck 失敗 | `pnpm typecheck` が rename 後に fail | 致命 | tsconfig include / `vitest/globals` types 参照を確認。rename は同 dirname のため import path 失敗は通常起きない。`apps/web/tsconfig.json` の `include` に `*.test.ts` リテラルがあれば `*.{test,spec}.{ts,tsx}` に追従 |
| E-9 | lint 失敗 | `pnpm lint` が rename 後に fail | 致命 | `.eslintrc` / `.eslintrc.cjs` / `eslint.config.*` の `overrides[].files` glob に `*.test.ts(x)` リテラルがあれば追従 |
| E-10 | rename mapping CSV と physical 状態の乖離 | CSV old_path のファイルが既に存在しない | 致命 | rebase 後に CSV を再生成（Phase 2 §「Fixed list 生成コマンド」を再実行）|
| E-11 | スクリプト改行コード混入で `git mv` が無効 path | `git mv: bad source` | 致命 | CSV を LF 統一で再保存。`tr -d '\r'` を while ループに挿入（Phase 6 §2.2 既に対策済み）|
| E-12 | `coverage-guard` が rename PR で fail | pre-push hook が coverage 低下と誤検出 | 非致命 | rename commit はrename commit pure → coverage 不変。`scripts/coverage-guard.sh --changed` の判定が新 suffix を無視している場合は同期、それでも誤検出するなら CLAUDE.md の sync-merge ポリシーに準じて hook 側を改善 |
| E-13 | `staged-task-dir-guard` が 70 ファイルを「無関係 task」と誤検出 | pre-commit がブロック | 非致命 | 本 PR の `docs/30-workflows/issue-621-apps-web-test-suffix-rename/` と無関係に見えるため。`scripts/hooks/staged-task-dir-guard.sh` の許可 path に `apps/web/src/**` を rename-only モードで明示するか、guard の rename detection を改善 |
| E-14 | secret leakage grep ヒット | rename 後 grep で dummy ではない値検出 | 致命 | rename で値は変わらないので、既存資産の問題。Issue 化して別 PR で対応。本 PR は rename のみで進める |
| E-15 | rename 後 `find` 件数が 70 と乖離 | §Phase 4 §2.3 件数 assert で fail | 致命 | CSV と physical state の乖離。E-10 と同じ |
| E-16 | `.test.tsx` の拾い漏れ | rename 後に `.test.tsx` 残存 | 致命 | `find` コマンドの `-name '*.test.tsx'` 追加忘れ。Phase 6 §2.1 / 2.5 のコマンドを再確認 |
| E-17 | `.tsx` を `.spec.ts` に変えてしまう | `.test.tsx` → `.component.spec.ts`（拡張子破損） | 致命 | CSV 生成ロジックで oldPath が `.tsx` の場合 newPath も `.tsx` を保持する条件を Phase 5 §2 で再確認 |
| E-18 | `verify-design-tokens` script が古い参照のまま | commit 2 で同期忘れ | 致命 | commit 2 内で `apps/web/package.json:19` を必ず更新。`mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` で exit code 確認 |
| E-19 | jsdom 環境注釈の破損 | React component test が node 環境で実行されて DOM API undefined | 致命 | `git mv` はファイル本文を変更しないため通常起きない。Phase 11 で rename 後ファイル先頭 5 行 grep `// @vitest-environment` を確認 |

## 2. fallback / リカバリ手順

### 2.1 rename 完全 rollback

3 commit 戦略のため、各 commit を個別 revert 可能:

```bash
git revert --no-edit <commit-3-sha>   # ADR
git revert --no-edit <commit-2-sha>   # config 同期
git revert --no-edit <commit-1-sha>   # rename
# ADR commit はそのまま残してもよい（ドキュメントのため）
```

### 2.2 部分復旧（CSV と physical 乖離時）

```bash
# 現状の physical 70 ファイルを再列挙
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort \
  > /tmp/current-test-files.txt

# 既に rename 済みの spec 件数を確認
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | wc -l

# CSV を再生成し、未処理の old_path のみ git mv
# (Phase 2 §「Fixed list 生成コマンド」を再実行 → diff で残差を抽出)
```

### 2.3 hook 誤検出時の運用

| Hook | 誤検出パターン | 対処 |
| --- | --- | --- |
| `staged-task-dir-guard` | `apps/web/src/**` を「task dir 外」と誤判定 | hook script を改善（rename detection 追加） |
| `coverage-guard` | rename を coverage 低下と誤判定 | sync-merge ポリシー準拠の merge commit ガード強化 or `--changed` モード判定改善 |

`--no-verify` を使うのは**最終手段ではなく禁止**。hook 自体の改善が原則。

## 3. エラー時の意思決定フロー

```
[エラー検出]
   │
   ▼
1. 致命/非致命を §1 表で判定
   │
   ├─ 致命 → 2 へ
   └─ 非致命 → hook 改善 PR を別途切り出し、本 PR は継続
   │
   ▼
2. rename commit (commit 1) を含むか?
   ├─ Yes → §2.1 完全 rollback or §2.2 部分復旧
   └─ No  → config / ADR commit のみ revert
   │
   ▼
3. 根本原因 fix → CSV 再生成 → §Phase 6 §2.1 から再開
```

## 4. エラーハンドリングチェックリスト

- [ ] E-1〜E-19 のうち発生したエラーが §1 表に記録されている
- [ ] 致命エラーは hook bypass なしで根本原因を fix している
- [ ] 非致命エラーは別 PR で hook 改善するか、許容判断を Phase 11 main.md に記録している
- [ ] CSV と物理状態の乖離（E-10 / E-15）が発生した場合、再生成 → 部分復旧の手順を実行している
- [ ] `.tsx` 拾い漏れ（E-16） / 拡張子破損（E-17）が発生していない
- [ ] verify-design-tokens（E-18）が exit 0 で完了している
- [ ] jsdom 環境注釈（E-19）が rename 後も保持されている

## 完了条件チェック

- [ ] エラー一覧 E-1〜E-19 が網羅されている（apps/web 固有の `.tsx` / verify-design-tokens / jsdom を含む）
- [ ] 致命/非致命の分類と対処方針が記述されている
- [ ] §2.1 完全 rollback と §2.2 部分復旧の手順が確定している
- [ ] hook 誤検出時の運用方針が `--no-verify` 禁止で確定している
- [ ] エラー時の意思決定フローが図示されている
