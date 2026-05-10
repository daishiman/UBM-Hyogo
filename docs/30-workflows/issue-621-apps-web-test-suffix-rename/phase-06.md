# Phase 6: 関数シグネチャ・rename 実行スクリプト擬似コード

## 目的

70 ファイル rename と 1 点の config 同期（`apps/web/package.json:19`）を、**新規スクリプト追加なし**で `git mv` + 既存ツールだけで完遂するための手順擬似コードを確定する。Phase 5 の RenameMappingCSV と AST 差分をそのまま流すことで、レビュー時に「内容に手を入れていない」ことが diff で自明になることを優先する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. 補助スクリプトを新規作成しない方針

本タスクでは **`scripts/` 配下に新規ファイルを追加しない**。理由:

1. rename は `git mv` 70 回（Phase 5 の CSV を機械的に実行するだけ）。スクリプト化しても 1 行 while ループで済むため、専用ツールを残す価値が薄い
2. スクリプトを残すと「内容も触ったのではないか」というレビュー疑義を呼びやすく、本タスクの本質である「diff 0 を視覚的に保証」を弱める
3. 1 PR 完結タスクなので、CSV (`outputs/phase-11/rename-mapping.csv`) を evidence として保存し、再現は Phase 11 のコマンドログで足りる

正規経路は **bash one-liner + 既存 `git` / `find` / `rg` / `mise` / `pnpm` のみ**で構成する。

## 2. rename 実行 擬似コード（bash）

すべて作業 worktree のルート（`.worktrees/task-20260510-195203-wt-8/`）から実行する前提。`mise exec --` プレフィックス必須（Node 24 / pnpm 10 を保証）。

### 2.1 事前 evidence 取得（rename 前）

```bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

EV_DIR="docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11"
mkdir -p "$EV_DIR"

# A. test 件数 snapshot (vitest reporter)
test -s "$EV_DIR/test-count-before.txt"

# B. find ベースの physical 件数
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort \
  > "$EV_DIR/find-test-before.txt"
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | sort \
  > "$EV_DIR/find-spec-before.txt"
echo "test=$(wc -l < "$EV_DIR/find-test-before.txt") spec=$(wc -l < "$EV_DIR/find-spec-before.txt")" \
  > "$EV_DIR/find-count-before.txt"
# 期待: test=70 spec=17
```

### 2.2 rename mapping CSV を流す（commit 1）

```bash
# Phase 2 で凍結した CSV を読み込んで git mv を実行
# CSV はヘッダ "old_path,new_path,suffix_class,justification" + 70 行
while IFS=, read -r old new cls just; do
  [[ "$old" == "old_path" ]] && continue   # ヘッダ skip
  [[ -z "$old" ]] && continue               # 空行 skip
  # CR 除去（万が一の改行コード混入対策）
  old="${old%$'\r'}"
  new="${new%$'\r'}"
  git mv "$old" "$new"
done < "$EV_DIR/rename-mapping.csv"

# rename 直後の件数 assert
test "$(find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | wc -l)" = "0" \
  || { echo "FAIL: .test.ts(x) 残存あり"; exit 1; }
test "$(find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | wc -l)" = "87" \
  || { echo "FAIL: .spec.ts(x) 件数 != 87"; exit 1; }

# commit 1: rename のみ
git commit -m "refactor(web): rename *.test.ts(x) to suffix-classified *.spec.ts(x) (Refs #621)"

# rename 完全性 assert（pure rename / R100 のみ）
git log -1 --diff-filter=R --summary HEAD > "$EV_DIR/git-rename-summary.log"
test "$(wc -l < "$EV_DIR/git-rename-summary.log")" = "70" \
  || { echo "FAIL: rename summary 行数 != 70"; exit 1; }
# rename commit pure assert（追加・削除行 0）
git diff --stat HEAD~..HEAD | tail -1 | grep -E "70 files changed, 0 insertions\(\+\), 0 deletions\(-\)" \
  || { echo "FAIL: 内容変更検出"; exit 1; }
```

### 2.3 config 同期（commit 2）

```bash
# apps/web/package.json:19 の verify-design-tokens script を更新
# tokens.test.ts → tokens.runtime.spec.ts
sed -i.bak \
  's|apps/web/src/__tests__/tokens\.test\.ts|apps/web/src/__tests__/tokens.runtime.spec.ts|' \
  apps/web/package.json
rm -f apps/web/package.json.bak

# 変更が 1 行のみであることを assert
git diff apps/web/package.json | grep -c '^[+-][^+-]' | grep -E '^[12]$' \
  || { echo "FAIL: package.json 変更行数が想定外"; exit 1; }

# .github/workflows/ci.yml:159 周辺のコメント追従（該当時のみ）
if rg -q "build-output\.test\.ts" .github/workflows/ci.yml; then
  sed -i.bak 's|build-output\.test\.ts|build-output.runtime.spec.ts|g' .github/workflows/ci.yml
  rm -f .github/workflows/ci.yml.bak
fi

# verify-design-tokens 動作確認
mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens 2>&1 \
  | tee "$EV_DIR/verify-design-tokens.log"
# exit 0 期待

git add apps/web/package.json .github/workflows/ci.yml 2>/dev/null || true
git commit -m "chore(web): sync test glob to *.spec.ts(x) (Refs #621)"
```

### 2.4 ADR + Phase 12 evidence（commit 3）

```bash
# Phase 12 strict 7 files + apps/web 用 ADR を outputs/phase-12/ に作成
# 内容は Phase 12 仕様書を参照
git add docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/
git add docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/
git commit -m "docs(web): add apps/web test file suffix ADR (Refs #621)"
```

### 2.5 事後 evidence 取得（rename 後）

```bash
# A. test 件数 snapshot
mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose 2>&1 \
  | tee "$EV_DIR/test-after-full.log"
grep -E '^\s*(Test Files|Tests)\s' "$EV_DIR/test-after-full.log" \
  > "$EV_DIR/test-count-after.txt"

# B. find ベースの physical 件数
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort \
  > "$EV_DIR/find-test-after.txt"
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | sort \
  > "$EV_DIR/find-spec-after.txt"
echo "test=$(wc -l < "$EV_DIR/find-test-after.txt") spec=$(wc -l < "$EV_DIR/find-spec-after.txt")" \
  > "$EV_DIR/find-count-after.txt"

# C. test 件数 完全一致 assert
diff "$EV_DIR/test-count-before.txt" "$EV_DIR/test-count-after.txt" \
  || { echo "FAIL: test 件数差異"; exit 1; }

# D. typecheck / lint
mise exec -- pnpm typecheck 2>&1 | tee "$EV_DIR/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$EV_DIR/lint.log"

# E. glob coverage grep
rg -n "apps/web.*\.test\." \
  --glob '!**/node_modules/**' --glob '!docs/**' \
  > "$EV_DIR/glob-coverage-grep.log" || true
test ! -s "$EV_DIR/glob-coverage-grep.log" \
  || { echo "FAIL: apps/web .test. 残存"; exit 1; }

rg -n "(test|spec)\.ts" \
  apps/web/package.json vitest.config.ts lefthook.yml .github/workflows/ \
  > "$EV_DIR/glob-coverage-config-grep.log" || true
```

## 3. 実行擬似コードの不変条件

| # | 不変条件 | assert コマンド |
| --- | --- | --- |
| 1 | rename 件数 = 70 | `wc -l "$EV_DIR/git-rename-summary.log"` = 70 |
| 2 | rename commit pure | `git diff --stat HEAD~..HEAD` の `+`/`-` が 0 |
| 3 | `*.test.ts(x)` 残存ゼロ | `find ... \| wc -l` = 0 |
| 4 | `*.spec.ts(x)` 件数 87 | `find ... \| wc -l` = 87 |
| 5 | test 件数 rename 前後一致 | `diff test-count-before.txt test-count-after.txt` exit 0 |
| 6 | typecheck exit 0 | `mise exec -- pnpm typecheck; echo $?` = 0 |
| 7 | lint exit 0 | `mise exec -- pnpm lint; echo $?` = 0 |
| 8 | verify-design-tokens exit 0 | `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens; echo $?` = 0 |
| 9 | apps/web `.test.` 残存ゼロ | `rg -n "apps/web.*\.test\." ...` ヒット 0 |

## 4. 失敗時の停止と再開

- 各 set -e 区間で失敗した場合は、直前の commit までは保持されるため `git reset --soft HEAD` で staged 状態に戻し、原因を Phase 8 のエラーハンドリング表で特定して再開する
- CSV と物理状態の乖離（E-10）が発生した場合は §2.1 のスナップショット取得から再実行する

## 完了条件チェック

- [ ] §2.1〜2.5 の bash 擬似コードがコピペ可能な粒度で記述されている
- [ ] 新規スクリプト追加なし方針が明記されている
- [ ] 不変条件 9 項目すべてに assert コマンドが対応している
- [ ] 拡張子 `.tsx` の git mv が `.test.tsx` → `.component.spec.tsx` の対応で扱われている
- [ ] verify-design-tokens script の同期が config 同期 commit に含まれている
- [ ] 失敗時の停止と再開フローが記述されている
