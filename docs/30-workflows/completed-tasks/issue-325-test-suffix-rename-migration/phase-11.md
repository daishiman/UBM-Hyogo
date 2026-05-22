# Phase 11 — 実行 evidence の収集仕様

NON_VISUAL タスク。screenshot は不要。実 evidence は **実装段階で `outputs/phase-11/` 配下に記録** する。本ファイルは「どの evidence をどのコマンドで取り、PASS をどう判定するか」の正本。

## 1. evidence ファイル一覧

| ファイル | 内容 | 取得タイミング |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 全体 PASS/FAIL サマリ | 全 evidence 揃った後 |
| `outputs/phase-11/test-count-before.txt` | rename 前の vitest reporter `Tests` 行 | rename 着手前 |
| `outputs/phase-11/test-count-after.txt` | rename 後の vitest reporter `Tests` 行 | Commit 1 直後 |
| `outputs/phase-11/find-test-count-before.txt` | rename 前の `find ... \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l` | rename 着手前 |
| `outputs/phase-11/find-test-count-after.txt` | rename 後の同コマンド出力 | Commit 1 直後 |
| `outputs/phase-11/rename-mapping.csv` | 132 行 + ヘッダ（`old_path,new_path,classification`） | Phase 2 fixed list 凍結時 |
| `outputs/phase-11/glob-coverage-grep.log` | config 側に `*.test.ts` 参照が残っていないことの grep 結果 | Commit 2 直後 |
| `outputs/phase-11/typecheck.log` | `pnpm typecheck` 出力 | Commit 3 後 |
| `outputs/phase-11/lint.log` | `pnpm lint` 出力 | Commit 3 後 |
| `outputs/phase-11/test.log` | `pnpm --filter @ubm-hyogo/api test` 出力 | Commit 3 後 |

## 2. 取得コマンド（逐語コピペ可能）

実装担当者は本セクションのコマンドをそのまま順番に実行し、出力を該当ファイルへリダイレクトする。すべて **作業 worktree のルート** から実行する前提。

### 2.1 rename 前 snapshot

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/<your-worktree>

# vitest reporter の test 件数（rename 前）
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 \
  | tee outputs/phase-11/test-before-full.log \
  | grep -E '^\s*(Tests|Test Files)\s' \
  > docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/test-count-before.txt

# ファイル数 snapshot（rename 前）
find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l \
  > docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/find-test-count-before.txt
```

### 2.2 rename mapping CSV（Phase 2 fixed list）

```bash
# ヘッダ + 132 行
{
  echo "old_path,new_path,classification"
  # Phase 2 で凍結した fixed list を流し込む
} > docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/rename-mapping.csv

# 行数 assert
wc -l docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/rename-mapping.csv
# 期待: 133 (header + 132)
```

### 2.3 rename 後 snapshot

```bash
# Commit 1 後
find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l \
  > docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/find-test-count-after.txt
# 期待値: 132

# 残存 *.test.ts ゼロ確認
find apps/api/src -name '*.test.ts' | wc -l
# 期待値: 0

# 分類別件数
find apps/api/src -name '*.contract.spec.ts' | wc -l   # 期待: 41
find apps/api/src -name '*.authz.spec.ts' | wc -l      # 期待: 4
find apps/api/src -name '*.repository.spec.ts' | wc -l # 期待: 38
find apps/api/src -name '*.spec.ts' ! -name '*.contract.spec.ts' ! -name '*.authz.spec.ts' ! -name '*.repository.spec.ts' | wc -l   # 期待: 49
```

### 2.4 glob coverage grep（Commit 2 後）

```bash
{
  echo "=== vitest.config.ts ==="
  rg -n '\.test\.ts' vitest.config.ts apps/api/vitest.config.ts 2>&1 || true
  echo "=== package.json ==="
  rg -n '\.test\.ts' package.json apps/api/package.json 2>&1 || true
  echo "=== lefthook.yml ==="
  rg -n '\.test\.ts' lefthook.yml 2>&1 || true
  echo "=== .github/workflows ==="
  rg -n '\.test\.ts' .github/workflows/ 2>&1 || true
} > docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/glob-coverage-grep.log

# 期待: 各セクションで apps/api 関連の `*.test.ts` 参照が 0 件
# （`*.{test,spec}.ts` のような両許容パターンは許容）
```

### 2.5 typecheck / lint / test（Commit 3 後）

```bash
mise exec -- pnpm typecheck 2>&1 \
  | tee docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/typecheck.log
echo "exit=$?"

mise exec -- pnpm lint 2>&1 \
  | tee docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/lint.log
echo "exit=$?"

mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 \
  | tee docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/test.log
echo "exit=$?"

# rename 後 reporter 件数
grep -E '^\s*(Tests|Test Files)\s' docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/test.log \
  > docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/test-count-after.txt
```

## 3. PASS 判定基準

| # | 判定項目 | PASS 条件 |
| --- | --- | --- |
| P1 | 残存 `*.test.ts` ゼロ | `find apps/api/src -name '*.test.ts' \| wc -l` = 0 |
| P2 | 合計件数同一 | `find ... \( -name '*.test.ts' -o -name '*.spec.ts' \) \| wc -l` = 132（rename 前後で一致）|
| P3 | 分類別件数 | contract=41 / authz=4 / repository=38 / unit=49 |
| P4 | vitest 件数同一 | `Tests` 行の `passed` 数値が rename 前後で完全一致 |
| P5 | typecheck | exit 0 |
| P6 | lint | exit 0 |
| P7 | test exit | exit 0 |
| P8 | glob 残参照ゼロ | `glob-coverage-grep.log` で apps/api 関連の `*.test.ts` 単独参照が 0 件 |
| P9 | rename mapping 行数 | `rename-mapping.csv` が 133 行（header + 132）|
| P10 | rename diff 0 | Commit 1 の `git diff --stat` の `+`/`-` 合計が 0 |

P1〜P10 すべて PASS で本 Phase 完了。1 件でも FAIL なら原因調査して再実行（途中状態のまま `outputs/phase-11/main.md` に FAIL を記録してはいけない）。

## 4. NON_VISUAL の根拠

本タスクは **テストファイルの rename + config glob 同期 + ADR 追加** のみで、UI / 画面 / 図版を生成しない。screenshot 取得は不要。

## 5. 完了条件チェック

- [ ] §1 の 10 evidence ファイルが `outputs/phase-11/` 配下に存在
- [ ] §3 の P1〜P10 すべて PASS
- [ ] `outputs/phase-11/main.md` に PASS サマリ記録
- [ ] FAIL evidence が混在していない
