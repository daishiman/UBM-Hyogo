# Phase 9: テスト計画 / rename script 単体 / glob coverage grep / smoke

## 目的

本タスクは「rename + config 同期」のみで新規ロジックを含まないため、**新規 test を追加しない**。代わりに rename と config 同期の妥当性を保証する **検証 step 群を CI 必須化**し、Phase 11 evidence へ機械的に書き出す形を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 1. 方針: 新規テストは追加しない

| 観点 | 判断 |
| --- | --- |
| rename 自体の正しさ | 既存 132 件の test が rename 後も green であることで保証 |
| config 同期の正しさ | 件数 assert (`Test Files X` / `Tests Y`) で保証 |
| 内容差分ゼロ | `git diff --diff-filter=R --numstat HEAD` の全行 `0\t0` で保証 |
| ADR 内容 | レビューで保証（自動 test 不要） |

新規 unit test / fixture / smoke test を追加しない。**追加するとそれ自体が rename PR の diff を増やし、AC-2「git mv のみ・diff 0」を侵食する**。

## 2. CI 必須 検証 step（rename 後に実行する 8 step）

| # | step | コマンド | 合格条件 |
| --- | --- | --- | --- |
| V-1 | apps/api test green + 件数同一 | `mise exec -- pnpm --filter @ubm-hyogo/api test --reporter=verbose` | exit 0 / `Tests Y` 値が rename 前と一致 |
| V-2 | 残存 `*.test.ts` ゼロ | `find apps/api/src -name '*.test.ts' \| wc -l` | `0` |
| V-3 | rename 後 spec 件数 = 132 | `find apps/api/src -name '*.spec.ts' \| wc -l` | `132` |
| V-4 | config glob 残存 grep | `rg -n "\\.test\\.ts" vitest.config.ts apps/api/package.json package.json lefthook.yml .github/workflows/` | apps/api 関連ヒットゼロ（コメント / 他 workspace 行のみ可） |
| V-5 | 内容 diff ゼロ | `git diff --diff-filter=R --numstat main` | 全行 `0\t0\t...` |
| V-6 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| V-7 | lint | `mise exec -- pnpm lint` | exit 0 |
| V-8 | secret leakage grep | `rg -n "(apikey\|secret\|token\|password)\\s*=" apps/api/src --glob '*.spec.ts'` | 既知 dummy 値以外ゼロ |

V-1〜V-8 を Phase 11 で順に実行し、出力をすべて `outputs/phase-11/` に保存する。

## 3. smoke vitest（任意）

reporter が rename 後も動作することを軽量確認するため、1 ファイル単独で実行:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run \
  apps/api/src/__tests__/invariants.spec.ts
```

合格条件: exit 0 / reporter が `Test Files 1 passed` を出力。

> このコマンドは V-1 と冗長だが、glob 漏れ（include が apps/api を拾わない場合）を **個別ファイル指定** で回避でき、原因切り分けに役立つ。

## 4. 件数 snapshot 比較スクリプト（擬似コード）

```bash
# rename 前
mise exec -- pnpm --filter @ubm-hyogo/api test --reporter=verbose 2>&1 \
  | tee outputs/phase-11/test-count-before.txt
BEFORE=$(grep -E "^Test Files" outputs/phase-11/test-count-before.txt | head -1)
TESTS_BEFORE=$(grep -E "^ *Tests" outputs/phase-11/test-count-before.txt | head -1)

# rename 後
mise exec -- pnpm --filter @ubm-hyogo/api test --reporter=verbose 2>&1 \
  | tee outputs/phase-11/test-count-after.txt
AFTER=$(grep -E "^Test Files" outputs/phase-11/test-count-after.txt | head -1)
TESTS_AFTER=$(grep -E "^ *Tests" outputs/phase-11/test-count-after.txt | head -1)

# 比較
[ "$BEFORE" = "$AFTER" ] || { echo "FAIL: Test Files mismatch"; exit 1; }
[ "$TESTS_BEFORE" = "$TESTS_AFTER" ] || { echo "FAIL: Tests mismatch"; exit 1; }
```

## 5. focused test の追加なし

本タスクはリファクタのため、focused (`it.only` / `describe.only`) の追加・削除を行わない。既存 focused があれば rename で basename だけ変わる（中身不変）。

## 6. AC との対応

| AC | 対応 step |
| --- | --- |
| AC-1（132 件 rename） | V-2 + V-3 + Phase 11 fixed list 一致 grep |
| AC-2（git mv のみ・diff 0） | V-5 |
| AC-3（test green / 件数同一） | V-1 + §4 比較スクリプト |
| AC-4（合計 132） | V-2 + V-3（合算） |
| AC-5（残存ゼロ） | V-2 |
| AC-6（4 分類件数一致） | Phase 11 で `find ... -name '*.<class>.spec.ts' \| wc -l` を 4 種実行 |
| AC-7（glob 網羅） | V-4 |
| AC-8（typecheck） | V-6 |
| AC-9（lint） | V-7 |
| AC-10（ADR 存在） | Phase 11 で `test -f outputs/phase-12/test-file-suffix-adr.md` |
| AC-11（Phase 12 strict 7 files + ADR） | Phase 11 で `ls outputs/phase-12/` 件数確認 |
| AC-12（PR 本文 `Refs #325`） | Phase 13 PR 本文レビュー |

## 7. evidence の保存先と命名規約

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/test-count-before.txt` | rename 前 vitest reporter 出力 |
| `outputs/phase-11/test-count-after.txt` | rename 後 vitest reporter 出力 |
| `outputs/phase-11/test-count-delta.txt` | before / after の `Test Files` / `Tests` 行 diff（empty が合格） |
| `outputs/phase-11/find-test-before.txt` | rename 前 `*.test.ts` 一覧（132 行） |
| `outputs/phase-11/find-spec-after.txt` | rename 後 `*.spec.ts` 一覧（132 行） |
| `outputs/phase-11/find-count-before.txt` / `-after.txt` | 合計件数 snapshot |
| `outputs/phase-11/rename-mapping.csv` | Phase 5 schema 準拠の 132 行 + ヘッダ |
| `outputs/phase-11/glob-coverage-grep.log` | V-4 出力 |
| `outputs/phase-11/workflow-grep.log` | `.github/workflows/` 内の `.test.ts` grep |
| `outputs/phase-11/lefthook-grep.log` | lefthook + coverage-guard grep |
| `outputs/phase-11/coverage-before.txt` / `coverage-after.txt` | coverage summary（オプション） |
| `outputs/phase-11/secret-grep-after-rename.log` | V-8 出力 |
| `outputs/phase-11/rename-diff-stat.txt` | V-5 出力 |
| `outputs/phase-11/main.md` | NON_VISUAL evidence サマリ（V-1〜V-8 と AC マッピング） |

命名規約:

- 拡張子: `.txt`（人間可読 reporter ログ）/ `.log`（grep 出力）/ `.csv`（mapping）/ `.diff`（diff 出力）/ `.md`（サマリ）
- 接頭辞 `before-` / `after-` を **付けない**。代わりに **接尾辞** `-before` / `-after` を採用（既存 phase-11 evidence 慣習に合わせる）

## 完了条件チェック

- [ ] 新規 test を追加しない方針を §1 で確定
- [ ] V-1〜V-8 の検証 step を §2 で確定
- [ ] smoke vitest 経路を §3 で確定
- [ ] 件数 snapshot 比較スクリプトを §4 で擬似コード化
- [ ] focused test 不変条件を §5 で明記
- [ ] AC との対応表を §6 で確定
- [ ] evidence 保存先・命名規約を §7 で確定

## 出力

- `phase-09.md`

## 参照資料

- `index.md`
- `phase-04.md`（I/O 契約）
- `phase-06.md`（rename 実行手順）
- `phase-07.md`（整合性検証）
- `phase-08.md`（エラーハンドリング）

## 統合テスト連携

- Phase 11 で V-1〜V-8 を順に実行
- Phase 13 PR 本文に V-1〜V-8 の合格 evidence を引用

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 の成果物を上流契約として参照する。
