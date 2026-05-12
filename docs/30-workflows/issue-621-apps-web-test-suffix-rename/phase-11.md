# Phase 11 — 実行 evidence の収集仕様

NON_VISUAL タスク。screenshot は不要。実 evidence は **実装段階で `outputs/phase-11/` 配下に記録** する。本ファイルは「どの evidence をどのコマンドで取り、PASS をどう判定するか」の正本。

## 1. evidence ファイル一覧

| ファイル | 内容 | 取得タイミング |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 全体 PASS/FAIL サマリ | 全 evidence 揃った後 |
| `outputs/phase-11/test-count-before.txt` | rename 前の vitest reporter `Test Files` / `Tests` 行 | rename 着手前 |
| `outputs/phase-11/test-count-after.txt` | rename 後の vitest reporter `Test Files` / `Tests` 行 | Commit 1 直後 |
| `outputs/phase-11/test-after-full.log` | rename 後 vitest 全出力 | Commit 3 後 |
| `outputs/phase-11/find-test-before.txt` | rename 前の `find ... \( -name '*.test.ts' -o -name '*.test.tsx' \)` 列挙 | rename 着手前 |
| `outputs/phase-11/find-test-after.txt` | rename 後の同コマンド出力（0 行） | Commit 1 直後 |
| `outputs/phase-11/find-spec-before.txt` | rename 前の `find ... \( -name '*.spec.ts' -o -name '*.spec.tsx' \)` 列挙（17 行） | rename 着手前 |
| `outputs/phase-11/find-spec-after.txt` | rename 後の同コマンド出力（87 行） | Commit 1 直後 |
| `outputs/phase-11/find-count-before.txt` | `test=70 spec=17` | rename 着手前 |
| `outputs/phase-11/find-count-after.txt` | `test=0 spec=87` | Commit 1 直後 |
| `outputs/phase-11/rename-mapping.csv` | 70 行 + ヘッダ（`old_path,new_path,suffix_class,justification`） | Phase 2 fixed list 凍結時 |
| `outputs/phase-11/git-rename-summary.log` | `git diff --name-status --find-renames --diff-filter=R` 出力（70 行） | Commit 1 直後 |
| `outputs/phase-11/glob-coverage-grep.log` | `apps/web` 関連 `.test.` 残存 grep 結果 | Commit 2 直後 |
| `outputs/phase-11/glob-coverage-config-grep.log` | config ファイル群の test/spec 出現 | Commit 2 直後 |
| `outputs/phase-11/typecheck.log` | `pnpm typecheck` 出力 | Commit 3 後 |
| `outputs/phase-11/lint.log` | `pnpm lint` 出力 | Commit 3 後 |
| `outputs/phase-11/verify-design-tokens.log` | `pnpm --filter @ubm-hyogo/web run verify-design-tokens` 出力 | Commit 2 直後 |
| `outputs/phase-11/jsdom-annotation-grep.log` | rename 後 spec ファイルの Vitest environment 注釈確認 | Review cycle |

## 2. 取得コマンド（逐語コピペ可能）

実装担当者は本セクションのコマンドをそのまま順番に実行し、出力を該当ファイルへリダイレクトする。すべて **作業 worktree のルート** から実行する前提。

### 2.1 rename 前 snapshot

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260510-195203-wt-8
EV="docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11"
mkdir -p "$EV"

# rename 前 full log は本レビュー時点で再生成不可。
# 実装時に取得済みの test-count-before.txt / test-count-before.normalized.txt を before 正本にする。
test -s "$EV/test-count-before.txt"

# find（rename 前）
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort \
  > "$EV/find-test-before.txt"
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | sort \
  > "$EV/find-spec-before.txt"
echo "test=$(wc -l < "$EV/find-test-before.txt") spec=$(wc -l < "$EV/find-spec-before.txt")" \
  > "$EV/find-count-before.txt"
```

### 2.2 rename mapping CSV（Phase 2 fixed list）

```bash
# Phase 2 §「Fixed list 生成コマンド」を実行して CSV を生成
# (詳細は phase-02.md §「Fixed list 生成コマンド（実装時に実行）」を参照)

# 行数 assert
wc -l "$EV/rename-mapping.csv"
# 期待: 71（ヘッダ 1 + データ 70）

# 件数集計
awk -F, 'NR>1 {c[$3]++} END {for (k in c) print k": "c[k]}' "$EV/rename-mapping.csv"
# 期待: component: 36 / route: 4 / page: 1 / runtime: 5 / lib-unit: 24
```

### 2.3 rename 実行と直後 evidence（Commit 1）

```bash
# git mv ループ（Phase 6 §2.2）
while IFS=, read -r old new cls just; do
  [[ "$old" == "old_path" ]] && continue
  [[ -z "$old" ]] && continue
  old="${old%$'\r'}"; new="${new%$'\r'}"
  git mv "$old" "$new"
done < "$EV/rename-mapping.csv"

# 件数 assert
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort > "$EV/find-test-after.txt"
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | sort > "$EV/find-spec-after.txt"
echo "test=$(wc -l < "$EV/find-test-after.txt") spec=$(wc -l < "$EV/find-spec-after.txt")" \
  > "$EV/find-count-after.txt"

# Commit 1
git commit -m "refactor(web): rename *.test.ts(x) to suffix-classified *.spec.ts(x) (Refs #621)"

# pure rename assert
git log -1 --diff-filter=R --summary HEAD > "$EV/git-rename-summary.log"
test "$(wc -l < "$EV/git-rename-summary.log")" = "70"

# jsdom 注釈保持確認
{
  for f in $(find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print); do
    if head -5 "$f" | grep -q "@vitest-environment"; then
      echo "OK: $f has vitest environment annotation"
    fi
  done
} > "$EV/jsdom-annotation-grep.log"
```

### 2.4 config 同期（Commit 2）

```bash
# apps/web/package.json:19 を tokens.runtime.spec.ts に更新
sed -i.bak 's|apps/web/src/__tests__/tokens\.test\.ts|apps/web/src/__tests__/tokens.runtime.spec.ts|' \
  apps/web/package.json
rm -f apps/web/package.json.bak

# .github/workflows/ci.yml:159 周辺の追従（該当時）
if rg -q "build-output\.test\.ts" .github/workflows/ci.yml; then
  sed -i.bak 's|build-output\.test\.ts|build-output.runtime.spec.ts|g' .github/workflows/ci.yml
  rm -f .github/workflows/ci.yml.bak
fi

# verify-design-tokens 動作確認
mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens 2>&1 \
  | tee "$EV/verify-design-tokens.log"

# Commit 2
git add apps/web/package.json .github/workflows/ci.yml 2>/dev/null || true
git commit -m "chore(web): sync test glob to *.spec.ts(x) (Refs #621)"

# glob coverage grep
rg -n "apps/web.*\.test\." \
  --glob '!**/node_modules/**' --glob '!docs/**' \
  > "$EV/glob-coverage-grep.log" || true
rg -n "(test|spec)\.ts" \
  apps/web/package.json vitest.config.ts lefthook.yml .github/workflows/ \
  > "$EV/glob-coverage-config-grep.log" || true
```

### 2.5 ADR + Phase 12 evidence（Commit 3）

```bash
# Phase 12 strict 7 files + ADR を outputs/phase-12/ に配置（内容は Phase 12 仕様参照）
git add docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/
git add "$EV/"
git commit -m "docs(web): add apps/web test file suffix ADR (Refs #621)"
```

### 2.6 rename 後 typecheck / lint / test

```bash
mise exec -- pnpm typecheck 2>&1 | tee "$EV/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$EV/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose 2>&1 \
  | tee "$EV/test-after-full.log"
grep -E '^\s*(Test Files|Tests)\s' "$EV/test-after-full.log" \
  > "$EV/test-count-after.txt"

# 件数完全一致 assert
diff "$EV/test-count-before.txt" "$EV/test-count-after.txt"
```

## 3. PASS / FAIL 判定マトリクス

| # | 判定項目 | コマンド | PASS 条件 |
| --- | --- | --- | --- |
| P-1 | rename 前 test green | exit code | 0 |
| P-2 | rename 後 test green | exit code | 0 |
| P-3 | test 件数完全一致 | `diff test-count-{before,after}.txt` | exit 0 |
| P-4 | `*.test.ts(x)` 残存ゼロ | `wc -l find-test-after.txt` | 0 |
| P-5 | `*.spec.ts(x)` 件数 87 | `wc -l find-spec-after.txt` | 87 |
| P-6 | pure rename（70 行 R100） | `wc -l git-rename-summary.log` | 70 |
| P-7 | rename diff 0 | `git diff --stat <c1>~..<c1>` | `+0 / -0` |
| P-8 | typecheck exit 0 | `tail -1 typecheck.log` の exit | 0 |
| P-9 | lint exit 0 | `tail -1 lint.log` の exit | 0 |
| P-10 | verify-design-tokens exit 0 | `tail -1 verify-design-tokens.log` の exit | 0 |
| P-11 | apps/web `.test.` 残存ゼロ | `wc -l glob-coverage-grep.log` | 0 |
| P-12 | Vitest environment 注釈保持 | `jsdom-annotation-grep.log` | 注釈付き spec 7 件を列挙 |
| P-13 | secret leakage ゼロ | `rg ... apps/web/src --glob '*.spec.*'` | 既知 dummy 値以外ゼロ |

## 4. main.md の構成

`outputs/phase-11/main.md` には以下の節を含める:

```markdown
# Phase 11 evidence — issue-621 apps/web test suffix rename

## サマリ
- AC-1〜AC-13 全件 PASS / FAIL
- P-1〜P-13 判定結果表

## rename 件数
- before: 70 / after: 0 (.test.ts(x))
- before: 17 / after: 87 (.spec.ts(x))

## test 件数完全一致
- Test Files: X passed (X)
- Tests: Y passed (Y)
- diff: 空（exit 0）

## 各種 log ファイルへのリンク
- typecheck.log / lint.log / test-after-full.log / verify-design-tokens.log

## 失敗時の対処履歴（あれば）
- E-XX: 内容と対処
```

## 完了条件チェック

- [ ] evidence ファイル 19 種が一覧化されている
- [ ] 取得コマンドが §2.1〜2.6 でコピペ可能な粒度で記述されている
- [ ] PASS / FAIL 判定マトリクス P-1〜P-13 が apps/web 固有項目（verify-design-tokens / jsdom 注釈）を含めて定義されている
- [ ] main.md の構成が記述されている
